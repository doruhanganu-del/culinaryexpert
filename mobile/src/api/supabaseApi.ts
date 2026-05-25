import { supabase } from '../lib/supabase';
import { getString, StorageKeys } from '../store/storage';
import type { Measurement, HealthScore, User, UserPreferences } from '../types';
import {
  calcBMR, calcTDEE, calcBodyFatNavy, calcLeanMass, calcHealthScore,
} from '../utils/healthCalc';

const lbsToKg    = (v: number) => v * 0.453592;
const inchesToCm = (v: number) => v * 2.54;
const round1 = (v: number | null): number | null =>
  v != null ? parseFloat(v.toFixed(1)) : null;

function getUserId(): string {
  const id = getString(StorageKeys.USER_ID);
  if (!id) throw new Error('Not authenticated');
  return id;
}

export const supabaseUserApi = {
  getProfile: async (): Promise<User & { user_preferences: UserPreferences }> => {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data as User & { user_preferences: UserPreferences };
  },

  getMeasurements: async (): Promise<Measurement[]> => {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('user_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Measurement[];
  },

  getHealthScores: async (): Promise<HealthScore[]> => {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('user_health_scores')
      .select('*')
      .eq('user_id', userId)
      .order('scored_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as HealthScore[];
  },

  saveMeasurement: async (
    measurement: Omit<Partial<Measurement>, 'user_id' | 'id'>,
  ): Promise<Measurement> => {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('user_measurements')
      .insert({ ...measurement, user_id: userId, measured_at: new Date().toISOString(), is_synced: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Measurement;
  },

  upsertProfile: async (body: Record<string, unknown>): Promise<void> => {
    const userId = getUserId();
    const {
      unit_system, sex, birth_date, display_name,
      activity_level, grocery_budget_weekly, max_cooking_time_minutes,
      allergies, favorite_foods, disliked_foods,
      budget_mode, fast_life_mode, body_sculpt_mode, goal,
      weight, height, waist, neck, hips, chest,
      arm_left, arm_right, forearm_left, forearm_right,
      thigh_left, thigh_right, calf_left, calf_right,
    } = body as Record<string, any>;

    const isImperial = unit_system === 'imperial';
    const toM = (v: number | null | undefined): number | null =>
      v != null ? (isImperial ? inchesToCm(v) : v) : null;

    const weightKg = weight != null ? (isImperial ? lbsToKg(weight) : weight) : null;
    const heightCm = height != null ? (isImperial ? inchesToCm(height) : height) : null;

    // 1. Upsert users table
    const { error: userErr } = await supabase.from('users').upsert({
      id: userId,
      unit_system: unit_system ?? 'metric',
      sex,
      birth_date,
      display_name,
      updated_at: new Date().toISOString(),
    });
    if (userErr) throw new Error(userErr.message);

    // 2. Upsert user_preferences
    if (activity_level !== undefined) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        activity_level,
        grocery_budget_weekly,
        max_cooking_time_minutes,
        allergies:        allergies        ?? [],
        favorite_foods:   favorite_foods   ?? [],
        disliked_foods:   disliked_foods   ?? [],
        budget_mode:      budget_mode      ?? false,
        fast_life_mode:   fast_life_mode   ?? false,
        body_sculpt_mode: body_sculpt_mode ?? false,
        goal:             goal             ?? 'maintenance',
      });
    }

    // 3. Insert measurement row
    if (weightKg && heightCm) {
      const waistCm       = toM(waist);
      const neckCm        = toM(neck);
      const hipsCm        = toM(hips);
      const chestCm       = toM(chest);
      const armLeftCm     = toM(arm_left);
      const armRightCm    = toM(arm_right);
      const forearmLeftCm  = toM(forearm_left);
      const forearmRightCm = toM(forearm_right);
      const thighLeftCm   = toM(thigh_left);
      const thighRightCm  = toM(thigh_right);
      const calfLeftCm    = toM(calf_left);
      const calfRightCm   = toM(calf_right);

      await supabase.from('user_measurements').insert({
        user_id:          userId,
        weight_kg:        parseFloat(weightKg.toFixed(2)),
        height_cm:        parseFloat(heightCm.toFixed(1)),
        waist_cm:         round1(waistCm),
        neck_cm:          round1(neckCm),
        hips_cm:          round1(hipsCm),
        chest_cm:         round1(chestCm),
        arm_left_cm:      round1(armLeftCm),
        arm_right_cm:     round1(armRightCm),
        forearm_left_cm:  round1(forearmLeftCm),
        forearm_right_cm: round1(forearmRightCm),
        thigh_left_cm:    round1(thighLeftCm),
        thigh_right_cm:   round1(thighRightCm),
        calf_left_cm:     round1(calfLeftCm),
        calf_right_cm:    round1(calfRightCm),
        is_synced:        true,
      });

      // 4. Insert health score
      if (sex && birth_date) {
        const ageYears   = new Date().getFullYear() - new Date(birth_date as string).getFullYear();
        const bodyFatPct = calcBodyFatNavy(sex as 'male' | 'female', waistCm, neckCm, heightCm, hipsCm);
        const bmr        = calcBMR(weightKg, heightCm, ageYears, sex as 'male' | 'female');
        const tdee       = calcTDEE(bmr, (activity_level as string) ?? 'moderate');
        const leanMass   = calcLeanMass(weightKg, bodyFatPct);
        const score      = calcHealthScore(bodyFatPct, sex as 'male' | 'female');

        await supabase.from('user_health_scores').insert({
          user_id:      userId,
          scored_at:    new Date().toISOString(),
          score,
          bmr:          parseFloat(bmr.toFixed(2)),
          tdee:         parseFloat(tdee.toFixed(2)),
          body_fat_pct: bodyFatPct,
          lean_mass_kg: leanMass != null ? parseFloat(leanMass.toFixed(2)) : null,
        });
      }
    }
  },
};
