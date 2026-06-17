import { useEffect, useMemo, useState } from "react";
import { Loader2, BookOpen, ChevronDown, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function TeacherContent() {
  const { data: rosterData, isLoading: rosterLoading } = useGetQuery({ path: "/teacher/attendance-roster" });
  const batches = useMemo(() => rosterData?.data || [], [rosterData]);
  const [batchUuid, setBatchUuid] = useState("");
  const [open, setOpen] = useState({});

  useEffect(() => { if (batches.length && !batchUuid) setBatchUuid(batches[0].batch_uuid); }, [batches, batchUuid]);

  const { data: lecData, isLoading } = useGetQuery({ path: `/teacher/batches/${batchUuid}/lectures` }, { skip: !batchUuid });
  const lectures = useMemo(() => lecData?.data?.lectures || [], [lecData]);

  // group by week
  const weeks = useMemo(() => {
    const m = {};
    lectures.forEach((l) => { (m[l.week_number] = m[l.week_number] || []).push(l); });
    return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [lectures]);

  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 flex items-end gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <div>
          <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Batch</label>
          <div style={{ minWidth: 240 }}>
            <SearchableSelect
              options={batches.map((b) => ({ value: b.batch_uuid, label: b.name }))}
              value={batchUuid || ""}
              onChange={(v) => setBatchUuid(v || "")}
              placeholder={batches.length ? "Search batch…" : "No batches"} />
          </div>
        </div>
        <div className="text-[12px]" style={{ color: "#94A3B8" }}>{lectures.length} lectures · {lectures.filter((l) => l.done).length} held</div>
      </div>

      {(rosterLoading || isLoading) ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : lectures.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No curriculum for this batch.</div>
      ) : (
        weeks.map(([wk, list]) => (
          <div key={wk} className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-2.5 text-[12px] font-bold" style={{ background: "#F8FAFC", color: "#475569" }}>Week {wk}</div>
            {list.map((l) => {
              const isOpen = !!open[l.id];
              return (
                <div key={l.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => toggle(l.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
                    {isOpen ? <ChevronDown size={14} style={{ color: "#94A3B8" }} /> : <ChevronRight size={14} style={{ color: "#94A3B8" }} />}
                    <BookOpen size={14} style={{ color: BRAND }} />
                    <span className="flex-1 text-[13px] font-semibold" style={{ color: "#0F172A" }}>L{l.lecture_in_week} — {l.title}</span>
                    {l.done ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#F0FDF4", color: "#15803D" }}><CheckCircle2 size={11} /> Held {l.session_date ? `· ${String(l.session_date).slice(0, 10)}` : ""}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#FFFBEB", color: "#B45309" }}><Clock size={11} /> Upcoming</span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-10 pb-3 text-[12px] space-y-2" style={{ color: "#475569" }}>
                      {l.topic && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Topic: </span>{l.topic}</div>}
                      {l.objectives && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Objectives: </span>{l.objectives}</div>}
                      {l.topics_covered && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Covered: </span>{l.topics_covered}</div>}
                      {l.exercise && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Exercise: </span>{l.exercise}</div>}
                      {l.deliverable && <div><span className="font-semibold" style={{ color: "#0F172A" }}>Deliverable: </span>{l.deliverable}</div>}
                      {!l.topic && !l.objectives && !l.exercise && !l.deliverable && <div style={{ color: "#94A3B8" }}>No content details.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
