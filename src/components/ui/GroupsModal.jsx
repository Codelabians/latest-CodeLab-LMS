import { useState } from "react";
import { X, Loader2, Users, ChevronRight, ArrowLeft, UserCircle } from "lucide-react";
import { useGetQuery, useLazyGetQuery } from "../../api/apiSlice";

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const VIOLET = "#7C3AED";

const typeBadge = (t) =>
  t === "visitor"
    ? { label: "Visitor", color: "#1D4ED8", bg: "#EFF6FF" }
    : t === "inquiry"
    ? { label: "Inquiry", color: "#B45309", bg: "#FFFBEB" }
    : { label: t, color: TEXT_MUTED, bg: "#F8FAFC" };

/**
 * Browse lead groups (parties of visitors + inquiries who came together) and
 * drill into a group to see its mixed members.
 */
export default function GroupsModal({ open, onClose }) {
  const [active, setActive] = useState(null); // selected group {id,name}
  const { data, isFetching } = useGetQuery(
    { path: `student/leads/groups` },
    { skip: !open, refetchOnMountOrArgChange: true }
  );
  const [loadDetail, { data: detail, isFetching: detailLoading }] = useLazyGetQuery();

  const groups = data?.data || [];
  const members = detail?.data?.members || [];

  if (!open) return null;

  const openGroup = (g) => {
    setActive(g);
    loadDetail({ path: `student/leads/groups/${g.id}` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[88vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {active && (
              <button onClick={() => setActive(null)} className="p-1 rounded-lg" style={{ color: TEXT_MUTED }}><ArrowLeft size={18} /></button>
            )}
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#F5F3FF", color: VIOLET }}><Users size={16} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{active ? active.name : "Groups"}</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{active ? "Members of this party" : "Visitors + inquiries who came together"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {!active ? (
          isFetching ? (
            <div className="py-10 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
          ) : groups.length === 0 ? (
            <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No groups yet. Add people to a group from the visitor or inquiry list.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <button key={g.id} type="button" onClick={() => openGroup(g)} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition" style={{ border: `1px solid ${BORDER}`, background: "#F8FAFC" }}>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{g.name}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{g.members} member{g.members === 1 ? "" : "s"} · {g.visitors} visitor / {g.inquiries} inquiry</div>
                  </div>
                  <ChevronRight size={16} style={{ color: TEXT_MUTED }} />
                </button>
              ))}
            </div>
          )
        ) : detailLoading ? (
          <div className="py-10 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No members in this group.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const b = typeBadge(m.type);
              return (
                <div key={`${m.type}-${m.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, background: "#F8FAFC" }}>
                  <div className="flex items-center gap-2">
                    <UserCircle size={20} style={{ color: TEXT_MUTED }} />
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{m.name || `#${m.id}`}</div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{m.phone || m.email || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                    <span className="text-[10px]" style={{ color: TEXT_SECONDARY }}>{m.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
