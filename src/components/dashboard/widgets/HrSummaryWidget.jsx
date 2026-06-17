import { Activity } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

/**
 * Phase 1.95 — HR kitchen-sink summary widget.
 *
 * Six headline KPIs: total headcount, pending onboardings, probation
 * ending soon, document expiries in 30 days, payroll ready vs blocked,
 * net hires this month.
 */
export default function HrSummaryWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/hr-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const d = data?.data;

  return (
    <WidgetCard
      icon={Activity}
      title="HR snapshot"
      subtitle="Live counts across the workforce"
      loading={isLoading}
      error={error ? "Failed to load HR snapshot." : null}
      empty={!isLoading && !d}
    >
      {d && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Kpi label="Headcount" value={d.headcount} />
          <Kpi label="Pending onboardings" value={d.pending_onboardings} tone={d.pending_onboardings > 0 ? "amber" : "default"} />
          <Kpi label="Probation ≤ 7 days" value={d.probation_ending_soon} tone={d.probation_ending_soon > 0 ? "amber" : "default"} />
          <Kpi label="Doc expiries (30d)" value={d.document_expiries_30d} tone={d.document_expiries_30d > 0 ? "amber" : "default"} />
          <Kpi label="Payroll ready" value={d.payroll_ready} tone="green" />
          <Kpi label="Payroll blocked" value={d.payroll_blocked} tone={d.payroll_blocked > 0 ? "red" : "default"} />
        </div>
      )}
    </WidgetCard>
  );
}

function Kpi({ label, value, tone = "default" }) {
  const toneColors = {
    default: TEXT_PRIMARY,
    green:   "#15803D",
    amber:   "#A16207",
    red:     "#B91C1C",
  };
  return (
    <div
      className="flex flex-col gap-1 px-3 py-2 rounded-lg border"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className="text-xl font-semibold" style={{ color: toneColors[tone] }}>
        {value ?? "—"}
      </span>
      <span className="text-[10px]" style={{ color: TEXT_SECONDARY }}>&nbsp;</span>
    </div>
  );
}
