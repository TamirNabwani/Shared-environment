export const MUSCLES = [
  { id: 'chest', label: 'Chest' },
  { id: 'front_delts', label: 'Shoulders – front delts' },
  { id: 'side_delts', label: 'Shoulders – side delts' },
  { id: 'rear_delts', label: 'Shoulders – rear delts' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'lats', label: 'Lats' },
  { id: 'upper_back', label: 'Upper back / traps' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'abs', label: 'Abs / core' },
  { id: 'obliques', label: 'Obliques' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
] as const;

export type MuscleId = (typeof MUSCLES)[number]['id'];

export const muscleLabel = (id: string): string => MUSCLES.find((m) => m.id === id)?.label ?? id;
