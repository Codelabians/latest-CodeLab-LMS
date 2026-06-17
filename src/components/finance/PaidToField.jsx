import { useState } from "react";
import { User, Plus, Check, Loader2 } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

/**
 * "Paid to" field for expenses. Two modes:
 *   - Within office : pick an internal employee (payee_user_id)
 *   - External party: pick (or create) a ledger account for someone outside
 *                     the org (payee_ledger_account_id), with an optional
 *                     "settle in their ledger" toggle that posts the payment
 *                     into their running balance.
 *
 * value:    { payee_user_id, payee_ledger_account_id, settle_in_ledger }
 * onChange: receives the full merged value object.
 */
export default function PaidToField({ employeeOptions = [], value, onChange, accent = BRAND }) {
  const payeeUserId = value?.payee_user_id ? String(value.payee_user_id) : "";
  const payeeLedgerAccountId = value?.payee_ledger_account_id ? String(value.payee_ledger_account_id) : "";
  const settle = !!value?.settle_in_ledger;

  const [mode, setMode] = useState(payeeLedgerAccountId ? "external" : "office");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  // Expense-scoped party list (works for finance staff without full ledger access).
  const { data: ledgerResp, refetch } = useGetQuery({ path: "finance/expense-parties" });
  const externalAccts = ledgerResp?.data || [];
  const externalOptions = externalAccts.map((a) => ({ value: String(a.id), label: a.party_label || a.name }));
  const selectedExternal = externalAccts.find((a) => String(a.id) === payeeLedgerAccountId);

  const [createAccount, { isLoading: savingAccount }] = usePostMutation();

  const switchMode = (m) => {
    setMode(m);
    if (m === "office") {
      onChange({ payee_user_id: payeeUserId, payee_ledger_account_id: "", settle_in_ledger: false });
    } else {
      onChange({ payee_user_id: "", payee_ledger_account_id: payeeLedgerAccountId, settle_in_ledger: settle });
    }
  };

  const selectEmployee = (v) =>
    onChange({ payee_user_id: v || "", payee_ledger_account_id: "", settle_in_ledger: false });

  const selectExternal = (v) =>
    onChange({ payee_user_id: "", payee_ledger_account_id: v || "", settle_in_ledger: v ? settle : false });

  const toggleSettle = () =>
    onChange({ payee_user_id: "", payee_ledger_account_id: payeeLedgerAccountId, settle_in_ledger: !settle });

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await createAccount({ path: "finance/expense-parties", body: { name, kind: "person" } }).unwrap();
      const acct = res?.data;
      await refetch();
      setNewName("");
      setShowCreate(false);
      if (acct?.id) {
        onChange({ payee_user_id: "", payee_ledger_account_id: String(acct.id), settle_in_ledger: settle });
      }
      showToast("Party added to the ledger.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Could not create the party.", "error");
    }
  };

  return (
    <div>
      <label className="flex items-center gap-1 text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>
        <User size={12} /> Paid to (optional)
      </label>

      {/* Mode toggle */}
      <div className="inline-flex w-full p-1 mb-2 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        {[{ v: "office", l: "Within office" }, { v: "external", l: "External party" }].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => switchMode(o.v)}
            className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md"
            style={mode === o.v ? { background: "#fff", color: accent } : { color: TEXT_MUTED }}
          >
            {o.l}
          </button>
        ))}
      </div>

      {mode === "office" ? (
        <SearchableSelect
          options={employeeOptions}
          value={payeeUserId}
          onChange={(v) => selectEmployee(v)}
          placeholder="Select employee (e.g. for fuel)"
        />
      ) : (
        <div className="space-y-2">
          <SearchableSelect
            options={externalOptions}
            value={payeeLedgerAccountId}
            onChange={(v) => selectExternal(v)}
            placeholder={externalOptions.length ? "Search an external person…" : "No external parties yet"}
          />

          {/* Create a new external party inline */}
          {showCreate ? (
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New party's name"
                className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || savingAccount}
                className="inline-flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: accent }}
              >
                {savingAccount ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setNewName(""); }} className="px-2 text-[12px]" style={{ color: TEXT_MUTED }}>Cancel</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: accent }}
            >
              <Plus size={13} /> Not listed? Create their ledger
            </button>
          )}

          {/* Settle toggle — only meaningful once a party is chosen */}
          {payeeLedgerAccountId && (
            <label className="flex items-start gap-2 px-3 py-2 mt-1 text-[12px] rounded-lg cursor-pointer" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
              <input type="checkbox" checked={settle} onChange={toggleSettle} className="mt-0.5" style={{ accentColor: BRAND }} />
              <span>
                Settle this payment in {selectedExternal?.party_label || selectedExternal?.name || "their"} ledger
                <span className="block text-[11px]" style={{ color: TEXT_MUTED }}>Posts the amount into their running balance. Leave off to just record who was paid.</span>
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
