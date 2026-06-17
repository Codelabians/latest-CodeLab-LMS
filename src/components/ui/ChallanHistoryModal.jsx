import { X, Loader2, Send, MessageCircle, Mail } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const AMBER = "#B45309";

/**
 * Shows the challan send history (channels + resend reason + who/when) for an
 * inquiry or visitor. `type` is "inquiry" | "visitor".
 */
export default function ChallanHistoryModal({ open, type, id, name, onClose }) {
  const { data, isFetching } = useGetQuery(
    { path: `student/challan-logs/${type}/${id}` },
    { skip: !open || !id, refetchOnMountOrArgChange: true }
  );
  const logs = data?.data || [];

  const rs = (v) => (v === null || v === undefined ? null : `Rs. ${Number(v).toLocaleString()}`);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[85vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#FFFBEB", color: AMBER }}><Send size={16} /></span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Challan history</h3>
              {name && <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {isFetching ? (
          <div className="py-10 text-center"><Loader2 size={18} className="animate-spin inline" style={{ color: TEXT_MUTED }} /></div>
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No challan has been sent yet.</p>
        ) : (
          <div className="space-y-2.5">
            {logs.map((l, i) => (
              <div key={i} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${BORDER}`, background: "#F8FAFC" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {l.channels?.includes("WhatsApp") && <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: "#15803D" }}><MessageCircle size={12} /> WhatsApp</span>}
                    {l.channels?.includes("Email") && <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: "#1D4ED8" }}><Mail size={12} /> Email</span>}
                    {(!l.channels || l.channels.length === 0) && <span className="text-[11px]" style={{ color: TEXT_MUTED }}>—</span>}
                  </div>
                  <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{l.sent_at}</span>
                </div>
                {l.course_name && (
                  <div className="mt-1.5 text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>{l.course_name}</div>
                )}
                {(l.net_enrollment !== null || l.net_monthly !== null || l.total_due_now !== null) && (
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]" style={{ color: TEXT_SECONDARY }}>
                    {l.net_enrollment !== null && (
                      <div>Enrollment: <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{rs(l.net_enrollment)}</span></div>
                    )}
                    {l.net_monthly !== null && (
                      <div>Monthly: <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{rs(l.net_monthly)}</span></div>
                    )}
                    {l.total_due_now !== null && (
                      <div className="col-span-2">Due now: <span className="font-semibold" style={{ color: "#15803D" }}>{rs(l.total_due_now)}</span>{l.has_laptop ? " (incl. laptop)" : ""}</div>
                    )}
                  </div>
                )}
                {(Number(l.enrollment_discount) > 0 || Number(l.monthly_discount) > 0) && (
                  <div className="mt-1 text-[11px]" style={{ color: AMBER }}>
                    Discount offered:
                    {Number(l.enrollment_discount) > 0 ? ` ${rs(l.enrollment_discount)} enrollment` : ""}
                    {Number(l.enrollment_discount) > 0 && Number(l.monthly_discount) > 0 ? " +" : ""}
                    {Number(l.monthly_discount) > 0 ? ` ${rs(l.monthly_discount)} monthly` : ""}
                  </div>
                )}
                {l.reason && (
                  <div className="mt-1.5 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                    <span className="font-semibold" style={{ color: AMBER }}>Reason:</span> {l.reason}
                  </div>
                )}
                {l.sent_by && <div className="mt-0.5 text-[11px]" style={{ color: TEXT_MUTED }}>by {l.sent_by}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
