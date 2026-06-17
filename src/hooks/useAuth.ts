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
  profileId: number | null;
  needsPatientProfile: boolean;
  needsDoctorProfile: boolean;
}

function persistAuthData(auth: {
  id: number;
  profileId?: number | null;
  userType: UserType;
  token: string;
  name: string;
}) {
  setAuthItem('authToken', auth.token);
  setAuthItem('authUserType', auth.userType);
  setAuthItem('authUserId', auth.id.toString());
  setAuthItem('authUserName', auth.name);

  if (auth.profileId) {
    setAuthItem('authProfileId', auth.profileId.toString());

    if (auth.userType === 'patient') {
      setAuthItem('authPatientId', auth.profileId.toString());
    }

    if (auth.userType === 'doctor') {
      setAuthItem('authDoctorId', auth.profileId.toString());
    }
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userType: null,
    token: null,
    userId: null,
    userName: null,
    profileId: null,
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
      profileId: auth.profileId ?? null,
      needsPatientProfile: false,
      needsDoctorProfile: false,
    });

    persistAuthData(auth);
  }, []);

  const handleRegister = useCallback(async (payload: RegisterInput) => {
    const auth = await register(payload);

    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
      profileId: auth.profileId ?? null,
      needsPatientProfile: auth.userType === 'patient',
      needsDoctorProfile: auth.userType === 'doctor',
    });

    persistAuthData(auth);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      token: null,
      userId: null,
      userName: null,
      profileId: null,
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