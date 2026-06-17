import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Shield,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Search,
  Check,
  X,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_ROLES } from "../../routes/RouteConstants";

/* ─────────────── brand tokens ───────────────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
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

const inputStyle = {
  borderColor: BORDER,
  color: TEXT_PRIMARY,
  background: "white",
};

const Label = ({ children, required }) => (
  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
    {children} {required && <span style={{ color: BRAND_RED }}>*</span>}
  </label>
);

/* ─────────────── one subject group card ─────────────────────────────── */
const SubjectGroup = ({ subject, perms, selectedSet, onToggle, onToggleAll }) => {
  // Default expanded for first paint so users can see immediately what's
  // checked; the toggle still works for collapsing.
  const [open, setOpen] = useState(true);
  const selectedCount = perms.filter((p) => selectedSet.has(p.id)).length;
  const allChecked = selectedCount === perms.length && perms.length > 0;
  const someChecked = selectedCount > 0 && selectedCount < perms.length;

  return (
    <div className="border rounded-md" style={{ borderColor: BORDER, background: "white" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: TEXT_MUTED }}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>
            {titleCase(subject)}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{
              background: selectedCount > 0 ? BRAND_RED_TINT : SURFACE_ALT,
              color: selectedCount > 0 ? BRAND_RED : TEXT_MUTED,
              border: `1px solid ${BORDER}`,
            }}
          >
            {selectedCount}/{perms.length}
          </span>
        </div>
        <label
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium cursor-pointer"
          style={{ color: TEXT_SECONDARY }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allChecked}
            // indeterminate is not a real HTML attribute — set via ref hook on
            // an effect, but for simplicity we just show the partial state via
            // the count badge. The checkbox stays binary.
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={(e) => onToggleAll(subject, e.target.checked)}
            className="w-3.5 h-3.5 rounded"
            style={{ accentColor: BRAND_RED }}
          />
          Select all
        </label>
      </button>
      {open && (
        <div
          className="px-3 pb-3 grid gap-1.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 10,
          }}
        >
          {perms.map((p) => {
            const checked = selectedSet.has(p.id);
            return (
              <label
                key={p.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer"
                style={{
                  background: checked ? BRAND_RED_TINT : "transparent",
                  border: `1px solid ${checked ? BRAND_RED_TINT : "transparent"}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(p.id)}
                  className="mt-0.5 w-3.5 h-3.5 rounded"
                  style={{ accentColor: BRAND_RED }}
                />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>
                    {p.action}
                  </div>
                  <div className="text-[10.5px] truncate" style={{ color: TEXT_MUTED }}>
                    {p.name}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─────────────── main page ──────────────────────────────────────────── */
const RoleFormPage = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEdit = !!uuid;
  const user = useSelector(selectCurrentUser);

  const canCreate = hasPermission(user, "create roles");
  const canUpdate = hasPermission(user, "update roles");
  const canSubmit = isEdit ? canUpdate : canCreate;

  /* form state */
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [search, setSearch] = useState("");

  /* fetch permissions catalog (grouped by subject) */
  const { data: permsResp, isLoading: permsLoading } = useGetQuery({ path: "core/permissions" });
  const permissions = permsResp?.data || [];

  /* fetch role list for edit-mode prefill (no /core/role/{uuid} GET exists yet) */
  const { data: rolesResp, isLoading: rolesLoading } = useGetQuery(
    { path: "core/roles" },
    { skip: !isEdit },
  );
  const allRoles = rolesResp?.data || [];

  // Prefill from the list once both the URL uuid and the roles list arrive.
  useEffect(() => {
    if (!isEdit) return;
    if (!allRoles || allRoles.length === 0) return;
    const match = allRoles.find((r) => r.uuid === uuid);
    if (!match) return;
    setName(match.name || "");
    setSelectedPerms(new Set((match.permissions || []).map((p) => p.id)));
  }, [isEdit, uuid, allRoles]);

  /* group permissions by subject — memoised because the catalog is 327 rows. */
  const groups = useMemo(() => {
    const bySubject = new Map();
    permissions.forEach((p) => {
      const key = p.subject || "other";
      if (!bySubject.has(key)) bySubject.set(key, []);
      bySubject.get(key).push(p);
    });
    // Sort subjects alphabetically; within each subject sort by action.
    const sorted = [...bySubject.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subject, perms]) => ({
        subject,
        perms: [...perms].sort((a, b) => (a.action || "").localeCompare(b.action || "")),
      }));
    return sorted;
  }, [permissions]);

  /* filter groups by search (matches subject OR action OR perm name) */
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
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
  }, [groups, search]);

  const togglePerm = (id) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubjectAll = (subject, checked) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      const group = groups.find((g) => g.subject === subject);
      if (!group) return prev;
      group.perms.forEach((p) => {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPerms(new Set(permissions.map((p) => p.id)));
  };
  const clearAll = () => {
    setSelectedPerms(new Set());
  };

  const [createRole, { isLoading: creating }] = usePostMutation();
  const [patchRole, { isLoading: patching }] = usePatchMutation();
  const submitting = creating || patching;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      showToast("Role name is required.", "error");
      return;
    }

    const body = {
      name: name.trim(),
      permissions: Array.from(selectedPerms),
    };

    try {
      if (isEdit) {
        const res = await patchRole({ path: `core/role/${uuid}`, body }).unwrap();
        showToast(res?.message || "Role updated.", "success");
      } else {
        const res = await createRole({ path: "core/role/create", body }).unwrap();
        showToast(res?.message || "Role created.", "success");
      }
      navigate(HR_ROLES);
    } catch (err) {
      const msg = err?.data?.message
        || (err?.data?.errors ? Object.values(err.data.errors).flat().join(" · ") : "Save failed.");
      showToast(msg, "error");
    }
  };

  if (!canSubmit) {
    return (
      <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>
          You don&apos;t have permission to {isEdit ? "edit" : "create"} roles.
        </p>
      </div>
    );
  }

  const loading = permsLoading || (isEdit && rolesLoading);

  return (
    <div
      style={{
        padding: "28px 28px 120px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(HR_ROLES)}
            className="p-2 rounded-md hover:bg-slate-100"
            style={{ color: TEXT_SECONDARY }}
            aria-label="Back to roles"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
              {isEdit ? "Edit role" : "New role"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              {isEdit
                ? "Update the role name or its permission set."
                : "Pick a name and tick the permissions this role should hold."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identity section */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label required>Name (slug)</Label>
              <input
                type="text"
                value={name}
                onChange={(e) =>
                  // Lowercase + underscores only — matches the BE slug rules.
                  setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
                }
                placeholder="e.g. hr_manager"
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
                autoComplete="off"
              />
              <p className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Lowercase letters, digits, and underscores only.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Preview</Label>
              <div
                className="px-3 py-2 text-sm rounded-md border"
                style={{ borderColor: BORDER, background: SURFACE_ALT, color: TEXT_PRIMARY }}
              >
                {name ? titleCase(name) : <span style={{ color: TEXT_MUTED }}>How the name will render in lists.</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Permissions section */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Permissions</h2>
              <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                Pick which actions this role can perform.
                {permissions.length > 0 && (
                  <>
                    {" "}
                    <strong style={{ color: TEXT_SECONDARY }}>{selectedPerms.size}</strong>
                    {" / "}{permissions.length} selected.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search inside permissions */}
          <div
            className="mb-4 flex items-center gap-2 px-3 py-2 rounded-md"
            style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}` }}
          >
            <Search size={14} style={{ color: TEXT_MUTED }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by subject, action, or name…"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: TEXT_PRIMARY }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-0.5 rounded hover:bg-white"
                style={{ color: TEXT_MUTED }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-6" style={{ color: TEXT_MUTED }}>
              <Loader2 size={16} className="animate-spin" />
              Loading catalog…
            </div>
          ) : filteredGroups.length === 0 ? (
            <p className="text-[12.5px] italic px-2 py-4" style={{ color: TEXT_MUTED }}>
              No permissions match that search.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((g) => (
                <SubjectGroup
                  key={g.subject}
                  subject={g.subject}
                  perms={g.perms}
                  selectedSet={selectedPerms}
                  onToggle={togglePerm}
                  onToggleAll={toggleSubjectAll}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sticky footer with Cancel + Save */}
        <div
          className="fixed bottom-0 left-0 right-0 px-7 py-3 flex items-center justify-end gap-2"
          style={{ background: "white", borderTop: `1px solid ${BORDER}`, zIndex: 20 }}
        >
          <div className="flex-1 text-[11.5px]" style={{ color: TEXT_MUTED }}>
            <Check size={11} className="inline -mt-0.5 mr-1" />
            {selectedPerms.size} permission{selectedPerms.size === 1 ? "" : "s"} selected
          </div>
          <button
            type="button"
            onClick={() => navigate(HR_ROLES)}
            className="px-3 py-2 text-sm border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ background: BRAND_RED }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create role"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleFormPage;
