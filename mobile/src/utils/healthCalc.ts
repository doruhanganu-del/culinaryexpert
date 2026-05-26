const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR — most validated formula for general population (Thomas et al. 2016) */
export function calcBMR(weightKg: number, heightCm: number, ageYears: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTDEE(bmr: number, activityLevel: string): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55);
}

/** US Navy circumference method — validated for adults 18-60 (Hodgdon & Beckett 1984) */
export function calcBodyFatNavy(
  sex: 'male' | 'female',
  waistCm: number | null,
  neckCm: number | null,
  heightCm: number,
  hipsCm?: number | null,
): number | null {
  if (!waistCm || !neckCm) return null;
  let bf: number;
  if (sex === 'male') {
    const diff = waistCm - neckCm;
    if (diff <= 0) return null;
    bf = 86.010 * Math.log10(diff) - 70.041 * Math.log10(heightCm) + 36.76;
  } else if (sex === 'female' && hipsCm) {
    const sum = waistCm + hipsCm - neckCm;
    if (sum <= 0) return null;
    bf = 163.205 * Math.log10(sum) - 97.684 * Math.log10(heightCm) - 78.387;
  } else {
    return null;
  }
  return Math.max(0, Math.min(100, parseFloat(bf.toFixed(2))));
}

/** Lean body mass in kg */
export function calcLeanMass(weightKg: number, bodyFatPct: number | null): number {
  return bodyFatPct != null ? weightKg * (1 - bodyFatPct / 100) : weightKg * 0.82;
}

/**
 * Evidence-based calorie targets (NSCA, ACSM):
 * Weight loss:  500 kcal/day deficit → ~0.5 kg/week fat loss, safe floor at 1200/1500 kcal
 * Hypertrophy:  +200 kcal/day lean bulk → minimises fat gain while supporting MPS
 * Endurance:    Match TDEE for training performance
 */
export function calcCalorieTarget(tdee: number, goal: string, sex?: 'male' | 'female'): number {
  const safeMin = sex === 'female' ? 1200 : 1500;
  switch (goal) {
    case 'weightLoss':
    case 'weight_loss': return Math.max(Math.round(tdee - 500), safeMin);
    case 'hypertrophy': return Math.round(tdee + 200);
    default:            return Math.round(tdee);
  }
}

/**
 * ACE body fat classification:
 * Male:   Athlete 6-13%, Fitness 14-17%, Acceptable 18-24%, Obese 25%+
 * Female: Athlete 14-20%, Fitness 21-24%, Acceptable 25-31%, Obese 32%+
 */
function bodyFatScore(bf: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    if (bf >= 6  && bf <= 17) return 100;
    if (bf >= 17 && bf <= 24) return 80;
    if (bf >  24 && bf <= 29) return 55;
    if (bf >  29 && bf <= 35) return 30;
    return 15;
  } else {
    if (bf >= 14 && bf <= 27) return 100;
    if (bf >= 27 && bf <= 31) return 80;
    if (bf >  31 && bf <= 36) return 55;
    if (bf >  36 && bf <= 42) return 30;
    return 15;
  }
}

export function calcHealthScore(bodyFatPct: number | null, sex: 'male' | 'female'): number {
  const bfScore = bodyFatPct != null ? bodyFatScore(bodyFatPct, sex) : 50;
  // Weighted composite: body comp 40%, macro adherence 25% (baseline), nutrient density 20%, variety 15%
  const score = 0.40 * bfScore + 0.25 * 70 + 0.20 * 65 + 0.15 * 60;
  return parseFloat(Math.min(100, Math.max(0, score)).toFixed(1));
}
