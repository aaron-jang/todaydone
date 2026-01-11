// Custom Service Worker for notification click handling
import { precacheAndRoute } from 'workbox-precaching';

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('/todaydone/') && 'focus' in client) {
          // Send message to navigate to home
          client.postMessage({ type: 'NOTIFICATION_CLICK', route: '/' });
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/todaydone/');
      }
    })
  );
});
