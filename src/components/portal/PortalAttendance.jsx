import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, CalendarOff } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BORDER = "#EEF2F6";
// Keyed by lowercase; stored values are capitalized (Present/Absent/Leave),
// so we normalise before lookup.
const STATUS = {
  present: { fg: "#15803D", bg: "#F0FDF4", label: "Present", Icon: CheckCircle2 },
  absent: { fg: "#C90606", bg: "#FEF2F2", label: "Absent", Icon: XCircle },
  leave: { fg: "#B45309", bg: "#FFFBEB", label: "Leave", Icon: CalendarOff },
};

const monthBounds = (ym) => {
  if (!ym) return {};
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const to = new Date(y, m, 0).toISOString().slice(0, 10); // last day of month
  return { from, to };
};

export default function PortalAttendance() {
  const [month, setMonth] = useState(""); // "" = all time
  const { from, to } = monthBounds(month);
  const { data, isLoading } = useGetQuery({
    path: "/student-portal/attendance",
    params: { per_page: 200, ...(from ? { from, to } : {}) },
  }, { refetchOnMountOrArgChange: true });

  const summary = data?.data?.summary || {};
  const records = data?.data?.records || [];
  const pct = summary.total ? Math.round((summary.present / summary.total) * 100) : 0;

  const Stat = ({ label, value, color }) => (
    <div className="bg-white rounded-xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px]" style={{ color: "#94A3B8" }}>{label}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Month filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-semibold" style={{ color: "#475569" }}>Filter:</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg text-[12px] outline-none" style={{ background: "#fff", border: `1px solid ${BORDER}` }} />
        {month && <button onClick={() => setMonth("")} className="text-[12px] font-semibold" style={{ color: "#C90606" }}>Clear (all time)</button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Present" value={summary.present || 0} color="#15803D" />
        <Stat label="Absent" value={summary.absent || 0} color="#C90606" />
        <Stat label="Leave" value={summary.leave || 0} color="#B45309" />
        <Stat label="Overall" value={`${pct}%`} color={pct >= 75 ? "#15803D" : "#C90606"} />
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: "#C90606" }} /></div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>No attendance {month ? "for this month" : "recorded yet"}.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Date", "Status", "Note"].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {records.map((r, i) => {
                const st = STATUS[String(r.present_status || "").toLowerCase()] || { fg: "#475569", bg: "#F8FAFC", label: r.present_status, Icon: XCircle };
                const Icon = st.Icon;
                return (
                  <tr key={r.uuid || i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5" style={{ color: "#0F172A" }}>{(r.date || "").slice(0, 10)}</td>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}><Icon size={12} /> {st.label}</span></td>
                    <td className="px-4 py-2.5" style={{ color: "#94A3B8" }}>{r.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
