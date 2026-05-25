-- CulinaryExpert — Sample Recipe Seeds
-- Provides initial content so the app is not empty on first launch

-- ============================================================
-- SAMPLE INGREDIENTS
-- ============================================================
INSERT INTO ingredients (id, name, category, calories_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, allergens, tags, supermarket_aisle, storage_type, shelf_life_fridge_days, common_unit, grams_per_common_unit)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Chicken Breast (raw)', 'Proteins', 120, 22.5, 0, 2.6, 0, 74, '{}', '{"high-protein","gluten-free","dairy-free"}', 'Proteins', 'fridge', 2, 'oz', 28.35),
  ('a1000000-0000-0000-0000-000000000002', 'Brown Rice (dry)', 'Grains', 362, 7.9, 75.6, 2.9, 3.5, 5, '{}', '{"whole-grain","gluten-free","vegan"}', 'Dry Goods', 'pantry', NULL, 'cup', 185),
  ('a1000000-0000-0000-0000-000000000003', 'Broccoli (raw)', 'Vegetables', 34, 2.8, 6.6, 0.4, 2.6, 33, '{}', '{"vegan","gluten-free","high-fiber","low-calorie"}', 'Produce', 'fridge', 5, 'cup', 91),
  ('a1000000-0000-0000-0000-000000000004', 'Olive Oil', 'Oils', 884, 0, 0, 100, 0, 2, '{}', '{"vegan","gluten-free","keto"}', 'Condiments', 'pantry', NULL, 'tbsp', 14),
  ('a1000000-0000-0000-0000-000000000005', 'Egg (large)', 'Proteins', 143, 12.6, 0.7, 9.5, 0, 142, '{"eggs"}', '{"high-protein","vegetarian","keto","gluten-free"}', 'Dairy', 'fridge', 28, 'piece', 50),
  ('a1000000-0000-0000-0000-000000000006', 'Greek Yogurt (plain, 0% fat)', 'Dairy', 59, 10.2, 3.6, 0.4, 0, 36, '{"milk"}', '{"high-protein","vegetarian","probiotic"}', 'Dairy', 'fridge', 14, 'cup', 245),
  ('a1000000-0000-0000-0000-000000000007', 'Oats (rolled)', 'Grains', 389, 16.9, 66.3, 6.9, 10.6, 2, '{"gluten"}', '{"whole-grain","vegetarian","high-fiber"}', 'Dry Goods', 'pantry', NULL, 'cup', 81),
  ('a1000000-0000-0000-0000-000000000008', 'Banana', 'Fruits', 89, 1.1, 22.8, 0.3, 2.6, 1, '{}', '{"vegan","gluten-free","energy"}', 'Produce', 'pantry', 5, 'piece', 118),
  ('a1000000-0000-0000-0000-000000000009', 'Salmon Fillet (raw)', 'Proteins', 208, 20.4, 0, 13.4, 0, 59, '{"fish"}', '{"high-protein","omega3","gluten-free","dairy-free","keto"}', 'Proteins', 'fridge', 2, 'oz', 28.35),
  ('a1000000-0000-0000-0000-000000000010', 'Sweet Potato (raw)', 'Vegetables', 86, 1.6, 20.1, 0.1, 3, 55, '{}', '{"vegan","gluten-free","high-fiber","complex-carb"}', 'Produce', 'pantry', 14, 'medium', 130),
  ('a1000000-0000-0000-0000-000000000011', 'Spinach (raw)', 'Vegetables', 23, 2.9, 3.6, 0.4, 2.2, 79, '{}', '{"vegan","gluten-free","high-iron"}', 'Produce', 'fridge', 5, 'cup', 30),
  ('a1000000-0000-0000-0000-000000000012', 'Almond Butter', 'Nuts & Seeds', 614, 21.1, 18.8, 55.5, 10.3, 7, '{"tree_nuts"}', '{"vegetarian","high-protein","keto","paleo"}', 'Dry Goods', 'pantry', NULL, 'tbsp', 32),
  ('a1000000-0000-0000-0000-000000000013', 'Quinoa (dry)', 'Grains', 368, 14.1, 64.2, 6.1, 7, 5, '{}', '{"vegan","gluten-free","complete-protein","high-fiber"}', 'Dry Goods', 'pantry', NULL, 'cup', 170),
  ('a1000000-0000-0000-0000-000000000014', 'Black Beans (canned)', 'Legumes', 91, 6.0, 16.5, 0.4, 6.7, 236, '{}', '{"vegan","gluten-free","high-fiber","high-protein"}', 'Canned', 'pantry', NULL, 'cup', 240),
  ('a1000000-0000-0000-0000-000000000015', 'Bell Pepper (red, raw)', 'Vegetables', 31, 1.0, 6.0, 0.3, 2.1, 4, '{}', '{"vegan","gluten-free","vitamin-c"}', 'Produce', 'fridge', 7, 'medium', 119),
  ('a1000000-0000-0000-0000-000000000016', 'Garlic (raw)', 'Aromatics', 149, 6.4, 33.1, 0.5, 2.1, 17, '{}', '{"vegan","gluten-free"}', 'Produce', 'pantry', NULL, 'clove', 3),
  ('a1000000-0000-0000-0000-000000000017', 'Lemon Juice', 'Condiments', 22, 0.4, 6.9, 0.2, 0.3, 1, '{}', '{"vegan","gluten-free"}', 'Produce', 'fridge', 7, 'tbsp', 15),
  ('a1000000-0000-0000-0000-000000000018', 'Whole Wheat Tortilla', 'Grains', 297, 9.6, 47.5, 8.0, 4.4, 520, '{"gluten","wheat"}', '{"vegetarian","high-fiber"}', 'Bakery', 'pantry', 14, 'piece', 45)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE RECIPES
-- ============================================================
INSERT INTO recipes (id, title, description, meal_types, cuisine, prep_time_minutes, cook_time_minutes, servings, difficulty, tags, is_batch_friendly, max_batch_multiplier, instructions)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'High-Protein Overnight Oats',
    'A no-cook breakfast ready in 5 minutes the night before. High in protein, fiber, and complex carbs for sustained energy.',
    ARRAY['breakfast'],
    'American',
    5, 0, 1, 'easy',
    ARRAY['<15min','high-protein','high-fiber','vegetarian','batch-friendly','meal-prep','no-cook'],
    TRUE, 6,
    '[
      {"step": 1, "text": "Add oats to a mason jar or container.", "duration_min": 1},
      {"step": 2, "text": "Add Greek yogurt and mix well.", "duration_min": 1},
      {"step": 3, "text": "Slice banana and add on top.", "duration_min": 1},
      {"step": 4, "text": "Seal and refrigerate overnight (at least 6 hours).", "duration_min": 0},
      {"step": 5, "text": "Add almond butter on top before eating.", "duration_min": 1}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Grilled Chicken & Brown Rice Bowl',
    'A classic meal-prep staple. Lean protein with complex carbs and cruciferous vegetables for a balanced macro profile.',
    ARRAY['lunch','dinner'],
    'American',
    10, 25, 2, 'easy',
    ARRAY['<45min','high-protein','gluten-free','dairy-free','batch-friendly','meal-prep'],
    TRUE, 4,
    '[
      {"step": 1, "text": "Rinse brown rice and cook according to package (approx 20 min).", "duration_min": 20},
      {"step": 2, "text": "Season chicken breasts with salt, pepper, and garlic.", "duration_min": 2},
      {"step": 3, "text": "Heat olive oil in a pan over medium-high. Grill chicken 6-7 min per side.", "duration_min": 14},
      {"step": 4, "text": "Steam broccoli for 4-5 minutes until bright green.", "duration_min": 5},
      {"step": 5, "text": "Let chicken rest 3 minutes, then slice. Assemble bowl with rice, chicken, and broccoli.", "duration_min": 3},
      {"step": 6, "text": "Drizzle with lemon juice and a splash of olive oil.", "duration_min": 1}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Baked Salmon with Sweet Potato',
    'Omega-3 rich salmon paired with vitamin-packed sweet potato. Ideal for Body Sculpt mode — high protein, healthy fats, complex carbs.',
    ARRAY['dinner'],
    'Mediterranean',
    10, 30, 2, 'easy',
    ARRAY['<45min','high-protein','omega3','gluten-free','dairy-free','keto-friendly','paleo'],
    FALSE, 2,
    '[
      {"step": 1, "text": "Preheat oven to 200°C / 400°F.", "duration_min": 5},
      {"step": 2, "text": "Cube sweet potato and toss with olive oil, salt, and pepper on a baking sheet.", "duration_min": 3},
      {"step": 3, "text": "Roast sweet potato for 15 minutes.", "duration_min": 15},
      {"step": 4, "text": "Season salmon with lemon juice, garlic, salt, and pepper.", "duration_min": 2},
      {"step": 5, "text": "Add salmon to baking sheet and roast alongside sweet potato for 12-15 more minutes.", "duration_min": 15},
      {"step": 6, "text": "Serve with steamed spinach on the side.", "duration_min": 5}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'Veggie Power Scramble',
    'A quick, nutrient-dense egg scramble with spinach, bell pepper, and garlic. Perfect Fast Life mode breakfast.',
    ARRAY['breakfast','lunch'],
    'American',
    5, 8, 1, 'easy',
    ARRAY['<15min','high-protein','vegetarian','gluten-free','fast-life','low-carb'],
    FALSE, 2,
    '[
      {"step": 1, "text": "Dice bell pepper. Mince garlic clove.", "duration_min": 2},
      {"step": 2, "text": "Heat olive oil in non-stick pan over medium heat.", "duration_min": 1},
      {"step": 3, "text": "Sauté garlic and bell pepper 2 minutes.", "duration_min": 2},
      {"step": 4, "text": "Add spinach and wilt for 1 minute.", "duration_min": 1},
      {"step": 5, "text": "Whisk eggs and pour over vegetables. Scramble gently until just set.", "duration_min": 3},
      {"step": 6, "text": "Season with salt, pepper, and a squeeze of lemon.", "duration_min": 1}
    ]'::JSONB
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'Quinoa & Black Bean Burrito Bowl',
    'A complete plant-based protein bowl. All essential amino acids from the quinoa-legume combination. Great for budget mode.',
    ARRAY['lunch','dinner'],
    'Mexican',
    5, 20, 2, 'easy',
    ARRAY['<30min','vegan','gluten-free','high-fiber','high-protein','budget-friendly','batch-friendly'],
    TRUE, 4,
    '[
      {"step": 1, "text": "Rinse quinoa. Cook in 2:1 water ratio for 15 minutes.", "duration_min": 15},
      {"step": 2, "text": "While quinoa cooks, dice bell pepper and heat black beans in a pan.", "duration_min": 5},
      {"step": 3, "text": "Season beans with garlic, salt, and cumin.", "duration_min": 2},
      {"step": 4, "text": "Assemble bowl: quinoa base, black beans, bell pepper, spinach.", "duration_min": 2},
      {"step": 5, "text": "Squeeze lemon juice over the top.", "duration_min": 1}
    ]'::JSONB
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LINK RECIPES TO INGREDIENTS
-- ============================================================
-- Overnight Oats
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 81,  '1 cup',   NULL),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 245, '1 cup',   NULL),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 118, '1 medium','sliced'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000012', 32,  '1 tbsp',  NULL)
ON CONFLICT DO NOTHING;

-- Chicken & Rice Bowl
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 170, '6 oz',    NULL),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 92,  '1/2 cup', 'dry'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 150, '1.5 cups','florets'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 7,   '1/2 tbsp',NULL),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000016', 6,   '2 cloves','minced'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000017', 15,  '1 tbsp',  NULL)
ON CONFLICT DO NOTHING;

-- Salmon & Sweet Potato
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009', 170, '6 oz',    NULL),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000010', 130, '1 medium','cubed'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000011', 90,  '3 cups',  NULL),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 14,  '1 tbsp',  NULL),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000016', 6,   '2 cloves','minced'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000017', 15,  '1 tbsp',  NULL)
ON CONFLICT DO NOTHING;

-- Veggie Scramble
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', 150, '3 large', 'whisked'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000015', 119, '1 medium','diced'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000011', 60,  '2 cups',  NULL),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000016', 3,   '1 clove', 'minced'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 7,   '1/2 tbsp',NULL)
ON CONFLICT DO NOTHING;

-- Quinoa Burrito Bowl
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_g, display_qty, prep_note)
VALUES
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000013', 85,  '1/2 cup', 'dry'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000014', 240, '1 cup',   'drained, rinsed'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000015', 119, '1 medium','diced'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000011', 60,  '2 cups',  NULL),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000016', 6,   '2 cloves','minced'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000017', 15,  '1 tbsp',  NULL)
ON CONFLICT DO NOTHING;

-- Recalculate macros for all seeded recipes
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000001');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000002');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000003');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000004');
SELECT recalculate_recipe_macros('b1000000-0000-0000-0000-000000000005');
