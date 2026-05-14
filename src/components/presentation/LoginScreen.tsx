import { useState } from 'react';
import { Mail, Lock, User, Phone } from 'lucide-react';
import logo from '../../images/Logo (1).svg';
import heroImage from '../../images/Rectangle 24.svg';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
    userType: 'patient' | 'doctor';
  }) => Promise<void>;
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    
    if (!isLogin) {
      const errors: typeof validationErrors = {};
      if (name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres';
      if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
      if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Correo electrónico inválido';
      if (phone.length < 7) errors.phone = 'Teléfono inválido';
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister({
          name,
          email,
          password,
          phone,
          userType,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl flex items-center shadow-2xl rounded-2xl overflow-hidden">
        {/* Sección izquierda - Imagen */}
        <div className="hidden lg:flex w-1/2 bg-gray-100 relative max-h-[calc(100vh-120px)]">
          <img
            src={heroImage}
            alt="Doctor verificando paciente"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sección derecha - Formulario */}
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-0">
              <img src={logo} alt="Vitalid Logo" className="w-[122px] h-[137px]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Vitalid App</h1>
          </div>

          {/* Botones Login/Registro */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg transition-colors font-medium ${
                isLogin
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg transition-colors font-medium ${
                !isLogin
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Regístrate
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition"
                placeholder="user@email.com"
                required
              />
            </div>
            {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition"
                placeholder="••••••••"
                required
              />
            </div>
            {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Usuario</label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input
                    type="radio"
                    value="patient"
                    checked={userType === 'patient'}
                    onChange={() => setUserType('patient')}
                    className="accent-primary"
                  />
                  <span className="text-gray-700">Paciente</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input
                    type="radio"
                    value="doctor"
                    checked={userType === 'doctor'}
                    onChange={() => setUserType('doctor')}
                    className="accent-primary"
                  />
                  <span className="text-gray-700">Doctor</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg mt-6 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-primary hover:opacity-80 font-medium">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
