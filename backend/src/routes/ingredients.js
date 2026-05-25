const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const supabase = require('../db/supabase');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { q, category, aisle, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('ingredients')
    .select('id, name, category, calories_kcal, protein_g, carbs_g, fat_g, supermarket_aisle, common_unit, allergens, tags')
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (q)        query = query.textSearch('name_search', q, { type: 'websearch' });
  if (category) query = query.ilike('category', `%${category}%`);
  if (aisle)    query = query.eq('supermarket_aisle', aisle);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Ingredient not found' });
  res.json(data);
}));

module.exports = router;
