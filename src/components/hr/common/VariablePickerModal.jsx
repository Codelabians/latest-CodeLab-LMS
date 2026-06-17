import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Sparkles,
  Database,
} from "lucide-react";

/* ─────────────────────── brand tokens ──────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/**
 * VariablePickerModal — searchable picker for entity-bound template
 * variables. Resolves the registry catalog from the parent (the
 * /api/employee/email-templates/variable-sources endpoint) and renders
 * a clean list grouped by entity. Click a row → inserts `{var_name}`
 * at the editor's cursor (the parent owns the insertion logic).
 *
 * Props:
 *   open            bool — show / hide
 *   onClose         () => void
 *   onInsert        (variableName: string, fullRow: object) => void
 *   variableSources [{ entity_key, label, description, fields[...] }]
 *   title           optional override
 */
const VariablePickerModal = ({
  open,
  onClose,
  onInsert,
  variableSources,
  title = "Insert variable",
}) => {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  // Reset filters when closing so next open starts clean
  useEffect(() => {
    if (!open) {
      setSearch("");
      setEntityFilter("all");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sources = useMemo(() => variableSources || [], [variableSources]);

  const flatRows = useMemo(() => {
    // Flatten into [{ entity_key, entity_label, name, label, sample, type }]
    const rows = [];
    sources.forEach((src) => {
      (src.fields || []).forEach((f) => {
        rows.push({
          entity_key:   src.entity_key,
          entity_label: src.label,
          name:         f.name,
          label:        f.label,
          field_path:   f.field_path,
          sample:       f.sample || "",
          type:         f.type || "string",
        });
      });
    });
    return rows;
  }, [sources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flatRows.filter((r) => {
      if (entityFilter !== "all" && r.entity_key !== entityFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.label} ${r.sample}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [flatRows, search, entityFilter]);

  // Group filtered rows by entity for the display
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      if (!map.has(r.entity_key)) {
        map.set(r.entity_key, { entity_key: r.entity_key, entity_label: r.entity_label, rows: [] });
      }
      map.get(r.entity_key).rows.push(r);
    });
    return Array.from(map.values());
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.55)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden bg-white shadow-2xl rounded-2xl flex flex-col"
        style={{ maxWidth: 720, maxHeight: "82vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Sparkles size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                Click any variable to insert it into the body at the cursor.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED }}
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Search + entity chips */}
        <div className="px-5 py-3" style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
          <div className="relative mb-2.5">
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED }} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, label, or sample…"
              className="w-full pl-8 pr-3 py-2 rounded-lg"
              style={{ border: `1px solid ${BORDER}`, fontSize: 13, outline: "none", background: SURFACE }}
              onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setEntityFilter("all")}
              className="px-2.5 py-1 rounded-md"
              style={{
                fontSize: 11.5, fontWeight: 600,
                background: entityFilter === "all" ? BRAND_RED_TINT : SURFACE,
                color: entityFilter === "all" ? BRAND_RED : TEXT_SECONDARY,
                border: `1px solid ${entityFilter === "all" ? BRAND_RED : BORDER}`,
              }}
            >
              All ({flatRows.length})
            </button>
            {sources.map((src) => (
              <button
                key={src.entity_key}
                onClick={() => setEntityFilter(src.entity_key)}
                className="px-2.5 py-1 rounded-md"
                style={{
                  fontSize: 11.5, fontWeight: 600,
                  background: entityFilter === src.entity_key ? BRAND_RED_TINT : SURFACE,
                  color: entityFilter === src.entity_key ? BRAND_RED : TEXT_SECONDARY,
                  border: `1px solid ${entityFilter === src.entity_key ? BRAND_RED : BORDER}`,
                }}
              >
                {src.label.split(" ")[0]} ({(src.fields || []).length})
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {grouped.length === 0 && (
            <div className="text-center py-10" style={{ color: TEXT_MUTED }}>
              <Database size={20} className="mx-auto mb-2" />
              <p className="text-[12.5px]">No variables match your search.</p>
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.entity_key} className="mb-3">
              <div
                className="px-3 py-1.5 text-[10.5px] font-bold tracking-[0.8px] uppercase"
                style={{ color: TEXT_MUTED }}
              >
                {group.entity_label}
              </div>
              {group.rows.map((row, idx) => (
                <button
                  key={`${row.entity_key}-${row.name}-${idx}`}
                  onClick={() => {
                    onInsert?.(row.name, row);
                    onClose?.();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition flex items-center gap-3"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_RED_TINT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <code
                    className="shrink-0"
                    style={{
                      background: SURFACE_ALT,
                      color: BRAND_RED,
                      padding: "3px 8px",
                      borderRadius: 5,
                      fontSize: 12,
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      border: `1px solid ${BORDER}`,
                      minWidth: 200,
                    }}
                  >
                    {`{${row.name}}`}
                  </code>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>
                      {row.label}
                    </div>
                    {row.sample && (
                      <div className="text-[11px] truncate mt-0.5" style={{ color: TEXT_MUTED }}>
                        e.g. <span style={{ color: TEXT_SECONDARY }}>{row.sample}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2.5 text-[11px] flex items-center justify-between"
          style={{ background: SURFACE_ALT, borderTop: `1px solid ${BORDER}`, color: TEXT_MUTED }}
        >
          <span>
            Showing <strong style={{ color: TEXT_SECONDARY }}>{filtered.length}</strong> of <strong style={{ color: TEXT_SECONDARY }}>{flatRows.length}</strong> variables
          </span>
          <span>Press <kbd style={{ padding: "1px 5px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 3, fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

export default VariablePickerModal;
