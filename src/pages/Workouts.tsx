import { useMemo, useState } from 'react';
import type { Exercise } from '../data/exercises.seed';
import { MUSCLES } from '../data/muscles';
import { db, type Session, type SetEntry } from '../db/db';
import { exName, useExercises, usePerformances, useSessions } from '../hooks';
import {
  daysSince,
  lastTrainedByExercise,
  lastTrainedByMuscle,
  muscleVolume,
  newPRTypes,
  prValue,
  sessionVolume,
  trainingLoadSeries,
} from '../lib/analytics';
import { addDays, shortDate, todayIso, weekStart } from '../lib/dates';
import { sessionRpeLoad } from '../lib/formulas';
import { PR_LABEL, setText } from '../lib/prText';
import { TrendChart } from '../components/charts';
import { ExerciseSelect } from '../components/ExerciseSelect';
import { toast } from '../components/toast';
import { Button, Card, Convention, Empty, Field, fmt, Formula, NumberInput, PRBadge, Segmented } from '../components/ui';

export function Workouts() {
  const sessions = useSessions();
  const [editing, setEditing] = useState<Session | 'new' | null>(null);

  return (
    <div className="space-y-4">
      {editing ? (
        <SessionForm initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button className="w-full py-3" onClick={() => setEditing('new')}>
          + Log a session
        </Button>
      )}
      <SessionList sessions={sessions} onEdit={setEditing} />
      <WeeklyVolume sessions={sessions} />
      <DaysSince />
      <TrainingLoad sessions={sessions} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SessionList({ sessions, onEdit }: { sessions: Session[]; onEdit: (s: Session) => void }) {
  const { map } = useExercises();
  const perfs = usePerformances();
  const [limit, setLimit] = useState(10);
  const recent = [...sessions].reverse().slice(0, limit);

  // Which (session, exercise) pairs were the day a PR was set.
  const prKeys = useMemo(() => {
    const keys = new Set<string>();
    const best = new Map<string, number>();
    for (const p of perfs) {
      for (const t of ['reps', 'hold', 'weighted'] as const) {
        const v = prValue(p, t);
        if (v == null) continue;
        const k = `${p.exerciseId}:${t}`;
        if (v > (best.get(k) ?? -Infinity)) {
          best.set(k, v);
          if (p.source === 'session') keys.add(`${p.sourceId}:${p.exerciseId}`);
        }
      }
    }
    return keys;
  }, [perfs]);

  return (
    <Card title="Sessions">
      {recent.length === 0 && <Empty>No sessions yet.</Empty>}
      <ul className="divide-y divide-[#2c2b28]">
        {recent.map((s) => {
          const v = sessionVolume(s);
          const groups = groupSets(s.sets);
          return (
            <li key={s.id} className="py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{shortDate(s.date)}</span>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  {s.durationMin} min · RPE {s.sessionRpe} · load {fmt(sessionRpeLoad(s.sessionRpe, s.durationMin))} AU
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] tabular-nums">
                Volume: {v.sets} sets · {v.reps} reps{v.holdSec ? ` · ${v.holdSec} s holds` : ''}
              </div>
              <ul className="mt-1 text-sm">
                {groups.map(([id, sets]) => (
                  <li key={id}>
                    <span className="text-[var(--text-secondary)]">{exName(map, id)}</span>
                    {prKeys.has(`${s.id}:${id}`) && <PRBadge />}
                    <span className="text-xs text-[var(--text-muted)]"> — {sets.map(setText).join(' | ')}</span>
                  </li>
                ))}
              </ul>
              {s.notes && <p className="mt-1 text-xs italic text-[var(--text-muted)]">{s.notes}</p>}
              <div className="mt-1 flex gap-2">
                <Button kind="ghost" onClick={() => onEdit(s)}>
                  Edit
                </Button>
                <Button kind="danger" onClick={() => confirm('Delete this session?') && s.id != null && db.sessions.delete(s.id)}>
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {sessions.length > limit && (
        <Button kind="secondary" className="w-full" onClick={() => setLimit(limit + 20)}>
          Show more
        </Button>
      )}
    </Card>
  );
}

function groupSets(sets: SetEntry[]): [string, SetEntry[]][] {
  const out = new Map<string, SetEntry[]>();
  for (const s of sets) {
    if (!out.has(s.exerciseId)) out.set(s.exerciseId, []);
    out.get(s.exerciseId)!.push(s);
  }
  return [...out.entries()];
}

// ---------------------------------------------------------------------------

function SessionForm({ initial, onDone }: { initial?: Session; onDone: () => void }) {
  const { all, map } = useExercises();
  const perfs = usePerformances();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [durationMin, setDuration] = useState<number | null>(initial?.durationMin ?? null);
  const [sessionRpe, setRpe] = useState<number | null>(initial?.sessionRpe ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [sets, setSets] = useState<SetEntry[]>(initial?.sets ?? []);
  const [draft, setDraft] = useState<SetEntry>({ exerciseId: '' });

  const draftEx = map.get(draft.exerciseId);
  const draftValid = draftEx && (draftEx.measure === 'hold' ? (draft.seconds ?? 0) > 0 : (draft.reps ?? 0) > 0);
  const valid = sets.length > 0 && durationMin != null && durationMin > 0 && sessionRpe != null && sessionRpe >= 1 && sessionRpe <= 10;

  function addSet() {
    if (!draftValid) return;
    setSets([...sets, cleanSet(draft, draftEx!)]);
    // keep exercise + weight, clear the effort fields for the next set
    setDraft({ exerciseId: draft.exerciseId, addedKg: draft.addedKg, restSec: draft.restSec });
  }

  async function save() {
    const session: Session = { date, durationMin: durationMin!, sessionRpe: sessionRpe!, notes, sets };
    // PRs are judged against everything except this session's previous version.
    const others = perfs.filter((p) => !(p.source === 'session' && p.sourceId === initial?.id));
    const prs = new Set<string>();
    const running = [...others];
    for (const s of sets) {
      const types = newPRTypes(running, s);
      types.forEach((t) => prs.add(`${exName(map, s.exerciseId)} (${PR_LABEL[t]})`));
      running.push({ ...s, date, bodyweightKg: null, source: 'session' });
    }
    if (initial?.id != null) await db.sessions.put({ ...session, id: initial.id });
    else await db.sessions.add(session);
    toast(prs.size ? `★ New PR: ${[...prs].join(', ')}` : 'Session saved');
    onDone();
  }

  return (
    <Card title={initial ? 'Edit session' : 'New session'}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Duration (min)">
          <NumberInput value={durationMin} onChange={setDuration} min={0} step={1} />
        </Field>
        <Field label="Session RPE (1–10)">
          <NumberInput value={sessionRpe} onChange={setRpe} min={1} max={10} step={1} />
        </Field>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Session RPE: how hard the whole session was, rated about 30 min after you finish (Foster, 2001).</p>

      <div className="mt-4 rounded-lg border border-[#3a3936] p-3">
        <div className="mb-2 text-sm font-medium">Add set</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-3">
            <ExerciseSelect exercises={all} value={draft.exerciseId} onChange={(id) => setDraft({ ...draft, exerciseId: id })} />
          </div>
          {draftEx?.measure === 'hold' ? (
            <Field label="Time (s)">
              <NumberInput value={draft.seconds} onChange={(v) => setDraft({ ...draft, seconds: v })} min={0} step={1} />
            </Field>
          ) : (
            <Field label="Reps">
              <NumberInput value={draft.reps} onChange={(v) => setDraft({ ...draft, reps: v })} min={0} step={1} />
            </Field>
          )}
          {draftEx?.measure !== 'hold' && (
            <Field label="Added kg">
              <NumberInput value={draft.addedKg} onChange={(v) => setDraft({ ...draft, addedKg: v })} min={0} placeholder="0" />
            </Field>
          )}
          <Field label="Set RPE">
            <NumberInput value={draft.rpe} onChange={(v) => setDraft({ ...draft, rpe: v })} min={1} max={10} step={0.5} placeholder="opt." />
          </Field>
          <Field label="Rest (s)">
            <NumberInput value={draft.restSec} onChange={(v) => setDraft({ ...draft, restSec: v })} min={0} step={5} placeholder="opt." />
          </Field>
        </div>
        <Button className="mt-3 w-full" kind="secondary" onClick={addSet} disabled={!draftValid}>
          Add set
        </Button>
      </div>

      {sets.length > 0 && (
        <ol className="mt-3 space-y-1 text-sm">
          {sets.map((s, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-[var(--surface-2)] px-2 py-1">
              <span>
                <span className="text-[var(--text-muted)]">{i + 1}.</span> {exName(map, s.exerciseId)} — {setText(s)}
              </span>
              <span className="flex">
                <Button kind="ghost" onClick={() => setSets([...sets.slice(0, i + 1), { ...s }, ...sets.slice(i + 1)])} title="Duplicate">
                  ⧉
                </Button>
                <Button kind="danger" onClick={() => setSets(sets.filter((_, j) => j !== i))} title="Remove">
                  ✕
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3">
        <Field label="Notes">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button kind="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!valid}>
          Save session
        </Button>
      </div>
    </Card>
  );
}

function cleanSet(s: SetEntry, ex: Exercise): SetEntry {
  return {
    exerciseId: s.exerciseId,
    reps: ex.measure === 'reps' ? s.reps ?? null : null,
    seconds: ex.measure === 'hold' ? s.seconds ?? null : null,
    addedKg: ex.measure === 'reps' ? s.addedKg ?? null : null,
    rpe: s.rpe ?? null,
    restSec: s.restSec ?? null,
  };
}

// ---------------------------------------------------------------------------

function WeeklyVolume({ sessions }: { sessions: Session[] }) {
  const { map } = useExercises();
  const [week, setWeek] = useState(weekStart(todayIso()));
  const end = addDays(week, 6);
  const vol = muscleVolume(sessions, map, week, end);
  const rows = MUSCLES.map((m) => ({ ...m, v: vol.get(m.id) }));
  const weekSessions = sessions.filter((s) => s.date >= week && s.date <= end);
  const totalReps = weekSessions.reduce((a, s) => a + sessionVolume(s).reps, 0);

  return (
    <Card
      title="Weekly volume by muscle"
      right={
        <div className="flex items-center gap-1 text-xs">
          <Button kind="ghost" onClick={() => setWeek(addDays(week, -7))}>‹</Button>
          <span className="tabular-nums">{shortDate(week)}–{shortDate(end)}</span>
          <Button kind="ghost" onClick={() => setWeek(addDays(week, 7))} disabled={week >= weekStart(todayIso())}>›</Button>
        </div>
      }
    >
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        {weekSessions.length} sessions · {totalReps} total reps (sets × reps)
      </p>
      <table className="w-full text-sm tabular-nums">
        <thead className="text-left text-xs text-[var(--text-muted)]">
          <tr>
            <th className="py-1 font-normal">Muscle</th>
            <th className="text-right font-normal">Sets (primary)</th>
            <th className="text-right font-normal">Sets (secondary)</th>
            <th className="text-right font-normal">Reps</th>
            <th className="text-right font-normal">Hold s</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[#2c2b28]">
              <td className="py-1">{r.label.replace('Shoulders – ', '')}</td>
              <td className="text-right">{r.v?.primarySets ?? 0}</td>
              <td className="text-right text-[var(--text-muted)]">{r.v?.secondarySets ?? 0}</td>
              <td className="text-right">{r.v?.reps ?? 0}</td>
              <td className="text-right">{r.v?.holdSec ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Convention>
        A set counts once for each <i>primary</i> muscle of its exercise. Secondary sets are shown separately and are never blended in with a weighting factor. Reps and hold seconds are summed for primary muscles.
      </Convention>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function DaysSince() {
  const { map } = useExercises();
  const perfs = usePerformances();
  const today = todayIso();
  const byMuscle = lastTrainedByMuscle(perfs, map);
  const byExercise = [...lastTrainedByExercise(perfs).entries()].sort((a, b) => b[1].localeCompare(a[1]));
  const [view, setView] = useState<'muscle' | 'exercise'>('muscle');

  const label = (d: number | null) => (d == null ? 'never' : d === 0 ? 'today' : `${d} d`);

  return (
    <Card title="Days since last trained" right={<Segmented options={[{ value: 'muscle', label: 'Muscle' }, { value: 'exercise', label: 'Exercise' }]} value={view} onChange={setView} />}>
      {view === 'muscle' ? (
        <ul className="grid grid-cols-2 gap-x-4 text-sm">
          {MUSCLES.map((m) => (
            <li key={m.id} className="flex justify-between border-t border-[#2c2b28] py-1">
              <span>{m.label.replace('Shoulders – ', '')}</span>
              <span className="tabular-nums text-[var(--text-secondary)]">{label(daysSince(byMuscle.get(m.id), today))}</span>
            </li>
          ))}
        </ul>
      ) : byExercise.length === 0 ? (
        <Empty>Nothing logged yet.</Empty>
      ) : (
        <ul className="text-sm">
          {byExercise.map(([id, d]) => (
            <li key={id} className="flex justify-between border-t border-[#2c2b28] py-1">
              <span>{exName(map, id)}</span>
              <span className="tabular-nums text-[var(--text-secondary)]">{label(daysSince(d, today))}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-[var(--text-muted)]">Muscles count as trained when they are a primary mover. Includes PR tests.</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------

export function TrainingLoad({ sessions, start: startProp }: { sessions: Session[]; start?: string }) {
  const today = todayIso();
  const [days, setDays] = useState<'28' | '90' | '365'>('90');
  const start = startProp ?? addDays(today, -(Number(days) - 1));
  const data = trainingLoadSeries(sessions, start, today);

  return (
    <Card
      title="Training load trend"
      right={!startProp && <Segmented options={[{ value: '28', label: '28d' }, { value: '90', label: '90d' }, { value: '365', label: '1y' }]} value={days} onChange={setDays} />}
    >
      {data.length === 0 ? (
        <Empty>Log sessions with duration and RPE to see training load.</Empty>
      ) : (
        <TrendChart
          data={data}
          series={[
            { key: 'load', name: 'Daily load', type: 'bar', color: '#5f5e59' },
            { key: 'acute', name: '7-day EWMA', color: 'var(--series-1)' },
            { key: 'chronic', name: '28-day EWMA', color: 'var(--series-2)' },
          ]}
          unit="AU"
          digits={0}
        />
      )}
      <div className="mt-2 space-y-1">
        <Formula>load = session RPE × duration (min)  (Foster et al., 2001)</Formula>
        <Formula>EWMA_t = λ·load_t + (1−λ)·EWMA_t−1,  λ = 2/(N+1)  (Williams et al., 2017)</Formula>
      </div>
      <Convention>
        AU = arbitrary units. Rest days count as 0, and the averages start from 0, so the first few weeks read low. This chart only shows the trend; it does not predict injury or performance.
      </Convention>
    </Card>
  );
}
