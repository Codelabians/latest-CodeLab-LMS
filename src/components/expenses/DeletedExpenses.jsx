import { useEffect, useState } from "react";
import { Search, Loader2, Trash2, ChevronLeft, ChevronRight, X, User } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

/* ---- design tokens (match Finance pages) ---- */
const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();

const fmtWhen = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString();
};

/**
 * Deleted-expenses audit log. Every expense deletion is recorded with the
 * actor, the full snapshot of the removed row, and when it happened. This is
 * the dedicated page the user asked for (deletions removed from the live
 * tables, but never lost here).
 */
export default function DeletedExpenses() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    {
      path: "finance/deleted-expenses",
      params: { page, per_page: perPage, ...(debounced && { q: debounced }) },
    },
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => { refetch(); }, [page, perPage, debounced, refetch]);

  const rows = data?.data?.data || [];
  const meta = data?.meta?.pagination || {};
  const currentPage = meta.current_page || page;
  const lastPage = meta.total_pages || meta.last_page || 1;
  const totalCount = meta.total ?? rows.length;

  return (
    <div className="p-4 sm:p-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}>
            <Trash2 size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Deleted Expenses</h1>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>An audit trail of every deleted expense — who deleted it, what it was, and when.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description / category / who deleted"
            className="py-2 pl-9 pr-3 text-sm rounded-lg outline-none w-80" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>
        {search && (
          <button type="button" onClick={() => setSearch("")} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND }}>
            <X size={13} /> Clear
          </button>
        )}
        {isFetching && <Loader2 size={15} className="animate-spin" style={{ color: TEXT_MUTED }} />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: SURFACE_HOVER }}>
              {["Deleted on", "Deleted by", "Category", "Description", "Expense date", "Amount"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`} style={{ color: TEXT_SECONDARY }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[140, 120, 110, 240, 90, 80].map((w, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 rounded" style={{ width: w, background: "#EEF2F6" }} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-14 text-center" style={{ color: TEXT_MUTED }}>
                <Trash2 size={26} className="mx-auto mb-2 opacity-40" />
                No deleted expenses recorded.
              </td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{fmtWhen(r.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                      <User size={12} style={{ color: TEXT_MUTED }} /> {r.actor_name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full" style={{ background: "#FEF2F2", color: BRAND }}>
                      {r.category_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_PRIMARY, maxWidth: 420 }}>{r.description || <span style={{ color: TEXT_MUTED }}>—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{r.transaction_date || "—"}</td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: TEXT_PRIMARY }}>{money(r.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  );
}
