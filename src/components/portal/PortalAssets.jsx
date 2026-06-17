import { Loader2, Boxes, Laptop } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

const STATUS = {
  issued:   { bg: "#EFF6FF", fg: "#1D4ED8", label: "In your custody" },
  returned: { bg: "#F0FDF4", fg: "#15803D", label: "Returned" },
  lost:     { bg: "#FEF2F2", fg: "#B91C1C", label: "Lost" },
  overdue:  { bg: "#FFFBEB", fg: "#B45309", label: "Overdue" },
};

/**
 * Student self-service — items issued to them (e.g. their laptop). Read-only.
 * The laptop fee itself is shown under Fees; this shows the physical item.
 */
export default function PortalAssets() {
  const { data, isLoading } = useGetQuery({ path: "/student-portal/my-assets" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data?.assets || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Boxes size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>My Items</h1>
      </div>
      <p className="text-[12.5px]" style={{ color: "#94A3B8" }}>Equipment issued to you by the institute. Anything you pay a fee for (like a laptop) is billed under <strong>Fees</strong>.</p>

      {isLoading ? (
        <div className="bg-white rounded-xl p-10 flex items-center justify-center" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>
          <Loader2 size={18} className="animate-spin mr-2" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Laptop size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
          <p className="text-[13px]" style={{ color: "#94A3B8" }}>No items issued to you yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => {
            const s = STATUS[a.status] || { bg: "#F1F5F9", fg: "#475569", label: a.status };
            return (
              <div key={a.uuid} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[14px]" style={{ color: "#0F172A" }}>{a.asset?.name || a.asset?.asset_tag}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                    Tag {a.asset?.asset_tag}
                    {a.assigned_at ? ` · issued ${String(a.assigned_at).slice(0, 10)}` : ""}
                    {a.due_date ? ` · return by ${String(a.due_date).slice(0, 10)}` : ""}
                    {a.returned_at ? ` · returned ${String(a.returned_at).slice(0, 10)}` : ""}
                  </div>
                  {a.remarks && <div className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>{a.remarks}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
