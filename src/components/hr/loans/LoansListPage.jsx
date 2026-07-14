import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Search,
  Loader2,
  Plus,
  X,
  ChevronRight,
  Paperclip,
} from "lucide-react";

import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import { HR_LOAN_DETAIL } from "../../routes/RouteConstants";

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

const STATUSES = [
  { key: "active",    label: "Active",    fg: "#15803D", bg: "#F0FDF4" },
  { key: "completed", label: "Completed", fg: "#1D4ED8", bg: "#EFF6FF" },
  { key: "cancelled", label: "Cancelled", fg: "#64748B", bg: "#F1F5F9" },
];

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const thisYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.key === status) || STATUSES[2];
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full"
          style={{ color: s.fg, background: s.bg }}>
      {s.label}
    </span>
  );
}

function NewLoanModal({ onClose, onDone }) {
  const [post] = usePostMutation();
  const [busy, setBusy] = useState(false);
  const [profileUuid, setProfileUuid] = useState("");
  const [principal, setPrincipal] = useState("");
  const [count, setCount] = useState("3");
  const [startMonth, setStartMonth] = useState(thisYearMonth());
  const [reason, setReason] = useState("");
  const [payerType, setPayerType] = useState("office");
  const [fundedAccount, setFundedAccount] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const { data: profilesResp, isFetching: loadingEmp } = useGetQuery({
    path: "employee/profiles?status=active&per_page=200",
  });
  const employees = useMemo(() => profilesResp?.data || [], [profilesResp]);

  const { data: ledgerResp } = useGetQuery({ path: "finance/ledger/account-options" });
  const officeAccts = useMemo(() => (ledgerResp?.data || []).filter((a) => a.is_money), [ledgerResp]);
  const personAccts = useMemo(() => (ledgerResp?.data || []).filter((a) => a.is_person), [ledgerResp]);
  const sourceAccts = payerType === "person" ? personAccts : officeAccts;

  const perInstallment = useMemo(() => {
    const p = parseFloat(principal);
    const c = parseInt(count, 10);
    if (!p || !c || c < 1) return null;
    return Math.round((p / c) * 100) / 100;
  }, [principal, count]);

  const submit = async (e) => {
    e.preventDefault();
    if (!profileUuid) return showToast("error", "Pick an employee.");
    if (!(parseFloat(principal) > 0)) return showToast("error", "Principal must be greater than 0.");
    if (!/^\d{4}-\d{2}$/.test(startMonth)) return showToast("error", "Start month must be YYYY-MM.");
    if (payerType === "person" && !fundedAccount) return showToast("error", "Pick the person who is giving this loan.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("principal_amount", String(parseFloat(principal)));
      fd.append("installment_count", String(parseInt(count, 10)));
      fd.append("start_year_month", startMonth);
      if (reason.trim()) fd.append("reason", reason.trim());
      if (fundedAccount) fd.append("funded_by_account_uuid", fundedAccount);
      if (proofFile) fd.append("proof", proofFile);
      const res = await post({
        path: `employee/profiles/${profileUuid}/loans`,
        body: fd,
      }).unwrap();
      showToast("success", res?.message || "Loan created.");
      onDone?.();
    } catch (err) {
      showToast("error", err?.data?.message || "Could not create loan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(15,23,42,0.55)" }} onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
            className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl">
        <header className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: BORDER, background: SURFACE_ALT }}>
          <h2 className="text-[13px] font-semibold">New loan</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Employee</label>
            <select value={profileUuid} onChange={(e) => setProfileUuid(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }}>
              <option value="">{loadingEmp ? "Loading…" : "Select an employee…"}</option>
              {employees.map((emp) => (
                <option key={emp.uuid} value={emp.uuid}>
                  {emp.full_name || emp.employee_id} — {emp.employee_id}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Principal (PKR)</label>
              <input type="number" min="1" step="1" value={principal} onChange={(e) => setPrincipal(e.target.value)}
                     className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Installments</label>
              <input type="number" min="1" max="60" step="1" value={count} onChange={(e) => setCount(e.target.value)}
                     className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>First deduction month</label>
            <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)}
                   className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Reason (optional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255}
                   className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Given from</label>
            <div className="inline-flex p-0.5 mb-2 rounded-lg" style={{ background: SURFACE_ALT }}>
              {[{ v: "office", l: "Office account" }, { v: "person", l: "A person" }].map((o) => (
                <button key={o.v} type="button"
                        onClick={() => { setPayerType(o.v); setFundedAccount(""); }}
                        className="px-3 py-1.5 text-[12px] font-medium rounded-md"
                        style={payerType === o.v ? { background: "#fff", color: BRAND_RED } : { color: TEXT_MUTED }}>
                  {o.l}
                </button>
              ))}
            </div>
            <select value={fundedAccount} onChange={(e) => setFundedAccount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }}>
              <option value="">{payerType === "person" ? "Select a person…" : "Default cash account"}</option>
              {sourceAccts.map((a) => (
                <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>
              ))}
            </select>
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
              {payerType === "person"
                ? "The person fronting the cash — the office will owe them."
                : "The office account this loan money leaves from."}
            </p>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 text-[12px] border rounded-lg cursor-pointer" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
            <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
          {perInstallment !== null && (
            <div className="p-3 text-[12px] rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              ≈ PKR {fmt(perInstallment)} / month, interest-free. The final installment absorbs any rounding.
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t"
                style={{ borderColor: BORDER, background: SURFACE_ALT }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border rounded-lg"
                  style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button type="submit" disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}>
            {busy && <Loader2 size={14} className="animate-spin" />} Create loan
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function LoansListPage() {
  const user = useSelector(selectCurrentUser);
  const canRead   = hasPermission(user, "get employee-loans");
  const canCreate = hasPermission(user, "create employee-loans");
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showNew, setShowNew] = useState(false);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (status) p.status = status;
    if (q.trim()) p.q = q.trim();
    return p;
  }, [page, perPage, status, q]);

  const { data, isFetching, refetch } = useGetQuery({ path: "employee/loans", params });
  const rows = data?.data || [];
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage };

  if (!canRead) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        You don&apos;t have permission to view loans.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ padding: "28px 28px 60px", fontFamily: "Montserrat, ui-sans-serif, system-ui", color: TEXT_PRIMARY }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Banknote size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Employee Loans</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Interest-free advances · repaid via automatic monthly payroll deductions
            </p>
          </div>
        </div>
        {canCreate && (
          <button type="button" onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ background: BRAND_RED }}>
            <Plus size={16} /> New loan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-4 mb-4 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>Search employee</label>
          <div className="relative">
            <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
            <input type="text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Name or email…"
                   className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[150px]" style={{ borderColor: BORDER }}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        {(q || status) && (
          <button type="button" onClick={() => { setQ(""); setStatus(""); setPage(1); }}
                  className="px-3 py-2 text-xs font-medium border rounded-lg" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        {isFetching ? (
          <div className="flex items-center justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>No loans match these filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-5 py-3">Employee</th>
                <th className="px-3 py-3 text-right">Principal</th>
                <th className="px-3 py-3 text-right">Per month</th>
                <th className="px-3 py-3 text-right">Collected</th>
                <th className="px-3 py-3 text-right">Outstanding</th>
                <th className="px-3 py-3">Start</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uuid} className="border-t cursor-pointer hover:bg-slate-50" style={{ borderColor: BORDER }}
                    onClick={() => navigate(HR_LOAN_DETAIL.replace(":uuid", r.uuid))}>
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.employee?.full_name || "—"}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.employee?.employee_id} · {r.employee?.email}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(r.principal_amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(r.installment_amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(r.collected_amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{fmt(r.outstanding_amount)}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>{r.start_year_month}</td>
                  <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-3 text-right"><ChevronRight size={15} style={{ color: TEXT_MUTED }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SimplePagination
          page={meta.current_page || 1}
          total={meta.total || 0}
          perPage={meta.per_page || perPage}
          onPageChange={setPage}
          onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
        />
      </div>

      {showNew && <NewLoanModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); refetch(); }} />}
    </div>
  );
}
