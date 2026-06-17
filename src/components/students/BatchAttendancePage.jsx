import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import AttendanceRegisterGrid from "../ui/AttendanceRegisterGrid";

const BRAND = "#C90606";
const TEXT_PRIMARY = "#0F172A";

export default function BatchAttendancePage() {
  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const batches = useMemo(() => batchData?.data || [], [batchData]);
  const [batchUuid, setBatchUuid] = useState("");

  useEffect(() => { if (batches.length && !batchUuid) setBatchUuid(batches[0].batch_uuid); }, [batches, batchUuid]);

  const options = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.course_name ? ` · ${b.course_name}` : ""}` }));

  const { data: regData, isFetching } = useGetQuery(
    { path: `/student/batches/${batchUuid}/attendance` },
    { skip: !batchUuid, refetchOnMountOrArgChange: true },
  );

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Batch Attendance</h1>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4" style={{ border: "1px solid #EEF2F6", maxWidth: 420 }}>
        <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Batch</label>
        <SearchableSelect options={options} value={batchUuid} onChange={setBatchUuid} placeholder="Search batch…" />
      </div>

      {isFetching ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <AttendanceRegisterGrid data={regData?.data} />
      )}
    </div>
  );
}
