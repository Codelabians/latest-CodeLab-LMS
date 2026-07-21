import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import AttendanceRegisterGrid from "../ui/AttendanceRegisterGrid";

const BRAND = "#C90606";
const TEXT_PRIMARY = "#0F172A";

export default function BatchAttendancePage() {
  // Teacher filter — narrows the batch list to one teacher's batches so an
  // admin can review all of a teacher's students' attendance batch by batch.
  const { data: teachersData } = useGetQuery({ path: "/course/teachers" });
  const teachers = teachersData?.data || [];
  const [teacherId, setTeacherId] = useState("");

  const { data: batchData } = useGetQuery({
    path: "/course/batches",
    params: { per_page: 200, ...(teacherId ? { teacher_id: teacherId } : {}) },
  });
  const batches = useMemo(() => batchData?.data || [], [batchData]);
  const [batchUuid, setBatchUuid] = useState("");

  // No auto-selection — the admin picks a batch deliberately. Only clear a
  // selection that is no longer valid for the current teacher filter.
  useEffect(() => {
    if (batchUuid && !batches.some((b) => b.batch_uuid === batchUuid)) {
      setBatchUuid("");
    }
  }, [batches, batchUuid]);

  const teacherOptions = [
    { value: "", label: "All teachers" },
    ...teachers.map((t) => ({ value: String(t.id), label: t.name || t.first_name || t.email })),
  ];
  const options = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.teacher_name ? ` · ${b.teacher_name}` : ""}${b.course_name ? ` · ${b.course_name}` : ""}` }));

  const { data: regData, isFetching } = useGetQuery(
    { path: `/student/batches/${batchUuid}/attendance` },
    { skip: !batchUuid, refetchOnMountOrArgChange: true },
  );

  const selectedTeacher = teachers.find((t) => String(t.id) === teacherId);

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Batch Attendance</h1>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap gap-4" style={{ border: "1px solid #EEF2F6" }}>
        <div style={{ minWidth: 280, flex: "0 1 320px" }}>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Teacher</label>
          <SearchableSelect options={teacherOptions} value={teacherId} onChange={(v) => setTeacherId(v || "")} placeholder="All teachers" />
        </div>
        <div style={{ minWidth: 280, flex: "0 1 380px" }}>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>
            Batch{teacherId ? ` (${batches.length} for ${selectedTeacher?.name || "this teacher"})` : ""}
          </label>
          <SearchableSelect options={options} value={batchUuid} onChange={(v) => setBatchUuid(v || "")} placeholder="Select a batch…" />
        </div>
      </div>

      {teacherId && batches.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: "1px solid #EEF2F6", color: "#94A3B8" }}>
          This teacher has no batches.
        </div>
      ) : !batchUuid ? (
        <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: "1px solid #EEF2F6", color: "#94A3B8" }}>
          Select a batch to view its attendance register.
        </div>
      ) : isFetching ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <AttendanceRegisterGrid data={regData?.data} />
      )}
    </div>
  );
}
