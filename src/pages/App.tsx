import { useState, useEffect } from 'react';
import { Home, MessageSquare, Activity, User, Menu, X, ClipboardList, Calendar, Users, MessageCircle } from 'lucide-react';
import { LoginScreen, DoctorCard, ChatInterface, ProgressChart, TreatmentsView, AppointmentBooking, AppointmentHistory, DoctorDashboard, PatientRegistrationForm, DoctorRegistrationForm } from '../components/presentation';
import { ProfileView } from '../components/presentation/ProfileView';
import { IncomingCallModal } from '../components/presentation/IncomingCallModal';
import { JitsiCallModal } from '../components/presentation/JitsiCallModal';
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
import { ConversationSummary, getChatConversations, DoctorSummary } from '../services/doctorService';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types';
import { getJson } from '../services/apiClient';

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
      key={localStorage.getItem('authUserId')}
      userType={userType}
      userName={userName}
      userId={Number(localStorage.getItem('authUserId')) || null}
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
  const { messages, setMessages } = useChat(selectedDoctor);
  const { bloodPressure, bloodSugar } = useHealthData();
  const { summary: dashboardSummary } = usePatientDashboard(
    userType === 'patient' ? userId : null,
  );
  const patientDoctorIds = usePatientDoctors(
    userType === 'patient' ? userId : null,
  );
  const patientDoctors = doctors.filter((doctor) => patientDoctorIds.has(doctor.id));
  const firstName = userName?.trim().split(/\s+/)[0] || 'Paciente';
  const [appointmentPrefill, setAppointmentPrefill] = useState<{
    doctorId: number;
    date: string;
  } | null>(null);

  // Unread message badge
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!userId) return;
    const fetchUnread = () => {
      getJson<{ count: number }>(`/chat/unread-count?receiverId=${userId}`)
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, [userId]);

  // Global call state — incoming call accepted anywhere in the app
  const [globalCallRoom, setGlobalCallRoom] = useState<string | null>(null);
  const [globalCallId, setGlobalCallId] = useState<number | null>(null);
  const myName = userName || 'Usuario';

  const handleIncomingCallAccepted = (roomName: string, callId: number) => {
    setGlobalCallRoom(roomName);
    setGlobalCallId(callId);
  };

  const handleGlobalCallEnd = async () => {
    if (globalCallId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/calls/${globalCallId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ENDED' }),
        });
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
                      if (isMessages) setUnreadCount(0);
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
                      if (isMessages) setUnreadCount(0);
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bienvenido, {firstName}</h2>

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

        {currentView === 'treatments' && (
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Monitoreo de Pacientes</h2>
              <p className="text-gray-600">Identifica pacientes en riesgo e interviene preventivamente</p>
            </div>
            <DoctorDashboard />
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

        {/* Doctor messages: shows inbox of patient conversations */}
        {currentView === 'messages' && userType === 'doctor' && (
          <DoctorMessagesView doctors={doctors} userId={userId} />
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
    </div>
  );
}

/**
 * Doctor's inbox view.
 * Finds the doctor's own entity ID, loads their patient conversation list,
 * and opens individual conversations with proper bidirectional messaging.
 */
function DoctorMessagesView({
  doctors,
  userId,
}: {
  doctors: DoctorSummary[];
  userId: number | null;
}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const myDoctor = doctors.find((d) => d.userId === userId);
  const myDoctorId = myDoctor?.id ?? null;

  useEffect(() => {
    if (!myDoctorId) return;
    getChatConversations(myDoctorId)
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [myDoctorId]);

  useEffect(() => {
    if (!myDoctorId || !selectedConv) return;
    chatService
      .getMessagesForDoctor(myDoctorId, selectedConv.patientUserId)
      .then(setChatMessages)
      .catch(console.error);
  }, [myDoctorId, selectedConv]);

  if (selectedConv && myDoctorId) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <ChatInterface
          doctorId={myDoctorId}
          doctorName={selectedConv.patientName}
          doctorAvatar=""
          messages={chatMessages}
          onBack={() => setSelectedConv(null)}
          onMessagesUpdate={setChatMessages}
          isDoctor
          chatPartnerUserId={selectedConv.patientUserId}
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

      {loading && <p className="text-gray-500 text-sm">Cargando conversaciones...</p>}

      {!loading && conversations.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin mensajes aún</p>
          <p className="text-sm mt-1">Los pacientes que te escriban aparecerán aquí.</p>
        </div>
      )}

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
        {conversations.map((conv) => (
          <button
            key={conv.patientUserId}
            onClick={() => setSelectedConv(conv)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">
                {conv.patientName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{conv.patientName}</p>
              <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString('es-ES') : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
