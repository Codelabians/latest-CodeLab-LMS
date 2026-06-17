import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Loader2, FileDown, CheckCircle2, FileText } from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BRAND_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, outline: "none" };

const STATUS_META = {
  unpaid: { label: "Unpaid", fg: "#C2410C", bg: "#FFF7ED" },
  partially_paid: { label: "Partial", fg: "#B45309", bg: "#FEF3C7" },
  paid: { label: "Paid", fg: "#15803D", bg: "#F0FDF4" },
  closed: { label: "Closed", fg: "#6B7280", bg: "#F1F5F9" },
  cancelled: { label: "Cancelled", fg: "#6B7280", bg: "#F1F5F9" },
};

function InvoiceModal({ open, mode, initial, clients, categories, onCancel, onSubmit, isLoading }) {
  const blankItem = { description: "", qty: 1, unit_price: "" };
  const [f, setF] = useState({ it_client_uuid: "", category_id: "", issue_date: "", due_date: "", discount: 0, notes: "", items: [blankItem] });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setF(initial ? {
      it_client_uuid: initial.client?.uuid || "",
      category_id: initial.category_id ? String(initial.category_id) : "",
      issue_date: initial.issue_date || "",
      due_date: initial.due_date || "",
      discount: initial.discount ?? 0,
      notes: initial.notes || "",
      items: (initial.items && initial.items.length) ? initial.items.map((i) => ({ description: i.description, qty: i.qty, unit_price: i.unit_price })) : [blankItem],
    } : { it_client_uuid: "", category_id: "", issue_date: new Date().toISOString().slice(0, 10), due_date: "", discount: 0, notes: "", items: [blankItem] });
  }, [open, initial]);

  if (!open) return null;

  const setItem = (i, k, v) => setF((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const addItem = () => setF((p) => ({ ...p, items: [...p.items, { description: "", qty: 1, unit_price: "" }] }));
  const removeItem = (i) => setF((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const subtotal = f.items.reduce((t, it) => t + (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0), 0);
  const total = Math.max(0, subtotal - (parseFloat(f.discount) || 0));

  const save = async () => {
    if (!f.it_client_uuid) { setErr("Select a client."); return; }
    const items = f.items.filter((it) => it.description.trim() && parseFloat(it.unit_price) >= 0)
      .map((it) => ({ description: it.description.trim(), qty: parseFloat(it.qty) || 1, unit_price: parseFloat(it.unit_price) || 0 }));
    if (!items.length) { setErr("Add at least one line item."); return; }
    const res = await onSubmit({
      it_client_uuid: f.it_client_uuid,
      category_id: f.category_id ? Number(f.category_id) : undefined,
      issue_date: f.issue_date || undefined,
      due_date: f.due_date || undefined,
      discount: parseFloat(f.discount) || 0,
      notes: f.notes || undefined,
      items,
    });
    if (res?.error) setErr(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{mode === "edit" ? "Edit Invoice" : "New Invoice"}</h3>
          <button type="button" onClick={onCancel} style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>

        <div className="px-5 py-5 max-h-[72vh] overflow-y-auto">
          {err && <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_TINT, color: BRAND, border: "1px solid #FECACA" }}>{err}</div>}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Client *</label>
              <select value={f.it_client_uuid} onChange={(e) => setF({ ...f, it_client_uuid: e.target.value })} style={inputStyle}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}{c.company_name ? ` · ${c.company_name}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Income category</label>
              <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} style={inputStyle}>
                <option value="">Default (Client Projects)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Issue date</label>
              <input type="date" value={f.issue_date} onChange={(e) => setF({ ...f, issue_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Due date</label>
              <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Line items</label>
          <div className="space-y-2">
            {f.items.map((it, i) => (
              <div key={i} className="grid items-center grid-cols-12 gap-2">
                <input value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="Description" className="col-span-6 text-xs" style={inputStyle} />
                <input type="number" min="0" step="0.5" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} placeholder="Qty" className="col-span-2 text-xs text-right" style={inputStyle} />
                <input type="number" min="0" value={it.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} placeholder="Unit Rs" className="col-span-3 text-xs text-right" style={inputStyle} />
                <button type="button" onClick={() => removeItem(i)} disabled={f.items.length === 1} className="flex justify-center col-span-1 p-1 rounded disabled:opacity-30" style={{ color: TEXT_MUTED }}><X size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold" style={{ color: BRAND }}><Plus size={13} /> Add item</button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Discount (Rs)</label>
              <input type="number" min="0" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} style={inputStyle} />
            </div>
            <div className="flex flex-col justify-end text-right">
              <div className="text-[12px]" style={{ color: TEXT_MUTED }}>Subtotal: {money(subtotal)}</div>
              <div className="text-[15px] font-bold" style={{ color: BRAND }}>Total: {money(total)}</div>
            </div>
          </div>
          <div className="mt-3">
            <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Notes</label>
            <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="e.g. 50% advance, balance on delivery" style={inputStyle} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" onClick={save} disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : mode === "edit" ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const METHODS = [
  ["cash", "Cash"], ["jazzcash", "JazzCash"], ["easypaisa", "Easypaisa"],
  ["bank_transfer", "Bank transfer"], ["cheque", "Cheque"], ["other", "Other"],
];

// Split-payment modal mirroring fee collection: add one or more payment
// rows against an invoice, see Paid / Remaining, review the payment history,
// and (when a balance remains) spin off a follow-up invoice for it.
function PaymentModal({ inv, accounts, onCancel, onSubmit, onDeletePayment, onCreateFollowUp, isLoading, followingUp }) {
  const remaining = Number(inv?.balance ?? 0);
  // Each account option is keyed by its uuid (or its type when uuid is null,
  // e.g. the fallback Cash option).
  const acctKey = (a) => a.uuid || a.type;
  const defaultAcct = accounts?.[0] ? acctKey(accounts[0]) : "";
  const blank = () => ({ amount: "", account: defaultAcct, paid_at: todayStr(), payment_reference: "" });
  const [splits, setSplits] = useState([blank()]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (inv) setSplits([{ amount: remaining ? String(remaining) : "", account: defaultAcct, paid_at: todayStr(), payment_reference: "" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv?.uuid, defaultAcct]);

  if (!inv) return null;

  const update = (i, k, v) => setSplits((s) => s.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addSplit = () => setSplits((s) => [...s, blank()]);
  const removeSplit = (i) => setSplits((s) => s.filter((_, idx) => idx !== i));

  const total = splits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const over = total > remaining + 0.001;
  const payments = inv.payments || [];

  const save = async () => {
    setErr("");
    const clean = splits.filter((s) => parseFloat(s.amount) > 0)
      .map((s) => {
        const acc = (accounts || []).find((a) => acctKey(a) === s.account);
        return {
          amount: parseFloat(s.amount),
          payment_account_uuid: acc?.uuid || undefined,
          payment_method: acc?.type || "cash",
          paid_at: s.paid_at || undefined,
          payment_reference: s.payment_reference || undefined,
        };
      });
    if (clean.length === 0) { setErr("Enter at least one amount."); return; }
    if (over) { setErr("Total exceeds the remaining balance."); return; }
    const res = await onSubmit({ payments: clean });
    if (res?.error) setErr(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onCancel}>
      <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Record payment — {inv.invoice_number}</h3>
            <p className="mt-0.5 text-[12px]" style={{ color: TEXT_MUTED }}>Total {money(inv.total)} · Paid {money(inv.amount_paid)} · <b style={{ color: BRAND }}>Remaining {money(remaining)}</b></p>
          </div>
          <button type="button" onClick={onCancel} className="grid w-7 h-7 rounded-md place-items-center" style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>

        {err && <div className="mt-3 text-[12px] px-3 py-2 rounded-lg" style={{ background: BRAND_TINT, color: BRAND }}>{err}</div>}

        {payments.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: TEXT_SECONDARY }}>Payments received</div>
            {payments.map((p) => (
              <div key={p.uuid} className="flex items-center justify-between text-[12px] px-3 py-1.5 rounded-lg mb-1" style={{ background: "#F0FDF4" }}>
                <span style={{ color: "#15803D" }}>{money(p.amount)} · {p.payment_account || (METHODS.find((m) => m[0] === p.payment_method) || ["", p.payment_method])[1]}{p.payment_reference ? ` · ${p.payment_reference}` : ""} · {String(p.paid_at || "").slice(0, 10)}</span>
                <button type="button" onClick={() => onDeletePayment(p.uuid)} title="Remove payment" className="grid rounded w-6 h-6 place-items-center" style={{ color: BRAND }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {remaining > 0 ? (
          <>
            <div className="mt-4 space-y-2">
              {splits.map((s, idx) => (
                <div key={idx} className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                  <input type="number" min="0" placeholder="Amount" value={s.amount} onChange={(e) => update(idx, "amount", e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }} />
                  <select value={s.account} onChange={(e) => update(idx, "account", e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }}>
                    {(accounts || []).length === 0 && <option value="">Cash</option>}
                    {(accounts || []).map((a) => <option key={a.uuid || a.type} value={a.uuid || a.type}>{a.label}</option>)}
                  </select>
                  <input type="date" value={s.paid_at} onChange={(e) => update(idx, "paid_at", e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }} />
                  {splits.length > 1
                    ? <button type="button" onClick={() => removeSplit(idx)} className="grid rounded-md w-8 h-8 place-items-center" style={{ color: BRAND }}><X size={14} /></button>
                    : <span style={{ width: 32 }} />}
                </div>
              ))}
            </div>
            <button type="button" onClick={addSplit} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND }}><Plus size={12} /> Add split</button>
            <div className="flex items-center justify-between mt-3 text-[12.5px]">
              <span style={{ color: TEXT_SECONDARY }}>Entering: <b style={{ color: over ? BRAND : TEXT_PRIMARY }}>{money(total)}</b></span>
              {over && <span style={{ color: BRAND }}>Exceeds remaining {money(remaining)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button type="button" onClick={onCancel} disabled={isLoading} className="py-2.5 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
              <button type="button" onClick={save} disabled={isLoading || over} className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "#15803D", opacity: isLoading || over ? 0.6 : 1 }}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Record payment</button>
            </div>

            <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button type="button" onClick={onCreateFollowUp} disabled={followingUp} className="inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: "#1D4ED8" }}>
                {followingUp ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Create follow-up invoice for the {money(remaining)} balance
              </button>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>Raises a new invoice for the remaining amount and closes this one.</p>
            </div>
          </>
        ) : (
          <p className="mt-5 text-[13px] text-center" style={{ color: "#15803D" }}>This invoice is fully paid.</p>
        )}
      </div>
    </div>
  );
}

export default function ClientInvoices() {
  const user = useSelector(selectCurrentUser);
  const canManage = user?.role === "admin" || (user?.permissions || []).includes("create client-invoices");

  const [formModal, setFormModal] = useState({ open: false, mode: null, inv: null });
  const [payModal, setPayModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const clientFilter = searchParams.get("client") || "";

  const { data, isLoading, error, refetch } = useGetQuery({ path: "clients/invoices", params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const allRows = data?.data || [];
  const rows = useMemo(
    () => (clientFilter ? allRows.filter((r) => r.client?.uuid === clientFilter) : allRows),
    [allRows, clientFilter],
  );
  const filteredClientName = clientFilter ? (allRows.find((r) => r.client?.uuid === clientFilter)?.client?.name || "this client") : "";

  const { data: clientResp } = useGetQuery({ path: "clients/it-clients", params: { per_page: 200 } });
  const clients = useMemo(() => { const r = clientResp?.data ?? []; return Array.isArray(r) ? r : r?.data ?? []; }, [clientResp]);

  const { data: catResp } = useGetQuery({ path: "finance/categories/income" });
  const categories = useMemo(() => (catResp?.data || []).filter((c) => (c.section || "") === "it_solutions"), [catResp]);

  const { data: acctResp } = useGetQuery({ path: "clients/invoices/payment-accounts" });
  const payAccounts = useMemo(() => acctResp?.data || [], [acctResp]);

  const [createI, { isLoading: creating }] = usePostMutation();
  const [updateI, { isLoading: updating }] = usePatchMutation();
  const [delI, { isLoading: deleting }] = useDeleteMutation();
  const [payI, { isLoading: paying }] = usePostMutation();
  const [followI, { isLoading: followingUp }] = usePostMutation();
  const [delPayI] = useDeleteMutation();

  const submit = async (payload) => {
    try {
      if (formModal.mode === "edit") await updateI({ path: `clients/invoices/${formModal.inv.uuid}`, body: payload }).unwrap();
      else await createI({ path: "clients/invoices", body: payload }).unwrap();
      showToast("Invoice saved", "success");
      setFormModal({ open: false, mode: null, inv: null });
      refetch();
      return { error: null };
    } catch (e) {
      const errs = e?.data?.errors || {};
      return { error: Object.values(errs)[0]?.[0] || e?.data?.message || "Could not save invoice." };
    }
  };
  // Record one or more split payments; keep the modal open with fresh state.
  const doRecordPayment = async (body) => {
    try {
      const res = await payI({ path: `clients/invoices/${payModal.uuid}/payments`, body }).unwrap();
      showToast("Payment recorded", "success");
      if (res?.data) setPayModal(res.data);
      refetch();
      return { error: null };
    } catch (e) {
      const errs = e?.data?.errors || {};
      return { error: Object.values(errs)[0]?.[0] || e?.data?.message || "Could not record payment." };
    }
  };
  const doDeletePayment = async (paymentUuid) => {
    try {
      const res = await delPayI({ path: `clients/invoices/${payModal.uuid}/payments/${paymentUuid}` }).unwrap();
      showToast("Payment removed", "success");
      if (res?.data) setPayModal(res.data);
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not remove payment.", "error"); }
  };
  const doFollowUp = async () => {
    try {
      await followI({ path: `clients/invoices/${payModal.uuid}/follow-up`, body: {} }).unwrap();
      showToast("Follow-up invoice created", "success");
      setPayModal(null);
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not create follow-up.", "error"); }
  };
  const doDelete = async () => {
    try { await delI({ path: `clients/invoices/${deleteDialog.uuid}` }).unwrap(); showToast("Invoice deleted", "success"); setDeleteDialog(null); refetch(); }
    catch (e) { showToast(e?.data?.message || "Could not delete.", "error"); }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}><FileText size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Client Invoices</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Invoices for IT Solutions clients — download PDF, mark paid (posts income).</p>
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={() => setFormModal({ open: true, mode: "add", inv: null })} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            <Plus size={15} /> New invoice
          </button>
        )}
      </div>

      {clientFilter && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-[12.5px]" style={{ background: BRAND_TINT, color: BRAND, border: `1px solid ${BORDER}` }}>
          <span>Showing invoices for <b>{filteredClientName}</b></span>
          <button type="button" onClick={() => { const sp = new URLSearchParams(searchParams); sp.delete("client"); setSearchParams(sp); }} className="inline-flex items-center gap-1 font-semibold">
            <X size={12} /> Clear
          </button>
        </div>
      )}

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Client</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Balance</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
            {!isLoading && error && <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px]" style={{ color: BRAND }}>Couldn't load invoices.</td></tr>}
            {!isLoading && !error && rows.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No invoices yet.</td></tr>}
            {!isLoading && !error && rows.map((r) => {
              const sm = STATUS_META[r.status] || STATUS_META.unpaid;
              const bal = Number(r.balance ?? r.total);
              const open = r.status === "unpaid" || r.status === "partially_paid";
              return (
                <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-5 py-3 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{r.invoice_number}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>{r.client?.name || "—"}</td>
                  <td className="px-5 py-3 text-sm text-right font-bold tabular-nums" style={{ color: TEXT_PRIMARY }}>{money(r.total)}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold tabular-nums" style={{ color: bal > 0 ? "#C2410C" : TEXT_MUTED }}>{bal > 0 ? money(bal) : "—"}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 text-[11.5px] font-semibold rounded-full" style={{ color: sm.fg, background: sm.bg }}>{sm.label}</span></td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: TEXT_MUTED }}>{r.issue_date || "—"}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {r.pdf_url && <a href={r.pdf_url} target="_blank" rel="noreferrer" title="Download PDF" className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-[11px] font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><FileDown size={12} /> PDF</a>}
                    {canManage && open && <button type="button" onClick={() => setPayModal(r)} title="Record payment" className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-[11px] font-semibold text-white rounded-md" style={{ background: "#15803D" }}><CheckCircle2 size={12} /> Pay</button>}
                    {canManage && open && <button type="button" onClick={() => setFormModal({ open: true, mode: "edit", inv: r })} title="Edit" className="grid rounded-md w-7 h-7 place-items-center" style={{ color: TEXT_SECONDARY, display: "inline-grid" }}><Pencil size={13} /></button>}
                    {canManage && <button type="button" onClick={() => setDeleteDialog(r)} title="Delete" className="grid rounded-md w-7 h-7 place-items-center" style={{ color: BRAND, display: "inline-grid" }}><Trash2 size={13} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InvoiceModal open={formModal.open} mode={formModal.mode} initial={formModal.inv} clients={clients} categories={categories} onCancel={() => setFormModal({ open: false, mode: null, inv: null })} onSubmit={submit} isLoading={creating || updating} />
      <PaymentModal inv={payModal} accounts={payAccounts} onCancel={() => setPayModal(null)} onSubmit={doRecordPayment} onDeletePayment={doDeletePayment} onCreateFollowUp={doFollowUp} isLoading={paying} followingUp={followingUp} />

      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDeleteDialog(null)}>
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>Delete {deleteDialog.invoice_number}?</h3>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button type="button" onClick={() => setDeleteDialog(null)} disabled={deleting} className="py-2.5 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
              <button type="button" onClick={doDelete} disabled={deleting} className="flex items-center justify-center py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND }}>{deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
