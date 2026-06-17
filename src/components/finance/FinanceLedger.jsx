import { useEffect, useState } from "react";
import {
  ArrowLeft, Plus, X, Pencil, Trash2, Calendar, FileText, User, History,
  ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown,
  Wifi, Wrench, Zap, Briefcase, Building, Gift, PiggyBank, Book, Search, Paperclip,
} from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation } from "../../api/apiSlice";
import BatchTabs from "../ui/BatchTabs";
import { useExpensePerms, ExpenseHistoryModal } from "./expenseAudit";
import PaidToField from "./PaidToField";

/* ---- design tokens (match Finance Stats / dashboards) ---- */
const BRAND = "#C90606";
const GREEN = "#15803D";
const ORANGE = "#C2410C";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();

const CATEGORY_ICON = {
  internet: Wifi, misc: Wrench, salary: Briefcase, utilities: Zap,
  business: Building, investment: TrendingUp, freelance: Book,
  rental: Building, bonus: Gift, other: PiggyBank, courses: Book,
  flh: Building, security_payment: Wallet,
};

const TYPE_CONFIG = {
  income: { label: "Income", accent: GREEN, tint: "#F0FDF4", icon: TrendingUp, noun: "income" },
  expense: { label: "Expense", accent: ORANGE, tint: "#FFF7ED", icon: TrendingDown, noun: "expense" },
};

/* Business-unit sections — render order + labels. */
const SECTIONS = [
  { key: "tech_school", label: "Tech School" },
  { key: "it_solutions", label: "IT Solutions" },
  { key: "other", label: "Other" },
  { key: "__none__", label: "Uncategorized" },
];

/* ------------------------- Add / Edit modal ------------------------- */
function EntryModal({ isOpen, onClose, onSubmit, categoryName, accent, type, record, saving, employeeOptions = [] }) {
  const isEdit = !!record;
  const [form, setForm] = useState({ amount: "", transaction_date: "", description: "", payee_user_id: "", payee_ledger_account_id: "", settle_in_ledger: false, payment_method: "", payer_type: "office", funded_by_account_uuid: "" });
  const [proofFile, setProofFile] = useState(null);

  // Ledger accounts for the funding/receiving picker.
  const { data: ledgerResp } = useGetQuery({ path: "finance/ledger/accounts" }, { skip: !isOpen });
  const officeAccts = (ledgerResp?.data || []).filter((a) => a.is_money);
  const personAccts = (ledgerResp?.data || []).filter((a) => a.is_person);

  useEffect(() => {
    if (!isOpen) return;
    setProofFile(null);
    setForm(
      isEdit
        ? { amount: record.amount?.toString() || "", transaction_date: record.date || "", description: record.description || "", payee_user_id: record.payee_user_id ? String(record.payee_user_id) : "", payee_ledger_account_id: record.payee_ledger_account_id ? String(record.payee_ledger_account_id) : "", settle_in_ledger: !!record.ledger_settled, payment_method: record.payment_method || "", payer_type: "office", funded_by_account_uuid: "" }
        : { amount: "", transaction_date: "", description: "", payee_user_id: "", payee_ledger_account_id: "", settle_in_ledger: false, payment_method: "", payer_type: "office", funded_by_account_uuid: "" }
    );
  }, [isOpen, record, isEdit]);

  if (!isOpen) return null;
  const cfg = TYPE_CONFIG[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center rounded-lg" style={{ width: 36, height: 36, background: cfg.tint, color: accent }}><cfg.icon size={17} /></span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`}</h2>
              <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{categoryName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Amount</label>
            <div className="relative">
              <span className="absolute text-[12px] font-semibold left-3 top-2.5" style={{ color: TEXT_MUTED }}>PKR</span>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" className="w-full py-2 text-sm rounded-lg outline-none pl-12 pr-3"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 flex items-center gap-1" style={{ color: TEXT_SECONDARY }}><Calendar size={12} /> Transaction date</label>
            <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>
          {type === "expense" && (
            <PaidToField
              employeeOptions={employeeOptions}
              accent={accent}
              value={{ payee_user_id: form.payee_user_id, payee_ledger_account_id: form.payee_ledger_account_id, settle_in_ledger: form.settle_in_ledger }}
              onChange={(next) => setForm({ ...form, ...next })}
            />
          )}
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Payment method</label>
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
              <option value="">— Not specified —</option>
              <option value="cash">Cash</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1 flex items-center gap-1" style={{ color: TEXT_SECONDARY }}><FileText size={12} /> Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={`Notes about this ${cfg.noun}…`} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>{type === "income" ? "Received into" : "Paid by"} (optional — records in ledger)</label>
              <div className="inline-flex w-full p-1 mb-2 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                {[{ v: "office", l: "Office account" }, { v: "person", l: "A person" }].map((o) => (
                  <button key={o.v} type="button" onClick={() => setForm({ ...form, payer_type: o.v, funded_by_account_uuid: "" })}
                    className="flex-1 px-2 py-1.5 text-[11.5px] font-semibold rounded-md"
                    style={form.payer_type === o.v ? { background: "#fff", color: accent } : { color: TEXT_MUTED }}>{o.l}</button>
                ))}
              </div>
              <select value={form.funded_by_account_uuid} onChange={(e) => setForm({ ...form, funded_by_account_uuid: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
                <option value="">Select account…</option>
                {(form.payer_type === "person" ? personAccts : officeAccts).map((a) => (
                  <option key={a.account_uuid} value={a.account_uuid}>{a.name} · {a.kind}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 mt-2 px-3 py-2 text-[12px] border border-dashed rounded-lg cursor-pointer" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
                <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({ amount: parseFloat(form.amount), transaction_date: form.transaction_date, description: form.description, payee_user_id: form.payee_user_id ? Number(form.payee_user_id) : null, payee_ledger_account_id: form.payee_ledger_account_id ? Number(form.payee_ledger_account_id) : null, settle_in_ledger: !!form.settle_in_ledger, payment_method: form.payment_method || null, funded_by_account_uuid: form.funded_by_account_uuid || null, proofFile })}
            disabled={!form.amount || !form.transaction_date || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ background: accent }}>
            {saving ? "Saving…" : isEdit ? `Update ${cfg.label}` : `Add ${cfg.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Delete modal -------------------------- */
function ConfirmDelete({ isOpen, onClose, onConfirm, busy, title = "Delete this entry?", message = "This action cannot be undone.", error }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 text-center bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-full place-items-center" style={{ background: "#FEF2F2", color: BRAND }}><Trash2 size={22} /></div>
        <h2 className="text-[15px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{title}</h2>
        <p className="text-[12px] mb-5" style={{ color: TEXT_MUTED }}>{message}</p>
        {error && <div className="mb-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{busy ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Category create / edit modal ---------------------- */
function CategoryModal({ isOpen, onClose, onSubmit, category, typeLabel, saving, error }) {
  const isEdit = !!category;
  const [name, setName] = useState("");
  const [section, setSection] = useState("other");
  useEffect(() => {
    if (!isOpen) return;
    setName(category?.name || "");
    setSection(category?.section || "other");
  }, [isOpen, category]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit category" : `New ${typeLabel} category`}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fuel, Bonuses, Decorations" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Business unit</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
              <option value="tech_school">Tech School</option>
              <option value="it_solutions">IT Solutions</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        {error && <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}
        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={() => onSubmit({ name: name.trim(), section })} disabled={!name.trim() || saving} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{saving ? "Saving…" : isEdit ? "Save" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Ledger table --------------------------- */
const STUDENT_TABS = [
  { id: "all", label: "All", param: null },
  { id: "military", label: "Military", param: 0 },
  { id: "civilian", label: "Civilian", param: 1 },
];

function LedgerTable({ type, category, accent, onBack, openAddOnMount = false }) {
  const cfg = TYPE_CONFIG[type];
  const isCoursesIncome = type === "income" && category.name === "Courses";

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [studentTab, setStudentTab] = useState("all");
  const [batchTab, setBatchTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);
  const [search, setSearch] = useState("");

  // Expenses: edit = finance staff; delete = admins/leadership. Income keeps
  // its existing behaviour (server still enforces finance-summary perms).
  const { canEdit, canDelete } = useExpensePerms();
  const showEdit = type === "expense" ? canEdit : true;
  const showDelete = type === "expense" ? canDelete : true;
  const showHistory = type === "expense";
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const studentParam = STUDENT_TABS.find((t) => t.id === studentTab)?.param;

  const { data, isLoading, isError, refetch } = useGetQuery({
    path: "finance",
    params: {
      category_id: category.id,
      page,
      per_page: perPage,
      ...(debouncedSearch && { q: debouncedSearch }),
      ...(isCoursesIncome && studentTab !== "all" && { is_civilian: studentParam }),
      ...(type === "income" && batchTab !== "all" && { batch_id: batchTab }),
    },
  });

  // Employees — for the "paid to" picker on expenses + showing payee names.
  // Expense-scoped endpoint (gated by the expense permission, returns only
  // id/name/employee_id) so expense users don't need teams/employee access.
  const { data: empData } = useGetQuery({ path: "finance/expense-payees" }, { skip: type !== "expense" });
  const employees = empData?.data || [];
  const employeeOptions = employees.map((e) => ({ value: String(e.id), label: e.employee_id ? `${e.name} · ${e.employee_id}` : e.name }));
  const employeeName = (id) => employees.find((e) => String(e.id) === String(id))?.name || (id ? `User #${id}` : null);

  // External parties → resolve payee names for display (expense-scoped).
  const { data: ledgerAcctData } = useGetQuery({ path: "finance/expense-parties" }, { skip: type !== "expense" });
  const ledgerPartyName = (id) => {
    const a = (ledgerAcctData?.data || []).find((x) => String(x.id) === String(id));
    return a?.party_label || a?.name || (id ? `Party #${id}` : null);
  };

  useEffect(() => { refetch(); }, [page, perPage, studentTab, batchTab, debouncedSearch, refetch]);
  // Jump straight to the "Add" form when opened via a category's "+ Record".
  useEffect(() => { if (openAddOnMount) setAddOpen(true); }, [openAddOnMount]);

  const rows = (data?.data?.data || []).map((r) => ({
    uuid: r.finance_uuid, amount: r.amount, date: r.transaction_date, description: r.description,
    payee_user_id: r.payee_user_id, payment_method: r.payment_method,
    payee_ledger_account_id: r.payee_ledger_account_id, ledger_settled: r.ledger_settled,
  }));
  const meta = data?.meta?.pagination || {};
  const currentPage = meta.current_page || page;
  const lastPage = meta.total_pages || meta.last_page || 1;
  const total = meta.total ?? rows.length;
  const pageTotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  const [createTx, { isLoading: creating }] = usePostMutation();
  const [updateTx, { isLoading: updating }] = usePatchMutation();
  const [deleteTx, { isLoading: deleting }] = useDeleteMutation();

  const onAdd = async (body) => {
    const { proofFile, ...rest } = body;
    let payload;
    if (proofFile) {
      // Multipart so the proof image rides along with the transaction.
      payload = new FormData();
      Object.entries({ ...rest, category_id: category.id }).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") payload.append(k, typeof v === "number" ? String(v) : v);
      });
      payload.append("proof", proofFile);
    } else {
      payload = { ...rest, category_id: category.id };
    }
    try { await createTx({ path: "finance/create", body: payload }).unwrap(); setAddOpen(false); refetch(); }
    catch (e) { console.error("create finance failed", e); }
  };
  const onEdit = async (body) => {
    // funding/proof are add-only; don't send them on edit.
    const { proofFile, funded_by_account_uuid, ...rest } = body;
    void proofFile; void funded_by_account_uuid;
    try { await updateTx({ path: `finance/update/${editRow.uuid}`, body: { ...rest, category_id: category.id } }).unwrap(); setEditRow(null); refetch(); }
    catch (e) { console.error("update finance failed", e); }
  };
  const onDelete = async () => {
    try { await deleteTx({ path: `finance/delete/${deleteRow.uuid}`, body: {} }).unwrap(); setDeleteRow(null); refetch(); }
    catch (e) { console.error("delete finance failed", e); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{category.name}</h2>
            <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>{total} {cfg.noun} {total === 1 ? "entry" : "entries"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute -translate-y-1/2 left-2.5 top-1/2" style={{ color: TEXT_MUTED }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${cfg.noun}…`}
              className="py-2 pl-8 pr-3 text-[13px] rounded-lg outline-none w-56"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }}><X size={13} /></button>
            )}
          </div>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: accent }}>
            <Plus size={15} /> Add {cfg.label}
          </button>
        </div>
      </div>

      {isCoursesIncome && (
        <div className="inline-flex p-1 mb-3 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
          {STUDENT_TABS.map((t) => (
            <button key={t.id} onClick={() => { setStudentTab(t.id); setPage(1); }}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-md"
              style={studentTab === t.id ? { background: "#fff", color: accent, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: TEXT_MUTED }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {type === "income" && (
        <div className="mb-3"><BatchTabs activeBatchTab={batchTab} setActiveBatchTab={(v) => { setBatchTab(v); setPage(1); }} /></div>
      )}

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
              <th className="px-4 py-2.5 text-left font-semibold text-[11px]">Amount</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[11px]">Date</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[11px]">Description</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[11px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>Loading…</td></tr>
            ) : isError ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[12px]" style={{ color: BRAND }}>Failed to load entries.</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No {cfg.noun} entries yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5 font-bold tabular-nums" style={{ color: accent }}>{money(r.amount)}</td>
                  <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.date}</td>
                  <td className="px-4 py-2.5" style={{ color: TEXT_PRIMARY }}>
                    {r.description || <span style={{ color: TEXT_MUTED }}>—</span>}
                    {type === "expense" && r.payee_user_id && (
                      <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: SURFACE, color: TEXT_SECONDARY }}><User size={10} /> {employeeName(r.payee_user_id)}</span>
                    )}
                    {type === "expense" && r.payee_ledger_account_id && (
                      <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: BRAND }} title={r.ledger_settled ? "Settled in ledger" : "Recorded (not settled)"}><User size={10} /> {ledgerPartyName(r.payee_ledger_account_id)}{r.ledger_settled ? " · settled" : ""}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {showHistory && (
                        <button onClick={() => setHistoryRow(r)} title="Edit history" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><History size={13} /></button>
                      )}
                      {showEdit && (
                        <button onClick={() => setEditRow(r)} title="Edit" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /></button>
                      )}
                      {showDelete && (
                        <button onClick={() => setDeleteRow(r)} title="Delete" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
                      )}
                      {!showEdit && !showDelete && !showHistory && (
                        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: `2px solid ${BORDER}`, background: SURFACE }}>
                <td className="px-4 py-2.5 font-bold" style={{ color: TEXT_PRIMARY }}>{money(pageTotal)}</td>
                <td colSpan={3} className="px-4 py-2.5 text-[11px]" style={{ color: TEXT_MUTED }}>Page total</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ChevronLeft size={14} /> Prev</button>
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>Page {currentPage} / {lastPage}</span>
          <button disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Next <ChevronRight size={14} /></button>
        </div>
      )}

      <EntryModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} categoryName={category.name} accent={accent} type={type} saving={creating} employeeOptions={employeeOptions} />
      <EntryModal isOpen={!!editRow} onClose={() => setEditRow(null)} onSubmit={onEdit} categoryName={category.name} accent={accent} type={type} record={editRow} saving={updating} employeeOptions={employeeOptions} />
      <ConfirmDelete isOpen={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={onDelete} busy={deleting} />
      {historyRow && (
        <ExpenseHistoryModal uuid={historyRow.uuid} title={`Edit history — ${category.name}`} onClose={() => setHistoryRow(null)} />
      )}
    </div>
  );
}

/* ----------------------------- main view ---------------------------- */
export default function FinanceLedger({ type = "income", embedded = false }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.income;
  const [selected, setSelected] = useState(null);
  const [autoAdd, setAutoAdd] = useState(false);

  const { data, isLoading, isError, refetch } = useGetQuery({ path: `finance/categories/${type}` });
  const allCategories = data?.data || [];
  const [catSearch, setCatSearch] = useState("");
  const categories = catSearch.trim()
    ? allCategories.filter((c) => (c.name || "").toLowerCase().includes(catSearch.trim().toLowerCase()))
    : allCategories;

  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);
  const [catErr, setCatErr] = useState(null);
  const [createCat, { isLoading: creatingCat }] = usePostMutation();
  const [updateCat, { isLoading: updatingCat }] = usePatchMutation();
  const [deleteCat, { isLoading: deletingCatBusy }] = useDeleteMutation();

  const errText = (e) => e?.data?.message || (e?.status === 404 ? "Endpoint not found — restart backend after migrating." : `Request failed (HTTP ${e?.status ?? "?"}).`);

  const submitCat = async ({ name, section }) => {
    setCatErr(null);
    try {
      if (editingCat) await updateCat({ path: `finance/categories/${editingCat.id}`, body: { name, section } }).unwrap();
      else await createCat({ path: "finance/categories", body: { name, section, type } }).unwrap();
      setCatModal(false); setEditingCat(null); refetch();
    } catch (e) { console.error("save category failed", e); setCatErr(errText(e)); }
  };
  const confirmDeleteCat = async () => {
    setCatErr(null);
    try { await deleteCat({ path: `finance/categories/${deletingCat.id}`, body: {} }).unwrap(); setDeletingCat(null); refetch(); }
    catch (e) { console.error("delete category failed", e); setCatErr(errText(e)); }
  };

  const Body = (
    <>
      {selected ? (
        <LedgerTable type={type} category={selected} accent={cfg.accent} openAddOnMount={autoAdd} onBack={() => { setSelected(null); setAutoAdd(false); }} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            {!embedded ? (
              <div className="flex items-center gap-3">
                <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: cfg.tint, color: cfg.accent }}><cfg.icon size={18} /></div>
                <div>
                  <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{cfg.label} Categories</h1>
                  <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Select a category to view and manage {cfg.noun}</p>
                </div>
              </div>
            ) : <div />}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute -translate-y-1/2 left-2.5 top-1/2" style={{ color: TEXT_MUTED }} />
                <input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search category…"
                  className="py-2 pl-8 pr-3 text-[13px] rounded-lg outline-none w-52"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                />
                {catSearch && (
                  <button onClick={() => setCatSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }}><X size={13} /></button>
                )}
              </div>
              <button onClick={() => { setEditingCat(null); setCatErr(null); setCatModal(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: cfg.accent }}>
                <Plus size={15} /> New category
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-[13px]" style={{ color: TEXT_MUTED }}>Loading categories…</div>
          ) : isError ? (
            <div className="py-16 text-center text-[13px]" style={{ color: BRAND }}>Failed to load categories.</div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No {cfg.noun} categories yet</p>
              <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Use “New category” above to add your first one.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {SECTIONS.map((sec) => {
                const inSec = categories.filter((c) => (c.section || "__none__") === sec.key);
                if (inSec.length === 0) return null;
                return (
                  <div key={sec.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>{sec.label}</span>
                      <span className="flex-1 h-px" style={{ background: BORDER }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {inSec.map((c) => {
                        const Icon = CATEGORY_ICON[c.key] || cfg.icon;
                        return (
                          <div key={c.id} onClick={() => { setAutoAdd(false); setSelected(c); }} role="button" tabIndex={0}
                            className="relative p-4 text-left transition-shadow bg-white rounded-xl cursor-pointer hover:shadow-md group"
                            style={{ border: `1px solid ${BORDER}` }}>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); setEditingCat(c); setCatErr(null); setCatModal(true); }} title="Rename" className="grid rounded-md w-6 h-6 place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={11} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setDeletingCat(c); setCatErr(null); }} title="Delete" className="grid rounded-md w-6 h-6 place-items-center" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={11} /></button>
                            </div>
                            <span className="grid mb-3 rounded-lg place-items-center" style={{ width: 38, height: 38, background: cfg.tint, color: cfg.accent }}><Icon size={18} /></span>
                            <div className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{c.name}</div>
                            <div className="text-[11px] mt-0.5 mb-3 capitalize" style={{ color: TEXT_MUTED }}>{c.type}</div>
                            <div className="flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                              <button onClick={(e) => { e.stopPropagation(); setAutoAdd(true); setSelected(c); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg text-white" style={{ background: cfg.accent }}>
                                <Plus size={13} /> Record
                              </button>
                              <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>View entries →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <CategoryModal isOpen={catModal} onClose={() => { setCatModal(false); setEditingCat(null); setCatErr(null); }} onSubmit={submitCat} category={editingCat} typeLabel={cfg.noun} saving={creatingCat || updatingCat} error={catErr} />
          <ConfirmDelete isOpen={!!deletingCat} onClose={() => { setDeletingCat(null); setCatErr(null); }} onConfirm={confirmDeleteCat} busy={deletingCatBusy} title="Delete this category?" message="Only categories with no transactions can be deleted." error={catErr} />
        </>
      )}
    </>
  );

  if (embedded) return <div style={{ fontFamily: "'Montserrat', sans-serif" }}>{Body}</div>;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {Body}
    </div>
  );
}
