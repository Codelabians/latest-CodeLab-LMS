import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus, Search, Pencil, Trash2, Tag, X,
  AlertTriangle, Loader2, Users, Hash,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/* The three business sections are a fixed backend enum, not a CRUD concern. */
const SECTIONS = [
  { value: "tech_school", label: "Tech School", color: "#1D4ED8", bg: "#EFF6FF" },
  { value: "it_solutions", label: "IT Solutions", color: "#7C3AED", bg: "#F5F3FF" },
  { value: "other", label: "Other", color: "#475569", bg: "#F1F5F9" },
];
const sectionMeta = (v) => SECTIONS.find((s) => s.value === v) || SECTIONS[2];

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ───────────────── add/edit modal ───────────────── */
const PurposeFormModal = ({ open, mode, initial, onCancel, onSubmit, isLoading }) => {
  const [name, setName] = useState("");
  const [section, setSection] = useState("tech_school");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTouched(false); setServerError("");
    setName(initial?.name || "");
    setSection(initial?.section || "tech_school");
    setDescription(initial?.description || "");
    setSortOrder(initial?.sort_order != null ? String(initial.sort_order) : "0");
    setIsActive(initial ? !!initial.is_active : true);
  }, [open, initial]);

  if (!open) return null;

  const nameErr = !name.trim()
    ? "Name is required"
    : name.trim().length < 2
      ? "Min 2 chars"
      : name.length > 120
        ? "Max 120 chars"
        : "";
  const sortErr = sortOrder !== "" && (isNaN(Number(sortOrder)) || Number(sortOrder) < 0 || Number(sortOrder) > 10000)
    ? "0–10000"
    : "";
  const descErr = description.length > 2000 ? "Max 2000 chars" : "";

  const handleSave = async () => {
    setTouched(true);
    if (nameErr || sortErr || descErr) return;
    setServerError("");
    const res = await onSubmit({
      name: name.trim(),
      section,
      description: description.trim() || null,
      sort_order: sortOrder === "" ? 0 : Number(sortOrder),
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
              <Tag size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {mode === "edit" ? "Edit Visit Purpose" : "Add Visit Purpose"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                The reason a walk-in visited — drives the visitor form dropdown.
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close"
            className="flex items-center justify-center transition rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED, background: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_MUTED; }}
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
                type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)}
                placeholder="Course enquiry"
                style={{ background: SURFACE_HOVER, border: `1px solid ${nameErr && touched ? "#FCA5A5" : BORDER}`, color: TEXT_PRIMARY, width: "100%", height: 40, padding: "0 12px", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Montserrat', sans-serif" }}
              />
              {touched && nameErr && (
                <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>{nameErr}</p>
              )}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Section *</label>
              <select
                value={section} onChange={(e) => setSection(e.target.value)}
                style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: "100%", height: 40, padding: "0 10px", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Montserrat', sans-serif", cursor: "pointer" }}
              >
                {SECTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
              <p className="mt-1.5 text-[11px]" style={{ color: TEXT_MUTED }}>
                Names must be unique within a section.
              </p>
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Description (optional)</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="Short note about when to use this purpose…"
                style={{ background: SURFACE_HOVER, border: `1px solid ${descErr ? "#FCA5A5" : BORDER}`, color: TEXT_PRIMARY, width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Montserrat', sans-serif", resize: "vertical" }}
              />
              {descErr && <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>{descErr}</p>}
            </div>

            <div>
              <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Sort order</label>
              <input
                type="number" min={0} max={10000} value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                style={{ background: SURFACE_HOVER, border: `1px solid ${sortErr ? "#FCA5A5" : BORDER}`, color: TEXT_PRIMARY, width: "100%", height: 40, padding: "0 12px", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'Montserrat', sans-serif" }}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: TEXT_MUTED }}>
                Lower numbers float to the top of the dropdown.
              </p>
              {sortErr && <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>{sortErr}</p>}
            </div>

            <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
              style={{ background: isActive ? "#F0FDF4" : SURFACE_HOVER, border: `1px solid ${isActive ? "#BBF7D0" : BORDER}` }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: "#15803D" }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: isActive ? "#15803D" : TEXT_PRIMARY }}>Active</div>
                <div className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 1 }}>Inactive purposes are hidden from the visitor form.</div>
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
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : mode === "edit" ? "Save changes" : "Create purpose"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── delete dialog ───────────────── */
const DeleteDialog = ({ open, purpose, onCancel, onConfirm, isLoading }) => {
  if (!open || !purpose) return null;
  const inUse = (purpose.visitors_count ?? 0) > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{purpose.name}&rdquo;?
        </h3>
        {inUse ? (
          <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
            This purpose is used by{" "}
            <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
              {purpose.visitors_count} {purpose.visitors_count === 1 ? "visitor" : "visitors"}
            </span>
            . Deactivate it instead of deleting to preserve their records.
          </p>
        ) : (
          <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
            No visitors use this purpose. This action cannot be undone.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isLoading || inUse}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
const VisitPurposesComponent = () => {
  const user = useSelector(selectCurrentUser);
  const canCreate = hasPermission(user, "create visit-purposes");
  const canEdit = hasPermission(user, "update visit-purposes");
  const canDelete = hasPermission(user, "delete visit-purposes");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formModal, setFormModal] = useState({ open: false, mode: null, purpose: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, purpose: null });

  useEffect(() => { setPage(1); }, [sectionFilter, statusFilter, perPage]);

  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (sectionFilter) p.section = sectionFilter;
    if (statusFilter) p.is_active = statusFilter === "active" ? 1 : 0;
    return p;
  }, [page, perPage, sectionFilter, statusFilter]);

  const { data, error, isLoading } = useGetQuery(
    { path: "/student/visit-purposes", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  const [createP, { isLoading: creating }] = usePostMutation();
  const [updateP, { isLoading: updating }] = usePatchMutation();
  const [deleteP, { isLoading: deleting }] = useDeleteMutation();

  const allRows = data?.data || [];
  // The backend index has no text search — filter the current page by name client-side.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => (r.name || "").toLowerCase().includes(q));
  }, [allRows, search]);
  const pagination = data?.meta?.pagination || { total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0 };

  const openAdd = () => setFormModal({ open: true, mode: "add", purpose: null });
  const openEdit = (p) => setFormModal({ open: true, mode: "edit", purpose: p });
  const closeForm = () => setFormModal({ open: false, mode: null, purpose: null });
  const openDelete = (p) => setDeleteDialog({ open: true, purpose: p });
  const closeDelete = () => setDeleteDialog({ open: false, purpose: null });

  const handleSubmit = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateP({ path: `/student/visit-purposes/${formModal.purpose.uuid}`, body: payload }).unwrap();
        showToast("Visit purpose updated", "success");
      } else {
        await createP({ path: "/student/visit-purposes", body: payload }).unwrap();
        showToast("Visit purpose created", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const errors = err?.data?.errors || {};
      const firstFieldError = Object.values(errors)[0]?.[0];
      return { error: firstFieldError || err?.data?.message || "Could not save visit purpose." };
    }
  };

  const handleDelete = async () => {
    try {
      await deleteP({ path: `/student/visit-purposes/${deleteDialog.purpose.uuid}` }).unwrap();
      showToast("Visit purpose deleted", "success");
      closeDelete();
    } catch (err) {
      showToast(err?.data?.message || "Failed to delete visit purpose.", "error");
    }
  };

  return (
    <div
      className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Tag size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Visit Purposes</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Why people walk in — the catalog that powers the visitor form.</p>
          </div>
        </div>
        {canCreate && (
          <button type="button" onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)" }}
          >
            <Plus size={15} strokeWidth={2.25} /> Add Purpose
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this page by name…"
            className="w-full py-2 pl-9 pr-3 text-sm transition rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
          />
        </div>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm rounded-lg outline-none cursor-pointer"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        >
          <option value="">All sections</option>
          {SECTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm rounded-lg outline-none cursor-pointer"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>{pagination.total} total</div>
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr>
              <th className="px-5 py-3 text-left" style={{ width: 56 }}><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>#</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Name</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Section</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Sort</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Visitors</span></th>
              <th className="px-5 py-3 text-left"><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Status</span></th>
              <th className="px-5 py-3 text-right" style={{ width: 100 }}><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [0,1,2,3].map((i) => (
              <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                {[40, 160, 90, 40, 60, 70, 80].map((w, j) => (
                  <td key={j} className="px-5 py-4"><div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} /></td>
                ))}
              </tr>
            ))}
            {!isLoading && error && (
              <tr><td colSpan={7} className="px-5 py-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                  <AlertTriangle size={14} /><span className="text-sm font-semibold">Couldn't load visit purposes.</span>
                </div>
              </td></tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
                No visit purposes match.
              </td></tr>
            )}
            {!isLoading && !error && rows.map((p, i) => {
              const sm = sectionMeta(p.section);
              return (
                <tr key={p.uuid} style={{ borderTop: `1px solid ${BORDER}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-5 py-3 text-sm" style={{ color: TEXT_MUTED }}>{(pagination.from || 1) + i}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
                    {p.name}
                    {p.description && (
                      <div className="text-[11.5px] font-normal mt-0.5 truncate" style={{ color: TEXT_MUTED, maxWidth: 320 }}>{p.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 text-[11.5px] font-semibold rounded-md" style={{ color: sm.color, background: sm.bg }}>
                      {p.section_label || sm.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                      <Hash size={11} strokeWidth={2.2} style={{ color: TEXT_MUTED }} />{p.sort_order ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-semibold rounded-md" style={{ color: "#1D4ED8", background: "#EFF6FF" }}>
                      <Users size={11} strokeWidth={2.2} />{p.visitors_count ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold rounded-full"
                      style={{ color: p.is_active ? "#15803D" : TEXT_SECONDARY, background: p.is_active ? "#F0FDF4" : "#F1F5F9", border: `1px solid ${p.is_active ? "#BBF7D0" : BORDER}` }}>
                      <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: p.is_active ? "#15803D" : "#94A3B8" }} />
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {canEdit && (
                        <button type="button" onClick={() => openEdit(p)} title="Edit"
                          className="flex items-center justify-center transition rounded-md"
                          style={{ width: 30, height: 30, color: "#1D4ED8", background: "#EFF6FF" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#DBEAFE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                        ><Pencil size={14} strokeWidth={2} /></button>
                      )}
                      {canDelete && (
                        <button type="button" onClick={() => openDelete(p)} title="Delete"
                          className="flex items-center justify-center transition rounded-md"
                          style={{ width: 30, height: 30, color: BRAND_RED, background: BRAND_RED_TINT }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; }}
                        ><Trash2 size={14} strokeWidth={2} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      <PurposeFormModal
        open={formModal.open}
        mode={formModal.mode}
        initial={formModal.purpose}
        onCancel={closeForm}
        onSubmit={handleSubmit}
        isLoading={creating || updating}
      />
      <DeleteDialog
        open={deleteDialog.open}
        purpose={deleteDialog.purpose}
        onCancel={closeDelete}
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </div>
  );
};

export default VisitPurposesComponent;
