import { useMemo, useState } from "react";
import { Laptop, Plus, X, Loader2, Undo2, Ban } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BRAND_TINT = "#FEF2F2";
const BORDER = "#EEF2F6";
const T1 = "#0F172A";
const T2 = "#475569";
const TM = "#94A3B8";
const SLOTS = ["morning", "noon", "evening", "night"];
const inp = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, outline: "none", color: T1 };

const STATUS = {
  issued: { c: "#1D4ED8", bg: "#EFF6FF" }, returned: { c: "#15803D", bg: "#F0FDF4" },
  lost: { c: "#B91C1C", bg: "#FEF2F2" }, overdue: { c: "#B45309", bg: "#FFFBEB" },
};

/**
 * Laptop / assets card for a student's detail page. Lets admin assign a
 * (slot-aware) laptop to an existing student with recurring billing, see the
 * current one, return it, or stop the laptop fee.
 */
export default function StudentLaptopCard({ studentId, studentName }) {
  const { data, refetch, isFetching } = useGetQuery(
    { path: `/assets/by-assignee/${studentId}` },
    { skip: !studentId, refetchOnMountOrArgChange: true },
  );
  const rows = data?.data || [];
  const [assignOpen, setAssignOpen] = useState(false);
  const [post, { isLoading: busy }] = usePostMutation();

  const act = async (path, body, ok) => {
    try { await post({ path, body: body || {} }).unwrap(); showToast(ok, "success"); refetch(); }
    catch (e) { showToast(e?.data?.message || "Action failed.", "error"); }
  };

  return (
    <div className="bg-white rounded-xl p-4 mb-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: T1 }}><Laptop size={14} /> Laptop &amp; assets</h3>
        <button onClick={() => setAssignOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={13} /> Assign laptop
        </button>
      </div>

      {isFetching ? (
        <div className="py-6 text-center text-[12.5px]" style={{ color: TM }}><Loader2 size={15} className="animate-spin inline mr-1" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-[12.5px] py-2" style={{ color: TM }}>No assets issued to this student.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => {
            const st = STATUS[a.status] || { c: T2, bg: "#F1F5F9" };
            return (
              <div key={a.uuid} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold" style={{ color: T1 }}>{a.asset?.name || a.asset?.asset_tag}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ color: st.c, background: st.bg }}>{a.status}</span>
                    {a.time_slot && <span className="text-[10.5px] capitalize" style={{ color: TM }}>{a.time_slot} slot</span>}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: TM }}>
                    Tag {a.asset?.asset_tag}
                    {a.is_billable ? ` · Rs ${Number(a.net_monthly_fee || 0).toLocaleString()}/mo` : ""}
                    {a.is_full_course ? " · full course" : (a.return_by ? ` · return by ${a.return_by}` : "")}
                    {a.billing_until ? ` · billing stopped ${a.billing_until}` : ""}
                  </div>
                </div>
                {a.status === "issued" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {a.is_billable && !a.billing_until && (
                      <button onClick={() => act(`assets/${a.asset?.uuid}/stop-billing`, {}, "Laptop fee stopped.")} disabled={busy} title="Stop laptop fee (this month onward)" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 6, background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}><Ban size={13} /></button>
                    )}
                    <button onClick={() => act(`assets/${a.asset?.uuid}/return`, {}, "Laptop returned.")} disabled={busy} title="Return" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 6, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}><Undo2 size={13} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assignOpen && <AssignLaptopModal studentId={studentId} studentName={studentName} onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); refetch(); }} />}
    </div>
  );
}

function AssignLaptopModal({ studentId, studentName, onClose, onDone }) {
  const [slot, setSlot] = useState("");
  const [laptopUuid, setLaptopUuid] = useState("");
  const [fullCourse, setFullCourse] = useState(true);
  const [days, setDays] = useState("");
  const [discType, setDiscType] = useState("");
  const [discValue, setDiscValue] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const { data: laptopData } = useGetQuery(
    { path: "/assets/laptops-available", params: slot ? { time_slot: slot } : undefined },
    { skip: !slot },
  );
  const laptops = useMemo(() => laptopData?.data || [], [laptopData]);

  const submit = async () => {
    if (!slot) { showToast("Pick the time slot.", "error"); return; }
    if (!laptopUuid) { showToast("Pick a laptop.", "error"); return; }
    const body = { assignee_type: "student", assignee_id: studentId, time_slot: slot, is_billable: true, is_full_course: fullCourse };
    if (!fullCourse && Number(days) > 0) body.duration_days = Number(days);
    if (discType && Number(discValue) > 0) { body.discount_type = discType; body.discount_value = Number(discValue); }
    try {
      await post({ path: `assets/${laptopUuid}/assign`, body }).unwrap();
      showToast("Laptop issued.", "success"); onDone();
    } catch (e) { showToast(e?.data?.message || "Assign failed.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: BRAND_TINT, color: BRAND }}><Laptop size={16} /></div>
            <h3 className="text-[15px] font-bold" style={{ color: T1 }}>Assign laptop</h3>
          </div>
          <button onClick={onClose} style={{ color: TM }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-[12.5px]" style={{ color: T2 }}>Issuing a laptop to <strong style={{ color: T1 }}>{studentName}</strong>. Pick the class slot — only laptops free in that slot are shown.</p>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Time slot</label>
            <select value={slot} onChange={(e) => { setSlot(e.target.value); setLaptopUuid(""); }} style={inp}>
              <option value="">Select slot…</option>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {slot && (
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Laptop</label>
              <select value={laptopUuid} onChange={(e) => setLaptopUuid(e.target.value)} style={inp}>
                <option value="">{laptops.length ? "Select a laptop…" : "No laptops free in this slot"}</option>
                {laptops.map((l) => <option key={l.uuid} value={l.uuid}>{l.asset_tag}{l.name ? ` · ${l.name}` : ""}{l.serial_number ? ` · SN ${l.serial_number}` : ""}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Duration</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFullCourse(true)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: fullCourse ? BRAND_TINT : "#fff", color: fullCourse ? BRAND : T2, border: `1px solid ${fullCourse ? BRAND : BORDER}` }}>Full course</button>
              <button type="button" onClick={() => setFullCourse(false)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: !fullCourse ? BRAND_TINT : "#fff", color: !fullCourse ? BRAND : T2, border: `1px solid ${!fullCourse ? BRAND : BORDER}` }}>For N days</button>
            </div>
          </div>
          {!fullCourse && <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (return-by reminder)" style={inp} />}
          <div className="grid grid-cols-2 gap-2">
            <select value={discType} onChange={(e) => setDiscType(e.target.value)} style={inp}>
              <option value="">No discount</option>
              <option value="flat">Flat Rs/mo</option>
              <option value="percent">% / mo</option>
            </select>
            <input type="number" min="0" value={discValue} onChange={(e) => setDiscValue(e.target.value)} disabled={!discType} placeholder="Discount" style={{ ...inp, opacity: discType ? 1 : 0.5 }} />
          </div>
          <p className="text-[11px]" style={{ color: TM }}>A recurring laptop fee bills monthly at the standard rate{discType ? " minus this discount" : ""} while assigned.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: "#F8FAFC", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: "#fff", color: T2, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Assign
          </button>
        </div>
      </div>
    </div>
  );
}
