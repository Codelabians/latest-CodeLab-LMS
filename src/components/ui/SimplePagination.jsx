import { useMemo, useState } from "react";
import TablePagination from "./TablePagination";

/**
 * SimplePagination — thin wrapper around TablePagination.
 *
 * The full TablePagination expects a dozen pre-computed props
 * (pageNumbers[], handleClick, formattedItemsPerPageOptions, etc.).
 * Most HR pages just want to say "I'm on page X of N, render pagination."
 * This wrapper does the bookkeeping internally.
 *
 * Props:
 *   page             current page (1-indexed)
 *   total            total number of rows across all pages
 *   perPage          page size
 *   onPageChange(p)  called when user clicks a page button
 *   onPerPageChange(n) called when user changes the per-page selector
 *   perPageOptions   array of allowed page sizes (default [10, 25, 50, 100])
 *   showingText      override the "Showing X to Y of Z" string (rarely needed)
 *
 * Renders nothing when there's only one page AND no per-page changer
 * is wanted — i.e. `total <= perPage`. Set `alwaysShow` to force render.
 */
export default function SimplePagination({
  page,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  // Default page-size dropdown. 10 first — that's the page-load default
  // HR asked for (2026-05-25). The remaining sizes let power users widen
  // the view when they need to scan/export.
  perPageOptions = [10, 25, 50, 100],
  showingText,
  alwaysShow = false,
}) {
  // Compute total pages + the visible window of page numbers. We keep
  // the visible window small (max 7 numbers) so the bar doesn't grow
  // out of control on 30+ page lists — TablePagination just renders
  // whatever array we hand it.
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, perPage)));

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Sliding window of 5 numbers around current page, plus first/last.
    const start = Math.max(2, page - 2);
    const end   = Math.min(totalPages - 1, page + 2);
    const mid   = [];
    for (let i = start; i <= end; i++) mid.push(i);
    return [1, ...mid, totalPages].filter((n, i, arr) => arr.indexOf(n) === i);
  }, [page, totalPages]);

  // "Go to" input state.
  const [goNumber, setGoNumber] = useState("");

  // Hide pagination when there's nothing to paginate AND the caller
  // didn't ask for a forced render. The "always show" mode is useful on
  // empty states ("Showing 0 to 0 of 0") for explicitness.
  if (!alwaysShow && (total || 0) <= perPage) return null;

  const safeOnPageChange = (n) => {
    const next = Math.max(1, Math.min(totalPages, Number(n) || 1));
    if (next !== page) onPageChange?.(next);
  };

  const handlePerPageChange = (selected) => {
    const next = Number(selected?.value) || perPage;
    if (next !== perPage) {
      // Reset back to page 1 when the page size changes — staying on
      // page 5 of a 25/page list becomes meaningless on a 100/page list.
      onPageChange?.(1);
      onPerPageChange?.(next);
    }
  };

  const handleGo = () => {
    if (!goNumber) return;
    safeOnPageChange(goNumber);
    setGoNumber("");
  };

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(total, page * perPage);
  const text = showingText ?? `Showing ${from} to ${to} of ${total}`;

  // Match the option shape TablePagination expects.
  const formatted = perPageOptions.map((n) => ({ value: n, label: String(n) }));

  return (
    <TablePagination
      currentPage={page}
      pageNumbers={pageNumbers}
      handleClick={safeOnPageChange}
      itemsPerPage={perPage}
      paginationMeta={{ per_page: perPage, total }}
      isBackendPagination={true}
      formattedItemsPerPageOptions={formatted}
      handleChange={handlePerPageChange}
      number={goNumber}
      handlePageNumber={(e) => setGoNumber(e.target.value)}
      handlePage={handleGo}
      showingText={text}
    />
  );
}
