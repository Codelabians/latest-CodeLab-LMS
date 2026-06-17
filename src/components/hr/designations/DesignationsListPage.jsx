import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  X,
  Layers,
} from "lucide-react";

import {
  useGetQuery,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";
import {
  HR_DESIGNATION_NEW,
  HR_DESIGNATION_EDIT,
} from "../../routes/RouteConstants";

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

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

/* ─── delete confirm dialog ─────────────────────────────────────────── */
const DeleteDialog = ({ open, row, onCancel, onConfirm, busy }) => {
  if (!open || !row) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Delete designation</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="flex items-start gap-2 mb-4">
          <AlertTriangle size={18} style={{ color: "#CA8A04" }} />
          <div>
            <p className="text-sm" style={{ color: TEXT_PRIMARY }}>
              Delete &quot;{row.name}&quot;?
            </p>
            <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
              Employees who already have this designation as a free-text value are unaffected.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded-md" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-40" style={{ background: BRAND_RED }}>
            {busy ? <Loader2 size={14} className="inline animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── main page ─────────────────────────────────────────────────────── */
const DesignationsListPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const canCreate = hasPermission(user, "create employee");
  const canUpdate = hasPermission(user, "update employee");
  const canDelete = hasPermission(user, "delete employee");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Client-side pagination (~46 rows, full list returned by BE).
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading, refetch } = useGetQuery({ path: "employee/designations" });
  const { data: deptsData } = useGetQuery({ path: "employee/departments" });
  const [deleteRow, { isLoading: deleting }] = useDeleteMutation();

  const departments = useMemo(() => unwrap(deptsData), [deptsData]);
  const designations = useMemo(() => {
    let list = unwrap(data);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        (d.name || "").toLowerCase().includes(q)
        || (d.slug || "").toLowerCase().includes(q)
      );
    }
    if (departmentFilter) {
      list = list.filter((d) => String(d.department_id) === String(departmentFilter));
    }
    return list;
  }, [data, search, departmentFilter]);

  const pagedDesignations = useMemo(() => {
    const start = (page - 1) * perPage;
    return designations.slice(start, start + perPage);
  }, [designations, page, perPage]);

  // Clamp the page when filter results shrink under the current offset.
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(designations.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [designations.length, perPage, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRow({ path: `employee/designations/${deleteTarget.uuid}` }).unwrap();
      showToast("Designation deleted", "success");
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not delete designation.", "error");
    }
  };

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh", color: TEXT_PRIMARY }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
            <BadgeCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Designations</h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              Job-title catalog. HR picks from these when hiring (free text still allowed).
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_DESIGNATION_NEW)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED }}
          >
            <Plus size={16} /> New designation
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 mb-4 bg-white border rounded-md" style={{ borderColor: BORDER }}>
        <div className="flex items-center flex-1 min-w-[200px] gap-2 px-2">
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designations…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: TEXT_PRIMARY }}
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-2 py-1 text-xs bg-white border rounded-md"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Loading / empty / table */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: TEXT_MUTED }}>
          <Loader2 className="mr-2 animate-spin" size={16} /> Loading designations…
        </div>
      )}
      {!isLoading && designations.length === 0 && (
        <div className="p-10 text-center bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <BadgeCheck size={28} className="mx-auto mb-3" style={{ color: TEXT_MUTED }} />
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            {search || departmentFilter ? "No designations match the current filters." : "No designations configured yet."}
          </p>
        </div>
      )}
      {!isLoading && designations.length > 0 && (
        <div className="overflow-hidden bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <table className="min-w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr style={{ color: TEXT_MUTED }}>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Designation</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Department</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Salary range</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Active</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedDesignations.map((d) => (
                <tr key={d.uuid} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{d.name}</div>
                    <div className="text-xs" style={{ color: TEXT_MUTED }}>{d.slug}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>
                    {d.department ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Layers size={11} style={{ color: TEXT_MUTED }} />
                        {d.department.name}
                      </span>
                    ) : (
                      <span className="text-xs italic" style={{ color: TEXT_MUTED }}>cross-dept</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                    {d.salary_min || d.salary_max ? (
                      <span>
                        {d.salary_currency} {d.salary_min ?? "—"} – {d.salary_max ?? "—"}
                      </span>
                    ) : (
                      <span className="italic" style={{ color: TEXT_MUTED }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full"
                      style={{
                        color: d.is_active ? "#16A34A" : "#94A3B8",
                        background: d.is_active ? "#F0FDF4" : "#F1F5F9",
                      }}
                    >
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => navigate(HR_DESIGNATION_EDIT.replace(":uuid", d.uuid))}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md"
                          style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md"
                          style={{ borderColor: BORDER, color: "#DC2626" }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && designations.length > 0 && (
        <SimplePagination
          page={page}
          total={designations.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      <DeleteDialog open={!!deleteTarget} row={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} busy={deleting} />
    </div>
  );
};

export default DesignationsListPage;
