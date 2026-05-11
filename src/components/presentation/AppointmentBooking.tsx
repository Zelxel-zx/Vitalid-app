import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { DoctorSummary, getAllDoctors, getDoctorAvailability } from '../../services/doctorService';
import { createAppointment } from '../../services/appointmentService';

export function AppointmentBooking() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  
  // Create a date without time to avoid timezone offset issues when selecting today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'presencial' | 'videollamada'>('presencial');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadAvailability();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadAvailability = async () => {
    if (!selectedDoctor) return;
    try {
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const response = await getDoctorAvailability(selectedDoctor.id, dateStr);
      setAvailableSlots(response.availableSlots);
      setSelectedTime(null);
    } catch (err) {
      console.error('Error loading availability:', err);
      setAvailableSlots([]);
    }
  };

  const specialties = ['Todos', ...Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)))];

  const filteredDoctors = doctors.filter(d => {
    const matchesSpecialty = selectedSpecialty === 'all' || selectedSpecialty === 'Todos' || d.specialty?.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    // Don't allow past dates
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const handleBookAppointment = async () => {
    if (selectedDoctor && selectedTime) {
      try {
        setIsBooking(true);
        const patientId = Number(localStorage.getItem('authUserId'));
        
        await createAppointment({
          patientId,
          doctorId: selectedDoctor.id,
          date: selectedDate.toLocaleDateString('en-CA'),
          time: selectedTime,
          reason: `Consulta ${consultationType}`,
        });
        
        alert(`¡Cita reservada con ${selectedDoctor.name} el ${formatDate(selectedDate)} a las ${selectedTime}!`);
        setSelectedDoctor(null);
        setSelectedTime(null);
      } catch (err) {
        console.error('Error booking appointment:', err);
        alert('Error al reservar la cita. Por favor intenta de nuevo.');
      } finally {
        setIsBooking(false);
      }
    }
  };

  if (selectedDoctor) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedDoctor(null);
            setSelectedTime(null);
          }}
          className="flex items-center gap-2 text-primary hover:opacity-80"
        >
          <ChevronLeft size={20} />
          Volver a la lista
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-6">
            <img
              src={selectedDoctor.avatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'}
              alt={selectedDoctor.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h2>
              <p className="text-gray-600">{selectedDoctor.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">{selectedDoctor.experienceYears || 0} años de experiencia</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de consulta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConsultationType('presencial')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  consultationType === 'presencial'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className={`mx-auto mb-2 ${consultationType === 'presencial' ? 'text-primary' : 'text-gray-400'}`} size={24} />
                <p className="font-medium text-gray-900">Presencial</p>
              </button>
              <button
                onClick={() => setConsultationType('videollamada')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  consultationType === 'videollamada'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Video className={`mx-auto mb-2 ${consultationType === 'videollamada' ? 'text-primary' : 'text-gray-400'}`} size={24} />
                <p className="font-medium text-gray-900">Videollamada</p>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Selecciona una fecha</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-200 rounded">
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-200 rounded">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Horarios disponibles</label>
            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === time
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-primary'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={!selectedTime || isBooking}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              selectedTime && !isBooking
                ? 'bg-primary text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isBooking ? 'Procesando...' : 'Confirmar Cita'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar doctor por nombre o especialidad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-3 md:w-64">
          <Filter size={20} className="text-gray-600 shrink-0" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white"
          >
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty === 'Todos' ? 'all' : specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDoctors.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No se encontraron doctores.</p>
        ) : (
          filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={doctor.avatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'}
                    alt={doctor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600">{doctor.experienceYears || 0} años exp.</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
