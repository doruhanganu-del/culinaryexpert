import { mmkv } from './mmkv';

export const StorageKeys = {
  ACCESS_TOKEN:     'access_token',
  REFRESH_TOKEN:    'refresh_token',
  USER_ID:          'user_id',
  UNIT_SYSTEM:      'unit_system',
  ONBOARDING_DONE:  'onboarding_done',
  LAST_SYNCED_AT:   'last_synced_at',
  ACTIVE_PLAN_ID:   'active_plan_id',
  TRIAL_START_DATE: 'trial_start_date',
  TRIAL_NOTIFIED:   'trial_notified',
} as const;

// No-op: MMKV reads are synchronous — no warm-up needed
export async function initStorage(): Promise<void> {}

export function getString(key: string): string | undefined {
  return mmkv.getString(key);
}

export function getBoolean(key: string): boolean | undefined {
  return mmkv.contains(key) ? mmkv.getBoolean(key) : undefined;
}

export function setItem(key: string, value: string): void {
  mmkv.set(key, value);
}

export function setBooleanItem(key: string, value: boolean): void {
  mmkv.set(key, value);
}

export function deleteItem(key: string): void {
  mmkv.delete(key);
}

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

export const storage = {
  getString,
  getBoolean,
  set: (key: string, value: string | boolean | number) => {
    if (typeof value === 'boolean') mmkv.set(key, value);
    else mmkv.set(key, String(value));
  },
  setBoolean: setBooleanItem,
  delete: deleteItem,
};
