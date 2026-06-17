import React, { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Save,
  Search,
  ChevronDown,
  X,
  Check,
  Bell,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { useGetQuery, usePatchMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";
import SimplePagination from "../ui/SimplePagination";

/**
 * Editable notification routing, card-based for readability. For each
 * event the admin sets its functional category + brand, chooses roles
 * and specific people via compact searchable dropdowns, decides whether
 * the affected person is notified, and toggles Push / Bell / Active.
 * Searchable by key, event and category.
 */
export default function NotificationSettingsPage() {
  const { data, isLoading, refetch } = useGetQuery(
    { path: "communication/notifications/routes" },
    { refetchOnMountOrArgChange: true },
  );
  const [patch] = usePatchMutation();

  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [fcFilter, setFcFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const events = data?.data?.events || [];
  const categories = data?.data?.categories || [];
  const functionalCategories = data?.data?.functional_categories || [];
  const roles = useMemo(
    () => Array.from(new Set(data?.data?.roles || [])),
    [data],
  );
  const users = data?.data?.users || [];

  const eventLabel = (v) => events.find((e) => e.value === v)?.label || v;
  const categoryLabel = (v) =>
    categories.find((c) => c.value === v)?.label || v || "Any";
  const fcLabel = (v) =>
    functionalCategories.find((c) => c.value === v)?.label || v || "—";

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r, label: r })),
    [roles],
  );
  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name || u.email,
        sub: u.role || u.email,
      })),
    [users],
  );

  useEffect(() => {
    if (data?.data?.routes) setRows(data.data.routes);
  }, [data]);

  const toggleInArray = (id, key, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const arr = r[key] || [];
        const has = arr.includes(value);
        return {
          ...r,
          [key]: has ? arr.filter((x) => x !== value) : [...arr, value],
        };
      }),
    );
  };

  const setField = (id, key, val) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));

  const save = async (row) => {
    setSavingId(row.id);
    try {
      const res = await patch({
        path: `communication/notifications/routes/${row.id}`,
        body: {
          roles: row.roles || [],
          user_ids: (row.user_ids || []).map(Number),
          category: row.category,
          functional_category: row.functional_category,
          notify_affected: !!row.notify_affected,
          push_enabled: !!row.push_enabled,
          bell_enabled: !!row.bell_enabled,
          is_active: !!row.is_active,
        },
      });
      if (res?.data?.status === 1 || res?.data?.success) {
        toast.success("Saved");
        refetch();
      } else {
        toast.error(res?.data?.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (fcFilter && r.functional_category !== fcFilter) return false;
      if (!q) return true;
      return (
        (r.event_type || "").toLowerCase().includes(q) ||
        eventLabel(r.event_type).toLowerCase().includes(q) ||
        fcLabel(r.functional_category).toLowerCase().includes(q) ||
        categoryLabel(r.category).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, fcFilter, events, functionalCategories, categories]);

  // Reset to first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [search, fcFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="w-11/12 mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#C90606] p-3 rounded-2xl shadow">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Notification Settings
            </h1>
            <p className="text-sm text-[#475569]">
              Choose who gets each notification and how it’s delivered.
            </p>
          </div>
        </div>

        {/* Sticky search + filter bar */}
        <div className="sticky top-0 z-30 bg-[#F8FAFC] py-2 -my-2 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:border-[#C90606] focus:ring-2 focus:ring-[#C90606]/10"
              />
            </div>
            <select
              value={fcFilter}
              onChange={(e) => setFcFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white"
            >
              <option value="">All categories</option>
              {functionalCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#94A3B8] whitespace-nowrap">
              {filtered.length} of {rows.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-[#94A3B8] py-16">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#94A3B8] py-16">
            No notifications match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
            {paged.map((r) => (
              <NotificationCard
                key={r.id}
                row={r}
                events={events}
                categories={categories}
                functionalCategories={functionalCategories}
                roleOptions={roleOptions}
                userOptions={userOptions}
                eventLabel={eventLabel}
                onField={setField}
                onToggleArray={toggleInArray}
                onSave={save}
                saving={savingId === r.id}
              />
            ))}
          </div>
        )}

        {/* Pagination — app-standard SimplePagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="mt-6">
            <SimplePagination
              page={currentPage}
              total={filtered.length}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  row: r,
  categories,
  functionalCategories,
  roleOptions,
  userOptions,
  eventLabel,
  onField,
  onToggleArray,
  onSave,
  saving,
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EEF2F6] shadow-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-semibold text-[#0F172A]">
            {eventLabel(r.event_type)}
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono">
            {r.event_type}
          </div>
        </div>
        <Toggle
          label="Active"
          checked={!!r.is_active}
          onChange={(v) => onField(r.id, "is_active", v)}
        />
      </div>

      {/* Category + Brand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Labeled label="Category">
          <select
            value={r.functional_category || ""}
            onChange={(e) =>
              onField(r.id, "functional_category", e.target.value)
            }
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white"
          >
            <option value="">—</option>
            {functionalCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Brand">
          <select
            value={r.category || ""}
            onChange={(e) => onField(r.id, "category", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white"
          >
            <option value="">Any</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      {/* Recipients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Labeled label="Roles">
          <MultiSelect
            placeholder="Add roles"
            options={roleOptions}
            selected={r.roles || []}
            onToggle={(v) => onToggleArray(r.id, "roles", v)}
          />
        </Labeled>
        <Labeled label="Specific people">
          <MultiSelect
            placeholder="Add people"
            options={userOptions}
            selected={r.user_ids || []}
            onToggle={(v) => onToggleArray(r.id, "user_ids", v)}
          />
        </Labeled>
      </div>

      {/* Footer: toggles + save */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle
            icon={UserCheck}
            label="Notify affected person"
            checked={!!r.notify_affected}
            onChange={(v) => onField(r.id, "notify_affected", v)}
          />
          <Toggle
            icon={Smartphone}
            label="Push"
            checked={!!r.push_enabled}
            onChange={(v) => onField(r.id, "push_enabled", v)}
          />
          <Toggle
            icon={Bell}
            label="Bell"
            checked={!!r.bell_enabled}
            onChange={(v) => onField(r.id, "bell_enabled", v)}
          />
        </div>
        <button
          onClick={() => onSave(r)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C90606] text-white font-semibold text-xs hover:bg-[#a80505] disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

/** Pretty toggle switch with optional icon. */
function Toggle({ label, icon: Icon, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 group"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          checked ? "bg-[#C90606]" : "bg-[#CBD5E1]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#475569]">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </span>
    </button>
  );
}

/**
 * Compact searchable multi-select. Shows selected items as removable
 * chips and opens a searchable checklist popover.
 */
function MultiSelect({ options, selected, onToggle, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const labelFor = (v) => options.find((o) => o.value === v)?.label || v;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? options.filter(
          (o) =>
            (o.label || "").toLowerCase().includes(s) ||
            (o.sub || "").toLowerCase().includes(s),
        )
      : options;
    return base.slice(0, 60);
  }, [options, q]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white hover:border-[#C90606] text-left"
      >
        <span className="text-[#475569]">
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
      </button>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-[#FEF2F2] text-[#C90606] text-[11px] font-medium border border-[#F3D0D0]"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => onToggle(v)}
                className="hover:bg-[#f6caca] rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full min-w-[220px] bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs mb-2 focus:outline-none focus:border-[#C90606]"
            />
            <div className="max-h-56 overflow-y-auto">
              {list.length === 0 ? (
                <div className="text-xs text-[#94A3B8] px-2 py-3 text-center">
                  Nothing found.
                </div>
              ) : (
                list.map((o) => {
                  const on = selected.includes(o.value);
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() => onToggle(o.value)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] text-left"
                    >
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded border ${
                          on
                            ? "bg-[#C90606] border-[#C90606]"
                            : "border-[#CBD5E1]"
                        }`}
                      >
                        {on && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs text-[#0F172A] truncate">
                          {o.label}
                        </span>
                        {o.sub && (
                          <span className="block text-[10px] text-[#94A3B8] truncate">
                            {o.sub}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
