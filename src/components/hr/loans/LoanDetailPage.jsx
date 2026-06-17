import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Banknote, Loader2, Ban } from "lucide-react";

import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_LOANS } from "../../routes/RouteConstants";

const BRAND_RED      = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED     = "#94A3B8";
const BORDER         = "#EEF2F6";
const SURFACE_ALT    = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const INST_STATUS = {
  scheduled: { label: "Scheduled", fg: "#A16207", bg: "#FEFCE8" },
  committed: { label: "Committed", fg: "#15803D", bg: "#F0FDF4" },
  deferred:  { label: "Deferred",  fg: "#1D4ED8", bg: "#EFF6FF" },
  waived:    { label: "Waived",    fg: "#7C3AED", bg: "#F5F3FF" },
  cancelled: { label: "Cancelled", fg: "#64748B", bg: "#F1F5F9" },
};

function Stat({ label, value, strong }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>{label}</div>
      <div className={`tabular-nums ${strong ? "text-lg font-semibold" : "text-sm"}`}
           style={{ color: strong ? BRAND_RED : TEXT_PRIMARY }}>
        PKR {value}
      </div>
    </div>
  );
}

export default function LoanDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const canUpdate = hasPermission(user, "update employee-loans");

  const { data, isFetching, refetch } = useGetQuery({ path: `employee/loans/${uuid}` });
  const [post] = usePostMutation();
  const [busyId, setBusyId] = useState(null);

  const loan = data?.data;

  const act = async (path, okMsg) => {
    setBusyId(path);
    try {
      const res = await post({ path, body: {} }).unwrap();
      showToast("success", res?.message || okMsg);
      refetch();
    } catch (err) {
      showToast("error", err?.data?.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (isFetching && !loan) {
    return <div className="flex items-center justify-center p-16"><Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} /></div>;
  }
  if (!loan) {
    return <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>Loan not found.</div>;
  }

  const installments = loan.installments || [];

  return (
    <div className="w-full" style={{ padding: "28px 28px 60px", fontFamily: "Montserrat, ui-sans-serif, system-ui", color: TEXT_PRIMARY }}>
      <button type="button" onClick={() => navigate(HR_LOANS)}
              className="inline-flex items-center gap-1.5 mb-4 text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
        <ArrowLeft size={14} /> Back to loans
      </button>

      {/* Header card */}
      <div className="p-5 mb-5 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Banknote size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{loan.employee?.full_name || "—"}</h1>
              <p className="text-xs" style={{ color: TEXT_MUTED }}>
                {loan.employee?.employee_id} · {loan.installment_count} installments · starts {loan.start_year_month}
                {loan.reason ? ` · ${loan.reason}` : ""}
              </p>
            </div>
          </div>
          {canUpdate && loan.status === "active" && (
            <button type="button" disabled={busyId === `employee/loans/${uuid}/cancel`}
                    onClick={() => act(`employee/loans/${uuid}/cancel`, "Loan cancelled.")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg"
                    style={{ borderColor: BORDER, color: "#B91C1C" }}>
              <Ban size={13} /> Cancel loan
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5 sm:grid-cols-4">
          <Stat label="Principal" value={fmt(loan.principal_amount)} />
          <Stat label="Per month" value={fmt(loan.installment_amount)} />
          <Stat label="Collected" value={fmt(loan.collected_amount)} />
          <Stat label="Outstanding" value={fmt(loan.outstanding_amount)} strong />
        </div>
      </div>

      {/* Schedule */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        <div className="px-5 py-3 text-[13px] font-semibold border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
          Repayment schedule
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: SURFACE_ALT }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3">#</th>
              <th className="px-3 py-3">Due month</th>
              <th className="px-3 py-3 text-right">Amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Committed</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {installments.map((i) => {
              const st = INST_STATUS[i.status] || INST_STATUS.scheduled;
              return (
                <tr key={i.uuid} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3 tabular-nums">{i.sequence}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>{i.due_year_month}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(i.amount)}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full"
                          style={{ color: st.fg, background: st.bg }}>{st.label}</span>
                    {i.note && <div className="text-[10px] mt-0.5 italic" style={{ color: TEXT_MUTED }}>{i.note}</div>}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_MUTED }}>{i.committed_at ? i.committed_at.slice(0, 10) : "—"}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {canUpdate && i.status === "scheduled" && (
                      <>
                        <button type="button" disabled={busyId === `employee/loan-installments/${i.uuid}/defer`}
                                onClick={() => act(`employee/loan-installments/${i.uuid}/defer`, "Installment deferred.")}
                                className="px-2 py-1 text-[11px] font-medium border rounded mr-1"
                                style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Defer</button>
                        <button type="button" disabled={busyId === `employee/loan-installments/${i.uuid}/waive`}
                                onClick={() => act(`employee/loan-installments/${i.uuid}/waive`, "Installment waived.")}
                                className="px-2 py-1 text-[11px] font-medium border rounded"
                                style={{ borderColor: BORDER, color: "#7C3AED" }}>Waive</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
