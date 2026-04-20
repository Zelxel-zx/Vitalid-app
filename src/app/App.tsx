import { useState } from 'react';
import { Home, MessageSquare, Activity, User, Menu, X, Pill, Calendar, Users } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { DoctorCard } from './components/DoctorCard';
import { ChatInterface } from './components/ChatInterface';
import { TreatmentCard } from './components/TreatmentCard';
import { ProgressChart } from './components/ProgressChart';
import { MedicationTracker } from './components/MedicationTracker';
import { AppointmentBooking } from './components/AppointmentBooking';
import { AppointmentHistory } from './components/AppointmentHistory';
import logo from '../images/Logo (1).svg';
import logoutIcon from '../images/log out.png';
import { DoctorDashboard } from './components/DoctorDashboard';

type View = 'home' | 'messages' | 'treatments' | 'medications' | 'appointments' | 'history' | 'profile' | 'patients';
type UserType = 'patient' | 'doctor' | null;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = (type: 'patient' | 'doctor') => {
    setUserType(type);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const doctors = [
    {
      id: 1,
      name: 'Dra. Sarah Johnson',
      specialty: 'Cardióloga',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      status: 'online' as const,
      unreadMessages: 3
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Endocrinólogo',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      status: 'offline' as const,
      unreadMessages: 0
    },
    {
      id: 3,
      name: 'Dra. Emily Rodriguez',
      specialty: 'Medicina General',
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
      status: 'busy' as const,
      unreadMessages: 1
    }
  ];

  const messages = [
    {
      id: '1',
      sender: 'doctor' as const,
      content: '¡Hola! ¿Cómo te sientes hoy? ¿Has estado tomando tu medicación según lo prescrito?',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      sender: 'patient' as const,
      content: '¡Hola Dra. Johnson! Sí, la he estado tomando cada mañana. Me siento mucho mejor.',
      timestamp: '10:32 AM'
    },
    {
      id: '3',
      sender: 'doctor' as const,
      content: '¡Qué bueno escuchar eso! Sigue monitoreando tu presión arterial y avísame si notas algún cambio.',
      timestamp: '10:35 AM'
    },
    {
      id: '4',
      sender: 'patient' as const,
      content: 'Lo haré. ¿Debería programar una cita de seguimiento?',
      timestamp: '10:37 AM'
    },
    {
      id: '5',
      sender: 'doctor' as const,
      content: 'Sí, programemos una para el próximo mes para revisar tu progreso.',
      timestamp: '10:40 AM'
    }
  ];

  const treatments = [
    {
      title: 'Control de Hipertensión',
      doctor: 'Sarah Johnson',
      status: 'active' as const,
      progress: 75,
      nextAppointment: '15 de mayo de 2026 a las 14:00',
      medications: ['Lisinopril 10mg', 'Amlodipino 5mg']
    },
    {
      title: 'Plan de Cuidado de Diabetes',
      doctor: 'Michael Chen',
      status: 'active' as const,
      progress: 60,
      nextAppointment: '25 de abril de 2026 a las 10:00',
      medications: ['Metformina 500mg']
    },
    {
      title: 'Chequeo Anual',
      doctor: 'Emily Rodriguez',
      status: 'completed' as const,
      progress: 100
    }
  ];

  const bloodPressureData = [
    { date: '1 Mar', value: 145 },
    { date: '8 Mar', value: 138 },
    { date: '15 Mar', value: 135 },
    { date: '22 Mar', value: 130 },
    { date: '29 Mar', value: 128 },
    { date: '5 Abr', value: 125 },
    { date: '12 Abr', value: 122 }
  ];

  const bloodSugarData = [
    { date: '1 Mar', value: 145 },
    { date: '8 Mar', value: 142 },
    { date: '15 Mar', value: 138 },
    { date: '22 Mar', value: 135 },
    { date: '29 Mar', value: 130 },
    { date: '5 Abr', value: 128 },
    { date: '12 Abr', value: 125 }
  ];

  const handleDoctorClick = (doctorId: number) => {
    setSelectedDoctor(doctorId);
    setCurrentView('messages');
  };

  const patientNavItems = [
    { id: 'home' as View, icon: Home, label: 'Inicio' },
    { id: 'medications' as View, icon: Pill, label: 'Medicamentos' },
    { id: 'appointments' as View, icon: Calendar, label: 'Agendar Cita' },
    { id: 'history' as View, icon: Activity, label: 'Mis Citas' },
    { id: 'messages' as View, icon: MessageSquare, label: 'Mensajes' },
    { id: 'profile' as View, icon: User, label: '' }
  ];

  const doctorNavItems = [
    { id: 'home' as View, icon: Home, label: 'Inicio' },
    { id: 'patients' as View, icon: Users, label: 'Pacientes' },
    { id: 'appointments' as View, icon: Calendar, label: 'Citas' },
    { id: 'messages' as View, icon: MessageSquare, label: 'Mensajes' },
    { id: 'profile' as View, icon: User, label: '' }
  ];

  const navItems = userType === 'doctor' ? doctorNavItems : patientNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-0">
              <img src={logo} alt="Vitalid Logo" className="w-[76px] h-[86px]" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vitalid App</h1>
                <p className="text-xs text-gray-500">{userType === 'doctor' ? 'Portal Médico' : 'Portal Paciente'}</p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <nav className="hidden lg:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-primary'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setUserType(null);
                  setCurrentView('home');
                }}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <img src={logoutIcon} alt="Cerrar Sesión" className="w-5 h-5" />
              </button>
            </nav>
          </div>

          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-gray-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-primary'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setUserType(null);
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <img src={logoutIcon} alt="Cerrar Sesión" className="w-5 h-5" />
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && userType === 'patient' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bienvenido, John</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-primary text-white rounded-xl p-6">
                  <h3 className="text-sm opacity-90 mb-1">Tratamientos Activos</h3>
                  <p className="text-3xl font-semibold">2</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Próximas Citas</h3>
                  <p className="text-3xl font-semibold text-gray-900">2</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Mensajes Sin Leer</h3>
                  <p className="text-3xl font-semibold text-gray-900">4</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-2">Cumplimiento de Medicamentos Hoy</h3>
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-bold">75%</div>
                  <div className="text-cyan-100 mb-1">3 de 4 dosis tomadas</div>
                </div>
                <div className="mt-4 bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus Doctores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    {...doctor}
                    onClick={() => handleDoctorClick(doctor.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso de Salud</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart
                  title="Presión Arterial (Sistólica)"
                  data={bloodPressureData}
                  unit="mmHg"
                  target={120}
                />
                <ProgressChart
                  title="Glucosa en Sangre"
                  data={bloodSugarData}
                  unit="mg/dL"
                  target={100}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'home' && userType === 'doctor' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Panel de Monitoreo</h2>
              <p className="text-gray-600 mb-6">Supervisa el cumplimiento de tratamiento de tus pacientes</p>
            </div>
            <DoctorDashboard />
          </div>
        )}

        {currentView === 'medications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mis Medicamentos</h2>
              <p className="text-gray-600">Registra tus dosis diarias y mantén el control de tu tratamiento</p>
            </div>
            <MedicationTracker />
          </div>
        )}

        {currentView === 'appointments' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Agendar Cita</h2>
              <p className="text-gray-600">Encuentra y reserva citas con tus doctores</p>
            </div>
            <AppointmentBooking />
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mis Consultas</h2>
              <p className="text-gray-600">Revisa tus citas programadas y consultas anteriores</p>
            </div>
            <AppointmentHistory />
          </div>
        )}

        {currentView === 'patients' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Monitoreo de Pacientes</h2>
              <p className="text-gray-600">Identifica pacientes en riesgo e interviene preventivamente</p>
            </div>
            <DoctorDashboard />
          </div>
        )}

        {currentView === 'messages' && (
          <div className="space-y-6">
            {selectedDoctor ? (
              <div className="h-[calc(100vh-12rem)]">
                <ChatInterface
                  doctorName={doctors.find(d => d.id === selectedDoctor)?.name || ''}
                  doctorAvatar={doctors.find(d => d.id === selectedDoctor)?.avatar || ''}
                  messages={messages}
                  onBack={() => setSelectedDoctor(null)}
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Mensajes</h2>
                <p className="text-gray-600 mb-6">Comunícate con tus doctores de forma segura y privada</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      {...doctor}
                      onClick={() => handleDoctorClick(doctor.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {currentView === 'profile' && userType === 'patient' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Mi Perfil</h2>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">John Anderson</h3>
                  <p className="text-gray-500">ID de Paciente: #12345</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Correo Electrónico</label>
                  <p className="font-medium">john.anderson@email.com</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Teléfono</label>
                  <p className="font-medium">+1 (555) 123-4567</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
                  <p className="font-medium">15 de enero de 1980</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tipo de Sangre</label>
                  <p className="font-medium">A+</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Alergias</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-3 py-1 bg-red-400 text-red-900 rounded-full text-sm font-medium">Penicilina</span>
                    <span className="px-3 py-1 bg-red-400 text-red-900 rounded-full text-sm font-medium">Maní</span>
                  </div>
                </div>
              </div>

              <button className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors">
                Editar Perfil
              </button>
            </div>
          </div>
        )}

        {currentView === 'profile' && userType === 'doctor' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Mi Perfil</h2>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop"
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Dra. Sarah Johnson</h3>
                  <p className="text-gray-500">Cardióloga</p>
                  <p className="text-gray-500">Licencia Médica: #98765</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Correo Electrónico</label>
                  <p className="font-medium">sarah.johnson@vitalid.com</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Teléfono</label>
                  <p className="font-medium">+1 (555) 987-6543</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Especialidad</label>
                  <p className="font-medium">Cardiología</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Años de Experiencia</label>
                  <p className="font-medium">15 años</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Hospital Afiliado</label>
                  <p className="font-medium">Hospital General Central</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Pacientes Activos</label>
                  <p className="font-medium">47 pacientes</p>
                </div>
              </div>

              <button className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors">
                Editar Perfil
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
