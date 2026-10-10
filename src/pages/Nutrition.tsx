import { useEffect, useState } from 'react';
import { db, type NutritionEntry } from '../db/db';
import { useBody, useNutrition, useProfile } from '../hooks';
import { energyEstimate, smoothedSeries, trailingAverage } from '../lib/analytics';
import { addDays, shortDate, todayIso } from '../lib/dates';
import { energyBalance, PROTEIN_HIGH_G_PER_KG, PROTEIN_LOW_G_PER_KG, PROTEIN_SOURCE, proteinRange } from '../lib/formulas';
import { TrendChart } from '../components/charts';
import { toast } from '../components/toast';
import { Button, Card, Empty, Field, fmt, NumberInput, Segmented, Stat } from '../components/ui';

export function Nutrition() {
  const rows = useNutrition();
  return (
    <div className="space-y-4">
      <NutritionForm rows={rows} />
      <NutritionSummary />
      <NutritionCharts rows={rows} />
      <NutritionHistory rows={rows} />
    </div>
  );
}

function NutritionForm({ rows }: { rows: NutritionEntry[] }) {
  const [date, setDate] = useState(todayIso());
  const [entry, setEntry] = useState<NutritionEntry>({ date });
  useEffect(() => setEntry(rows.find((r) => r.date === date) ?? { date }), [date, rows]);

  return (
    <Card title="Log daily intake">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Calories (kcal)">
          <NumberInput value={entry.calories} onChange={(v) => setEntry({ ...entry, calories: v })} min={0} step={1} />
        </Field>
        <Field label="Protein (g)">
          <NumberInput value={entry.proteinG} onChange={(v) => setEntry({ ...entry, proteinG: v })} min={0} step={1} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Meal notes (optional)">
          <textarea rows={2} value={entry.notes ?? ''} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {rows.some((r) => r.date === date) && (
          <Button kind="danger" onClick={() => db.nutrition.delete(date)}>
            Delete day
          </Button>
        )}
        <Button
          onClick={async () => {
            await db.nutrition.put({ ...entry, date });
            toast('Saved');
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
}

/** 7-day averages, energy balance vs TDEE and protein reference. Shared with the dashboard. */
export function NutritionSummary({ compact = false }: { compact?: boolean }) {
  const rows = useNutrition();
  const body = useBody();
  const profile = useProfile();
  const today = todayIso();
  const cal = trailingAverage(rows, (r) => r.calories, today);
  const pro = trailingAverage(rows, (r) => r.proteinG, today);
  const est = energyEstimate(profile, body, today);
  const range = est ? proteinRange(est.weightKg) : null;
  const balance = cal.avg != null && est?.tdee != null ? energyBalance(cal.avg, est.tdee) : null;

  const content = (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Calories, 7-day avg" value={fmt(cal.avg)} sub={`${cal.days} of 7 days logged`} />
        <Stat label="Protein, 7-day avg" value={cal.days || pro.days ? `${fmt(pro.avg)} g` : '—'} sub={`${pro.days} of 7 days logged`} />
        <Stat
          label="vs TDEE (7-day avg)"
          value={balance == null ? '—' : `${balance > 0 ? '+' : ''}${fmt(balance)} kcal`}
          sub={balance == null ? 'needs TDEE (Body tab)' : balance > 0 ? 'surplus' : balance < 0 ? 'deficit' : 'maintenance'}
        />
      </div>
      {!compact && (
        <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3 text-sm">
          <div className="font-medium">Protein reference range</div>
          {range ? (
            <div className="tabular-nums">
              {fmt(range.low)}–{fmt(range.high)} g/day ({PROTEIN_LOW_G_PER_KG}–{PROTEIN_HIGH_G_PER_KG} g/kg × {fmt(est!.weightKg, 1)} kg, 7-day avg bodyweight)
            </div>
          ) : (
            <div className="text-[var(--text-muted)]">Log bodyweight and profile to see the range.</div>
          )}
          <div className="mt-1 text-xs text-[var(--text-muted)]">Reference only, not a prescription. Source: {PROTEIN_SOURCE}</div>
        </div>
      )}
    </>
  );
  return compact ? content : <Card title="Last 7 days">{content}</Card>;
}

export function CaloriesChart({ rows, start, tdeeKcal }: { rows: NutritionEntry[]; start: string; tdeeKcal: number | null }) {
  const daily = smoothedSeries(rows, (r) => r.calories, start, todayIso());
  if (!daily.some((d) => d.value != null)) return <Empty>No intake logged in this range.</Empty>;
  return (
    <TrendChart
      data={daily.map((d) => ({ date: d.date, kcal: d.value, avg: d.avg }))}
      series={[
        { key: 'kcal', name: 'Daily calories', type: 'dots', color: 'var(--text-muted)' },
        { key: 'avg', name: '7-day average' },
      ]}
      unit="kcal"
      digits={0}
      refLine={tdeeKcal != null ? { y: Math.round(tdeeKcal), label: 'TDEE' } : undefined}
    />
  );
}

function NutritionCharts({ rows }: { rows: NutritionEntry[] }) {
  const body = useBody();
  const profile = useProfile();
  const [range, setRange] = useState<'30' | '90' | '365'>('30');
  const start = addDays(todayIso(), -(Number(range) - 1));
  const est = energyEstimate(profile, body, todayIso());
  const pr = est ? proteinRange(est.weightKg) : null;
  const protein = smoothedSeries(rows, (r) => r.proteinG, start, todayIso());

  return (
    <Card
      title="Trends"
      right={<Segmented options={[{ value: '30', label: '30d' }, { value: '90', label: '90d' }, { value: '365', label: '1y' }]} value={range} onChange={setRange} />}
    >
      <h3 className="mb-1 text-sm text-[var(--text-secondary)]">Calories</h3>
      <CaloriesChart rows={rows} start={start} tdeeKcal={est?.tdee ?? null} />
      <h3 className="mb-1 mt-4 text-sm text-[var(--text-secondary)]">Protein</h3>
      {protein.some((d) => d.value != null) ? (
        <TrendChart
          data={protein.map((d) => ({ date: d.date, g: d.value, avg: d.avg }))}
          series={[
            { key: 'g', name: 'Daily protein', type: 'dots', color: 'var(--text-muted)' },
            { key: 'avg', name: '7-day average', color: 'var(--series-3)' },
          ]}
          unit="g"
          digits={0}
          band={pr ? { y1: pr.low, y2: pr.high, label: '1.6–2.2 g/kg' } : undefined}
        />
      ) : (
        <Empty>No protein logged in this range.</Empty>
      )}
    </Card>
  );
}

function NutritionHistory({ rows }: { rows: NutritionEntry[] }) {
  const recent = [...rows].reverse().slice(0, 30);
  if (!recent.length) return null;
  return (
    <Card title="Recent days">
      <ul className="text-sm">
        {recent.map((r) => (
          <li key={r.date} className="border-t border-[#2c2b28] py-1.5">
            <div className="flex justify-between tabular-nums">
              <span>{shortDate(r.date)}</span>
              <span className="text-[var(--text-secondary)]">
                {fmt(r.calories)} kcal · {fmt(r.proteinG)} g protein
              </span>
            </div>
            {r.notes && <div className="text-xs text-[var(--text-muted)]">{r.notes}</div>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
