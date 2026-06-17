import { postJson } from './apiClient';

export interface LoginResult {
  id: number;
  profileId?: number | null;
  name: string;
  email: string;
  userType: 'patient' | 'doctor';
  token: string;
}

export interface LoginResult {
  id: number;
  name: string;
  email: string;
  userType: 'patient' | 'doctor';
  token: string;
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
    profileId: data.profileId,
    name: data.name,
    email: data.email,
    token: data.token,
    userType: data.type === 'DOCTOR' ? 'doctor' : 'patient',
  };
}
