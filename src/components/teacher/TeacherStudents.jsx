import { useEffect, useState } from "react";
import { Loader2, Users, ArrowLeftRight, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import PhoneActions from "../ui/PhoneActions";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const PER_PAGE = 25;

export default function TeacherStudents() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useGetQuery({
    path: `/teacher/teacher-students?q=${encodeURIComponent(q)}&page=${page}&per_page=${PER_PAGE}`,
  });
  const { data: batchData } = useGetQuery({ path: "/teacher/my-batches" });
  const [switching, setSwitching] = useState(null); // student row or null
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const d = data?.data || {};
  const students = d.students || [];
  const pg = d.pagination || { page: 1, last_page: 1, total: students.length, per_page: PER_PAGE };
  const myBatches = batchData?.data || [];
  // Only offer switching when the teacher actually has somewhere to move to.
  const canSwitch = myBatches.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "#475569" }}>
          <Users size={16} style={{ color: BRAND }} /> {d.total_students ?? students.length} student{(d.total_students ?? students.length) === 1 ? "" : "s"} across your batches
          {q && <span style={{ color: "#94A3B8" }}>· {pg.total} match{pg.total === 1 ? "" : "es"}</span>}
        </div>
        <div className="relative" style={{ minWidth: 240 }}>
          <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: "#94A3B8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, batch…"
            className="w-full py-2 pl-8 pr-3 rounded-lg text-[13px] outline-none"
            style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}
          />
          {isFetching && <Loader2 size={13} className="absolute -translate-y-1/2 right-3 top-1/2 animate-spin" style={{ color: "#94A3B8" }} />}
        </div>
      </div>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {students.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>{q ? "No students match your search." : "No students yet."}</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Name", "Email", "Contact", "Course", "Batch", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.student_id || i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{s.name}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.email || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.contact ? <PhoneActions number={s.contact} name={s.name} /> : "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.course_name || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.batch_name || "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {canSwitch && (
                      <button
                        onClick={() => setSwitching(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                        style={{ border: `1px solid ${BORDER}`, color: "#475569" }}
                        title="Move this student to another of your batches"
                      >
                        <ArrowLeftRight size={12} /> Switch batch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pg.last_page > 1 && (
        <div className="flex items-center justify-between text-[12px]" style={{ color: "#475569" }}>
          <span>Page {pg.page} of {pg.last_page} · {pg.total} student{pg.total === 1 ? "" : "s"}</span>
          <span className="inline-flex gap-2">
            <button
              disabled={pg.page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
              style={{ border: `1px solid ${BORDER}` }}
            ><ChevronLeft size={13} /> Prev</button>
            <button
              disabled={pg.page >= pg.last_page || isFetching}
              onClick={() => setPage((p) => Math.min(pg.last_page, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
              style={{ border: `1px solid ${BORDER}` }}
            >Next <ChevronRight size={13} /></button>
          </span>
        </div>
      )}

      {switching && (
        <SwitchBatchModal
          student={switching}
          batches={myBatches}
          onClose={() => setSwitching(null)}
          onDone={() => { setSwitching(null); refetch(); }}
        />
      )}
    </div>
  );
}

/*
 * Move a student to another of the teacher's OWN batches. The backend
 * (POST /teacher/teacher-students/{uuid}/switch-batch) verifies both
 * batches belong to the teacher and carries the student's fees over.
 */
function SwitchBatchModal({ student, batches, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [toUuid, setToUuid] = useState("");
  const [note, setNote] = useState("");

  const options = batches.filter((b) => b.batch_uuid !== student.batch_uuid);

  const submit = async () => {
    if (!toUuid) { showToast("Pick the destination batch.", "error"); return; }
    try {
      await post({
        path: `teacher/teacher-students/${student.student_id}/switch-batch`,
        body: {
          to_batch_uuid: toUuid,
          ...(student.batch_uuid ? { from_batch_uuid: student.batch_uuid } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      }).unwrap();
      showToast("Student moved to the new batch.", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not switch the batch.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><ArrowLeftRight size={16} /> Switch batch</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: "#475569" }}>
            Move <b>{student.name}</b>{student.batch_name ? <> from <b>{student.batch_name}</b></> : null} to another of your batches.
            Their fees and history carry over automatically.
          </p>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Destination batch</label>
            <select
              value={toUuid}
              onChange={(e) => setToUuid(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}
            >
              <option value="">Select a batch…</option>
              {options.map((b) => (
                <option key={b.batch_uuid} value={b.batch_uuid}>
                  {b.name}{b.course_name ? ` · ${b.course_name}` : ""}{b.timing ? ` · ${b.timing}` : ""} ({b.students_count} student{b.students_count === 1 ? "" : "s"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is the student moving?"
              maxLength={1000}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}
            />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !toUuid} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: (isLoading || !toUuid) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Move student
          </button>
        </div>
      </div>
    </div>
  );
}
