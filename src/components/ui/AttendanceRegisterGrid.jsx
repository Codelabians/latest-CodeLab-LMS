const BRAND = "#C90606";
const BORDER = "#EEF2F6";

// Compact status cell: P (green) / A (red) / L (amber) / — (none).
const CELL = {
  Present: { t: "P", bg: "#F0FDF4", fg: "#15803D" },
  Absent: { t: "A", bg: "#FEF2F2", fg: BRAND },
  Leave: { t: "L", bg: "#FFFBEB", fg: "#B45309" },
};

/**
 * Batch attendance register: students (rows) × held classes (columns).
 * Expects { sessions:[{session_id,date,lecture}], students:[{student_id,name,statuses,present,absent,leave,percentage}] }.
 */
export default function AttendanceRegisterGrid({ data }) {
  const sessions = data?.sessions || [];
  const students = data?.students || [];

  if (sessions.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No classes have been held yet for this batch.</div>;
  }
  if (students.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No students in this batch.</div>;
  }

  return (
    <div className="bg-white rounded-xl overflow-auto" style={{ border: `1px solid ${BORDER}` }}>
      <table className="text-[12px]" style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead>
          <tr style={{ background: "#F8FAFC", color: "#475569" }}>
            <th className="px-3 py-2 text-left font-semibold sticky left-0" style={{ background: "#F8FAFC", minWidth: 160 }}>Student</th>
            {sessions.map((s) => (
              <th key={s.session_id} className="px-2 py-2 text-center font-semibold" title={s.lecture || ""} style={{ minWidth: 44 }}>
                {String(s.date).slice(5, 10)}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold" style={{ minWidth: 70 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {students.map((st) => (
            <tr key={st.student_id} style={{ borderTop: `1px solid ${BORDER}` }}>
              <td className="px-3 py-2 font-semibold sticky left-0" style={{ background: "#fff", color: "#0F172A" }}>
                {st.name}
                <span className="block text-[10px] font-normal" style={{ color: "#94A3B8" }}>{st.present}P · {st.absent}A · {st.leave}L</span>
              </td>
              {sessions.map((s) => {
                const c = CELL[st.statuses?.[s.session_id]] || { t: "—", bg: "transparent", fg: "#CBD5E1" };
                return (
                  <td key={s.session_id} className="px-1 py-1 text-center">
                    <span className="inline-flex items-center justify-center rounded-md font-bold" style={{ width: 24, height: 24, background: c.bg, color: c.fg }}>{c.t}</span>
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-bold" style={{ color: st.percentage >= 75 ? "#15803D" : BRAND }}>{st.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
