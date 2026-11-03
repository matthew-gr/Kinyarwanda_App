// Web push for the service worker (loaded by Workbox's importScripts): shows a reminder and
// opens the app at its page when tapped. Sent by the send-reminders server function.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kinyarwanda', {
      body: data.body || 'Your reviews are ready.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'reminder',
      data: { url: data.url || '/review' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) return open.focus().then((w) => w.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
