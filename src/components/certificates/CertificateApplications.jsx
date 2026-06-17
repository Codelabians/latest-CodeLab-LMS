import { useMemo, useState } from "react";
import {
  Award, Search, CheckCircle2, XCircle, Truck, Download, Loader2,
  FileCheck2, Inbox, ChevronLeft, ChevronRight, User, ReceiptText, Pencil, FileDown,
  Plus, X,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useSmartPostMutation,
} from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const STATUS_STYLE = {
  pending:    { bg: "#FFFBEB", fg: "#B45309", label: "Pending" },
  processing: { bg: "#FFF7ED", fg: "#C2410C", label: "Processing" },
  approved:  { bg: "#F0FDF4", fg: "#15803D", label: "Approved" },
  delivered: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Delivered" },
  rejected:  { bg: "#FEF2F2", fg: "#C90606", label: "Rejected" },
};

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "approved", label: "Approved" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
];

export default function CertificateApplications() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState(null);
  const [reject, setReject] = useState(null);   // { id, reason }
  const [deliver, setDeliver] = useState(null); // { id, note }
  const [photoView, setPhotoView] = useState(null); // url string
  const [courseId, setCourseId] = useState("");
  const [edit, setEdit] = useState(null); // edit form object
  const [challan, setChallan] = useState(null); // { id, discount, type, fee, mode }
  const [payment, setPayment] = useState(null); // { id, method, reference, amount, net }

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const params = useMemo(() => {
    const p = { per_page: perPage, page };
    if (status) p.status = status;
    if (search) p.q = search;
    if (courseId) p.course_id = courseId;
    return p;
  }, [status, search, page, courseId]);

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "certificate-applications", params },
    { refetchOnMountOrArgChange: true }
  );
  const rows = data?.data || [];
  const pg = data?.meta?.pagination || { total: 0, current_page: 1, last_page: 1, from: 0, to: 0 };

  const { data: coursesData } = useGetQuery({ path: "/course/courses", params: { per_page: 100 } });
  const courses = coursesData?.data?.data || coursesData?.data || [];

  // Payment accounts for the split disbursement dropdown (same catalog students pay into).
  const { data: payAcctData } = useGetQuery({ path: "finance/payment-accounts/active" });
  const payAccounts = (() => { const root = payAcctData?.data ?? payAcctData ?? []; return Array.isArray(root) ? root : root?.data ?? []; })();

  const [approvePost, { isLoading: approving }] = usePostMutation();
  const [patchApp, { isLoading: savingEdit }] = usePatchMutation();
  const [rejectPost, { isLoading: rejecting }] = usePostMutation();
  const [deliverPost, { isLoading: delivering }] = usePostMutation();
  const [bulkPost, { isLoading: bulking }] = useSmartPostMutation();
  const [challanPost, { isLoading: sendingChallan }] = usePostMutation();

  const allIds = rows.map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const toggleOne = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const selPendingCount = rows.filter((r) => selected.includes(r.id) && r.status === "pending").length;

  const doApprove = async () => {
    if (!payment) return;
    const payments = (payment.lines || [])
      .filter((l) => Number(l.amount) > 0)
      .map((l) => ({
        amount: Number(l.amount),
        payment_method: l.method,
        payment_account_uuid: l.account_uuid || undefined,
        payment_reference: l.reference || undefined,
      }));
    if (payments.length === 0) { notify("Add at least one payment line with an amount.", false); return; }
    const body = { payments };
    if (Number(payment.discount) > 0) { body.discount = Number(payment.discount); body.discount_type = "amount"; }
    try {
      const res = await approvePost({ path: `certificate-applications/${payment.id}/approve`, body }).unwrap();
      notify(res?.message || "Payment recorded & certificate issued."); setPayment(null); setSelected((s) => s.filter((x) => x !== payment.id)); refetch();
    } catch (e) { notify(e?.data?.message || "Could not approve.", false); }
  };
  const doReject = async () => {
    if (!reject?.reason?.trim()) { notify("Please enter a reason.", false); return; }
    try {
      await rejectPost({ path: `certificate-applications/${reject.id}/reject`, body: { reason: reject.reason } }).unwrap();
      notify("Application rejected."); setReject(null); refetch();
    } catch (e) { notify(e?.data?.message || "Could not reject.", false); }
  };
  const doDeliver = async () => {
    try {
      await deliverPost({ path: `certificate-applications/${deliver.id}/deliver`, body: { delivery_method_note: deliver.note || "" } }).unwrap();
      notify("Marked as delivered."); setDeliver(null); refetch();
    } catch (e) { notify(e?.data?.message || "Could not mark delivered.", false); }
  };
  const doEdit = async () => {
    if (!edit) return;
    const body = {
      full_name: edit.full_name, father_name: edit.father_name, email: edit.email,
      cnic: edit.cnic, phone: edit.phone, gender: edit.gender || undefined,
      course_id: edit.course_id ? Number(edit.course_id) : undefined,
      course_duration_months: edit.course_duration_months ? Number(edit.course_duration_months) : undefined,
      education_level: edit.education_level || undefined,
    };
    try {
      await patchApp({ path: `certificate-applications/${edit.id}`, body }).unwrap();
      notify("Application updated."); setEdit(null); refetch();
    } catch (e) { notify(e?.data?.message || "Could not update.", false); }
  };
  const doChallan = async () => {
    if (!challan) return;
    const body = {};
    const d = Number(challan.discount);
    if (d > 0) { body.discount = d; body.discount_type = challan.type; }
    if (challan.duration !== "" && challan.duration != null && Number(challan.duration) > 0) {
      body.course_duration_months = Number(challan.duration);
    }
    const isProcess = challan.mode === "process";
    const path = isProcess
      ? `certificate-applications/${challan.id}/process`
      : `certificate-applications/${challan.id}/send-challan`;
    try {
      const res = await challanPost({ path, body }).unwrap();
      notify(res?.message || (isProcess ? "Challan issued. Awaiting payment." : "Challan sent.")); setChallan(null); refetch();
    } catch (e) { notify(e?.data?.message || "Could not send challan.", false); }
  };
  const doBulk = async () => {
    if (!selected.length) return;
    try {
      const res = await bulkPost({ path: "certificate-applications/bulk-approve", body: { ids: selected }, filename: `certificates_${Date.now()}.zip` }).unwrap();
      if (res?.isFile) notify("Approved and downloaded ZIP."); else notify(res?.message || "Done.");
      setSelected([]); refetch();
    } catch (e) { notify(e?.data?.message || e?.data || "Bulk approve failed.", false); }
  };

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Award size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Certificate Applications</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Review, approve, deliver, and bulk-download issued certificates</p>
          </div>
        </div>
        {selected.length > 0 && (
          <button onClick={doBulk} disabled={bulking}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
            style={{ background: BRAND, opacity: bulking ? 0.7 : 1 }}>
            {bulking ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {selPendingCount > 0 ? "Approve & download ZIP" : "Download certificates ZIP"} ({selected.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = status === t.key;
            return (
              <button key={t.key || "all"} onClick={() => { setStatus(t.key); setPage(1); setSelected([]); }}
                className="px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors"
                style={active ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_PRIMARY, border: `1px solid ${BORDER}` }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
        <div style={{ minWidth: 180 }}>
          <SearchableSelect
            options={courses.map((c) => ({ value: String(c.id), label: c.name }))}
            value={courseId ? String(courseId) : ""}
            onChange={(v) => { setCourseId(v || ""); setPage(1); }}
            placeholder="All courses" />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} style={{ position: "absolute", left: 10, top: 9, color: TEXT_MUTED }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, course, CNIC, email, cert ID"
              className="py-2 pr-3 text-sm rounded-lg outline-none pl-8 w-64" style={inputStyle} />
          </div>
          <button type="submit" className="px-3 py-2 text-sm font-semibold rounded-lg" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Search</button>
        </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: SURFACE_HOVER, color: TEXT_MUTED }} className="text-[12px] text-left">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!allIds.length} aria-label="Select all" />
                </th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Certificate ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || isFetching) && (
                <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}><Loader2 className="inline animate-spin" size={18} /> Loading…</td></tr>
              )}
              {!isLoading && !isFetching && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-14 text-center" style={{ color: TEXT_MUTED }}>
                  <Inbox className="inline mb-2" size={26} /><div>No certificate applications{status ? ` (${status})` : ""} yet.</div>
                </td></tr>
              )}
              {!isLoading && !isFetching && rows.map((r) => {
                const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 align-top">
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.full_name}`} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-3">
                        {/* Initials always render underneath; the photo covers them
                            when it loads, and falls back to initials if it is missing
                            or the file 404s (onError hides the broken img). */}
                        <div className="relative overflow-hidden rounded-lg shrink-0" style={{ width: 44, height: 44, border: `1px solid ${BORDER}` }}>
                          <span className="absolute inset-0 grid place-items-center text-[13px] font-bold"
                            style={{ background: "#FEF2F2", color: BRAND }}>
                            {(r.full_name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                          </span>
                          {r.photo_url && (
                            <img src={r.photo_url} alt={r.full_name} title="Click to enlarge"
                              onClick={() => setPhotoView(r.photo_url)}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                              className="absolute inset-0 object-cover w-full h-full cursor-pointer" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.full_name}</div>
                          <div className="text-[12px]" style={{ color: TEXT_MUTED }}>{r.email || r.phone || ""}</div>
                          {r.cnic && <div className="text-[11px]" style={{ color: TEXT_MUTED }}>CNIC: {r.cnic}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top" style={{ color: TEXT_PRIMARY }}>
                      {r.course?.name || (r.batch_id ? `Batch #${r.batch_id}` : "—")}
                      {r.course_duration_months ? <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.course_duration_months} months</div> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-[12px] font-mono" style={{ color: r.certificate_id ? TEXT_PRIMARY : TEXT_MUTED }}>{r.certificate_id || "—"}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                      {r.status === "processing" && (
                        <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                          Challan: Rs {(Number(r.certificate_net) || 0).toLocaleString()}{Number(r.certificate_discount) > 0 ? ` (−${(Number(r.certificate_discount)).toLocaleString()})` : ""}
                        </div>
                      )}
                      {(r.status === "approved" || r.status === "delivered") && r.payment_method && (
                        <div className="mt-1 text-[11px] capitalize" style={{ color: "#15803D" }}>
                          Paid · {r.payment_method}{r.amount_paid ? ` Rs ${(Number(r.amount_paid)).toLocaleString()}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-[12px]" style={{ color: TEXT_MUTED }}>{(r.created_at || "").slice(0, 10)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button onClick={() => setEdit({ id: r.id, full_name: r.full_name || "", father_name: r.father_name || "", email: r.email || "", cnic: r.cnic || "", phone: r.phone || "", gender: r.gender || "", course_id: r.course?.id || "", course_duration_months: r.course_duration_months || "", education_level: r.education_level || "" })} title="Edit details"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
                          <Pencil size={13} /> Edit
                        </button>
                        {r.challan_url && (
                          <a href={r.challan_url} target="_blank" rel="noreferrer" title="Download / view challan"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#B45309" }}>
                            <FileDown size={13} /> Challan
                          </a>
                        )}
                        {r.certificate_url && (
                          <a href={r.certificate_url} target="_blank" rel="noreferrer" title="Download certificate"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#15803D" }}>
                            <FileDown size={13} /> Certificate
                          </a>
                        )}
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => setChallan({ id: r.id, discount: "", type: "amount", fee: Number(r.certificate_fee) || 0, duration: r.course_duration_months || "", mode: "process" })} title="Issue challan & start processing"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg text-white" style={{ background: "#C2410C" }}>
                              <ReceiptText size={14} /> Process
                            </button>
                            <button onClick={() => setReject({ id: r.id, reason: "" })} title="Reject"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === "processing" && (
                          <>
                            <button onClick={() => setChallan({ id: r.id, discount: Number(r.certificate_discount) || "", type: "amount", fee: Number(r.certificate_fee) || 0, duration: r.course_duration_months || "", mode: "resend" })} title="Re-send the challan"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#B45309" }}>
                              <ReceiptText size={14} /> Send challan again
                            </button>
                            <button onClick={() => setPayment({ id: r.id, net: Number(r.certificate_net) || 0, fee: Number(r.certificate_fee) || 0, discount: Number(r.certificate_discount) || 0, lines: [{ method: "cash", amount: String(r.certificate_net ?? ""), account_uuid: "", reference: "" }] })} title="Record payment & approve"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg text-white" style={{ background: "#15803D" }}>
                              <CheckCircle2 size={14} /> Approve (paid)
                            </button>
                            <button onClick={() => setReject({ id: r.id, reason: "" })} title="Reject"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        {(r.status === "approved" || r.status === "delivered") && (
                          <button onClick={() => setChallan({ id: r.id, discount: Number(r.certificate_discount) || "", type: "amount", fee: Number(r.certificate_fee) || 0, mode: "resend" })} title="Email the challan to the applicant"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#B45309" }}>
                            <ReceiptText size={14} /> Send challan
                          </button>
                        )}
                        {r.status === "approved" && (
                          <button onClick={() => setDeliver({ id: r.id, note: "" })} title="Mark delivered"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg text-white" style={{ background: "#1D4ED8" }}>
                            <Truck size={14} /> Mark delivered
                          </button>
                        )}
                        {(r.status === "delivered" || r.status === "rejected") && (
                          <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: TEXT_MUTED }}>
                            <FileCheck2 size={14} /> {r.status === "delivered" ? "Done" : "Closed"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>{pg.total || 0} total{pg.from ? ` · ${pg.from}–${pg.to}` : ""}</span>
          <div className="flex items-center gap-1">
            <button disabled={pg.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid w-8 h-8 rounded-lg place-items-center disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}><ChevronLeft size={15} /></button>
            <span className="px-2 text-[12px]" style={{ color: TEXT_PRIMARY }}>{pg.current_page || 1} / {pg.last_page || 1}</span>
            <button disabled={pg.current_page >= pg.last_page} onClick={() => setPage((p) => p + 1)}
              className="grid w-8 h-8 rounded-lg place-items-center disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {edit && (
        <Modal title="Edit applicant details" onClose={() => setEdit(null)}>
          <div className="grid grid-cols-2 gap-2.5">
            <input value={edit.full_name} onChange={(e)=>setEdit({...edit,full_name:e.target.value})} placeholder="Full name" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <input value={edit.father_name} onChange={(e)=>setEdit({...edit,father_name:e.target.value})} placeholder="Father's name" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <input value={edit.email} onChange={(e)=>setEdit({...edit,email:e.target.value})} placeholder="Email" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <input value={edit.phone} onChange={(e)=>setEdit({...edit,phone:e.target.value})} placeholder="Phone" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <input value={edit.cnic} onChange={(e)=>setEdit({...edit,cnic:e.target.value})} placeholder="CNIC" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <SearchableSelect
              options={courses.map((c) => ({ value: String(c.id), label: c.name }))}
              value={edit.course_id ? String(edit.course_id) : ""}
              onChange={(v) => setEdit({ ...edit, course_id: v || "" })}
              placeholder="Course" />
            <input value={edit.course_duration_months} onChange={(e)=>setEdit({...edit,course_duration_months:e.target.value})} type="number" min="1" max="120" placeholder="Duration (months)" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            <select value={edit.gender} onChange={(e)=>setEdit({...edit,gender:e.target.value})} className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
              <option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
            <input value={edit.education_level} onChange={(e)=>setEdit({...edit,education_level:e.target.value})} placeholder="Education level" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEdit(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
            <button onClick={doEdit} disabled={savingEdit} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND }}>{savingEdit ? "Saving…" : "Save changes"}</button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {reject && (
        <Modal title="Reject application" onClose={() => setReject(null)}>
          <p className="text-[13px] mb-3" style={{ color: TEXT_MUTED }}>Tell the applicant why this was rejected. This is required.</p>
          <textarea value={reject.reason} onChange={(e) => setReject({ ...reject, reason: e.target.value })} rows={4}
            placeholder="Reason for rejection" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setReject(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
            <button onClick={doReject} disabled={rejecting} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND }}>{rejecting ? "Rejecting…" : "Reject"}</button>
          </div>
        </Modal>
      )}

      {/* Deliver modal */}
      {deliver && (
        <Modal title="Mark as delivered" onClose={() => setDeliver(null)}>
          <p className="text-[13px] mb-3" style={{ color: TEXT_MUTED }}>Optionally note how the certificate was delivered (e.g., "Collected in person", "Couriered TCS").</p>
          <input value={deliver.note} onChange={(e) => setDeliver({ ...deliver, note: e.target.value })}
            placeholder="Delivery note (optional)" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDeliver(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
            <button onClick={doDeliver} disabled={delivering} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: "#1D4ED8" }}>{delivering ? "Saving…" : "Mark delivered"}</button>
          </div>
        </Modal>
      )}

      {/* Send challan modal (optional discount) */}
      {challan && (() => {
        const fee = Number(challan.fee) || 0;
        const d = Number(challan.discount) || 0;
        const abs = challan.type === "percent" ? Math.round(fee * (d / 100)) : d;
        const net = Math.max(0, fee - Math.min(abs, fee));
        return (
          <Modal title={challan.mode === "process" ? "Process — issue challan" : "Send challan"} onClose={() => setChallan(null)}>
            <p className="text-[13px] mb-3" style={{ color: TEXT_MUTED }}>
              {challan.mode === "process"
                ? "Issue the fee challan and move this application to Processing. Apply an optional discount; the challan is emailed to the applicant."
                : "Re-send the fee challan to the applicant. You can adjust the optional discount; the challan PDF is regenerated with the breakdown."}
            </p>
            <div className="rounded-lg px-3 py-2 mb-3 text-[13px]" style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY }}>
              Certificate fee: <b>Rs {fee.toLocaleString()}</b>{fee === 0 && <span style={{ color: TEXT_MUTED }}> (uses the fee set in Settings)</span>}
            </div>
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Course duration (months)</label>
            <input type="number" min="1" max="120" value={challan.duration ?? ""} onChange={(e) => setChallan({ ...challan, duration: e.target.value })}
              placeholder="e.g. 6 — varies per student" className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none" style={inputStyle} />
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Discount</label>
            <div className="flex gap-2">
              <input type="number" min="0" value={challan.discount} onChange={(e) => setChallan({ ...challan, discount: e.target.value })}
                placeholder="Discount (optional)" className="flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <select value={challan.type} onChange={(e) => setChallan({ ...challan, type: e.target.value })}
                className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
                <option value="amount">Rs</option>
                <option value="percent">%</option>
              </select>
            </div>
            {d > 0 && fee > 0 && (
              <div className="mt-3 text-[13px]" style={{ color: TEXT_SECONDARY }}>
                Discount: <b style={{ color: "#15803D" }}>− Rs {Math.min(abs, fee).toLocaleString()}</b> &nbsp;·&nbsp; Payable: <b style={{ color: BRAND }}>Rs {net.toLocaleString()}</b>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setChallan(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
              <button onClick={doChallan} disabled={sendingChallan} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: "#B45309" }}>
                {sendingChallan ? <><Loader2 size={14} className="animate-spin" /> {challan.mode === "process" ? "Processing…" : "Sending…"}</> : <><ReceiptText size={14} /> {challan.mode === "process" ? "Issue challan & process" : "Send challan"}</>}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Approve — record payment (split across methods/accounts) + discount */}
      {payment && (() => {
        const methods = [
          { k: "cash", label: "Cash" },
          { k: "bank", label: "Bank" },
          { k: "jazzcash", label: "JazzCash" },
          { k: "easypaisa", label: "Easypaisa" },
          { k: "nayapay", label: "NayaPay" },
        ];
        const setLine = (i, key, val) => setPayment({ ...payment, lines: payment.lines.map((l, idx) => idx === i ? { ...l, [key]: val } : l) });
        const addLine = () => setPayment({ ...payment, lines: [...payment.lines, { method: "cash", amount: "", account_uuid: "", reference: "" }] });
        const removeLine = (i) => setPayment({ ...payment, lines: payment.lines.filter((_, idx) => idx !== i) });
        const sum = payment.lines.reduce((t, l) => t + (parseFloat(l.amount) || 0), 0);
        const net = Math.max(0, (Number(payment.fee) || 0) - (Number(payment.discount) || 0));
        return (
          <Modal title="Approve — record payment" onClose={() => setPayment(null)}>
            <p className="text-[13px] mb-3" style={{ color: TEXT_MUTED }}>
              Record how much the student paid (split across methods/accounts if needed) and any discount. The fee is logged as income with the same split.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Certificate fee</label>
                <input type="number" value={payment.fee} disabled className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ ...inputStyle, opacity: 0.7 }} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Discount</label>
                <input type="number" min="0" value={payment.discount} onChange={(e) => setPayment({ ...payment, discount: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Net payable</label>
                <input type="number" value={net} disabled className="w-full px-3 py-2 text-sm rounded-lg outline-none font-bold" style={{ ...inputStyle, opacity: 0.9 }} />
              </div>
            </div>

            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Payment split</label>
            <div className="space-y-2">
              {payment.lines.map((l, i) => (
                <div key={i} className="grid items-center grid-cols-12 gap-2">
                  <select value={l.method} onChange={(e) => setLine(i, "method", e.target.value)} className="col-span-3 px-2 py-2 text-xs rounded-lg outline-none" style={inputStyle}>
                    {methods.map((m) => <option key={m.k} value={m.k}>{m.label}</option>)}
                  </select>
                  <select value={l.account_uuid} onChange={(e) => setLine(i, "account_uuid", e.target.value)} className="col-span-4 px-2 py-2 text-xs rounded-lg outline-none" style={inputStyle}>
                    <option value="">Account (optional)…</option>
                    {payAccounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.display_name}</option>)}
                  </select>
                  <input type="number" min="0" placeholder="Amount" value={l.amount} onChange={(e) => setLine(i, "amount", e.target.value)} className="col-span-2 px-2 py-2 text-xs text-right rounded-lg outline-none" style={inputStyle} />
                  <input placeholder="Ref" value={l.reference} onChange={(e) => setLine(i, "reference", e.target.value)} className="col-span-2 px-2 py-2 text-xs rounded-lg outline-none" style={inputStyle} />
                  <button type="button" onClick={() => removeLine(i)} disabled={payment.lines.length === 1} className="flex justify-center col-span-1 p-1 rounded disabled:opacity-30" style={{ color: TEXT_MUTED }}><X size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold" style={{ color: BRAND }}><Plus size={13} /> Add split line</button>

            <div className="flex items-center justify-between pt-2 mt-2 text-[12px]" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_MUTED }}>Split total</span>
              <span className="font-bold" style={{ color: Math.abs(sum - net) > 0.01 ? "#C2410C" : "#15803D" }}>Rs {sum.toLocaleString()} {Math.abs(sum - net) > 0.01 ? `(net Rs ${net.toLocaleString()})` : ""}</span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPayment(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
              <button onClick={doApprove} disabled={approving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: "#15803D" }}>
                {approving ? <><Loader2 size={14} className="animate-spin" /> Approving…</> : <><CheckCircle2 size={14} /> Record payment & issue</>}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Photo lightbox */}
      {photoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(2,6,23,.7)" }} onClick={() => setPhotoView(null)}>
          <img src={photoView} alt="Applicant" className="max-h-[85vh] max-w-[90vw] rounded-xl" style={{ border: "3px solid #fff" }} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed z-50 px-4 py-3 text-sm font-semibold text-white rounded-lg shadow-lg bottom-6 right-6"
          style={{ background: toast.ok ? "#15803D" : BRAND }}>{toast.msg}</div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,6,23,.5)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <h3 className="text-base font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
