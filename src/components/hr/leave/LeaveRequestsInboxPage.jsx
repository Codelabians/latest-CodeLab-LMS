import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plane,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  X,
  Calendar,
} from "lucide-react";

import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";

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

const TABS = [
  { key: "submitted", label: "Pending",   icon: Clock,        fg: "#A16207", bg: "#FEFCE8" },
  { key: "approved",  label: "Approved",  icon: CheckCircle2, fg: "#15803D", bg: "#F0FDF4" },
  { key: "rejected",  label: "Rejected",  icon: XCircle,      fg: "#B91C1C", bg: "#FEF2F2" },
  { key: "cancelled", label: "Cancelled", icon: Ban,          fg: "#64748B", bg: "#F1F5F9" },
];

function StatusBadge({ status }) {
  const t = TABS.find((tt) => tt.key === status) || TABS[0];
  const Icon = t.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full"
          style={{ color: t.fg, background: t.bg }}>
      <Icon size={11} />
      {t.label}
    </span>
  );
}

function DecisionModal({ kind, request, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [post] = usePostMutation();

  const isReject = kind === "reject";
  const isCancel = kind === "cancel";
  const noteRequired = isReject;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (noteRequired && !note.trim()) {
      showToast("error", "A note is required when rejecting.");
      return;
    }
    setBusy(true);
    try {
      let path = `employee/leave/requests/${request.uuid}/${kind}`;
      let body = {};
      if (isReject)      body.decision_note = note.trim();
      else if (isCancel) body.cancel_reason = note.trim() || undefined;
      else if (note.trim()) body.decision_note = note.trim();
      const res = await post({ path, body }).unwrap();
      showToast("success", res?.message || "Done.");
      onDone?.();
    } catch (err) {
      showToast("error", err?.data?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const title = isReject ? "Reject leave request"
              : isCancel ? "Cancel leave request"
              : "Approve leave request";

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
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="p-5 space-y-3">
          <div className="p-3 rounded-lg" style={{ background: SURFACE_ALT }}>
            <div className="text-[13px] font-medium">{request.employee?.full_name || "—"}</div>
            <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {request.leave_type?.name} · {request.start_date} → {request.end_date} ({Number(request.day_count).toFixed(request.day_count % 1 ? 1 : 0)} day{Number(request.day_count) === 1 ? "" : "s"})
            </div>
            {request.reason && (
              <div className="text-[11px] mt-1" style={{ color: TEXT_SECONDARY }}>
                Reason: {request.reason}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              {isReject ? "Reason for rejection (required)" : (isCancel ? "Cancellation note (optional)" : "Approval note (optional)")}
            </label>
            <textarea
              rows={3} value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              required={noteRequired}
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
            style={{ background: isReject ? "#B91C1C" : BRAND_RED, opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {isReject ? "Reject" : isCancel ? "Confirm cancel" : "Approve"}
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────── Page ─────────── */
export default function LeaveRequestsInboxPage() {
  const user = useSelector(selectCurrentUser);
  const canRead    = hasPermission(user, "get employee-leaves");
  const canApprove = hasPermission(user, "approve employee-leaves");
  const canReject  = hasPermission(user, "reject employee-leaves");
  const canCancel  = hasPermission(user, "cancel employee-leaves");

  const [tab, setTab] = useState("submitted");
  const [q, setQ] = useState("");
  const [typeUuid, setTypeUuid] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modal, setModal] = useState(null); // { kind, request }

  const { data: typesResp } = useGetQuery({
    path: "employee/leave/types", params: { active: 1 },
  });
  const types = useMemo(() => typesResp?.data || [], [typesResp]);
  const typeIdByUuid = useMemo(() => {
    const m = {};
    types.forEach((t) => { m[t.uuid] = t; });
    return m;
  }, [types]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage, status: tab };
    if (q.trim()) p.q = q.trim();
    if (typeUuid) {
      // BE expects leave_type_id; resolve from uuid.
      const t = typeIdByUuid[typeUuid];
      if (t?.uuid) {
        // We don't have id from the transformer — fall back: find by uuid not exposed.
        // Solve cleanly: just send q if not, otherwise leave_type filter goes through
        // when BE adds uuid-based filter. For now, skip and filter client-side below.
      }
    }
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [page, perPage, tab, q, typeUuid, typeIdByUuid, from, to]);

  const { data, isFetching, refetch } = useGetQuery({
    path: "employee/leave/requests",
    params,
  });

  let rows = data?.data || [];
  // Client-side filter by type uuid (BE only accepts id, not uuid).
  if (typeUuid) {
    rows = rows.filter((r) => r.leave_type?.uuid === typeUuid);
  }
  const meta = data?.meta || { total: 0, current_page: 1, last_page: 1, per_page: perPage };

  const counts = {
    submitted: tab === "submitted" ? meta.total : null,
  };

  if (!canRead) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        You don&apos;t have permission to view leave requests.
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
            <h1 className="text-xl font-semibold">Leave Requests</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Inbox · approve, reject, or cancel employee leave requests
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 mb-3 bg-white border rounded-2xl w-fit"
        style={{ borderColor: BORDER }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setPage(1); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg"
              style={
                active
                  ? { background: BRAND_RED, color: "white" }
                  : { color: TEXT_SECONDARY }
              }
            >
              <Icon size={12} />
              {t.label}
              {t.key === "submitted" && counts.submitted !== null && counts.submitted > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full"
                  style={{
                    background: active ? "rgba(255,255,255,0.2)" : t.bg,
                    color: active ? "white" : t.fg,
                  }}
                >
                  {counts.submitted}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-end gap-3 p-4 mb-4 bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Search employee
          </label>
          <div className="relative">
            <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
            <input
              type="text" value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Name or email…"
              className="w-full py-2 pl-8 pr-3 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Type
          </label>
          <select
            value={typeUuid} onChange={(e) => { setTypeUuid(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[160px]"
            style={{ borderColor: BORDER }}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.uuid} value={t.uuid}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            From
          </label>
          <input
            type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none"
            style={{ borderColor: BORDER }}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            To
          </label>
          <input
            type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg outline-none"
            style={{ borderColor: BORDER }}
          />
        </div>
        {(q || typeUuid || from || to) && (
          <button
            type="button"
            onClick={() => { setQ(""); setTypeUuid(""); setFrom(""); setTo(""); setPage(1); }}
            className="px-3 py-2 text-xs font-medium border rounded-lg"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        {isFetching ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} requests match these filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-5 py-3">Employee</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Dates</th>
                <th className="px-3 py-3 text-right">Days</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Decision</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uuid} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.employee?.full_name || "—"}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      {r.employee?.employee_id} · {r.employee?.email}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px]">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: "#" + (r.leave_type?.color || "64748B") }}
                      />
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
                    {r.reviewed_by ? (
                      <>
                        <div className="font-medium">{r.reviewed_by.name}</div>
                        <div style={{ color: TEXT_MUTED }}>{r.decided_at?.slice(0, 10)}</div>
                        {r.decision_note && (
                          <div className="text-[10px] mt-0.5 italic" style={{ color: TEXT_MUTED }}>
                            &ldquo;{r.decision_note.slice(0, 60)}{r.decision_note.length > 60 ? "…" : ""}&rdquo;
                          </div>
                        )}
                      </>
                    ) : r.cancelled_by ? (
                      <>
                        <div className="font-medium">Cancelled by {r.cancelled_by.name}</div>
                        <div style={{ color: TEXT_MUTED }}>{r.cancelled_at?.slice(0, 10)}</div>
                      </>
                    ) : (
                      <span style={{ color: TEXT_MUTED }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {r.status === "submitted" && (
                      <>
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => setModal({ kind: "approve", request: r })}
                            className="px-2 py-1 text-[11px] font-medium text-white rounded mr-1"
                            style={{ background: "#15803D" }}
                          >
                            Approve
                          </button>
                        )}
                        {canReject && (
                          <button
                            type="button"
                            onClick={() => setModal({ kind: "reject", request: r })}
                            className="px-2 py-1 text-[11px] font-medium text-white rounded mr-1"
                            style={{ background: "#B91C1C" }}
                          >
                            Reject
                          </button>
                        )}
                      </>
                    )}
                    {(r.status === "submitted" || r.status === "approved") && canCancel && (
                      <button
                        type="button"
                        onClick={() => setModal({ kind: "cancel", request: r })}
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
        <SimplePagination
          page={meta.current_page || 1}
          total={meta.total || 0}
          perPage={meta.per_page || perPage}
          onPageChange={setPage}
          onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
        />
      </div>

      {modal && (
        <DecisionModal
          kind={modal.kind}
          request={modal.request}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); refetch(); }}
        />
      )}
    </div>
  );
}
