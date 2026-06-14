import { getAuthItem } from './authStorage';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

async function parseJson(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request<T>(path: string, options: RequestInit = {}) {
  const normalizedPath = path;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const token = getAuthItem('authToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  if (payload && payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload as any;
}

export async function getJson<T>(path: string) {
  return request<T>(path, {
    method: 'GET',
  });
}

export async function postJson<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function putJson<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
