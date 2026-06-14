import { useState, useCallback } from 'react';
import { UserType } from '../types';
import { login, register, RegisterInput } from '../services/authService';
import {
  clearAuthItems,
  setAuthItem,
} from '../services/authStorage';

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
    setAuthItem('authToken', auth.token);
    setAuthItem('authUserType', auth.userType);
    setAuthItem('authUserId', auth.id.toString());
    setAuthItem('authUserName', auth.name);
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
    setAuthItem('authToken', auth.token);
    setAuthItem('authUserType', auth.userType);
    setAuthItem('authUserId', auth.id.toString());
    setAuthItem('authUserName', auth.name);
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
    clearAuthItems();
  }, []);

  return {
    ...authState,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
