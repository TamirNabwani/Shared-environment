import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { EXERCISES, type Exercise } from './data/exercises.seed';
import { db, type Profile } from './db/db';
import { collectPerformances } from './lib/analytics';

// Stable fallback while a query is loading, so effects depending on these arrays don't re-fire every render.
const EMPTY: never[] = [];

/** Seed library merged with custom exercises from the database. */
export function useExercises() {
  const custom = useLiveQuery(() => db.customExercises.toArray(), []) ?? EMPTY;
  return useMemo(() => {
    const all: Exercise[] = [...EXERCISES, ...custom.map((c) => ({ ...c, custom: true }))];
    return { all, map: new Map(all.map((e) => [e.id, e])) };
  }, [custom]);
}

export function useSessions() {
  return useLiveQuery(() => db.sessions.orderBy('date').toArray(), []) ?? EMPTY;
}

export function useBody() {
  return useLiveQuery(() => db.body.orderBy('date').toArray(), []) ?? EMPTY;
}

export function useNutrition() {
  return useLiveQuery(() => db.nutrition.orderBy('date').toArray(), []) ?? EMPTY;
}

export function useLifestyle() {
  return useLiveQuery(() => db.lifestyle.orderBy('date').toArray(), []) ?? EMPTY;
}

export function useAttempts() {
  return useLiveQuery(() => db.attempts.orderBy('date').toArray(), []) ?? EMPTY;
}

export function useStatuses() {
  const rows = useLiveQuery(() => db.exerciseStatus.toArray(), []) ?? EMPTY;
  return useMemo(() => new Map(rows.map((r) => [r.exerciseId, r.status])), [rows]);
}

export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => ((await db.settings.get('profile'))?.value as Profile) ?? null, []);
}

export function usePerformances() {
  const sessions = useSessions();
  const attempts = useAttempts();
  const body = useBody();
  return useMemo(() => collectPerformances(sessions, attempts, body), [sessions, attempts, body]);
}

export const exName = (map: Map<string, Exercise>, id: string) => map.get(id)?.name ?? `Unknown (${id})`;
