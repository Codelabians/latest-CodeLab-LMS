import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Calendar,
  CalendarDays,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SimplePagination from "../../ui/SimplePagination";

/* ─────────── brand tokens (mirror Phase 1 HR pages) ─────────── */
const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Phase 2 — HR > Schedules + Seasonal Overrides.
 *
 * Two tabs:
 *   1. Employee Schedules — pick an employee, see their date-ranged schedules,
 *      add/edit/delete. Phase 1's weekly_schedule JSON stays as the default;
 *      this page is for date-ranged overrides (e.g. term-time vs summer).
 *   2. Seasonal Overrides — global Ramzan-style time shifts.
 *
 * Both tabs follow Phase 1 HR styling: full-width container, SectionCard
 * pattern, brand-red accents.
 */
export default function SchedulesPage() {
  const user = useSelector(selectCurrentUser);
  const [tab, setTab] = useState("schedules"); // "schedules" | "overrides"

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <CalendarDays size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
              Schedules &amp; Seasonal Overrides
            </h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
              Manage date-ranged schedules per employee + Ramzan-style overrides applied across the company.
            </p>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-1 p-1 mb-4 bg-white border rounded-full w-fit" style={{ borderColor: BORDER }}>
        <TabPill active={tab === "schedules"} onClick={() => setTab("schedules")} icon={Calendar} label="Employee schedules" />
        <TabPill active={tab === "overrides"} onClick={() => setTab("overrides")} icon={Sparkles} label="Seasonal overrides" />
      </div>

      {tab === "schedules" ? <SchedulesTab user={user} /> : <OverridesTab user={user} />}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/* TAB 1 — Employee schedules                                */
/* ───────────────────────────────────────────────────────── */
function SchedulesTab({ user }) {
  const [search, setSearch] = useState("");
  const [selectedUuid, setSelectedUuid] = useState(null);

  const { data: empResp, isLoading: empsLoading } = useGetQuery({
    path: "employee/profiles",
    // Only active employees — separated/terminated staff shouldn't appear here.
    params: { per_page: 100, status: "active", ...(search ? { search } : {}) },
  });
  const employees = empResp?.data || [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      {/* Left column — employee picker */}
      <SectionCard icon={Calendar} title="Pick employee" subtitle="Selecting an employee loads their schedule history">
        <input
          type="text"
          placeholder="Search by name or employee id…"
          className="w-full px-3 py-1.5 mb-3 text-xs border rounded-md"
          style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {empsLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={14} className="animate-spin" style={{ color: TEXT_MUTED }} />
          </div>
        ) : employees.length === 0 ? (
          <p className="text-xs" style={{ color: TEXT_MUTED }}>No employees found.</p>
        ) : (
          <ul className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 480 }}>
            {employees.map((e) => (
              <li key={e.uuid}>
                <button
                  type="button"
                  onClick={() => setSelectedUuid(e.uuid)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-left rounded-md"
                  style={{
                    background: selectedUuid === e.uuid ? BRAND_RED_TINT : "transparent",
                    color: selectedUuid === e.uuid ? BRAND_RED : TEXT_PRIMARY,
                  }}
                >
                  <span className="text-xs truncate">{e.full_name}</span>
                  <span className="ml-2 text-[10px]" style={{ color: TEXT_MUTED }}>{e.employee_id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Right column — schedule editor */}
      <div className="flex flex-col gap-4">
        {selectedUuid ? (
          <EmployeeSchedulesEditor profileUuid={selectedUuid} canEdit={hasPermission(user, "update employee-schedules")} canCreate={hasPermission(user, "create employee-schedules")} canDelete={hasPermission(user, "delete employee-schedules")} />
        ) : (
          <SectionCard icon={Calendar} title="No employee selected" subtitle="Pick one on the left to see their schedules">
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              The Phase 1 weekly_schedule JSON applies by default. Use this page only to add
              date-ranged variants (e.g. term-time vs summer).
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function EmployeeSchedulesEditor({ profileUuid, canCreate, canEdit, canDelete }) {
  const { data, isLoading, refetch } = useGetQuery({
    path: `employee/profiles/${profileUuid}/schedules`,
  });
  const rows = data?.data || [];
  const [editing, setEditing] = useState(null); // null = none, "new" = create, or schedule uuid

  // Resolver preview date — defaults to today, can be changed by HR.
  const [previewDate, setPreviewDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: resolvedResp } = useGetQuery({
    path: `employee/profiles/${profileUuid}/schedule-resolved`,
    params: { date: previewDate },
  });
  const resolved = resolvedResp?.data;

  return (
    <>
      {/* Resolved schedule preview (any date) */}
      <SectionCard
        icon={Sparkles}
        title="Resolved schedule preview"
        subtitle="What the Rules Engine would compare against on a given date"
        action={
          <input
            type="date"
            value={previewDate}
            onChange={(e) => setPreviewDate(e.target.value)}
            className="px-2 py-1 text-xs border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
          />
        }
      >
        {resolved ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <MiniStat label="Source" value={resolved.source} />
            <MiniStat label="Working day" value={resolved.is_working_day ? "Yes" : "No"} />
            <MiniStat label="In time" value={resolved.in_time?.slice(11, 16) || "—"} />
            <MiniStat label="Out time" value={resolved.out_time?.slice(11, 16) || "—"} />
            <MiniStat label="Override" value={resolved.override_applied || "—"} />
          </div>
        ) : (
          <p className="text-xs" style={{ color: TEXT_MUTED }}>Loading…</p>
        )}
      </SectionCard>

      {/* Schedules list */}
      <SectionCard
        icon={Calendar}
        title="Date-ranged schedules"
        subtitle="Schedules that override the default JSON within their date range"
        action={
          canCreate && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-full"
              style={{ background: BRAND_RED }}
            >
              <Plus size={12} /> New schedule
            </button>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin" style={{ color: TEXT_MUTED }} /></div>
        ) : rows.length === 0 ? (
          <p className="text-xs" style={{ color: TEXT_MUTED }}>No date-ranged schedules. The Phase 1 JSON applies.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((s) => (
              <li
                key={s.uuid}
                className="flex flex-col gap-2 px-3 py-2 border rounded-lg"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{s.name}</span>
                    <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      {s.effective_from} → {s.effective_to || "open"}
                      {!s.is_active && <span style={{ color: "#B91C1C" }}> · inactive</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button type="button" onClick={() => setEditing(s.uuid)} className="text-xs" style={{ color: BRAND_RED }}>
                        <Edit3 size={12} className="inline mr-1" />Edit
                      </button>
                    )}
                    {canDelete && (
                      <DeleteButton uuid={s.uuid} onDone={refetch} />
                    )}
                  </div>
                </div>
                <ul className="grid grid-cols-7 gap-1 text-[10px]">
                  {DAY_NAMES.map((d, i) => {
                    const day = s.days?.find((dd) => dd.day_of_week === i + 1);
                    return (
                      <li
                        key={d}
                        className="flex flex-col items-center px-1 py-1 rounded"
                        style={{ background: day && day.is_working_day ? SURFACE_ALT : "transparent", color: day && day.is_working_day ? TEXT_PRIMARY : TEXT_MUTED }}
                      >
                        <span className="font-semibold">{d}</span>
                        {day && day.is_working_day ? (
                          <span>{day.in_time?.slice(0, 5) || "—"}–{day.out_time?.slice(0, 5) || "—"}</span>
                        ) : (
                          <span>off</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* New / edit modal */}
      {editing && (
        <ScheduleFormModal
          profileUuid={profileUuid}
          uuid={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </>
  );
}

function ScheduleFormModal({ profileUuid, uuid, onClose, onSaved }) {
  const isEdit = !!uuid;
  const { data: existing } = useGetQuery(
    uuid ? { path: `employee/schedules/${uuid}` } : { path: "" },
    { skip: !uuid }
  );
  const init = existing?.data;

  const [name, setName] = useState(init?.name || "");
  const [from, setFrom] = useState(init?.effective_from || new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(init?.effective_to || "");
  const [isActive, setIsActive] = useState(init?.is_active ?? true);
  const [days, setDays] = useState(() => {
    if (init?.days?.length) {
      return DAY_NAMES.map((_, i) => init.days.find((d) => d.day_of_week === i + 1) || defaultDay(i + 1));
    }
    return DAY_NAMES.map((_, i) => defaultDay(i + 1));
  });

  /**
   * Edit-mode hydration: the GET for `init` resolves AFTER mount, so the
   * useState initializers above run with undefined. Sync state when init
   * arrives. We key on init?.uuid (not the whole object) so React refetch
   * identity flips don't clobber the user's in-flight edits — exhaustive-deps
   * rule doesn't see through this, so we suppress it intentionally.
   */
  useEffect(() => {
    if (!isEdit || !init) return;
    setName(init.name || "");
    setFrom(init.effective_from || new Date().toISOString().slice(0, 10));
    setTo(init.effective_to || "");
    setIsActive(init.is_active ?? true);
    if (init.days?.length) {
      setDays(DAY_NAMES.map((_, i) => init.days.find((d) => d.day_of_week === i + 1) || defaultDay(i + 1)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, init?.uuid]);

  const [createMut, createState] = usePostMutation();
  const [patchMut, patchState]   = usePatchMutation();
  const saving = createState.isLoading || patchState.isLoading;

  const save = async () => {
    const body = {
      name,
      effective_from: from,
      effective_to: to || null,
      is_active: isActive,
      days: days.map((d) => ({
        day_of_week: d.day_of_week,
        is_working_day: d.is_working_day,
        in_time: d.is_working_day ? (d.in_time || null) : null,
        out_time: d.is_working_day ? (d.out_time || null) : null,
        late_grace_minutes: d.late_grace_minutes,
        half_day_after_minutes: d.half_day_after_minutes,
        expected_break_minutes: d.expected_break_minutes,
        max_break_minutes: d.max_break_minutes,
      })),
    };
    try {
      if (isEdit) {
        await patchMut({ path: `employee/schedules/${uuid}`, body }).unwrap();
      } else {
        await createMut({ path: `employee/profiles/${profileUuid}/schedules`, body }).unwrap();
      }
      showToast("Schedule saved.", "success");
      onSaved();
    } catch (e) {
      showToast(e?.data?.message || "Failed to save schedule.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl" style={{ borderColor: BORDER }}>
        <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: BORDER }}>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            {isEdit ? "Edit schedule" : "New schedule"}
          </h3>
          <button onClick={onClose} type="button"><X size={16} style={{ color: TEXT_MUTED }} /></button>
        </header>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Name">
              <input className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="Effective from">
              <input type="date" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
            <FormField label="Effective to (optional)">
              <input type="date" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>

          <div className="border rounded-lg" style={{ borderColor: BORDER }}>
            <table className="w-full text-[11px]">
              <thead style={{ background: SURFACE_ALT }}>
                <tr>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Day</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Work</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>In</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Out</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Grace</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Half-day</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Break exp</th>
                  <th className="px-2 py-1 text-left" style={{ color: TEXT_MUTED }}>Break max</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d, i) => (
                  <tr key={d.day_of_week} className="border-t" style={{ borderColor: BORDER }}>
                    <td className="px-2 py-1" style={{ color: TEXT_PRIMARY }}>{DAY_NAMES[i]}</td>
                    <td className="px-2 py-1">
                      <input type="checkbox" checked={d.is_working_day} onChange={(e) => updateDay(i, "is_working_day", e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="time" disabled={!d.is_working_day} className="px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.in_time || ""} onChange={(e) => updateDay(i, "in_time", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="time" disabled={!d.is_working_day} className="px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.out_time || ""} onChange={(e) => updateDay(i, "out_time", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" disabled={!d.is_working_day} className="w-14 px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.late_grace_minutes} onChange={(e) => updateDay(i, "late_grace_minutes", +e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" disabled={!d.is_working_day} className="w-14 px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.half_day_after_minutes} onChange={(e) => updateDay(i, "half_day_after_minutes", +e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" disabled={!d.is_working_day} className="w-14 px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.expected_break_minutes} onChange={(e) => updateDay(i, "expected_break_minutes", +e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="number" disabled={!d.is_working_day} className="w-14 px-1 py-0.5 border rounded" style={{ borderColor: BORDER }} value={d.max_break_minutes} onChange={(e) => updateDay(i, "max_break_minutes", +e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} type="button" className="px-3 py-1 text-xs rounded-md" style={{ background: SURFACE_ALT, color: TEXT_SECONDARY }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !name || !from} type="button"
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md"
            style={{ background: BRAND_RED, opacity: saving || !name || !from ? 0.6 : 1 }}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create schedule"}
          </button>
        </footer>
      </div>
    </div>
  );

  function updateDay(idx, key, value) {
    setDays((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }
}

function defaultDay(dow) {
  return {
    day_of_week: dow,
    is_working_day: dow !== 7,
    in_time: dow === 6 ? "10:00" : "09:00",
    out_time: dow === 6 ? "14:00" : "18:00",
    late_grace_minutes: 15,
    half_day_after_minutes: 120,
    expected_break_minutes: 60,
    max_break_minutes: 90,
  };
}

/* ───────────────────────────────────────────────────────── */
/* TAB 2 — Seasonal overrides                                */
/* ───────────────────────────────────────────────────────── */
function OverridesTab({ user }) {
  const { data, isLoading, refetch } = useGetQuery({ path: "employee/schedule-seasonal-overrides" });
  const rows = useMemo(() => data?.data || [], [data]);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const canCreate = hasPermission(user, "create schedule-seasonal-overrides");
  const canEdit   = hasPermission(user, "update schedule-seasonal-overrides");
  const canDelete = hasPermission(user, "delete schedule-seasonal-overrides");

  const pagedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);
  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
    if (page > lastPage) setPage(lastPage);
  }, [rows.length, perPage, page]);

  return (
    <>
      <SectionCard
        icon={Sparkles}
        title="Seasonal overrides"
        subtitle="Time shifts applied on top of every employee's resolved schedule for a date range (e.g. Ramzan)"
        action={
          canCreate && (
            <button onClick={() => setEditing("new")} type="button"
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-full" style={{ background: BRAND_RED }}>
              <Plus size={12} /> New override
            </button>
          )
        }
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" style={{ color: TEXT_MUTED }} />
        ) : rows.length === 0 ? (
          <p className="text-xs" style={{ color: TEXT_MUTED }}>No overrides defined.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pagedRows.map((o) => (
              <li key={o.uuid} className="flex items-center justify-between px-3 py-2 border rounded-lg" style={{ borderColor: BORDER }}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{o.name}</span>
                  <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                    {o.effective_from} → {o.effective_to} · {o.transformation_type}
                    {o.transformation_value?.minutes != null && ` ${o.transformation_value.minutes}min`}
                    {o.transformation_value?.in_time && ` ${o.transformation_value.in_time}-${o.transformation_value.out_time}`}
                    {" · "}{o.applies_to.replace(/_/g, " ")}
                    {!o.is_active && <span style={{ color: "#B91C1C" }}> · inactive</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button type="button" onClick={() => setEditing(o.uuid)} className="text-xs" style={{ color: BRAND_RED }}>
                      <Edit3 size={12} className="inline mr-1" />Edit
                    </button>
                  )}
                  {canDelete && <DeleteOverrideButton uuid={o.uuid} onDone={refetch} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {rows.length > 0 && (
        <SimplePagination
          page={page}
          total={rows.length}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}

      {editing && (
        <OverrideFormModal
          uuid={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </>
  );
}

function OverrideFormModal({ uuid, onClose, onSaved }) {
  const isEdit = !!uuid;
  const { data: existing } = useGetQuery(uuid ? { path: `employee/schedule-seasonal-overrides/${uuid}` } : { path: "" }, { skip: !uuid });
  const init = existing?.data;

  const [name, setName]               = useState(init?.name || "");
  const [from, setFrom]               = useState(init?.effective_from || "");
  const [to, setTo]                   = useState(init?.effective_to || "");
  const [type, setType]               = useState(init?.transformation_type || "shift_in");
  const [minutes, setMinutes]         = useState(init?.transformation_value?.minutes || 60);
  const [replaceIn, setReplaceIn]     = useState(init?.transformation_value?.in_time || "10:00");
  const [replaceOut, setReplaceOut]   = useState(init?.transformation_value?.out_time || "16:00");
  const [appliesTo, setAppliesTo]     = useState(init?.applies_to || "all_employees");
  const [isActive, setIsActive]       = useState(init?.is_active ?? true);

  // Edit-mode hydration — see ScheduleFormModal for why we key on uuid only.
  useEffect(() => {
    if (!isEdit || !init) return;
    setName(init.name || "");
    setFrom(init.effective_from || "");
    setTo(init.effective_to || "");
    setType(init.transformation_type || "shift_in");
    setMinutes(init.transformation_value?.minutes || 60);
    setReplaceIn(init.transformation_value?.in_time || "10:00");
    setReplaceOut(init.transformation_value?.out_time || "16:00");
    setAppliesTo(init.applies_to || "all_employees");
    setIsActive(init.is_active ?? true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, init?.uuid]);

  const [createMut, createState] = usePostMutation();
  const [patchMut, patchState]   = usePatchMutation();
  const saving = createState.isLoading || patchState.isLoading;

  const save = async () => {
    const transformation_value =
      type === "replace_times" ? { in_time: replaceIn, out_time: replaceOut }
                               : { minutes: Number(minutes) };
    const body = {
      name, effective_from: from, effective_to: to,
      transformation_type: type, transformation_value,
      applies_to: appliesTo, is_active: isActive,
    };
    try {
      if (isEdit) {
        await patchMut({ path: `employee/schedule-seasonal-overrides/${uuid}`, body }).unwrap();
      } else {
        await createMut({ path: "employee/schedule-seasonal-overrides", body }).unwrap();
      }
      showToast("Override saved.", "success");
      onSaved();
    } catch (e) {
      showToast(e?.data?.message || "Failed to save override.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50">
      <div className="relative w-full max-w-xl bg-white rounded-2xl" style={{ borderColor: BORDER }}>
        <header className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: BORDER }}>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit override" : "New override"}</h3>
          <button onClick={onClose} type="button"><X size={16} style={{ color: TEXT_MUTED }} /></button>
        </header>
        <div className="flex flex-col gap-3 px-5 py-4">
          <FormField label="Name (e.g. Ramzan 2026)">
            <input className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="From">
              <input type="date" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
            <FormField label="To">
              <input type="date" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={to} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Transformation">
            <select className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER, color: TEXT_PRIMARY }} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="shift_in">Shift in-time later</option>
              <option value="shift_out">Shift out-time earlier</option>
              <option value="reduce_hours">Reduce hours (half-half)</option>
              <option value="replace_times">Replace times wholesale</option>
            </select>
          </FormField>
          {type === "replace_times" ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="New in-time">
                <input type="time" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={replaceIn} onChange={(e) => setReplaceIn(e.target.value)} />
              </FormField>
              <FormField label="New out-time">
                <input type="time" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={replaceOut} onChange={(e) => setReplaceOut(e.target.value)} />
              </FormField>
            </div>
          ) : (
            <FormField label="Minutes">
              <input type="number" className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER }} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </FormField>
          )}
          <FormField label="Applies to">
            <select className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER, color: TEXT_PRIMARY }} value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)}>
              <option value="all_employees">All employees</option>
              <option value="role_based">Selected roles only (set in API)</option>
              <option value="specific_list">Selected employees only (set in API)</option>
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-xs" style={{ color: TEXT_SECONDARY }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: BORDER }}>
          <button onClick={onClose} type="button" className="px-3 py-1 text-xs rounded-md" style={{ background: SURFACE_ALT, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={save} disabled={saving || !name || !from || !to} type="button"
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md"
            style={{ background: BRAND_RED, opacity: saving || !name || !from || !to ? 0.6 : 1 }}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create override"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/* Shared bits                                               */
/* ───────────────────────────────────────────────────────── */
function SectionCard({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden bg-white border shadow-sm rounded-2xl" style={{ borderColor: BORDER }}>
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Icon size={14} />
            </span>
          )}
          <div className="flex flex-col">
            <h2 className="text-[13px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>{title}</h2>
            {subtitle && <span className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{subtitle}</span>}
          </div>
        </div>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function TabPill({ active, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
      style={{ color: active ? "#FFFFFF" : TEXT_SECONDARY, background: active ? BRAND_RED : "transparent" }}>
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-1 border rounded-md" style={{ borderColor: BORDER }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-sm" style={{ color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}

function DeleteButton({ uuid, onDone }) {
  const [del, state] = useDeleteMutation();
  const click = async () => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await del({ path: `employee/schedules/${uuid}` }).unwrap();
      showToast("Schedule deleted.", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Failed to delete.", "error");
    }
  };
  return (
    <button onClick={click} type="button" className="text-xs" style={{ color: "#B91C1C" }} disabled={state.isLoading}>
      {state.isLoading ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Trash2 size={12} className="inline mr-1" />}
      Delete
    </button>
  );
}

function DeleteOverrideButton({ uuid, onDone }) {
  const [del, state] = useDeleteMutation();
  const click = async () => {
    if (!window.confirm("Delete this override?")) return;
    try {
      await del({ path: `employee/schedule-seasonal-overrides/${uuid}` }).unwrap();
      showToast("Override deleted.", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Failed to delete.", "error");
    }
  };
  return (
    <button onClick={click} type="button" className="text-xs" style={{ color: "#B91C1C" }} disabled={state.isLoading}>
      {state.isLoading ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Trash2 size={12} className="inline mr-1" />}
      Delete
    </button>
  );
}
