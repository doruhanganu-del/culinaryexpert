-- CulinaryExpert — Initial Schema
-- Run against Supabase project via SQL Editor or `supabase db push`

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy ingredient search

-- ============================================================
-- USERS (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_system   TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  sex           TEXT CHECK (sex IN ('male', 'female')),
  birth_date    DATE,
  display_name  TEXT,
  avatar_url    TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  medical_disclaimer_accepted_at TIMESTAMPTZ,
  privacy_policy_accepted_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_level            TEXT NOT NULL DEFAULT 'moderate'
                              CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  grocery_budget_weekly     NUMERIC(10,2),
  max_cooking_time_minutes  INTEGER DEFAULT 45,
  allergies                 TEXT[]  NOT NULL DEFAULT '{}',
  favorite_foods            TEXT[]  NOT NULL DEFAULT '{}',
  disliked_foods            TEXT[]  NOT NULL DEFAULT '{}',
  budget_mode               BOOLEAN NOT NULL DEFAULT FALSE,
  fast_life_mode            BOOLEAN NOT NULL DEFAULT FALSE,
  body_sculpt_mode          BOOLEAN NOT NULL DEFAULT FALSE,
  goal                      TEXT NOT NULL DEFAULT 'maintenance'
                              CHECK (goal IN ('weight_loss','maintenance','hypertrophy','endurance')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ============================================================
-- USER MEASUREMENTS (time-series)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_measurements (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg        NUMERIC(6,2),
  height_cm        NUMERIC(5,1),
  waist_cm         NUMERIC(5,1),
  neck_cm          NUMERIC(5,1),
  hips_cm          NUMERIC(5,1),
  chest_cm         NUMERIC(5,1),
  arm_left_cm      NUMERIC(5,1),
  arm_right_cm     NUMERIC(5,1),
  thigh_left_cm    NUMERIC(5,1),
  thigh_right_cm   NUMERIC(5,1),
  body_fat_pct     NUMERIC(5,2),  -- computed on insert via trigger
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Offline-first sync columns
  client_id        TEXT,
  is_synced        BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at       TIMESTAMPTZ  -- soft delete for sync
);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date
  ON user_measurements (user_id, measured_at DESC);

-- ============================================================
-- USER HEALTH SCORES (time-series)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_health_scores (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score               NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  bmr                 NUMERIC(8,2),
  tdee                NUMERIC(8,2),
  body_fat_pct        NUMERIC(5,2),
  lean_mass_kg        NUMERIC(6,2),
  macro_adherence_pct NUMERIC(5,2),
  score_breakdown     JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_date
  ON user_health_scores (user_id, scored_at DESC);

-- ============================================================
-- INGREDIENTS (USDA FoodData Central + Open Food Facts)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  fdc_id                INTEGER UNIQUE,
  off_barcode           TEXT    UNIQUE,
  name                  TEXT    NOT NULL,
  name_search           TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED,
  category              TEXT,
  -- Macros per 100g (unified metric storage)
  calories_kcal         NUMERIC(8,2),
  protein_g             NUMERIC(8,3),
  carbs_g               NUMERIC(8,3),
  fat_g                 NUMERIC(8,3),
  fiber_g               NUMERIC(8,3),
  sugar_g               NUMERIC(8,3),
  -- Key micronutrients per 100g
  sodium_mg             NUMERIC(8,2),
  iron_mg               NUMERIC(8,3),
  calcium_mg            NUMERIC(8,2),
  vitamin_c_mg          NUMERIC(8,2),
  vitamin_d_mcg         NUMERIC(8,3),
  potassium_mg          NUMERIC(8,2),
  -- Meta
  tags                  TEXT[]  NOT NULL DEFAULT '{}',
  allergens             TEXT[]  NOT NULL DEFAULT '{}',
  supermarket_aisle     TEXT,
  storage_type          TEXT    NOT NULL DEFAULT 'pantry'
                          CHECK (storage_type IN ('pantry','fridge','freezer')),
  shelf_life_fridge_days   INTEGER,
  shelf_life_freezer_days  INTEGER,
  common_unit           TEXT    NOT NULL DEFAULT 'g',
  grams_per_common_unit NUMERIC(8,2) NOT NULL DEFAULT 100,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_search ON ingredients USING GIN (name_search);
CREATE INDEX IF NOT EXISTS idx_ingredients_tags       ON ingredients USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_ingredients_allergens  ON ingredients USING GIN (allergens);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT    NOT NULL,
  description          TEXT,
  meal_types           TEXT[]  NOT NULL DEFAULT '{}'
                         CHECK (meal_types <@ ARRAY['breakfast','lunch','dinner','snack']::TEXT[]),
  cuisine              TEXT,
  prep_time_minutes    INTEGER,
  cook_time_minutes    INTEGER,
  total_time_minutes   INTEGER GENERATED ALWAYS AS (COALESCE(prep_time_minutes,0) + COALESCE(cook_time_minutes,0)) STORED,
  servings             INTEGER NOT NULL DEFAULT 2,
  difficulty           TEXT    NOT NULL DEFAULT 'easy'
                         CHECK (difficulty IN ('easy','medium','hard')),
  -- Computed macros per serving (populated by trigger after recipe_ingredients insert)
  calories_per_serving NUMERIC(8,2),
  protein_g_per_serving NUMERIC(8,3),
  carbs_g_per_serving  NUMERIC(8,3),
  fat_g_per_serving    NUMERIC(8,3),
  -- Filtering
  tags                 TEXT[]  NOT NULL DEFAULT '{}',
  allergens            TEXT[]  NOT NULL DEFAULT '{}',  -- auto-populated from ingredients
  is_batch_friendly    BOOLEAN NOT NULL DEFAULT FALSE,
  max_batch_multiplier INTEGER NOT NULL DEFAULT 4,
  instructions         JSONB   NOT NULL DEFAULT '[]',  -- [{step: 1, text: "...", duration_min: 5}]
  image_url            TEXT,
  source_url           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recipes_tags       ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_allergens  ON recipes USING GIN (allergens);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_types ON recipes USING GIN (meal_types);

-- ============================================================
-- RECIPE INGREDIENTS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID    NOT NULL REFERENCES ingredients(id),
  quantity_g    NUMERIC(10,2) NOT NULL,
  display_qty   TEXT,        -- e.g., "1 cup", "2 tbsp"
  prep_note     TEXT,        -- e.g., "diced", "minced"
  is_optional   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (recipe_id, ingredient_id)
);

-- ============================================================
-- MEAL PLANS (7-day)
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id                     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date        DATE    NOT NULL,
  status                 TEXT    NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','archived')),
  calories_target        NUMERIC(8,2),
  protein_target_g       NUMERIC(8,2),
  carbs_target_g         NUMERIC(8,2),
  fat_target_g           NUMERIC(8,2),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id              TEXT,
  is_synced              BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at             TIMESTAMPTZ,
  UNIQUE (user_id, week_start_date)
);

-- ============================================================
-- MEAL PLAN MEALS (individual slots: Mon Breakfast, Tue Lunch …)
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id  UUID    NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon
  meal_type     TEXT    NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id     UUID    REFERENCES recipes(id),
  servings      NUMERIC(4,2) NOT NULL DEFAULT 1,
  feedback      TEXT    CHECK (feedback IN ('loved','disliked')),
  feedback_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id     TEXT,
  is_synced     BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ,
  UNIQUE (meal_plan_id, day_of_week, meal_type)
);

-- ============================================================
-- GROCERY LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS grocery_lists (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id  UUID    REFERENCES meal_plans(id) ON DELETE SET NULL,
  scope         TEXT    NOT NULL DEFAULT 'week' CHECK (scope IN ('week','next_day')),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id     TEXT,
  is_synced     BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grocery_list_items (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id     UUID    NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  ingredient_id       UUID    NOT NULL REFERENCES ingredients(id),
  total_quantity_g    NUMERIC(10,2) NOT NULL,
  display_quantity    TEXT,   -- "3 cups + 2 tbsp"
  supermarket_aisle   TEXT,
  is_checked          BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT,
  used_in_recipe_ids  UUID[]  NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id           TEXT,
  is_synced           BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (grocery_list_id, ingredient_id)
);

-- ============================================================
-- BATCH COOKING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_cooking_sessions (
  id                        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id              UUID    NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  session_date              DATE    NOT NULL,
  session_number            INTEGER NOT NULL CHECK (session_number IN (1, 2)),
  estimated_duration_min    INTEGER,
  steps                     JSONB   NOT NULL DEFAULT '[]',
  -- steps format: [{order: 1, action: "Chop 4 onions", detail: "2 for tonight, 2 in fridge for tomorrow", duration_min: 5}]
  storage_instructions      JSONB   NOT NULL DEFAULT '[]',
  -- storage format: [{item: "Cooked chicken", quantity: "600g", storage: "fridge", duration_days: 4}]
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OFFLINE SYNC LOG (delta sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name  TEXT        NOT NULL,
  record_id   UUID        NOT NULL,
  operation   TEXT        NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  payload     JSONB,
  client_id   TEXT,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_user ON sync_log (user_id, synced_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_preferences_updated_at
  BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_meal_plan_meals_updated_at
  BEFORE UPDATE ON meal_plan_meals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- BODY FAT CALCULATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION compute_body_fat()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_sex TEXT;
  v_bf  NUMERIC;
BEGIN
  SELECT sex INTO v_sex FROM users WHERE id = NEW.user_id;

  IF NEW.waist_cm IS NOT NULL AND NEW.neck_cm IS NOT NULL AND NEW.height_cm IS NOT NULL THEN
    IF v_sex = 'male' THEN
      v_bf := 86.010 * LOG(NEW.waist_cm - NEW.neck_cm)
             - 70.041 * LOG(NEW.height_cm)
             + 36.76;
    ELSIF v_sex = 'female' AND NEW.hips_cm IS NOT NULL THEN
      v_bf := 163.205 * LOG(NEW.waist_cm + NEW.hips_cm - NEW.neck_cm)
             - 97.684  * LOG(NEW.height_cm)
             - 78.387;
    END IF;
    NEW.body_fat_pct := GREATEST(0, LEAST(100, ROUND(v_bf::NUMERIC, 2)));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compute_body_fat
  BEFORE INSERT OR UPDATE OF waist_cm, neck_cm, hips_cm, height_cm
  ON user_measurements FOR EACH ROW EXECUTE FUNCTION compute_body_fat();

-- ============================================================
-- RECIPE MACROS RECALCULATION FUNCTION (call after ingredient changes)
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_recipe_macros(p_recipe_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_servings INTEGER;
BEGIN
  SELECT servings INTO v_servings FROM recipes WHERE id = p_recipe_id;
  IF v_servings IS NULL OR v_servings = 0 THEN v_servings := 1; END IF;

  UPDATE recipes
  SET
    calories_per_serving  = (SELECT COALESCE(SUM(i.calories_kcal * ri.quantity_g / 100), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = p_recipe_id) / v_servings,
    protein_g_per_serving = (SELECT COALESCE(SUM(i.protein_g    * ri.quantity_g / 100), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = p_recipe_id) / v_servings,
    carbs_g_per_serving   = (SELECT COALESCE(SUM(i.carbs_g      * ri.quantity_g / 100), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = p_recipe_id) / v_servings,
    fat_g_per_serving     = (SELECT COALESCE(SUM(i.fat_g        * ri.quantity_g / 100), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = p_recipe_id) / v_servings,
    allergens             = (SELECT ARRAY_AGG(DISTINCT unnest) FROM (SELECT UNNEST(i.allergens) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = p_recipe_id) t(unnest))
  WHERE id = p_recipe_id;
END;
$$;
