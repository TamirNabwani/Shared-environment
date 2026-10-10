import { addDays, todayIso } from '../lib/dates';
import type { TrackerDB } from './db';

/** Fills an empty database with 10 weeks of made-up example data, so you can look around the app. */
export async function loadSampleData(db: TrackerDB) {
  const today = todayIso();
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  await db.transaction('rw', [db.sessions, db.body, db.nutrition, db.lifestyle, db.settings, db.exerciseStatus], async () => {
    await db.settings.put({ key: 'profile', value: { sex: 'male', birthDate: '1995-04-12', heightCm: 178, activityMultiplier: 1.55 } });
    for (let i = 69; i >= 0; i--) {
      const date = addDays(today, -i);
      const progress = (69 - i) / 69;
      await db.body.put({ date, weightKg: +(78.5 - progress * 1.5 + (rand() - 0.5) * 1.2).toFixed(1), ...(i % 14 === 0 ? { waistCm: +(84 - progress * 2).toFixed(1) } : {}) });
      if (rand() > 0.15) await db.nutrition.put({ date, calories: Math.round(2400 + (rand() - 0.5) * 600), proteinG: Math.round(140 + (rand() - 0.5) * 50) });
      await db.lifestyle.put({ date, sleepHours: +(7 + (rand() - 0.5) * 2).toFixed(1), sittingHours: +(7 + (rand() - 0.5) * 4).toFixed(1) });
      const dow = new Date(date + 'T00:00:00').getDay();
      if (dow === 1 || dow === 3) {
        const p = Math.round(8 + progress * 4);
        await db.sessions.add({
          date, durationMin: 60, sessionRpe: 7 + Math.round(rand()), notes: 'Upper',
          sets: [
            { exerciseId: 'pullups', reps: p, restSec: 120 }, { exerciseId: 'pullups', reps: p - 1, restSec: 120 },
            { exerciseId: 'pullups', reps: 5, addedKg: Math.round(5 + progress * 10), rpe: 8 },
            { exerciseId: 'dips', reps: p + 4 }, { exerciseId: 'dips', reps: p + 2 },
            { exerciseId: 'pushups', reps: 25 + Math.round(progress * 10) },
            { exerciseId: 'tuck_planche', seconds: Math.round(10 + progress * 10) },
            { exerciseId: 'l_sit', seconds: Math.round(12 + progress * 10) },
          ],
        });
      } else if (dow === 5) {
        await db.sessions.add({
          date, durationMin: 50, sessionRpe: 6 + Math.round(rand()), notes: 'Legs + core',
          sets: [
            { exerciseId: 'pistol_squat', reps: Math.round(3 + progress * 5) }, { exerciseId: 'pistol_squat', reps: Math.round(3 + progress * 4) },
            { exerciseId: 'bulgarian_split_squat', reps: 12 }, { exerciseId: 'nordic_negative', reps: 5 },
            { exerciseId: 'single_leg_calf_raise', reps: 15 }, { exerciseId: 'hanging_leg_raise', reps: 10 },
            { exerciseId: 'plank', seconds: 60 + Math.round(progress * 30) },
          ],
        });
      }
    }
    await db.exerciseStatus.bulkPut([
      { exerciseId: 'pullups', status: 'mastered' },
      { exerciseId: 'tuck_planche', status: 'working' },
      { exerciseId: 'planche', status: 'cant' },
    ]);
  });
}
