import { useEffect, useState } from 'react';
import { db, type LifestyleEntry } from '../db/db';
import { useLifestyle } from '../hooks';
import { dailySeries, weeklyAverages } from '../lib/analytics';
import { addDays, shortDate, todayIso } from '../lib/dates';
import { TrendChart } from '../components/charts';
import { toast } from '../components/toast';
import { Button, Card, Empty, Field, fmt, NumberInput, Segmented } from '../components/ui';

export function Sleep() {
  const rows = useLifestyle();
  const [range, setRange] = useState<'30' | '90' | '365'>('30');
  const start = addDays(todayIso(), -(Number(range) - 1));
  return (
    <div className="space-y-4">
      <SleepForm rows={rows} />
      <Card
        title="Sleep & sitting"
        right={<Segmented options={[{ value: '30', label: '30d' }, { value: '90', label: '90d' }, { value: '365', label: '1y' }]} value={range} onChange={setRange} />}
      >
        <SleepChart rows={rows} start={start} />
        <WeeklyTable rows={rows} start={start} />
        <p className="mt-2 text-xs text-[var(--text-muted)]">Trends and weekly averages only. No score or penalty is worked out from these numbers.</p>
      </Card>
    </div>
  );
}

function SleepForm({ rows }: { rows: LifestyleEntry[] }) {
  const [date, setDate] = useState(todayIso());
  const [entry, setEntry] = useState<LifestyleEntry>({ date });
  useEffect(() => setEntry(rows.find((r) => r.date === date) ?? { date }), [date, rows]);
  return (
    <Card title="Log sleep & sitting">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date" hint="Sleep: the night before this day">
          <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Sleep (h)">
          <NumberInput value={entry.sleepHours} onChange={(v) => setEntry({ ...entry, sleepHours: v })} min={0} max={24} step={0.25} />
        </Field>
        <Field label="Sitting (h)">
          <NumberInput value={entry.sittingHours} onChange={(v) => setEntry({ ...entry, sittingHours: v })} min={0} max={24} step={0.5} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {rows.some((r) => r.date === date) && (
          <Button kind="danger" onClick={() => db.lifestyle.delete(date)}>
            Delete day
          </Button>
        )}
        <Button
          onClick={async () => {
            await db.lifestyle.put({ ...entry, date });
            toast('Saved');
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

export function SleepChart({ rows, start }: { rows: LifestyleEntry[]; start: string }) {
  const sleep = dailySeries(rows, (r) => r.sleepHours, start, todayIso());
  const sit = dailySeries(rows, (r) => r.sittingHours, start, todayIso());
  if (!sleep.some((d) => d.value != null) && !sit.some((d) => d.value != null)) return <Empty>Nothing logged in this range.</Empty>;
  return (
    <TrendChart
      data={sleep.map((d, i) => ({ date: d.date, sleep: d.value, sitting: sit[i].value }))}
      series={[
        { key: 'sleep', name: 'Sleep', color: 'var(--series-4)' },
        { key: 'sitting', name: 'Sitting', color: 'var(--series-2)' },
      ]}
      unit="h"
    />
  );
}

export function WeeklyTable({ rows, start }: { rows: LifestyleEntry[]; start: string }) {
  const sleep = weeklyAverages(dailySeries(rows, (r) => r.sleepHours, start, todayIso()));
  const sit = weeklyAverages(dailySeries(rows, (r) => r.sittingHours, start, todayIso()));
  const weeks = [...new Set([...sleep, ...sit].map((w) => w.week))].sort().reverse();
  if (!weeks.length) return null;
  return (
    <table className="mt-3 w-full text-sm tabular-nums">
      <thead className="text-left text-xs text-[var(--text-muted)]">
        <tr>
          <th className="py-1 font-normal">Week of</th>
          <th className="text-right font-normal">Avg sleep</th>
          <th className="text-right font-normal">Avg sitting</th>
        </tr>
      </thead>
      <tbody>
        {weeks.map((w) => {
          const s = sleep.find((x) => x.week === w);
          const t = sit.find((x) => x.week === w);
          return (
            <tr key={w} className="border-t border-[#2c2b28]">
              <td className="py-1">{shortDate(w)}</td>
              <td className="text-right">{s ? `${fmt(s.avg, 1)} h` : '—'} <span className="text-xs text-[var(--text-muted)]">{s ? `(${s.days}d)` : ''}</span></td>
              <td className="text-right">{t ? `${fmt(t.avg, 1)} h` : '—'} <span className="text-xs text-[var(--text-muted)]">{t ? `(${t.days}d)` : ''}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
