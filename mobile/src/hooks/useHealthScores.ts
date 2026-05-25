import { useQuery } from '@tanstack/react-query';
import { supabaseUserApi } from '../api/supabaseApi';
import { mmkv } from '../store/mmkv';
import type { HealthScore } from '../types';

const CACHE_KEY = 'q_health_scores';

export function useHealthScores() {
  return useQuery<HealthScore[]>({
    queryKey: ['healthScores'],
    queryFn: async () => {
      const data = await supabaseUserApi.getHealthScores();
      mmkv.set(CACHE_KEY, JSON.stringify(data));
      return data;
    },
    initialData: () => {
      const cached = mmkv.getString(CACHE_KEY);
      return cached ? (JSON.parse(cached) as HealthScore[]) : undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 0,
  });
}
