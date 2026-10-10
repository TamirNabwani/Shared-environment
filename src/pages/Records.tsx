import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PR_EXERCISES, type Exercise } from '../data/exercises.seed';
import { db } from '../db/db';
import { useBody, useExercises, usePerformances } from '../hooks';
import { bodyweightOn, estimated1RM, newPRTypes, prHistory, prTypesFor, type Performance, type PRType } from '../lib/analytics';
import { shortDate, todayIso } from '../lib/dates';
import { EPLEY_FORMULA_TEXT, EPLEY_MAX_REPS, totalLoad } from '../lib/formulas';
import { PR_LABEL, prValueText } from '../lib/prText';
import { TrendChart } from '../components/charts';
import { ExerciseSelect } from '../components/ExerciseSelect';
import { toast } from '../components/toast';
import { Button, Card, Empty, Field, fmt, Formula, NumberInput, PRBadge, Segmented } from '../components/ui';

export function Records({ focus }: { focus?: string }) {
  const { all, map } = useExercises();
  const perfs = usePerformances();
  const [open, setOpen] = useState<string | null>(focus ?? null);
  useEffect(() => setOpen(focus ?? null), [focus]);

  const shown = useMemo(() => {
    const ids = new Set(DEFAULT_PR_EXERCISES);
    for (const p of perfs) ids.add(p.exerciseId);
    if (focus) ids.add(focus);
    return [...ids].map((id) => map.get(id)).filter((e): e is Exercise => !!e);
  }, [perfs, map, focus]);

  return (
    <div className="space-y-4">
      <AttemptForm exercises={all} perfs={perfs} />
      <Card title="Personal records">
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          PRs are worked out from your PR tests and every set in your workout log. A day is flagged ★ PR when its best set beats every earlier day.
        </p>
        <div className="divide-y divide-[#2c2b28]">
          {shown.map((ex) => (
            <ExerciseRecords key={ex.id} ex={ex} perfs={perfs} open={open === ex.id} onToggle={() => setOpen(open === ex.id ? null : ex.id)} />
          ))}
        </div>
      </Card>
      <Card title="Estimated 1RM">
        <Formula>{EPLEY_FORMULA_TEXT}</Formula>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          w = total load (bodyweight + added kg). Only shown for sets of 1–{EPLEY_MAX_REPS} reps, where the formula is usually applied; it gets less accurate as reps go up. It is an estimate, not a tested max.
        </p>
      </Card>
    </div>
  );
}

function ExerciseRecords({ ex, perfs, open, onToggle }: { ex: Exercise; perfs: Performance[]; open: boolean; onToggle: () => void }) {
  const types = prTypesFor(ex);
  const histories = types.map((t) => ({ type: t, history: prHistory(perfs, ex.id, t) }));
  const [type, setType] = useState<PRType>(types[0]);
  const current = histories.find((h) => h.type === type)!.history;

  return (
    <div className="py-3">
      <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={onToggle}>
        <span className="font-medium">{ex.name}</span>
        <span className="flex flex-col items-end gap-0.5 text-sm">
          {histories.map(({ type: t, history }) => {
            const best = history.at(-1) && history.reduce((a, b) => (b.value > a.value ? b : a));
            return (
              <span key={t} className="tabular-nums text-[var(--text-secondary)]">
                <span className="text-xs text-[var(--text-muted)]">{PR_LABEL[t]}: </span>
                {best ? (
                  <>
                    {prValueText(t, best.perf)} <span className="text-xs text-[var(--text-muted)]">{shortDate(best.date)}</span>
                  </>
                ) : (
                  '—'
                )}
              </span>
            );
          })}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {types.length > 1 && (
            <Segmented options={types.map((t) => ({ value: t, label: PR_LABEL[t] }))} value={type} onChange={setType} />
          )}
          {current.length === 0 ? (
            <Empty>No {PR_LABEL[type].toLowerCase()} entries yet.</Empty>
          ) : (
            <>
              <TrendChart
                data={current.map((p) => ({ date: p.date, value: p.value, best: p.best }))}
                series={[
                  { key: 'value', name: 'Best set of the day', type: 'dots' },
                  { key: 'best', name: 'Running best (PR)' },
                ]}
                unit={type === 'hold' ? 's' : type === 'reps' ? 'reps' : 'kg added'}
                height={180}
                digits={1}
              />
              <HistoryTable type={type} history={current} />
            </>
          )}
          <AttemptList exerciseId={ex.id} perfs={perfs} />
        </div>
      )}
    </div>
  );
}

function HistoryTable({ type, history }: { type: PRType; history: ReturnType<typeof prHistory> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead className="text-left text-xs text-[var(--text-muted)]">
          <tr>
            <th className="py-1 font-normal">Date</th>
            <th className="font-normal">Best set</th>
            {type !== 'hold' && <th className="font-normal">Total load</th>}
            {type !== 'hold' && <th className="font-normal">Est. 1RM</th>}
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map((p) => (
            <tr key={p.date} className="border-t border-[#2c2b28]">
              <td className="py-1.5">{shortDate(p.date)}</td>
              <td>
                {prValueText(type, p.perf)}
                {p.isPR && <PRBadge />}
              </td>
              {type !== 'hold' && <td>{fmt(totalLoad(p.perf.bodyweightKg, p.perf.addedKg), 1)} kg</td>}
              {type !== 'hold' && <td>{estimated1RM(p.perf) != null ? `${fmt(estimated1RM(p.perf), 1)} kg` : '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {type !== 'hold' && history.some((p) => p.perf.bodyweightKg == null) && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">Total load needs a bodyweight entry (Body tab).</p>
      )}
    </div>
  );
}

function AttemptForm({ exercises, perfs }: { exercises: Exercise[]; perfs: Performance[] }) {
  const body = useBody();
  const [exerciseId, setExerciseId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [reps, setReps] = useState<number | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [addedKg, setAddedKg] = useState<number | null>(null);
  const [bodyweightKg, setBodyweightKg] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const ex = exercises.find((e) => e.id === exerciseId);
  const defaultBw = bodyweightOn(body, date);

  async function save() {
    if (!ex) return;
    const entry = {
      exerciseId,
      date,
      reps: ex.measure === 'reps' ? reps : null,
      seconds: ex.measure === 'hold' ? seconds : null,
      addedKg,
      bodyweightKg: bodyweightKg ?? defaultBw,
      notes,
    };
    const prs = newPRTypes(perfs, entry);
    await db.attempts.add(entry);
    toast(prs.length ? `★ New PR: ${ex.name} (${prs.map((t) => PR_LABEL[t]).join(', ')})` : 'Saved');
    setReps(null);
    setSeconds(null);
    setAddedKg(null);
    setNotes('');
  }

  const valid = ex && (ex.measure === 'reps' ? (reps ?? 0) > 0 : (seconds ?? 0) > 0);

  return (
    <Card title="Log a PR test">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Exercise">
            <ExerciseSelect exercises={exercises} value={exerciseId} onChange={setExerciseId} />
          </Field>
        </div>
        <Field label="Date">
          <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {ex?.measure === 'hold' ? (
          <Field label="Hold (seconds)">
            <NumberInput value={seconds} onChange={setSeconds} min={0} step={1} />
          </Field>
        ) : (
          <Field label="Reps">
            <NumberInput value={reps} onChange={setReps} min={0} step={1} />
          </Field>
        )}
        {ex?.measure !== 'hold' && (
          <Field label="Added weight (kg)">
            <NumberInput value={addedKg} onChange={setAddedKg} min={0} placeholder="0" />
          </Field>
        )}
        <Field label="Bodyweight (kg)" hint={defaultBw != null ? `Defaults to logged ${defaultBw} kg` : 'Optional'}>
          <NumberInput value={bodyweightKg} onChange={setBodyweightKg} min={0} placeholder={defaultBw?.toString()} />
        </Field>
        <div className="col-span-2">
          <Field label="Notes">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={save} disabled={!valid}>
          Save
        </Button>
      </div>
    </Card>
  );
}

function AttemptList({ exerciseId, perfs }: { exerciseId: string; perfs: Performance[] }) {
  const attempts = perfs.filter((p) => p.exerciseId === exerciseId && p.source === 'attempt').reverse();
  if (!attempts.length) return null;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs text-[var(--text-muted)]">PR tests logged here ({attempts.length})</summary>
      <ul className="mt-1">
        {attempts.map((a) => (
          <li key={a.sourceId} className="flex items-center justify-between border-t border-[#2c2b28] py-1">
            <span className="tabular-nums">
              {shortDate(a.date)} · {a.seconds ? `${a.seconds} s` : `${a.reps} reps`}
              {a.addedKg ? ` · +${a.addedKg} kg` : ''}
            </span>
            <Button kind="danger" onClick={() => a.sourceId != null && db.attempts.delete(a.sourceId)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--text-muted)]">Sets from workouts are edited in the Workouts tab.</p>
    </details>
  );
}
