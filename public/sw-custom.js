// Custom Service Worker code — notification scheduling for rest timer.
// Imported via importScripts() in the generated Workbox SW.

const _notifTimers = {};

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SCHEDULE_NOTIFICATION") {
    const { tag, title, body, timestamp } = data;
    if (_notifTimers[tag]) clearTimeout(_notifTimers[tag]);
    const delay = Math.max(0, timestamp - Date.now());
    _notifTimers[tag] = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });
      delete _notifTimers[tag];
    }, delay);
  }

  if (data.type === "CANCEL_NOTIFICATION") {
    const { tag } = data;
    if (_notifTimers[tag]) {
      clearTimeout(_notifTimers[tag]);
      delete _notifTimers[tag];
    }
    // Also dismiss any visible notification with this tag
    self.registration.getNotifications({ tag }).then((notifs) =>
      notifs.forEach((n) => n.close())
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const alive = clients.find((c) => "focus" in c);
        if (alive) return alive.focus();
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })
  );
});
