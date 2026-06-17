import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Users as UsersIcon,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import {
  HR_SERVICE_EDIT,
  HR_SERVICE_NEW,
} from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ──────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/* ─────────────────────── helpers ───────────────────────────────────── */
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set(["ceo", "coo", "cto", "cfo", "cso", "hr", "it", "qa", "ui", "ux", "seo", "api", "sme", "vp"]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const looksLikeSlug = (s) =>
  typeof s === "string" && /^[a-z0-9]+([_-][a-z0-9]+)*$/.test(s);

const displayName = (entity) => {
  const n = entity?.name;
  if (n && !looksLikeSlug(n)) return n;
  return titleCase(entity?.slug || n || "");
};

/* ─────────────────────── delete dialog ─────────────────────────────── */
const DeleteServiceDialog = ({ open, service, onCancel, onConfirm, isLoading }) => {
  if (!open || !service) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <AlertTriangle size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete service</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="flex items-center justify-center rounded-md" style={{ width: 30, height: 30, color: TEXT_MUTED }}>
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: TEXT_PRIMARY }}>{displayName(service)}</strong>?
            Employees currently assigned to this service will lose the assignment.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: BRAND_RED, color: "#fff", opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.25} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── service row ───────────────────────────────── */
const ServiceRow = ({ service, leadName, canEdit, canDelete, onEdit, onDelete }) => {
  const isInactive = service.is_active === false;
  const isClientFacing = !!service.is_client_facing;
  const billingRate = service.default_billing_rate;
  const currency = service.billing_currency || "PKR";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition"
      style={{
        borderBottom: `1px solid ${BORDER}`,
        opacity: isInactive ? 0.6 : 1,
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          minWidth: 44, height: 28, padding: "0 8px", borderRadius: 6,
          background: SURFACE_ALT, color: TEXT_PRIMARY,
          fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
          border: `1px solid ${BORDER}`, fontFamily: "JetBrains Mono, ui-monospace, monospace",
        }}
      >
        {service.code || "—"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold" style={{ color: TEXT_PRIMARY }}>
            {displayName(service)}
          </span>
          {isClientFacing && (
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: "#ECFDF5", color: "#047857", fontSize: 10, fontWeight: 700 }}
            >
              CLIENT-FACING
            </span>
          )}
          {isInactive && (
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: SURFACE_ALT, color: TEXT_MUTED, fontSize: 10, fontWeight: 600, border: `1px solid ${BORDER}` }}
            >
              INACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap" style={{ color: TEXT_MUTED, fontSize: 11.5 }}>
          <span className="font-mono">{service.slug}</span>
          {billingRate !== null && billingRate !== undefined && billingRate !== "" && (
            <span>
              <strong style={{ color: TEXT_SECONDARY }}>
                {currency} {Number(billingRate).toLocaleString()}
              </strong>
              {" "}/ hr
            </span>
          )}
          {leadName && (
            <span className="flex items-center gap-1">
              <UsersIcon size={11} strokeWidth={2} />
              Lead: {leadName}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(service)}
        disabled={!canEdit}
        className="flex items-center justify-center"
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`,
          cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
        }}
        title={!canEdit ? "You don't have permission to edit services." : "Edit"}
      >
        <Pencil size={13} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(service)}
        disabled={!canDelete}
        className="flex items-center justify-center"
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
          cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5,
        }}
        title="Delete service"
      >
        <Trash2 size={13} strokeWidth={2.25} />
      </button>
    </div>
  );
};

/* ─────────────────────── main list page ────────────────────────────── */
const ServicesListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canDelete = hasPermission(user, "delete employee");

  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [clientFacingOnly, setClientFacingOnly] = useState(false);
  const [collapsed, setCollapsed] = useState({}); // { [deptId]: bool }

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/services${deptFilter ? `?department_id=${deptFilter}` : ""}` },
    { skip: !canView },
  );
  const { data: deptsData } = useGetQuery({ path: "employee/departments" }, { skip: !canView });

  const [deleteService, { isLoading: isDeleting }] = useDeleteMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const departments = useMemo(() => unwrap(deptsData), [deptsData]);
  const deptById = useMemo(() => {
    const m = {};
    departments.forEach((d) => { m[d.id] = d; });
    return m;
  }, [departments]);

  const services = useMemo(() => unwrap(data), [data]);

  /* Apply client-side filters (search + client-facing). */
  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (clientFacingOnly && !s.is_client_facing) return false;
      if (!q) return true;
      const blob = [s.name, s.slug, s.code, s.description].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [services, search, clientFacingOnly]);

  /* Group by department. */
  const grouped = useMemo(() => {
    const map = new Map();
    filteredServices.forEach((s) => {
      const did = s.department_id ?? "_none";
      if (!map.has(did)) map.set(did, []);
      map.get(did).push(s);
    });
    const out = [];
    map.forEach((items, deptId) => {
      const dept = deptId === "_none" ? null : deptById[deptId];
      out.push({ deptId, dept, items });
    });
    out.sort((a, b) => {
      const an = a.dept ? (a.dept.sort_order ?? 0) : 9999;
      const bn = b.dept ? (b.dept.sort_order ?? 0) : 9999;
      if (an !== bn) return an - bn;
      const aName = a.dept ? displayName(a.dept) : "z";
      const bName = b.dept ? displayName(b.dept) : "z";
      return aName.localeCompare(bName);
    });
    return out;
  }, [filteredServices, deptById]);

  const handleEdit = (svc) => {
    navigate(HR_SERVICE_EDIT.replace(":uuid", svc.uuid));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteService({
        path: `employee/services/${deleteTarget.uuid}`,
      }).unwrap();
      showToast(res?.message || "Service deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete service.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view services.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading services…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load services.{" "}
          <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Briefcase size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Services
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Specific offerings within a department. Employees attach to services with a proficiency level.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_SERVICE_NEW)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
            style={{
              background: BRAND_RED, color: "#fff",
              fontWeight: 600, fontSize: 13.5,
              boxShadow: "0 4px 10px rgba(201,6,6,0.12)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_RED_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED)}
          >
            <Plus size={15} strokeWidth={2.5} />
            New service
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "240px 1fr auto" }}>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY, background: SURFACE }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{displayName(d)}</option>
          ))}
        </select>
        <div className="relative">
          <Search
            size={14}
            style={{
              position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services by name, slug, code…"
            className="w-full text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
            style={{
              borderColor: BORDER, color: TEXT_PRIMARY, background: SURFACE,
              padding: "8px 12px 8px 34px",
            }}
          />
        </div>
        <label
          className="flex items-center gap-2 px-3 rounded-md text-sm"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={clientFacingOnly}
            onChange={(e) => setClientFacingOnly(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: BRAND_RED }}
          />
          Client-facing only
        </label>
      </div>

      {/* Body */}
      {grouped.length === 0 ? (
        <div
          className="rounded-2xl py-16 px-6 text-center"
          style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-4"
            style={{ width: 64, height: 64, borderRadius: 16, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Briefcase size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            {services.length === 0 ? "No services yet" : "No services match your filters"}
          </h3>
          <p className="text-[13px] mb-5" style={{ color: TEXT_SECONDARY }}>
            {services.length === 0
              ? "Create your first service to start tracking offerings."
              : "Try clearing the department filter or adjusting the search."}
          </p>
          {services.length === 0 && canCreate && (
            <button
              type="button"
              onClick={() => navigate(HR_SERVICE_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5 }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New service
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ deptId, dept, items }) => {
            const isCollapsed = !!collapsed[deptId];
            return (
              <section
                key={deptId}
                className="rounded-2xl overflow-hidden"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [deptId]: !p[deptId] }))}
                  className="flex items-center w-full gap-3 px-5 py-3 text-left"
                  style={{
                    background: SURFACE_ALT,
                    borderBottom: isCollapsed ? "none" : `1px solid ${BORDER}`,
                  }}
                >
                  <span style={{ color: TEXT_MUTED }}>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </span>
                  <span className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>
                    {dept ? displayName(dept) : "Unassigned services"}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
                  >
                    {items.length} {items.length === 1 ? "service" : "services"}
                  </span>
                </button>
                {!isCollapsed && (
                  <div>
                    {items.map((s) => (
                      <ServiceRow
                        key={s.uuid}
                        service={s}
                        leadName={s.lead_user?.name || s.lead?.name || null}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onEdit={handleEdit}
                        onDelete={(x) => setDeleteTarget(x)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <DeleteServiceDialog
        open={!!deleteTarget}
        service={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ServicesListPage;
