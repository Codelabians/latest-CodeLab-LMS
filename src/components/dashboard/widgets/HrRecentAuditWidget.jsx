import { History } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import {
  BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  titleCase,
} from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

/**
 * Recent HR activity feed across all employees. Reads from
 * /employee/dashboard/recent-audit. Brand-agnostic — the audit log
 * isn't currently scoped per-brand.
 */
export default function HrRecentAuditWidget() {
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/recent-audit",
    params: { limit: 10 },
  });
  const rows = data?.data || [];

  // Map action slugs to a friendly phrase.
  const phraseFor = (action) => {
    const map = {
      "employee.profile_updated":         "updated profile",
      "employee.roles_synced":            "had roles synced",
      "employee.departments_synced":      "had departments synced",
      "employee.services_synced":         "had services synced",
      "employee.offices_synced":          "had offices synced",
      "employee.onboarding_completed":    "completed onboarding",
      "employee.separated":               "was separated",
      "employee.payroll_override_applied": "had payroll override applied",
      "employee.payroll_override_cleared": "had payroll override cleared",
    };
    return map[action] || titleCase(action.replace("employee.", "").replace(/_/g, " "));
  };

  return (
    <WidgetCard
      icon={History}
      title="Recent activity"
      subtitle="Latest HR actions across the company"
      loading={isLoading}
      error={error ? "Failed to load recent activity." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No recent HR activity."
    >
      <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
        {rows.map((row) => {
          const who = row.user
            ? `${row.user.first_name || ""} ${row.user.last_name || ""}`.trim() || row.user.email
            : "—";
          const by = row.performed_by
            ? `${row.performed_by.first_name || ""} ${row.performed_by.last_name || ""}`.trim()
            : null;
          return (
            <li key={row.id} className="flex items-start justify-between py-2.5">
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate" style={{ color: TEXT_PRIMARY }}>
                  <span className="font-semibold">{who}</span>{" "}
                  <span style={{ color: TEXT_SECONDARY }}>{phraseFor(row.action)}</span>
                  {by ? (
                    <span style={{ color: TEXT_MUTED }}>{` by ${by}`}</span>
                  ) : null}
                </span>
                <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                  {row.created_at}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}
