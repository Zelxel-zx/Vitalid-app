import { useState, useEffect } from 'react';
import { getProfile, updateProfile, ProfileResponse } from '../../services/profileService';
import { downloadPatientReport } from '../../services/reportService';
import { User, FileText } from 'lucide-react';

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergiesStr, setAllergiesStr] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const userId = Number(localStorage.getItem('authUserId'));
      const data = await getProfile(userId);
      setProfile(data);
      setPhone(data.phone || '');
      // El backend de Spring envía dateOfBirth en lugar de birthDate
      setBirthDate((data as any).dateOfBirth || data.birthDate || '');
      setBloodType(data.bloodType || '');
      const allergies = data.allergies || (data as any).allergia || [];
      setAllergiesStr(Array.isArray(allergies) ? allergies.join(', ') : '');
      setMedicalHistory(data.medicalHistory || '');
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
      const allergiesArray = allergiesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const updated = await updateProfile({
        name: profile.name,
        phone,
        birthDate,
        bloodType,
        allergies: allergiesArray,
        medicalHistory,
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
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
             <User size={40} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-gray-500">Tipo: {String((profile as any).type || profile.userType || '').toUpperCase()}</p>
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
            {String((profile as any).type || profile.userType || '').toUpperCase() === 'PATIENT' && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
                  <p className="font-medium">{profile.birthDate || 'No registrada'}</p>
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
                        <span key={alg} className="px-3 py-1 bg-red-400 text-red-900 rounded-full text-sm font-medium">{alg}</span>
                      ))
                    ) : (
                      <p className="font-medium">Ninguna registrada</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {String((profile as any).type || profile.userType || '').toUpperCase() === 'DOCTOR' && (
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
              {String((profile as any).type || profile.userType || '').toUpperCase() === 'PATIENT' && (
                <button 
                  onClick={async () => {
                    try {
                      await downloadPatientReport(Number(localStorage.getItem('authUserId')));
                    } catch (error) {
                      console.error('Error downloading report:', error);
                      alert('Error al descargar el historial médico');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                  <FileText size={18} />
                  Descargar Historial (PDF)
                </button>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors">
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
            {String((profile as any).type || profile.userType || '').toUpperCase() === 'PATIENT' && (
              <>
                <div>
                   <label className="text-sm text-gray-600">Fecha de Nacimiento (YYYY-MM-DD)</label>
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
            {String((profile as any).type || profile.userType || '').toUpperCase() === 'DOCTOR' && (
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
