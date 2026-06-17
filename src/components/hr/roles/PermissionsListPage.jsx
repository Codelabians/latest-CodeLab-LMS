import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Key,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";

/* ─────────────── brand tokens ───────────────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────── titleCase helper ───────────────────────────────────── */
const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set([
        "ceo", "coo", "cto", "cfo", "cso",
        "hr", "it", "qa", "ui", "ux", "seo", "api", "sme", "vp",
      ]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

/* ─────────────── one collapsible subject card ───────────────────────── */
const SubjectCard = ({ subject, perms, permissionToRoles }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: SURFACE }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ background: open ? SURFACE_ALT : SURFACE }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: TEXT_MUTED }}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <div
            className="flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 8, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Key size={14} strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>
              {titleCase(subject)}
            </div>
            <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
              {perms.length} permission{perms.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <span
          className="text-[10.5px] font-semibold px-2 py-0.5 rounded"
          style={{ background: SURFACE_ALT, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
        >
          {perms.length}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {perms.map((p) => {
              const roles = permissionToRoles.get(p.id) || [];
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-lg"
                  style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: BRAND_RED, color: "#fff" }}
                    >
                      {p.action}
                    </span>
                    <span className="text-[12px] font-medium truncate" style={{ color: TEXT_PRIMARY }}>
                      {p.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {roles.length === 0 ? (
                      <span className="text-[10.5px] italic" style={{ color: TEXT_MUTED }}>
                        Not assigned to any role.
                      </span>
                    ) : (
                      roles.slice(0, 6).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: SURFACE,
                            color: TEXT_SECONDARY,
                            border: `1px solid ${BORDER}`,
                          }}
                          title={r}
                        >
                          {titleCase(r)}
                        </span>
                      ))
                    )}
                    {roles.length > 6 && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
                      >
                        +{roles.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────── main page ──────────────────────────────────────────── */
const PermissionsListPage = () => {
  const user = useSelector(selectCurrentUser);
  const canView = hasPermission(user, "get permissions");

  const { data: permsResp, isLoading: permsLoading, isError: permsError } = useGetQuery(
    { path: "core/permissions" },
    { skip: !canView },
  );
  // Roles only for reverse lookup; failure of this call shouldn't blow the page.
  const { data: rolesResp } = useGetQuery({ path: "core/roles" }, { skip: !canView });

  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState(""); // "" = all

  const permissions = permsResp?.data || [];
  const roles = rolesResp?.data || [];

  // permissionId → [roleName, ...]
  const permissionToRoles = useMemo(() => {
    const map = new Map();
    roles.forEach((r) => {
      (r.permissions || []).forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, []);
        map.get(p.id).push(r.name);
      });
    });
    return map;
  }, [roles]);

  // Group permissions by subject (alphabetised; actions within each
  // subject sorted alphabetically too).
  const groups = useMemo(() => {
    const bySubject = new Map();
    permissions.forEach((p) => {
      const key = p.subject || "other";
      if (!bySubject.has(key)) bySubject.set(key, []);
      bySubject.get(key).push(p);
    });
    return [...bySubject.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subject, perms]) => ({
        subject,
        perms: [...perms].sort((a, b) => (a.action || "").localeCompare(b.action || "")),
      }));
  }, [permissions]);

  const subjects = useMemo(() => groups.map((g) => g.subject), [groups]);

  // Apply chip filter + free-text search.
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    let pool = groups;
    if (activeSubject) {
      pool = pool.filter((g) => g.subject === activeSubject);
    }
    if (!q) return pool;
    return pool
      .map((g) => {
        const subjectHit = g.subject.toLowerCase().includes(q);
        const perms = subjectHit
          ? g.perms
          : g.perms.filter((p) =>
              (p.action || "").toLowerCase().includes(q)
              || (p.name || "").toLowerCase().includes(q)
            );
        return { ...g, perms };
      })
      .filter((g) => g.perms.length > 0);
  }, [groups, search, activeSubject]);

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div
          className="rounded-2xl p-5 flex items-center gap-3"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
        >
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view the permissions catalog.</span>
        </div>
      </div>
    );
  }

  if (permsLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading permissions…
      </div>
    );
  }

  if (permsError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load permissions.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Key size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Permissions catalog
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {permissions.length} system permissions, grouped by subject. Assign these to roles.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, maxWidth: 480 }}
      >
        <Search size={15} style={{ color: TEXT_MUTED }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject, action, or name…"
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: TEXT_PRIMARY }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="p-0.5 rounded hover:bg-slate-100"
            style={{ color: TEXT_MUTED }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Subject chips */}
      <div className="mb-6 flex items-center flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubject("")}
          className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full border"
          style={{
            background: activeSubject === "" ? BRAND_RED : SURFACE,
            color: activeSubject === "" ? "#fff" : TEXT_SECONDARY,
            borderColor: activeSubject === "" ? BRAND_RED : BORDER,
          }}
        >
          All ({groups.length})
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSubject(s === activeSubject ? "" : s)}
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-full border"
            style={{
              background: activeSubject === s ? BRAND_RED_TINT : SURFACE,
              color: activeSubject === s ? BRAND_RED : TEXT_SECONDARY,
              borderColor: activeSubject === s ? BRAND_RED : BORDER,
            }}
          >
            {titleCase(s)}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredGroups.length === 0 ? (
        <div
          className="rounded-2xl py-16 px-6 text-center"
          style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}
        >
          <div
            className="mx-auto flex items-center justify-center mb-4"
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Key size={28} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>
            No matching permissions
          </h3>
          <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
            Try a different search term or pick a different subject.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((g) => (
            <SubjectCard
              key={g.subject}
              subject={g.subject}
              perms={g.perms}
              permissionToRoles={permissionToRoles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PermissionsListPage;
