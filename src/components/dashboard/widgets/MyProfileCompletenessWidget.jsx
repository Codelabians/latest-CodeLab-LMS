import { Sparkles, IdCard } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function MyProfileCompletenessWidget() {
  const { data, isLoading, error } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const d = data?.data;
  const pct = d?.profile_completeness_pct ?? 0;

  return (
    <WidgetCard
      icon={Sparkles}
      title="Profile completeness"
      subtitle="Fill out your details to unlock onboarding"
      loading={isLoading}
      error={error ? "Failed to load your profile." : null}
      empty={!isLoading && (!d || !d.has_profile)}
      emptyMessage="No employee profile attached to this account."
    >
      {d?.has_profile && (
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold" style={{ color: TEXT_PRIMARY }}>
              {pct}%
            </span>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: TEXT_SECONDARY }}>
              <IdCard size={12} /> {d.employee_id}
            </div>
          </div>
          <div className="relative w-full h-2 overflow-hidden rounded-full" style={{ background: "#F1F5F9" }}>
            <div
              className="absolute top-0 left-0 h-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 80 ? "#15803D" : pct >= 50 ? "#A16207" : "#B91C1C" }}
            />
          </div>
          <ul
            className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t"
            style={{ borderColor: BORDER }}
          >
            <MiniStat label="Status" value={d.employment_status} />
            <MiniStat label="Joining" value={d.joining_date || "—"} />
            <MiniStat label="Probation ends" value={d.probation_end_date || "—"} />
            <MiniStat label="Payroll ready" value={d.payroll_ready ? "Yes" : "No"} />
          </ul>
        </div>
      )}
    </WidgetCard>
  );
}

function MiniStat({ label, value }) {
  return (
    <li className="flex flex-col">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: TEXT_PRIMARY }}>
        {value}
      </span>
    </li>
  );
}
