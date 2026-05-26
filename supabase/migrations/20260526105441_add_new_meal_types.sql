-- Expand allowed meal types to include pre_breakfast, morning_snack, afternoon_snack

-- recipes.meal_types array check
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_meal_types_check;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_meal_types_check1;
ALTER TABLE recipes ADD CONSTRAINT recipes_meal_types_check
  CHECK (meal_types <@ ARRAY['pre_breakfast','breakfast','morning_snack','lunch','afternoon_snack','dinner','snack']::TEXT[]);

-- meal_plan_meals.meal_type scalar check
ALTER TABLE meal_plan_meals DROP CONSTRAINT IF EXISTS meal_plan_meals_meal_type_check;
ALTER TABLE meal_plan_meals DROP CONSTRAINT IF EXISTS meal_plan_meals_meal_type_check1;
ALTER TABLE meal_plan_meals ADD CONSTRAINT meal_plan_meals_meal_type_check
  CHECK (meal_type IN ('pre_breakfast','breakfast','morning_snack','lunch','afternoon_snack','dinner','snack'));