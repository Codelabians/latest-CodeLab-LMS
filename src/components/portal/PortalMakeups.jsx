import { Loader2, RefreshCw, Info, Video, MapPin } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const STATUS = {
  requested: { bg: "#FFFBEB", fg: "#B45309" },
  scheduled: { bg: "#EFF6FF", fg: "#1D4ED8" },
  completed: { bg: "#F0FDF4", fg: "#15803D" },
  cancelled: { bg: "#F8FAFC", fg: "#94A3B8" },
};

export default function PortalMakeups() {
  const { data, isLoading } = useGetQuery({ path: "/student-portal/makeups", params: { per_page: 100 } });
  const makeups = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-[12px]" style={{ background: "#FEF2F2", color: "#7f1d1d", border: `1px solid #FECACA` }}>
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        <span>Makeup classes for lectures you missed are scheduled by the admin. Requesting a makeup directly from a missed lecture is coming with the course-content view.</span>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : makeups.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>
            <RefreshCw size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
            No makeup classes yet.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Topic", "Scheduled", "Mode", "Status", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {makeups.map((m) => {
                const st = STATUS[m.status] || { bg: "#F8FAFC", fg: "#475569" };
                return (
                  <tr key={m.uuid || m.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5" style={{ color: "#0F172A" }}>{m.topic || "Makeup class"}{m.original_session_date ? <span className="block text-[11px]" style={{ color: "#94A3B8" }}>for {m.original_session_date}</span> : null}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{m.scheduled_date || "—"}{m.scheduled_time ? ` · ${m.scheduled_time}` : ""}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}><span className="inline-flex items-center gap-1">{m.mode === "online" ? <Video size={12} /> : <MapPin size={12} />}{m.mode || "—"}</span></td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: st.bg, color: st.fg }}>{m.status}</span></td>
                    <td className="px-4 py-2.5">{m.meeting_link && m.status === "scheduled" ? <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-[12px] font-semibold" style={{ color: BRAND }}>Join →</a> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
