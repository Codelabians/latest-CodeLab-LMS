import { Boxes } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { HorizontalBarList } from "./_HorizontalBarList";
import { BAR_TONE } from "./_barTones";
import WidgetCard from "./WidgetCard";

export default function OrgBrandSplitWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/org-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const rows = (data?.data?.brand_split || []).map((b) => ({
    key:   b.brand_slug || String(b.brand_id),
    label: b.brand_name,
    value: b.count,
  }));

  return (
    <WidgetCard
      icon={Boxes}
      title="Employees by brand"
      subtitle="Split across Codelab brands"
      loading={isLoading}
      error={error ? "Failed to load brand split." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No employees recorded yet."
    >
      <HorizontalBarList rows={rows} tone={BAR_TONE.brand} />
    </WidgetCard>
  );
}
