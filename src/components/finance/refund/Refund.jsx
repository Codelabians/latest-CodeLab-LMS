import { useMemo, useState } from "react";
import { RotateCcw, Plus, X, Trash2, Loader2, GraduationCap, Briefcase, Building2, User } from "lucide-react";
import { useGetQuery, usePostMutation, useDeleteMutation } from "../../../api/apiSlice";
import SearchableSelect from "../../ui/SearchableSelect";

/* ---- tokens ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const today = new Date().toISOString().slice(0, 10);

const PARTY_TYPES = [
  { value: "student", label: "Student", icon: GraduationCap, color: BLUE, tint: "#EFF6FF" },
  { value: "workspace_client", label: "Workspace", icon: Building2, color: GREEN, tint: "#F0FDF4" },
  { value: "it_client", label: "IT Client", icon: Briefcase, color: "#7C3AED", tint: "#F5F3FF" },
  { value: "other", label: "Other", icon: User, color: TEXT_MUTED, tint: SURFACE },
];
const partyMeta = (t) => PARTY_TYPES.find((x) => x.value === t) || PARTY_TYPES[3];

function RefundModal({ isOpen, onClose, onSubmit, incomeOptions, saving, error }) {
  const [form, setForm] = useState({});
  const [proofFile, setProofFile] = useState(null);
  useMemo(() => {
    if (isOpen) { setForm({ party_type: "student", party_id: "", refund_party: "", payee_user_id: null, category_id: "", amount: "", refund_type: "full", transaction_date: today, description: "", mark_dropout: false, payer_type: "office", funded_by_account_uuid: "" }); setProofFile(null); }
  }, [isOpen]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Ledger accounts the refund is paid FROM (office cash/bank, or a person).
  const { data: ledgerResp } = useGetQuery({ path: "finance/ledger/accounts" }, { skip: !isOpen });
  const officeAccts = (ledgerResp?.data || []).filter((a) => a.is_money);
  const personAccts = (ledgerResp?.data || []).filter((a) => a.is_person);

  // Selectable parties (+ how much they've already paid).
  const { data: partyData, isFetching: partiesLoading } = useGetQuery(
    { path: "finance/refund-parties", params: { type: form.party_type } },
    { skip: !isOpen || form.party_type === "other" }
  );
  const parties = partyData?.data || [];
  const partyOptions = parties.map((p) => ({ value: String(p.id), label: p.paid > 0 ? `${p.name} · paid ${money(p.paid)}` : p.name }));
  const selectedParty = parties.find((p) => String(p.id) === String(form.party_id));

  if (!isOpen) return null;
  const isOther = form.party_type === "other";

  const pickParty = (id) => {
    const p = parties.find((x) => String(x.id) === String(id));
    setForm((f) => ({
      ...f,
      party_id: id || "",
      refund_party: p?.name || "",
      payee_user_id: f.party_type === "student" && p ? p.id : null,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[92vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#FEF2F2", color: BRAND }}><RotateCcw size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Record refund</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Refund to</label>
            <div className="inline-flex p-1 rounded-lg w-full" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              {PARTY_TYPES.map((p) => (
                <button key={p.value} onClick={() => setForm((f) => ({ ...f, party_type: p.value, party_id: "", refund_party: "", payee_user_id: null }))} className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md inline-flex items-center justify-center gap-1"
                  style={form.party_type === p.value ? { background: "#fff", color: p.color, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: TEXT_MUTED }}>
                  <p.icon size={12} /> {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>{isOther ? "Name" : partyMeta(form.party_type).label}</label>
            {isOther ? (
              <input value={form.refund_party || ""} onChange={(e) => set("refund_party", e.target.value)} placeholder="Name" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
            ) : (
              <SearchableSelect options={partyOptions} value={form.party_id || ""} onChange={(v) => pickParty(v)} placeholder={partiesLoading ? "Loading…" : "Search & select…"} />
            )}
            {selectedParty && (
              <div className="mt-1.5 text-[11.5px] inline-flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "#F0FDF4", color: GREEN }}>
                Already paid us: <b>{money(selectedParty.paid)}</b>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Refund against</label>
            <select value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">Select income category</option>
              {incomeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Amount returned</label>
              <div className="relative">
                <span className="absolute text-[12px] font-semibold left-3 top-2.5" style={{ color: TEXT_MUTED }}>PKR</span>
                <input type="number" step="0.01" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" className="w-full py-2 text-sm rounded-lg outline-none pl-12 pr-3" style={field} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Type</label>
              <select value={form.refund_type || "full"} onChange={(e) => set("refund_type", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                <option value="full">Full refund</option>
                <option value="partial">Partial (deducted some)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Date</label>
            <input type="date" value={form.transaction_date || ""} max={today} onChange={(e) => set("transaction_date", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Reason</label>
            <textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Left after 3 days; deducted registration fee" className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
          {form.party_type === "student" && (
            <label className="flex items-start gap-2 cursor-pointer px-3 py-2.5 rounded-lg" style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
              <input type="checkbox" checked={!!form.mark_dropout} onChange={(e) => set("mark_dropout", e.target.checked)} className="mt-0.5" />
              <span className="text-[12px]" style={{ color: "#7F1D1D" }}>
                <b>Is this student leaving?</b> Mark them as dropped out too. This also stops any referral discount their referrer was getting (or flags an already-paid cash reward for clawback).
              </span>
            </label>
          )}

          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Refund from (records in ledger)</label>
            <div className="inline-flex w-full p-1 mb-2 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              {[{ v: "office", l: "Office account" }, { v: "person", l: "A person" }].map((o) => (
                <button key={o.v} type="button" onClick={() => setForm((f) => ({ ...f, payer_type: o.v, funded_by_account_uuid: "" }))}
                  className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md"
                  style={form.payer_type === o.v ? { background: "#fff", color: BRAND } : { color: TEXT_MUTED }}>{o.l}</button>
              ))}
            </div>
            <select value={form.funded_by_account_uuid || ""} onChange={(e) => set("funded_by_account_uuid", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">Select account… (optional)</option>
              {(form.payer_type === "person" ? personAccts : officeAccts).map((a) => (
                <option key={a.account_uuid} value={a.account_uuid}>{a.name} · {a.kind}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 mt-2 px-3 py-2 text-[12px] border border-dashed rounded-lg cursor-pointer" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
              {proofFile ? proofFile.name : "Attach proof image (optional)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        {error && <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({
              party_type: form.party_type,
              refund_party: (form.refund_party || "").trim(),
              payee_user_id: form.payee_user_id || null,
              category_id: form.category_id ? Number(form.category_id) : null,
              amount: parseFloat(form.amount),
              refund_type: form.refund_type || "full",
              transaction_date: form.transaction_date,
              description: (form.description || "").trim() || null,
              mark_dropout: form.party_type === "student" ? !!form.mark_dropout : false,
              funded_by_account_uuid: form.funded_by_account_uuid || null,
              proofFile,
            })}
            disabled={!form.refund_party?.trim() || !form.category_id || !form.amount || !form.transaction_date || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : "Record refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Refund() {
  const [modalOpen, setModalOpen] = useState(false);
  const [partyFilter, setPartyFilter] = useState("");
  const [err, setErr] = useState(null);

  const params = useMemo(() => (partyFilter ? { party_type: partyFilter } : {}), [partyFilter]);
  const { data, isLoading, isFetching, refetch } = useGetQuery({ path: "finance/refunds", params }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const rows = d.rows || [];

  const { data: incData } = useGetQuery({ path: "finance/categories/income" });
  const incomeOptions = (incData?.data || []).map((c) => ({ value: String(c.id), label: c.name }));

  const [createRefund, { isLoading: saving }] = usePostMutation();
  const [deleteTx] = useDeleteMutation();

  const submit = async (rawBody) => {
    setErr(null);
    const { proofFile, ...rest } = rawBody;
    let body = rest;
    if (proofFile) {
      body = new FormData();
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") body.append(k, typeof v === "boolean" ? (v ? "1" : "0") : (typeof v === "number" ? String(v) : v));
      });
      body.append("proof", proofFile);
    }
    try { await createRefund({ path: "finance/refunds", body }).unwrap(); setModalOpen(false); refetch(); }
    catch (e) {
      console.error("refund failed", e);
      setErr(e?.data?.message || (e?.status === 404 ? "Endpoint not found — restart backend after migrating." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };
  const onDelete = async (uuid) => {
    if (!window.confirm("Delete this refund record?")) return;
    try { await deleteTx({ path: `finance/delete/${uuid}`, body: {} }).unwrap(); refetch(); }
    catch (e) { console.error("delete refund failed", e); }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><RotateCcw size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Refunds</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Money returned to students & clients {isFetching && <span style={{ color: BRAND }}>· updating…</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className="px-3 py-2 text-[12px] font-semibold rounded-lg outline-none" style={field}>
            <option value="">All</option>
            {PARTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={() => { setErr(null); setModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: BRAND }}>
            <Plus size={15} /> New refund
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[11.5px] font-semibold" style={{ color: TEXT_MUTED }}>Total refunded</div>
          <div className="text-[22px] font-bold mt-1" style={{ color: BRAND }}>{money(d.total)}</div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[11.5px] font-semibold" style={{ color: TEXT_MUTED }}>Refund records</div>
          <div className="text-[22px] font-bold mt-1" style={{ color: TEXT_PRIMARY }}>{d.count ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No refunds recorded yet.</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                {["Refunded to", "Against", "Type", "Date", "Reason", "Amount", ""].map((h, i) => (
                  <th key={i} className={`px-4 py-2 font-semibold text-[11px] ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pm = partyMeta(r.party_type);
                return (
                  <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: pm.tint, color: pm.color }}><pm.icon size={10} /> {pm.label}</span>
                        <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.party}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.category || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: r.refund_type === "partial" ? "#FFFBEB" : "#F0FDF4", color: r.refund_type === "partial" ? AMBER : GREEN }}>{r.refund_type === "partial" ? "Partial" : "Full"}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_MUTED }}>{r.date}</td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY, maxWidth: 240 }}>{r.description || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums" style={{ color: BRAND }}>{money(r.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onDelete(r.uuid)} className="grid rounded-md w-7 h-7 place-items-center ml-auto" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <RefundModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={submit} incomeOptions={incomeOptions} saving={saving} error={err} />
    </div>
  );
}
