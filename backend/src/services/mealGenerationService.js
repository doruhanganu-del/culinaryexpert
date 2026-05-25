'use strict';

const supabase = require('../db/supabase');

const MEAL_SLOTS = [
  { day: 0, type: 'breakfast' }, { day: 0, type: 'lunch' }, { day: 0, type: 'dinner' },
  { day: 1, type: 'breakfast' }, { day: 1, type: 'lunch' }, { day: 1, type: 'dinner' },
  { day: 2, type: 'breakfast' }, { day: 2, type: 'lunch' }, { day: 2, type: 'dinner' },
  { day: 3, type: 'breakfast' }, { day: 3, type: 'lunch' }, { day: 3, type: 'dinner' },
  { day: 4, type: 'breakfast' }, { day: 4, type: 'lunch' }, { day: 4, type: 'dinner' },
  { day: 5, type: 'breakfast' }, { day: 5, type: 'lunch' }, { day: 5, type: 'dinner' },
  { day: 6, type: 'breakfast' }, { day: 6, type: 'lunch' }, { day: 6, type: 'dinner' },
];

async function fetchEligibleRecipes(preferences, mealType) {
  let query = supabase
    .from('recipes')
    .select('*, recipe_ingredients(quantity_g, ingredient:ingredients(allergens))')
    .contains('meal_types', [mealType]);

  if (preferences.fast_life_mode) {
    query = query.lte('total_time_minutes', 15);
  } else if (preferences.max_cooking_time_minutes) {
    query = query.lte('total_time_minutes', preferences.max_cooking_time_minutes);
  }

  const { data: recipes, error } = await query.limit(200);
  if (error) throw error;

  const userAllergens = (preferences.allergies || []).map(a => a.toLowerCase());
  return (recipes || []).filter(recipe => {
    const recipeAllergens = (recipe.allergens || []).map(a => a.toLowerCase());
    return !recipeAllergens.some(a => userAllergens.includes(a));
  });
}

function scoreRecipe(recipe, preferences, usedRecipeIds, dayFeedback) {
  let score = 50;

  // Boost if in favorite foods
  const favFoods = (preferences.favorite_foods || []).map(f => f.toLowerCase());
  if (favFoods.length > 0 && recipe.tags.some(t => favFoods.includes(t))) {
    score += 20;
  }

  // Penalize if user disliked it before
  if (dayFeedback[recipe.id] === 'disliked') score -= 40;
  if (dayFeedback[recipe.id] === 'loved')    score += 30;

  // Penalize repetition within the same week
  const repeatCount = usedRecipeIds.filter(id => id === recipe.id).length;
  score -= repeatCount * 15;

  // Boost batch-friendly recipes
  if (recipe.is_batch_friendly) score += 10;

  // Budget mode: prefer recipes with fewer/cheaper ingredients
  if (preferences.budget_mode && recipe.recipe_ingredients?.length <= 5) score += 10;

  // Body sculpt: prefer high-protein
  if (preferences.body_sculpt_mode) {
    const proteinCalRatio = (recipe.protein_g_per_serving * 4) / (recipe.calories_per_serving || 1);
    if (proteinCalRatio >= 0.30) score += 20;
  }

  return score + Math.random() * 5; // small entropy to avoid identical plans
}

async function generateWeeklyMealPlan(userId, preferences, macroTargets) {
  const userFeedback = await fetchUserFeedback(userId);

  const mealSlots = [];
  const usedRecipeIds = [];

  const mealTypeCache = {};

  for (const slot of MEAL_SLOTS) {
    if (!mealTypeCache[slot.type]) {
      mealTypeCache[slot.type] = await fetchEligibleRecipes(preferences, slot.type);
    }
    const candidates = mealTypeCache[slot.type];

    const scored = candidates.map(r => ({
      recipe: r,
      score: scoreRecipe(r, preferences, usedRecipeIds, userFeedback),
    }));
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0]?.recipe;
    if (best) {
      usedRecipeIds.push(best.id);
      mealSlots.push({
        day_of_week: slot.day,
        meal_type:   slot.type,
        recipe_id:   best.id,
        servings:    1,
      });
    }
  }

  return { mealSlots, macroTargets };
}

async function fetchUserFeedback(userId) {
  // Fetch plan IDs first — passing a query builder directly to .in() is not supported
  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId);

  const planIds = (plans || []).map(p => p.id);
  if (planIds.length === 0) return {};

  const { data } = await supabase
    .from('meal_plan_meals')
    .select('recipe_id, feedback')
    .not('feedback', 'is', null)
    .in('meal_plan_id', planIds);

  const map = {};
  (data || []).forEach(row => {
    if (row.feedback) map[row.recipe_id] = row.feedback;
  });
  return map;
}

module.exports = { generateWeeklyMealPlan };
