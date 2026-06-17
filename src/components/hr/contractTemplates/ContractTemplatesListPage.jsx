import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
  Star,
  CheckCircle2,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
  usePostMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_CONTRACT_TEMPLATE_EDIT,
  HR_CONTRACT_TEMPLATE_NEW,
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

/* ─────────────────────── applies_to labels ─────────────────────────── */
const APPLIES_TO = [
  { value: "any", label: "Any" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "consultant", label: "Consultant" },
  { value: "intern_paid", label: "Intern (paid)" },
  { value: "intern_unpaid", label: "Intern (unpaid)" },
  { value: "outsourced", label: "Outsourced" },
];
const appliesLabel = (v) =>
  APPLIES_TO.find((a) => a.value === v)?.label || v || "—";

/* ─────────────────────── filter pill ──────────────────────────────── */
const FilterPill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg transition"
    style={{
      fontSize: 12, fontWeight: 600,
      background: active ? BRAND_RED_TINT : SURFACE,
      color: active ? BRAND_RED : TEXT_SECONDARY,
      border: `1px solid ${active ? BRAND_RED : BORDER}`,
    }}
  >
    {children}
  </button>
);

/* ─────────────────────── delete dialog ────────────────────────────── */
const DeleteTemplateDialog = ({ open, template, onCancel, onConfirm, isLoading }) => {
  if (!open || !template) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <AlertTriangle size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete template</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>This action cannot be undone.</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-md" style={{ width: 30, height: 30, color: TEXT_MUTED }}>
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Delete <strong style={{ color: TEXT_PRIMARY }}>{template.name}</strong>? Existing signed contracts keep their frozen snapshot — only this reusable blueprint is removed.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button
            onClick={onConfirm} disabled={isLoading}
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

/* ─────────────────────── main list page ────────────────────────────── */
const ContractTemplatesListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const canView = hasPermission(user, "get employee-contract-templates");
  const canCreate = hasPermission(user, "create employee-contract-templates");
  const canEdit = hasPermission(user, "update employee-contract-templates");
  const canDelete = hasPermission(user, "delete employee-contract-templates");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/contract-templates", params: { per_page: 100 } },
    { skip: !canView },
  );
  const { data: brandsData } = useGetQuery(
    { path: "employee/company-brands" },
    { skip: !canView },
  );

  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteMutation();
  const [setDefault, { isLoading: isSettingDefault }] = usePostMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");   // all/active/inactive
  const [appliesFilter, setAppliesFilter] = useState("all"); // all/<enum>
  const [brandFilter, setBrandFilter] = useState("all");     // all/any/<brandName>
  const [busyDefaultUuid, setBusyDefaultUuid] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // The list transformer returns brand as a string (name) or null. The
  // detail transformer returns a brand object — but the list endpoint is
  // what we render here, so we treat brand as a display string.
  const allTemplates = useMemo(() => data?.data || [], [data]);
  const brands = useMemo(() => brandsData?.data || [], [brandsData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = allTemplates.filter((t) => {
      if (q) {
        const hay = `${t.name} ${t.key} ${t.designation} ${appliesLabel(t.applies_to)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "active" && !t.is_active) return false;
      if (statusFilter === "inactive" && t.is_active) return false;
      if (appliesFilter !== "all" && t.applies_to !== appliesFilter) return false;
      if (brandFilter !== "all") {
        if (brandFilter === "any" && t.brand) return false;
        if (brandFilter !== "any" && String(t.brand || "") !== brandFilter) return false;
      }
      return true;
    });
    // Default templates float to the top, then alphabetical by name.
    out.sort((a, b) => {
      if (!!b.is_default - !!a.is_default !== 0) return (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0);
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    return out;
  }, [allTemplates, search, statusFilter, appliesFilter, brandFilter]);

  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, perPage, page]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteTemplate({ path: `employee/contract-templates/${deleteTarget.uuid}` }).unwrap();
      showToast(res?.message || "Template deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete template.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  const handleSetDefault = async (t) => {
    if (!t || t.is_default) return;
    setBusyDefaultUuid(t.uuid);
    try {
      const res = await setDefault({ path: `employee/contract-templates/${t.uuid}/set-default` }).unwrap();
      showToast(res?.message || "Default template updated.", "success");
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to set default.";
      showToast(msg, "error");
    } finally {
      setBusyDefaultUuid(null);
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view contract templates.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading templates…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load templates.{" "}
          <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>Retry</button>
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
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <FileText size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>Contract Templates</h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Reusable HTML blueprints HR maintains. When a contract is issued, the body is frozen as a snapshot — future edits here don&apos;t change signed contracts.
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate(HR_CONTRACT_TEMPLATE_NEW)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg"
            style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5, boxShadow: "0 4px 10px rgba(201,6,6,0.12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_RED_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED)}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Template
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl mb-5 p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, key, or designation…"
              className="w-full pl-9 pr-3 py-2 rounded-lg"
              style={{ border: `1px solid ${BORDER}`, fontSize: 13, outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: TEXT_MUTED }} />
            <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Status</span>
          </div>
          <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterPill>
          <FilterPill active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>Active</FilterPill>
          <FilterPill active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")}>Inactive</FilterPill>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Applies to</span>
          </div>
          <select
            value={appliesFilter} onChange={(e) => setAppliesFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg"
            style={{ border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, background: SURFACE, outline: "none" }}
          >
            <option value="all">All</option>
            {APPLIES_TO.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>

          {brands.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Brand</span>
              </div>
              <select
                value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg"
                style={{ border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, background: SURFACE, outline: "none" }}
              >
                <option value="all">All</option>
                <option value="any">Any (not pinned)</option>
                {brands.map((b) => <option key={b.uuid} value={b.name}>{b.name}</option>)}
              </select>
            </>
          )}
        </div>

        <div className="mt-3 text-[11.5px]" style={{ color: TEXT_MUTED }}>
          Showing <strong style={{ color: TEXT_SECONDARY }}>{filtered.length}</strong> of <strong style={{ color: TEXT_SECONDARY }}>{allTemplates.length}</strong> templates.
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto flex items-center justify-center mb-3" style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE_ALT, color: TEXT_MUTED }}>
              <FileText size={24} strokeWidth={2} />
            </div>
            <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>No templates match your filters.</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Designation", "Applies to", "Brand", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.6px] uppercase" style={{ color: TEXT_MUTED }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedFiltered.map((t) => (
                <tr
                  key={t.uuid}
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_ALT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.is_default && (
                        <span title="Default template">
                          <Star size={12} strokeWidth={2.5} style={{ color: "#D97706", fill: "#FbbF24" }} />
                        </span>
                      )}
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{t.name}</div>
                        <code
                          className="text-[10.5px] px-1.5 py-0.5 rounded mt-0.5 inline-block"
                          style={{ background: SURFACE_ALT, color: BRAND_RED, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
                        >
                          {t.key}
                        </code>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12.5px]" style={{ color: TEXT_SECONDARY }}>{t.designation || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                      style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
                    >
                      {appliesLabel(t.applies_to)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.brand ? (
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BRAND_RED}` }}>
                        {t.brand}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Any</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                      style={{
                        background: t.is_active ? "#DCFCE7" : SURFACE_ALT,
                        color: t.is_active ? "#15803D" : TEXT_MUTED,
                        border: `1px solid ${t.is_active ? "#86EFAC" : BORDER}`,
                      }}
                    >
                      {t.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(HR_CONTRACT_TEMPLATE_EDIT.replace(":uuid", t.uuid))}
                        disabled={!canEdit}
                        title="Edit"
                        className="flex items-center justify-center"
                        style={{ width: 32, height: 32, borderRadius: 6, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5 }}
                      >
                        <Pencil size={13} strokeWidth={2.25} />
                      </button>
                      <button
                        onClick={() => handleSetDefault(t)}
                        disabled={!canEdit || t.is_default || isSettingDefault}
                        title={t.is_default ? "Already the default" : "Set as default template"}
                        className="flex items-center justify-center"
                        style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: t.is_default ? "#FEF9C3" : "#F0FDF4", color: t.is_default ? "#A16207" : "#15803D",
                          border: `1px solid ${t.is_default ? "#FDE68A" : "#BBF7D0"}`,
                          cursor: (!canEdit || t.is_default) ? "not-allowed" : "pointer",
                          opacity: (!canEdit || t.is_default) ? 0.6 : 1,
                        }}
                      >
                        {busyDefaultUuid === t.uuid ? <Loader2 size={12} className="animate-spin" /> : (t.is_default ? <Star size={13} strokeWidth={2.25} /> : <CheckCircle2 size={13} strokeWidth={2.25} />)}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        disabled={!canDelete}
                        title="Delete"
                        className="flex items-center justify-center"
                        style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BRAND_RED_TINT}`,
                          cursor: !canDelete ? "not-allowed" : "pointer",
                          opacity: !canDelete ? 0.4 : 1,
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2.25} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <SimplePagination
          page={page}
          total={filtered.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      <DeleteTemplateDialog
        open={!!deleteTarget}
        template={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ContractTemplatesListPage;
