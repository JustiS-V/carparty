const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('carparty_token');
}

export function setToken(token: string) {
  localStorage.setItem('carparty_token', token);
}

export function clearToken() {
  localStorage.removeItem('carparty_token');
  localStorage.removeItem('carparty_user');
}

export function getStoredUser<T>() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('carparty_user');
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown) {
  localStorage.setItem('carparty_user', JSON.stringify(user));
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json();
}

export { API_URL };
