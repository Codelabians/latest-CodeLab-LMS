import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Building2,
  Loader2,
  ShieldCheck,
  FileText,
  CreditCard,
  PhoneCall,
  ScrollText,
  X,
  Mail,
  Calendar,
  MapPin,
  Heart,
  GraduationCap,
  Receipt,
  Network,
  Users as UsersIcon,
  Clock,
  History,
  IdCard,
  Star,
  Crown,
  Wallet,
  UserMinus,
  UserCheck,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_EMPLOYEES, HR_EMPLOYEE_EDIT } from "../../routes/RouteConstants";
import PrintIdCard from "../../common/PrintIdCard";

import EmergencyContactsTab from "./tabs/EmergencyContactsTab";
import BankAccountsTab from "./tabs/BankAccountsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import ContractsTab from "./tabs/ContractsTab";
import AuditLogTab from "./tabs/AuditLogTab";

/* ─────────────── brand tokens ───────────────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────── helpers ────────────────────────────────────────────── */
const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set(["ceo","coo","cto","cfo","cso","hr","it","qa","ui","ux","seo","api","sme","vp","cnic","ntn","eobi","ssi","pf"]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

const initialsOf = (first, last, fallback) => {
  const a = (first || "").trim().charAt(0).toUpperCase();
  const b = (last  || "").trim().charAt(0).toUpperCase();
  const out = `${a}${b}`;
  return out || (fallback || "?").charAt(0).toUpperCase();
};

const isFilled = (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);

/* ─────────────── reusable bits ──────────────────────────────────────── */
/**
 * Display a labelled field. Returns null when empty so sections
 * automatically collapse to only the data we actually have.
 */
const Field = ({ label, value, icon: Icon, mono }) => {
  if (!isFilled(value)) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="flex items-center gap-1.5 text-sm leading-snug" style={{ color: TEXT_PRIMARY, fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined }}>
        {Icon && <Icon size={13} style={{ color: TEXT_MUTED }} />}
        {value}
      </span>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, subtitle, accent = BRAND_RED, children, action }) => (
  <section className="overflow-hidden bg-white border shadow-sm rounded-2xl" style={{ borderColor: BORDER }}>
    <header
      className="flex items-center justify-between gap-3 px-5 py-3 border-b"
      style={{ borderColor: BORDER, background: SURFACE_ALT }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md"
            style={{ background: BRAND_RED_TINT, color: accent }}
          >
            <Icon size={14} />
          </span>
        )}
        <div className="flex flex-col">
          <h2 className="text-[13px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>{title}</h2>
          {subtitle && <span className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{subtitle}</span>}
        </div>
      </div>
      {action}
    </header>
    <div className="px-5 py-4">{children}</div>
  </section>
);

const StatusPill = ({ tone, icon: Icon, children }) => {
  const tones = {
    green:   { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
    red:     { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
    amber:   { color: "#A16207", bg: "#FEFCE8", border: "#FDE68A" },
    slate:   { color: "#334155", bg: "#F1F5F9", border: "#E2E8F0" },
    brand:   { color: BRAND_RED, bg: BRAND_RED_TINT, border: "#FECACA" },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full border"
      style={{ color: t.color, background: t.bg, borderColor: t.border }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
};

const Chip = ({ children, tone = "slate", icon: Icon }) => {
  const tones = {
    slate: { color: TEXT_PRIMARY, bg: SURFACE_ALT, border: BORDER },
    brand: { color: BRAND_RED, bg: BRAND_RED_TINT, border: "#FECACA" },
    blue:  { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
    green: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border"
      style={{ color: t.color, background: t.bg, borderColor: t.border }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
};

const SeverityChip = ({ severity }) => {
  const isBlocker = severity === "blocker";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase rounded"
      style={{
        color: isBlocker ? "#DC2626" : "#CA8A04",
        background: isBlocker ? "#FEF2F2" : "#FEFCE8",
      }}
    >
      {severity}
    </span>
  );
};

/* ─────────────── Override modal ─────────────────────────────────────── */
const OverrideDialog = ({ open, onCancel, onConfirm, busy }) => {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Apply payroll override</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <p className="mb-3 text-sm" style={{ color: TEXT_SECONDARY }}>
          This will bypass payroll-readiness checks for this employee. The reason will be stamped on the profile for audit.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Urgent hire, bank letter arriving Monday"
          className="w-full px-3 py-2 mb-3 text-sm border rounded-md outline-none focus:ring-2"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded-md" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason || reason.length < 5 || busy}
            className="px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-40"
            style={{ background: BRAND_RED }}
          >
            {busy ? <Loader2 size={14} className="inline animate-spin" /> : "Apply override"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Offboard modal ─────────────────────────────────────── */
const SEPARATION_TYPES = [
  { value: "resignation", label: "Resignation" },
  { value: "termination", label: "Termination" },
  { value: "end_of_contract", label: "End of contract" },
  { value: "absconded", label: "Absconded" },
  { value: "retirement", label: "Retirement" },
];

const OffboardDialog = ({ open, employeeName, onCancel, onConfirm, busy }) => {
  const [type, setType] = useState("resignation");
  const [reason, setReason] = useState("");
  const [lastDay, setLastDay] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <UserMinus size={16} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Offboard employee</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY, lineHeight: 1.55 }}>
          This keeps <strong style={{ color: TEXT_PRIMARY }}>{employeeName}</strong>&apos;s full record for history, but
          <strong style={{ color: TEXT_PRIMARY }}> disables their account</strong> — their login is turned off and any
          open session is signed out immediately. You can reactivate later.
        </p>

        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Separation type</label>
        <select
          value={type} onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 mb-3 text-sm border rounded-md outline-none"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
        >
          {SEPARATION_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Last working day</label>
        <input
          type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)}
          className="w-full px-3 py-2 mb-3 text-sm border rounded-md outline-none"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
        />
        <p className="text-[11px] mb-3" style={{ color: TEXT_MUTED }}>Leave blank to use today.</p>

        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Reason <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span></label>
        <textarea
          rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Resigned to pursue higher studies"
          className="w-full px-3 py-2 mb-4 text-sm border rounded-md outline-none"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded-md" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onConfirm({ separation_type: type, separation_reason: reason || undefined, last_working_day: lastDay || undefined })}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-40"
            style={{ background: BRAND_RED }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
            Offboard &amp; disable
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Reactivate modal ───────────────────────────────────── */
const ReactivateDialog = ({ open, employeeName, onCancel, onConfirm, busy }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: "#F0FDF4", color: "#15803D" }}>
              <UserCheck size={16} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Reactivate employee</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <p className="mb-5 text-sm" style={{ color: TEXT_SECONDARY, lineHeight: 1.55 }}>
          Re-enable <strong style={{ color: TEXT_PRIMARY }}>{employeeName}</strong>&apos;s account and set their status back to
          <strong style={{ color: TEXT_PRIMARY }}> active</strong>. Their login is restored (they sign in again to get a fresh
          session) and the separation details are cleared. The audit trail keeps the history.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded-md" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-40"
            style={{ background: "#15803D" }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            Reactivate account
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── empty-section placeholder ──────────────────────────── */
const EmptyHint = ({ children }) => (
  <p className="text-[12px] italic" style={{ color: TEXT_MUTED }}>{children}</p>
);

/* ─────────────── main page ──────────────────────────────────────────── */
const EmployeeDetailPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const canUpdate = hasPermission(user, "update employee");
  const canComplete = hasPermission(user, "complete employee-onboarding");

  const { data, isFetching, refetch } = useGetQuery({ path: `employee/profiles/${uuid}` });
  const profile = data?.data || null;

  const [postCompleteOnboarding, { isLoading: completing }] = usePostMutation();
  const [postApplyOverride, { isLoading: applyingOverride }] = usePostMutation();
  const [deleteOverride, { isLoading: clearingOverride }] = useDeleteMutation();
  const [postSeparate, { isLoading: separating }] = usePostMutation();
  const [postReactivate, { isLoading: reactivating }] = usePostMutation();
  const [postResendCreds, { isLoading: resendingCreds }] = usePostMutation();

  const handleResendCredentials = async () => {
    const uid = profile.user?.user_uuid;
    if (!uid) { showToast("This employee has no linked user account.", "error"); return; }
    if (!window.confirm("Email fresh login details to this employee? Their current password will be reset.")) return;
    try {
      const res = await postResendCreds({ path: `employee/profiles/${profile.uuid}/resend-credentials`, body: {} }).unwrap();
      showToast(res?.message || res?.data || "Login details emailed.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Could not send login details.", "error");
    }
  };
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [showSalary, setShowSalary] = useState(false);

  if (isFetching && !profile) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: TEXT_MUTED }}>
        <Loader2 className="mr-2 animate-spin" size={16} /> Loading employee…
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_MUTED }}>
        Employee not found.
        <button onClick={() => navigate(HR_EMPLOYEES)} className="ml-2 underline">Back to list</button>
      </div>
    );
  }

  const fullName = profile.user
    ? `${profile.user.first_name || ""} ${profile.user.last_name || ""}`.trim() || profile.employee_id
    : profile.employee_id;
  const initials = initialsOf(profile.user?.first_name, profile.user?.last_name, profile.employee_id);
  const roles = Array.isArray(profile.roles) ? profile.roles : [];
  const departments = Array.isArray(profile.departments) ? profile.departments : [];
  const services = Array.isArray(profile.services) ? profile.services : [];
  const offices = Array.isArray(profile.offices) ? profile.offices : [];

  const handleCompleteOnboarding = async () => {
    try {
      await postCompleteOnboarding({
        path: `employee/profiles/${profile.uuid}/complete-onboarding`,
        body: {},
      }).unwrap();
      showToast("Onboarding complete · welcome email queued · QR badge generated", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not complete onboarding.", "error");
    }
  };

  const handleApplyOverride = async (reason) => {
    try {
      await postApplyOverride({
        path: `employee/profiles/${profile.uuid}/payroll-override`,
        body: { reason },
      }).unwrap();
      showToast("Payroll override applied", "success");
      setOverrideOpen(false);
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Override failed.", "error");
    }
  };

  const handleClearOverride = async () => {
    try {
      await deleteOverride({ path: `employee/profiles/${profile.uuid}/payroll-override` }).unwrap();
      showToast("Payroll override cleared", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not clear override.", "error");
    }
  };

  const handleOffboard = async (body) => {
    try {
      await postSeparate({
        path: `employee/profiles/${profile.uuid}/separate`,
        body,
      }).unwrap();
      showToast("Employee offboarded · account disabled · sessions revoked", "success");
      setOffboardOpen(false);
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not offboard employee.", "error");
    }
  };

  const handleReactivate = async () => {
    try {
      await postReactivate({
        path: `employee/profiles/${profile.uuid}/reactivate`,
        body: {},
      }).unwrap();
      showToast("Employee reactivated · account re-enabled", "success");
      setReactivateOpen(false);
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not reactivate employee.", "error");
    }
  };

  // Separated/terminated employees show "Reactivate"; everyone else with a
  // linked account shows "Offboard".
  const isOffboarded = ["separated", "terminated"].includes(profile.employment_status);

  /* ─── Hero header ─── */
  const Hero = (
    <div
      className="relative p-6 mb-5 overflow-hidden text-white shadow-sm rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${BRAND_RED} 0%, #8B0404 100%)`,
      }}
    >
      {/* decorative blob */}
      <div
        className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20"
        style={{ background: "white", filter: "blur(40px)" }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <button
            onClick={() => navigate(HR_EMPLOYEES)}
            className="p-2 rounded-md hover:bg-white/15 transition shrink-0"
            title="Back to employees"
          >
            <ChevronLeft size={18} />
          </button>
          {/* Avatar — professional photo when uploaded, initials as
              fallback. The BE exposes profile.profile_photo_url (latest
              non-superseded photo). On image-load failure we hide the
              <img> via CSS and reveal the initials hidden beneath. */}
          <div
            className="relative flex items-center justify-center w-16 h-16 overflow-hidden text-xl font-bold rounded-full shrink-0"
            style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.35)" }}
          >
            <span aria-hidden="true">{initials}</span>
            {profile.profile_photo_url && (
              <img
                src={profile.profile_photo_url}
                alt={fullName}
                className="absolute inset-0 object-cover w-full h-full"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate sm:text-2xl">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs opacity-90">
              <span className="font-mono">{profile.employee_id}</span>
              {profile.designation && <><span>·</span><span>{profile.designation}</span></>}
              {profile.brand?.name && <><span>·</span><span className="inline-flex items-center gap-1"><Building2 size={11} /> {profile.brand.name}</span></>}
            </div>
            {/* role chips */}
            {roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {roles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md"
                    style={{
                      background: r.is_primary ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
                      color: r.is_primary ? BRAND_RED : "white",
                      border: r.is_primary ? "1px solid rgba(255,255,255,1)" : "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {r.is_primary && <Crown size={10} />}
                    {titleCase(r.name)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <PrintIdCard
            variant="employee"
            style={{ background: "white", color: BRAND_RED }}
            person={{
              name: fullName,
              photoUrl: profile.profile_photo_url,
              idLabel: "Employee ID",
              idValue: profile.employee_id,
              roleLine: profile.designation || titleCase(roles.find((r) => r.is_primary)?.name || roles[0]?.name || ""),
              subLine: profile.brand?.name || departments[0]?.name || "",
              dateLabel: "Joining Date",
              dateValue: profile.joining_date_effective || "",
              phone: profile.user?.contact,
              email: profile.user?.email,
              website: "codelab.pk",
              address: [profile.user?.address, profile.user?.city].filter(Boolean).join(", "),
              profileUrl: profile.user?.user_uuid
                ? `${window.location.origin}/u/${profile.user.user_uuid}`
                : profile.employee_id,
            }}
          />
          {canUpdate && (
            <button
              onClick={() => navigate(HR_EMPLOYEE_EDIT.replace(":uuid", profile.uuid))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm transition"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <Briefcase size={12} /> Edit profile
            </button>
          )}
          {canUpdate && profile.user?.user_uuid && (
            <button
              onClick={handleResendCredentials}
              disabled={resendingCreds}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm disabled:opacity-50 transition"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
              title="Reset password and email login details to this employee"
            >
              {resendingCreds ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send login details
            </button>
          )}
          {!profile.onboarding.completed && canComplete && (
            <button
              onClick={handleCompleteOnboarding}
              disabled={completing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md disabled:opacity-50 transition"
              style={{ background: "white", color: BRAND_RED }}
            >
              {completing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Complete onboarding
            </button>
          )}
          {profile.payroll.override_active ? (
            <button
              onClick={handleClearOverride}
              disabled={clearingOverride}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm disabled:opacity-50 transition"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <ShieldCheck size={12} /> Clear override
            </button>
          ) : (
            canUpdate && (
              <button
                onClick={() => setOverrideOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm transition"
                style={{ background: "rgba(255,255,255,0.10)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <ShieldCheck size={12} /> Override payroll
              </button>
            )
          )}
          {/* Offboarding — keep the record, disable the account. Reactivate
              reverses it. Gated on update-employee. */}
          {canUpdate && (
            isOffboarded ? (
              <button
                onClick={() => setReactivateOpen(true)}
                disabled={reactivating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md disabled:opacity-50 transition"
                style={{ background: "white", color: "#15803D" }}
                title="Re-enable this account and set status active"
              >
                {reactivating ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                Reactivate
              </button>
            ) : (
              <button
                onClick={() => setOffboardOpen(true)}
                disabled={separating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md backdrop-blur-sm disabled:opacity-50 transition"
                style={{ background: "rgba(255,255,255,0.10)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
                title="Keep the record but disable this employee's account"
              >
                <UserMinus size={12} /> Offboard
              </button>
            )
          )}
        </div>
      </div>

      {/* status strip */}
      <div className="relative flex flex-wrap items-center gap-2 mt-5">
        {profile.employment_status && (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: profile.employment_status === "active" ? "#86EFAC" : profile.employment_status === "separated" ? "#FCA5A5" : "#FCD34D" }}
            />
            {titleCase(profile.employment_status)}
          </span>
        )}
        {profile.onboarding.completed ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            <CheckCircle2 size={11} /> Onboarded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            <Clock size={11} /> Pre-onboarding
          </span>
        )}
        {profile.payroll.ready ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(134,239,172,0.25)", color: "white", border: "1px solid rgba(134,239,172,0.5)" }}>
            <Wallet size={11} /> Payroll ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(252,165,165,0.20)", color: "white", border: "1px solid rgba(252,165,165,0.45)" }}>
            <AlertTriangle size={11} /> Payroll blocked
          </span>
        )}
        {profile.probation_ends_soon && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={{ background: "rgba(253,224,71,0.25)", color: "white", border: "1px solid rgba(253,224,71,0.5)" }}>
            <Calendar size={11} /> Probation ending soon
          </span>
        )}
      </div>
    </div>
  );

  /* ─── KPI strip ─── */
  const KpiTile = ({ icon: Icon, label, value, sub, tone = BRAND_RED }) => (
    <div className="flex items-center gap-3 p-3.5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: BRAND_RED_TINT, color: tone }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</div>
        <div className="text-[13.5px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{value || "—"}</div>
        {sub && <div className="text-[10.5px] mt-0.5" style={{ color: TEXT_MUTED }}>{sub}</div>}
      </div>
    </div>
  );

  const KpiStrip = (
    <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
      <KpiTile
        icon={Calendar}
        label="Joining date"
        value={profile.joining_date_effective || "Not set"}
        sub={profile.contract_start ? `Contract from ${profile.contract_start}` : null}
      />
      <KpiTile
        icon={ShieldCheck}
        label="Probation"
        value={profile.probation_confirmed ? "Confirmed" : (profile.probation_months ? `${profile.probation_months} mo` : "—")}
        sub={profile.probation_end_date ? `Ends ${profile.probation_end_date}` : null}
      />
      <KpiTile
        icon={Wallet}
        label="Basic salary"
        value={
          profile.basic_salary ? (
            <span className="inline-flex items-center gap-1.5">
              {showSalary ? `PKR ${Number(profile.basic_salary).toLocaleString()}` : "PKR ••••••"}
              <button
                type="button"
                onClick={() => setShowSalary((s) => !s)}
                title={showSalary ? "Hide salary" : "Show salary"}
                style={{ color: TEXT_MUTED }}
              >
                {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </span>
          ) : (
            "—"
          )
        }
        sub={titleCase(profile.employment_type)}
      />
      <KpiTile
        icon={MapPin}
        label="Work location"
        value={titleCase(profile.work_location) || "—"}
        sub={titleCase(profile.work_schedule_type)}
      />
    </div>
  );

  /* ─── Tabs ─── */
  const tabs = [
    { id: "overview",  label: "Overview",          icon: Briefcase },
    { id: "payroll",   label: "Payroll readiness", icon: ShieldCheck },
    { id: "contacts",  label: "Emergency contacts",icon: PhoneCall },
    { id: "bank",      label: "Bank accounts",     icon: CreditCard },
    { id: "documents", label: "Documents",         icon: FileText },
    { id: "contracts", label: "Contracts",         icon: ScrollText },
    { id: "history",   label: "History",           icon: History },
  ];

  const TabBar = (
    <div className="flex gap-1 p-1 mb-5 bg-white border shadow-sm rounded-xl" style={{ borderColor: BORDER }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition"
            style={{
              background: active ? BRAND_RED_TINT : "transparent",
              color: active ? BRAND_RED : TEXT_SECONDARY,
            }}
          >
            <Icon size={13} />
            {t.label}
          </button>
        );
      })}
    </div>
  );

  /* ─── Weekly schedule helper ─── */
  const renderSchedule = () => {
    const sched = profile.weekly_schedule;
    if (!sched || typeof sched !== "object") return null;
    const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const norm = (v) => Array.isArray(v) ? v : (v ? [v] : []);
    const hasAny = days.some((d) => norm(sched[d]).length > 0);
    if (!hasAny) return null;
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const shifts = norm(sched[day]);
          const off = shifts.length === 0;
          return (
            <div
              key={day}
              className="flex flex-col p-3 border rounded-lg"
              style={{
                borderColor: off ? BORDER : "#FECACA",
                background: off ? SURFACE_ALT : "white",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: off ? TEXT_MUTED : BRAND_RED }}>
                  {day.slice(0, 3)}
                </span>
                {off && <span className="text-[10px]" style={{ color: TEXT_MUTED }}>off</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                {shifts.map((s, i) => (
                  <div key={i} className="px-2 py-1.5 rounded text-[11px]" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <div className="font-mono font-semibold">{s.start || "—"}–{s.end || "—"}</div>
                    {s.office_slug && <div className="text-[10px] opacity-80">{s.office_slug}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── Overview pane ─── */
  // Pre-compute which sections have any content to know whether to show them
  const hasIdentity = isFilled(profile.user?.cnic) || isFilled(profile.user?.father_name) || isFilled(profile.user?.dob) || isFilled(profile.user?.gender);
  const hasContact  = isFilled(profile.user?.email) || isFilled(profile.user?.contact) || isFilled(profile.personal?.personal_email) || isFilled(profile.user?.address) || isFilled(profile.user?.city);
  const hasPersonal = isFilled(profile.personal?.blood_group) || isFilled(profile.personal?.religion) || isFilled(profile.personal?.nationality);
  const hasFamily   = isFilled(profile.family?.spouse_name) || isFilled(profile.family?.spouse_cnic) || isFilled(profile.family?.spouse_phone) || isFilled(profile.family?.dependents_count);
  const hasEducation= isFilled(profile.education?.highest_qualification) || isFilled(profile.education?.university_name) || isFilled(profile.education?.graduation_year);
  const hasTax      = isFilled(profile.tax_statutory?.ntn_number) || isFilled(profile.tax_statutory?.eobi_number) || isFilled(profile.tax_statutory?.ssi_number) || isFilled(profile.tax_statutory?.pf_number) || isFilled(profile.tax_statutory?.tax_filing_status);
  const hasOrg      = roles.length > 0 || departments.length > 0 || services.length > 0 || offices.length > 0;
  const hasRetention= isFilled(profile.security_retention?.amount) || isFilled(profile.security_retention?.collected) || (profile.security_retention?.status && profile.security_retention.status !== "pending");

  const OverviewPane = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

      {/* Employment — always shown, anchors the page */}
      <SectionCard icon={Briefcase} title="Employment" subtitle="Role, contract & schedule">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Employee ID" value={profile.employee_id} mono />
          <Field label="Designation" value={profile.designation} />
          <Field label="Brand"       value={profile.brand?.name} />
          <Field label="Manager"     value={profile.manager?.full_name} />
          <Field label="Employment type" value={titleCase(profile.employment_type)} />
          <Field label="Schedule"        value={titleCase(profile.work_schedule_type)} />
          <Field label="Work location"   value={titleCase(profile.work_location)} />
          <Field label="Joining date"    value={profile.joining_date_effective} />
          <Field label="Contract start"  value={profile.contract_start} />
          <Field label="Contract end"    value={profile.contract_end} />
          <Field label="Probation months" value={profile.probation_months} />
          <Field label="Probation end"    value={profile.probation_end_date} />
          <Field
            label="Basic salary (PKR)"
            value={
              profile.basic_salary ? (
                <span className="inline-flex items-center gap-1.5">
                  {showSalary ? Number(profile.basic_salary).toLocaleString() : "••••••"}
                  <button
                    type="button"
                    onClick={() => setShowSalary((s) => !s)}
                    title={showSalary ? "Hide salary" : "Show salary"}
                    style={{ color: TEXT_MUTED }}
                  >
                    {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </span>
              ) : null
            }
          />
          <Field label="Status"             value={titleCase(profile.employment_status)} />
        </div>
      </SectionCard>

      {/* Identity */}
      {hasIdentity ? (
        <SectionCard icon={IdCard} title="Identity">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Full name"   value={fullName} />
            <Field label="Father name" value={profile.user?.father_name} />
            <Field label="Date of birth" value={profile.user?.dob} />
            <Field label="Gender"      value={titleCase(profile.user?.gender)} />
            <Field label="CNIC"        value={profile.user?.cnic} mono />
          </div>
        </SectionCard>
      ) : (
        <SectionCard icon={IdCard} title="Identity">
          <EmptyHint>No identity details captured yet.{canUpdate && " Use Edit profile to add them."}</EmptyHint>
        </SectionCard>
      )}

      {/* Contact */}
      {hasContact && (
        <SectionCard icon={PhoneCall} title="Contact">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Work email"     icon={Mail} value={profile.user?.email} />
            <Field label="Personal email" icon={Mail} value={profile.personal?.personal_email} />
            <Field label="Phone"          icon={PhoneCall} value={profile.user?.contact} />
            <Field label="City"           value={profile.user?.city} />
            <div className="col-span-2">
              <Field label="Address" icon={MapPin} value={profile.user?.address} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Organization (roles / departments / services / offices) */}
      {hasOrg && (
        <SectionCard icon={Network} title="Organization" subtitle="Roles, departments, services & offices">
          <div className="flex flex-col gap-4">
            {roles.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Roles</div>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <Chip key={r.id} tone={r.is_primary ? "brand" : "slate"} icon={r.is_primary ? Crown : undefined}>
                      {titleCase(r.name)}
                      {r.is_primary && <span className="ml-1 opacity-70">· primary</span>}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {departments.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Departments</div>
                <div className="flex flex-wrap gap-1.5">
                  {departments.map((d) => (
                    <Chip key={d.id} tone={d.is_primary ? "brand" : "blue"} icon={d.is_primary ? Star : Building2}>
                      {d.name || titleCase(d.slug)}
                      {d.role_in_department && d.role_in_department !== "member" && (
                        <span className="ml-1 opacity-70">· {titleCase(d.role_in_department)}</span>
                      )}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {services.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <Chip key={s.id} tone="green">
                      {s.name || titleCase(s.slug)}
                      {s.proficiency && <span className="ml-1 opacity-70">· {titleCase(s.proficiency)}</span>}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {offices.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Offices</div>
                <div className="flex flex-wrap gap-1.5">
                  {offices.map((o) => (
                    <Chip key={o.id} tone={o.is_primary ? "brand" : "slate"} icon={MapPin}>
                      {o.name || titleCase(o.slug)}
                      {Array.isArray(o.days) && o.days.length > 0 && (
                        <span className="ml-1 opacity-70">· {o.days.join(", ")}</span>
                      )}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Personal */}
      {hasPersonal && (
        <SectionCard icon={Heart} title="Personal">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Blood group" value={profile.personal?.blood_group} />
            <Field label="Religion"    value={profile.personal?.religion} />
            <Field label="Nationality" value={profile.personal?.nationality} />
          </div>
        </SectionCard>
      )}

      {/* Family */}
      {hasFamily && (
        <SectionCard icon={UsersIcon} title="Family">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Spouse name"  value={profile.family?.spouse_name} />
            <Field label="Spouse CNIC"  value={profile.family?.spouse_cnic} mono />
            <Field label="Spouse phone" value={profile.family?.spouse_phone} mono />
            <Field label="Dependents"   value={profile.family?.dependents_count} />
          </div>
        </SectionCard>
      )}

      {/* Education */}
      {hasEducation && (
        <SectionCard icon={GraduationCap} title="Education">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Highest qualification" value={profile.education?.highest_qualification} />
            <Field
              label="University / Institute"
              value={
                profile.education?.institute?.display_name
                || profile.education?.university_name
              }
              icon={GraduationCap}
            />
            <Field label="Graduation year"        value={profile.education?.graduation_year} />
          </div>
        </SectionCard>
      )}

      {/* Tax & Statutory */}
      {hasTax && (
        <SectionCard icon={Receipt} title="Tax & Statutory">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="NTN #"      value={profile.tax_statutory?.ntn_number} mono />
            <Field label="EOBI #"     value={profile.tax_statutory?.eobi_number} mono />
            <Field label="SSI #"      value={profile.tax_statutory?.ssi_number} mono />
            <Field label="PF #"       value={profile.tax_statutory?.pf_number} mono />
            <Field label="Tax filing" value={titleCase(profile.tax_statutory?.tax_filing_status)} />
          </div>
        </SectionCard>
      )}

      {/* Security retention */}
      {hasRetention && (
        <SectionCard icon={ShieldCheck} title="Security retention">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Amount"
              value={profile.security_retention?.amount ? `PKR ${Number(profile.security_retention.amount).toLocaleString()}` : null} />
            <Field label="Split months" value={profile.security_retention?.split_months} />
            <Field label="Collected"
              value={profile.security_retention?.collected ? `PKR ${Number(profile.security_retention.collected).toLocaleString()}` : null} />
            <Field label="Status" value={titleCase(profile.security_retention?.status)} />
          </div>
        </SectionCard>
      )}

      {/* Weekly schedule (spans full width if present) */}
      {renderSchedule() && (
        <div className="lg:col-span-2">
          <SectionCard icon={Clock} title="Weekly schedule" subtitle="Per-day shifts across offices">
            {renderSchedule()}
          </SectionCard>
        </div>
      )}
    </div>
  );

  /* ─── Payroll pane ─── */
  const PayrollPane = (
    <SectionCard
      icon={ShieldCheck}
      title="Payroll readiness"
      subtitle={
        profile.payroll.ready
          ? (profile.payroll.override_active ? "Ready (admin override active)" : "Ready — payroll engine will pick this employee up.")
          : "Not ready — clear the blockers below to enable payroll."
      }
      action={
        <StatusPill tone={profile.payroll.ready ? "green" : "red"} icon={profile.payroll.ready ? CheckCircle2 : AlertTriangle}>
          {profile.payroll.ready ? "Ready" : "Blocked"}
        </StatusPill>
      }
    >
      {profile.payroll.override_active && (
        <div className="p-3 mb-4 border rounded-md" style={{ borderColor: "#FACC15", background: "#FEFCE8" }}>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#854D0E" }}>
            <ShieldCheck size={14} /> Override active
          </div>
          <p className="mt-1 text-xs" style={{ color: "#854D0E" }}>
            Applied {profile.payroll.override_at} · by user #{profile.payroll.override_by}
          </p>
          <p className="mt-1 text-xs italic" style={{ color: "#854D0E" }}>
            &ldquo;{profile.payroll.override_reason}&rdquo;
          </p>
        </div>
      )}

      {(profile.payroll.blockers || []).length === 0 ? (
        <div className="py-8 text-sm text-center" style={{ color: TEXT_MUTED }}>
          <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: "#16A34A" }} />
          All checks passing.
        </div>
      ) : (
        <ul className="space-y-2">
          {profile.payroll.blockers.map((b) => (
            <li
              key={b.code}
              className="flex items-start gap-3 px-3 py-2 border rounded-md"
              style={{ borderColor: BORDER, background: SURFACE_ALT }}
            >
              <SeverityChip severity={b.severity} />
              <div className="flex-1">
                <div className="text-sm" style={{ color: TEXT_PRIMARY }}>{b.message}</div>
                <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  Action: <span className="font-mono">{b.action_required}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {Hero}
      {KpiStrip}
      {TabBar}

      {tab === "overview"  && OverviewPane}
      {tab === "payroll"   && PayrollPane}
      {tab === "contacts"  && <EmergencyContactsTab profile={profile} refetch={refetch} />}
      {tab === "bank"      && <BankAccountsTab     profile={profile} refetch={refetch} />}
      {tab === "documents" && <DocumentsTab        profile={profile} refetch={refetch} />}
      {tab === "contracts" && <ContractsTab        profile={profile} refetch={refetch} />}
      {tab === "history"   && <AuditLogTab         profile={profile} />}

      <OverrideDialog
        open={overrideOpen}
        onCancel={() => setOverrideOpen(false)}
        onConfirm={handleApplyOverride}
        busy={applyingOverride}
      />
      <OffboardDialog
        open={offboardOpen}
        employeeName={fullName}
        onCancel={() => setOffboardOpen(false)}
        onConfirm={handleOffboard}
        busy={separating}
      />
      <ReactivateDialog
        open={reactivateOpen}
        employeeName={fullName}
        onCancel={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
        busy={reactivating}
      />
    </div>
  );
};

export default EmployeeDetailPage;
