-- CulinaryExpert — Row Level Security Policies
-- Ensures users can only access their own data

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_meals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_cooking_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log                ENABLE ROW LEVEL SECURITY;

-- Ingredients and recipes are shared/public (read only for authenticated users)
ALTER TABLE ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS
-- ============================================================
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE POLICY "prefs_select_own" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- USER MEASUREMENTS
-- ============================================================
CREATE POLICY "measurements_select_own" ON user_measurements
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "measurements_insert_own" ON user_measurements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "measurements_update_own" ON user_measurements
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- HEALTH SCORES
-- ============================================================
CREATE POLICY "health_scores_select_own" ON user_health_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_scores_insert_own" ON user_health_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MEAL PLANS
-- ============================================================
CREATE POLICY "meal_plans_select_own" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "meal_plans_insert_own" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_plans_update_own" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- MEAL PLAN MEALS
-- ============================================================
CREATE POLICY "meals_select_own" ON meal_plan_meals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid())
    AND deleted_at IS NULL
  );
CREATE POLICY "meals_insert_own" ON meal_plan_meals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid())
  );
CREATE POLICY "meals_update_own" ON meal_plan_meals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid())
  );

-- ============================================================
-- GROCERY LISTS
-- ============================================================
CREATE POLICY "grocery_lists_select_own" ON grocery_lists
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "grocery_lists_insert_own" ON grocery_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grocery_lists_update_own" ON grocery_lists
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- GROCERY LIST ITEMS
-- ============================================================
CREATE POLICY "grocery_items_select_own" ON grocery_list_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM grocery_lists gl WHERE gl.id = grocery_list_id AND gl.user_id = auth.uid())
  );
CREATE POLICY "grocery_items_insert_own" ON grocery_list_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM grocery_lists gl WHERE gl.id = grocery_list_id AND gl.user_id = auth.uid())
  );
CREATE POLICY "grocery_items_update_own" ON grocery_list_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM grocery_lists gl WHERE gl.id = grocery_list_id AND gl.user_id = auth.uid())
  );

-- ============================================================
-- BATCH COOKING SESSIONS
-- ============================================================
CREATE POLICY "batch_select_own" ON batch_cooking_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "batch_insert_own" ON batch_cooking_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SYNC LOG
-- ============================================================
CREATE POLICY "sync_log_select_own" ON sync_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sync_log_insert_own" ON sync_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INGREDIENTS (public read for all authenticated users)
-- ============================================================
CREATE POLICY "ingredients_read_all" ON ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- RECIPES (public read for all authenticated users)
-- ============================================================
CREATE POLICY "recipes_read_all" ON recipes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "recipe_ingredients_read_all" ON recipe_ingredients
  FOR SELECT USING (auth.role() = 'authenticated');
