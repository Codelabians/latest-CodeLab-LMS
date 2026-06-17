import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  AlertTriangle,
  Key,
  ShieldCheck,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import { HR_ROLE_NEW, HR_ROLE_EDIT } from "../../routes/RouteConstants";

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

/* ─────────────────────── titleCase helper ──────────────────────────── */
const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set([
        "ceo", "coo", "cto", "cfo", "cso",
        "hr", "it", "qa", "ui", "ux", "seo", "api", "sme", "vp",
      ]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

/* ─────────────────────── confirm delete dialog ─────────────────────── */
const DeleteRoleDialog = ({ open, role, onCancel, onConfirm, isLoading }) => {
  if (!open || !role) return null;
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
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete role</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex items-center justify-center rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED }}
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: TEXT_PRIMARY }}>{titleCase(role.name)}</strong>?
            Many seed roles are system-protected and may refuse deletion.
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

/* ─────────────────────── role card ─────────────────────────────────── */
const RoleCard = ({ role, totalPermCount, canEdit, canDelete, onEdit, onManagePerms, onDelete }) => {
  const permCount = role.permissions?.length || 0;
  // Some seed roles get the full catalog — show "all" to make that obvious.
  const isAllPerms = totalPermCount > 0 && permCount >= totalPermCount;

  // Preview: distinct subjects so the user sees what scopes this role touches.
  const previewSubjects = useMemo(() => {
    const set = new Set();
    (role.permissions || []).forEach((p) => p?.subject && set.add(p.subject));
    return Array.from(set).slice(0, 6);
  }, [role.permissions]);

  return (
    <div
      className="rounded-2xl flex flex-col transition"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {/* Header */}
      <div className="p-5 flex items-start gap-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: BRAND_RED_TINT, color: BRAND_RED,
            flexShrink: 0,
          }}
        >
          <Shield size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15.5px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {titleCase(role.name)}
            </h3>
            <span
              className="px-2 py-0.5 rounded-md"
              style={{
                background: isAllPerms ? BRAND_RED : SURFACE_ALT,
                color: isAllPerms ? "#fff" : TEXT_SECONDARY,
                fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                border: isAllPerms ? "none" : `1px solid ${BORDER}`,
              }}
            >
              {permCount} {permCount === 1 ? "PERM" : "PERMS"}
            </span>
          </div>
          <p className="text-[11px] mt-0.5 font-mono" style={{ color: TEXT_MUTED }}>
            {role.slug || role.name}
          </p>
        </div>
      </div>

      {/* Body — subject preview */}
      <div className="p-5 flex-1">
        <p
          className="text-[10.5px] font-semibold tracking-[0.6px] uppercase mb-2"
          style={{ color: TEXT_MUTED }}
        >
          Scopes
        </p>
        {previewSubjects.length === 0 ? (
          <p className="text-[12px]" style={{ color: TEXT_MUTED, fontStyle: "italic" }}>
            No permissions attached yet.
          </p>
        ) : (
          <div
            className="flex flex-wrap gap-1.5"
            style={{
              maxHeight: 72, // ~3 lines of chips
              overflow: "hidden",
            }}
          >
            {previewSubjects.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
                style={{
                  background: SURFACE_ALT,
                  color: TEXT_SECONDARY,
                  border: `1px solid ${BORDER}`,
                  whiteSpace: "nowrap",
                }}
                title={s}
              >
                {titleCase(s)}
              </span>
            ))}
            {permCount > previewSubjects.length && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
              >
                +{permCount - previewSubjects.length} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
        <button
          type="button"
          onClick={() => onEdit(role)}
          disabled={!canEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition"
          style={{
            background: SURFACE, color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
            cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
          }}
          title={!canEdit ? "You don't have permission to edit roles." : "Edit"}
        >
          <Pencil size={13} strokeWidth={2.25} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onManagePerms(role)}
          disabled={!canEdit}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition"
          style={{
            background: SURFACE, color: TEXT_SECONDARY,
            border: `1px solid ${BORDER}`, fontSize: 12.5, fontWeight: 600,
            cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5,
          }}
          title="Manage permissions"
        >
          <Key size={13} strokeWidth={2.25} />
          Manage
        </button>
        <button
          type="button"
          onClick={() => onDelete(role)}
          disabled={!canDelete}
          className="flex items-center justify-center transition"
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
            cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5,
          }}
          title="Delete role"
        >
          <Trash2 size={14} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────── main page ─────────────────────────────────── */
const RolesListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const canView = hasPermission(user, "get roles");
  const canCreate = hasPermission(user, "create roles");
  const canEdit = hasPermission(user, "update roles");
  const canDelete = hasPermission(user, "delete roles");

  const { data: rolesResp, isLoading, isError, refetch } = useGetQuery(
    { path: "core/roles" },
    { skip: !canView },
  );
  // Permissions list is used solely to compute the "all perms" badge — a role
  // that holds every system permission shows a red "327 perms" badge so an
  // operator can spot it at a glance.
  const { data: permsResp } = useGetQuery(
    { path: "core/permissions" },
    { skip: !canView },
  );

  const [deleteRole, { isLoading: isDeleting }] = useDeleteMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  // Pagination hooks live above the early-return guards below.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const roles = rolesResp?.data || [];
  const totalPermCount = (permsResp?.data || []).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const slug = (r.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [roles, search]);

  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, perPage, page]);

  const handleEdit = (role) => {
    navigate(HR_ROLE_EDIT.replace(":uuid", role.uuid));
  };

  // "Manage permissions" lands on the same edit page — that page exposes the
  // grouped permission picker. Keeping a single edit screen avoids duplicate
  // form logic and keeps the BE assign-permission endpoint a future-only call.
  const handleManagePerms = (role) => {
    navigate(HR_ROLE_EDIT.replace(":uuid", role.uuid));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteRole({
        path: `core/role/${deleteTarget.uuid}`,
      }).unwrap();
      showToast(res?.message || "Role deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      // Many seed roles are system-protected and BE rejects deletion. We surface
      // the BE message verbatim so HR understands why it failed.
      const msg = err?.data?.message || "Failed to delete role (it may be system-protected).";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div
          className="rounded-2xl p-5 flex items-center gap-3"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
        >
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view roles.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading roles…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load roles.{" "}
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
            <Shield size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Roles
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Multi-role groupings &mdash; assign permissions per role.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_ROLE_NEW)}
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
            New role
          </button>
        )}
      </div>

      {/* Search */}
      <div
        className="mb-6 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, maxWidth: 420 }}
      >
        <Search size={15} style={{ color: TEXT_MUTED }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles by name or slug…"
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: TEXT_PRIMARY }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="p-0.5 rounded hover:bg-slate-100"
            style={{ color: TEXT_MUTED }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-16 px-6 text-center"
          style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-4"
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Shield size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            {search ? "No matching roles" : "No roles yet"}
          </h3>
          <p className="text-[13px] mb-5" style={{ color: TEXT_SECONDARY }}>
            {search
              ? "Try a different search term, or clear the filter."
              : "Create your first role to start grouping permissions."}
          </p>
          {!search && canCreate && (
            <button
              type="button"
              onClick={() => navigate(HR_ROLE_NEW)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg"
              style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5 }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New role
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
        >
          {pagedFiltered.map((role) => (
            <RoleCard
              key={role.uuid || role.id}
              role={role}
              totalPermCount={totalPermCount}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onManagePerms={handleManagePerms}
              onDelete={(r) => setDeleteTarget(r)}
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

      <DeleteRoleDialog
        open={!!deleteTarget}
        role={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RolesListPage;
