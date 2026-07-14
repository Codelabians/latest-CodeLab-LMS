import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ArrowUpCircle, ChevronLeft, ChevronRight, X, Pencil, Trash2, History, Save, Plus, RotateCcw } from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation } from "../../api/apiSlice";
import { useExpensePerms, ExpenseHistoryModal } from "../finance/expenseAudit";
import { showToast } from "../ui/common/ShowToast";

/* ---- design tokens (income = green, mirrors AllExpenses layout) ---- */
const BRAND = "#15803D";
const TINT = "#F0FDF4";
const TINT_BORDER = "#BBF7D0";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();

const ymd = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const presetRange = (preset) => {
  const now = new Date();
  const today = ymd(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") {
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setDate(now.getDate() - day);
    return { from: ymd(monday), to: today };
  }
  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: ymd(first), to: today };
  }
  return { from: "", to: "" };
};

const PRESETS = [
  { v: "today", l: "Today" },
  { v: "week", l: "This week" },
  { v: "month", l: "This month" },
  { v: "all", l: "All time" },
  { v: "custom", l: "Custom" },
];

const PAYMENT_METHODS = [
  { v: "cash", l: "Cash" },
  { v: "jazzcash", l: "JazzCash" },
  { v: "easypaisa", l: "Easypaisa" },
  { v: "bank_transfer", l: "Bank transfer" },
  { v: "cheque", l: "Cheque" },
  { v: "other", l: "Other" },
];

const field = "w-full py-2 px-3 text-sm rounded-lg outline-none";
const fieldStyle = { background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

/* Shared add/edit modal for an income row. In create mode it also offers an
   optional "Received into" account that posts the income to the ledger. */
function IncomeModal({ row, categories, accounts, saving, onClose, onSubmit }) {
  const isEdit = !!row;
  const [form, setForm] = useState({
    amount: row?.amount ?? "",
    transaction_date: row?.date ?? ymd(new Date()),
    description: row?.description ?? "",
    category_id: row?.categoryId ?? "",
    payment_method: row?.method ?? "",
    funded_by_account_uuid: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit income" : "Record income"}</h2>
          <button onClick={onClose} className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><X size={14} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Amount</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} className={field} style={fieldStyle} />
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Date</label>
            <input type="date" value={form.transaction_date} onChange={(e) => set("transaction_date", e.target.value)} className={field} style={fieldStyle} />
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Category</label>
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={field} style={fieldStyle}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Method</label>
            <select value={form.payment_method || ""} onChange={(e) => set("payment_method", e.target.value)} className={field} style={fieldStyle}>
              <option value="">— None —</option>
              {PAYMENT_METHODS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Received into <span style={{ color: TEXT_MUTED }}>(optional — records in ledger)</span></label>
              <select value={form.funded_by_account_uuid} onChange={(e) => set("funded_by_account_uuid", e.target.value)} className={field} style={fieldStyle}>
                <option value="">— Do not post to ledger —</option>
                {accounts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{a.name} · {a.kind}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${field} resize-none`} style={fieldStyle} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold rounded-lg" style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY }}>Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            <Save size={14} /> {saving ? "Saving…" : (isEdit ? "Save changes" : "Record income")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ busy, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 text-center bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-full place-items-center" style={{ background: TINT, color: BRAND }}><Trash2 size={22} /></div>
        <h2 className="text-[15px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Delete this income entry?</h2>
        <p className="text-[12.5px] mb-5" style={{ color: TEXT_MUTED }}>Delete moves it to the trash (restorable). Delete permanently removes it for good. Either way the ledger is adjusted.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => onConfirm(false)} disabled={busy} className="w-full py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{busy ? "Working…" : "Delete (move to trash)"}</button>
          <button onClick={() => onConfirm(true)} disabled={busy} className="w-full py-2.5 text-[13px] font-semibold rounded-lg disabled:opacity-50" style={{ border: "1px solid #FCA5A5", color: "#B91C1C", background: "#FEF2F2" }}>Delete permanently</button>
          <button onClick={onClose} className="w-full py-2.5 text-[13px] font-semibold rounded-lg" style={{ background: SURFACE_HOVER, color: TEXT_PRIMARY }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AllIncome() {
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState(presetRange("month").from);
  const [to, setTo] = useState(presetRange("month").to);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { canEdit, canDelete } = useExpensePerms();
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [historyRow, setHistoryRow] = useState(null);
  const [createTx, { isLoading: creating }] = usePostMutation();
  const [updateTx, { isLoading: updating }] = usePatchMutation();
  const [deleteTx, { isLoading: deleting }] = useDeleteMutation();
  const [restoreTx] = usePostMutation();
  const [showDeleted, setShowDeleted] = useState(false);

  const choosePreset = (p) => {
    setPreset(p);
    if (p !== "custom") { const r = presetRange(p); setFrom(r.from); setTo(r.to); }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [from, to, categoryId, debounced, showDeleted]);

  const { data: catData } = useGetQuery({ path: "finance/categories/income" });
  const categories = catData?.data || [];
  const catName = useMemo(() => {
    const m = {};
    categories.forEach((c) => { m[String(c.id)] = c.name; });
    return m;
  }, [categories]);

  // Money accounts for the "Received into" ledger picker.
  const { data: acctData } = useGetQuery({ path: "finance/ledger/accounts" });
  const accounts = useMemo(() => (acctData?.data || []).filter((a) => a.is_money), [acctData]);

  const baseParams = useMemo(() => ({
    category_type: "income",
    ...(categoryId && { category_id: categoryId }),
    ...(from && { from }),
    ...(to && { to }),
    ...(debounced && { q: debounced }),
  }), [categoryId, from, to, debounced]);

  const listPath = showDeleted ? "finance/deleted" : "finance";
  const listParams = showDeleted
    ? { category_type: "income", page, per_page: perPage }
    : { ...baseParams, page, per_page: perPage };
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    path: listPath,
    params: listParams,
  }, { refetchOnMountOrArgChange: true });

  const { data: totalsData } = useGetQuery({
    path: "finance",
    params: { ...baseParams, page: 1, per_page: 1000 },
  }, { refetchOnMountOrArgChange: true });

  useEffect(() => { refetch(); }, [page, perPage, baseParams, refetch]);

  const rows = (data?.data?.data || []).map((r) => ({
    uuid: r.finance_uuid,
    amount: Number(r.amount || 0),
    date: r.transaction_date,
    description: r.description,
    categoryId: r.category_id,
    method: r.payment_method,
    source: r.source_type,
  }));
  const meta = data?.meta?.pagination || {};
  const currentPage = meta.current_page || page;
  const lastPage = meta.total_pages || meta.last_page || 1;
  const totalCount = meta.total ?? rows.length;

  const totalRows = totalsData?.data?.data || [];
  const periodTotal = totalRows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const periodCount = totalRows.length;

  const clearFilters = () => { setSearch(""); setCategoryId(""); choosePreset("all"); };
  const hasFilters = categoryId || debounced || preset !== "all";

  const onAddSave = async (form) => {
    if (!form.amount || !form.category_id || !form.transaction_date) {
      showToast("Amount, date and category are required.", "error");
      return;
    }
    const body = {
      amount: form.amount,
      transaction_date: form.transaction_date,
      category_id: form.category_id,
      description: form.description || "",
      payment_method: form.payment_method || null,
      ...(form.funded_by_account_uuid && { funded_by_account_uuid: form.funded_by_account_uuid }),
    };
    try {
      await createTx({ path: "finance/create", body }).unwrap();
      setAddOpen(false);
      refetch();
      showToast("Income recorded.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Failed to record income.", "error");
    }
  };

  const onEditSave = async (form) => {
    const body = {};
    if (form.amount !== "" && form.amount !== null) body.amount = form.amount;
    if (form.transaction_date) body.transaction_date = form.transaction_date;
    if (form.category_id) body.category_id = form.category_id;
    body.description = form.description ?? "";
    body.payment_method = form.payment_method || null;
    try {
      await updateTx({ path: `finance/update/${editRow.uuid}`, body }).unwrap();
      setEditRow(null);
      refetch();
      showToast("Income updated.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Failed to update income.", "error");
    }
  };

  const onDeleteConfirm = async (permanent = false) => {
    try {
      await deleteTx({ path: `finance/delete/${deleteRow.uuid}${permanent ? "?permanent=1" : ""}`, body: {} }).unwrap();
      setDeleteRow(null);
      refetch();
      showToast(permanent ? "Income permanently deleted." : "Income moved to trash.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Failed to delete income.", "error");
    }
  };

  const onRestore = async (row) => {
    try {
      await restoreTx({ path: `finance/restore/${row.uuid}`, body: {} }).unwrap();
      refetch();
      showToast("Income restored.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Failed to restore income.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: TINT, color: BRAND }}>
            <ArrowUpCircle size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>All Income</h1>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Every income entry in one table — filter by date, category, or search the description.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl text-right" style={{ background: TINT, border: `1px solid ${TINT_BORDER}` }}>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: BRAND }}>Total ({PRESETS.find((p) => p.v === preset)?.l || "All"})</div>
            <div className="text-[17px] font-bold" style={{ color: BRAND }}>{money(periodTotal)}</div>
            <div className="text-[10px]" style={{ color: TEXT_MUTED }}>{periodCount} entr{periodCount === 1 ? "y" : "ies"}</div>
          </div>
          <button onClick={() => setShowDeleted((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: showDeleted ? BRAND : TEXT_SECONDARY, background: showDeleted ? TINT : "#fff" }}>
            <Trash2 size={14} /> {showDeleted ? "Showing deleted" : "Deleted"}
          </button>
          {!showDeleted && (
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-white rounded-lg" style={{ background: BRAND }}>
              <Plus size={15} /> Record income
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {PRESETS.map((p) => (
            <button key={p.v} type="button" onClick={() => choosePreset(p.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: preset === p.v ? "#fff" : TEXT_SECONDARY, background: preset === p.v ? BRAND : "transparent" }}
            >{p.l}</button>
          ))}
        </div>

        {preset === "custom" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From"
              className="py-2 px-3 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
            <span className="text-[12px]" style={{ color: TEXT_MUTED }}>→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To"
              className="py-2 px-3 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </>
        )}

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="py-2 px-3 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="relative">
          <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description / amount"
            className="py-2 pl-9 pr-3 text-sm rounded-lg outline-none w-60" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND }}>
            <X size={13} /> Clear
          </button>
        )}
        {isFetching && <Loader2 size={15} className="animate-spin" style={{ color: TEXT_MUTED }} />}
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: SURFACE_HOVER }}>
              {["Date", "Category", "Description", "Method", "Amount"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide ${i === 4 ? "text-right" : "text-left"}`} style={{ color: TEXT_SECONDARY }}>{h}</th>
              ))}
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-right" style={{ color: TEXT_SECONDARY }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[90, 120, 260, 70, 80, 80].map((w, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 rounded" style={{ width: w, background: "#EEF2F6" }} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-14 text-center" style={{ color: TEXT_MUTED }}>
                <ArrowUpCircle size={26} className="mx-auto mb-2 opacity-40" />
                No income for this filter.
              </td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{r.date || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full" style={{ background: TINT, color: BRAND }}>
                      {catName[String(r.categoryId)] || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_PRIMARY, maxWidth: 420 }}>{r.description || <span style={{ color: TEXT_MUTED }}>—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize" style={{ color: TEXT_SECONDARY }}>{r.method || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: TEXT_PRIMARY }}>{money(r.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {showDeleted ? (
                        <button onClick={() => onRestore(r)} title="Restore" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: TINT, border: `1px solid ${TINT_BORDER}`, color: BRAND }}><RotateCcw size={12} /> Restore</button>
                      ) : (
                        <>
                          <button onClick={() => setHistoryRow(r)} title="Edit history" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><History size={13} /></button>
                          {canEdit && !r.source && (
                            <button onClick={() => setEditRow(r)} title="Edit" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /></button>
                          )}
                          {canDelete && !r.source && (
                            <button onClick={() => setDeleteRow(r)} title="Delete" className="grid rounded-md w-7 h-7 place-items-center" style={{ background: TINT, border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2 text-[12px]" style={{ color: TEXT_MUTED }}>
          <span>{totalCount} total</span>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
            className="py-1 px-2 rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Page {currentPage} / {lastPage}</span>
          <button type="button" disabled={currentPage >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {addOpen && (
        <IncomeModal
          row={null}
          categories={categories}
          accounts={accounts}
          saving={creating}
          onClose={() => setAddOpen(false)}
          onSubmit={onAddSave}
        />
      )}
      {editRow && (
        <IncomeModal
          row={editRow}
          categories={categories}
          accounts={accounts}
          saving={updating}
          onClose={() => setEditRow(null)}
          onSubmit={onEditSave}
        />
      )}
      {deleteRow && (
        <ConfirmDeleteModal busy={deleting} onClose={() => setDeleteRow(null)} onConfirm={onDeleteConfirm} />
      )}
      {historyRow && (
        <ExpenseHistoryModal uuid={historyRow.uuid} onClose={() => setHistoryRow(null)} />
      )}
    </div>
  );
}
