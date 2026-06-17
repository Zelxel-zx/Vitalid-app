import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
 * This bypasses the meet.jit.si lobby/moderator restrictions by:
 *  - Setting the user as a moderator via the isModerator flag
 *  - Disabling prejoin page and lobby via configOverwrite
 *  - Loading the call inline (no new tab needed)
 */
export function JitsiCallModal({ roomName, displayName, onClose }: JitsiCallModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Load the Jitsi External API script dynamically
    const existingScript = document.getElementById('jitsi-api');
    const initJitsi = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      try {
        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
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
            startAsModerator: true,
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
      script.src = 'https://meet.jit.si/external_api.js';
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

      {/* Jitsi iframe container */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
