import { useState, useEffect } from 'react';
import { exportData, importData, resetDatabase, getAllUsers, createUser, updateUser, deleteUser, moveUserUp, moveUserDown } from '../lib/db';
import { User } from '../lib/models';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  type NotificationSettings
} from '../lib/notifications';

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('😊');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const emojiOptions = ['😊', '😄', '🥰', '😎', '🤓', '👶', '👧', '🧒', '👦', '👨', '👩', '🧑'];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  async function loadUsers() {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
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

  async function handleCreateUser() {
    if (!newName.trim()) return;

    await createUser(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('😊');
    setShowCreateForm(false);
    await loadUsers();
  }

  function cancelCreate() {
    setNewName('');
    setNewEmoji('😊');
    setShowCreateForm(false);
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

  async function handleToggleNotifications() {
    if (!notificationSettings.enabled) {
      // Enabling notifications - request permission first
      const granted = await requestNotificationPermission();
      if (granted) {
        const newSettings = { ...notificationSettings, enabled: true };
        setNotificationSettings(newSettings);
        saveNotificationSettings(newSettings);
        setNotificationPermission('granted');
        alert('알림이 활성화되었어요! 매일 아침 8시에 알림을 받을 수 있어요 🔔');
      } else {
        alert('알림 권한이 필요해요. 브라우저 설정에서 알림을 허용해주세요.');
      }
    } else {
      // Disabling notifications
      const newSettings = { ...notificationSettings, enabled: false };
      setNotificationSettings(newSettings);
      saveNotificationSettings(newSettings);
    }
  }

  function handleTimeChange(time: string) {
    const newSettings = { ...notificationSettings, time };
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
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

        {!showCreateForm && (
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            ➕ 가족 추가하기
          </button>
        )}

        {showCreateForm && (
          <div className="create-user-form" style={{ marginTop: '1rem' }}>
            <h3>새 가족 추가하기</h3>

            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="이름을 입력하세요 (예: 엄마, 수아)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateUser();
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>이모지 선택</label>
              <div className="emoji-selector">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-option ${newEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setNewEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" className="btn-primary" onClick={handleCreateUser}>
                ✅ 완료
              </button>
              <button type="button" className="btn-secondary" onClick={cancelCreate}>
                취소
              </button>
            </div>
          </div>
        )}
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

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>🎨 테마 설정</h2>

        <div className="dark-mode-toggle">
          <div className="dark-mode-info">
            <span className="dark-mode-label">{darkMode ? '🌙 다크모드' : '☀️ 라이트모드'}</span>
            <p className="dark-mode-description">
              {darkMode ? '어두운 배경으로 눈이 편안해요' : '밝은 배경으로 화면이 또렷해요'}
            </p>
          </div>
          <button onClick={toggleDarkMode} className={`toggle-button ${darkMode ? 'active' : ''}`}>
            <span className="toggle-slider"></span>
          </button>
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>🔔 알림 설정</h2>

        <div className="notification-settings">
          <div className="dark-mode-toggle">
            <div className="dark-mode-info">
              <span className="dark-mode-label">
                {notificationSettings.enabled ? '🔔 알림 켜짐' : '🔕 알림 꺼짐'}
              </span>
              <p className="dark-mode-description">
                {notificationSettings.enabled
                  ? '매일 정해진 시간에 알림을 받아요'
                  : '알림을 받지 않아요'}
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`toggle-button ${notificationSettings.enabled ? 'active' : ''}`}
              disabled={notificationPermission === 'denied'}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {notificationSettings.enabled && (
            <div className="notification-time-setting" style={{ marginTop: '1rem' }}>
              <label htmlFor="notification-time" className="notification-time-label">
                알림 시간 설정
              </label>
              <input
                id="notification-time"
                type="time"
                value={notificationSettings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="notification-time-input"
              />
              <p className="notification-time-description">
                매일 {notificationSettings.time}에 루틴 알림을 받아요
              </p>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="notification-warning">
              ⚠️ 알림이 차단되었어요. 브라우저 설정에서 알림을 허용해주세요.
            </div>
          )}

          <div className="settings-info" style={{ marginTop: '1rem' }}>
            <p>
              <strong>💡 알림 안내:</strong> 웹 브라우저 알림으로 매일 정해진 시간에 루틴을 확인할 수 있어요.
            </p>
            <p>
              <strong>📱 참고:</strong> 일부 브라우저에서는 앱이 닫혀있을 때 알림이 오지 않을 수 있어요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
