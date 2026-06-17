import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus, Search, Pencil, Trash2, Building2, X,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import SimplePagination from "../ui/SimplePagination";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ───────────────── add/edit modal ───────────────── */
const CityFormModal = ({ open, mode, initial, provinces, onCancel, onSubmit, isLoading }) => {
  const [name, setName] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTouched({}); setServerError("");
    setName(initial?.name || "");
    setProvinceId(initial?.province_id ? String(initial.province_id) : "");
    setIsActive(initial ? !!initial.is_active : true);
  }, [open, initial]);

  if (!open) return null;
  const nameErr = !name.trim() ? "City name is required" : name.length > 255 ? "Max 255 chars" : "";
  const provErr = !provinceId ? "Pick a province" : "";

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    [provinces]
  );

  const handleSave = async () => {
    setTouched({ name: true, province_id: true });
    if (nameErr || provErr) return;
    setServerError("");
    const res = await onSubmit({
      name: name.trim(),
      province_id: Number(provinceId),
      is_active: isActive,
    });
    if (res?.error) setServerError(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Building2 size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {mode === "edit" ? "Edit City" : "Add City"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                Cities belong to a province — the inquiry/visitor dropdowns read this list.
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close"
            className="flex items-center justify-center transition rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED, background: "transparent" }}
          ><X size={15} strokeWidth={2.25} /></button>
        </div>

        <div className="px-5 py-5">
          {serverError && (
            <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
              {serverError}
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Name *</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Lahore"
                style={{ background: SURFACE_HOVER, border: `1px solid ${touched.name && nameErr ? "#FCA5A5" : BORDER}`, color: TEXT_PRIMARY, width: "100%", height: 40, padding: "0 12px", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Montserrat', sans-serif" }}
              />
              {touched.name && nameErr && (
                <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>{nameErr}</p>
              )}
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Province *</label>
              <SearchableSelect
                options={provinceOptions}
                value={provinceId}
                onChange={(v) => { setProvinceId(v || ""); setTouched((t) => ({ ...t, province_id: true })); }}
                placeholder="Pick a province"
                hasError={touched.province_id && !!provErr}
              />
              {touched.province_id && provErr && (
                <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>{provErr}</p>
              )}
            </div>
            <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
              style={{ background: isActive ? "#F0FDF4" : SURFACE_HOVER, border: `1px solid ${isActive ? "#BBF7D0" : BORDER}` }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: "#15803D" }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: isActive ? "#15803D" : TEXT_PRIMARY }}>Active</div>
                <div className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 1 }}>Inactive cities are hidden from dropdowns.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button type="button" onClick={handleSave} disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : mode === "edit" ? "Save changes" : "Create city"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── delete dialog ───────────────── */
const DeleteDialog = ({ open, city, onCancel, onConfirm, isLoading }) => {
  if (!open || !city) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{city.name}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This city will be removed from the dropdown. Existing inquiries that referenced it stay intact.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: BRAND_RED }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</>) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── main ───────────────── */
const CitiesComponent = () => {
  const user = useSelector(selectCurrentUser);
  const canManage = hasPermission(user, "manage cities");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [formModal, setFormModal] = useState({ open: false, mode: null, city: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, city: null });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, provinceFilter]);

  /* provinces for filter + modal */
  const { data: provincesData } = useGetQuery({ path: "/core/provinces/active" });
  const provinces = provincesData?.data || [];

  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (debouncedSearch) p.search = debouncedSearch;
    if (provinceFilter)  p.province_id = provinceFilter;
    return p;
  }, [page, perPage, debouncedSearch, provinceFilter]);

  const { data, error, isLoading, isFetching } = useGetQuery(
    { path: "/core/cities", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  const [createC, { isLoading: creating }] = usePostMutation();
  const [updateC, { isLoading: updating }] = usePatchMutation();
  const [deleteC, { isLoading: deleting }] = useDeleteMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || { total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0 };

  const openAdd = () => setFormModal({ open: true, mode: "add", city: null });
  const openEdit = (c) => setFormModal({ open: true, mode: "edit", city: c });
  const closeForm = () => setFormModal({ open: false, mode: null, city: null });
  const openDelete = (c) => setDeleteDialog({ open: true, city: c });
  const closeDelete = () => setDeleteDialog({ open: false, city: null });

  const handleSubmit = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateC({ path: `/core/cities/${formModal.city.uuid}`, body: payload }).unwrap();
        showToast("City updated", "success");
      } else {
        await createC({ path: "/core/cities", body: payload }).unwrap();
        showToast("City created", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const errors = err?.data?.errors || {};
      const firstFieldError = Object.values(errors)[0]?.[0];
      return { error: firstFieldError || err?.data?.message || "Could not save city." };
    }
  };

  const handleDelete = async () => {
    try {
      await deleteC({ path: `/core/cities/${deleteDialog.city.uuid}` }).unwrap();
      showToast("City deleted", "success");
      closeDelete();
    } catch (err) {
      showToast(err?.data?.message || "Failed to delete city.", "error");
    }
  };

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    [provinces]
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Building2 size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Cities</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Used by visitor + inquiry dropdowns.</p>
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)" }}
          >
            <Plus size={15} strokeWidth={2.25} /> Add City
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by city name…"
            className="w-full py-2 pl-9 pr-9 text-sm transition rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
          />
        </div>
        <SearchableSelect
          options={provinceOptions}
          value={provinceFilter}
          onChange={(v) => setProvinceFilter(v || "")}
          placeholder="All provinces"
          compact
        />
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>{pagination.total} total</div>
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr>
              <th className="px-5 py-3 text-left" style={{ width: 56 }}><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>#</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Name</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Province</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Status</span></th>
              <th className="px-5 py-3 text-right" style={{ width: 100 }}><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [0,1,2,3].map((i) => (
              <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                {[40, 150, 130, 70, 80].map((w, j) => (
                  <td key={j} className="px-5 py-4"><div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} /></td>
                ))}
              </tr>
            ))}
            {!isLoading && error && (
              <tr><td colSpan={5} className="px-5 py-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                  <AlertTriangle size={14} /><span className="text-sm font-semibold">Couldn't load cities.</span>
                </div>
              </td></tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
                No cities yet.
              </td></tr>
            )}
            {!isLoading && !error && rows.map((c, i) => (
              <tr key={c.uuid} style={{ borderTop: `1px solid ${BORDER}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-5 py-3 text-sm" style={{ color: TEXT_MUTED }}>{(pagination.from || 1) + i}</td>
                <td className="px-5 py-3 text-sm" style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{c.name}</td>
                <td className="px-5 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>{c.province_name || "—"}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold rounded-full"
                    style={{ color: c.is_active ? "#15803D" : TEXT_SECONDARY, background: c.is_active ? "#F0FDF4" : "#F1F5F9", border: `1px solid ${c.is_active ? "#BBF7D0" : BORDER}` }}>
                    <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: c.is_active ? "#15803D" : "#94A3B8" }} />
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {canManage && (
                      <button type="button" onClick={() => openEdit(c)} title="Edit"
                        className="flex items-center justify-center transition rounded-md"
                        style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                      ><Pencil size={14} strokeWidth={2} /></button>
                    )}
                    {canManage && (
                      <button type="button" onClick={() => openDelete(c)} title="Delete"
                        className="flex items-center justify-center transition rounded-md"
                        style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.color = BRAND_RED; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                      ><Trash2 size={14} strokeWidth={2} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimplePagination
        page={page}
        total={pagination.total || 0}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <CityFormModal
        open={formModal.open}
        mode={formModal.mode}
        initial={formModal.city}
        provinces={provinces}
        onCancel={closeForm}
        onSubmit={handleSubmit}
        isLoading={creating || updating}
      />
      <DeleteDialog
        open={deleteDialog.open}
        city={deleteDialog.city}
        onCancel={closeDelete}
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </div>
  );
};

export default CitiesComponent;
