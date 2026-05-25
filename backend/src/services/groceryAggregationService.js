'use strict';

const supabase = require('../db/supabase');

const VISUAL_CONVERSIONS = [
  { g: 240,  unit: 'cup',         item_types: ['liquid','grain','legume'] },
  { g: 80,   unit: '1/3 cup',     item_types: [] },
  { g: 120,  unit: '1/2 cup',     item_types: [] },
  { g: 15,   unit: 'tablespoon',  item_types: ['condiment','oil'] },
  { g: 5,    unit: 'teaspoon',    item_types: [] },
  { g: 28,   unit: 'oz',          item_types: ['protein'] },
];

function toDisplayQuantity(grams, ingredient) {
  const aisle = (ingredient.supermarket_aisle || '').toLowerCase();
  const category = (ingredient.category || '').toLowerCase();

  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  if (category.includes('protein') || aisle.includes('proteins')) {
    const oz = grams / 28.35;
    return oz >= 1 ? `${oz.toFixed(1)} oz` : `${Math.round(grams)}g`;
  }
  if (grams <= 20) return `${Math.round(grams)}g`;
  return `${Math.round(grams)}g`;
}

async function aggregateGroceries(mealPlanId, scope = 'week') {
  // Fetch all meals in the plan (optionally filter to tomorrow only)
  let mealsQuery = supabase
    .from('meal_plan_meals')
    .select(`
      day_of_week, meal_type, servings, recipe_id,
      recipe:recipes(
        id, title,
        recipe_ingredients(
          quantity_g, display_qty,
          ingredient:ingredients(id, name, supermarket_aisle, category, common_unit, grams_per_common_unit, storage_type)
        )
      )
    `)
    .eq('meal_plan_id', mealPlanId)
    .is('deleted_at', null);

  if (scope === 'next_day') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = (tomorrow.getDay() + 6) % 7; // Mon=0
    mealsQuery = mealsQuery.eq('day_of_week', dayOfWeek);
  }

  const { data: meals, error } = await mealsQuery;
  if (error) throw error;

  const aggregated = {};

  for (const meal of meals || []) {
    if (!meal.recipe?.recipe_ingredients) continue;
    for (const ri of meal.recipe.recipe_ingredients) {
      const ingId = ri.ingredient.id;
      const qtyG  = ri.quantity_g * meal.servings;

      if (!aggregated[ingId]) {
        aggregated[ingId] = {
          ingredient_id:    ingId,
          name:             ri.ingredient.name,
          supermarket_aisle: ri.ingredient.supermarket_aisle || 'Other',
          category:         ri.ingredient.category,
          storage_type:     ri.ingredient.storage_type,
          total_quantity_g: 0,
          used_in_recipe_ids: [],
        };
      }

      aggregated[ingId].total_quantity_g += qtyG;
      if (!aggregated[ingId].used_in_recipe_ids.includes(meal.recipe_id)) {
        aggregated[ingId].used_in_recipe_ids.push(meal.recipe_id);
      }
    }
  }

  // Round up to nearest whole purchase unit and generate display qty
  const items = Object.values(aggregated).map(item => ({
    ...item,
    total_quantity_g: parseFloat(item.total_quantity_g.toFixed(1)),
    display_quantity: toDisplayQuantity(item.total_quantity_g, item),
  }));

  // Sort by aisle
  items.sort((a, b) => a.supermarket_aisle.localeCompare(b.supermarket_aisle));

  return items;
}

module.exports = { aggregateGroceries };
