/**
 * Aggregations over logged data. No new formulas live here — anything
 * that is a formula is imported from ./formulas.
 */
import type { Exercise } from '../data/exercises.seed';
import type { Attempt, BodyEntry, Session, SetEntry } from '../db/db';
import { addDays, daysBetween, eachDay, weekStart } from './dates';
import { ageOn, epley1RM, ewma, mifflinStJeorBMR, movingAverage, repVolume, sessionRpeLoad, tdee, totalLoad, type Sex } from './formulas';

export type PRType = 'reps' | 'hold' | 'weighted';

export interface Performance extends SetEntry {
  date: string;
  bodyweightKg: number | null;
  source: 'session' | 'attempt';
  sourceId?: number;
}

/** Bodyweight from the closest logged day (prefers on-or-before the date). */
export function bodyweightOn(body: BodyEntry[], date: string): number | null {
  const withWeight = body.filter((b) => b.weightKg != null).sort((a, b) => a.date.localeCompare(b.date));
  if (!withWeight.length) return null;
  let best: BodyEntry | null = null;
  for (const b of withWeight) if (b.date <= date) best = b;
  return (best ?? withWeight[0]).weightKg ?? null;
}

export function collectPerformances(sessions: Session[], attempts: Attempt[], body: BodyEntry[]): Performance[] {
  const out: Performance[] = [];
  for (const s of sessions) {
    const bw = bodyweightOn(body, s.date);
    for (const set of s.sets) out.push({ ...set, date: s.date, bodyweightKg: bw, source: 'session', sourceId: s.id });
  }
  for (const a of attempts) {
    out.push({
      exerciseId: a.exerciseId,
      reps: a.reps,
      seconds: a.seconds,
      addedKg: a.addedKg,
      rpe: a.rpe,
      date: a.date,
      bodyweightKg: a.bodyweightKg ?? bodyweightOn(body, a.date),
      source: 'attempt',
      sourceId: a.id,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** The value a performance scores for a given PR type, or null if it doesn't count. */
export function prValue(p: SetEntry, type: PRType): number | null {
  const added = p.addedKg ?? 0;
  if (type === 'reps') return p.reps && p.reps > 0 && added <= 0 ? p.reps : null;
  if (type === 'hold') return p.seconds && p.seconds > 0 ? p.seconds : null;
  return added > 0 && p.reps && p.reps > 0 ? added : null;
}

export function prTypesFor(ex: Exercise): PRType[] {
  return ex.measure === 'hold' ? ['hold'] : ['reps', 'weighted'];
}

export interface PRPoint {
  date: string;
  value: number; // best of that day
  best: number; // running best up to that day
  isPR: boolean; // day's best beat every earlier day
  perf: Performance;
}

/** Per-day best and PR flags for one exercise and PR type, in date order. */
export function prHistory(perfs: Performance[], exerciseId: string, type: PRType): PRPoint[] {
  const byDay = new Map<string, Performance>();
  for (const p of perfs) {
    if (p.exerciseId !== exerciseId) continue;
    const v = prValue(p, type);
    if (v == null) continue;
    const cur = byDay.get(p.date);
    if (!cur || better(p, cur, type)) byDay.set(p.date, p);
  }
  const days = [...byDay.keys()].sort();
  let best = -Infinity;
  return days.map((date) => {
    const perf = byDay.get(date)!;
    const value = prValue(perf, type)!;
    const isPR = value > best;
    best = Math.max(best, value);
    return { date, value, best, isPR, perf };
  });
}

// For weighted PRs, ties on added kg are broken by reps.
function better(a: SetEntry, b: SetEntry, type: PRType): boolean {
  const va = prValue(a, type)!;
  const vb = prValue(b, type)!;
  if (va !== vb) return va > vb;
  return type === 'weighted' && (a.reps ?? 0) > (b.reps ?? 0);
}

/** Would this new performance beat every earlier one (any date) for any PR type? */
export function newPRTypes(previous: Performance[], candidate: SetEntry): PRType[] {
  const types: PRType[] = ['reps', 'hold', 'weighted'];
  return types.filter((t) => {
    const v = prValue(candidate, t);
    if (v == null) return false;
    return previous.every((p) => p.exerciseId !== candidate.exerciseId || (prValue(p, t) ?? -Infinity) < v);
  });
}

/** Estimated 1RM of total load (bodyweight + added) via Epley, if applicable. */
export function estimated1RM(p: Performance): number | null {
  const load = totalLoad(p.bodyweightKg, p.addedKg);
  if (load == null || !p.reps) return null;
  return epley1RM(load, p.reps);
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------
export function sessionVolume(s: Session) {
  return {
    sets: s.sets.length,
    reps: repVolume(s.sets),
    holdSec: s.sets.reduce((sum, x) => sum + (x.seconds ?? 0), 0),
  };
}

export interface MuscleVolume {
  muscle: string;
  primarySets: number;
  secondarySets: number;
  reps: number;
  holdSec: number;
}

/** Sets per muscle in [start, end]. Primary and secondary are counted separately, never blended. */
export function muscleVolume(
  sessions: Session[],
  exMap: Map<string, Exercise>,
  start: string,
  end: string,
): Map<string, MuscleVolume> {
  const out = new Map<string, MuscleVolume>();
  const get = (m: string) => {
    if (!out.has(m)) out.set(m, { muscle: m, primarySets: 0, secondarySets: 0, reps: 0, holdSec: 0 });
    return out.get(m)!;
  };
  for (const s of sessions) {
    if (s.date < start || s.date > end) continue;
    for (const set of s.sets) {
      const ex = exMap.get(set.exerciseId);
      if (!ex) continue;
      for (const m of ex.primary) {
        const v = get(m);
        v.primarySets++;
        v.reps += set.reps ?? 0;
        v.holdSec += set.seconds ?? 0;
      }
      for (const m of ex.secondary) get(m).secondarySets++;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Days since last trained
// ---------------------------------------------------------------------------
export function lastTrainedByExercise(perfs: Performance[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of perfs) if (!out.has(p.exerciseId) || out.get(p.exerciseId)! < p.date) out.set(p.exerciseId, p.date);
  return out;
}

/** Last date each muscle was trained as a primary mover. */
export function lastTrainedByMuscle(perfs: Performance[], exMap: Map<string, Exercise>): Map<string, string> {
  const out = new Map<string, string>();
  for (const p of perfs) {
    for (const m of exMap.get(p.exerciseId)?.primary ?? []) {
      if (!out.has(m) || out.get(m)! < p.date) out.set(m, p.date);
    }
  }
  return out;
}

export function daysSince(date: string | undefined, today: string): number | null {
  return date ? daysBetween(date, today) : null;
}

// ---------------------------------------------------------------------------
// Training load: session-RPE per day with 7- and 28-day EWMA
// ---------------------------------------------------------------------------
export interface LoadPoint {
  date: string;
  load: number;
  acute: number;
  chronic: number;
}

export function trainingLoadSeries(sessions: Session[], start: string, end: string): LoadPoint[] {
  if (!sessions.length) return [];
  const first = sessions.reduce((min, s) => (s.date < min ? s.date : min), sessions[0].date);
  // EWMA needs the full history from the first session, then we slice to the range.
  const from = first < start ? first : start;
  const days = eachDay(from, end);
  const daily = new Map<string, number>();
  for (const s of sessions) daily.set(s.date, (daily.get(s.date) ?? 0) + sessionRpeLoad(s.sessionRpe, s.durationMin));
  const loads = days.map((d) => daily.get(d) ?? 0);
  const acute = ewma(loads, 7);
  const chronic = ewma(loads, 28);
  return days
    .map((date, i) => ({ date, load: loads[i], acute: acute[i], chronic: chronic[i] }))
    .filter((p) => p.date >= start);
}

// ---------------------------------------------------------------------------
// Daily series and weekly averages
// ---------------------------------------------------------------------------
export function dailySeries<T extends { date: string }>(
  rows: T[],
  pick: (row: T) => number | null | undefined,
  start: string,
  end: string,
): { date: string; value: number | null }[] {
  const byDate = new Map(rows.map((r) => [r.date, pick(r)]));
  return eachDay(start, end).map((date) => {
    const v = byDate.get(date);
    return { date, value: v == null || Number.isNaN(v) ? null : v };
  });
}

export function weeklyAverages(series: { date: string; value: number | null }[]) {
  const weeks = new Map<string, number[]>();
  for (const p of series) {
    if (p.value == null) continue;
    const w = weekStart(p.date);
    if (!weeks.has(w)) weeks.set(w, []);
    weeks.get(w)!.push(p.value);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, vals]) => ({ week, avg: vals.reduce((a, b) => a + b, 0) / vals.length, days: vals.length }));
}

/** Mean of the non-null values from the last `n` days ending at `end`. */
export function trailingAverage<T extends { date: string }>(
  rows: T[],
  pick: (row: T) => number | null | undefined,
  end: string,
  n = 7,
): { avg: number | null; days: number } {
  const start = addDays(end, -(n - 1));
  const vals = rows
    .filter((r) => r.date >= start && r.date <= end)
    .map(pick)
    .filter((v): v is number => v != null && !Number.isNaN(v));
  return { avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, days: vals.length };
}

/** Earliest date for a dashboard range option. */
export function rangeStart(range: '30' | '90' | '365' | 'all', today: string, earliest: string | null): string {
  if (range === 'all') return earliest && earliest < today ? earliest : addDays(today, -29);
  return addDays(today, -(Number(range) - 1));
}

// ---------------------------------------------------------------------------
// Energy: BMR / TDEE from the profile and the 7-day average bodyweight
// ---------------------------------------------------------------------------
export interface EnergyEstimate {
  weightKg: number;
  age: number;
  bmr: number;
  tdee: number | null; // null until an activity multiplier is chosen
}

export function energyEstimate(
  profile: { sex: Sex; birthDate: string; heightCm: number; activityMultiplier: number | null } | null | undefined,
  body: BodyEntry[],
  today: string,
): EnergyEstimate | null {
  if (!profile?.birthDate || !profile.heightCm) return null;
  const latest = [...body].reverse().find((b) => b.weightKg != null);
  if (!latest) return null;
  const weightKg = trailingAverage(body, (b) => b.weightKg, latest.date, 7).avg!;
  const age = ageOn(profile.birthDate, today);
  const bmr = mifflinStJeorBMR(profile.sex, weightKg, profile.heightCm, age);
  return { weightKg, age, bmr, tdee: profile.activityMultiplier ? tdee(bmr, profile.activityMultiplier) : null };
}

/**
 * Daily values plus a trailing moving average for [start, end]. Days before
 * `start` feed the average so the first days in range have a full window.
 */
export function smoothedSeries<T extends { date: string }>(
  rows: T[],
  pick: (row: T) => number | null | undefined,
  start: string,
  end: string,
  window = 7,
): { date: string; value: number | null; avg: number | null }[] {
  const from = addDays(start, -(window - 1));
  const daily = dailySeries(rows, pick, from, end);
  const avg = movingAverage(daily.map((d) => d.value), window);
  return daily.map((d, i) => ({ ...d, avg: avg[i] })).filter((d) => d.date >= start);
}
