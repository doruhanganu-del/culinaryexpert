'use strict';

const ACTIVITY_MULTIPLIERS = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

// Mifflin-St Jeor BMR (all inputs in metric)
function calculateBMR(weightKg, heightCm, ageYears, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate;
  return bmr * multiplier;
}

// US Navy Body Fat formula (measurements in cm)
function calculateBodyFatNavy(sex, waistCm, neckCm, heightCm, hipsCm = null) {
  if (!waistCm || !neckCm || !heightCm) return null;

  let bf;
  if (sex === 'male') {
    bf = 86.010 * Math.log10(waistCm - neckCm)
       - 70.041 * Math.log10(heightCm)
       + 36.76;
  } else if (sex === 'female' && hipsCm) {
    bf = 163.205 * Math.log10(waistCm + hipsCm - neckCm)
       - 97.684  * Math.log10(heightCm)
       - 78.387;
  } else {
    return null;
  }

  return Math.max(0, Math.min(100, parseFloat(bf.toFixed(2))));
}

function calculateAgeFromBirthDate(birthDateStr) {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Macro targets based on TDEE and goal
function calculateMacroTargets(tdee, goal, weightKg, bodyFatPct) {
  const leanMassKg = bodyFatPct
    ? weightKg * (1 - bodyFatPct / 100)
    : weightKg * 0.8;

  let calTarget = tdee;
  let proteinRatio, carbRatio, fatRatio;

  switch (goal) {
    case 'weight_loss':
      calTarget    = tdee * 0.85;
      proteinRatio = 0.33;
      carbRatio    = 0.38;
      fatRatio     = 0.29;
      break;
    case 'hypertrophy':
      calTarget    = tdee * 1.10;
      proteinRatio = 0.30;
      carbRatio    = 0.45;
      fatRatio     = 0.25;
      break;
    case 'endurance':
      proteinRatio = 0.22;
      carbRatio    = 0.55;
      fatRatio     = 0.23;
      break;
    default: // maintenance
      proteinRatio = 0.27;
      carbRatio    = 0.43;
      fatRatio     = 0.30;
  }

  const proteinG = parseFloat(((calTarget * proteinRatio) / 4).toFixed(1));
  const carbsG   = parseFloat(((calTarget * carbRatio)    / 4).toFixed(1));
  const fatG     = parseFloat(((calTarget * fatRatio)     / 9).toFixed(1));

  return {
    calories: parseFloat(calTarget.toFixed(0)),
    proteinG,
    carbsG,
    fatG,
    leanMassKg: parseFloat(leanMassKg.toFixed(2)),
  };
}

// Health score (0–100)
function calculateHealthScore({ bodyFatPct, sex, macroAdherencePct, nutrientDensityPct, varietyPct }) {
  let bodyCompScore = 50;
  if (bodyFatPct != null) {
    const healthyMin = sex === 'male' ? 10 : 18;
    const healthyMax = sex === 'male' ? 20 : 28;
    if (bodyFatPct >= healthyMin && bodyFatPct <= healthyMax) {
      bodyCompScore = 100;
    } else {
      const dist = Math.min(
        Math.abs(bodyFatPct - healthyMin),
        Math.abs(bodyFatPct - healthyMax)
      );
      bodyCompScore = Math.max(0, 100 - dist * 5);
    }
  }

  const macroScore = macroAdherencePct != null
    ? Math.max(0, 100 - Math.abs(100 - macroAdherencePct) * 2)
    : 50;

  const score =
    macroScore         * 0.35 +
    (nutrientDensityPct ?? 60) * 0.25 +
    bodyCompScore      * 0.25 +
    (varietyPct ?? 60) * 0.15;

  return parseFloat(Math.min(100, Math.max(0, score)).toFixed(1));
}

// Imperial to metric conversions
const CONVERSIONS = {
  lbsToKg:     lbs => lbs * 0.453592,
  kgToLbs:     kg  => kg  / 0.453592,
  inchesToCm:  i   => i   * 2.54,
  cmToInches:  cm  => cm  / 2.54,
};

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateBodyFatNavy,
  calculateAgeFromBirthDate,
  calculateMacroTargets,
  calculateHealthScore,
  CONVERSIONS,
};
