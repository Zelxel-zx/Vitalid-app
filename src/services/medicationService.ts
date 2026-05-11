import { getJson, postJson, putJson } from './apiClient';

export interface MedicationResponse {
  id: string | number;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
  totalPills: number;
  pillsRemaining: number;
  sideEffects: string;
}

export interface DoseRequest {
  time: string;
  timestamp: string;
}

export interface MedicationRequest {
  patientId: number;
  doctorId?: number;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: string;
  endDate: string;
  totalPills: number;
}

export async function getMedicationsForPatient(userId: number): Promise<MedicationResponse[]> {
  return getJson<MedicationResponse[]>(`/medications/patient/${userId}`);
}

export async function createMedication(userId: number, request: MedicationRequest): Promise<MedicationResponse> {
  return postJson<MedicationResponse>(`/medications/user/${userId}`, request);
}

export async function takeDose(medicationId: number | string, request: DoseRequest): Promise<void> {
  await postJson(`/medications/${medicationId}/take-dose`, request);
}

export async function addSideEffect(medicationId: number | string, effect: string): Promise<MedicationResponse> {
  return putJson<MedicationResponse>(`/medications/${medicationId}/side-effects`, { effect });
}
