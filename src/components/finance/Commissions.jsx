import { useState } from "react";
import {
  Percent, Plus, X, Loader2, HandCoins, CircleDollarSign, Paperclip, Handshake,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import { showToast } from "../ui/common/ShowToast";

/* ---- tokens (match finance module) ---- */
const BRAND = "#C90606";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);

const REC_STATUS = {
  accrued:   { label: "Owed",      bg: "#FEF9C3", color: AMBER },
  paid:      { label: "Paid",      bg: "#F0FDF4", color: GREEN },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", color: TEXT_MUTED },
};

const CLIENT_TYPES = [
  { value: "it_client", label: "IT client" },
  { value: "workspace", label: "Workspace" },
  { value: "external", label: "External" },
  { value: "other", label: "Other" },
];

export default function Commissions() {
  const [showAgreement, setShowAgreement] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [payFor, setPayFor] = useState(null);

  const { data: agrData, isLoading: agrLoading, refetch: refetchAgr } = useGetQuery(
    { path: "finance/commissions/agreements" }, { refetchOnMountOrArgChange: true }
  );
  const { data: recData, isLoading: recLoading, refetch: refetchRec } = useGetQuery(
    { path: "finance/commissions/records" }, { refetchOnMountOrArgChange: true }
  );
  const agreements = agrData?.data || [];
  const records = recData?.data || [];

  const refreshAll = () => { refetchAgr(); refetchRec(); };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Percent size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Commissions</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Referral commissions · monthly or per project · paid through the ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAgreement(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
            <Handshake size={15} /> New agreement
          </button>
          <button onClick={() => setShowRecord(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
            <Plus size={15} /> Record commission
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Agreements */}
        <div>
          <h3 className="text-[12px] font-bold mb-2" style={{ color: TEXT_SECONDARY }}>Agreements</h3>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {agrLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
            ) : agreements.length === 0 ? (
              <div className="py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No agreements yet — add who earns commission on which client.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead><tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>{["Earner", "Title / Client", "Basis", "Rate", "Status"].map((h) => <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.agreement_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{a.earner?.name || "—"}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{a.title}{a.client_name ? ` · ${a.client_name}` : ""}</td>
                      <td className="px-3 py-2.5 capitalize" style={{ color: TEXT_SECONDARY }}>{a.basis}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_PRIMARY }}>{a.rate_percent != null ? `${a.rate_percent}%` : "—"}</td>
                      <td className="px-3 py-2.5 capitalize" style={{ color: a.status === "active" ? GREEN : TEXT_MUTED }}>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Earned commissions */}
        <div>
          <h3 className="text-[12px] font-bold mb-2" style={{ color: TEXT_SECONDARY }}>Earned commissions</h3>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {recLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No commissions recorded yet.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead><tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>{["Earner", "For", "Basis / Period", "Amount", "Status", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                <tbody>
                  {records.map((r) => {
                    const m = REC_STATUS[r.status] || REC_STATUS.accrued;
                    return (
                      <tr key={r.record_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{r.earner?.name || "—"}</td>
                        <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.agreement?.title || r.description || "—"}{r.agreement?.client_name ? ` · ${r.agreement.client_name}` : ""}</td>
                        <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}><span className="capitalize">{r.basis}</span>{r.period ? ` · ${r.period}` : ""}{r.rate_percent != null && r.base_amount != null ? ` · ${r.rate_percent}% of ${money(r.base_amount)}` : ""}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(r.amount)}</td>
                        <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: m.bg, color: m.color }}>{m.label}</span></td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {r.status === "accrued" && (
                              <button onClick={() => setPayFor(r)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#F0FDF4", color: GREEN }}><CircleDollarSign size={12} /> Pay</button>
                            )}
                            {r.has_proof && r.proof_url && (
                              <a href={r.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}><Paperclip size={12} /> Proof</a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} onDone={() => { setShowAgreement(false); refreshAll(); }} />}
      {showRecord && <RecordModal agreements={agreements} onClose={() => setShowRecord(false)} onDone={() => { setShowRecord(false); refreshAll(); }} />}
      {payFor && <PayModal record={payFor} onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); refreshAll(); }} />}
    </div>
  );
}

/* -------------------- helpers -------------------- */
function usePersonAccounts() {
  const { data } = useGetQuery({ path: "finance/ledger/accounts" });
  const accounts = data?.data || [];
  return {
    persons: accounts.filter((a) => a.is_person),
    money: accounts.filter((a) => a.is_money),
  };
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[92vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>{label}</label>
      {children}
    </div>
  );
}

/* -------------------- New agreement -------------------- */
function AgreementModal({ onClose, onDone }) {
  const { persons } = usePersonAccounts();
  const [form, setForm] = useState({ earner_uuid: "", title: "", client_type: "it_client", client_id: "", client_name: "", basis: "project", rate_percent: "", notes: "" });
  const [post, { isLoading }] = usePostMutation();
  const personOptions = persons.map((p) => ({ value: p.account_uuid, label: p.name }));

  // Client dropdowns by type (skipped unless that type is selected).
  const { data: itData } = useGetQuery({ path: "clients/it-clients" }, { skip: form.client_type !== "it_client" });
  const { data: wsData } = useGetQuery({ path: "clients/clients", params: { per_page: 200 } }, { skip: form.client_type !== "workspace" });
  const clientList = form.client_type === "it_client" ? (itData?.data || [])
    : form.client_type === "workspace" ? (wsData?.data || [])
    : [];
  const clientOptions = clientList.map((c) => ({ value: String(c.id), label: c.name || c.company_name || `Client #${c.id}` }));
  const pickClient = (id) => {
    const c = clientList.find((x) => String(x.id) === String(id));
    setForm((f) => ({ ...f, client_id: id || "", client_name: c ? (c.name || c.company_name || "") : f.client_name }));
  };
  const usesDropdown = form.client_type === "it_client" || form.client_type === "workspace";

  const submit = async () => {
    if (!form.earner_uuid) return showToast("Pick who earns the commission", "error");
    if (!form.title.trim()) return showToast("Enter a title", "error");
    try {
      const res = await post({
        path: "finance/commissions/agreements",
        body: {
          earner_uuid: form.earner_uuid,
          title: form.title.trim(),
          client_type: form.client_type,
          client_id: form.client_id ? Number(form.client_id) : null,
          client_name: form.client_name || null,
          basis: form.basis,
          rate_percent: form.rate_percent === "" ? null : Number(form.rate_percent),
          notes: form.notes || null,
        },
      }).unwrap();
      showToast(res?.message || "Agreement created", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not create agreement", "error");
    }
  };

  return (
    <Modal title="New commission agreement" onClose={onClose}>
      <div className="space-y-3">
        <Labeled label="Earner (who brings the client)">
          <SearchableSelect options={personOptions} value={form.earner_uuid} onChange={(v) => setForm((f) => ({ ...f, earner_uuid: v }))} placeholder="Search a person…" />
          <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>From your ledger people. Add one in Accounts & Ledger if missing.</p>
        </Labeled>
        <Labeled label="Title">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. ACME web project" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Client type">
            <select value={form.client_type} onChange={(e) => setForm((f) => ({ ...f, client_type: e.target.value, client_id: "", client_name: "" }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              {CLIENT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Labeled>
          <Labeled label="Basis">
            <select value={form.basis} onChange={(e) => setForm((f) => ({ ...f, basis: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="project">Per project</option>
              <option value="monthly">Monthly</option>
            </select>
          </Labeled>
        </div>
        <Labeled label="Client">
          {usesDropdown ? (
            <SearchableSelect options={clientOptions} value={form.client_id} onChange={pickClient} placeholder="Search & select a client…" />
          ) : (
            <input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Client name" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          )}
        </Labeled>
        <Labeled label="Rate % (optional)">
          <input type="number" min="0" max="100" step="0.01" value={form.rate_percent} onChange={(e) => setForm((f) => ({ ...f, rate_percent: e.target.value }))} placeholder="e.g. 10" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </Labeled>
        <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Handshake size={15} />} Create agreement
        </button>
      </div>
    </Modal>
  );
}

/* -------------------- Record commission -------------------- */
function RecordModal({ agreements, onClose, onDone }) {
  const { persons } = usePersonAccounts();
  const [form, setForm] = useState({ agreement_uuid: "", earner_uuid: "", basis: "project", period: "", base_amount: "", rate_percent: "", amount: "", description: "" });
  const [post, { isLoading }] = usePostMutation();
  const personOptions = persons.map((p) => ({ value: p.account_uuid, label: p.name }));

  const chosen = agreements.find((a) => a.agreement_uuid === form.agreement_uuid);
  const effRate = form.rate_percent !== "" ? Number(form.rate_percent) : (chosen?.rate_percent ?? null);
  const computed = effRate != null && form.base_amount !== "" ? Math.round(Number(form.base_amount) * effRate) / 100 : null;
  const finalAmount = form.amount !== "" ? Number(form.amount) : computed;

  const submit = async () => {
    if (!form.agreement_uuid && !form.earner_uuid) return showToast("Pick an agreement or an earner", "error");
    if (!finalAmount || finalAmount <= 0) return showToast("Enter an amount, or a rate % and base amount", "error");
    try {
      const res = await post({
        path: "finance/commissions/records",
        body: {
          agreement_uuid: form.agreement_uuid || null,
          earner_uuid: form.agreement_uuid ? null : form.earner_uuid,
          basis: form.basis,
          period: form.period || null,
          base_amount: form.base_amount === "" ? null : Number(form.base_amount),
          rate_percent: form.rate_percent === "" ? null : Number(form.rate_percent),
          amount: form.amount === "" ? null : Number(form.amount),
          description: form.description || null,
        },
      }).unwrap();
      showToast(res?.message || "Commission recorded", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not record commission", "error");
    }
  };

  return (
    <Modal title="Record commission" onClose={onClose}>
      <div className="space-y-3">
        <Labeled label="Agreement (optional)">
          <select value={form.agreement_uuid} onChange={(e) => setForm((f) => ({ ...f, agreement_uuid: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
            <option value="">— Ad-hoc (pick an earner below) —</option>
            {agreements.map((a) => <option key={a.agreement_uuid} value={a.agreement_uuid}>{a.earner?.name} · {a.title}</option>)}
          </select>
        </Labeled>
        {!form.agreement_uuid && (
          <Labeled label="Earner">
            <SearchableSelect options={personOptions} value={form.earner_uuid} onChange={(v) => setForm((f) => ({ ...f, earner_uuid: v }))} placeholder="Search a person…" />
          </Labeled>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Basis">
            <select value={form.basis} onChange={(e) => setForm((f) => ({ ...f, basis: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="project">Per project</option>
              <option value="monthly">Monthly</option>
            </select>
          </Labeled>
          <Labeled label="Period (optional)">
            <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. 2026-06" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Base amount (optional)">
            <input type="number" min="0" value={form.base_amount} onChange={(e) => setForm((f) => ({ ...f, base_amount: e.target.value }))} placeholder="e.g. 200000" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
          <Labeled label={`Rate %${chosen?.rate_percent != null ? ` (agreement: ${chosen.rate_percent}%)` : ""}`}>
            <input type="number" min="0" max="100" step="0.01" value={form.rate_percent} onChange={(e) => setForm((f) => ({ ...f, rate_percent: e.target.value }))} placeholder={chosen?.rate_percent != null ? String(chosen.rate_percent) : "e.g. 10"} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
        </div>
        <Labeled label="Amount (overrides the calculation)">
          <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder={computed != null ? `Computed: ${money(computed)}` : "Enter amount"} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          {computed != null && form.amount === "" && <p className="text-[10.5px] mt-1" style={{ color: GREEN }}>Will accrue {money(computed)} to the earner.</p>}
        </Labeled>
        <p className="text-[10.5px]" style={{ color: TEXT_MUTED }}>Recording accrues this to the earner (office owes them). Pay it out later from the table.</p>
        <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <HandCoins size={15} />} Record commission
        </button>
      </div>
    </Modal>
  );
}

/* -------------------- Pay commission -------------------- */
function PayModal({ record, onClose, onDone }) {
  const { money: moneyAccounts } = usePersonAccounts();
  const [form, setForm] = useState({ account_uuid: "", paid_on: today() });
  const [post, { isLoading }] = usePostMutation();
  const options = moneyAccounts.map((a) => ({ value: a.account_uuid, label: `${a.name} · ${a.kind}` }));

  const submit = async () => {
    if (!form.account_uuid) return showToast("Pick the account to pay from", "error");
    try {
      const res = await post({ path: `finance/commissions/records/${record.record_uuid}/pay`, body: form }).unwrap();
      showToast(res?.message || "Commission paid", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not pay commission", "error");
    }
  };

  return (
    <Modal title="Pay commission" onClose={onClose}>
      <div className="mb-3 p-2.5 rounded-lg text-[12px]" style={{ background: SURFACE, color: TEXT_SECONDARY }}>
        {record.earner?.name} · <b style={{ color: TEXT_PRIMARY }}>{money(record.amount)}</b>
      </div>
      <div className="space-y-3">
        <Labeled label="Pay from (money account)">
          <SearchableSelect options={options} value={form.account_uuid} onChange={(v) => setForm((f) => ({ ...f, account_uuid: v }))} placeholder="Cash / bank…" />
        </Labeled>
        <Labeled label="Paid on">
          <input type="date" value={form.paid_on} onChange={(e) => setForm((f) => ({ ...f, paid_on: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </Labeled>
        <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: GREEN, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CircleDollarSign size={15} />} Pay {money(record.amount)}
        </button>
      </div>
    </Modal>
  );
}
