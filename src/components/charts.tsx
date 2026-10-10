import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { shortDate } from '../lib/dates';

export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

export interface SeriesDef {
  key: string;
  name: string;
  type?: 'line' | 'bar' | 'dots';
  color?: string;
}

const tooltipStyle = {
  background: 'var(--surface-2)',
  border: '1px solid #3a3936',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
};

/** One y-axis, date x-axis. Lines are 2px; bars are thin with rounded tops. */
export function TrendChart({
  data,
  series,
  unit,
  height = 220,
  digits = 1,
  refLine,
  band,
}: {
  data: object[];
  series: SeriesDef[];
  unit?: string;
  height?: number;
  digits?: number;
  refLine?: { y: number; label: string };
  band?: { y1: number; y2: number; label: string };
}) {
  const formatValue = (v: unknown) =>
    typeof v === 'number' ? `${v.toLocaleString(undefined, { maximumFractionDigits: digits })}${unit ? ' ' + unit : ''}` : '—';
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} strokeDasharray="0" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(d) => shortDate(String(d))}
            formatter={(v, name) => [formatValue(v), name]}
            cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
          />
          {band && (
            <ReferenceArea
              y1={band.y1}
              y2={band.y2}
              fill="var(--series-3)"
              fillOpacity={0.12}
              stroke="none"
              ifOverflow="extendDomain"
              label={{ value: band.label, position: 'insideTopLeft', fill: 'var(--text-muted)', fontSize: 11 }}
            />
          )}
          {refLine && (
            <ReferenceLine
              y={refLine.y}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: refLine.label, position: 'insideTopRight', fill: 'var(--text-secondary)', fontSize: 11 }}
            />
          )}
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />}
          {series.map((s, i) => {
            const color = s.color ?? SERIES[i % SERIES.length];
            if (s.type === 'bar')
              return <Bar key={s.key} dataKey={s.key} name={s.name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} legendType="square" />;
            if (s.type === 'dots')
              return <Scatter key={s.key} dataKey={s.key} name={s.name} fill={color} isAnimationActive={false} legendType="circle" r={3} />;
            return (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
