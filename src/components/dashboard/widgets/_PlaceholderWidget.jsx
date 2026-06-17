import { Clock4 } from "lucide-react";

import { TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

/**
 * Phase 1.95 — Coming-soon placeholder used by Teacher / Reception /
 * Sales widgets whose live data sources land in later phases (Phase 2:
 * Attendance, Phase 3: Leave, etc.).
 *
 * Keeps the visual shell consistent so the dashboard never has bare gaps.
 */
export default function PlaceholderWidget({ icon: Icon = Clock4, title, subtitle, phase, hint }) {
  return (
    <WidgetCard icon={Icon} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-start gap-1.5">
        <span
          className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
          style={{ color: "#A16207", background: "#FEFCE8" }}
        >
          {phase || "Coming soon"}
        </span>
        <p className="text-sm" style={{ color: TEXT_PRIMARY }}>
          {hint || "Data for this widget arrives in a later phase."}
        </p>
        <p className="text-[11px]" style={{ color: TEXT_SECONDARY }}>
          Once the connected module ships, this card will populate automatically — no
          changes needed in the dashboard.
        </p>
        <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>
          The dashboard shell already renders this card the right shape, so the
          backfill is a one-file change when the data lands.
        </p>
      </div>
    </WidgetCard>
  );
}
