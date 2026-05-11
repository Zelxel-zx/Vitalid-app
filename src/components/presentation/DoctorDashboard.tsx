import { useState } from 'react';
import { AlertTriangle, TrendingDown, CheckCircle2, Clock, FileText, Pill, X } from 'lucide-react';
import { downloadPatientReport } from '../../services/reportService';
import { createMedication } from '../../services/medicationService';

interface PatientStatus {
  id: string;
  name: string;
  avatar: string;
  condition: string;
  riskLevel: 'high' | 'medium' | 'low';
  compliance: number;
  lastUpdate: string;
  missedDoses: number;
}

export function DoctorDashboard() {
  const patients: PatientStatus[] = [
    {
      id: '1',
      name: 'John Anderson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      condition: 'Hipertensión + Diabetes',
      riskLevel: 'high',
      compliance: 45,
      lastUpdate: 'Hace 2 días',
      missedDoses: 6
    },
    {
      id: '2',
      name: 'Maria Garcia',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      condition: 'Hipertensión',
      riskLevel: 'medium',
      compliance: 75,
      lastUpdate: 'Hace 1 día',
      missedDoses: 3
    },
    {
      id: '3',
      name: 'Robert Chen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      condition: 'Control post-operatorio',
      riskLevel: 'low',
      compliance: 95,
      lastUpdate: 'Hace 2 horas',
      missedDoses: 0
    },
    {
      id: '4',
      name: 'Linda Martinez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      condition: 'Diabetes Tipo 2',
      riskLevel: 'high',
      compliance: 50,
      lastUpdate: 'Hace 3 días',
      missedDoses: 5
    }
  ];

  const highRiskPatients = patients.filter(p => p.riskLevel === 'high');
  const mediumRiskPatients = patients.filter(p => p.riskLevel === 'medium');
  const lowRiskPatients = patients.filter(p => p.riskLevel === 'low');

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return <AlertTriangle size={16} />;
      case 'medium':
        return <Clock size={16} />;
      case 'low':
        return <CheckCircle2 size={16} />;
    }
  };

  const handleContactPatient = (patientId: string) => {
    console.log('Contactando paciente:', patientId);
    alert('Iniciando contacto con el paciente');
  };

  // Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('1 vez al día');
  const [newMedTotalPills, setNewMedTotalPills] = useState(30);

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Assuming selectedPatientId maps to the user ID since this is mock data
      await createMedication(Number(selectedPatientId), {
        patientId: 0,
        name: newMedName,
        dosage: newMedDosage,
        frequency: newMedFrequency,
        totalPills: newMedTotalPills,
        startDate,
        endDate
      });

      alert('Receta enviada exitosamente al paciente');
      setShowPrescriptionModal(false);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedTotalPills(30);
    } catch (error) {
      console.error('Error prescribing:', error);
      alert('Error al recetar. Es posible que este paciente de prueba no exista en la base de datos.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle size={20} />
            <h3 className="font-semibold">Alto Riesgo</h3>
          </div>
          <p className="text-3xl font-bold text-red-900">{highRiskPatients.length}</p>
          <p className="text-sm text-red-600 mt-1">Requieren intervención</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <Clock size={20} />
            <h3 className="font-semibold">Riesgo Medio</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-900">{mediumRiskPatients.length}</p>
          <p className="text-sm text-yellow-600 mt-1">Monitoreo cercano</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle2 size={20} />
            <h3 className="font-semibold">Bajo Riesgo</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{lowRiskPatients.length}</p>
          <p className="text-sm text-green-600 mt-1">En buen control</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pacientes Críticos</h2>
        <div className="space-y-4">
          {highRiskPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-xl border-2 border-red-200 p-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.condition}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getRiskColor(patient.riskLevel)}`}>
                      {getRiskIcon(patient.riskLevel)}
                      <span>Alto Riesgo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Cumplimiento</p>
                      <p className="text-lg font-semibold text-red-600">{patient.compliance}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Dosis omitidas</p>
                      <p className="text-lg font-semibold text-red-600">{patient.missedDoses}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Última actividad</p>
                      <p className="text-sm font-medium text-gray-900">{patient.lastUpdate}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                      <TrendingDown className="text-red-500" size={24} />
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-800">
                      <strong>⚠️ Alerta:</strong> Este paciente ha omitido múltiples dosis y no ha registrado actividad reciente. Se recomienda intervención inmediata.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleContactPatient(patient.id)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
                    >
                      Contactar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setShowPrescriptionModal(true);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                      title="Recetar Medicamento"
                    >
                      <Pill size={18} />
                      Recetar
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await downloadPatientReport(Number(patient.id));
                        } catch (error) {
                          alert('Error al descargar historial');
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      title="Descargar Historial Médico"
                    >
                      <FileText size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Todos los Pacientes</h2>
        <div className="space-y-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="w-14 h-14 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.condition}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setShowPrescriptionModal(true);
                        }}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Recetar Medicamento"
                      >
                        <Pill size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await downloadPatientReport(Number(patient.id));
                          } catch (error) {
                            alert('Error al descargar historial');
                          }
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Descargar Historial Médico"
                      >
                        <FileText size={18} />
                      </button>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRiskColor(patient.riskLevel)}`}>
                        {getRiskIcon(patient.riskLevel)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{patient.compliance}%</span> cumplimiento
                    </div>
                    <div>
                      {patient.missedDoses} dosis omitidas
                    </div>
                    <div>
                      {patient.lastUpdate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recetar a Paciente</h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePrescribe} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Medicamento</label>
                <input 
                  type="text" 
                  required
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  placeholder="Ej. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Dosis</label>
                <input 
                  type="text" 
                  required
                  value={newMedDosage}
                  onChange={e => setNewMedDosage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                  placeholder="Ej. 500mg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Frecuencia</label>
                <select 
                  value={newMedFrequency}
                  onChange={e => setNewMedFrequency(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="1 vez al día">1 vez al día</option>
                  <option value="2 veces al día">2 veces al día</option>
                  <option value="3 veces al día">3 veces al día</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total de Pastillas en la Caja</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={newMedTotalPills}
                  onChange={e => setNewMedTotalPills(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Enviar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
