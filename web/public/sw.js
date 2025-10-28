/* Service Worker for handling push notifications */

self.addEventListener("push", function (event) {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // ignore
  }

  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.ico",
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
