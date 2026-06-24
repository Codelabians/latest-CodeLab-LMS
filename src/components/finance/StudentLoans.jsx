import { useMemo, useState } from "react";
import {
  HandCoins, Plus, X, Loader2, Check, Ban, Send, CircleDollarSign, Search, Paperclip,
} from "lucide-react";
import {
  useGetQuery, usePostMutation,
} from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import { showToast } from "../ui/common/ShowToast";

/* ---- tokens (match finance module) ---- */
const BRAND = "#C90606";
const GREEN = "#15803D";
const BLUE = "#1D4ED8";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_META = {
  pending:   { label: "Pending",   bg: "#FEF9C3", color: "#854D0E" },
  approved:  { label: "Approved",  bg: "#DBEAFE", color: BLUE },
  active:    { label: "Active",    bg: "#FEF2F2", color: BRAND },
  completed: { label: "Completed", bg: "#F0FDF4", color: GREEN },
  rejected:  { label: "Rejected",  bg: "#F1F5F9", color: TEXT_MUTED },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", color: TEXT_MUTED },
};

const STATUS_TABS = ["all", "pending", "approved", "active", "completed", "rejected", "cancelled"];

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize"
      style={{ background: m.bg, color: m.color }}>{m.label}</span>
  );
}

export default function StudentLoans() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [repayFor, setRepayFor] = useState(null); // loan object
  const [disburseFor, setDisburseFor] = useState(null); // loan object

  const params = useMemo(() => {
    const p = { per_page: 50 };
    if (status !== "all") p.status = status;
    if (q.trim()) p.q = q.trim();
    return p;
  }, [status, q]);

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "finance/student-loans", params },
    { refetchOnMountOrArgChange: true }
  );
  const loans = data?.data || [];

  const [post, { isLoading: posting }] = usePostMutation();

  const act = async (uuid, action, body) => {
    try {
      const res = await post({ path: `finance/student-loans/${uuid}/${action}`, body: body || {} }).unwrap();
      showToast(res?.message || "Done", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Action failed", "error");
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><HandCoins size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Student loans</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Interest-free advances · finance approved</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={15} /> New loan
        </button>
      </div>

      <div className="space-y-4">

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex p-1 rounded-lg flex-wrap" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setStatus(t)} className="px-2.5 py-1.5 text-[11.5px] font-semibold rounded-md capitalize"
              style={status === t ? { background: "#fff", color: BRAND, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: TEXT_MUTED }}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} style={{ color: TEXT_MUTED, position: "absolute", left: 10, top: 10 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student…" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : loans.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No loans found.</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                {["Student", "Principal", "Repaid", "Outstanding", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.loan_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{l.student?.name || "—"}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{l.student?.email || ""}</div>
                    {l.reason && <div className="text-[11px] mt-0.5" style={{ color: TEXT_SECONDARY }}>{l.reason}</div>}
                  </td>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(l.principal_amount)}</td>
                  <td className="px-3 py-2.5" style={{ color: GREEN }}>{money(l.collected_amount)}</td>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: l.outstanding > 0 ? BRAND : GREEN }}>{money(l.outstanding)}</td>
                  <td className="px-3 py-2.5"><Badge status={l.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {l.status === "pending" && (
                        <>
                          <button disabled={posting} onClick={() => act(l.loan_uuid, "approve")} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#DBEAFE", color: BLUE }}><Check size={12} /> Approve</button>
                          <button disabled={posting} onClick={() => { const r = window.prompt("Reason for rejection (optional):") ?? null; act(l.loan_uuid, "reject", { rejection_reason: r }); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#F1F5F9", color: TEXT_MUTED }}><Ban size={12} /> Reject</button>
                        </>
                      )}
                      {l.status === "approved" && (
                        <button disabled={posting} onClick={() => setDisburseFor(l)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#FEF2F2", color: BRAND }}><Send size={12} /> Disburse</button>
                      )}
                      {(l.status === "active" || l.status === "approved") && (
                        <button onClick={() => setRepayFor(l)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#F0FDF4", color: GREEN }}><CircleDollarSign size={12} /> Repayment</button>
                      )}
                      {["pending", "approved", "active"].includes(l.status) && (
                        <button disabled={posting} onClick={() => { if (window.confirm(`Cancel loan for ${l.student?.name || "student"}?`)) act(l.loan_uuid, "cancel"); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#F1F5F9", color: TEXT_MUTED }}><X size={12} /> Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {isFetching && !isLoading && <div className="py-1.5 text-center text-[11px]" style={{ color: TEXT_MUTED }}>Refreshing…</div>}
      </div>
      </div>

      {showCreate && <CreateLoanModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refetch(); }} />}
      {repayFor && <RepaymentModal loan={repayFor} onClose={() => setRepayFor(null)} onDone={() => { setRepayFor(null); refetch(); }} />}
      {disburseFor && <DisburseModal loan={disburseFor} onClose={() => setDisburseFor(null)} onDone={() => { setDisburseFor(null); refetch(); }} />}
    </div>
  );
}

/* -------------------- Create loan -------------------- */
function CreateLoanModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ user_id: "", principal_amount: "", installment_count: "1", reason: "" });
  const { data: partyData, isFetching: loadingStudents } = useGetQuery({ path: "finance/refund-parties", params: { type: "student" } });
  const students = partyData?.data || [];
  const options = students.map((p) => ({ value: String(p.id), label: p.name }));
  const [post, { isLoading }] = usePostMutation();

  const submit = async () => {
    if (!form.user_id) return showToast("Select a student", "error");
    if (!form.principal_amount || Number(form.principal_amount) <= 0) return showToast("Enter a valid amount", "error");
    try {
      const res = await post({
        path: "finance/student-loans",
        body: {
          user_id: Number(form.user_id),
          principal_amount: Number(form.principal_amount),
          installment_count: Number(form.installment_count) || 1,
          reason: form.reason || null,
        },
      }).unwrap();
      showToast(res?.message || "Loan created", "success");
      onCreated();
    } catch (e) {
      showToast(e?.data?.message || "Could not create loan", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#FEF2F2", color: BRAND }}><HandCoins size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>New student loan</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Student</label>
            <SearchableSelect options={options} value={form.user_id} onChange={(v) => setForm((f) => ({ ...f, user_id: v }))} placeholder={loadingStudents ? "Loading…" : "Search & select…"} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Principal amount (Rs)</label>
            <input type="number" min="1" value={form.principal_amount} onChange={(e) => setForm((f) => ({ ...f, principal_amount: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Planned installments</label>
            <input type="number" min="1" max="120" value={form.installment_count} onChange={(e) => setForm((f) => ({ ...f, installment_count: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Reason (optional)</label>
            <textarea rows={2} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Interest-free. Staff-created loans are approved on creation; disburse to make active.</p>
          <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create loan
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Disburse loan -------------------- */
function DisburseModal({ loan, onClose, onDone }) {
  const [payerType, setPayerType] = useState("office");
  const [fundedAccount, setFundedAccount] = useState("");
  const [disbursedOn, setDisbursedOn] = useState(today());
  const [proofFile, setProofFile] = useState(null);
  const [post, { isLoading }] = usePostMutation();
  const { data: acctResp } = useGetQuery({ path: "finance/ledger/account-options" });
  const officeAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_money), [acctResp]);
  const personAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_person), [acctResp]);
  const sourceAccts = payerType === "person" ? personAccts : officeAccts;

  const submit = async () => {
    if (payerType === "person" && !fundedAccount) return showToast("Pick the person giving this loan", "error");
    try {
      const fd = new FormData();
      fd.append("disbursed_on", disbursedOn);
      if (fundedAccount) fd.append("funded_by_account_uuid", fundedAccount);
      if (proofFile) fd.append("proof", proofFile);
      const res = await post({ path: `finance/student-loans/${loan.loan_uuid}/disburse`, body: fd }).unwrap();
      showToast(res?.message || "Loan disbursed", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not disburse", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Disburse loan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="mb-3 p-2.5 rounded-lg text-[12px]" style={{ background: SURFACE, color: TEXT_SECONDARY }}>
          {loan.student?.name} · {money(loan.principal_amount)}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Disbursed on</label>
            <input type="date" value={disbursedOn} onChange={(e) => setDisbursedOn(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Given from</label>
            <div className="inline-flex p-0.5 mb-2 rounded-lg" style={{ background: SURFACE }}>
              {[{ v: "office", l: "Office account" }, { v: "person", l: "A person" }].map((o) => (
                <button key={o.v} type="button" onClick={() => { setPayerType(o.v); setFundedAccount(""); }}
                        className="px-3 py-1.5 text-[12px] font-medium rounded-md"
                        style={payerType === o.v ? { background: "#fff", color: BRAND } : { color: TEXT_MUTED }}>{o.l}</button>
              ))}
            </div>
            <select value={fundedAccount} onChange={(e) => setFundedAccount(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">{payerType === "person" ? "Select a person…" : "Default cash account"}</option>
              {sourceAccts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={field}>
            <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Disburse loan
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Record repayment -------------------- */
function RepaymentModal({ loan, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", paid_on: today(), method: "cash", note: "", funded_by_account_uuid: "" });
  const [proofFile, setProofFile] = useState(null);
  const [post, { isLoading }] = usePostMutation();
  const { data: acctResp } = useGetQuery({ path: "finance/ledger/account-options" });
  const officeAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_money), [acctResp]);

  const submit = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return showToast("Enter a valid amount", "error");
    if (amt > loan.outstanding + 0.001) return showToast("Amount exceeds outstanding balance", "error");
    try {
      const fd = new FormData();
      fd.append("amount", String(amt));
      fd.append("paid_on", form.paid_on);
      fd.append("method", form.method);
      if (form.note) fd.append("note", form.note);
      if (form.funded_by_account_uuid) fd.append("funded_by_account_uuid", form.funded_by_account_uuid);
      if (proofFile) fd.append("proof", proofFile);
      const res = await post({ path: `finance/student-loans/${loan.loan_uuid}/repayments`, body: fd }).unwrap();
      showToast(res?.message || "Repayment recorded", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not record repayment", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Record repayment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="mb-3 p-2.5 rounded-lg text-[12px]" style={{ background: SURFACE, color: TEXT_SECONDARY }}>
          {loan.student?.name} · Outstanding <b style={{ color: BRAND }}>{money(loan.outstanding)}</b>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Amount (Rs)</label>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Paid on</label>
            <input type="date" value={form.paid_on} onChange={(e) => setForm((f) => ({ ...f, paid_on: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Method</label>
            <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              {["cash", "bank_transfer", "jazzcash", "easypaisa", "cheque", "other"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Received into</label>
            <select value={form.funded_by_account_uuid} onChange={(e) => setForm((f) => ({ ...f, funded_by_account_uuid: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">Auto (by method)</option>
              {officeAccts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={field}>
            <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: GREEN, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CircleDollarSign size={15} />} Save repayment
          </button>
        </div>
      </div>
    </div>
  );
}
