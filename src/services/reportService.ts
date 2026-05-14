const API_BASE_URL = '/api';

export async function downloadPatientReport(patientId: number): Promise<void> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/reports/user/${patientId}/pdf`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Error downloading report');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vitalid-report-${patientId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
