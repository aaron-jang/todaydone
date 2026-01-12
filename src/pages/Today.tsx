import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, initializeTodayLogs, getAllUsers } from '../lib/db';
import { getTodayString } from '../lib/date';
import { DailyLog, Routine, User } from '../lib/models';

interface DailyLogWithRoutine extends DailyLog {
  routine?: Routine;
}

interface UserLogsGroup {
  user: User;
  logs: DailyLogWithRoutine[];
}

export default function Today() {
  const { t } = useTranslation();
  const [userGroups, setUserGroups] = useState<UserLogsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const todayString = getTodayString();

  useEffect(() => {
    loadTodayLogs();
  }, []);

  async function loadTodayLogs() {
    try {
      const users = await getAllUsers();

      if (users.length === 0) {
        setLoading(false);
        return;
      }

      await initializeTodayLogs(todayString);

      const groups: UserLogsGroup[] = await Promise.all(
        users.map(async (user) => {
          const todayLogs = await db.dailyLogs
            .where('date')
            .equals(todayString)
            .filter(log => log.userId === user.id)
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

          return { user, logs: sortedLogs };
        })
      );

      setUserGroups(groups);
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

  async function addCount(log: DailyLogWithRoutine, count: number) {
    if (!log.routine || log.routine.type !== 'count') return;

    const currentCount = log.currentCount || 0;
    const newCount = Math.max(0, currentCount + count); // 음수 방지
    const targetCount = log.routine.targetCount || 0;
    const newDone = newCount >= targetCount;

    await db.dailyLogs.update([todayString, log.routineId], {
      currentCount: newCount,
      done: newDone,
      updatedAt: new Date().toISOString()
    });

    await loadTodayLogs();
  }

  function generateShareText(user: User, logs: DailyLogWithRoutine[]): string {
    const completed = logs.filter(log => log.done).length;
    const total = logs.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    let text = t('share.title', { date: todayString }) + '\n\n';
    text += `${user.emoji} ${user.name}\n\n`;

    // 각 루틴별 상세 정보
    logs.forEach(log => {
      if (!log.routine) return;

      const isDone = log.done;
      const checkmark = isDone ? '✅' : '⬜';

      if (log.routine.type === 'check') {
        text += `${checkmark} ${log.routine.title}\n`;
      } else if (log.routine.type === 'time') {
        const current = log.spentMinutes || 0;
        const target = log.routine.targetMinutes || 0;
        text += `${checkmark} ${log.routine.title}\n`;
        text += `   ⏱️ ${current}/${target}${t('today.minutes')}\n`;
      } else if (log.routine.type === 'count') {
        const current = log.currentCount || 0;
        const target = log.routine.targetCount || 0;
        text += `${checkmark} ${log.routine.title}\n`;
        text += `   🔢 ${current}/${target}${t('today.times')}\n`;
      }
    });

    text += '\n' + t('share.progress', { completed, total, percent: progress }) + '\n';

    if (progress === 100) {
      text += '\n' + t('share.perfectMessage');
    }

    return text;
  }

  async function shareRoutines(user: User, logs: DailyLogWithRoutine[]) {
    const shareText = generateShareText(user, logs);

    try {
      // Web Share API 지원 확인
      if (navigator.share) {
        await navigator.share({
          title: t('today.userRoutines', { name: user.name }),
          text: shareText
        });
      } else {
        // Fallback: 클립보드 복사
        await navigator.clipboard.writeText(shareText);
        alert(t('share.copied'));
      }
    } catch (error) {
      // 사용자가 공유를 취소한 경우 등
      if ((error as Error).name !== 'AbortError') {
        console.error('공유 실패:', error);
        // Fallback으로 클립보드 복사 시도
        try {
          await navigator.clipboard.writeText(shareText);
          alert(t('share.copied'));
        } catch (clipboardError) {
          console.error('클립보드 복사 실패:', clipboardError);
          alert(t('share.failed'));
        }
      }
    }
  }

  if (loading) {
    return <div className="container">{t('today.loading')}</div>;
  }

  if (userGroups.length === 0) {
    return (
      <div className="container">
        <h1>{t('today.title', { date: todayString })}</h1>
        <p>{t('today.noFamily')}</p>
      </div>
    );
  }

  const totalCompleted = userGroups.reduce((sum, group) =>
    sum + group.logs.filter(log => log.done).length, 0);
  const totalCount = userGroups.reduce((sum, group) => sum + group.logs.length, 0);
  const overallProgress = totalCount > 0 ? (totalCompleted / totalCount) * 100 : 0;

  return (
    <div className="container">
      <h1>{t('today.title', { date: todayString })}</h1>

      {totalCount > 0 && (
        <div className="progress-summary">
          <div className="progress-header">
            <span className="progress-text">
              {t('today.overallProgress')} {totalCompleted} / {totalCount}
            </span>
            <span className="progress-percentage">{Math.round(overallProgress)}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {overallProgress === 100 && (
            <div className="celebration-message">
              {t('today.perfect')}
            </div>
          )}
        </div>
      )}

      {userGroups.map((group) => {
        if (group.logs.length === 0) return null;

        const userCompleted = group.logs.filter(log => log.done).length;
        const userTotal = group.logs.length;

        const userProgress = userTotal > 0 ? (userCompleted / userTotal) * 100 : 0;

        return (
          <div key={group.user.id} className="user-section">
            <div className="user-section-header">
              <span className="user-section-emoji">{group.user.emoji}</span>
              <span className="user-section-name">{t('today.userRoutines', { name: group.user.name })}</span>
              <span className="user-section-progress">
                {userCompleted}/{userTotal}
              </span>
              <button
                onClick={() => shareRoutines(group.user, group.logs)}
                className="btn-share"
                title={t('today.share')}
              >
                📤
              </button>
            </div>

            {userProgress === 100 && userTotal > 0 && (
              <div className="user-celebration-message">
                {t('today.userPerfect', { name: group.user.name })}
              </div>
            )}

            <div className="routine-list">
              {group.logs.map((log) => {
                if (!log.routine) return null;

                const isCheck = log.routine.type === 'check';
                const isTime = log.routine.type === 'time';
                const isCount = log.routine.type === 'count';

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
                            <div className="time-header">
                              <span className={log.done ? 'done' : ''}>{log.routine.title}</span>
                              <span className="time-progress-text">
                                ⏱ {log.spentMinutes || 0} / {log.routine.targetMinutes} {t('today.minutes')}
                              </span>
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
                          {!log.done && (
                            <div className="time-buttons">
                              <button onClick={() => addMinutes(log, 5)}>+5</button>
                              <button onClick={() => addMinutes(log, 10)}>+10</button>
                              <button onClick={() => addMinutes(log, 30)}>+30</button>
                            </div>
                          )}
                          {log.done && (
                            <div className="time-completed-badge">
                              {t('today.completed')}
                            </div>
                          )}
                        </div>
                      )}

                      {isCount && (
                        <div className="time-routine">
                          <div className="time-info">
                            <div className="time-header">
                              <span className={log.done ? 'done' : ''}>{log.routine.title}</span>
                              <span className="time-progress-text">
                                🔢 {log.currentCount || 0} / {log.routine.targetCount} {t('today.times')}
                              </span>
                            </div>
                            <div className="time-progress-bar-container">
                              <div
                                className="time-progress-bar-fill"
                                style={{
                                  width: `${Math.min(
                                    ((log.currentCount || 0) / (log.routine.targetCount || 1)) * 100,
                                    100
                                  )}%`
                                }}
                              />
                            </div>
                          </div>
                          {!log.done && (
                            <div className="time-buttons">
                              <button onClick={() => addCount(log, 1)}>+1</button>
                              <button onClick={() => addCount(log, 5)}>+5</button>
                            </div>
                          )}
                          {log.done && (
                            <div className="time-completed-badge">
                              {t('today.completed')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {totalCount === 0 && (
        <p>{t('today.noRoutines')}</p>
      )}
    </div>
  );
}
