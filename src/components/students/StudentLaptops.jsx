import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Laptop, Plus, X, Loader2, Undo2, Ban, Search } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606", BRAND_TINT = "#FEF2F2", BORDER = "#EEF2F6";
const T1 = "#0F172A", T2 = "#475569", TM = "#94A3B8", SURF = "#FFFFFF", SURF2 = "#F8FAFC";
const SLOTS = ["morning", "noon", "evening", "night"];
const inp = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, outline: "none", color: T1 };
const can = (u, p) => !u ? false : (u.role === "admin" ? true : (u.permissions || []).includes(p));
const STATUS = { issued: { c: "#1D4ED8", bg: "#EFF6FF" }, returned: { c: "#15803D", bg: "#F0FDF4" }, lost: { c: "#B91C1C", bg: "#FEF2F2" }, overdue: { c: "#B45309", bg: "#FFFBEB" } };

export default function StudentLaptops() {
  const user = useSelector(selectCurrentUser);
  const canView = can(user, "get inventory");
  const canAssign = can(user, "update inventory-assign");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [assignOpen, setAssignOpen] = useState(false);

  const params = useMemo(() => {
    const p = { active_only: true, page, per_page: perPage };
    if (search.trim()) p.search = search.trim();
    return p;
  }, [search, page, perPage]);

  const { data, isFetching, refetch } = useGetQuery({ path: "/assets/student-laptops", params }, { skip: !canView, refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const meta = data?.meta || { total: 0 };

  const [post, { isLoading: busy }] = usePostMutation();
  const act = async (path, ok) => {
    try { await post({ path, body: {} }).unwrap(); showToast(ok, "success"); refetch(); }
    catch (e) { showToast(e?.data?.message || "Action failed.", "error"); }
  };

  if (!canView) return <div className="p-10 text-[13px]" style={{ color: T2 }}>You don&apos;t have permission to view this.</div>;

  return (
    <div style={{ padding: "26px 26px 60px", fontFamily: "'Montserrat', sans-serif", background: SURF2, minHeight: "100vh" }}>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 50, height: 50, borderRadius: 14, background: BRAND_TINT, color: BRAND }}><Laptop size={22} /></div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: T1 }}>Student Laptops</h1>
            <p className="text-[13px]" style={{ color: T2 }}>Assign laptops to students, track the recurring fee, return or stop billing.</p>
          </div>
        </div>
        {canAssign && <button onClick={() => setAssignOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white" style={{ background: BRAND, fontWeight: 600, fontSize: 13.5 }}><Plus size={15} /> Assign laptop</button>}
      </div>

      <div className="rounded-2xl mb-4 p-3" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        <div className="relative max-w-md">
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TM }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search student by name or email…" className="w-full pl-9 pr-3 py-2 rounded-lg" style={{ border: `1px solid ${BORDER}`, fontSize: 13, outline: "none" }} />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        {isFetching ? (
          <div className="py-16 flex items-center justify-center" style={{ color: TM }}><Loader2 className="animate-spin mr-2" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-[13px]" style={{ color: T2 }}>No students currently have a laptop issued.</div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: SURF2, borderBottom: `1px solid ${BORDER}` }}>
              {["Student", "Laptop", "Slot", "Monthly fee", "Duration / billing", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.5px] uppercase" style={{ color: TM }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((a) => {
                const st = STATUS[a.status] || { c: T2, bg: "#F1F5F9" };
                return (
                  <tr key={a.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: T1 }}>{a.assignee_name || `#${a.assignee_id}`}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: T2 }}>{a.asset?.name || a.asset?.asset_tag}<div className="text-[10.5px]" style={{ color: TM }}>{a.asset?.asset_tag}</div></td>
                    <td className="px-4 py-3 text-[12.5px] capitalize" style={{ color: T2 }}>{a.time_slot || "—"}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: T2 }}>{a.is_billable ? `Rs ${Number(a.net_monthly_fee || 0).toLocaleString()}/mo` : "—"}</td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: TM }}>
                      {a.is_full_course ? "Full course" : (a.return_by ? `Return by ${a.return_by}` : "—")}
                      {a.billing_until ? ` · billing stopped ${a.billing_until}` : ""}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ color: st.c, background: st.bg }}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {a.is_billable && !a.billing_until && (
                          <button onClick={() => act(`assets/${a.asset?.uuid}/stop-billing`, "Laptop fee stopped.")} disabled={!canAssign || busy} title="Stop laptop fee (this month onward)" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 6, background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}><Ban size={13} /></button>
                        )}
                        <button onClick={() => act(`assets/${a.asset?.uuid}/return`, "Laptop returned.")} disabled={!canAssign || busy} title="Return" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 6, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}><Undo2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {meta.total > 0 && <SimplePagination page={page} total={meta.total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} />}

      {assignOpen && <AssignModal onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); refetch(); }} />}
    </div>
  );
}

function AssignModal({ onClose, onDone }) {
  const [studentId, setStudentId] = useState(null);
  const [slot, setSlot] = useState("");
  const [laptopUuid, setLaptopUuid] = useState("");
  const [fullCourse, setFullCourse] = useState(true);
  const [days, setDays] = useState("");
  const [discType, setDiscType] = useState("");
  const [discValue, setDiscValue] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const { data: studentsResp } = useGetQuery({ path: "/student/students", params: { per_page: 200 } });
  const studentOptions = useMemo(
    () => (studentsResp?.data || []).map((s) => ({ value: s.id ?? s.user_id ?? s.user?.id, label: `${s.first_name || s.name || ""} ${s.last_name || ""}`.trim() || s.email || `#${s.id}` })).filter((o) => o.value),
    [studentsResp],
  );
  const { data: laptopData } = useGetQuery({ path: "/assets/laptops-available", params: slot ? { time_slot: slot } : undefined }, { skip: !slot });
  const laptops = laptopData?.data || [];

  const submit = async () => {
    if (!studentId) { showToast("Pick a student.", "error"); return; }
    if (!slot) { showToast("Pick the time slot.", "error"); return; }
    if (!laptopUuid) { showToast("Pick a laptop.", "error"); return; }
    const body = { assignee_type: "student", assignee_id: studentId, time_slot: slot, is_billable: true, is_full_course: fullCourse };
    if (!fullCourse && Number(days) > 0) body.duration_days = Number(days);
    if (discType && Number(discValue) > 0) { body.discount_type = discType; body.discount_value = Number(discValue); }
    try { await post({ path: `assets/${laptopUuid}/assign`, body }).unwrap(); showToast("Laptop issued.", "success"); onDone(); }
    catch (e) { showToast(e?.data?.message || "Assign failed.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5"><div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: BRAND_TINT, color: BRAND }}><Laptop size={16} /></div><h3 className="text-[15px] font-bold" style={{ color: T1 }}>Assign laptop to student</h3></div>
          <button onClick={onClose} style={{ color: TM }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <div><label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Student</label>
            <SearchableSelect options={studentOptions} value={studentId} onChange={setStudentId} placeholder="Search student…" /></div>
          <div><label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Time slot</label>
            <select value={slot} onChange={(e) => { setSlot(e.target.value); setLaptopUuid(""); }} style={inp}><option value="">Select slot…</option>{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          {slot && (
            <div><label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Laptop</label>
              <select value={laptopUuid} onChange={(e) => setLaptopUuid(e.target.value)} style={inp}><option value="">{laptops.length ? "Select a laptop…" : "No laptops free in this slot"}</option>{laptops.map((l) => <option key={l.uuid} value={l.uuid}>{l.asset_tag}{l.name ? ` · ${l.name}` : ""}{l.serial_number ? ` · SN ${l.serial_number}` : ""}</option>)}</select></div>
          )}
          <div><label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>Duration</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFullCourse(true)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: fullCourse ? BRAND_TINT : "#fff", color: fullCourse ? BRAND : T2, border: `1px solid ${fullCourse ? BRAND : BORDER}` }}>Full course</button>
              <button type="button" onClick={() => setFullCourse(false)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: !fullCourse ? BRAND_TINT : "#fff", color: !fullCourse ? BRAND : T2, border: `1px solid ${!fullCourse ? BRAND : BORDER}` }}>For N days</button>
            </div>
          </div>
          {!fullCourse && <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (return-by reminder)" style={inp} />}
          <div className="grid grid-cols-2 gap-2">
            <select value={discType} onChange={(e) => setDiscType(e.target.value)} style={inp}><option value="">No discount</option><option value="flat">Flat Rs/mo</option><option value="percent">% / mo</option></select>
            <input type="number" min="0" value={discValue} onChange={(e) => setDiscValue(e.target.value)} disabled={!discType} placeholder="Discount" style={{ ...inp, opacity: discType ? 1 : 0.5 }} />
          </div>
          <p className="text-[11px]" style={{ color: TM }}>A recurring laptop fee bills monthly at the standard rate{discType ? " minus this discount" : ""} while assigned.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURF2, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: "#fff", color: T2, border: `1px solid ${BORDER}` }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Assign</button>
        </div>
      </div>
    </div>
  );
}
