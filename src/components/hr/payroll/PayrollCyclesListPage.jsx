import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Loader2,
  CalendarDays,
  Building2,
  Lock,
  CheckCircle2,
  CircleDot,
  X,
} from "lucide-react";

import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { HR_PAYROLL_CYCLE_DETAIL } from "../../routes/RouteConstants";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";

/* ─────────────── brand tokens (HR page chrome) ─────────── */
const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────── cycle status chips ───────────────────── */
const STATUS_META = {
  open:       { label: "Open",       fg: "#1D4ED8", bg: "#EFF6FF", icon: CircleDot },
  proposed:   { label: "Proposed",   fg: "#A16207", bg: "#FEFCE8", icon: CircleDot },
  processing: { label: "Processing", fg: "#9333EA", bg: "#F5F3FF", icon: Loader2 },
  finalized:  { label: "Finalized",  fg: "#0E7490", bg: "#ECFEFF", icon: Lock },
  paid:       { label: "Paid",       fg: "#15803D", bg: "#F0FDF4", icon: CheckCircle2 },
};

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.open;
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full"
      style={{ color: m.fg, background: m.bg }}
    >
      <Icon size={11} className={status === "processing" ? "animate-spin" : ""} />
      {m.label}
    </span>
  );
}

/* ─────────────── helpers ──────────────────────────────── */
function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtYearMonth(ym) {
  if (!ym || ym.length !== 7) return ym || "—";
  const [y, m] = ym.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || m} ${y}`;
}

function defaultThisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ─────────────── Open-cycle modal ─────────────────────── */
function OpenCycleModal({ onClose, onCreated, brands }) {
  const [yearMonth, setYearMonth] = useState(defaultThisMonth());
  const [brandId, setBrandId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [post] = usePostMutation();

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!yearMonth.match(/^\d{4}-\d{2}$/)) {
      showToast("error", "Year/month must be YYYY-MM");
      return;
    }
    setBusy(true);
    try {
      const body = { year_month: yearMonth, note: note || undefined };
      if (brandId) body.brand_id = parseInt(brandId, 10);
      const res = await post({ path: "employee/payroll/cycles", body }).unwrap();
      showToast("success", res?.message || "Cycle opened.");
      onCreated?.(res?.data);
    } catch (err) {
      showToast("error", err?.data?.message || "Failed to open cycle.");
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
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <Plus size={14} />
            </span>
            <h2 className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              Open a payroll cycle
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Month
            </label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-1"
              style={{ borderColor: BORDER }}
              required
            />
            <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>
              YYYY-MM. Reopening returns the existing cycle.
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Brand (optional)
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            >
              <option value="">— Company-wide —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              placeholder="Internal note for HR"
            />
          </div>
        </div>
        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Open cycle
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────────── Page ─────────────────────────────────── */
export default function PayrollCyclesListPage() {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const canRead   = hasPermission(user, "get payroll-cycles");
  const canCreate = hasPermission(user, "create payroll-cycles");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [q, setQ] = useState("");
  const [yearMonth, setYearMonth] = useState("");
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState("");
  const [showOpenModal, setShowOpenModal] = useState(false);

  const { data: brandsResp } = useGetQuery({ path: "employee/company-brands" });
  // Handle both flat ({data:[...]}) and double-wrapped ({data:{data:[...]}})
  // response shapes — same convention as EmployeeFormPage.
  const brands = useMemo(() => {
    const root = brandsResp?.data ?? brandsResp ?? [];
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    return [];
  }, [brandsResp]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (q.trim()) p.q = q.trim();
    if (yearMonth) p.year_month = yearMonth;
    if (brandId) p.brand_id = brandId;
    if (status) p.status = status;
    return p;
  }, [page, perPage, q, yearMonth, brandId, status]);

  const { data, isFetching, refetch } = useGetQuery({
    path: "employee/payroll/cycles",
    params,
  });

  const rows = data?.data || [];
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage };

  const goDetail = (uuid) => navigate(HR_PAYROLL_CYCLE_DETAIL.replace(":uuid", uuid));

  if (!canRead) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        You don&apos;t have permission to view payroll cycles.
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Payroll Cycles</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              {meta.total ? `${meta.total} cycle${meta.total === 1 ? "" : "s"}` : "loading…"}
              {" · "}open · propose · finalize · mark paid
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowOpenModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED }}
          >
            <Plus size={16} />
            Open cycle
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div
        className="flex flex-wrap items-end gap-3 p-4 mb-4 bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Search
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute -translate-y-1/2 left-3 top-1/2"
              style={{ color: TEXT_MUTED }}
            />
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Year-month or note…"
              className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Month
          </label>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => { setYearMonth(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none"
            style={{ borderColor: BORDER }}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Brand
          </label>
          <select
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[180px]"
            style={{ borderColor: BORDER }}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[160px]"
            style={{ borderColor: BORDER }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="proposed">Proposed</option>
            <option value="finalized">Finalized</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {(q || yearMonth || brandId || status) && (
          <button
            type="button"
            onClick={() => { setQ(""); setYearMonth(""); setBrandId(""); setStatus(""); setPage(1); }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            <Filter size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="overflow-hidden bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        {isFetching ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            {meta.total === 0
              ? "No payroll cycles yet. Click 'Open cycle' to create the first one."
              : "No cycles match these filters."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-5 py-3">Month</th>
                <th className="px-3 py-3">Brand</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Salaries</th>
                <th className="px-3 py-3 text-right">Blocked</th>
                <th className="px-3 py-3 text-right">Net total</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.uuid}
                  onClick={() => goDetail(r.uuid)}
                  className="border-t cursor-pointer hover:bg-slate-50"
                  style={{ borderColor: BORDER }}
                >
                  <td className="px-5 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} style={{ color: TEXT_MUTED }} />
                      {fmtYearMonth(r.year_month)}
                    </div>
                  </td>
                  <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>
                    {r.brand_name ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={12} style={{ color: TEXT_MUTED }} />
                        {r.brand_name}
                      </span>
                    ) : (
                      <span style={{ color: TEXT_MUTED }}>Company-wide</span>
                    )}
                  </td>
                  <td className="px-3 py-3"><StatusChip status={r.status} /></td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {r.counts?.total ?? 0}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {r.counts?.blocked ? (
                      <span style={{ color: "#B91C1C", fontWeight: 600 }}>
                        {r.counts.blocked}
                      </span>
                    ) : (
                      <span style={{ color: TEXT_MUTED }}>0</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {fmtMoney(r.totals?.net_payable)}
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                    {r.payment_date ? (
                      <>
                        <div>{r.payment_date}</div>
                        <div style={{ color: TEXT_MUTED }}>{r.payment_method || ""}</div>
                      </>
                    ) : (
                      <span style={{ color: TEXT_MUTED }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-xs" style={{ color: BRAND_RED }}>Open →</span>
                  </td>
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

      {showOpenModal && (
        <OpenCycleModal
          onClose={() => setShowOpenModal(false)}
          onCreated={(c) => {
            setShowOpenModal(false);
            refetch();
            if (c?.uuid) goDetail(c.uuid);
          }}
          brands={brands}
        />
      )}
    </div>
  );
}
