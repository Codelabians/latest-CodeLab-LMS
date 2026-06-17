import React, { useEffect, useRef, useState } from "react";
import { Loader2, Tag, X } from "lucide-react";

/* Brand tokens — kept inline so this modal is self-contained */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";

/**
 * Add / Edit Category modal.
 *
 * Props:
 *  - isOpen         boolean
 *  - mode           "add" | "edit"
 *  - initialName    string  — name to pre-fill in edit mode
 *  - onClose()      → void
 *  - onSubmit(name) → Promise<{ error: string | null }>
 *                     The parent does the API call and returns either
 *                     `{ error: null }` on success or `{ error: msg }` on
 *                     failure (e.g. backend validation message). On success
 *                     the parent is expected to close us via `onClose`.
 *  - isLoading      boolean — disables the submit button while in flight
 */
const CategoryFormModal = ({
  isOpen,
  mode,
  initialName,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState(initialName || "");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const inputRef = useRef(null);

  /* Reset state every time the modal opens */
  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setTouched(false);
      setServerError("");
      // small delay so the input is mounted before we focus
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  /* client-side validation — only min:3 per spec */
  const trimmed = name.trim();
  const clientError =
    trimmed.length === 0
      ? "Category name is required"
      : trimmed.length < 3
      ? "Category name must be at least 3 characters"
      : "";

  const visibleError = touched ? clientError || serverError : serverError;
  const isEdit = mode === "edit";
  const canSubmit = !clientError && !isLoading;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setTouched(true);
    if (clientError) return;
    setServerError("");
    const result = await onSubmit(name);
    if (result && result.error) {
      setServerError(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: BRAND_RED_TINT,
                color: BRAND_RED,
              }}
            >
              <Tag size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isEdit ? "Edit Category" : "Add New Category"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {isEdit
                  ? "Rename this category"
                  : "Create a new category to organise your courses"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED, background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
              e.currentTarget.style.color = TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = TEXT_MUTED;
            }}
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5">
          <label
            htmlFor="category-name"
            className="block mb-2"
            style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}
          >
            Category name
          </label>
          <input
            id="category-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (serverError) setServerError("");
            }}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Web Development"
            disabled={isLoading}
            className="w-full px-3 py-2.5 text-sm transition rounded-lg outline-none disabled:opacity-60"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${visibleError ? "#FCA5A5" : BORDER}`,
              color: TEXT_PRIMARY,
              fontFamily: "'Montserrat', sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#fff";
              if (!visibleError) e.currentTarget.style.borderColor = "#CBD5E1";
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p
              className="text-[11.5px]"
              style={{ color: visibleError ? BRAND_RED : TEXT_MUTED, fontWeight: visibleError ? 500 : 400 }}
            >
              {visibleError || "Minimum 3 characters"}
            </p>
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {trimmed.length} chars
            </p>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create category"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormModal;
