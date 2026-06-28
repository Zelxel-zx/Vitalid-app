import { getJson, postJson } from './apiClient';

export interface CreatePatientInput {
  dateOfBirth: string;
  bloodType: string;
  avatar: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  medicalHistory: string;
  allergies: string;
}

export interface PatientResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  dateOfBirth: string;
  bloodType: string;
  avatar: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  medicalHistory: string;
  allergies: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAllPatients(): Promise<PatientResponse[]> {
  const response = await getJson<ApiResponse<PatientResponse[]>>('/patients');
  return response.data || [];
}

export async function getPatientByUserId(userId: number): Promise<PatientResponse> {
  const patients = await getAllPatients();
  const patient = patients.find((item) => item.userId === userId);
  if (!patient) throw new Error('No se encontró el perfil del paciente');
  return patient;
}

export async function createPatient(input: CreatePatientInput): Promise<PatientResponse> {
  const response = await postJson<ApiResponse<PatientResponse>>('/patients', input);
  return response.data;
}

/** Issue #5: fetch patients that have had at least one appointment with the given doctor */
export async function getPatientsByDoctor(doctorId: number): Promise<PatientResponse[]> {
  const response = await getJson<ApiResponse<PatientResponse[]>>(`/patients/by-doctor/${doctorId}`);
  return response.data || [];
}

