import Dexie, { Table } from 'dexie';
import { Routine, DailyLog } from './models';

export class DailyLoopDatabase extends Dexie {
  routines!: Table<Routine, string>;
  dailyLogs!: Table<DailyLog, [string, string]>;

  constructor() {
    super('DailyLoopDB');

    this.version(1).stores({
      routines: 'id, sortOrder, isActive',
      dailyLogs: '[date+routineId], date, routineId'
    });
  }
}

export const db = new DailyLoopDatabase();

export async function initializeTodayLogs(todayString: string): Promise<void> {
  const activeRoutines = await db.routines
    .filter(r => r.isActive)
    .toArray();

  for (const routine of activeRoutines) {
    const existingLog = await db.dailyLogs.get([todayString, routine.id]);

    if (!existingLog) {
      await db.dailyLogs.add({
        date: todayString,
        routineId: routine.id,
        done: false,
        updatedAt: new Date().toISOString(),
        spentMinutes: routine.type === 'time' ? 0 : undefined
      });
    }
  }
}

export async function exportData(): Promise<string> {
  const routines = await db.routines.toArray();
  const dailyLogs = await db.dailyLogs.toArray();

  const data = {
    routines,
    dailyLogs,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString);

    await db.transaction('rw', db.routines, db.dailyLogs, async () => {
      await db.routines.clear();
      await db.dailyLogs.clear();

      if (data.routines && Array.isArray(data.routines)) {
        await db.routines.bulkAdd(data.routines);
      }

      if (data.dailyLogs && Array.isArray(data.dailyLogs)) {
        await db.dailyLogs.bulkAdd(data.dailyLogs);
      }
    });
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

export async function resetDatabase(): Promise<void> {
  await db.transaction('rw', db.routines, db.dailyLogs, async () => {
    await db.routines.clear();
    await db.dailyLogs.clear();
  });
}
