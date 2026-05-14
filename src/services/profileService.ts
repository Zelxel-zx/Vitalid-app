import { getJson, putJson } from './apiClient';

export interface ProfileResponse {
  id: number;
  userId: number;
  email: string;
  name: string;
  phone: string;
  userType: string;
  birthDate: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: string;
  specialty: string;
  experienceYears: number;
  verified: boolean;
}

export interface ProfileUpdateRequest {
  name: string;
  phone: string;
  birthDate: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: string;
  specialty: string;
  experienceYears: number;
}

export async function getProfile(userId?: number): Promise<ProfileResponse> {
  const url = userId ? `/profile?userId=${userId}` : '/profile';
  return getJson<ProfileResponse>(url);
}

export async function updateProfile(request: ProfileUpdateRequest, userId?: number): Promise<ProfileResponse> {
  const url = userId ? `/profile?userId=${userId}` : '/profile';
  return putJson<ProfileResponse>(url, request);
}
