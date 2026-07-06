import { postJson } from './apiClient';

export interface AiAppointmentAction {
  type: 'SCHEDULE_APPOINTMENT';
  doctorId: number | null;
  doctorName: string | null;
  specialty: string | null;
  date: string | null;
  time: string | null;
  appointmentType: 'IN_PERSON' | 'VIDEO_CALL' | null;
  reason: string | null;
  missing: string[];
  availableSlots: string[];
}

export interface AiChatResponse {
  reply: string;
  answeredFromDocs: boolean;
  sources: string[];
  pendingAction?: AiAppointmentAction | null;
}

export interface AiAppointmentResponse {
  id: number;
  patientId: number;
  patientUserId: number;
  doctorId: number;
  doctorUserId: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  appointmentType: 'IN_PERSON' | 'VIDEO_CALL';
  status: string;
}

export async function askAi(message: string, pendingAction?: AiAppointmentAction | null) {
  return postJson<AiChatResponse>('/ai/chat/ask', { message, pendingAction });
}

export async function confirmAiAppointment(action: AiAppointmentAction) {
  return postJson<AiAppointmentResponse>('/ai/chat/confirm', { action });
}
