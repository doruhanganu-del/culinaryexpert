'use strict';

const supabase = require('../db/supabase');
const { aggregateGroceries } = require('../services/groceryAggregationService');

async function generateGroceryList(req, res) {
  const { meal_plan_id, scope } = req.body;

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', meal_plan_id)
    .eq('user_id', req.userId)
    .single();

  if (!plan) return res.status(404).json({ error: 'Meal plan not found' });

  const items = await aggregateGroceries(meal_plan_id, scope || 'week');

  // Persist the generated list
  const { data: list, error: listErr } = await supabase
    .from('grocery_lists')
    .insert({ user_id: req.userId, meal_plan_id, scope: scope || 'week', is_synced: true })
    .select()
    .single();

  if (listErr) return res.status(400).json({ error: listErr.message });

  if (items.length > 0) {
    const rows = items.map(item => ({
      grocery_list_id:    list.id,
      ingredient_id:      item.ingredient_id,
      total_quantity_g:   item.total_quantity_g,
      display_quantity:   item.display_quantity,
      supermarket_aisle:  item.supermarket_aisle,
      used_in_recipe_ids: item.used_in_recipe_ids,
      is_synced:          true,
    }));
    await supabase.from('grocery_list_items').insert(rows);
  }

  // Nest ingredient info so mobile can read item.ingredient.name
  const clientItems = items.map(({ name, supermarket_aisle, category, storage_type, ...rest }) => ({
    ...rest,
    supermarket_aisle,
    ingredient: { name, supermarket_aisle, category, storage_type },
  }));

  res.status(201).json({ list_id: list.id, item_count: items.length, items: clientItems });
}

async function getGroceryList(req, res) {
  const { list_id } = req.params;

  const { data, error } = await supabase
    .from('grocery_list_items')
    .select('*, ingredient:ingredients(name, supermarket_aisle, storage_type)')
    .eq('grocery_list_id', list_id)
    .in('grocery_list_id',
      supabase.from('grocery_lists').select('id').eq('user_id', req.userId)
    )
    .order('supermarket_aisle');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function toggleItem(req, res) {
  const { item_id } = req.params;
  const { is_checked } = req.body;

  const { error } = await supabase
    .from('grocery_list_items')
    .update({ is_checked })
    .eq('id', item_id)
    .in('grocery_list_id',
      supabase.from('grocery_lists').select('id').eq('user_id', req.userId)
    );

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

module.exports = { generateGroceryList, getGroceryList, toggleItem };
