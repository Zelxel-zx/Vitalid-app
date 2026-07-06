import { useEffect, useRef } from 'react';
import { ExternalLink, Video, X } from 'lucide-react';
import {
  buildJitsiUrl,
  JITSI_DOMAIN,
  JITSI_EMBED_ENABLED,
} from '../../services/videoCallService';

interface JitsiCallModalProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

/**
 * Embeds a Jitsi Meet call in-app using the External API.
 * The Jitsi domain is configurable through VITE_JITSI_DOMAIN so the app can
 * use an instance that allows direct access without an external login.
 */
export function JitsiCallModal({ roomName, displayName, onClose }: JitsiCallModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const callUrl = buildJitsiUrl(roomName);

  useEffect(() => {
    if (!JITSI_EMBED_ENABLED) return;

    // Load the Jitsi External API script dynamically
    const existingScript = document.getElementById('jitsi-api');
    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      try {
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableLobbyChat: false,
            // Disable the lobby — the first user to join becomes moderator
            lobby: { enabled: false },
            // Skip the "waiting for moderator" step
            requireDisplayName: false,
          },
          interfaceConfigOverwrite: {
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
          },
          userInfo: {
            displayName: displayName || 'Usuario',
          },
        });

        apiRef.current.addEventListeners({
          readyToClose: onClose,
          videoConferenceLeft: onClose,
        });
      } catch (err) {
        console.error('Jitsi init error:', err);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'jitsi-api';
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    } else if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      existingScript.addEventListener('load', initJitsi);
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {/* ignore */}
        apiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  const openCall = () => {
    window.open(callUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white shrink-0">
        <span className="text-sm font-medium">Videollamada — {roomName}</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Cerrar llamada"
        >
          <X size={20} />
        </button>
      </div>

      {JITSI_EMBED_ENABLED ? (
        <div ref={containerRef} className="flex-1 w-full" />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-gray-100 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Video size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Videollamada lista
            </h2>
            <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
              Sala: {roomName}
            </p>
            <button
              type="button"
              onClick={openCall}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <ExternalLink size={18} />
              Entrar a la videollamada
            </button>
            <p className="mt-4 text-xs text-gray-500">
              Proveedor actual: {JITSI_DOMAIN}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
