import { useState, useCallback, useEffect } from 'react';
import { UserType } from '../types';
import { login, register, RegisterInput } from '../services/authService';
import {
  clearAuthItems,
  getAuthItem,
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

const INITIAL_STATE: AuthState = {
  isLoggedIn: false,
  userType: null,
  token: null,
  userId: null,
  userName: null,
  needsPatientProfile: false,
  needsDoctorProfile: false,
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  /**
   * Issue #4 fix: Restore session from localStorage on mount.
   * Reads the stored token and reconstructs auth state without
   * requiring the user to log in again after F5.
   */
  useEffect(() => {
    const token = getAuthItem('authToken');
    const userType = getAuthItem('authUserType') as UserType | null;
    const userId = getAuthItem('authUserId');
    const userName = getAuthItem('authUserName');
    const profileCompleted = getAuthItem('authProfileCompleted');

    if (token && userType && userId && userName) {
      const isCompleted = profileCompleted === 'true';
      setAuthState({
        isLoggedIn: true,
        userType,
        token,
        userId: Number(userId),
        userName,
        // Issue #1 fix: if profileCompleted is false, redirect to onboarding
        needsPatientProfile: !isCompleted && userType === 'patient',
        needsDoctorProfile: !isCompleted && userType === 'doctor',
      });
    }
    setIsRestoringSession(false);
  }, []);

  /**
   * Issue #1 fix: handleLogin now reads profileCompleted from backend response
   * and sets needsPatientProfile / needsDoctorProfile accordingly.
   * This blocks access to the portal if the user skipped onboarding.
   */
  const handleLogin = useCallback(async (email: string, password: string) => {
    const auth = await login(email, password);
    const isCompleted = (auth as any).profileCompleted ?? false;

    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
      needsPatientProfile: !isCompleted && auth.userType === 'patient',
      needsDoctorProfile: !isCompleted && auth.userType === 'doctor',
    });
    setAuthItem('authToken', auth.token);
    setAuthItem('authUserType', auth.userType);
    setAuthItem('authUserId', auth.id.toString());
    setAuthItem('authUserName', auth.name);
    setAuthItem('authProfileCompleted', String(isCompleted));
  }, []);

  const handleRegister = useCallback(async (payload: RegisterInput) => {
    const auth = await register(payload);
    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
      // New users always need to fill in the profile
      needsPatientProfile: auth.userType === 'patient',
      needsDoctorProfile: auth.userType === 'doctor',
    });
    setAuthItem('authToken', auth.token);
    setAuthItem('authUserType', auth.userType);
    setAuthItem('authUserId', auth.id.toString());
    setAuthItem('authUserName', auth.name);
    setAuthItem('authProfileCompleted', 'false');
  }, []);

  /**
   * Issue #2 fix: called after the patient/doctor registration form submits
   * successfully. Marks profile as completed and transitions directly to the
   * portal without requiring a separate login.
   */
  const handleAutoLogin = useCallback(
    (token: string, id: number, name: string, userType: 'patient' | 'doctor') => {
      setAuthState({
        isLoggedIn: true,
        userType,
        token,
        userId: id,
        userName: name,
        needsPatientProfile: false,
        needsDoctorProfile: false,
      });
      setAuthItem('authToken', token);
      setAuthItem('authUserType', userType);
      setAuthItem('authUserId', id.toString());
      setAuthItem('authUserName', name);
      setAuthItem('authProfileCompleted', 'true');
    },
    [],
  );

  const handleLogout = useCallback(() => {
    setAuthState(INITIAL_STATE);
    clearAuthItems();
  }, []);

  return {
    ...authState,
    isRestoringSession,
    handleLogin,
    handleRegister,
    handleLogout,
    handleAutoLogin,
  };
}
