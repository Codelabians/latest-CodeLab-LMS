import { useRef, useState } from "react";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useSelector } from "react-redux";

import { selectCurrentUser } from "../../../features/auth/authSlice";
import { API_URL } from "../../../api/apiSlice";

/* ────────────── brand tokens (matches Settings / Brands pages) ────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/* ────────────── resolve a stored path to a viewable URL ──────────── */
const resolveUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value; // already absolute
  if (value.startsWith("/")) {
    const base = String(API_URL)
      .replace(/\/+api\/?$/i, "")
      .replace(/\/+$/, "");
    return `${base}${value}`;
  }
  // relative storage path: '<disk>/<folder>/<file>'
  const base = String(API_URL)
    .replace(/\/+api\/?$/i, "")
    .replace(/\/+$/, "");
  return `${base}/storage/${value}`;
};

/* ────────────── friendly bytes ───────────────────────────────────── */
const fmtBytes = (n) => {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} KB`;
  return `${Math.round(n / 104857.6) / 10} MB`;
};

/**
 * Reusable file-upload field with image preview.
 *
 * Props:
 *   value         current path/url (string)
 *   onChange      (newPath: string) => void
 *   folder        upload target folder, e.g. 'company/logos' or 'brands/agency/stamps'
 *   purpose       'logo' | 'letterhead' | 'signature' | 'stamp'
 *   label         optional caption above the dropzone
 *   helperText    optional small text under the dropzone
 *   disabled      bool — disables interaction
 *   accept        defaults to '.png,.jpg,.jpeg,.svg,.webp'
 */
const FileUploadField = ({
  value,
  onChange,
  folder,
  purpose,
  label,
  helperText,
  disabled = false,
  accept = ".png,.jpg,.jpeg,.svg,.webp",
}) => {
  const user = useSelector(selectCurrentUser);

  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState(null); // last upload metadata
  const [isDragOver, setIsDragOver] = useState(false);

  const apiBase = String(API_URL).replace(/\/+$/, "");

  const previewUrl = resolveUrl(value);

  const handleFiles = async (fileList) => {
    if (disabled || isUploading) return;
    const file = fileList?.[0];
    if (!file) return;

    setErrorMsg("");
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("purpose", purpose);

      // XHR for upload progress (fetch doesn't expose upload progress)
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/employee/media/upload`);
        // Auth header — read fresh from redux-persist (apiSlice uses the
        // same source). The XHR can't go through fetchBaseQuery so we
        // need to attach it manually for the upload.
        try {
          const raw = window.localStorage.getItem("persist:auth");
          if (raw) {
            const parsed = JSON.parse(raw);
            const t = JSON.parse(parsed.token ?? "null");
            if (t) xhr.setRequestHeader("Authorization", `Bearer ${t}`);
          } else if (user?.token) {
            xhr.setRequestHeader("Authorization", `Bearer ${user.token}`);
          }
        } catch {
          // Silent fallback — if no auth token is found, the backend will
          // 401 and we surface the error via the response handler below.
        }
        xhr.setRequestHeader("Accept", "application/json");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
        };
        xhr.onerror = () => reject(new Error("Network error — upload failed."));
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
              resolve(body);
            } else {
              reject(new Error(body?.message || `Upload failed (HTTP ${xhr.status}).`));
            }
          } catch {
            reject(new Error("Upload failed — unexpected response."));
          }
        };
        xhr.send(formData);
      });

      const data = result?.data || {};
      setMeta(data);
      // Persist the storage path (not URL) so it survives env changes.
      onChange?.(data.path || data.url || "");
    } catch (err) {
      setErrorMsg(err?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      setProgress(0);
      // reset the file input so picking the same file twice still fires onChange
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (disabled || isUploading) return;
    setMeta(null);
    onChange?.("");
  };

  return (
    <div>
      {label && (
        <div
          className="text-[12px] font-semibold mb-1.5"
          style={{ color: TEXT_SECONDARY }}
        >
          {label}
        </div>
      )}

      <div
        onDragEnter={(e) => {
          if (disabled || isUploading) return;
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(e) => {
          if (disabled || isUploading) return;
          e.preventDefault();
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          if (disabled || isUploading) return;
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !isUploading && !previewUrl && inputRef.current?.click()}
        className="rounded-lg transition cursor-pointer"
        style={{
          border: isDragOver
            ? `2px dashed ${BRAND_RED}`
            : `1px dashed ${BORDER}`,
          background: isDragOver
            ? BRAND_RED_TINT
            : previewUrl
              ? SURFACE
              : SURFACE_ALT,
          padding: previewUrl ? 12 : 22,
          textAlign: previewUrl ? "left" : "center",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || isUploading}
          style={{ display: "none" }}
        />

        {/* ----- Empty / drop state ----- */}
        {!previewUrl && !isUploading && (
          <div className="flex flex-col items-center gap-2" style={{ color: TEXT_MUTED }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: SURFACE, color: BRAND_RED,
                border: `1px solid ${BORDER}`,
              }}
            >
              <UploadCloud size={20} strokeWidth={2} />
            </div>
            <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              Click to upload <span style={{ color: TEXT_MUTED }}>or drag &amp; drop</span>
            </div>
            <div className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
              PNG, JPG, SVG, WEBP &middot; up to 5&nbsp;MB &middot; auto-resized
            </div>
          </div>
        )}

        {/* ----- Uploading state ----- */}
        {isUploading && (
          <div className="flex flex-col items-center gap-2" style={{ color: TEXT_SECONDARY }}>
            <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
            <div className="text-[13px] font-semibold">Uploading… {progress}%</div>
            <div className="w-full" style={{ maxWidth: 240, background: SURFACE_ALT, borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  background: BRAND_RED, height: "100%",
                  width: `${progress}%`, transition: "width 0.15s",
                }}
              />
            </div>
          </div>
        )}

        {/* ----- Preview state ----- */}
        {previewUrl && !isUploading && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 72, height: 72, borderRadius: 10,
                background: SURFACE_ALT, border: `1px solid ${BORDER}`, overflow: "hidden",
              }}
            >
              {/\.(svg|png|jpe?g|webp)$/i.test(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="object-contain"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <ImageIcon size={22} style={{ color: TEXT_MUTED }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
                <CheckCircle2 size={13} style={{ color: "#16A34A" }} />
                File uploaded
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-[11.5px] hover:underline mt-0.5"
                style={{ color: TEXT_SECONDARY, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
                onClick={(e) => e.stopPropagation()}
              >
                {value}
              </a>
              {meta && (
                <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                  {meta.mime_type}
                  {meta.width && meta.height ? ` · ${meta.width}×${meta.height}` : ""}
                  {meta.size ? ` · ${fmtBytes(meta.size)}` : ""}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition"
                  style={{
                    fontSize: 11.5, fontWeight: 600,
                    background: SURFACE, color: TEXT_SECONDARY,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <UploadCloud size={11} strokeWidth={2.25} />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition"
                  style={{
                    fontSize: 11.5, fontWeight: 600,
                    background: SURFACE, color: BRAND_RED,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <X size={11} strokeWidth={2.5} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div
          className="mt-2 rounded-md px-3 py-2 flex items-start gap-2"
          style={{
            background: BRAND_RED_TINT,
            border: `1px solid ${BRAND_RED}`,
            color: BRAND_RED,
            fontSize: 12,
          }}
        >
          <AlertCircle size={13} className="mt-0.5 shrink-0" strokeWidth={2.25} />
          <span>{errorMsg}</span>
        </div>
      )}

      {helperText && (
        <p className="text-[10.5px] mt-1.5" style={{ color: TEXT_MUTED, lineHeight: 1.4 }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FileUploadField;
