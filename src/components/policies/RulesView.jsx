import { useMemo } from "react";
import { Loader2, BookText } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

/**
 * Read-only Rules & Regulations list for a portal. Full-width to match the
 * standard portal page design (the layout's top bar already shows the title).
 * Pass the audience endpoint, e.g. "/core/policies/for-students".
 */
export default function RulesView({ endpoint = "/core/policies/for-students" }) {
  const { data, isLoading } = useGetQuery({ path: endpoint }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];

  const grouped = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const k = r.category || "General";
      (map[k] = map[k] || []).push(r);
    });
    return Object.entries(map);
  }, [rows]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl py-16 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>
        <BookText size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} /> No rules published yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(([category, items]) => (
        <div key={category}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>{category}</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {items.map((r) => (
              <div key={r.policy_uuid} className="bg-white rounded-xl px-4 py-3.5" style={{ border: `1px solid ${BORDER}` }}>
                <div className="text-[13px] font-semibold mb-1" style={{ color: "#0F172A" }}>{r.title}</div>
                <div className="text-[12.5px] leading-relaxed" style={{ color: "#475569" }}>{r.content}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
