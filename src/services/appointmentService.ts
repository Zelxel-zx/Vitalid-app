import { getJson, postJson, putJson } from './apiClient';

export interface AppointmentResponse {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: string;
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
}

export interface RescheduleRequest {
  date: string;
  time: string;
}

export async function createAppointment(request: AppointmentRequest): Promise<AppointmentResponse> {
  return postJson<AppointmentResponse>('/appointments', request);
}

export async function getAppointmentsForPatient(patientId: number): Promise<AppointmentResponse[]> {
  return getJson<AppointmentResponse[]>(`/appointments/patient/${patientId}`);
}

export async function getAppointmentsForDoctor(doctorId: number): Promise<AppointmentResponse[]> {
  return getJson<AppointmentResponse[]>(`/appointments/doctor/${doctorId}`);
}

export async function rescheduleAppointment(id: number, request: RescheduleRequest): Promise<AppointmentResponse> {
  return putJson<AppointmentResponse>(`/appointments/${id}/reschedule`, request);
}
