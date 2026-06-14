import { ChangeEvent, useEffect, useState } from 'react';
import {
  BriefcaseMedical,
  Camera,
  Clock3,
  GraduationCap,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import logo from '../../images/Logo (1).svg';
import {
  createDoctorProfile,
  CreateDoctorInput,
} from '../../services/doctorService';

interface DoctorRegistrationFormProps {
  onComplete: () => void;
  onLogout: () => void;
}

type FormErrors = Partial<Record<keyof CreateDoctorInput, string>>;

const initialForm: CreateDoctorInput = {
  specialty: '',
  avatar: '',
  medicalCenterAddress: '',
  experienceYears: 0,
  availabilityStart: '09:00',
  availabilityEnd: '17:00',
};

export function DoctorRegistrationForm({
  onComplete,
  onLogout,
}: DoctorRegistrationFormProps) {
  const [form, setForm] = useState(initialForm);
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

  const updateField = (
    field: keyof CreateDoctorInput,
    value: string | number,
  ) => {
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

    // La API requiere una URL. La imagen se enviará cuando exista el servicio de subida.
    updateField('avatar', '');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.specialty.trim()) {
      nextErrors.specialty = 'Ingresa tu especialidad';
    }
    if (!form.medicalCenterAddress.trim()) {
      nextErrors.medicalCenterAddress = 'Ingresa la dirección del centro médico';
    }
    if (form.experienceYears < 0) {
      nextErrors.experienceYears = 'Los años no pueden ser negativos';
    }
    if (!form.availabilityStart) {
      nextErrors.availabilityStart = 'Selecciona una hora de inicio';
    }
    if (!form.availabilityEnd) {
      nextErrors.availabilityEnd = 'Selecciona una hora de fin';
    } else if (
      form.availabilityStart &&
      form.availabilityEnd <= form.availabilityStart
    ) {
      nextErrors.availabilityEnd = 'La hora de fin debe ser posterior al inicio';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await createDoctorProfile({
        ...form,
        specialty: form.specialty.trim(),
        medicalCenterAddress: form.medicalCenterAddress.trim(),
      });
      onComplete();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar tu perfil profesional.',
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
              <p className="text-sm text-gray-500">Registro de doctor</p>
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
              <Stethoscope size={24} />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Completa tu perfil profesional
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50 sm:text-base">
              Añade tu especialidad, experiencia y horario de atención.
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
                    La foto se previsualiza, pero se guardará cuando implementemos la subida por URL.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-2">
                <BriefcaseMedical className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">
                  Información profesional
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Especialidad" error={errors.specialty}>
                  <input
                    type="text"
                    value={form.specialty}
                    onChange={(event) => updateField('specialty', event.target.value)}
                    className={inputClass}
                    placeholder="Ej. Cardiología"
                    maxLength={100}
                    required
                  />
                </Field>
                <Field label="Años de experiencia" error={errors.experienceYears}>
                  <div className="relative">
                    <GraduationCap
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={19}
                    />
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(event) =>
                        updateField('experienceYears', Number(event.target.value))
                      }
                      className={`${inputClass} pl-10`}
                      min="0"
                      required
                    />
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Dirección del centro médico"
                    error={errors.medicalCenterAddress}
                  >
                    <input
                      type="text"
                      value={form.medicalCenterAddress}
                      onChange={(event) =>
                        updateField('medicalCenterAddress', event.target.value)
                      }
                      className={inputClass}
                      placeholder="Ej. Av. Javier Prado 1234, San Isidro"
                      maxLength={500}
                      required
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center gap-2">
                <Clock3 className="text-primary" size={21} />
                <h2 className="text-lg font-semibold text-gray-900">
                  Horario de atención
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Hora de inicio" error={errors.availabilityStart}>
                  <input
                    type="time"
                    value={form.availabilityStart}
                    onChange={(event) =>
                      updateField('availabilityStart', event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Hora de fin" error={errors.availabilityEnd}>
                  <input
                    type="time"
                    value={form.availabilityEnd}
                    onChange={(event) =>
                      updateField('availabilityEnd', event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Tu perfil quedará pendiente de verificación.
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
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
