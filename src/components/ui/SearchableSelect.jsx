import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X, Check } from "lucide-react";

/* Brand tokens — kept inline so the component stays drop-in */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/**
 * SearchableSelect — a compact typeahead select.
 *
 *   options       : Array<{
 *                      value: string|number,
 *                      label: string,
 *                      avatarUrl?: string | null,   // image to render to the left
 *                   }>
 *   value         : string|number|null
 *   onChange(val) : called with the new value (null = cleared)
 *   placeholder   : string
 *   label?        : optional label rendered above
 *   disabled?     : boolean
 *   clearable?    : show an X to clear when a value is set (default true)
 *   error?        : string — shown below the input
 *   hasError?     : boolean — red border w/o message
 *   compact?      : tighter sizing for table-toolbar use (default false)
 *   width?        : explicit width in px (default: 220 for compact, 100% otherwise)
 *   showAvatars?  : if true, render the avatar circle next to label in the
 *                   trigger AND in each option (initials fallback). Default
 *                   false — the option still controls whether `avatarUrl`
 *                   is set per row but the dropdown won't reserve space
 *                   for the avatar column otherwise.
 */
/**
 * Tiny avatar bubble — image if URL is given, else coloured initials circle.
 */
const Avatar = ({ url, label, size = 22 }) => {
  const initials = (label || "")
    .split(/[\s.@]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="object-cover rounded-full flex-shrink-0"
        style={{ width: size, height: size, border: `1px solid ${BORDER}` }}
        onError={(e) => {
          // Hide broken images so the initials below show through.
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center flex-shrink-0 font-bold text-white rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.45)),
        background: `linear-gradient(135deg, ${BRAND_RED} 0%, #A00505 100%)`,
      }}
    >
      {initials}
    </span>
  );
};

const SearchableSelect = ({
  options = [],
  value = null,
  onChange,
  placeholder = "Select…",
  label,
  disabled = false,
  clearable = true,
  error = "",
  hasError = false,
  compact = false,
  width,
  showAvatars = false,
  // Optional server-driven typeahead: when provided, the internal query
  // is forwarded (debounced) to the parent and local filtering is
  // disabled so server-returned `options` are shown as-is.
  onSearch = null,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  /* Selected option */
  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  /* Forward query to parent for server-side search (debounced). */
  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => onSearch(query.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* Filtered list — when onSearch is set, the parent owns filtering. */
  const filtered = useMemo(() => {
    if (onSearch) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label || "").toLowerCase().includes(q));
  }, [options, query, onSearch]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(null);
    setQuery("");
  };

  const showError = hasError || !!error;
  const resolvedWidth = width ?? (compact ? 220 : "100%");

  const triggerHeight = compact ? 34 : 40;
  const triggerPadX = 12;

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ width: resolvedWidth, fontFamily: "'Montserrat', sans-serif" }}
    >
      {label && (
        <label
          className="block mb-2"
          style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center justify-between w-full gap-2 text-sm transition rounded-lg outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          height: triggerHeight,
          padding: `0 ${triggerPadX}px`,
          background: open ? "#fff" : SURFACE_HOVER,
          border: `1px solid ${showError ? "#FCA5A5" : open ? "#CBD5E1" : BORDER}`,
          color: selected ? TEXT_PRIMARY : TEXT_MUTED,
        }}
      >
        <span className="flex items-center flex-1 min-w-0 gap-2 text-left">
          {showAvatars && selected && (
            <Avatar url={selected.avatarUrl} label={selected.label} size={compact ? 20 : 24} />
          )}
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <span className="flex items-center flex-shrink-0 gap-1">
          {clearable && selected && !disabled && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={-1}
              aria-label="Clear"
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 16, height: 16, color: TEXT_MUTED }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_RED)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
            >
              <X size={13} strokeWidth={2.25} />
            </span>
          )}
          <ChevronDown
            size={14}
            strokeWidth={2.25}
            style={{
              color: TEXT_MUTED,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s",
            }}
          />
        </span>
      </button>

      {/* Dropdown panel
       *
       * The panel anchors to the LEFT edge of the trigger and has a
       * min-width of 280px so long names like "Mobile App Development
       * (Flutter)" don't immediately need ellipsis. It can grow wider
       * than the trigger when needed.
       */}
      {open && (
        <div
          className="absolute z-50 mt-1 bg-white shadow-xl rounded-lg"
          style={{
            left: 0,
            minWidth: "100%",
            width: 280,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 12px 32px -10px rgba(15,23,42,0.18)",
          }}
        >
          {/* Search input — borderless, sits inside the panel like a top row */}
          <div
            className="flex items-center gap-2 px-3"
            style={{
              borderBottom: `1px solid ${BORDER}`,
              height: 34,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-slate-400"
              style={{ color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex items-center justify-center"
                style={{ width: 16, height: 16, color: TEXT_MUTED }}
                aria-label="Clear search"
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="py-1 overflow-y-auto" style={{ maxHeight: 220 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px]" style={{ color: TEXT_MUTED }}>
                No matches
              </div>
            ) : (
              filtered.map((o) => {
                const isSel = String(o.value) === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleSelect(o.value)}
                    className="flex items-center w-full gap-2.5 px-3 py-2 text-left transition"
                    style={{
                      background: isSel ? BRAND_RED_TINT : "transparent",
                      color: isSel ? BRAND_RED : TEXT_PRIMARY,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.background = SURFACE_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {showAvatars && (
                      <Avatar url={o.avatarUrl} label={o.label} size={26} />
                    )}
                    <span
                      className="flex-1 min-w-0 text-[13px] truncate"
                      style={{ fontWeight: isSel ? 600 : 500 }}
                    >
                      {o.label}
                    </span>
                    {isSel && (
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: BRAND_RED }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;
