# Calisthenics Tracker

A personal, single-user calisthenics tracker. It runs entirely in your browser: no account, no server, and data is stored locally in IndexedDB. It's mobile-friendly and uses a dark theme.

**Rule the app follows:** it only uses established, published calculations. It has no invented scores, "skill levels", readiness scores or predictions. Any number that is a convention rather than a measurement is labelled **Convention** in the UI.

## Setup

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (formulas, analytics, seed library, backup)
npm run build      # production build in dist/
npm run preview    # serve the production build
```

To use it on your phone, run `npm run dev -- --host` and open the shown network URL. You can also deploy `dist/` to any static host. The build uses relative paths, so a sub-folder works too. Data lives in that browser on that device, so use **Settings → Export JSON** to back up or move it.

Settings has a **Load sample data** button, shown only while the database is empty, for trying the app out. Delete the sample data before you start logging real data.

## Features

| Tab | What it does |
|---|---|
| Dashboard | Latest PRs, bodyweight trend, 7-day calories/protein vs TDEE, last-7-day sets per muscle, days since last session, training-load trend, sleep & sitting trends. Range filter: 30 / 90 / 365 days / all. |
| Workouts | Log sessions (date, duration, session RPE, notes; per set: reps or seconds, added kg, RPE, rest). Per-session volume, weekly volume per muscle, days since last trained (per muscle and exercise), training load (7- vs 28-day EWMA). |
| PRs | Max reps, max hold and weighted PRs per exercise, with dates and a history chart. PRs are worked out from workout sets plus standalone "PR tests", so they can't go out of sync. New PRs are flagged when saved (★). Epley e1RM shown for 1–10 rep sets. |
| Library | Browse by muscle group, sorted by difficulty (convention). Mark each exercise *can't do / working on it / mastered*. Shows your PRs for each exercise. Add custom exercises. |
| Body | Bodyweight with 7-day moving average, waist/chest/arm/thigh, body fat % (manual). BMR (Mifflin–St Jeor), TDEE with an activity multiplier you choose. Relative strength: total load = bodyweight + added kg. |
| Nutrition | Daily calories, protein, meal notes. 7-day averages, surplus/deficit vs TDEE, protein reference range 1.6–2.2 g/kg (Morton et al., 2018). |
| Sleep | Daily sleep and sitting hours. Trends and weekly averages only; nothing is scored. |
| Settings | Profile, JSON export/import (import replaces all data), delete all data. |

## Formulas

All formulas are in [`src/lib/formulas.ts`](src/lib/formulas.ts), each with a citation, and tested in `src/lib/formulas.test.ts`.

| Formula | Source |
|---|---|
| Estimated 1RM = w × (1 + reps/30), w = bodyweight + added kg, used for 1–10 reps | Epley (1985) |
| BMR = 10·kg + 6.25·cm − 5·age + 5 (men) / −161 (women) | Mifflin, St Jeor et al. (1990), *Am J Clin Nutr* 51:241 |
| TDEE = BMR × activity multiplier (1.2 – 1.9) — **convention** | Harris–Benedict activity factors |
| Protein reference 1.6–2.2 g/kg/day | Morton et al. (2018), *Br J Sports Med* 52:376 |
| Training load = session RPE × minutes | Foster et al. (2001), *J Strength Cond Res* 15:109 |
| EWMA, λ = 2/(N+1), N = 7 and 28 | Williams et al. (2017), *Br J Sports Med* 51:209 |
| 7-day simple moving average (bodyweight, calories, protein) | standard time-series smoothing |

Counting conventions (also explained in the UI):
- **Weekly volume per muscle:** a set counts once for each *primary* muscle of its exercise. Secondary sets are shown in their own column and never blended in with a fractional weight.
- **Training load:** rest days count as 0 and the EWMA starts from 0, so the first few weeks read low.
- **Difficulty (convention), 1–10:** where an exercise sits in the usual progression ladder for its movement pattern. It is not a measure of effectiveness.

## Editing the exercise library

The library lives in [`src/data/exercises.seed.ts`](src/data/exercises.seed.ts), one line per exercise:

```ts
ex('archer_pushup', 'Archer push-up', PUSH, 6, 'reps', ['chest'], ['front_delts', 'triceps']),
//  id               name             pattern  difficulty  measure  primary   secondary
```

Edits take effect on reload. Don't change an `id` you've already logged against; rename the `name` instead. `npm test` checks the file (unique ids, valid muscles, difficulty 1–10, at least 8 exercises per muscle group). Muscle groups are defined in `src/data/muscles.ts`. Exercises added in the app are stored in the database instead and are included in exports.

## Project structure

```
src/
  lib/formulas.ts        every formula, cited (+ tests)
  lib/analytics.ts       PR detection, volume, days-since, series, EWMA load (+ tests)
  lib/dates.ts           local-date helpers
  data/exercises.seed.ts editable exercise library (+ integrity tests)
  data/muscles.ts        muscle groups
  db/db.ts               Dexie (IndexedDB) schema and types
  db/backup.ts           JSON export/import (+ tests)
  db/sample.ts           optional sample data
  components/            UI primitives, chart wrapper, pickers
  pages/                 one file per tab
```

## Data model (IndexedDB via Dexie)

| Table | Key | Contents |
|---|---|---|
| `sessions` | `++id` | date, durationMin, sessionRpe, notes, `sets[]` (exerciseId, reps, seconds, addedKg, rpe, restSec) |
| `attempts` | `++id` | standalone PR tests: exerciseId, date, reps/seconds, addedKg, bodyweightKg, notes |
| `body` | date | weightKg, waistCm, chestCm, armCm, thighCm, bodyFatPct |
| `nutrition` | date | calories, proteinG, notes |
| `lifestyle` | date | sleepHours, sittingHours |
| `customExercises` | id | same shape as seed exercises |
| `exerciseStatus` | exerciseId | `cant` / `working` / `mastered` |
| `settings` | key | `profile`: sex, birthDate, heightCm, activityMultiplier |

PRs aren't stored. They are recalculated from `sessions` + `attempts`, and bodyweight for total load comes from the nearest logged weigh-in.

## Not included (on purpose)

Skill-level scores, strength/skill-loss predictions, combined health or readiness scores, AI advice.
