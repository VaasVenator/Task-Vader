export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'STAFF' | 'SUPERVISOR' | 'ADMIN';
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('task-vader-token');
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('task-vader-user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    window.localStorage.removeItem('task-vader-user');
    return null;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot connect to the Task Vader API at ${API_URL}. Start the API server and try again.`);
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json();
}
