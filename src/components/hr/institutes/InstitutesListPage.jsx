import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  X,
  MapPin,
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
  HR_INSTITUTE_NEW,
  HR_INSTITUTE_EDIT,
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

const TYPE_LABELS = {
  university: "University",
  college:    "College",
  school:     "School",
  institute:  "Institute",
};
const TYPE_TONES = {
  university: { color: BRAND_RED, bg: BRAND_RED_TINT },
  college:    { color: "#1D4ED8", bg: "#EFF6FF" },
  school:     { color: "#15803D", bg: "#F0FDF4" },
  institute:  { color: "#7C3AED", bg: "#F5F3FF" },
};

/* ─── delete confirm dialog ─────────────────────────────────────────── */
const DeleteDialog = ({ open, row, onCancel, onConfirm, busy }) => {
  if (!open || !row) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Delete institute</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="flex items-start gap-2 mb-4">
          <AlertTriangle size={18} style={{ color: "#CA8A04" }} />
          <div>
            <p className="text-sm" style={{ color: TEXT_PRIMARY }}>
              Delete &quot;{row.name}&quot;?
            </p>
            <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
              Employees / students linked to this institute keep their free-text
              record but lose the FK reference.
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

const InstitutesListPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const canCreate = hasPermission(user, "create employee");
  const canUpdate = hasPermission(user, "update employee");
  const canDelete = hasPermission(user, "delete employee");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Client-side pagination — the BE returns all institutes in one shot
  // (~60 rows, small) so we slice locally rather than round-trip per page.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading, refetch } = useGetQuery({ path: "employee/institutes" });
  const [deleteRow, { isLoading: deleting }] = useDeleteMutation();

  const institutes = useMemo(() => {
    let list = unwrap(data);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        (i.name || "").toLowerCase().includes(q)
        || (i.city || "").toLowerCase().includes(q)
        || (i.slug || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      list = list.filter((i) => i.type === typeFilter);
    }
    return list;
  }, [data, search, typeFilter]);

  // Sliced view for the current page. Filtered total is what the bar
  // bases its math on.
  const pagedInstitutes = useMemo(() => {
    const start = (page - 1) * perPage;
    return institutes.slice(start, start + perPage);
  }, [institutes, page, perPage]);

  // Clamp page when filters shrink the list under the current offset.
  // Prevents "Showing 50 to 75 of 12" weirdness.
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(institutes.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [institutes.length, perPage, page]);

  const countsByType = useMemo(() => {
    const out = { university: 0, college: 0, school: 0, institute: 0 };
    for (const i of unwrap(data)) {
      if (out[i.type] !== undefined) out[i.type]++;
    }
    return out;
  }, [data]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRow({ path: `employee/institutes/${deleteTarget.uuid}` }).unwrap();
      showToast("Institute deleted", "success");
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not delete institute.", "error");
    }
  };

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh", color: TEXT_PRIMARY }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Institutes</h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              Universities, colleges, schools & training institutes — used by both employee education and student enrollment forms.
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(HR_INSTITUTE_NEW)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: BRAND_RED }}
          >
            <Plus size={16} /> New institute
          </button>
        )}
      </div>

      {/* Type filter tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-4">
        {Object.keys(TYPE_LABELS).map((t) => {
          const tone = TYPE_TONES[t];
          const active = typeFilter === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(active ? "" : t)}
              className="flex items-center gap-3 p-3 text-left border rounded-xl transition"
              style={{
                borderColor: active ? tone.color : BORDER,
                background: active ? tone.bg : "white",
              }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: tone.bg, color: tone.color }}>
                <GraduationCap size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{TYPE_LABELS[t]}</div>
                <div className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>{countsByType[t] || 0}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-2 p-3 mb-4 bg-white border rounded-md" style={{ borderColor: BORDER }}>
        <div className="flex items-center flex-1 min-w-[200px] gap-2 px-2">
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institutes by name, city or slug…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: TEXT_PRIMARY }}
          />
        </div>
        {(typeFilter || search) && (
          <button
            type="button"
            onClick={() => { setTypeFilter(""); setSearch(""); }}
            className="px-2 py-1 text-xs border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading / empty / table */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: TEXT_MUTED }}>
          <Loader2 className="mr-2 animate-spin" size={16} /> Loading institutes…
        </div>
      )}
      {!isLoading && institutes.length === 0 && (
        <div className="p-10 text-center bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <GraduationCap size={28} className="mx-auto mb-3" style={{ color: TEXT_MUTED }} />
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            {search || typeFilter ? "No institutes match the current filters." : "No institutes added yet."}
          </p>
        </div>
      )}
      {!isLoading && institutes.length > 0 && (
        <div className="overflow-hidden bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <table className="min-w-full text-sm">
            <thead style={{ background: SURFACE_ALT }}>
              <tr style={{ color: TEXT_MUTED }}>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Location</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Website</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Active</th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedInstitutes.map((i) => {
                const tone = TYPE_TONES[i.type] || TYPE_TONES.institute;
                return (
                  <tr key={i.uuid} className="border-t" style={{ borderColor: BORDER }}>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: TEXT_PRIMARY }}>{i.name}</div>
                      <div className="text-xs" style={{ color: TEXT_MUTED }}>{i.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md"
                        style={{ color: tone.color, background: tone.bg }}
                      >
                        {TYPE_LABELS[i.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                      {i.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} style={{ color: TEXT_MUTED }} />
                          {i.city}{i.country && i.country !== "Pakistan" ? `, ${i.country}` : ""}
                        </span>
                      ) : (
                        <span className="italic" style={{ color: TEXT_MUTED }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>
                      {i.website ? (
                        <a href={i.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: BRAND_RED }}>
                          <Globe size={11} />
                          {i.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : (
                        <span className="italic" style={{ color: TEXT_MUTED }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full"
                        style={{
                          color: i.is_active ? "#16A34A" : "#94A3B8",
                          background: i.is_active ? "#F0FDF4" : "#F1F5F9",
                        }}
                      >
                        {i.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => navigate(HR_INSTITUTE_EDIT.replace(":uuid", i.uuid))}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md"
                            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(i)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md"
                            style={{ borderColor: BORDER, color: "#DC2626" }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && institutes.length > 0 && (
        <SimplePagination
          page={page}
          total={institutes.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      <DeleteDialog open={!!deleteTarget} row={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} busy={deleting} />
    </div>
  );
};

export default InstitutesListPage;
