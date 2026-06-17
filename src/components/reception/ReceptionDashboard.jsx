import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { UserSearch, ClipboardList, Globe, Percent } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND_RED = "#C90606";
const BLUE = "#1D4ED8";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";
const PIE_COLORS = ["#C90606", "#1D4ED8", "#7C3AED", "#15803D", "#B45309", "#0ea5e9", "#94A3B8"];

const Card = ({ icon: Icon, label, value, sub, tint, fg }) => (
  <div className="px-4 py-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
    <div className="flex items-center justify-between">
      <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: tint, color: fg }}><Icon size={17} /></span>
    </div>
    <div className="mt-3 text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div>
    <div className="text-[12px]" style={{ color: TEXT_MUTED }}>{label}</div>
    {sub && <div className="text-[11px] mt-0.5" style={{ color: fg }}>{sub}</div>}
  </div>
);

export default function ReceptionDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useGetQuery(
    { path: "/reception-stats", params: { from, to } },
    { refetchOnMountOrArgChange: true }
  );
  const d = data?.data;
  const v = d?.visitors || {}; const i = d?.inquiries || {};
  const series = d?.series || [];
  const purposes = useMemo(() => (d?.purposes || []).map((p) => ({ name: p.name, value: Number(p.count) })), [d]);

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header + date filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND_RED }}><UserSearch size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Reception Dashboard</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Visitors and inquiries — tracked separately</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          <span style={{ color: TEXT_MUTED }}>→</span>
          <input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <Card icon={UserSearch} label="Visitors" value={isLoading ? "…" : v.total ?? 0} sub={`${v.website ?? 0} website · ${v.in_house ?? 0} in-house`} tint="#EFF6FF" fg={BLUE} />
        <Card icon={ClipboardList} label="Inquiries" value={isLoading ? "…" : i.total ?? 0} sub={`${i.website ?? 0} website · ${i.in_house ?? 0} in-house`} tint="#FEF2F2" fg={BRAND_RED} />
        <Card icon={Percent} label="Visitor conversion" value={isLoading ? "…" : `${v.conversion_rate ?? 0}%`} sub={`${v.converted ?? 0} converted`} tint="#F0FDF4" fg="#15803D" />
        <Card icon={Percent} label="Inquiry → enrolled" value={isLoading ? "…" : `${i.conversion_rate ?? 0}%`} sub={`${i.enrolled ?? 0} enrolled`} tint="#F5F3FF" fg="#7C3AED" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend */}
        <div className="px-5 py-5 bg-white rounded-xl lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: TEXT_PRIMARY }}>Visitors vs Inquiries — by date</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: TEXT_MUTED }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_MUTED }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" name="Visitors" stroke={BLUE} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="inquiries" name="Inquiries" stroke={BRAND_RED} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Purposes */}
        <div className="px-5 py-5 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: TEXT_PRIMARY }}>Visitors by purpose</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={purposes} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} label={(e) => e.value}>
                  {purposes.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
