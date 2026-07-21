import { Loader2, CalendarDays } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

const STATUS = {
  pending: { bg: "#FFFBEB", fg: "#B45309", label: "Pending" },
  approved: { bg: "#F0FDF4", fg: "#15803D", label: "Approved" },
  rejected: { bg: "#FEF2F2", fg: BRAND, label: "Rejected" },
  cancelled: { bg: "#F8FAFC", fg: "#94A3B8", label: "Cancelled" },
};

/**
 * Staff portal — leave requests from the teacher's OWN batch students.
 * Read-only: admin approves; the teacher just needs to know who'll be away
 * (and why attendance shows Leave).
 */
export default function TeacherStudentLeaves() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/my-students-leaves" }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const rows = d.rows || [];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <CalendarDays size={18} style={{ color: "#1D4ED8", marginTop: 1 }} />
        <div>
          <div className="text-[12.5px] font-bold mb-0.5" style={{ color: "#1D4ED8" }}>
            Your students&apos; leave requests{d.pending ? ` — ${d.pending} pending` : ""}
          </div>
          <p className="text-[12.5px]" style={{ color: "#1E3A8A" }}>
            Leaves are approved by admin — this list keeps you informed about who will be away in your batches.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>
          No leave requests from your students yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#475569" }}>
                {["Student", "Batch", "From", "To", "Type", "Reason", "Status"].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: "#0F172A" }}>{r.student}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{r.batch}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{String(r.start_date || "").slice(0, 10)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{String(r.end_date || "").slice(0, 10)}</td>
                    <td className="px-3 py-2 capitalize" style={{ color: "#475569" }}>{String(r.leave_type || "—").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 max-w-[220px] truncate" style={{ color: "#94A3B8" }} title={r.reason}>{r.reason || "—"}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
