import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, FileText, Loader2, MessageCircle, Mic, MoreVertical, Trash2, Users, X,
} from "lucide-react";
import { useGetQuery, useLazyGetQuery, usePostMutation, useDeleteMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import { playChatSound } from "../../utils/notifySounds";
import Composer from "./Composer";
import MembersPanel from "./MembersPanel";
import {
  BRAND, BRAND_TINT, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE,
  THREAD_BG, MINE_BG, fmtTime, fmtDay, fmtDuration,
} from "./chatTheme";

const PAGE_SIZE = 50;
const POLL_MS = 5000;
const DELETE_WINDOW_MS = 15 * 60 * 1000;

/*
 * Messages thread for one group.
 * Polling: messages live in local state (they're an append-only log, not a
 * cache-replace list). A 5s interval fires a useLazyGetQuery fetch with
 * after_id = the newest id we hold and appends anything new — cheaper and
 * simpler than keying an RTK-Query subscription on an ever-changing after_id.
 * Scroll-back pulls earlier pages with before_id when the user hits the top.
 */
export default function ChatWindow({ group, user, isStaffGlobal, onBack, onRead }) {
  const uuid = group?.chat_group_uuid;
  const [messages, setMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null); // attachment_url
  const [menuFor, setMenuFor] = useState(null); // message id with open kebab

  const scrollRef = useRef(null);
  const latestIdRef = useRef(null);
  const oldestIdRef = useRef(null);
  const nearBottomRef = useRef(true);
  const lastReadSentRef = useRef(null);
  const pollBusyRef = useRef(false);

  const [fetchMessages] = useLazyGetQuery();
  const [postRead] = usePostMutation();
  const [deleteMessage] = useDeleteMutation();

  // Group detail — membership + access level for this user.
  const { data: detailData } = useGetQuery(
    { path: `communication/chat/groups/${uuid}` },
    { skip: !uuid, refetchOnMountOrArgChange: true },
  );
  const detail = detailData?.data;
  const canManage = isStaffGlobal || detail?.my_access === "staff";

  const msgPath = `communication/chat/groups/${uuid}/messages`;

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const markRead = useCallback(
    (lastId) => {
      if (!lastId || lastReadSentRef.current === lastId) return;
      lastReadSentRef.current = lastId;
      postRead({ path: `communication/chat/groups/${uuid}/read`, body: { last_read_message_id: lastId } })
        .unwrap()
        .then(() => onRead?.())
        .catch(() => { /* non-fatal */ });
    },
    [postRead, uuid, onRead],
  );

  const appendNew = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);

  /* ---------- initial load (and reset when switching groups) ---------- */
  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setMessages([]);
    setInitialLoading(true);
    setHasMore(false);
    setMembersOpen(false);
    setLightbox(null);
    setMenuFor(null);
    latestIdRef.current = null;
    oldestIdRef.current = null;
    lastReadSentRef.current = null;
    nearBottomRef.current = true;

    fetchMessages({ path: msgPath, params: { per_page: PAGE_SIZE } })
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data || [];
        setMessages(list);
        setHasMore(list.length >= PAGE_SIZE);
        setInitialLoading(false);
        requestAnimationFrame(() => scrollToBottom());
      })
      .catch((e) => {
        if (cancelled) return;
        setInitialLoading(false);
        showToast(e?.data?.message || "Could not load messages.", "error");
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  /* ---------- keep boundary refs + read receipts in sync ---------- */
  useEffect(() => {
    if (!messages.length) return;
    latestIdRef.current = messages[messages.length - 1].id;
    oldestIdRef.current = messages[0].id;
    markRead(latestIdRef.current);
  }, [messages, markRead]);

  /* ---------- 5s incremental poll with after_id ---------- */
  useEffect(() => {
    if (!uuid) return;
    const tick = async () => {
      if (pollBusyRef.current || document.hidden) return;
      pollBusyRef.current = true;
      try {
        const res = await fetchMessages({
          path: msgPath,
          params: latestIdRef.current
            ? { after_id: latestIdRef.current, per_page: PAGE_SIZE }
            : { per_page: PAGE_SIZE },
        }).unwrap();
        const list = res?.data || [];
        if (list.length) {
          const stick = nearBottomRef.current;
          appendNew(list);
          // Chime for new messages from others (never for my own sends).
          if (list.some((m) => m.sender_id !== user?.id)) playChatSound();
          if (stick) requestAnimationFrame(() => scrollToBottom());
        }
      } catch { /* transient — next tick retries */ }
      pollBusyRef.current = false;
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  /* ---------- scroll handling: track bottom + load older at top ---------- */
  const onScroll = async () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (el.scrollTop <= 4 && hasMore && !loadingOlder && oldestIdRef.current) {
      setLoadingOlder(true);
      const prevHeight = el.scrollHeight;
      try {
        const res = await fetchMessages({
          path: msgPath,
          params: { before_id: oldestIdRef.current, per_page: PAGE_SIZE },
        }).unwrap();
        const older = res?.data || [];
        setHasMore(older.length >= PAGE_SIZE);
        if (older.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...older.filter((m) => !known.has(m.id)), ...prev];
          });
          // Preserve the reading position after prepending.
          requestAnimationFrame(() => {
            const node = scrollRef.current;
            if (node) node.scrollTop = node.scrollHeight - prevHeight;
          });
        }
      } catch { /* ignore — user can scroll again */ }
      setLoadingOlder(false);
    }
  };

  /* ---------- send / delete ---------- */
  const onSent = async () => {
    // Pull whatever the server now has after our latest id, then stick to bottom.
    try {
      const res = await fetchMessages({
        path: msgPath,
        params: latestIdRef.current
          ? { after_id: latestIdRef.current, per_page: PAGE_SIZE }
          : { per_page: PAGE_SIZE },
      }).unwrap();
      appendNew(res?.data || []);
    } catch { /* poll will catch up */ }
    requestAnimationFrame(() => scrollToBottom());
  };

  const canDelete = (m) => {
    if (canManage) return true;
    if (m.sender_id !== user?.id) return false;
    return Date.now() - new Date(m.created_at).getTime() < DELETE_WINDOW_MS;
  };

  const removeMessage = async (m) => {
    setMenuFor(null);
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMessage({ path: `communication/chat/messages/${m.chat_message_uuid}` }).unwrap();
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      showToast(e?.data?.message || "Could not delete the message.", "error");
    }
  };

  /* ---------- render helpers ---------- */
  const rows = useMemo(() => {
    // Interleave day separators.
    const out = [];
    let lastDay = null;
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString();
      if (day !== lastDay) {
        out.push({ kind: "day", key: `day-${day}`, label: fmtDay(m.created_at) });
        lastDay = day;
      }
      out.push({ kind: "msg", key: m.id, msg: m });
    }
    return out;
  }, [messages]);

  const renderBody = (m, mine) => {
    switch (m.type) {
      case "image":
        return (
          <div>
            <img
              src={m.attachment_url}
              alt={m.attachment_name || "image"}
              onClick={() => setLightbox(m.attachment_url)}
              className="object-cover rounded-lg cursor-zoom-in"
              style={{ maxWidth: 240, maxHeight: 260 }}
              loading="lazy"
            />
            {m.body && <div className="mt-1 whitespace-pre-wrap break-words">{m.body}</div>}
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2">
            <span className="grid flex-shrink-0 rounded-full place-items-center" style={{ width: 28, height: 28, background: mine ? "#fff" : BRAND_TINT, color: BRAND }}>
              <Mic size={14} />
            </span>
            <audio controls src={m.attachment_url} preload="none" style={{ height: 34, maxWidth: 210 }} />
            {m.duration_seconds != null && (
              <span className="text-[10.5px] font-semibold flex-shrink-0" style={{ color: TEXT_SECONDARY }}>
                {fmtDuration(m.duration_seconds)}
              </span>
            )}
          </div>
        );
      case "file":
        return (
          <div>
            <a
              href={m.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
              style={{ background: mine ? "rgba(255,255,255,0.65)" : SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, textDecoration: "none" }}
            >
              <FileText size={16} style={{ color: BRAND }} className="flex-shrink-0" />
              <span className="text-[12.5px] font-semibold truncate" style={{ maxWidth: 200 }}>
                {m.attachment_name || "Attachment"}
              </span>
            </a>
            {m.body && <div className="mt-1 whitespace-pre-wrap break-words">{m.body}</div>}
          </div>
        );
      default:
        return <div className="whitespace-pre-wrap break-words">{m.body}</div>;
    }
  };

  if (!group) {
    return (
      <div className="flex-1 grid place-items-center text-center px-6" style={{ background: THREAD_BG, color: TEXT_MUTED }}>
        <div>
          <MessageCircle size={40} style={{ color: "#CBD5E1", margin: "0 auto 12px" }} />
          <p className="text-[13px]">Select a group to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0" style={{ background: THREAD_BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={onBack} className="p-1.5 -ml-1 rounded-lg md:hidden" style={{ color: TEXT_SECONDARY }} title="Back to groups">
          <ArrowLeft size={18} />
        </button>
        <div className="grid flex-shrink-0 place-items-center" style={{ width: 38, height: 38, borderRadius: "50%", background: BRAND_TINT, color: BRAND }}>
          <Users size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{group.name}</span>
            {group.type === "custom" && (
              <span className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase rounded flex-shrink-0" style={{ background: BRAND_TINT, color: BRAND }}>
                Custom
              </span>
            )}
          </div>
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {group.members_count != null ? `${group.members_count} member${group.members_count === 1 ? "" : "s"}` : group.type === "batch" ? "Batch group" : "Group"}
          </div>
        </div>
        <button
          onClick={() => setMembersOpen(true)}
          title="View members"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg flex-shrink-0"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
        >
          <Users size={14} /> <span className="hidden sm:inline">Members</span>
        </button>
      </div>

      {/* Thread */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 px-5 py-4 space-y-2 overflow-y-auto">
        {loadingOlder && (
          <div className="flex justify-center py-1">
            <Loader2 size={15} className="animate-spin" style={{ color: TEXT_MUTED }} />
          </div>
        )}
        {initialLoading ? (
          <div className="flex items-center justify-center py-16" style={{ color: TEXT_MUTED }}>
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>
            No messages yet — say hello!
          </div>
        ) : (
          rows.map((row) => {
            if (row.kind === "day") {
              return (
                <div key={row.key} className="flex justify-center py-1">
                  <span className="px-3 py-1 text-[10.5px] font-semibold rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: TEXT_SECONDARY, boxShadow: "0 1px 1px rgba(0,0,0,0.06)" }}>
                    {row.label}
                  </span>
                </div>
              );
            }
            const m = row.msg;
            const mine = m.sender_id === user?.id;
            return (
              <div key={row.key} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`group relative max-w-[78%] md:max-w-[65%] flex items-start gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                  <div
                    className="px-3 py-2 rounded-lg text-[13px]"
                    style={{
                      background: mine ? MINE_BG : "#fff",
                      color: TEXT_PRIMARY,
                      boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                    }}
                  >
                    {!mine && (
                      <div className="text-[11px] font-bold mb-0.5" style={{ color: BRAND }}>
                        {m.sender_name}
                      </div>
                    )}
                    {renderBody(m, mine)}
                    <div className="text-[10px] mt-1 text-right" style={{ color: TEXT_MUTED }}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>

                  {/* Kebab — delete own recent message (staff: any) */}
                  {canDelete(m) && (
                    <div className="relative self-center flex-shrink-0">
                      <button
                        onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                        className="p-1 transition-opacity rounded-full opacity-0 group-hover:opacity-100"
                        style={{ color: TEXT_MUTED }}
                        title="Message options"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {menuFor === m.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                          <div
                            className={`absolute z-20 py-1 bg-white rounded-xl top-6 ${mine ? "right-0" : "left-0"}`}
                            style={{ border: `1px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", minWidth: 120 }}
                          >
                            <button
                              onClick={() => removeMessage(m)}
                              className="flex items-center w-full gap-2 px-3 py-2 text-[12px] font-medium hover:bg-[#FEF2F2]"
                              style={{ color: BRAND }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <Composer groupUuid={uuid} onSent={onSent} />

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          style={{ background: "rgba(15,23,42,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <button className="absolute p-2 rounded-full top-4 right-4" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} title="Close">
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt="attachment"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Members slide-over */}
      {membersOpen && (
        <MembersPanel
          groupUuid={uuid}
          groupName={group.name}
          canManage={canManage}
          onClose={() => setMembersOpen(false)}
        />
      )}
    </div>
  );
}
