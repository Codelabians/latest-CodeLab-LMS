import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  requestFcmToken,
  onForegroundMessage,
  isPushConfigured,
} from "./firebaseConfig";
import { usePostMutation } from "../api/apiSlice";

/**
 * Registers this browser for Firebase push once the user is authenticated:
 *   1. asks for notification permission + gets an FCM token
 *   2. POSTs the token to the backend (notification_devices)
 *   3. shows foreground pushes as a toast (since the OS won't while the
 *      tab is focused)
 *
 * Safe no-op when Firebase isn't configured yet. Mount once, high in the
 * dashboard tree (DashboardLayout).
 */
export default function useFcmRegistration() {
  const token = useSelector((s) => s.auth?.token);
  const [registerDevice] = usePostMutation();
  const didRegister = useRef(false);

  useEffect(() => {
    if (!token || !isPushConfigured || didRegister.current) return;
    didRegister.current = true;

    let unsub = () => {};

    (async () => {
      const fcmToken = await requestFcmToken();
      if (!fcmToken) return;

      try {
        await registerDevice({
          path: "communication/notifications/devices",
          body: {
            token: fcmToken,
            platform: "web",
            user_agent: navigator.userAgent?.slice(0, 512),
          },
        });
      } catch {
        /* best effort */
      }

      unsub = await onForegroundMessage((payload) => {
        const d = payload?.data || {};
        const title = d.title || payload?.notification?.title || "Notification";
        const body = d.message || d.body || payload?.notification?.body || "";
        toast.info(`${title}${body ? " — " + body : ""}`);
      });
    })();

    return () => {
      try {
        unsub && unsub();
      } catch {
        /* ignore */
      }
    };
  }, [token, registerDevice]);
}
