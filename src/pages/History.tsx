import { useEffect, useState } from 'react';
import { db, getAllUsers } from '../lib/db';
import { getRecentDates, getTodayString } from '../lib/date';
import { User } from '../lib/models';

interface DayStats {
  date: string;
  completed: number;
  total: number;
}

interface UserHistoryGroup {
  user: User;
  stats: DayStats[];
  streak: number;
}

export default function History() {
  const [userGroups, setUserGroups] = useState<UserHistoryGroup[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  function toggleExpanded(userId: string) {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  async function loadHistory() {
    const users = await getAllUsers();

    if (users.length === 0) {
      return;
    }

    const groups: UserHistoryGroup[] = await Promise.all(
      users.map(async (user) => {
        const recentDates = getRecentDates(14);
        const dayStats: DayStats[] = [];

        for (const date of recentDates) {
          // 1. Get daily logs for this date
          const logs = await db.dailyLogs
            .where('date')
            .equals(date)
            .filter(log => log.userId === user.id)
            .toArray();

          // 2. Get all active routines that existed on this date
          const allActiveRoutines = await db.routines
            .filter(r => {
              if (!r.isActive || r.userId !== user.id) return false;

              // Check if routine was created before or on this date
              const routineDate = r.createdAt.split('T')[0]; // Extract YYYY-MM-DD
              return routineDate <= date;
            })
            .toArray();

          // 3. Calculate completed count from actual logs
          const activeRoutineIds = new Set(allActiveRoutines.map(r => r.id));
          const completed = logs.filter(log =>
            log.done && activeRoutineIds.has(log.routineId)
          ).length;

          // 4. Total is the number of active routines that existed on this date
          const total = allActiveRoutines.length;

          dayStats.push({ date, completed, total });
        }

        const streak = calculateStreak(dayStats);

        return { user, stats: dayStats, streak };
      })
    );

    setUserGroups(groups);
  }


  function calculateStreak(dayStats: DayStats[]): number {
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

    return currentStreak;
  }

  if (userGroups.length === 0) {
    return (
      <div className="container">
        <h1>📊 기록</h1>
        <p>가족을 먼저 추가해주세요! 설정 페이지에서 가족을 추가할 수 있어요. 😊</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>📊 우리 가족 기록</h1>

      {userGroups.map((group) => {
        const isExpanded = expandedUsers.has(group.user.id);
        const displayStats = isExpanded ? group.stats : group.stats.slice(0, 3);

        return (
          <div key={group.user.id} className="user-section">
            <div className="user-section-header">
              <span className="user-section-emoji">{group.user.emoji}</span>
              <span className="user-section-name">{group.user.name}의 기록</span>
            </div>

            <div className="streak-display">
              <h2>🔥 연속 달성: {group.streak}일!</h2>
            </div>

            <div className="history-list">
              {displayStats.map((stat) => (
                <div key={stat.date} className="history-item">
                  <span className="history-date">{stat.date}</span>
                  <span className="history-stats">
                    {stat.completed} / {stat.total}
                    {stat.total > 0 && stat.completed === stat.total && ' ✅'}
                  </span>
                </div>
              ))}
            </div>

            {group.stats.length > 3 && (
              <button
                onClick={() => toggleExpanded(group.user.id)}
                className="btn-expand"
              >
                {isExpanded ? '📖 간단히 보기' : '📋 상세보기 (전체 ' + group.stats.length + '일)'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
