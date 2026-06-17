import { FileText } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

export default function MyDocumentsWidget() {
  const { data, isLoading, error } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const d = data?.data;
  const docs = d?.documents;

  return (
    <WidgetCard
      icon={FileText}
      title="My documents"
      subtitle="Uploaded, verified, and expiring soon"
      loading={isLoading}
      error={error ? "Failed to load your documents." : null}
      empty={!isLoading && (!d?.has_profile || !docs)}
      emptyMessage="No documents uploaded yet."
    >
      {docs && (
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Uploaded" value={docs.total} tone="default" />
          <Tile label="Verified" value={docs.verified} tone="green" />
          <Tile label="Expiring (30d)" value={docs.expiring_soon} tone={docs.expiring_soon > 0 ? "amber" : "default"} />
        </div>
      )}
    </WidgetCard>
  );
}

function Tile({ label, value, tone }) {
  const tones = { default: TEXT_PRIMARY, green: "#15803D", amber: "#A16207" };
  return (
    <div
      className="flex flex-col items-center px-3 py-2 text-center rounded-lg border"
      style={{ borderColor: BORDER }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
        {label}
      </span>
      <span className="text-2xl font-semibold" style={{ color: tones[tone] }}>
        {value ?? 0}
      </span>
    </div>
  );
}
