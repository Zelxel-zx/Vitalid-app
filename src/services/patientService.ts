import { getJson } from './apiClient';

export interface PatientResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  dateOfBirth: string;
  bloodType: string;
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
