import { MapPin } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import { HorizontalBarList } from "./_HorizontalBarList";
import { BAR_TONE } from "./_barTones";
import { titleCase } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function HrHeadcountByOfficeWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/headcount-by-office",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const rows = (data?.data || []).map((r) => ({
    key:      r.slug || String(r.office_id),
    label:    r.name,
    value:    r.count,
    sublabel: [titleCase(r.type), r.city].filter(Boolean).join(" · "),
  }));

  return (
    <WidgetCard
      icon={MapPin}
      title="Headcount by office"
      subtitle="Members per office across HQ, partner sites, and remote"
      loading={isLoading}
      error={error ? "Failed to load office headcount." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No office memberships yet."
    >
      <HorizontalBarList rows={rows} tone={BAR_TONE.blue} />
    </WidgetCard>
  );
}
