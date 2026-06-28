import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Pill,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react';
import { getAllPatients, PatientResponse } from '../../services/patientService';
import { getAppointmentsForDoctor } from '../../services/appointmentService';
import { getAuthItem } from '../../services/authStorage';
import { getAllDoctors } from '../../services/doctorService';
import { sendEmail } from '../../services/notificationService';
import {
  addMedicationToTreatment,
  createTreatment,
  CreateMedicationInput,
  getMyTreatments,
  TreatmentResponse,
} from '../../services/treatmentService';
import {
  getTreatmentChecklist,
  TreatmentChecklist,
} from '../../services/checklistService';

type RiskLevel = 'high' | 'medium' | 'low';

interface DoctorPatient {
  patient: PatientResponse;
  treatments: TreatmentResponse[];
  compliance: number;
  takenDoses: number;
  missedDoses: number;
  riskLevel: RiskLevel;
  sideEffects: Array<{
    medication: string;
    effects: string[];
  }>;
}

interface TreatmentFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  nextAppointment: string;
}

const today = getLocalDate();
const defaultEndDate = addDays(today, 30);

const emptyMedication: CreateMedicationInput = {
  name: '',
  dosage: '',
  frequency: 'DIARIO',
  startDate: today,
  endDate: defaultEndDate,
  instructions: '',
  unitType: 'PILL',
  scheduledTimes: ['08:00'],
};

export function DoctorDashboard({
  mode = 'overview',
}: {
  mode?: 'overview' | 'patients';
}) {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionPatient, setPrescriptionPatient] =
    useState<DoctorPatient | null>(null);
  const [effectsPatient, setEffectsPatient] = useState<DoctorPatient | null>(
    null,
  );
  const [prescriptionMode, setPrescriptionMode] = useState<
    'treatments' | 'new-treatment' | 'new-medication'
  >('treatments');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(
    null,
  );
  const [treatmentForm, setTreatmentForm] = useState<TreatmentFormState>({
    title: '',
    description: '',
    startDate: today,
    endDate: defaultEndDate,
    nextAppointment: '',
  });
  const [medicationForm, setMedicationForm] =
    useState<CreateMedicationInput>(emptyMedication);
  const [scheduledTimesText, setScheduledTimesText] = useState('08:00');
  const [isSaving, setIsSaving] = useState(false);
  // Contact patient modal
  const [contactPatient, setContactPatient] = useState<DoctorPatient | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const loadPatients = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const [patientData, treatmentData, doctorData] = await Promise.all([
        getAllPatients(),
        getMyTreatments(),
        getAllDoctors(),
      ]);
      const authUserId = Number(getAuthItem('authUserId'));
      const currentDoctor = doctorData.find((doctor) => doctor.userId === authUserId);
      const appointmentData = currentDoctor
        ? await getAppointmentsForDoctor(currentDoctor.id)
        : [];

      // "patients" mode: show ALL patients so the doctor can prescribe to anyone
      // "overview" mode: only show patients with treatments or finished appointments (monitoring)
      let patientsToMap: PatientResponse[];
      if (mode === 'patients') {
        patientsToMap = patientData;
      } else {
        const assignedPatientIds = new Set(
          treatmentData.map((treatment) => treatment.patientId),
        );
        appointmentData
          .filter(isFinishedAppointment)
          .forEach((appointment) => assignedPatientIds.add(appointment.patientId));
        patientsToMap = patientData.filter((patient) => assignedPatientIds.has(patient.id));
      }

      const mapped = await Promise.all(
        patientsToMap.map((patient) =>
          buildDoctorPatient(
            patient,
            treatmentData.filter(
              (treatment) => treatment.patientId === patient.id,
            ),
          ),
        ),
      );
      setPatients(mapped);
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el monitoreo de pacientes.',
      );
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };


  useEffect(() => {
    loadPatients();

    const refreshPatients = () => loadPatients(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshPatients();
    };
    const intervalId = window.setInterval(refreshPatients, 15000);

    window.addEventListener('focus', refreshPatients);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshPatients);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return patients.filter(
      ({ patient, riskLevel }) =>
        (riskFilter === 'all' || riskLevel === riskFilter) &&
        (!term ||
          patient.name.toLowerCase().includes(term) ||
          patient.medicalHistory?.toLowerCase().includes(term)),
    );
  }, [patients, riskFilter, searchTerm]);

  const highRiskPatients = patients.filter(
    (patient) => patient.riskLevel === 'high',
  );
  const mediumRiskPatients = patients.filter(
    (patient) => patient.riskLevel === 'medium',
  );
  const lowRiskPatients = patients.filter(
    (patient) => patient.riskLevel === 'low',
  );
  const monitoredPatients = filteredPatients.filter(
    (patient) => patient.riskLevel !== 'high',
  );

  const openPrescriptionPanel = (patient: DoctorPatient) => {
    setPrescriptionPatient(patient);
    setPrescriptionMode('treatments');
    setSelectedTreatmentId(patient.treatments[0]?.id ?? null);
    resetForms();
  };

  const handleCreateTreatment = async (event: FormEvent) => {
    event.preventDefault();
    if (!prescriptionPatient) return;

    try {
      setIsSaving(true);
      setError(null);
      await createTreatment({
        patientId: prescriptionPatient.patient.id,
        title: treatmentForm.title.trim(),
        description: treatmentForm.description.trim(),
        status: 'ACTIVE',
        startDate: treatmentForm.startDate,
        endDate: treatmentForm.endDate,
        nextAppointment: treatmentForm.nextAppointment || undefined,
        medications: [buildMedicationPayload()],
      });
      closePrescriptionPanel();
      await loadPatients();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear el tratamiento.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMedication = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTreatmentId) return;

    try {
      setIsSaving(true);
      setError(null);
      await addMedicationToTreatment(
        selectedTreatmentId,
        buildMedicationPayload(),
      );
      closePrescriptionPanel();
      await loadPatients();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo agregar el medicamento.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const buildMedicationPayload = (): CreateMedicationInput => ({
    ...medicationForm,
    name: medicationForm.name.trim(),
    dosage: medicationForm.dosage.trim(),
    instructions: medicationForm.instructions.trim(),
    scheduledTimes: scheduledTimesText
      .split(',')
      .map((time) => time.trim())
      .filter(Boolean),
  });

  const resetForms = () => {
    setTreatmentForm({
      title: '',
      description: '',
      startDate: today,
      endDate: defaultEndDate,
      nextAppointment: '',
    });
    setMedicationForm(emptyMedication);
    setScheduledTimesText('08:00');
  };

  const closePrescriptionPanel = () => {
    setPrescriptionPatient(null);
    setPrescriptionMode('treatments');
    setSelectedTreatmentId(null);
    resetForms();
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-gray-500">
        Cargando monitoreo de pacientes...
      </div>
    );
  }

  if (mode === 'patients') {
    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl border border-primary bg-white p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o condición..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-primary"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(event.target.value as 'all' | RiskLevel)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-primary"
          >
            <option value="all">Todos los riesgos</option>
            <option value="high">Alto riesgo</option>
            <option value="medium">Riesgo medio</option>
            <option value="low">Bajo riesgo</option>
          </select>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
            No se encontraron pacientes.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPatients.map((patient) => (
              <DetailedPatientCard
                key={patient.patient.id}
                data={patient}
                onPrescribe={() => openPrescriptionPanel(patient)}
                onShowEffects={() => setEffectsPatient(patient)}
              />
            ))}
          </div>
        )}

        {prescriptionPatient && (
          <PrescriptionPanel
            patient={prescriptionPatient}
            mode={prescriptionMode}
            selectedTreatmentId={selectedTreatmentId}
            treatmentForm={treatmentForm}
            medicationForm={medicationForm}
            scheduledTimesText={scheduledTimesText}
            isSaving={isSaving}
            onClose={closePrescriptionPanel}
            onModeChange={setPrescriptionMode}
            onTreatmentSelect={setSelectedTreatmentId}
            onTreatmentFormChange={setTreatmentForm}
            onMedicationFormChange={setMedicationForm}
            onScheduledTimesChange={setScheduledTimesText}
            onCreateTreatment={handleCreateTreatment}
            onAddMedication={handleAddMedication}
          />
        )}

        {effectsPatient && (
          <SideEffectsPanel
            patient={effectsPatient}
            onClose={() => setEffectsPatient(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RiskSummary
          level="high"
          title="Alto Riesgo"
          count={highRiskPatients.length}
          description="Requieren intervención"
        />
        <RiskSummary
          level="medium"
          title="Riesgo Medio"
          count={mediumRiskPatients.length}
          description="Monitoreo cercano"
        />
        <RiskSummary
          level="low"
          title="Bajo Riesgo"
          count={lowRiskPatients.length}
          description="En buen control"
        />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Pacientes Críticos
        </h2>
        {highRiskPatients.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-500">
            No hay pacientes en estado crítico.
          </div>
        ) : (
          <div className="space-y-4">
            {highRiskPatients.map((patient) => (
              <CriticalPatientCard
                key={patient.patient.id}
                data={patient}
                onPrescribe={() => openPrescriptionPanel(patient)}
                onShowEffects={() => setEffectsPatient(patient)}
                onContact={() => {
                  setContactPatient(patient);
                  setEmailSubject(`Seguimiento - ${patient.patient.name}`);
                  setEmailBody('');
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Todos los Pacientes
          </h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o condición..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-primary md:w-80"
            />
          </div>
        </div>

        {monitoredPatients.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            No se encontraron pacientes de riesgo medio o bajo.
          </div>
        ) : (
          <div className="space-y-4">
            {monitoredPatients.map((patient) => (
              <PatientRow
                key={patient.patient.id}
                data={patient}
                onPrescribe={() => openPrescriptionPanel(patient)}
                onShowEffects={() => setEffectsPatient(patient)}
              />
            ))}
          </div>
        )}
      </section>

      {prescriptionPatient && (
        <PrescriptionPanel
          patient={prescriptionPatient}
          mode={prescriptionMode}
          selectedTreatmentId={selectedTreatmentId}
          treatmentForm={treatmentForm}
          medicationForm={medicationForm}
          scheduledTimesText={scheduledTimesText}
          isSaving={isSaving}
          onClose={closePrescriptionPanel}
          onModeChange={setPrescriptionMode}
          onTreatmentSelect={setSelectedTreatmentId}
          onTreatmentFormChange={setTreatmentForm}
          onMedicationFormChange={setMedicationForm}
          onScheduledTimesChange={setScheduledTimesText}
          onCreateTreatment={handleCreateTreatment}
          onAddMedication={handleAddMedication}
        />
      )}

      {effectsPatient && (
        <SideEffectsPanel
          patient={effectsPatient}
          onClose={() => setEffectsPatient(null)}
        />
      )}

      {/* Contact patient email modal */}
      {contactPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contactar paciente</h3>
                <p className="text-sm text-gray-500">{contactPatient.patient.email}</p>
              </div>
              <button onClick={() => setContactPatient(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Asunto</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                  placeholder="Asunto del correo"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Mensaje</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={5}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 resize-none"
                  placeholder="Escribe tu mensaje al paciente..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setContactPatient(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!emailSubject.trim() || !emailBody.trim()) {
                      alert('Por favor completa el asunto y el mensaje');
                      return;
                    }
                    setIsSendingEmail(true);
                    try {
                      await sendEmail(contactPatient.patient.email, emailSubject, emailBody);
                      setContactPatient(null);
                      alert('Correo enviado exitosamente. Revisa MailHog en http://localhost:8025');
                    } catch (err) {
                      console.error('Error sending email:', err);
                      alert('Error al enviar el correo. Verifica que el servidor está activo.');
                    } finally {
                      setIsSendingEmail(false);
                    }
                  }}
                  disabled={isSendingEmail}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  {isSendingEmail ? 'Enviando...' : 'Enviar correo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DoctorPatientsView() {
  return <DoctorDashboard mode="patients" />;
}

async function buildDoctorPatient(
  patient: PatientResponse,
  treatments: TreatmentResponse[],
): Promise<DoctorPatient> {
  const relevantTreatments = treatments.filter(
    (treatment) => treatment.status?.toUpperCase() !== 'CANCELLED',
  );
  const progressTreatments = relevantTreatments.filter(
    (treatment) => treatment.status?.toUpperCase() === 'ACTIVE',
  );
  const progressSource =
    progressTreatments.length > 0 ? progressTreatments : relevantTreatments;
  const compliance =
    progressSource.length === 0
      ? 0
      : Math.round(
          progressSource.reduce(
            (total, treatment) => total + (Number(treatment.progress) || 0),
            0,
          ) / progressSource.length,
        );

  const checklists = await Promise.allSettled(
    progressTreatments
      .filter(
        (treatment) =>
          (!treatment.startDate || treatment.startDate <= today) &&
          (!treatment.endDate || treatment.endDate >= today),
      )
      .map((treatment) => getTreatmentChecklist(treatment.id, today)),
  );
  const missedDoses = checklists
    .filter(
      (result): result is PromiseFulfilledResult<TreatmentChecklist> =>
        result.status === 'fulfilled',
    )
    .reduce(
      (total, result) =>
        total + (Number(result.value.summary.missedDoses) || 0),
      0,
    );
  const takenDoses = checklists
    .filter(
      (result): result is PromiseFulfilledResult<TreatmentChecklist> =>
        result.status === 'fulfilled',
    )
    .reduce(
      (total, result) =>
        total + (Number(result.value.summary.takenDoses) || 0),
      0,
    );

  const sideEffects = treatments.flatMap((treatment) =>
    (treatment.medications || [])
      .filter((medication) => medication.sideEffects?.trim())
      .map((medication) => ({
        medication: medication.name,
        effects: medication.sideEffects
          .split(/[;,]/)
          .map((effect) => effect.trim())
          .filter(Boolean),
      })),
  );

  return {
    patient,
    treatments,
    compliance,
    takenDoses,
    missedDoses,
    riskLevel: calculateRisk(missedDoses),
    sideEffects,
  };
}

function calculateRisk(missedDoses: number): RiskLevel {
  if (missedDoses >= 2) return 'high';
  if (missedDoses === 1) return 'medium';
  return 'low';
}

function isFinishedAppointment(appointment: {
  date: string;
  time: string;
  status: string;
}) {
  if (appointment.status?.toUpperCase() === 'CANCELLED') {
    return false;
  }
  if (!appointment.date || !appointment.time) {
    return false;
  }

  const appointmentEnd = new Date(`${appointment.date}T${appointment.time}`);
  if (Number.isNaN(appointmentEnd.getTime())) {
    return false;
  }
  appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30);
  return appointmentEnd <= new Date();
}

function RiskSummary({
  level,
  title,
  count,
  description,
}: {
  level: RiskLevel;
  title: string;
  count: number;
  description: string;
}) {
  const Icon =
    level === 'high'
      ? AlertTriangle
      : level === 'medium'
        ? Clock
        : CheckCircle2;
  const colors = {
    high: 'border-red-400 bg-red-50 text-red-700',
    medium: 'border-yellow-400 bg-yellow-50 text-yellow-700',
    low: 'border-green-400 bg-green-50 text-green-700',
  }[level];

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={20} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold">{count}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

function CriticalPatientCard({
  data,
  onPrescribe,
  onShowEffects,
  onContact,
}: {
  data: DoctorPatient;
  onPrescribe: () => void;
  onShowEffects: () => void;
  onContact?: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-red-400 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <PatientAvatar patient={data.patient} size="large" />
        <div className="flex-1">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h3 className="font-semibold text-gray-900">
                {data.patient.name}
              </h3>
              <p className="text-sm text-gray-600">
                {data.patient.medicalHistory || 'Sin historial clínico'}
              </p>
            </div>
            <RiskBadge level="high" />
          </div>

          <div className="my-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Cumplimiento general"
              value={`${data.compliance}%`}
              danger
            />
            <Metric
              label="Dosis tomadas hoy"
              value={String(data.takenDoses)}
            />
            <Metric
              label="Dosis omitidas hoy"
              value={String(data.missedDoses)}
              danger
            />
            <Metric
              label="Tratamientos"
              value={String(data.treatments.length)}
            />
          </div>

          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <strong>Alerta:</strong> el paciente tiene múltiples dosis
            programadas sin registrar.
          </div>

          <PatientActions
            critical
            onPrescribe={onPrescribe}
            onShowEffects={onShowEffects}
            onContact={onContact}
          />
        </div>
      </div>
    </div>
  );
}

function PatientRow({
  data,
  onPrescribe,
  onShowEffects,
}: {
  data: DoctorPatient;
  onPrescribe: () => void;
  onShowEffects: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row">
        <PatientAvatar patient={data.patient} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h3 className="font-medium text-gray-900">{data.patient.name}</h3>
              <p className="text-sm text-gray-600">
                {data.patient.medicalHistory || 'Sin historial clínico'}
              </p>
            </div>
            <RiskBadge level={data.riskLevel} />
          </div>
          <div className="my-3 flex flex-wrap gap-5 text-sm text-gray-600">
            <span>
              <strong>{data.compliance}%</strong> cumplimiento general
            </span>
            <span>
              <strong>{data.takenDoses}</strong> dosis tomadas hoy
            </span>
            <span>
              <strong>{data.missedDoses}</strong> dosis omitidas hoy
            </span>
            <span>
              <strong>{data.treatments.length}</strong> tratamientos
            </span>
          </div>
          <PatientActions
            onPrescribe={onPrescribe}
            onShowEffects={onShowEffects}
          />
        </div>
      </div>
    </div>
  );
}

function DetailedPatientCard({
  data,
  onPrescribe,
  onShowEffects,
}: {
  data: DoctorPatient;
  onPrescribe: () => void;
  onShowEffects: () => void;
}) {
  const activeTreatments = data.treatments.filter(
    (treatment) => treatment.status?.toUpperCase() === 'ACTIVE',
  );
  const completedTreatments = data.treatments.filter(
    (treatment) => treatment.status?.toUpperCase() === 'COMPLETED',
  );
  const nextAppointment = data.treatments
    .map((treatment) => treatment.nextAppointment)
    .filter((date): date is string => Boolean(date && date >= today))
    .sort()[0];

  return (
    <article className="rounded-xl border border-primary bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-5 lg:flex-row">
        <PatientAvatar patient={data.patient} size="large" />
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {data.patient.name}
              </h3>
              <p className="text-sm text-gray-500">{data.patient.email}</p>
            </div>
            <RiskBadge level={data.riskLevel} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ClinicalData label="Tipo de sangre" value={data.patient.bloodType} />
            <ClinicalData
              label="Fecha de nacimiento"
              value={formatDisplayDate(data.patient.dateOfBirth)}
            />
            <ClinicalData
              label="Dosis tomadas hoy"
              value={String(data.takenDoses)}
            />
            <ClinicalData
              label="Dosis omitidas hoy"
              value={String(data.missedDoses)}
            />
            <ClinicalData
              label="Próxima cita"
              value={
                nextAppointment
                  ? formatDisplayDate(nextAppointment)
                  : 'Sin cita programada'
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-300 bg-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-900">
                Historial médico
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {data.patient.medicalHistory || 'Sin historial registrado'}
              </p>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-100 p-4">
              <p className="text-sm font-semibold text-amber-900">Alergias</p>
              <p className="mt-2 text-sm text-amber-800">
                {data.patient.allergies || 'Sin alergias registradas'}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>
                <strong>{activeTreatments.length}</strong> activos
              </span>
              <span>
                <strong>{completedTreatments.length}</strong> finalizados
              </span>
              <span>
                <strong>{data.compliance}%</strong> progreso general
              </span>
            </div>

            <div className="space-y-3">
              {data.treatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="rounded-lg border border-gray-300 bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {treatment.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDisplayDate(treatment.startDate)} al{' '}
                        {formatDisplayDate(treatment.endDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {treatment.progress || 0}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(treatment.medications || []).length === 0 ? (
                      <span className="text-sm text-gray-500">
                        Sin medicamentos
                      </span>
                    ) : (
                      treatment.medications.map((medication) => (
                        <span
                          key={medication.id}
                          className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-800"
                        >
                          {medication.name} {medication.dosage}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PatientActions
            onPrescribe={onPrescribe}
            onShowEffects={onShowEffects}
          />
        </div>
      </div>
    </article>
  );
}

function ClinicalData({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-100 p-3">
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">
        {value || 'No registrado'}
      </p>
    </div>
  );
}

function PatientActions({
  critical = false,
  onPrescribe,
  onShowEffects,
  onContact,
}: {
  critical?: boolean;
  onPrescribe: () => void;
  onShowEffects: () => void;
  onContact?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {critical && (
        <button
          type="button"
          onClick={onContact}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors"
        >
          <MessageSquare size={17} />
          Contactar
        </button>
      )}
      <button
        type="button"
        onClick={onPrescribe}
        className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        <Pill size={17} />
        Recetar
      </button>
      <button
        type="button"
        disabled
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 opacity-50"
        title="Disponible próximamente"
      >
        <FileText size={17} />
        Historial médico
      </button>
      <button
        type="button"
        onClick={onShowEffects}
        className="flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
      >
        <TriangleAlert size={17} />
        Efectos secundarios
      </button>
    </div>
  );
}

function PrescriptionPanel({
  patient,
  mode,
  selectedTreatmentId,
  treatmentForm,
  medicationForm,
  scheduledTimesText,
  isSaving,
  onClose,
  onModeChange,
  onTreatmentSelect,
  onTreatmentFormChange,
  onMedicationFormChange,
  onScheduledTimesChange,
  onCreateTreatment,
  onAddMedication,
}: {
  patient: DoctorPatient;
  mode: 'treatments' | 'new-treatment' | 'new-medication';
  selectedTreatmentId: number | null;
  treatmentForm: TreatmentFormState;
  medicationForm: CreateMedicationInput;
  scheduledTimesText: string;
  isSaving: boolean;
  onClose: () => void;
  onModeChange: (
    mode: 'treatments' | 'new-treatment' | 'new-medication',
  ) => void;
  onTreatmentSelect: (id: number) => void;
  onTreatmentFormChange: (value: TreatmentFormState) => void;
  onMedicationFormChange: (value: CreateMedicationInput) => void;
  onScheduledTimesChange: (value: string) => void;
  onCreateTreatment: (event: FormEvent) => void;
  onAddMedication: (event: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Tratamientos de {patient.patient.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Revisa sus tratamientos o registra una nueva indicación.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={21} />
          </button>
        </div>

        {mode === 'treatments' && (
          <div className="space-y-4">
            {patient.treatments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-7 text-center">
                <p className="font-medium text-gray-900">
                  El paciente aún no tiene tratamientos
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Registra el primero para comenzar su seguimiento.
                </p>
              </div>
            ) : (
              patient.treatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {treatment.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {treatment.status} · {treatment.progress || 0}% de
                        progreso
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onTreatmentSelect(treatment.id);
                        onMedicationFormChange({
                          ...medicationForm,
                          startDate: treatment.startDate || today,
                          endDate: treatment.endDate || defaultEndDate,
                        });
                        onModeChange('new-medication');
                      }}
                      className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-blue-50"
                    >
                      Agregar medicamento
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {(treatment.medications || []).length === 0
                      ? 'Sin medicamentos'
                      : treatment.medications
                          .map((medication) => medication.name)
                          .join(', ')}
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => onModeChange('new-treatment')}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:opacity-90"
            >
              Nuevo tratamiento
            </button>
          </div>
        )}

        {mode === 'new-treatment' && (
          <form onSubmit={onCreateTreatment} className="space-y-4">
            <TextInput
              label="Nombre del tratamiento"
              value={treatmentForm.title}
              onChange={(title) =>
                onTreatmentFormChange({ ...treatmentForm, title })
              }
              placeholder="Ej. Control de hipertensión"
            />
            <TextArea
              label="Descripción"
              value={treatmentForm.description}
              onChange={(description) =>
                onTreatmentFormChange({ ...treatmentForm, description })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateInput
                label="Fecha de inicio"
                value={treatmentForm.startDate}
                onChange={(startDate) =>
                  onTreatmentFormChange({ ...treatmentForm, startDate })
                }
              />
              <DateInput
                label="Fecha de fin"
                value={treatmentForm.endDate}
                onChange={(endDate) =>
                  onTreatmentFormChange({ ...treatmentForm, endDate })
                }
              />
            </div>
            <DateInput
              label="Próxima cita (opcional)"
              value={treatmentForm.nextAppointment}
              required={false}
              onChange={(nextAppointment) =>
                onTreatmentFormChange({
                  ...treatmentForm,
                  nextAppointment,
                })
              }
            />
            <MedicationFields
              form={medicationForm}
              scheduledTimesText={scheduledTimesText}
              onChange={onMedicationFormChange}
              onScheduledTimesChange={onScheduledTimesChange}
            />
            <FormActions
              isSaving={isSaving}
              onCancel={() => onModeChange('treatments')}
              submitLabel="Crear tratamiento"
            />
          </form>
        )}

        {mode === 'new-medication' && selectedTreatmentId && (
          <form onSubmit={onAddMedication} className="space-y-4">
            <MedicationFields
              form={medicationForm}
              scheduledTimesText={scheduledTimesText}
              onChange={onMedicationFormChange}
              onScheduledTimesChange={onScheduledTimesChange}
            />
            <FormActions
              isSaving={isSaving}
              onCancel={() => onModeChange('treatments')}
              submitLabel="Agregar medicamento"
            />
          </form>
        )}
      </div>
    </div>
  );
}

function MedicationFields({
  form,
  scheduledTimesText,
  onChange,
  onScheduledTimesChange,
}: {
  form: CreateMedicationInput;
  scheduledTimesText: string;
  onChange: (value: CreateMedicationInput) => void;
  onScheduledTimesChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl bg-gray-50 p-4">
      <h4 className="font-semibold text-gray-900">Medicamento</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Nombre"
          value={form.name}
          onChange={(name) => onChange({ ...form, name })}
          placeholder="Ej. Losartán"
        />
        <TextInput
          label="Dosis"
          value={form.dosage}
          onChange={(dosage) => onChange({ ...form, dosage })}
          placeholder="Ej. 50 mg"
        />
        <TextInput
          label="Frecuencia"
          value={form.frequency}
          onChange={(frequency) => onChange({ ...form, frequency })}
          placeholder="Ej. DIARIO"
        />
        <TextInput
          label="Horarios separados por coma"
          value={scheduledTimesText}
          onChange={onScheduledTimesChange}
          placeholder="08:00, 20:00"
        />
        <DateInput
          label="Inicio"
          value={form.startDate}
          onChange={(startDate) => onChange({ ...form, startDate })}
        />
        <DateInput
          label="Fin"
          value={form.endDate}
          onChange={(endDate) => onChange({ ...form, endDate })}
        />
      </div>
      <TextArea
        label="Indicaciones"
        value={form.instructions}
        onChange={(instructions) => onChange({ ...form, instructions })}
      />
    </div>
  );
}

function SideEffectsPanel({
  patient,
  onClose,
}: {
  patient: DoctorPatient;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Efectos secundarios
            </h3>
            <p className="text-sm text-gray-500">{patient.patient.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        {patient.sideEffects.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            El paciente no ha registrado efectos secundarios.
          </p>
        ) : (
          <div className="space-y-3">
            {patient.sideEffects.map((item, index) => (
              <div
                key={`${item.medication}-${index}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-medium text-amber-900">{item.medication}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.effects.map((effect) => (
                    <span
                      key={effect}
                      className="rounded-full bg-white px-3 py-1 text-sm text-amber-800"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientAvatar({
  patient,
  size = 'normal',
}: {
  patient: PatientResponse;
  size?: 'normal' | 'large';
}) {
  return (
    <img
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
        patient.name || 'Paciente',
      )}&background=E0F2FE&color=0369A1`}
      alt={patient.name}
      className={`${size === 'large' ? 'h-16 w-16' : 'h-14 w-14'} rounded-full`}
    />
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    high: {
      label: 'Alto riesgo',
      classes: 'border-red-200 bg-red-100 text-red-700',
      Icon: AlertTriangle,
    },
    medium: {
      label: 'Riesgo medio',
      classes: 'border-yellow-200 bg-yellow-100 text-yellow-700',
      Icon: Clock,
    },
    low: {
      label: 'Bajo riesgo',
      classes: 'border-green-200 bg-green-100 text-green-700',
      Icon: CheckCircle2,
    },
  }[level];
  return (
    <span
      className={`flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-sm ${config.classes}`}
    >
      <config.Icon size={15} />
      {config.label}
    </span>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-100 p-3">
      <p className="mb-1 text-xs text-gray-600">{label}</p>
      <p
        className={`text-lg font-semibold ${
          danger ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <textarea
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        type="date"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  );
}

function FormActions({
  isSaving,
  onCancel,
  submitLabel,
}: {
  isSaving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
      >
        Volver
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {isSaving ? 'Guardando...' : submitLabel}
      </button>
    </div>
  );
}

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getDateValue(date);
}

function getDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date?: string) {
  if (!date) return 'No registrada';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
