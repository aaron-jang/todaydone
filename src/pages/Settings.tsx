import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { exportData, importData, resetDatabase, getAllUsers, createUser, updateUser, deleteUser, moveUserUp, moveUserDown } from '../lib/db';
import { User } from '../lib/models';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  type NotificationSettings
} from '../lib/notifications';
import { formatTime } from '../lib/timeFormat';

export default function Settings() {
  const { t } = useTranslation();
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

    if (!confirm(t('settings.deleteConfirm'))) return;

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Delete user failed:', error);
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
      alert(t('settings.exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('settings.exportFailed'));
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
        alert(t('settings.importSuccess'));
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert(t('settings.importFailed'));
      }
    };

    input.click();
  }

  async function handleReset() {
    if (!confirm(t('settings.resetConfirm'))) return;

    try {
      await resetDatabase();
      alert(t('settings.resetSuccess'));
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert(t('settings.resetFailed'));
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
        alert(t('settings.notificationEnabled'));
      } else {
        alert(t('settings.notificationPermission'));
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
      <h1>{t('settings.title')}</h1>

      <div className="settings-section">
        <h2>{t('settings.familyManagement')}</h2>

        <div className="current-users-list">
          {users.map((user, index) => (
            <div key={user.id}>
              {editingUserId === user.id ? (
                <div className="user-edit-card">
                  <div className="user-edit-form">
                    <div className="form-group">
                      <label>{t('settings.name')}</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t('settings.namePlaceholder')}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('settings.emojiSelect')}</label>
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
                        {t('settings.complete')}
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary">
                        {t('settings.cancel')}
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
                      title={t('settings.moveUp')}
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => handleMoveUserDown(user.id)}
                      disabled={index === users.length - 1}
                      className="btn-order"
                      title={t('settings.moveDown')}
                    >
                      ⬇️
                    </button>
                  </div>
                  <span className="user-info-emoji">{user.emoji}</span>
                  <span className="user-info-name">{user.name}</span>
                  <div className="user-card-actions">
                    <button onClick={() => startEdit(user)} className="btn-edit">
                      {t('settings.edit')}
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="btn-delete">
                      {t('settings.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!showCreateForm && (
          <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {t('settings.addFamily')}
          </button>
        )}

        {showCreateForm && (
          <div className="create-user-form" style={{ marginTop: '1rem' }}>
            <h3>{t('settings.newFamily')}</h3>

            <div className="form-group">
              <label>{t('settings.name')}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('settings.namePlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateUser();
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>{t('settings.emojiSelect')}</label>
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
                {t('settings.complete')}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelCreate}>
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>{t('settings.dataManagement')}</h2>

        <div className="settings-buttons">
          <button onClick={handleExport} className="btn-primary">
            {t('settings.exportData')}
          </button>

          <button onClick={handleImport} className="btn-secondary">
            {t('settings.importData')}
          </button>

          <button onClick={handleReset} className="btn-danger">
            {t('settings.resetData')}
          </button>
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>{t('settings.darkMode')}</h2>

        <div className="dark-mode-toggle">
          <div className="dark-mode-info">
            <span className="dark-mode-label">{t('settings.darkMode')}</span>
            <p className="dark-mode-description">
              {t('settings.darkModeDesc')}
            </p>
          </div>
          <button onClick={toggleDarkMode} className={`toggle-button ${darkMode ? 'active' : ''}`}>
            <span className="toggle-slider"></span>
          </button>
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '1.5rem' }}>
        <h2>{t('settings.notifications')}</h2>

        <div className="notification-settings">
          <div className="dark-mode-toggle">
            <div className="dark-mode-info">
              <span className="dark-mode-label">
                {t('settings.morningAlarm')}
              </span>
              <p className="dark-mode-description">
                {t('settings.morningAlarmDesc')}
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
                {t('settings.notificationTime')}
              </label>
              <input
                id="notification-time"
                type="time"
                value={notificationSettings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="notification-time-input"
              />
              <div className="notification-time-display" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {formatTime(notificationSettings.time, i18n.language)}
              </div>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="notification-warning">
              {t('settings.notificationPermission')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
