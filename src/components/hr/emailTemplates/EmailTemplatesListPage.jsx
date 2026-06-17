import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Send,
  Search,
  Filter,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Eye,
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
  HR_EMAIL_TEMPLATE_EDIT,
  HR_EMAIL_TEMPLATE_NEW,
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

/* ─────────────────────── category derivation ─────────────────────────
 * No category column on the BE, so we derive one from the template `key`
 * prefix. Keeps the page useful without a schema change.
 *
 * Priority order for "Common first" sort — most-used templates float to
 * the top regardless of category. Without usage tracking these are the
 * ones HR most commonly reaches for.
 */
const CATEGORY_RULES = [
  { match: /^(welcome|onboarding)/i,                            cat: "Onboarding" },
  { match: /^contract/i,                                        cat: "Contracts" },
  { match: /^(payslip|payroll|salary)/i,                        cat: "Payroll" },
  { match: /^(birthday|work_anniversary|anniversary)/i,         cat: "Celebrations" },
  { match: /^(probation|promotion|increment)/i,                 cat: "Probation & Growth" },
  { match: /^attendance/i,                                      cat: "Attendance" },
  { match: /^leave/i,                                           cat: "Leave" },
  { match: /^(warning|recognition)/i,                           cat: "Performance" },
  { match: /^document/i,                                        cat: "Documents" },
  { match: /^asset/i,                                           cat: "Assets" },
  { match: /^(clearance|experience|exit|offboarding|separation)/i, cat: "Offboarding" },
];
const COMMON_PRIORITY = [
  "welcome", "onboarding_complete",
  "contract_pending", "contract_signed",
  "payslip_ready", "payroll_finalized",
  "birthday_wish", "work_anniversary",
];

const categoryFor = (key) => {
  for (const r of CATEGORY_RULES) if (r.match.test(key || "")) return r.cat;
  return "Other";
};
const commonRank = (key) => {
  const idx = COMMON_PRIORITY.indexOf(String(key || "").toLowerCase());
  return idx === -1 ? 999 : idx;
};

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
            Delete <strong style={{ color: TEXT_PRIMARY }}>{template.name}</strong>? Code that references this template key will stop firing emails. System templates cannot be deleted.
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

/* ─────────────────────── test send dialog ─────────────────────────── */
const TestSendDialog = ({ open, template, brands, onCancel, onSend, isLoading }) => {
  const [to, setTo] = useState("");
  const [brandKey, setBrandKey] = useState(brands[0]?.slug || "");
  if (!open || !template) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Send size={15} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Send test email</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>Template: {template.name}</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-md" style={{ width: 30, height: 30, color: TEXT_MUTED }}><X size={15} strokeWidth={2.25} /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Recipient email</label>
            <input
              type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@codelab.pk"
              className="w-full px-3 py-2.5 rounded-lg"
              style={{ border: `1px solid ${BORDER}`, fontSize: 13.5, outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>
          {brands.length > 0 && (
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Render as brand</label>
              <select
                value={brandKey} onChange={(e) => setBrandKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg"
                style={{ border: `1px solid ${BORDER}`, fontSize: 13.5, background: SURFACE, outline: "none" }}
              >
                {brands.map((b) => (
                  <option key={b.uuid} value={b.slug}>{b.name}{b.is_default ? " (default)" : ""}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button
            onClick={() => onSend({ to, brand_key: brandKey })} disabled={isLoading || !to}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: BRAND_RED, color: "#fff", opacity: (isLoading || !to) ? 0.6 : 1 }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.25} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── main list page ────────────────────────────── */
const EmailTemplatesListPage = ({
  group = null,
  title = "Email Templates",
  subtitle = "Every system email is rendered from a template here. Edit subjects, bodies, and variables — preview against any brand.",
  editRoute = HR_EMAIL_TEMPLATE_EDIT,
  newRoute = HR_EMAIL_TEMPLATE_NEW,
} = {}) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get email-templates");
  const canCreate = hasPermission(user, "create email-templates");
  const canEdit = hasPermission(user, "update email-templates");
  const canDelete = hasPermission(user, "delete email-templates");
  const canTestSend = hasPermission(user, "send test-email");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/email-templates", params: group ? { group } : undefined },
    { skip: !canView },
  );
  const { data: brandsData } = useGetQuery(
    { path: "employee/company-brands" },
    { skip: !canView },
  );

  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteMutation();
  const [sendTest, { isLoading: isSendingTest }] = usePostMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all/active/inactive
  const [systemFilter, setSystemFilter] = useState("all"); // all/system/custom
  const [brandFilter, setBrandFilter] = useState("all");   // all/brandId
  const [categoryFilter, setCategoryFilter] = useState("all"); // all/<Category>
  const [sortBy, setSortBy] = useState("common");          // common/name/updated

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testTarget, setTestTarget] = useState(null);
  // Client-side pagination — BE returns the full list (~32 rows, light).
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const allTemplates = useMemo(() => data?.data || [], [data]);
  const brands = useMemo(() => brandsData?.data || [], [brandsData]);

  // Distinct categories present in the dataset — used to render the
  // category filter chips. Sorted alphabetically with "Other" last.
  const categories = useMemo(() => {
    const set = new Set();
    allTemplates.forEach((t) => set.add(categoryFor(t.key)));
    const arr = Array.from(set);
    arr.sort((a, b) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
    return arr;
  }, [allTemplates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = allTemplates.filter((t) => {
      if (q) {
        const hay = `${t.name} ${t.key} ${t.subject} ${categoryFor(t.key)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "active" && !t.is_active) return false;
      if (statusFilter === "inactive" && t.is_active) return false;
      if (systemFilter === "system" && !t.is_system) return false;
      if (systemFilter === "custom" && t.is_system) return false;
      if (brandFilter !== "all") {
        if (brandFilter === "any" && t.brand_id) return false;
        if (brandFilter !== "any" && String(t.brand_id) !== brandFilter) return false;
      }
      if (categoryFilter !== "all" && categoryFor(t.key) !== categoryFilter) return false;
      return true;
    });

    // Sort. "common" puts the HR-most-reached templates on top (welcome,
    // contract, payslip, birthday, etc.), then alphabetical for the
    // long tail. "name" is pure A→Z. "updated" surfaces recently-edited
    // templates so HR can find what they just changed.
    if (sortBy === "common") {
      out.sort((a, b) => {
        const ra = commonRank(a.key);
        const rb = commonRank(b.key);
        if (ra !== rb) return ra - rb;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    } else if (sortBy === "name") {
      out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else if (sortBy === "updated") {
      out.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    }
    return out;
  }, [allTemplates, search, statusFilter, systemFilter, brandFilter, categoryFilter, sortBy]);

  // Paged slice for the table body. The filter row's "Showing N of M"
  // refers to `filtered.length` (the filtered total), not the page slice.
  const pagedFiltered = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // Clamp the active page if filters shrink the total under the offset.
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, perPage, page]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteTemplate({ path: `employee/email-templates/${deleteTarget.uuid}` }).unwrap();
      showToast(res?.message || "Template deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete template.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  const handleTestSend = async ({ to, brand_key }) => {
    if (!testTarget) return;
    try {
      const res = await sendTest({
        path: `employee/email-templates/${testTarget.uuid}/test-send`,
        body: { to, brand_key: brand_key || undefined },
      }).unwrap();
      showToast(res?.message || "Test email dispatched.", "success");
      setTestTarget(null);
    } catch (err) {
      const msg = err?.data?.message || "Failed to send test email.";
      showToast(msg, "error");
    }
  };

  const brandLookup = useMemo(() => {
    const m = new Map();
    brands.forEach((b) => m.set(b.id ?? b.uuid, b));
    return m;
  }, [brands]);

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view email templates.</span>
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
            <Mail size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {subtitle}
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate(newRoute)}
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
              placeholder="Search by name, key, or subject…"
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
            <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Type</span>
          </div>
          <FilterPill active={systemFilter === "all"} onClick={() => setSystemFilter("all")}>All</FilterPill>
          <FilterPill active={systemFilter === "system"} onClick={() => setSystemFilter("system")}>System</FilterPill>
          <FilterPill active={systemFilter === "custom"} onClick={() => setSystemFilter("custom")}>Custom</FilterPill>
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
                {brands.map((b) => <option key={b.uuid} value={String(b.id ?? "")}>{b.name}</option>)}
              </select>
            </>
          )}

          {/* Sort selector — defaults to "Common first" so HR sees the
              most-reached templates at the top of the list. */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Sort</span>
          </div>
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg"
            style={{ border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, background: SURFACE, outline: "none" }}
          >
            <option value="common">Common first</option>
            <option value="name">Name (A→Z)</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>

        {/* Category chip row — derived from template keys, so HR can
            filter to e.g. "Contracts" or "Payroll" without us shipping a
            new BE column. */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-semibold tracking-[0.4px] uppercase" style={{ color: TEXT_MUTED }}>Category</span>
            </div>
            <FilterPill active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
              All ({allTemplates.length})
            </FilterPill>
            {categories.map((c) => {
              const n = allTemplates.filter((t) => categoryFor(t.key) === c).length;
              return (
                <FilterPill key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                  {c} ({n})
                </FilterPill>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-[11.5px]" style={{ color: TEXT_MUTED }}>
          Showing <strong style={{ color: TEXT_SECONDARY }}>{filtered.length}</strong> of <strong style={{ color: TEXT_SECONDARY }}>{allTemplates.length}</strong> templates.
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto flex items-center justify-center mb-3" style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE_ALT, color: TEXT_MUTED }}>
              <Mail size={24} strokeWidth={2} />
            </div>
            <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>No templates match your filters.</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Category", "Key", "Subject", "Brand", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.6px] uppercase" style={{ color: TEXT_MUTED }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedFiltered.map((t) => {
                const pinnedBrand = t.brand_id ? brandLookup.get(t.brand_id) : null;
                return (
                  <tr
                    key={t.uuid}
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_ALT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.is_system && <Lock size={11} strokeWidth={2.5} style={{ color: TEXT_MUTED }} aria-label="System template" />}
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{t.name}</div>
                          {t.description && (
                            <div className="text-[11px] mt-0.5 truncate max-w-[280px]" style={{ color: TEXT_MUTED }}>{t.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                        style={{
                          background: SURFACE_ALT,
                          color: TEXT_SECONDARY,
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        {categoryFor(t.key)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{ background: SURFACE_ALT, color: BRAND_RED, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
                      >
                        {t.key}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="text-[12.5px] truncate" style={{ color: TEXT_SECONDARY }}>{t.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      {pinnedBrand ? (
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BRAND_RED}` }}>
                          {pinnedBrand.name}
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
                          onClick={() => navigate(editRoute.replace(":uuid", t.uuid))}
                          disabled={!canEdit}
                          title={t.is_system ? "System template — editable but not deletable" : "Edit"}
                          className="flex items-center justify-center"
                          style={{ width: 32, height: 32, borderRadius: 6, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5 }}
                          onMouseEnter={(e) => canEdit && (e.currentTarget.style.color = BRAND_RED)}
                          onMouseLeave={(e) => canEdit && (e.currentTarget.style.color = TEXT_SECONDARY)}
                        >
                          {t.is_system ? <Eye size={13} strokeWidth={2.25} /> : <Pencil size={13} strokeWidth={2.25} />}
                        </button>
                        <button
                          onClick={() => setTestTarget(t)}
                          disabled={!canTestSend}
                          title="Send test email"
                          className="flex items-center justify-center"
                          style={{ width: 32, height: 32, borderRadius: 6, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, cursor: canTestSend ? "pointer" : "not-allowed", opacity: canTestSend ? 1 : 0.5 }}
                          onMouseEnter={(e) => canTestSend && (e.currentTarget.style.color = BRAND_RED)}
                          onMouseLeave={(e) => canTestSend && (e.currentTarget.style.color = TEXT_SECONDARY)}
                        >
                          <Send size={12} strokeWidth={2.25} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          disabled={!canDelete || t.is_system}
                          title={t.is_system ? "System templates cannot be deleted" : "Delete"}
                          className="flex items-center justify-center"
                          style={{
                            width: 32, height: 32, borderRadius: 6,
                            background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`,
                            cursor: (!canDelete || t.is_system) ? "not-allowed" : "pointer",
                            opacity: (!canDelete || t.is_system) ? 0.4 : 1,
                          }}
                          onMouseEnter={(e) => canDelete && !t.is_system && (e.currentTarget.style.color = BRAND_RED)}
                          onMouseLeave={(e) => canDelete && !t.is_system && (e.currentTarget.style.color = TEXT_MUTED)}
                        >
                          <Trash2 size={13} strokeWidth={2.25} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      <TestSendDialog
        open={!!testTarget}
        template={testTarget}
        brands={brands}
        onCancel={() => setTestTarget(null)}
        onSend={handleTestSend}
        isLoading={isSendingTest}
      />
    </div>
  );
};

export default EmailTemplatesListPage;
