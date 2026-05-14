import { MessageCircle, Video, Calendar } from 'lucide-react';

interface DoctorCardProps {
  name: string;
  specialty: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  unreadMessages?: number;
  onClick: () => void;
}

export function DoctorCard({ name, specialty, avatar, status, unreadMessages, onClick }: DoctorCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-yellow-500'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={avatar || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'}
            alt={name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${statusColors[(status?.toLowerCase() as keyof typeof statusColors) || 'offline']}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500">{specialty}</p>

          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:opacity-90 transition-colors text-sm">
              <MessageCircle size={14} />
              <span>Mensaje</span>
            </button>
            <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Videollamada">
              <Video size={16} className="text-gray-600" />
            </button>
            <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Agendar cita">
              <Calendar size={16} className="text-gray-600" />
            </button>
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
