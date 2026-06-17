import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck, Search, Loader2, Save, Users, Clock,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";

/* ---- tokens (match the admin) ---- */
const BRAND = "#C90606";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

/* Statuses HR sets directly. late / half_day / early_out are auto-derived by
   the rules engine from the in/out times, so we don't ask HR to pick them —
   but we keep them selectable when a row already carries one. */
const STATUS = {
  present:  { label: "Present",  bg: "#F0FDF4", color: GREEN },
  absent:   { label: "Absent",   bg: "#FEF2F2", color: BRAND },
  on_leave: { label: "On leave", bg: "#EFF6FF", color: "#1D4ED8" },
  wfh:      { label: "WFH",      bg: "#F5F3FF", color: "#6D28D9" },
  at_stp:   { label: "At STP",   bg: "#FFF7ED", color: AMBER },
  holiday:  { label: "Holiday",  bg: "#F1F5F9", color: TEXT_MUTED },
  late:     { label: "Late",     bg: "#FEF9C3", color: AMBER },
  half_day: { label: "Half day", bg: "#FEF9C3", color: AMBER },
  early_out:{ label: "Early out",bg: "#FEF9C3", color: AMBER },
  mismatched:{label: "Mismatch", bg: "#FEF2F2", color: BRAND },
};
const HR_CHOICES = ["present", "absent", "on_leave", "wfh", "at_stp", "holiday"];
// When HR picks one of these, the in/out times are meaningless → cleared.
const NO_TIME_STATUSES = ["absent", "on_leave", "holiday"];

const today = () => new Date().toISOString().slice(0, 10);
const toTimeInput = (dt) => (dt ? dt.slice(11, 16) : "");           // "YYYY-MM-DD HH:MM:SS" → "HH:MM"
const toDateTime = (date, hhmm) => (hhmm ? `${date} ${hhmm}:00` : null);

export default function MarkAttendancePage() {
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);

  const { data, isFetching, refetch } = useGetQuery(
    { path: `employee/attendance/daily?date=${date}` },
    { refetchOnMountOrArgChange: true }
  );
  const [post, { isLoading: saving }] = usePostMutation();

  // Seed editable local rows whenever the roster loads / date changes.
  useEffect(() => {
    if (!data?.data) return;
    setRows(
      data.data.map((r) => ({
        ...r,
        _in: toTimeInput(r.in_time),
        _out: toTimeInput(r.out_time),
        _status: r.status,
        _shifts: (r.is_multi_shift ? r.shifts || [] : []).map((s) => ({
          ...s,
          _in: toTimeInput(s.in),
          _out: toTimeInput(s.out),
          _attended: s.attended !== false,
        })),
      }))
    );
  }, [data]);

  const setRow = (uuid, patch) =>
    setRows((rs) => rs.map((r) => (r.employee_profile_uuid === uuid ? { ...r, ...patch } : r)));

  const setShift = (uuid, idx, patch) =>
    setRows((rs) =>
      rs.map((r) =>
        r.employee_profile_uuid === uuid
          ? { ...r, _shifts: r._shifts.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }
          : r
      )
    );

  const onStatus = (uuid, status) => {
    const patch = { _status: status };
    if (NO_TIME_STATUSES.includes(status)) {
      patch._in = "";
      patch._out = "";
    }
    setRow(uuid, patch);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.employee_id || "").toLowerCase().includes(q) ||
        (r.brand || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Live summary from the current local state.
  const summary = useMemo(() => {
    const c = { present: 0, absent: 0, on_leave: 0, wfh: 0, at_stp: 0, holiday: 0, late: 0 };
    rows.forEach((r) => {
      if (c[r._status] !== undefined) c[r._status]++;
    });
    return c;
  }, [rows]);

  const save = async () => {
    const payload = {
      date,
      rows: rows.map((r) => {
        const noTime = NO_TIME_STATUSES.includes(r._status);
        const multi = r.is_multi_shift && !noTime;
        return {
          employee_profile_uuid: r.employee_profile_uuid,
          status: r._status,
          in_time: noTime ? null : toDateTime(date, r._in),
          out_time: noTime ? null : toDateTime(date, r._out),
          note: r.note || null,
          shifts: multi
            ? r._shifts.map((s) => ({
                office_id: s.office_id,
                label: s.label,
                scheduled_start: s.scheduled_start,
                scheduled_end: s.scheduled_end,
                attended: s._attended,
                in: s._attended ? toDateTime(date, s._in) : null,
                out: s._attended ? toDateTime(date, s._out) : null,
              }))
            : undefined,
        };
      }),
    };
    try {
      const res = await post({ path: "employee/attendance/daily", body: payload }).unwrap();
      showToast(res?.message || "Attendance saved", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not save attendance", "error");
    }
  };

  const cell = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}>
            <CalendarCheck size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Mark Attendance</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Everyone pre-filled from their schedule · edit only the exceptions · one Save
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={cell}
          />
          <button
            onClick={save}
            disabled={saving || rows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white rounded-lg"
            style={{ background: BRAND, opacity: saving || rows.length === 0 ? 0.6 : 1 }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save attendance
          </button>
        </div>
      </div>

      {/* summary strip */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { k: "present", icon: Users },
          { k: "late" },
          { k: "absent" },
          { k: "on_leave" },
          { k: "wfh" },
          { k: "at_stp" },
          { k: "holiday" },
        ].map(({ k }) => (
          <div key={k} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: STATUS[k].bg, color: STATUS[k].color }}>
            {STATUS[k].label}: {summary[k] ?? 0}
          </div>
        ))}
      </div>

      {/* search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 max-w-sm" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
        <Search size={15} style={{ color: TEXT_MUTED }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, ID or brand"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: TEXT_PRIMARY }}
        />
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: SURFACE, color: TEXT_SECONDARY }} className="text-[11px] uppercase">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">In time</th>
              <th className="px-3 py-3 font-semibold">Out time</th>
              <th className="px-3 py-3 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {isFetching && rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center"><Loader2 size={18} className="animate-spin inline" style={{ color: TEXT_MUTED }} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No active employees.</td></tr>
            ) : (
              filtered.map((r) => {
                const noTime = NO_TIME_STATUSES.includes(r._status);
                const opts = HR_CHOICES.includes(r._status) ? HR_CHOICES : [r._status, ...HR_CHOICES];
                return (
                  <tr key={r.employee_profile_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                        {r.is_stp_day && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FFF7ED", color: AMBER }}>
                            {r.is_split_day ? "HQ + STP" : "STP"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        {r.employee_id}{r.brand ? ` · ${r.brand}` : ""}
                        {!r.is_working_day && <span style={{ color: AMBER }}> · day off</span>}
                      </div>
                      {!r.is_multi_shift && r.shifts?.length > 0 && (
                        <div className="text-[10.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                          {r.shifts.map((s, idx) => (
                            <span key={idx}>
                              {idx > 0 && " · "}
                              <span style={{ color: s.is_stp ? AMBER : TEXT_SECONDARY }}>
                                {s.scheduled_start}–{s.scheduled_end} {s.label}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={r._status}
                        onChange={(e) => onStatus(r.employee_profile_uuid, e.target.value)}
                        className="px-2 py-1.5 text-[12px] rounded-lg outline-none font-semibold"
                        style={{ ...cell, color: STATUS[r._status]?.color || TEXT_PRIMARY }}
                      >
                        {opts.map((s) => <option key={s} value={s}>{STATUS[s]?.label || s}</option>)}
                      </select>
                    </td>
                    {r.is_multi_shift && !noTime ? (
                      <td className="px-3 py-2.5" colSpan={2}>
                        <div className="space-y-1.5">
                          {r._shifts.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 flex-wrap">
                              <label className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer" style={{ minWidth: 92, color: s.is_stp ? AMBER : TEXT_SECONDARY }}>
                                <input
                                  type="checkbox"
                                  checked={s._attended}
                                  onChange={(e) => setShift(r.employee_profile_uuid, idx, { _attended: e.target.checked })}
                                />
                                {s.label}
                              </label>
                              <input
                                type="time"
                                value={s._in}
                                disabled={!s._attended}
                                onChange={(e) => setShift(r.employee_profile_uuid, idx, { _in: e.target.value })}
                                className="px-2 py-1 text-[12px] rounded-lg outline-none"
                                style={{ ...cell, opacity: s._attended ? 1 : 0.4 }}
                              />
                              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>to</span>
                              <input
                                type="time"
                                value={s._out}
                                disabled={!s._attended}
                                onChange={(e) => setShift(r.employee_profile_uuid, idx, { _out: e.target.value })}
                                className="px-2 py-1 text-[12px] rounded-lg outline-none"
                                style={{ ...cell, opacity: s._attended ? 1 : 0.4 }}
                              />
                              {!s._attended && <span className="text-[10px] font-semibold" style={{ color: BRAND }}>didn&apos;t come</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2.5">
                          <input
                            type="time"
                            value={r._in}
                            disabled={noTime}
                            onChange={(e) => setRow(r.employee_profile_uuid, { _in: e.target.value })}
                            className="px-2 py-1.5 text-[12px] rounded-lg outline-none"
                            style={{ ...cell, opacity: noTime ? 0.4 : 1 }}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="time"
                            value={r._out}
                            disabled={noTime}
                            onChange={(e) => setRow(r.employee_profile_uuid, { _out: e.target.value })}
                            className="px-2 py-1.5 text-[12px] rounded-lg outline-none"
                            style={{ ...cell, opacity: noTime ? 0.4 : 1 }}
                          />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5">
                      <input
                        value={r.note || ""}
                        onChange={(e) => setRow(r.employee_profile_uuid, { note: e.target.value })}
                        placeholder="—"
                        className="w-full px-2 py-1.5 text-[12px] rounded-lg outline-none"
                        style={cell}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
        <Clock size={12} /> In/out are pre-filled from each person&apos;s schedule. Edit the time if they came in differently — lateness is calculated automatically on save.
      </p>
    </div>
  );
}
