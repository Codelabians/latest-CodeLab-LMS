import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ShieldCheck,
  X,
  AlertTriangle,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_OFFICE_EDIT,
  HR_OFFICE_NEW,
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

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set(["hq", "ceo", "coo", "hr", "it"]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

/* ─────────────────────── office type styles ────────────────────────── */
const OFFICE_TYPES = [
  { value: "hq",           label: "HQ",           color: "#C90606", tint: "#FEF2F2" },
  { value: "branch",       label: "Branch",       color: "#1D4ED8", tint: "#EFF6FF" },
  { value: "partner",      label: "Partner",      color: "#B45309", tint: "#FFFBEB" },
  { value: "client_site",  label: "Client Site",  color: "#7E22CE", tint: "#FAF5FF" },
  { value: "remote_only",  label: "Remote Only",  color: "#475569", tint: "#F1F5F9" },
];
const TYPE_BY_VALUE = OFFICE_TYPES.reduce((m, t) => { m[t.value] = t; return m; }, {});

/* ─────────────────────── delete dialog ─────────────────────────────── */
const DeleteOfficeDialog = ({ open, office, onCancel, onConfirm, isLoading }) => {
  if (!open || !office) return null;
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
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete office</h3>
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
            <strong style={{ color: TEXT_PRIMARY }}>{office.name}</strong>?
            Employees currently assigned to this office will lose the assignment.
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

/* ─────────────────────── single office card ────────────────────────── */
const OfficeCard = ({ office, brandName, canEdit, canDelete, onEdit, onDelete }) => {
  const isInactive = office.is_active === false;
  const isDefault = !!office.is_default;
  const type = TYPE_BY_VALUE[office.type] || { label: titleCase(office.type || "office"), color: TEXT_SECONDARY, tint: SURFACE_ALT };

  return (
    <div
      className="rounded-2xl flex flex-col transition"
      style={{
        background: SURFACE,
        border: isDefault ? `1.5px solid ${BRAND_RED}` : `1px solid ${BORDER}`,
        boxShadow: isDefault
          ? "0 4px 16px rgba(201,6,6,0.08)"
          : "0 1px 2px rgba(15,23,42,0.04)",
        opacity: isInactive ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div className="p-5 flex items-start gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: type.tint, color: type.color,
          }}
        >
          <Building2 size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {office.name}
            </h3>
            {office.short_name && (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, fontSize: 10, fontWeight: 700, border: `1px solid ${BORDER}` }}
              >
                {office.short_name}
              </span>
            )}
            {isDefault && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                style={{ background: BRAND_RED, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}
              >
                <Star size={10} strokeWidth={2.5} fill="#fff" />
                DEFAULT
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: type.tint, color: type.color, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3 }}
            >
              {type.label.toUpperCase()}
            </span>
            {brandName ? (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED, fontSize: 11, fontWeight: 600 }}
              >
                {brandName}
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-md"
                style={{ background: SURFACE_ALT, color: TEXT_MUTED, fontSize: 10.5, fontWeight: 600, border: `1px solid ${BORDER}` }}
              >
                Cross-brand
              </span>
            )}
          </div>
          {office.type === "partner" && office.partner_company && (
            <p className="text-[12px] mt-1.5" style={{ color: TEXT_SECONDARY }}>
              Partner: <strong style={{ color: TEXT_PRIMARY }}>{office.partner_company}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 space-y-2 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
        {(office.address || office.city) && (
          <div className="flex items-start gap-2">
            <MapPin size={13} strokeWidth={2} style={{ color: TEXT_MUTED, marginTop: 2, flexShrink: 0 }} />
            <span>
              {office.address && <>{office.address}<br /></>}
              {[office.city, office.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        {office.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <span>{office.contact_phone}</span>
          </div>
        )}
        {office.contact_email && (
          <div className="flex items-center gap-2">
            <Mail size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <span className="truncate">{office.contact_email}</span>
          </div>
        )}
        {office.timezone && (
          <div className="flex items-center gap-2">
            <Globe size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, fontSize: 11, fontWeight: 600, border: `1px solid ${BORDER}` }}
            >
              {office.timezone}
            </span>
          </div>
        )}
        {!office.address && !office.city && !office.contact_phone && !office.contact_email && (
          <p className="text-[12px]" style={{ color: TEXT_MUTED, fontStyle: "italic" }}>
            No address or contact details set yet.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
        <button
          type="button"
          onClick={() => onEdit(office)}
          disabled={!canEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg"
          style={{
            background: SURFACE, color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
            cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
          }}
          title={!canEdit ? "You don't have permission to edit offices." : "Edit"}
        >
          <Pencil size={13} strokeWidth={2.25} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(office)}
          disabled={!canDelete}
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
            cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5,
          }}
          title="Delete office"
        >
          <Trash2 size={14} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────── main list page ────────────────────────────── */
const OfficesListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canDelete = hasPermission(user, "delete employee");

  const [typeFilter, setTypeFilter] = useState(""); // "" = all
  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/offices" },
    { skip: !canView },
  );
  const { data: brandsData } = useGetQuery({ path: "employee/company-brands" }, { skip: !canView });

  const [deleteOffice, { isLoading: isDeleting }] = useDeleteMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const brands = useMemo(
    () => unwrap(brandsData).map((b) => ({ id: b.id, name: b.name })),
    [brandsData],
  );
  const brandById = useMemo(() => {
    const m = {};
    brands.forEach((b) => { m[b.id] = b.name; });
    return m;
  }, [brands]);

  const offices = useMemo(() => unwrap(data), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offices.filter((o) => {
      if (typeFilter && o.type !== typeFilter) return false;
      if (brandFilter && String(o.brand_id || "") !== String(brandFilter)) return false;
      if (!q) return true;
      const blob = [o.name, o.slug, o.short_name, o.city, o.address, o.partner_company].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [offices, typeFilter, brandFilter, search]);

  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, perPage, page]);

  const handleEdit = (office) => {
    navigate(HR_OFFICE_EDIT.replace(":uuid", office.uuid));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteOffice({
        path: `employee/offices/${deleteTarget.uuid}`,
      }).unwrap();
      showToast(res?.message || "Office deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete office.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view offices.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading offices…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load offices.{" "}
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
            <Building2 size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Offices
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Physical locations: HQ, branches, partner sites, client sites, and remote-only entries.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_OFFICE_NEW)}
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
            New office
          </button>
        )}
      </div>

      {/* Type chip filter */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTypeFilter("")}
          className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
          style={{
            background: typeFilter === "" ? BRAND_RED : SURFACE,
            color: typeFilter === "" ? "#fff" : TEXT_SECONDARY,
            border: `1px solid ${typeFilter === "" ? BRAND_RED : BORDER}`,
          }}
        >
          All types
        </button>
        {OFFICE_TYPES.map((t) => {
          const isActive = typeFilter === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition"
              style={{
                background: isActive ? t.color : t.tint,
                color: isActive ? "#fff" : t.color,
                border: `1px solid ${isActive ? t.color : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Brand + search */}
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
            placeholder="Search offices by name, city, partner…"
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
            <Building2 size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            {offices.length === 0 ? "No offices yet" : "No offices match your filters"}
          </h3>
          <p className="text-[13px] mb-5" style={{ color: TEXT_SECONDARY }}>
            {offices.length === 0
              ? "Create your first office to track physical locations."
              : "Try clearing the type or brand filter, or adjust the search."}
          </p>
          {offices.length === 0 && canCreate && (
            <button
              type="button"
              onClick={() => navigate(HR_OFFICE_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5 }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New office
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
        >
          {pagedFiltered.map((o) => (
            <OfficeCard
              key={o.uuid}
              office={o}
              brandName={brandById[o.brand_id]}
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

      <DeleteOfficeDialog
        open={!!deleteTarget}
        office={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default OfficesListPage;
