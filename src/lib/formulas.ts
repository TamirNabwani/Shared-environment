/**
 * Every calculation used in the app lives in this file.
 * Each function cites the formula's name and origin. Nothing here is an
 * invented score: if a value is a convention rather than a measurement,
 * the comment (and the UI) says so.
 */

// ---------------------------------------------------------------------------
// Epley formula — estimated one-repetition maximum
// Origin: Epley, B. (1985). "Poundage Chart". Boyd Epley Workout. Lincoln, NE.
//   1RM = w × (1 + reps / 30)
// Accuracy falls off as reps rise; the common practice is to apply it only to
// sets of roughly 10 reps or fewer. For a single rep we return w itself
// (a 1-rep set *is* the 1RM), which is the usual convention.
// For bodyweight movements, w is the total load: bodyweight + added weight.
// ---------------------------------------------------------------------------
export const EPLEY_MAX_REPS = 10;
export const EPLEY_FORMULA_TEXT = '1RM = w × (1 + reps / 30)  (Epley, 1985)';

export function epley1RM(weightKg: number, reps: number): number | null {
  if (!(weightKg > 0) || !Number.isFinite(weightKg)) return null;
  if (!Number.isInteger(reps) || reps < 1 || reps > EPLEY_MAX_REPS) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

// ---------------------------------------------------------------------------
// Mifflin–St Jeor equation — resting energy expenditure (BMR), kcal/day
// Origin: Mifflin MD, St Jeor ST, et al. (1990). "A new predictive equation
// for resting energy expenditure in healthy individuals."
// Am J Clin Nutr 51(2):241–247.
//   Men:   10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) + 5
//   Women: 10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) − 161
// ---------------------------------------------------------------------------
export type Sex = 'male' | 'female';
export const MIFFLIN_FORMULA_TEXT =
  'BMR = 10·kg + 6.25·cm − 5·age + 5 (men) / −161 (women)  (Mifflin–St Jeor, 1990)';

export function mifflinStJeorBMR(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

// ---------------------------------------------------------------------------
// TDEE = BMR × activity multiplier
// The multipliers are a CONVENTION (commonly attributed to the Harris–Benedict
// activity factors, as popularised by McArdle, Katch & Katch, "Exercise
// Physiology"). They are rough categories, not measurements. The user picks
// one; the app never guesses.
// ---------------------------------------------------------------------------
export const ACTIVITY_MULTIPLIERS = [
  { value: 1.2, label: 'Sedentary (little or no exercise)' },
  { value: 1.375, label: 'Lightly active (1–3 days/week)' },
  { value: 1.55, label: 'Moderately active (3–5 days/week)' },
  { value: 1.725, label: 'Very active (6–7 days/week)' },
  { value: 1.9, label: 'Extra active (hard daily training / physical job)' },
] as const;

export function tdee(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
}

// ---------------------------------------------------------------------------
// Protein reference range: 1.6–2.2 g per kg bodyweight per day
// Origin: Morton RW, et al. (2018). "A systematic review, meta-analysis and
// meta-regression of the effect of protein supplementation on resistance
// training-induced gains in muscle mass and strength in healthy adults."
// Br J Sports Med 52(6):376–384. (1.6 g/kg/day breakpoint; upper 95% CI ≈ 2.2.)
// ---------------------------------------------------------------------------
export const PROTEIN_LOW_G_PER_KG = 1.6;
export const PROTEIN_HIGH_G_PER_KG = 2.2;
export const PROTEIN_SOURCE =
  'Morton et al. (2018), Br J Sports Med 52:376–384 — meta-analysis of protein intake and resistance-training gains.';

export function proteinRange(weightKg: number): { low: number; high: number } {
  return { low: weightKg * PROTEIN_LOW_G_PER_KG, high: weightKg * PROTEIN_HIGH_G_PER_KG };
}

// ---------------------------------------------------------------------------
// Session RPE training load
// Origin: Foster C, et al. (2001). "A new approach to monitoring exercise
// training." J Strength Cond Res 15(1):109–115.
//   load (arbitrary units) = session RPE (CR-10 scale) × duration (minutes)
// ---------------------------------------------------------------------------
export function sessionRpeLoad(sessionRpe: number, durationMin: number): number {
  if (!(sessionRpe >= 0) || !(durationMin >= 0)) return 0;
  return sessionRpe * durationMin;
}

// ---------------------------------------------------------------------------
// Simple moving average (trailing window)
// A standard time-series smoothing technique. Used for the 7-day bodyweight
// average to smooth day-to-day water fluctuations.
// Each output i is the mean of the non-null values in [i − window + 1, i].
// Returns null where the window contains no values.
// ---------------------------------------------------------------------------
export function movingAverage(values: (number | null)[], window: number): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

// ---------------------------------------------------------------------------
// Exponentially weighted moving average (EWMA)
// Origin (as applied to training load): Williams S, et al. (2017).
// "Better way to determine the acute:chronic workload ratio?"
// Br J Sports Med 51(3):209–210. Based on Hunter (1986) EWMA control charts.
//   λ = 2 / (N + 1)
//   EWMA_t = λ × load_t + (1 − λ) × EWMA_(t−1)
// Input must be one value per calendar day (rest days = 0). The series is
// seeded with 0 — a convention; early values are underestimates until about
// N days of history exist.
// ---------------------------------------------------------------------------
export function ewmaLambda(n: number): number {
  return 2 / (n + 1);
}

export function ewma(dailyValues: number[], n: number, seed = 0): number[] {
  const lambda = ewmaLambda(n);
  const out: number[] = [];
  let prev = seed;
  for (const v of dailyValues) {
    prev = lambda * v + (1 - lambda) * prev;
    out.push(prev);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Training volume (sets × reps)
// Standard volume-load definition without the load term; summing the reps of
// every set equals sets × reps when reps are equal across sets.
// ---------------------------------------------------------------------------
export function repVolume(sets: { reps?: number | null }[]): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Total load for bodyweight movements = bodyweight + added weight.
// Simple arithmetic so that changes in bodyweight show up in strength numbers.
// ---------------------------------------------------------------------------
export function totalLoad(bodyweightKg: number | null | undefined, addedKg: number | null | undefined): number | null {
  if (bodyweightKg == null) return null;
  return bodyweightKg + (addedKg ?? 0);
}

// ---------------------------------------------------------------------------
// Energy balance: intake − TDEE (positive = surplus, negative = deficit).
// ---------------------------------------------------------------------------
export function energyBalance(intakeKcal: number, tdeeKcal: number): number {
  return intakeKcal - tdeeKcal;
}

// Age in whole years at a given date.
export function ageOn(birthDateIso: string, onIso: string): number {
  const b = new Date(birthDateIso + 'T00:00:00');
  const d = new Date(onIso + 'T00:00:00');
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}
