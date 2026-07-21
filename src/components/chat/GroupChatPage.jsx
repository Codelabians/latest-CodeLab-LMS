import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FileText, Image as ImageIcon, Loader2, MessagesSquare, Mic, Plus, RefreshCw, Search, Users,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import ChatWindow from "./ChatWindow";
import CreateGroupModal from "./CreateGroupModal";
import {
  BRAND, BRAND_TINT, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE,
  fmtListTime, userIsChatStaff,
} from "./chatTheme";

/* Compact preview line for the last message in a group. */
function LastMessagePreview({ lm }) {
  if (!lm) return <span style={{ color: TEXT_MUTED }}>No messages yet</span>;
  const label = lm.body || "";
  const icon =
    label === "Photo" || label === "📷 Photo" ? <ImageIcon size={12} className="inline -mt-0.5" />
    : label === "Voice note" || label === "🎤 Voice note" ? <Mic size={12} className="inline -mt-0.5" />
    : label === "File" || label === "📎 File" ? <FileText size={12} className="inline -mt-0.5" />
    : null;
  return (
    <>
      {lm.sender_name ? `${lm.sender_name}: ` : ""}
      {icon} {label}
    </>
  );
}

/*
 * Shared group-chat page — mounted on the admin dashboard, the student
 * portal, and the staff portal. Two-pane WhatsApp-style layout; on mobile
 * the list and the thread swap in and out (like WhatsAppInbox).
 */
export default function GroupChatPage() {
  const user = useSelector(selectCurrentUser);
  const isStaffGlobal = userIsChatStaff(user);

  const [search, setSearch] = useState("");
  const [activeUuid, setActiveUuid] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Group list — poll every 15s so unread counts + previews stay fresh.
  const { data, isLoading, refetch } = useGetQuery(
    { path: "communication/chat/groups" },
    { refetchOnMountOrArgChange: true, pollingInterval: 15000 },
  );
  const groups = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => (g.name || "").toLowerCase().includes(q));
  }, [groups, search]);

  const activeGroup = groups.find((g) => g.chat_group_uuid === activeUuid) || null;

  return (
    <div
      className="w-full px-3 md:px-6 py-4 md:py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}>
            <MessagesSquare size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Group Chats</h1>
            <p className="text-[12px] mt-0.5 hidden sm:block" style={{ color: TEXT_MUTED }}>
              Batch groups and custom groups · text, photos, voice notes & files
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStaffGlobal && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-white rounded-lg"
              style={{ background: BRAND }}
            >
              <Plus size={14} /> New group
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg"
            style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
          >
            <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Two-pane shell */}
      <div
        className="flex overflow-hidden bg-white rounded-2xl"
        style={{ border: `1px solid ${BORDER}`, height: "calc(100vh - 11rem)" }}
      >
        {/* ---- groups list (hidden on mobile while a chat is open) ---- */}
        <div
          className={`${activeGroup ? "hidden md:flex" : "flex"} flex-col w-full md:w-[320px] flex-shrink-0`}
          style={{ borderRight: `1px solid ${BORDER}` }}
        >
          <div className="p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: SURFACE }}>
              <Search size={15} style={{ color: TEXT_MUTED }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups"
                className="flex-1 bg-transparent outline-none text-sm min-w-0"
                style={{ color: TEXT_PRIMARY }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10" style={{ color: TEXT_MUTED }}>
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessagesSquare size={34} style={{ color: "#CBD5E1", margin: "0 auto 10px" }} />
                <p className="text-[12.5px] font-semibold" style={{ color: TEXT_SECONDARY }}>
                  {search ? "No groups match your search." : "No group chats yet"}
                </p>
                {!search && (
                  <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                    {isStaffGlobal
                      ? "Batch groups appear automatically. Use “New group” to start a custom one."
                      : "Your class group will appear here once it's set up."}
                  </p>
                )}
              </div>
            ) : (
              filtered.map((g) => {
                const isActive = g.chat_group_uuid === activeUuid;
                return (
                  <button
                    key={g.chat_group_uuid}
                    onClick={() => setActiveUuid(g.chat_group_uuid)}
                    className="flex items-start w-full gap-3 px-3 py-3 text-left"
                    style={{ borderBottom: `1px solid ${BORDER}`, background: isActive ? BRAND_TINT : "#fff" }}
                  >
                    <div className="grid flex-shrink-0 place-items-center" style={{ width: 38, height: 38, borderRadius: "50%", background: BRAND_TINT, color: BRAND }}>
                      <Users size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{g.name}</span>
                          {g.type === "custom" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded flex-shrink-0" style={{ background: "#F1F5F9", color: TEXT_SECONDARY }}>
                              Custom
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: TEXT_MUTED }}>
                          {fmtListTime(g.last_message?.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[11px] truncate" style={{ color: TEXT_SECONDARY }}>
                          <LastMessagePreview lm={g.last_message} />
                        </span>
                        {g.unread_count > 0 && (
                          <span
                            className="grid place-items-center flex-shrink-0 text-[10px] font-bold text-white"
                            style={{ background: BRAND, borderRadius: "50%", minWidth: 18, height: 18, padding: "0 5px" }}
                          >
                            {g.unread_count}
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

        {/* ---- thread pane (hidden on mobile until a chat is open) ---- */}
        <div className={`${activeGroup ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
          <ChatWindow
            group={activeGroup}
            user={user}
            isStaffGlobal={isStaffGlobal}
            onBack={() => setActiveUuid(null)}
            onRead={() => setTimeout(() => refetch(), 500)}
          />
        </div>
      </div>

      {createOpen && (
        <CreateGroupModal
          onClose={() => setCreateOpen(false)}
          onCreated={(g) => {
            setCreateOpen(false);
            refetch();
            if (g?.chat_group_uuid) setActiveUuid(g.chat_group_uuid);
          }}
        />
      )}
    </div>
  );
}
