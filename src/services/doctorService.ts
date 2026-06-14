import { getJson, postJson } from './apiClient';

export interface CreateDoctorInput {
  specialty: string;
  avatar: string;
  medicalCenterAddress: string;
  experienceYears: number;
  availabilityStart: string;
  availabilityEnd: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DoctorSummary {
  id: number;
  userId: number;
  name: string;
  specialty: string;
  avatar: string;
  medicalCenterAddress: string;
  status: string;
  unreadMessages: number;
  experienceYears: number;
  verified: boolean;
}

export interface ConversationSummary {
  patientUserId: number;
  patientName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export function formatDoctorName(name: string): string {
  const normalized = name?.trim() || '';
  return /^(dr|dra)\.?\s/i.test(normalized) ? normalized : `Dr. ${normalized}`;
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

/**
 * Fetches distinct patients who have exchanged messages with a doctor.
 * Used by the doctor's inbox view.
 */
export async function getChatConversations(doctorId: number): Promise<ConversationSummary[]> {
  return getJson<ConversationSummary[]>(`/chat/doctor/${doctorId}/conversations`);
}

export interface DoctorAvailability {
  availableSlots: string[];
  occupiedSlots: string[];
  startTime: string;
  endTime: string;
}

export async function getDoctorAvailability(id: number, date: string): Promise<DoctorAvailability> {
  return getJson<DoctorAvailability>(`/doctors/${id}/availability?date=${date}`);
}

export async function createDoctorProfile(input: CreateDoctorInput): Promise<DoctorSummary> {
  const response = await postJson<ApiResponse<DoctorSummary>>('/doctors', input);
  return response.data;
}
