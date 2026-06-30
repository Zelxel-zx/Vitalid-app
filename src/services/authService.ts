import { postJson } from './apiClient';

interface AuthPayload {
  id: number;
  name: string;
  email: string;
  type: 'PATIENT' | 'DOCTOR';
  token: string;
  profileCompleted?: boolean;
  message?: string;
}

export interface LoginResult {
  id: number;
  name: string;
  email: string;
  userType: 'patient' | 'doctor';
  token: string;
  profileCompleted: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: 'patient' | 'doctor';
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await postJson<AuthPayload>('/auth/login', {
    email,
    password,
  });

  return normalizeAuth(response.data);
}

export async function register(input: RegisterInput): Promise<LoginResult> {
  const response = await postJson<AuthPayload>('/auth/register', {
    name: input.name,
    email: input.email,
    password: input.password,
    phone: input.phone,
    type: input.userType.toUpperCase(),
  });

  return normalizeAuth(response.data);
}

function normalizeAuth(data: AuthPayload): LoginResult {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    token: data.token,
    userType: data.type === 'DOCTOR' ? 'doctor' : 'patient',
    profileCompleted: Boolean(data.profileCompleted),
  };
}
