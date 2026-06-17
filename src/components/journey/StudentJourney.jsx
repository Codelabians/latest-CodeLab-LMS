import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  UserSearch, ClipboardList, GraduationCap, Users, Award, ArrowDown,
  Percent, Megaphone, Gift, TrendingDown,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND_RED = "#C90606";
const BLUE = "#1D4ED8";
const PURPLE = "#7C3AED";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

// One colour per lifecycle stage, in funnel order.
const STAGE = {
  visitors:  { icon: UserSearch,    color: BLUE,   tint: "#EFF6FF" },
  inquiries: { icon: ClipboardList, color: BRAND_RED, tint: "#FEF2F2" },
  enrolled:  { icon: GraduationCap, color: GREEN,  tint: "#F0FDF4" },
  active:    { icon: Users,         color: PURPLE, tint: "#F5F3FF" },
  advocates: { icon: Award,         color: AMBER,  tint: "#FFFBEB" },
};

const fmt = (n) => (n ?? 0).toLocaleString();

export default function StudentJourney() {
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 89 * 864e5).toISOString().slice(0, 10);
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useGetQuery(
    { path: "/journey-stats", params: { from, to } },
    { refetchOnMountOrArgChange: true }
  );
  const d = data?.data;
  const funnel = d?.funnel || [];
  const rates = d?.rates || {};
  const istat = d?.inquiry_status || {};
  const adv = d?.advocates || {};
  const series = d?.series || [];

  // Funnel rows: bar width is relative to the largest stage so nothing
  // overflows when a later stage (e.g. direct website inquiries) exceeds an
  // earlier one. Step "continue %" is capped at 100 for the same reason.
  const max = useMemo(() => Math.max(1, ...funnel.map((s) => s.value || 0)), [funnel]);
  const rows = useMemo(() => funnel.map((s, idx) => {
    const prev = idx === 0 ? s.value : funnel[idx - 1].value;
    const stepRate = prev ? Math.min(100, Math.round((s.value / prev) * 100)) : 0;
    const width = Math.max((s.value / max) * 100, s.value > 0 ? 8 : 3);
    return { ...s, stepRate, width, meta: STAGE[s.key] || STAGE.visitors };
  }), [funnel, max]);

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  const leak = (istat.dropout || 0) + (istat.cold || 0);

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header + date filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND_RED }}><TrendingDown size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Student Journey</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Visitor → Inquiry → Enrolled → Active student → Advocate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          <span style={{ color: TEXT_MUTED }}>→</span>
          <input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
        </div>
      </div>

      {/* Conversion rate strip */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <RateCard label="Visitor conversion" value={rates.visitor_conversion} fg={BLUE} tint="#EFF6FF" loading={isLoading} />
        <RateCard label="Inquiry → Enrolled" value={rates.inquiry_to_enrolled} fg={GREEN} tint="#F0FDF4" loading={isLoading} />
        <RateCard label="Enrolled → Active" value={rates.enrolled_to_active} fg={PURPLE} tint="#F5F3FF" loading={isLoading} />
        <RateCard label="Inquiry → Enrolled (overall)" value={rates.overall} fg={AMBER} tint="#FFFBEB" loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <div className="px-5 py-5 bg-white rounded-xl lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: TEXT_PRIMARY }}>Conversion funnel</h3>
          {isLoading ? (
            <div className="py-16 text-center text-sm" style={{ color: TEXT_MUTED }}>Loading…</div>
          ) : (
            <div className="flex flex-col items-center">
              {rows.map((r, idx) => {
                const Icon = r.meta.icon;
                return (
                  <React.Fragment key={r.key}>
                    <div className="w-full flex flex-col items-center">
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{ width: `${r.width}%`, minWidth: 200, background: r.meta.tint, border: `1px solid ${BORDER}` }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "#fff", color: r.meta.color }}><Icon size={15} /></span>
                          <span>
                            <span className="block text-[13px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{r.label}</span>
                            <span className="block text-[10px]" style={{ color: TEXT_MUTED }}>{r.sub}</span>
                          </span>
                        </span>
                        <span className="text-lg font-bold" style={{ color: r.meta.color }}>{fmt(r.value)}</span>
                      </div>
                    </div>
                    {idx < rows.length - 1 && (
                      <div className="flex items-center gap-1 py-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                        <ArrowDown size={12} />
                        <span>{r.stepRate >= 0 ? `${rows[idx + 1].stepRate}% continue` : ""}</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: inquiry breakdown + advocates */}
        <div className="flex flex-col gap-4">
          <div className="px-5 py-5 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Inquiry pipeline</h3>
            <StatusRow label="Pending" value={istat.pending} color={AMBER} />
            <StatusRow label="In process" value={istat.process} color={BLUE} />
            <StatusRow label="Enrolled" value={istat.enrolled} color={GREEN} />
            <StatusRow label="Dropout" value={istat.dropout} color={BRAND_RED} />
            <StatusRow label="Cold" value={istat.cold} color={TEXT_MUTED} last />
            <div className="mt-3 pt-3 flex items-center gap-2 text-[12px]" style={{ borderTop: `1px solid ${BORDER}`, color: BRAND_RED }}>
              <TrendingDown size={13} /> {fmt(leak)} lost (dropout + cold)
            </div>
          </div>

          <div className="px-5 py-5 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Advocates &amp; referrals</h3>
            <MiniStat icon={Award} label="Brand ambassadors" value={adv.brand_ambassadors} color={AMBER} tint="#FFFBEB" />
            <MiniStat icon={GraduationCap} label="Alumni" value={adv.alumni} color={GREEN} tint="#F0FDF4" />
            <MiniStat icon={Gift} label="Referral rewards" value={adv.referrals} color={PURPLE} tint="#F5F3FF" last />
          </div>
        </div>
      </div>

      {/* Trend over time */}
      <div className="px-5 py-5 mt-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: TEXT_PRIMARY }}>Acquisition over time</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BLUE} stopOpacity={0.25} /><stop offset="95%" stopColor={BLUE} stopOpacity={0} /></linearGradient>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND_RED} stopOpacity={0.25} /><stop offset="95%" stopColor={BRAND_RED} stopOpacity={0} /></linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GREEN} stopOpacity={0.3} /><stop offset="95%" stopColor={GREEN} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: TEXT_MUTED }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke={BLUE} fill="url(#gV)" strokeWidth={2} />
              <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke={BRAND_RED} fill="url(#gI)" strokeWidth={2} />
              <Area type="monotone" dataKey="enrolled" name="Enrolled" stroke={GREEN} fill="url(#gE)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const RateCard = ({ label, value, fg, tint, loading }) => (
  <div className="px-4 py-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
    <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: tint, color: fg }}><Percent size={17} /></span>
    <div className="mt-3 text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>{loading ? "…" : `${value ?? 0}%`}</div>
    <div className="text-[12px]" style={{ color: TEXT_MUTED }}>{label}</div>
  </div>
);

const StatusRow = ({ label, value, color, last }) => (
  <div className="flex items-center justify-between py-1.5" style={{ borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
    <span className="flex items-center gap-2 text-[13px]" style={{ color: TEXT_PRIMARY }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, display: "inline-block" }} />{label}
    </span>
    <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>{fmt(value)}</span>
  </div>
);

const MiniStat = ({ icon: Icon, label, value, color, tint, last }) => (
  <div className="flex items-center justify-between py-2" style={{ borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
    <span className="flex items-center gap-2 text-[13px]" style={{ color: TEXT_PRIMARY }}>
      <span className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: tint, color }}><Icon size={14} /></span>{label}
    </span>
    <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{fmt(value)}</span>
  </div>
);
