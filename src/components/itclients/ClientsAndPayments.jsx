import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Wallet, Receipt, AlertCircle, Users, FileText, ArrowRight } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import { IT_INVOICES } from "../routes/RouteConstants";

const BRAND = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const fmtDate = (s) => (s ? String(s).slice(0, 10) : "—");

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
      <span className="grid place-items-center rounded-lg" style={{ width: 40, height: 40, background: "#FEF2F2", color: color || BRAND }}>
        <Icon size={19} />
      </span>
      <div>
        <div className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div>
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
      </div>
    </div>
  );
}

export default function ClientsAndPayments() {
  const { data, isLoading, error } = useGetQuery({ path: "clients/invoices/clients-summary" }, { refetchOnMountOrArgChange: true });
  const [q, setQ] = useState("");

  const totals = data?.data?.totals || { clients: 0, invoiced: 0, paid: 0, outstanding: 0, invoices: 0 };
  const clients = data?.data?.clients || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) =>
      (c.name || "").toLowerCase().includes(term) || (c.company_name || "").toLowerCase().includes(term));
  }, [clients, q]);

  const collectionRate = totals.invoiced > 0 ? Math.round((totals.paid / totals.invoiced) * 100) : 0;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}><Wallet size={20} /> Clients &amp; Payments</h1>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Per-client billing roll-up — invoiced, collected and outstanding across IT Solutions.</p>
        </div>
        <Link to={IT_INVOICES} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
          <FileText size={14} /> All invoices
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Receipt} label="Total invoiced" value={money(totals.invoiced)} />
        <StatCard icon={Wallet} label={`Collected · ${collectionRate}%`} value={money(totals.paid)} color="#15803D" />
        <StatCard icon={AlertCircle} label="Outstanding" value={money(totals.outstanding)} color="#C2410C" />
        <StatCard icon={Users} label={`Clients · ${totals.invoices} invoices`} value={totals.clients} color="#1D4ED8" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client or company…"
          className="px-3 py-2 rounded-lg text-[12.5px] outline-none"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: 280 }} />
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-[13px]" style={{ color: BRAND }}>Could not load the summary.</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No clients to show yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                  {["Client", "Invoices", "Invoiced", "Collected", "Outstanding", "Last invoice", ""].map((h, i) => (
                    <th key={i} className={`px-4 py-2.5 font-semibold text-[11px] ${i >= 1 && i <= 4 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{c.name || "—"}</div>
                      {c.company_name ? <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{c.company_name}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: TEXT_SECONDARY }}>{c.invoices}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: TEXT_PRIMARY }}>{money(c.invoiced)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "#15803D" }}>{money(c.paid)}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: c.outstanding > 0 ? "#C2410C" : TEXT_MUTED }}>
                      {money(c.outstanding)}
                      {c.unpaid_count > 0 ? <span className="ml-1 text-[10px] font-semibold" style={{ color: TEXT_MUTED }}>({c.unpaid_count})</span> : null}
                    </td>
                    <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>{fmtDate(c.last_invoice_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`${IT_INVOICES}?client=${encodeURIComponent(c.uuid)}`} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BRAND }}>
                        Invoices <ArrowRight size={12} />
                      </Link>
                    </td>
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
