import { Loader2, Megaphone, Sparkles } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BORDER = "#EEF2F6";

const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch { return String(d).slice(0, 10); }
};
const isRecent = (d) => {
  if (!d) return false;
  const diff = (Date.now() - new Date(d).getTime()) / 86400000;
  return diff >= 0 && diff <= 3;
};

/**
 * Shared announcements feed for the student & teacher portals. The backend
 * already filters by the logged-in audience, so this just renders whatever
 * the given endpoint returns.
 */
export default function AnnouncementsFeed({ path }) {
  const { data, isLoading } = useGetQuery({ path }, { refetchOnMountOrArgChange: true });
  const items = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center" style={{ border: `1px solid ${BORDER}` }}>
        <span className="grid place-items-center mx-auto mb-3 rounded-2xl" style={{ width: 56, height: 56, background: "#FEF2F2", color: BRAND }}>
          <Megaphone size={26} />
        </span>
        <p className="text-[14px] font-semibold" style={{ color: "#0F172A" }}>No announcements yet</p>
        <p className="text-[12px] mt-1" style={{ color: "#94A3B8" }}>New updates from TechSchool will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.map((a, i) => {
        const img = a.image?.file_url || a.image?.url || null;
        const recent = isRecent(a.created_at);
        return (
          <div
            key={a.announcement_uuid || i}
            className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <div className="flex">
              {/* Brand accent rail */}
              <div style={{ width: 5, background: `linear-gradient(180deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                {img && <img src={img} alt="" className="w-full h-44 object-cover" />}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center flex-shrink-0 rounded-xl" style={{ width: 38, height: 38, background: "#FEF2F2", color: BRAND }}>
                      <Megaphone size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-[15px] leading-snug" style={{ color: "#0F172A" }}>{a.title}</h3>
                        {recent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: "#FEF3C7", color: "#B45309" }}>
                            <Sparkles size={10} /> New
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] mt-1.5 whitespace-pre-line leading-relaxed" style={{ color: "#475569" }}>{a.description}</p>
                      {a.created_at && (
                        <div className="mt-3 pt-2.5 text-[11px] font-medium" style={{ color: "#94A3B8", borderTop: `1px solid ${BORDER}` }}>
                          {fmtDate(a.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
