import { Fragment, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, BookOpen, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const API_URL = import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const METHOD = { cash: "Cash", jazzcash: "JazzCash", easypaisa: "EasyPaisa", bank_transfer: "Bank Transfer", cheque: "Cheque", other: "Other" };
const STATUS = { paid: { bg: "#F0FDF4", fg: "#15803D" }, pending: { bg: "#FFFBEB", fg: "#B45309" }, overdue: { bg: "#FEF2F2", fg: BRAND } };
const fmtDateTime = (v) => {
  if (!v) return "—";
  const dt = new Date(String(v).replace(" ", "T"));
  return Number.isNaN(dt.getTime()) ? v : dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function PortalFees() {
  // The profile payload's enrollments carry the full fee schedule
  // including the per-payment ledger (method/date/reference/notes).
  const { data, isLoading } = useGetQuery({ path: "/student-portal/profile" });
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(null);
  const token = useSelector((s) => s.auth?.token);
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const downloadChallan = async (uuid) => {
    if (!uuid) return;
    setBusy(uuid);
    try {
      const res = await fetch(`${API_URL}student-portal/installments/${uuid}/challan`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { alert("Your challan isn't available yet."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `challan-${uuid}.pdf`; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert("Could not download the challan."); }
    finally { setBusy(null); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const enrollments = data?.data?.enrollments || [];
  const sum = data?.data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[["Billed", sum.billed, "#0F172A"], ["Paid", sum.collected, "#15803D"], ["Pending", sum.pending, BRAND]].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-[17px] font-bold" style={{ color: c }}>{money(v)}</div>
            <div className="text-[11px]" style={{ color: "#94A3B8" }}>{l}</div>
          </div>
        ))}
      </div>

      {enrollments.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No fees yet.</div>}

      {enrollments.map((e, i) => {
        const schedule = e.fees?.schedule || [];
        return (
          <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="grid place-items-center rounded-lg" style={{ width: 28, height: 28, background: "#FEF2F2", color: BRAND }}><BookOpen size={14} /></span>
              <div className="font-bold text-[13px]" style={{ color: "#0F172A" }}>{e.course?.name || "—"} <span className="font-normal text-[11px]" style={{ color: "#94A3B8" }}>· {e.batch?.name}</span></div>
            </div>
            {schedule.length === 0 ? (
              <div className="text-[12px]" style={{ color: "#94A3B8" }}>No fee schedule.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr style={{ color: "#475569" }}>{["Fee", "Amount", "Paid", "Due", "Status", "Paid via"].map((h, j) => <th key={j} className="px-2 py-1.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {schedule.map((r, j) => {
                      const st = STATUS[r.status] || STATUS.pending;
                      const payments = r.payments || [];
                      const methods = [...new Set(payments.map((p) => p.payment_method))];
                      const rowKey = `${i}-${j}`;
                      const isOpen = !!open[rowKey];
                      return (
                        <Fragment key={j}>
                          <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                            <td className="px-2 py-2" style={{ color: "#0F172A" }}>
                              <button onClick={() => payments.length && toggle(rowKey)} className="inline-flex items-center gap-1" style={{ cursor: payments.length ? "pointer" : "default", color: "#0F172A" }}>
                                {payments.length > 0 && (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                                {r.type}
                              </button>
                            </td>
                            <td className="px-2 py-2" style={{ color: "#0F172A" }}>{money(r.amount)}</td>
                            <td className="px-2 py-2" style={{ color: "#475569" }}>{money(r.paid)}{r.remaining > 0 && r.paid > 0 ? <span className="block text-[10px]" style={{ color: BRAND }}>{money(r.remaining)} left</span> : null}</td>
                            <td className="px-2 py-2" style={{ color: "#94A3B8" }}>{(r.due_date || "").slice(0, 10) || "—"}</td>
                            <td className="px-2 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ background: st.bg, color: st.fg }}>{r.status}</span></td>
                            <td className="px-2 py-2" style={{ color: "#475569" }}>
                              <div className="flex items-center gap-2">
                                <span>{methods.length ? methods.map((m) => METHOD[m] || m).join(", ") : "—"}</span>
                                {r.installment_uuid && (
                                  <button onClick={() => downloadChallan(r.installment_uuid)} disabled={busy === r.installment_uuid} title={r.status === "paid" ? "Download paid challan" : "Download challan"}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND, opacity: busy === r.installment_uuid ? 0.5 : 1 }}>
                                    {busy === r.installment_uuid ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Challan
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isOpen && payments.length > 0 && (
                            <tr style={{ background: "#F8FAFC" }}>
                              <td colSpan={6} className="px-3 py-2">
                                <table className="w-full text-[11px]">
                                  <thead><tr style={{ color: "#94A3B8" }}>{["Amount", "Method", "When paid", "Reference", "Received by", "Notes"].map((h, k) => <th key={k} className="px-2 py-1 text-left font-semibold text-[10px]">{h}</th>)}</tr></thead>
                                  <tbody>
                                    {payments.map((p, k) => (
                                      <tr key={p.uuid || k} style={{ borderTop: `1px solid ${BORDER}` }}>
                                        <td className="px-2 py-1.5 font-semibold" style={{ color: "#0F172A" }}>{money(p.amount)}</td>
                                        <td className="px-2 py-1.5" style={{ color: "#475569" }}>
                                          {METHOD[p.payment_method] || p.payment_method}
                                          {p.account_name && <span className="block text-[10px]" style={{ color: "#94A3B8" }}>{p.account_name}</span>}
                                        </td>
                                        <td className="px-2 py-1.5" style={{ color: "#475569" }}>{fmtDateTime(p.paid_at)}</td>
                                        <td className="px-2 py-1.5" style={{ color: "#475569" }}>{p.payment_reference || "—"}</td>
                                        <td className="px-2 py-1.5" style={{ color: "#475569" }}>{p.recorded_by || "—"}</td>
                                        <td className="px-2 py-1.5" style={{ color: "#475569" }}>{p.notes || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
