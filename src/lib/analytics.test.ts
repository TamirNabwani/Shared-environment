import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises.seed';
import type { Session } from '../db/db';
import {
  bodyweightOn,
  collectPerformances,
  estimated1RM,
  lastTrainedByMuscle,
  muscleVolume,
  newPRTypes,
  prHistory,
  smoothedSeries,
  trainingLoadSeries,
  weeklyAverages,
} from './analytics';
import { eachDay, weekStart } from './dates';

const exMap = new Map(EXERCISES.map((e) => [e.id, e]));

const sessions: Session[] = [
  { id: 1, date: '2026-01-01', durationMin: 60, sessionRpe: 7, sets: [{ exerciseId: 'pullups', reps: 8 }, { exerciseId: 'pullups', reps: 6 }] },
  { id: 2, date: '2026-01-03', durationMin: 45, sessionRpe: 8, sets: [{ exerciseId: 'pullups', reps: 7 }, { exerciseId: 'pullups', reps: 5, addedKg: 10 }] },
  { id: 3, date: '2026-01-05', durationMin: 30, sessionRpe: 6, sets: [{ exerciseId: 'pullups', reps: 10 }, { exerciseId: 'plank', seconds: 90 }] },
];
const body = [{ date: '2026-01-01', weightKg: 80 }, { date: '2026-01-04', weightKg: 79 }];

describe('PR detection', () => {
  const perfs = collectPerformances(sessions, [], body);
  it('keeps the best set per day and flags days that beat all earlier days', () => {
    const h = prHistory(perfs, 'pullups', 'reps');
    expect(h.map((p) => [p.date, p.value, p.isPR])).toEqual([
      ['2026-01-01', 8, true],
      ['2026-01-03', 7, false],
      ['2026-01-05', 10, true],
    ]);
  });
  it('separates weighted sets from bodyweight rep PRs', () => {
    const h = prHistory(perfs, 'pullups', 'weighted');
    expect(h).toHaveLength(1);
    expect(h[0].value).toBe(10);
  });
  it('detects a new PR for a candidate set', () => {
    expect(newPRTypes(perfs, { exerciseId: 'pullups', reps: 11 })).toEqual(['reps']);
    expect(newPRTypes(perfs, { exerciseId: 'pullups', reps: 10 })).toEqual([]);
    expect(newPRTypes(perfs, { exerciseId: 'plank', seconds: 91 })).toEqual(['hold']);
    expect(newPRTypes(perfs, { exerciseId: 'dips', reps: 1 })).toEqual(['reps']);
  });
  it('uses nearest earlier bodyweight and Epley on total load', () => {
    expect(bodyweightOn(body, '2026-01-03')).toBe(80);
    expect(bodyweightOn(body, '2025-12-01')).toBe(80);
    const weighted = perfs.find((p) => p.addedKg === 10)!;
    // (80 + 10) × (1 + 5/30) = 105
    expect(estimated1RM(weighted)).toBeCloseTo(105, 6);
  });
});

describe('volume and recency', () => {
  it('counts primary and secondary sets separately', () => {
    const v = muscleVolume(sessions, exMap, '2026-01-01', '2026-01-07');
    expect(v.get('lats')!.primarySets).toBe(5);
    expect(v.get('lats')!.reps).toBe(36);
    expect(v.get('biceps')!.secondarySets).toBe(5);
    expect(v.get('abs')!.holdSec).toBe(90);
  });
  it('last trained by primary muscle', () => {
    const m = lastTrainedByMuscle(collectPerformances(sessions, [], []), exMap);
    expect(m.get('lats')).toBe('2026-01-05');
    expect(m.get('biceps')).toBeUndefined();
  });
});

describe('training load series', () => {
  it('includes rest days as zero and session-RPE × minutes', () => {
    const s = trainingLoadSeries(sessions, '2026-01-01', '2026-01-05');
    expect(s.map((p) => p.load)).toEqual([420, 0, 360, 0, 180]);
    expect(s[0].acute).toBeCloseTo(105, 6); // 0.25 × 420
  });
  it('carries EWMA history from before the visible range', () => {
    const s = trainingLoadSeries(sessions, '2026-01-05', '2026-01-05');
    expect(s).toHaveLength(1);
    expect(s[0].acute).toBeGreaterThan(0.25 * 180);
  });
});

describe('dates', () => {
  it('weeks start on Monday', () => {
    expect(weekStart('2026-10-10')).toBe('2026-10-05'); // Sat → Mon
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
  });
  it('eachDay is inclusive and crosses months', () => {
    expect(eachDay('2026-01-30', '2026-02-02')).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });
  it('weekly averages ignore missing days', () => {
    const w = weeklyAverages([
      { date: '2026-10-05', value: 7 },
      { date: '2026-10-06', value: null },
      { date: '2026-10-07', value: 8 },
    ]);
    expect(w).toEqual([{ week: '2026-10-05', avg: 7.5, days: 2 }]);
  });
});

describe('smoothedSeries', () => {
  it('uses days before the range to fill the first window', () => {
    const rows = [{ date: '2026-01-01', v: 80 }, { date: '2026-01-02', v: 82 }, { date: '2026-01-03', v: 84 }];
    const s = smoothedSeries(rows, (r) => r.v, '2026-01-03', '2026-01-03', 7);
    expect(s).toEqual([{ date: '2026-01-03', value: 84, avg: 82 }]);
  });
});
