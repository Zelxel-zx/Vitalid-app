import { useState, useCallback } from 'react';
import { UserType } from '../types';
import { login, register, RegisterInput } from '../services/authService';

interface AuthState {
  isLoggedIn: boolean;
  userType: UserType;
  token: string | null;
  userId: number | null;
  userName: string | null;
  needsPatientProfile: boolean;
  needsDoctorProfile: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userType: null,
    token: null,
    userId: null,
    userName: null,
    needsPatientProfile: false,
    needsDoctorProfile: false,
  });

  const handleLogin = useCallback(async (email: string, password: string) => {
    const auth = await login(email, password);
    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
      needsPatientProfile: false,
      needsDoctorProfile: false,
    });
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('authUserType', auth.userType);
    localStorage.setItem('authUserId', auth.id.toString());
    localStorage.setItem('authUserName', auth.name);
  }, []);

  const handleRegister = useCallback(async (payload: RegisterInput) => {
    const auth = await register(payload);
    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
      needsPatientProfile: auth.userType === 'patient',
      needsDoctorProfile: auth.userType === 'doctor',
    });
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('authUserType', auth.userType);
    localStorage.setItem('authUserId', auth.id.toString());
    localStorage.setItem('authUserName', auth.name);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      token: null,
      userId: null,
      userName: null,
      needsPatientProfile: false,
      needsDoctorProfile: false,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserType');
    localStorage.removeItem('authUserId');
    localStorage.removeItem('authUserName');
  }, []);

  return {
    ...authState,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
