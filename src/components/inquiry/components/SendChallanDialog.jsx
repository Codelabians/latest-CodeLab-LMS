import { useEffect, useState } from "react";
import { Send, Mail, MessageCircle, Loader2, Download } from "lucide-react";
import { useGetQuery } from "../../../api/apiSlice";
import { useLaptopFee } from "../../../hooks/useLaptopFee";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const applyDisc = (base, val, type) => {
  base = Number(base) || 0;
  const d = type === "percent" ? (base * (Number(val) || 0)) / 100 : (Number(val) || 0);
  return Math.max(0, base - Math.min(d, base));
};

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const AMBER = "#B45309";
const WA_GREEN = "#15803D";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

const ChannelRow = ({ active, disabled, onToggle, icon: Icon, label, sub, accent }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    className="flex items-center w-full gap-3 p-3 text-left transition rounded-lg disabled:cursor-not-allowed"
    style={{
      border: `1px solid ${active && !disabled ? accent : BORDER}`,
      background: disabled ? "#F8FAFC" : active ? "#FFFFFF" : "#F8FAFC",
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <span
      className="flex items-center justify-center flex-shrink-0 rounded-md"
      style={{ width: 30, height: 30, background: active && !disabled ? accent : "#E2E8F0", color: active && !disabled ? "#fff" : TEXT_MUTED }}
    >
      <Icon size={15} strokeWidth={2} />
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{label}</div>
      <div className="text-[11.5px] truncate" style={{ color: TEXT_MUTED }}>{sub}</div>
    </div>
    <span
      className="flex items-center justify-center flex-shrink-0 rounded-md border"
      style={{ width: 18, height: 18, borderColor: active && !disabled ? accent : "#CBD5E1", background: active && !disabled ? accent : "transparent" }}
    >
      {active && !disabled && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M20 6L9 17l-5-5" /></svg>
      )}
    </span>
  </button>
);

const RESEND_REASONS = ["Discount changed", "Misplaced / lost", "Course changed", "Incorrect email", "Incorrect number", "Other"];

const SendChallanDialog = ({ open, inquiry, courses = [], mode = "send", onCancel, onConfirm, isLoading }) => {
  const isDownload = mode === "download";
  const alreadySent = (inquiry?.challan_sent_count || 0) > 0;
  const [resendReason, setResendReason] = useState("");
  const [resendOther, setResendOther] = useState("");
  const hasEmail = !!(inquiry?.email && inquiry.email !== "-");
  const hasPhone = !!(inquiry?.phone_number && inquiry.phone_number !== "-");

  const [form, setForm] = useState({
    course_id: "",
    enrollment_discount: "",
    enrollment_discount_type: "amount",
    monthly_discount: "",
    monthly_discount_type: "amount",
    is_laptop: false,
    discount_reason: "",
  });
  const [channels, setChannels] = useState({ whatsapp: true, email: true });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Configured monthly laptop fee (Website Settings) — shown in the preview
  // and added to the challan total when "Include laptop fee" is checked.
  const laptopFeeSetting = useLaptopFee(0);

  // Org-wide default discounts (percent) — converted to a Rs amount per course.
  const { data: discData } = useGetQuery({ path: "finance/fee-discount-settings" });
  const defEnr = discData?.data?.enrollment_discount_percent ?? 0;
  const defMon = discData?.data?.monthly_discount_percent ?? 0;

  // Reset on (re)open: default course + channels. Discounts are filled by the
  // course-watch effect below (so they show as a calculated Rs amount).
  useEffect(() => {
    if (!open) return;
    setChannels({ whatsapp: hasPhone, email: hasEmail });
    setForm({
      course_id: inquiry?.primary_course?.id
        ? String(inquiry.primary_course.id)
        : inquiry?.primary_course_id
        ? String(inquiry.primary_course_id)
        : "",
      enrollment_discount: "",
      enrollment_discount_type: "amount",
      monthly_discount: "",
      monthly_discount_type: "amount",
      is_laptop: String(inquiry?.is_laptop_demanded || "").toLowerCase() === "yes",
      discount_reason: "",
    });
    setResendReason("");
    setResendOther("");
  }, [open, inquiry, hasPhone, hasEmail]);

  // Auto-calculate the discount as a Rs AMOUNT from the org % whenever the
  // selected course changes (admin can still override the amount).
  useEffect(() => {
    if (!open || !form.course_id) return;
    const c = courses.find((x) => String(x.id) === String(form.course_id));
    if (!c) return;
    setForm((f) => ({
      ...f,
      enrollment_discount: defEnr ? String(Math.round((Number(c.enrollment_fee) || 0) * defEnr / 100)) : "",
      enrollment_discount_type: "amount",
      monthly_discount: defMon ? String(Math.round((Number(c.monthly_fee) || 0) * defMon / 100)) : "",
      monthly_discount_type: "amount",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.course_id, defEnr, defMon, open]);

  if (!open || !inquiry) return null;
  const name = `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim();

  const toggle = (key) => setChannels((c) => ({ ...c, [key]: !c[key] }));
  const selected = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
  const finalResendReason = resendReason === "Other" ? resendOther.trim() : resendReason;
  // Download only needs a course; send also needs at least one channel; a
  // resend (already sent before) needs a reason.
  const needsReason = alreadySent && !isDownload;
  const canSend = !!form.course_id && !isLoading
    && (isDownload || selected.length > 0)
    && (!needsReason || !!finalResendReason);

  const submit = () =>
    onConfirm({
      channels: selected,
      course_id: Number(form.course_id),
      enrollment_discount: Number(form.enrollment_discount) || 0,
      enrollment_discount_type: form.enrollment_discount_type,
      monthly_discount: Number(form.monthly_discount) || 0,
      monthly_discount_type: form.monthly_discount_type,
      is_laptop: form.is_laptop,
      discount_reason: form.discount_reason || null,
      resend_reason: needsReason ? finalResendReason : null,
    });

  // After-discount preview from the selected course's fees.
  const selCourse = courses.find((c) => String(c.id) === String(form.course_id));
  const netEnrollment = selCourse ? applyDisc(selCourse.enrollment_fee, form.enrollment_discount, form.enrollment_discount_type) : null;
  const netMonthly = selCourse ? applyDisc(selCourse.monthly_fee, form.monthly_discount, form.monthly_discount_type) : null;

  const discountRow = (label, valKey, typeKey) => (
    <div>
      <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>{label} (optional)</label>
      <div className="flex gap-2">
        <input type="number" min="0" value={form[valKey]} onChange={(e) => set(valKey, e.target.value)} placeholder="0" className="flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        <select value={form[typeKey]} onChange={(e) => set(typeKey, e.target.value)} className="px-2 py-2 text-sm rounded-lg outline-none" style={field}>
          <option value="amount">Rs</option>
          <option value="percent">%</option>
        </select>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: "#FFFBEB", color: AMBER }}>
          <Send size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          {isDownload ? `Download fee challan for ${name}?` : `Send fee challan to ${name}?`}
        </h3>
        <p className="mt-1.5 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          {isDownload
            ? "Pick the course and add any discount, then download the PDF."
            : "Pick the course, add any discount, and choose how to deliver it."}
        </p>

        <div className="mt-4 space-y-3">
          {alreadySent && !isDownload && (
            <div className="rounded-lg px-3 py-2.5" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div className="text-[11.5px] font-semibold mb-1.5" style={{ color: AMBER }}>
                Already sent {inquiry.challan_sent_count}× — why send again?
              </div>
              <select value={resendReason} onChange={(e) => setResendReason(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                <option value="">Select a reason…</option>
                {RESEND_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {resendReason === "Other" && (
                <input value={resendOther} onChange={(e) => setResendOther(e.target.value)} placeholder="Type the reason" className="w-full mt-2 px-3 py-2 text-sm rounded-lg outline-none" style={field} />
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Course</label>
            <select value={form.course_id} onChange={(e) => set("course_id", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!selCourse && (defEnr > 0 || defMon > 0) && (
              <p className="mt-1 text-[11px]" style={{ color: "#B45309" }}>
                Default discount ({defEnr}% enrolment{defMon > 0 ? `, ${defMon}% monthly` : ""}) will fill in once you pick a course.
              </p>
            )}
          </div>

          {discountRow("Enrolment discount", "enrollment_discount", "enrollment_discount_type")}
          {discountRow("Monthly discount", "monthly_discount", "monthly_discount_type")}

          {selCourse && (
            <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: "#F0FDF4", border: `1px solid #BBF7D0` }}>
              <div className="font-semibold mb-0.5" style={{ color: "#15803D" }}>After discount</div>
              <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}>
                <span>Enrolment</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(netEnrollment)}</span>
              </div>
              <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}>
                <span>Monthly</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(netMonthly)}</span>
              </div>
              {form.is_laptop && laptopFeeSetting > 0 && (
                <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}>
                  <span>Laptop fee</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(laptopFeeSetting)}</span>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            <input type="checkbox" checked={form.is_laptop} onChange={(e) => set("is_laptop", e.target.checked)} /> Include laptop fee{laptopFeeSetting > 0 ? ` (${money(laptopFeeSetting)})` : ""}
          </label>

          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Discount reason (optional)</label>
            <input value={form.discount_reason} onChange={(e) => set("discount_reason", e.target.value)} placeholder="e.g. Early-bird offer" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>

          {!isDownload && (
            <div className="flex flex-col gap-2.5 pt-1">
              <ChannelRow active={channels.whatsapp} disabled={!hasPhone} onToggle={() => toggle("whatsapp")} icon={MessageCircle} label="WhatsApp" sub={hasPhone ? inquiry.phone_number : "No phone number on file"} accent={WA_GREEN} />
              <ChannelRow active={channels.email} disabled={!hasEmail} onToggle={() => toggle("email")} icon={Mail} label="Email" sub={hasEmail ? inquiry.email : "No email on file"} accent="#1D4ED8" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button type="button" onClick={submit} disabled={!canSend}
            className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: AMBER }}
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" />{isDownload ? "Opening…" : "Sending…"}</>
            ) : isDownload ? (
              <><Download size={13} />Download challan</>
            ) : (
              <><Send size={13} />Send challan</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendChallanDialog;
