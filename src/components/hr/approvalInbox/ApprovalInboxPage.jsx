import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Clock,
  RefreshCw,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";

/* ─────────────────────── brand tokens ─────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const ROLE_OPTIONS = [
  { key: "HR",          label: "HR" },
  { key: "ADMIN",       label: "Admin" },
  { key: "TEAM_LEAD",   label: "Team Lead" },
  { key: "MANAGER",     label: "Manager" },
  { key: "FINANCE",     label: "Finance" },
  { key: "CEO",         label: "CEO" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
];

const roleColor = (roleKey) => {
  switch ((roleKey || "").toUpperCase()) {
    case "HR":          return { bg: "#FEF2F2", fg: "#C90606", border: "#FCA5A5" };
    case "ADMIN":       return { bg: "#EFF6FF", fg: "#1D4ED8", border: "#93C5FD" };
    case "TEAM_LEAD":   return { bg: "#F0FDF4", fg: "#15803D", border: "#86EFAC" };
    case "CEO":         return { bg: "#FAF5FF", fg: "#7E22CE", border: "#D8B4FE" };
    case "MANAGER":     return { bg: "#FFF7ED", fg: "#C2410C", border: "#FDBA74" };
    case "FINANCE":     return { bg: "#FEFCE8", fg: "#A16207", border: "#FDE047" };
    case "SUPER_ADMIN": return { bg: "#F5F3FF", fg: "#5B21B6", border: "#C4B5FD" };
    default:            return { bg: "#F1F5F9", fg: "#475569", border: "#CBD5E1" };
  }
};

/* ─────────────────────── relative time ─────────────────────── */
const relativeTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return d.toLocaleString();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

/* ─────────────────────── decision dialog ─────────────────────── */
const ActDialog = ({ open, decision, instance, onCancel, onConfirm, isLoading }) => {
  const [comment, setComment] = useState("");
  if (!open || !instance) return null;
  const isApprove = decision === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{
              width: 36, height: 36, borderRadius: 10,
              background: isApprove ? "#DCFCE7" : BRAND_RED_TINT,
              color: isApprove ? "#15803D" : BRAND_RED,
            }}>
              {isApprove ? <CheckCircle2 size={16} strokeWidth={2.25} /> : <XCircle size={16} strokeWidth={2.25} />}
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isApprove ? "Approve" : "Reject"} this request
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {instance.chain_name} · step {instance.current_step_order}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-md" style={{ width: 30, height: 30, color: TEXT_MUTED }}><X size={15} /></button>
        </div>
        <div className="px-5 py-5">
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
            Comment {!isApprove && <span style={{ color: BRAND_RED }}>(required for rejections — explain why)</span>}
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApprove ? "Optional note for the audit trail…" : "Reason for rejection…"}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${BORDER}`, fontSize: 13.5, outline: "none", resize: "vertical",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
          {!isApprove && comment.trim().length === 0 && (
            <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
              Tip: rejection without a reason leaves the requester confused.
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button
            onClick={() => onConfirm({ comment })}
            disabled={isLoading || (!isApprove && comment.trim().length === 0)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{
              background: isApprove ? "#16A34A" : BRAND_RED, color: "#fff",
              opacity: (isLoading || (!isApprove && comment.trim().length === 0)) ? 0.6 : 1,
            }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : (isApprove ? <CheckCircle2 size={14} /> : <XCircle size={14} />)}
            {isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── timeline view ─────────────────────── */
const StepsTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-2">
      {timeline.map((step, i) => {
        const c = roleColor(step.role_key);
        const isPending = step.status === "pending";
        const isApproved = step.status === "approve";
        const isRejected = step.status === "reject";
        return (
          <span key={i} className="inline-flex items-center gap-1">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-[0.3px]"
              style={{
                background: isApproved ? "#DCFCE7" : isRejected ? BRAND_RED_TINT : isPending ? c.bg : SURFACE_ALT,
                color: isApproved ? "#15803D" : isRejected ? BRAND_RED : isPending ? c.fg : TEXT_MUTED,
                border: `1px solid ${isApproved ? "#86EFAC" : isRejected ? BRAND_RED : isPending ? c.border : BORDER}`,
                opacity: step.status === "awaiting" ? 0.55 : 1,
              }}
            >
              {isApproved && <CheckCircle2 size={9} strokeWidth={2.5} />}
              {isRejected && <XCircle size={9} strokeWidth={2.5} />}
              {isPending && <Sparkles size={9} strokeWidth={2.5} />}
              {step.role_key}
            </span>
            {i < timeline.length - 1 && <ArrowRight size={10} strokeWidth={2} style={{ color: TEXT_MUTED }} />}
          </span>
        );
      })}
    </div>
  );
};

/* ─────────────────────── main page ─────────────────────── */
const ApprovalInboxPage = () => {
  const user = useSelector(selectCurrentUser);
  const canView = hasPermission(user, "get approval-instances");
  const canAct  = hasPermission(user, "act-on approval-step");

  const [roleKey, setRoleKey] = useState("HR");
  const { data, isLoading, isError, refetch, isFetching } = useGetQuery(
    { path: `employee/approvals/inbox?role_key=${roleKey}` },
    { skip: !canView },
  );

  const [act, { isLoading: isActing }] = usePostMutation();
  const [actTarget, setActTarget] = useState(null); // { instance, decision }

  const items = useMemo(() => data?.data || [], [data]);

  const handleAct = async ({ comment }) => {
    if (!actTarget) return;
    try {
      const res = await act({
        path: `employee/approvals/${actTarget.instance.uuid}/act`,
        body: {
          decision: actTarget.decision,
          actor_role_key: roleKey,
          comment: comment || undefined,
        },
      }).unwrap();
      showToast(res?.message || "Decision recorded.", "success");
      setActTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to record decision.";
      showToast(msg, "error");
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} /> <span>You don&apos;t have permission to view the approval inbox.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Inbox size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>Approval Inbox</h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Pending requests waiting for your role to act. Approve advances to the next step;
              reject ends the chain. Real instances will appear when Phase 4+ (Leaves, Promotions, Assets) ships.
            </p>
          </div>
        </div>
        <button onClick={refetch} disabled={isFetching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg"
          style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600, cursor: isFetching ? "not-allowed" : "pointer", opacity: isFetching ? 0.6 : 1 }}>
          {isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} strokeWidth={2.25} />}
          Refresh
        </button>
      </div>

      {/* Role selector */}
      <div className="rounded-2xl mb-5 p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>
            Acting as
          </span>
          {ROLE_OPTIONS.map((r) => {
            const c = roleColor(r.key);
            const isActive = roleKey === r.key;
            return (
              <button key={r.key} type="button" onClick={() => setRoleKey(r.key)}
                className="px-3 py-1.5 rounded-lg transition"
                style={{
                  fontSize: 12.5, fontWeight: 600,
                  background: isActive ? c.bg : SURFACE,
                  color: isActive ? c.fg : TEXT_SECONDARY,
                  border: `1px solid ${isActive ? c.border : BORDER}`,
                }}>
                {r.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2.5" style={{ color: TEXT_MUTED }}>
          Pick the role you&apos;re acting as. Approvals require this role to match the current step&apos;s required role.
        </p>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
          <Loader2 size={20} className="animate-spin mr-2" /> Loading inbox…
        </div>
      ) : isError ? (
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load inbox. <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center" style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}>
          <div className="mx-auto flex items-center justify-center mb-4" style={{ width: 64, height: 64, borderRadius: 16, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Inbox size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Inbox is empty</h3>
          <p className="text-[13px] mb-3" style={{ color: TEXT_SECONDARY, maxWidth: 480, margin: "0 auto" }}>
            No pending approvals for the <strong>{roleKey}</strong> role right now.
          </p>
          <p className="text-[11.5px]" style={{ color: TEXT_MUTED, maxWidth: 540, margin: "0 auto", lineHeight: 1.5 }}>
            Real items will appear here once Phase 4+ ships — leave requests (HR → Admin → Team Lead → CEO),
            promotions (HR → Admin → CEO), asset issuance (HR → Admin), reimbursement claims (Manager → Finance), etc.
            For now you can configure the chains under <strong>HR → Approval Chains</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {items.map((inst, i) => (
            <div key={inst.uuid}
              className="px-5 py-4 flex items-start gap-4"
              style={{ borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              {/* Left: chain icon */}
              <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
                <Inbox size={16} strokeWidth={2} />
              </div>

              {/* Middle: details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-[13.5px]" style={{ color: TEXT_PRIMARY }}>{inst.chain_name}</strong>
                  <span className="text-[10.5px] font-mono" style={{ color: TEXT_MUTED }}>{inst.chain_key}</span>
                  <span className="flex items-center gap-1 text-[10.5px]" style={{ color: TEXT_MUTED }}>
                    <Clock size={10} /> {relativeTime(inst.created_at)}
                  </span>
                </div>
                <div className="text-[11.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
                  Step {inst.current_step_order} · waiting on <strong>{roleKey}</strong>{" "}
                  · requestable: <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: TEXT_MUTED }}>
                    {(inst.requestable_type || "").split("\\").pop()} #{inst.requestable_id}
                  </code>
                </div>
                <StepsTimeline timeline={inst.steps_timeline} />
              </div>

              {/* Right: actions */}
              {canAct && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setActTarget({ instance: inst, decision: "approve" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md"
                    style={{ fontSize: 12, fontWeight: 600, background: "#16A34A", color: "#fff" }}>
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Approve
                  </button>
                  <button onClick={() => setActTarget({ instance: inst, decision: "reject" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md"
                    style={{ fontSize: 12, fontWeight: 600, background: SURFACE, color: BRAND_RED, border: `1px solid ${BRAND_RED}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; }}>
                    <XCircle size={12} strokeWidth={2.5} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ActDialog
        open={!!actTarget}
        decision={actTarget?.decision || "approve"}
        instance={actTarget?.instance}
        onCancel={() => setActTarget(null)}
        onConfirm={handleAct}
        isLoading={isActing}
      />
    </div>
  );
};

export default ApprovalInboxPage;
