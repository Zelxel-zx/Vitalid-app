const AUTH_KEYS = [
  'authToken',
  'authUserType',
  'authUserId',
  'authUserName',
  'authProfileId',
  'authPatientId',
  'authDoctorId',
] as const;

type AuthKey = (typeof AUTH_KEYS)[number];

export function getAuthItem(key: AuthKey) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function setAuthItem(key: AuthKey, value: string) {
  sessionStorage.setItem(key, value);
  localStorage.removeItem(key);
}

export function clearAuthItems() {
  AUTH_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}
