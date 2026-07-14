import { useState } from "react";
import {
  X,
  Loader2,
  StickyNote,
  Bell,
  Plus,
  Check,
  Ban,
  CalendarClock,
} from "lucide-react";
import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../api/apiSlice";
import { showToast } from "./common/ShowToast";

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const BRAND_RED = "#C90606";
const AMBER = "#B45309";

const todayStr = () => new Date().toISOString().slice(0, 10);

const subjectBadge = (t) => {
  const map = {
    visitor: { label: "Visitor", color: "#1D4ED8", bg: "#EFF6FF" },
    inquiry: { label: "Inquiry", color: "#B45309", bg: "#FFFBEB" },
    student: { label: "Student", color: "#15803D", bg: "#F0FDF4" },
  };
  return map[t] || { label: t, color: TEXT_MUTED, bg: "#F8FAFC" };
};

/**
 * Notes + reminders timeline for a lead. `type` is "visitor" | "inquiry" |
 * "student". The backend returns a UNIFIED timeline (visitor -> inquiry ->
 * student), so each row is tagged with where it was written.
 */
export default function LeadNotesModal({ open, type, id, name, onClose }) {
  const [tab, setTab] = useState("notes");
  const [noteBody, setNoteBody] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [remindNote, setRemindNote] = useState("");

  const skip = !open || !id;

  const { data: notesData, isFetching: notesLoading } = useGetQuery(
    { path: `student/leads/${type}/${id}/notes` },
    { skip, refetchOnMountOrArgChange: true }
  );
  const { data: remData, isFetching: remLoading } = useGetQuery(
    { path: `student/leads/${type}/${id}/reminders` },
    { skip, refetchOnMountOrArgChange: true }
  );

  const [postCreate, { isLoading: posting }] = usePostMutation();
  const [patchUpdate, { isLoading: patching }] = usePatchMutation();

  const notes = notesData?.data || [];
  const reminders = remData?.data || [];

  if (!open) return null;

  const addNote = async () => {
    const body = noteBody.trim();
    if (!body) return;
    const res = await postCreate({
      path: `student/leads/${type}/${id}/notes`,
      body: { body },
    });
    if (res?.error) {
      showToast("Could not add note", "error");
      return;
    }
    setNoteBody("");
    showToast("Note added", "success");
  };

  const addReminder = async () => {
    if (!remindDate) return;
    const res = await postCreate({
      path: `student/leads/${type}/${id}/reminders`,
      body: { remind_at: remindDate, note: remindNote.trim() || null },
    });
    if (res?.error) {
      showToast("Could not add reminder", "error");
      return;
    }
    setRemindDate("");
    setRemindNote("");
    showToast("Reminder added", "success");
  };

  const setReminderStatus = async (rid, status) => {
    const res = await patchUpdate({
      path: `student/leads/reminders/${rid}`,
      body: { status },
    });
    if (res?.error) {
      showToast("Could not update reminder", "error");
      return;
    }
    showToast(status === "done" ? "Marked done" : "Reminder cancelled", "success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 bg-white rounded-2xl max-h-[88vh] overflow-y-auto"
        style={{ border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: "#FFFBEB", color: AMBER }}>
              <StickyNote size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Notes &amp; reminders</h3>
              {name && <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { k: "notes", label: `Notes (${notes.length})`, icon: StickyNote },
            { k: "reminders", label: `Reminders (${reminders.length})`, icon: Bell },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition"
              style={
                tab === t.k
                  ? { background: BRAND_RED, color: "#fff" }
                  : { background: "#F1F5F9", color: TEXT_SECONDARY }
              }
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "notes" ? (
          <>
            {/* Add note */}
            <div className="mb-4">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
                maxLength={5000}
                placeholder="Add a note (e.g. follow-up call result)…"
                className="w-full px-3 py-2 text-[13px] rounded-lg outline-none resize-y"
                style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={addNote}
                  disabled={posting || !noteBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                  style={{ background: BRAND_RED }}
                >
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add note
                </button>
              </div>
            </div>

            {/* Notes history */}
            {notesLoading ? (
              <div className="py-8 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
            ) : notes.length === 0 ? (
              <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No notes yet.</p>
            ) : (
              <div className="space-y-2.5">
                {notes.map((n) => {
                  const b = subjectBadge(n.subject_type);
                  return (
                    <div key={n.id} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${BORDER}`, background: "#F8FAFC" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{n.created_at}</span>
                      </div>
                      <div className="text-[13px] whitespace-pre-wrap" style={{ color: TEXT_PRIMARY }}>{n.body}</div>
                      {n.created_by && <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>by {n.created_by}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Add reminder */}
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={remindDate}
                  min={todayStr()}
                  onChange={(e) => setRemindDate(e.target.value)}
                  className="px-3 py-2 text-[13px] rounded-lg outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                />
                <input
                  type="text"
                  value={remindNote}
                  maxLength={500}
                  onChange={(e) => setRemindNote(e.target.value)}
                  placeholder="Reminder note (optional)"
                  className="flex-1 px-3 py-2 text-[13px] rounded-lg outline-none"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addReminder}
                  disabled={posting || !remindDate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                  style={{ background: BRAND_RED }}
                >
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add reminder
                </button>
              </div>
            </div>

            {/* Reminders list */}
            {remLoading ? (
              <div className="py-8 text-center"><Loader2 size={18} className="inline animate-spin" style={{ color: TEXT_MUTED }} /></div>
            ) : reminders.length === 0 ? (
              <p className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No reminders yet.</p>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((r) => {
                  const b = subjectBadge(r.subject_type);
                  const done = r.status === "done";
                  const cancelled = r.status === "cancelled";
                  return (
                    <div key={r.id} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${r.is_overdue ? "#FECACA" : BORDER}`, background: r.is_overdue ? "#FEF2F2" : "#F8FAFC" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock size={13} style={{ color: r.is_overdue ? BRAND_RED : AMBER }} />
                          <span className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>{r.remind_at}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                          color: done ? "#15803D" : cancelled ? TEXT_MUTED : r.is_overdue ? BRAND_RED : AMBER,
                          background: done ? "#F0FDF4" : cancelled ? "#F1F5F9" : r.is_overdue ? "#FEE2E2" : "#FFFBEB",
                        }}>
                          {done ? "Done" : cancelled ? "Cancelled" : r.is_overdue ? "Overdue" : "Pending"}
                        </span>
                      </div>
                      {r.note && <div className="text-[13px]" style={{ color: TEXT_SECONDARY }}>{r.note}</div>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.created_by ? `by ${r.created_by}` : ""}</span>
                        {!done && !cancelled && !r.legacy && (
                          <div className="flex gap-2">
                            <button type="button" disabled={patching} onClick={() => setReminderStatus(r.id, "done")} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#15803D" }}><Check size={12} /> Done</button>
                            <button type="button" disabled={patching} onClick={() => setReminderStatus(r.id, "cancelled")} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: TEXT_MUTED }}><Ban size={12} /> Cancel</button>
                          </div>
                        )}
                        {r.legacy && (
                          <span className="text-[10px] italic" style={{ color: TEXT_MUTED }}>set on record</span>
                                               )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
