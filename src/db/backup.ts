import { TABLES, type TrackerDB } from './db';

export const BACKUP_FORMAT = 'calisthenics-tracker-backup';
export const BACKUP_VERSION = 1;

export async function exportData(db: TrackerDB) {
  const tables: Record<string, unknown[]> = {};
  for (const name of TABLES) tables[name] = await db.table(name).toArray();
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables };
}

/** Replaces all data with the contents of a backup created by exportData. */
export async function importData(db: TrackerDB, json: unknown) {
  const data = json as { format?: string; tables?: Record<string, unknown[]> };
  if (!data || data.format !== BACKUP_FORMAT || typeof data.tables !== 'object') {
    throw new Error('Not a Calisthenics Tracker backup file.');
  }
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const rows = data.tables![name];
      await db.table(name).clear();
      if (Array.isArray(rows) && rows.length) await db.table(name).bulkAdd(rows);
    }
  });
}
