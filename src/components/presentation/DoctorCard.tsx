import { MessageCircle, Video, Calendar, UserRound } from 'lucide-react';
import { formatDoctorName } from '../../services/doctorService';

interface DoctorCardProps {
  name: string;
  specialty: string;
  avatar: string;
  status?: 'online' | 'offline' | 'busy';
  unreadMessages?: number;
  onClick?: () => void;
  onMessage?: () => void;
  onVideoCall?: () => void;
  onSchedule?: () => void;
  showSchedule?: boolean;
}

export function DoctorCard({
  name,
  specialty,
  avatar,
  unreadMessages,
  onClick,
  onMessage,
  onVideoCall,
  onSchedule,
  showSchedule = true,
}: DoctorCardProps) {
  const displayName = formatDoctorName(name);
  const handleMessage = onMessage || onClick;

  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''} rounded-xl border border-primary bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound size={30} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
          <p className="text-sm text-gray-500">{specialty}</p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleMessage?.();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm"
            >
              <MessageCircle size={14} />
              <span>Mensaje</span>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onVideoCall?.();
              }}
              className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Videollamada"
            >
              <Video size={16} className="text-gray-600" />
            </button>
            {showSchedule && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSchedule?.();
                }}
                className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Agendar cita"
              >
                <Calendar size={16} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {unreadMessages && unreadMessages > 0 && (
          <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
            {unreadMessages}
          </div>
        )}
      </div>
    </div>
  );
}
