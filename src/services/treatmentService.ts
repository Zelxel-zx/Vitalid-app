import { getJson, postJson } from './apiClient';

export interface TreatmentMedication {
  id: number;
  treatmentId: number;
  patientId: number;
  doctorId: number;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
  instructions: string;
  unitType: string;
  pillsRemaining: number;
  lowStockThreshold: number;
  sideEffects: string;
  scheduledTimes: string[];
}

export interface TreatmentResponse {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  nextAppointment: string;
  medications: TreatmentMedication[];
}

export async function getMyTreatments(): Promise<TreatmentResponse[]> {
  return getJson<TreatmentResponse[]>('/treatments');
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: string;
  endDate: string;
  instructions: string;
  unitType: string;
  scheduledTimes: string[];
}

export interface CreateTreatmentInput {
  patientId: number;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  nextAppointment?: string;
  medications: CreateMedicationInput[];
}

export async function createTreatment(
  input: CreateTreatmentInput,
): Promise<TreatmentResponse> {
  return postJson<TreatmentResponse>('/treatments', input);
}

export async function addMedicationToTreatment(
  treatmentId: number,
  input: CreateMedicationInput,
): Promise<TreatmentMedication> {
  return postJson<TreatmentMedication>(
    `/treatments/${treatmentId}/medications`,
    input,
  );
}
