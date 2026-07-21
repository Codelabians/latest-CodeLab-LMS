import { useState } from "react";
import { Loader2, Users, X } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import MemberPicker from "./MemberPicker";
import {
  BRAND, BRAND_TINT, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE,
} from "./chatTheme";

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState({}); // user id → {id, name, role}
  const [err, setErr] = useState(null);
  const [post, { isLoading: saving }] = usePostMutation();

  const toggle = (r) =>
    setSelected((p) => {
      const next = { ...p };
      if (next[r.id]) delete next[r.id];
      else next[r.id] = r;
      return next;
    });

  const submit = async () => {
    setErr(null);
    const userIds = Object.keys(selected).map(Number);
    if (!name.trim()) { setErr("Group name is required."); return; }
    if (!userIds.length) { setErr("Select at least one member."); return; }
    try {
      const res = await post({
        path: "communication/chat/groups",
        body: { name: name.trim(), user_ids: userIds },
      }).unwrap();
      showToast(res?.message || "Group created.", "success");
      onCreated?.(res?.data);
    } catch (e) {
      const errors = e?.data?.errors;
      const first = errors && Object.values(errors)[0];
      setErr((Array.isArray(first) ? first[0] : first) || e?.data?.message || "Could not create the group.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div
        className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] flex flex-col"
        style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_TINT, color: BRAND }}>
              <Users size={17} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>New group chat</h2>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Pick any staff or students as members.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 pr-1 overflow-y-auto">
          <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Group name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web Dev Batch 12 — Projects"
            className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />
          <MemberPicker selected={selected} onToggle={toggle} />
        </div>

        {err && <p className="mt-2 text-[12px] font-medium" style={{ color: BRAND }}>{err}</p>}

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
            {saving ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}
