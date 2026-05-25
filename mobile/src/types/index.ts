export type UnitSystem = 'metric' | 'imperial';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'weight_loss' | 'maintenance' | 'hypertrophy' | 'endurance';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Feedback = 'loved' | 'disliked';
export type GroceryScope = 'week' | 'next_day';
export type StorageType = 'pantry' | 'fridge' | 'freezer';

export interface User {
  id: string;
  unit_system: UnitSystem;
  sex: Sex | null;
  birth_date: string | null;
  display_name: string | null;
  onboarding_completed: boolean;
  medical_disclaimer_accepted_at: string | null;
  privacy_policy_accepted_at: string | null;
  terms_accepted_at: string | null;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  activity_level: ActivityLevel;
  grocery_budget_weekly: number | null;
  max_cooking_time_minutes: number;
  allergies: string[];
  favorite_foods: string[];
  disliked_foods: string[];
  budget_mode: boolean;
  fast_life_mode: boolean;
  body_sculpt_mode: boolean;
  goal: Goal;
}

export interface Measurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  waist_cm: number | null;
  neck_cm: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  arm_left_length_cm: number | null;
  arm_right_length_cm: number | null;
  forearm_left_cm: number | null;
  forearm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  thigh_left_length_cm: number | null;
  thigh_right_length_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  body_fat_pct: number | null;
  is_synced: boolean;
  client_id?: string;
}

export interface HealthScore {
  id: string;
  user_id: string;
  scored_at: string;
  score: number;
  bmr: number | null;
  tdee: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Ingredient {
  id: string;
  fdc_id?: number;
  name: string;
  category: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  allergens: string[];
  tags: string[];
  supermarket_aisle: string | null;
  storage_type: StorageType;
  common_unit: string;
  grams_per_common_unit: number;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity_g: number;
  display_qty: string | null;
  prep_note: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  meal_types: MealType[];
  cuisine: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories_per_serving: number | null;
  protein_g_per_serving: number | null;
  carbs_g_per_serving: number | null;
  fat_g_per_serving: number | null;
  tags: string[];
  allergens: string[];
  is_batch_friendly: boolean;
  instructions: { step: number; text: string; duration_min?: number }[];
  image_url: string | null;
  recipe_ingredients?: RecipeIngredient[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  status: 'active' | 'archived';
  calories_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  is_synced: boolean;
}

export interface MealPlanMeal {
  id: string;
  meal_plan_id: string;
  day_of_week: number;
  meal_type: MealType;
  recipe_id: string | null;
  servings: number;
  feedback: Feedback | null;
  recipe?: Recipe;
  is_synced: boolean;
}

export interface GroceryListItem {
  id: string;
  grocery_list_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  total_quantity_g: number;
  display_quantity: string | null;
  supermarket_aisle: string | null;
  is_checked: boolean;
  used_in_recipe_ids: string[];
  is_synced: boolean;
}

export interface BatchCookingStep {
  order: number;
  action: string;
  detail: string;
  duration_min: number;
}

export interface StorageInstruction {
  item: string;
  quantity: string;
  storage: 'fridge' | 'freezer';
  duration_days: number;
  icon: string;
}

export interface BatchCookingSession {
  id: string;
  meal_plan_id: string;
  session_date: string;
  session_number: 1 | 2;
  estimated_duration_min: number | null;
  steps: BatchCookingStep[];
  storage_instructions: StorageInstruction[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  UnitSelection: undefined;
  MedicalDisclaimer: undefined;
  BiologicalData: undefined;
  Measurements: undefined;
  Lifestyle: undefined;
  HealthScore: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  MealPlan: undefined;
  SmartPrep: undefined;
  Groceries: undefined;
  Profile: undefined;
};
