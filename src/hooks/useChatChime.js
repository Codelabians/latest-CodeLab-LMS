import { useEffect, useRef } from "react";
import { useGetQuery } from "../api/apiSlice";
import { armNotifySounds, playChatSound } from "../utils/notifySounds";

/**
 * Lightweight chat-chime hook for the student/staff portal layouts (which
 * don't have the admin Navbar's notification poll). Polls the unread-count
 * endpoint and plays the chat chime when chat_unread grows between samples.
 * Returns the current chat_unread so callers can badge their Chats nav item.
 */
export default function useChatChime({ skip = false } = {}) {
  const { data } = useGetQuery(
    { path: "communication/notifications/unread-count" },
    { pollingInterval: 20000, refetchOnMountOrArgChange: true, skip },
  );
  const chatUnread = data?.data?.chat_unread || 0;

  // Sounds unlock on the user's first click/keypress.
  useEffect(() => { armNotifySounds(); }, []);

  const prevRef = useRef(null);
  useEffect(() => {
    if (!data) return;
    const prev = prevRef.current;
    // Skip the first sample — chiming for already-unread messages on load is noise.
    if (prev !== null && chatUnread > prev) playChatSound();
    prevRef.current = chatUnread;
  }, [data, chatUnread]);

  return chatUnread;
}
