import { describe, expect, it } from 'vitest';
import { DEFAULT_PR_EXERCISES, EXERCISES } from './exercises.seed';
import { MUSCLES } from './muscles';

const muscleIds = new Set<string>(MUSCLES.map((m) => m.id));

describe('exercise seed', () => {
  it('has unique ids', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });
  it('uses only known muscles and integer difficulty 1–10', () => {
    for (const e of EXERCISES) {
      expect(e.primary.length, e.id).toBeGreaterThan(0);
      for (const m of [...e.primary, ...e.secondary]) expect(muscleIds.has(m), `${e.id}: ${m}`).toBe(true);
      expect(Number.isInteger(e.difficulty) && e.difficulty >= 1 && e.difficulty <= 10, e.id).toBe(true);
    }
  });
  it('lists every default PR exercise', () => {
    for (const id of DEFAULT_PR_EXERCISES) expect(EXERCISES.some((e) => e.id === id), id).toBe(true);
  });
  it('has at least 8 exercises for every muscle group', () => {
    for (const m of MUSCLES) {
      const n = EXERCISES.filter((e) => e.primary.includes(m.id) || e.secondary.includes(m.id)).length;
      expect(n, m.id).toBeGreaterThanOrEqual(8);
    }
  });
  it('has at least 8 primary exercises for each major group', () => {
    const major = ['chest', 'front_delts', 'triceps', 'biceps', 'lats', 'upper_back', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quads', 'hamstrings', 'calves'];
    for (const m of major) {
      const n = EXERCISES.filter((e) => e.primary.includes(m as never)).length;
      expect(n, m).toBeGreaterThanOrEqual(8);
    }
  });
});
