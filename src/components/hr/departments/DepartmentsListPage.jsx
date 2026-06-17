import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  Users as UsersIcon,
  // Icons used by the department.icon → component lookup. Anything HR can
  // type as a "name" here needs an entry in DEPT_ICON_MAP below.
  Shield,
  Banknote,
  Code,
  Code2,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Building2,
  Wrench,
  Megaphone,
  Headphones,
  Heart,
  Cog,
  Settings,
  Truck,
  Globe,
  BookOpen,
  Calculator,
  Wallet,
  HandCoins,
  Palette,
  MonitorSmartphone,
  Server,
  Database,
  PenTool,
  ClipboardList,
  Phone,
  Mail,
  Target,
  Award,
  Flag,
  Crown,
  Hammer,
  Star,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_DEPARTMENT_EDIT,
  HR_DEPARTMENT_NEW,
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

/**
 * Map of `department.icon` strings → Lucide component. The form lets HR type
 * a free-text icon name; if it matches a known Lucide icon we render the
 * actual component. Otherwise we fall through to treating the string as a
 * literal (emoji, short label like "IT", etc.).
 *
 * Keys are lower-case and accept the most common variants HR types ("shield",
 * "graduation-cap", "trending up", etc.).
 */
const DEPT_ICON_MAP = {
  shield:           Shield,
  shieldcheck:      ShieldCheck,
  "shield-check":   ShieldCheck,
  users:            UsersIcon,
  user:             UsersIcon,
  banknote:         Banknote,
  cash:             Banknote,
  money:            Banknote,
  wallet:           Wallet,
  handcoins:        HandCoins,
  "hand-coins":     HandCoins,
  code:             Code,
  code2:            Code2,
  "code-2":         Code2,
  dev:              Code,
  developer:        Code,
  engineering:      Code,
  trendingup:       TrendingUp,
  "trending-up":    TrendingUp,
  "trending up":    TrendingUp,
  trending:         TrendingUp,
  sales:            TrendingUp,
  graduationcap:    GraduationCap,
  "graduation-cap": GraduationCap,
  "graduation cap": GraduationCap,
  graduation:       GraduationCap,
  school:           GraduationCap,
  education:        GraduationCap,
  briefcase:        Briefcase,
  business:         Briefcase,
  hr:               UsersIcon,
  building:         Building2,
  building2:        Building2,
  office:           Building2,
  wrench:           Wrench,
  tools:            Wrench,
  megaphone:        Megaphone,
  marketing:        Megaphone,
  headphones:       Headphones,
  support:          Headphones,
  heart:            Heart,
  cog:              Cog,
  gear:             Cog,
  settings:         Settings,
  ops:              Settings,
  operations:       Settings,
  truck:            Truck,
  logistics:        Truck,
  globe:            Globe,
  international:    Globe,
  bookopen:         BookOpen,
  "book-open":      BookOpen,
  curriculum:       BookOpen,
  calculator:       Calculator,
  accounting:       Calculator,
  finance:          Banknote,
  palette:          Palette,
  design:           Palette,
  monitorsmartphone: MonitorSmartphone,
  "monitor-smartphone": MonitorSmartphone,
  product:          MonitorSmartphone,
  server:           Server,
  infra:            Server,
  database:         Database,
  data:             Database,
  pentool:          PenTool,
  "pen-tool":       PenTool,
  content:          PenTool,
  clipboardlist:    ClipboardList,
  "clipboard-list": ClipboardList,
  admin:            ClipboardList,
  phone:            Phone,
  mail:             Mail,
  target:           Target,
  award:            Award,
  flag:             Flag,
  crown:            Crown,
  leadership:       Crown,
  exec:             Crown,
  executive:        Crown,
  hammer:           Hammer,
  star:             Star,
  layers:           Layers,
};

const resolveDeptIcon = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  return DEPT_ICON_MAP[key] || null;
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const looksLikeSlug = (s) =>
  typeof s === "string" && /^[a-z0-9]+([_-][a-z0-9]+)*$/.test(s);

const displayName = (dept) => {
  const n = dept?.name;
  if (n && !looksLikeSlug(n)) return n;
  return titleCase(dept?.slug || n || "");
};

/* ─────────────────────── confirm delete dialog ─────────────────────── */
const DeleteDepartmentDialog = ({ open, dept, onCancel, onConfirm, isLoading }) => {
  if (!open || !dept) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <AlertTriangle size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete department</h3>
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
            <strong style={{ color: TEXT_PRIMARY }}>{displayName(dept)}</strong>?
            Make sure no employees or services depend on this department first.
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

/* ─────────────────────── single dept card ──────────────────────────── */
const DepartmentCard = ({ dept, brandName, parentName, canEdit, canDelete, onEdit, onDelete }) => {
  const isInactive = dept.is_active === false;
  const color = dept.color || BRAND_RED;
  const colorTint = `${color}1A`;

  return (
    <div
      className="rounded-2xl flex flex-col transition"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        opacity: isInactive ? 0.7 : 1,
      }}
    >
      <div className="p-5 flex items-start gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: colorTint, color,
            fontWeight: 700, fontSize: 18,
          }}
          title={dept.icon || displayName(dept)}
        >
          {(() => {
            // Three cases: 1) icon string matches a known Lucide name → render the component
            //              2) icon string is something else (emoji, short label) → render as text
            //              3) no icon set at all → fallback Layers icon
            const Resolved = resolveDeptIcon(dept.icon);
            if (Resolved) return <Resolved size={22} strokeWidth={2} />;
            if (dept.icon) return <span style={{ fontSize: 20 }}>{dept.icon}</span>;
            return <Layers size={20} strokeWidth={2} />;
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {displayName(dept)}
            </h3>
            {dept.short_name && (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, fontSize: 10, fontWeight: 700, border: `1px solid ${BORDER}` }}
              >
                {dept.short_name}
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
          <p className="text-[11px] mt-0.5 font-mono" style={{ color: TEXT_MUTED }}>
            {dept.slug}
          </p>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-2 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
        {brandName && (
          <div className="flex items-center gap-2">
            <Layers size={13} strokeWidth={2} style={{ color: TEXT_MUTED }} />
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED, fontSize: 11, fontWeight: 600 }}
            >
              {brandName}
            </span>
          </div>
        )}
        {parentName && (
          <div className="flex items-center gap-2">
            <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Parent:</span>
            <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{parentName}</span>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon size={13} strokeWidth={2} style={{ color: TEXT_MUTED }} />
            <strong style={{ color: TEXT_PRIMARY }}>
              {dept.members_count ?? 0}
            </strong>
            <span>member{(dept.members_count ?? 0) === 1 ? "" : "s"}</span>
          </span>
          <span style={{ color: BORDER }}>·</span>
          <span className="inline-flex items-center gap-1.5">
            <strong style={{ color: TEXT_PRIMARY }}>
              {dept.services_count ?? (dept.services || []).length ?? 0}
            </strong>
            <span>service{(dept.services_count ?? 0) === 1 ? "" : "s"}</span>
          </span>
        </div>
        {dept.description && !looksLikeSlug(dept.description) && (
          <p className="text-[12px] pt-1" style={{ color: TEXT_MUTED, lineHeight: 1.5 }}>
            {String(dept.description).slice(0, 120)}
            {String(dept.description).length > 120 ? "…" : ""}
          </p>
        )}
      </div>

      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
        <button
          type="button"
          onClick={() => onEdit(dept)}
          disabled={!canEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg"
          style={{
            background: SURFACE, color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
            cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
          }}
          title={!canEdit ? "You don't have permission to edit departments." : "Edit"}
        >
          <Pencil size={13} strokeWidth={2.25} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(dept)}
          disabled={!canDelete}
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
            cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5,
          }}
          title="Delete department"
        >
          <Trash2 size={14} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────── main list page ────────────────────────────── */
const DepartmentsListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canDelete = hasPermission(user, "delete employee");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/departments" },
    { skip: !canView },
  );
  const { data: brandsData } = useGetQuery({ path: "employee/company-brands" }, { skip: !canView });

  const [deleteDept, { isLoading: isDeleting }] = useDeleteMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const brands = useMemo(
    () => unwrap(brandsData).map((b) => ({ id: b.id, name: b.name })),
    [brandsData],
  );
  const brandById = useMemo(() => {
    const m = {};
    brands.forEach((b) => { m[b.id] = b.name; });
    return m;
  }, [brands]);

  const departments = useMemo(() => unwrap(data), [data]);
  const deptById = useMemo(() => {
    const m = {};
    departments.forEach((d) => { m[d.id] = d; });
    return m;
  }, [departments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return departments.filter((d) => {
      if (brandFilter && String(d.brand_id || "") !== String(brandFilter)) return false;
      if (!q) return true;
      const blob = [
        d.name, d.slug, d.short_name, d.description,
      ].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [departments, brandFilter, search]);

  // Paged slice + clamp.
  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, perPage, page]);

  const handleEdit = (dept) => {
    navigate(HR_DEPARTMENT_EDIT.replace(":uuid", dept.uuid));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteDept({
        path: `employee/departments/${deleteTarget.uuid}`,
      }).unwrap();
      showToast(res?.message || "Department deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete department.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view departments.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading departments…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load departments.{" "}
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
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Departments
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Org units that group employees. A department can belong to a brand and have a parent department.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_DEPARTMENT_NEW)}
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
            New department
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "240px 1fr" }}>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY, background: SURFACE }}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
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
            placeholder="Search departments by name, slug, short name…"
            className="w-full text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
            style={{
              borderColor: BORDER, color: TEXT_PRIMARY, background: SURFACE,
              padding: "8px 12px 8px 34px",
            }}
          />
        </div>
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-16 px-6 text-center"
          style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-4"
            style={{ width: 64, height: 64, borderRadius: 16, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Layers size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            {departments.length === 0 ? "No departments yet" : "No departments match your filters"}
          </h3>
          <p className="text-[13px] mb-5" style={{ color: TEXT_SECONDARY }}>
            {departments.length === 0
              ? "Create your first department to group employees and services."
              : "Try clearing the brand filter or adjusting the search."}
          </p>
          {departments.length === 0 && canCreate && (
            <button
              type="button"
              onClick={() => navigate(HR_DEPARTMENT_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5 }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New department
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
        >
          {pagedFiltered.map((d) => (
            <DepartmentCard
              key={d.uuid}
              dept={d}
              brandName={brandById[d.brand_id]}
              parentName={d.parent_department_id ? displayName(deptById[d.parent_department_id]) : null}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={(x) => setDeleteTarget(x)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <SimplePagination
          page={page}
          total={filtered.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      <DeleteDepartmentDialog
        open={!!deleteTarget}
        dept={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DepartmentsListPage;
