import { History } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY, titleCase } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function MyRecentAuditWidget() {
  const { data, isLoading, error } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const rows = data?.data?.recent_audit || [];

  const phraseFor = (a) =>
    titleCase(String(a || "").replace("employee.", "").replace(/_/g, " "));

  return (
    <WidgetCard
      icon={History}
      title="My recent activity"
      subtitle="Last 5 HR actions on your record"
      loading={isLoading}
      error={error ? "Failed to load your activity." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No recent HR activity on your profile."
    >
      <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
        {rows.map((row) => (
          <li key={row.id} className="flex items-start justify-between py-2">
            <div className="flex flex-col min-w-0">
              <span className="text-sm" style={{ color: TEXT_PRIMARY }}>
                {phraseFor(row.action)}
              </span>
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                {row.created_at}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
