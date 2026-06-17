import { useState } from "react";
import { RefreshCw, Loader2, CalendarPlus, CheckCircle2, XCircle, Video, MapPin, X } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const STATUS = {
  needs_scheduling: { bg: "#FFFBEB", fg: "#B45309", label: "Needs scheduling" },
  scheduled: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Scheduled" },
  completed: { bg: "#F0FDF4", fg: "#15803D", label: "Completed" },
  cancelled: { bg: "#F8FAFC", fg: TEXT_MUTED, label: "Cancelled" },
  no_show: { bg: "#FEF2F2", fg: BRAND, label: "No show" },
};
const FILTERS = ["all", "needs_scheduling", "scheduled", "completed"];

export default function MakeupsPage() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/makeups", params: { per_page: 200 } }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: posting }] = usePostMutation();
  const [filter, setFilter] = useState("needs_scheduling");
  const [scheduleFor, setScheduleFor] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const all = data?.data || [];
  const counts = all.reduce((a, m) => { a[m.status] = (a[m.status] || 0) + 1; return a; }, {});
  const rows = filter === "all" ? all : all.filter((m) => m.status === filter);

  const act = async (m, action, body = {}) => {
    setBusyId(m.id);
    try {
      await post({ path: `/teacher/makeups/${m.id}/${action}`, body }).unwrap();
      showToast(action === "cancel" ? "Makeup cancelled." : "Makeup marked completed.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Action failed.", "error"); }
    finally { setBusyId(null); }
  };

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Makeup Classes</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => {
          const active = filter === f;
          const c = f === "all" ? all.length : (counts[f] || 0);
          return (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize" style={active ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>
              {f.replace(/_/g, " ")} ({c})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No {filter === "all" ? "" : filter.replace(/_/g, " ")} makeups.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr style={{ background: "#F8FAFC", color: TEXT_SECONDARY }}>{["Student", "Teacher", "Topic / missed", "Scheduled", "Mode", "Status", ""].map((h, i) => <th key={i} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((m) => {
                  const st = STATUS[m.status] || { bg: "#F8FAFC", fg: TEXT_SECONDARY, label: m.status };
                  return (
                    <tr key={m.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{m.student?.name || `#${m.student_id}`}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{m.teacher?.name || "—"}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{m.topic || "Makeup"}{m.original_session_date ? <span className="block text-[11px]" style={{ color: TEXT_MUTED }}>missed {m.original_session_date}</span> : null}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{m.scheduled_date ? `${m.scheduled_date}${m.scheduled_time ? ` · ${m.scheduled_time}` : ""}` : "—"}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}><span className="inline-flex items-center gap-1">{m.mode === "online" ? <Video size={12} /> : <MapPin size={12} />}{m.mode || "—"}</span></td>
                      <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {(m.status === "needs_scheduling" || m.status === "scheduled") && (
                          <span className="inline-flex gap-1.5">
                            <button onClick={() => setScheduleFor(m)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: BRAND }}><CalendarPlus size={12} /> {m.status === "scheduled" ? "Reschedule" : "Schedule"}</button>
                            {m.status === "scheduled" && <button onClick={() => act(m, "complete", { attendance_marked: true })} disabled={posting && busyId === m.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: "#15803D" }}><CheckCircle2 size={12} /> Done</button>}
                            <button onClick={() => act(m, "cancel")} disabled={posting && busyId === m.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}><XCircle size={12} /> Cancel</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {scheduleFor && <ScheduleModal makeup={scheduleFor} onClose={() => setScheduleFor(null)} onDone={() => { setScheduleFor(null); refetch(); }} />}
    </div>
  );
}

function ScheduleModal({ makeup, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [f, setF] = useState({
    scheduled_date: makeup.scheduled_date || "",
    scheduled_time: makeup.scheduled_time || "",
    mode: makeup.mode || "in_person",
    meeting_link: makeup.meeting_link || "",
    duration_minutes: makeup.duration_minutes || 60,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.scheduled_date || !f.scheduled_time) { showToast("Pick a date and time.", "error"); return; }
    if (f.mode === "online" && !f.meeting_link) { showToast("Online makeups need a meeting link.", "error"); return; }
    try {
      await post({ path: `/teacher/makeups/${makeup.id}/schedule`, body: { scheduled_date: f.scheduled_date, scheduled_time: f.scheduled_time, mode: f.mode, meeting_link: f.meeting_link || undefined, duration_minutes: Number(f.duration_minutes) || 60 } }).unwrap();
      showToast("Makeup scheduled.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not schedule.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}><CalendarPlus size={17} /> Schedule makeup</span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}><b>{makeup.student?.name}</b> · {makeup.topic}{makeup.teacher?.name ? ` · ${makeup.teacher.name}` : ""}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Date</label>
              <input type="date" value={f.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Time</label>
              <input type="time" value={f.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Mode</label>
              <select value={f.mode} onChange={(e) => set("mode", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                <option value="in_person">In person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Duration (min)</label>
              <input type="number" value={f.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          {f.mode !== "in_person" && (
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Meeting link</label>
              <input value={f.meeting_link} onChange={(e) => set("meeting_link", e.target.value)} placeholder="https://…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          )}
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
