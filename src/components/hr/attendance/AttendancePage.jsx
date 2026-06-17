import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  CalendarCheck,
  Upload,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Coffee,
  Trash2,
  MessageSquareWarning,
  CheckCheck,
  XCircle,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
  useSmartPostMutation,
} from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";
import { selectCurrentUser } from "../../../features/auth/authSlice";

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

const STATUS_COLORS = {
  present:    { fg: "#15803D", bg: "#F0FDF4", label: "Present" },
  absent:     { fg: "#B91C1C", bg: "#FEF2F2", label: "Absent" },
  late:       { fg: "#A16207", bg: "#FEFCE8", label: "Late" },
  early_out:  { fg: "#A16207", bg: "#FEFCE8", label: "Early out" },
  half_day:   { fg: "#EA580C", bg: "#FFF7ED", label: "Half day" },
  on_leave:   { fg: "#7C3AED", bg: "#F5F3FF", label: "Leave" },
  holiday:    { fg: "#0E7490", bg: "#ECFEFF", label: "Holiday" },
  wfh:        { fg: "#1D4ED8", bg: "#EFF6FF", label: "WFH" },
  at_stp:     { fg: "#BE185D", bg: "#FDF2F8", label: "STP" },
  mismatched: { fg: "#64748B", bg: "#F1F5F9", label: "Mismatched" },
};

/**
 * Phase 2 — HR > Attendance.
 *
 * Pick an employee + a month, see their attendance grid with status chips
 * and computed late/early-out minutes. Also exposes the HikConnect CSV
 * import button at the top.
 */
export default function AttendancePage() {
  const user = useSelector(selectCurrentUser);
  const [search, setSearch]               = useState("");
  const [selectedUuid, setSelectedUuid]   = useState(null);
  const [month, setMonth]                 = useState(new Date().toISOString().slice(0, 7));

  const { data: empResp, isLoading: empsLoading } = useGetQuery({
    path: "employee/profiles",
    // Only active employees — separated/terminated staff shouldn't appear here.
    params: { per_page: 100, status: "active", ...(search ? { search } : {}) },
  });
  const employees = empResp?.data || [];

  const canImport = hasPermission(user, "import hikconnect-csv");

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
      <header className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <CalendarCheck size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>Attendance</h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
              Per-employee daily attendance with computed late / early-out / half-day flags. CSV import from HikConnect supported.
            </p>
          </div>
        </div>
        {canImport && <HikConnectImportButton />}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Employee picker */}
        <SectionCard icon={Users} title="Pick employee">
          <input
            type="text"
            placeholder="Search by name or employee id…"
            className="w-full px-3 py-1.5 mb-3 text-xs border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {empsLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: TEXT_MUTED }} />
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

        {/* Monthly grid */}
        {selectedUuid ? (
          <AttendanceMonthly profileUuid={selectedUuid} month={month} onMonthChange={setMonth} />
        ) : (
          <SectionCard icon={CalendarCheck} title="No employee selected">
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              Pick an employee from the left panel to see their monthly attendance grid.
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function AttendanceMonthly({ profileUuid, month, onMonthChange }) {
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    path: `employee/profiles/${profileUuid}/attendance`,
    params: { month },
  });
  // Wrap rows in useMemo so downstream hooks have a stable reference.
  const rows = useMemo(() => data?.data || [], [data]);

  // Editor modal state — null = closed; { date, uuid?: } = open
  const [editing, setEditing] = useState(null);

  // Build a day-keyed map for fast lookup, plus generate every day of the month.
  const byDay = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.attendance_date] = r; });
    return m;
  }, [rows]);

  const days = useMemo(() => {
    const [yy, mm] = month.split("-").map((n) => parseInt(n, 10));
    const last = new Date(yy, mm, 0).getDate();
    const out = [];
    for (let d = 1; d <= last; d++) {
      const key = `${yy}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dt = new Date(yy, mm - 1, d);
      out.push({ key, day: d, weekday: dt.toLocaleDateString("en-US", { weekday: "short" }) });
    }
    return out;
  }, [month]);

  // KPIs
  const kpis = useMemo(() => {
    const acc = { present: 0, absent: 0, late: 0, half_day: 0, leaves: 0, late_minutes: 0, hours: 0 };
    rows.forEach((r) => {
      if (r.status === "present") acc.present++;
      else if (r.status === "absent") acc.absent++;
      else if (r.status === "late") acc.late++;
      else if (r.status === "half_day") acc.half_day++;
      else if (r.status === "on_leave") acc.leaves++;
      acc.late_minutes += r.late_minutes || 0;
      acc.hours += parseFloat(r.hours_worked || 0);
    });
    return acc;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        icon={CalendarCheck}
        title="Monthly attendance"
        subtitle={`Status, in/out times, computed late/early-out minutes — click any row to edit, add breaks, or file a regularization. ${month}`}
        action={
          <div className="flex items-center gap-2">
            <input type="month" value={month} onChange={(e) => onMonthChange(e.target.value)}
              className="px-2 py-1 text-xs border rounded-md" style={{ borderColor: BORDER, color: TEXT_PRIMARY }} />
            <button
              type="button"
              onClick={() => setEditing({ date: new Date().toISOString().slice(0, 10) })}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-full"
              style={{ background: BRAND_RED }}
            >
              <Plus size={12} /> Add row
            </button>
            {isFetching && <Loader2 size={12} className="animate-spin" style={{ color: TEXT_MUTED }} />}
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Kpi label="Present" value={kpis.present} tone="green" />
          <Kpi label="Late" value={kpis.late} tone="amber" />
          <Kpi label="Half-day" value={kpis.half_day} tone="amber" />
          <Kpi label="Absent" value={kpis.absent} tone="red" />
          <Kpi label="Leaves" value={kpis.leaves} />
          <Kpi label="Late mins" value={kpis.late_minutes} />
          <Kpi label="Hours worked" value={kpis.hours.toFixed(1)} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6"><Loader2 size={16} className="animate-spin" style={{ color: TEXT_MUTED }} /></div>
        ) : (
          <div className="mt-4 overflow-hidden border rounded-lg" style={{ borderColor: BORDER }}>
            <table className="w-full text-xs">
              <thead style={{ background: SURFACE_ALT }}>
                <tr>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Date</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Day</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Status</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>In</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Out</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Late (min)</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Early-out (min)</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Hours</th>
                  <th className="px-2 py-1.5 text-left" style={{ color: TEXT_MUTED }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const r = byDay[d.key];
                  return (
                    <tr key={d.key} className="border-t cursor-pointer hover:bg-slate-50"
                        style={{ borderColor: BORDER }}
                        onClick={() => setEditing({ date: d.key, uuid: r?.uuid })}
                    >
                      <td className="px-2 py-1.5" style={{ color: TEXT_PRIMARY }}>{d.day}</td>
                      <td className="px-2 py-1.5" style={{ color: TEXT_MUTED }}>{d.weekday}</td>
                      <td className="px-2 py-1.5">{r ? <StatusChip status={r.status} /> : <span style={{ color: TEXT_MUTED }}>—</span>}</td>
                      <td className="px-2 py-1.5" style={{ color: TEXT_PRIMARY }}>{r?.in_time?.slice(11, 16) || "—"}</td>
                      <td className="px-2 py-1.5" style={{ color: TEXT_PRIMARY }}>{r?.out_time?.slice(11, 16) || "—"}</td>
                      <td className="px-2 py-1.5" style={{ color: r?.late_minutes > 0 ? "#B91C1C" : TEXT_PRIMARY }}>{r?.late_minutes ?? "—"}</td>
                      <td className="px-2 py-1.5" style={{ color: r?.early_out_minutes > 0 ? "#A16207" : TEXT_PRIMARY }}>{r?.early_out_minutes ?? "—"}</td>
                      <td className="px-2 py-1.5" style={{ color: TEXT_PRIMARY }}>
                        {r?.hours_worked ?? "—"}
                        {r?.breaks?.length > 0 && (
                          <span className="ml-1 text-[10px]" style={{ color: TEXT_MUTED }}>
                            ({r.breaks.length} break{r.breaks.length > 1 ? "s" : ""})
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5" style={{ color: TEXT_MUTED }}>{r?.source || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {editing && (
        <AttendanceRowEditor
          profileUuid={profileUuid}
          date={editing.date}
          uuid={editing.uuid}
          onClose={() => setEditing(null)}
          onChange={refetch}
        />
      )}
    </div>
  );
}

/* ─────────── Attendance row editor modal ────────────────────── */
/**
 * Combined editor for one attendance row:
 *   - Section A: edit times + status + note (POST if new, PATCH if existing)
 *   - Section B: breaks list with add + delete
 *   - Section C: regularization request form + history of past requests
 *
 * Why one modal: HR usually wants to do all three actions together
 * (e.g. "their out-time is wrong, also they took an unrecorded break,
 * and I'm filing the regularization for the audit trail"). Tabs would
 * just hide context.
 */
function AttendanceRowEditor({ profileUuid, date, uuid, onClose, onChange }) {
  const isNew = !uuid;

  // Load row (when editing) — also gives us breaks since the API includes them.
  const { data: rowResp, refetch: refetchRow } = useGetQuery(
    uuid
      ? { path: `employee/profiles/${profileUuid}/attendance`, params: { month: date.slice(0, 7) } }
      : { path: "" },
    { skip: !uuid }
  );
  const row = useMemo(() => {
    if (!uuid) return null;
    return (rowResp?.data || []).find((r) => r.uuid === uuid) || null;
  }, [uuid, rowResp]);

  // Form fields seeded once on open + re-synced if the row loads later.
  const [inTime, setInTime]   = useState("");
  const [outTime, setOutTime] = useState("");
  const [status, setStatus]   = useState("present");
  const [note, setNote]       = useState("");

  useEffect(() => {
    if (row) {
      setInTime(row.in_time ? row.in_time.slice(0, 16).replace(" ", "T") : "");
      setOutTime(row.out_time ? row.out_time.slice(0, 16).replace(" ", "T") : "");
      setStatus(row.status || "present");
      setNote(row.note || "");
    } else if (isNew) {
      // Sensible defaults for a fresh row.
      setInTime(`${date}T09:00`);
      setOutTime(`${date}T18:00`);
      setStatus("present");
      setNote("");
    }
  }, [row, isNew, date, uuid]);

  const [postMut, postState]   = usePostMutation();
  const [patchMut, patchState] = usePatchMutation();
  const saving = postState.isLoading || patchState.isLoading;

  const save = async () => {
    const body = {
      attendance_date: date,
      in_time:  inTime  ? inTime.replace("T", " ") + ":00"  : null,
      out_time: outTime ? outTime.replace("T", " ") + ":00" : null,
      status,
      note: note || null,
    };
    try {
      if (isNew) {
        await postMut({ path: `employee/profiles/${profileUuid}/attendance`, body }).unwrap();
      } else {
        await patchMut({ path: `employee/attendance/${uuid}`, body }).unwrap();
      }
      showToast("Attendance saved.", "success");
      onChange?.();
      refetchRow();
    } catch (e) {
      showToast(e?.data?.message || "Failed to save attendance.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: BORDER }}>
        <header className="flex items-center justify-between px-5 py-3 border-b sticky top-0 z-10"
                style={{ borderColor: BORDER, background: SURFACE_ALT }}>
          <div className="flex items-center gap-2">
            <CalendarCheck size={14} style={{ color: BRAND_RED }} />
            <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? `New attendance for ${date}` : `Attendance · ${date}`}
            </h3>
            {row && <StatusChip status={row.status} />}
          </div>
          <button onClick={onClose} type="button"><X size={16} style={{ color: TEXT_MUTED }} /></button>
        </header>

        {/* Section A — basics */}
        <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: TEXT_MUTED }}>
            Times &amp; status
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="In time">
              <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                value={inTime} onChange={(e) => setInTime(e.target.value)} />
            </Field>
            <Field label="Out time">
              <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                value={outTime} onChange={(e) => setOutTime(e.target.value)} />
            </Field>
            <Field label="Status">
              <select className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
                value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(STATUS_COLORS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Note">
              <input type="text" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
          {row && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]" style={{ color: TEXT_MUTED }}>
              <span>Late: <b style={{ color: row.late_minutes > 0 ? "#B91C1C" : TEXT_PRIMARY }}>{row.late_minutes} min</b></span>
              <span>Early out: <b style={{ color: row.early_out_minutes > 0 ? "#A16207" : TEXT_PRIMARY }}>{row.early_out_minutes} min</b></span>
              <span>Hours: <b style={{ color: TEXT_PRIMARY }}>{row.hours_worked}</b></span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={onClose} type="button" className="px-3 py-1 text-xs rounded-md"
                    style={{ background: SURFACE_ALT, color: TEXT_SECONDARY }}>Cancel</button>
            <button onClick={save} type="button" disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md"
                    style={{ background: BRAND_RED, opacity: saving ? 0.6 : 1 }}>
              {saving && <Loader2 size={12} className="animate-spin" />}
              {isNew ? "Create row" : "Save row"}
            </button>
          </div>
        </div>

        {/* Section B + C only visible once the row exists (need its uuid). */}
        {row && (
          <>
            <BreaksSection attendanceUuid={uuid} breaks={row.breaks || []} onChange={() => { onChange?.(); refetchRow(); }} />
            <RegularizationSection attendanceUuid={uuid} onChange={() => { onChange?.(); refetchRow(); }} />
          </>
        )}
      </div>
    </div>
  );
}

function BreaksSection({ attendanceUuid, breaks, onChange }) {
  const [breakOut, setBreakOut] = useState("");
  const [breakIn, setBreakIn]   = useState("");
  const [breakNote, setBreakNote] = useState("");

  const [postMut, postState]   = usePostMutation();
  const [delMut, delState]     = useDeleteMutation();

  const addBreak = async () => {
    if (!breakOut) {
      showToast("Break out-time is required.", "error");
      return;
    }
    try {
      await postMut({
        path: `employee/attendance/${attendanceUuid}/breaks`,
        body: {
          break_out: breakOut.replace("T", " ") + ":00",
          break_in:  breakIn ? breakIn.replace("T", " ") + ":00" : null,
          note: breakNote || null,
        },
      }).unwrap();
      setBreakOut(""); setBreakIn(""); setBreakNote("");
      showToast("Break added.", "success");
      onChange();
    } catch (e) {
      showToast(e?.data?.message || "Failed to add break.", "error");
    }
  };

  const deleteBreak = async (id) => {
    if (!window.confirm("Delete this break?")) return;
    try {
      await delMut({ path: `employee/breaks/${id}` }).unwrap();
      showToast("Break deleted.", "success");
      onChange();
    } catch (e) {
      showToast(e?.data?.message || "Failed to delete.", "error");
    }
  };

  const totalMinutes = (breaks || []).reduce((a, b) => a + (b.minutes || 0), 0);

  return (
    <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
          <Coffee size={11} /> Breaks
          {breaks.length > 0 && (
            <span style={{ color: TEXT_PRIMARY }}>
              · {breaks.length} · {totalMinutes} min total
            </span>
          )}
        </h4>
      </div>
      {breaks.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-3">
          {breaks.map((b) => (
            <li key={b.id} className="flex items-center justify-between px-2 py-1 text-xs rounded-md border"
                style={{ borderColor: b.over_limit ? "#FECACA" : BORDER, background: b.over_limit ? "#FEF2F2" : SURFACE_ALT }}>
              <span style={{ color: TEXT_PRIMARY }}>
                {b.break_out?.slice(11, 16) || "—"} → {b.break_in?.slice(11, 16) || "in-progress"}
                <span className="ml-2" style={{ color: TEXT_MUTED }}>{b.minutes} min</span>
                {b.over_limit && <span className="ml-2 text-[10px] font-semibold" style={{ color: "#B91C1C" }}>over limit</span>}
                {b.note && <span className="ml-2" style={{ color: TEXT_MUTED }}>· {b.note}</span>}
              </span>
              <button onClick={() => deleteBreak(b.id)} type="button" disabled={delState.isLoading}
                      style={{ color: "#B91C1C" }}>
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Field label="Break out">
          <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={breakOut} onChange={(e) => setBreakOut(e.target.value)} />
        </Field>
        <Field label="Break in (optional)">
          <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={breakIn} onChange={(e) => setBreakIn(e.target.value)} />
        </Field>
        <Field label="Note">
          <input type="text" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={breakNote} onChange={(e) => setBreakNote(e.target.value)} placeholder="Lunch, coffee, etc." />
        </Field>
        <div className="flex items-end">
          <button onClick={addBreak} type="button" disabled={postState.isLoading || !breakOut}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md"
                  style={{ background: BRAND_RED, opacity: postState.isLoading || !breakOut ? 0.6 : 1 }}>
            {postState.isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add break
          </button>
        </div>
      </div>
    </div>
  );
}

function RegularizationSection({ attendanceUuid, onChange }) {
  const { data: regResp, refetch } = useGetQuery({
    path: `employee/attendance/${attendanceUuid}/regularizations`,
  });
  const regs = regResp?.data || [];

  const [propIn, setPropIn]     = useState("");
  const [propOut, setPropOut]   = useState("");
  const [propStatus, setPropStatus] = useState("");
  const [reason, setReason]     = useState("");
  const [postMut, postState]    = usePostMutation();
  const [approveMut, approveState] = usePostMutation();
  const [rejectMut, rejectState]   = usePostMutation();

  const submit = async () => {
    if (!reason || reason.length < 5) {
      showToast("Provide a reason (5+ chars).", "error");
      return;
    }
    if (!propIn && !propOut && !propStatus) {
      showToast("Propose at least one of in-time, out-time, or status.", "error");
      return;
    }
    try {
      await postMut({
        path: `employee/attendance/${attendanceUuid}/regularizations`,
        body: {
          proposed_in_time:  propIn  ? propIn.replace("T", " ") + ":00" : null,
          proposed_out_time: propOut ? propOut.replace("T", " ") + ":00" : null,
          proposed_status:   propStatus || null,
          reason,
        },
      }).unwrap();
      setPropIn(""); setPropOut(""); setPropStatus(""); setReason("");
      showToast("Regularization request submitted.", "success");
      refetch(); onChange();
    } catch (e) {
      showToast(e?.data?.message || "Failed to submit.", "error");
    }
  };

  const decide = async (uuid, action) => {
    const reasonText = action === "reject"
      ? window.prompt("Reason for rejection?") : window.prompt("Optional note?") || "";
    if (action === "reject" && (!reasonText || reasonText.length < 1)) {
      showToast("Rejection reason required.", "error");
      return;
    }
    const mut = action === "approve" ? approveMut : rejectMut;
    try {
      await mut({
        path: `employee/regularizations/${uuid}/${action}`,
        body: { decision_reason: reasonText },
      }).unwrap();
      showToast(`Regularization ${action}d.`, "success");
      refetch(); onChange();
    } catch (e) {
      showToast(e?.data?.message || "Failed.", "error");
    }
  };

  return (
    <div className="px-5 py-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: TEXT_MUTED }}>
        <MessageSquareWarning size={11} /> Regularization requests
      </h4>

      {regs.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-4">
          {regs.map((r) => (
            <li key={r.uuid} className="px-2 py-1.5 text-xs border rounded-md"
                style={{ borderColor: BORDER, background: SURFACE_ALT }}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span style={{ color: TEXT_PRIMARY }}>
                    <RegStatusBadge status={r.status} />
                    <span className="ml-2">{r.reason}</span>
                  </span>
                  <span style={{ color: TEXT_MUTED }} className="text-[10px]">
                    {r.proposed_in_time && <>in→{r.proposed_in_time.slice(11, 16)} </>}
                    {r.proposed_out_time && <>out→{r.proposed_out_time.slice(11, 16)} </>}
                    {r.proposed_status && <>status→{r.proposed_status} </>}
                    · requested {r.requested_at}
                  </span>
                </div>
                {r.status === "pending" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => decide(r.uuid, "approve")} type="button"
                            disabled={approveState.isLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md"
                            style={{ background: "#F0FDF4", color: "#15803D" }}>
                      <CheckCheck size={11} /> Approve
                    </button>
                    <button onClick={() => decide(r.uuid, "reject")} type="button"
                            disabled={rejectState.isLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md"
                            style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                )}
              </div>
              {r.decision_reason && (
                <p className="mt-1 text-[10px]" style={{ color: TEXT_MUTED }}>Decision: {r.decision_reason}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <Field label="Proposed in">
          <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={propIn} onChange={(e) => setPropIn(e.target.value)} />
        </Field>
        <Field label="Proposed out">
          <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={propOut} onChange={(e) => setPropOut(e.target.value)} />
        </Field>
        <Field label="Proposed status">
          <select className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
            value={propStatus} onChange={(e) => setPropStatus(e.target.value)}>
            <option value="">(no change)</option>
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Reason (required)">
          <input type="text" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
            value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Forgot to punch out, device error, etc." />
        </Field>
      </div>
      <div className="flex justify-end mt-2">
        <button onClick={submit} type="button"
                disabled={postState.isLoading || !reason || (!propIn && !propOut && !propStatus)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md"
                style={{ background: BRAND_RED,
                         opacity: postState.isLoading || !reason || (!propIn && !propOut && !propStatus) ? 0.6 : 1 }}>
          {postState.isLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageSquareWarning size={12} />}
          File regularization
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      {children}
    </label>
  );
}

function RegStatusBadge({ status }) {
  const tones = {
    pending:   { fg: "#A16207", bg: "#FEFCE8" },
    approved:  { fg: "#15803D", bg: "#F0FDF4" },
    rejected:  { fg: "#B91C1C", bg: "#FEF2F2" },
    cancelled: { fg: "#64748B", bg: "#F1F5F9" },
  };
  const t = tones[status] || tones.pending;
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
          style={{ color: t.fg, background: t.bg }}>
      {status}
    </span>
  );
}

function HikConnectImportButton() {
  const fileRef = useRef(null);
  const [post, postState] = useSmartPostMutation();
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await post({ path: "employee/attendance/import-csv", body: form }).unwrap();
      setResult(res);
    } catch (e) {
      setResult({ error: e?.data?.message || "Import failed." });
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={postState.isLoading}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-full"
        style={{ background: BRAND_RED, opacity: postState.isLoading ? 0.6 : 1 }}
      >
        {postState.isLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        Import HikConnect CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {result && (
        <div className="px-3 py-2 text-[11px] border rounded-md" style={{
          borderColor: result.error ? "#FECACA" : "#BBF7D0",
          background: result.error ? "#FEF2F2" : "#F0FDF4",
          color: result.error ? "#B91C1C" : "#15803D",
        }}>
          {result.error
            ? <><AlertTriangle size={11} className="inline mr-1" />{result.error}</>
            : <>
                <CheckCircle2 size={11} className="inline mr-1" />
                Imported {result.data?.rows_imported ?? 0} rows · {result.data?.unmatched?.length ?? 0} unmatched
              </>
          }
        </div>
      )}
    </div>
  );
}

/* ─────────── shared ─────────── */
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

function Kpi({ label, value, tone = "default" }) {
  const tones = { default: TEXT_PRIMARY, green: "#15803D", amber: "#A16207", red: "#B91C1C" };
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg border" style={{ borderColor: BORDER }}>
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-xl font-semibold" style={{ color: tones[tone] }}>{value ?? "—"}</span>
    </div>
  );
}

function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.absent;
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
      style={{ color: c.fg, background: c.bg }}>
      {c.label}
    </span>
  );
}
