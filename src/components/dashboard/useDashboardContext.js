import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { selectCurrentUser } from "../../features/auth/authSlice";
import { rolesOf } from "./dashboardConstants";

/**
 * Phase 1.95 — Dashboard context hook.
 *
 * Centralizes the two pieces of UI state every widget cares about:
 *   - active role view   (which role's dashboard the user is looking at)
 *   - active brand filter (which brand to scope queries to; "all" = no filter)
 *
 * Both are persisted to localStorage so a tab refresh doesn't reset them.
 * Returns:
 *   {
 *     user,                 — the current Redux user
 *     userRoles,            — every role slug the user holds
 *     primaryRole,          — the user's primary role (or first)
 *     activeRole,           — the role whose widgets we're rendering
 *     setActiveRole,        — switcher
 *     brandId,              — current brand_id (number) or "all"
 *     setBrandId,
 *     brandIdParam,         — same value normalized for API params:
 *                             number for numeric, undefined for "all"
 *   }
 */
const LS_ROLE  = "codelab.dashboard.activeRole";
const LS_BRAND = "codelab.dashboard.brandId";

export function useDashboardContext() {
  const user = useSelector(selectCurrentUser);

  // Roles available to this user. Fall back gracefully.
  const userRoles = useMemo(() => rolesOf(user), [user]);
  const primaryRole = user?.role || userRoles[0] || "employee";

  // Active role — read once from localStorage, clamp to a role the user
  // actually holds (so a stale value from a previous user doesn't poison
  // the view).
  const [activeRole, _setActiveRole] = useState(() => {
    if (typeof window === "undefined") return primaryRole;
    const stored = window.localStorage.getItem(LS_ROLE);
    if (stored && (userRoles.includes(stored) || stored === primaryRole)) {
      return stored;
    }
    return primaryRole;
  });

  // Re-clamp whenever the user changes (eg. login as someone else).
  useEffect(() => {
    if (!userRoles.length) return;
    if (!userRoles.includes(activeRole) && activeRole !== primaryRole) {
      _setActiveRole(primaryRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setActiveRole = useCallback((slug) => {
    _setActiveRole(slug);
    try {
      window.localStorage.setItem(LS_ROLE, slug);
    } catch { /* localStorage not writable — ignore */ }
  }, []);

  // Brand filter. Stored as the literal value ("all" | numeric string) so
  // round-tripping through localStorage doesn't accidentally cast types.
  const [brandId, _setBrandId] = useState(() => {
    if (typeof window === "undefined") return "all";
    return window.localStorage.getItem(LS_BRAND) || "all";
  });

  const setBrandId = useCallback((next) => {
    const val = next === null || next === undefined || next === "" ? "all" : String(next);
    _setBrandId(val);
    try {
      window.localStorage.setItem(LS_BRAND, val);
    } catch { /* ignore */ }
  }, []);

  // Convenience: the value to pass into the API params block. Undefined
  // means "don't include the brand_id key" (i.e. all brands).
  const brandIdParam = brandId === "all" ? undefined : brandId;

  return {
    user,
    userRoles,
    primaryRole,
    activeRole,
    setActiveRole,
    brandId,
    setBrandId,
    brandIdParam,
  };
}
