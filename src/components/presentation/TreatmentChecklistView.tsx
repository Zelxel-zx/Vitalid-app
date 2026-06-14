import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, Package, Plus, TriangleAlert, X } from 'lucide-react';
import {
  addMedicationSideEffect,
  addMedicationStock,
  getTreatmentChecklist,
  markDoseTaken,
  revertDoseTaken,
  TreatmentChecklist,
} from '../../services/checklistService';

interface TreatmentChecklistViewProps {
  treatmentId: number;
  onBack: () => void;
}

export function TreatmentChecklistView({
  treatmentId,
  onBack,
}: TreatmentChecklistViewProps) {
  const [checklist, setChecklist] = useState<TreatmentChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingDose, setUpdatingDose] = useState<string | null>(null);
  const [stockMedication, setStockMedication] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [savingStock, setSavingStock] = useState(false);
  const [sideEffectMedication, setSideEffectMedication] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [sideEffectText, setSideEffectText] = useState('');
  const [savingSideEffect, setSavingSideEffect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = getLocalDate();

  const loadChecklist = useCallback(async () => {
    try {
      setError(null);
      const data = await getTreatmentChecklist(treatmentId, today);
      setChecklist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la checklist');
    } finally {
      setLoading(false);
    }
  }, [treatmentId, today]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const toggleDose = async (
    medicationId: number,
    scheduledTime: string,
    taken: boolean,
  ) => {
    const doseKey = `${medicationId}-${scheduledTime}`;
    try {
      setUpdatingDose(doseKey);
      setError(null);
      if (taken) {
        await revertDoseTaken(medicationId, scheduledTime, today);
      } else {
        await markDoseTaken(medicationId, scheduledTime, today);
      }
      await loadChecklist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la dosis');
    } finally {
      setUpdatingDose(null);
    }
  };

  const handleAddStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockMedication) return;

    const quantity = Number(stockQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Ingresa una cantidad válida mayor que cero.');
      return;
    }

    try {
      setSavingStock(true);
      setError(null);
      await addMedicationStock(stockMedication.id, quantity);
      setStockMedication(null);
      setStockQuantity('');
      await loadChecklist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el stock');
    } finally {
      setSavingStock(false);
    }
  };

  const handleAddSideEffect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sideEffectMedication || !sideEffectText.trim()) return;

    try {
      setSavingSideEffect(true);
      setError(null);
      await addMedicationSideEffect(
        sideEffectMedication.id,
        sideEffectText.trim(),
      );
      setSideEffectMedication(null);
      setSideEffectText('');
      await loadChecklist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el efecto secundario',
      );
    } finally {
      setSavingSideEffect(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-500">Cargando checklist...</div>;
  }

  if (!checklist) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'No se encontró la checklist del tratamiento.'}
        </div>
      </div>
    );
  }

  const percentage = Number(checklist.summary?.percentage) || 0;

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} />

      <div className="rounded-xl bg-primary p-6 text-white">
        <p className="text-sm text-white/80">Checklist de hoy</p>
        <h2 className="mt-1 text-2xl font-semibold">{checklist.treatmentTitle}</h2>
        <div className="mt-5 text-4xl font-bold">{percentage}%</div>
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div
            className="h-2 rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {checklist.medications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Este tratamiento aún no tiene medicamentos programados.
        </div>
      ) : (
        <div className="space-y-4">
          {checklist.medications.map((medication) => (
            <div
              key={medication.medicationId}
              className={`rounded-xl border bg-white p-5 ${
                getMedicationStatus(medication.startDate, medication.endDate) ===
                'ended'
                  ? 'border-green-200'
                  : 'border-primary'
              }`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h3 className="font-semibold text-gray-900">{medication.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {[medication.dosage, medication.instructions]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <MedicationPeriod
                    startDate={medication.startDate}
                    endDate={medication.endDate}
                  />
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      medication.lowStock ? 'text-red-700' : 'text-gray-600'
                    }`}
                  >
                    {medication.lowStock ? <TriangleAlert size={17} /> : <Package size={17} />}
                    {medication.pillsRemaining ?? 0} en stock
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStockMedication({
                          id: medication.medicationId,
                          name: medication.name,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      <Plus size={16} />
                      Registrar pastillas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSideEffectMedication({
                          id: medication.medicationId,
                          name: medication.name,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-600"
                    >
                      <TriangleAlert size={16} />
                      Registrar efecto
                    </button>
                  </div>
                </div>
              </div>

              {medication.sideEffects?.trim() && (
                <div className="mt-4 rounded-lg border border-amber-400/[0.94] bg-amber-100/[0.94] p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                    <TriangleAlert size={17} />
                    Efectos secundarios registrados
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {medication.sideEffects
                      .split(/[;,]/)
                      .map((effect) => effect.trim())
                      .filter(Boolean)
                      .map((effect, index) => (
                        <span
                          key={`${effect}-${index}`}
                          className="rounded-full border border-amber-400/[0.94] bg-amber-50/[0.94] px-3 py-1 text-sm font-medium text-amber-900"
                        >
                          {effect}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                {medication.doses.length === 0 &&
                  getMedicationStatus(
                    medication.startDate,
                    medication.endDate,
                  ) !== 'active' && (
                    <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                      Este medicamento no tiene dosis programadas para hoy.
                    </div>
                  )}
                {medication.doses.map((dose) => {
                  const doseKey = `${medication.medicationId}-${dose.scheduledTime}`;
                  const isUpdating = updatingDose === doseKey;
                  return (
                    <button
                      key={dose.scheduledTime}
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        toggleDose(
                          medication.medicationId,
                          dose.scheduledTime,
                          dose.taken,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                        dose.taken
                          ? 'border border-green-400/[0.94] bg-green-100/[0.94] text-green-950'
                          : 'border-2 border-primary/[0.34] bg-primary/[0.04] text-primary hover:border-primary/[0.94] hover:bg-primary/[0.14]'
                      } disabled:opacity-60`}
                    >
                      <span className="flex items-center gap-3 font-semibold">
                        <Clock3
                          size={18}
                          className={dose.taken ? 'text-green-700' : 'text-primary'}
                        />
                        {dose.scheduledTime}
                      </span>
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${
                          dose.taken
                            ? 'bg-green-700 text-white'
                            : 'border-2 border-primary/[0.54] bg-white'
                        }`}
                      >
                        {dose.taken && <Check size={17} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {stockMedication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAddStock}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Registrar pastillas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {stockMedication.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockMedication(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Cantidad de pastillas compradas
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                autoFocus
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Ej. 30"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStockMedication(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingStock}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {savingStock ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {sideEffectMedication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAddSideEffect}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Registrar efecto secundario
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {sideEffectMedication.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSideEffectMedication(null);
                  setSideEffectText('');
                }}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Describe el efecto secundario
              </span>
              <textarea
                required
                autoFocus
                maxLength={500}
                value={sideEffectText}
                onChange={(event) => setSideEffectText(event.target.value)}
                className="min-h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Ej. Mareo después de tomar la dosis"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSideEffectMedication(null);
                  setSideEffectText('');
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingSideEffect || !sideEffectText.trim()}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {savingSideEffect ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 font-medium text-primary hover:opacity-80"
    >
      <ArrowLeft size={19} />
      Volver a tratamientos
    </button>
  );
}

function MedicationPeriod({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const status = getMedicationStatus(startDate, endDate);
  const label =
    status === 'ended'
      ? 'Medicamento finalizado'
      : status === 'upcoming'
        ? 'Inicia el'
        : 'Finaliza el';
  const date = status === 'upcoming' ? startDate : endDate;

  return (
    <div
      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        status === 'ended'
          ? 'bg-green-100 text-green-700'
          : status === 'upcoming'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-primary/10 text-primary'
      }`}
    >
      {label}: {formatMedicationDate(date)}
    </div>
  );
}

function getMedicationStatus(startDate: string, endDate: string) {
  const today = getLocalDate();
  if (endDate && endDate < today) return 'ended';
  if (startDate && startDate > today) return 'upcoming';
  return 'active';
}

function formatMedicationDate(date: string) {
  if (!date) return 'Sin fecha definida';
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
