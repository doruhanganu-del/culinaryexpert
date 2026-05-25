import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  ACCESS_TOKEN:    'access_token',
  REFRESH_TOKEN:   'refresh_token',
  USER_ID:         'user_id',
  UNIT_SYSTEM:     'unit_system',
  ONBOARDING_DONE: 'onboarding_done',
  LAST_SYNCED_AT:  'last_synced_at',
  ACTIVE_PLAN_ID:  'active_plan_id',
} as const;

// Synchronous in-memory cache so navigation and renders don't need async reads
const cache: Record<string, string | undefined> = {};

export async function initStorage(): Promise<void> {
  const keys = Object.values(StorageKeys);
  const pairs = await AsyncStorage.multiGet(keys);
  pairs.forEach(([k, v]) => { if (v != null) cache[k] = v; });
}

// --- Sync helpers (read from cache, write through to AsyncStorage) ---

export function getString(key: string): string | undefined {
  return cache[key];
}

export function getBoolean(key: string): boolean | undefined {
  const v = cache[key];
  if (v == null) return undefined;
  return v === 'true';
}

export function setItem(key: string, value: string): void {
  cache[key] = value;
  AsyncStorage.setItem(key, value);
}

export function setBooleanItem(key: string, value: boolean): void {
  setItem(key, String(value));
}

export function deleteItem(key: string): void {
  delete cache[key];
  AsyncStorage.removeItem(key);
}

// --- Named helpers used across the app ---

export function getToken(): string | undefined {
  return getString(StorageKeys.ACCESS_TOKEN);
}

export function setTokens(access: string, refresh: string): void {
  setItem(StorageKeys.ACCESS_TOKEN, access);
  setItem(StorageKeys.REFRESH_TOKEN, refresh);
}

export function clearTokens(): void {
  deleteItem(StorageKeys.ACCESS_TOKEN);
  deleteItem(StorageKeys.REFRESH_TOKEN);
  deleteItem(StorageKeys.USER_ID);
}

export function getLastSyncedAt(): string {
  return getString(StorageKeys.LAST_SYNCED_AT) ?? new Date(0).toISOString();
}

export function setLastSyncedAt(ts: string): void {
  setItem(StorageKeys.LAST_SYNCED_AT, ts);
}

// Backward-compat shim — some screens call storage.getString / storage.set etc.
export const storage = {
  getString,
  getBoolean,
  set: (key: string, value: string | boolean | number) => setItem(key, String(value)),
  setBoolean: setBooleanItem,
  delete: deleteItem,
};
