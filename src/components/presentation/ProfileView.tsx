import { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, uploadAvatar, ProfileResponse, splitAllergies } from '../../services/profileService';
import { downloadPatientReport } from '../../services/reportService';
import { User, FileText, Camera } from 'lucide-react';

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergiesStr, setAllergiesStr] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userId = Number(localStorage.getItem('authUserId'));
      const data = await getProfile(userId);
      setProfile(data);
      setPhone(data.phone || '');
      setBirthDate(data.dateOfBirth || '');
      setBloodType(data.bloodType || '');
      setAllergiesStr(data.allergies.join(', '));
      setSpecialty(data.specialty || '');
      setExperienceYears(data.experienceYears || 0);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsLoading(true);
      const userId = Number(localStorage.getItem('authUserId'));
      const allergiesArray = splitAllergies(allergiesStr);
      const updated = await updateProfile({
        name: profile.name,
        phone,
        dateOfBirth: birthDate,
        bloodType,
        allergies: allergiesArray,
        specialty,
        experienceYears
      }, userId);
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    e.target.value = '';

    setIsUploadingAvatar(true);
    try {
      const userId = Number(localStorage.getItem('authUserId'));
      const dataUri = await uploadAvatar(userId, file);
      setProfile({ ...profile, avatar: dataUri });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir la foto. Máximo 5 MB.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading && !profile) {
    return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Error al cargar perfil</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Mi Perfil</h2>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        {/* Avatar section — click to upload */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
              title="Haz clic para cambiar tu foto"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-gray-500">{profile.type === 'DOCTOR' ? 'Médico' : 'Paciente'}</p>
            <p className="text-xs text-gray-400 mt-1">Haz clic en la foto para cambiarla</p>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Correo Electrónico</label>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Teléfono</label>
              <p className="font-medium">{profile.phone || 'No registrado'}</p>
            </div>
            {profile.type === 'PATIENT' && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
                  <p className="font-medium">{profile.dateOfBirth || 'No registrada'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tipo de Sangre</label>
                  <p className="font-medium">{profile.bloodType || 'No registrado'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Alergias</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.isArray(profile.allergies) && profile.allergies.length > 0 ? (
                      profile.allergies.map(alg => (
                        <span key={alg} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">{alg}</span>
                      ))
                    ) : (
                      <p className="font-medium">Ninguna registrada</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {profile.type === 'DOCTOR' && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Especialidad</label>
                  <p className="font-medium">{profile.specialty || 'No registrada'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Años de Experiencia</label>
                  <p className="font-medium">{profile.experienceYears ? `${profile.experienceYears} años` : 'No registrados'}</p>
                </div>
              </>
            )}
            <div className="flex gap-4 mt-6">
              {profile.type === 'PATIENT' && (
                <button
                  onClick={async () => {
                    try {
                      await downloadPatientReport(Number(localStorage.getItem('authUserId')));
                    } catch (error) {
                      console.error('Error downloading report:', error);
                      alert('Error al descargar el historial médico');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Descargar Historial (PDF)
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
               <label className="text-sm text-gray-600">Teléfono</label>
               <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded mt-1" />
            </div>
            {profile.type === 'PATIENT' && (
              <>
                <div>
                   <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
                   <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                   <label className="text-sm text-gray-600">Tipo de Sangre</label>
                   <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="w-full p-2 border rounded mt-1">
                     <option value="">Selecciona un tipo</option>
                     <option value="A+">A+</option>
                     <option value="A-">A-</option>
                     <option value="B+">B+</option>
                     <option value="B-">B-</option>
                     <option value="AB+">AB+</option>
                     <option value="AB-">AB-</option>
                     <option value="O+">O+</option>
                     <option value="O-">O-</option>
                   </select>
                </div>
                <div>
                   <label className="text-sm text-gray-600">Alergias (separadas por coma)</label>
                   <input type="text" value={allergiesStr} onChange={e => setAllergiesStr(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Ej. Penicilina, Maní" />
                </div>
              </>
            )}
            {profile.type === 'DOCTOR' && (
              <>
                <div>
                   <label className="text-sm text-gray-600">Especialidad</label>
                   <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Ej. Cardiología" />
                </div>
                <div>
                   <label className="text-sm text-gray-600">Años de Experiencia</label>
                   <input type="number" value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} className="w-full p-2 border rounded mt-1" min="0" />
                </div>
              </>
            )}
            <div className="flex gap-4 mt-6">
               <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
