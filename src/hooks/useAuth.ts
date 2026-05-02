import { useState, useCallback } from 'react';
import { UserType } from '../types';

interface AuthState {
  isLoggedIn: boolean;
  userType: UserType;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userType: null
  });

  const handleLogin = useCallback((type: 'patient' | 'doctor') => {
    setAuthState({
      isLoggedIn: true,
      userType: type
    });
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      userType: null
    });
  }, []);

  return {
    ...authState,
    handleLogin,
    handleLogout
  };
}
