import { Receipt } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

/**
 * Finance-facing slim view of payroll readiness. Same hr-summary
 * endpoint, but rendered with finance accents: total ready, total
 * blocked, override count.
 */
export default function FinancePayrollReadyWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/hr-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const d = data?.data;

  return (
    <WidgetCard
      icon={Receipt}
      title="Payroll batch readiness"
      subtitle="Pre-payroll-run snapshot"
      loading={isLoading}
      error={error ? "Failed to load payroll snapshot." : null}
      empty={!isLoading && !d}
    >
      {d && (
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Ready" value={d.payroll_ready} tone="green" />
          <Tile label="Blocked" value={d.payroll_blocked} tone="red" />
          <Tile label="Headcount" value={d.headcount} tone="default" />
        </div>
      )}
    </WidgetCard>
  );
}

function Tile({ label, value, tone }) {
  const tones = { default: TEXT_PRIMARY, green: "#15803D", red: "#B91C1C" };
  return (
    <div
      className="flex flex-col items-center px-3 py-2 text-center rounded-lg border"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className="text-2xl font-semibold" style={{ color: tones[tone] }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
