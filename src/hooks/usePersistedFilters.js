import { useCallback, useState } from "react";

/**
 * Page filters that survive navigation and reloads.
 *
 *   const { filters, setFilter, clearFilters, hasActiveFilters } =
 *     usePersistedFilters("batches", { search: "", courseUuid: "", ... });
 *
 * Values are stored in localStorage under `filters:<pageKey>` so coming back
 * to a page restores exactly the filters the user left it with. clearFilters
 * resets to defaults and wipes the stored copy.
 */
export default function usePersistedFilters(pageKey, defaults) {
  const storageKey = `filters:${pageKey}`;

  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only keep known keys so stale storage never injects junk state.
        return { ...defaults, ...Object.fromEntries(Object.entries(saved).filter(([k]) => k in defaults)) };
      }
    } catch { /* corrupted storage — fall through to defaults */ }
    return { ...defaults };
  });

  const persist = (next) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage full/blocked */ }
  };

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const clearFilters = useCallback(() => {
    setFilters({ ...defaults });
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const hasActiveFilters = Object.keys(defaults).some(
    (k) => String(filters[k] ?? "") !== String(defaults[k] ?? "")
  );

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
