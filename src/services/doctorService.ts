import { getJson } from './apiClient';

export interface DoctorSummary {
  id: number;
  name: string;
  specialty: string;
  avatar: string;
  status: string;
  unreadMessages: number;
  experienceYears: number;
  verified: boolean;
}

export async function getAllDoctors(): Promise<DoctorSummary[]> {
  return getJson<DoctorSummary[]>('/doctors');
}

export async function getDoctorById(id: number): Promise<DoctorSummary> {
  return getJson<DoctorSummary>(`/doctors/${id}`);
}

export async function getDoctorsBySpecialty(specialty: string): Promise<DoctorSummary[]> {
  return getJson<DoctorSummary[]>(`/doctors/specialty/${specialty}`);
}

export async function getDoctorAvailability(id: number, date: string): Promise<{ availableSlots: string[], startTime: string, endTime: string }> {
  return getJson<{ availableSlots: string[], startTime: string, endTime: string }>(`/doctors/${id}/availability?date=${date}`);
}
