import { HeartHandshake } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY, BRAND_RED } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();

/**
 * Scholarship / NGO subsidy snapshot — how much fee was waived per program,
 * all-time and this month, plus student counts. Data: the scholarship-programs
 * stats endpoint (sums installments.subsidy_amount per program).
 */
export default function ScholarshipSubsidyWidget() {
  const { data, isLoading, error } = useGetQuery({
    path: "student/scholarship-programs/stats",
  });
  const d = data?.data;
  const programs = d?.programs || [];

  return (
    <WidgetCard
      icon={HeartHandshake}
      title="Scholarship subsidy"
      subtitle="Fee waived per NGO / program"
      loading={isLoading}
      error={error ? "Failed to load subsidy stats." : null}
      empty={!isLoading && !error && programs.length === 0}
    >
      {d && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Tile label="Total waived" value={money(d.total_subsidy)} />
            <Tile label="This month" value={money(d.this_month_subsidy)} />
            <Tile label="Students" value={d.total_students ?? 0} />
          </div>
          <div>
            {programs.map((p) => (
              <div
                key={p.uuid}
                className="flex items-center justify-between py-1.5 text-[12.5px]"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <span style={{ color: TEXT_PRIMARY }}>
                  {p.name}
                  <span style={{ color: TEXT_MUTED }}> · {p.students} student{p.students === 1 ? "" : "s"}</span>
                </span>
                <span className="font-semibold" style={{ color: BRAND_RED }}>{money(p.total_subsidy)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

function Tile({ label, value }) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2 text-center border rounded-lg"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
