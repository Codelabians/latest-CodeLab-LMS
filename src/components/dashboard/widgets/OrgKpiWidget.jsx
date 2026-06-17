import { Building2 } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

/**
 * Org-wide KPIs for senior leadership (CEO / COO / Admin).
 * Reads from /employee/dashboard/org-summary.
 */
export default function OrgKpiWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/org-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const d = data?.data;

  return (
    <WidgetCard
      icon={Building2}
      title="Org snapshot"
      subtitle="Company-wide headline numbers"
      loading={isLoading}
      error={error ? "Failed to load org snapshot." : null}
      empty={!isLoading && !d}
    >
      {d && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Kpi label="Total headcount" value={d.headcount} />
          <Kpi label="Active" value={d.active_headcount} />
          <Kpi label="Payroll ready %" value={`${d.payroll_ready_pct}%`} />
          <Kpi label="Hires (this month)" value={d.hires_this_month} />
          <Kpi label="Separations (this month)" value={d.separations_this_month} />
          <Kpi label="Brands · Depts · Offices" value={`${d.total_brands} · ${d.total_departments} · ${d.total_offices}`} compact />
        </div>
      )}
    </WidgetCard>
  );
}

function Kpi({ label, value, compact = false }) {
  return (
    <div
      className="flex flex-col gap-1 px-3 py-2 rounded-lg border"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className={`${compact ? "text-sm" : "text-xl"} font-semibold`} style={{ color: TEXT_PRIMARY }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
