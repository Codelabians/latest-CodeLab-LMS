import { useState } from "react";
import { Loader2, Plus, Star, Trash2, ShieldCheck, X, CheckCircle2 } from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../../../api/apiSlice";
import { showToast } from "../../../ui/common/ShowToast";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const inputCls = "w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2";

// NOTE: defined at module scope (NOT inside the component). When this lived
// inside BankAccountsTab, every keystroke produced a new component type, so
// React remounted the <input> and it lost focus after one character.
const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
      {label}{required ? " *" : ""}
    </label>
    {children}
  </div>
);

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const BankAccountsTab = ({ profile, refetch: refetchParent }) => {
  const { data, isFetching, refetch } = useGetQuery({
    path: `employee/profiles/${profile.uuid}/bank-accounts`,
  });
  const list = unwrap(data);

  // Bank names come from the admin-managed banks catalog (Core › Banks),
  // not free text — keeps the data consistent like cities/provinces.
  const { data: banksResp } = useGetQuery({ path: "core/banks/active" });
  const banks = unwrap(banksResp);

  const blank = {
    account_title: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    iban: "",
    swift_code: "",
    currency: "PKR",
    is_primary: false,
  };
  const [form, setForm] = useState(blank);
  const [addOpen, setAddOpen] = useState(false);

  const [createAccount, { isLoading: creating }] = usePostMutation();
  const [setPrimary, { isLoading: settingPrimary }] = usePostMutation();
  const [verify, { isLoading: verifying }] = usePostMutation();
  const [removeAccount, { isLoading: removing }] = useDeleteMutation();

  const reset = () => {
    setForm(blank);
    setAddOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.account_title || !form.bank_name || !form.account_number) {
      showToast("Account title, bank name and account number are required.", "error");
      return;
    }
    try {
      await createAccount({
        path: `employee/profiles/${profile.uuid}/bank-accounts`,
        body: form,
      }).unwrap();
      showToast("Bank account added", "success");
      reset();
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not add account.", "error");
    }
  };

  const handleSetPrimary = async (uuid) => {
    try {
      await setPrimary({
        path: `employee/bank-accounts/${uuid}/set-primary`,
        body: {},
      }).unwrap();
      showToast("Primary account updated", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not set primary.", "error");
    }
  };

  const handleVerify = async (uuid) => {
    try {
      await verify({
        path: `employee/bank-accounts/${uuid}/verify`,
        body: {},
      }).unwrap();
      showToast("Bank account verified", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not verify.", "error");
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm("Delete this bank account?")) return;
    try {
      await removeAccount({ path: `employee/bank-accounts/${uuid}` }).unwrap();
      showToast("Account deleted", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not delete.", "error");
    }
  };

  const Field = ({ label, required, children }) => (
    <div>
      <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
        {label}{required ? " *" : ""}
      </label>
      {children}
    </div>
  );

  return (
    <div className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            Bank accounts
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            Salary will be paid into the primary verified account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
          style={{ background: BRAND_RED }}
        >
          {addOpen ? <X size={12} /> : <Plus size={12} />}
          {addOpen ? "Cancel" : "Add account"}
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 p-4 mb-4 border rounded-lg md:grid-cols-2"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <Field label="Account title" required>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.account_title}
              onChange={(e) => setForm((f) => ({ ...f, account_title: e.target.value }))}
            />
          </Field>
          <Field label="Bank name" required>
            <select
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.bank_name}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
            >
              <option value="">Select bank…</option>
              {banks.map((b) => (
                <option key={b.uuid || b.id} value={b.name}>{b.name}</option>
              ))}
              {/* Preserve a previously-saved value that isn't in the active list. */}
              {form.bank_name && !banks.some((b) => b.name === form.bank_name) && (
                <option value={form.bank_name}>{form.bank_name}</option>
              )}
            </select>
          </Field>
          <Field label="Branch name">
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.branch_name}
              onChange={(e) => setForm((f) => ({ ...f, branch_name: e.target.value }))}
            />
          </Field>
          <Field label="Account number" required>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.account_number}
              onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
            />
          </Field>
          <Field label="IBAN">
            <input
              className={`${inputCls} font-mono`}
              style={{ borderColor: BORDER }}
              value={form.iban}
              onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value.toUpperCase() }))}
            />
          </Field>
          <Field label="SWIFT code">
            <input
              className={`${inputCls} font-mono`}
              style={{ borderColor: BORDER }}
              value={form.swift_code}
              onChange={(e) => setForm((f) => ({ ...f, swift_code: e.target.value.toUpperCase() }))}
            />
          </Field>
          <Field label="Currency">
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs md:col-span-2" style={{ color: TEXT_SECONDARY }}>
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
            />
            Mark as primary account
          </label>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 text-xs border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
              style={{ background: BRAND_RED }}
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Save account
            </button>
          </div>
        </form>
      )}

      {isFetching && !list.length ? (
        <div className="py-8 text-center text-xs" style={{ color: TEXT_MUTED }}>
          <Loader2 size={14} className="inline mr-2 animate-spin" /> Loading accounts…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: TEXT_MUTED }}>
          No bank accounts yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a.uuid}
              className="flex items-start justify-between gap-3 px-4 py-3 border rounded-md"
              style={{ borderColor: BORDER, background: SURFACE_ALT }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                    {a.account_title}
                  </span>
                  {a.is_primary && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ color: "#CA8A04", background: "#FEFCE8" }}
                    >
                      <Star size={10} /> Primary
                    </span>
                  )}
                  {a.is_verified && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ color: "#16A34A", background: "#F0FDF4" }}
                    >
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                  {a.currency && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full"
                      style={{ color: TEXT_SECONDARY, background: "#F1F5F9" }}
                    >
                      {a.currency}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs" style={{ color: TEXT_SECONDARY }}>
                  {a.bank_name}
                  {a.branch_name ? <> · {a.branch_name}</> : null}
                </div>
                {a.iban && (
                  <div className="mt-1 text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
                    IBAN: {a.iban}
                  </div>
                )}
                {a.account_number && !a.iban && (
                  <div className="mt-1 text-[11px] font-mono" style={{ color: TEXT_MUTED }}>
                    A/C: {a.account_number}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {!a.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(a.uuid)}
                    disabled={settingPrimary}
                    className="px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                    style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
                  >
                    Set primary
                  </button>
                )}
                {!a.is_verified && (
                  <button
                    type="button"
                    onClick={() => handleVerify(a.uuid)}
                    disabled={verifying}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                    style={{ borderColor: "#BBF7D0", color: "#16A34A", background: "#F0FDF4" }}
                  >
                    <ShieldCheck size={11} /> Verify
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(a.uuid)}
                  disabled={removing}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                  style={{ borderColor: "#FECACA", color: BRAND_RED, background: BRAND_RED_TINT }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BankAccountsTab;
