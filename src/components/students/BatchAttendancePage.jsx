import { useEffect, useMemo } from "react";
import { CalendarCheck, Loader2, Users, FilterX } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import AttendanceRegisterGrid from "../ui/AttendanceRegisterGrid";
import usePersistedFilters from "../../hooks/usePersistedFilters";

const BRAND = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const BORDER = "#EEF2F6";

export default function BatchAttendancePage() {
  // Teacher filter — with a teacher selected (and no specific batch), the
  // page shows ONE combined roster of all that teacher's students across
  // all their batches, each with an attendance summary.
  const { data: teachersData } = useGetQuery({ path: "/course/teachers" });
  const teachers = teachersData?.data || [];

  // Remembered across visits; Clear resets both.
  const { filters, setFilter, clearFilters, hasActiveFilters } =
    usePersistedFilters("batch-attendance", { teacherId: "", batchUuid: "" });
  const { teacherId, batchUuid } = filters;
  const setTeacherId = (v) => setFilter("teacherId", v || "");
  const setBatchUuid = (v) => setFilter("batchUuid", v || "");

  const { data: batchData } = useGetQuery({
    path: "/course/batches",
    params: { per_page: 200, ...(teacherId ? { teacher_id: teacherId } : {}) },
  });
  const batches = useMemo(() => batchData?.data || [], [batchData]);

  // No auto-selection — the admin picks a batch deliberately. Only clear a
  // selection that is no longer valid for the current teacher filter.
  useEffect(() => {
    if (batchUuid && batchData && !batches.some((b) => b.batch_uuid === batchUuid)) {
      setBatchUuid("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, batchUuid, batchData]);

  const teacherOptions = [
    { value: "", label: "All teachers" },
    ...teachers.map((t) => ({ value: String(t.id), label: t.name || t.first_name || t.email })),
  ];
  const options = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.teacher_name ? ` · ${b.teacher_name}` : ""}${b.course_name ? ` · ${b.course_name}` : ""}` }));

  // Per-batch register (only when a batch is explicitly chosen).
  const { data: regData, isFetching } = useGetQuery(
    { path: `/student/batches/${batchUuid}/attendance` },
    { skip: !batchUuid, refetchOnMountOrArgChange: true },
  );

  // Combined all-students roster for the selected teacher.
  const { data: rosterData, isFetching: rosterFetching } = useGetQuery(
    { path: "/student/attendance/by-teacher", params: { teacher_id: teacherId } },
    { skip: !teacherId || !!batchUuid, refetchOnMountOrArgChange: true },
  );
  const roster = rosterData?.data?.rows || [];

  const selectedTeacher = teachers.find((t) => String(t.id) === teacherId);

  const pctColor = (p) => (p == null ? "#94A3B8" : p >= 75 ? "#15803D" : p >= 50 ? "#B45309" : BRAND);

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Batch Attendance</h1>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap gap-4" style={{ border: `1px solid ${BORDER}` }}>
        <div style={{ minWidth: 280, flex: "0 1 320px" }}>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Teacher</label>
          <SearchableSelect options={teacherOptions} value={teacherId} onChange={(v) => setTeacherId(v || "")} placeholder="All teachers" />
        </div>
        <div style={{ minWidth: 280, flex: "0 1 380px" }}>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>
            Batch{teacherId ? ` (${batches.length} for ${selectedTeacher?.name || "this teacher"} — optional)` : ""}
          </label>
          <SearchableSelect options={options} value={batchUuid} onChange={(v) => setBatchUuid(v || "")} placeholder={teacherId ? "All batches (combined view)" : "Select a batch…"} />
        </div>
        {hasActiveFilters && (
          <div className="flex items-end">
            <button type="button" onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
              style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
              <FilterX size={13} /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Combined roster: teacher chosen, no specific batch */}
      {teacherId && !batchUuid ? (
        rosterFetching ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : roster.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>
            No current students found for this teacher.
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Users size={15} style={{ color: BRAND }} />
              <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {roster.length} student{roster.length === 1 ? "" : "s"} across {new Set(roster.map((r) => r.batch)).size} batch(es) — {selectedTeacher?.name}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ background: "#F8FAFC", color: "#475569" }}>
                    {["Student", "Batch", "Present", "Absent", "Leave", "Classes held", "Attendance %"].map((h, i) => (
                      <th key={i} className={`px-3 py-2 font-semibold text-[11px] ${i >= 2 ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, i) => (
                    <tr key={r.user_uuid + r.batch + i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name}</td>
                      <td className="px-3 py-2" style={{ color: "#475569" }}>{r.batch}</td>
                      <td className="px-3 py-2 text-center font-semibold" style={{ color: "#15803D" }}>{r.present}</td>
                      <td className="px-3 py-2 text-center font-semibold" style={{ color: BRAND }}>{r.absent}</td>
                      <td className="px-3 py-2 text-center" style={{ color: "#B45309" }}>{r.leave}</td>
                      <td className="px-3 py-2 text-center" style={{ color: "#475569" }}>{r.total}</td>
                      <td className="px-3 py-2 text-center font-bold" style={{ color: pctColor(r.percentage) }}>
                        {r.percentage == null ? "—" : `${r.percentage}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : !batchUuid ? (
        <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>
          Pick a teacher to see all their students&apos; attendance in one list, or select a specific batch for the full session-by-session register.
        </div>
      ) : isFetching ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <AttendanceRegisterGrid data={regData?.data} />
      )}
    </div>
  );
}
