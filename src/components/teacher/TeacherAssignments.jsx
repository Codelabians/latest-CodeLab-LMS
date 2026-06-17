import { useEffect, useState } from "react";
import { Loader2, Plus, X, FileText, GraduationCap, ExternalLink, Pencil, Trash2, Link2 } from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function TeacherAssignments() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/my-assignments" }, { refetchOnMountOrArgChange: true });
  const [showCreate, setShowCreate] = useState(false);
  const [gradeFor, setGradeFor] = useState(null);
  const [editFor, setEditFor] = useState(null);
  const [del, { isLoading: deleting }] = useDeleteMutation();
  const [busyId, setBusyId] = useState(null);

  const items = data?.data || [];

  const removeAssignment = async (a) => {
    if (!window.confirm(`Delete assignment "${a.title}"? This removes its grades too.`)) return;
    setBusyId(a.assignments_uuid);
    try {
      await del({ path: `teacher/assignments/${a.assignments_uuid}` }).unwrap();
      showToast("Assignment deleted.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not delete.", "error"); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}><Plus size={14} /> New assignment</button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>
            <FileText size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} /> No assignments yet — create one.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Title", "Batch", "Lecture", "Deadline", "Graded", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.assignments_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{a.title}{a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex" style={{ color: BRAND }}><ExternalLink size={12} /></a> : null}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{a.batch || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{a.lecture || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#94A3B8" }}>{(a.deadline || "").slice(0, 10) || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{a.graded_count}/{a.student_count}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <span className="inline-flex gap-1.5">
                      <button onClick={() => setGradeFor(a)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: "#15803D" }}><GraduationCap size={12} /> Grade</button>
                      <button onClick={() => setEditFor(a)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}><Pencil size={12} /> Edit</button>
                      <button onClick={() => removeAssignment(a)} disabled={deleting && busyId === a.assignments_uuid} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={12} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateAssignmentModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); refetch(); }} />}
      {editFor && <EditAssignmentModal assignment={editFor} onClose={() => setEditFor(null)} onDone={() => { setEditFor(null); refetch(); }} />}
      {gradeFor && <GradeModal assignment={gradeFor} onClose={() => setGradeFor(null)} onDone={() => { setGradeFor(null); refetch(); }} />}
    </div>
  );
}

function CreateAssignmentModal({ onClose, onDone }) {
  const { data: rosterData } = useGetQuery({ path: "/teacher/attendance-roster" });
  const batches = rosterData?.data || [];
  const [post, { isLoading }] = usePostMutation();
  const [f, setF] = useState({ batch_uuid: "", lecture_id: "", title: "", description: "", deadline: "", url: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { if (batches.length && !f.batch_uuid) set("batch_uuid", batches[0].batch_uuid); }, [batches]); // eslint-disable-line react-hooks/exhaustive-deps

  const batch = batches.find((b) => b.batch_uuid === f.batch_uuid);
  const { data: lecData } = useGetQuery(
    { path: `/teacher/batches/${f.batch_uuid}/lectures` },
    { skip: !f.batch_uuid, refetchOnMountOrArgChange: true },
  );
  const lectures = lecData?.data?.lectures || [];

  const submit = async () => {
    const missing = [];
    if (!batch) missing.push("batch");
    if (!f.lecture_id) missing.push("lecture");
    if (!f.title.trim()) missing.push("title");
    if (!f.deadline) missing.push("deadline");
    if (missing.length) { showToast(`Please fill: ${missing.join(", ")}.`, "error"); return; }
    try {
      await post({ path: "teacher/assignments", body: { batch_id: batch.batch_id, lecture_id: Number(f.lecture_id), title: f.title, description: f.description || undefined, deadline: f.deadline, url: f.url || undefined } }).unwrap();
      showToast("Assignment created.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not create assignment.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><FileText size={17} /> New assignment</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Batch</label>
            <SearchableSelect
              options={batches.map((b) => ({ value: b.batch_uuid, label: b.name }))}
              value={f.batch_uuid || ""}
              onChange={(v) => { set("batch_uuid", v || ""); set("lecture_id", ""); }}
              placeholder={batches.length ? "Search batch…" : "No batches"} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Lecture <span style={{ color: "#94A3B8" }}>(only classes already held)</span></label>
            <SearchableSelect
              options={lectures.filter((l) => l.done).map((l) => ({ value: String(l.id), label: `W${l.week_number}·L${l.lecture_in_week} — ${l.title}${l.session_date ? ` · ${String(l.session_date).slice(0, 10)}` : ""}` }))}
              value={f.lecture_id}
              onChange={(v) => set("lecture_id", v)}
              placeholder="Search a held lecture…"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Title</label>
            <input value={f.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="e.g. Build a todo app" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Description</label>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="What to do…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Deadline</label>
              <input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Resource URL (optional)</label>
              <input value={f.url} onChange={(e) => set("url", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="https://…" />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2 sticky bottom-0 bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Create
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAssignmentModal({ assignment, onClose, onDone }) {
  const [patch, { isLoading }] = usePatchMutation();
  const [f, setF] = useState({
    title: assignment.title || "",
    description: assignment.description || "",
    deadline: assignment.deadline ? String(assignment.deadline).slice(0, 10) : "",
    url: assignment.url || "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };

  const submit = async () => {
    if (!f.title.trim() || !f.deadline) { showToast("Title and deadline are required.", "error"); return; }
    try {
      await patch({ path: `teacher/assignments/${assignment.assignments_uuid}`, body: { title: f.title, description: f.description || undefined, deadline: f.deadline, url: f.url || undefined } }).unwrap();
      showToast("Assignment updated.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not update.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Pencil size={16} /> Edit assignment</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div><label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Title</label><input value={f.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} /></div>
          <div><label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Description</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Deadline</label><input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} /></div>
            <div><label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Resource URL</label><input value={f.url} onChange={(e) => set("url", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="https://…" /></div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>{isLoading && <Loader2 size={15} className="animate-spin" />} Update</button>
        </div>
      </div>
    </div>
  );
}

function GradeModal({ assignment, onClose, onDone }) {
  const { data, isLoading, refetch } = useGetQuery({ path: `/teacher/assignments/${assignment.assignments_uuid}/marks` }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: saving }] = usePostMutation();
  const [savingId, setSavingId] = useState(null);
  const [edits, setEdits] = useState({});
  const students = data?.data?.students || [];

  const fieldFor = (s, k, dflt) => {
    const e = edits[s.student_id] || {};
    return e[k] !== undefined ? e[k] : (s[k] != null ? s[k] : dflt);
  };
  const setField = (sid, k, v) => setEdits((p) => ({ ...p, [sid]: { ...(p[sid] || {}), [k]: v } }));

  const save = async (s) => {
    const marks = fieldFor(s, "marks", "");
    if (marks === "" || marks == null) { showToast("Enter marks.", "error"); return; }
    setSavingId(s.student_id);
    try {
      await post({ path: `teacher/assignments/${assignment.assignments_uuid}/grade`, body: { student_id: s.student_id, marks: Number(marks), max_marks: Number(fieldFor(s, "max_marks", 100)), feedback: fieldFor(s, "feedback", "") || undefined } }).unwrap();
      showToast(`Saved ${s.name}.`, "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not save.", "error"); }
    finally { setSavingId(null); }
  };

  const cell = { background: "#fff", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><GraduationCap size={17} /> Grade — {assignment.title}</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-[13px]" style={{ color: "#94A3B8" }}>No students in this batch.</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead><tr style={{ color: "#475569" }}>{["Student", "Marks", "Out of", "Feedback", ""].map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-2 py-2 font-semibold" style={{ color: "#0F172A" }}>
                      {s.name}{s.graded ? <span className="ml-1 text-[10px] font-semibold" style={{ color: "#15803D" }}>✓</span> : null}
                      {s.submission_link ? <a href={s.submission_link} target="_blank" rel="noreferrer" className="block text-[10px] font-semibold inline-flex items-center gap-0.5" style={{ color: BRAND }}><Link2 size={10} /> view work</a> : <span className="block text-[10px]" style={{ color: "#CBD5E1" }}>no submission</span>}
                    </td>
                    <td className="px-2 py-2"><input type="number" value={fieldFor(s, "marks", "")} onChange={(e) => setField(s.student_id, "marks", e.target.value)} className="w-16 px-2 py-1 rounded-md text-[12px] outline-none" style={cell} /></td>
                    <td className="px-2 py-2"><input type="number" value={fieldFor(s, "max_marks", 100)} onChange={(e) => setField(s.student_id, "max_marks", e.target.value)} className="w-16 px-2 py-1 rounded-md text-[12px] outline-none" style={cell} /></td>
                    <td className="px-2 py-2"><input value={fieldFor(s, "feedback", "")} onChange={(e) => setField(s.student_id, "feedback", e.target.value)} className="w-full px-2 py-1 rounded-md text-[12px] outline-none" style={cell} placeholder="optional" /></td>
                    <td className="px-2 py-2 text-right"><button onClick={() => save(s)} disabled={saving && savingId === s.student_id} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: BRAND, opacity: saving && savingId === s.student_id ? 0.6 : 1 }}>Save</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-4 flex justify-end sticky bottom-0 bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onDone} className="px-5 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Done</button>
        </div>
      </div>
    </div>
  );
}
