import { getJson, postJson, putJson, request } from './apiClient';

export const MEDICATION_COMPLIANCE_UPDATED =
  'vitalid:medication-compliance-updated';

export interface ScheduledDose {
  scheduledTime: string;
  taken: boolean;
  takenAt: string | null;
}

export interface ChecklistMedication {
  medicationId: number;
  name: string;
  dosage: string;
  instructions: string;
  startDate: string;
  endDate: string;
  pillsRemaining: number;
  lowStockThreshold: number;
  lowStock: boolean;
  sideEffects: string;
  doses: ScheduledDose[];
}

export interface TreatmentChecklist {
  treatmentId: number;
  treatmentTitle: string;
  date: string;
  progress: number;
  summary: {
    totalMedications: number;
    totalScheduledDoses: number;
    takenDoses: number;
    pendingDoses: number;
    missedDoses: number;
    percentage: number;
  };
  medications: ChecklistMedication[];
}

export interface DailyTreatment {
  id: number;
  status: string;
  startDate?: string;
  endDate?: string;
}

export async function getTreatmentChecklist(
  treatmentId: number,
  date: string,
): Promise<TreatmentChecklist> {
  return getJson<TreatmentChecklist>(
    `/checklist/treatment/${treatmentId}?date=${encodeURIComponent(date)}`,
  );
}

export async function getDailyTreatmentsCompliance(
  treatments: DailyTreatment[],
  date = getLocalDate(),
): Promise<number> {
  const dailyTreatments = treatments.filter((treatment) => {
    const isActive = treatment.status?.toUpperCase() === 'ACTIVE';
    const hasStarted = !treatment.startDate || treatment.startDate <= date;
    const hasNotEnded = !treatment.endDate || treatment.endDate >= date;
    return isActive && hasStarted && hasNotEnded;
  });

  if (dailyTreatments.length === 0) return 0;

  const results = await Promise.allSettled(
    dailyTreatments.map((treatment) =>
      getTreatmentChecklist(treatment.id, date),
    ),
  );
  const percentages = results
    .filter(
      (result): result is PromiseFulfilledResult<TreatmentChecklist> =>
        result.status === 'fulfilled',
    )
    .map((result) => Number(result.value.summary?.percentage) || 0);

  return percentages.length === 0
    ? 0
    : Math.round(
        percentages.reduce((total, percentage) => total + percentage, 0) /
          percentages.length,
      );
}

export async function markDoseTaken(
  medicationId: number,
  scheduledTime: string,
  scheduledDate: string,
) {
  const response = await postJson(
    `/checklist/medications/${medicationId}/mark-taken`,
    {
      scheduledTime,
      scheduledDate,
      takenAt: new Date().toISOString(),
    },
  );
  notifyMedicationComplianceUpdated();
  return response;
}

export async function revertDoseTaken(
  medicationId: number,
  scheduledTime: string,
  scheduledDate: string,
) {
  const query = new URLSearchParams({
    scheduledTime,
    scheduledDate,
  });
  const response = await request(
    `/checklist/medications/${medicationId}/mark-taken?${query}`,
    {
      method: 'DELETE',
    },
  );
  notifyMedicationComplianceUpdated();
  return response;
}

export async function addMedicationStock(
  medicationId: number,
  quantity: number,
) {
  return putJson<{
    medicationId: number;
    purchasedQuantity: number;
    pillsRemaining: number;
    lowStock: boolean;
  }>(`/checklist/medications/${medicationId}/stock`, {
    quantity,
  });
}

export async function addMedicationSideEffect(
  medicationId: number,
  effect: string,
) {
  return putJson<{
    medicationId: number;
    sideEffects: string;
  }>(`/checklist/medications/${medicationId}/side-effects`, {
    effect,
  });
}

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notifyMedicationComplianceUpdated() {
  window.dispatchEvent(new Event(MEDICATION_COMPLIANCE_UPDATED));
}
