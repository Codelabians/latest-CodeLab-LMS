import { UserCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import {
  BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../dashboardConstants";
import { HR_EMPLOYEE_DETAIL } from "../../routes/RouteConstants";
import WidgetCard from "./WidgetCard";

export default function HrRecentHiresWidget() {
  const navigate = useNavigate();
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/recent-hires",
    params: { limit: 10, ...(brandIdParam ? { brand_id: brandIdParam } : {}) },
  });
  const rows = data?.data || [];

  return (
    <WidgetCard
      icon={UserCheck}
      title="Recent hires"
      subtitle="Latest joiners across the company"
      loading={isLoading}
      error={error ? "Failed to load recent hires." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No recent hires recorded."
    >
      <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
        {rows.slice(0, 6).map((p) => (
          <li
            key={p.profile_uuid}
            className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-slate-50"
            onClick={() =>
              navigate(HR_EMPLOYEE_DETAIL.replace(":uuid", p.profile_uuid))
            }
          >
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" style={{ color: TEXT_PRIMARY }}>
                {p.full_name}
              </span>
              <span className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                {p.designation || "—"}
                {p.brand?.name ? ` · ${p.brand.name}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>
                {p.joining_date}
              </span>
              {!p.onboarding_completed && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{ color: "#A16207", background: "#FEFCE8" }}
                >
                  Pending
                </span>
              )}
              <ChevronRight size={14} style={{ color: TEXT_SECONDARY }} />
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
