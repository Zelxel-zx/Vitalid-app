import { Clock, CheckCircle2, AlertCircle, CirclePause, CircleX } from 'lucide-react';

interface TreatmentCardProps {
  title: string;
  doctor: string;
  status: 'active' | 'completed' | 'pending' | 'paused' | 'cancelled';
  progress: number;
  description?: string;
  endDate?: string;
  nextAppointment?: string;
  medications?: string[];
  onClick?: () => void;
}

export function TreatmentCard({ title, doctor, status, progress, description, endDate, nextAppointment, medications, onClick }: TreatmentCardProps) {
  const statusConfig = {
    active: { color: 'bg-teal-100 text-teal-700', icon: Clock, label: 'Activo' },
    completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completado' },
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pendiente' },
    paused: { color: 'bg-orange-100 text-orange-700', icon: CirclePause, label: 'Pausado' },
    cancelled: { color: 'bg-red-100 text-red-700', icon: CircleX, label: 'Cancelado' }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-primary bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Dr. {doctor}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.color} text-sm`}>
          <StatusIcon size={14} />
          <span>{config.label}</span>
        </div>
      </div>

      {description && <p className="mb-4 text-sm text-gray-600">{description}</p>}

      {endDate && (
        <div className={`mb-4 rounded-lg p-3 ${
          hasDateEnded(endDate)
            ? 'bg-green-50 text-green-800'
            : 'bg-blue-50 text-gray-700'
        }`}>
          <p className="text-sm">
            {hasDateEnded(endDate) ? 'Tratamiento finalizado' : 'Finaliza el'}
          </p>
          <p className="mt-1 text-sm font-medium">{formatEndDate(endDate)}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Progreso</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {nextAppointment && (
        <div className="mb-4 p-3 bg-teal-50 rounded-lg">
          <p className="text-sm text-gray-600">Próxima Cita</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{nextAppointment}</p>
        </div>
      )}

      {medications && medications.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Medicamentos Actuales</p>
          <div className="flex flex-wrap gap-2">
            {medications.map((med, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {med}
              </span>
            ))}
          </div>
        </div>
      )}
      {onClick && (
        <p className="mt-4 text-sm font-medium text-primary">Abrir checklist</p>
      )}
    </button>
  );
}

function hasDateEnded(date: string) {
  return date < getLocalDate();
}

function formatEndDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
