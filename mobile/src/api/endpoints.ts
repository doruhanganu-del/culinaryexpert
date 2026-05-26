import { api } from './client';
import type {
  User, UserPreferences, Measurement, HealthScore,
  MealPlanMeal, GroceryListItem, BatchCookingSession,
} from '../types';

// Auth
export const authApi = {
  login:   (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string; user_id: string }>('/api/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post<{ user_id: string }>('/api/auth/register', { email, password }),
};

// Users
export const userApi = {
  getProfile: () => api.get<User & { user_preferences: UserPreferences }>('/api/users'),
  upsertProfile: (data: Record<string, unknown>) => api.put<{ success: boolean }>('/api/users', data),
  getMeasurements: () => api.get<Measurement[]>('/api/users/measurements'),
  getHealthScores: () => api.get<HealthScore[]>('/api/users/health-scores'),
  acceptLegal: (type: 'medical' | 'privacy' | 'terms') =>
    api.post<{ accepted: string }>(`/api/users/legal/${type}/accept`, {}),
};

// Meal Plans
export const mealPlanApi = {
  generate: (weekStartDate: string, language?: string) =>
    api.post<{ plan_id: string; macros: unknown; meal_count: number }>('/api/meal-plans', { week_start_date: weekStartDate, language: language ?? 'en-US', servings: 1 }),
  getActive: () => api.get<MealPlanMeal[]>('/api/meal-plans/active'),
  submitFeedback: (mealId: string, feedback: 'loved' | 'disliked') =>
    api.post<{ success: boolean }>(`/api/meal-plans/meals/${mealId}/feedback`, { feedback }),
  getBatchCooking: (planId: string) =>
    api.get<BatchCookingSession[]>(`/api/meal-plans/${planId}/batch-cooking`),
};

// Groceries
export const groceryApi = {
  generate: (mealPlanId: string, scope: 'week' | 'next_day' = 'week') =>
    api.post<{ list_id: string; items: GroceryListItem[] }>('/api/groceries', { meal_plan_id: mealPlanId, scope }),
  getList: (listId: string) => api.get<GroceryListItem[]>(`/api/groceries/${listId}`),
  toggleItem: (itemId: string, isChecked: boolean) =>
    api.patch<{ success: boolean }>(`/api/groceries/items/${itemId}`, { is_checked: isChecked }),
};

// Ingredients
export const ingredientApi = {
  search: (q: string) => api.get<unknown[]>(`/api/ingredients?q=${encodeURIComponent(q)}&limit=20`),
};

// Sync
export const syncApi = {
  pull: (lastSyncedAt: string) =>
    api.get<unknown>(`/api/sync/pull?last_synced_at=${encodeURIComponent(lastSyncedAt)}`),
  push: (changes: unknown) => api.post<{ success: boolean }>('/api/sync/push', changes),
};
