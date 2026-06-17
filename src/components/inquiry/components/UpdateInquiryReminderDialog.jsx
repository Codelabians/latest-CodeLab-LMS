import React, { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const todayStr = () => new Date().toISOString().slice(0, 10);

const UpdateInquiryReminderDialog = ({ open, inquiry, onCancel, onConfirm, isLoading }) => {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setServerError("");
    setDate(inquiry?.reminder_date || "");
    setNote(inquiry?.reminder_note || "");
  }, [open, inquiry]);

  if (!open || !inquiry) return null;

  const name = `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim() || "this inquiry";
  const validDate = !date || date >= todayStr();
  const validNote = note.length <= 500;
  const isValid = validDate && validNote;

  const handleSave = async () => {
    if (!isValid) return;
    setServerError("");
    const payload = {};
    if (date) payload.reminder_date = date;
    if (note.trim()) payload.reminder_note = note.trim();
    if (!date && !note.trim()) {
      payload.reminder_date = null;
      payload.reminder_note = null;
    }
    const res = await onConfirm(payload);
    if (res?.error) setServerError(res.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: "#FFFBEB", color: "#B45309" }}>
          <Bell size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Follow-up reminder for &ldquo;{name}&rdquo;
        </h3>
        <p className="mt-1.5 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          The team gets a push notification on the reminder date. Leave both fields blank to clear it.
        </p>

        {serverError && (
          <div className="p-2.5 mt-3 text-[12px] rounded-lg" style={{ background: "#FEF2F2", color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
            {serverError}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Date</label>
            <input
              type="date" min={todayStr()} value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
              style={{
                background: SURFACE_HOVER, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif",
                width: "100%", height: 40, padding: "0 12px", borderRadius: 8, fontSize: 13, outline: "none",
                border: `1px solid ${!validDate ? "#FCA5A5" : BORDER}`,
              }}
            />
            {!validDate && (
              <p className="mt-1 text-[11px] font-medium" style={{ color: BRAND_RED }}>Must be today or later</p>
            )}
          </div>
          <div>
            <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>Note</label>
            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)} disabled={isLoading}
              placeholder="What to ask when you call"
              style={{
                background: SURFACE_HOVER, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif",
                width: "100%", height: 40, padding: "0 12px", borderRadius: 8, fontSize: 13, outline: "none",
                border: `1px solid ${!validNote ? "#FCA5A5" : BORDER}`,
              }}
            />
            <p className="mt-1 text-[11px]" style={{ color: !validNote ? BRAND_RED : TEXT_MUTED }}>
              {!validNote ? "Max 500 characters" : `${note.length}/500`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={handleSave} disabled={!isValid || isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : "Save reminder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateInquiryReminderDialog;
