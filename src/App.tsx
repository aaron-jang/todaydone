import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { initializeSeo } from './lib/seo';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Initialize SEO tags based on language
    initializeSeo();

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

    // Listen for messages from Service Worker (notification click)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        // Navigate to the specified route
        navigate(event.data.route || '/');
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    const cleanup = () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };

    // Initialize notification scheduler
    const initializeNotifications = async () => {
      try {
        // Check if Notification API is supported
        if (typeof Notification === 'undefined') {
          console.log('Notifications not supported in this browser');
          return;
        }

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
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    const checkNotification = async () => {
      try {
        if (typeof Notification === 'undefined') {
          return;
        }

        const settings = getNotificationSettings();
        if (shouldShowNotification(settings)) {
          const message = getNotificationMessage();
          await showNotification(message.title, message.body);
          markNotificationShown();
        }
      } catch (error) {
        console.error('Failed to check notification:', error);
      }
    };

    // Initialize notifications on first load
    initializeNotifications().catch((error) => {
      console.error('Notification initialization error:', error);
    });

    // Schedule periodic checks (every minute)
    // Don't check immediately on load - only at scheduled time
    const intervalId = scheduleNotificationCheck(checkNotification);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      cleanup();
    };
  }, [navigate]);

  return (
    <div className="app">
      <nav className="nav">
        <Link to="/">✨ {t('nav.today')}</Link>
        <Link to="/routines">📝 {t('nav.routines')}</Link>
        <Link to="/history">📊 {t('nav.history')}</Link>
        <Link to="/settings">⚙️ {t('nav.settings')}</Link>
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
