import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { getRecentDates, getTodayString } from '../lib/date';
import { DailyLog } from '../lib/models';

interface DayStats {
  date: string;
  completed: number;
  total: number;
}

export default function History() {
  const [stats, setStats] = useState<DayStats[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const recentDates = getRecentDates(14);
    const dayStats: DayStats[] = [];

    for (const date of recentDates) {
      const logs = await db.dailyLogs.where('date').equals(date).toArray();

      const activeLogs = await filterActiveLogs(logs);

      const completed = activeLogs.filter((log) => log.done).length;
      const total = activeLogs.length;

      dayStats.push({ date, completed, total });
    }

    setStats(dayStats);
    calculateStreak(dayStats);
  }

  async function filterActiveLogs(logs: DailyLog[]): Promise<DailyLog[]> {
    const activeRoutineIds = new Set(
      (await db.routines.filter(r => r.isActive).toArray()).map((r) => r.id)
    );

    return logs.filter((log) => activeRoutineIds.has(log.routineId));
  }

  function calculateStreak(dayStats: DayStats[]) {
    let currentStreak = 0;
    const today = getTodayString();

    for (const stat of dayStats) {
      if (stat.total === 0) {
        if (stat.date === today) {
          continue;
        } else {
          break;
        }
      }

      if (stat.completed === stat.total) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }

  return (
    <div className="container">
      <h1>📊 나의 기록</h1>

      <div className="streak-display">
        <h2>🔥 연속 달성: {streak}일!</h2>
      </div>

      <div className="history-list">
        {stats.map((stat) => (
          <div key={stat.date} className="history-item">
            <span className="history-date">{stat.date}</span>
            <span className="history-stats">
              {stat.completed} / {stat.total}
              {stat.total > 0 && stat.completed === stat.total && ' ✅'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
