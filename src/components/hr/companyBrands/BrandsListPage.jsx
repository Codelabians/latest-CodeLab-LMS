import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Star,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_COMPANY_BRAND_EDIT,
  HR_COMPANY_BRAND_NEW,
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

/* ─────────────────────── permission helper ─────────────────────────── */
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────────────── confirm delete dialog ─────────────────────── */
const DeleteBrandDialog = ({ open, brand, onCancel, onConfirm, isLoading }) => {
  if (!open || !brand) return null;
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
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: BRAND_RED_TINT, color: BRAND_RED,
              }}
            >
              <AlertTriangle size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete brand</h3>
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
            Are you sure you want to delete <strong style={{ color: TEXT_PRIMARY }}>{brand.name}</strong>?
            The brand will be removed permanently. The default brand cannot be deleted — promote another brand first.
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

/* ─────────────────────── brand initials avatar ─────────────────────── */
const BrandAvatar = ({ name, logoPath }) => {
  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt={name}
        className="object-contain"
        style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE_ALT, padding: 6 }}
      />
    );
  }
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 56, height: 56, borderRadius: 14,
        background: BRAND_RED_TINT, color: BRAND_RED,
        fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
      }}
    >
      {initials}
    </div>
  );
};

/* ─────────────────────── single brand card ─────────────────────────── */
const BrandCard = ({ brand, canEdit, canDelete, canSetDefault, onEdit, onSetDefault, onDelete }) => {
  const isDefault = !!brand.is_default;
  const isInactive = brand.is_active === false;

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
      <div className="p-5 flex items-start gap-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <BrandAvatar name={brand.name} logoPath={brand.logo_path} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {brand.name}
            </h3>
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
          <p className="text-[11px] mt-0.5 font-mono" style={{ color: TEXT_MUTED }}>
            {brand.slug}
          </p>
          {brand.tagline && (
            <p className="text-[12.5px] mt-2" style={{ color: TEXT_SECONDARY, fontStyle: "italic", lineHeight: 1.45 }}>
              &ldquo;{brand.tagline}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Body — quick stats */}
      <div className="p-5 flex-1 space-y-2.5">
        {brand.website && (
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
            <Globe size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
              style={{ color: TEXT_SECONDARY }}
            >
              {brand.website}
            </a>
          </div>
        )}
        {brand.email && (
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
            <Mail size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <span className="truncate">{brand.email}</span>
          </div>
        )}
        {brand.phone && (
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
            <Phone size={13} strokeWidth={2} style={{ color: TEXT_MUTED, flexShrink: 0 }} />
            <span>{brand.phone}</span>
          </div>
        )}
        {!brand.website && !brand.email && !brand.phone && (
          <p className="text-[12px]" style={{ color: TEXT_MUTED, fontStyle: "italic" }}>
            No contact details set yet.
          </p>
        )}

        {/* Variable namespace hint */}
        <div className="pt-2.5 mt-3" style={{ borderTop: `1px dashed ${BORDER}` }}>
          <p className="text-[10.5px] font-semibold tracking-[0.6px] uppercase mb-1.5" style={{ color: TEXT_MUTED }}>
            Email template variables
          </p>
          <code
            className="text-[10.5px]"
            style={{
              background: SURFACE_ALT, padding: "2px 6px", borderRadius: 4,
              color: BRAND_RED, fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            {`{brand_*}`}
          </code>
          {" "}
          <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
            (e.g. <code style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{`{brand_name}`}</code>, <code style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{`{brand_email_hr}`}</code>)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
        <button
          type="button"
          onClick={() => onEdit(brand)}
          disabled={!canEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition"
          style={{
            background: SURFACE, color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
            cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
          }}
          title={!canEdit ? "You don't have permission to edit brands." : "Edit"}
        >
          <Pencil size={13} strokeWidth={2.25} />
          Edit
        </button>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(brand)}
            disabled={!canSetDefault}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition"
            style={{
              background: SURFACE, color: TEXT_SECONDARY,
              border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
              cursor: canSetDefault ? "pointer" : "not-allowed", opacity: canSetDefault ? 1 : 0.5,
            }}
            title="Mark as default"
          >
            <Star size={13} strokeWidth={2.25} />
            Set default
          </button>
        )}
        {!isDefault && (
          <button
            type="button"
            onClick={() => onDelete(brand)}
            disabled={!canDelete}
            className="flex items-center justify-center transition"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
              cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5,
            }}
            title="Delete brand"
          >
            <Trash2 size={14} strokeWidth={2.25} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────── main list page ────────────────────────────── */
const BrandsListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get company-brands");
  const canCreate = hasPermission(user, "create company-brands");
  const canEdit = hasPermission(user, "update company-brands");
  const canDelete = hasPermission(user, "delete company-brands");
  const canSetDefault = hasPermission(user, "set-default company-brand");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/company-brands" },
    { skip: !canView },
  );

  const [setDefault, { isLoading: isSettingDefault }] = usePostMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteMutation();

  const [deleteTarget, setDeleteTarget] = useState(null);
  // Pagination (auto-hides for small datasets — currently 2 brands, but
  // will be useful as the brand catalog grows). Hooks live above the
  // early-return guards below; the brand list itself is derived after
  // those guards, so we read it via the same path with a safe default.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const brandsForPaging = useMemo(() => {
    const all = data?.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((b) => {
      const hay = `${b.name || ""} ${b.slug || ""} ${b.short_name || ""} ${b.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, search]);
  const pagedBrands = useMemo(() => {
    const start = (page - 1) * perPage;
    return brandsForPaging.slice(start, start + perPage);
  }, [brandsForPaging, page, perPage]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(brandsForPaging.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [brandsForPaging.length, perPage, page]);

  const handleEdit = (brand) => {
    navigate(HR_COMPANY_BRAND_EDIT.replace(":uuid", brand.uuid));
  };

  const handleSetDefault = async (brand) => {
    try {
      const res = await setDefault({
        path: `employee/company-brands/${brand.uuid}/set-default`,
      }).unwrap();
      showToast(res?.message || `${brand.name} is now the default brand.`, "success");
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to set default brand.";
      showToast(msg, "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteBrand({
        path: `employee/company-brands/${deleteTarget.uuid}`,
      }).unwrap();
      showToast(res?.message || "Brand deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete brand.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view company brands.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading brands…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load brands.{" "}
          <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const brands = data?.data || [];

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Company Brands
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Each brand has its own logo, vision, contact details, and template variables.
              Emails automatically render with the right brand based on the recipient.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_COMPANY_BRAND_NEW)}
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
            Add Brand
          </button>
        )}
      </div>

      {/* Helper banner */}
      <div
        className="mb-6 rounded-xl flex items-start gap-3 px-4 py-3"
        style={{
          background: "#F0F9FF",
          border: "1px solid #BAE6FD",
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 mt-0.5"
          style={{ width: 28, height: 28, borderRadius: 8, background: "#0EA5E9", color: "#fff" }}
        >
          <CheckCircle2 size={14} strokeWidth={2.25} />
        </div>
        <div style={{ fontSize: 12.5, color: "#0C4A6E", lineHeight: 1.5 }}>
          The <strong>default brand</strong> is used when no specific brand is selected for an email
          dispatch. To change which brand is default, click <em>Set default</em> on any brand card —
          the previous default automatically flips off. Editing brand details (logo, vision, etc.) is
          done on the brand&apos;s edit page.
        </div>
      </div>

      {/* Empty state */}
      {brands.length === 0 ? (
        <div
          className="rounded-2xl py-16 px-6 text-center"
          style={{
            background: SURFACE,
            border: `1px dashed ${BORDER}`,
          }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-4"
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Layers size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            No brands yet
          </h3>
          <p className="text-[13px] mb-5" style={{ color: TEXT_SECONDARY }}>
            Create your first brand to define a separate identity for emails and PDFs.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate(HR_COMPANY_BRAND_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5 }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Brand
            </button>
          )}
        </div>
      ) : (
        /* Search row + cards grid */
        <>
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands by name, slug or description…"
              className="w-full max-w-md px-3 py-2 text-sm bg-white border rounded-lg outline-none"
              style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
            />
          </div>
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}
          >
          {pagedBrands.map((brand) => (
            <BrandCard
              key={brand.uuid}
              brand={brand}
              canEdit={canEdit}
              canDelete={canDelete}
              canSetDefault={canSetDefault && !isSettingDefault}
              onEdit={handleEdit}
              onSetDefault={handleSetDefault}
              onDelete={(b) => setDeleteTarget(b)}
            />
          ))}
          </div>
        </>
      )}

      {brandsForPaging.length > 0 && (
        <SimplePagination
          page={page}
          total={brandsForPaging.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      <DeleteBrandDialog
        open={!!deleteTarget}
        brand={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BrandsListPage;
