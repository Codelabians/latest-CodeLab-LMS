import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy, Users, CheckCircle2, Coins, Search, Loader2, Pencil, X, Eye, RotateCcw, Download, TrendingUp,
} from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation } from "../../api/apiSlice";
import SimplePagination from "../ui/SimplePagination";
import ReportModal from "../ui/ReportModal";
import { downloadCSV } from "../../api/fileDownload";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const PROGRAM_LABEL = { brand_ambassador: "Ambassador", alumni: "Alumni" };
const medal = (i) => (i === 0 ? "#D4AF37" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : null);

export default function ReferralLeaderboard() {
  const [program, setProgram] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(null);
  const [detail, setDetail] = useState(null);   // { id, name, code }
  const [editCode, setEditCode] = useState(null); // { uuid, code }
  const [reportOpen, setReportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [topN, setTopN] = useState(0); // 0=all, 3, 10
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [program, debouncedQ, from, to, topN]);

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2600); };

  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (program) p.set("program", program);
    if (debouncedQ) p.set("q", debouncedQ);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (topN) p.set("limit", String(topN));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [program, debouncedQ, from, to, topN]);

  const { data, isLoading, isFetching, refetch } = useGetQuery({
    path: `referrals/leaderboard${queryStr}`,
  });
  const rows = useMemo(() => data?.data || [], [data]);

  // All referrals (for the time-trend chart) — respects date + program.
  const trendQuery = useMemo(() => {
    const p = new URLSearchParams();
    p.set("per_page", "100000");
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [from, to]);
  const { data: refData } = useGetQuery({ path: `referrals?${trendQuery}` });
  const trend = useMemo(() => {
    const list = refData?.data || [];
    const byDay = {};
    list.forEach((r) => {
      const d = (r.created_at || "").slice(0, 10);
      if (!d) return;
      if (!byDay[d]) byDay[d] = { date: d, referrals: 0, conversions: 0 };
      byDay[d].referrals += 1;
      if (r.status === "converted") byDay[d].conversions += 1;
    });
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }, [refData]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  const totals = useMemo(() => ({
    people: rows.length,
    referrals: rows.reduce((s, r) => s + Number(r.referrals_count || 0), 0),
    conversions: rows.reduce((s, r) => s + Number(r.conversions_count || 0), 0),
    earnings: rows.reduce((s, r) => s + Number(r.earnings || 0), 0),
  }), [rows]);

  const topChart = useMemo(
    () => rows.slice(0, 10).map((r) => ({
      name: (r.full_name || r.referral_code || "—").split(" ")[0],
      Referrals: Number(r.referrals_count || 0),
      Conversions: Number(r.conversions_count || 0),
    })),
    [rows]
  );
  const donut = useMemo(() => ([
    { name: "Converted", value: totals.conversions },
    { name: "Pending", value: Math.max(0, totals.referrals - totals.conversions) },
  ]), [totals]);
  const DONUT_COLORS = ["#15803D", "#E2A03F"];


  const [patchCode] = usePatchMutation();
  const saveCode = async () => {
    const code = (editCode.code || "").trim().toUpperCase();
    try {
      await patchCode({ path: `referrals/code/${editCode.uuid}`, body: { referral_code: code } }).unwrap();
      notify("Code updated."); setEditCode(null); refetch();
    } catch (e) { notify(e?.data?.message || "Could not update code.", false); }
  };

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
      <span className="flex items-center justify-center rounded-lg" style={{ width: 38, height: 38, background: `${color}14`, color }}><Icon size={18} /></span>
      <div>
        <div className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div>
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Trophy size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Referral Leaderboard</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Ambassadors & alumni ranked by referrals brought in</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: "#0F172A" }} title="Download report">
            <Download size={15} /> Report
          </button>
          <select value={program} onChange={(e) => { setProgram(e.target.value); setPage(1); }} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
            <option value="">All programs</option>
            <option value="brand_ambassador">Ambassadors</option>
            <option value="alumni">Alumni</option>
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={inputStyle}>
            <Search size={15} style={{ color: TEXT_MUTED }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or code" className="text-sm bg-transparent outline-none" style={{ color: TEXT_PRIMARY, width: 190 }} />
          </div>
        </div>
      </div>

      {/* Reward settings — amount + the benefit blurb shown on the portals */}
      <RewardSettingsCard notify={notify} />

      {/* Secondary filters: date range + top performers */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[{ v: 0, l: "All" }, { v: 3, l: "Top 3" }, { v: 10, l: "Top 10" }].map((o) => (
            <button key={o.v} onClick={() => setTopN(o.v)} className="px-3 py-1.5 text-xs font-semibold rounded-md"
              style={{ color: topN === o.v ? "#fff" : TEXT_SECONDARY, background: topN === o.v ? BRAND : "transparent" }}>{o.l}</button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={inputStyle}>
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm bg-transparent outline-none" style={{ color: TEXT_PRIMARY }} />
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm bg-transparent outline-none" style={{ color: TEXT_PRIMARY }} />
        </div>
        <button type="button" onClick={() => {
          const d = new Date(); const first = new Date(d.getFullYear(), d.getMonth(), 1);
          const fmt = (x) => x.toISOString().slice(0, 10);
          setFrom(fmt(first)); setTo(fmt(d));
        }} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>This month</button>
        <input type="month" onChange={(e) => {
          if (!e.target.value) return;
          const [y, m] = e.target.value.split("-").map(Number);
          const first = new Date(y, m - 1, 1), last = new Date(y, m, 0);
          const fmt = (x) => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
          setFrom(fmt(first)); setTo(fmt(last));
        }} className="px-2 py-1.5 text-sm rounded-lg outline-none" style={inputStyle} title="Pick a month" />
        {(from || to || topN) && (
          <button type="button" onClick={() => { setFrom(""); setTo(""); setTopN(0); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>Clear filters</button>
        )}
        {(from || to) && (
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>Showing referrals {from || "…"} → {to || "…"}</span>
        )}
      </div>

      <div className="grid gap-3 mb-5 sm:grid-cols-4">
        <Stat icon={Users} label="Referrers" value={totals.people} color="#1D4ED8" />
        <Stat icon={Users} label="Total referrals" value={totals.referrals} color="#7C3AED" />
        <Stat icon={CheckCircle2} label="Conversions" value={totals.conversions} color="#15803D" />
        <Stat icon={Coins} label="Total earnings" value={`Rs ${totals.earnings.toLocaleString()}`} color={BRAND} />
      </div>

      <div className="grid gap-4 mb-5 lg:grid-cols-3">
        <div className="bg-white rounded-xl p-4 lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={16} style={{ color: "#7C3AED" }} /><h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Referrals over time</h3></div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRef" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803D" stopOpacity={0.35} /><stop offset="100%" stopColor="#15803D" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: TEXT_MUTED }} tickFormatter={(d) => (d || "").slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: TEXT_MUTED }} />
                <Tooltip />
                <Area type="monotone" dataKey="referrals" name="Referrals" stroke="#7C3AED" fill="url(#gRef)" strokeWidth={2} />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#15803D" fill="url(#gConv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={16} style={{ color: "#15803D" }} /><h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Conversion split</h3></div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {donut.map((e, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-5" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-3"><Trophy size={16} style={{ color: BRAND }} /><h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Top performers</h3></div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={topChart} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: TEXT_MUTED }} interval={0} angle={-15} textAnchor="end" height={42} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: TEXT_MUTED }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Referrals" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Conversions" fill="#15803D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">#</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Ambassador / Alumni</th>
              <th className="px-4 py-3 text-left font-semibold text-[12px]">Code</th>
              <th className="px-4 py-3 text-right font-semibold text-[12px]">Referrals</th>
              <th className="px-4 py-3 text-right font-semibold text-[12px]">Conversions</th>
              <th className="px-4 py-3 text-right font-semibold text-[12px]">Earnings</th>
              <th className="px-4 py-3 text-right font-semibold text-[12px]"></th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || isFetching) && (
              <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}><Loader2 className="inline animate-spin" size={18} /> Loading…</td></tr>
            )}
            {!isLoading && !isFetching && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>No referrers yet. Codes are issued when you approve an ambassador or alumni.</td></tr>
            )}
            {!isLoading && !isFetching && pagedRows.map((r, idx) => {
              const i = (page - 1) * perPage + idx;
              return (
              <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center font-bold rounded-full" style={{ width: 26, height: 26, fontSize: 12, background: medal(i) ? `${medal(i)}22` : SURFACE_HOVER, color: medal(i) || TEXT_MUTED }}>{i + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {r.photo_url
                      ? <img src={r.photo_url} alt="" className="object-cover rounded-full" style={{ width: 32, height: 32 }} />
                      : <span className="grid rounded-full place-items-center text-white font-bold" style={{ width: 32, height: 32, background: BRAND, fontSize: 13 }}>{(r.full_name || "?").charAt(0)}</span>}
                    <div>
                      <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.full_name}</div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{(PROGRAM_LABEL[r.program] || r.program)}{r.email ? ` · ${r.email}` : ""}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-md font-mono text-[12px] font-bold" style={{ background: "#FEF2F2", color: BRAND }}>{r.referral_code}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: TEXT_PRIMARY }}>{r.referrals_count}</td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: "#15803D" }}>{r.conversions_count}</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: BRAND }}>Rs {Number(r.earnings || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setDetail({ id: r.id, name: r.full_name, code: r.referral_code })} title="View referrals"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><Eye size={14} /> View</button>
                    <button onClick={() => setEditCode({ uuid: r.application_uuid, code: r.referral_code })} title="Edit code"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={14} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={rows.length} perPage={perPage}
            onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>

      {detail && <DetailModal detail={detail} onClose={() => setDetail(null)} notify={notify} onChanged={refetch} />}

      {editCode && (
        <Modal title="Edit referral code" onClose={() => setEditCode(null)}>
          <input value={editCode.code} onChange={(e) => setEditCode({ ...editCode, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none font-mono" style={inputStyle} placeholder="CODE" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEditCode(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
            <button onClick={saveCode} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND }}>Save</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed z-50 px-4 py-3 text-sm font-semibold text-white rounded-lg shadow-lg bottom-6 right-6" style={{ background: toast.ok ? "#15803D" : BRAND }}>{toast.msg}</div>
      )}
    </div>
  );
}

function DetailModal({ detail, onClose, notify, onChanged }) {
  const { data, isLoading, refetch } = useGetQuery({ path: `referrals?program_application_id=${detail.id}&per_page=1000` });
  const rows = data?.data || [];
  const [convert] = usePostMutation();

  const mark = async (id, revert = false) => {
    try {
      await convert({ path: `referrals/${id}/${revert ? "revert" : "convert"}`, body: {} }).unwrap();
      notify(revert ? "Reverted to pending." : "Marked converted — reward credited.");
      refetch(); onChanged && onChanged();
    } catch (e) { notify(e?.data?.message || "Action failed.", false); }
  };

  const downloadDetail = () => {
    if (!rows.length) { notify("No referrals to export.", false); return; }
    const cols = [
      { label: "Lead name", key: "lead_name" },
      { label: "Email", key: "lead_email" },
      { label: "Phone", key: "lead_phone" },
      { label: "Type", key: "lead_type" },
      { label: "Date", map: (r) => (r.created_at || "").slice(0, 10) },
      { label: "Status", key: "status" },
      { label: "Reward (Rs)", key: "reward_amount" },
    ];
    const safe = (detail.name || "ambassador").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadCSV(rows, cols, `referrals_${safe}_${detail.code || ""}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,6,23,.5)" }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>{detail.name}</h3>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Referrals for code <span className="font-mono font-bold" style={{ color: BRAND }}>{detail.code}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadDetail} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: "#0F172A" }} title="Download this person's referrals">
              <Download size={14} /> Report
            </button>
            <button onClick={onClose} className="grid w-8 h-8 rounded-lg place-items-center" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 64px)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                <th className="px-4 py-2.5 text-left font-semibold text-[12px]">Lead</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[12px]">Type</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[12px]">When</th>
                <th className="px-4 py-2.5 text-left font-semibold text-[12px]">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[12px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: TEXT_MUTED }}><Loader2 className="inline animate-spin" size={16} /> Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: TEXT_MUTED }}>No referrals yet.</td></tr>}
              {!isLoading && rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.lead_name || "—"}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.lead_email || r.lead_phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: TEXT_SECONDARY }}>{r.lead_type}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: TEXT_MUTED }}>{(r.created_at || "").slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    {r.status === "converted"
                      ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#15803D" }}><CheckCircle2 size={14} /> Converted{Number(r.reward_amount) > 0 ? ` · Rs ${Number(r.reward_amount).toLocaleString()}` : ""}</span>
                      : <span className="text-[12px] font-semibold" style={{ color: "#B45309" }}>Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "converted"
                      ? <button onClick={() => mark(r.id, true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><RotateCcw size={13} /> Revert</button>
                      : <button onClick={() => mark(r.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-white rounded-lg" style={{ background: "#15803D" }}><CheckCircle2 size={13} /> Mark paid</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin reward configuration — sets the cash reward amount AND the benefit
 * blurb that students & teachers see on their portal rewards view.
 * Reads/writes /core/referral-settings.
 */
function RewardSettingsCard({ notify }) {
  const { data, refetch } = useGetQuery({ path: "/core/referral-settings" }, { refetchOnMountOrArgChange: true });
  const [patch, { isLoading }] = usePatchMutation();
  const [amount, setAmount] = useState("");
  const [text, setText] = useState("");
  const [milestone, setMilestone] = useState("");
  const [open, setOpen] = useState(false);
  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  useEffect(() => {
    if (data?.data) {
      setAmount(String(data.data.reward_amount ?? ""));
      setText(data.data.benefit_text ?? "");
      setMilestone(String(data.data.milestone_count ?? ""));
    }
  }, [data]);

  const save = async () => {
    try {
      await patch({
        path: "/core/referral-settings",
        body: { reward_amount: Number(amount) || undefined, benefit_text: text, milestone_count: Number(milestone) || undefined },
      }).unwrap();
      notify?.("Reward settings saved.");
      refetch();
    } catch (e) {
      notify?.(e?.data?.message || "Could not save settings.", false);
    }
  };

  return (
    <div className="mb-5 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5">
        <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>
          <Coins size={16} style={{ color: BRAND }} /> Reward settings
        </span>
        <span className="text-[12px]" style={{ color: TEXT_MUTED }}>{open ? "Hide" : "Edit"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Cash reward per referral (Rs)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Auto-ambassador after (referrals)</label>
              <input type="number" min="1" value={milestone} onChange={(e) => setMilestone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>Enrolled referrals that auto-promote to Brand Ambassador.</p>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Benefit text (portals)</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000}
                placeholder="Describe how referral rewards work…"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-y" style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ background: BRAND }}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,6,23,.5)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <h3 className="text-base font-bold mb-3" style={{ color: TEXT_PRIMARY }}>{title}</h3>
        {children}
      </div>
      <ReportModal
        open={reportOpen} onClose={() => setReportOpen(false)}
        title="Download Referral Report" path="referrals/leaderboard" filenameBase="referral-leaderboard"
        initialValues={{ program, from, to, limit: topN ? String(topN) : "" }}
        fields={[
          { type: "select", key: "program", label: "Program", options: [{ value: "", label: "All programs" }, { value: "brand_ambassador", label: "Ambassadors" }, { value: "alumni", label: "Alumni" }] },
          { type: "select", key: "limit", label: "How many", options: [{ value: "", label: "All performers" }, { value: "3", label: "Top 3" }, { value: "10", label: "Top 10" }] },
          { type: "date", key: "from", label: "From date" },
          { type: "date", key: "to", label: "To date" },
        ]}
        buildParams={(v) => ({ program: v.program || undefined, from: v.from || undefined, to: v.to || undefined, limit: v.limit || undefined })}
        columns={[
          { label: "Name", key: "full_name" },
          { label: "Email", key: "email" },
          { label: "Program", map: (r) => (r.program === "alumni" ? "Alumni" : "Brand Ambassador") },
          { label: "Code", key: "referral_code" },
          { label: "Referrals", key: "referrals_count" },
          { label: "Conversions", key: "conversions_count" },
          { label: "Earnings (Rs)", key: "earnings" },
        ]}
      />
    </div>
  );
}
