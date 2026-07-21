import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus, Search, Pencil, Trash2, MessageSquareText,
  AlertTriangle, Loader2, X, Snowflake, ImageIcon, ImageOff,
  ChevronDown, User, Calendar,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import PhoneActions from "../ui/PhoneActions";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";

/* ───────────────── brand tokens (match visitors/inquiries) ───────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";
const WA_GREEN = "#25D366";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ───────────────── status chips — same lifecycle as inquiries ───────────────── */
const STATUS_CFG = {
  pending:  { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", label: "Pending" },
  process:  { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Process" },
  enrolled: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Enrolled" },
  dropout:  { fg: TEXT_SECONDARY, bg: "#F1F5F9", border: BORDER, label: "Dropout" },
  cold:     { fg: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", label: "Cold" },
};
const STATUS_ORDER = ["pending", "process", "enrolled", "dropout", "cold"];

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
};

/* ───────────────── quick status dropdown (row action) ───────────────── */
const StatusDropdown = ({ row, onPick, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button" disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 transition disabled:opacity-60"
        title="Change status"
      >
        <StatusPill status={row.status || "pending"} />
        <ChevronDown size={12} style={{ color: TEXT_MUTED }} />
      </button>
      {open && (
        <span
          className="absolute left-0 z-40 mt-1 overflow-hidden bg-white rounded-lg shadow-xl top-full"
          style={{ border: `1px solid ${BORDER}`, minWidth: 140 }}
        >
          {STATUS_ORDER.map((s) => (
            <button
              key={s} type="button"
              onClick={() => { setOpen(false); if (s !== row.status) onPick(s); }}
              className="flex items-center w-full gap-2 px-3 py-2 text-[12px] font-semibold text-left hover:bg-gray-50"
              style={{ color: s === row.status ? STATUS_CFG[s].fg : TEXT_PRIMARY, background: s === row.status ? STATUS_CFG[s].bg : "transparent" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_CFG[s].fg }} />
              {STATUS_CFG[s].label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
};

/* ───────────────── mark-cold reason dialog (mirrors visitors' MarkColdDialog) ───────────────── */
const ColdReasonDialog = ({ open, row, onCancel, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => { if (open) { setReason(""); setServerError(""); } }, [open]);
  if (!open || !row) return null;

  const trimmed = reason.trim();

  const handle = async () => {
    setServerError("");
    const res = await onConfirm(trimmed);
    if (res?.error) setServerError(res.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: "#F0F9FF", color: "#0369A1" }}>
          <Snowflake size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Mark &ldquo;{row.name || row.phone_number}&rdquo; as cold
        </h3>
        <p className="mt-1.5 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          Staff will stop following up. You can note why (optional).
        </p>

        {serverError && (
          <div className="p-2.5 mt-3 text-[12px] rounded-lg" style={{ background: "#FEF2F2", color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
            {serverError}
          </div>
        )}

        <div className="mt-4">
          <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
            Cold reason <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (serverError) setServerError(""); }}
            placeholder="Stopped replying on WhatsApp. Number unreachable."
            disabled={isLoading}
            maxLength={500}
            style={{
              background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY,
              fontFamily: "'Montserrat', sans-serif", width: "100%", padding: 12,
              borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical",
            }}
          />
          <p className="mt-1.5 text-[11px] text-right" style={{ color: TEXT_MUTED }}>{trimmed.length}/500</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={handle} disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: "#0369A1" }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : (<><Snowflake size={14} className="mr-1.5" />Mark cold</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── delete confirm dialog ───────────────── */
const DeleteDialog = ({ open, row, onCancel, onConfirm, isLoading }) => {
  if (!open || !row) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete inquiry from &ldquo;{row.name || row.phone_number}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This removes the WhatsApp inquiry permanently. Cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={onConfirm} disabled={isLoading}
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

/* ───────────────── screenshot lightbox ───────────────── */
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <button
        type="button" onClick={onClose} aria-label="Close"
        className="absolute flex items-center justify-center text-white rounded-full top-4 right-4"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}
      >
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt || "Chat screenshot"}
        className="rounded-xl shadow-2xl"
        style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

/* ───────────────── screenshot thumbnail cell ───────────────── */
const ScreenshotThumb = ({ row, onOpen }) => {
  if (!row.image_url) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg"
        style={{ width: 44, height: 44, background: SURFACE_HOVER, border: `1px dashed ${BORDER}`, color: TEXT_MUTED }}
        title="No screenshot attached"
      >
        <ImageOff size={16} strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen(row.image_url); }}
      className="overflow-hidden transition rounded-lg hover:shadow"
      style={{ width: 44, height: 44, border: `1px solid ${BORDER}` }}
      title="View chat screenshot"
    >
      <img
        src={row.image_url}
        alt="Chat screenshot"
        className="object-cover w-full h-full"
        loading="lazy"
      />
    </button>
  );
};

/* ───────────────── expandable description cell ───────────────── */
const DescriptionCell = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span style={{ color: TEXT_MUTED }}>—</span>;
  const isLong = text.length > 80;
  return (
    <div style={{ maxWidth: 260 }} onClick={(e) => e.stopPropagation()}>
      <span className="text-sm" style={{ color: TEXT_SECONDARY, whiteSpace: expanded ? "pre-wrap" : undefined }}>
        {expanded || !isLong ? text : `${text.slice(0, 80)}…`}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 text-[11px] font-semibold hover:underline"
          style={{ color: BRAND_RED }}
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
};

/* ───────────────── add / edit modal ───────────────── */
const WhatsAppInquiryModal = ({ isOpen, mode, initial, onClose, onSubmit, isLoading }) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);       // newly selected file
  const [imagePreview, setImagePreview] = useState(null); // objectURL for the new file
  const [existingImage, setExistingImage] = useState(null); // image_url already on record (edit)
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setPhone(initial?.phone_number || "");
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(initial?.image_url || null);
    setTouched(false);
    setServerError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [isOpen, initial]);

  // release object URLs
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  if (!isOpen) return null;

  const phoneErr = !phone.trim() ? "Phone number is required" : "";
  const canSubmit = !phoneErr && !isLoading;

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setServerError("Please choose an image file.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setServerError("");
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handle = async () => {
    setTouched(true);
    if (phoneErr) return;
    setServerError("");
    const res = await onSubmit({
      phone_number: phone.trim(),
      name: name.trim(),
      description: description.trim(),
      imageFile,
    });
    if (res?.error) setServerError(res.error);
  };

  const previewSrc = imagePreview || existingImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div className="w-full max-w-lg p-6 my-auto bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: "#E7F8EE", color: WA_GREEN }}
            >
              <MessageSquareText size={17} strokeWidth={2} />
            </div>
            <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>
              {mode === "edit" ? "Edit WhatsApp Inquiry" : "Add WhatsApp Inquiry"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-gray-100" style={{ color: TEXT_MUTED }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {serverError && (
          <div className="p-2.5 mb-3 text-[12px] rounded-lg" style={{ background: "#FEF2F2", color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          {/* Phone */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Phone number <span style={{ color: BRAND_RED }}>*</span>
            </label>
            <input
              type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="03XX-XXXXXXX"
              disabled={isLoading}
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
              style={{
                background: SURFACE_HOVER, color: TEXT_PRIMARY,
                border: `1px solid ${touched && phoneErr ? "#FCA5A5" : BORDER}`,
                fontFamily: "'Montserrat', sans-serif",
              }}
            />
            {touched && phoneErr && (
              <p className="mt-1 text-[11px] font-medium" style={{ color: BRAND_RED }}>{phoneErr}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Name <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Person's name if known"
              disabled={isLoading}
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
              style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY, border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Description <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did they ask about? Course, fee, timings…"
              disabled={isLoading}
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
              style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY, border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif", resize: "vertical" }}
            />
          </div>

          {/* Screenshot */}
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Chat screenshot <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>(optional)</span>
            </label>
            {previewSrc ? (
              <div className="flex items-start gap-3">
                <img
                  src={previewSrc} alt="Screenshot preview"
                  className="object-cover rounded-lg"
                  style={{ width: 88, height: 88, border: `1px solid ${BORDER}` }}
                />
                <div className="flex flex-col gap-2">
                  {imageFile && (
                    <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>
                      {imageFile.name} · {(imageFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                  {!imageFile && existingImage && (
                    <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      Current screenshot — choose a new file to replace it.
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button" onClick={() => fileRef.current?.click()} disabled={isLoading}
                      className="px-3 py-1.5 text-[12px] font-semibold rounded-lg"
                      style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY, border: `1px solid ${BORDER}` }}
                    >{imageFile ? "Change" : "Replace"}</button>
                    {imageFile && (
                      <button
                        type="button" onClick={removeImage} disabled={isLoading}
                        className="px-3 py-1.5 text-[12px] font-semibold rounded-lg"
                        style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA" }}
                      >Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button" onClick={() => fileRef.current?.click()} disabled={isLoading}
                className="flex items-center justify-center w-full gap-2 py-4 text-sm font-medium transition rounded-lg"
                style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY, border: `1px dashed #CBD5E1` }}
              >
                <ImageIcon size={16} strokeWidth={1.75} />
                Attach chat screenshot
              </button>
            )}
            <input
              ref={fileRef} type="file" accept="image/*"
              onChange={pickImage} className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button" onClick={onClose} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={handle} disabled={!canSubmit}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
          >
            {isLoading
              ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>)
              : mode === "edit" ? "Save changes" : "Add inquiry"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────── main ───────────────────── */
const WhatsAppInquiriesComponent = () => {
  const user = useSelector(selectCurrentUser);

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");

  const [formModal, setFormModal] = useState({ open: false, mode: null, row: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [coldDialog, setColdDialog] = useState({ open: false, row: null });
  const [lightbox, setLightbox] = useState(null); // image url or null

  /* search debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* permissions */
  const canCreate = hasPermission(user, "create whatsapp-inquiries");
  const canUpdate = hasPermission(user, "update whatsapp-inquiries");
  const canDelete = hasPermission(user, "delete whatsapp-inquiries");

  /* list query */
  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (debouncedSearch) p.q = debouncedSearch;
    if (status) p.status = status;
    return p;
  }, [page, perPage, debouncedSearch, status]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const { data, error, isLoading } = useGetQuery(
    { path: "/student/whatsapp-inquiries", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  const [createInquiry, { isLoading: creating }] = usePostMutation();
  const [postEdit, { isLoading: postEditing }] = usePostMutation();
  const [patchInquiry, { isLoading: patching }] = usePatchMutation();
  const [deleteInquiry, { isLoading: deleting }] = useDeleteMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0,
  };

  /* handlers */
  const openAdd = () => setFormModal({ open: true, mode: "add", row: null });
  const openEdit = (r) => setFormModal({ open: true, mode: "edit", row: r });
  const closeForm = () => setFormModal({ open: false, mode: null, row: null });

  const firstErrorMessage = (err, fallback) => {
    const errors = err?.data?.errors || {};
    const firstFieldError = Object.values(errors)[0]?.[0];
    return firstFieldError || err?.data?.message || fallback;
  };

  const handleSubmitForm = async ({ phone_number, name, description, imageFile }) => {
    try {
      if (formModal.mode === "edit") {
        if (imageFile) {
          // Replacing the screenshot needs multipart. PHP doesn't parse
          // multipart bodies on PATCH, so use the Laravel-standard
          // POST + _method=PATCH spoof against the same endpoint.
          const fd = new FormData();
          fd.append("_method", "PATCH");
          fd.append("phone_number", phone_number);
          fd.append("name", name || "");
          fd.append("description", description || "");
          fd.append("image", imageFile);
          await postEdit({
            path: `/student/whatsapp-inquiries/${formModal.row.id}`,
            body: fd,
          }).unwrap();
        } else {
          await patchInquiry({
            path: `/student/whatsapp-inquiries/${formModal.row.id}`,
            body: { phone_number, name: name || null, description: description || null },
          }).unwrap();
        }
        showToast("WhatsApp inquiry updated", "success");
      } else {
        if (imageFile) {
          const fd = new FormData();
          fd.append("phone_number", phone_number);
          if (name) fd.append("name", name);
          if (description) fd.append("description", description);
          fd.append("image", imageFile);
          await createInquiry({ path: "/student/whatsapp-inquiries", body: fd }).unwrap();
        } else {
          const body = { phone_number };
          if (name) body.name = name;
          if (description) body.description = description;
          await createInquiry({ path: "/student/whatsapp-inquiries", body }).unwrap();
        }
        showToast("WhatsApp inquiry logged", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      return { error: firstErrorMessage(err, "Could not save inquiry.") };
    }
  };

  const handleStatusPick = (row, newStatus) => {
    if (newStatus === "cold") {
      setColdDialog({ open: true, row });
      return;
    }
    changeStatus(row, { status: newStatus });
  };

  const changeStatus = async (row, body) => {
    try {
      await patchInquiry({
        path: `/student/whatsapp-inquiries/${row.id}`,
        body,
      }).unwrap();
      showToast(`Status changed to ${STATUS_CFG[body.status]?.label || body.status}`, "success");
      return { error: null };
    } catch (err) {
      const msg = firstErrorMessage(err, "Could not change status.");
      showToast(msg, "error");
      return { error: msg };
    }
  };

  const handleConfirmCold = async (reason) => {
    const body = { status: "cold" };
    if (reason) body.cold_reason = reason;
    const res = await changeStatus(coldDialog.row, body);
    if (!res.error) setColdDialog({ open: false, row: null });
    return res;
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteInquiry({ path: `/student/whatsapp-inquiries/${deleteDialog.row.id}` }).unwrap();
      showToast("WhatsApp inquiry deleted", "success");
      setDeleteDialog({ open: false, row: null });
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      showToast(err?.data?.message || "Failed to delete.", "error");
    }
  };

  const hasActiveFilters = !!(status || debouncedSearch);
  const clearFilters = () => { setStatus(""); setSearch(""); };
  const isEmpty = !isLoading && !error && rows.length === 0;

  /* ── render ── */
  return (
    <div
      className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 12, background: "#E7F8EE", color: WA_GREEN }}
          >
            <MessageSquareText size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              WhatsApp Inquiries
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Inquiries that came in via WhatsApp or phone — log and follow up
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button" onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)",
            }}
          >
            <Plus size={15} strokeWidth={2.25} />
            Add WhatsApp Inquiry
          </button>
        )}
      </div>

      {/* Filters toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, name or description…"
            className="w-full py-2 pl-9 pr-9 text-sm transition rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
            onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
            onBlur={(e) => { e.currentTarget.style.background = SURFACE_HOVER; e.currentTarget.style.borderColor = BORDER; }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[{ v: "", l: "All" }, ...STATUS_ORDER.map((s) => ({ v: s, l: STATUS_CFG[s].label }))].map((o) => (
            <button key={o.v} type="button" onClick={() => setStatus(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: status === o.v ? "#fff" : TEXT_SECONDARY, background: status === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-[12px] font-semibold transition" style={{ color: BRAND_RED }}>
            Clear filters
          </button>
        )}
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>
          {pagination.total} total
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 980 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                {["#", "Phone", "Name", "Description", "Screenshot", "Status", "Handled by", "Logged", "Actions"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 ${i === 8 ? "text-right" : "text-left"}`} style={i === 0 ? { width: 48 } : i === 8 ? { width: 120 } : undefined}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[40, 110, 120, 200, 44, 80, 100, 80, 90].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && error && (
                <tr><td colSpan={9} className="px-5 py-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlertTriangle size={14} />
                    <span className="text-sm font-semibold">Couldn't load WhatsApp inquiries. Please try again.</span>
                  </div>
                </td></tr>
              )}

              {isEmpty && (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 rounded-2xl" style={{ background: "#E7F8EE", color: WA_GREEN }}>
                    <MessageSquareText size={22} />
                  </div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                    {hasActiveFilters ? "No inquiries match these filters" : "No WhatsApp inquiries logged yet"}
                  </div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                    {hasActiveFilters ? "Try clearing filters or search." : "Inquiries arriving via WhatsApp or phone get logged here."}
                  </div>
                  {!hasActiveFilters && canCreate && (
                    <button type="button" onClick={openAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                    >
                      <Plus size={14} />
                      Log first inquiry
                    </button>
                  )}
                </td></tr>
              )}

              {!isLoading && !error && rows.map((r, i) => {
                const indexOnPage = (pagination.from || 1) + i;
                return (
                  <tr key={r.id}
                    onClick={() => canUpdate && openEdit(r)}
                    style={{ borderTop: `1px solid ${BORDER}`, cursor: canUpdate ? "pointer" : "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{indexOnPage}</td>
                    <td className="px-4 py-3 text-sm">
                      <PhoneActions number={r.phone_number} name={r.name || ""} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: r.name ? TEXT_PRIMARY : TEXT_MUTED }}>
                        {r.name || "Unknown"}
                      </div>
                      {r.cold_reason && r.status === "cold" && (
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: TEXT_MUTED, maxWidth: 180 }} title={r.cold_reason}>
                          Cold: {r.cold_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><DescriptionCell text={r.description} /></td>
                    <td className="px-4 py-3">
                      <ScreenshotThumb row={r} onOpen={setLightbox} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {canUpdate
                        ? <StatusDropdown row={r} disabled={patching} onPick={(s) => handleStatusPick(r, s)} />
                        : <StatusPill status={r.status || "pending"} />}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>
                      {r.handled_by_name
                        ? (<span className="inline-flex items-center gap-1"><User size={11} style={{ color: TEXT_MUTED }} />{r.handled_by_name}</span>)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: TEXT_PRIMARY }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                      </div>
                      {r.created_by_name && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: TEXT_MUTED }}>
                          <Calendar size={10} strokeWidth={2} />
                          by {r.created_by_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canUpdate && r.status !== "cold" && (
                          <button type="button" onClick={() => setColdDialog({ open: true, row: r })} title="Mark as cold"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0F9FF"; e.currentTarget.style.color = "#0369A1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Snowflake size={13} strokeWidth={2} /></button>
                        )}
                        {canUpdate && (
                          <button type="button" onClick={() => openEdit(r)} title="Edit"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Pencil size={13} strokeWidth={2} /></button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => setDeleteDialog({ open: true, row: r })} title="Delete"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.color = BRAND_RED; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Trash2 size={13} strokeWidth={2} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SimplePagination
        page={page}
        total={pagination.total || 0}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      {/* Modals + dialogs */}
      <WhatsAppInquiryModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initial={formModal.row}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isLoading={creating || patching || postEditing}
      />
      <DeleteDialog
        open={deleteDialog.open}
        row={deleteDialog.row}
        onCancel={() => setDeleteDialog({ open: false, row: null })}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
      <ColdReasonDialog
        open={coldDialog.open}
        row={coldDialog.row}
        onCancel={() => setColdDialog({ open: false, row: null })}
        onConfirm={handleConfirmCold}
        isLoading={patching}
      />
      {lightbox && (
        <ImageLightbox src={lightbox} alt="Chat screenshot" onClose={() => setLightbox(null)} />
      )}
    </div>
  );
};

export default WhatsAppInquiriesComponent;
