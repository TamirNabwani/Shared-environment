import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { exportData, importData } from './backup';
import { TrackerDB } from './db';

describe('JSON backup', () => {
  it('round-trips all tables', async () => {
    const a = new TrackerDB('a');
    await a.body.add({ date: '2026-01-01', weightKg: 80 });
    await a.sessions.add({ date: '2026-01-01', durationMin: 30, sessionRpe: 6, sets: [{ exerciseId: 'pushups', reps: 20 }] });
    const json = JSON.parse(JSON.stringify(await exportData(a)));

    const b = new TrackerDB('b');
    await b.nutrition.add({ date: '2025-01-01', calories: 1 });
    await importData(b, json);
    expect(await b.body.toArray()).toEqual([{ date: '2026-01-01', weightKg: 80 }]);
    expect((await b.sessions.toArray())[0].sets[0].reps).toBe(20);
    expect(await b.nutrition.count()).toBe(0);
  });
  it('rejects unrelated JSON', async () => {
    await expect(importData(new TrackerDB('c'), { foo: 1 })).rejects.toThrow();
  });
});
