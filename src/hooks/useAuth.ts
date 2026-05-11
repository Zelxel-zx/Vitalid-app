import { useState, useCallback } from 'react';
import { UserType } from '../types';
import { login, register, RegisterInput } from '../services/authService';

interface AuthState {
  isLoggedIn: boolean;
  userType: UserType;
  token: string | null;
  userId: number | null;
  userName: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userType: null,
    token: null,
    userId: null,
    userName: null,
  });

  const handleLogin = useCallback(async (email: string, password: string) => {
    const auth = await login(email, password);
    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
    });
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('authUserType', auth.userType);
    localStorage.setItem('authUserId', auth.id.toString());
  }, []);

  const handleRegister = useCallback(async (payload: RegisterInput) => {
    const auth = await register(payload);
    setAuthState({
      isLoggedIn: true,
      userType: auth.userType,
      token: auth.token,
      userId: auth.id,
      userName: auth.name,
    });
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('authUserType', auth.userType);
    localStorage.setItem('authUserId', auth.id.toString());
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      token: null,
      userId: null,
      userName: null,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserType');
    localStorage.removeItem('authUserId');
  }, []);

  return {
    ...authState,
    handleLogin,
    handleRegister,
    handleLogout
  };
}
