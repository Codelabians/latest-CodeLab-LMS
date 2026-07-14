import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Wallet, Loader2, ChevronDown, Download, Mail, MessageCircle, X,
  CheckCircle2, AlertTriangle, Search,
} from "lucide-react";
import { useGetQuery, usePostMutation, useDownloadChallanMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import SimplePagination from "../ui/SimplePagination";
import { CollectModal, AdvanceModal } from "./FeeCollection";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const hasPermission = (u, p) => (!u ? false : u.role === "admin" || (u.permissions || []).includes(p));

const FEE_BADGE = {
  paid: { bg: "#DCFCE7", fg: "#15803D", label: "Paid" },
  pending: { bg: "#FEF3C7", fg: "#B45309", label: "Pending" },
  overdue: { bg: "#FEE2E2", fg: "#B91C1C", label: "Overdue" },
  refunded: { bg: "#F5F3FF", fg: "#6D28D9", label: "Refunded" },
  waived: { bg: "#F5F3FF", fg: "#6D28D9", label: "Waived" },
  break: { bg: "#EFF6FF", fg: "#1D4ED8", label: "On break" },
  on_break: { bg: "#EFF6FF", fg: "#1D4ED8", label: "On break" },
  dropped_out: { bg: "#F1F5F9", fg: "#64748B", label: "Dropped out" },
};
const INST_STATUS = {
  paid: { bg: "#DCFCE7", fg: "#15803D", label: "Paid" },
  partially_paid: { bg: "#FEF3C7", fg: "#B45309", label: "Partial" },
  overdue: { bg: "#FEE2E2", fg: "#B91C1C", label: "Overdue" },
  pending: { bg: "#E2E8F0", fg: "#475569", label: "Pending" },
  break: { bg: "#DBEAFE", fg: "#1D4ED8", label: "On break" },
  waived: { bg: "#F5F3FF", fg: "#6D28D9", label: "Waived" },
};

const Select = ({ value, onChange, children, width }) => (
  <div className="relative" style={{ minWidth: width || 140 }}>
    <select value={value} onChange={onChange}
      className="w-full py-2 pl-3 pr-8 text-sm rounded-lg outline-none"
      style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, appearance: "none", fontFamily: "'Montserrat', sans-serif", cursor: "pointer" }}>
      {children}
    </select>
    <ChevronDown size={14} className="absolute pointer-events-none -translate-y-1/2 right-2.5 top-1/2" style={{ color: TEXT_MUTED }} />
  </div>
);

export default function FeeStatusList() {
  const currentUser = useSelector(selectCurrentUser);
  const canSkipFinance = hasPermission(currentUser, "record historical-payment");

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [feeStatus, setFeeStatus] = useState("");
  const [joined, setJoined] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [scholarship, setScholarship] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recordFor, setRecordFor] = useState(null); // {uuid, name, course, batch}

  useEffect(() => { const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [courseId, batchId, feeStatus, joined, instructorId, scholarship, status]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (q) p.q = q;
    if (courseId) p.course_id = courseId;
    if (batchId) p.batch_id = batchId;
    if (feeStatus) p.fee_status = feeStatus;
    if (joined) p.joined = joined;
    if (instructorId) p.instructor_id = instructorId;
    if (scholarship) p.scholarship_program = scholarship;
    if (status) p.status = status;
    return p;
  }, [page, perPage, q, courseId, batchId, feeStatus, joined, instructorId, scholarship, status]);

  const { data, isFetching } = useGetQuery({ path: "/student/students", params });
  const rows = data?.data || [];
  const meta = data?.meta?.pagination || data?.meta || data?.pagination || {};
  const total = meta.total || rows.length;

  const { data: courseData } = useGetQuery({ path: "/course/courses", params: { per_page: 200 } });
  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const { data: teacherData } = useGetQuery({ path: "/course/teachers" });
  const { data: progData } = useGetQuery({ path: "student/scholarship-programs/active" });
  const courses = courseData?.data || [];
  const batches = batchData?.data || [];
  const teachers = teacherData?.data || [];
  const programs = progData?.data || [];

  const clearFilters = () => { setSearch(""); setQ(""); setCourseId(""); setBatchId(""); setFeeStatus(""); setJoined(""); setInstructorId(""); setScholarship(""); setStatus(""); };
  const hasFilters = !!(q || courseId || batchId || feeStatus || joined || instructorId || scholarship || status);

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `${BRAND}14`, color: BRAND }}><Wallet size={22} /></span>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>Fee Status</h1>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Every student with their fee status. Click Record to view and collect their fees.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <Search size={15} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, CNIC, phone…"
            className="w-full py-2 pr-3 text-sm rounded-lg outline-none pl-9"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>
        <Select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)} width={140}>
          <option value="">Any fee status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="waived">Waived</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} width={150}>
          <option value="">Any course</option>
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
        <Select value={batchId} onChange={(e) => setBatchId(e.target.value)} width={150}>
          <option value="">Any batch</option>
          {batches.map((b) => <option key={b.batch_uuid || b.id} value={String(b.batch_uuid || b.id)}>{b.name}</option>)}
        </Select>
        <Select value={joined} onChange={(e) => setJoined(e.target.value)} width={130}>
          <option value="">Any join date</option>
          <option value="today">Joined today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
        </Select>
        <Select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} width={150}>
          <option value="">Any instructor</option>
          {teachers.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.name || `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email}</option>
          ))}
        </Select>
        <Select value={scholarship} onChange={(e) => setScholarship(e.target.value)} width={160}>
          <option value="">Any program</option>
          <option value="none">No program</option>
          {programs.map((pr) => <option key={pr.uuid} value={pr.uuid}>{pr.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} width={130}>
          <option value="">Any status</option>
          <option value="enrolled">Enrolled</option>
          <option value="active">Active</option>
          <option value="dropped_out">Dropped out</option>
        </Select>
        {hasFilters && (
          <button onClick={clearFilters} className="px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-2.5 flex items-center justify-between text-[12px]" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
          <span>{total} student{total === 1 ? "" : "s"}</span>
          {isFetching && <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                <th className="px-4 py-2.5 text-left font-semibold">Student</th>
                <th className="px-4 py-2.5 text-left font-semibold">Course / Batch</th>
                <th className="px-4 py-2.5 text-right font-semibold">Outstanding</th>
                <th className="px-4 py-2.5 text-center font-semibold">Fee status</th>
                <th className="px-4 py-2.5 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {!isFetching && rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>No students match these filters.</td></tr>
              )}
              {rows.map((s) => {
                const b = FEE_BADGE[s.fee_status] || FEE_BADGE.pending;
                return (
                  <tr key={s.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{s.name}</div>
                      {s.scholarship_program && <div className="text-[11px]" style={{ color: "#6D28D9" }}>{s.scholarship_program}</div>}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>
                      {s.course || "—"}{s.batch ? ` · ${s.batch}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold" style={{ color: Number(s.pending) > 0 ? BRAND : TEXT_MUTED }}>{money(s.pending)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: b.bg, color: b.fg }}>{b.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setRecordFor(s)}
                        className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                        style={{ background: `linear-gradient(135deg, ${BRAND}, #A30505)` }}>Record</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>

      {recordFor && (
        <FeeRecordModal student={recordFor} canSkipFinance={canSkipFinance} onClose={() => setRecordFor(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: a student's full fee schedule + collect/break/waive/etc.    */
/* ------------------------------------------------------------------ */
export function FeeRecordModal({ student, canSkipFinance, onClose }) {
  const [toast, setToast] = useState(null);
  const [collectFor, setCollectFor] = useState(null);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [challanBusy, setChallanBusy] = useState(null);
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  const { data: feeData, isFetching, refetch } = useGetQuery(
    { path: `finance/fee-collection/${student.uuid}/installments` },
    { refetchOnMountOrArgChange: true },
  );
  const installments = useMemo(() => feeData?.data?.installments || [], [feeData]);
  const totals = useMemo(() => installments.reduce((a, i) => ({ remaining: a.remaining + Number(i.remaining || 0) }), { remaining: 0 }), [installments]);

  const [dlChallan] = useDownloadChallanMutation();
  const [sendChallan] = usePostMutation();
  const [resetInst] = usePostMutation();
  const [deleteInst] = usePostMutation();
  const [breakInst] = usePostMutation();
  const [waiveInst] = usePostMutation();

  const act = async (fn, okMsg) => { try { const r = await fn(); notify(r?.message || okMsg); refetch(); } catch (e) { notify(e?.data?.message || "Action failed.", false); } };
  const downloadChallanFor = async (uuid) => { setChallanBusy(`dl-${uuid}`); try { await dlChallan({ path: `finance/installments/${uuid}/challan`, params: {}, filename: `challan-${uuid}.pdf` }).unwrap(); } catch { notify("Could not download challan.", false); } finally { setChallanBusy(null); } };
  const sendChallanFor = async (uuid, channel) => { setChallanBusy(`${channel}-${uuid}`); try { const r = await sendChallan({ path: `finance/installments/${uuid}/${channel === "email" ? "email-challan" : "whatsapp-challan"}`, body: {} }).unwrap(); notify(r?.message || "Challan sent."); } catch (e) { notify(e?.data?.message || "Could not send challan.", false); } finally { setChallanBusy(null); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{student.name}</div>
            <div className="text-[12px]" style={{ color: TEXT_MUTED }}>{student.course || "—"}{student.batch ? ` · ${student.batch}` : ""}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Outstanding</div>
              <div className="text-[16px] font-bold" style={{ color: totals.remaining > 0 ? BRAND : "#15803D" }}>{money(totals.remaining)}</div>
            </div>
            <button onClick={() => setAdvanceOpen(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>Pay months ahead</button>
            <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
          </div>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                  <th className="px-4 py-2 text-left font-semibold">Course / Batch</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Due date</th>
                  <th className="px-4 py-2 text-left font-semibold">Paid date</th>
                  <th className="px-4 py-2 text-right font-semibold">Amount</th>
                  <th className="px-4 py-2 text-right font-semibold">Paid</th>
                  <th className="px-4 py-2 text-right font-semibold">Remaining</th>
                  <th className="px-4 py-2 text-center font-semibold">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {isFetching && <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
                {!isFetching && installments.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: TEXT_MUTED }}>No fee records for this student.</td></tr>}
                {installments.map((i) => {
                  const st = INST_STATUS[i.status] || INST_STATUS.pending;
                  return (
                    <tr key={i.installment_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-2.5" style={{ color: TEXT_PRIMARY }}><div className="font-semibold">{i.course || "—"}</div><div style={{ color: TEXT_MUTED }}>{i.batch || ""}</div></td>
                      <td className="px-4 py-2.5 capitalize" style={{ color: TEXT_SECONDARY }}>{i.fee_type}</td>
                      <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{i.due_date || "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{i.paid_date ? String(i.paid_date).slice(0, 10) : "—"}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: TEXT_PRIMARY }}>{money(i.amount)}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: "#15803D" }}>{money(i.paid)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold" style={{ color: i.remaining > 0 ? BRAND : TEXT_MUTED }}>{money(i.remaining)}</td>
                      <td className="px-4 py-2.5 text-center"><span className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                      <td className="px-4 py-2.5">
                        <span className="flex flex-wrap items-center gap-1.5 justify-end">
                          <button onClick={() => downloadChallanFor(i.installment_uuid)} disabled={challanBusy === `dl-${i.installment_uuid}`} title="Download challan" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#15803D" }}>
                            {challanBusy === `dl-${i.installment_uuid}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          </button>
                          <button onClick={() => sendChallanFor(i.installment_uuid, "email")} disabled={challanBusy === `email-${i.installment_uuid}`} title="Email challan" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}>
                            {challanBusy === `email-${i.installment_uuid}` ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                          </button>
                          <button onClick={() => sendChallanFor(i.installment_uuid, "whatsapp")} disabled={challanBusy === `whatsapp-${i.installment_uuid}`} title="Send on WhatsApp" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#059669" }}>
                            {challanBusy === `whatsapp-${i.installment_uuid}` ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                          </button>
                          {i.remaining > 0 && (
                            <button onClick={() => setCollectFor(i)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ background: BRAND }}>Collect</button>
                          )}
                          {i.status === "break" ? (
                            <button onClick={() => act(() => breakInst({ path: `finance/installments/${i.installment_uuid}/toggle-break`, body: {} }).unwrap(), "Updated.")} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}>Unbreak</button>
                          ) : i.remaining > 0 ? (
                            <button onClick={() => act(() => breakInst({ path: `finance/installments/${i.installment_uuid}/toggle-break`, body: {} }).unwrap(), "Updated.")} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}>Break</button>
                          ) : null}
                          {i.status === "waived" ? (
                            <button onClick={() => act(() => waiveInst({ path: `finance/installments/${i.installment_uuid}/toggle-waive`, body: {} }).unwrap(), "Updated.")} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}>Unwaive</button>
                          ) : i.status !== "paid" ? (
                            <button onClick={() => act(() => waiveInst({ path: `finance/installments/${i.installment_uuid}/toggle-waive`, body: {} }).unwrap(), "Updated.")} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}>Waive</button>
                          ) : null}
                          {canSkipFinance && i.remaining <= 0 && Number(i.paid) > 0 && (
                            <button onClick={() => { if (window.confirm("Undo all payments on this installment and set it back to pending?")) act(() => resetInst({ path: `finance/installments/${i.installment_uuid}/reset`, body: {} }).unwrap(), "Reset to pending."); }} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #FCA5A5", color: "#B91C1C" }}>Reset</button>
                          )}
                          {canSkipFinance && (
                            <button onClick={() => { if (window.confirm("Delete this fee record permanently? Any finance for it is reversed.")) act(() => deleteInst({ path: `finance/installments/${i.installment_uuid}/delete`, body: {} }).unwrap(), "Fee record deleted."); }} className="px-2 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C" }}>Delete</button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {advanceOpen && (
        <AdvanceModal
          studentUuid={student.uuid}
          canSkipFinance={canSkipFinance}
          onClose={() => setAdvanceOpen(false)}
          onDone={(msg) => { notify(msg); setAdvanceOpen(false); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {collectFor && (
        <CollectModal
          installment={collectFor}
          studentUuid={student.uuid}
          canSkipFinance={canSkipFinance}
          onClose={() => setCollectFor(null)}
          onDone={(msg) => { notify(msg); setCollectFor(null); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg" style={{ background: toast.ok ? "#15803D" : BRAND }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
