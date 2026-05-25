'use strict';

const supabase = require('../db/supabase');

// Session 1 = Sunday (cook for Mon–Wed), Session 2 = Wednesday (cook for Thu–Sat)
const SESSION_DAY_RANGES = {
  1: [0, 1, 2],  // Mon, Tue, Wed
  2: [3, 4, 5],  // Thu, Fri, Sat (Sun is ad-hoc)
};

async function generateBatchCookingPlan(mealPlanId, weekStartDate) {
  const { data: meals, error } = await supabase
    .from('meal_plan_meals')
    .select(`
      day_of_week, meal_type, servings,
      recipe:recipes(
        id, title, prep_time_minutes, cook_time_minutes, is_batch_friendly, max_batch_multiplier,
        recipe_ingredients(
          quantity_g, prep_note, display_qty,
          ingredient:ingredients(id, name, storage_type, shelf_life_fridge_days, shelf_life_freezer_days)
        )
      )
    `)
    .eq('meal_plan_id', mealPlanId)
    .is('deleted_at', null);

  if (error) throw error;

  const sessions = [];

  for (const [sessionNum, days] of Object.entries(SESSION_DAY_RANGES)) {
    const sessionMeals = (meals || []).filter(m => days.includes(m.day_of_week));
    const steps        = buildConsolidatedSteps(sessionMeals);
    const storage      = buildStorageInstructions(sessionMeals, days);

    const totalDuration = steps.reduce((sum, s) => sum + (s.duration_min || 0), 0);

    const sessionDate = new Date(weekStartDate);
    sessionDate.setDate(sessionDate.getDate() + (sessionNum == 1 ? -1 : 2)); // Sun before, Wed of week

    sessions.push({
      meal_plan_id: mealPlanId,
      session_date: sessionDate.toISOString().split('T')[0],
      session_number: Number(sessionNum),
      estimated_duration_min: totalDuration,
      steps,
      storage_instructions: storage,
    });
  }

  return sessions;
}

function buildConsolidatedSteps(meals) {
  const ingredientBatches = {};

  for (const meal of meals) {
    if (!meal.recipe?.recipe_ingredients) continue;
    for (const ri of meal.recipe.recipe_ingredients) {
      const key = `${ri.ingredient.id}:${ri.prep_note || 'none'}`;
      if (!ingredientBatches[key]) {
        ingredientBatches[key] = {
          name:       ri.ingredient.name,
          prep_note:  ri.prep_note,
          total_g:    0,
          usages:     [],
        };
      }
      ingredientBatches[key].total_g += ri.quantity_g * meal.servings;
      ingredientBatches[key].usages.push(`${meal.recipe.title} (${meal.meal_type})`);
    }
  }

  const prepSteps = Object.values(ingredientBatches)
    .filter(b => b.prep_note)
    .map((b, i) => ({
      order:       i + 1,
      action:      `${b.prep_note ? b.prep_note.charAt(0).toUpperCase() + b.prep_note.slice(1) : 'Prepare'} ${Math.round(b.total_g)}g of ${b.name}`,
      detail:      b.usages.join(', '),
      duration_min: Math.ceil(b.total_g / 100) * 2,
    }));

  const uniqueRecipes = [...new Map(meals.map(m => [m.recipe?.id, m.recipe])).values()].filter(Boolean);
  const cookSteps = uniqueRecipes.map((recipe, i) => ({
    order:       prepSteps.length + i + 1,
    action:      `Cook: ${recipe.title}`,
    detail:      `${recipe.prep_time_minutes || 0} min prep + ${recipe.cook_time_minutes || 0} min cook`,
    duration_min: (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0),
  }));

  return [...prepSteps, ...cookSteps].map((s, idx) => ({ ...s, order: idx + 1 }));
}

function buildStorageInstructions(meals, days) {
  const items = [];
  const seen  = new Set();

  for (const meal of meals) {
    if (!meal.recipe || seen.has(meal.recipe.id)) continue;
    seen.add(meal.recipe.id);

    const daysAhead = Math.max(...days) - Math.min(...days) + 1;
    items.push({
      item:         meal.recipe.title,
      quantity:     `${meal.servings} serving(s)`,
      storage:      daysAhead <= 3 ? 'fridge' : 'freezer',
      duration_days: daysAhead <= 3 ? 3 : 30,
      icon:         daysAhead <= 3 ? '🧊' : '❄️',
    });
  }

  return items;
}

module.exports = { generateBatchCookingPlan };
