import { FileWarning, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../useDashboardContext";
import {
  BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  titleCase,
} from "../dashboardConstants";
import { HR_EMPLOYEE_DETAIL } from "../../routes/RouteConstants";
import WidgetCard from "./WidgetCard";

export default function HrDocumentExpiriesWidget() {
  const navigate = useNavigate();
  const { brandIdParam } = useDashboardContext();
  const { data, isLoading, error } = useGetQuery({
    path: "employee/dashboard/document-expiries",
    params: { within_days: 30, ...(brandIdParam ? { brand_id: brandIdParam } : {}) },
  });
  const rows = data?.data || [];

  return (
    <WidgetCard
      icon={FileWarning}
      title="Document expiries (30 days)"
      subtitle="CNICs, passports, visas, and other expiring docs"
      loading={isLoading}
      error={error ? "Failed to load document expiries." : null}
      empty={!isLoading && rows.length === 0}
      emptyMessage="No expiring documents in the next 30 days."
      footer={rows.length > 6 ? `+${rows.length - 6} more` : null}
    >
      <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
        {rows.slice(0, 6).map((row) => {
          const days = typeof row.days_until === "number" ? row.days_until : null;
          const tone =
            days === null ? TEXT_SECONDARY
              : days <= 7 ? "#B91C1C"
                : days <= 14 ? "#A16207"
                  : "#475569";
          return (
            <li
              key={row.document_uuid || `${row.doc_type}-${row.expiry_date}`}
              className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-slate-50"
              onClick={() => {
                const uuid = row.employee?.profile_uuid;
                if (uuid) navigate(HR_EMPLOYEE_DETAIL.replace(":uuid", uuid));
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: TEXT_PRIMARY }}>
                  {row.employee?.full_name || "Unknown"}
                </span>
                <span className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                  {titleCase(row.doc_type)} expires {row.expiry_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{ color: tone, background: "#F8FAFC" }}
                >
                  {days === null ? "—" : days <= 0 ? "expired" : `${days}d`}
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
