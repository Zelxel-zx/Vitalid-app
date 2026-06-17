import { useEffect, useState } from 'react';
import { getAppointmentsForPatient } from '../services/appointmentService';
import { getMyTreatments } from '../services/treatmentService';
import { getAuthItem } from '../services/authStorage';

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
        getAppointmentsForPatient(
          Number(getAuthItem('authPatientId') || userId),
        ),
        getMyTreatments(),
      ]);
      const ids = new Set<number>();

      if (appointmentsResult.status === 'fulfilled') {
        appointmentsResult.value.forEach((appointment) => {
          if (appointment.doctorId) ids.add(appointment.doctorId);
        });
      }

      if (treatmentsResult.status === 'fulfilled') {
        treatmentsResult.value
          .filter((treatment) => treatment.status?.toUpperCase() === 'ACTIVE')
          .forEach((treatment) => {
            if (treatment.doctorId) ids.add(treatment.doctorId);
          });
      }

      if (mounted) setDoctorIds(ids);
    };

    loadDoctorIds();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return doctorIds;
}
