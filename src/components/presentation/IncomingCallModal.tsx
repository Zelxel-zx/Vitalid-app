import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getJson, putJson } from '../../services/apiClient';

interface IncomingCall {
  callId: number;
  callerName: string;
  callerUserId: number;
  roomName: string;
  status: string;
}

interface IncomingCallModalProps {
  onAccepted: (roomName: string, callId: number) => void;
}

/**
 * Polls /calls/incoming every 3 seconds for the logged-in user.
 * Shows a ringing notification when a call is received.
 * On Accept → fires onAccepted with the Jitsi room name.
 */
export function IncomingCallModal({ onAccepted }: IncomingCallModalProps) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [ringing, setRinging] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const userId = localStorage.getItem('authUserId');

  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      try {
        const calls = await getJson<IncomingCall[]>(`/calls/incoming?recipientUserId=${userId}`);
        if (calls && calls.length > 0) {
          setIncomingCall(calls[0]);
          setRinging(true);
        } else {
          // Call was cancelled
          setIncomingCall(null);
          setRinging(false);
        }
      } catch {
        // Ignore network errors during polling
      }
    };

    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  // Pulse animation via CSS class changes
  useEffect(() => {
    if (!ringing) return;
    // Auto-dismiss after 45s (matches server-side expiry)
    const timeout = setTimeout(() => {
      setIncomingCall(null);
      setRinging(false);
    }, 45000);
    return () => clearTimeout(timeout);
  }, [ringing]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    try {
      await putJson(`/calls/${incomingCall.callId}/status`, { status: 'ACCEPTED' });
    } catch {/* ignore */}
    onAccepted(incomingCall.roomName, incomingCall.callId);
    setIncomingCall(null);
    setRinging(false);
  };

  const handleReject = async () => {
    if (!incomingCall) return;
    try {
      await putJson(`/calls/${incomingCall.callId}/status`, { status: 'REJECTED' });
    } catch {/* ignore */}
    setIncomingCall(null);
    setRinging(false);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center">
        <span className="absolute w-40 h-40 rounded-full bg-green-400/20 animate-ping" />
        <span className="absolute w-56 h-56 rounded-full bg-green-400/10 animate-ping [animation-delay:0.3s]" />

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 w-80">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/30">
            <span className="text-primary font-bold text-3xl">
              {incomingCall.callerName?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Llamada entrante</p>
            <h2 className="text-xl font-bold text-gray-900">{incomingCall.callerName}</h2>
          </div>

          {/* Video icon indicator */}
          <div className="flex items-center gap-2 text-gray-400">
            <Video size={16} />
            <span className="text-sm">Videollamada</span>
          </div>

          {/* Accept / Reject */}
          <div className="flex items-center gap-8">
            <button
              onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Rechazar"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce"
              title="Aceptar"
            >
              <Phone size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
