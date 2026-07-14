import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Wallet,
  ArrowLeft,
  Play,
  Lock,
  CheckCircle2,
  CircleDot,
  Loader2,
  RefreshCw,
  Search,
  PlusCircle,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gift,
  Download,
  Pencil,
  Paperclip,
  CalendarRange,
  Trash2,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { HR_PAYROLL_CYCLES } from "../../routes/RouteConstants";
import { showToast } from "../../ui/common/ShowToast";

const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

// Engine block codes → human text. Falls back to the raw reason for any
// code we don't have a friendly label for.
const BLOCK_REASONS = {
  no_signed_contract: "No signed contract on file",
  employee_inactive:  "Employee is not active",
};
const blockedLabel = (code) => (code ? (BLOCK_REASONS[code] || code) : "Blocked");

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const STATUS_META = {
  open:       { label: "Open",       fg: "#1D4ED8", bg: "#EFF6FF", icon: CircleDot },
  proposed:   { label: "Proposed",   fg: "#A16207", bg: "#FEFCE8", icon: CircleDot },
  processing: { label: "Processing", fg: "#9333EA", bg: "#F5F3FF", icon: Loader2 },
  finalized:  { label: "Finalized",  fg: "#0E7490", bg: "#ECFEFF", icon: Lock },
  paid:       { label: "Paid",       fg: "#15803D", bg: "#F0FDF4", icon: CheckCircle2 },
};

const SAL_STATUS_META = {
  pending: { label: "Pending", fg: "#A16207", bg: "#FEFCE8" },
  blocked: { label: "Blocked", fg: "#B91C1C", bg: "#FEF2F2" },
  locked:  { label: "Locked",  fg: "#0E7490", bg: "#ECFEFF" },
  paid:    { label: "Paid",    fg: "#15803D", bg: "#F0FDF4" },
  partial: { label: "Partially paid", fg: "#C2410C", bg: "#FFF7ED" },
  unpaid:  { label: "Unpaid",  fg: "#0E7490", bg: "#ECFEFF" },
};

// Display status that reflects actual disbursement, not just the raw row
// status: Blocked → Paid (fully) → Partially paid → Unpaid/Pending.
function salaryDisplayStatus(salary) {
  if (salary.status === "blocked") return "blocked";
  const net  = Number(salary.net_payable) || 0;
  const paid = Number(salary.paid_so_far) || 0;
  const remaining = Number(salary.remaining ?? (net - paid));
  if (salary.status === "paid" || (net > 0 && remaining <= 0.001 && paid > 0)) return "paid";
  if (paid > 0 && remaining > 0.001) return "partial";
  // Nothing paid yet. While the cycle is still open/proposed it's "Pending";
  // once finalized it's payable but unpaid.
  return salary.status === "pending" ? "pending" : "unpaid";
}

const DEDUCTION_TYPES = [
  { value: "late",               label: "Late" },
  { value: "absence",            label: "Absence" },
  { value: "break_overrun",      label: "Break overrun" },
  { value: "loan",               label: "Loan installment" },
  { value: "security_retention", label: "Security retention" },
  { value: "manual_other",       label: "Other" },
];
const ALLOWANCE_TYPES = [
  { value: "fuel",               label: "Fuel" },
  { value: "conveyance",         label: "Conveyance" },
  { value: "ride_reimbursement", label: "Ride reimbursement" },
  { value: "other",              label: "Other" },
];
const BONUS_TYPES = [
  { value: "eid",         label: "Eid" },
  { value: "annual",      label: "Annual" },
  { value: "performance", label: "Performance" },
  { value: "spot",        label: "Spot" },
  { value: "other",       label: "Other" },
];

function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtYearMonth(ym) {
  if (!ym || ym.length !== 7) return ym || "—";
  const [y, m] = ym.split("-");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[parseInt(m, 10) - 1] || m} ${y}`;
}

function StatusChip({ status, meta }) {
  const m = (meta || STATUS_META)[status] || STATUS_META.open;
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
      style={{ color: m.fg, background: m.bg }}
    >
      {Icon && <Icon size={11} className={status === "processing" ? "animate-spin" : ""} />}
      {m.label}
    </span>
  );
}

/* ─────────── Modals ─────────── */

function LineItemModal({ title, types, onClose, onSubmit, fields = [] }) {
  const [type, setType] = useState(types[0]?.value || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!type || !(a >= 0)) {
      showToast("error", "Type + amount are required.");
      return;
    }
    setBusy(true);
    try {
      const body = { type, amount: a };
      if (fields.includes("reason") && reason) body.reason = reason;
      if (fields.includes("note") && note)     body.note = note;
      await onSubmit(body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl"
      >
        <header
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Amount (PKR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              required
            />
          </div>
          {fields.includes("reason") && (
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                style={{ borderColor: BORDER }}
              />
            </div>
          )}
          {fields.includes("note") && (
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
                Note
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                style={{ borderColor: BORDER }}
              />
            </div>
          )}
        </div>
        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Add
          </button>
        </footer>
      </form>
    </div>
  );
}

function ChangeMonthModal({ current, onClose, onSubmit }) {
  const [ym, setYm] = useState(current || "");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) { showToast("error", "Pick a valid month."); return; }
    setSaving(true);
    try { await onSubmit(ym); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-[13px] font-semibold">Change cycle month</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={14} /></button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Move this cycle and all of its salaries to a different month. The target month must not already have a cycle.</p>
          <label className="block">
            <span className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Month</span>
            <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: BORDER }}>
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[12px] rounded-lg" style={{ color: TEXT_MUTED }}>Cancel</button>
          <button type="button" onClick={submit} disabled={saving} className="px-4 py-1.5 text-[12px] font-medium text-white rounded-lg inline-flex items-center gap-1" style={{ background: BRAND_RED, opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 size={12} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkPaidModal({ onClose, onSubmit }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Bank transfer");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ payment_date: date, payment_method: method });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl"
      >
        <header
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <h2 className="text-[13px] font-semibold">Mark cycle paid</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Payment date
            </label>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }} required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Method
            </label>
            <select
              value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            >
              <option>Bank transfer</option>
              <option>Cash</option>
              <option>JazzCash</option>
              <option>EasyPaisa</option>
              <option>Cheque</option>
            </select>
          </div>
        </div>
        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Mark paid
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────── Split salary disbursement modal ─────────── */

const PAY_METHODS = [
  { value: "cash",          label: "Cash" },
  { value: "jazzcash",      label: "JazzCash" },
  { value: "easypaisa",     label: "EasyPaisa" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque",        label: "Cheque" },
  { value: "other",         label: "Other" },
];

function SalaryPaymentModal({ salary, accounts, onClose, onSubmit }) {
  const remaining = Number(salary.remaining ?? salary.net_payable) || 0;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState(() => [
    { amount: remaining > 0 ? String(remaining) : "", payment_method: "cash", payment_account_uuid: "", payer_type: "office", funded_by_account_uuid: "", dest_account_uuid: "", dest_temp_title: "", dest_temp_number: "", dest_temp_bank: "", dest_save: false, payment_reference: "", notes: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  // Ledger accounts (cash/bank/person) so a payment can be tagged with who
  // actually funded it — office money, or a person who paid from their pocket.
  const { data: ledgerResp } = useGetQuery({ path: "finance/ledger/accounts" });
  const ledgerAccounts = ledgerResp?.data || [];
  const personAccts = ledgerAccounts.filter((a) => a.is_person);

  // Employee's saved destination accounts (where salary is sent).
  const { data: payoutResp, refetch: refetchPayouts } = useGetQuery({ path: `employee/payroll/salaries/${salary.uuid}/payout-accounts` });
  const payoutAccounts = payoutResp?.data || [];
  const [savePayout] = usePostMutation();

  const setLine = (i, key, val) =>
    setLines((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addLine = () =>
    setLines((rows) => [...rows, { amount: "", payment_method: "cash", payment_account_uuid: "", payer_type: "office", funded_by_account_uuid: "", dest_account_uuid: "", dest_temp_title: "", dest_temp_number: "", dest_temp_bank: "", dest_save: false, payment_reference: "", notes: "" }]);
  const removeLine = (i) => setLines((rows) => rows.filter((_, idx) => idx !== i));

  const sum = lines.reduce((t, r) => t + (parseFloat(r.amount) || 0), 0);
  const over = sum > remaining + 0.001;

  const submit = async (e) => {
    e.preventDefault();
    const valid = lines.filter((r) => parseFloat(r.amount) > 0);
    if (valid.length === 0) {
      showToast("Add at least one payment line with an amount.", "error");
      return;
    }
    if (over) {
      showToast("Total exceeds the remaining amount.", "error");
      return;
    }
    setBusy(true);
    try {
      const payments = [];
      for (const r of valid) {
        const p = {
          amount: parseFloat(r.amount),
          payment_method: r.payment_method,
          payment_account_uuid: r.payment_account_uuid || undefined,
          funded_by_account_uuid: r.funded_by_account_uuid || undefined,
          payment_reference: r.payment_reference || undefined,
          notes: r.notes || undefined,
        };
        // Destination — only for non-cash lines.
        if (r.payment_method !== "cash" && r.dest_account_uuid) {
          if (r.dest_account_uuid !== "__temp__") {
            const acc = payoutAccounts.find((a) => a.payout_account_uuid === r.dest_account_uuid);
            p.destination_payout_account_uuid = r.dest_account_uuid;
            p.destination_label = acc?.display;
          } else {
            const label = [r.dest_temp_bank, r.dest_temp_number].filter(Boolean).join(" ") || r.dest_temp_title || "Temporary account";
            p.destination_label = label;
            if (r.dest_save && (r.dest_temp_number || r.dest_temp_title)) {
              try {
                const saved = await savePayout({
                  path: `employee/payroll/salaries/${salary.uuid}/payout-accounts`,
                  body: { method: r.payment_method, account_title: r.dest_temp_title || undefined, account_number: r.dest_temp_number || undefined, bank_name: r.dest_temp_bank || undefined, is_temporary: true },
                }).unwrap();
                p.destination_payout_account_uuid = saved?.data?.payout_account_uuid;
                p.destination_label = saved?.data?.display || label;
              } catch {
                /* keep the typed label if saving fails */
              }
            }
          }
        }
        payments.push(p);
      }

      let body;
      if (proofFile) {
        // Multipart so the proof image rides along; payments go as JSON.
        body = new FormData();
        body.append("paid_at", date);
        body.append("payments", JSON.stringify(payments));
        body.append("proof", proofFile);
      } else {
        body = { paid_at: date, payments };
      }
      await onSubmit(body);
      refetchPayouts?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl overflow-hidden bg-white rounded-2xl shadow-2xl"
      >
        <header
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <div>
            <h2 className="text-[13px] font-semibold">Record salary payment</h2>
            <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {salary.employee?.full_name} · Net {fmtMoney(salary.net_payable)}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-4 text-[12px]">
            <div>
              <span style={{ color: TEXT_MUTED }}>Already paid: </span>
              <span className="font-semibold">{fmtMoney(salary.paid_so_far || 0)}</span>
            </div>
            <div>
              <span style={{ color: TEXT_MUTED }}>Remaining: </span>
              <span className="font-semibold" style={{ color: BRAND_RED }}>{fmtMoney(remaining)}</span>
            </div>
            <div className="ml-auto">
              <label className="mr-2 text-[11px]" style={{ color: TEXT_SECONDARY }}>Paid on</label>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="px-2 py-1 text-xs border rounded outline-none"
                style={{ borderColor: BORDER }} required
              />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((r, i) => (
              <div key={i} className="pb-2 space-y-1.5" style={{ borderBottom: lines.length > 1 ? `1px dashed ${BORDER}` : "none" }}>
                <div className="grid items-center grid-cols-12 gap-2">
                  <select
                    value={r.payment_method}
                    onChange={(e) => setLine(i, "payment_method", e.target.value)}
                    className="col-span-3 px-2 py-2 text-xs border rounded-lg outline-none"
                    style={{ borderColor: BORDER }}
                  >
                    {PAY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select
                    value={r.payment_account_uuid}
                    onChange={(e) => setLine(i, "payment_account_uuid", e.target.value)}
                    className="col-span-4 px-2 py-2 text-xs border rounded-lg outline-none"
                    style={{ borderColor: BORDER }}
                  >
                    <option value="">From account (optional)…</option>
                    {(accounts || []).map((a) => (
                      <option key={a.uuid} value={a.uuid}>{a.display_name}{a.type_label ? ` · ${a.type_label}` : ""}</option>
                    ))}
                  </select>
                  <input
                    type="number" step="0.01" min="0" placeholder="Amount"
                    value={r.amount}
                    onChange={(e) => setLine(i, "amount", e.target.value)}
                    className="col-span-3 px-2 py-2 text-xs text-right border rounded-lg outline-none tabular-nums"
                    style={{ borderColor: BORDER }}
                  />
                  <input
                    type="text" placeholder="Ref / note"
                    value={r.payment_reference}
                    onChange={(e) => setLine(i, "payment_reference", e.target.value)}
                    className="col-span-1 px-2 py-2 text-xs border rounded-lg outline-none"
                    style={{ borderColor: BORDER }}
                    title="Reference (cheque no., txn id)"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    className="col-span-1 flex justify-center p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    title="Remove line"
                  >
                    <X size={14} style={{ color: TEXT_MUTED }} />
                  </button>
                </div>
                {personAccts.length > 0 && (
                  <div className="grid items-center grid-cols-12 gap-2">
                    <div className="col-span-5 inline-flex p-1 rounded-lg" style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}` }}>
                      {[{ v: "office", l: "Paid by office" }, { v: "person", l: "Paid by a person" }].map((o) => (
                        <button key={o.v} type="button"
                          onClick={() => { setLine(i, "payer_type", o.v); setLine(i, "funded_by_account_uuid", ""); }}
                          className="flex-1 px-2 py-1 text-[11px] font-semibold rounded-md"
                          style={r.payer_type === o.v ? { background: "#fff", color: BRAND_RED } : { color: TEXT_MUTED }}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                    {r.payer_type === "person" ? (
                      <select
                        value={r.funded_by_account_uuid}
                        onChange={(e) => setLine(i, "funded_by_account_uuid", e.target.value)}
                        className="col-span-7 px-2 py-2 text-xs border rounded-lg outline-none"
                        style={{ borderColor: BORDER }}
                        title="Who fronted this from their own pocket — logged as a loan the office owes them"
                      >
                        <option value="">Which person funded it…</option>
                        {personAccts.map((a) => (
                          <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="col-span-7 text-[11px] self-center" style={{ color: TEXT_MUTED }}>
                        Office money — the method &amp; account above cover it.
                      </div>
                    )}
                  </div>
                )}

                {r.payment_method !== "cash" && (
                  <div className="space-y-1.5">
                    <select
                      value={r.dest_account_uuid}
                      onChange={(e) => setLine(i, "dest_account_uuid", e.target.value)}
                      className="w-full px-2 py-2 text-xs border rounded-lg outline-none"
                      style={{ borderColor: BORDER }}
                      title="Where the money is being sent (employee account)"
                    >
                      <option value="">Send to… (which account?)</option>
                      {payoutAccounts.map((a) => (
                        <option key={a.payout_account_uuid} value={a.payout_account_uuid}>{a.display}</option>
                      ))}
                      <option value="__temp__">+ Temporary account…</option>
                    </select>
                    {r.dest_account_uuid === "__temp__" && (
                      <div className="grid grid-cols-12 gap-2">
                        <input type="text" placeholder="Bank / wallet" value={r.dest_temp_bank}
                          onChange={(e) => setLine(i, "dest_temp_bank", e.target.value)}
                          className="col-span-6 px-2 py-2 text-xs border rounded-lg outline-none" style={{ borderColor: BORDER }} />
                        <input type="text" placeholder="Account number" value={r.dest_temp_number}
                          onChange={(e) => setLine(i, "dest_temp_number", e.target.value)}
                          className="col-span-6 px-2 py-2 text-xs border rounded-lg outline-none" style={{ borderColor: BORDER }} />
                        <input type="text" placeholder="Account title (optional)" value={r.dest_temp_title}
                          onChange={(e) => setLine(i, "dest_temp_title", e.target.value)}
                          className="col-span-12 px-2 py-2 text-xs border rounded-lg outline-none" style={{ borderColor: BORDER }} />
                        <label className="flex items-center col-span-12 gap-2 text-[11px]" style={{ color: TEXT_SECONDARY }}>
                          <input type="checkbox" checked={r.dest_save} onChange={(e) => setLine(i, "dest_save", e.target.checked)} />
                          Save this account to {salary.employee?.full_name || "the employee"} for next time
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button" onClick={addLine}
            className="inline-flex items-center gap-1 text-[12px] font-medium"
            style={{ color: BRAND_RED }}
          >
            <PlusCircle size={14} /> Add split line
          </button>

          <label className="flex items-center gap-2 px-2 py-2 text-[12px] border border-dashed rounded-lg cursor-pointer" style={{ borderColor: BORDER, color: TEXT_SECONDARY }} title="Optional: attach a transfer screenshot / receipt">
            <Paperclip size={14} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>

          <div className="flex items-center justify-between pt-2 text-[12px] border-t" style={{ borderColor: BORDER }}>
            <span style={{ color: TEXT_MUTED }}>Split total</span>
            <span className="font-semibold tabular-nums" style={{ color: over ? "#B91C1C" : TEXT_PRIMARY }}>
              {fmtMoney(sum)} {over && "· exceeds remaining"}
            </span>
          </div>
        </div>

        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy || over}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: busy || over ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Record payment
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────── Salary row (inline-edit base + expandable line items) ─────────── */

function SalaryRow({ salary, cycleEditable, cyclePayable, accounts, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editingBase, setEditingBase] = useState(false);
  const [base, setBase] = useState(salary.base_salary);
  const [modal, setModal] = useState(null); // 'deduction' | 'allowance' | 'bonus'

  const [patch] = usePatchMutation();
  const [post]  = usePostMutation();
  const [del]   = useDeleteMutation();

  // Editable for any salary that is not yet paid — including finalized /
  // locked rows — as long as no payment has been recorded. Lets HR correct
  // amounts even after finalizing, before the money is released.
  const editable = salaryDisplayStatus(salary) !== "paid" && Number(salary.paid_so_far || 0) <= 0.001;

  const saveBase = async () => {
    const n = parseFloat(base);
    if (!(n >= 0)) {
      showToast("error", "Base must be ≥ 0");
      return;
    }
    try {
      const res = await patch({
        path: `employee/payroll/salaries/${salary.uuid}`,
        body: { base_salary: n },
      }).unwrap();
      showToast("success", "Base salary updated.");
      setEditingBase(false);
      onChange?.(res?.data);
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to update.");
    }
  };

  const addLineItem = async (kind, body) => {
    const subpath = kind === "deduction" ? "deductions"
                  : kind === "allowance" ? "allowances"
                  : "bonuses";
    try {
      const res = await post({
        path: `employee/payroll/salaries/${salary.uuid}/${subpath}`,
        body,
      }).unwrap();
      showToast("success", `${kind} added.`);
      setModal(null);
      onChange?.(res?.data);
    } catch (err) {
      showToast("error", err?.data?.message || `Failed to add ${kind}.`);
    }
  };

  const recordPayment = async (body) => {
    try {
      const res = await post({
        path: `employee/payroll/salaries/${salary.uuid}/payments`,
        body,
      }).unwrap();
      showToast("Payment recorded.", "success");
      setModal(null);
      onChange?.(res?.data);
    } catch (err) {
      showToast(err?.data?.message || "Failed to record payment.", "error");
    }
  };

  const removeLineItem = async (kind, uuid) => {
    const subpath = kind === "deduction" ? "deductions"
                  : kind === "allowance" ? "allowances"
                  : "bonuses";
    try {
      const res = await del({ path: `employee/payroll/${subpath}/${uuid}` }).unwrap();
      showToast("success", `${kind} removed.`);
      onChange?.(res?.data);
    } catch (err) {
      showToast("error", err?.data?.message || `Failed to remove.`);
    }
  };

  const downloadPayslip = () => {
    if (!salary.payslip?.pdf_url) {
      showToast("error", "Payslip not generated yet.");
      return;
    }
    window.open(salary.payslip.pdf_url, "_blank", "noopener,noreferrer");
  };

  const [regenerating, setRegenerating] = useState(false);
  const regeneratePayslip = async () => {
    setRegenerating(true);
    try {
      const res = await post({ path: `employee/payroll/salaries/${salary.uuid}/payslip/regenerate`, body: {} }).unwrap();
      showToast("success", res?.message || "Payslip regenerated.");
      onChange?.();
    } catch (err) {
      showToast("error", err?.data?.message || "Could not regenerate payslip.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <tr
        className="border-t hover:bg-slate-50"
        style={{ borderColor: BORDER, background: salary.status === "blocked" ? "#FEF7F7" : undefined }}
      >
        <td className="px-3 py-3">
          <div className="font-medium text-[13px]">{salary.employee?.full_name || "—"}</div>
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {salary.employee?.employee_id} · {salary.employee?.designation || ""}
          </div>
          {salary.status === "blocked" && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#B91C1C" }}>
              <AlertTriangle size={10} /> {blockedLabel(salary.blocked_reason)}
            </div>
          )}
        </td>
        <td className="px-3 py-3"><StatusChip status={salaryDisplayStatus(salary)} meta={SAL_STATUS_META} /></td>
        <td className="px-3 py-3 text-right tabular-nums">
          {editingBase ? (
            <div className="flex items-center justify-end gap-1">
              <input
                type="number" value={base}
                onChange={(e) => setBase(e.target.value)}
                className="w-24 px-2 py-1 text-xs border rounded outline-none"
                style={{ borderColor: BORDER }}
                autoFocus
              />
              <button
                type="button"
                onClick={saveBase}
                className="px-2 py-1 text-[11px] font-medium text-white rounded"
                style={{ background: BRAND_RED }}
              >Save</button>
              <button
                type="button"
                onClick={() => { setEditingBase(false); setBase(salary.base_salary); }}
                className="px-2 py-1 text-[11px]" style={{ color: TEXT_MUTED }}
              >Cancel</button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5">
              <span>{fmtMoney(salary.base_salary)}</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => setEditingBase(true)}
                  className="p-1 rounded hover:bg-slate-200"
                  title="Edit base"
                >
                  <Pencil size={11} style={{ color: TEXT_MUTED }} />
                </button>
              )}
            </div>
          )}
        </td>
        <td className="px-3 py-3 text-right tabular-nums" style={{ color: salary.deductions_total > 0 ? "#B91C1C" : TEXT_MUTED }}>
          {fmtMoney(salary.deductions_total)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums" style={{ color: salary.allowances_total > 0 ? "#15803D" : TEXT_MUTED }}>
          {fmtMoney(salary.allowances_total)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums" style={{ color: salary.bonuses_total > 0 ? "#15803D" : TEXT_MUTED }}>
          {fmtMoney(salary.bonuses_total)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums font-semibold">
          {fmtMoney(salary.net_payable)}
        </td>
        <td className="px-3 py-3 text-right whitespace-nowrap">
          {cyclePayable && salary.status === "blocked" && (
            <span
              className="px-2 py-1 mr-1 text-[11px] font-medium rounded inline-flex items-center gap-1 cursor-help"
              style={{ background: "#FEF2F2", color: "#B91C1C" }}
              title={blockedLabel(salary.blocked_reason) + " — fix the issue, then re-run “Run proposed”."}
            >
              <AlertTriangle size={11} /> Blocked
            </span>
          )}
          {cyclePayable && salary.status !== "blocked" && (Number(salary.remaining ?? salary.net_payable) > 0.001 ? (
            <button
              type="button"
              onClick={() => setModal("payment")}
              className="px-2 py-1 mr-1 text-[11px] font-medium text-white rounded inline-flex items-center gap-1"
              style={{ background: BRAND_RED }}
              title={salary.paid_so_far > 0 ? `Paid ${fmtMoney(salary.paid_so_far)} · pay remaining ${fmtMoney(salary.remaining)}` : "Record payment"}
            >
              <Wallet size={11} /> {salary.paid_so_far > 0 ? "Pay rest" : "Pay"}
            </button>
          ) : (
            <span
              className="px-2 py-1 mr-1 text-[11px] font-medium rounded inline-flex items-center gap-1"
              style={{ background: "#F0FDF4", color: "#15803D" }}
              title={salary.paid_via ? `Paid via ${salary.paid_via}` : "Paid"}
            >
              <CheckCircle2 size={11} /> Paid
            </span>
          ))}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-2 py-1 text-[11px] font-medium rounded border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            {expanded ? "Hide" : "Details"}
          </button>
          {salary.payslip?.pdf_url && (
            <button
              type="button"
              onClick={downloadPayslip}
              className="px-2 py-1 ml-1 text-[11px] font-medium rounded border inline-flex items-center gap-1"
              style={{ borderColor: BORDER, color: BRAND_RED }}
              title="Download payslip"
            >
              <Download size={11} /> PDF
            </button>
          )}
          {salary.payslip?.pdf_url && (
            <button
              type="button"
              onClick={regeneratePayslip}
              disabled={regenerating}
              className="px-2 py-1 ml-1 text-[11px] font-medium rounded border inline-flex items-center gap-1 disabled:opacity-50"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
              title="Rebuild payslip PDF (applies latest logo/template)"
            >
              <RefreshCw size={11} className={regenerating ? "animate-spin" : ""} /> {regenerating ? "…" : "Rebuild"}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: SURFACE_ALT }}>
          <td colSpan={8} className="px-5 py-4">
            {salary.blocked_reason && (
              <div
                className="flex items-start gap-2 p-2 mb-3 text-[11px] rounded"
                style={{ background: "#FEF2F2", color: "#B91C1C" }}
              >
                <AlertTriangle size={13} className="mt-px" />
                <div>
                  <strong>Blocked:</strong> {salary.blocked_reason}
                  <div style={{ color: "#9F1239" }}>
                    Fix the underlying issue (sign contract / add bank account / etc.) then re-run &quot;Propose&quot; on the cycle.
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Deductions */}
              <LineItemColumn
                title="Deductions" Icon={TrendingDown} color="#B91C1C"
                items={salary.deductions} editable={editable}
                onAdd={() => setModal("deduction")}
                onRemove={(uuid) => removeLineItem("deduction", uuid)}
                showReason
              />
              <LineItemColumn
                title="Allowances" Icon={TrendingUp} color="#15803D"
                items={salary.allowances} editable={editable}
                onAdd={() => setModal("allowance")}
                onRemove={(uuid) => removeLineItem("allowance", uuid)}
              />
              <LineItemColumn
                title="Bonuses" Icon={Gift} color="#15803D"
                items={salary.bonuses} editable={editable}
                onAdd={() => setModal("bonus")}
                onRemove={(uuid) => removeLineItem("bonus", uuid)}
              />
            </div>
          </td>
        </tr>
      )}
      {modal === "deduction" && (
        <LineItemModal
          title="Add deduction" types={DEDUCTION_TYPES}
          fields={["reason"]}
          onClose={() => setModal(null)}
          onSubmit={(b) => addLineItem("deduction", b)}
        />
      )}
      {modal === "allowance" && (
        <LineItemModal
          title="Add allowance" types={ALLOWANCE_TYPES}
          fields={["note"]}
          onClose={() => setModal(null)}
          onSubmit={(b) => addLineItem("allowance", b)}
        />
      )}
      {modal === "bonus" && (
        <LineItemModal
          title="Add bonus" types={BONUS_TYPES}
          fields={["note"]}
          onClose={() => setModal(null)}
          onSubmit={(b) => addLineItem("bonus", b)}
        />
      )}
      {modal === "payment" && (
        <SalaryPaymentModal
          salary={salary}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSubmit={recordPayment}
        />
      )}
    </>
  );
}

function LineItemColumn({ title, Icon, color, items, editable, onAdd, onRemove, showReason }) {
  return (
    <div className="p-3 bg-white border rounded-lg" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color }}>
          <Icon size={13} />
          {title}
        </div>
        {editable && (
          <button
            type="button" onClick={onAdd}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <PlusCircle size={11} /> Add
          </button>
        )}
      </div>
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.uuid}
              className="flex items-start justify-between gap-2 px-2 py-1.5 text-[12px] rounded"
              style={{ background: SURFACE_ALT }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{it.type}</span>
                  {/* Phase 5: engine-generated rows surface an "Auto" badge so
                      HR knows the deduction came from attendance, not a hand
                      entry. The BE sets is_auto=true when created_by IS NULL. */}
                  {it.is_auto && (
                    <span
                      className="px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide rounded"
                      style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                      title="Generated from attendance — toggle the cycle setting to disable, then re-run proposed."
                    >
                      Auto
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: TEXT_MUTED }}>
                  {showReason ? it.reason : it.note}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">{fmtMoney(it.amount)}</div>
                {editable && (
                  <button
                    type="button"
                    onClick={() => onRemove(it.uuid)}
                    className="text-[10px] underline"
                    style={{ color: "#B91C1C" }}
                  >Remove</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-2 text-center text-[11px]" style={{ color: TEXT_MUTED }}>
          None
        </div>
      )}
    </div>
  );
}

/* ─────────── Page ─────────── */

export default function PayrollCycleDetailPage() {
  const { uuid } = useParams();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const canRunProposed = hasPermission(user, "run proposed-payroll");
  const canFinalize    = hasPermission(user, "finalize payroll");
  const canMarkPaid    = hasPermission(user, "mark payroll-paid");
  const canUpdateCycle = hasPermission(user, "update payroll-cycles");

  const [salaryQ, setSalaryQ] = useState("");
  const [salaryStatus, setSalaryStatus] = useState("");
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [changeMonthOpen, setChangeMonthOpen] = useState(false);

  const { data: cycleResp, isFetching: cycleLoading, refetch: refetchCycle } = useGetQuery({
    path: `employee/payroll/cycles/${uuid}`,
  });
  const cycle = cycleResp?.data;

  const salaryParams = useMemo(() => {
    const p = {};
    if (salaryQ.trim()) p.q = salaryQ.trim();
    if (salaryStatus) p.status = salaryStatus;
    return p;
  }, [salaryQ, salaryStatus]);

  const { data: salariesResp, isFetching: salariesLoading, refetch: refetchSalaries } = useGetQuery({
    path: `employee/payroll/cycles/${uuid}/salaries`,
    params: salaryParams,
  });
  const salaries = salariesResp?.data || [];

  // Active payment accounts (cash / jazzcash / bank), reused from the same
  // catalog students pay fees into — for the salary split disbursement modal.
  const { data: accountsResp } = useGetQuery({ path: "finance/payment-accounts/active" });
  const payAccounts = useMemo(() => {
    const root = accountsResp?.data ?? accountsResp ?? [];
    return Array.isArray(root) ? root : root?.data ?? [];
  }, [accountsResp]);

  const [post]  = usePostMutation();
  const [patch] = usePatchMutation();
  const [del]   = useDeleteMutation();
  const [busyAction, setBusyAction] = useState(null);
  // Phase 5: track which toggle is currently saving so we can spin only that
  // one (and avoid blocking the other if HR clicks both quickly).
  const [togglesBusy, setTogglesBusy] = useState({});

  const updateAutoToggle = async (field, value) => {
    setTogglesBusy((s) => ({ ...s, [field]: true }));
    try {
      await patch({
        path: `employee/payroll/cycles/${uuid}`,
        body: { [field]: value },
      }).unwrap();
      showToast(
        "success",
        `Saved. Click "${cycle?.status === "proposed" ? "Re-run proposed" : "Run proposed"}" to re-apply the rules.`,
      );
      refetchCycle();
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to update.");
    } finally {
      setTogglesBusy((s) => ({ ...s, [field]: false }));
    }
  };

  const runAction = async (path, label) => {
    setBusyAction(label);
    try {
      await post({ path }).unwrap();
      showToast("success", `${label} done.`);
      refetchCycle();
      refetchSalaries();
    } catch (err) {
      showToast("error", err?.data?.message || `${label} failed.`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleMarkPaid = async (body) => {
    try {
      await post({
        path: `employee/payroll/cycles/${uuid}/mark-paid`,
        body,
      }).unwrap();
      showToast("success", "Cycle marked paid.");
      setMarkPaidOpen(false);
      refetchCycle();
      refetchSalaries();
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to mark paid.");
    }
  };

  const handleChangeMonth = async (yearMonth) => {
    try {
      await post({ path: `employee/payroll/cycles/${uuid}/change-month`, body: { year_month: yearMonth } }).unwrap();
      showToast("success", "Cycle month updated.");
      setChangeMonthOpen(false);
      refetchCycle();
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to change month.");
    }
  };

  const handleDeleteCycle = async () => {
    if (!window.confirm("Delete this entire payroll cycle and all of its salary rows? This cannot be undone.")) return;
    try {
      await del({ path: `employee/payroll/cycles/${uuid}` }).unwrap();
      showToast("success", "Cycle deleted.");
      navigate(HR_PAYROLL_CYCLES);
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to delete cycle.");
    }
  };

  if (cycleLoading && !cycle) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
      </div>
    );
  }
  if (!cycle) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        Cycle not found.{" "}
        <button onClick={() => navigate(HR_PAYROLL_CYCLES)} className="underline">
          Back to list
        </button>
      </div>
    );
  }

  const isOpen      = cycle.status === "open";
  const isProposed  = cycle.status === "proposed";
  const isFinalized = cycle.status === "finalized";
  const isPaid      = cycle.status === "paid";
  // Salaries can be disbursed once the cycle is committed (finalized) and
  // while it's being paid down. HR records each employee's payment (split
  // across accounts); when all are covered the cycle auto-closes to paid.
  const cyclePayable = ["finalized", "processing", "paid"].includes(cycle.status);

  return (
    <div
      className="w-full"
      style={{
        padding: "28px 28px 60px",
        fontFamily: "Montserrat, ui-sans-serif, system-ui",
        color: TEXT_PRIMARY,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button" onClick={() => navigate(HR_PAYROLL_CYCLES)}
            className="p-2 rounded-lg border" style={{ borderColor: BORDER }}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{fmtYearMonth(cycle.year_month)}</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              {cycle.brand_name || "Company-wide"} · {cycle.counts?.total || 0} salaries · <StatusChip status={cycle.status} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* An empty finalized/paid cycle (no salaries ever generated) can be
              repopulated — the backend reopens it to proposed. */}
          {(isOpen || isProposed || ((isFinalized || isPaid) && (cycle.counts?.total || 0) === 0)) && canRunProposed && (
            <button
              type="button"
              onClick={() => runAction(`employee/payroll/cycles/${uuid}/run-proposed`, "Run proposed")}
              disabled={busyAction === "Run proposed"}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border"
              style={{ borderColor: BRAND_RED, color: BRAND_RED }}
            >
              {busyAction === "Run proposed"
                ? <Loader2 size={14} className="animate-spin" />
                : <Play size={14} />}
              {isProposed ? "Re-run proposed" : "Run proposed"}
            </button>
          )}
          {isProposed && canFinalize && (
            <button
              type="button"
              onClick={() => runAction(`employee/payroll/cycles/${uuid}/finalize`, "Finalize")}
              disabled={busyAction === "Finalize"}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ background: BRAND_RED }}
            >
              {busyAction === "Finalize"
                ? <Loader2 size={14} className="animate-spin" />
                : <Lock size={14} />}
              Finalize + generate payslips
            </button>
          )}
          {/* Blocked salaries can be re-checked after HR signs the contract /
              uploads docs / adds a bank account — without reopening the cycle. */}
          {(cycle.counts?.blocked || 0) > 0 && canRunProposed && (
            <button
              type="button"
              onClick={() => runAction(`employee/payroll/cycles/${uuid}/recheck-blocked`, "Re-check blocked")}
              disabled={busyAction === "Re-check blocked"}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border"
              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
              title="Re-evaluate blocked salaries after fixing their contract / documents"
            >
              {busyAction === "Re-check blocked"
                ? <Loader2 size={14} className="animate-spin" />
                : <AlertTriangle size={14} />}
              Re-check blocked ({cycle.counts?.blocked})
            </button>
          )}
          {isFinalized && canMarkPaid && (
            <button
              type="button"
              onClick={() => setMarkPaidOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{ background: BRAND_RED }}
            >
              <CheckCircle2 size={14} />
              Mark paid
            </button>
          )}
          {canUpdateCycle && (
            <button
              type="button"
              onClick={() => setChangeMonthOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
              title="Move this cycle to a different month"
            >
              <CalendarRange size={14} /> Change month
            </button>
          )}
          {!isPaid && canUpdateCycle && (
            <button
              type="button"
              onClick={handleDeleteCycle}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border"
              style={{ borderColor: "#B91C1C", color: "#B91C1C" }}
              title="Permanently delete this cycle"
            >
              <Trash2 size={14} /> Delete cycle
            </button>
          )}
        </div>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-5">
        <TotalCard label="Total salaries" value={cycle.counts?.total ?? 0} />
        <TotalCard label="Blocked" value={cycle.counts?.blocked ?? 0} accent={cycle.counts?.blocked ? "#B91C1C" : undefined} />
        <TotalCard label="Base total" value={fmtMoney(cycle.totals?.base)} prefix="₨" />
        <TotalCard label="Deductions" value={fmtMoney(cycle.totals?.deductions)} prefix="₨" />
        <TotalCard label="Net payable" value={fmtMoney(cycle.totals?.net_payable)} prefix="₨" accent={BRAND_RED} bold />
      </div>

      {/* Phase 5 — Auto-deduction settings. Only meaningful while the cycle
          is open or proposed; locked cycles render the toggles read-only. */}
      <div
        className="flex flex-wrap items-center gap-5 px-4 py-3 mb-4 bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
          Auto-deductions from attendance
        </div>
        <label
          className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
          style={{ opacity: cycle.is_locked || !canUpdateCycle ? 0.6 : 1 }}
        >
          <input
            type="checkbox"
            checked={!!cycle.auto_late_enabled}
            disabled={cycle.is_locked || !canUpdateCycle || togglesBusy.auto_late_enabled}
            onChange={(e) => updateAutoToggle("auto_late_enabled", e.target.checked)}
          />
          <span style={{ color: TEXT_SECONDARY }}>
            Late deductions
          </span>
          {togglesBusy.auto_late_enabled && (
            <Loader2 size={11} className="animate-spin" style={{ color: TEXT_MUTED }} />
          )}
        </label>
        <label
          className="inline-flex items-center gap-2 text-[12px] cursor-pointer select-none"
          style={{ opacity: cycle.is_locked || !canUpdateCycle ? 0.6 : 1 }}
        >
          <input
            type="checkbox"
            checked={!!cycle.auto_absence_enabled}
            disabled={cycle.is_locked || !canUpdateCycle || togglesBusy.auto_absence_enabled}
            onChange={(e) => updateAutoToggle("auto_absence_enabled", e.target.checked)}
          />
          <span style={{ color: TEXT_SECONDARY }}>
            Absence deductions
          </span>
          {togglesBusy.auto_absence_enabled && (
            <Loader2 size={11} className="animate-spin" style={{ color: TEXT_MUTED }} />
          )}
        </label>
        <div className="ml-auto text-[10px]" style={{ color: TEXT_MUTED }}>
          {cycle.is_locked
            ? "Cycle is locked — toggles read-only."
            : "Re-run “Run proposed” to re-apply the rules."}
        </div>
      </div>

      {/* Salary filters */}
      <div
        className="flex flex-wrap items-end gap-3 p-4 mb-3 bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Search employee
          </label>
          <div className="relative">
            <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
            <input
              type="text" value={salaryQ}
              onChange={(e) => setSalaryQ(e.target.value)}
              placeholder="Name or email…"
              className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Status
          </label>
          <select
            value={salaryStatus}
            onChange={(e) => setSalaryStatus(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[140px]"
            style={{ borderColor: BORDER }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="locked">Locked</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Salaries table */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        {salariesLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
          </div>
        ) : salaries.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            {cycle.status === "open"
              ? "No salaries yet. Click 'Run proposed' to populate this cycle."
              : "No salaries match the filters."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Base</th>
                <th className="px-3 py-3 text-right">Deductions</th>
                <th className="px-3 py-3 text-right">Allowances</th>
                <th className="px-3 py-3 text-right">Bonuses</th>
                <th className="px-3 py-3 text-right">Net</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <SalaryRow
                  key={s.uuid}
                  salary={s}
                  cycleEditable={cycle.is_editable}
                  cyclePayable={cyclePayable}
                  accounts={payAccounts}
                  onChange={() => { refetchCycle(); refetchSalaries(); }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {markPaidOpen && (
        <MarkPaidModal
          onClose={() => setMarkPaidOpen(false)}
          onSubmit={handleMarkPaid}
        />
      )}

      {changeMonthOpen && (
        <ChangeMonthModal
          current={cycle.year_month}
          onClose={() => setChangeMonthOpen(false)}
          onSubmit={handleChangeMonth}
        />
      )}

      {(isPaid && cycle.payment_date) && (
        <div className="mt-4 p-3 text-[12px] rounded-lg" style={{ background: "#F0FDF4", color: "#15803D" }}>
          <CheckCircle2 size={13} className="inline mr-1" />
          Paid on {cycle.payment_date} via {cycle.payment_method}.
        </div>
      )}
    </div>
  );
}

function TotalCard({ label, value, prefix, accent, bold }) {
  return (
    <div className="p-3 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>
        {label}
      </div>
      <div
        className={`tabular-nums ${bold ? "text-lg font-bold" : "text-base font-semibold"}`}
        style={{ color: accent || TEXT_PRIMARY }}
      >
        {prefix && <span className="text-xs mr-1" style={{ color: TEXT_MUTED }}>{prefix}</span>}
        {value}
      </div>
    </div>
  );
}
