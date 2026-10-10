import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { db, TABLES } from '../db/db';
import { exportData, importData } from '../db/backup';
import { loadSampleData } from '../db/sample';
import { todayIso } from '../lib/dates';
import { ProfileForm } from '../components/ProfileForm';
import { toast } from '../components/toast';
import { Button, Card, ConfirmButton } from '../components/ui';

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const counts = useLiveQuery(async () => Object.fromEntries(await Promise.all(TABLES.map(async (t) => [t, await db.table(t).count()] as const))), []);
  const isEmpty = counts && Object.values(counts).every((n) => n === 0);
  const [exported, setExported] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [pending, setPending] = useState<unknown>(null);

  async function getJson() {
    return JSON.stringify(await exportData(db), null, 2);
  }

  async function download() {
    const blob = new Blob([await getJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `calisthenics-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy() {
    const json = await getJson();
    setExported(json);
    try {
      await navigator.clipboard.writeText(json);
      toast('Backup copied to clipboard');
    } catch {
      toast('Copy blocked here: select the text below and copy it');
    }
  }

  function stage(text: string) {
    try {
      const json = JSON.parse(text);
      if ((json as { format?: string })?.format !== 'calisthenics-tracker-backup') throw new Error('This is not a Calisthenics Tracker backup.');
      setPending(json);
    } catch (e) {
      toast(`Import failed: ${(e as Error).message}`);
    }
  }

  async function confirmImport() {
    try {
      await importData(db, pending);
      setPending(null);
      setPasted('');
      toast('Backup imported');
    } catch (e) {
      toast(`Import failed: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Profile">
        <ProfileForm />
      </Card>
      <Card title="Backup">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Your data stays in this browser only. Back it up regularly: clearing site data deletes it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>Download JSON</Button>
          <Button kind="secondary" onClick={copy}>
            Copy JSON
          </Button>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">If the download does nothing (some embedded views block downloads), use Copy JSON and paste it into a note or file.</p>
        {exported && <textarea readOnly rows={5} className="mt-2 font-mono text-xs" value={exported} onFocus={(e) => e.currentTarget.select()} />}

        <div className="mt-4 space-y-2 border-t border-[#2c2b28] pt-3">
          <div className="text-sm font-medium">Restore a backup</div>
          <div className="flex flex-wrap gap-2">
            <Button kind="secondary" onClick={() => fileRef.current?.click()}>
              Choose JSON file…
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) stage(await f.text());
              e.target.value = '';
            }}
          />
          <textarea rows={3} placeholder="…or paste backup JSON here" className="font-mono text-xs" value={pasted} onChange={(e) => setPasted(e.target.value)} />
          {pasted.trim() && !pending && (
            <Button kind="secondary" onClick={() => stage(pasted)}>
              Check pasted backup
            </Button>
          )}
          {pending != null && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-950/30 p-2 text-sm">
              <span>Restoring replaces all current data with this backup.</span>
              <ConfirmButton label="Replace my data" confirmLabel="Tap again to replace" onConfirm={confirmImport} />
              <Button kind="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        {counts && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {counts.sessions} sessions · {counts.attempts} PR tests · {counts.body} body entries · {counts.nutrition} nutrition days · {counts.lifestyle} sleep days · {counts.customExercises} custom exercises
          </p>
        )}
      </Card>
      <Card title="Data">
        <div className="flex flex-wrap gap-2">
          {isEmpty && (
            <Button kind="secondary" onClick={() => loadSampleData(db).then(() => toast('Sample data loaded'))}>
              Load sample data
            </Button>
          )}
          <ConfirmButton
            label="Delete all data"
            confirmLabel="Delete everything? Tap again"
            onConfirm={async () => {
              await Promise.all(TABLES.map((t) => db.table(t).clear()));
              toast('All data deleted');
            }}
          />
        </div>
        {isEmpty && <p className="mt-2 text-xs text-[var(--text-muted)]">Sample data is made up, for trying the app. Delete it before logging real data.</p>}
      </Card>
    </div>
  );
}
