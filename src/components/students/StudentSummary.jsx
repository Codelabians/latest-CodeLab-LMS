import { useMemo, useState } from "react";
import {
  Users, GraduationCap, Award, UserPlus, Wallet, TrendingUp, Clock,
  CalendarCheck, Loader2, Filter, X, Undo2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from "recharts";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const ymd = (d) => d.toISOString().slice(0, 10);

function startOfWeek(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
function endOfWeek(d) { const x = startOfWeek(d); x.setDate(x.getDate() + 6); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

function Kpi({ icon: Icon, label, value, sub, color = TEXT_PRIMARY, tint = SURFACE }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2">
        <span className="grid place-items-center rounded-lg" style={{ width: 30, height: 30, background: tint, color }}><Icon size={15} /></span>
        <span className="text-[11.5px] font-semibold" style={{ color: TEXT_MUTED }}>{label}</span>
      </div>
      <div className="text-[22px] font-bold mt-2" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{sub}</div>}
    </div>
  );
}

export default function StudentSummary() {
  const today = new Date();
  const [course, setCourse] = useState("");
  const [teacher, setTeacher] = useState("");
  const [from, setFrom] = useState(ymd(startOfMonth(today)));
  const [to, setTo] = useState(ymd(endOfMonth(today)));

  const params = useMemo(() => {
    const p = { from, to };
    if (course) p.course_id = course;
    if (teacher) p.teacher_id = teacher;
    return p;
  }, [from, to, course, teacher]);

  const { data, isLoading, isFetching } = useGetQuery({ path: "/student/students-summary", params }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const s = d.students || {};
  const att = d.attendance || {};
  const fees = d.fees || {};
  const courses = d.courses || [];
  const instructors = d.instructors || [];
  const byCourse = d.by_course || [];

  const setRange = (which) => {
    if (which === "week") { setFrom(ymd(startOfWeek(today))); setTo(ymd(endOfWeek(today))); }
    else if (which === "month") { setFrom(ymd(startOfMonth(today))); setTo(ymd(endOfMonth(today))); }
  };
  const clearFilters = () => {
    setCourse(""); setTeacher("");
    setFrom(ymd(startOfMonth(today))); setTo(ymd(endOfMonth(today)));
  };
  const hasFilters = course || teacher || from !== ymd(startOfMonth(today)) || to !== ymd(endOfMonth(today));
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));
  const instructorOptions = instructors.map((t) => ({ value: String(t.id), label: t.name }));

  const donut = [
    { name: "Present", value: att.present || 0, color: "#15803D" },
    { name: "Absent", value: att.absent || 0, color: BRAND },
    { name: "Leave", value: att.leave || 0, color: "#B45309" },
  ].filter((x) => x.value > 0);

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><TrendingUp size={18} /></div>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Student Summary</h1>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Attendance & fee analytics across students {isFetching && <span style={{ color: BRAND }}>· updating…</span>}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 mb-4 flex flex-wrap items-end gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <div style={{ minWidth: 200 }}>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}><Filter size={11} className="inline" /> Course</label>
          <SearchableSelect options={courseOptions} value={course} onChange={(v) => setCourse(v || "")} placeholder="All courses" />
        </div>
        <div style={{ minWidth: 200 }}>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}>Instructor</label>
          <SearchableSelect options={instructorOptions} value={teacher} onChange={(v) => setTeacher(v || "")} placeholder="All instructors" />
        </div>
        <div>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setRange("week")} className="px-3 py-2 text-[12px] font-semibold rounded-lg" style={inputStyle}>This week</button>
          <button onClick={() => setRange("month")} className="px-3 py-2 text-[12px] font-semibold rounded-lg" style={inputStyle}>This month</button>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-[12px] font-semibold rounded-lg inline-flex items-center gap-1" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          {/* Student KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <Kpi icon={Users} label="Total students" value={s.total ?? 0} color={TEXT_PRIMARY} />
            <Kpi icon={GraduationCap} label="Active" value={s.active ?? 0} color="#15803D" tint="#F0FDF4" />
            <Kpi icon={Award} label="Ambassadors" value={s.ambassadors ?? 0} color="#B45309" tint="#FFFBEB" />
            <Kpi icon={UserPlus} label="New (period)" value={s.new_in_period ?? 0} color="#1D4ED8" tint="#EFF6FF" />
            <Kpi icon={Users} label="Dropped" value={s.dropped ?? 0} color={BRAND} tint="#FEF2F2" />
            <Kpi icon={GraduationCap} label="Alumni" value={s.alumni ?? 0} color="#7C3AED" tint="#F5F3FF" />
          </div>

          {/* Fee KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <Kpi icon={Wallet} label="Incoming (period)" value={money(fees.incoming)} color={TEXT_PRIMARY} sub="Billed installments due" />
            <Kpi icon={TrendingUp} label="Collected (net)" value={money(fees.collected_in_period)} color="#15803D" tint="#F0FDF4" sub={`${money(fees.collected_in_period_gross ?? fees.collected_in_period)} paid − ${money(fees.refunds_in_period ?? 0)} refunded`} />
            <Kpi icon={Undo2} label="Refunds (period)" value={money(fees.refunds_in_period ?? 0)} color={BRAND} tint="#FEF2F2" sub="Refunded to students" />
            <Kpi icon={Clock} label="Pending (period)" value={money(fees.pending)} color="#B45309" tint="#FFFBEB" />
            <Kpi icon={Wallet} label="Outstanding (all)" value={money(fees.outstanding_total)} color={BRAND} tint="#FEF2F2" sub="Total unpaid balance" />
            <Kpi icon={TrendingUp} label="Projected monthly" value={money(fees.projected_mrr)} color="#1D4ED8" tint="#EFF6FF" sub="Active students × monthly fee" />
          </div>

          {/* Fee breakdown by type (enrollment vs monthly) */}
          <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>Fee breakdown (period)</h3>
            <table className="w-full text-[12px]">
              <thead><tr style={{ background: SURFACE, color: "#475569" }}>{["Fee type", "Incoming", "Collected", "Pending"].map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {[{ k: "enrollment", label: "Enrollment" }, { k: "monthly", label: "Monthly" }].map((row) => {
                  const t = fees[row.k] || {};
                  return (
                    <tr key={row.k} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{row.label}</td>
                      <td className="px-4 py-2" style={{ color: TEXT_PRIMARY }}>{money(t.incoming)}</td>
                      <td className="px-4 py-2" style={{ color: "#15803D" }}>{money(t.collected)}</td>
                      <td className="px-4 py-2" style={{ color: (t.pending || 0) > 0 ? "#B45309" : TEXT_MUTED }}>{money(t.pending)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${BORDER}`, background: SURFACE }}>
                  <td className="px-4 py-2 font-bold" style={{ color: TEXT_PRIMARY }}>Total</td>
                  <td className="px-4 py-2 font-bold" style={{ color: TEXT_PRIMARY }}>{money(fees.incoming)}</td>
                  <td className="px-4 py-2 font-bold" style={{ color: "#15803D" }}>{money(fees.collected)}</td>
                  <td className="px-4 py-2 font-bold" style={{ color: "#B45309" }}>{money(fees.pending)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Attendance donut */}
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold flex items-center gap-1.5 mb-2" style={{ color: TEXT_PRIMARY }}><CalendarCheck size={14} /> Attendance</h3>
              {att.total > 0 ? (
                <>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donut} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                          {donut.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <ReTooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center text-[13px] font-bold" style={{ color: att.rate >= 75 ? "#15803D" : att.rate >= 50 ? "#B45309" : BRAND }}>
                    {att.rate}% present <span className="font-normal" style={{ color: TEXT_MUTED }}>({att.total} records)</span>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No attendance in this range.</div>
              )}
            </div>

            {/* Per-course table */}
            <div className="bg-white rounded-xl overflow-hidden lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>By course</h3>
              {byCourse.length === 0 ? (
                <div className="py-12 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No data for the selected filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead><tr style={{ background: SURFACE, color: "#475569" }}>{["Course", "Students", "Attendance", "Incoming", "Collected", "Pending"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px] whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody>
                      {byCourse.map((r, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td className="px-3 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{r.course}</td>
                          <td className="px-3 py-2" style={{ color: "#475569" }}>{r.students}</td>
                          <td className="px-3 py-2 font-semibold" style={{ color: r.rate >= 75 ? "#15803D" : r.rate >= 50 ? "#B45309" : BRAND }}>{r.rate}%</td>
                          <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>{money(r.incoming)}</td>
                          <td className="px-3 py-2" style={{ color: "#15803D" }}>{money(r.collected)}</td>
                          <td className="px-3 py-2" style={{ color: r.pending > 0 ? "#B45309" : TEXT_MUTED }}>{money(r.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
