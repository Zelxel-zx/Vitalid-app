import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Video, MapPin, Filter, ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react';
import { DoctorSummary, formatDoctorName, getAllDoctors, getDoctorAvailability } from '../../services/doctorService';
import { createAppointment } from '../../services/appointmentService';
import { getPatientByUserId } from '../../services/patientService';
import { getAuthItem } from '../../services/authStorage';

interface AppointmentBookingProps {
  initialDoctorId?: number | null;
  initialDate?: string | null;
}

export function AppointmentBooking({
  initialDoctorId,
  initialDate,
}: AppointmentBookingProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  
  // Create a date without time to avoid timezone offset issues when selecting today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'presencial' | 'videollamada'>('presencial');
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (!initialDoctorId || doctors.length === 0) return;

    const doctor = doctors.find((item) => item.id === initialDoctorId);
    if (doctor) setSelectedDoctor(doctor);
  }, [doctors, initialDoctorId]);

  useEffect(() => {
    if (!initialDate) return;

    const [year, month, day] = initialDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    if (date >= today) setSelectedDate(date);
  }, [initialDate]);

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
      setIsLoadingAvailability(true);
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const response = await getDoctorAvailability(selectedDoctor.id, dateStr);
      setAvailableSlots(response.availableSlots);
      setOccupiedSlots(response.occupiedSlots || []);
      setSelectedTime(null);
    } catch (err) {
      console.error('Error loading availability:', err);
      setAvailableSlots([]);
      setOccupiedSlots([]);
    } finally {
      setIsLoadingAvailability(false);
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

  const formatDateInput = (date: Date) => {
    return date.toLocaleDateString('en-CA');
  };

  const handleDateSelection = (dateValue: string) => {
    if (!dateValue) return;

    const [year, month, day] = dateValue.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    newDate.setHours(0, 0, 0, 0);

    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const openDatePicker = () => {
    const dateInput = dateInputRef.current;
    if (!dateInput) return;

    if ('showPicker' in dateInput) {
      dateInput.showPicker();
    } else {
      dateInput.focus();
      dateInput.click();
    }
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
        setBookingError(null);
        const userId = Number(getAuthItem('authUserId'));
        const patient = await getPatientByUserId(userId);
        
        await createAppointment({
          patientId: patient.id,
          doctorId: selectedDoctor.id,
          date: selectedDate.toLocaleDateString('en-CA'),
          time: selectedTime,
          reason: 'Consulta médica',
          appointmentType:
            consultationType === 'presencial' ? 'IN_PERSON' : 'VIDEO_CALL',
        });
        
        alert(`¡Cita reservada con ${formatDoctorName(selectedDoctor.name)} el ${formatDate(selectedDate)} a las ${selectedTime}!`);
        setSelectedDoctor(null);
        setSelectedTime(null);
      } catch (err) {
        console.error('Error booking appointment:', err);
        setBookingError(
          err instanceof Error
            ? err.message
            : 'Error al reservar la cita. Por favor intenta de nuevo.',
        );
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

        <div className="bg-white rounded-xl border border-primary p-6">
          <div className="flex items-start gap-4 mb-6">
            {selectedDoctor.avatar ? (
              <img
                src={selectedDoctor.avatar}
                alt={formatDoctorName(selectedDoctor.name)}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound size={36} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{formatDoctorName(selectedDoctor.name)}</h2>
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
            {consultationType === 'presencial' && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-gray-700">
                <MapPin className="mt-0.5 shrink-0 text-primary" size={17} />
                <span>
                  {selectedDoctor.medicalCenterAddress ||
                    'Dirección del centro médico no disponible'}
                </span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Selecciona una fecha</label>
            <div className="rounded-lg bg-gray-100/[1] p-4 ring-1 ring-gray-200/90">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-200 rounded">
                  <ChevronLeft size={20} />
                </button>
                <div className="relative text-center">
                  <button
                    type="button"
                    onClick={openDatePicker}
                    className="rounded-lg px-3 py-2 text-center transition-colors hover:bg-blue-50"
                  >
                    <span className="flex items-center justify-center gap-2 font-medium capitalize text-gray-900">
                      <Calendar size={18} className="text-primary" />
                      {formatDate(selectedDate)}
                    </span>
                    <span className="mt-1 block text-xs text-primary">
                      Haz clic para elegir otra fecha
                    </span>
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={formatDateInput(selectedDate)}
                    min={formatDateInput(today)}
                    onChange={(event) => handleDateSelection(event.target.value)}
                    className="pointer-events-none absolute h-px w-px opacity-0"
                    aria-label="Elegir fecha de la cita"
                  />
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-200 rounded">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Horarios disponibles</label>
            {isLoadingAvailability ? (
              <p className="text-gray-500 text-sm">Consultando horarios...</p>
            ) : availableSlots.length === 0 && occupiedSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[...availableSlots, ...occupiedSlots]
                    .sort((first, second) => first.localeCompare(second))
                    .map((time) => {
                      const isOccupied = occupiedSlots.includes(time);
                      return (
                        <button
                          key={time}
                          onClick={() => !isOccupied && setSelectedTime(time)}
                          disabled={isOccupied}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${
                            isOccupied
                              ? 'cursor-not-allowed border border-red-200 bg-red-50 text-red-600'
                              : selectedTime === time
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/90 hover:bg-blue-50 hover:ring-blue-200/90 hover:text-primary'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                </div>
                {occupiedSlots.length > 0 && (
                  <p className="mt-3 text-xs text-red-600">
                    Los horarios en rojo ya están ocupados.
                  </p>
                )}
              </>
            )}
          </div>

          {bookingError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {bookingError}
            </div>
          )}

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
              className="rounded-xl border border-primary bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {doctor.avatar ? (
                    <img
                      src={doctor.avatar}
                      alt={formatDoctorName(doctor.name)}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound size={30} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{formatDoctorName(doctor.name)}</h3>
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
