import { useState } from "react";
import { X, Loader2, Users, Plus, Check, Ban } from "lucide-react";
import {
  useGetQuery,
  usePatchMutation,
  useDeleteMutation,
} from "../../api/apiSlice";
import { showToast } from "./common/ShowToast";

const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const BRAND_RED = "#C90606";
const VIOLET = "#7C3AED";

/**
 * Assign a visitor/inquiry to a group (a party of people who came together).
 * Pick an existing group or create a new one. `type` is "visitor" | "inquiry".
 */
export default function AssignGroupDialog({ open, type, entity, onClose, onChanged }) {
  const [newName, setNewName] = useState("");
  const { data, isFetching } = useGetQuery(
    { path: `student/leads/groups` },
    { skip: !open, refetchOnMountOrArgChange: true }
  );
  const [assign, { isLoading: assigning }] = usePatchMutation();
  const [unassign, { isLoading: removing }] = useDeleteMutation();

  const groups = data?.data || [];
  const currentGroupId = entity?.group_id || null;

  if (!open || !entity) return null;

  const doAssign = async (body) => {
    const res = await assign({ path: `student/leads/${type}/${entity.id}/group`, body });
    if (res?.error) { showToast("Could not assign", "error"); return; }
    showToast("Added to group", "success");
    setNewName("");
    onChanged?.();
    onClose?.();
  };

  const doRemove = async () => {
    const res = await unassign({ path: `student/leads/${type}/${entity.id}/group` });
    if (res?.error) { showToast("Could not remove", "error"); return; }
    showToast("Removed from group", "success");
    onChanged?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[85vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#F5F3FF", color: VIOLET }}><Users size={16} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Group</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{entity.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {currentGroupId && (
          <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <span className="text-[12px] font-semibold" style={{ color: VIOLET }}>In group: {groups.find((g) => g.id === currentGroupId)?.name || `#${currentGroupId}`}</span>
            <button type="button" onClick={doRemove} disabled={removing} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND_RED }}>
              {removing ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Remove
            </button>
          </div>
        )}

        {/* Create new group */}
        <div className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New group name (e.g. Khan Family)"
            className="flex-1 px-3 py-2 text-[13px] rounded-lg outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />
          <button
            type="button"
            disabled={assigning || !newName.trim()}
            onClick={() => doAssign({ group_name: newName.trim() })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
            style={{ background: VIOLET }}
          >
            {assigning ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create
          </button>
        </div>

        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Existing groups</div>
        {isFetching ? (
          <div className="py-8 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No groups yet — create one above.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={assigning || g.id === currentGroupId}
                onClick={() => doAssign({ group_id: g.id })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition disabled:opacity-60"
                style={{ border: `1px solid ${BORDER}`, background: g.id === currentGroupId ? "#F5F3FF" : "#F8FAFC" }}
              >
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{g.name}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{g.members} member{g.members === 1 ? "" : "s"} · {g.visitors} visitor / {g.inquiries} inquiry</div>
                </div>
                {g.id === currentGroupId ? <Check size={15} style={{ color: VIOLET }} /> : <Plus size={15} style={{ color: VIOLET }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
