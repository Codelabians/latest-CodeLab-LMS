import { Network } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { HorizontalBarList } from "./_HorizontalBarList";
import { BAR_TONE } from "./_barTones";
import WidgetCard from "./WidgetCard";

export default function HrHeadcountByDepartmentWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/headcount-by-department",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const rows = (data?.data || []).map((r) => ({
    key:    r.slug || String(r.department_id),
    label:  r.name,
    value:  r.count,
  }));

  return (
    <WidgetCard
      icon={Network}
      title="Headcount by department"
      subtitle="Members per department (multi-dept users counted once per)"
      loading={isLoading}
      error={error ? "Failed to load department headcount." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No department memberships yet."
    >
      <HorizontalBarList rows={rows} tone={BAR_TONE.brand} />
    </WidgetCard>
  );
}
