import { getJson, postJson, request } from './apiClient';

export interface PatientNote {
  id: number;
  doctorId: number;
  patientId: number;
  patientName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientNoteInput {
  patientId: number;
  title: string;
  content: string;
}

export async function getPatientNotes(patientId: number): Promise<PatientNote[]> {
  return getJson<PatientNote[]>(`/patient-notes/patient/${patientId}`);
}

export async function createPatientNote(
  input: CreatePatientNoteInput,
): Promise<PatientNote> {
  return postJson<PatientNote>('/patient-notes', input);
}

export async function deletePatientNote(noteId: number): Promise<void> {
  await request<void>(`/patient-notes/${noteId}`, {
    method: 'DELETE',
  });
}
