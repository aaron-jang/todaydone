import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Routine } from '../lib/models';
import { v4 as uuidv4 } from 'uuid';

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'check' | 'time'>('check');
  const [newTargetMinutes, setNewTargetMinutes] = useState('30');

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    const allRoutines = await db.routines.orderBy('sortOrder').toArray();
    setRoutines(allRoutines);
  }

  async function addRoutine() {
    if (!newTitle.trim()) return;

    const routine: Routine = {
      id: uuidv4(),
      title: newTitle.trim(),
      isActive: true,
      sortOrder: routines.length,
      createdAt: new Date().toISOString(),
      type: newType,
      targetMinutes: newType === 'time' ? parseInt(newTargetMinutes, 10) : undefined
    };

    await db.routines.add(routine);
    setNewTitle('');
    setNewType('check');
    setNewTargetMinutes('30');
    await loadRoutines();
  }

  async function toggleActive(routine: Routine) {
    await db.routines.update(routine.id, {
      isActive: !routine.isActive
    });
    await loadRoutines();
  }

  async function deleteRoutine(id: string) {
    if (!confirm('이 루틴을 삭제할까요?')) return;

    await db.routines.delete(id);
    await loadRoutines();
  }

  return (
    <div className="container">
      <h1>📝 내 루틴</h1>

      <div className="add-routine">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="루틴 이름을 입력하세요 (예: 양치하기, 독서하기)"
          onKeyDown={(e) => e.key === 'Enter' && addRoutine()}
        />

        <div className="routine-type-selector">
          <label>
            <input
              type="radio"
              value="check"
              checked={newType === 'check'}
              onChange={(e) => setNewType(e.target.value as 'check' | 'time')}
            />
            ✅ 체크
          </label>
          <label>
            <input
              type="radio"
              value="time"
              checked={newType === 'time'}
              onChange={(e) => setNewType(e.target.value as 'check' | 'time')}
            />
            ⏱️ 시간
          </label>
        </div>

        {newType === 'time' && (
          <div className="target-minutes">
            <label>
              목표 시간 (분):
              <input
                type="number"
                value={newTargetMinutes}
                onChange={(e) => setNewTargetMinutes(e.target.value)}
                min="1"
              />
            </label>
          </div>
        )}

        <button onClick={addRoutine}>➕ 추가하기</button>
      </div>

      <div className="routine-list">
        {routines.map((routine) => (
          <div key={routine.id} className="routine-item">
            <div className="routine-info">
              <span className={routine.isActive ? '' : 'inactive'}>{routine.title}</span>
              <span className="routine-meta">
                {routine.type === 'time' && `⏱ ${routine.targetMinutes}분`}
              </span>
            </div>
            <div className="routine-actions">
              <button onClick={() => toggleActive(routine)}>
                {routine.isActive ? '❌ 비활성화' : '✅ 활성화'}
              </button>
              <button onClick={() => deleteRoutine(routine.id)}>🗑️ 삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
