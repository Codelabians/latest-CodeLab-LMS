import { useState } from "react";
import { Loader2, Plus, X, CalendarDays } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const LEAVE_TYPE = { short_leave: "Short leave (≤15d)", long_break: "Long break (>15d)", emergency: "Emergency" };
const STATUS = {
  pending: { bg: "#FFFBEB", fg: "#B45309" }, approved: { bg: "#F0FDF4", fg: "#15803D" },
  rejected: { bg: "#FEF2F2", fg: BRAND }, cancelled: { bg: "#F8FAFC", fg: "#94A3B8" },
};

export default function PortalLeaves() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/student-portal/leaves", params: { per_page: 100 } });
  const { data: prof } = useGetQuery({ path: "/student-portal/profile" });
  const [open, setOpen] = useState(false);

  const leaves = data?.data || [];
  const batches = (prof?.data?.enrollments || []).filter((e) => e.is_active && e.batch?.id).map((e) => ({ id: e.batch.id, label: `${e.course?.name || ""} · ${e.batch?.name || ""}` }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}><Plus size={14} /> Request leave</button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>No leave requests yet.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Type", "Period", "Reason", "Fee adj.", "Status"].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {leaves.map((r) => {
                const st = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5" style={{ color: "#0F172A" }}>{LEAVE_TYPE[r.leave_type] || r.leave_type}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{r.start_date} → {r.end_date}</td>
                    <td className="px-4 py-2.5 max-w-[220px] truncate" style={{ color: "#475569" }} title={r.reason || ""}>{r.reason || "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: r.fee_adjustment_amount > 0 ? "#15803D" : "#94A3B8" }}>{r.fee_adjustment_amount > 0 ? `− ${money(r.fee_adjustment_amount)}` : "—"}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: st.bg, color: st.fg }}>{r.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && <RequestLeaveModal batches={batches} onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
    </div>
  );
}

function RequestLeaveModal({ batches, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [f, setF] = useState({ batch_id: batches[0]?.id || "", leave_type: "short_leave", start_date: "", end_date: "", reason: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.batch_id || !f.start_date || !f.end_date) { showToast("Pick a batch and dates.", "error"); return; }
    try {
      await post({ path: "/student-portal/leaves", body: { batch_id: Number(f.batch_id), leave_type: f.leave_type, start_date: f.start_date, end_date: f.end_date, reason: f.reason || undefined } }).unwrap();
      showToast("Leave request submitted.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || e?.data?.errors?.batch_id?.[0] || "Could not submit.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><CalendarDays size={17} /> Request leave</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Batch</label>
            <select value={f.batch_id} onChange={(e) => set("batch_id", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
              {batches.length === 0 && <option value="">No active batch</option>}
              {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Leave type</label>
            <select value={f.leave_type} onChange={(e) => set("leave_type", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
              <option value="short_leave">Short leave (≤15 days)</option>
              <option value="long_break">Long break (&gt;15 days)</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>From</label>
              <input type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>To</label>
              <input type="date" value={f.end_date} onChange={(e) => set("end_date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          <textarea value={f.reason} onChange={(e) => set("reason", e.target.value)} rows={2} placeholder="Reason (optional)" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}
