/* Real browser notifications (Notification API).
   Push (VAPID) delivery is enabled in the backend phase via /sw.js. */

export function browserNotify(title, body) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' });
    }
  } catch (e) {}
}

export function requestBrowserPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('unsupported');
  }
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
  return Notification.requestPermission();
}

export function notificationStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
