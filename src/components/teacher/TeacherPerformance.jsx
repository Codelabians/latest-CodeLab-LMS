import { useMemo, useState } from "react";
import { Loader2, Award, Plus, X, Pencil } from "lucide-react";
import { useGetQuery, usePostMutation, usePutMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const GRADES = ["A", "B", "C", "D", "E", "F"];
const GRADE_COLOR = { A: "#15803D", B: "#15803D", C: "#B45309", D: "#B45309", E: "#C90606", F: "#C90606" };

export default function TeacherPerformance() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/student-performances", params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const { data: rosterData } = useGetQuery({ path: "/teacher/attendance-roster" });
  const [editing, setEditing] = useState(null); // perf row or {} for new

  const rows = data?.data || [];
  const students = useMemo(() => {
    const map = {};
    (rosterData?.data || []).forEach((b) => (b.students || []).forEach((s) => { map[s.uuid] = s.name; }));
    return Object.entries(map).map(([uuid, name]) => ({ value: uuid, label: name }));
  }, [rosterData]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}><Plus size={14} /> Add grade</button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>
            <Award size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} /> No performance grades yet.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Student", "Week", "Grade", "Remarks", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{p.student?.name || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>Week {p.week_number}</td>
                  <td className="px-4 py-2.5"><span className="font-bold text-[14px]" style={{ color: GRADE_COLOR[p.grade_status] || "#475569" }}>{p.grade_status || "—"}</span></td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{p.remarks || "—"}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}><Pencil size={12} /> Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <GradeModal perf={editing} students={students} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refetch(); }} />}
    </div>
  );
}

function GradeModal({ perf, students, onClose, onDone }) {
  const isEdit = !!perf.uuid;
  const [post, { isLoading: posting }] = usePostMutation();
  const [put, { isLoading: putting }] = usePutMutation();
  const [f, setF] = useState({
    student_id: perf.student?.uuid || perf.student_id || "",
    week_number: perf.week_number || "",
    grade_status: perf.grade_status || "",
    remarks: perf.remarks || "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const saving = posting || putting;

  const submit = async () => {
    if (!f.student_id) { showToast("Pick a student.", "error"); return; }
    if (!f.week_number) { showToast("Enter the week number.", "error"); return; }
    const body = { student_id: f.student_id, week_number: Number(f.week_number), grade_status: f.grade_status || undefined, remarks: f.remarks || undefined };
    try {
      if (isEdit) await put({ path: `teacher/student-performances/${perf.uuid}`, body }).unwrap();
      else await post({ path: "teacher/student-performances", body }).unwrap();
      showToast(isEdit ? "Grade updated." : "Grade saved.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not save.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Award size={17} /> {isEdit ? "Edit grade" : "Add weekly grade"}</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Student</label>
            {isEdit ? (
              <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" }}>{perf.student?.name || "—"}</div>
            ) : (
              <SearchableSelect options={students} value={f.student_id} onChange={(v) => set("student_id", v)} placeholder="Search student…" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Week</label>
              <input type="number" min="1" max="52" value={f.week_number} onChange={(e) => set("week_number", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Grade</label>
              <select value={f.grade_status} onChange={(e) => set("grade_status", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                <option value="">—</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Remarks</label>
            <textarea value={f.remarks} onChange={(e) => set("remarks", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="Optional" />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 size={15} className="animate-spin" />} {isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
