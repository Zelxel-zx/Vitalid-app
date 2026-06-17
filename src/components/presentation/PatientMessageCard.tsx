import { MessageCircle, User, Video } from 'lucide-react';

interface PatientMessageCardProps {
  name: string;
  email: string;
  avatar?: string;
  onClick: () => void;
}

export function PatientMessageCard({
  name,
  email,
  avatar,
  onClick,
}: PatientMessageCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      className="w-full rounded-xl border border-primary bg-white p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={30} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-gray-900">{name}</h3>
          <p className="truncate text-sm text-gray-500">{email}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClick();
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white"
            >
              <MessageCircle size={14} />
              Mensaje
            </button>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center rounded-lg border border-gray-300 p-1.5 text-gray-600"
              title="Videollamada"
            >
              <Video size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
