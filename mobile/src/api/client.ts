import { getToken, setTokens, clearTokens, getString, StorageKeys } from '../store/storage';
import { supabase } from '../lib/supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    // Refresh directly via Supabase — no backend dependency
    const storedRefresh = getString(StorageKeys.REFRESH_TOKEN);
    if (storedRefresh) {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession({
        refresh_token: storedRefresh,
      });
      if (!refreshErr && refreshData.session) {
        setTokens(refreshData.session.access_token, refreshData.session.refresh_token);
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
