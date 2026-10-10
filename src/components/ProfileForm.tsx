import { useEffect, useState } from 'react';
import { db, type Profile } from '../db/db';
import { useProfile } from '../hooks';
import { ACTIVITY_MULTIPLIERS } from '../lib/formulas';
import { toast } from './toast';
import { Button, Convention, Field, NumberInput } from './ui';

const EMPTY: Profile = { sex: 'male', birthDate: '', heightCm: 0, activityMultiplier: null };

export function ProfileForm() {
  const saved = useProfile();
  const [p, setP] = useState<Profile>(EMPTY);
  useEffect(() => {
    if (saved) setP(saved);
  }, [saved]);

  async function save() {
    await db.settings.put({ key: 'profile', value: p });
    toast('Profile saved');
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sex (for the equation)">
          <select value={p.sex} onChange={(e) => setP({ ...p, sex: e.target.value as Profile['sex'] })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Birth date">
          <input type="date" value={p.birthDate} onChange={(e) => setP({ ...p, birthDate: e.target.value })} />
        </Field>
        <Field label="Height (cm)">
          <NumberInput value={p.heightCm || null} onChange={(v) => setP({ ...p, heightCm: v ?? 0 })} min={0} />
        </Field>
      </div>
      <Field label="Activity multiplier (you choose)">
        <select
          value={p.activityMultiplier ?? ''}
          onChange={(e) => setP({ ...p, activityMultiplier: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">— not chosen —</option>
          {ACTIVITY_MULTIPLIERS.map((m) => (
            <option key={m.value} value={m.value}>
              × {m.value} — {m.label}
            </option>
          ))}
        </select>
      </Field>
      <Convention>
        Activity multipliers are standard but rough categories, not a measurement of what you burn. The app never picks one for you.
      </Convention>
      <div className="flex justify-end">
        <Button onClick={save}>Save profile</Button>
      </div>
    </div>
  );
}
