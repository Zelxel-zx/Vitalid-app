import { useState, useEffect } from 'react';
import { Calendar, MapPin, Video, FileText, Edit2 } from 'lucide-react';
import { getAppointmentsForPatient, getAppointmentsForDoctor, AppointmentResponse } from '../../services/appointmentService';
import { getDoctorById, DoctorSummary } from '../../services/doctorService';

interface EnrichedAppointment extends AppointmentResponse {
  doctorAvatar?: string;
  specialty?: string;
}

export function AppointmentHistory() {
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const userId = Number(localStorage.getItem('authUserId'));
      const userType = localStorage.getItem('authUserType');
      if (!userId) return;

      let data: AppointmentResponse[] = [];
      if (userType === 'doctor') {
        data = await getAppointmentsForDoctor(userId);
      } else {
        data = await getAppointmentsForPatient(userId);
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

  const upcomingAppointments = appointments.filter(a => a.status === 'SCHEDULED');
  const pastAppointments = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED');

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
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {localStorage.getItem('authUserType') !== 'doctor' && (
                    <img
                      src={appointment.doctorAvatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'}
                      alt={appointment.doctorName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {localStorage.getItem('authUserType') === 'doctor' ? (
                           <h3 className="font-semibold text-gray-900">Paciente: {appointment.patientName}</h3>
                        ) : (
                           <>
                             <h3 className="font-semibold text-gray-900">Dr(a). {appointment.doctorName}</h3>
                             <p className="text-sm text-gray-600">{appointment.specialty || 'General'}</p>
                           </>
                        )}
                      </div>
                      {localStorage.getItem('authUserType') !== 'doctor' && (
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
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {appointment.reason.toLowerCase().includes('video') ? (
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

                    {appointment.reason.toLowerCase().includes('video') && (
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
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start gap-4">
                  {localStorage.getItem('authUserType') !== 'doctor' && (
                    <img
                      src={appointment.doctorAvatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'}
                      alt={appointment.doctorName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {localStorage.getItem('authUserType') === 'doctor' ? (
                           <h3 className="font-semibold text-gray-900">Paciente: {appointment.patientName}</h3>
                        ) : (
                           <>
                             <h3 className="font-semibold text-gray-900">Dr(a). {appointment.doctorName}</h3>
                             <p className="text-sm text-gray-600">{appointment.specialty || 'General'}</p>
                           </>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        appointment.status === 'COMPLETED' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                      }`}>
                        {appointment.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span className="capitalize">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {appointment.reason.toLowerCase().includes('video') ? (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
