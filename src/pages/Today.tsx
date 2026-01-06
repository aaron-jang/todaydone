import { useEffect, useState } from 'react';
import { db, initializeTodayLogs } from '../lib/db';
import { getTodayString } from '../lib/date';
import { DailyLog, Routine } from '../lib/models';

interface DailyLogWithRoutine extends DailyLog {
  routine?: Routine;
}

export default function Today() {
  const [logs, setLogs] = useState<DailyLogWithRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const todayString = getTodayString();

  useEffect(() => {
    loadTodayLogs();
  }, []);

  async function loadTodayLogs() {
    try {
      await initializeTodayLogs(todayString);

      const todayLogs = await db.dailyLogs
        .where('date')
        .equals(todayString)
        .toArray();

      const logsWithRoutines = await Promise.all(
        todayLogs.map(async (log) => {
          const routine = await db.routines.get(log.routineId);
          return { ...log, routine };
        })
      );

      const sortedLogs = logsWithRoutines
        .filter((log) => log.routine && log.routine.isActive)
        .sort((a, b) => {
          // 완료 여부로 먼저 정렬 (미완료가 위)
          if (a.done !== b.done) {
            return a.done ? 1 : -1;
          }
          // 같은 완료 상태면 sortOrder로 정렬
          return (a.routine!.sortOrder || 0) - (b.routine!.sortOrder || 0);
        });

      setLogs(sortedLogs);
    } catch (error) {
      console.error('Failed to load today logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCheck(log: DailyLogWithRoutine) {
    if (!log.routine) return;

    const newDone = !log.done;
    await db.dailyLogs.update([todayString, log.routineId], {
      done: newDone,
      updatedAt: new Date().toISOString()
    });

    await loadTodayLogs();
  }

  async function addMinutes(log: DailyLogWithRoutine, minutes: number) {
    if (!log.routine || log.routine.type !== 'time') return;

    const currentMinutes = log.spentMinutes || 0;
    const newMinutes = currentMinutes + minutes;
    const targetMinutes = log.routine.targetMinutes || 0;
    const newDone = newMinutes >= targetMinutes;

    await db.dailyLogs.update([todayString, log.routineId], {
      spentMinutes: newMinutes,
      done: newDone,
      updatedAt: new Date().toISOString()
    });

    await loadTodayLogs();
  }

  if (loading) {
    return <div className="container">불러오는 중...</div>;
  }

  const completedCount = logs.filter(log => log.done).length;
  const totalCount = logs.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="container">
      <h1>📅 {todayString}</h1>

      {logs.length === 0 ? (
        <p>활성화된 루틴이 없어요. 루틴 페이지에서 추가해주세요! 😊</p>
      ) : (
        <>
          <div className="progress-summary">
            <div className="progress-header">
              <span className="progress-text">
                오늘의 진행률 {completedCount} / {totalCount}
              </span>
              <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {progressPercentage === 100 && (
              <div className="celebration-message">
                🎉 완벽해요! 오늘도 최고예요! 🎉
              </div>
            )}
          </div>
        </>
      )}

      {logs.length > 0 && (
        <div className="routine-list">
          {logs.map((log) => {
            if (!log.routine) return null;

            const isCheck = log.routine.type === 'check';
            const isTime = log.routine.type === 'time';

            return (
              <div key={log.routineId} className="routine-item">
                <div className="routine-content">
                  {isCheck && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={log.done}
                        onChange={() => toggleCheck(log)}
                      />
                      <span className={log.done ? 'done' : ''}>{log.routine.title}</span>
                    </label>
                  )}

                  {isTime && (
                    <div className="time-routine">
                      <div className="time-info">
                        <span className={log.done ? 'done' : ''}>{log.routine.title}</span>
                        <div className="time-progress-wrapper">
                          <div className="time-progress-text">
                            ⏱ {log.spentMinutes || 0} / {log.routine.targetMinutes} 분
                          </div>
                          <div className="time-progress-bar-container">
                            <div
                              className="time-progress-bar-fill"
                              style={{
                                width: `${Math.min(
                                  ((log.spentMinutes || 0) / (log.routine.targetMinutes || 1)) * 100,
                                  100
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="time-buttons">
                        <button onClick={() => addMinutes(log, 5)}>+5</button>
                        <button onClick={() => addMinutes(log, 10)}>+10</button>
                        <button onClick={() => addMinutes(log, 30)}>+30</button>
                      </div>
                      {log.done && (
                        <div className="time-completed-badge">
                          ✨ 완료!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
