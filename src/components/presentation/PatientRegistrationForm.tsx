import { ChangeEvent, useEffect, useState } from 'react';
import {
  Camera,
  CalendarDays,
  Droplets,
  FileText,
  HeartPulse,
  MapPin,
  UserRound,
} from 'lucide-react';
import logo from '../../images/Logo (1).svg';
import {
  createPatient,
  CreatePatientInput,
} from '../../services/patientService';

interface PatientRegistrationFormProps {
  onComplete: () => void;
  onLogout: () => void;
}

type FormErrors = Partial<Record<keyof CreatePatientInput, string>>;

const initialForm: CreatePatientInput = {
  dateOfBirth: '',
  bloodType: '',
  avatar: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  medicalHistory: '',
  allergies: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PatientRegistrationForm({
  onComplete,
  onLogout,
}: PatientRegistrationFormProps) {
  const [form, setForm] = useState<CreatePatientInput>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const updateField = (field: keyof CreatePatientInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Selecciona un archivo de imagen válido.');
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoName(file.name);
    setSubmitError(null);

    // La API guarda una URL; el archivo se enviará al implementar el servicio de subida.
    updateField('avatar', '');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = 'Ingresa tu fecha de nacimiento';
    } else if (form.dateOfBirth > today) {
      nextErrors.dateOfBirth = 'La fecha no puede estar en el futuro';
    }
    if (!form.bloodType) nextErrors.bloodType = 'Selecciona tu tipo de sangre';
    if (!form.address.trim()) nextErrors.address = 'Ingresa tu dirección';
    if (!form.city.trim()) nextErrors.city = 'Ingresa tu ciudad';
    if (!form.state.trim()) nextErrors.state = 'Ingresa tu estado o región';
    if (!form.zipCode.trim()) nextErrors.zipCode = 'Ingresa tu código postal';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await createPatient({
        ...form,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        medicalHistory: form.medicalHistory.trim(),
        allergies: form.allergies.trim(),
      });
      onComplete();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar tus datos. Inténtalo nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="Vitalid Logo" className="h-16 w-16 object-contain" />
            <div>
              <p className="text-lg font-bold text-gray-900">Vitalid App</p>
              <p className="text-sm text-gray-500">Registro de paciente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cerrar sesión
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-primary to-cyan-500 px-6 py-8 text-white sm:px-10">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <HeartPulse size={24} />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Completa tu perfil médico</h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50 sm:text-base">
              Esta información nos ayuda a personalizar tu atención y mantener tus
              datos de salud organizados.
            </p>
          </div>

          <div className="space-y-8 p-6 sm:p-10">
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <section>
              <div className="mb-5 flex items-center gap-2">
                <Camera className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">Foto de perfil</h2>
              </div>
              <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 sm:flex-row">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Vista previa del perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={46} />
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-primary shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">
                    <Camera size={18} />
                    Seleccionar foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    {photoName || 'JPG, PNG o WEBP.'}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    La foto se guardará cuando implementemos la subida por URL.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-2">
                <Droplets className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">Información médica</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Fecha de nacimiento" error={errors.dateOfBirth}>
                  <div className="relative">
                    <CalendarDays
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={19}
                    />
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(event) => updateField('dateOfBirth', event.target.value)}
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </Field>

                <Field label="Tipo de sangre" error={errors.bloodType}>
                  <select
                    value={form.bloodType}
                    onChange={(event) => updateField('bloodType', event.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    {bloodTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-2">
                <MapPin className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">Dirección</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Dirección" error={errors.address}>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(event) => updateField('address', event.target.value)}
                      className={inputClass}
                      placeholder="Calle, número y referencia"
                      required
                    />
                  </Field>
                </div>
                <Field label="Ciudad" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    className={inputClass}
                    placeholder="Tu ciudad"
                    required
                  />
                </Field>
                <Field label="Estado o región" error={errors.state}>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value)}
                    className={inputClass}
                    placeholder="Tu estado o región"
                    required
                  />
                </Field>
                <Field label="Código postal" error={errors.zipCode}>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(event) => updateField('zipCode', event.target.value)}
                    className={inputClass}
                    placeholder="Código postal"
                    required
                  />
                </Field>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-2">
                <FileText className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">Antecedentes</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Historial médico" hint="Opcional">
                  <textarea
                    value={form.medicalHistory}
                    onChange={(event) => updateField('medicalHistory', event.target.value)}
                    className={`${inputClass} min-h-28 resize-y`}
                    placeholder="Enfermedades, cirugías o tratamientos anteriores"
                  />
                </Field>
                <Field label="Alergias" hint="Opcional">
                  <textarea
                    value={form.allergies}
                    onChange={(event) => updateField('allergies', event.target.value)}
                    className={`${inputClass} min-h-28 resize-y`}
                    placeholder="Medicamentos, alimentos u otras alergias"
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Tus datos médicos se almacenan de forma segura.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-7 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Guardando información...' : 'Completar registro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
