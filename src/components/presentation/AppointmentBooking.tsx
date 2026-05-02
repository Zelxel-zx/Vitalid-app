import { useState } from 'react';
import { Calendar, Clock, Video, MapPin, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  consultationFee: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function AppointmentBooking() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'presencial' | 'videollamada'>('presencial');

  const specialties = [
    'Todos',
    'Cardiología',
    'Endocrinología',
    'Medicina General',
    'Dermatología',
    'Pediatría'
  ];

  const doctors: Doctor[] = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiología',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      rating: 4.9,
      consultationFee: 80
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Endocrinología',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      rating: 4.8,
      consultationFee: 75
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Medicina General',
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
      rating: 4.7,
      consultationFee: 60
    }
  ];

  const timeSlots: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false },
    { time: '10:30', available: true },
    { time: '11:00', available: true },
    { time: '11:30', available: false },
    { time: '14:00', available: true },
    { time: '14:30', available: true },
    { time: '15:00', available: true },
    { time: '15:30', available: false },
    { time: '16:00', available: true },
    { time: '16:30', available: true }
  ];

  const filteredDoctors = selectedSpecialty === 'all'
    ? doctors
    : doctors.filter(d => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleBookAppointment = () => {
    if (selectedDoctor && selectedTime) {
      console.log('Reservando cita:', {
        doctor: selectedDoctor.name,
        date: selectedDate,
        time: selectedTime,
        type: consultationType
      });
      alert(`¡Cita reservada con ${selectedDoctor.name} el ${formatDate(selectedDate)} a las ${selectedTime}!`);
      setSelectedDoctor(null);
      setSelectedTime(null);
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
              src={selectedDoctor.avatar}
              alt={selectedDoctor.name}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h2>
              <p className="text-gray-600">{selectedDoctor.specialty}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-gray-600">{selectedDoctor.rating} / 5.0</span>
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
                <p className="text-sm text-gray-500">${selectedDoctor.consultationFee}</p>
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
                <p className="text-sm text-gray-500">${selectedDoctor.consultationFee - 10}</p>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Selecciona una fecha</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button className="p-2 hover:bg-gray-200 rounded">
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">{formatDate(selectedDate)}</span>
                <button className="p-2 hover:bg-gray-200 rounded">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Horarios disponibles</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    !slot.available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selectedTime === slot.time
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-primary'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={!selectedTime}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              selectedTime
                ? 'bg-primary text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirmar Cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Filter size={20} className="text-gray-600" />
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        >
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty === 'Todos' ? 'all' : specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-600">{doctor.rating} / 5.0</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">${doctor.consultationFee}</span>
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
        ))}
      </div>
    </div>
  );
}
