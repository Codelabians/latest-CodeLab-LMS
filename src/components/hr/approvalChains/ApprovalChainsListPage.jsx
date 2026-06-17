import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Workflow,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  Loader2,
  X,
  AlertTriangle,
  ArrowRight,
  Eye,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_APPROVAL_CHAIN_EDIT,
  HR_APPROVAL_CHAIN_NEW,
} from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ─────────────────────── */
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

/* ─────────────────────── role color helper ─────────────────────── */
const roleColor = (roleKey) => {
  switch ((roleKey || "").toUpperCase()) {
    case "HR":          return { bg: "#FEF2F2", fg: "#C90606", border: "#FCA5A5" };
    case "ADMIN":       return { bg: "#EFF6FF", fg: "#1D4ED8", border: "#93C5FD" };
    case "TEAM_LEAD":   return { bg: "#F0FDF4", fg: "#15803D", border: "#86EFAC" };
    case "CEO":         return { bg: "#FAF5FF", fg: "#7E22CE", border: "#D8B4FE" };
    case "MANAGER":     return { bg: "#FFF7ED", fg: "#C2410C", border: "#FDBA74" };
    case "FINANCE":     return { bg: "#FEFCE8", fg: "#A16207", border: "#FDE047" };
    case "SUPER_ADMIN": return { bg: "#F5F3FF", fg: "#5B21B6", border: "#C4B5FD" };
    default:            return { bg: "#F1F5F9", fg: "#475569", border: "#CBD5E1" };
  }
};

/* ─────────────────────── role chip ─────────────────────── */
const RoleChip = ({ roleKey }) => {
  const c = roleColor(roleKey);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold tracking-[0.3px]"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
    >
      {roleKey}
    </span>
  );
};

/* ─────────────────────── step chain preview ─────────────────────── */
const StepChain = ({ steps }) => {
  const sorted = [...(steps || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (sorted.length === 0) {
    return <span className="text-[11px] italic" style={{ color: TEXT_MUTED }}>No steps</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sorted.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <RoleChip roleKey={s.role_key} />
          {i < sorted.length - 1 && (
            <ArrowRight size={11} strokeWidth={2.25} style={{ color: TEXT_MUTED }} />
          )}
        </span>
      ))}
    </div>
  );
};

/* ─────────────────────── delete dialog ─────────────────────── */
const DeleteChainDialog = ({ open, chain, onCancel, onConfirm, isLoading }) => {
  if (!open || !chain) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <AlertTriangle size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Delete approval chain</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>Refused if any instances reference this chain.</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-md" style={{ width: 30, height: 30, color: TEXT_MUTED }}><X size={15} /></button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Delete <strong style={{ color: TEXT_PRIMARY }}>{chain.name}</strong> (<code style={{ fontFamily: "JetBrains Mono, monospace" }}>{chain.key}</code>)?
            Code that initiates this chain key will stop creating approval instances.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ background: BRAND_RED, color: "#fff", opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2.25} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── main list page ─────────────────────── */
const ApprovalChainsListPage = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const canView = hasPermission(user, "get approval-chains");
  const canCreate = hasPermission(user, "create approval-chains");
  const canEdit = hasPermission(user, "update approval-chains");
  const canDelete = hasPermission(user, "delete approval-chains");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/approval-chains" },
    { skip: !canView },
  );

  const [deleteChain, { isLoading: isDeleting }] = useDeleteMutation();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Pagination — hooks live above the early-return guards.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const allChains = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allChains;
    return allChains.filter((c) => {
      const hay = `${c.name} ${c.key} ${c.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allChains, search]);

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
      const res = await deleteChain({ path: `employee/approval-chains/${deleteTarget.uuid}` }).unwrap();
      showToast(res?.message || "Chain deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete chain.";
      showToast(msg, "error");
      setDeleteTarget(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} /> <span>You don&apos;t have permission to view approval chains.</span>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}><Loader2 size={20} className="animate-spin mr-2" />Loading chains…</div>;
  }
  if (isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load chains. <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Workflow size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>Approval Chains</h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Reusable approval workflows. Each chain defines an ordered sequence of approvers (HR → Admin → Team Lead → CEO etc.).
              Code dispatches new approval instances by chain key when leaves, promotions, asset issuance, etc. are requested.
            </p>
          </div>
        </div>
        {canCreate && (
          <button onClick={() => navigate(HR_APPROVAL_CHAIN_NEW)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg" style={{ background: BRAND_RED, color: "#fff", fontWeight: 600, fontSize: 13.5, boxShadow: "0 4px 10px rgba(201,6,6,0.12)" }} onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_RED_DARK)} onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED)}>
            <Plus size={15} strokeWidth={2.5} />
            Add Chain
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="rounded-2xl mb-5 p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="relative">
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, key, or description…"
            className="w-full pl-9 pr-3 py-2 rounded-lg"
            style={{ border: `1px solid ${BORDER}`, fontSize: 13, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
            onBlur={(e) => (e.target.style.borderColor = BORDER)}
          />
        </div>
        <div className="mt-2 text-[11.5px]" style={{ color: TEXT_MUTED }}>
          Showing <strong style={{ color: TEXT_SECONDARY }}>{filtered.length}</strong> of <strong style={{ color: TEXT_SECONDARY }}>{allChains.length}</strong> chains.
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto flex items-center justify-center mb-3" style={{ width: 56, height: 56, borderRadius: 14, background: SURFACE_ALT, color: TEXT_MUTED }}>
              <Workflow size={24} strokeWidth={2} />
            </div>
            <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>No chains match your search.</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Key", "Steps", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.6px] uppercase" style={{ color: TEXT_MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedFiltered.map((c) => (
                <tr key={c.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_ALT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{c.name}</div>
                      {c.description && (
                        <div className="text-[11px] mt-0.5 truncate max-w-[320px]" style={{ color: TEXT_MUTED }}>{c.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-[11px] px-2 py-0.5 rounded" style={{ background: SURFACE_ALT, color: BRAND_RED, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{c.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <StepChain steps={c.steps} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                      style={{
                        background: c.is_active ? "#DCFCE7" : SURFACE_ALT,
                        color: c.is_active ? "#15803D" : TEXT_MUTED,
                        border: `1px solid ${c.is_active ? "#86EFAC" : BORDER}`,
                      }}>
                      {c.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(HR_APPROVAL_CHAIN_EDIT.replace(":uuid", c.uuid))}
                              disabled={!canEdit} title="Edit chain"
                              className="flex items-center justify-center"
                              style={{ width: 32, height: 32, borderRadius: 6, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`, cursor: canEdit ? "pointer" : "not-allowed", opacity: canEdit ? 1 : 0.5 }}
                              onMouseEnter={(e) => canEdit && (e.currentTarget.style.color = BRAND_RED)}
                              onMouseLeave={(e) => canEdit && (e.currentTarget.style.color = TEXT_SECONDARY)}>
                        {canEdit ? <Pencil size={13} strokeWidth={2.25} /> : <Eye size={13} strokeWidth={2.25} />}
                      </button>
                      <button onClick={() => setDeleteTarget(c)} disabled={!canDelete} title="Delete chain"
                              className="flex items-center justify-center"
                              style={{ width: 32, height: 32, borderRadius: 6, background: SURFACE, color: TEXT_MUTED, border: `1px solid ${BORDER}`, cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5 }}
                              onMouseEnter={(e) => canDelete && (e.currentTarget.style.color = BRAND_RED)}
                              onMouseLeave={(e) => canDelete && (e.currentTarget.style.color = TEXT_MUTED)}>
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

      <DeleteChainDialog open={!!deleteTarget} chain={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
    </div>
  );
};

export default ApprovalChainsListPage;
