import { getJson, postJson, putJson } from './apiClient';
import { getPatientByUserId } from './patientService';

export const APPOINTMENTS_UPDATED = 'vitalid:appointments-updated';

export interface AppointmentResponse {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  appointmentType: 'IN_PERSON' | 'VIDEO_CALL';
  status: string;
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
  appointmentType: 'IN_PERSON' | 'VIDEO_CALL';
}

export interface RescheduleRequest {
  date: string;
  time: string;
}

export async function createAppointment(request: AppointmentRequest): Promise<AppointmentResponse> {
  const appointment = await postJson<AppointmentResponse>('/appointments', request);
  notifyAppointmentsUpdated();
  return appointment;
}

export async function getAppointmentsForPatient(userId: number): Promise<AppointmentResponse[]> {
  const patient = await getPatientByUserId(userId);
  return getJson<AppointmentResponse[]>(`/appointments/patient/${patient.id}`);
}

export async function getAppointmentsForDoctor(doctorId: number): Promise<AppointmentResponse[]> {
  return getJson<AppointmentResponse[]>(`/appointments/doctor/${doctorId}`);
}

export async function rescheduleAppointment(id: number, request: RescheduleRequest): Promise<AppointmentResponse> {
  const appointment = await putJson<AppointmentResponse>(`/appointments/${id}/reschedule`, request);
  notifyAppointmentsUpdated();
  return appointment;
}

function notifyAppointmentsUpdated() {
  window.dispatchEvent(new Event(APPOINTMENTS_UPDATED));
}
