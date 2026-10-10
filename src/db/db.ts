import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../data/exercises.seed';
import type { Sex } from '../lib/formulas';

export type Status = 'cant' | 'working' | 'mastered';

export interface ExerciseStatus {
  exerciseId: string;
  status: Status;
}

/** One performance of an exercise: either a set inside a session, or a standalone PR attempt. */
export interface SetEntry {
  exerciseId: string;
  reps?: number | null;
  seconds?: number | null;
  addedKg?: number | null;
  rpe?: number | null;
  restSec?: number | null;
}

export interface Session {
  id?: number;
  date: string; // YYYY-MM-DD
  durationMin: number;
  sessionRpe: number; // 1–10, rating of the whole session (Foster session-RPE)
  notes?: string;
  sets: SetEntry[];
}

/** A standalone PR test logged outside a workout session. */
export interface Attempt extends SetEntry {
  id?: number;
  date: string;
  bodyweightKg?: number | null;
  notes?: string;
}

export interface BodyEntry {
  date: string;
  weightKg?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  bodyFatPct?: number | null;
}

export interface NutritionEntry {
  date: string;
  calories?: number | null;
  proteinG?: number | null;
  notes?: string;
}

export interface LifestyleEntry {
  date: string;
  sleepHours?: number | null;
  sittingHours?: number | null;
}

export interface Profile {
  sex: Sex;
  birthDate: string;
  heightCm: number;
  activityMultiplier: number | null;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class TrackerDB extends Dexie {
  customExercises!: Table<Exercise, string>;
  exerciseStatus!: Table<ExerciseStatus, string>;
  sessions!: Table<Session, number>;
  attempts!: Table<Attempt, number>;
  body!: Table<BodyEntry, string>;
  nutrition!: Table<NutritionEntry, string>;
  lifestyle!: Table<LifestyleEntry, string>;
  settings!: Table<Setting, string>;

  constructor(name = 'calisthenics-tracker') {
    super(name);
    this.version(1).stores({
      customExercises: 'id',
      exerciseStatus: 'exerciseId',
      sessions: '++id, date',
      attempts: '++id, date, exerciseId',
      body: 'date',
      nutrition: 'date',
      lifestyle: 'date',
      settings: 'key',
    });
  }
}

export const db = new TrackerDB();

export const TABLES = [
  'customExercises',
  'exerciseStatus',
  'sessions',
  'attempts',
  'body',
  'nutrition',
  'lifestyle',
  'settings',
] as const;
