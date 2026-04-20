import { useState } from 'react';
import { Activity, Mail, Lock, User, Phone } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Activity className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vitalid</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              isLogin
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              !isLogin
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Tipo de Usuario</label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    value="patient"
                    checked={userType === 'patient'}
                    onChange={() => setUserType('patient')}
                    className="text-primary"
                  />
                  <span>Paciente</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    value="doctor"
                    checked={userType === 'doctor'}
                    onChange={() => setUserType('doctor')}
                    className="text-primary"
                  />
                  <span>Doctor</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-medium"
          >
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-primary hover:opacity-80">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
