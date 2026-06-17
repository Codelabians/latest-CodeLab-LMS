import { Loader2, Users, BookOpen, CheckCircle2, XCircle, CalendarOff, UserMinus } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const n = (v) => Number(v || 0);

const Card = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center rounded-lg" style={{ width: 36, height: 36, background: `${color}14`, color }}><Icon size={17} /></span>
      <div>
        <div className="text-[17px] font-bold" style={{ color: "#0F172A" }}>{value}</div>
        <div className="text-[11px]" style={{ color: "#94A3B8" }}>{label}</div>
      </div>
    </div>
    {sub != null && <div className="mt-2 text-[12px]" style={{ color: "#475569" }}>{sub}</div>}
  </div>
);

export default function TeacherDashboard() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/dashboard" });
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const d = data?.data || {};
  const s = d.students || {};
  const a = d.attendance || {};
  const dropouts = d.drop_outs || {};

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card icon={Users} label="Active students" value={n(s.all_students)} color="#7C3AED" sub={`${n(s.male_students)} male · ${n(s.female_students)} female`} />
        <Card icon={BookOpen} label="Batches" value={n(d.classes)} color="#1D4ED8" sub="you are teaching" />
        <Card icon={UserMinus} label="Dropouts (month)" value={n(dropouts.monthly_dropout_count)} color={BRAND} sub={`${n(dropouts.weekly_dropout_count)} this week`} />
      </div>

      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>Attendance snapshot</h3>
        <div className="grid gap-3 grid-cols-3">
          <Card icon={CheckCircle2} label="Present" value={n(a.present)} color="#15803D" sub={a.present_percentage != null ? `${n(a.present_percentage)}%` : null} />
          <Card icon={XCircle} label="Absent" value={n(a.absent)} color={BRAND} sub={a.absent_percentage != null ? `${n(a.absent_percentage)}%` : null} />
          <Card icon={CalendarOff} label="Leave" value={n(a.leave)} color="#B45309" sub={a.leave_percentage != null ? `${n(a.leave_percentage)}%` : null} />
        </div>
      </div>

      {(a.weekly_present != null || a.monthly_present != null) && (
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <div className="font-bold mb-1" style={{ color: "#475569" }}>This week</div>
              <div style={{ color: "#15803D" }}>Present: {n(a.weekly_present)}</div>
              <div style={{ color: BRAND }}>Absent: {n(a.weekly_absent)}</div>
              <div style={{ color: "#B45309" }}>Leave: {n(a.weekly_leave)}</div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: "#475569" }}>This month</div>
              <div style={{ color: "#15803D" }}>Present: {n(a.monthly_present)}</div>
              <div style={{ color: BRAND }}>Absent: {n(a.monthly_absent)}</div>
              <div style={{ color: "#B45309" }}>Leave: {n(a.monthly_leave)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
