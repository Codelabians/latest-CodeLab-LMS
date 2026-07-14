/**
 * Per-page "Remember filters" persistence.
 *
 * Each list page (Students, Employees, Inquiries, Visitors) gets its own key.
 * When the user ticks "Remember filters", the current filter values + the flag
 * are stored in localStorage; on the next visit they are restored. When the
 * box is unticked, the saved entry is removed so the page starts clean again.
 *
 * Usage:
 *   const remembered = loadRememberedFilters("inquiries") || {};
 *   const [rememberFilters, setRememberFilters] = useState(() => loadRememberFlag("inquiries"));
 *   const [status, setStatus] = useState(remembered.status ?? "");
 *   ...
 *   useEffect(() => {
 *     saveRememberedFilters("inquiries", rememberFilters, { status, ... });
 *   }, [rememberFilters, status, ...]);
 */

const keyFor = (page) => `cl:filters:${page}`;

export function loadRememberFlag(page) {
  try {
    const raw = localStorage.getItem(keyFor(page));
    return raw ? !!JSON.parse(raw).remember : false;
  } catch {
    return false;
  }
}

export function loadRememberedFilters(page) {
  try {
    const raw = localStorage.getItem(keyFor(page));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.remember ? parsed.values || {} : null;
  } catch {
    return null;
  }
}

export function saveRememberedFilters(page, remember, values) {
  try {
    if (remember) {
      localStorage.setItem(keyFor(page), JSON.stringify({ remember: true, values }));
    } else {
      localStorage.removeItem(keyFor(page));
    }
  } catch {
    /* storage disabled — silently skip */
  }
}
