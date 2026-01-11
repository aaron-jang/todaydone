// Notification utility for daily reminders

export interface NotificationSettings {
  enabled: boolean;
  time: string; // "08:00" format
  lastNotified: string | null; // ISO date string
}

const NOTIFICATION_STORAGE_KEY = 'dailyNotificationSettings';
const DEFAULT_TIME = '08:00';

export function getNotificationSettings(): NotificationSettings {
  const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback to defaults
    }
  }

  return {
    enabled: false,
    time: DEFAULT_TIME,
    lastNotified: null,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function showNotification(title: string, body: string, icon?: string): Promise<void> {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    // Try to use Service Worker notification if available (for mobile/PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: icon || '/todaydone/icon-192x192.png',
          badge: '/todaydone/icon-192x192.png',
          tag: 'daily-reminder',
          requireInteraction: false,
        });
        return;
      }
    }

    // Fallback to regular notification for desktop
    const notification = new Notification(title, {
      body,
      icon: icon || '/todaydone/icon-192x192.png',
      badge: '/todaydone/icon-192x192.png',
      tag: 'daily-reminder',
      requireInteraction: false,
    });

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    notification.onclick = () => {
      window.focus();
      // Navigate to home page
      window.location.hash = '/';
      notification.close();
    };
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

export function shouldShowNotification(settings: NotificationSettings): boolean {
  if (!settings.enabled) return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if already notified today
  if (settings.lastNotified === today) {
    return false;
  }

  // Check if current time is past notification time
  const [targetHour, targetMinute] = settings.time.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Show notification if we're past the target time
  if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
    return true;
  }

  return false;
}

export function scheduleNotificationCheck(callback: () => void): number {
  // Check every minute
  return window.setInterval(callback, 60 * 1000);
}

export function getNotificationMessage(): { title: string; body: string } {
  const messages = [
    {
      title: '🌅 좋은 아침이에요!',
      body: '오늘의 루틴을 시작해볼까요? 화이팅!',
    },
    {
      title: '✨ 새로운 하루가 시작됐어요!',
      body: '오늘도 루틴을 완성해봐요!',
    },
    {
      title: '🎯 오늘의 목표를 확인하세요!',
      body: '루틴 체크로 하루를 시작해보세요!',
    },
    {
      title: '💪 화이팅! 오늘도 할 수 있어요!',
      body: '오늘의 루틴을 확인하러 가볼까요?',
    },
  ];

  // Random message
  return messages[Math.floor(Math.random() * messages.length)];
}

export function markNotificationShown(): void {
  const settings = getNotificationSettings();
  const today = new Date().toISOString().split('T')[0];
  settings.lastNotified = today;
  saveNotificationSettings(settings);
}
