export interface User {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  createdAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  type: 'check' | 'time';
  targetMinutes?: number;
}

export interface DailyLog {
  date: string;
  routineId: string;
  userId: string;
  done: boolean;
  updatedAt: string;
  spentMinutes?: number;
}

export interface DailyLogWithRoutine extends DailyLog {
  routine?: Routine;
}
