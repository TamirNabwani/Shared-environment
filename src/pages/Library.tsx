import { useState } from 'react';
import type { Exercise, Measure } from '../data/exercises.seed';
import { MUSCLES, muscleLabel, type MuscleId } from '../data/muscles';
import { db, type Status } from '../db/db';
import { useExercises, usePerformances, useStatuses } from '../hooks';
import { prHistory, prTypesFor, type Performance } from '../lib/analytics';
import { shortDate } from '../lib/dates';
import { PR_LABEL, prValueText } from '../lib/prText';
import { Button, Card, Convention, Field, NumberInput, Segmented } from '../components/ui';

const STATUS_OPTIONS: { value: Status | 'none'; label: string }[] = [
  { value: 'none', label: '–' },
  { value: 'cant', label: "Can't do" },
  { value: 'working', label: 'Working on it' },
  { value: 'mastered', label: 'Mastered' },
];

export function Library({ openRecords }: { openRecords: (exerciseId: string) => void }) {
  const { all } = useExercises();
  const statuses = useStatuses();
  const perfs = usePerformances();
  const [muscle, setMuscle] = useState<MuscleId>('chest');
  const [showAdd, setShowAdd] = useState(false);

  const byDifficulty = (a: Exercise, b: Exercise) => a.difficulty - b.difficulty || a.name.localeCompare(b.name);
  const primary = all.filter((e) => e.primary.includes(muscle)).sort(byDifficulty);
  const secondary = all.filter((e) => !e.primary.includes(muscle) && e.secondary.includes(muscle)).sort(byDifficulty);

  return (
    <div className="space-y-4">
      <Card title="Exercise library" right={<Button kind="secondary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'Close' : '+ Custom'}</Button>}>
        {showAdd && <CustomExerciseForm onDone={() => setShowAdd(false)} />}
        <Field label="Muscle group">
          <select value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleId)}>
            {MUSCLES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Convention>
          <b>Difficulty (convention)</b>, 1–10: where the exercise sits in the usual progression ladder for its movement
          pattern (e.g. wall push-up 1, push-up 3, archer push-up 6, one-arm push-up 9). It is not a measure of how
          effective the exercise is, and numbers are only comparable within the same pattern.
        </Convention>
      </Card>

      <Card title={`${muscleLabel(muscle)} — primary mover (${primary.length})`}>
        <ExerciseList list={primary} statuses={statuses} perfs={perfs} openRecords={openRecords} />
      </Card>
      {secondary.length > 0 && (
        <Card title={`${muscleLabel(muscle)} — secondary (${secondary.length})`}>
          <ExerciseList list={secondary} statuses={statuses} perfs={perfs} openRecords={openRecords} />
        </Card>
      )}
    </div>
  );
}

function ExerciseList({
  list,
  statuses,
  perfs,
  openRecords,
}: {
  list: Exercise[];
  statuses: Map<string, Status>;
  perfs: Performance[];
  openRecords: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-[#2c2b28]">
      {list.map((e) => (
        <li key={e.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                {e.name}
                {e.custom && <span className="ml-1 text-xs text-[var(--text-muted)]">(custom)</span>}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {e.pattern} · {e.measure === 'hold' ? 'hold' : 'reps'}
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Primary: {e.primary.map(muscleLabel).join(', ')}
                {e.secondary.length > 0 && <> · Secondary: {e.secondary.map(muscleLabel).join(', ')}</>}
              </div>
            </div>
            <div className="shrink-0 text-right" title="Difficulty (convention): position in the progression ladder">
              <div className="text-lg font-semibold tabular-nums">{e.difficulty}<span className="text-xs text-[var(--text-muted)]">/10</span></div>
              <div className="text-[10px] leading-tight text-[var(--text-muted)]">difficulty<br />(convention)</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Segmented
              options={STATUS_OPTIONS}
              value={statuses.get(e.id) ?? 'none'}
              onChange={(v) => (v === 'none' ? db.exerciseStatus.delete(e.id) : db.exerciseStatus.put({ exerciseId: e.id, status: v }))}
            />
            <PRSummary ex={e} perfs={perfs} onClick={() => openRecords(e.id)} />
            {e.custom && (
              <Button kind="danger" onClick={() => confirm(`Delete custom exercise "${e.name}"? Logged sets stay but show as unknown.`) && db.customExercises.delete(e.id)}>
                Delete
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PRSummary({ ex, perfs, onClick }: { ex: Exercise; perfs: Performance[]; onClick: () => void }) {
  const bests = prTypesFor(ex)
    .map((t) => {
      const h = prHistory(perfs, ex.id, t);
      const best = h.length ? h.reduce((a, b) => (b.value > a.value ? b : a)) : null;
      return best && `${PR_LABEL[t]} ${prValueText(t, best.perf)} (${shortDate(best.date)})`;
    })
    .filter(Boolean);
  return (
    <button type="button" onClick={onClick} className="text-xs text-[var(--series-1)] underline-offset-2 hover:underline">
      {bests.length ? bests.join(' · ') : 'No PRs yet'} →
    </button>
  );
}

function CustomExerciseForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [measure, setMeasure] = useState<Measure>('reps');
  const [primary, setPrimary] = useState<MuscleId[]>([]);
  const [secondary, setSecondary] = useState<MuscleId[]>([]);

  const valid = name.trim() && primary.length && difficulty != null && difficulty >= 1 && difficulty <= 10;

  async function save() {
    const id = 'custom_' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    await db.customExercises.add({
      id,
      name: name.trim(),
      pattern: pattern.trim() || 'Custom',
      difficulty: Math.round(difficulty!),
      measure,
      primary,
      secondary: secondary.filter((m) => !primary.includes(m)),
    });
    onDone();
  }

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-[#3a3936] p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label="Movement pattern">
          <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="e.g. Horizontal push" />
        </Field>
        <Field label="Difficulty (convention) 1–10">
          <NumberInput value={difficulty} onChange={setDifficulty} min={1} max={10} step={1} />
        </Field>
        <div className="col-span-2">
          <Segmented
            options={[
              { value: 'reps', label: 'Counted in reps' },
              { value: 'hold', label: 'Timed hold' },
            ]}
            value={measure}
            onChange={setMeasure}
          />
        </div>
      </div>
      <MuscleChecks label="Primary muscles" value={primary} onChange={setPrimary} />
      <MuscleChecks label="Secondary muscles" value={secondary} onChange={setSecondary} />
      <div className="flex justify-end">
        <Button onClick={save} disabled={!valid}>
          Add exercise
        </Button>
      </div>
    </div>
  );
}

// Not wrapped in <label>: a label would forward each click to its first button.
function MuscleChecks({ label, value, onChange }: { label: string; value: MuscleId[]; onChange: (v: MuscleId[]) => void }) {
  return (
    <div className="text-sm">
      <div className="mb-1 text-[var(--text-secondary)]">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLES.map((m) => {
          const on = value.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== m.id) : [...value, m.id])}
              className={`rounded-full px-2 py-1 text-xs ${on ? 'bg-[var(--series-1)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}
            >
              {m.label.replace('Shoulders – ', '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
