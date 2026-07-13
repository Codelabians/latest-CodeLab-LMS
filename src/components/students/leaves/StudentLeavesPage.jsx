import { useState } from "react";
import {
  CalendarDays, CheckCircle2, XCircle, Loader2, AlertTriangle, X,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const LEAVE_TYPE = {
  short_leave: "Short (≤15d, pro-rated)",
  long_break: "Long break (>15d, month skip)",
  emergency: "Emergency",
};
const STATUS_BADGE = {
  pending: { bg: "#FFFBEB", fg: "#B45309", label: "Pending" },
  approved: { bg: "#F0FDF4", fg: "#15803D", label: "Approved" },
  rejected: { bg: "#FEF2F2", fg: BRAND, label: "Rejected" },
  cancelled: { bg: "#F8FAFC", fg: TEXT_MUTED, label: "Cancelled" },
};
const FILTERS = ["all", "pending", "approved", "rejected"];

const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
};

export default function StudentLeavesPage() {
  const [filter, setFilter] = useState("pending");
  const [action, setAction] = useState(null); // { leave, kind }

  // Single source: ALL leaves (newest first). Approving/rejecting updates
  // the row's status in place instead of making it vanish.
  const { data, isLoading, refetch } = useGetQuery(
    { path: "/student/leaves", params: { per_page: 200, sort: "-created_at" } },
    { refetchOnMountOrArgChange: true },
  );

  const all = data?.data || [];
  const counts = all.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Student Leave Requests</h1>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const count = f === "all" ? all.length : (counts[f] || 0);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize"
              style={isActive ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
            >
              {f} <span style={{ opacity: 0.8 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
            No {filter === "all" ? "" : filter} leave requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: "#F8FAFC", color: TEXT_SECONDARY }}>
                  {["Student", "Batch", "Type", "Period", "Reason", "Fee adj.", "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const b = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                  const days = daysBetween(r.start_date, r.end_date);
                  return (
                    <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{r.user?.name || `User #${r.user_id}`}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.batch?.name ? `${r.batch.name}${r.batch.teacher_name ? ` · ${r.batch.teacher_name}` : ""}` : "—"}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{LEAVE_TYPE[r.leave_type] || r.leave_type}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>
                        {r.start_date} → {r.end_date}
                        <span className="block text-[11px]" style={{ color: TEXT_MUTED }}>{days} day{days === 1 ? "" : "s"}</span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[220px] truncate" style={{ color: TEXT_SECONDARY }} title={r.reason || ""}>{r.reason || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: r.fee_adjustment_amount > 0 ? "#15803D" : TEXT_MUTED }}>{r.fee_adjustment_amount > 0 ? `− ${money(r.fee_adjustment_amount)}` : "—"}</td>
                      <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: b.bg, color: b.fg }}>{b.label}</span></td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {r.status === "pending" && (
                          <span className="inline-flex gap-1.5">
                            <button onClick={() => setAction({ leave: r, kind: "approve" })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: "#15803D" }}><CheckCircle2 size={12} /> Approve</button>
                            <button onClick={() => setAction({ leave: r, kind: "reject" })} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}><XCircle size={12} /> Reject</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {action && (
        <ApproveRejectModal
          leave={action.leave}
          kind={action.kind}
          onClose={() => setAction(null)}
          onDone={() => { setAction(null); refetch(); }}
        />
      )}
    </div>
  );
}

function ApproveRejectModal({ leave, kind, onClose, onDone }) {
  const [text, setText] = useState("");
  const [post, { isLoading }] = usePostMutation();
  const isApprove = kind === "approve";

  // Auto-fill the fee-date shift with the leave length; admin can edit it.
  const leaveDays = daysBetween(leave.start_date, leave.end_date);
  const [shiftFees, setShiftFees] = useState(true);
  const [shiftDays, setShiftDays] = useState(String(leaveDays || 0));

  const submit = async () => {
    try {
      const body = isApprove
        ? {
            note: text || undefined,
            shift_fee_days: shiftFees && parseInt(shiftDays, 10) ? parseInt(shiftDays, 10) : undefined,
          }
        : { reason: text || undefined };
      const res = await post({
        path: `/student/leaves/${leave.id}/${isApprove ? "approve" : "reject"}`,
        body,
      }).unwrap();
      showToast(res?.message || (isApprove ? "Leave approved." : "Leave rejected."), "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Action failed.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
            {isApprove ? <CheckCircle2 size={17} style={{ color: "#15803D" }} /> : <AlertTriangle size={17} style={{ color: BRAND }} />}
            {isApprove ? "Approve leave" : "Reject leave"}
          </span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
            <div><b>{leave.user?.name || `User #${leave.user_id}`}</b> · {leave.batch?.name ? `${leave.batch.name}${leave.batch.teacher_name ? ` · ${leave.batch.teacher_name}` : ""}` : "—"}</div>
            <div>{leave.start_date} → {leave.end_date} · {LEAVE_TYPE[leave.leave_type] || leave.leave_type}</div>
            {isApprove && leave.fee_adjustment_amount > 0 && (
              <div className="mt-1 font-semibold" style={{ color: "#15803D" }}>Approving posts a fee adjustment of − {money(leave.fee_adjustment_amount)}.</div>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={isApprove ? "Note (optional)" : "Reason for rejection (optional)"}
            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
            style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />

          {isApprove && (
            <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer" style={{ color: TEXT_PRIMARY }}>
                <input type="checkbox" checked={shiftFees} onChange={(e) => setShiftFees(e.target.checked)} />
                Shift upcoming fee due dates
              </label>
              {shiftFees && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Push by</span>
                  <input
                    type="number"
                    value={shiftDays}
                    onChange={(e) => setShiftDays(e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg text-[12px] outline-none text-center"
                    style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                  />
                  <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>days <span style={{ color: TEXT_MUTED }}>(auto-filled from the {leaveDays}-day leave — edit if needed)</span></span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: isApprove ? "#15803D" : BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} {isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
