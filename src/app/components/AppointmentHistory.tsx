import { Calendar, MapPin, Video, FileText, Edit2 } from 'lucide-react';

interface Appointment {
  id: string;
  doctorName: string;
  doctorAvatar: string;
  specialty: string;
  date: string;
  time: string;
  type: 'presencial' | 'videollamada';
  status: 'completed' | 'upcoming' | 'cancelled';
  diagnosis?: string;
  notes?: string;
}

export function AppointmentHistory() {
  const appointments: Appointment[] = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      specialty: 'Cardiología',
      date: '2026-05-15',
      time: '14:00',
      type: 'presencial',
      status: 'upcoming'
    },
    {
      id: '2',
      doctorName: 'Dr. Michael Chen',
      doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      specialty: 'Endocrinología',
      date: '2026-04-25',
      time: '10:00',
      type: 'videollamada',
      status: 'upcoming'
    },
    {
      id: '3',
      doctorName: 'Dr. Emily Rodriguez',
      doctorAvatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
      specialty: 'Medicina General',
      date: '2026-03-20',
      time: '09:30',
      type: 'presencial',
      status: 'completed',
      diagnosis: 'Chequeo anual - Todo normal',
      notes: 'Continuar con estilo de vida saludable. Próxima cita en 6 meses.'
    },
    {
      id: '4',
      doctorName: 'Dr. Sarah Johnson',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      specialty: 'Cardiología',
      date: '2026-02-10',
      time: '15:00',
      type: 'presencial',
      status: 'completed',
      diagnosis: 'Hipertensión - Control de seguimiento',
      notes: 'Presión arterial mejorada con medicación. Mantener tratamiento actual.'
    }
  ];

  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const pastAppointments = appointments.filter(a => a.status === 'completed');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleReschedule = (appointmentId: string) => {
    console.log('Reprogramando cita:', appointmentId);
    alert('Funcionalidad de reprogramación disponible');
  };

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
                  <img
                    src={appointment.doctorAvatar}
                    alt={appointment.doctorName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                      </div>
                      <button
                        onClick={() => handleReschedule(appointment.id)}
                        className="flex items-center gap-1 text-sm text-primary hover:opacity-80"
                      >
                        <Edit2 size={14} />
                        Cambiar fecha
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {appointment.type === 'presencial' ? (
                          <>
                            <MapPin size={16} />
                            <span>Presencial</span>
                          </>
                        ) : (
                          <>
                            <Video size={16} />
                            <span>Videollamada</span>
                          </>
                        )}
                      </div>
                    </div>

                    {appointment.type === 'videollamada' && (
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
        <div className="space-y-4">
          {pastAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={appointment.doctorAvatar}
                  alt={appointment.doctorName}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                      <p className="text-sm text-gray-600">{appointment.specialty}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Completada
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {appointment.type === 'presencial' ? (
                        <>
                          <MapPin size={16} />
                          <span>Presencial</span>
                        </>
                      ) : (
                        <>
                          <Video size={16} />
                          <span>Videollamada</span>
                        </>
                      )}
                    </div>
                  </div>

                  {appointment.diagnosis && (
                    <div className="bg-blue-50 border border-cyan-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Diagnóstico</p>
                          <p className="text-sm text-gray-700">{appointment.diagnosis}</p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
