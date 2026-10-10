// Dates are stored as local calendar days in YYYY-MM-DD form.

const pad = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

/** Every calendar day from start to end inclusive. */
export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Monday of the week containing iso. */
export function weekStart(iso: string): string {
  const d = parse(iso);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return addDays(iso, -dow);
}

export function shortDate(iso: string): string {
  return parse(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
