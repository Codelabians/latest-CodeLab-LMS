import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, AlertTriangle, Loader2, Landmark, CheckCircle2 } from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
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

const TYPES = [
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

// Must match Modules\Finance\Entities\PaymentAccount::USAGES keys.
const USAGES = [
  { key: "certificate_fee", label: "Certificate fee" },
  { key: "course_fee", label: "Course / enrollment fee" },
  { key: "monthly_fee", label: "Monthly fee" },
  { key: "registration_fee", label: "Registration fee" },
  { key: "client_invoice", label: "Client invoice (IT Solutions)" },
  { key: "workspace_rent", label: "Workspace rent" },
  { key: "other", label: "Other" },
];

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, outline: "none" };

const blank = { type: "bank_transfer", display_name: "", account_title: "", account_number: "", iban: "", bank_name: "", notes: "", is_active: true, sort_order: 0, usages: [], qr_image: "", qr_url: null, qr_remove: false };

function AccountModal({ open, mode, initial, onCancel, onSubmit, isLoading }) {
  const [f, setF] = useState(blank);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setServerError("");
    setF(initial ? {
      type: initial.type || "bank_transfer",
      display_name: initial.display_name || "",
      account_title: initial.account_title || "",
      account_number: initial.account_number || "",
      iban: initial.iban || "",
      bank_name: initial.bank_name || "",
      notes: initial.notes || "",
      is_active: initial.is_active !== false,
      sort_order: initial.sort_order ?? 0,
      usages: Array.isArray(initial.usages) ? initial.usages : [],
      qr_image: "", qr_url: initial.qr_url || null, qr_remove: false,
    } : blank);
  }, [open, initial]);

  const onPickQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { setServerError("QR must be an image file."); return; }
    if (file.size > 4 * 1024 * 1024) { setServerError("QR image must be under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setF((p) => ({ ...p, qr_image: reader.result, qr_remove: false }));
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleUsage = (key) => setF((p) => ({ ...p, usages: p.usages.includes(key) ? p.usages.filter((u) => u !== key) : [...p.usages, key] }));

  const save = async () => {
    if (!f.display_name.trim()) { setServerError("Display name is required."); return; }
    const res = await onSubmit({
      type: f.type,
      display_name: f.display_name.trim(),
      account_title: f.account_title.trim() || null,
      account_number: f.account_number.trim() || null,
      iban: f.iban.trim() || null,
      bank_name: f.bank_name.trim() || null,
      notes: f.notes.trim() || null,
      is_active: !!f.is_active,
      sort_order: Number(f.sort_order) || 0,
      usages: f.usages,
      ...(f.qr_image ? { qr_image: f.qr_image } : {}),
      ...(f.qr_remove ? { qr_remove: true } : {}),
    });
    if (res?.error) setServerError(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_TINT, color: BRAND }}><Landmark size={16} /></div>
            <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{mode === "edit" ? "Edit payment account" : "Add payment account"}</h3>
          </div>
          <button type="button" onClick={onCancel} style={{ color: TEXT_MUTED }}><X size={16} /></button>
        </div>

        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
          {serverError && <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_TINT, color: BRAND, border: "1px solid #FECACA" }}>{serverError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Type</label>
              <select value={f.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Display name *</label>
              <input value={f.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="e.g. Meezan – Main" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Account title</label>
              <input value={f.account_title} onChange={(e) => set("account_title", e.target.value)} placeholder="Account holder name" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Account / phone number</label>
              <input value={f.account_number} onChange={(e) => set("account_number", e.target.value)} placeholder="0300… / 1234567" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>IBAN</label>
              <input value={f.iban} onChange={(e) => set("iban", e.target.value.toUpperCase())} placeholder="PK00…" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Bank name</label>
              <input value={f.bank_name} onChange={(e) => set("bank_name", e.target.value)} placeholder="Meezan Bank" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Notes</label>
              <input value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Sort order</label>
              <input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} style={inputStyle} />
            </div>
            <label className="flex items-center gap-2 mt-6 cursor-pointer">
              <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} style={{ accentColor: "#15803D" }} />
              <span className="text-[13px] font-semibold" style={{ color: TEXT_SECONDARY }}>Active</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Show on which documents?</label>
            <p className="text-[11px] mb-2" style={{ color: TEXT_MUTED }}>Tick the challans/invoices this account should appear on. Leave all unticked to show on every document.</p>
            <div className="grid grid-cols-2 gap-2">
              {USAGES.map((u) => {
                const on = f.usages.includes(u.key);
                return (
                  <label key={u.key} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer" style={{ border: `1px solid ${on ? "#BBF7D0" : BORDER}`, background: on ? "#F0FDF4" : SURFACE }}>
                    <input type="checkbox" checked={on} onChange={() => toggleUsage(u.key)} style={{ accentColor: "#15803D" }} />
                    <span className="text-[12px]" style={{ color: TEXT_PRIMARY }}>{u.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Payment QR code (printed on challans)</label>
            <p className="text-[11px] mb-2" style={{ color: TEXT_MUTED }}>Upload the real scannable QR for this account (e.g. JazzCash / bank Raast QR). PNG/JPG, under 4MB.</p>
            <div className="flex items-center gap-3">
              {(f.qr_image || (f.qr_url && !f.qr_remove)) ? (
                <img src={f.qr_image || f.qr_url} alt="QR" style={{ width: 64, height: 64, objectFit: "contain", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff" }} />
              ) : (
                <div style={{ width: 64, height: 64, border: `1px dashed ${BORDER}`, borderRadius: 8, display: "grid", placeItems: "center", color: TEXT_MUTED, fontSize: 10 }}>No QR</div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, background: SURFACE }}>
                  <Plus size={12} /> {(f.qr_image || (f.qr_url && !f.qr_remove)) ? "Replace QR" : "Upload QR"}
                  <input type="file" accept="image/*" className="hidden" onChange={onPickQr} />
                </label>
                {(f.qr_image || (f.qr_url && !f.qr_remove)) && (
                  <button type="button" onClick={() => setF((p) => ({ ...p, qr_image: "", qr_remove: true }))} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: BRAND, background: BRAND_TINT }}>
                    <Trash2 size={12} /> Remove QR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
          <button type="button" onClick={save} disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : mode === "edit" ? "Save changes" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentAccounts() {
  const user = useSelector(selectCurrentUser);
  const canManage = hasPermission(user, "get finance-summary") || user?.role === "admin";

  const [formModal, setFormModal] = useState({ open: false, mode: null, account: null });
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { data, isLoading, error, refetch } = useGetQuery({ path: "finance/payment-accounts", params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];

  const [createA, { isLoading: creating }] = usePostMutation();
  const [updateA, { isLoading: updating }] = usePatchMutation();
  const [deleteA, { isLoading: deleting }] = useDeleteMutation();

  const usageLabel = useMemo(() => Object.fromEntries(USAGES.map((u) => [u.key, u.label])), []);

  const handleSubmit = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateA({ path: `finance/payment-accounts/${formModal.account.uuid}`, body: payload }).unwrap();
        showToast("Account updated", "success");
      } else {
        await createA({ path: "finance/payment-accounts", body: payload }).unwrap();
        showToast("Account created", "success");
      }
      setFormModal({ open: false, mode: null, account: null });
      refetch();
      return { error: null };
    } catch (err) {
      const errs = err?.data?.errors || {};
      return { error: Object.values(errs)[0]?.[0] || err?.data?.message || "Could not save account." };
    }
  };

  const handleDelete = async () => {
    try {
      await deleteA({ path: `finance/payment-accounts/${deleteDialog.uuid}` }).unwrap();
      showToast("Account deleted", "success");
      setDeleteDialog(null);
      refetch();
    } catch (err) {
      showToast(err?.data?.message || "Could not delete.", "error");
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}><Landmark size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Payment Accounts</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Accounts printed on challans & invoices. Tag each one with which documents it appears on.</p>
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={() => setFormModal({ open: true, mode: "add", account: null })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            <Plus size={15} /> Add account
          </button>
        )}
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Details</th>
              <th className="px-5 py-3">Shows on</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
            {!isLoading && error && <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px]" style={{ color: BRAND }}>Couldn't load accounts.</td></tr>}
            {!isLoading && !error && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No payment accounts yet.</td></tr>}
            {!isLoading && !error && rows.map((a) => (
              <tr key={a.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-5 py-3">
                  <div className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{a.display_name}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{a.type_label}{a.bank_name ? ` · ${a.bank_name}` : ""}</div>
                </td>
                <td className="px-5 py-3 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                  {a.account_title && <div>{a.account_title}</div>}
                  {a.account_number && <div className="font-mono">{a.account_number}</div>}
                  {a.iban && <div className="font-mono text-[11px]" style={{ color: TEXT_MUTED }}>IBAN {a.iban}</div>}
                </td>
                <td className="px-5 py-3">
                  {(!a.usages || a.usages.length === 0) ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>All documents</span>
                  ) : (
                    <div className="flex flex-wrap gap-1" style={{ maxWidth: 280 }}>
                      {a.usages.map((u) => <span key={u} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>{usageLabel[u] || u}</span>)}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold rounded-full" style={{ color: a.is_active ? "#15803D" : TEXT_SECONDARY, background: a.is_active ? "#F0FDF4" : "#F1F5F9", border: `1px solid ${a.is_active ? "#BBF7D0" : BORDER}` }}>
                    <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: a.is_active ? "#15803D" : "#94A3B8" }} />
                    {a.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button type="button" onClick={() => setFormModal({ open: true, mode: "edit", account: a })} title="Edit" className="grid rounded-md w-8 h-8 place-items-center" style={{ color: TEXT_SECONDARY }}><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeleteDialog(a)} title="Delete" className="grid rounded-md w-8 h-8 place-items-center" style={{ color: BRAND }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AccountModal
        open={formModal.open}
        mode={formModal.mode}
        initial={formModal.account}
        onCancel={() => setFormModal({ open: false, mode: null, account: null })}
        onSubmit={handleSubmit}
        isLoading={creating || updating}
      />

      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDeleteDialog(null)}>
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_TINT, color: BRAND }}><AlertTriangle size={22} /></div>
            <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>Delete &ldquo;{deleteDialog.display_name}&rdquo;?</h3>
            <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>It will stop appearing on new challans/invoices.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button type="button" onClick={() => setDeleteDialog(null)} disabled={deleting} className="py-2.5 text-sm font-semibold rounded-lg" style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}>Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center justify-center py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND }}>{deleting ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</> : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
