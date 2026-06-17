import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Trash2, ShieldCheck, X, CheckCircle2, FileText,
  Eye, Download, AlertTriangle, Info, Upload, Tag,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
} from "../../../../api/apiSlice";
import { showToast } from "../../../ui/common/ShowToast";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const inputCls = "w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2";

const DOC_GROUPS = {
  "ID & Address": ["cnic_front", "cnic_back", "domicile_certificate", "form_b", "utility_bill", "driving_license", "birth_certificate", "passport", "visa"],
  "Background & Legal": ["character_certificate", "reference_letter", "non_compete_agreement", "nda", "background_check", "noc"],
  "Hiring Paperwork": ["offer_letter", "appointment_letter", "joining_letter", "signed_contract", "signed_affidavit", "previous_payslip", "resume", "cover_letter", "experience_letter"],
  "Education & Skills": ["highest_degree", "transcript", "certification", "training_certificate"],
  "Tax & Statutory": ["ntn_certificate", "eobi_card", "ssi_card", "tax_filing_proof"],
  "Health & Benefits": ["medical_clearance", "health_insurance_card", "life_insurance_card", "vaccination_record"],
  "Banking": ["bank_letter", "cancelled_cheque"],
  "Photos": ["professional_photo"],
  "Internal Records": ["warning_letter", "appreciation_letter", "performance_review"],
  "Other": ["other"],
};

const ACRONYMS = new Set(["cnic", "ntn", "eobi", "ssi", "noc", "nda"]);

const labelize = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

// build a flat lookup of type -> group
const TYPE_TO_GROUP = (() => {
  const m = {};
  Object.entries(DOC_GROUPS).forEach(([group, types]) => {
    types.forEach((t) => { m[t] = group; });
  });
  return m;
})();

/**
 * Heuristic: does this document row look like an image we can preview
 * inline? Checks mime_type first (most reliable when set), then file
 * extension, then the type enum (professional_photo / cnic_front are
 * always images per the upload UI).
 */
const isImageDoc = (d) => {
  if (!d || !d.file_url) return false;
  const mime = (d.mime_type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  const name = (d.original_filename || d.file_path || d.file_url || "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return true;
  const typesAlwaysImage = new Set([
    "professional_photo", "cnic_front", "cnic_back",
    "passport", "form_b", "driving_license",
  ]);
  return typesAlwaysImage.has(d.type);
};

const formatBytes = (size) => {
  if (!size && size !== 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const daysBetween = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / (24 * 60 * 60 * 1000));
};

const ExpiryBadge = ({ expiry }) => {
  if (!expiry) return null;
  const d = daysBetween(expiry);
  if (d === null) return null;
  let color = "#64748B";
  let bg = "#F1F5F9";
  let label = `${d}d to expire`;
  if (d < 0) { color = "#DC2626"; bg = "#FEF2F2"; label = `expired ${Math.abs(d)}d ago`; }
  else if (d <= 7) { color = "#CA8A04"; bg = "#FEFCE8"; label = `expires in ${d}d`; }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
      style={{ color, background: bg }}
    >
      {d < 0 ? <AlertTriangle size={10} /> : null}
      {label}
    </span>
  );
};

/* upload modal */
const UploadModal = ({ open, onClose, profileUuid, onDone }) => {
  const [type, setType] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [uploadDoc, { isLoading: uploading }] = usePostMutation();

  // flatten options + filter
  const allOptions = useMemo(() => {
    const out = [];
    Object.entries(DOC_GROUPS).forEach(([group, types]) => {
      types.forEach((t) => out.push({ value: t, label: labelize(t), group }));
    });
    return out;
  }, []);
  const filtered = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.includes(q) || o.group.toLowerCase().includes(q)
    );
  }, [allOptions, typeSearch]);

  const reset = () => {
    setType(""); setTypeSearch(""); setFile(null); setLabel("");
    setIssueDate(""); setExpiryDate(""); setNote("");
  };

  const close = () => { reset(); onClose(); };

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      showToast("File too large (max 10MB).", "error");
      return;
    }
    const ok = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!ok.includes(f.type)) {
      showToast("Only PDF / PNG / JPG / WEBP files allowed.", "error");
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!type) { showToast("Pick a document type.", "error"); return; }
    if (!file) { showToast("Choose a file to upload.", "error"); return; }

    const fd = new FormData();
    fd.append("type", type);
    fd.append("file", file);
    if (label) fd.append("label", label);
    if (issueDate) fd.append("issue_date", issueDate);
    if (expiryDate) fd.append("expiry_date", expiryDate);
    if (note) fd.append("note", note);

    try {
      await uploadDoc({
        path: `employee/profiles/${profileUuid}/documents`,
        body: fd,
      }).unwrap();
      showToast("Document uploaded", "success");
      onDone?.();
      close();
    } catch (err) {
      // Fall back to manual fetch with localStorage token if apiSlice multipart misbehaves.
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/";
        const res = await fetch(`${API_URL}employee/profiles/${profileUuid}/documents`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Upload failed (${res.status})`);
        }
        showToast("Document uploaded", "success");
        onDone?.();
        close();
      } catch (fallbackErr) {
        showToast(fallbackErr.message || err?.data?.message || "Upload failed.", "error");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>
            Upload document
          </h3>
          <button type="button" onClick={close} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Document type *
            </label>
            <input
              type="text"
              placeholder="Search types (e.g. CNIC, NTN, signed contract)…"
              value={typeSearch}
              onChange={(e) => setTypeSearch(e.target.value)}
              className={inputCls}
              style={{ borderColor: BORDER }}
            />
            <div
              className="mt-2 border rounded-md max-h-40 overflow-y-auto"
              style={{ borderColor: BORDER, background: SURFACE_ALT }}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs" style={{ color: TEXT_MUTED }}>
                  No matching type.
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setType(o.value)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-left hover:bg-white"
                    style={{ color: type === o.value ? BRAND_RED : TEXT_PRIMARY, background: type === o.value ? BRAND_RED_TINT : "transparent" }}
                  >
                    <span>{o.label}</span>
                    <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{o.group}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              File * (PDF / PNG / JPG / WEBP, max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFile}
              className="block w-full mt-1 text-xs"
            />
            {file && (
              <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                {file.name} · {formatBytes(file.size)}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Label
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              placeholder="Optional display label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
                Issue date
              </label>
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: BORDER }}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
                Expiry date
              </label>
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: BORDER }}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Note
            </label>
            <textarea
              rows={3}
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 text-xs border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
              style={{ background: BRAND_RED }}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DocumentsTab = ({ profile, refetch: refetchParent }) => {
  const { data, isFetching, refetch } = useGetQuery({
    path: `employee/profiles/${profile.uuid}/documents`,
  });
  const list = unwrap(data);

  const [uploadOpen, setUploadOpen] = useState(false);
  // Document viewer modal. `viewing` is null OR the full doc row that's
  // currently being shown in the lightbox.
  const [viewing, setViewing] = useState(null);
  // Change-type modal — null or the doc whose type HR is re-classifying.
  const [retyping, setRetyping] = useState(null);
  const [verifyDoc, { isLoading: verifying }] = usePostMutation();
  const [patchDoc,  { isLoading: patching  }] = usePatchMutation();
  const [removeDoc, { isLoading: removing  }] = useDeleteMutation();

  const handleChangeType = async (uuid, newType) => {
    try {
      await patchDoc({
        path: `employee/documents/${uuid}`,
        body: { type: newType },
      }).unwrap();
      showToast("Document type updated.", "success");
      setRetyping(null);
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Failed to update type.", "error");
    }
  };

  const grouped = useMemo(() => {
    const buckets = {};
    list.forEach((d) => {
      const g = TYPE_TO_GROUP[d.type] || "Other";
      (buckets[g] ||= []).push(d);
    });
    return buckets;
  }, [list]);

  const handleVerify = async (uuid) => {
    try {
      await verifyDoc({
        path: `employee/documents/${uuid}/verify`,
        body: {},
      }).unwrap();
      showToast("Document verified", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not verify.", "error");
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await removeDoc({ path: `employee/documents/${uuid}` }).unwrap();
      showToast("Document deleted", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not delete.", "error");
    }
  };

  return (
    <div className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            Documents
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            Upload, verify and track expiry of employee paperwork.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
          style={{ background: BRAND_RED }}
        >
          <Upload size={12} /> Upload document
        </button>
      </div>

      <div
        className="flex items-start gap-2 px-3 py-2 mb-4 border rounded-md"
        style={{ borderColor: "#DBEAFE", background: "#EFF6FF" }}
      >
        <Info size={14} style={{ color: "#1D4ED8" }} className="mt-0.5 shrink-0" />
        <p className="text-xs" style={{ color: "#1E3A8A" }}>
          <strong>Required for payroll:</strong> CNIC (front), CNIC (back), Professional photo,
          Bank letter, Signed contract.
        </p>
      </div>

      {isFetching && !list.length ? (
        <div className="py-8 text-center text-xs" style={{ color: TEXT_MUTED }}>
          <Loader2 size={14} className="inline mr-2 animate-spin" /> Loading documents…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: TEXT_MUTED }}>
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(DOC_GROUPS)
            .filter((g) => grouped[g]?.length)
            .map((group) => (
              <section key={group}>
                <h3
                  className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: TEXT_MUTED }}
                >
                  {group}
                </h3>
                <ul className="space-y-2">
                  {grouped[group].map((d) => (
                    <li
                      key={d.uuid}
                      className="flex items-start justify-between gap-3 px-4 py-3 border rounded-md"
                      style={{ borderColor: BORDER, background: SURFACE_ALT }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Inline image thumbnail for image-type docs.
                            Falls back to the generic FileText icon for
                            PDFs / other formats. Clicking the thumbnail
                            opens the full file in a new tab — same target
                            as the "View" button on the right. */}
                        {isImageDoc(d) ? (
                          <button
                            type="button"
                            onClick={() => setViewing(d)}
                            className="shrink-0 block overflow-hidden border rounded-md"
                            style={{ borderColor: BORDER, width: 56, height: 56, padding: 0, background: "white" }}
                            title="Click to view"
                          >
                            <img
                              src={d.file_url}
                              alt={d.label || d.type}
                              className="object-cover w-full h-full"
                              loading="lazy"
                              onError={(e) => {
                                // If the image fails to load, hide the
                                // <img> so the row doesn't show a broken
                                // glyph — the FileText icon below will
                                // remain visible via the parent layout.
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </button>
                        ) : (
                          <FileText size={16} style={{ color: TEXT_MUTED }} className="mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full"
                              style={{ color: TEXT_SECONDARY, background: "#F1F5F9" }}
                            >
                              {labelize(d.type)}
                            </span>
                            <span className="text-sm font-medium truncate" style={{ color: TEXT_PRIMARY, maxWidth: 360 }}>
                              {d.label || labelize(d.type)}
                            </span>
                            {d.is_verified && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                style={{ color: "#16A34A", background: "#F0FDF4" }}
                              >
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            )}
                            <ExpiryBadge expiry={d.expiry_date} />
                          </div>
                          <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                            {d.original_filename || "(no filename)"}
                            {d.file_size ? <> · {formatBytes(d.file_size)}</> : null}
                            {d.expiry_date ? <> · expires {d.expiry_date}</> : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {d.file_url && (
                          <button
                            type="button"
                            onClick={() => setViewing(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md"
                            style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
                          >
                            <Eye size={11} /> View
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRetyping(d)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md"
                          style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
                          title="Change document type"
                        >
                          <Tag size={11} /> Change type
                        </button>
                        {!d.is_verified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(d.uuid)}
                            disabled={verifying}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                            style={{ borderColor: "#BBF7D0", color: "#16A34A", background: "#F0FDF4" }}
                          >
                            <ShieldCheck size={11} /> Verify
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(d.uuid)}
                          disabled={removing}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                          style={{ borderColor: "#FECACA", color: BRAND_RED, background: BRAND_RED_TINT }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        profileUuid={profile.uuid}
        onDone={() => {
          refetch();
          refetchParent?.();
        }}
      />

      <DocumentViewerModal doc={viewing} onClose={() => setViewing(null)} />

      <ChangeTypeModal
        doc={retyping}
        onClose={() => setRetyping(null)}
        onChange={(t) => handleChangeType(retyping.uuid, t)}
        busy={patching}
      />
    </div>
  );
};

/**
 * Lightbox-style viewer for an employee document. Handles three cases:
 *   • Image (mime starts with image/ OR isImageDoc()) — renders an <img>
 *     that scales to fit the viewport with a black backdrop.
 *   • PDF (mime application/pdf OR .pdf extension) — embedded <iframe>.
 *   • Anything else — shows a small "preview not available" panel and
 *     points HR at the Download button.
 *
 * Always shows a Download button (so HR can save originals) and a
 * Close X. Esc + backdrop click both close. The component is fully
 * controlled — render with doc=null when closed.
 */
const DocumentViewerModal = ({ doc, onClose }) => {
  // Keyboard handler: close on Esc.
  useEffect(() => {
    if (!doc) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Prevent page scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [doc, onClose]);

  if (!doc) return null;

  const isImage = isImageDoc(doc);
  const isPdf =
    (doc.mime_type || "").toLowerCase() === "application/pdf"
    || /\.pdf$/i.test(doc.original_filename || doc.file_path || doc.file_url || "");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15, 23, 42, 0.85)" }}
      onClick={onClose}
    >
      {/* Top bar — title + actions */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.15)" }}
          >
            {labelize(doc.type)}
          </span>
          <span className="text-sm font-medium truncate" style={{ color: "#FFFFFF", maxWidth: 480 }}>
            {doc.label || doc.original_filename || labelize(doc.type)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={doc.file_url}
            download={doc.original_filename || undefined}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}
          >
            <Download size={12} /> Download
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body — clicking inside the body shouldn't close (only backdrop). */}
      <div
        className="flex items-center justify-center flex-1 px-4 py-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          <img
            src={doc.file_url}
            alt={doc.label || doc.type}
            className="max-w-full max-h-full rounded-md shadow-2xl"
            style={{ objectFit: "contain" }}
          />
        ) : isPdf ? (
          <iframe
            src={doc.file_url}
            title={doc.label || doc.type}
            className="w-full h-full bg-white rounded-md shadow-2xl"
            style={{ minHeight: "60vh" }}
          />
        ) : (
          <div
            className="px-6 py-8 text-center bg-white rounded-md shadow-2xl"
            style={{ color: TEXT_SECONDARY, maxWidth: 360 }}
          >
            <FileText size={28} style={{ color: TEXT_MUTED }} className="mx-auto mb-2" />
            <p className="text-sm">Preview not available for this file type.</p>
            <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
              Use the Download button above to open it locally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Modal for re-classifying a document. HR picks a type from the grouped
 * dropdown; on save, calls PATCH /api/employee/documents/{uuid} with the
 * new type. Pre-selects the current type so the open-and-cancel case
 * doesn't lose state.
 *
 * Use case: imported documents from the legacy spreadsheet default to
 * type='other' because the seeder can't tell a CNIC from a professional
 * photo. HR opens this modal and re-classifies them in one click.
 */
const ChangeTypeModal = ({ doc, onClose, onChange, busy }) => {
  const [type, setType] = useState(doc?.type || "");
  useEffect(() => {
    setType(doc?.type || "");
  }, [doc?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!doc) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doc, onClose]);

  if (!doc) return null;

  const sameAsCurrent = type === doc.type;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(15, 23, 42, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
          <div className="flex items-center gap-2">
            <Tag size={14} style={{ color: BRAND_RED }} />
            <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              Change document type
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} style={{ color: TEXT_MUTED }} />
          </button>
        </header>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
            Pick the correct document type. Current: <strong style={{ color: TEXT_PRIMARY }}>{labelize(doc.type)}</strong>.
          </p>
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_MUTED }}>
              New type
            </label>
            <select
              className={inputCls}
              style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">— pick a type —</option>
              {Object.entries(DOC_GROUPS).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map((t) => (
                    <option key={t} value={t}>{labelize(t)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: BORDER }}>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-md"
            style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onChange(type)}
            disabled={busy || !type || sameAsCurrent}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
            style={{ background: BRAND_RED }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Save type
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DocumentsTab;
