import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, setCurrentUserId, createUser } from '../lib/db';
import { User } from '../lib/models';

export default function UserSelect() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('😊');
  const navigate = useNavigate();

  const emojiOptions = ['😊', '😄', '🥰', '😎', '🤓', '👶', '👧', '🧒', '👦', '👨', '👩', '🧑'];

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const allUsers = await getAllUsers();
    setUsers(allUsers);

    // If there are no users, show create form
    if (allUsers.length === 0) {
      setShowCreateForm(true);
    }
  }

  async function selectUser(userId: string) {
    setCurrentUserId(userId);
    navigate('/');
  }

  async function handleCreateUser() {
    if (!newName.trim()) return;

    const user = await createUser(newName.trim(), newEmoji);
    setCurrentUserId(user.id);
    navigate('/');
  }

  return (
    <div className="container">
      <h1>👨‍👩‍👧‍👦 우리 가족</h1>
      <p className="user-select-subtitle">누구의 루틴을 볼까요?</p>

      {!showCreateForm && users.length > 0 && (
        <>
          <div className="user-list">
            {users.map((user) => (
              <button
                key={user.id}
                className="user-card"
                onClick={() => selectUser(user.id)}
              >
                <span className="user-emoji">{user.emoji}</span>
                <span className="user-name">{user.name}</span>
              </button>
            ))}
          </div>

          <button
            className="btn-secondary add-user-button"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ 가족 추가하기
          </button>
        </>
      )}

      {showCreateForm && (
        <div className="create-user-form">
          <h2>{users.length === 0 ? '첫 번째 가족을 만들어주세요!' : '새 가족 추가하기'}</h2>

          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름을 입력하세요 (예: 엄마, 수아)"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            />
          </div>

          <div className="form-group">
            <label>이모지 선택</label>
            <div className="emoji-selector">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  className={`emoji-option ${newEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setNewEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-buttons">
            <button className="btn-primary" onClick={handleCreateUser}>
              ✅ 완료
            </button>
            {users.length > 0 && (
              <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
