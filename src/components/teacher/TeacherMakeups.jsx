import { useState } from "react";
import { Loader2, RefreshCw, Video, MapPin, CalendarPlus, CheckCircle2, X } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const STATUS = {
  needs_scheduling: { bg: "#FFFBEB", fg: "#B45309", label: "Needs scheduling" },
  scheduled: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Scheduled" },
  completed: { bg: "#F0FDF4", fg: "#15803D", label: "Completed" },
  cancelled: { bg: "#F8FAFC", fg: "#94A3B8", label: "Cancelled" },
  no_show: { bg: "#FEF2F2", fg: BRAND, label: "No show" },
};

export default function TeacherMakeups() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/my-makeups" }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: posting }] = usePostMutation();
  const [scheduleFor, setScheduleFor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const makeups = data?.data || [];

  const complete = async (m) => {
    setBusyId(m.uuid);
    try {
      await post({ path: `teacher/my-makeups/${m.uuid}/complete`, body: {} }).unwrap();
      showToast("Makeup marked completed.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not update.", "error"); }
    finally { setBusyId(null); }
  };

  const requests = makeups.filter((m) => m.status === "needs_scheduling");

  return (
    <div className="space-y-4">
      {requests.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-[12px]" style={{ background: "#FFFBEB", color: "#92400e", border: "1px solid #FDE68A" }}>
          <RefreshCw size={15} className="mt-0.5 flex-shrink-0" />
          <span>{requests.length} makeup request{requests.length === 1 ? "" : "s"} need scheduling.</span>
        </div>
      )}

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : makeups.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>
            <RefreshCw size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} /> No makeup classes.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Student", "Topic / missed", "Scheduled", "Mode", "Status", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {makeups.map((m) => {
                const st = STATUS[m.status] || { bg: "#F8FAFC", fg: "#475569", label: m.status };
                return (
                  <tr key={m.uuid || m.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{m.student?.name || "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{m.topic || "Makeup"}{m.original_session_date ? <span className="block text-[11px]" style={{ color: "#94A3B8" }}>missed {m.original_session_date}</span> : null}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{m.scheduled_date ? `${m.scheduled_date}${m.scheduled_time ? ` · ${m.scheduled_time}` : ""}` : "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}><span className="inline-flex items-center gap-1">{m.mode === "online" ? <Video size={12} /> : <MapPin size={12} />}{m.mode || "—"}</span></td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {m.status === "needs_scheduling" && (
                        <button onClick={() => setScheduleFor(m)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: BRAND }}><CalendarPlus size={12} /> Schedule</button>
                      )}
                      {m.status === "scheduled" && (
                        <span className="inline-flex gap-1.5">
                          <button onClick={() => setScheduleFor(m)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Reschedule</button>
                          <button onClick={() => complete(m)} disabled={posting && busyId === m.uuid} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: "#15803D" }}><CheckCircle2 size={12} /> Mark done</button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      await post({ path: `teacher/my-makeups/${makeup.uuid}/schedule`, body: { scheduled_date: f.scheduled_date, scheduled_time: f.scheduled_time, mode: f.mode, meeting_link: f.meeting_link || undefined, duration_minutes: Number(f.duration_minutes) || 60 } }).unwrap();
      showToast("Makeup scheduled.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not schedule.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><CalendarPlus size={17} /> Schedule makeup</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-[12px]" style={{ color: "#475569" }}><b>{makeup.student?.name}</b> · {makeup.topic}</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Date</label>
              <input type="date" value={f.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Time</label>
              <input type="time" value={f.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Mode</label>
              <select value={f.mode} onChange={(e) => set("mode", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                <option value="in_person">In person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Duration (min)</label>
              <input type="number" value={f.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          {f.mode !== "in_person" && (
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Meeting link</label>
              <input value={f.meeting_link} onChange={(e) => set("meeting_link", e.target.value)} placeholder="https://…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          )}
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
