import { useState, useEffect } from 'react';
import { Pill, Clock, Check, X, AlertCircle, Plus } from 'lucide-react';
import { getMedicationsForPatient, takeDose, addSideEffect, MedicationResponse } from '../../services/medicationService';
import { usePatientDashboard } from '../../hooks/usePatientDashboard';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  pillsRemaining: number;
  sideEffects?: string[];
}

interface MedicationLog {
  medicationId: string;
  time: string;
  taken: boolean;
  notes?: string;
}

export function MedicationTracker() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = Number(localStorage.getItem('authUserId')) || null;
  const { summary: dashboardSummary } = usePatientDashboard(userId);

  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);

  const [showSideEffectModal, setShowSideEffectModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [sideEffectNote, setSideEffectNote] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      const userId = Number(localStorage.getItem('authUserId'));
      if (!userId) return;

      const data = await getMedicationsForPatient(userId);
      
      const mappedMedications: Medication[] = data.map(m => {
        // Derive times based on frequency string
        let times = ['08:00'];
        if (m.frequency.toLowerCase().includes('2')) {
          times = ['08:00', '20:00'];
        } else if (m.frequency.toLowerCase().includes('3')) {
          times = ['08:00', '14:00', '20:00'];
        }
        
        const sideEffectsArray = m.sideEffects ? m.sideEffects.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

        return {
          id: String(m.id),
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          times,
          pillsRemaining: m.pillsRemaining !== null ? m.pillsRemaining : 0,
          sideEffects: sideEffectsArray
        };
      });
      
      setMedications(mappedMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMedication = async (medicationId: string, time: string) => {
    // Only allow marking as taken, not untaken for this simplified version
    const existing = todayLogs.find(l => l.medicationId === medicationId && l.time === time);
    if (!existing || !existing.taken) {
      try {
        await takeDose(medicationId, { time, timestamp: new Date().toISOString() });
        setTodayLogs(logs => [...logs, { medicationId, time, taken: true }]);
        
        // Optimistically update pills remaining
        setMedications(meds => meds.map(m => {
          if (m.id === medicationId && m.pillsRemaining > 0) {
            return { ...m, pillsRemaining: m.pillsRemaining - 1 };
          }
          return m;
        }));
      } catch (error) {
        console.error('Error taking dose:', error);
      }
    }
  };

  const isTaken = (medicationId: string, time: string) => {
    return todayLogs.find(l => l.medicationId === medicationId && l.time === time)?.taken || false;
  };

  const handleAddSideEffect = async () => {
    if (!selectedMedication || !sideEffectNote.trim()) return;
    
    try {
      await addSideEffect(selectedMedication, sideEffectNote);
      // Optimistically update UI
      setMedications(meds => meds.map(m => {
        if (m.id === selectedMedication) {
          const currentEffects = m.sideEffects ? [...m.sideEffects] : [];
          return { ...m, sideEffects: [...currentEffects, sideEffectNote] };
        }
        return m;
      }));
    } catch (error) {
      console.error('Error adding side effect:', error);
    }

    setSideEffectNote('');
    setShowSideEffectModal(false);
    setSelectedMedication(null);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Cargando medicamentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Cumplimiento de Hoy</h2>
        <div className="text-4xl font-bold">{dashboardSummary.medicationCompliance}%</div>
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${dashboardSummary.medicationCompliance}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {medications.map((medication) => {
          const daysRemaining = Math.floor(medication.pillsRemaining / medication.times.length);
          const lowStock = daysRemaining <= 7;

          return (
            <div key={medication.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pill className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{medication.name}</h3>
                    <p className="text-sm text-gray-500">{medication.dosage} - {medication.frequency}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMedication(medication.id);
                    setShowSideEffectModal(true);
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Efecto secundario
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {medication.times.map((time) => {
                  const taken = isTaken(medication.id, time);
                  return (
                    <div
                      key={time}
                      onClick={() => toggleMedication(medication.id, time)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        taken
                          ? 'bg-green-100 border border-green-400'
                          : 'bg-gray-200 border border-gray-400 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">{time}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        taken ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        {taken && <Check size={16} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {medication.sideEffects && medication.sideEffects.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Efectos secundarios registrados:</p>
                  <div className="flex flex-wrap gap-2">
                    {medication.sideEffects.map((effect, idx) => (
                      <span key={idx} className="text-sm text-yellow-900">• {effect}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className={`p-3 rounded-lg flex items-start gap-3 ${
                lowStock ? 'bg-red-100 border border-red-400' : 'bg-gray-50'
              }`}>
                {lowStock && <AlertCircle className="text-red-700 flex-shrink-0" size={20} />}
                <div>
                  <p className={`text-sm font-medium ${lowStock ? 'text-red-900' : 'text-gray-700'}`}>
                    {medication.pillsRemaining} pastillas restantes ({daysRemaining} días)
                  </p>
                  {lowStock && (
                    <p className="text-sm text-red-700 mt-1">
                      ⚠️ Stock bajo - Comprar pronto
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => alert('La funcionalidad para registrar recetas requiere validación médica y estará disponible próximamente en tu cuenta de paciente.')}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
        <Plus size={20} />
        Registrar nueva receta
      </button>

      {showSideEffectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Registrar Efecto Secundario</h3>
              <button
                onClick={() => {
                  setShowSideEffectModal(false);
                  setSelectedMedication(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              value={sideEffectNote}
              onChange={(e) => setSideEffectNote(e.target.value)}
              placeholder="Describe el efecto secundario que experimentaste..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-32 focus:outline-none focus:border-teal-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSideEffectModal(false);
                  setSelectedMedication(null);
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSideEffect}
                className="flex-1 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
