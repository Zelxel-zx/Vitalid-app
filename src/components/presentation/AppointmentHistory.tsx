import { useState, useEffect } from 'react';
import { Calendar, MapPin, Video, FileText, Edit2, UserRound } from 'lucide-react';
import { getAppointmentsForPatient, getAppointmentsForDoctor, AppointmentResponse } from '../../services/appointmentService';
import { getDoctorById } from '../../services/doctorService';
import { getMyTreatments } from '../../services/treatmentService';
import { getAuthItem } from '../../services/authStorage';

interface EnrichedAppointment extends AppointmentResponse {
  doctorAvatar?: string;
  specialty?: string;
  treatmentFollowUp?: boolean;
  treatmentTitle?: string;
}

interface AppointmentHistoryProps {
  onScheduleTreatmentFollowUp?: (doctorId: number, date: string) => void;
}

export function AppointmentHistory({
  onScheduleTreatmentFollowUp,
}: AppointmentHistoryProps) {
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const userId = Number(getAuthItem('authUserId'));
      const userType = getAuthItem('authUserType');
      if (!userId) return;

      let data: EnrichedAppointment[] = [];
      if (userType === 'doctor') {
        data = await getAppointmentsForDoctor(userId);
      } else {
        data = await getAppointmentsForPatient(userId);

        const treatments = await getMyTreatments().catch((error) => {
          console.error('Error loading treatment follow-ups:', error);
          return [];
        });
        const treatmentAppointments: EnrichedAppointment[] = treatments
          .filter(
            (treatment) =>
              treatment.nextAppointment &&
              !data.some(
                (appointment) =>
                  appointment.doctorId === treatment.doctorId &&
                  appointment.date === treatment.nextAppointment &&
                  appointment.status?.toUpperCase() !== 'CANCELLED',
              ),
          )
          .map((treatment) => ({
            id: -treatment.id,
            patientId: treatment.patientId,
            doctorId: treatment.doctorId,
            patientName: treatment.patientName,
            doctorName: treatment.doctorName,
            date: treatment.nextAppointment,
            time: '',
            reason: `Seguimiento: ${treatment.title}`,
            appointmentType: 'IN_PERSON',
            status: 'SCHEDULED',
            treatmentFollowUp: true,
            treatmentTitle: treatment.title,
          }));

        data = [...data, ...treatmentAppointments];
      }
      
      if (userType === 'doctor') {
        // For doctors, we don't need to fetch doctor avatars, just use the patient name
        setAppointments(data);
      } else {
        // Fetch doctor details to get avatars and specialties for patients
        const enriched = await Promise.all(
          data.map(async (app) => {
            try {
              const doc = await getDoctorById(app.doctorId);
              return {
                ...app,
                doctorAvatar: doc.avatar,
                specialty: doc.specialty
              };
            } catch {
              return app;
            }
          })
        );
        setAppointments(enriched);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentDateTime = (appointment: EnrichedAppointment) =>
    new Date(
      `${appointment.date}T${
        appointment.treatmentFollowUp ? '12:00' : appointment.time
      }`,
    );

  const getAppointmentEndTime = (appointment: EnrichedAppointment) => {
    if (appointment.treatmentFollowUp) {
      return new Date(`${appointment.date}T23:59:59`);
    }
    const endTime = getAppointmentDateTime(appointment);
    endTime.setMinutes(endTime.getMinutes() + 30);
    return endTime;
  };

  const now = new Date();
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status?.toUpperCase() === 'SCHEDULED' &&
        getAppointmentEndTime(appointment) > now,
    )
    .sort(
      (first, second) =>
        getAppointmentDateTime(first).getTime() -
        getAppointmentDateTime(second).getTime(),
    );

  const pastAppointments = appointments
    .filter((appointment) => {
      const status = appointment.status?.toUpperCase();
      return (
        status === 'COMPLETED' ||
        status === 'CANCELLED' ||
        getAppointmentEndTime(appointment) <= now
      );
    })
    .sort(
      (first, second) =>
        getAppointmentDateTime(second).getTime() -
        getAppointmentDateTime(first).getTime(),
    );

  const getPastAppointmentStatus = (appointment: EnrichedAppointment) => {
    if (appointment.treatmentFollowUp) {
      return {
        label: 'Fecha vencida',
        className: 'bg-amber-100 text-amber-700',
      };
    }

    const status = appointment.status?.toUpperCase();
    if (status === 'CANCELLED') {
      return {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-700',
      };
    }

    return {
      label: 'Finalizada',
      className: 'bg-green-100 text-green-700',
    };
  };

  const isVideoCall = (appointment: EnrichedAppointment) =>
    appointment.appointmentType === 'VIDEO_CALL';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleReschedule = (appointmentId: number) => {
    console.log('Reprogramando cita:', appointmentId);
    alert('Funcionalidad de reprogramación estará disponible pronto');
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Cargando consultas...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Próximas Citas</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">No tienes citas programadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl border border-primary p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {getAuthItem('authUserType') !== 'doctor' && (
                    appointment.doctorAvatar ? (
                      <img
                        src={appointment.doctorAvatar}
                        alt={appointment.doctorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound size={30} />
                      </div>
                    )
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {getAuthItem('authUserType') === 'doctor' ? (
                           <h3 className="font-semibold text-gray-900">Paciente: {appointment.patientName}</h3>
                        ) : (
                           <>
                             <h3 className="font-semibold text-gray-900">Dr(a). {appointment.doctorName}</h3>
                             <p className="text-sm text-gray-600">{appointment.specialty || 'General'}</p>
                           </>
                        )}
                      </div>
                      {getAuthItem('authUserType') !== 'doctor' &&
                        !appointment.treatmentFollowUp && (
                        <button
                          onClick={() => handleReschedule(appointment.id)}
                          className="flex items-center gap-1 text-sm text-primary hover:opacity-80"
                        >
                          <Edit2 size={14} />
                          Cambiar fecha
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span className="capitalize">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>
                          {appointment.treatmentFollowUp
                            ? 'Hora por confirmar'
                            : appointment.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {appointment.treatmentFollowUp ? (
                          <>
                            <FileText size={16} />
                            <span>Seguimiento de tratamiento</span>
                          </>
                        ) : isVideoCall(appointment) ? (
                          <>
                            <Video size={16} />
                            <span>Videollamada</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={16} />
                            <span>Presencial</span>
                          </>
                        )}
                      </div>
                    </div>

                    {appointment.treatmentFollowUp && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                          {appointment.treatmentTitle}
                        </p>
                        {onScheduleTreatmentFollowUp && (
                          <button
                            type="button"
                            onClick={() =>
                              onScheduleTreatmentFollowUp(
                                appointment.doctorId,
                                appointment.date,
                              )
                            }
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            Agendar cita
                          </button>
                        )}
                      </div>
                    )}

                    {isVideoCall(appointment) && (
                      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm">
                        Unirse a la videollamada
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultas Pasadas</h2>
        {pastAppointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay consultas pasadas registradas.</p>
        ) : (
          <div className="space-y-4">
            {pastAppointments.map((appointment) => {
              const pastStatus = getPastAppointmentStatus(appointment);
              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl border border-primary p-5"
                >
                <div className="flex items-start gap-4">
                  {getAuthItem('authUserType') !== 'doctor' && (
                    appointment.doctorAvatar ? (
                      <img
                        src={appointment.doctorAvatar}
                        alt={appointment.doctorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound size={30} />
                      </div>
                    )
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {getAuthItem('authUserType') === 'doctor' ? (
                           <h3 className="font-semibold text-gray-900">Paciente: {appointment.patientName}</h3>
                        ) : (
                           <>
                             <h3 className="font-semibold text-gray-900">Dr(a). {appointment.doctorName}</h3>
                             <p className="text-sm text-gray-600">{appointment.specialty || 'General'}</p>
                           </>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${pastStatus.className}`}>
                        {pastStatus.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span className="capitalize">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {appointment.treatmentFollowUp ? (
                          <>
                            <FileText size={16} />
                            <span>Seguimiento de tratamiento</span>
                          </>
                        ) : isVideoCall(appointment) ? (
                          <>
                            <Video size={16} />
                            <span>Videollamada</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={16} />
                            <span>Presencial</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
