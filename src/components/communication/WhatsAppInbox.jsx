import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  MessageCircle, Search, Send, Loader2, Phone, Bot, User, RefreshCw, Paperclip, Sparkles,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

/* ---- tokens (match the rest of the admin) ---- */
const BRAND = "#C90606";
const WA = "#25D366";
const WA_DARK = "#075E54";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "2-digit", month: "short" }) +
        " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const prettyPhone = (p) => (p ? (p.startsWith("+") ? p : "+" + p) : "");

export default function WhatsAppInbox() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null); // contact_phone
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const authToken = useSelector((s) => s.auth?.token);

  // Conversation list — poll every 15s so new inbound messages surface.
  const { data: convData, isLoading: convLoading, refetch: refetchConvs } =
    useGetQuery(
      { path: "communication/whatsapp/inbox/conversations" },
      { refetchOnMountOrArgChange: true, pollingInterval: 15000 }
    );
  const conversations = useMemo(() => convData?.data || [], [convData]);

  // Active thread — re-fetches whenever `active` changes; polls every 10s.
  const { data: threadData, isFetching: threadFetching, refetch: refetchThread } =
    useGetQuery(
      { path: `communication/whatsapp/inbox/${active}` },
      { skip: !active, refetchOnMountOrArgChange: true, pollingInterval: 10000 }
    );
  const messages = useMemo(() => threadData?.data || [], [threadData]);

  const [post, { isLoading: sending }] = usePostMutation();
  const [aiPost, { isLoading: aiLoading }] = usePostMutation();

  // Ask the AI for a suggested reply (draft only — fills the box, never sends).
  const suggestReply = async () => {
    if (!active) return;
    try {
      const res = await aiPost({ path: `communication/whatsapp/inbox/${active}/ai-draft`, body: {} }).unwrap();
      if (res?.data?.draft) setDraft(res.data.draft);
      else showToast(res?.message || "No suggestion available", "info");
    } catch (e) {
      showToast(e?.data?.message || "AI suggestion unavailable (check it's enabled in Settings).", "info");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.contact_name || "").toLowerCase().includes(q) ||
        (c.contact_phone || "").includes(q.replace(/\D+/g, ""))
    );
  }, [conversations, search]);

  const activeConv = conversations.find((c) => c.contact_phone === active);

  // Auto-scroll the thread to the bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, active]);

  const openThread = (phone) => {
    setActive(phone);
    setDraft("");
    // Reading the thread server-side clears unread; refresh the list shortly after.
    setTimeout(() => refetchConvs(), 600);
  };

  const sendReply = async () => {
    const body = draft.trim();
    if (!body || !active) return;
    try {
      const res = await post({
        path: `communication/whatsapp/inbox/${active}/reply`,
        body: { body },
      }).unwrap();
      setDraft("");
      refetchThread();
      refetchConvs();
      if (res?.success === false) {
        showToast(res?.message || "Logged, but not delivered.", "info");
      }
    } catch (e) {
      // 202 (logged-not-delivered) lands here via RTK; still refresh + inform.
      refetchThread();
      refetchConvs();
      showToast(
        e?.data?.message ||
          "Message logged but could not be delivered (24h window may have closed).",
        "info"
      );
      setDraft("");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  // Attach + send a document/PDF (multipart upload — uses the live token).
  const onPickFile = () => fileRef.current?.click();
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !active) return;
    setUploading(true);
    try {
      const baseUrl = (import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/").replace(/\/+$/, "");
      const token = authToken || localStorage.getItem("token");
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${baseUrl}/communication/whatsapp/inbox/${active}/document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok && r.status !== 202) throw new Error(j?.message || `Upload failed (HTTP ${r.status}).`);
      showToast(j?.success === false ? (j?.message || "Logged, not delivered.") : "Document sent", j?.success === false ? "info" : "success");
      refetchThread();
      refetchConvs();
    } catch (err) {
      showToast(err?.message || "Could not send the document", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#E7F9EF", color: WA_DARK }}>
            <MessageCircle size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>WhatsApp Inbox</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Incoming WhatsApp messages · auto-reply + manual replies
            </p>
          </div>
        </div>
        <button
          onClick={() => { refetchConvs(); if (active) refetchThread(); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div
        className="flex bg-white rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${BORDER}`, height: "calc(100vh - 11rem)" }}
      >
        {/* ---- conversation list ---- */}
        <div className="flex flex-col" style={{ width: 320, borderRight: `1px solid ${BORDER}` }}>
          <div className="p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
              <Search size={15} style={{ color: TEXT_MUTED }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or number"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: TEXT_PRIMARY }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="flex items-center justify-center py-10" style={{ color: TEXT_MUTED }}>
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>
                No conversations yet. They appear here when someone messages your WhatsApp number.
              </div>
            ) : (
              filtered.map((c) => {
                const isActive = c.contact_phone === active;
                return (
                  <button
                    key={c.contact_phone}
                    onClick={() => openThread(c.contact_phone)}
                    className="w-full text-left px-3 py-3 flex items-start gap-3"
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      background: isActive ? "#F0FDF4" : "#fff",
                    }}
                  >
                    <div className="grid place-items-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: "50%", background: "#E7F9EF", color: WA_DARK }}>
                      <User size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
                          {c.contact_name || prettyPhone(c.contact_phone)}
                        </span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: TEXT_MUTED }}>{fmtTime(c.last_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] truncate" style={{ color: TEXT_SECONDARY }}>
                          {c.last_direction === "outbound" ? "You: " : ""}{c.last_message}
                        </span>
                        {c.unread > 0 && (
                          <span className="text-[10px] font-bold text-white grid place-items-center flex-shrink-0" style={{ background: WA, borderRadius: "50%", minWidth: 18, height: 18, padding: "0 5px" }}>
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---- thread ---- */}
        <div className="flex-1 flex flex-col" style={{ background: "#EFEAE2" }}>
          {!active ? (
            <div className="flex-1 grid place-items-center text-center px-6" style={{ color: TEXT_MUTED }}>
              <div>
                <MessageCircle size={40} style={{ color: "#CBD5E1", margin: "0 auto 12px" }} />
                <p className="text-[13px]">Select a conversation to read and reply.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="grid place-items-center" style={{ width: 38, height: 38, borderRadius: "50%", background: "#E7F9EF", color: WA_DARK }}>
                  <User size={17} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                    {activeConv?.contact_name || prettyPhone(active)}
                  </div>
                  <div className="text-[11px] flex items-center gap-1" style={{ color: TEXT_MUTED }}>
                    <Phone size={11} /> {prettyPhone(active)}
                  </div>
                </div>
                {threadFetching && <Loader2 size={14} className="animate-spin ml-auto" style={{ color: TEXT_MUTED }} />}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {messages.map((m) => {
                  const out = m.direction === "outbound";
                  return (
                    <div key={m.uuid} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[72%] px-3 py-2 rounded-lg text-[13px]"
                        style={{
                          background: out ? "#DCF8C6" : "#fff",
                          color: TEXT_PRIMARY,
                          boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                        }}
                      >
                        {m.is_auto_reply && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold mb-1" style={{ color: WA_DARK }}>
                            <Bot size={11} /> Auto-reply
                          </span>
                        )}
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className="text-[10px] mt-1 text-right flex items-center justify-end gap-1" style={{ color: TEXT_MUTED }}>
                          {fmtTime(m.created_at)}
                          {out && m.status === "failed" && <span style={{ color: BRAND }}>· not delivered</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && !threadFetching && (
                  <div className="text-center text-[12px] py-8" style={{ color: TEXT_MUTED }}>No messages.</div>
                )}
              </div>

              <div className="flex items-end gap-2 px-3 py-3 bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  onClick={onPickFile}
                  disabled={uploading}
                  title="Attach a document / PDF"
                  className="grid place-items-center rounded-lg flex-shrink-0"
                  style={{ width: 40, height: 40, background: SURFACE, border: `1px solid ${BORDER}`, color: WA_DARK, opacity: uploading ? 0.6 : 1 }}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <button
                  onClick={suggestReply}
                  disabled={aiLoading}
                  title="Suggest a reply with AI (draft only)"
                  className="grid place-items-center rounded-lg flex-shrink-0"
                  style={{ width: 40, height: 40, background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#6D28D9", opacity: aiLoading ? 0.6 : 1 }}
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Type a reply…  (Enter to send, Shift+Enter for new line)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg outline-none resize-none"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, maxHeight: 120 }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !draft.trim()}
                  className="grid place-items-center text-white rounded-lg flex-shrink-0"
                  style={{ width: 40, height: 40, background: WA, opacity: sending || !draft.trim() ? 0.6 : 1 }}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
