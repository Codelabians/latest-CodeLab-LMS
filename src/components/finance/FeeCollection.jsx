import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet, Search, Loader2, Plus, Trash2, CheckCircle2, AlertTriangle, X,
  CalendarDays, BadgeDollarSign, BadgePercent, User as UserIcon, Download, Mail, MessageCircle,
} from "lucide-react";
import { useGetQuery, usePostMutation, useDownloadChallanMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import SecureFigure from "./SecureFigure";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLE = {
  paid: { bg: "#DCFCE7", fg: "#15803D", label: "Paid" },
  partially_paid: { bg: "#FEF3C7", fg: "#B45309", label: "Partial" },
  overdue: { bg: "#FEE2E2", fg: "#B91C1C", label: "Overdue" },
  pending: { bg: "#E2E8F0", fg: "#475569", label: "Pending" },
  break: { bg: "#DBEAFE", fg: "#1D4ED8", label: "On break" },
  waived: { bg: "#F5F3FF", fg: "#6D28D9", label: "Waived" },
};

export default function FeeCollection() {
  const currentUser = useSelector(selectCurrentUser);
  const canSkipFinance = hasPermission(currentUser, "record historical-payment");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [feeStatus, setFeeStatus] = useState("all"); // all | pending | overdue
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [toast, setToast] = useState(null);
  const [collectFor, setCollectFor] = useState(null); // installment row
  const [leaveFor, setLeaveFor] = useState(null); // installment for leave adjustment
  const [discountFor, setDiscountFor] = useState(null); // installment for manual discount
  const [advanceOpen, setAdvanceOpen] = useState(false);

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  // Challan actions (download / email / whatsapp) per installment.
  const [dlChallan] = useDownloadChallanMutation();
  const [sendChallan] = usePostMutation();
  const [resetInst] = usePostMutation();
  const [deleteInst] = usePostMutation();
  const [breakInst] = usePostMutation();
  const [waiveInst] = usePostMutation();

  const resetToPending = async (uuid) => {
    if (!window.confirm("Undo all payments on this installment and set it back to pending? Any finance income/ledger for it is reversed.")) return;
    try {
      await resetInst({ path: `finance/installments/${uuid}/reset`, body: {} }).unwrap();
      notify("Installment reset to pending.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not reset installment.", false);
    }
  };

  const deleteInstallment = async (uuid) => {
    if (!window.confirm("Delete this fee record permanently? Use this for months the student is not liable for (e.g. approved leave). Any finance income/ledger for it is reversed. This cannot be undone.")) return;
    try {
      await deleteInst({ path: `finance/installments/${uuid}/delete`, body: {} }).unwrap();
      notify("Fee record deleted.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not delete the fee record.", false);
    }
  };

  const toggleBreak = async (uuid) => {
    try {
      const res = await breakInst({ path: `finance/installments/${uuid}/toggle-break`, body: {} }).unwrap();
      notify(res?.message || "Break status updated.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not update break status.", false);
    }
  };

  const toggleWaive = async (uuid) => {
    try {
      const res = await waiveInst({ path: `finance/installments/${uuid}/toggle-waive`, body: {} }).unwrap();
      notify(res?.message || "Waiver updated.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not update waiver.", false);
    }
  };
  const [challanBusy, setChallanBusy] = useState(null);
  const downloadChallanFor = async (uuid) => {
    setChallanBusy(`dl-${uuid}`);
    try { await dlChallan({ path: `finance/installments/${uuid}/challan`, params: {}, filename: `challan-${uuid}.pdf` }).unwrap(); }
    catch { notify("Could not download challan.", false); }
    finally { setChallanBusy(null); }
  };
  const sendChallanFor = async (uuid, channel) => {
    setChallanBusy(`${channel}-${uuid}`);
    try {
      const res = await sendChallan({ path: `finance/installments/${uuid}/${channel === "email" ? "email-challan" : "whatsapp-challan"}`, body: {} }).unwrap();
      notify(res?.message || (channel === "email" ? "Challan emailed." : "Challan sent on WhatsApp."));
    } catch (e) { notify(e?.data?.message || `Could not send the challan via ${channel}.`, false); }
    finally { setChallanBusy(null); }
  };

  // --- Student dropdown feed -------------------------------------------
  const studentsQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (feeStatus !== "all") p.set("fee_status", feeStatus);
    p.set("limit", "50");
    return p.toString();
  }, [debouncedQ, feeStatus]);

  const { data: studentsData, isFetching: loadingStudents } = useGetQuery({
    path: `finance/fee-collection/students?${studentsQuery}`,
  });
  const students = useMemo(() => studentsData?.data || [], [studentsData]);

  const options = useMemo(
    () => students.map((s) => ({
      value: s.uuid,
      label: `${s.name}${s.course ? " — " + s.course : ""}${s.batch ? " / " + s.batch : ""}`,
      avatarUrl: s.image || null,
    })),
    [students]
  );
  const selectedStudent = useMemo(
    () => students.find((s) => s.uuid === selectedUuid) || null,
    [students, selectedUuid]
  );

  // --- Selected student's installments ---------------------------------
  const { data: feeData, isFetching: loadingFees, refetch } = useGetQuery(
    { path: `finance/fee-collection/${selectedUuid}/installments` },
    { skip: !selectedUuid }
  );
  const student = feeData?.data?.student || selectedStudent;
  const installments = useMemo(() => feeData?.data?.installments || [], [feeData]);

  const totals = useMemo(() => installments.reduce(
    (a, i) => ({
      amount: a.amount + Number(i.amount || 0),
      paid: a.paid + Number(i.paid || 0),
      remaining: a.remaining + Number(i.remaining || 0),
    }), { amount: 0, paid: 0, remaining: 0 }
  ), [installments]);

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  const Chip = ({ id, label }) => (
    <button
      onClick={() => setFeeStatus(id)}
      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition"
      style={feeStatus === id
        ? { background: BRAND, color: "#fff" }
        : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
    >{label}</button>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `${BRAND}14`, color: BRAND }}><Wallet size={22} /></span>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>Collect Fee</h1>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Search a student, pick a month, record a full, partial or split payment.</p>
        </div>
      </div>

      {/* Picker card */}
      <div className="bg-white rounded-xl p-4 mb-5" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Student</label>
            <SearchableSelect
              options={options}
              value={selectedUuid}
              onChange={(v) => setSelectedUuid(v)}
              placeholder={loadingStudents ? "Searching…" : "Search by name, email, CNIC or phone…"}
              showAvatars
              onSearch={(text) => setQ(text)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Chip id="all" label="All" />
            <Chip id="pending" label="Pending fee" />
            <Chip id="overdue" label="Overdue" />
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: TEXT_MUTED }}>
          Showing {students.length} student{students.length === 1 ? "" : "s"}{feeStatus !== "all" ? ` with ${feeStatus} fee` : ""}.
        </p>
      </div>

      {/* No selection */}
      {!selectedUuid && (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Search size={26} className="mx-auto mb-2" style={{ color: TEXT_MUTED }} />
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>Pick a student above to view their fee schedule and collect a payment.</p>
        </div>
      )}

      {/* Selected student */}
      {selectedUuid && (
        <>
          <div className="bg-white rounded-xl p-4 mb-4 flex items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
            {student?.image
              ? <img src={student.image} alt="" className="rounded-full object-cover" style={{ width: 56, height: 56 }} />
              : <span className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: `${BRAND}14`, color: BRAND }}><UserIcon size={24} /></span>}
            <div className="flex-1">
              <div className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{student?.name}</div>
              <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {selectedStudent?.course || "—"}{selectedStudent?.batch ? ` · ${selectedStudent.batch}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Outstanding</div>
              <div className="text-[18px] font-bold" style={{ color: totals.remaining > 0 ? BRAND : "#15803D" }}>
                <SecureFigure variant="inline" maskKey="fee_collection.outstanding">{money(totals.remaining)}</SecureFigure>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Fee schedule</span>
              <div className="flex items-center gap-2">
                {loadingFees && <Loader2 size={16} className="animate-spin" style={{ color: TEXT_MUTED }} />}
                <button onClick={() => setAdvanceOpen(true)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>Pay months ahead</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                    <th className="text-left px-4 py-2 font-semibold">Course / Batch</th>
                    <th className="text-left px-4 py-2 font-semibold">Type</th>
                    <th className="text-left px-4 py-2 font-semibold">Due date</th>
                    <th className="text-left px-4 py-2 font-semibold">Paid date</th>
                    <th className="text-right px-4 py-2 font-semibold">Amount</th>
                    <th className="text-right px-4 py-2 font-semibold">Paid</th>
                    <th className="text-right px-4 py-2 font-semibold">Remaining</th>
                    <th className="text-center px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {installments.length === 0 && !loadingFees && (
                    <tr><td colSpan={9} className="text-center px-4 py-8" style={{ color: TEXT_MUTED }}>No fee records for this student.</td></tr>
                  )}
                  {installments.map((i) => {
                    const st = STATUS_STYLE[i.status] || STATUS_STYLE.pending;
                    const methods = i.method_breakdown && Object.keys(i.method_breakdown).length
                      ? Object.entries(i.method_breakdown).map(([m, a]) => `${m}: ${money(a)}`).join(", ")
                      : null;
                    return (
                      <tr key={i.installment_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-2.5" style={{ color: TEXT_PRIMARY }}>
                          <div className="font-semibold">{i.course || "—"}</div>
                          <div style={{ color: TEXT_MUTED }}>{i.batch || ""}</div>
                        </td>
                        <td className="px-4 py-2.5 capitalize" style={{ color: TEXT_SECONDARY }}>{i.fee_type}</td>
                        <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{i.due_date || "—"}</td>
                        <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{i.paid_date ? String(i.paid_date).slice(0, 10) : "—"}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: TEXT_PRIMARY }}>{money(i.amount)}</td>
                        <td className="px-4 py-2.5 text-right" style={{ color: "#15803D" }}>{money(i.paid)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold" style={{ color: i.remaining > 0 ? BRAND : TEXT_MUTED }}>{money(i.remaining)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                          {methods && <div className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>{methods}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 justify-end">
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
                              <button
                                onClick={() => setCollectFor(i)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                                style={{ background: BRAND }}
                              >Collect</button>
                            )}
                            {i.status === "break" ? (
                              <button
                                onClick={() => toggleBreak(i.installment_uuid)}
                                title="Remove break → pending"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}
                              >Unbreak</button>
                            ) : i.remaining > 0 ? (
                              <button
                                onClick={() => toggleBreak(i.installment_uuid)}
                                title="Mark as student-on-break (not owed for this month)"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}
                              >Break</button>
                            ) : null}
                            {i.status === "waived" ? (
                              <button
                                onClick={() => toggleWaive(i.installment_uuid)}
                                title="Remove waiver → pending"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}
                              >Unwaive</button>
                            ) : i.status !== "paid" ? (
                              <button
                                onClick={() => toggleWaive(i.installment_uuid)}
                                title="Waive this fee — relief, not owed"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}
                              >Waive</button>
                            ) : null}
                            {i.remaining > 0 && i.status !== "paid" && i.status !== "waived" && (
                              <button
                                onClick={() => setLeaveFor(i)}
                                title="Leave adjustment — credit days on leave, reducing what's owed"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #FBCFE8", background: "#FDF2F8", color: "#9D174D" }}
                              >Leave</button>
                            )}
                            {i.remaining > 0 && i.status !== "paid" && i.status !== "waived" && (
                              <button
                                onClick={() => setDiscountFor(i)}
                                title="Discount — write off part or all of the remaining amount, with a reason"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309" }}
                              >Discount</button>
                            )}
                            {canSkipFinance && i.remaining <= 0 && Number(i.paid) > 0 && (
                              <button
                                onClick={() => resetToPending(i.installment_uuid)}
                                title="Undo payments → pending"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #FCA5A5", color: "#B91C1C" }}
                              >Reset</button>
                            )}
                            {canSkipFinance && (
                              <button
                                onClick={() => deleteInstallment(i.installment_uuid)}
                                title="Delete this fee record (e.g. leave month)"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C" }}
                              >Delete</button>
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
        </>
      )}

      {collectFor && (
        <CollectModal
          installment={collectFor}
          studentUuid={selectedUuid}
          canSkipFinance={canSkipFinance}
          onClose={() => setCollectFor(null)}
          onDone={(msg) => { notify(msg); setCollectFor(null); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {leaveFor && (
        <LeaveAdjustModal
          installment={leaveFor}
          onClose={() => setLeaveFor(null)}
          onDone={(msg) => { notify(msg); setLeaveFor(null); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {discountFor && (
        <DiscountModal
          installment={discountFor}
          onClose={() => setDiscountFor(null)}
          onDone={(msg) => { notify(msg); setDiscountFor(null); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {advanceOpen && (
        <AdvanceModal
          studentUuid={selectedUuid}
          canSkipFinance={canSkipFinance}
          onClose={() => setAdvanceOpen(false)}
          onDone={(msg) => { notify(msg); setAdvanceOpen(false); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg"
          style={{ background: toast.ok ? "#15803D" : BRAND }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Collect modal — split-tender payment recording                     */
/* ------------------------------------------------------------------ */
export function CollectModal({ installment, studentUuid, onClose, onDone, onError, canSkipFinance }) {
  const remaining = Number(installment.remaining || 0);
  const [skipFinance, setSkipFinance] = useState(false);
  const [splits, setSplits] = useState([
    { amount: remaining ? String(remaining) : "", payment_method: "cash", paid_at: todayStr(), reference: "" },
  ]);
  const [note, setNote] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const total = splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const over = total > remaining + 0.001;

  const addSplit = () => setSplits((s) => [...s, { amount: "", payment_method: "cash", paid_at: todayStr(), reference: "" }]);
  const removeSplit = (idx) => setSplits((s) => s.filter((_, i) => i !== idx));
  const update = (idx, key, val) => setSplits((s) => s.map((r, i) => (i === idx ? { ...r, [key]: val } : r)));

  const submit = async () => {
    const clean = splits
      .map((s) => ({ ...s, amount: parseFloat(s.amount) }))
      .filter((s) => s.amount > 0);
    if (clean.length === 0) { onError("Enter at least one amount."); return; }
    if (over) { onError("Total exceeds the remaining balance."); return; }
    try {
      await post({
        path: `finance/fee-collection/${studentUuid}/collect`,
        body: {
          installment_uuid: installment.installment_uuid,
          note: note || undefined,
          skip_finance: skipFinance || undefined,
          splits: clean.map((s) => ({
            amount: s.amount,
            payment_method: s.payment_method,
            paid_at: s.paid_at || undefined,
            reference: s.reference || undefined,
          })),
        },
      }).unwrap();
      onDone("Payment recorded.");
    } catch (e) {
      onError(e?.data?.message || "Could not record payment.");
    }
  };

  const cellStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign size={18} style={{ color: BRAND }} />
            <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Collect Payment</span>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between text-[12px] mb-4 p-3 rounded-lg" style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
            <span>{installment.course} · {installment.batch}</span>
            <span>Remaining <b style={{ color: BRAND }}>{money(remaining)}</b></span>
          </div>

          <div className="text-[11px] font-semibold mb-2" style={{ color: TEXT_SECONDARY }}>Payment splits</div>
          {splits.map((s, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <input
                type="number" min="0" placeholder="Amount"
                value={s.amount} onChange={(e) => update(idx, "amount", e.target.value)}
                className="col-span-3 px-2 py-2 rounded-lg text-[12px] outline-none" style={cellStyle}
              />
              <select
                value={s.payment_method} onChange={(e) => update(idx, "payment_method", e.target.value)}
                className="col-span-3 px-2 py-2 rounded-lg text-[12px] outline-none" style={cellStyle}
              >
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <input
                type="date" value={s.paid_at} onChange={(e) => update(idx, "paid_at", e.target.value)}
                className="col-span-3 px-2 py-2 rounded-lg text-[12px] outline-none" style={cellStyle}
              />
              <input
                type="text" placeholder="Ref #"
                value={s.reference} onChange={(e) => update(idx, "reference", e.target.value)}
                className="col-span-2 px-2 py-2 rounded-lg text-[12px] outline-none" style={cellStyle}
              />
              <button onClick={() => removeSplit(idx)} disabled={splits.length === 1}
                className="col-span-1 flex justify-center" style={{ color: splits.length === 1 ? TEXT_MUTED : BRAND, opacity: splits.length === 1 ? 0.4 : 1 }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button onClick={addSplit} className="flex items-center gap-1 text-[12px] font-semibold mt-1" style={{ color: BRAND }}>
            <Plus size={14} /> Add split (different method / date)
          </button>

          <div className="mt-4">
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. balance to be paid next week"
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cellStyle} />
          </div>
          {canSkipFinance && (
            <label className="mt-3 flex items-start gap-2 p-3 rounded-lg cursor-pointer" style={{ background: "#FEF9C3", border: "1px solid #FDE68A" }}>
              <input type="checkbox" checked={skipFinance} onChange={(e) => setSkipFinance(e.target.checked)} className="mt-0.5" />
              <span className="text-[11.5px]" style={{ color: "#854D0E" }}>
                <b>Historical — don&apos;t record in finance.</b> Marks the fee paid in the student&apos;s record only; no income or ledger entry is created. Use for back-dated months.
              </span>
            </label>
          )}

          <div className="flex items-center justify-between mt-4 p-3 rounded-lg" style={{ background: SURFACE_HOVER }}>
            <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Total this payment</span>
            <span className="text-[15px] font-bold" style={{ color: over ? BRAND : TEXT_PRIMARY }}>{money(total)}</span>
          </div>
          {over && <p className="text-[11px] mt-1" style={{ color: BRAND }}>Exceeds the remaining balance of {money(remaining)}.</p>}
        </div>

        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || over || total <= 0}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #A30505)`, opacity: (isLoading || over || total <= 0) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Advance modal — pay the next N months up front                     */
/* ------------------------------------------------------------------ */
export function AdvanceModal({ studentUuid, onClose, onDone, onError, canSkipFinance }) {
  const [months, setMonths] = useState("1");
  const [method, setMethod] = useState("cash");
  const [account, setAccount] = useState("");
  const [paidAt, setPaidAt] = useState(todayStr());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [skipFinance, setSkipFinance] = useState(false);
  const [post, { isLoading }] = usePostMutation();
  const { data: acctResp } = useGetQuery({ path: "/finance/payment-accounts/active" });
  const accounts = acctResp?.data || [];

  const submit = async () => {
    const m = parseInt(months, 10);
    if (!m || m < 1) { onError("Enter how many months to pay."); return; }
    try {
      const res = await post({ path: `finance/fee-collection/${studentUuid}/advance`, body: {
        months: m,
        payment_method: method,
        paid_at: paidAt || undefined,
        account_uuid: account || undefined,
        reference: reference || undefined,
        note: note || undefined,
        skip_finance: skipFinance || undefined,
      } }).unwrap();
      onDone(res?.message || `${m} month(s) paid in advance.`);
    } catch (e) {
      onError(e?.data?.message || "Could not record the advance payment.");
    }
  };

  const cellStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign size={18} style={{ color: BRAND }} />
            <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Pay months in advance</span>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Marks the next unpaid months paid at their monthly rate. Any upcoming months that don&apos;t exist yet are generated automatically. Already-paid, waived or on-break months are skipped.</p>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Number of months</label>
            <input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle}>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Paid on</label>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Account (optional)</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle}>
              <option value="">Auto (by method)</option>
              {accounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.display_name || a.account_title || a.bank_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Reference (optional)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN / cheque #" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 4 months advance" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
          {canSkipFinance && (
            <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer" style={{ background: "#FEF9C3", border: "1px solid #FDE68A" }}>
              <input type="checkbox" checked={skipFinance} onChange={(e) => setSkipFinance(e.target.checked)} className="mt-0.5" />
              <span className="text-[11.5px]" style={{ color: "#854D0E" }}><b>Historical — don&apos;t record in finance.</b> Marks the months paid without an income/ledger entry.</span>
            </label>
          )}
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${BRAND}, #A30505)`, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Record advance
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Leave adjustment — write down the days the student was on leave     */
/* ------------------------------------------------------------------ */
/*
 * Manual discount — write off part or all of the outstanding balance with a
 * MANDATORY reason. Covers "she paid 5,500 of 6,000, waive the last 500" and
 * any goodwill monthly discount. Fully-discounted rows settle automatically
 * (paid if money was received, waived otherwise).
 */
export function DiscountModal({ installment, onClose, onDone, onError }) {
  const remaining = Number(installment.remaining || 0);
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");
  const [note, setNote] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const submit = async () => {
    const a = parseFloat(amount);
    if (!(a > 0)) { onError("Enter the discount amount."); return; }
    if (!note.trim()) { onError("A reason note is required for a discount."); return; }
    try {
      const res = await post({
        path: `finance/installments/${installment.installment_uuid}/discount`,
        body: { amount: a, note: note.trim() },
      }).unwrap();
      onDone(res?.message || "Discount applied.");
    } catch (e) {
      const errs = e?.data?.errors;
      onError((errs && Object.values(errs)[0]?.[0]) || e?.data?.message || "Could not apply the discount.");
    }
  };

  const cellStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <BadgePercent size={18} style={{ color: "#B45309" }} />
            <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Apply discount</span>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Write off part or all of what&apos;s still owed on this installment — money already paid is never touched.
            If the discount clears the balance, the installment settles automatically.
            Outstanding now: <b style={{ color: TEXT_PRIMARY }}>Rs {remaining.toLocaleString()}</b>.
          </p>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Discount amount (Rs)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Reason / note (required)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. referral top-up for this month / financial hardship" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !note.trim() || !(parseFloat(amount) > 0)} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "#B45309", opacity: (isLoading || !note.trim() || !(parseFloat(amount) > 0)) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Apply discount
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeaveAdjustModal({ installment, onClose, onDone, onError }) {
  const remaining = Number(installment.remaining || 0);
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");
  const [note, setNote] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const submit = async () => {
    const a = parseFloat(amount);
    if (!(a > 0)) { onError("Enter the leave amount to credit."); return; }
    try {
      const res = await post({
        path: `finance/installments/${installment.installment_uuid}/leave-adjust`,
        body: { amount: a, note: note || undefined },
      }).unwrap();
      onDone(res?.message || "Leave adjustment applied.");
    } catch (e) {
      onError(e?.data?.message || "Could not apply the leave adjustment.");
    }
  };

  const cellStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} style={{ color: "#9D174D" }} />
            <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Leave adjustment</span>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Credit the portion of this fee the student doesn&apos;t owe because they were on leave. It reduces the amount due (recorded as a note); the rest can be collected as a normal payment. Outstanding now: <b style={{ color: TEXT_PRIMARY }}>Rs {remaining.toLocaleString()}</b>.</p>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Leave amount to credit (Rs)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Reason / note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 3 days leave" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={cellStyle} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "#9D174D", opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Apply leave credit
          </button>
        </div>
      </div>
    </div>
  );
}
