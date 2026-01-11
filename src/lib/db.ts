import Dexie, { Table } from 'dexie';
import { User, Routine, DailyLog } from './models';
import { v4 as uuidv4 } from 'uuid';

export class DailyLoopDatabase extends Dexie {
  users!: Table<User, string>;
  routines!: Table<Routine, string>;
  dailyLogs!: Table<DailyLog, [string, string]>;

  constructor() {
    super('DailyLoopDB');

    // Version 1: Initial schema
    this.version(1).stores({
      routines: 'id, sortOrder, isActive',
      dailyLogs: '[date+routineId], date, routineId'
    });

    // Version 2: Add users and userId to existing tables
    this.version(2).stores({
      users: 'id, name',
      routines: 'id, userId, sortOrder, isActive',
      dailyLogs: '[date+routineId], date, routineId, userId'
    }).upgrade(async (tx) => {
      // Create default user for existing data
      const defaultUser: User = {
        id: uuidv4(),
        name: '나',
        emoji: '😊',
        sortOrder: 0,
        createdAt: new Date().toISOString()
      };

      await tx.table('users').add(defaultUser);

      // Add userId to existing routines
      const routines = await tx.table('routines').toArray();
      for (const routine of routines) {
        await tx.table('routines').update(routine.id, {
          userId: defaultUser.id
        });
      }

      // Add userId to existing dailyLogs
      const logs = await tx.table('dailyLogs').toArray();
      for (const log of logs) {
        await tx.table('dailyLogs').update([log.date, log.routineId], {
          userId: defaultUser.id
        });
      }
    });

    // Version 3: Add sortOrder to users
    this.version(3).stores({
      users: 'id, name, sortOrder',
      routines: 'id, userId, sortOrder, isActive',
      dailyLogs: '[date+routineId], date, routineId, userId'
    }).upgrade(async (tx) => {
      // Add sortOrder to existing users
      const users = await tx.table('users').toArray();
      for (let i = 0; i < users.length; i++) {
        await tx.table('users').update(users[i].id, {
          sortOrder: i
        });
      }
    });
  }
}

export const db = new DailyLoopDatabase();

// User management
export async function createUser(name: string, emoji: string): Promise<User> {
  const users = await db.users.toArray();
  const maxSortOrder = users.length > 0 ? Math.max(...users.map(u => u.sortOrder)) : -1;

  const user: User = {
    id: uuidv4(),
    name,
    emoji,
    sortOrder: maxSortOrder + 1,
    createdAt: new Date().toISOString()
  };

  await db.users.add(user);
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  const users = await db.users.toArray();
  return users.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function updateUser(userId: string, name: string, emoji: string): Promise<void> {
  await db.users.update(userId, { name, emoji });
}

export async function deleteUser(userId: string): Promise<void> {
  await db.transaction('rw', db.users, db.routines, db.dailyLogs, async () => {
    // Delete user's routines
    const userRoutines = await db.routines.filter(r => r.userId === userId).toArray();
    for (const routine of userRoutines) {
      await db.routines.delete(routine.id);
    }

    // Delete user's daily logs
    const userLogs = await db.dailyLogs.filter(log => log.userId === userId).toArray();
    for (const log of userLogs) {
      await db.dailyLogs.delete([log.date, log.routineId]);
    }

    // Delete user
    await db.users.delete(userId);
  });
}

export async function initializeTodayLogs(todayString: string): Promise<void> {
  const users = await getAllUsers();

  for (const user of users) {
    const activeRoutines = await db.routines
      .filter(r => r.isActive && r.userId === user.id)
      .toArray();

    for (const routine of activeRoutines) {
      const existingLog = await db.dailyLogs.get([todayString, routine.id]);

      if (!existingLog) {
        await db.dailyLogs.add({
          date: todayString,
          routineId: routine.id,
          userId: user.id,
          done: false,
          updatedAt: new Date().toISOString(),
          spentMinutes: routine.type === 'time' ? 0 : undefined,
          currentCount: routine.type === 'count' ? 0 : undefined
        });
      }
    }
  }
}

export async function exportData(): Promise<string> {
  const users = await db.users.toArray();
  const routines = await db.routines.toArray();
  const dailyLogs = await db.dailyLogs.toArray();

  const data = {
    users,
    routines,
    dailyLogs,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString);

    await db.transaction('rw', db.users, db.routines, db.dailyLogs, async () => {
      await db.users.clear();
      await db.routines.clear();
      await db.dailyLogs.clear();

      if (data.users && Array.isArray(data.users)) {
        await db.users.bulkAdd(data.users);
      }

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
  await db.transaction('rw', db.users, db.routines, db.dailyLogs, async () => {
    await db.users.clear();
    await db.routines.clear();
    await db.dailyLogs.clear();
  });
}

// User order management
export async function moveUserUp(userId: string): Promise<void> {
  const users = await getAllUsers();
  const currentIndex = users.findIndex(u => u.id === userId);

  if (currentIndex <= 0) return; // Already at top or not found

  const currentUser = users[currentIndex];
  const previousUser = users[currentIndex - 1];

  await db.transaction('rw', db.users, async () => {
    await db.users.update(currentUser.id, { sortOrder: previousUser.sortOrder });
    await db.users.update(previousUser.id, { sortOrder: currentUser.sortOrder });
  });
}

export async function moveUserDown(userId: string): Promise<void> {
  const users = await getAllUsers();
  const currentIndex = users.findIndex(u => u.id === userId);

  if (currentIndex < 0 || currentIndex >= users.length - 1) return; // At bottom or not found

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];

  await db.transaction('rw', db.users, async () => {
    await db.users.update(currentUser.id, { sortOrder: nextUser.sortOrder });
    await db.users.update(nextUser.id, { sortOrder: currentUser.sortOrder });
  });
}

// Routine order management
export async function moveRoutineUp(routineId: string): Promise<void> {
  const routine = await db.routines.get(routineId);
  if (!routine) return;

  const userRoutines = await db.routines
    .filter(r => r.userId === routine.userId)
    .toArray();

  const sortedRoutines = userRoutines.sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = sortedRoutines.findIndex(r => r.id === routineId);

  if (currentIndex <= 0) return; // Already at top or not found

  const currentRoutine = sortedRoutines[currentIndex];
  const previousRoutine = sortedRoutines[currentIndex - 1];

  await db.transaction('rw', db.routines, async () => {
    await db.routines.update(currentRoutine.id, { sortOrder: previousRoutine.sortOrder });
    await db.routines.update(previousRoutine.id, { sortOrder: currentRoutine.sortOrder });
  });
}

export async function moveRoutineDown(routineId: string): Promise<void> {
  const routine = await db.routines.get(routineId);
  if (!routine) return;

  const userRoutines = await db.routines
    .filter(r => r.userId === routine.userId)
    .toArray();

  const sortedRoutines = userRoutines.sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = sortedRoutines.findIndex(r => r.id === routineId);

  if (currentIndex < 0 || currentIndex >= sortedRoutines.length - 1) return; // At bottom or not found

  const currentRoutine = sortedRoutines[currentIndex];
  const nextRoutine = sortedRoutines[currentIndex + 1];

  await db.transaction('rw', db.routines, async () => {
    await db.routines.update(currentRoutine.id, { sortOrder: nextRoutine.sortOrder });
    await db.routines.update(nextRoutine.id, { sortOrder: currentRoutine.sortOrder });
  });
}
