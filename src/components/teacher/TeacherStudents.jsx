import { Loader2, Users } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function TeacherStudents() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/teacher-students" });
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const d = data?.data || {};
  const students = d.students || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[13px]" style={{ color: "#475569" }}>
        <Users size={16} style={{ color: BRAND }} /> {d.total_students || students.length} student{(d.total_students || students.length) === 1 ? "" : "s"} across your batches
      </div>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {students.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>No students yet.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Name", "Email", "Contact", "Course", "Batch"].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.student_id || i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: "#0F172A" }}>{s.name}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.email || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.contact || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.course_name || "—"}</td>
                  <td className="px-4 py-2.5" style={{ color: "#475569" }}>{s.batch_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
