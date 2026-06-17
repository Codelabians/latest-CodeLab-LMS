import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Building2,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";

const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────── modal ─────────── */
function LeaveTypeModal({ initial, brands, onClose, onSaved }) {
  const isEdit = !!initial;
  const [code, setCode]         = useState(initial?.code || "");
  const [name, setName]         = useState(initial?.name || "");
  const [brandId, setBrandId]   = useState(initial?.brand_id ?? "");
  const [days, setDays]         = useState(initial?.days_per_year ?? 0);
  const [isPaid, setIsPaid]     = useState(initial ? !!initial.is_paid : true);
  const [color, setColor]       = useState(initial?.color || "0E7490");
  const [sort, setSort]         = useState(initial?.sort_order ?? 50);
  const [isActive, setIsActive] = useState(initial ? !!initial.is_active : true);
  const [desc, setDesc]         = useState(initial?.description || "");
  const [busy, setBusy]         = useState(false);

  const [post]  = usePostMutation();
  const [patch] = usePatchMutation();

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!code.trim() || !name.trim()) {
      showToast("error", "Code and name are required.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        code: code.trim(),
        name: name.trim(),
        brand_id: brandId === "" ? null : Number(brandId),
        days_per_year: Number(days) || 0,
        is_paid: !!isPaid,
        color: color.trim(),
        sort_order: Number(sort) || 0,
        is_active: !!isActive,
        description: desc || null,
      };
      let res;
      if (isEdit) {
        res = await patch({ path: `employee/leave/types/${initial.uuid}`, body }).unwrap();
      } else {
        res = await post({ path: "employee/leave/types", body }).unwrap();
      }
      showToast("success", res?.message || (isEdit ? "Leave type updated." : "Leave type created."));
      onSaved?.(res?.data);
    } catch (err) {
      showToast("error", err?.data?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl"
      >
        <header
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <Tags size={14} />
            </span>
            <h2 className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              {isEdit ? "Edit leave type" : "Create leave type"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </header>
        <div className="grid grid-cols-2 gap-4 p-5">
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              placeholder="annual, sick, ..."
              disabled={isEdit}
              required
            />
            {isEdit && (
              <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>Code can&apos;t be changed.</p>
            )}
          </div>
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
              placeholder="Annual leave"
              required
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Days per year
            </label>
            <input
              type="number" min="0" step="0.5"
              value={days} onChange={(e) => setDays(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Brand scope
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            >
              <option value="">— Company-wide —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Color (hex, no #)
            </label>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-6 h-6 border rounded"
                style={{ background: "#" + color, borderColor: BORDER }}
              />
              <input
                type="text" value={color} maxLength={7}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none"
                style={{ borderColor: BORDER }}
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Sort order
            </label>
            <input
              type="number" min="0" max="9999"
              value={sort} onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
          <div className="flex items-center col-span-2 gap-6 pt-1">
            <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer">
              <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
              <span style={{ color: TEXT_SECONDARY }}>Paid</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span style={{ color: TEXT_SECONDARY }}>Active</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>
              Description (optional)
            </label>
            <textarea
              rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <footer
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-lg"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create type"}
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────── Page ─────────── */
export default function LeaveTypesPage() {
  const user = useSelector(selectCurrentUser);
  const canRead   = hasPermission(user, "get leave-types");
  const canCreate = hasPermission(user, "create leave-types");
  const canUpdate = hasPermission(user, "update leave-types");
  const canDelete = hasPermission(user, "delete leave-types");

  const [activeOnly, setActiveOnly] = useState(true);
  const [brandId, setBrandId] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | {edit row}

  const { data: brandsResp } = useGetQuery({ path: "employee/company-brands" });
  // The brands endpoint can return either { data: [...] } (flat) or
  // { data: { data: [...] } } (double-wrapped via ApiResponse). Handle both —
  // same pattern as EmployeeFormPage.
  const brands = useMemo(() => {
    const root = brandsResp?.data ?? brandsResp ?? [];
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    return [];
  }, [brandsResp]);

  const params = useMemo(() => {
    const p = { active: activeOnly ? 1 : 0 };
    if (brandId) p.brand_id = brandId;
    return p;
  }, [activeOnly, brandId]);

  const { data, isFetching, refetch } = useGetQuery({
    path: "employee/leave/types",
    params,
  });
  const rows = data?.data || [];

  const [del] = useDeleteMutation();
  const remove = async (row) => {
    if (!window.confirm(`Delete leave type "${row.name}"? Existing requests stay intact.`)) return;
    try {
      await del({ path: `employee/leave/types/${row.uuid}` }).unwrap();
      showToast("success", "Leave type deleted.");
      refetch();
    } catch (err) {
      showToast("error", err?.data?.message || "Delete failed.");
    }
  };

  if (!canRead) {
    return (
      <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>
        You don&apos;t have permission to view leave types.
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{
        padding: "28px 28px 60px",
        fontFamily: "Montserrat, ui-sans-serif, system-ui",
        color: TEXT_PRIMARY,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Tags size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Leave Types</h1>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              {rows.length} type{rows.length === 1 ? "" : "s"} · configure annual / sick / casual / unpaid + any custom ones
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED }}
          >
            <Plus size={16} />
            New type
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className="flex items-end gap-3 p-4 mb-4 bg-white border rounded-2xl"
        style={{ borderColor: BORDER }}
      >
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: TEXT_SECONDARY }}>
            Brand
          </label>
          <select
            value={brandId} onChange={(e) => setBrandId(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg outline-none min-w-[200px]"
            style={{ borderColor: BORDER }}
          >
            <option value="">All (company-wide + brands)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer pb-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          <span style={{ color: TEXT_SECONDARY }}>Active only</span>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        {isFetching ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-sm text-center" style={{ color: TEXT_MUTED }}>
            No leave types match these filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                <th className="px-5 py-3">Type</th>
                <th className="px-3 py-3">Brand</th>
                <th className="px-3 py-3 text-right">Days / year</th>
                <th className="px-3 py-3">Paid</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uuid} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: "#" + (r.color || "64748B") }}
                      />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>
                    {r.brand_name ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} style={{ color: TEXT_MUTED }} />
                        {r.brand_name}
                      </span>
                    ) : (
                      <span style={{ color: TEXT_MUTED }}>Company-wide</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {Number(r.days_per_year).toFixed(r.days_per_year % 1 ? 1 : 0)}
                  </td>
                  <td className="px-3 py-3">
                    {r.is_paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ color: "#15803D", background: "#F0FDF4" }}>
                        <CheckCircle2 size={11} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ color: "#64748B", background: "#F1F5F9" }}>
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.is_active ? (
                      <span className="text-[11px] font-medium" style={{ color: "#15803D" }}>Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: TEXT_MUTED }}>
                        <CircleOff size={11} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => setModal({ edit: r })}
                        className="p-1.5 rounded hover:bg-slate-100"
                        title="Edit"
                      >
                        <Pencil size={13} style={{ color: TEXT_SECONDARY }} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        className="p-1.5 rounded hover:bg-slate-100"
                        title="Delete"
                      >
                        <Trash2 size={13} style={{ color: "#B91C1C" }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === "create" && (
        <LeaveTypeModal
          initial={null} brands={brands}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch(); }}
        />
      )}
      {modal && typeof modal === "object" && modal.edit && (
        <LeaveTypeModal
          initial={modal.edit} brands={brands}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch(); }}
        />
      )}
    </div>
  );
}
