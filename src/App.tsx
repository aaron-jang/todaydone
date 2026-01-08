import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Today from './pages/Today';
import Routines from './pages/Routines';
import History from './pages/History';
import Settings from './pages/Settings';
import {
  getNotificationSettings,
  shouldShowNotification,
  showNotification,
  getNotificationMessage,
  markNotificationShown,
  scheduleNotificationCheck,
  requestNotificationPermission,
  saveNotificationSettings,
} from './lib/notifications';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize dark mode on app load
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      if (saved === 'true') {
        document.documentElement.classList.add('dark-mode');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    }

    // Initialize notification scheduler
    const initializeNotifications = async () => {
      const settings = getNotificationSettings();

      // If notifications are not configured yet, request permission and enable by default
      if (!settings.enabled && Notification.permission === 'default') {
        const granted = await requestNotificationPermission();
        if (granted) {
          const newSettings = {
            enabled: true,
            time: '08:00',
            lastNotified: null,
          };
          saveNotificationSettings(newSettings);
        }
      }
    };

    const checkNotification = () => {
      const settings = getNotificationSettings();
      if (shouldShowNotification(settings)) {
        const message = getNotificationMessage();
        showNotification(message.title, message.body);
        markNotificationShown();
      }
    };

    // Initialize notifications on first load
    initializeNotifications();

    // Check immediately on load
    checkNotification();

    // Schedule periodic checks (every minute)
    const intervalId = scheduleNotificationCheck(checkNotification);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="app">
      <nav className="nav">
        <Link to="/">✨ 오늘</Link>
        <Link to="/routines">📝 루틴</Link>
        <Link to="/history">📊 기록</Link>
        <Link to="/settings">⚙️ 설정</Link>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}

export default AppWrapper;
