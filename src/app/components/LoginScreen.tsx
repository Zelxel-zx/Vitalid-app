import { useState } from 'react';
import { Mail, Lock, User, Phone } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userType: 'patient' | 'doctor') => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(userType);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl flex items-center shadow-2xl rounded-2xl overflow-hidden">
        {/* Sección izquierda - Imagen */}
        <div className="hidden lg:flex w-1/2 bg-gray-100 relative max-h-[calc(100vh-120px)]">
          <img
            src="/src/images/Rectangle 24.png"
            alt="Doctor verificando paciente"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sección derecha - Formulario */}
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6c-2.5 3-4 4.5-4 6.5 0 2.8 1.79 5 4 5s4-2.2 4-5c0-2-1.5-3.5-4-6.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10c1-1 2-1.5 4-1.5s3 .5 4 1.5" />
                </svg>
              </div>
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
            className="w-full py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg mt-6"
          >
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
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
