import { useEffect, useState } from 'react';
import {
  APPOINTMENTS_UPDATED,
  getAppointmentsForPatient,
} from '../services/appointmentService';
import { getMyTreatments } from '../services/treatmentService';

export function usePatientDoctors(userId: number | null) {
  const [doctorIds, setDoctorIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;

    const loadDoctorIds = async () => {
      if (!userId) {
        setDoctorIds(new Set());
        return;
      }

      const [appointmentsResult, treatmentsResult] = await Promise.allSettled([
        getAppointmentsForPatient(userId),
        getMyTreatments(),
      ]);
      const ids = new Set<number>();

      if (appointmentsResult.status === 'fulfilled') {
        appointmentsResult.value.forEach((appointment) => {
          if (
            appointment.doctorId &&
            appointment.status?.toUpperCase() !== 'CANCELLED'
          ) {
            ids.add(appointment.doctorId);
          }
        });
      }

      if (treatmentsResult.status === 'fulfilled') {
        treatmentsResult.value
          .filter((treatment) => treatment.status?.toUpperCase() !== 'CANCELLED')
          .forEach((treatment) => {
            if (treatment.doctorId) ids.add(treatment.doctorId);
          });
      }

      if (mounted) setDoctorIds(ids);
    };

    loadDoctorIds();
    window.addEventListener(APPOINTMENTS_UPDATED, loadDoctorIds);
    return () => {
      mounted = false;
      window.removeEventListener(APPOINTMENTS_UPDATED, loadDoctorIds);
    };
  }, [userId]);

  return doctorIds;
}
