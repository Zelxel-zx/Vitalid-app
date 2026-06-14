import { useEffect, useState } from 'react';
import { Home, MessageSquare, Activity, User, UserRound, Menu, X, ClipboardList, Calendar, Users } from 'lucide-react';
import { LoginScreen, DoctorCard, PatientMessageCard, ChatInterface, ProgressChart, TreatmentsView, AppointmentBooking, AppointmentHistory, DoctorDashboard, DoctorPatientsView, PatientRegistrationForm, DoctorRegistrationForm } from '../components/presentation';
import { ProfileView } from '../components/presentation/ProfileView';
import logo from '../images/Logo (1).svg';
import logoutIcon from '../images/Logout.png';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useDoctors } from '../hooks/useDoctors';
import { useChat } from '../hooks/useChat';
import { useHealthData } from '../hooks/useHealthData';
import { usePatientDashboard } from '../hooks/usePatientDashboard';
import { usePatientDoctors } from '../hooks/usePatientDoctors';
import { View } from '../types';
import { getAuthItem } from '../services/authStorage';
import { getAllPatients, PatientResponse } from '../services/patientService';
import { getMyTreatments } from '../services/treatmentService';
import { getProfile, PROFILE_UPDATED } from '../services/profileService';

export default function App() {
  const {
    isLoggedIn,
    userType,
    userName,
    needsPatientProfile,
    needsDoctorProfile,
    handleLogin,
    handleRegister,
    handleLogout,
  } = useAuth();

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (userType === 'patient' && needsPatientProfile) {
    return (
      <PatientRegistrationForm
        onComplete={handleLogout}
        onLogout={handleLogout}
      />
    );
  }

  if (userType === 'doctor' && needsDoctorProfile) {
    return (
      <DoctorRegistrationForm
        onComplete={handleLogout}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <MainApp
      key={getAuthItem('authUserId')}
      userType={userType}
      userName={userName}
      userId={Number(getAuthItem('authUserId')) || null}
      handleLogout={handleLogout}
    />
  );
}

function MainApp({
  userType,
  userName,
  userId,
  handleLogout,
}: {
  userType: 'patient' | 'doctor' | null;
  userName: string | null;
  userId: number | null;
  handleLogout: () => void;
}) {
  const { currentView, selectedDoctor, mobileMenuOpen, setCurrentView, setSelectedDoctor, toggleMobileMenu, handleDoctorClick } = useNavigation();
  const { doctors } = useDoctors();
  const { bloodPressure, bloodSugar } = useHealthData();
  const { summary: dashboardSummary } = usePatientDashboard(
    userType === 'patient' ? userId : null,
  );
  const patientDoctorIds = usePatientDoctors(
    userType === 'patient' ? userId : null,
  );
  const patientDoctors = doctors.filter((doctor) => patientDoctorIds.has(doctor.id));
  const [displayName, setDisplayName] = useState(userName || '');
  const [profileAvatar, setProfileAvatar] = useState('');
  const firstName = displayName.trim().split(/\s+/)[0] || 'Paciente';
  const [appointmentPrefill, setAppointmentPrefill] = useState<{
    doctorId: number;
    date: string;
  } | null>(null);
  const [doctorPatients, setDoctorPatients] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);

  useEffect(() => {
    if (!userId) return;

    getProfile(userId)
      .then((profile) => {
        setDisplayName(profile.name || '');
        setProfileAvatar(profile.avatar || '');
      })
      .catch((error) => console.error('Error loading header profile:', error));

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; avatar?: string }>).detail;
      if (detail?.name !== undefined) setDisplayName(detail.name);
      if (detail?.avatar !== undefined) setProfileAvatar(detail.avatar);
    };

    window.addEventListener(PROFILE_UPDATED, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED, handleProfileUpdated);
  }, [userId]);

  useEffect(() => {
    if (userType !== 'doctor') {
      setDoctorPatients([]);
      return;
    }

    Promise.all([getMyTreatments(), getAllPatients()])
      .then(([treatments, patients]) => {
        const patientIds = new Set(treatments.map((treatment) => treatment.patientId));
        setDoctorPatients(patients.filter((patient) => patientIds.has(patient.id)));
      })
      .catch((error) => {
        console.error('Error loading doctor patients for messages:', error);
        setDoctorPatients([]);
      });
  }, [userType]);

  const activeChatId =
    userType === 'doctor' ? selectedPatient?.id ?? null : selectedDoctor;
  const { messages: activeMessages } = useChat(activeChatId);

  const patientNavItems = [
    { id: 'home' as View, icon: Home, label: 'Inicio' },
    { id: 'treatments' as View, icon: ClipboardList, label: 'Tratamientos' },
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

  const handleScheduleTreatmentFollowUp = (
    doctorId: number,
    date: string,
  ) => {
    setAppointmentPrefill({ doctorId, date });
    setSelectedDoctor(null);
    setCurrentView('appointments');
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
                      setAppointmentPrefill(null);
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                      setSelectedPatient(null);
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
                      setAppointmentPrefill(null);
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                      setSelectedPatient(null);
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
              <div className="mb-6 flex items-center gap-4">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound size={30} />
                  </div>
                )}
                <h2 className="text-2xl font-semibold text-gray-900">Bienvenido, {firstName}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-primary text-white rounded-xl p-6">
                  <h3 className="text-sm opacity-90 mb-1">Tratamientos Activos</h3>
                  <p className="text-3xl font-semibold">{dashboardSummary.activeTreatments}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Próximas Citas</h3>
                  <p className="text-3xl font-semibold text-gray-900">{dashboardSummary.upcomingAppointments}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-1">Mensajes Sin Leer</h3>
                  <p className="text-3xl font-semibold text-gray-900">{dashboardSummary.unreadMessages}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-2">Cumplimiento de Medicamentos Hoy</h3>
                <div className="text-4xl font-bold">{dashboardSummary.medicationCompliance}%</div>
                <div className="mt-4 bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dashboardSummary.medicationCompliance}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus Doctores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientDoctors.map((doctor) => (
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

        {currentView === 'treatments' && userType === 'patient' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mis Tratamientos</h2>
              <p className="text-gray-600">Consulta el avance de tus tratamientos y los medicamentos indicados</p>
            </div>
            <TreatmentsView />
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
            {userType === 'doctor' ? (
              <AppointmentHistory />
            ) : (
              <AppointmentBooking
                initialDoctorId={appointmentPrefill?.doctorId}
                initialDate={appointmentPrefill?.date}
              />
            )}
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mis Consultas</h2>
              <p className="text-gray-600">Revisa tus citas programadas y consultas anteriores</p>
            </div>
            <AppointmentHistory
              onScheduleTreatmentFollowUp={handleScheduleTreatmentFollowUp}
            />
          </div>
        )}

        {currentView === 'patients' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mis Pacientes</h2>
              <p className="text-gray-600">Consulta su información clínica, tratamientos y seguimiento</p>
            </div>
            <DoctorPatientsView />
          </div>
        )}

        {currentView === 'messages' && (
          <div className="space-y-6">
            {(userType === 'doctor' ? selectedPatient : selectedDoctor) ? (
              <div className="h-[calc(100vh-12rem)]">
                <ChatInterface
                  doctorName={
                    userType === 'doctor'
                      ? selectedPatient?.name || ''
                      : doctors.find((doctor) => doctor.id === selectedDoctor)?.name || ''
                  }
                  doctorAvatar={
                    userType === 'doctor'
                      ? selectedPatient?.avatar || ''
                      : doctors.find((doctor) => doctor.id === selectedDoctor)?.avatar || ''
                  }
                  messages={activeMessages}
                  currentUserType={userType}
                  onBack={() => {
                    setSelectedDoctor(null);
                    setSelectedPatient(null);
                  }}
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Mensajes</h2>
                <p className="text-gray-600 mb-6">
                  {userType === 'doctor'
                    ? 'Comunícate con tus pacientes de forma segura y privada'
                    : 'Comunícate con tus doctores de forma segura y privada'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userType === 'doctor'
                    ? doctorPatients.map((patient) => (
                        <PatientMessageCard
                          key={patient.id}
                          name={patient.name}
                          email={patient.email}
                          avatar={patient.avatar}
                          onClick={() => setSelectedPatient(patient)}
                        />
                      ))
                    : doctors.map((doctor) => (
                        <DoctorCard
                          key={doctor.id}
                          {...doctor}
                          onClick={() => handleDoctorClick(doctor.id)}
                        />
                      ))}
                </div>
                {userType === 'doctor' && doctorPatients.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
                    Aún no tienes pacientes vinculados para iniciar una conversación.
                  </div>
                )}
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
