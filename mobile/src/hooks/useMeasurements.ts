import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseUserApi } from '../api/supabaseApi';
import { mmkv } from '../store/mmkv';
import type { Measurement } from '../types';

const CACHE_KEY = 'q_measurements';

export function useMeasurements() {
  return useQuery<Measurement[]>({
    queryKey: ['measurements'],
    queryFn: async () => {
      const data = await supabaseUserApi.getMeasurements();
      mmkv.set(CACHE_KEY, JSON.stringify(data));
      return data;
    },
    initialData: () => {
      const cached = mmkv.getString(CACHE_KEY);
      return cached ? (JSON.parse(cached) as Measurement[]) : undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 0,
  });
}

export function useSaveMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Omit<Partial<Measurement>, 'user_id' | 'id'>) =>
      supabaseUserApi.saveMeasurement(m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  });
}
