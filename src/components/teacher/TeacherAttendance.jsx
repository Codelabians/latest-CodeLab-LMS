import { useEffect, useMemo, useState } from "react";
import { Loader2, ClipboardCheck, CheckCircle2, XCircle, CalendarOff } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import AttendanceRegisterGrid from "../ui/AttendanceRegisterGrid";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const today = () => new Date().toISOString().slice(0, 10);

// Stored attendance values are capitalized (PresentStatus enum).
const OPTIONS = [
  { value: "Present", label: "Present", icon: CheckCircle2, color: "#15803D" },
  { value: "Absent", label: "Absent", icon: XCircle, color: BRAND },
  { value: "Leave", label: "Leave", icon: CalendarOff, color: "#B45309" },
];

export default function TeacherAttendance() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/attendance-roster" });
  const [post, { isLoading: saving }] = usePostMutation();

  const batches = useMemo(() => data?.data || [], [data]);
  const [batchId, setBatchId] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState({}); // { studentId: status }

  const batch = batches.find((b) => String(b.batch_id) === String(batchId));

  // Lectures (curriculum) for the chosen batch — the teacher picks which
  // lecture today's class covers; saving creates the session for it.
  const { data: lecData } = useGetQuery(
    { path: `/teacher/batches/${batch?.batch_uuid}/lectures` },
    { skip: !batch?.batch_uuid },
  );
  const lectures = useMemo(() => lecData?.data?.lectures || [], [lecData]);
  const lectureOptions = lectures.map((l) => ({
    value: String(l.id),
    label: `W${l.week_number}·L${l.lecture_in_week} — ${l.title}${l.done ? " ✓" : ""}`,
  }));

  // Attendance register for the selected batch (held classes × students).
  // Declared before the effects below that read it.
  const { data: regData, refetch: refetchRegister } = useGetQuery(
    { path: `/teacher/batches/${batch?.batch_uuid}/attendance` },
    { skip: !batch?.batch_uuid, refetchOnMountOrArgChange: true },
  );
  // Default to the next not-yet-taught lecture.
  useEffect(() => {
    if (!lectures.length) { setLectureId(""); return; }
    const next = lectures.find((l) => !l.done) || lectures[0];
    setLectureId(String(next.id));
  }, [lectures]);

  // Default-select the first batch + default everyone Present.
  useEffect(() => {
    if (batches.length && !batchId) setBatchId(String(batches[0].batch_id));
  }, [batches, batchId]);
  // If the picked date already had a class, jump the lecture picker to that
  // day's lecture so reviewing a past date shows the right class.
  useEffect(() => {
    const sessions = regData?.data?.sessions || [];
    const onDate = sessions.find((s) => String(s.date).slice(0, 10) === date);
    if (onDate && String(onDate.lecture_id) !== String(lectureId)) {
      setLectureId(String(onDate.lecture_id));
    }
  }, [date, regData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill the marks for the chosen batch+lecture+date. If that class
  // was already marked, load the saved statuses (so you can review/edit a
  // past date); otherwise default everyone to Present.
  useEffect(() => {
    if (!batch) return;
    const init = {};
    batch.students.forEach((s) => { init[s.id] = "Present"; });

    const sessions = regData?.data?.sessions || [];
    const students = regData?.data?.students || [];
    const match = sessions.find(
      (s) => String(s.date).slice(0, 10) === date && String(s.lecture_id) === String(lectureId),
    );
    if (match) {
      students.forEach((st) => {
        if (st.statuses && st.statuses[match.session_id]) init[st.student_id] = st.statuses[match.session_id];
      });
    }
    setMarks(init);
  }, [batchId, date, lectureId, regData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAll = (status) => {
    if (!batch) return;
    const m = {};
    batch.students.forEach((s) => { m[s.id] = status; });
    setMarks(m);
  };

  const submit = async () => {
    if (!batch) { showToast("Pick a batch.", "error"); return; }
    if (!lectureId) { showToast("Pick the lecture for today's class.", "error"); return; }
    if (!batch.students.length) { showToast("This batch has no students.", "error"); return; }
    const students = batch.students.map((s) => ({ id: s.id, present_status: marks[s.id] || "Present" }));
    try {
      await post({ path: "teacher/mark-attendance", body: { date, batch_id: batch.batch_id, lecture_id: Number(lectureId), students } }).unwrap();
      showToast("Attendance saved — class recorded for this lecture.", "success");
      refetchRegister();
    } catch (e) {
      showToast(e?.data?.message || "Could not save attendance.", "error");
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-end gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <div>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Batch</label>
          <div style={{ minWidth: 220 }}>
            <SearchableSelect
              options={batches.map((b) => ({ value: String(b.batch_id), label: `${b.name}${b.timing ? ` · ${b.timing}` : ""}` }))}
              value={batchId ? String(batchId) : ""}
              onChange={(v) => setBatchId(v || "")}
              placeholder={batches.length ? "Search batch…" : "No batches"} />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
        </div>
        <div style={{ minWidth: 280 }}>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Today&apos;s lecture</label>
          <SearchableSelect options={lectureOptions} value={lectureId} onChange={setLectureId} placeholder="Search lecture…" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "#94A3B8" }}>Mark all:</span>
          {OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setAll(o.value)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: o.color }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {!batch || batch.students.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>{batch ? "No students in this batch." : "Select a batch."}</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}><th className="px-4 py-2.5 text-left font-semibold text-[11px]">Student</th><th className="px-4 py-2.5 text-left font-semibold text-[11px]">Status</th></tr></thead>
            <tbody>
              {batch.students.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{s.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex gap-1.5">
                      {OPTIONS.map((o) => {
                        const active = (marks[s.id] || "Present") === o.value;
                        return (
                          <button key={o.value} onClick={() => setMarks((m) => ({ ...m, [s.id]: o.value }))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={active ? { background: o.color, color: "#fff" } : { border: `1px solid ${BORDER}`, color: "#475569" }}>
                            <o.icon size={12} /> {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={submit} disabled={saving || !batch} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: saving || !batch ? 0.6 : 1 }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <ClipboardCheck size={15} />} Save attendance
        </button>
      </div>

      {/* Attendance register for this batch (held classes × students) */}
      {batch && (
        <div className="pt-2">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>Attendance register — {batch.name}</h3>
          <AttendanceRegisterGrid data={regData?.data} />
        </div>
      )}
    </div>
  );
}
