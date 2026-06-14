import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTreatments } from '../../hooks/useTreatments';
import { TreatmentCard } from './TreatmentCard';
import { TreatmentChecklistView } from './TreatmentChecklistView';
import {
  getDailyTreatmentsCompliance,
  MEDICATION_COMPLIANCE_UPDATED,
} from '../../services/checklistService';

type TreatmentStatus = 'active' | 'completed' | 'pending' | 'paused' | 'cancelled';

export function TreatmentsView() {
  const { treatments, loading, error, refresh } = useTreatments();
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [todayCompliance, setTodayCompliance] = useState(0);

  const loadTodayCompliance = useCallback(async () => {
    setTodayCompliance(await getDailyTreatmentsCompliance(treatments));
  }, [treatments]);

  useEffect(() => {
    loadTodayCompliance();
    window.addEventListener(
      MEDICATION_COMPLIANCE_UPDATED,
      loadTodayCompliance,
    );

    return () => {
      window.removeEventListener(
        MEDICATION_COMPLIANCE_UPDATED,
        loadTodayCompliance,
      );
    };
  }, [loadTodayCompliance]);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Cargando tratamientos...</div>;
  }

  if (selectedTreatmentId) {
    return (
      <TreatmentChecklistView
        treatmentId={selectedTreatmentId}
        onBack={() => {
          setSelectedTreatmentId(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-cyan-500 p-6 text-white">
        <h2 className="mb-2 text-xl font-semibold">Cumplimiento de Hoy</h2>
        <div className="text-4xl font-bold">{todayCompliance}%</div>
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div
            className="h-2 rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, todayCompliance))}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && treatments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <ClipboardList className="mx-auto mb-3 text-gray-400" size={40} />
          <h3 className="font-semibold text-gray-900">Aún no tienes tratamientos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tus tratamientos aparecerán aquí cuando un doctor los registre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {treatments.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              title={treatment.title}
              doctor={treatment.doctorName}
              status={normalizeStatus(treatment.status)}
              progress={Number(treatment.progress) || 0}
              description={treatment.description}
              endDate={treatment.endDate}
              nextAppointment={formatDate(treatment.nextAppointment)}
              medications={(treatment.medications || []).map((medication) =>
                [medication.name, medication.dosage].filter(Boolean).join(' '),
              )}
              onClick={() => setSelectedTreatmentId(treatment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeStatus(status: string): TreatmentStatus {
  const normalized = status?.toLowerCase();
  if (
    normalized === 'active' ||
    normalized === 'completed' ||
    normalized === 'pending' ||
    normalized === 'paused' ||
    normalized === 'cancelled'
  ) {
    return normalized;
  }
  return 'pending';
}

function formatDate(date?: string) {
  if (!date) return undefined;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
