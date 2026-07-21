import { useState } from "react";
import { MessageCircle, X, Loader2, Send } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/**
 * SendMessageModal — send a WhatsApp message (mirrored to the student's
 * portal notifications) to either the student or their guardian.
 *
 * Props:
 *   student  — object with at least {id, name, contact, guardian_name, guardian_phone}
 *   onClose  — close handler
 */
export default function SendMessageModal({ student, onClose }) {
  const studentPhone = student?.contact || null;
  const guardianPhone = student?.guardian_phone || null;
  const [target, setTarget] = useState(studentPhone ? "student" : guardianPhone ? "guardian" : "student");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState(null);
  const [post, { isLoading: sending }] = usePostMutation();

  const submit = async () => {
    setErr(null);
    if (!message.trim()) { setErr("Please write a message."); return; }
    try {
      const res = await post({
        path: "communication/messages/student",
        body: { student_id: student.id, target, message: message.trim() },
      }).unwrap();
      const d = res?.data || res || {};
      if (d.whatsapp_sent) {
        showToast(
          `WhatsApp sent to ${target === "guardian" ? "guardian" : "student"}${d.phone ? ` (${d.phone})` : ""}.`,
          "success",
        );
      } else {
        showToast(
          d.portal_notified
            ? "WhatsApp could not be sent, but the student was notified on the portal."
            : res?.message || "Message queued, but WhatsApp was not sent.",
          "warning",
        );
      }
      onClose();
    } catch (e) {
      const errors = e?.data?.errors;
      const first = errors && Object.values(errors)[0];
      setErr((Array.isArray(first) ? first[0] : first) || e?.data?.message || "Could not send the message.");
    }
  };

  const Option = ({ value, label, phone, missingHint }) => {
    const disabled = !phone;
    return (
      <label
        className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          border: `1px solid ${target === value && !disabled ? BRAND_RED : BORDER}`,
          background: target === value && !disabled ? BRAND_RED_TINT : "#fff",
        }}
      >
        <input type="radio" name="msg-target" className="mt-0.5" checked={target === value} disabled={disabled}
          onChange={() => setTarget(value)} />
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{label}</span>
          <span className="block text-[11.5px]" style={{ color: disabled ? BRAND_RED : TEXT_MUTED }}>
            {phone || missingHint}
          </span>
        </span>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#F0FDF4", color: "#15803D" }}>
              <MessageCircle size={17} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Send message</h2>
              <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>{student?.name || "Student"} — via WhatsApp + portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <label className="block text-[11px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>Send to</label>
        <div className="grid gap-2 mb-4">
          <Option value="student" label={`Student${student?.name ? ` (${student.name})` : ""}`}
            phone={studentPhone} missingHint="No phone number on file for the student" />
          <Option value="guardian" label={`Guardian${student?.guardian_name ? ` (${student.guardian_name})` : ""}`}
            phone={guardianPhone} missingHint="No guardian phone number on file" />
        </div>

        <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Message *</label>
        <textarea rows={4} value={message} onChange={(e) => { setMessage(e.target.value); setErr(null); }}
          placeholder="Write your message…"
          className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />

        {err && (
          <div className="px-3 py-2 mt-3 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>{err}</div>
        )}

        <div className="flex gap-2 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={sending || (target === "student" ? !studentPhone : !guardianPhone)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ background: "#15803D" }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </div>
    </div>
  );
}
