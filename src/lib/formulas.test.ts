import { describe, expect, it } from 'vitest';
import {
  ageOn,
  energyBalance,
  epley1RM,
  ewma,
  ewmaLambda,
  mifflinStJeorBMR,
  movingAverage,
  proteinRange,
  repVolume,
  sessionRpeLoad,
  tdee,
  totalLoad,
} from './formulas';

describe('Epley 1RM', () => {
  it('matches w × (1 + reps/30)', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.667, 3);
    expect(epley1RM(90, 10)).toBeCloseTo(120, 6);
    expect(epley1RM(80, 3)).toBeCloseTo(88, 6);
  });
  it('returns the weight itself for a single rep', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });
  it('is not applied outside 1–10 reps or with invalid weight', () => {
    expect(epley1RM(100, 0)).toBeNull();
    expect(epley1RM(100, 11)).toBeNull();
    expect(epley1RM(100, 2.5)).toBeNull();
    expect(epley1RM(0, 5)).toBeNull();
    expect(epley1RM(NaN, 5)).toBeNull();
  });
});

describe('Mifflin–St Jeor BMR', () => {
  it('computes men: 10w + 6.25h − 5a + 5', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(mifflinStJeorBMR('male', 80, 180, 30)).toBe(1780);
  });
  it('computes women: 10w + 6.25h − 5a − 161', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161
    expect(mifflinStJeorBMR('female', 60, 165, 25)).toBe(1345.25);
  });
  it('differs by exactly 166 kcal between sexes', () => {
    expect(mifflinStJeorBMR('male', 70, 175, 40) - mifflinStJeorBMR('female', 70, 175, 40)).toBe(166);
  });
  it('TDEE multiplies BMR by the chosen factor', () => {
    expect(tdee(1780, 1.55)).toBeCloseTo(2759, 6);
  });
});

describe('moving average', () => {
  it('averages a trailing window', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });
  it('skips gaps (null) inside the window', () => {
    expect(movingAverage([10, null, 20, null], 2)).toEqual([10, 10, 20, 20]);
  });
  it('returns null when a window has no data', () => {
    expect(movingAverage([null, null, 5], 2)).toEqual([null, null, 5]);
  });
  it('7-day window over constant data is constant', () => {
    expect(movingAverage(Array(10).fill(80), 7).every((v) => v === 80)).toBe(true);
  });
});

describe('exponentially weighted moving average', () => {
  it('uses λ = 2/(N+1)', () => {
    expect(ewmaLambda(7)).toBeCloseTo(0.25, 10);
    expect(ewmaLambda(28)).toBeCloseTo(2 / 29, 10);
  });
  it('applies EWMA_t = λ·x_t + (1−λ)·EWMA_(t−1), seeded with 0', () => {
    // λ = 0.25 for N = 7
    const out = ewma([100, 0, 100], 7);
    expect(out[0]).toBeCloseTo(25, 10);
    expect(out[1]).toBeCloseTo(18.75, 10);
    expect(out[2]).toBeCloseTo(0.25 * 100 + 0.75 * 18.75, 10);
  });
  it('converges to a constant input', () => {
    const out = ewma(Array(200).fill(300), 28);
    expect(out[out.length - 1]).toBeCloseTo(300, 3);
  });
  it('honours a custom seed', () => {
    expect(ewma([50], 7, 50)[0]).toBe(50);
  });
  it('responds faster with a shorter window', () => {
    const series = [...Array(30).fill(0), ...Array(5).fill(500)];
    const acute = ewma(series, 7);
    const chronic = ewma(series, 28);
    expect(acute[acute.length - 1]).toBeGreaterThan(chronic[chronic.length - 1]);
  });
});

describe('other arithmetic', () => {
  it('session RPE load = RPE × minutes (Foster 2001)', () => {
    expect(sessionRpeLoad(7, 60)).toBe(420);
    expect(sessionRpeLoad(-1, 60)).toBe(0);
  });
  it('rep volume sums reps across sets', () => {
    expect(repVolume([{ reps: 10 }, { reps: 8 }, { reps: null }, {}])).toBe(18);
  });
  it('total load adds bodyweight and added weight', () => {
    expect(totalLoad(75, 10)).toBe(85);
    expect(totalLoad(75, null)).toBe(75);
    expect(totalLoad(null, 10)).toBeNull();
  });
  it('protein range is 1.6–2.2 g/kg', () => {
    const r = proteinRange(80);
    expect(r.low).toBeCloseTo(128, 6);
    expect(r.high).toBeCloseTo(176, 6);
  });
  it('energy balance sign', () => {
    expect(energyBalance(2500, 2700)).toBe(-200);
  });
  it('age in whole years', () => {
    expect(ageOn('1990-06-15', '2026-06-14')).toBe(35);
    expect(ageOn('1990-06-15', '2026-06-15')).toBe(36);
  });
});
