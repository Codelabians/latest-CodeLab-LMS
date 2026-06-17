// Firebase Cloud Messaging (web push) bootstrap.
//
// All values come from Vite env vars (see .env / .env.example). If the
// config is incomplete (e.g. Firebase not set up yet) every export here
// becomes a safe no-op so the app keeps working with in-portal
// notifications only — no console errors, no crashes.
//
// Get these values from the Firebase console:
//   Project settings → General → Your apps → SDK setup and configuration
//   Project settings → Cloud Messaging → Web Push certificates (VAPID key)
// Full walkthrough: FIREBASE_SETUP.md at the backend project root.

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env?.VITE_FIREBASE_VAPID_KEY;

// Push is considered "configured" only when the essential keys exist.
export const isPushConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    VAPID_KEY,
);

let app = null;
let messagingPromise = null;

function getMessagingInstance() {
  if (!isPushConfigured) return Promise.resolve(null);
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) return null;
      if (!app) app = initializeApp(firebaseConfig);
      return getMessaging(app);
    } catch (e) {
      console.warn("FCM init failed:", e?.message || e);
      return null;
    }
  })();

  return messagingPromise;
}

/**
 * Register the service worker, ask for notification permission, and return
 * the device FCM token (or null if push is unavailable / denied).
 */
export async function requestFcmToken() {
  if (!isPushConfigured) return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return null;
  }

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (e) {
    console.warn("requestFcmToken failed:", e?.message || e);
    return null;
  }
}

/**
 * Subscribe to foreground messages (when the tab is open). `cb` receives
 * the FCM payload. Returns an unsubscribe function (or no-op).
 */
export async function onForegroundMessage(cb) {
  if (!isPushConfigured) return () => {};
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return () => {};
    return onMessage(messaging, cb);
  } catch {
    return () => {};
  }
}
