import { getJson } from './apiClient';
import { getAppointmentsForPatient } from './appointmentService';
import { getDailyTreatmentsCompliance } from './checklistService';
import { getMyTreatments } from './treatmentService';

interface UnreadSummary {
  unreadCount: number;
}

export interface PatientDashboardSummary {
  activeTreatments: number;
  upcomingAppointments: number;
  unreadMessages: number;
  medicationCompliance: number;
}

const emptySummary: PatientDashboardSummary = {
  activeTreatments: 0,
  upcomingAppointments: 0,
  unreadMessages: 0,
  medicationCompliance: 0,
};

export async function getPatientDashboardSummary(
  userId: number,
): Promise<PatientDashboardSummary> {
  if (!userId) return emptySummary;

  const [treatmentsResult, appointmentsResult, unreadResult] = await Promise.allSettled([
    getMyTreatments(),
    getAppointmentsForPatient(userId),
    getJson<UnreadSummary[]>(`/chat/unread?receiverId=${userId}`),
  ]);

  const treatments =
    treatmentsResult.status === 'fulfilled' ? treatmentsResult.value : [];
  const activeTreatments = treatments.filter(
    (treatment) => treatment.status?.toUpperCase() === 'ACTIVE',
  );

  const appointments =
    appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [];
  const now = new Date();
  const upcomingAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    return (
      appointment.status?.toUpperCase() !== 'CANCELLED' &&
      appointmentDate >= now
    );
  }).length;

  const unreadMessages =
    unreadResult.status === 'fulfilled'
      ? unreadResult.value.reduce(
          (total, conversation) => total + Number(conversation.unreadCount || 0),
          0,
        )
      : 0;

  const medicationCompliance =
    await getDailyTreatmentsCompliance(activeTreatments);

  return {
    activeTreatments: activeTreatments.length,
    upcomingAppointments,
    unreadMessages,
    medicationCompliance,
  };
}
