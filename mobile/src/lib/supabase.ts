import { createClient } from '@supabase/supabase-js';
import { mmkv } from '../store/mmkv';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? 'https://mhcmivjzlottcnijvqye.supabase.co';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oY21pdmp6bG90dGNuaWp2cXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTQxMjgsImV4cCI6MjA5NTE3MDEyOH0.hlQnNaAgGUdyl6KC6woLK0aVZwjQCgqg7bLIhc6qxhA';

// Synchronous MMKV adapter — Supabase JS v2 accepts sync or async storage
const mmkvStorage = {
  getItem:    (key: string): string | null => mmkv.getString(key) ?? null,
  setItem:    (key: string, value: string): void => mmkv.set(key, value),
  removeItem: (key: string): void => mmkv.delete(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: mmkvStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
