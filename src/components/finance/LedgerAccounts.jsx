import { useState, useEffect } from "react";
import {
  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- tokens ---- */
const BRAND = "#C90606";
const GREEN = "#15803D";
const BLUE = "#1D4ED8";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);
const acctLabel = (a) => `${a.name} · ${(KIND_META[a.kind] || KIND_META.other).label}`;

const KIND_META = {
  cash: { label: "Cash", icon: Wallet, color: GREEN },
  bank: { label: "Bank", icon: Banknote, color: BLUE },
  wallet: { label: "Wallet", icon: Wallet, color: "#7C3AED" },
  person: { label: "Person", icon: User, color: AMBER },
  external: { label: "External", icon: User, color: TEXT_MUTED },
  other: { label: "Other", icon: BookOpen, color: TEXT_MUTED },
};

function positionLabel(a) {
  if (!a.is_person) return null;
  if (a.position === "owes_office") return { text: `Owes office ${money(a.abs_balance)}`, color: GREEN };
  if (a.position === "office_owes") return { text: `Office owes ${money(a.abs_balance)}`, color: BRAND };
  return { text: "Settled", color: TEXT_MUTED };
}

export default function LedgerAccounts() {
  const [showAccount, setShowAccount] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [openAcct, setOpenAcct] = useState(null); // account_uuid for statement

  const { data, isLoading, refetch } = useGetQuery(
    { path: "finance/ledger/accounts" },
    { refetchOnMountOrArgChange: true }
  );
  const accounts = data?.data || [];
  const moneyAccounts = accounts.filter((a) => a.is_money);
  const people = accounts.filter((a) => a.is_person);

  const refreshAll = () => refetch();

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><BookOpen size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Accounts &amp; Ledger</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Per-account debit/credit · two-way loans</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAccount(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
            <Plus size={15} /> Account
          </button>
          <button onClick={() => setShowMove(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
            <ArrowLeftRight size={15} /> Record movement
          </button>
        </div>
      </div>

      <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <>
          <Section title="Money accounts" accounts={moneyAccounts} onOpen={setOpenAcct} />
          <Section title="People & loans" accounts={people} onOpen={setOpenAcct} />
          {accounts.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
              No accounts yet. Create your cash/bank accounts and a person account for each director.
            </div>
          )}
        </>
      )}
      </div>

      {showAccount && <AccountModal onClose={() => setShowAccount(false)} onDone={() => { setShowAccount(false); refreshAll(); }} />}
      {showMove && <MovementModal accounts={accounts} onClose={() => setShowMove(false)} onDone={() => { setShowMove(false); refreshAll(); }} />}
      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} />}
    </div>
  );
}

function Section({ title, accounts, onOpen }) {
  if (!accounts.length) return null;
  return (
    <div>
      <h3 className="text-[12px] font-bold mb-2" style={{ color: TEXT_SECONDARY }}>{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const m = KIND_META[a.kind] || KIND_META.other;
          const pos = positionLabel(a);
          return (
            <button key={a.account_uuid} onClick={() => onOpen(a.account_uuid)} className="text-left bg-white rounded-xl p-4 hover:shadow-sm transition" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="grid rounded-lg place-items-center" style={{ width: 30, height: 30, background: `${m.color}14`, color: m.color }}><m.icon size={15} /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] truncate" style={{ color: TEXT_PRIMARY }}>{a.name}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{m.label}</div>
                </div>
              </div>
              {a.is_money ? (
                <div className="text-[17px] font-bold" style={{ color: TEXT_PRIMARY }}>{money(a.current_balance)}</div>
              ) : pos ? (
                <div className="text-[14px] font-bold" style={{ color: pos.color }}>{pos.text}</div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Statement drawer -------------------- */
function StatementDrawer({ uuid, onClose }) {
  const { data, isLoading } = useGetQuery({ path: `finance/ledger/accounts/${uuid}`, params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const acct = data?.data?.account;
  const entries = data?.data?.entries || [];
  const [proof, setProof] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-white overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{acct?.name || "Account"}</h2>
            {acct && (
              <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {acct.is_money ? `Balance ${money(acct.current_balance)}` : (positionLabel(acct)?.text || "")}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                {["Date", "Description", "Debit", "Credit", "Balance", ""].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center" style={{ color: TEXT_MUTED }}>No entries.</td></tr>
              ) : entries.map((e) => (
                <tr key={e.entry_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{e.entry_date}</td>
                  <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>
                    {e.description || <span className="capitalize" style={{ color: TEXT_MUTED }}>{String(e.category).replace(/_/g, " ")}</span>}
                    {(e.counterparty?.name || e.counterparty_label) && <span className="text-[11px]" style={{ color: TEXT_MUTED }}> · {e.counterparty?.name || e.counterparty_label}</span>}
                  </td>
                  <td className="px-3 py-2" style={{ color: GREEN }}>{e.debit > 0 ? money(e.debit) : ""}</td>
                  <td className="px-3 py-2" style={{ color: BRAND }}>{e.credit > 0 ? money(e.credit) : ""}</td>
                  <td className="px-3 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(e.balance_after)}</td>
                  <td className="px-3 py-2">
                    {e.has_proof && e.proof_url && (
                      <button onClick={() => setProof(e.proof_url)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BLUE }}><Paperclip size={12} /> View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {proof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setProof(null)}>
          <img src={proof} alt="Proof" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}

/* -------------------- Create account -------------------- */
function AccountModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: "", kind: "cash", opening_balance: "", external_party: "", user_id: "", notes: "" });
  const [personGroup, setPersonGroup] = useState("staff"); // staff | student
  const [post, { isLoading }] = usePostMutation();
  const isPerson = form.kind === "person";
  const isExternal = form.kind === "external";

  // Users for the person picker, scoped by role group (staff vs students).
  const { data: peopleData, isFetching: loadingPeople } = useGetQuery(
    { path: "finance/ledger/people", params: { group: personGroup } },
    { skip: !isPerson }
  );
  const people = peopleData?.data || [];
  const peopleOptions = people.map((p) => ({
    value: String(p.id),
    label: p.existing_account
      ? `${p.name} — already added`
      : (p.role ? `${p.name} · ${p.role}` : p.name),
  }));

  const pickPerson = (id) => {
    const p = people.find((x) => String(x.id) === String(id));
    setForm((f) => ({ ...f, user_id: id || "", name: p ? p.name : f.name }));
  };

  const submit = async () => {
    if (!form.name.trim()) return showToast("Pick a person or enter a name", "error");
    try {
      const res = await post({
        path: "finance/ledger/accounts",
        body: {
          name: form.name.trim(),
          kind: form.kind,
          user_id: isPerson && form.user_id ? Number(form.user_id) : null,
          external_party: isExternal && form.external_party ? form.external_party : null,
          opening_balance: Number(form.opening_balance) || 0,
          notes: form.notes || null,
        },
      }).unwrap();
      showToast(res?.message || "Account created", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not create account", "error");
    }
  };

  return (
    <Modal title="New account" onClose={onClose}>
      <div className="space-y-3">
        <Labeled label="Account type">
          <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value, user_id: "", external_party: "" }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
            {Object.entries(KIND_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
            {isPerson ? "A staff member who lends to / borrows from the office." : isExternal ? "An outside person or vendor (not a system user)." : "A money location (cash, bank, mobile wallet)."}
          </p>
        </Labeled>

        {isPerson && (
          <Labeled label="Pick a person">
            <div className="inline-flex p-1 rounded-lg w-full mb-2" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              {[{ v: "staff", l: "Staff" }, { v: "student", l: "Students" }].map((t) => (
                <button key={t.v} type="button" onClick={() => { setPersonGroup(t.v); setForm((f) => ({ ...f, user_id: "" })); }}
                  className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md"
                  style={personGroup === t.v ? { background: "#fff", color: BRAND, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: TEXT_MUTED }}>
                  {t.l}
                </button>
              ))}
            </div>
            <SearchableSelect options={peopleOptions} value={form.user_id} onChange={pickPerson} placeholder={loadingPeople ? "Loading…" : `Search ${personGroup === "staff" ? "staff" : "students"}…`} />
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>Staff = employees, admins, teachers… Students = enrolled learners.</p>
          </Labeled>
        )}
        {isExternal && (
          <Labeled label="External party">
            <input value={form.external_party} onChange={(e) => setForm((f) => ({ ...f, external_party: e.target.value, name: e.target.value }))} placeholder="Name of the outside person/vendor" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
        )}

        <Labeled label="Account name">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={isPerson || isExternal ? "Auto-filled from the person above (editable)" : "e.g. Cash, Meezan Bank"} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </Labeled>

        <Labeled label="Opening balance (Rs)">
          <input type="number" value={form.opening_balance} onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))} placeholder="0" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          {(isPerson || isExternal) && <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>Positive = they owe the office; negative = office owes them. Leave 0 if starting fresh.</p>}
        </Labeled>

        <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create account
        </button>
      </div>
    </Modal>
  );
}

/* -------------------- Record movement (From → To) -------------------- */
function MovementModal({ accounts, onClose, onDone }) {
  const [fromType, setFromType] = useState("account"); // account | income
  const [toType, setToType] = useState("expense");     // account | expense
  const [form, setForm] = useState({
    from_account_uuid: "", from_category: "", to_account_uuid: "", to_category: "",
    recipient_name: "", amount: "", entry_date: today(), description: "",
  });
  const [proofFile, setProofFile] = useState(null);
  const [post, { isLoading }] = usePostMutation();

  const { data: expData } = useGetQuery({ path: "finance/categories/expense" });
  const { data: incData } = useGetQuery({ path: "finance/categories/income" });
  const expenseCats = (expData?.data || []).map((c) => ({ value: c.key, label: c.name }));
  const incomeCats = (incData?.data || []).map((c) => ({ value: c.key, label: c.name }));

  // Auto-pick a single account on the FROM side.
  useEffect(() => {
    if (fromType === "account" && !form.from_account_uuid && accounts.length === 1) {
      setForm((f) => ({ ...f, from_account_uuid: accounts[0].account_uuid }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromType]);

  const submit = async () => {
    if (fromType === "account" && !form.from_account_uuid) return showToast("Pick where the money comes from", "error");
    if (fromType === "income" && !form.from_category) return showToast("Pick an income source", "error");
    if (toType === "account" && !form.to_account_uuid) return showToast("Pick where the money goes", "error");
    if (toType === "expense" && !form.to_category) return showToast("Pick an expense category", "error");
    if (fromType !== "account" && toType !== "account") return showToast("At least one side must be a cash/bank/person account", "error");
    if (!form.amount || Number(form.amount) <= 0) return showToast("Enter a valid amount", "error");

    const payload = {
      from_kind: fromType === "account" ? "account" : "category",
      to_kind: toType === "account" ? "account" : "category",
      from_account_uuid: fromType === "account" ? form.from_account_uuid : null,
      from_category: fromType === "income" ? form.from_category : null,
      to_account_uuid: toType === "account" ? form.to_account_uuid : null,
      to_category: toType === "expense" ? form.to_category : null,
      recipient_name: form.recipient_name || null,
      amount: Number(form.amount),
      entry_date: form.entry_date,
      description: form.description || null,
    };

    try {
      let body = payload;
      if (proofFile) {
        body = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v !== null && v !== undefined) body.append(k, typeof v === "number" ? String(v) : v); });
        body.append("proof", proofFile);
      }
      const res = await post({ path: "finance/ledger/movement", body }).unwrap();
      showToast(res?.message || "Movement recorded", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not record movement", "error");
    }
  };

  const seg = (value, set, options) => (
    <div className="inline-flex p-1 rounded-lg w-full" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => set(o.v)} className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md"
          style={value === o.v ? { background: "#fff", color: BRAND, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: TEXT_MUTED }}>{o.l}</button>
      ))}
    </div>
  );
  const acctSelect = (val, on) => (
    <select value={val} onChange={(e) => on(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
      <option value="">Select account…</option>
      {accounts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{acctLabel(a)}</option>)}
    </select>
  );

  return (
    <Modal title="Record movement" onClose={onClose}>
      <div className="space-y-3">
        {/* FROM */}
        <Labeled label="Money comes from">
          {seg(fromType, (v) => { setFromType(v); setForm((f) => ({ ...f, from_account_uuid: "", from_category: "" })); }, [{ v: "account", l: "An account" }, { v: "income", l: "Income" }])}
          <div className="mt-2">
            {fromType === "account" ? acctSelect(form.from_account_uuid, (v) => setForm((f) => ({ ...f, from_account_uuid: v }))) : (
              <select value={form.from_category} onChange={(e) => setForm((f) => ({ ...f, from_category: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                <option value="">Select income source…</option>
                {incomeCats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
          </div>
        </Labeled>

        {/* TO */}
        <Labeled label="Money goes to">
          {seg(toType, (v) => { setToType(v); setForm((f) => ({ ...f, to_account_uuid: "", to_category: "" })); }, [{ v: "account", l: "An account" }, { v: "expense", l: "Expense" }])}
          <div className="mt-2 space-y-2">
            {toType === "account" ? acctSelect(form.to_account_uuid, (v) => setForm((f) => ({ ...f, to_account_uuid: v }))) : (
              <>
                <select value={form.to_category} onChange={(e) => setForm((f) => ({ ...f, to_category: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                  <option value="">Select expense…</option>
                  {expenseCats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input value={form.recipient_name} onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))} placeholder="Recipient (optional, e.g. Ahmad)" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
              </>
            )}
          </div>
        </Labeled>

        <p className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
          A person funding a salary = From that person → To “Salary”. Office cash is only used when it’s actually involved.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Amount (Rs)">
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
          <Labeled label="Date">
            <input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </Labeled>
        </div>
        <Labeled label="Description (optional)">
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </Labeled>
        <Labeled label="Proof image (optional)">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[12px]" style={{ background: SURFACE, border: `1px dashed ${BORDER}`, color: TEXT_SECONDARY }}>
            <Paperclip size={14} /> {proofFile ? proofFile.name : "Attach a photo as proof"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
        </Labeled>
        <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <ArrowLeftRight size={15} />} Record
        </button>
      </div>
    </Modal>
  );
}

/* -------------------- shared UI -------------------- */
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
