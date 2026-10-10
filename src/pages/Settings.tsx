import { useLiveQuery } from 'dexie-react-hooks';
import { useRef } from 'react';
import { db, TABLES } from '../db/db';
import { exportData, importData } from '../db/backup';
import { loadSampleData } from '../db/sample';
import { todayIso } from '../lib/dates';
import { ProfileForm } from '../components/ProfileForm';
import { toast } from '../components/toast';
import { Button, Card } from '../components/ui';

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const counts = useLiveQuery(async () => Object.fromEntries(await Promise.all(TABLES.map(async (t) => [t, await db.table(t).count()] as const))), []);
  const isEmpty = counts && Object.values(counts).every((n) => n === 0);

  async function doExport() {
    const data = await exportData(db);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `calisthenics-backup-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function doImport(file: File) {
    try {
      const json = JSON.parse(await file.text());
      if (!confirm('Importing replaces ALL current data with the backup. Continue?')) return;
      await importData(db, json);
      toast('Backup imported');
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Profile">
        <ProfileForm />
      </Card>
      <Card title="Backup">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Your data stays in this browser only (IndexedDB). Export regularly; clearing site data deletes it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport}>Export JSON</Button>
          <Button kind="secondary" onClick={() => fileRef.current?.click()}>
            Import JSON…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
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
          <Button
            kind="danger"
            onClick={async () => {
              if (!confirm('Delete ALL data? Export a backup first if you want to keep it.')) return;
              await Promise.all(TABLES.map((t) => db.table(t).clear()));
              toast('All data deleted');
            }}
          >
            Delete all data
          </Button>
        </div>
        {isEmpty && <p className="mt-2 text-xs text-[var(--text-muted)]">Sample data is made up, for trying the app. Delete it before logging real data.</p>}
      </Card>
    </div>
  );
}
