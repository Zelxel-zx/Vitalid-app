import { useState, useEffect } from 'react';
import { Home, MessageSquare, Activity, User, UserRound, Menu, X, ClipboardList, Calendar, Users, MessageCircle, Video } from 'lucide-react';
import { LoginScreen, DoctorCard, ChatInterface, ProgressChart, TreatmentsView, AppointmentBooking, AppointmentHistory, DoctorDashboard, DoctorPatientsView, PatientRegistrationForm, DoctorRegistrationForm, AiChatBubble } from '../components/presentation';
import { ProfileView } from '../components/presentation/ProfileView';
import { IncomingCallModal } from '../components/presentation/IncomingCallModal';
import { JitsiCallModal } from '../components/presentation/JitsiCallModal';
import logo from '../images/Logo (1).svg';
import logoutIcon from '../images/Logout.png';
import { useAuth } from '../hooks/useAuth';
import { clearNavigationStorage, useNavigation } from '../hooks/useNavigation';
import { useDoctors } from '../hooks/useDoctors';
import { useChat } from '../hooks/useChat';
import { useHealthData } from '../hooks/useHealthData';
import { usePatientDashboard } from '../hooks/usePatientDashboard';
import { usePatientDoctors } from '../hooks/usePatientDoctors';
import { View } from '../types';
import { DoctorSummary } from '../services/doctorService';
import { CHAT_UNREAD_UPDATED, chatService } from '../services/chatService';
import { ChatMessage } from '../types';
import { getAuthItem } from '../services/authStorage';
import { getProfile, PROFILE_UPDATED } from '../services/profileService';
import { getPatientsByDoctor, PatientResponse } from '../services/patientService';
import { getMyTreatments } from '../services/treatmentService';
import { endCall, initiateCall } from '../services/callService';

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
    handleAutoLogin,
    isRestoringSession,
  } = useAuth();

  // Issue #4: show a loading screen while we check localStorage for an existing session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Issue #1: if profile is incomplete, FORCE the registration form regardless of how the user got here
  if (userType === 'patient' && needsPatientProfile) {
    return (
      <PatientRegistrationForm
        onAutoLogin={handleAutoLogin}
        onLogout={handleLogout}
      />
    );
  }

  if (userType === 'doctor' && needsDoctorProfile) {
    return (
      <DoctorRegistrationForm
        onAutoLogin={handleAutoLogin}
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
  const { currentView, selectedDoctor, mobileMenuOpen, setCurrentView, setSelectedDoctor, toggleMobileMenu, handleDoctorClick } = useNavigation(userType, userId);
  const { doctors } = useDoctors();
  const { messages, setMessages } = useChat(selectedDoctor);
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
    date?: string;
  } | null>(null);

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

  // Unread message badge
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByDoctor, setUnreadByDoctor] = useState<Record<number, number>>({});
  useEffect(() => {
    if (!userId) return;
    const fetchUnread = () => {
      chatService
        .getUnreadConversations(userId)
        .then((conversations) => {
          const byDoctor: Record<number, number> = {};
          let total = 0;
          conversations.forEach((conversation) => {
            const count = Number(conversation.unreadCount || 0);
            total += count;
            if (conversation.doctorId) {
              byDoctor[conversation.doctorId] =
                (byDoctor[conversation.doctorId] || 0) + count;
            }
          });
          setUnreadByDoctor(byDoctor);
          setUnreadCount(total);
        })
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    window.addEventListener(CHAT_UNREAD_UPDATED, fetchUnread);
    window.addEventListener('focus', fetchUnread);
    return () => {
      clearInterval(id);
      window.removeEventListener(CHAT_UNREAD_UPDATED, fetchUnread);
      window.removeEventListener('focus', fetchUnread);
    };
  }, [userId]);

  // Global call state — incoming call accepted anywhere in the app
  const [globalCallRoom, setGlobalCallRoom] = useState<string | null>(null);
  const [globalCallId, setGlobalCallId] = useState<number | null>(null);
  const myName = displayName || 'Usuario';

  const handleIncomingCallAccepted = (roomName: string, callId: number) => {
    setGlobalCallRoom(roomName);
    setGlobalCallId(callId);
  };

  const handleGlobalCallEnd = async () => {
    if (globalCallId) {
      try {
        await endCall(globalCallId);
      } catch { /* ignore */ }
    }
    setGlobalCallRoom(null);
    setGlobalCallId(null);
  };

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
    clearNavigationStorage(userType, userId);
    handleLogout();
  };

  const handleScheduleTreatmentFollowUp = (
    doctorId: number,
    date: string,
  ) => {
    setAppointmentPrefill({ doctorId, date });
    setSelectedDoctor(null);
    setCurrentView('appointments');
  };

  const handleScheduleDoctor = (doctorId: number) => {
    setAppointmentPrefill({ doctorId });
    setSelectedDoctor(null);
    setCurrentView('appointments');
  };

  const handleStartVideoCall = async (
    recipientUserId: number | null | undefined,
    roomName: string,
  ) => {
    if (!userId || !recipientUserId) {
      alert('No se pudo iniciar la videollamada porque falta el usuario receptor.');
      return;
    }

    try {
      const call = await initiateCall({
        callerUserId: userId,
        recipientUserId,
        roomName,
      });
      setGlobalCallId(call.callId);
      setGlobalCallRoom(call.roomName);
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('No se pudo iniciar la videollamada. Intenta nuevamente.');
    }
  };

  // Badge dot for Messages nav item
  const showBadge = unreadCount > 0;

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
                const isMessages = item.id === 'messages';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAppointmentPrefill(null);
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-primary'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {isMessages && showBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
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
                const isMessages = item.id === 'messages';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAppointmentPrefill(null);
                      setCurrentView(item.id);
                      setSelectedDoctor(null);
                      toggleMobileMenu();
                    }}
                    className={`relative w-full flex items-center gap-2 px-4 py-3 transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-primary'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    {isMessages && showBadge && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
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
                <h2 className="text-2xl font-semibold text-gray-900">
                  Bienvenido, {firstName}
                </h2>
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
                    unreadMessages={unreadByDoctor[doctor.id] ?? 0}
                    onMessage={() => handleDoctorClick(doctor.id)}
                    onVideoCall={() =>
                      handleStartVideoCall(
                        doctor.userId,
                        `vitalid-room-${doctor.id}-${userId || 'guest'}`,
                      )
                    }
                    onSchedule={() => handleScheduleDoctor(doctor.id)}
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
              <p className="text-gray-600">Monitorea, prescribe tratamientos y contacta a tus pacientes</p>
            </div>
            <DoctorDashboard mode="patients" />
          </div>
        )}

        {/* Patient messages: pick a doctor → open chat */}
        {currentView === 'messages' && userType === 'patient' && (
          <div className="space-y-6">
            {selectedDoctor ? (
              <div className="h-[calc(100vh-12rem)]">
                <ChatInterface
                  doctorId={selectedDoctor}
                  doctorName={doctors.find(d => d.id === selectedDoctor)?.name || ''}
                  doctorAvatar={doctors.find(d => d.id === selectedDoctor)?.avatar || ''}
                  messages={messages}
                  onBack={() => setSelectedDoctor(null)}
                  onMessagesUpdate={setMessages}
                  recipientUserId={doctors.find(d => d.id === selectedDoctor)?.userId ?? null}
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Mensajes</h2>
                <p className="text-gray-600 mb-6">Comunícate con tus doctores de forma segura y privada</p>
                {patientDoctors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                    <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Aun no tienes doctores disponibles para chat</p>
                    <p className="mt-1 text-sm">
                      Reserva una cita o inicia un tratamiento para habilitar la conversacion con ese doctor.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patientDoctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.id}
                        {...doctor}
                        unreadMessages={unreadByDoctor[doctor.id] ?? 0}
                        onMessage={() => handleDoctorClick(doctor.id)}
                        onVideoCall={() =>
                          handleStartVideoCall(
                            doctor.userId,
                            `vitalid-room-${doctor.id}-${userId || 'guest'}`,
                          )
                        }
                        onSchedule={() => handleScheduleDoctor(doctor.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Doctor messages: shows inbox of patient conversations */}
        {currentView === 'messages' && userType === 'doctor' && (
          <DoctorMessagesView
            doctors={doctors}
            userId={userId}
            onStartVideoCall={handleStartVideoCall}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView />
        )}
      </main>

      {/* Global incoming call notification — visible on any view */}
      <IncomingCallModal onAccepted={handleIncomingCallAccepted} />

      {/* Global call window — opened when an incoming call is accepted */}
      {globalCallRoom && (
        <JitsiCallModal
          roomName={globalCallRoom}
          displayName={myName}
          onClose={handleGlobalCallEnd}
        />
      )}

      <AiChatBubble />
    </div>
  );
}

/**
 * Doctor's inbox view.
 * Fix: loads ALL patients — no longer gated on treatments.
 * Patients who have unread messages are highlighted with a badge.
 */
function DoctorMessagesView({
  doctors,
  userId,
  onStartVideoCall,
}: {
  doctors: DoctorSummary[];
  userId: number | null;
  onStartVideoCall: (
    recipientUserId: number | null | undefined,
    roomName: string,
  ) => void;
}) {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedDoctorId, setResolvedDoctorId] = useState<number | null>(null);
  // Map of patientUserId → unread count, so we can show badges
  const [unreadByPatient, setUnreadByPatient] = useState<Record<number, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const myDoctor = doctors.find((doctor) => Number(doctor.userId) === Number(userId));
  const myDoctorId = myDoctor?.id ?? null;

  useEffect(() => {
    let mounted = true;
    if (!userId || !myDoctorId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      getPatientsByDoctor(myDoctorId),
      chatService
        .getUnreadConversations(userId)
        .catch(() => []),
    ])
      .then(([allPatients, unreadList]) => {
        if (!mounted) return;

        // Build unread map: senderUserId → count
        const unreadMap: Record<number, number> = {};
        unreadList.forEach((entry) => {
          if (entry.senderUserId) unreadMap[entry.senderUserId] = entry.unreadCount;
        });
        setUnreadByPatient(unreadMap);

        // Sort: patients with unread messages first
        const sorted = [...allPatients].sort((a, b) => {
          const aUnread = unreadMap[a.userId] ?? 0;
          const bUnread = unreadMap[b.userId] ?? 0;
          return bUnread - aUnread;
        });

        setPatients(sorted);
        setResolvedDoctorId(myDoctorId);
      })
      .catch((error) => {
        console.error('Error loading doctor conversations:', error);
        if (mounted) setPatients([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    const refreshOnUnreadChange = () => {
      chatService
        .getUnreadConversations(userId)
        .then((unreadList) => {
          if (!mounted) return;
          const unreadMap: Record<number, number> = {};
          unreadList.forEach((entry) => {
            if (entry.senderUserId) unreadMap[entry.senderUserId] = entry.unreadCount;
          });
          setUnreadByPatient(unreadMap);
        })
        .catch(() => {});
    };

    window.addEventListener(CHAT_UNREAD_UPDATED, refreshOnUnreadChange);

    return () => {
      mounted = false;
      window.removeEventListener(CHAT_UNREAD_UPDATED, refreshOnUnreadChange);
    };
  }, [userId, myDoctorId]);

  useEffect(() => {
    if (!resolvedDoctorId || !selectedPatient) return;
    chatService
      .getMessagesForDoctor(resolvedDoctorId, selectedPatient.userId)
      .then(setChatMessages)
      .catch(() => setChatMessages([]));
  }, [resolvedDoctorId, selectedPatient]);

  const filtered = searchTerm.trim()
    ? patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : patients;

  if (selectedPatient && resolvedDoctorId) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <ChatInterface
          doctorId={resolvedDoctorId}
          doctorName={selectedPatient.name}
          doctorAvatar={selectedPatient.avatar || ''}
          messages={chatMessages}
          onBack={() => setSelectedPatient(null)}
          onMessagesUpdate={setChatMessages}
          isDoctor
          chatPartnerUserId={selectedPatient.userId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Mensajes</h2>
        <p className="text-gray-600 mt-1">Conversaciones con tus pacientes</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar paciente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
      />

      {loading && <p className="text-gray-500 text-sm">Cargando conversaciones...</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Aun no tienes pacientes disponibles para chat</p>
          <p className="mt-1 text-sm">
            Apareceran cuando un paciente reserve una cita contigo o tenga un tratamiento asignado.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((patient) => {
            const unread = unreadByPatient[patient.userId] ?? 0;
            return (
              <article
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="relative cursor-pointer rounded-xl border border-primary bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {unread > 0 && (
                  <div className="absolute right-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-white">
                    {unread > 99 ? '99+' : unread}
                  </div>
                )}

                <div className="flex items-start gap-4 pr-10">
                  {patient.avatar ? (
                    <img
                      src={patient.avatar}
                      alt={patient.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound size={30} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900">
                      {patient.name}
                    </h3>
                    <p className="truncate text-sm text-gray-500">
                      {patient.email}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedPatient(patient);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white transition-colors hover:opacity-90"
                      >
                        <MessageCircle size={14} />
                        <span>Mensaje</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStartVideoCall(
                            patient.userId,
                            `vitalid-room-${myDoctorId}-${patient.userId}`,
                          );
                        }}
                        className="rounded-lg border border-gray-300 p-1.5 transition-colors hover:bg-gray-50"
                        title="Videollamada"
                      >
                        <Video size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


/**
 * Doctor's "Pacientes" view — Issues #5 & #6.
 * Doctor patient directory: show only patients assigned to the current doctor.
 */
function PatientsView({
  userId,
  doctors,
}: {
  userId: number | null;
  doctors: DoctorSummary[];
}) {
  const filterMode = 'mine';
  const [myPatients, setMyPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const myDoctor = doctors.find((d) => Number(d.userId) === Number(userId));
  const myDoctorId = myDoctor?.id ?? null;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (myDoctorId) {
      getPatientsByDoctor(myDoctorId)
        .then((data) => { if (mounted) setMyPatients(data); })
        .catch((err) => console.error('Error loading patients:', err))
        .finally(() => { if (mounted) setLoading(false); });
    } else {
      setMyPatients([]);
      setLoading(false);
    }

    return () => { mounted = false; };
  }, [myDoctorId]);

  const displayed = myPatients;
  const filtered = searchTerm.trim()
    ? displayed.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : displayed;

  return (
    <div className="space-y-6">
      {/* Header + filter toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Pacientes</h2>
          <p className="text-gray-600 text-sm mt-1">
            {`${filtered.length} pacientes con citas contigo`}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre o correo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
      />

      {loading && <p className="text-gray-500 text-sm">Cargando pacientes...</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          <Users size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {filterMode === 'mine'
              ? 'Aún no tienes pacientes con citas registradas'
              : 'No se encontraron pacientes'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-primary/40 transition-colors"
            >
              {patient.avatar ? (
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserRound size={24} className="text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{patient.name}</p>
                <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                {patient.bloodType && (
                  <span className="inline-block mt-1 text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">
                    {patient.bloodType}
                  </span>
                )}
              </div>
              {patient.city && (
                <p className="text-xs text-gray-400 shrink-0">{patient.city}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
