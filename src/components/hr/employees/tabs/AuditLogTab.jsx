import { useMemo } from "react";
import {
  History,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  Network,
  Briefcase,
  MapPin,
  ChevronRight,
} from "lucide-react";

import { useGetQuery } from "../../../../api/apiSlice";

/* brand tokens — kept inline to mirror the rest of /hr/employees/tabs/ */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

/**
 * Map BE audit action slugs → display label + icon + tone. Anything missing
 * falls through to a generic "Activity" entry so we never render blank rows.
 */
const ACTIONS = {
  "employee.profile_updated": {
    label: "Profile updated", icon: Pencil, tone: { color: "#1D4ED8", bg: "#EFF6FF" },
  },
  "employee.roles_synced": {
    label: "Roles changed", icon: ShieldCheck, tone: { color: BRAND_RED, bg: BRAND_RED_TINT },
  },
  "employee.departments_synced": {
    label: "Departments changed", icon: Network, tone: { color: "#7C3AED", bg: "#F5F3FF" },
  },
  "employee.services_synced": {
    label: "Services changed", icon: Briefcase, tone: { color: "#15803D", bg: "#F0FDF4" },
  },
  "employee.offices_synced": {
    label: "Offices changed", icon: MapPin, tone: { color: "#A16207", bg: "#FEFCE8" },
  },
  "employee.onboarding_completed": {
    label: "Onboarding completed", icon: CheckCircle2, tone: { color: "#15803D", bg: "#F0FDF4" },
  },
  "employee.payroll_override_applied": {
    label: "Payroll override applied", icon: ShieldCheck, tone: { color: "#A16207", bg: "#FEFCE8" },
  },
  "employee.payroll_override_cleared": {
    label: "Payroll override cleared", icon: XCircle, tone: { color: "#475569", bg: "#F1F5F9" },
  },
  "employee.separated": {
    label: "Employee separated", icon: XCircle, tone: { color: "#B91C1C", bg: "#FEF2F2" },
  },
};
const fallbackAction = {
  label: "Activity", icon: History, tone: { color: TEXT_SECONDARY, bg: SURFACE_ALT },
};

/** Pretty-format the "old → new" diff for an EMPLOYEE_PROFILE_UPDATED row. */
const formatDiff = (diff) => {
  if (!diff || typeof diff !== "object") return null;
  const rows = [];
  for (const [field, val] of Object.entries(diff)) {
    if (field === "_other_fields_touched") {
      rows.push({ field: "other fields", old: null, new: val.join(", ") });
      continue;
    }
    rows.push({ field, old: val?.old ?? null, new: val?.new ?? null });
  }
  return rows;
};

/** Render the metadata block based on the action type. */
const ActionDetails = ({ action, metadata }) => {
  if (!metadata) return null;
  if (action === "employee.profile_updated" && metadata.diff) {
    const rows = formatDiff(metadata.diff);
    if (!rows || rows.length === 0) return null;
    return (
      <div className="mt-2 overflow-hidden border rounded-md" style={{ borderColor: BORDER }}>
        <table className="w-full text-xs">
          <thead style={{ background: SURFACE_ALT, color: TEXT_MUTED }}>
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Field</th>
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Was</th>
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.field} className="border-t" style={{ borderColor: BORDER }}>
                <td className="px-3 py-1.5 font-medium" style={{ color: TEXT_PRIMARY }}>{r.field}</td>
                <td className="px-3 py-1.5 font-mono" style={{ color: TEXT_MUTED }}>
                  {r.old === null || r.old === "" ? "—" : String(r.old).slice(0, 80)}
                </td>
                <td className="px-3 py-1.5 font-mono" style={{ color: TEXT_PRIMARY }}>
                  {r.new === null || r.new === "" ? "—" : String(r.new).slice(0, 80)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (action === "employee.roles_synced" && Array.isArray(metadata.roles)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {metadata.roles.map((r, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border"
            style={{ borderColor: BORDER, background: SURFACE_ALT, color: TEXT_SECONDARY }}>
            role #{r.id}{r.is_primary ? " · primary" : ""}
          </span>
        ))}
      </div>
    );
  }
  if (action === "employee.departments_synced" && Array.isArray(metadata.departments)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {metadata.departments.length === 0 ? (
          <span className="text-[11px] italic" style={{ color: TEXT_MUTED }}>(all departments removed)</span>
        ) : metadata.departments.map((d, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border"
            style={{ borderColor: BORDER, background: SURFACE_ALT, color: TEXT_SECONDARY }}>
            dept #{d.id} · {d.role_in_department || "member"}{d.is_primary ? " · primary" : ""}
          </span>
        ))}
      </div>
    );
  }
  if (action === "employee.offices_synced" && Array.isArray(metadata.offices)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {metadata.offices.map((o, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border"
            style={{ borderColor: BORDER, background: SURFACE_ALT, color: TEXT_SECONDARY }}>
            office #{o.id} · {(o.days_of_week || []).join(", ") || "(no days)"}
          </span>
        ))}
      </div>
    );
  }
  if (action === "employee.payroll_override_applied" && metadata.reason) {
    return <p className="mt-2 text-xs italic px-3 py-2 border rounded-md"
      style={{ borderColor: "#FACC15", background: "#FEFCE8", color: "#854D0E" }}>
      &ldquo;{metadata.reason}&rdquo;
    </p>;
  }
  if (action === "employee.separated") {
    return (
      <div className="grid grid-cols-3 gap-3 mt-2 text-xs" style={{ color: TEXT_SECONDARY }}>
        {metadata.separation_type && <div><span style={{ color: TEXT_MUTED }}>Type:</span> {metadata.separation_type}</div>}
        {metadata.last_working_day && <div><span style={{ color: TEXT_MUTED }}>Last day:</span> {metadata.last_working_day}</div>}
        {metadata.separation_reason && <div className="col-span-3"><span style={{ color: TEXT_MUTED }}>Reason:</span> {metadata.separation_reason}</div>}
      </div>
    );
  }
  return null;
};

const initialsOf = (first, last) =>
  `${(first || "?").charAt(0).toUpperCase()}${(last || "").charAt(0).toUpperCase()}`;

const AuditLogTab = ({ profile }) => {
  const { data, isFetching } = useGetQuery(
    { path: `employee/profiles/${profile.uuid}/audit-log?limit=200` },
    { skip: !profile?.uuid },
  );

  const rows = useMemo(() => {
    const items = data?.data || [];
    return Array.isArray(items) ? items : [];
  }, [data]);

  if (isFetching && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm" style={{ color: TEXT_MUTED }}>
        <Loader2 className="mr-2 animate-spin" size={16} /> Loading history…
      </div>
    );
  }

  return (
    <section className="overflow-hidden bg-white border shadow-sm rounded-2xl" style={{ borderColor: BORDER }}>
      <header className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <History size={14} />
        </span>
        <div>
          <h2 className="text-[13px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>Activity history</h2>
          <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
            Every change HR / admin has made to this employee — newest first.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="py-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
          <History size={20} className="mx-auto mb-2" />
          No activity recorded yet.
        </div>
      ) : (
        <ol className="divide-y" style={{ borderColor: BORDER }}>
          {rows.map((row) => {
            const meta = ACTIONS[row.action] || fallbackAction;
            const Icon = meta.icon;
            const performer = row.performed_by;
            return (
              <li key={row.id} className="flex gap-3 px-5 py-4">
                {/* Icon column */}
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{ background: meta.tone.bg, color: meta.tone.color }}>
                  <Icon size={16} />
                </span>
                {/* Content column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                      {meta.label}
                    </h3>
                    <span className="text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
                      {row.created_at || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                    {performer ? (
                      <>
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded-full"
                          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                          {initialsOf(performer.first_name, performer.last_name)}
                        </span>
                        <span style={{ color: TEXT_SECONDARY }}>
                          {(performer.first_name || "")} {(performer.last_name || "")}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{performer.email}</span>
                      </>
                    ) : (
                      <span className="italic">System / unknown</span>
                    )}
                    <span>·</span>
                    <span className="font-mono">{row.action}</span>
                  </div>
                  <ActionDetails action={row.action} metadata={row.metadata} />
                </div>
                <ChevronRight size={14} style={{ color: TEXT_MUTED, opacity: 0.4 }} className="shrink-0 mt-2" />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default AuditLogTab;
