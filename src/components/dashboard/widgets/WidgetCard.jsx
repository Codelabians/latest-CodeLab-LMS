import { Loader2, AlertTriangle } from "lucide-react";
import {
  BORDER,
  BRAND_RED,
  BRAND_RED_TINT,
  SURFACE,
  SURFACE_ALT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "../dashboardConstants";

/**
 * Phase 1.95 — Shared widget chrome (icon header + body slot + loading /
 * error / empty states). Matches the SectionCard pattern used across HR
 * pages (rounded white card, brand-red icon chip, subtle border).
 *
 * Props:
 *   - icon         Lucide icon component
 *   - title        Section title
 *   - subtitle     Optional small grey caption under the title
 *   - loading      Show a spinner instead of children
 *   - error        Show an error block instead of children
 *   - empty        Show an "no data" block instead of children
 *   - emptyMessage Optional custom empty-state copy
 *   - footer       Optional footer slot (small links, "View all", etc.)
 *   - className    Pass-through for grid placement
 *   - children     Widget body
 */
export default function WidgetCard({
  icon: Icon,
  title,
  subtitle,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = "Nothing to show yet.",
  footer = null,
  className = "",
  children,
}) {
  return (
    <section
      className={`overflow-hidden bg-white border shadow-sm rounded-2xl ${className}`}
      style={{ borderColor: BORDER, background: SURFACE }}
    >
      <header
        className="flex items-center justify-between gap-3 px-5 py-3 border-b"
        style={{ borderColor: BORDER, background: SURFACE_ALT }}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <Icon size={14} />
            </span>
          )}
          <div className="flex flex-col">
            <h2
              className="text-[13px] font-semibold leading-none"
              style={{ color: TEXT_PRIMARY }}
            >
              {title}
            </h2>
            {subtitle && (
              <span className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: TEXT_MUTED }} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-2 text-sm" style={{ color: "#B91C1C" }}>
            <AlertTriangle size={14} />
            <span>{typeof error === "string" ? error : "Something went wrong."}</span>
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center py-6 text-sm" style={{ color: TEXT_MUTED }}>
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <footer
          className="px-5 py-2 text-xs border-t"
          style={{ borderColor: BORDER, color: TEXT_MUTED, background: SURFACE_ALT }}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
