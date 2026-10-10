import { useEffect, useMemo, useState } from 'react';
import { db, type BodyEntry } from '../db/db';
import { exName, useBody, useExercises, usePerformances, useProfile } from '../hooks';
import { energyEstimate, estimated1RM, smoothedSeries } from '../lib/analytics';
import { addDays, shortDate, todayIso } from '../lib/dates';
import { MIFFLIN_FORMULA_TEXT, totalLoad } from '../lib/formulas';
import { TrendChart } from '../components/charts';
import { ProfileForm } from '../components/ProfileForm';
import { toast } from '../components/toast';
import { Button, Card, Empty, Field, fmt, Formula, NumberInput, Segmented, Stat } from '../components/ui';

type Range = '30' | '90' | '365';
const FIELDS: { key: keyof BodyEntry; label: string }[] = [
  { key: 'weightKg', label: 'Weight (kg)' },
  { key: 'waistCm', label: 'Waist (cm)' },
  { key: 'chestCm', label: 'Chest (cm)' },
  { key: 'armCm', label: 'Arm (cm)' },
  { key: 'thighCm', label: 'Thigh (cm)' },
  { key: 'bodyFatPct', label: 'Body fat % (manual)' },
];

export function Body() {
  const body = useBody();
  return (
    <div className="space-y-4">
      <BodyForm body={body} />
      <WeightTrend body={body} />
      <EnergyCard />
      <RelativeStrength />
      <MeasurementHistory body={body} />
    </div>
  );
}

function BodyForm({ body }: { body: BodyEntry[] }) {
  const [date, setDate] = useState(todayIso());
  const [entry, setEntry] = useState<BodyEntry>({ date });
  useEffect(() => setEntry(body.find((b) => b.date === date) ?? { date }), [date, body]);

  async function save() {
    await db.body.put({ ...entry, date });
    toast('Saved');
  }

  return (
    <Card title="Log body metrics">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Date">
          <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <NumberInput value={entry[f.key] as number | null} onChange={(v) => setEntry({ ...entry, [f.key]: v })} min={0} />
          </Field>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {body.some((b) => b.date === date) && (
          <Button kind="danger" onClick={() => db.body.delete(date)}>
            Delete day
          </Button>
        )}
        <Button onClick={save}>Save</Button>
      </div>
    </Card>
  );
}

export function WeightChart({ body, start }: { body: BodyEntry[]; start: string }) {
  const data = smoothedSeries(body, (b) => b.weightKg, start, todayIso()).map((d) => ({ date: d.date, weight: d.value, avg7: d.avg }));
  if (!data.some((d) => d.weight != null)) return <Empty>No weigh-ins in this range.</Empty>;
  return (
    <>
      <TrendChart
        data={data}
        series={[
          { key: 'weight', name: 'Daily weigh-in', type: 'dots', color: 'var(--text-muted)' },
          { key: 'avg7', name: '7-day moving average' },
        ]}
        unit="kg"
      />
      <p className="mt-1 text-xs text-[var(--text-muted)]">7-day simple moving average of the days you weighed in, to smooth out day-to-day water changes.</p>
    </>
  );
}

function WeightTrend({ body }: { body: BodyEntry[] }) {
  const [range, setRange] = useState<Range>('90');
  return (
    <Card
      title="Bodyweight"
      right={<Segmented options={[{ value: '30', label: '30d' }, { value: '90', label: '90d' }, { value: '365', label: '1y' }]} value={range} onChange={setRange} />}
    >
      <WeightChart body={body} start={addDays(todayIso(), -(Number(range) - 1))} />
    </Card>
  );
}

function EnergyCard() {
  const body = useBody();
  const profile = useProfile();
  const est = energyEstimate(profile, body, todayIso());
  return (
    <Card title="BMR & TDEE">
      {est ? (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Stat label="BMR (Mifflin–St Jeor)" value={`${fmt(est.bmr)} kcal`} sub={`at ${fmt(est.weightKg, 1)} kg (7-day avg), age ${est.age}`} />
          <Stat
            label="TDEE"
            value={est.tdee != null ? `${fmt(est.tdee)} kcal` : '—'}
            sub={profile?.activityMultiplier ? `BMR × ${profile.activityMultiplier}` : 'choose an activity multiplier'}
          />
        </div>
      ) : (
        <Empty>Fill in the profile below and log a bodyweight to see BMR.</Empty>
      )}
      <Formula>{MIFFLIN_FORMULA_TEXT}</Formula>
      <p className="mb-3 mt-1 text-xs text-[var(--text-muted)]">These are population equations: estimates, not measurements of you.</p>
      <ProfileForm />
    </Card>
  );
}

function RelativeStrength() {
  const { map } = useExercises();
  const perfs = usePerformances();
  const repExercises = useMemo(() => {
    const ids = new Set(perfs.filter((p) => p.reps && map.get(p.exerciseId)?.measure === 'reps').map((p) => p.exerciseId));
    return [...ids];
  }, [perfs, map]);
  const [id, setId] = useState('');
  const chosen = id || (repExercises.includes('pullups') ? 'pullups' : repExercises[0] ?? '');

  // Top set per day = highest total load, ties broken by reps.
  const rows = useMemo(() => {
    const byDay = new Map<string, (typeof perfs)[number]>();
    for (const p of perfs) {
      if (p.exerciseId !== chosen || !p.reps) continue;
      const cur = byDay.get(p.date);
      const load = (p.addedKg ?? 0);
      if (!cur || load > (cur.addedKg ?? 0) || (load === (cur.addedKg ?? 0) && p.reps > (cur.reps ?? 0))) byDay.set(p.date, p);
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [perfs, chosen]);

  return (
    <Card title="Relative strength (total load)">
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        Total load = bodyweight + added weight, so you can see bodyweight changes in your bodyweight-exercise numbers. Bodyweight comes from the nearest logged weigh-in.
      </p>
      {repExercises.length === 0 ? (
        <Empty>Log some rep-based sets first.</Empty>
      ) : (
        <>
          <select value={chosen} onChange={(e) => setId(e.target.value)}>
            {repExercises.map((x) => (
              <option key={x} value={x}>
                {exName(map, x)}
              </option>
            ))}
          </select>
          <div className="mt-3">
            <TrendChart
              data={rows.map((r) => ({ date: r.date, total: totalLoad(r.bodyweightKg, r.addedKg), e1rm: estimated1RM(r) }))}
              series={[
                { key: 'total', name: 'Total load of top set' },
                { key: 'e1rm', name: 'Est. 1RM (Epley, ≤10 reps)', color: 'var(--series-2)' },
              ]}
              unit="kg"
              height={180}
            />
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-[var(--text-muted)]">
                <tr>
                  <th className="py-1 font-normal">Date</th>
                  <th className="font-normal">Reps</th>
                  <th className="font-normal">BW</th>
                  <th className="font-normal">Added</th>
                  <th className="font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().slice(0, 10).map((r) => (
                  <tr key={r.date} className="border-t border-[#2c2b28]">
                    <td className="py-1">{shortDate(r.date)}</td>
                    <td>{r.reps}</td>
                    <td>{fmt(r.bodyweightKg, 1)}</td>
                    <td>{fmt(r.addedKg ?? 0, 1)}</td>
                    <td>{fmt(totalLoad(r.bodyweightKg, r.addedKg), 1)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function MeasurementHistory({ body }: { body: BodyEntry[] }) {
  const rows = [...body].reverse().slice(0, 30);
  if (!rows.length) return null;
  return (
    <Card title="Recent entries">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-left text-xs text-[var(--text-muted)]">
            <tr>
              <th className="py-1 font-normal">Date</th>
              <th className="font-normal">kg</th>
              <th className="font-normal">Waist</th>
              <th className="font-normal">Chest</th>
              <th className="font-normal">Arm</th>
              <th className="font-normal">Thigh</th>
              <th className="font-normal">BF%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.date} className="border-t border-[#2c2b28]">
                <td className="py-1">{shortDate(b.date)}</td>
                <td>{fmt(b.weightKg, 1)}</td>
                <td>{fmt(b.waistCm, 1)}</td>
                <td>{fmt(b.chestCm, 1)}</td>
                <td>{fmt(b.armCm, 1)}</td>
                <td>{fmt(b.thighCm, 1)}</td>
                <td>{fmt(b.bodyFatPct, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
