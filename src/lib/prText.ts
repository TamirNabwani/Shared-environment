import type { SetEntry } from '../db/db';
import type { PRType } from './analytics';

export const PR_LABEL: Record<PRType, string> = {
  reps: 'Max reps',
  hold: 'Max hold',
  weighted: 'Weighted',
};

export function prValueText(type: PRType, p: SetEntry): string {
  if (type === 'hold') return `${p.seconds ?? 0} s`;
  if (type === 'reps') return `${p.reps ?? 0} reps`;
  return `+${p.addedKg ?? 0} kg × ${p.reps ?? 0}`;
}

export function setText(s: SetEntry): string {
  const parts: string[] = [];
  if (s.reps) parts.push(`${s.reps} reps`);
  if (s.seconds) parts.push(`${s.seconds} s`);
  if (s.addedKg) parts.push(`+${s.addedKg} kg`);
  if (s.rpe) parts.push(`RPE ${s.rpe}`);
  if (s.restSec) parts.push(`rest ${s.restSec}s`);
  return parts.join(' · ') || '—';
}
