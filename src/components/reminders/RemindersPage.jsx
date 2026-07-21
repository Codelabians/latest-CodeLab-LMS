import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  AlarmClock, Plus, Pencil, Trash2, CheckCircle2, X, Loader2, Repeat,
  Send, Search, Users, CalendarClock,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const hasAnyPermission = (user, gate) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!gate || gate.length === 0) return true;
  const perms = user.permissions || [];
  return gate.some((p) => perms.includes(p));
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "completed", label: "Completed" },
];

const STATUS_BADGE = {
  pending: { bg: "#FFFBEB", fg: "#B45309", label: "Pending" },
  sent: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Sent" },
  completed: { bg: "#F0FDF4", fg: "#15803D", label: "Completed" },
};

const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const REPEAT_LABELS = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

// "YYYY-MM-DDTHH:mm" (datetime-local) → "YYYY-MM-DD HH:mm:ss" (API)
const toApiDateTime = (v) => (v ? `${v.replace("T", " ")}:00` : null);
// API "YYYY-MM-DD HH:mm:ss" → datetime-local "YYYY-MM-DDTHH:mm"
const toLocalInput = (v) => (v ? String(v).replace(" ", "T").slice(0, 16) : "");

const fmtDateTime = (v) => {
  if (!v) return "—";
  const dt = new Date(String(v).replace(" ", "T"));
  return Number.isNaN(dt.getTime())
    ? v
    : dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

/* ─────────────── Create / edit reminder modal ─────────────── */
function ReminderFormModal({ reminder, onClose, onDone }) {
  const isEdit = !!reminder;
  const [title, setTitle] = useState(reminder?.title || "");
  const [body, setBody] = useState(reminder?.body || "");
  const [remindAt, setRemindAt] = useState(toLocalInput(reminder?.remind_at));
  const [repeat, setRepeat] = useState(reminder?.repeat_frequency || "none");
  const [err, setErr] = useState(null);
  const [post, { isLoading: creating }] = usePostMutation();
  const [patch, { isLoading: updating }] = usePatchMutation();
  const busy = creating || updating;

  const submit = async () => {
    setErr(null);
    if (!title.trim()) { setErr("Title is required."); return; }
    if (!remindAt) { setErr("Please choose when to be reminded."); return; }
    const payload = {
      title: title.trim(),
      body: body.trim() || null,
      remind_at: toApiDateTime(remindAt),
      repeat_frequency: repeat,
    };
    try {
      if (isEdit) {
        await patch({ path: `communication/reminders/${reminder.reminder_uuid}`, body: payload }).unwrap();
        showToast("Reminder updated.", "success");
      } else {
        await post({ path: "communication/reminders", body: payload }).unwrap();
        showToast("Reminder created.", "success");
      }
      onDone();
    } catch (e) {
      const errors = e?.data?.errors;
      const first = errors && Object.values(errors)[0];
      setErr((Array.isArray(first) ? first[0] : first) || e?.data?.message || "Could not save the reminder.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <AlarmClock size={17} />
            </span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isEdit ? "Edit reminder" : "New reminder"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up on pending fees"
          className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

        <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Notes (optional)</label>
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Any extra details…"
          className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none resize-none"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Remind me at *</label>
            <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Repeat</label>
            <select value={repeat} onChange={(e) => setRepeat(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
              {REPEAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {err && (
          <div className="px-3 py-2 mb-3 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>{err}</div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND_RED }}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Admin "Send to employees" modal (Feature B) ─────────── */
function SendToEmployeesModal({ onClose, onDone }) {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState({}); // id → {id, name, role}
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [err, setErr] = useState(null);
  const [post, { isLoading: sending }] = usePostMutation();

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useGetQuery({
    path: "communication/reminders/recipients",
    params: { q: q || undefined, per_page: 50 },
  });
  const recipients = data?.data || [];

  const selectedIds = Object.keys(selected).map(Number);
  const allVisibleSelected = recipients.length > 0 && recipients.every((r) => selected[r.id]);

  const toggle = (r) =>
    setSelected((p) => {
      const next = { ...p };
      if (next[r.id]) delete next[r.id];
      else next[r.id] = r;
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((p) => {
      const next = { ...p };
      if (allVisibleSelected) recipients.forEach((r) => delete next[r.id]);
      else recipients.forEach((r) => { next[r.id] = r; });
      return next;
    });

  const submit = async () => {
    setErr(null);
    if (!selectedIds.length) { setErr("Select at least one employee."); return; }
    if (!title.trim()) { setErr("Title is required."); return; }
    try {
      await post({
        path: "communication/reminders/admin-send",
        body: {
          user_ids: selectedIds,
          title: title.trim(),
          body: body.trim() || null,
          remind_at: remindAt ? toApiDateTime(remindAt) : null,
        },
      }).unwrap();
      showToast(
        remindAt
          ? `Reminder scheduled for ${selectedIds.length} employee${selectedIds.length === 1 ? "" : "s"}.`
          : `Reminder sent to ${selectedIds.length} employee${selectedIds.length === 1 ? "" : "s"}.`,
        "success",
      );
      onDone();
    } catch (e) {
      const errors = e?.data?.errors;
      const first = errors && Object.values(errors)[0];
      setErr((Array.isArray(first) ? first[0] : first) || e?.data?.message || "Could not send the reminder.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[90vh] flex flex-col" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Users size={17} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Send reminder to employees</h2>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Leave schedule empty to send immediately.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Recipient picker */}
          <div className="relative mb-2">
            <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…"
              className="w-full py-2 pl-9 pr-3 text-sm rounded-lg outline-none"
              style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
          </div>
          <div className="flex items-center justify-between px-1 mb-1">
            <label className="inline-flex items-center gap-1.5 text-[12px] font-medium cursor-pointer select-none" style={{ color: TEXT_SECONDARY }}>
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!recipients.length} />
              Select all shown
            </label>
            <span className="text-[11.5px] font-semibold" style={{ color: selectedIds.length ? BRAND_RED : TEXT_MUTED }}>
              {selectedIds.length} selected
            </span>
          </div>
          <div className="mb-4 overflow-y-auto rounded-lg" style={{ maxHeight: 190, border: `1px solid ${BORDER}` }}>
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-6 text-[12px]" style={{ color: TEXT_MUTED }}>
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {!isFetching && recipients.length === 0 && (
              <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No employees found.</div>
            )}
            {!isFetching && recipients.map((r) => (
              <label key={r.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#F8FAFC]" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <input type="checkbox" checked={!!selected[r.id]} onChange={() => toggle(r)} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                  {r.role && <span className="block text-[11px] capitalize truncate" style={{ color: TEXT_MUTED }}>{r.role}</span>}
                </span>
              </label>
            ))}
          </div>

          <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Submit monthly reports"
            className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

          <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Message (optional)</label>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details for the team…"
            className="w-full px-3 py-2 mb-3 text-sm rounded-lg outline-none resize-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

          <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>
            Schedule (optional — empty sends now)
          </label>
          <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

          {err && (
            <div className="px-3 py-2 mt-3 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>{err}</div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={sending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND_RED }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending…" : remindAt ? "Schedule reminder" : "Send now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Page ─────────────────────── */
export default function RemindersPage() {
  const currentUser = useSelector(selectCurrentUser);
  const canSendToEmployees = hasAnyPermission(currentUser, ["send reminders"]);

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [formTarget, setFormTarget] = useState(null); // null | "new" | reminder
  const [sendOpen, setSendOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (status) p.status = status;
    return p;
  }, [page, perPage, status]);

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "communication/reminders", params },
    { refetchOnMountOrArgChange: true },
  );
  const rows = data?.data || [];
  const meta = data?.meta?.pagination || data?.meta || {};
  const total = meta.total ?? rows.length;

  const [patch] = usePatchMutation();
  const [del] = useDeleteMutation();

  const markComplete = async (r) => {
    setBusyId(`complete-${r.reminder_uuid}`);
    try {
      await patch({ path: `communication/reminders/${r.reminder_uuid}/complete`, body: {} }).unwrap();
      showToast("Reminder marked as completed.", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not complete the reminder.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const deleteReminder = async (r) => {
    if (!window.confirm(`Delete the reminder "${r.title}"? This cannot be undone.`)) return;
    setBusyId(`delete-${r.reminder_uuid}`);
    try {
      await del({ path: `communication/reminders/${r.reminder_uuid}` }).unwrap();
      showToast("Reminder deleted.", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not delete the reminder.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <AlarmClock size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Reminders</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Personal reminders — you&apos;ll be notified when they&apos;re due.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSendToEmployees && (
            <button onClick={() => setSendOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg"
              style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}>
              <Send size={14} /> Send to employees
            </button>
          )}
          <button onClick={() => setFormTarget("new")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND_RED }}>
            <Plus size={15} /> New Reminder
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatus(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              status === t.value
                ? "bg-[#FEF2F2] border-[#C90606] text-[#C90606]"
                : "bg-white border-[#EEF2F6] text-[#475569]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {(isLoading || isFetching) && (
          <div className="flex items-center justify-center gap-2 py-14" style={{ color: TEXT_MUTED }}>
            <Loader2 size={18} className="animate-spin" /> Loading reminders…
          </div>
        )}
        {!isLoading && !isFetching && rows.length === 0 && (
          <div className="p-14 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full" style={{ background: BRAND_RED_TINT }}>
              <AlarmClock className="w-8 h-8" style={{ color: BRAND_RED }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>No reminders</h3>
            <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
              {status ? "Nothing here for this filter." : "Create a reminder and we'll nudge you when it's due."}
            </p>
          </div>
        )}
        {!isLoading && !isFetching && rows.length > 0 && (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {rows.map((r) => {
              const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
              const fromSomeoneElse = r.created_by && String(r.created_by) !== String(currentUser?.id);
              return (
                <div key={r.reminder_uuid || r.id} className="flex items-start gap-4 p-5 hover:bg-[#F8FAFC] transition">
                  <div className="grid flex-shrink-0 mt-0.5 place-items-center" style={{ width: 34, height: 34, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlarmClock size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{r.title}</p>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
                      {r.repeat_frequency && r.repeat_frequency !== "none" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#F1F5F9", color: TEXT_SECONDARY, border: "1px solid #E2E8F0" }}>
                          <Repeat size={10} /> {REPEAT_LABELS[r.repeat_frequency] || r.repeat_frequency}
                        </span>
                      )}
                      {fromSomeoneElse && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #DBEAFE" }}>
                          from {r.created_by_name || "admin"}
                        </span>
                      )}
                    </div>
                    {r.body && <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{r.body}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11.5px]" style={{ color: TEXT_MUTED }}>
                      <span className="inline-flex items-center gap-1"><CalendarClock size={11} /> {fmtDateTime(r.remind_at)}</span>
                      {r.sent_at && <span>Sent {fmtDateTime(r.sent_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 gap-1.5">
                    {r.status !== "completed" && (
                      <button onClick={() => markComplete(r)} disabled={busyId === `complete-${r.reminder_uuid}`} title="Mark as completed"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-50"
                        style={{ border: `1px solid ${BORDER}`, color: "#15803D" }}>
                        {busyId === `complete-${r.reminder_uuid}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      </button>
                    )}
                    {r.status === "pending" && (
                      <button onClick={() => setFormTarget(r)} title="Edit reminder"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg"
                        style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}>
                        <Pencil size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteReminder(r)} disabled={busyId === `delete-${r.reminder_uuid}`} title="Delete reminder"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-50"
                      style={{ background: BRAND_RED_TINT, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
                      {busyId === `delete-${r.reminder_uuid}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>

      {formTarget && (
        <ReminderFormModal
          reminder={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onDone={() => { setFormTarget(null); refetch(); }}
        />
      )}
      {sendOpen && (
        <SendToEmployeesModal onClose={() => setSendOpen(false)} onDone={() => { setSendOpen(false); refetch(); }} />
      )}
    </div>
  );
}
