import { getJson, putJson, uploadFile } from './apiClient';

export const PROFILE_UPDATED = 'vitalid:profile-updated';

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  phone: string;
  type: string;
  avatar?: string;
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
  notifyProfileUpdated(normalized.name, normalized.avatar);
  return normalized;
}

/**
 * Upload a profile avatar. Stored as Base64 data URI in DB — works on Railway/Render.
 * Returns the data URI which can be used directly as an <img src>.
 */
export async function uploadAvatar(userId: number, file: File): Promise<string> {
  const url = userId ? `/profile/avatar?userId=${userId}` : '/profile/avatar';
  const response = await uploadFile<{ url: string }>(url, file);
  notifyProfileUpdated(undefined, response.url);
  return response.url;
}

/**
 * Upload a file for chat attachment (image or PDF).
 * Returns a Base64 data URI to send as message content.
 */
export async function uploadChatFile(file: File): Promise<string> {
  const response = await uploadFile<{ url: string }>('/profile/chat-upload', file);
  return response.url;
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

function notifyProfileUpdated(name?: string, avatar?: string) {
  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED, {
      detail: { name, avatar },
    }),
  );
}
