import { Wallet } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import {
  BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  titleCase,
} from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function HrPayrollReadinessWidget() {
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/hr-summary",
    params: brandIdParam ? { brand_id: brandIdParam } : undefined,
  });
  const d = data?.data;
  const ready = d?.payroll_ready ?? 0;
  const blocked = d?.payroll_blocked ?? 0;
  const total = ready + blocked;
  const pct = total > 0 ? Math.round((ready / total) * 100) : 0;
  const blockers = d?.top_blocker_codes || [];

  return (
    <WidgetCard
      icon={Wallet}
      title="Payroll readiness"
      subtitle="Share of employees clear for the next payroll run"
      loading={isLoading}
      error={error ? "Failed to load payroll readiness." : null}
      empty={!isLoading && !d}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
              {pct}%
            </span>
            <span className="ml-2 text-[11px]" style={{ color: TEXT_MUTED }}>
              ready
            </span>
          </div>
          <div className="text-right text-[11px]" style={{ color: TEXT_SECONDARY }}>
            <div>
              <span className="font-semibold" style={{ color: "#15803D" }}>{ready}</span> ready
            </div>
            <div>
              <span className="font-semibold" style={{ color: "#B91C1C" }}>{blocked}</span> blocked
            </div>
          </div>
        </div>
        <div className="relative w-full h-2 overflow-hidden rounded-full" style={{ background: "#FEE2E2" }}>
          <div
            className="absolute top-0 left-0 h-full transition-all"
            style={{ width: `${pct}%`, background: "#15803D" }}
          />
        </div>

        {blockers.length > 0 && (
          <div
            className="mt-2 pt-3 border-t flex flex-col gap-1.5"
            style={{ borderColor: BORDER }}
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
              Top blockers
            </span>
            <ul className="flex flex-col gap-1">
              {blockers.slice(0, 4).map((b) => (
                <li key={b.code} className="flex items-center justify-between text-[11.5px]">
                  <span style={{ color: TEXT_PRIMARY }}>{titleCase(b.code)}</span>
                  <span className="font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
                    {b.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
