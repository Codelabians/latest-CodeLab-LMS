import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plane,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";

import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

const STATUS_META = {
  submitted: { label: "Pending",   fg: "#A16207", bg: "#FEFCE8", icon: Clock },
  approved:  { label: "Approved",  fg: "#15803D", bg: "#F0FDF4", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  fg: "#B91C1C", bg: "#FEF2F2", icon: XCircle },
  cancelled: { label: "Cancelled", fg: "#64748B", bg: "#F1F5F9", icon: Ban },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.submitted;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full"
          style={{ color: m.fg, background: m.bg }}>
      <Icon size={11} />
      {m.label}
    </span>
  );
}

/* ─────────── Submit modal ─────────── */
function SubmitLeaveModal({ types, profileUuid, onClose, onDone, balancesByCode }) {
  const [typeUuid, setTypeUuid] = useState(types[0]?.uuid || "");
  const [start, setStart]       = useState("");
  const [end, setEnd]           = useState("");
  const [isHalfDay, setHalf]    = useState(false);
  const [halfPart, setHalfPart] = useState("am");
  const [reason, setReason]     = useState("");
  const [busy, setBusy]         = useState(false);

  const [post] = usePostMutation();

  const selectedType = types.find((t) => t.uuid === typeUuid);
  const balance = selectedType ? balancesByCode[selectedType.code] : null;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!typeUuid || !start || !end) {
      showToast("error", "Type, start date, and end date are required.");
      return;
    }
    if (isHalfDay && start !== end) {
      showToast("error", "Half-day leave must be a single day.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        leave_type_uuid: typeUuid,
        start_date: start,
        end_date: end,
        is_half_day: isHalfDay,
        reason: reason || undefined,
      };
      if (isHalfDay) body.half_day_part = halfPart;

      const res = await post({
        path: `employee/profiles/${profileUuid}/leave/requests`,
        body,
      }).unwrap();
      showToast("success", res?.message || "Leave request submitted.");
      onDone?.();
    } catch (err) {
      showToast("error", err?.data?.message || "Submit failed.");
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
        className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl"
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
            <h2 className="text-[13px] font-semibold">Request leave</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Leave type
            </label>
            <select
              value={typeUuid} onChange={(e) => setTypeUuid(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }} required
            >
              {types.map((t) => (
                <option key={t.uuid} value={t.uuid}>{t.name}{t.is_paid ? "" : " (unpaid)"}</option>
              ))}
            </select>
            {balance && (
              <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                Available: <strong>{balance.remaining}</strong> day{balance.remaining === 1 ? "" : "s"}
                {balance.pending > 0 && ` (${balance.pending} pending)`}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
                Start date
              </label>
              <input
                type="date" value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                style={{ borderColor: BORDER }} required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
                End date
              </label>
              <input
                type="date" value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                style={{ borderColor: BORDER }} required
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer">
              <input type="checkbox" checked={isHalfDay} onChange={(e) => setHalf(e.target.checked)} />
              <span style={{ color: TEXT_SECONDARY }}>Half-day</span>
            </label>
            {isHalfDay && (
              <select
                value={halfPart} onChange={(e) => setHalfPart(e.target.value)}
                className="px-2 py-1 text-xs border rounded"
                style={{ borderColor: BORDER }}
              >
                <option value="am">Morning (AM)</option>
                <option value="pm">Afternoon (PM)</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Reason
            </label>
            <textarea
              rows={3} value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              placeholder="Why are you requesting this leave?"
            />
          </div>
        </div>
        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-lg"
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
            Submit request
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────── Balance card ─────────── */
function BalanceCard({ balance }) {
  const lt = balance.leave_type;
  const remaining = Number(balance.remaining);
  const allotted  = Number(balance.allotted);
  const used      = Number(balance.used);
  const pending   = Number(balance.pending);
  const pctUsed   = allotted > 0 ? Math.min(100, Math.round(((used + pending) / allotted) * 100)) : 0;

  return (
    <div className="p-4 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: "#" + (lt?.color || "64748B") }}
          />
          <h3 className="text-[13px] font-semibold">{lt?.name || "—"}</h3>
        </div>
        {lt && !lt.is_paid && (
          <span className="text-[10px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Unpaid</span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color: BRAND_RED }}>
          {remaining.toFixed(remaining % 1 ? 1 : 0)}
        </span>
        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
          of {allotted.toFixed(allotted % 1 ? 1 : 0)} day{allotted === 1 ? "" : "s"}
        </span>
      </div>
      <div className="w-full h-1.5 mb-2 rounded-full" style={{ background: "#F1F5F9" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pctUsed}%`,
            background: "#" + (lt?.color || "64748B"),
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px]" style={{ color: TEXT_MUTED }}>
        <span>Used: <strong style={{ color: TEXT_SECONDARY }}>{used.toFixed(used % 1 ? 1 : 0)}</strong></span>
        {pending > 0 && (
          <span>Pending: <strong style={{ color: "#A16207" }}>{pending.toFixed(pending % 1 ? 1 : 0)}</strong></span>
        )}
      </div>
    </div>
  );
}

/* ─────────── Page ─────────── */
export default function MyLeavePage() {
  const user = useSelector(selectCurrentUser);

  // Look up the current user's profile uuid (mirrors SelfMarkAttendancePage).
  const { data: profileLookupResp } = useGetQuery(
    user?.email
      ? { path: "employee/profiles", params: { search: user.email, per_page: 1 } }
      : { path: "" },
    { skip: !user?.email }
  );
  const profileUuid = profileLookupResp?.data?.[0]?.uuid;

  const [year, setYear] = useState(new Date().getFullYear());
  const [showSubmit, setShowSubmit] = useState(false);

  const { data: balancesResp, isFetching: balancesLoading, refetch: refetchBalances } = useGetQuery(
    profileUuid
      ? { path: `employee/leave/balances/${profileUuid}`, params: { year } }
      : { path: "" },
    { skip: !profileUuid }
  );
  const balances = useMemo(() => balancesResp?.data || [], [balancesResp]);

  const balancesByCode = useMemo(() => {
    const m = {};
    balances.forEach((b) => { if (b.leave_type?.code) m[b.leave_type.code] = b; });
    return m;
  }, [balances]);

  const { data: typesResp } = useGetQuery({
    path: "employee/leave/types", params: { active: 1 },
  });
  const types = typesResp?.data || [];

  const { data: requestsResp, isFetching: requestsLoading, refetch: refetchRequests } = useGetQuery(
    profileUuid
      ? { path: "employee/leave/requests", params: { employee_uuid: profileUuid, per_page: 20 } }
      : { path: "" },
    { skip: !profileUuid }
  );
  const requests = requestsResp?.data || [];

  const [post] = usePostMutation();
  const cancelRequest = async (req) => {
    const reason = window.prompt("Cancel this request — reason (optional):");
    if (reason === null) return; // user hit Cancel on the prompt
    try {
      await post({
        path: `employee/leave/requests/${req.uuid}/cancel`,
        body: { cancel_reason: reason || undefined },
      }).unwrap();
      showToast("success", "Request cancelled.");
      refetchRequests();
      refetchBalances();
    } catch (err) {
      showToast("error", err?.data?.message || "Cancel failed.");
    }
  };

  const onSubmitted = () => {
    setShowSubmit(false);
    refetchRequests();
    refetchBalances();
  };

  if (!profileUuid && profileLookupResp) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        <AlertCircle size={14} className="inline mr-1" />
        We couldn&apos;t find your employee profile. Ask HR to make sure your account is linked.
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Plane size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">My Leave</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Your leave balances + request history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border rounded-lg outline-none"
            style={{ borderColor: BORDER }}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            disabled={!profileUuid || types.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: !profileUuid ? 0.5 : 1 }}
          >
            <Plus size={16} />
            Request leave
          </button>
        </div>
      </div>

      {/* Balance cards */}
      {balancesLoading ? (
        <div className="flex items-center justify-center p-12 mb-5 bg-white border rounded-2xl"
             style={{ borderColor: BORDER }}>
          <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
        </div>
      ) : balances.length === 0 ? (
        <div className="p-8 mb-5 text-sm text-center bg-white border rounded-2xl"
             style={{ borderColor: BORDER, color: TEXT_MUTED }}>
          No leave types configured yet. Ask HR to set up at least one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2 lg:grid-cols-4">
          {balances.map((b) => (
            <BalanceCard key={b.uuid} balance={b} />
          ))}
        </div>
      )}

      {/* My requests */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <h2 className="text-[13px] font-semibold">My requests</h2>
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {requests.length} most recent
          </span>
        </div>
        {requestsLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            You haven&apos;t submitted any leave requests yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-5 py-3">Type</th>
                <th className="px-3 py-3">Dates</th>
                <th className="px-3 py-3 text-right">Days</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Decision</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.uuid} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ background: "#" + (r.leave_type?.color || "64748B") }} />
                      {r.leave_type?.name || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                    <div className="inline-flex items-center gap-1">
                      <Calendar size={11} style={{ color: TEXT_MUTED }} />
                      {r.start_date}
                    </div>
                    {r.end_date !== r.start_date && (
                      <div style={{ color: TEXT_MUTED }}>→ {r.end_date}</div>
                    )}
                    {r.is_half_day && (
                      <div className="text-[10px] font-medium" style={{ color: "#A16207" }}>
                        Half-day ({r.half_day_part})
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {Number(r.day_count).toFixed(r.day_count % 1 ? 1 : 0)}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                    {r.decision_note && (
                      <div className="italic" style={{ color: TEXT_MUTED }}>
                        &ldquo;{r.decision_note.slice(0, 60)}{r.decision_note.length > 60 ? "…" : ""}&rdquo;
                      </div>
                    )}
                    {r.cancel_reason && (
                      <div className="italic" style={{ color: TEXT_MUTED }}>
                        Cancelled: {r.cancel_reason.slice(0, 60)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {(r.status === "submitted" || r.status === "approved") && (
                      <button
                        type="button"
                        onClick={() => cancelRequest(r)}
                        className="px-2 py-1 text-[11px] font-medium border rounded"
                        style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showSubmit && profileUuid && (
        <SubmitLeaveModal
          types={types}
          profileUuid={profileUuid}
          balancesByCode={balancesByCode}
          onClose={() => setShowSubmit(false)}
          onDone={onSubmitted}
        />
      )}
    </div>
  );
}
