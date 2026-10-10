import type { ReactNode } from 'react';

export function Card({ title, children, right }: { title?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-xl bg-[var(--surface-1)] p-4 shadow-sm">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--text-secondary)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

/** Number input that maps empty → null. */
export function NumberInput({
  value,
  onChange,
  step = 'any',
  min,
  max,
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string | number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

type BtnKind = 'primary' | 'secondary' | 'danger' | 'ghost';
const btn: Record<BtnKind, string> = {
  primary: 'bg-[var(--series-1)] text-white hover:brightness-110',
  secondary: 'bg-[var(--surface-2)] text-[var(--text-primary)] hover:brightness-125',
  danger: 'bg-transparent text-red-400 hover:bg-red-950/40',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)]',
};

export function Button({
  kind = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 ${btn[kind]} ${className}`}
    />
  );
}

/** Marks a number that is a convention, not a measurement. */
export function Convention({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-md border border-dashed border-[#4a4944] px-2 py-1 text-xs text-[var(--text-muted)]">
      <span className="font-semibold text-[var(--text-secondary)]">Convention: </span>
      {children}
    </p>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return <code className="block rounded bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-secondary)]">{children}</code>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--text-muted)]">{children}</p>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[var(--text-secondary)]">{sub}</div>}
    </div>
  );
}

export function PRBadge() {
  return <span className="ml-1 rounded bg-[var(--good)]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--good)]">★ PR</span>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--surface-2)] p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            value === o.value ? 'bg-[var(--surface-0)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const fmt = (v: number | null | undefined, digits = 0) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
