-- CulinaryExpert — PostgreSQL Functions & Views for Offline Sync and Queries

-- ============================================================
-- PULL SYNC: returns all changed records for a user since a given timestamp
-- Called by the mobile app on reconnect
-- ============================================================
CREATE OR REPLACE FUNCTION pull_changes(
  p_user_id       UUID,
  p_last_synced   TIMESTAMPTZ
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user', (
      SELECT row_to_json(u) FROM users u
      WHERE u.id = p_user_id AND u.updated_at > p_last_synced
    ),
    'preferences', (
      SELECT row_to_json(p) FROM user_preferences p
      WHERE p.user_id = p_user_id AND p.updated_at > p_last_synced
    ),
    'measurements', (
      SELECT jsonb_agg(row_to_json(m)) FROM user_measurements m
      WHERE m.user_id = p_user_id AND m.created_at > p_last_synced
    ),
    'health_scores', (
      SELECT jsonb_agg(row_to_json(h)) FROM user_health_scores h
      WHERE h.user_id = p_user_id AND h.scored_at > p_last_synced
    ),
    'meal_plans', (
      SELECT jsonb_agg(row_to_json(mp)) FROM meal_plans mp
      WHERE mp.user_id = p_user_id AND mp.updated_at > p_last_synced
    ),
    'meal_plan_meals', (
      SELECT jsonb_agg(row_to_json(mpm))
      FROM meal_plan_meals mpm
      JOIN meal_plans mp ON mp.id = mpm.meal_plan_id
      WHERE mp.user_id = p_user_id AND mpm.updated_at > p_last_synced
    ),
    'grocery_lists', (
      SELECT jsonb_agg(row_to_json(gl)) FROM grocery_lists gl
      WHERE gl.user_id = p_user_id AND gl.created_at > p_last_synced
    ),
    'grocery_list_items', (
      SELECT jsonb_agg(row_to_json(gli))
      FROM grocery_list_items gli
      JOIN grocery_lists gl ON gl.id = gli.grocery_list_id
      WHERE gl.user_id = p_user_id AND gli.created_at > p_last_synced
    ),
    'server_time', NOW()
  ) INTO result;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

-- ============================================================
-- PUSH SYNC: upserts a batch of local client changes
-- ============================================================
CREATE OR REPLACE FUNCTION push_changes(
  p_user_id  UUID,
  p_changes  JSONB
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result   JSONB := '{"conflicts": []}'::JSONB;
  v_item     JSONB;
BEGIN
  -- Upsert measurements
  IF p_changes ? 'measurements' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_changes->'measurements')
    LOOP
      INSERT INTO user_measurements (
        id, user_id, measured_at, weight_kg, height_cm, waist_cm, neck_cm,
        hips_cm, chest_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm, notes, client_id, is_synced
      )
      VALUES (
        COALESCE((v_item->>'id')::UUID, gen_random_uuid()),
        p_user_id,
        COALESCE((v_item->>'measured_at')::TIMESTAMPTZ, NOW()),
        (v_item->>'weight_kg')::NUMERIC,
        (v_item->>'height_cm')::NUMERIC,
        (v_item->>'waist_cm')::NUMERIC,
        (v_item->>'neck_cm')::NUMERIC,
        (v_item->>'hips_cm')::NUMERIC,
        (v_item->>'chest_cm')::NUMERIC,
        (v_item->>'arm_left_cm')::NUMERIC,
        (v_item->>'arm_right_cm')::NUMERIC,
        (v_item->>'thigh_left_cm')::NUMERIC,
        (v_item->>'thigh_right_cm')::NUMERIC,
        v_item->>'notes',
        v_item->>'client_id',
        TRUE
      )
      ON CONFLICT (id) DO UPDATE
        SET weight_kg = EXCLUDED.weight_kg,
            is_synced = TRUE;
    END LOOP;
  END IF;

  -- Upsert meal plan feedback
  IF p_changes ? 'meal_plan_meals' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_changes->'meal_plan_meals')
    LOOP
      UPDATE meal_plan_meals
      SET feedback    = v_item->>'feedback',
          feedback_at = NOW(),
          is_synced   = TRUE
      WHERE id = (v_item->>'id')::UUID
        AND EXISTS (
          SELECT 1 FROM meal_plans mp
          WHERE mp.id = meal_plan_id AND mp.user_id = p_user_id
        );
    END LOOP;
  END IF;

  -- Upsert grocery item checks
  IF p_changes ? 'grocery_list_items' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_changes->'grocery_list_items')
    LOOP
      UPDATE grocery_list_items
      SET is_checked = (v_item->>'is_checked')::BOOLEAN,
          is_synced  = TRUE
      WHERE id = (v_item->>'id')::UUID
        AND EXISTS (
          SELECT 1 FROM grocery_lists gl
          WHERE gl.id = grocery_list_id AND gl.user_id = p_user_id
        );
    END LOOP;
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================
-- VIEW: current week meal plan with full recipe details
-- ============================================================
CREATE OR REPLACE VIEW v_current_meal_plan AS
SELECT
  mp.id           AS plan_id,
  mp.user_id,
  mp.week_start_date,
  mpm.id          AS meal_id,
  mpm.day_of_week,
  mpm.meal_type,
  mpm.servings,
  mpm.feedback,
  r.id            AS recipe_id,
  r.title         AS recipe_title,
  r.prep_time_minutes,
  r.cook_time_minutes,
  r.total_time_minutes,
  r.calories_per_serving,
  r.protein_g_per_serving,
  r.carbs_g_per_serving,
  r.fat_g_per_serving,
  r.tags,
  r.is_batch_friendly,
  r.image_url
FROM meal_plans mp
JOIN meal_plan_meals mpm ON mpm.meal_plan_id = mp.id
LEFT JOIN recipes r ON r.id = mpm.recipe_id
WHERE mp.status = 'active'
  AND mpm.deleted_at IS NULL;

-- ============================================================
-- VIEW: latest user measurement
-- ============================================================
CREATE OR REPLACE VIEW v_latest_measurement AS
SELECT DISTINCT ON (user_id)
  *
FROM user_measurements
WHERE deleted_at IS NULL
ORDER BY user_id, measured_at DESC;

-- ============================================================
-- VIEW: latest health score
-- ============================================================
CREATE OR REPLACE VIEW v_latest_health_score AS
SELECT DISTINCT ON (user_id)
  *
FROM user_health_scores
ORDER BY user_id, scored_at DESC;
