import { getJson, putJson } from './apiClient';

export const PROFILE_UPDATED = 'vitalid:profile-updated';

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  phone: string;
  type: string;
  avatar: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  specialty: string;
  experienceYears: number;
  verified: boolean;
}

export interface ProfileUpdateRequest {
  name: string;
  phone: string;
  avatar: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  specialty: string;
  experienceYears: number;
}

export async function getProfile(userId?: number): Promise<ProfileResponse> {
  const url = userId ? `/profile?userId=${userId}` : '/profile';
  const profile = await getJson<ProfileResponse>(url);
  return normalizeProfile(profile);
}

export async function updateProfile(request: ProfileUpdateRequest, userId?: number): Promise<ProfileResponse> {
  const url = userId ? `/profile?userId=${userId}` : '/profile';
  const profile = await putJson<ProfileResponse>(url, request);
  const normalized = normalizeProfile(profile);
  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED, {
      detail: {
        name: normalized.name,
        avatar: normalized.avatar,
      },
    }),
  );
  return normalized;
}

export function splitAllergies(value: string | string[] | null | undefined): string[] {
  const allergies = Array.isArray(value) ? value : [String(value || '')];

  return allergies
    .flatMap((allergy) => allergy.split(/\s*(?:,|\by\b)\s*/i))
    .map((allergy) => allergy.trim())
    .filter(Boolean)
    .map((allergy) => allergy.charAt(0).toLocaleUpperCase('es') + allergy.slice(1));
}

function normalizeProfile(profile: ProfileResponse): ProfileResponse {
  return {
    ...profile,
    allergies: splitAllergies(profile.allergies),
  };
}
