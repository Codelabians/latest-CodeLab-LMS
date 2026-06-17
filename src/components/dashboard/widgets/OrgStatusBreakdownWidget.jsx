import { Briefcase } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { HorizontalBarList } from "./_HorizontalBarList";
import { BAR_TONE } from "./_barTones";
import { titleCase } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function OrgStatusBreakdownWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/org-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const status = data?.data?.status_breakdown || {};
  const rows = Object.entries(status)
    .map(([k, v]) => ({ key: k, label: titleCase(k), value: Number(v) || 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <WidgetCard
      icon={Briefcase}
      title="Employment status"
      subtitle="Active vs onboarding vs separated"
      loading={isLoading}
      error={error ? "Failed to load status breakdown." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No status breakdown to show."
    >
      <HorizontalBarList rows={rows} tone={BAR_TONE.slate} />
    </WidgetCard>
  );
}
