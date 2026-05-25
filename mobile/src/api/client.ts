import { getToken, setTokens, clearTokens, getString, StorageKeys } from '../store/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Attempt token refresh
    const refreshToken = getString(StorageKeys.REFRESH_TOKEN);
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const { access_token } = await refreshRes.json();
        setTokens(access_token, refreshToken);
        return request(method, path, body);
      }
    }
    clearTokens();
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'API error');
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                    => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)     => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)     => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)     => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                    => request<T>('DELETE', path),
};
