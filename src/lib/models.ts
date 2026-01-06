export interface Routine {
  id: string;
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
  done: boolean;
  updatedAt: string;
  spentMinutes?: number;
}

export interface DailyLogWithRoutine extends DailyLog {
  routine?: Routine;
}
