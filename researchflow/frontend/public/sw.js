/* ResearchFlow service worker.
   Currently: install/claim + push delivery.
   VAPID push (background notifications) is enabled in the backend phase. */
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'ResearchFlow', {
      body: data.body || 'You have a new research notification.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow('/app/notifications'));
});
