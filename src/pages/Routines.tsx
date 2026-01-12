import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, getAllUsers, moveRoutineUp, moveRoutineDown } from '../lib/db';
import { Routine, User } from '../lib/models';
import { v4 as uuidv4 } from 'uuid';

interface UserRoutinesGroup {
  user: User;
  routines: Routine[];
}

export default function Routines() {
  const { t } = useTranslation();
  const [userGroups, setUserGroups] = useState<UserRoutinesGroup[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'check' | 'time' | 'count'>('check');
  const [newTargetMinutes, setNewTargetMinutes] = useState('30');
  const [newTargetCount, setNewTargetCount] = useState('10');

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    const users = await getAllUsers();

    if (users.length === 0) {
      return;
    }

    // Set first user as default selected user if not set
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }

    const groups: UserRoutinesGroup[] = await Promise.all(
      users.map(async (user) => {
        const userRoutines = await db.routines
          .filter(r => r.userId === user.id)
          .toArray();

        const sortedRoutines = userRoutines.sort((a, b) => a.sortOrder - b.sortOrder);
        return { user, routines: sortedRoutines };
      })
    );

    setUserGroups(groups);
  }

  async function addRoutine() {
    if (!newTitle.trim() || !selectedUserId) return;

    const userGroup = userGroups.find(g => g.user.id === selectedUserId);
    if (!userGroup) return;

    const routine: Routine = {
      id: uuidv4(),
      userId: selectedUserId,
      title: newTitle.trim(),
      isActive: true,
      sortOrder: userGroup.routines.length,
      createdAt: new Date().toISOString(),
      type: newType,
      targetMinutes: newType === 'time' ? parseInt(newTargetMinutes, 10) : undefined,
      targetCount: newType === 'count' ? parseInt(newTargetCount, 10) : undefined
    };

    await db.routines.add(routine);
    setNewTitle('');
    setNewType('check');
    setNewTargetMinutes('30');
    setNewTargetCount('10');
    await loadRoutines();
  }

  async function toggleActive(routine: Routine) {
    await db.routines.update(routine.id, {
      isActive: !routine.isActive
    });
    await loadRoutines();
  }

  async function deleteRoutine(id: string) {
    if (!confirm(t('routines.deleteConfirm'))) return;

    await db.routines.delete(id);
    await loadRoutines();
  }

  async function handleMoveRoutineUp(id: string) {
    await moveRoutineUp(id);
    await loadRoutines();
  }

  async function handleMoveRoutineDown(id: string) {
    await moveRoutineDown(id);
    await loadRoutines();
  }

  if (userGroups.length === 0) {
    return (
      <div className="container">
        <h1>{t('routines.title')}</h1>
        <p>{t('routines.noFamily')}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{t('routines.title')}</h1>

      <div className="add-routine">
        <div className="user-selector">
          <label>{t('routines.selectUser')}</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {userGroups.map(group => (
              <option key={group.user.id} value={group.user.id}>
                {group.user.emoji} {group.user.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t('routines.inputPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addRoutine();
            }
          }}
        />

        <div className="routine-type-selector">
          <label>
            <input
              type="radio"
              value="check"
              checked={newType === 'check'}
              onChange={(e) => setNewType(e.target.value as 'check' | 'time' | 'count')}
            />
            {t('routines.typeCheck')}
          </label>
          <label>
            <input
              type="radio"
              value="time"
              checked={newType === 'time'}
              onChange={(e) => setNewType(e.target.value as 'check' | 'time' | 'count')}
            />
            {t('routines.typeTime')}
          </label>
          <label>
            <input
              type="radio"
              value="count"
              checked={newType === 'count'}
              onChange={(e) => setNewType(e.target.value as 'check' | 'time' | 'count')}
            />
            {t('routines.typeCount')}
          </label>
        </div>

        {newType === 'time' && (
          <div className="target-minutes">
            <label>
              {t('routines.targetMinutes')}
              <input
                type="number"
                value={newTargetMinutes}
                onChange={(e) => setNewTargetMinutes(e.target.value)}
                min="1"
              />
            </label>
          </div>
        )}

        {newType === 'count' && (
          <div className="target-minutes">
            <label>
              {t('routines.targetCount')}
              <input
                type="number"
                value={newTargetCount}
                onChange={(e) => setNewTargetCount(e.target.value)}
                min="1"
              />
            </label>
          </div>
        )}

        <button type="button" onClick={addRoutine}>{t('routines.addButton')}</button>
      </div>

      {userGroups.map((group) => (
        <div key={group.user.id} className="user-section">
          <div className="user-section-header">
            <span className="user-section-emoji">{group.user.emoji}</span>
            <span className="user-section-name">{t('routines.userRoutines', { name: group.user.name })}</span>
            <span className="user-section-count">{t('routines.routineCount', { count: group.routines.length })}</span>
          </div>

          {group.routines.length === 0 ? (
            <p className="no-routines-message">{t('routines.noRoutines')}</p>
          ) : (
            <div className="routine-list">
              {group.routines.map((routine, index) => (
                <div key={routine.id} className="routine-item">
                  <div className="routine-order-buttons">
                    <button
                      onClick={() => handleMoveRoutineUp(routine.id)}
                      disabled={index === 0}
                      className="btn-order"
                      title={t('routines.moveUp')}
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => handleMoveRoutineDown(routine.id)}
                      disabled={index === group.routines.length - 1}
                      className="btn-order"
                      title={t('routines.moveDown')}
                    >
                      ⬇️
                    </button>
                  </div>
                  <div className="routine-info">
                    <span className={routine.isActive ? '' : 'inactive'}>{routine.title}</span>
                    {routine.type === 'time' && (
                      <span className="routine-meta">
                        ⏱ {routine.targetMinutes}{t('today.minutes')}
                      </span>
                    )}
                    {routine.type === 'count' && (
                      <span className="routine-meta">
                        🔢 {routine.targetCount}{t('today.times')}
                      </span>
                    )}
                  </div>
                  <div className="routine-actions">
                    <button onClick={() => toggleActive(routine)}>
                      {routine.isActive ? t('routines.deactivate') : t('routines.activate')}
                    </button>
                    <button onClick={() => deleteRoutine(routine.id)}>{t('routines.delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
