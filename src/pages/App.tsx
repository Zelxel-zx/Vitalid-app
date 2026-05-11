import { Home, MessageSquare, Activity, User, Menu, X, Pill, Calendar, Users } from 'lucide-react';
import { LoginScreen, DoctorCard, ChatInterface, TreatmentCard, ProgressChart, MedicationTracker, AppointmentBooking, AppointmentHistory, DoctorDashboard } from '../components/presentation';
import { ProfileView } from '../components/presentation/ProfileView';
import logo from '../images/Logo (1).svg';
import logoutIcon from '../images/Logout.png';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useDoctors } from '../hooks/useDoctors';
import { useChat } from '../hooks/useChat';
import { useTreatments } from '../hooks/useTreatments';
import { useHealthData } from '../hooks/useHealthData';
import { View } from '../types';

export default function App() {
  const { isLoggedIn, userType, handleLogin, handleRegister, handleLogout } = useAuth();

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return <MainApp key={localStorage.getItem('authUserId')} userType={userType} handleLogout={handleLogout} />;
}

function MainApp({ userType, handleLogout }: { userType: 'patient' | 'doctor' | null, handleLogout: () => void }) {
  const { currentView, selectedDoctor, mobileMenuOpen, setCurrentView, setSelectedDoctor, toggleMobileMenu, handleDoctorClick } = useNavigation();
  const { doctors } = useDoctors();
  const { messages } = useChat(selectedDoctor);
  const { treatments } = useTreatments();
  const { bloodPressure, bloodSugar } = useHealthData();

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

  const handleLogoutClick = () => {
    handleLogout();
    setCurrentView('home');
  };

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
              onClick={toggleMobileMenu}
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
                onClick={handleLogoutClick}
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
                      toggleMobileMenu();
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
                onClick={handleLogoutClick}
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
                  <p className="text-3xl font-semibold">{treatments.filter(t => t.status === 'active').length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Próximas Citas</h3>
                  <p className="text-3xl font-semibold text-gray-900">2</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Mensajes Sin Leer</h3>
                  <p className="text-3xl font-semibold text-gray-900">{doctors.reduce((sum, d) => sum + d.unreadMessages, 0)}</p>
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
                  data={bloodPressure}
                  unit="mmHg"
                  target={120}
                />
                <ProgressChart
                  title="Glucosa en Sangre"
                  data={bloodSugar}
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {userType === 'doctor' ? 'Mi Agenda' : 'Agendar Cita'}
              </h2>
              <p className="text-gray-600">
                {userType === 'doctor' ? 'Revisa tus próximas consultas programadas' : 'Encuentra y reserva citas con tus doctores'}
              </p>
            </div>
            {userType === 'doctor' ? <AppointmentHistory /> : <AppointmentBooking />}
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

        {currentView === 'profile' && (
          <ProfileView />
        )}
      </main>
    </div>
  );
}
