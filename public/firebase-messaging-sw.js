/* Firebase Cloud Messaging service worker — handles PUSH notifications
 * while the admin panel tab is in the background or closed.
 *
 * IMPORTANT: service workers cannot read Vite env vars, so the web app
 * config below must be filled in by hand. These are the SAME public
 * values you put in the frontend .env (VITE_FIREBASE_*). They are not
 * secrets (the Firebase web config is safe to ship to the browser).
 *
 * Copy them from: Firebase console → Project settings → General →
 * Your apps → SDK setup and configuration.
 * See FIREBASE_SETUP.md for the full walkthrough.
 */

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCSeKwuuU5wyQboBHYJP273Vy-seKlHBmY",
  authDomain: "codelab-1ff1b.firebaseapp.com",
  projectId: "codelab-1ff1b",
  storageBucket: "codelab-1ff1b.firebasestorage.app",
  messagingSenderId: "314118424615",
  appId: "1:314118424615:web:21d89094a45b99e17be602",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || "Codelab LMS";
  const body =
    data.message || data.body || payload.notification?.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      action_url: data.action_url || "/dashboard/notifications",
      category: data.category || "",
      event_type: data.event_type || "",
    },
    tag: data.event_type || undefined,
  });
});

// Focus/open the panel and deep-link when the user clicks the push.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.action_url || "/dashboard/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
