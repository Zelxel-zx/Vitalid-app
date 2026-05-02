import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TreatmentCardProps {
  title: string;
  doctor: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  nextAppointment?: string;
  medications?: string[];
}

export function TreatmentCard({ title, doctor, status, progress, nextAppointment, medications }: TreatmentCardProps) {
  const statusConfig = {
    active: { color: 'bg-teal-100 text-teal-700', icon: Clock, label: 'Activo' },
    completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completado' },
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pendiente' }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
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
    </div>
  );
}
