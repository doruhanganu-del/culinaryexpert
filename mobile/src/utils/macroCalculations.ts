import type { Sex, ActivityLevel, Goal, MacroTargets } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export function calculateBMR(weightKg: number, heightCm: number, ageYears: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55);
}

export function calculateBodyFatNavy(
  sex: Sex,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipsCm?: number,
): number | null {
  if (!waistCm || !neckCm || !heightCm) return null;

  let bf: number;
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

  return parseFloat(Math.max(0, Math.min(100, bf)).toFixed(2));
}

/**
 * ISSN Position Stand (Stokes et al. 2018) based macro targets:
 * Protein sourced from lean body mass, not total body weight.
 * Fat set as % of total calories (hormonal health, satiety).
 * Carbs fill the remaining calories.
 */
export function calculateMacroTargets(
  tdee: number,
  goal: Goal,
  weightKg: number,
  bodyFatPct: number | null,
): MacroTargets {
  const leanMassKg = bodyFatPct != null ? weightKg * (1 - bodyFatPct / 100) : weightKg * 0.82;

  let calTarget: number;
  let proteinG: number;
  let fatPct: number;

  switch (goal) {
    case 'weightLoss':
    case 'weight_loss':
      // 500 kcal deficit, high protein to preserve lean mass (2.2 g/kg LBM)
      calTarget = Math.max(tdee - 500, 1200);
      proteinG  = leanMassKg * 2.2;
      fatPct    = 0.28;
      break;
    case 'hypertrophy':
      // +200 kcal lean bulk, 2.0 g/kg LBM protein for MPS
      calTarget = tdee + 200;
      proteinG  = leanMassKg * 2.0;
      fatPct    = 0.25;
      break;
    case 'endurance':
      // Match TDEE, carb-dominant for glycogen replenishment
      calTarget = tdee;
      proteinG  = weightKg * 1.5;
      fatPct    = 0.20;
      break;
    default:
      calTarget = tdee;
      proteinG  = leanMassKg * 1.7;
      fatPct    = 0.28;
  }

  const fatG  = Math.round((calTarget * fatPct) / 9);
  const carbsG = Math.max(0, Math.round((calTarget - proteinG * 4 - fatG * 9) / 4));

  return {
    calories: Math.round(calTarget),
    proteinG: Math.round(proteinG),
    carbsG,
    fatG,
  };
}

export function calculateAgeFromBirthDate(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function calculateHealthScore(params: {
  bodyFatPct: number | null;
  sex: Sex;
  macroAdherencePct?: number;
  nutrientDensityPct?: number;
  varietyPct?: number;
}): number {
  const { bodyFatPct, sex, macroAdherencePct = 70, nutrientDensityPct = 60, varietyPct = 60 } = params;

  let bodyCompScore = 50;
  if (bodyFatPct != null) {
    const healthyMin = sex === 'male' ? 10 : 18;
    const healthyMax = sex === 'male' ? 20 : 28;
    if (bodyFatPct >= healthyMin && bodyFatPct <= healthyMax) {
      bodyCompScore = 100;
    } else {
      const dist = Math.min(Math.abs(bodyFatPct - healthyMin), Math.abs(bodyFatPct - healthyMax));
      bodyCompScore = Math.max(0, 100 - dist * 5);
    }
  }

  const macroScore = Math.max(0, 100 - Math.abs(100 - macroAdherencePct) * 2);

  const score = macroScore * 0.35 + nutrientDensityPct * 0.25 + bodyCompScore * 0.25 + varietyPct * 0.15;
  return parseFloat(Math.min(100, Math.max(0, score)).toFixed(1));
}

const VISUAL_PORTIONS: Record<string, { g: number; label: string }> = {
  palm:      { g: 85,  label: 'size of your palm' },
  fist:      { g: 150, label: '1 fist' },
  cup:       { g: 240, label: '1 cup' },
  half_cup:  { g: 120, label: '1/2 cup' },
  tablespoon:{ g: 15,  label: '1 tablespoon' },
  teaspoon:  { g: 5,   label: '1 teaspoon' },
  dice4:     { g: 28,  label: '4 stacked dice' },
};

export function gramsToVisualPortion(grams: number, category?: string): string {
  if (category?.toLowerCase().includes('protein')) {
    const palms = grams / VISUAL_PORTIONS.palm.g;
    return `${palms.toFixed(1)} ${palms === 1 ? 'palm' : 'palms'}`;
  }
  if (grams >= 200) {
    const cups = grams / VISUAL_PORTIONS.cup.g;
    return `${cups.toFixed(1)} cup${cups !== 1 ? 's' : ''}`;
  }
  if (grams >= 100) return `1/2 cup`;
  if (grams >= 14) {
    const tbsp = Math.round(grams / VISUAL_PORTIONS.tablespoon.g);
    return `${tbsp} tablespoon${tbsp !== 1 ? 's' : ''}`;
  }
  return `${Math.round(grams)}g`;
}
