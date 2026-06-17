import { useMemo, useState } from "react";
import {
  BookOpen, Layers, Users, Armchair, Wallet, TrendingUp, Clock,
  Globe, ClipboardList, UserSearch, Loader2, Filter, X,
  LayoutGrid, BarChart3, Trophy,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- shared design tokens (match Reception / Student dashboards) ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const PURPLE = "#7C3AED";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const num = (n) => Number(n || 0).toLocaleString();
const ymd = (d) => d.toISOString().slice(0, 10);

const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

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

const Panel = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-white rounded-xl overflow-hidden ${className}`} style={{ border: `1px solid ${BORDER}` }}>
    <h3 className="text-[13px] font-bold px-4 py-3 flex items-center gap-1.5" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>
      {Icon && <Icon size={14} />} {title}
    </h3>
    <div className="p-4">{children}</div>
  </div>
);

const Empty = ({ text }) => (
  <div className="py-12 text-center text-[12px]" style={{ color: TEXT_MUTED }}>{text}</div>
);

/* Ranked horizontal-bar list used in the Cards view */
function RankList({ rows, valueKey, format = num, color = BRAND }) {
  if (!rows?.length) return <Empty text="No data for the selected range." />;
  const max = Math.max(...rows.map((r) => r[valueKey] || 0), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="font-semibold truncate pr-2" style={{ color: TEXT_PRIMARY }}>
              <span style={{ color: TEXT_MUTED }}>{i + 1}.</span> {r.course}
            </span>
            <span className="font-bold tabular-nums" style={{ color }}>{format(r[valueKey])}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: SURFACE }}>
            <div className="h-1.5 rounded-full" style={{ width: `${((r[valueKey] || 0) / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CourseSummary() {
  const today = new Date();
  const last12 = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const [view, setView] = useState("charts"); // "charts" | "cards"
  const [course, setCourse] = useState("");
  const [from, setFrom] = useState(ymd(last12));
  const [to, setTo] = useState(ymd(today));

  const params = useMemo(() => {
    const p = { from, to };
    if (course) p.course_id = course;
    return p;
  }, [from, to, course]);

  const { data, isLoading, isFetching } = useGetQuery(
    { path: "/course/course-summary", params },
    { refetchOnMountOrArgChange: true }
  );

  const d = data?.data || {};
  const k = d.kpis || {};
  const byCourse = d.by_course || [];
  const topEarning = d.top_earning || [];
  const topEnrollment = d.top_enrollment || [];
  const topDemand = d.top_demand || [];
  const demand = d.demand_summary || { visitors: {}, inquiries: {} };
  const trend = d.earning_trend || [];
  const courses = d.courses || [];

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));

  // Quick date presets — date filtering is the primary lens for this page.
  const applyPreset = (key) => {
    const y = today.getFullYear(), m = today.getMonth();
    if (key === "month") { setFrom(ymd(new Date(y, m, 1))); setTo(ymd(today)); }
    else if (key === "q") { setFrom(ymd(new Date(y, m - 2, 1))); setTo(ymd(today)); }
    else if (key === "12m") { setFrom(ymd(new Date(y, m - 11, 1))); setTo(ymd(today)); }
    else if (key === "year") { setFrom(ymd(new Date(y, 0, 1))); setTo(ymd(today)); }
    else if (key === "all") { setFrom("2020-01-01"); setTo(ymd(today)); }
  };
  const presets = [
    { key: "month", label: "This month" },
    { key: "q", label: "Last 3 months" },
    { key: "12m", label: "Last 12 months" },
    { key: "year", label: "This year" },
    { key: "all", label: "All time" },
  ];
  const clearFilters = () => {
    setCourse(""); setFrom(ymd(last12)); setTo(ymd(today));
  };
  const hasFilters = course || from !== ymd(last12) || to !== ymd(today);

  const trendData = useMemo(
    () => trend.map((t) => ({ month: t.month, total: Number(t.total) })),
    [trend]
  );
  const demandPie = useMemo(() => ([
    { name: "Website visitors", value: Number(demand.visitors?.website || 0), color: BLUE },
    { name: "In-house visitors", value: Number(demand.visitors?.in_house || 0), color: "#93C5FD" },
    { name: "Website inquiries", value: Number(demand.inquiries?.website || 0), color: BRAND },
    { name: "In-house inquiries", value: Number(demand.inquiries?.in_house || 0), color: "#FCA5A5" },
  ].filter((x) => x.value > 0)), [demand]);

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><BookOpen size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Course Summary</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Courses, batches, students & earnings · website demand
              {isFetching && <span style={{ color: BRAND }}> · updating…</span>}
            </p>
          </div>
        </div>

        {/* Cards / Charts global toggle */}
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { key: "charts", label: "Charts", icon: BarChart3 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
          ].map((opt) => {
            const active = view === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setView(opt.key)}
                className="px-3.5 py-2 text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                style={{
                  background: active ? BRAND : "#fff",
                  color: active ? "#fff" : TEXT_MUTED,
                }}
              >
                <opt.icon size={14} /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters — date range is the primary lens */}
      <div className="bg-white rounded-xl p-3 mb-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex flex-wrap items-end gap-3">
          <div style={{ minWidth: 220 }}>
            <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}><Filter size={11} className="inline" /> Course</label>
            <SearchableSelect options={courseOptions} value={course} onChange={(v) => setCourse(v || "")} placeholder="All courses" />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}><Clock size={11} className="inline" /> From</label>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}><Clock size={11} className="inline" /> To</label>
            <input type="date" value={to} min={from} max={ymd(today)} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-[12px] font-semibold rounded-lg inline-flex items-center gap-1" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
        {/* Quick date presets */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {presets.map((p) => (
            <button key={p.key} onClick={() => applyPreset(p.key)} className="px-3 py-1.5 text-[11.5px] font-semibold rounded-full" style={inputStyle}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <Kpi icon={BookOpen} label="Courses" value={num(k.total_courses)} sub={`${num(k.scheduled_courses)} scheduled`} color={TEXT_PRIMARY} />
            <Kpi icon={Layers} label="Batches" value={num(k.total_batches)} sub={`${num(k.active_batches)} active`} color={BLUE} tint="#EFF6FF" />
            <Kpi icon={Users} label="Active students" value={num(k.total_students)} color={GREEN} tint="#F0FDF4" />
            <Kpi icon={Armchair} label="Total seats" value={num(k.total_seats)} color={PURPLE} tint="#F5F3FF" />
            <Kpi icon={Wallet} label="Earnings (period)" value={money(k.earnings_period)} sub={`${money(k.earnings_all_time)} all-time`} color={GREEN} tint="#F0FDF4" />
            <Kpi icon={Clock} label="Outstanding" value={money(k.outstanding)} color={BRAND} tint="#FEF2F2" />
          </div>

          {/* Demand mini-KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Kpi icon={UserSearch} label="Visitors" value={num(demand.visitors?.total)} sub={`${num(demand.visitors?.website)} website · ${num(demand.visitors?.in_house)} in-house`} color={BLUE} tint="#EFF6FF" />
            <Kpi icon={ClipboardList} label="Inquiries" value={num(demand.inquiries?.total)} sub={`${num(demand.inquiries?.website)} website · ${num(demand.inquiries?.in_house)} in-house`} color={BRAND} tint="#FEF2F2" />
            <Kpi icon={Globe} label="Visitor conversion" value={`${demand.visitors?.conversion_rate ?? 0}%`} sub={`${num(demand.visitors?.converted)} converted`} color={GREEN} tint="#F0FDF4" />
            <Kpi icon={TrendingUp} label="Inquiry → enrolled" value={`${demand.inquiries?.conversion_rate ?? 0}%`} sub={`${num(demand.inquiries?.enrolled)} enrolled`} color={PURPLE} tint="#F5F3FF" />
          </div>

          {view === "charts" ? (
            <ChartsView trendData={trendData} topEarning={topEarning} topEnrollment={topEnrollment} topDemand={topDemand} demandPie={demandPie} />
          ) : (
            <CardsView topEarning={topEarning} topEnrollment={topEnrollment} topDemand={topDemand} byCourse={byCourse} />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------- CHARTS ------------------------------- */
function ChartsView({ trendData, topEarning, topEnrollment, topDemand, demandPie }) {
  return (
    <div className="space-y-4">
      {/* Earnings trend */}
      <Panel title="Earnings trend (monthly collections)" icon={TrendingUp}>
        {trendData.length === 0 ? <Empty text="No collections in this range." /> : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_MUTED }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: TEXT_MUTED }} width={70} tickFormatter={(v) => "Rs " + (v >= 1000 ? (v / 1000) + "k" : v)} />
                <ReTooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="total" name="Collected" stroke={GREEN} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top courses by earning */}
        <Panel title="Top courses by earning" icon={Trophy}>
          {topEarning.length === 0 ? <Empty text="No earnings in this range." /> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topEarning} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} tickFormatter={(v) => (v >= 1000 ? (v / 1000) + "k" : v)} />
                  <YAxis type="category" dataKey="course" tick={{ fontSize: 11, fill: TEXT_PRIMARY }} width={130} />
                  <ReTooltip formatter={(v) => money(v)} />
                  <Bar dataKey="total" name="Earnings" fill={GREEN} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Students per course */}
        <Panel title="Top courses by enrollment" icon={Users}>
          {topEnrollment.length === 0 ? <Empty text="No active students in this range." /> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topEnrollment} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                  <YAxis type="category" dataKey="course" tick={{ fontSize: 11, fill: TEXT_PRIMARY }} width={130} />
                  <ReTooltip />
                  <Bar dataKey="students" name="Students" fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Demand by course (stacked website visitors + inquiries) */}
        <Panel title="Top demand by course (website)" icon={Globe}>
          {topDemand.length === 0 ? <Empty text="No website demand in this range." /> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topDemand} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="course" tick={{ fontSize: 10, fill: TEXT_MUTED }} angle={-25} textAnchor="end" interval={0} height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                  <ReTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="website_visitors" name="Visitors" stackId="a" fill={BLUE} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="website_inquiries" name="Inquiries" stackId="a" fill={BRAND} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Demand split donut */}
        <Panel title="Demand split (visitors vs inquiries)" icon={UserSearch}>
          {demandPie.length === 0 ? <Empty text="No demand in this range." /> : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={demandPie} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={2} label={(e) => e.value}>
                    {demandPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* -------------------------------- CARDS ------------------------------- */
function CardsView({ topEarning, topEnrollment, topDemand, byCourse }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top courses by earning" icon={Trophy}>
          <RankList rows={topEarning} valueKey="total" format={money} color={GREEN} />
        </Panel>
        <Panel title="Top courses by enrollment" icon={Users}>
          <RankList rows={topEnrollment} valueKey="students" format={num} color={BLUE} />
        </Panel>
        <Panel title="Top demand by course (website)" icon={Globe}>
          <RankList rows={topDemand} valueKey="total" format={num} color={BRAND} />
        </Panel>
      </div>

      {/* Full per-course breakdown */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="text-[13px] font-bold px-4 py-3 flex items-center gap-1.5" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>
          <Layers size={14} /> Course → batches → students → earnings
        </h3>
        {byCourse.length === 0 ? (
          <Empty text="No courses match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: SURFACE, color: "#475569" }}>
                  {["Course", "Batches", "Students", "Seats", "Earnings (period)", "All-time", "Visitors", "Inquiries"].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-[11px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCourse.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap" style={{ color: TEXT_PRIMARY }}>{r.course}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{num(r.batches)} <span style={{ color: TEXT_MUTED }}>({num(r.active_batches)} active)</span></td>
                    <td className="px-3 py-2 font-semibold" style={{ color: BLUE }}>{num(r.students)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{num(r.seats)}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: GREEN }}>{money(r.earnings)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{money(r.earnings_all_time)}</td>
                    <td className="px-3 py-2" style={{ color: r.website_visitors > 0 ? TEXT_PRIMARY : TEXT_MUTED }}>{num(r.website_visitors)}</td>
                    <td className="px-3 py-2" style={{ color: r.website_inquiries > 0 ? BRAND : TEXT_MUTED }}>{num(r.website_inquiries)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
