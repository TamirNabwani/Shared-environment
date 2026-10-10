import { useState } from 'react';
import { MUSCLES } from '../data/muscles';
import { exName, useBody, useExercises, useLifestyle, usePerformances, useSessions } from '../hooks';
import { daysSince, muscleVolume, prHistory, prTypesFor, rangeStart, type PRPoint, type PRType } from '../lib/analytics';
import { addDays, shortDate, todayIso } from '../lib/dates';
import { PR_LABEL, prValueText } from '../lib/prText';
import { Card, Empty, Segmented, Stat } from '../components/ui';
import { WeightChart } from './Body';
import { NutritionSummary } from './Nutrition';
import { SleepChart, WeeklyTable } from './Sleep';
import { TrainingLoad } from './Workouts';

type Range = '30' | '90' | '365' | 'all';

export function Dashboard({ openRecords }: { openRecords: (id: string) => void }) {
  const [range, setRange] = useState<Range>('30');
  const sessions = useSessions();
  const body = useBody();
  const lifestyle = useLifestyle();
  const perfs = usePerformances();
  const { all, map } = useExercises();
  const today = todayIso();

  const allDates = [...sessions, ...body, ...lifestyle, ...perfs].map((r) => r.date).sort();
  const start = rangeStart(range, today, allDates[0] ?? null);

  const lastSession = sessions.at(-1)?.date;
  const sessionsInRange = sessions.filter((s) => s.date >= start).length;

  const latestPRs: (PRPoint & { exerciseId: string; type: PRType })[] = all
    .flatMap((ex) => prTypesFor(ex).flatMap((type) => prHistory(perfs, ex.id, type).map((p) => ({ ...p, exerciseId: ex.id, type }))))
    .filter((p) => p.isPR && p.date >= start)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const weekVol = muscleVolume(sessions, map, addDays(today, -6), today);
  const maxSets = Math.max(1, ...[...weekVol.values()].map((v) => v.primarySets));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Segmented
          options={[
            { value: '30', label: '30d' },
            { value: '90', label: '90d' },
            { value: '365', label: '1y' },
            { value: 'all', label: 'All' },
          ]}
          value={range}
          onChange={setRange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Days since last session"
          value={lastSession ? daysSince(lastSession, today) : '—'}
          sub={lastSession ? shortDate(lastSession) : 'no sessions yet'}
        />
        <Stat label="Sessions in range" value={sessionsInRange} sub={`since ${shortDate(start)}`} />
      </div>

      <Card title="Nutrition — last 7 days">
        <NutritionSummary compact />
      </Card>

      <Card title="Latest PRs">
        {latestPRs.length === 0 ? (
          <Empty>No PRs in this range.</Empty>
        ) : (
          <ul className="text-sm">
            {latestPRs.map((p) => (
              <li key={`${p.exerciseId}-${p.type}-${p.date}`} className="flex justify-between border-t border-[#2c2b28] py-1.5">
                <button type="button" className="text-left hover:underline" onClick={() => openRecords(p.exerciseId)}>
                  {exName(map, p.exerciseId)} <span className="text-xs text-[var(--text-muted)]">{PR_LABEL[p.type]}</span>
                </button>
                <span className="tabular-nums text-[var(--text-secondary)]">
                  {prValueText(p.type, p.perf)} · {shortDate(p.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Bodyweight">
        <WeightChart body={body} start={start} />
      </Card>

      <Card title="Volume by muscle — last 7 days">
        {weekVol.size === 0 ? (
          <Empty>No sets in the last 7 days.</Empty>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {MUSCLES.map((m) => {
              const v = weekVol.get(m.id);
              const sets = v?.primarySets ?? 0;
              return (
                <li key={m.id} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-2" title={`${sets} primary sets, ${v?.reps ?? 0} reps, ${v?.secondarySets ?? 0} secondary sets`}>
                  <span className="truncate text-xs text-[var(--text-secondary)]">{m.label.replace('Shoulders – ', '')}</span>
                  <span className="h-2.5 rounded-full bg-[var(--surface-2)]">
                    {sets > 0 && <span className="block h-full rounded-full bg-[var(--series-1)]" style={{ width: `${(sets / maxSets) * 100}%` }} />}
                  </span>
                  <span className="text-right text-xs tabular-nums">
                    {sets} sets · {v?.reps ?? 0} r
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-[var(--text-muted)]">Sets where the muscle is a primary mover. Full breakdown in Workouts.</p>
      </Card>

      <TrainingLoad sessions={sessions} start={start} />

      <Card title="Sleep & sitting">
        <SleepChart rows={lifestyle} start={start} />
        <WeeklyTable rows={lifestyle} start={start} />
      </Card>
    </div>
  );
}
