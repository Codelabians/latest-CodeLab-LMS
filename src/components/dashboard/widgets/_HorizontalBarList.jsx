import { BORDER, TEXT_MUTED, TEXT_PRIMARY } from "../dashboardConstants";
import { BAR_TONE } from "./_barTones";

/**
 * Phase 1.95 — Small horizontal-bar list used by several widgets
 * (headcount by dept / office, brand split, status breakdown).
 *
 * Rows shape: [{ key, label, value, sublabel? }]
 * `tone` picks the bar fill color. Import `BAR_TONE` from ./_barTones for
 * the preset palette.
 *
 * Renders nothing if rows is empty — caller should handle the empty
 * state via WidgetCard's `empty` prop.
 */
export function HorizontalBarList({ rows, tone = BAR_TONE.brand, maxRows = 8 }) {
  if (!rows || rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0));
  const visible = rows.slice(0, maxRows);

  return (
    <ul className="flex flex-col gap-2.5">
      {visible.map((r) => {
        const pct = Math.round(((Number(r.value) || 0) / max) * 100);
        return (
          <li key={r.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="truncate" style={{ color: TEXT_PRIMARY }}>
                {r.label}
              </span>
              <span className="ml-2 font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
                {r.value}
              </span>
            </div>
            <div
              className="relative w-full h-1.5 overflow-hidden rounded-full"
              style={{ background: "#F1F5F9" }}
            >
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: tone }}
              />
            </div>
            {r.sublabel && (
              <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
                {r.sublabel}
              </span>
            )}
          </li>
        );
      })}
      {rows.length > maxRows && (
        <li className="text-[10px] text-right" style={{ color: TEXT_MUTED, borderColor: BORDER }}>
          + {rows.length - maxRows} more
        </li>
      )}
    </ul>
  );
}
