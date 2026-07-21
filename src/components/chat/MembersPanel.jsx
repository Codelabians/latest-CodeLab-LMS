import { useState } from "react";
import {
  ChevronDown, ChevronRight, History, Loader2, Trash2, UserPlus, Users, X,
} from "lucide-react";
import { useGetQuery, usePostMutation, useDeleteMutation, usePatchMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import MemberPicker from "./MemberPicker";
import {
  BRAND, BRAND_TINT, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE,
} from "./chatTheme";

const fmtJoined = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const roleChipStyle = (role) => {
  const r = (role || "").toLowerCase();
  if (r === "teacher") return { background: "#EFF6FF", color: "#1D4ED8" };
  if (r === "student") return { background: "#F0FDF4", color: "#15803D" };
  if (r === "admin") return { background: BRAND_TINT, color: BRAND };
  return { background: SURFACE, color: TEXT_SECONDARY };
};

/* Small on/off switch for the per-member "Show full history" flag. */
function Toggle({ on, busy, onChange }) {
  return (
    <button
      onClick={onChange}
      disabled={busy}
      title={on ? "Full history visible — click to hide older messages" : "Only messages since joining — click to show full history"}
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 34, height: 19, background: on ? BRAND : "#CBD5E1", opacity: busy ? 0.6 : 1 }}
    >
      <span
        className="absolute top-[2px] rounded-full bg-white transition-all"
        style={{ width: 15, height: 15, left: on ? 17 : 2, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      />
    </button>
  );
}

/* "Add members" modal — Staff/Students tabs with debounced search. */
function AddMembersModal({ groupUuid, existingUserIds, onClose, onAdded }) {
  const [selected, setSelected] = useState({});
  const [post, { isLoading: saving }] = usePostMutation();

  const toggle = (r) =>
    setSelected((p) => {
      const next = { ...p };
      if (next[r.id]) delete next[r.id];
      else next[r.id] = r;
      return next;
    });

  const submit = async () => {
    const userIds = Object.keys(selected).map(Number);
    if (!userIds.length) { showToast("Select at least one person to add.", "info"); return; }
    try {
      const res = await post({
        path: `communication/chat/groups/${groupUuid}/members`,
        body: { user_ids: userIds },
      }).unwrap();
      showToast(res?.message || "Members added.", "success");
      onAdded();
    } catch (e) {
      showToast(e?.data?.message || "Could not add members.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div
        className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] flex flex-col"
        style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_TINT, color: BRAND }}>
              <UserPlus size={17} />
            </span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Add members</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 pr-1 overflow-y-auto">
          <MemberPicker selected={selected} onToggle={toggle} excludeIds={existingUserIds} />
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
            style={{ background: BRAND }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Adding…" : "Add members"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * Slide-over members panel. Staff (my_access==='staff' / manage group-chats)
 * additionally get add/remove controls, the per-member "Show full history"
 * toggle, and a collapsed former-members list.
 */
export default function MembersPanel({ groupUuid, groupName, canManage, onClose }) {
  const [addOpen, setAddOpen] = useState(false);
  const [formerOpen, setFormerOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);

  const { data, isLoading, refetch } = useGetQuery(
    { path: `communication/chat/groups/${groupUuid}/members` },
    { refetchOnMountOrArgChange: true },
  );
  const members = data?.data?.members || [];
  const formerMembers = data?.data?.former_members || [];

  const [del] = useDeleteMutation();
  const [patch] = usePatchMutation();

  const removeMember = async (m) => {
    if (!window.confirm(`Remove ${m.name} from this group?`)) return;
    setBusyUserId(m.user_id);
    try {
      await del({ path: `communication/chat/groups/${groupUuid}/members/${m.user_id}` }).unwrap();
      showToast(`${m.name} removed from the group.`, "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not remove the member.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const toggleHistory = async (m) => {
    setBusyUserId(m.user_id);
    try {
      await patch({
        path: `communication/chat/groups/${groupUuid}/members/${m.user_id}`,
        body: { show_full_history: !m.show_full_history },
      }).unwrap();
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not update the history setting.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(15,23,42,0.35)" }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-sm bg-white shadow-2xl"
        style={{ borderLeft: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="grid rounded-lg place-items-center" style={{ width: 34, height: 34, background: BRAND_TINT, color: BRAND }}>
            <Users size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>Members</div>
            <div className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>{groupName}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {canManage && (
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-white rounded-lg"
              style={{ background: BRAND }}
            >
              <UserPlus size={14} /> Add members
            </button>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
              "Show full history" lets a member read messages sent before they joined. Off by default.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10" style={{ color: TEXT_MUTED }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <>
              {members.length === 0 && (
                <div className="px-4 py-8 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No members yet.</div>
              )}
              {members.map((m) => (
                <div key={m.id ?? m.user_id} className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span
                    className="grid flex-shrink-0 font-bold text-white rounded-full place-items-center"
                    style={{ width: 32, height: 32, background: BRAND, fontSize: 12 }}
                  >
                    {(m.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{m.name}</span>
                      {m.member_role && (
                        <span className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase rounded" style={roleChipStyle(m.member_role)}>
                          {m.member_role}
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px]" style={{ color: TEXT_MUTED }}>Joined {fmtJoined(m.joined_at)}</div>
                  </div>
                  {canManage && (
                    <div className="flex items-center flex-shrink-0 gap-2">
                      <span title="Show full history">
                        <History size={13} style={{ color: m.show_full_history ? BRAND : TEXT_MUTED }} />
                      </span>
                      <Toggle
                        on={!!m.show_full_history}
                        busy={busyUserId === m.user_id}
                        onChange={() => toggleHistory(m)}
                      />
                      <button
                        onClick={() => removeMember(m)}
                        disabled={busyUserId === m.user_id}
                        title="Remove from group"
                        className="p-1.5 rounded-lg hover:bg-[#FEF2F2]"
                        style={{ color: BRAND }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Former members (staff only — server includes them only for staff) */}
              {canManage && formerMembers.length > 0 && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => setFormerOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {formerOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Former members ({formerMembers.length})
                  </button>
                  {formerOpen && (
                    <div className="mt-2 rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                      {formerMembers.map((m) => (
                        <div key={`former-${m.id ?? m.user_id}`} className="flex items-center gap-2.5 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <span
                            className="grid flex-shrink-0 font-bold rounded-full place-items-center"
                            style={{ width: 26, height: 26, background: SURFACE, color: TEXT_MUTED, fontSize: 11 }}
                          >
                            {(m.name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[12px] font-medium truncate" style={{ color: TEXT_SECONDARY }}>{m.name}</span>
                            {m.member_role && <span className="block text-[10px] capitalize" style={{ color: TEXT_MUTED }}>{m.member_role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {addOpen && (
        <AddMembersModal
          groupUuid={groupUuid}
          existingUserIds={members.map((m) => m.user_id)}
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); refetch(); }}
        />
      )}
    </>
  );
}
