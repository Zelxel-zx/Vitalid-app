import { getAuthItem } from './authStorage';
import { getPatientByUserId } from './patientService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Downloads the patient's medical history PDF.
 * Resolves the patient entity ID from userId first, then calls
 * GET /reports/patient/{patientId}/pdf
 */
export async function downloadPatientReport(userId: number): Promise<void> {
  const token = getAuthItem('authToken');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // The backend endpoint expects the patient entity ID, not the user ID
  let patientEntityId: number = userId;
  try {
    const patient = await getPatientByUserId(userId);
    patientEntityId = patient.id;
  } catch {
    // Fall back to userId if patient lookup fails (the backend will return 404 clearly)
  }

  const response = await fetch(`${API_BASE_URL}/reports/patient/${patientEntityId}/pdf`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Error downloading report: ${response.status} ${text}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vitalid-historial-${patientEntityId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
