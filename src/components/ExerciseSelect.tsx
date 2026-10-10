import type { Exercise } from '../data/exercises.seed';

/** Exercise picker grouped by movement pattern, easiest first. */
export function ExerciseSelect({
  exercises,
  value,
  onChange,
}: {
  exercises: Exercise[];
  value: string;
  onChange: (id: string) => void;
}) {
  const groups = new Map<string, Exercise[]>();
  for (const e of exercises) {
    const key = e.custom ? 'Custom' : e.pattern;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        Choose exercise…
      </option>
      {[...groups.entries()].map(([pattern, list]) => (
        <optgroup key={pattern} label={pattern}>
          {[...list]
            .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
