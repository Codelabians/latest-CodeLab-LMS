/**
 * Phase 1.95 — Dashboard shared constants.
 *
 * Brand tokens used everywhere across HR pages (see HANDOFF §3.1). Kept
 * in a JS module (not a .jsx component) so widgets can import them
 * without pulling React.
 */
export const BRAND_RED = "#C90606";
export const BRAND_RED_TINT = "#FEF2F2";
export const TEXT_PRIMARY = "#0F172A";
export const TEXT_SECONDARY = "#475569";
export const TEXT_MUTED = "#94A3B8";
export const BORDER = "#EEF2F6";
export const SURFACE = "#FFFFFF";
export const SURFACE_ALT = "#F8FAFC";

/**
 * Friendly label for every role slug we expect to see on a user. Anything
 * not in this map falls back to title-cased version of the slug.
 */
export const ROLE_LABELS = {
  admin: "Admin",
  ceo: "CEO",
  coo: "COO",
  cto: "CTO",
  hr_manager: "HR Manager",
  hr: "HR",
  finance_manager: "Finance Manager",
  finance: "Finance",
  teacher: "Teacher",
  sme: "Subject Matter Expert",
  student: "Student",
  receptionist: "Receptionist",
  clerk: "Clerk",
  sales_manager: "Sales Manager",
  cso: "CSO",
  employee: "Employee",
  developer: "Developer",
};

/**
 * Title-cased version of a snake_case role / status. Mirrors the helper
 * used across HR pages. Acronyms stay uppercase.
 */
const ACRONYMS = new Set([
  "ceo","coo","cto","cfo","cso","hr","it","qa","ui","ux","seo","api",
  "sme","vp","cnic","ntn","eobi","ssi","pf",
]);
export const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

/** Friendly display label for a role slug. */
export const labelForRole = (slug) => ROLE_LABELS[slug] || titleCase(slug);

/** FE-side permission check — see HANDOFF §3.4. */
export const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/** Pull a stable list of roles for the user from either `roles[]` or `role`. */
export const rolesOf = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length) return user.roles;
  if (user.role) return [user.role];
  return [];
};
