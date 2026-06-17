import { useMemo, useState } from "react";
import {
  Fuel, Wallet, Users, ArrowLeft, Loader2, CalendarClock, ListChecks,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

/* ---- tokens (match Finance Stats) ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const ORANGE = "#C2410C";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

function Kpi({ icon: Icon, label, value, color = TEXT_PRIMARY, tint = SURFACE }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2">
        <span className="grid place-items-center rounded-lg" style={{ width: 30, height: 30, background: tint, color }}><Icon size={15} /></span>
        <span className="text-[11.5px] font-semibold" style={{ color: TEXT_MUTED }}>{label}</span>
      </div>
      <div className="text-[22px] font-bold mt-2" style={{ color }}>{value}</div>
    </div>
  );
}

/* Drill-in: one person's payouts across all expense categories. */
function PersonDetail({ person, from, to, onBack }) {
  const { data, isLoading } = useGetQuery(
    { path: `finance/employee-payouts/${person.user_uuid}`, params: { from: from || undefined, to: to || undefined } },
    { skip: !person.user_uuid, refetchOnMountOrArgChange: true }
  );
  const d = data?.data || {};
  const byCat = d.by_category || [];
  const recent = d.recent || [];

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <button onClick={onBack} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
        <span className="grid rounded-full place-items-center text-[12px] font-bold" style={{ width: 36, height: 36, background: SURFACE, color: TEXT_SECONDARY }}>{initials(person.name)}</span>
        <div>
          <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{person.name}</h2>
          <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Everything paid out to this person</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Kpi icon={Wallet} label="Total paid out" value={money(d.total)} color={TEXT_PRIMARY} />
            <Kpi icon={Fuel} label="Fuel total" value={money(d.fuel_total)} color={ORANGE} tint="#FFF7ED" />
            <Kpi icon={ListChecks} label="Categories" value={byCat.length} color={BLUE} tint="#EFF6FF" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>By category</h3>
              {byCat.length === 0 ? <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No payouts in range.</div> : (
                byCat.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i ? `1px solid ${BORDER}` : "none" }}>
                    <span className="text-[12.5px] font-semibold" style={{ color: TEXT_PRIMARY }}>{c.category} <span className="text-[11px] font-normal" style={{ color: TEXT_MUTED }}>· {c.count}</span></span>
                    <span className="text-[12.5px] font-bold" style={{ color: GREEN }}>{money(c.total)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>Recent payouts</h3>
              {recent.length === 0 ? <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No payouts in range.</div> : (
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {recent.map((r, i) => (
                    <div key={r.uuid} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i ? `1px solid ${BORDER}` : "none" }}>
                      <div>
                        <div className="text-[12.5px] font-semibold" style={{ color: TEXT_PRIMARY }}>{r.category}</div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.date}{r.description ? ` · ${r.description}` : ""}</div>
                      </div>
                      <span className="text-[12.5px] font-bold tabular-nums" style={{ color: ORANGE }}>{money(r.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function EmployeePayouts() {
  const today = new Date().toISOString().slice(0, 10);
  const [category, setCategory] = useState("fuel");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [person, setPerson] = useState(null);

  const { data: catData } = useGetQuery({ path: "finance/categories/expense" });
  const catOptions = (catData?.data || []).map((c) => ({ value: c.key, label: c.name }));

  const params = useMemo(() => {
    const p = { category };
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [category, from, to]);

  const { data, isLoading, isFetching } = useGetQuery(
    { path: "finance/expense-by-payee", params },
    { refetchOnMountOrArgChange: true }
  );
  const d = data?.data || {};
  const rows = d.rows || [];
  const catLabel = catOptions.find((o) => o.value === category)?.label || category;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Fuel size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Employee Payouts</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>What each person received from us (fuel, bonuses, reimbursements…) {isFetching && !person && <span style={{ color: BRAND }}>· updating…</span>}</p>
          </div>
        </div>
        {!person && (
          <div className="flex flex-wrap items-center gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 text-[12px] font-semibold rounded-lg outline-none" style={field}>
              {catOptions.length === 0 && <option value="fuel">Fuel</option>}
              {catOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className="px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            <span style={{ color: TEXT_MUTED }}>→</span>
            <input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="px-2 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
        )}
      </div>

      {person ? (
        <PersonDetail person={person} from={from} to={to} onBack={() => setPerson(null)} />
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Kpi icon={Wallet} label={`Total ${catLabel}`} value={money(d.total)} color={ORANGE} tint="#FFF7ED" />
            <Kpi icon={Users} label="People paid" value={rows.length} color={BLUE} tint="#EFF6FF" />
          </div>

          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>{catLabel} by employee</h3>
            {rows.length === 0 ? (
              <div className="py-12 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No {catLabel.toLowerCase()} payouts recorded{from || to ? " in this range" : ""}.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                    {["Employee", "Payments", "Last paid", `Total ${catLabel}`].map((h, i) => <th key={i} className={`px-4 py-2 font-semibold text-[11px] ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id} onClick={() => r.user_uuid && setPerson(r)} className="cursor-pointer hover:bg-slate-50" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid rounded-full place-items-center text-[10px] font-bold" style={{ width: 28, height: 28, background: SURFACE, color: TEXT_SECONDARY }}>{initials(r.name)}</span>
                          <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.count}</td>
                      <td className="px-4 py-2.5 inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}><CalendarClock size={12} /> {r.last_paid || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: ORANGE }}>{money(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
