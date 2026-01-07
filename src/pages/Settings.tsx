import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportData, importData, resetDatabase, getAllUsers, getCurrentUserId, updateUser, deleteUser, moveUserUp, moveUserDown } from '../lib/db';
import { User } from '../lib/models';

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const navigate = useNavigate();

  const emojiOptions = ['😊', '😄', '🥰', '😎', '🤓', '👶', '👧', '🧒', '👦', '👨', '👩', '🧑'];

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
    setCurrentUserIdState(getCurrentUserId());
  }

  function startEdit(user: User) {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmoji(user.emoji);
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditName('');
    setEditEmoji('');
  }

  async function saveEdit() {
    if (!editingUserId || !editName.trim()) return;

    await updateUser(editingUserId, editName.trim(), editEmoji);
    setEditingUserId(null);
    setEditName('');
    setEditEmoji('');
    await loadUsers();
  }

  async function handleDeleteUser(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`${user.name}님의 모든 루틴과 기록을 삭제할까요? 되돌릴 수 없어요!`)) return;

    try {
      await deleteUser(userId);
      await loadUsers();
      alert('삭제했어요');
    } catch (error) {
      console.error('Delete user failed:', error);
      alert('삭제에 실패했어요 😢');
    }
  }

  async function handleMoveUserUp(userId: string) {
    await moveUserUp(userId);
    await loadUsers();
  }

  async function handleMoveUserDown(userId: string) {
    await moveUserDown(userId);
    await loadUsers();
  }
  async function handleExport() {
    try {
      const jsonData = await exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-loop-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('데이터를 성공적으로 저장했어요! 📦');
    } catch (error) {
      console.error('Export failed:', error);
      alert('저장에 실패했어요 😢');
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importData(text);
        alert('데이터를 불러왔어요! 페이지를 새로고침할게요 ✨');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('불러오기에 실패했어요. 파일을 확인해주세요 😢');
      }
    };

    input.click();
  }

  async function handleReset() {
    if (!confirm('모든 데이터를 삭제할까요? 되돌릴 수 없어요! ⚠️')) return;

    try {
      await resetDatabase();
      alert('모든 데이터를 삭제했어요. 페이지를 새로고침할게요 🔄');
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('삭제에 실패했어요 😢');
    }
  }

  function handleManageUsers() {
    navigate('/user-select');
  }

  return (
    <div className="container">
      <h1>⚙️ 설정</h1>

      <div className="settings-section">
        <h2>👨‍👩‍👧‍👦 가족 관리</h2>

        <div className="current-users-list">
          {users.map((user, index) => (
            <div key={user.id}>
              {editingUserId === user.id ? (
                <div className="user-edit-card">
                  <div className="user-edit-form">
                    <div className="form-group">
                      <label>이름</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="이름 입력"
                      />
                    </div>

                    <div className="form-group">
                      <label>이모지 선택</label>
                      <div className="emoji-selector-small">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-option-small ${editEmoji === emoji ? 'selected' : ''}`}
                            onClick={() => setEditEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="user-edit-actions">
                      <button onClick={saveEdit} className="btn-primary">
                        ✅ 저장
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary">
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="user-info-card">
                  <div className="user-order-buttons">
                    <button
                      onClick={() => handleMoveUserUp(user.id)}
                      disabled={index === 0}
                      className="btn-order"
                      title="위로"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => handleMoveUserDown(user.id)}
                      disabled={index === users.length - 1}
                      className="btn-order"
                      title="아래로"
                    >
                      ⬇️
                    </button>
                  </div>
                  <span className="user-info-emoji">{user.emoji}</span>
                  <span className="user-info-name">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="current-user-badge">현재</span>
                  )}
                  <div className="user-card-actions">
                    <button onClick={() => startEdit(user)} className="btn-edit">
                      ✏️ 수정
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="btn-delete">
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleManageUsers} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          ➕ 가족 추가하기
        </button>
      </div>

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>📱 데이터 관리</h2>

        <div className="settings-buttons">
          <button onClick={handleExport} className="btn-primary">
            💾 데이터 내보내기
          </button>

          <button onClick={handleImport} className="btn-secondary">
            📥 데이터 가져오기
          </button>

          <button onClick={handleReset} className="btn-danger">
            🗑️ 모두 삭제하기
          </button>
        </div>

        <div className="settings-info">
          <p>
            <strong>💾 내보내기:</strong> 모든 데이터를 파일로 저장해요.
          </p>
          <p>
            <strong>📥 가져오기:</strong> 저장한 파일에서 데이터를 불러와요.
          </p>
          <p>
            <strong>🗑️ 삭제하기:</strong> 모든 루틴과 기록을 삭제해요. (되돌릴 수 없어요!)
          </p>
        </div>
      </div>
    </div>
  );
}
