import { useState } from "react";
import { Loader2, BookOpen, CalendarClock, RefreshCw, FileText, CheckCircle2 } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const money = (n) => Number(n || 0);

export default function PortalContent() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/student-portal/content" }, { refetchOnMountOrArgChange: true });
  const [request, { isLoading: requesting }] = usePostMutation();
  const [reqId, setReqId] = useState(null);
  const [tab, setTab] = useState("learned");

  const d = data?.data || {};
  const attended = d.attended || [];
  const missed = d.missed || [];
  const next = d.next;

  const askMakeup = async (lectureId) => {
    setReqId(lectureId);
    try {
      const res = await request({ path: "student-portal/makeups/request", body: { lecture_id: lectureId } }).unwrap();
      showToast(res?.message || "Makeup requested.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not request makeup.", "error"); }
    finally { setReqId(null); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const Tab = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} className="px-4 py-2 rounded-lg text-[12px] font-semibold" style={tab === id ? { background: BRAND, color: "#fff" } : { background: "#fff", color: "#475569", border: `1px solid ${BORDER}` }}>
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Next class */}
      {next && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
          <CalendarClock size={18} style={{ color: BRAND }} />
          <div className="text-[13px]">
            <span className="font-bold" style={{ color: "#0F172A" }}>Next class: </span>
            <span style={{ color: "#475569" }}>W{next.week_number}·L{next.lecture_in_week} — {next.title}</span>
            <span style={{ color: "#94A3B8" }}> · {String(next.session_date).slice(0, 10)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Tab id="learned" label="Learned" count={attended.length} />
        <Tab id="missed" label="Missed" count={missed.length} />
      </div>

      {tab === "learned" && (
        attended.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No lectures attended yet.</div>
        ) : (
          attended.map((l, i) => (
            <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={15} style={{ color: BRAND }} />
                <span className="font-bold text-[14px]" style={{ color: "#0F172A" }}>W{l.week_number}·L{l.lecture_in_week} — {l.title}</span>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>· {String(l.session_date).slice(0, 10)}</span>
              </div>
              <div className="text-[12px] space-y-1.5" style={{ color: "#475569" }}>
                {l.topic && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Topic: </span>{l.topic}</div>}
                {l.objectives && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Objectives: </span>{l.objectives}</div>}
                {l.exercise && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Exercise: </span>{l.exercise}</div>}
                {l.deliverable && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Deliverable: </span>{l.deliverable}</div>}
              </div>
              {(l.assignments || []).length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="text-[11px] font-bold mb-1.5" style={{ color: "#475569" }}>Assignments for this lecture</div>
                  {l.assignments.map((a, j) => (
                    <div key={j} className="flex items-center justify-between text-[12px] py-1">
                      <span className="inline-flex items-center gap-1.5" style={{ color: "#0F172A" }}><FileText size={12} style={{ color: BRAND }} /> {a.title}{a.deadline ? <span style={{ color: "#94A3B8" }}> · due {String(a.deadline).slice(0, 10)}</span> : null}</span>
                      {a.graded ? <span className="font-bold" style={{ color: "#15803D" }}>{money(a.marks)}/{money(a.max_marks)}</span> : <span className="text-[11px]" style={{ color: "#B45309" }}>Not graded</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )
      )}

      {tab === "missed" && (
        missed.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No missed classes. </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[13px]">
              <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Lecture", "Date", "Status", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {missed.map((l, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>W{l.week_number}·L{l.lecture_in_week} — {l.title}</td>
                    <td className="px-4 py-2.5" style={{ color: "#94A3B8" }}>{String(l.session_date).slice(0, 10)}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#FEF2F2", color: BRAND }}>{l.status}</span></td>
                    <td className="px-4 py-2.5 text-right">
                      {l.makeup_status ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold capitalize" style={{ color: "#15803D" }}><CheckCircle2 size={12} /> Makeup {String(l.makeup_status).replace(/_/g, " ")}</span>
                      ) : (
                        <button onClick={() => askMakeup(l.lecture_id)} disabled={requesting && reqId === l.lecture_id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: BRAND, opacity: requesting && reqId === l.lecture_id ? 0.6 : 1 }}>
                          <RefreshCw size={12} /> Request makeup
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
