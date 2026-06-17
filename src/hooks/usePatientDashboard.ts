import { useEffect, useState } from 'react';
import {
  getPatientDashboardSummary,
  PatientDashboardSummary,
} from '../services/dashboardService';
import { MEDICATION_COMPLIANCE_UPDATED } from '../services/checklistService';

const initialSummary: PatientDashboardSummary = {
  activeTreatments: 0,
  upcomingAppointments: 0,
  unreadMessages: 0,
  medicationCompliance: 0,
};

export function usePatientDashboard(userId: number | null) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      if (!userId) {
        setSummary(initialSummary);
        setLoading(false);
        return;
      }

      try {
        const data = await getPatientDashboardSummary(userId);
        if (mounted) setSummary(data);
      } catch (error) {
        console.error('Error loading patient dashboard:', error);
        if (mounted) setSummary(initialSummary);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSummary();
    window.addEventListener(MEDICATION_COMPLIANCE_UPDATED, loadSummary);
    window.addEventListener('focus', loadSummary);

    return () => {
      mounted = false;
      window.removeEventListener(MEDICATION_COMPLIANCE_UPDATED, loadSummary);
      window.removeEventListener('focus', loadSummary);
    };
  }, [userId]);

  return { summary, loading };
}
