import React from "react";
import { Globe, Building2, Wifi, Presentation, GraduationCap, Users } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND_RED = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";

/** Compact funnel stats strip: where leads come from + intent. */
export default function LeadStatsStrip() {
  const { data } = useGetQuery({ path: "/lead-stats" }, { refetchOnMountOrArgChange: true });
  const d = data?.data;
  if (!d) return null;

  const cards = [
    { icon: Globe, label: "Website inquiries", value: d.inquiries?.website ?? 0, tint: "#EFF6FF", fg: "#1D4ED8" },
    { icon: Building2, label: "In-house inquiries", value: d.inquiries?.in_house ?? 0, tint: "#F5F3FF", fg: "#7C3AED" },
    { icon: Wifi, label: "Website visitors", value: d.visitors?.website ?? 0, tint: "#F0FDF4", fg: "#15803D" },
    { icon: GraduationCap, label: "Want to enroll", value: d.intent?.enroll ?? 0, tint: "#FEF2F2", fg: BRAND_RED },
    { icon: Users, label: "Free demo", value: d.intent?.demo ?? 0, tint: "#FFFBEB", fg: "#B45309" },
    { icon: Presentation, label: "Seminar", value: d.intent?.seminar ?? 0, tint: "#F1F5F9", fg: TEXT_PRIMARY },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 lg:grid-cols-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="flex items-center gap-3 px-3 py-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
            <span className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: c.tint, color: c.fg }}>
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-[18px] font-bold leading-none" style={{ color: TEXT_PRIMARY }}>{c.value}</div>
              <div className="text-[11px] mt-1 truncate" style={{ color: TEXT_MUTED }}>{c.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
