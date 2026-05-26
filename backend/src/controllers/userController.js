'use strict';

const supabase = require('../db/supabase');
const {
  calculateBMR,
  calculateTDEE,
  calculateBodyFatNavy,
  calculateAgeFromBirthDate,
  calculateMacroTargets,
  calculateHealthScore,
  CONVERSIONS,
} = require('../services/macroService');

async function getProfile(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_preferences(*)')
    .eq('id', req.userId)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
}

async function upsertProfile(req, res) {
  const {
    unit_system, sex, birth_date, display_name,
    activity_level, grocery_budget_weekly, max_cooking_time_minutes,
    allergies, favorite_foods, disliked_foods,
    budget_mode, fast_life_mode, body_sculpt_mode, goal,
    // Measurement fields
    weight, height, waist, neck, hips, chest,
    arm_left, arm_right, arm_left_length, arm_right_length,
    forearm_left, forearm_right,
    thigh_left, thigh_right, thigh_left_length, thigh_right_length,
    calf_left, calf_right,
  } = req.body;

  const isImperial = unit_system === 'imperial';
  const cm = (v) => (v != null ? CONVERSIONS.inchesToCm(v) : null);

  const weightKg = weight != null ? (isImperial ? CONVERSIONS.lbsToKg(weight) : weight) : null;
  const heightCm = height != null ? (isImperial ? CONVERSIONS.inchesToCm(height) : height) : null;
  const waistCm  = waist  != null ? (isImperial ? cm(waist)  : waist)  : null;
  const neckCm   = neck   != null ? (isImperial ? cm(neck)   : neck)   : null;
  const hipsCm   = hips   != null ? (isImperial ? cm(hips)   : hips)   : null;
  const chestCm  = chest  != null ? (isImperial ? cm(chest)  : chest)  : null;

  const armLeftCm        = arm_left         != null ? (isImperial ? cm(arm_left)         : arm_left)         : null;
  const armRightCm       = arm_right        != null ? (isImperial ? cm(arm_right)        : arm_right)        : null;
  const armLeftLenCm     = arm_left_length  != null ? (isImperial ? cm(arm_left_length)  : arm_left_length)  : null;
  const armRightLenCm    = arm_right_length != null ? (isImperial ? cm(arm_right_length) : arm_right_length) : null;
  const forearmLeftCm    = forearm_left     != null ? (isImperial ? cm(forearm_left)     : forearm_left)     : null;
  const forearmRightCm   = forearm_right    != null ? (isImperial ? cm(forearm_right)    : forearm_right)    : null;
  const thighLeftCm      = thigh_left       != null ? (isImperial ? cm(thigh_left)       : thigh_left)       : null;
  const thighRightCm     = thigh_right      != null ? (isImperial ? cm(thigh_right)      : thigh_right)      : null;
  const thighLeftLenCm   = thigh_left_length  != null ? (isImperial ? cm(thigh_left_length)  : thigh_left_length)  : null;
  const thighRightLenCm  = thigh_right_length != null ? (isImperial ? cm(thigh_right_length) : thigh_right_length) : null;
  const calfLeftCm       = calf_left        != null ? (isImperial ? cm(calf_left)        : calf_left)        : null;
  const calfRightCm      = calf_right       != null ? (isImperial ? cm(calf_right)       : calf_right)       : null;

  const { error: upsertErr } = await supabase.from('users').upsert({
    id: req.userId,
    unit_system: unit_system || 'metric',
    sex,
    birth_date,
    display_name,
    updated_at: new Date().toISOString(),
  });
  if (upsertErr) return res.status(400).json({ error: upsertErr.message });

  if (activity_level !== undefined) {
    await supabase.from('user_preferences').upsert({
      user_id: req.userId,
      activity_level,
      grocery_budget_weekly,
      max_cooking_time_minutes,
      allergies:        allergies        || [],
      favorite_foods:   favorite_foods   || [],
      disliked_foods:   disliked_foods   || [],
      budget_mode:      budget_mode      || false,
      fast_life_mode:   fast_life_mode   || false,
      body_sculpt_mode: body_sculpt_mode || false,
      goal: goal || 'maintenance',
    });
  }

  if (weightKg && heightCm) {
    const round1 = (v) => v != null ? parseFloat(v.toFixed(1)) : null;

    const measurement = {
      user_id:              req.userId,
      weight_kg:            parseFloat(weightKg.toFixed(2)),
      height_cm:            parseFloat(heightCm.toFixed(1)),
      waist_cm:             round1(waistCm),
      neck_cm:              round1(neckCm),
      hips_cm:              round1(hipsCm),
      chest_cm:             round1(chestCm),
      arm_left_cm:          round1(armLeftCm),
      arm_right_cm:         round1(armRightCm),
      arm_left_length_cm:   round1(armLeftLenCm),
      arm_right_length_cm:  round1(armRightLenCm),
      forearm_left_cm:      round1(forearmLeftCm),
      forearm_right_cm:     round1(forearmRightCm),
      thigh_left_cm:        round1(thighLeftCm),
      thigh_right_cm:       round1(thighRightCm),
      thigh_left_length_cm: round1(thighLeftLenCm),
      thigh_right_length_cm:round1(thighRightLenCm),
      calf_left_cm:         round1(calfLeftCm),
      calf_right_cm:        round1(calfRightCm),
      is_synced:            true,
    };
    await supabase.from('user_measurements').insert(measurement);

    if (sex && birth_date) {
      const age    = calculateAgeFromBirthDate(birth_date);
      const bmr    = calculateBMR(weightKg, heightCm, age, sex);
      const tdee   = calculateTDEE(bmr, activity_level || 'moderate');
      const bfPct  = calculateBodyFatNavy(sex, waistCm, neckCm, heightCm, hipsCm);
      const macros = calculateMacroTargets(tdee, goal || 'maintenance', weightKg, bfPct);

      // Profile completeness → proxy for engagement and macro adherence
      const hasBodyComp       = !!(waistCm && neckCm && heightCm);
      const hasGoalAndActivity = !!(goal && activity_level && activity_level !== 'sedentary');
      const macroAdherencePct  = bfPct != null ? 85 : (hasBodyComp ? 75 : 65);
      const nutrientDensityPct = hasBodyComp ? 72 : 60;
      const varietyPct         = hasGoalAndActivity ? 70 : 60;

      const score = calculateHealthScore({ bodyFatPct: bfPct, sex, macroAdherencePct, nutrientDensityPct, varietyPct });

      // bodyCompScore for breakdown
      let bodyCompScore = 50;
      if (bfPct != null) {
        const healthyMin = sex === 'male' ? 10 : 18;
        const healthyMax = sex === 'male' ? 20 : 28;
        if (bfPct >= healthyMin && bfPct <= healthyMax) {
          bodyCompScore = 100;
        } else {
          const dist = Math.min(Math.abs(bfPct - healthyMin), Math.abs(bfPct - healthyMax));
          bodyCompScore = Math.max(0, 100 - dist * 5);
        }
      }

      await supabase.from('user_health_scores').insert({
        user_id:         req.userId,
        score,
        bmr:             parseFloat(bmr.toFixed(2)),
        tdee:            parseFloat(tdee.toFixed(2)),
        body_fat_pct:    bfPct,
        lean_mass_kg:    macros.leanMassKg,
        score_breakdown: {
          macroAdherenceScore: macroAdherencePct,
          nutrientDensityScore: nutrientDensityPct,
          bodyCompScore:        parseFloat(bodyCompScore.toFixed(1)),
          varietyScore:         varietyPct,
        },
      });
    }
  }

  res.json({ success: true });
}

async function getMeasurementHistory(req, res) {
  const { data, error } = await supabase
    .from('user_measurements')
    .select('*')
    .eq('user_id', req.userId)
    .is('deleted_at', null)
    .order('measured_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function getHealthScoreHistory(req, res) {
  const { data, error } = await supabase
    .from('user_health_scores')
    .select('*')
    .eq('user_id', req.userId)
    .order('scored_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function acceptLegal(req, res) {
  const { type } = req.params; // 'medical', 'privacy', 'terms'
  const col = {
    medical: 'medical_disclaimer_accepted_at',
    privacy: 'privacy_policy_accepted_at',
    terms:   'terms_accepted_at',
  }[type];

  if (!col) return res.status(400).json({ error: 'Invalid legal document type' });

  await supabase.from('users').update({ [col]: new Date().toISOString() }).eq('id', req.userId);
  res.json({ accepted: type, at: new Date().toISOString() });
}

module.exports = { getProfile, upsertProfile, getMeasurementHistory, getHealthScoreHistory, acceptLegal };
