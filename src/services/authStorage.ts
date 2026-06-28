const AUTH_KEYS = [
  'authToken',
  'authUserType',
  'authUserId',
  'authUserName',
  'authProfileCompleted',
] as const;

type AuthKey = (typeof AUTH_KEYS)[number];

/**
 * Reads from localStorage (persistent across reloads).
 * Falls back to sessionStorage for backward compatibility.
 */
export function getAuthItem(key: AuthKey) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/**
 * Stores in localStorage so the session persists across F5 reloads and
 * tab/window closes. Use clearAuthItems() on logout.
 */
export function setAuthItem(key: AuthKey, value: string) {
  localStorage.setItem(key, value);
  // Remove stale sessionStorage entry if present
  sessionStorage.removeItem(key);
}

export function clearAuthItems() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}
