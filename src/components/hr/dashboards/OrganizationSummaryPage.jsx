import { useMemo, useState } from "react";
import {
  Building2,
  Users,
  UserPlus,
  Briefcase,
  MapPin,
  Wallet,
  Boxes,
  Network,
  Layers,
  GraduationCap,
  Shield,
  Key,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CalendarRange,
  LayoutGrid,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

import { useGetQuery } from "../../../api/apiSlice";
import {
  BORDER,
  BRAND_RED,
  BRAND_RED_TINT,
  SURFACE_ALT,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  titleCase,
} from "../../dashboard/dashboardConstants";

/**
 * Phase 1.95 — Organization Summary page.
 *
 * One-page kitchen-sink view of every HR-side metric in the system:
 *   • People: headcount, gender, employment type, work location,
 *     interns, remote, probation, onboarding
 *   • Ex-employees: total + within date range + by separation type
 *   • Hires: in range + monthly trend
 *   • Salary: high/low/avg/median/total + bands (perm-gated on BE)
 *   • Payroll: ready/blocked/override + top blocker codes
 *   • Catalog: brands/departments/services/offices/designations/
 *     institutes/roles/permissions
 *   • Splits: by department, office, brand
 *   • Office hours/week: sum of weekly_schedule shifts per office
 *
 * Two views — toggle in the header:
 *   1. CARDS — dense KPI grid (default)
 *   2. CHARTS — Recharts-driven visual summary
 *
 * Filters: brand selector + from/to date range. Date range scopes
 * hires_in_range + ex_in_range only — standing counts stay current.
 */

/* ─────────── chart palette (consistent across pies/bars) ────────── */
const PALETTE = [
  "#C90606", // brand red
  "#1D4ED8", // blue
  "#15803D", // green
  "#A16207", // amber
  "#7C3AED", // violet
  "#0E7490", // teal
  "#BE185D", // pink
  "#475569", // slate
];

/* ─────────── ISO date helpers ────────── */
const isoToday = () => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function OrganizationSummaryPage() {
  /* ─── filter state ─────────────────────────────────────────────── */
  const [brandId, setBrandId] = useState("all");
  const [officeId, setOfficeId] = useState("all");
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoToday());
  const [view, setView] = useState("cards"); // "cards" | "charts"
  // HR ask: by default the dashboard should reflect the CURRENT workforce
  // only. Ex-employees (separated/terminated) get folded back into the view
  // when the toggle below is flipped on.
  const [includeExEmployees, setIncludeExEmployees] = useState(false);

  /* ─── brands + offices for the chip selectors ──────────────────── */
  const { data: brandsResp } = useGetQuery({ path: "employee/company-brands" });
  const brands = brandsResp?.data || [];
  const { data: officesResp } = useGetQuery({ path: "employee/offices" });
  const offices = officesResp?.data || [];

  /* ─── the one-fat-endpoint ─────────────────────────────────────── */
  const params = {
    from,
    to,
    ...(brandId !== "all" ? { brand_id: brandId } : {}),
    ...(officeId !== "all" ? { office_id: officeId } : {}),
  };
  const { data, isLoading, isFetching, error } = useGetQuery({
    path: "employee/dashboard/organization-summary",
    params,
  });
  const d = data?.data;

  const setPreset = (preset) => {
    if (preset === "today") {
      setFrom(isoToday()); setTo(isoToday());
    } else if (preset === "7d") {
      setFrom(isoDaysAgo(7)); setTo(isoToday());
    } else if (preset === "30d") {
      setFrom(isoDaysAgo(30)); setTo(isoToday());
    } else if (preset === "90d") {
      setFrom(isoDaysAgo(90)); setTo(isoToday());
    } else if (preset === "ytd") {
      setFrom(`${new Date().getFullYear()}-01-01`); setTo(isoToday());
    } else if (preset === "all") {
      setFrom("2020-01-01"); setTo(isoToday());
    }
  };

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      {/* ─────────── Header strip ─────────────────────────────────── */}
      <header className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <Boxes size={18} />
            </span>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
                Dashboard
              </h1>
              <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
                Every people metric in HR — counts, splits, salary, payroll, catalog. Filterable by brand and date range.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Filters row — brand + office chips on top, dates + presets on bottom */}
        <div className="flex flex-col gap-3 p-4 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <BrandSelector brands={brands} value={brandId} onChange={setBrandId} />
            <OfficeSelector offices={offices} value={officeId} onChange={setOfficeId} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To"   value={to}   onChange={setTo} />
            <PresetButtons onChange={setPreset} />
          </div>
        </div>
      </header>

      {/* ─────────── Body ───────────────────────────────────────── */}
      {error ? (
        <ErrorBanner />
      ) : isLoading || !d ? (
        <LoadingBanner />
      ) : view === "cards" ? (
        <CardsView
          d={d}
          isFetching={isFetching}
          includeExEmployees={includeExEmployees}
          setIncludeExEmployees={setIncludeExEmployees}
        />
      ) : (
        <ChartsView
          d={d}
          isFetching={isFetching}
          includeExEmployees={includeExEmployees}
          setIncludeExEmployees={setIncludeExEmployees}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CARDS VIEW                                                         */
/* ═══════════════════════════════════════════════════════════════════ */
function CardsView({ d, isFetching, includeExEmployees, setIncludeExEmployees }) {
  const p = d.people;
  const s = d.salary;
  // d.ex_employees is intentionally NOT destructured — the Ex-employees
  // section was removed from the dashboard 2026-05-25.
  const h = d.hires;
  const py = d.payroll;
  const c = d.catalog;

  return (
    <div className="flex flex-col gap-5">
      {isFetching && <SmallSpinner />}

      {/* ─────────── People ─────────────────────────────────── */}
      <Section
        icon={Users}
        title="People"
        subtitle={
          includeExEmployees
            ? "All-time view — ex-employees folded back in"
            : "Current workforce (ex-employees hidden — use the toggle to include them)"
        }
        action={
          <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeExEmployees}
              onChange={(e) => setIncludeExEmployees(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Include ex-employees
          </label>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Kpi label="Headcount (current)" value={p.headcount} accent="primary" />
          {includeExEmployees && (
            <Kpi label="Headcount (all-time)" value={p.headcount_all_time} />
          )}
          <Kpi label="Male" value={p.by_gender.male} />
          <Kpi label="Female" value={p.by_gender.female} />
          <Kpi label="Other" value={p.by_gender.other} />
          <Kpi label="Unspecified" value={p.by_gender.unspecified} />
          <Kpi label="On probation" value={p.on_probation} />
          <Kpi label="Confirmed" value={p.confirmed} tone="green" />
          <Kpi label="Onboarding done" value={p.onboarding_completed} tone="green" />
          <Kpi label="Onboarding pending" value={p.onboarding_pending} tone={p.onboarding_pending > 0 ? "amber" : "default"} />
          <Kpi label="Remote workers" value={p.remote_count} />
          <Kpi label="Interns (total)" value={p.interns_total} />
        </div>

        {/* Sub-breakdowns */}
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
          <BreakdownBlock
            title="Employment type"
            icon={Briefcase}
            entries={Object.entries(p.by_employment_type).map(([k, v]) => [titleCase(k), v])}
          />
          <BreakdownBlock
            title="Work location"
            icon={MapPin}
            entries={Object.entries(p.by_work_location).map(([k, v]) => [titleCase(k), v])}
          />
          <BreakdownBlock
            title="Employment status"
            icon={Briefcase}
            entries={
              Object.entries(p.by_status)
                // When the toggle is off, drop the ex-employee statuses so the
                // chart only reflects the current workforce.
                .filter(([k]) => includeExEmployees || !["separated", "terminated"].includes(k))
                .map(([k, v]) => [titleCase(k), v])
            }
          />
        </div>
      </Section>

      {/* ─────────── Hires ──────────────────── */}
      {/* Ex-employees section removed 2026-05-25 per HR ask — the employee
          dashboard is now about CURRENT workforce only. Ex-employee totals
          still live on the BE response for any future report. */}
      <Section icon={UserPlus} title="Hires" subtitle="New joiners">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="In date range" value={h.in_range} tone="green" />
          <Kpi label="This year (so far)" value={h.monthly.reduce((a, r) => a + r.count, 0)} />
        </div>
      </Section>

      {/* ─────────── Salary ──────────────────────────────────── */}
      <Section icon={Wallet} title="Salary" subtitle={s.visible ? "Aggregates across current employees (PKR)" : "Hidden — you don't have payroll-dashboard permission"}>
        {s.visible ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Highest" value={fmtMoney(s.highest)} accent="primary" />
              <Kpi label="Lowest" value={fmtMoney(s.lowest)} />
              <Kpi label="Average" value={fmtMoney(s.avg)} />
              <Kpi label="Median" value={fmtMoney(s.median)} />
              <Kpi label="Total monthly" value={fmtMoney(s.total_monthly)} tone="green" />
            </div>
            {s.band_distribution.length > 0 && (
              <BreakdownBlock
                title="Salary band distribution"
                icon={Wallet}
                entries={s.band_distribution.map((b) => [b.label, b.count])}
              />
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            Salary section is hidden. Speak to an admin if you need the &quot;view hr-dashboard-payroll&quot; permission.
          </p>
        )}
      </Section>

      {/* ─────────── Payroll readiness ───────────────────────── */}
      <Section icon={ShieldCheck} title="Payroll readiness" subtitle="Pre-payroll-run state">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Kpi label="Payroll ready" value={py.ready} tone="green" />
          <Kpi label="Payroll blocked" value={py.blocked} tone={py.blocked > 0 ? "red" : "default"} />
          <Kpi label="Admin override active" value={py.override_active} tone={py.override_active > 0 ? "amber" : "default"} />
        </div>
        {py.top_blocker_codes?.length > 0 && (
          <BreakdownBlock
            title="Top blocker codes"
            entries={py.top_blocker_codes.map((b) => [titleCase(b.code), b.count])}
          />
        )}
      </Section>

      {/* ─────────── Catalog ─────────────────────────────────── */}
      <Section icon={Layers} title="Catalog" subtitle="Counts of every HR taxonomy table">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          <CatalogTile icon={Building2}    label="Brands"       value={c.brands} />
          <CatalogTile icon={Network}      label="Departments"  value={c.departments} />
          <CatalogTile icon={Layers}       label="Services"     value={c.services} />
          <CatalogTile icon={MapPin}       label="Offices"      value={c.offices} />
          <CatalogTile icon={Briefcase}    label="Designations" value={c.designations} />
          <CatalogTile icon={GraduationCap} label="Institutes"  value={c.institutes} />
          <CatalogTile icon={Shield}       label="Roles"        value={c.roles} />
          <CatalogTile icon={Key}          label="Permissions"  value={c.permissions} />
        </div>
      </Section>

      {/* ─────────── Splits ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Section icon={Network} title="By department">
          <BarList rows={d.splits.by_department.map((r) => ({ key: r.slug, label: r.name, value: r.count }))} />
        </Section>
        <Section icon={MapPin} title="By office">
          <BarList rows={d.splits.by_office.map((r) => ({ key: r.slug, label: r.name, value: r.count, sub: [titleCase(r.type), r.city].filter(Boolean).join(" · ") }))} />
        </Section>
        <Section icon={Building2} title="By brand">
          <BarList rows={d.splits.by_brand.map((r) => ({ key: r.slug || `b-${r.brand_id}`, label: r.name, value: r.count }))} />
        </Section>
      </div>

      {/* ─────────── Office hours/week ──────────────────────── */}
      {d.office_hours_per_week.length > 0 && (
        <Section icon={Calendar} title="Time spent at each office (weekly)" subtitle="Total hours/week allocated to each office across all employees' weekly schedules">
          <BarList
            tone="#1D4ED8"
            rows={d.office_hours_per_week.map((o) => ({ key: o.office_slug, label: o.name, value: o.total_hours, sub: `${o.total_hours} hrs/week` }))}
          />
        </Section>
      )}

      <FooterMeta generated={d.generated_at} filters={d.filters} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CHARTS VIEW                                                        */
/* ═══════════════════════════════════════════════════════════════════ */
function ChartsView({ d, isFetching, includeExEmployees: _ix, setIncludeExEmployees: _six }) {
  // ChartsView's existing charts (gender / payroll / employment_type / work_location /
  // office hours / department / office count / monthly hires) don't surface
  // ex-employee data, so the toggle is a no-op here. Props are accepted for
  // signature symmetry with CardsView; underscore prefix silences lint.
  void _ix; void _six;
  const p = d.people;

  /* Pie data shapers */
  const genderData = useMemo(() =>
    [
      { name: "Male",        value: p.by_gender.male },
      { name: "Female",      value: p.by_gender.female },
      { name: "Other",       value: p.by_gender.other },
      { name: "Unspecified", value: p.by_gender.unspecified },
    ].filter((r) => r.value > 0)
  , [p]);

  const payrollData = useMemo(() => [
    { name: "Ready",   value: d.payroll.ready },
    { name: "Blocked", value: d.payroll.blocked },
  ].filter((r) => r.value > 0), [d.payroll]);

  const empTypeData = useMemo(() =>
    Object.entries(p.by_employment_type).map(([k, v]) => ({ name: titleCase(k), value: v }))
  , [p]);

  const workLocData = useMemo(() =>
    Object.entries(p.by_work_location).map(([k, v]) => ({ name: titleCase(k), value: v }))
  , [p]);

  const officeHoursData = useMemo(() =>
    d.office_hours_per_week.map((o) => ({ name: o.name, hours: o.total_hours }))
  , [d.office_hours_per_week]);

  const deptData = useMemo(() =>
    d.splits.by_department.slice(0, 10).map((r) => ({ name: r.name, count: r.count }))
  , [d.splits.by_department]);

  const officeCountData = useMemo(() =>
    d.splits.by_office.slice(0, 10).map((r) => ({ name: r.name, count: r.count }))
  , [d.splits.by_office]);

  const hiresMonthly = d.hires.monthly;

  return (
    <div className="flex flex-col gap-5">
      {isFetching && <SmallSpinner />}

      {/* Donuts row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <ChartCard title="Gender split" icon={Users}>
          <DonutPie data={genderData} />
        </ChartCard>
        <ChartCard title="Payroll readiness" icon={ShieldCheck}>
          <DonutPie data={payrollData} colors={["#15803D", "#B91C1C"]} />
        </ChartCard>
        <ChartCard title="Employment type" icon={Briefcase}>
          <DonutPie data={empTypeData} />
        </ChartCard>
        <ChartCard title="Work location" icon={MapPin}>
          <DonutPie data={workLocData} />
        </ChartCard>
      </div>

      {/* Hires monthly line chart */}
      <ChartCard title="Hires per month — last 12 months" icon={UserPlus} subtitle="Joiners by joining_date_effective" tall>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={hiresMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
            <YAxis tick={{ fontSize: 11, fill: TEXT_MUTED }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={BRAND_RED} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Bars row: dept + office */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Headcount by department" icon={Network}>
          <ResponsiveContainer width="100%" height={Math.max(240, deptData.length * 36)}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: TEXT_PRIMARY }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill={BRAND_RED} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Headcount by office" icon={MapPin}>
          <ResponsiveContainer width="100%" height={Math.max(240, officeCountData.length * 36)}>
            <BarChart data={officeCountData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: TEXT_PRIMARY }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Office hours/week */}
      {officeHoursData.length > 0 && (
        <ChartCard title="Time spent at each office (weekly hours)" icon={CalendarRange} subtitle="Total scheduled hours/week per office across all employees">
          <ResponsiveContainer width="100%" height={Math.max(220, officeHoursData.length * 40)}>
            <BarChart data={officeHoursData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: TEXT_PRIMARY }} width={140} />
              <Tooltip formatter={(v) => `${v} hrs/week`} />
              <Bar dataKey="hours" fill="#15803D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Salary band histogram (only if visible) */}
      {d.salary.visible && d.salary.band_distribution?.length > 0 && (
        <ChartCard title="Salary band distribution" icon={Wallet} subtitle={`Currency: ${d.salary.currency}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.salary.band_distribution} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: TEXT_MUTED }} />
              <YAxis tick={{ fontSize: 11, fill: TEXT_MUTED }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#A16207" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <FooterMeta generated={d.generated_at} filters={d.filters} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Reusable visual pieces                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function Section({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden bg-white border shadow-sm rounded-2xl" style={{ borderColor: BORDER }}>
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Icon size={14} />
            </span>
          )}
          <div className="flex flex-col">
            <h2 className="text-[13px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>{title}</h2>
            {subtitle && <span className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{subtitle}</span>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function ChartCard({ icon: Icon, title, subtitle, children, tall = false }) {
  return (
    <section className={`overflow-hidden bg-white border shadow-sm rounded-2xl ${tall ? "" : ""}`} style={{ borderColor: BORDER }}>
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Icon size={14} />
            </span>
          )}
          <div className="flex flex-col">
            <h2 className="text-[13px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>{title}</h2>
            {subtitle && <span className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{subtitle}</span>}
          </div>
        </div>
      </header>
      <div className="px-3 py-4">{children}</div>
    </section>
  );
}

function Kpi({ label, value, tone = "default", accent = null }) {
  const tones = {
    default: TEXT_PRIMARY,
    green:   "#15803D",
    amber:   "#A16207",
    red:     "#B91C1C",
  };
  const color = accent === "primary" ? BRAND_RED : tones[tone];
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg border" style={{ borderColor: BORDER }}>
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-xl font-semibold tabular-nums" style={{ color }}>{value ?? "—"}</span>
    </div>
  );
}

function CatalogTile({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center px-3 py-3 text-center rounded-lg border" style={{ borderColor: BORDER }}>
      {Icon && <Icon size={16} style={{ color: BRAND_RED, marginBottom: 2 }} />}
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>{value ?? 0}</span>
    </div>
  );
}

function BreakdownBlock({ icon: Icon, title, entries }) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 px-3 py-3 mt-3 border rounded-lg" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} style={{ color: TEXT_MUTED }} />}
        <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{title}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
        {entries.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between text-[11.5px]">
            <span className="truncate" style={{ color: TEXT_SECONDARY }}>{k}</span>
            <span className="ml-2 font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarList({ rows, tone = BRAND_RED, maxRows = 10 }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs" style={{ color: TEXT_MUTED }}>No data.</p>;
  }
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  const visible = rows.slice(0, maxRows);
  return (
    <ul className="flex flex-col gap-2.5">
      {visible.map((r) => {
        const pct = Math.round(((Number(r.value) || 0) / max) * 100);
        return (
          <li key={r.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="truncate" style={{ color: TEXT_PRIMARY }}>{r.label}</span>
              <span className="ml-2 font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>{r.value}</span>
            </div>
            <div className="relative w-full h-1.5 overflow-hidden rounded-full" style={{ background: "#F1F5F9" }}>
              <div className="absolute top-0 left-0 h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
            </div>
            {r.sub && <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{r.sub}</span>}
          </li>
        );
      })}
      {rows.length > maxRows && (
        <li className="text-[10px] text-right" style={{ color: TEXT_MUTED }}>+ {rows.length - maxRows} more</li>
      )}
    </ul>
  );
}

function DonutPie({ data, colors = PALETTE }) {
  if (!data || data.length === 0) {
    return <p className="px-4 py-4 text-xs" style={{ color: TEXT_MUTED }}>No data.</p>;
  }
  const total = data.reduce((a, r) => a + r.value, 0);
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <ResponsiveContainer width="55%" height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={56} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col w-2/5 gap-1">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between text-[10.5px]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
              <span style={{ color: TEXT_SECONDARY }}>{entry.name}</span>
            </span>
            <span className="font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
              {entry.value} <span style={{ color: TEXT_MUTED }}>({total ? Math.round((entry.value / total) * 100) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BrandSelector({ brands, value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      <Pill active={value === "all"} onClick={() => onChange("all")} icon={Building2} label="All brands" />
      {brands.map((b) => (
        <Pill
          // Phase 1.95 bugfix — the brand list endpoint used to return
          // `uuid` only; we added `id` to the transformer. Comparing
          // String(value) === String(b.id) was matching every chip when
          // both sides resolved to "undefined".
          key={b.id ?? b.uuid}
          active={b.id != null && String(value) === String(b.id)}
          onClick={() => onChange(b.id)}
          label={b.short_name || b.name}
        />
      ))}
    </div>
  );
}

function OfficeSelector({ offices, value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      <Pill active={value === "all"} onClick={() => onChange("all")} icon={MapPin} label="All offices" />
      {offices.map((o) => (
        <Pill
          key={o.id ?? o.uuid}
          active={o.id != null && String(value) === String(o.id)}
          onClick={() => onChange(o.id)}
          label={o.short_name || o.name}
        />
      ))}
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        className="px-2 py-1 text-xs bg-white border rounded-md"
        style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
      />
    </label>
  );
}

function PresetButtons({ onChange }) {
  const presets = [
    ["Today", "today"],
    ["7d",    "7d"],
    ["30d",   "30d"],
    ["90d",   "90d"],
    ["YTD",   "ytd"],
    ["All",   "all"],
  ];
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      {presets.map(([label, key]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors"
          style={{ color: TEXT_SECONDARY }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      <Pill active={view === "cards"}  onClick={() => onChange("cards")}  icon={LayoutGrid} label="Cards" />
      <Pill active={view === "charts"} onClick={() => onChange("charts")} icon={BarChart3}  label="Charts" />
    </div>
  );
}

function Pill({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors"
      style={{ color: active ? "#FFFFFF" : TEXT_SECONDARY, background: active ? BRAND_RED : "transparent" }}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function SmallSpinner() {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: TEXT_MUTED }}>
      <Loader2 size={12} className="animate-spin" />
      <span>Refreshing…</span>
    </div>
  );
}

function LoadingBanner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
      <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
      <span className="text-xs" style={{ color: TEXT_MUTED }}>Loading organization summary…</span>
    </div>
  );
}

function ErrorBanner() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
      <AlertTriangle size={20} style={{ color: "#B91C1C" }} />
      <span className="text-xs" style={{ color: "#B91C1C" }}>Failed to load organization summary.</span>
    </div>
  );
}

function FooterMeta({ generated, filters }) {
  return (
    <p className="mt-2 text-[10px] text-right" style={{ color: TEXT_MUTED }}>
      Generated {generated} · Range {filters.from} → {filters.to}
      {filters.brand_id_filter ? ` · Brand #${filters.brand_id_filter}` : " · All brands"}
      {filters.office_id_filter ? ` · Office #${filters.office_id_filter}` : " · All offices"}
    </p>
  );
}

function fmtMoney(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
