import { useMemo } from "react";
import { useSelector } from "react-redux";
import { CalendarCheck, Clock, AlertTriangle } from "lucide-react";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { useGetQuery } from "../../../api/apiSlice";

/**
 * "Today's Attendance" dashboard widget — counts by status + the late list
 * with the time each person actually reached. Self-gating: renders nothing
 * (and fires no request) unless the user can read employee attendance, so it
 * can be dropped onto any dashboard without risking a 401.
 */
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BRAND = "#C90606";

const CARDS = [
  { k: "present",    label: "Present",  color: GREEN },
  { k: "late",       label: "Late",     color: AMBER },
  { k: "absent",     label: "Absent",   color: BRAND },
  { k: "on_leave",   label: "On leave", color: "#1D4ED8" },
  { k: "at_stp",     label: "At STP",   color: AMBER },
  { k: "not_marked", label: "Unmarked", color: TEXT_MUTED },
];

export default function TodayAttendanceWidget() {
  const user = useSelector(selectCurrentUser);
  const canView =
    user?.role === "admin" ||
    (user?.permissions || []).includes("get employee-attendance");

  const { data } = useGetQuery(
    { path: "employee/attendance/today-stats" },
    { skip: !canView, refetchOnMountOrArgChange: true }
  );

  const counts = data?.counts || {};
  const late = useMemo(() => data?.late || [], [data]);

  if (!canView) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center" style={{ width: 32, height: 32, borderRadius: 9, background: "#FEF2F2", color: BRAND }}>
            <CalendarCheck size={16} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Today&apos;s Attendance</h3>
        </div>
        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{data?.date || ""}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {CARDS.map((c) => (
          <div key={c.k} className="rounded-xl p-2.5 text-center" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <div className="text-lg font-bold" style={{ color: c.color }}>{counts[c.k] ?? 0}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle size={13} style={{ color: AMBER }} />
        <h4 className="text-[12px] font-bold" style={{ color: TEXT_PRIMARY }}>Late arrivals</h4>
      </div>
      {late.length === 0 ? (
        <p className="text-[12px]" style={{ color: TEXT_MUTED }}>No late arrivals today. 🎉</p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {late.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <span className="font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{p.name}</span>
              <span className="flex items-center gap-2 flex-shrink-0" style={{ color: AMBER }}>
                <span className="flex items-center gap-1"><Clock size={11} />{p.reached_at || "—"}</span>
                {p.late_minutes > 0 && <span className="font-semibold">+{p.late_minutes}m</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
