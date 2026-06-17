import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus, Search, Pencil, Trash2, Megaphone, AlertTriangle,
  Loader2, X, ImagePlus, Check,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";

/* ───────────────── brand tokens ───────────────── */
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

/* ───────────────── pills ───────────────── */
const AUD_CFG = {
  website:  { fg: "#1D4ED8", bg: "#EFF6FF", label: "Website" },
  student:  { fg: "#15803D", bg: "#F0FDF4", label: "Students" },
  teacher:  { fg: "#7C3AED", bg: "#F5F3FF", label: "Teachers" },
  employee: { fg: "#B45309", bg: "#FFFBEB", label: "Employees" },
};
const AudienceCells = ({ audiences, type }) => {
  const list = audiences?.length
    ? audiences
    : type === "website" ? ["website"] : type === "both" ? ["website", "student", "teacher", "employee"] : ["student", "teacher", "employee"];
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((a) => {
        const c = AUD_CFG[a] || { fg: TEXT_MUTED, bg: "#F1F5F9", label: a };
        return (
          <span key={a} className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold rounded-full"
            style={{ color: c.fg, background: c.bg }}>{c.label}</span>
        );
      })}
    </div>
  );
};
const StatusPill = ({ active }) => {
  const cfg = active
    ? { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Active" }
    : { fg: TEXT_MUTED, bg: "#F1F5F9", border: BORDER, label: "Inactive" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
};

/* ───────────────── delete dialog ───────────────── */
const DeleteDialog = ({ open, item, onCancel, onConfirm, isLoading }) => {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{item.title}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This permanently removes the announcement. This cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: BRAND_RED }}>
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</>) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── add / edit modal ───────────────── */
const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
const AnnouncementModal = ({ open, mode, initial, onClose, onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [audiences, setAudiences] = useState(["student", "teacher"]);
  const [active, setActive] = useState(true);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Derive audiences from a legacy `type` for old records that have no
  // audiences array yet.
  const audiencesFromType = (t) =>
    t === "website" ? ["website"] : t === "both" ? ["website", "student", "teacher", "employee"] : ["student", "teacher", "employee"];

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setLink(initial?.link || "");
      setAudiences(
        initial?.audiences?.length ? initial.audiences : audiencesFromType(initial?.type || "portal"),
      );
      setActive(initial ? !!initial.active_status : true);
      setImage(null);
      setPreview(initial?.image?.file_url || "");
    }
  }, [open, initial]);

  const AUDIENCE_OPTS = [
    { key: "website", label: "Website" },
    { key: "student", label: "Students" },
    { key: "teacher", label: "Teachers" },
    { key: "employee", label: "Employees" },
  ];
  const toggleAudience = (k) =>
    setAudiences((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  if (!open) return null;
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Megaphone size={16} />
            </div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isEdit ? "Edit announcement" : "New announcement"}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Write the announcement…"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-y" style={inputStyle} />
          </div>

          {true && (
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Banner image (optional)</label>
              <label className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer" style={{ ...inputStyle }}>
                <ImagePlus size={16} style={{ color: BRAND_RED }} />
                <span className="text-sm" style={{ color: TEXT_SECONDARY }}>{image ? image.name : "Choose an image"}</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; setImage(f || null); setPreview(f ? URL.createObjectURL(f) : ""); }} />
              </label>
              {preview && <img src={preview} alt="" className="object-cover w-full h-32 mt-2 rounded-lg" />}
            </div>
          )}

          <div>
            <label className="block mb-1.5 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Show to (audience)</label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTS.map((o) => {
                const on = audiences.includes(o.key);
                return (
                  <button key={o.key} type="button" onClick={() => toggleAudience(o.key)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition"
                    style={{ ...inputStyle, borderColor: on ? BRAND_RED : BORDER, background: on ? BRAND_RED_TINT : SURFACE_HOVER, color: on ? BRAND_RED : TEXT_SECONDARY, fontWeight: on ? 600 : 500 }}>
                    <span className="flex items-center justify-center rounded" style={{ width: 16, height: 16, border: `1.5px solid ${on ? BRAND_RED : "#CBD5E1"}`, background: on ? BRAND_RED : "transparent", color: "#fff" }}>
                      {on ? <Check size={11} strokeWidth={3} /> : null}
                    </span>
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>Website = public site · Students/Teachers/Employees = their portals.</p>
          </div>
          {audiences.includes("website") && (
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Link (optional)</label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… clicking the website popup opens this"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>When set, clicking the website announcement (banner + button) redirects here. Leave blank to use the default admission page.</p>
            </div>
          )}
          <div>
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Status</label>
            <button type="button" onClick={() => setActive((a) => !a)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg" style={inputStyle}>
              <span style={{ color: active ? "#15803D" : TEXT_MUTED, fontWeight: 600 }}>{active ? "Active" : "Inactive"}</span>
              <span className="relative inline-block transition rounded-full" style={{ width: 38, height: 20, background: active ? BRAND_RED : "#CBD5E1" }}>
                <span className="absolute top-0.5 transition-all rounded-full bg-white" style={{ width: 16, height: 16, left: active ? 20 : 2 }} />
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" disabled={isLoading || !title.trim() || !description.trim() || audiences.length === 0}
            onClick={() => onSubmit({ title, description, link, audiences, active, image })}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : (isEdit ? "Save changes" : "Publish")}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── main ───────────────── */
export default function Announcements() {
  const user = useSelector(selectCurrentUser);
  const canManage = hasPermission(user, "get announcements");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modal, setModal] = useState({ open: false, mode: "add", item: null });
  const [delDialog, setDelDialog] = useState({ open: false, item: null });

  const { data, error, isLoading, refetch } = useGetQuery(
    { path: "/communication/announcements", params: { per_page: 100 } },
    { refetchOnMountOrArgChange: true }
  );
  const [post, { isLoading: creating }] = usePostMutation();
  const [patch, { isLoading: updating }] = usePatchMutation();
  const [del, { isLoading: deleting }] = useDeleteMutation();

  const all = data?.data || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((a) => {
      const okQ = !q || (a.title || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q);
      const okType = !typeFilter || (a.type || "portal") === typeFilter;
      const okStatus = statusFilter === "" || (statusFilter === "active" ? !!a.active_status : !a.active_status);
      return okQ && okType && okStatus;
    });
  }, [all, search, typeFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const hasActiveFilters = search || typeFilter || statusFilter;

  const submit = async ({ title, description, link, audiences, active, image }) => {
    const cleanLink = (link || "").trim();
    try {
      if (modal.mode === "edit") {
        if (image) {
          const fd = new FormData();
          fd.append("_method", "PATCH");
          fd.append("title", title);
          fd.append("description", description);
          if (cleanLink) fd.append("link", cleanLink);
          (audiences || []).forEach((a) => fd.append("audiences[]", a));
          fd.append("active_status", active ? 1 : 0);
          fd.append("image", image);
          await post({ path: `/communication/announcements/${modal.item.announcement_uuid}`, body: fd }).unwrap();
        } else {
          await patch({
            path: `/communication/announcements/${modal.item.announcement_uuid}`,
            body: { title, description, link: cleanLink, audiences, active_status: active ? 1 : 0 },
          }).unwrap();
        }
        showToast("Announcement updated", "success");
      } else {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", description);
        if (cleanLink) fd.append("link", cleanLink);
        (audiences || []).forEach((a) => fd.append("audiences[]", a));
        fd.append("active_status", active ? 1 : 0);
        if (image) fd.append("image", image);
        await post({ path: "/communication/announcements/create", body: fd }).unwrap();
        showToast("Announcement published", "success");
      }
      setModal({ open: false, mode: "add", item: null });
      refetch();
    } catch (err) {
      showToast(err?.data?.message || "Something went wrong.", "error");
    }
  };

  const toggleActive = async (a) => {
    try {
      await patch({
        path: `/communication/announcements/${a.announcement_uuid}`,
        body: {
          title: a.title,
          description: a.description,
          // Preserve the existing audience targeting on a status toggle.
          audiences: a.audiences?.length ? a.audiences : undefined,
          type: a.type || "portal",
          active_status: a.active_status ? 0 : 1,
        },
      }).unwrap();
      refetch();
    } catch (err) { showToast(err?.data?.message || "Failed to update.", "error"); }
  };

  const confirmDelete = async () => {
    try {
      await del({ path: `/communication/announcements/${delDialog.item.announcement_uuid}` }).unwrap();
      showToast("Announcement deleted", "success");
      setDelDialog({ open: false, item: null });
      refetch();
    } catch (err) { showToast(err?.data?.message || "Failed to delete.", "error"); }
  };

  const th = { fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Megaphone size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Announcements</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Publish updates to the website popup, the student portal, or both</p>
          </div>
        </div>
        <button type="button" onClick={() => setModal({ open: true, mode: "add", item: null })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
          style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)" }}>
          <Plus size={15} strokeWidth={2.25} /> New Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements…"
            className="w-full py-2 pl-9 pr-9 text-sm rounded-lg outline-none" style={inputStyle} />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }}><X size={14} /></button>}
        </div>
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[{ v: "", l: "All" }, { v: "website", l: "Website" }, { v: "portal", l: "Portal" }, { v: "both", l: "Both" }].map((o) => (
            <button key={o.v} type="button" onClick={() => setTypeFilter(o.v)} className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: typeFilter === o.v ? "#fff" : TEXT_SECONDARY, background: typeFilter === o.v ? BRAND_RED : "transparent" }}>{o.l}</button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 pl-3 pr-8 text-sm rounded-lg outline-none cursor-pointer" style={inputStyle}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasActiveFilters && <button type="button" onClick={() => { setSearch(""); setTypeFilter(""); setStatusFilter(""); }} className="text-[12px] font-semibold" style={{ color: BRAND_RED }}>Clear filters</button>}
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>{total} total</div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 880 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ width: 48 }}><span style={th}>#</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Announcement</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Show on</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Status</span></th>
                <th className="px-4 py-3 text-right" style={{ width: 140 }}><span style={th}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2].map((i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[30, 260, 90, 70, 90].map((w, j) => (
                    <td key={j} className="px-4 py-4"><div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} /></td>
                  ))}
                </tr>
              ))}

              {!isLoading && error && (
                <tr><td colSpan={5} className="px-5 py-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlertTriangle size={14} /><span className="text-sm font-semibold">Couldn't load announcements.</span>
                  </div>
                </td></tr>
              )}

              {!isLoading && !error && total === 0 && (
                <tr><td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}><Megaphone size={22} /></div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>{hasActiveFilters ? "No announcements match" : "No announcements yet"}</div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>{hasActiveFilters ? "Try clearing filters." : "Publish your first announcement to the website or portal."}</div>
                </td></tr>
              )}

              {!isLoading && pageRows.map((a, idx) => (
                <tr key={a.announcement_uuid} style={{ borderTop: `1px solid ${BORDER}` }} className="hover:bg-[#FCFCFD]">
                  <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{(page - 1) * perPage + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.image?.file_url
                        ? <img src={a.image.file_url} alt="" className="object-cover rounded-lg" style={{ width: 44, height: 44 }} />
                        : <div className="flex items-center justify-center rounded-lg" style={{ width: 44, height: 44, background: BRAND_RED_TINT, color: BRAND_RED }}><Megaphone size={18} /></div>}
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold truncate" style={{ color: TEXT_PRIMARY, maxWidth: 360 }}>{a.title}</div>
                        <div className="text-[12px] truncate" style={{ color: TEXT_MUTED, maxWidth: 360 }}>{a.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><AudienceCells audiences={a.audiences} type={a.type || "portal"} /></td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(a)} title="Toggle status"><StatusPill active={!!a.active_status} /></button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setModal({ open: true, mode: "edit", item: a })}
                        className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "#F1F5F9", color: TEXT_SECONDARY }} title="Edit"><Pencil size={14} /></button>
                      <button type="button" onClick={() => setDelDialog({ open: true, item: a })}
                        className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: BRAND_RED_TINT, color: BRAND_RED }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} />
          </div>
        )}
      </div>

      <AnnouncementModal open={modal.open} mode={modal.mode} initial={modal.item}
        onClose={() => setModal({ open: false, mode: "add", item: null })} onSubmit={submit} isLoading={creating || updating} />
      <DeleteDialog open={delDialog.open} item={delDialog.item}
        onCancel={() => setDelDialog({ open: false, item: null })} onConfirm={confirmDelete} isLoading={deleting} />
    </div>
  );
}
