import { UserPlus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import {
  BORDER,
  BRAND_RED,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../dashboardConstants";
import { HR_EMPLOYEE_DETAIL } from "../../routes/RouteConstants";
import WidgetCard from "./WidgetCard";

export default function HrPendingOnboardingsWidget() {
  const navigate = useNavigate();
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/pending-onboardings",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const rows = data?.data || [];

  return (
    <WidgetCard
      icon={UserPlus}
      title="Pending onboardings"
      subtitle="Employees still pre-onboarding or awaiting completion"
      loading={isLoading}
      error={error ? "Failed to load pending onboardings." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="Nobody pending — onboarding queue is clear."
      footer={rows.length > 0 ? `${rows.length} pending` : null}
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
                {p.employee_id}
                {p.designation ? ` · ${p.designation}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!p.payroll_ready && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{ color: "#B91C1C", background: "#FEF2F2" }}
                >
                  Payroll blocked
                </span>
              )}
              <ChevronRight size={14} style={{ color: TEXT_SECONDARY }} />
            </div>
          </li>
        ))}
      </ul>
      {rows.length > 6 && (
        <div className="mt-2 text-xs text-right" style={{ color: BRAND_RED }}>
          + {rows.length - 6} more
        </div>
      )}
    </WidgetCard>
  );
}
