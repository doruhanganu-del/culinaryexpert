-- Seed recipes for new meal types: pre_breakfast, morning_snack, afternoon_snack

-- Ensure required ingredients exist (idempotent — ON CONFLICT DO NOTHING)
INSERT INTO ingredients (id, name, category, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, allergens, tags, supermarket_aisle, storage_type, shelf_life_fridge_days, common_unit, grams_per_common_unit)
VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Olive Oil',                    'Oils',          884, 0,    0,    100,  0,    2,   '{}',            '{"vegan","gluten-free","keto"}',                        'Condiments', 'pantry', NULL, 'tbsp',   14),
  ('a1000000-0000-0000-0000-000000000005', 'Egg (large)',                  'Proteins',      143, 12.6, 0.7,  9.5,  0,    142, '{"eggs"}',      '{"high-protein","vegetarian","keto","gluten-free"}',    'Dairy',      'fridge', 28,   'piece',  50),
  ('a1000000-0000-0000-0000-000000000006', 'Greek Yogurt (plain, 0% fat)', 'Dairy',          59, 10.2, 3.6,  0.4,  0,    36,  '{"milk"}',      '{"high-protein","vegetarian","probiotic"}',             'Dairy',      'fridge', 14,   'cup',    245),
  ('a1000000-0000-0000-0000-000000000008', 'Banana',                       'Fruits',         89, 1.1,  22.8, 0.3,  2.6,  1,   '{}',            '{"vegan","gluten-free","energy"}',                      'Produce',    'pantry', 5,    'piece',  118),
  ('a1000000-0000-0000-0000-000000000011', 'Spinach (raw)',                 'Vegetables',     23, 2.9,  3.6,  0.4,  2.2,  79,  '{}',            '{"vegan","gluten-free","high-iron"}',                   'Produce',    'fridge', 5,    'cup',    30),
  ('a1000000-0000-0000-0000-000000000012', 'Almond Butter',                'Nuts & Seeds',  614, 21.1, 18.8, 55.5, 10.3, 7,   '{"tree_nuts"}', '{"vegetarian","high-protein","keto","paleo"}',          'Dry Goods',  'pantry', NULL, 'tbsp',   32),
  ('a1000000-0000-0000-0000-000000000017', 'Lemon Juice',                  'Condiments',     22, 0.4,  6.9,  0.2,  0.3,  1,   '{}',            '{"vegan","gluten-free"}',                               'Produce',    'fridge', 7,    'tbsp',   15),
  ('a1000000-0000-0000-0000-000000000018', 'Whole Wheat Tortilla',         'Grains',        297, 9.6,  47.5, 8.0,  4.4,  520, '{"gluten","wheat"}', '{"vegetarian","high-fiber"}',                    'Bakery',     'pantry', 14,   'piece',  45)
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, title, description, meal_types, cuisine, prep_time_minutes, cook_time_minutes, servings, difficulty, tags, is_batch_friendly, max_batch_multiplier, instructions)
VALUES
  (
    'b1000000-0000-0000-0000-000000000006',
    'Almond Butter Banana Boost',
    'A 2-minute pre-breakfast energy primer. Banana provides quick-release carbs to wake up your metabolism; almond butter adds healthy fats and protein to sustain you until your main breakfast.',
    ARRAY['pre_breakfast'],
    'American',
    2, 0, 1, 'easy',
    ARRAY['<5min','vegan','gluten-free','no-cook','energy','quick'],
    FALSE, 1,
    '[
      {"step": 1, "text": "Peel and slice the banana into rounds.", "duration_min": 1},
      {"step": 2, "text": "Arrange banana slices on a small plate.", "duration_min": 0},
      {"step": 3, "text": "Add a generous dollop of almond butter alongside for dipping.", "duration_min": 1},
      {"step": 4, "text": "Eat slowly and mindfully — this is your metabolism wake-up call, not a full meal.", "duration_min": 0}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000007',
    'Greek Yogurt Power Bowl',
    'A satisfying mid-morning snack that bridges breakfast and lunch. Creamy Greek yogurt topped with sliced banana delivers a perfect mix of protein, probiotics, and natural sugars to maintain energy and focus.',
    ARRAY['morning_snack'],
    'Mediterranean',
    3, 0, 1, 'easy',
    ARRAY['<5min','high-protein','vegetarian','gluten-free','no-cook','probiotic'],
    FALSE, 1,
    '[
      {"step": 1, "text": "Spoon the Greek yogurt into a bowl.", "duration_min": 0},
      {"step": 2, "text": "Slice the banana and arrange on top of the yogurt.", "duration_min": 1},
      {"step": 3, "text": "Drizzle almond butter over the top for healthy fats and extra protein.", "duration_min": 1},
      {"step": 4, "text": "Optional: add a pinch of cinnamon to support blood sugar balance.", "duration_min": 0}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000008',
    'Spinach & Egg Mini Wrap',
    'A light, protein-rich afternoon snack that fights the 3 pm energy slump. Fluffy scrambled egg with wilted spinach in a warm tortilla — satisfying without being heavy before dinner.',
    ARRAY['afternoon_snack'],
    'American',
    3, 5, 1, 'easy',
    ARRAY['<10min','high-protein','vegetarian','quick','energy'],
    FALSE, 1,
    '[
      {"step": 1, "text": "Whisk the egg with a pinch of salt and pepper.", "duration_min": 1},
      {"step": 2, "text": "Heat a small pan over medium heat with a few drops of olive oil.", "duration_min": 1},
      {"step": 3, "text": "Add spinach and sauté 30 seconds until just wilted.", "duration_min": 1},
      {"step": 4, "text": "Pour in egg and scramble gently with the spinach until set, about 2 minutes.", "duration_min": 2},
      {"step": 5, "text": "Warm the tortilla in the same pan for 20 seconds per side.", "duration_min": 1},
      {"step": 6, "text": "Wrap the egg mixture in the tortilla. Squeeze lemon juice over filling before rolling.", "duration_min": 1}
    ]'::JSONB
  )
ON CONFLICT (id) DO NOTHING;

-- Link ingredients to new recipes
-- pre_breakfast: Almond Butter Banana Boost
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 118, '1 medium', 'sliced'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000012', 16,  '1/2 tbsp', NULL)
ON CONFLICT DO NOTHING;

-- morning_snack: Greek Yogurt Power Bowl
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 150, '2/3 cup',  NULL),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000008', 118, '1 medium', 'sliced'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000012', 16,  '1/2 tbsp', NULL)
ON CONFLICT DO NOTHING;

-- afternoon_snack: Spinach & Egg Mini Wrap
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000005', 50,  '1 large',  'whisked'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000011', 30,  '1 cup',    NULL),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000018', 45,  '1 piece',  NULL),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 3,   '1/4 tbsp', NULL),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000017', 8,   '1/2 tbsp', NULL)
ON CONFLICT DO NOTHING;

-- Recalculate macros for new recipes
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000006');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000007');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000008');