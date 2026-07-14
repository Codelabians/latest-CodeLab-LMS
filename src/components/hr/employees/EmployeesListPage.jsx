import { useEffect, useMemo, useState } from "react";
import { loadRememberedFilters, loadRememberFlag, saveRememberedFilters } from "../../../hooks/useRememberFilters";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  MapPin,
  Clock,
  StickyNote,
  KeyRound,
} from "lucide-react";

import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";
import LeadNotesModal from "../../ui/LeadNotesModal";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { HR_EMPLOYEE_DETAIL, HR_EMPLOYEE_NEW } from "../../routes/RouteConstants";
import SearchableSelect from "../../ui/SearchableSelect";
import SimplePagination from "../../ui/SimplePagination";

/* ─────────────── brand tokens (mirror BrandsListPage style) ─────────── */
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

/* ─────────────── avatar (photo if available, else initials) ────────── */
/**
 * Compact circular avatar. Renders a professional photo when `src` is
 * non-null; otherwise falls back to the first letter(s) of the name (or
 * the employee_id when the name is missing). On image-load error we
 * hide the <img> so the underlying initials are revealed.
 */
const EmployeeAvatar = ({ src, name, fallback, size = 36 }) => {
  const initial = (() => {
    const n = (name || "").trim();
    if (n) {
      const parts = n.split(/\s+/);
      return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || n[0].toUpperCase();
    }
    return (fallback || "?").slice(-2).toUpperCase();
  })();
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden font-semibold rounded-full shrink-0"
      style={{
        width: size, height: size,
        background: BRAND_RED_TINT,
        color: BRAND_RED,
        fontSize: Math.round(size * 0.35),
      }}
    >
      <span aria-hidden="true">{initial}</span>
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 object-cover w-full h-full"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  );
};

/* ─────────────── status / readiness chips ───────────────────────────── */
const STATUS_COLORS = {
  pre_onboarding: { fg: "#9333EA", bg: "#F5F3FF" },
  active:         { fg: "#16A34A", bg: "#F0FDF4" },
  on_leave:       { fg: "#CA8A04", bg: "#FEFCE8" },
  separated:      { fg: "#64748B", bg: "#F1F5F9" },
  terminated:     { fg: "#DC2626", bg: "#FEF2F2" },
  suspended:      { fg: "#EA580C", bg: "#FFF7ED" },
};

const StatusChip = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pre_onboarding;
  const label = (status || "").replace(/_/g, " ");
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold capitalize rounded-full"
      style={{ color: c.fg, background: c.bg }}
    >
      {label}
    </span>
  );
};

const ReadyChip = ({ ready }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full"
    style={{
      color: ready ? "#16A34A" : "#DC2626",
      background: ready ? "#F0FDF4" : "#FEF2F2",
    }}
  >
    {ready ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
    {ready ? "Ready" : "Blocked"}
  </span>
);

/* ─────────────── small filter pill ──────────────────────────────────── */
const FilterPill = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
    <span>{label}</span>
    <select
      className="px-2 py-1 text-xs bg-white border rounded-md"
      style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

/* ─────────────── main page ──────────────────────────────────────────── */
const EmployeesListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canCreate = hasPermission(user, "create employee");

  const remembered = loadRememberedFilters("employees") || {};
  const [rememberFilters, setRememberFilters] = useState(() => loadRememberFlag("employees"));
  const [search, setSearch] = useState(remembered.search ?? "");
  // Default to active-only — HR almost always wants the current workforce.
  // Ex-employees are still reachable via the Status filter (Separated /
  // Terminated) or by clearing the chip to "All statuses".
  const [status, setStatus] = useState(remembered.status ?? "active");
  const [employmentType, setEmploymentType] = useState(remembered.employmentType ?? "");
  const [workLocation, setWorkLocation] = useState(remembered.workLocation ?? "");
  const [departmentId, setDepartmentId] = useState(remembered.departmentId ?? "");
  const [serviceId, setServiceId] = useState(remembered.serviceId ?? "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(remembered.perPage ?? 10);

  useEffect(() => {
    saveRememberedFilters("employees", rememberFilters, {
      search, status, employmentType, workLocation, departmentId, serviceId, perPage,
    });
  }, [rememberFilters, search, status, employmentType, workLocation, departmentId, serviceId, perPage]);
  const [notesModal, setNotesModal] = useState({ open: false, id: null, name: "" });

  // Send (reset + email) login credentials for an employee. Reuses the same
  // backend endpoint as the admin/user screen — it resolves users by uuid,
  // resets the password and emails a role-correct sign-in link.
  const [resend] = usePostMutation();
  const [resendingUuid, setResendingUuid] = useState(null);
  const doResendCredentials = async (r) => {
    if (!r.user_uuid) { showToast("This employee has no linked user account.", "error"); return; }
    if (!window.confirm(`Email fresh login details to ${r.email || r.full_name}? Their current password will be reset.`)) return;
    setResendingUuid(r.user_uuid);
    try {
      const res = await resend({ path: `employee/profiles/${r.uuid}/resend-credentials`, body: {} }).unwrap();
      showToast(res?.message || res?.data || "Login details sent.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Could not send login details.", "error");
    } finally {
      setResendingUuid(null);
    }
  };

  // Catalogs for the dept + service dropdowns. Cheap to fetch — both are
  // small admin-curated lists.
  const { data: deptResp }    = useGetQuery({ path: "employee/departments" });
  const { data: serviceResp } = useGetQuery({
    path: "employee/services",
    // When a department is picked, show only its services. The BE
    // already supports `department_ids` on /services.
    params: departmentId ? { department_ids: departmentId } : undefined,
  });
  const departments = deptResp?.data || [];
  const services    = serviceResp?.data || [];

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (employmentType) sp.set("employment_type", employmentType);
    if (workLocation) sp.set("work_location", workLocation);
    if (departmentId) sp.set("department_ids", departmentId);
    if (serviceId) sp.set("service_ids", serviceId);
    sp.set("per_page", String(perPage));
    sp.set("page", String(page));
    return sp.toString();
  }, [search, status, employmentType, workLocation, departmentId, serviceId, page, perPage]);

  // apiSlice expects { path, params? } — passing a raw string sends a
  // request with an empty URL and silently returns nothing, which is
  // exactly the "I created an employee but the list is empty" symptom.
  const { data, isFetching } = useGetQuery({
    path: `employee/profiles?${queryString}`,
  });

  const rows = data?.data || [];
  const meta = data?.meta || {};

  return (
    // Matches the outer chrome the other HR pages use (BrandsListPage,
    // EmailTemplatesListPage, ApprovalInboxPage) so widths stay consistent
    // when switching between sidebar items — no centred/narrow card in the
    // middle of the page.
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Employees</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              {meta.total ? `${meta.total} total` : "loading…"} · onboarding status, contracts, payroll readiness
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_EMPLOYEE_NEW)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED }}
          >
            <Plus size={16} />
            New employee
          </button>
        )}
      </div>

      {/* ─── Filters ─── */}
      <div className="p-4 mb-4 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center flex-1 min-w-[240px] gap-2 px-3 py-2 border rounded-md" style={{ borderColor: BORDER }}>
            <Search size={14} style={{ color: TEXT_MUTED }} />
            <input
              type="text"
              placeholder="Search by name, email, employee_id, designation…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: TEXT_PRIMARY }}
            />
          </div>
          <FilterPill
            label="Status"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: "pre_onboarding", label: "Pre-onboarding" },
              { value: "active",         label: "Active" },
              { value: "on_leave",       label: "On leave" },
              { value: "separated",      label: "Separated" },
              { value: "terminated",     label: "Terminated" },
              { value: "suspended",      label: "Suspended" },
            ]}
          />
          <FilterPill
            label="Type"
            value={employmentType}
            onChange={(v) => { setEmploymentType(v); setPage(1); }}
            options={[
              { value: "permanent",   label: "Permanent" },
              { value: "contract",    label: "Contract" },
              { value: "consultant",  label: "Consultant" },
              { value: "intern",      label: "Intern" },
              { value: "outsourced",  label: "Outsourced" },
            ]}
          />
          <FilterPill
            label="Location"
            value={workLocation}
            onChange={(v) => { setWorkLocation(v); setPage(1); }}
            options={[
              { value: "in_office", label: "In-office" },
              { value: "remote",    label: "Remote" },
              { value: "hybrid",    label: "Hybrid" },
            ]}
          />
          {/* Searchable dropdowns for the catalog filters — the 5-option
              status/type/location pills stay as bare selects since
              scrolling through them isn't a real problem. */}
          <label className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
            <span>Department</span>
            <SearchableSelect
              compact
              width={180}
              placeholder="All departments"
              value={departmentId || null}
              onChange={(v) => {
                // SearchableSelect returns null on clear; downstream
                // state expects "" so an empty URLSearchParam value is
                // skipped from the query string.
                setDepartmentId(v ?? "");
                setServiceId("");
                setPage(1);
              }}
              options={departments.map((d) => ({
                value: String(d.id),
                label: d.short_name || d.name,
              }))}
            />
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
            <span>Service</span>
            <SearchableSelect
              compact
              width={180}
              placeholder={departmentId ? "All services in dept" : "All services"}
              value={serviceId || null}
              onChange={(v) => { setServiceId(v ?? ""); setPage(1); }}
              options={services.map((s) => ({
                value: String(s.id),
                label: s.short_name || s.name,
              }))}
            />
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none" style={{ color: TEXT_SECONDARY }} title="Keep these filters next time you open this page">
            <input type="checkbox" checked={rememberFilters} onChange={(e) => setRememberFilters(e.target.checked)} />
            Remember filters
          </label>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-hidden bg-white border rounded-xl" style={{ borderColor: BORDER }}>
        {isFetching && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: TEXT_MUTED }}>
            <Loader2 className="animate-spin" size={16} />
            Loading employees…
          </div>
        )}
        {!isFetching && rows.length === 0 && (
          <div className="py-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            <Filter size={20} className="mx-auto mb-2" style={{ color: TEXT_MUTED }} />
            No employees match the current filters.
          </div>
        )}
        {!isFetching && rows.length > 0 && (
          <table className="min-w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr style={{ color: TEXT_MUTED }}>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Employee</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Designation</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Location</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Payroll</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.uuid}
                  className="border-t cursor-pointer hover:bg-slate-50"
                  style={{ borderColor: BORDER }}
                  onClick={() => navigate(HR_EMPLOYEE_DETAIL.replace(":uuid", r.uuid))}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar — professional photo if uploaded, else
                          initials. The BE returns profile_photo_url on
                          the list payload (absolute URL). */}
                      <EmployeeAvatar src={r.profile_photo_url} name={r.full_name} fallback={r.employee_id} />
                      <div className="min-w-0">
                        <div className="font-medium truncate" style={{ color: TEXT_PRIMARY }}>{r.full_name || "—"}</div>
                        <div className="text-xs truncate" style={{ color: TEXT_MUTED }}>{r.employee_id} · {r.email || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={12} style={{ color: TEXT_MUTED }} />
                      {r.designation || "—"}
                    </div>
                    {r.brand && (
                      <div className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{r.brand}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: TEXT_SECONDARY }}>
                    {(r.employment_type || "").replace(/_/g, " ")}
                    <div className="text-xs" style={{ color: TEXT_MUTED }}>
                      <Clock size={11} className="inline-block mr-1" />
                      {(r.work_schedule_type || "").replace(/_/g, "-")}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} style={{ color: TEXT_MUTED }} />
                      <span className="capitalize">{(r.work_location || "").replace(/_/g, " ")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusChip status={r.employment_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ReadyChip ready={r.payroll_ready} />
                      <button onClick={(e) => { e.stopPropagation(); setNotesModal({ open: true, id: r.user_id, name: r.full_name }); }} title="Notes & reminders"
                        className="inline-flex items-center justify-center rounded-md" style={{ width: 28, height: 28, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A" }}><StickyNote size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); doResendCredentials(r); }} disabled={resendingUuid === r.user_uuid} title="Send login credentials"
                        className="inline-flex items-center justify-center rounded-md disabled:opacity-50" style={{ width: 28, height: 28, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                        {resendingUuid === r.user_uuid ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

      {/* Pagination — page numbers + per-page selector + Go to page */}
      <SimplePagination
        page={page}
        total={meta.total || 0}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <LeadNotesModal open={notesModal.open} type="employee" id={notesModal.id} name={notesModal.name} onClose={() => setNotesModal({ open: false, id: null, name: "" })} />
    </div>
  );
};

export default EmployeesListPage;
