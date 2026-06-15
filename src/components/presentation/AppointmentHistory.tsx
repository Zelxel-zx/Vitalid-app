import { useState, useEffect } from 'react';
import { Calendar, MapPin, Video, FileText, Edit2, X, UserRound } from 'lucide-react';
import { getAppointmentsForPatient, getAppointmentsForDoctor, rescheduleAppointment, AppointmentResponse } from '../../services/appointmentService';
import { getAllDoctors, getDoctorById } from '../../services/doctorService';
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
  // Reschedule modal state
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

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
        const doctors = await getAllDoctors();
        const currentDoctor = doctors.find((doctor) => doctor.userId === userId);
        if (!currentDoctor) {
          throw new Error('Doctor profile not found for current user');
        }
        data = await getAppointmentsForDoctor(currentDoctor.id);
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
    setRescheduleId(appointmentId);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) {
      alert('Por favor selecciona fecha y hora');
      return;
    }
    setIsRescheduling(true);
    try {
      await rescheduleAppointment(rescheduleId, { date: rescheduleDate, time: rescheduleTime });
      setRescheduleId(null);
      await loadAppointments();
    } catch (err) {
      console.error('Error al reprogramar:', err);
      alert('Error al reprogramar la cita. Inténtalo de nuevo.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleJoinVideoCall = (appointment: EnrichedAppointment) => {
    const roomName = `vitalid-appt-${appointment.id}`;
    window.open(`https://meet.jit.si/${roomName}`, '_blank');
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Cargando consultas...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Reschedule modal */}
      {rescheduleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cambiar fecha de cita</h3>
              <button onClick={() => setRescheduleId(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nueva fecha</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Nueva hora</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setRescheduleId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={isRescheduling}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isRescheduling ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                  {getAuthItem('authUserType') !== 'doctor' &&
                    (appointment.doctorAvatar ? (
                      <img
                        src={appointment.doctorAvatar}
                        alt={appointment.doctorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound size={30} />
                      </div>
                    ))}
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
                      <button
                        onClick={() => handleJoinVideoCall(appointment)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm flex items-center gap-2"
                      >
                        <Video size={16} />
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
                  {getAuthItem('authUserType') !== 'doctor' &&
                    (appointment.doctorAvatar ? (
                      <img
                        src={appointment.doctorAvatar}
                        alt={appointment.doctorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound size={30} />
                      </div>
                    ))}
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
