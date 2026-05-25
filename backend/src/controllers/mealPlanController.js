'use strict';

const supabase  = require('../db/supabase');
const { generateWeeklyMealPlan } = require('../services/mealGenerationService');
const { generateBatchCookingPlan } = require('../services/batchCookingService');
const {
  calculateBMR, calculateTDEE, calculateBodyFatNavy,
  calculateAgeFromBirthDate, calculateMacroTargets,
} = require('../services/macroService');

async function createOrRegeneratePlan(req, res) {
  const { week_start_date } = req.body;
  if (!week_start_date) return res.status(400).json({ error: 'week_start_date is required' });

  // Fetch user data
  const { data: user } = await supabase
    .from('users')
    .select('*, user_preferences(*)')
    .eq('id', req.userId)
    .single();

  const { data: latestMeasurement } = await supabase
    .from('user_measurements')
    .select('*')
    .eq('user_id', req.userId)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single();

  const prefs = user.user_preferences;
  const age   = user.birth_date ? calculateAgeFromBirthDate(user.birth_date) : 30;
  const bmr   = latestMeasurement
    ? calculateBMR(latestMeasurement.weight_kg, latestMeasurement.height_cm, age, user.sex)
    : 1800;
  const tdee  = calculateTDEE(bmr, prefs?.activity_level || 'moderate');
  const bfPct = latestMeasurement?.body_fat_pct;
  const macros = calculateMacroTargets(
    tdee,
    prefs?.goal || 'maintenance',
    latestMeasurement?.weight_kg || 70,
    bfPct
  );

  // Archive existing active plan for this week
  await supabase
    .from('meal_plans')
    .update({ status: 'archived' })
    .eq('user_id', req.userId)
    .eq('week_start_date', week_start_date)
    .eq('status', 'active');

  // Create new plan
  const { data: plan, error: planErr } = await supabase
    .from('meal_plans')
    .insert({
      user_id:         req.userId,
      week_start_date,
      status:          'active',
      calories_target:  macros.calories,
      protein_target_g: macros.proteinG,
      carbs_target_g:   macros.carbsG,
      fat_target_g:     macros.fatG,
    })
    .select()
    .single();

  if (planErr) return res.status(400).json({ error: planErr.message });

  // Generate meal slots
  const { mealSlots } = await generateWeeklyMealPlan(req.userId, prefs || {}, macros);
  const mealsToInsert = mealSlots.map(s => ({ ...s, meal_plan_id: plan.id, is_synced: true }));

  const { error: mealsErr } = await supabase.from('meal_plan_meals').insert(mealsToInsert);
  if (mealsErr) return res.status(400).json({ error: mealsErr.message });

  // Generate batch cooking sessions
  const batchSessions = await generateBatchCookingPlan(plan.id, week_start_date);
  if (batchSessions.length > 0) {
    await supabase.from('batch_cooking_sessions').insert(
      batchSessions.map(s => ({ ...s, user_id: req.userId }))
    );
  }

  res.status(201).json({ plan_id: plan.id, macros, meal_count: mealsToInsert.length });
}

async function getActivePlan(req, res) {
  const { data, error } = await supabase
    .from('v_current_meal_plan')
    .select('*')
    .eq('user_id', req.userId)
    .order('day_of_week')
    .order('meal_type');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function submitFeedback(req, res) {
  const { meal_id } = req.params;
  const { feedback } = req.body;

  if (!['loved', 'disliked'].includes(feedback)) {
    return res.status(400).json({ error: 'feedback must be "loved" or "disliked"' });
  }

  const { error } = await supabase
    .from('meal_plan_meals')
    .update({ feedback, feedback_at: new Date().toISOString() })
    .eq('id', meal_id)
    .in('meal_plan_id',
      supabase.from('meal_plans').select('id').eq('user_id', req.userId)
    );

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

async function getBatchCookingPlan(req, res) {
  const { plan_id } = req.params;
  const { data, error } = await supabase
    .from('batch_cooking_sessions')
    .select('*')
    .eq('meal_plan_id', plan_id)
    .eq('user_id', req.userId)
    .order('session_number');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { createOrRegeneratePlan, getActivePlan, submitFeedback, getBatchCookingPlan };
