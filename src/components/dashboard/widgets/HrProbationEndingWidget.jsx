import { ShieldAlert, ChevronRight } from "lucide-react";
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

export default function HrProbationEndingWidget() {
  const navigate = useNavigate();
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/probation-ending",
    params: { within_days: 7, ...(brandIdParam ? { brand_id: brandIdParam } : {}) },
  });
  const rows = data?.data || [];

  return (
    <WidgetCard
      icon={ShieldAlert}
      title="Probation ending soon"
      subtitle="Probationers within the next 7 days"
      loading={isLoading}
      error={error ? "Failed to load probationers." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No probationers ending this week."
    >
      <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
        {rows.slice(0, 6).map((p) => {
          const days = typeof p.days_until === "number" ? p.days_until : null;
          const dayTone =
            days === null ? "default"
              : days <= 1 ? "red"
                : days <= 3 ? "amber"
                  : "green";
          const toneColors = {
            default: TEXT_SECONDARY,
            red:     "#B91C1C",
            amber:   "#A16207",
            green:   "#15803D",
          };
          return (
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
                  Ends {p.probation_end_date}
                  {p.designation ? ` · ${p.designation}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{ color: toneColors[dayTone], background: "#F8FAFC" }}
                >
                  {days === null ? "—" : days <= 0 ? "today" : `${days}d`}
                </span>
                <ChevronRight size={14} style={{ color: TEXT_SECONDARY }} />
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}
