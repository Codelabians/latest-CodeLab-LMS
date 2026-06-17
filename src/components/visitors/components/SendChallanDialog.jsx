import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { X, Loader2, Send, Download } from "lucide-react";
import { usePostMutation, useGetQuery } from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";
import { useLaptopFee } from "../../../hooks/useLaptopFee";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const applyDisc = (base, val, type) => {
  base = Number(base) || 0;
  const d = type === "percent" ? (base * (Number(val) || 0)) / 100 : (Number(val) || 0);
  return Math.max(0, base - Math.min(d, base));
};
const RESEND_REASONS = ["Discount changed", "Misplaced / lost", "Course changed", "Incorrect email", "Incorrect number", "Other"];

/**
 * Send a course challan (with optional enrolment + monthly discounts) to a
 * visitor over email and/or WhatsApp. Course defaults to the visitor's
 * interested course.
 */
export default function SendChallanDialog({ visitor, courses = [], mode = "send", onClose, onSent }) {
  const isDownload = mode === "download";
  const authToken = useSelector((s) => s.auth?.token);
  const [downloading, setDownloading] = useState(false);
  const [form, setForm] = useState({
    course_id: visitor?.interested_course?.id ? String(visitor.interested_course.id) : "",
    enrollment_discount: visitor?.enrollment_discount ? String(visitor.enrollment_discount) : "",
    enrollment_discount_type: "amount",
    monthly_discount: visitor?.monthly_discount ? String(visitor.monthly_discount) : "",
    monthly_discount_type: "amount",
    is_laptop: !!visitor?.laptop_required,
    discount_reason: visitor?.discount_reason || "",
    email: true,
    whatsapp: true,
  });
  const [post, { isLoading }] = usePostMutation();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const alreadySent = (visitor?.challan_sent_count || 0) > 0;
  const [resendReason, setResendReason] = useState("");
  const [resendOther, setResendOther] = useState("");

  // Org-wide default discounts (percent) → converted to a Rs amount per course.
  const { data: discData } = useGetQuery({ path: "finance/fee-discount-settings" });
  const defEnr = discData?.data?.enrollment_discount_percent ?? 0;
  const defMon = discData?.data?.monthly_discount_percent ?? 0;

  // Configured monthly laptop fee (Website Settings).
  const laptopFeeSetting = useLaptopFee(0);

  const selCourse = courses.find((c) => String(c.id) === String(form.course_id));

  // Recalculate the discount AMOUNT (Rs) from the org % whenever the selected
  // course or the loaded settings change (admin can still override).
  useEffect(() => {
    if (!selCourse) return;
    // Prefer the discount stored on THIS visitor (what reception offered
    // them); fall back to the org-wide default percent only when none set.
    const visEnr = Number(visitor?.enrollment_discount) || 0;
    const visMon = Number(visitor?.monthly_discount) || 0;
    setForm((f) => ({
      ...f,
      enrollment_discount: visEnr ? String(visEnr) : (defEnr ? String(Math.round((Number(selCourse.enrollment_fee) || 0) * defEnr / 100)) : f.enrollment_discount),
      enrollment_discount_type: "amount",
      monthly_discount: visMon ? String(visMon) : (defMon ? String(Math.round((Number(selCourse.monthly_fee) || 0) * defMon / 100)) : f.monthly_discount),
      monthly_discount_type: "amount",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.course_id, defEnr, defMon]);
  const netEnrollment = selCourse ? applyDisc(selCourse.enrollment_fee, form.enrollment_discount, form.enrollment_discount_type) : null;
  const netMonthly = selCourse ? applyDisc(selCourse.monthly_fee, form.monthly_discount, form.monthly_discount_type) : null;

  const download = async () => {
    if (!form.course_id) return showToast("Pick a course", "error");
    setDownloading(true);
    try {
      const baseUrl = (import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/").replace(/\/+$/, "");
      const qs = new URLSearchParams();
      qs.set("course_id", form.course_id);
      qs.set("enrollment_discount", form.enrollment_discount || 0);
      qs.set("enrollment_discount_type", form.enrollment_discount_type);
      qs.set("monthly_discount", form.monthly_discount || 0);
      qs.set("monthly_discount_type", form.monthly_discount_type);
      qs.set("is_laptop", form.is_laptop ? 1 : 0);
      if (form.discount_reason) qs.set("discount_reason", form.discount_reason);
      const token = authToken || localStorage.getItem("token");
      const r = await fetch(`${baseUrl}/student/visitors/${visitor.id}/course-challan-pdf?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!r.ok) {
        let msg = `Could not load challan PDF (HTTP ${r.status}).`;
        try { const j = JSON.parse(await r.text()); if (j?.message) msg = j.message; } catch { /* not JSON */ }
        throw new Error(msg);
      }
      if (!(r.headers.get("content-type") || "").includes("application/pdf")) throw new Error("Server didn't return a PDF.");
      const objectUrl = window.URL.createObjectURL(await r.blob());
      window.open(objectUrl, "_blank", "noopener");
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
      onClose?.();
    } catch (e) {
      showToast(e?.message || "Could not load challan PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const submit = async () => {
    if (isDownload) return download();
    if (!form.course_id) return showToast("Pick a course", "error");
    if (!form.email && !form.whatsapp) return showToast("Pick at least one channel", "error");
    const finalResendReason = resendReason === "Other" ? resendOther.trim() : resendReason;
    if (alreadySent && !finalResendReason) return showToast("Pick a reason for sending again", "error");
    const channels = [form.email ? "email" : null, form.whatsapp ? "whatsapp" : null].filter(Boolean);
    try {
      const res = await post({
        path: `/student/visitors/${visitor.id}/send-course-challan`,
        body: {
          course_id: Number(form.course_id),
          enrollment_discount: Number(form.enrollment_discount) || 0,
          enrollment_discount_type: form.enrollment_discount_type,
          monthly_discount: Number(form.monthly_discount) || 0,
          monthly_discount_type: form.monthly_discount_type,
          is_laptop: form.is_laptop,
          discount_reason: form.discount_reason || null,
          resend_reason: alreadySent ? finalResendReason : null,
          channels,
        },
      }).unwrap();
      showToast(res?.message || "Challan sent", "success");
      onSent?.();
    } catch (e) {
      showToast(e?.data?.message || "Could not send the challan", "error");
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl max-h-[92vh] overflow-y-auto" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isDownload ? "Download course challan" : "Send course challan"}</h2>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{visitor?.name} · {visitor?.contact || visitor?.email || "no contact"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {alreadySent && !isDownload && (
            <div className="rounded-lg px-3 py-2.5" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div className="text-[11.5px] font-semibold mb-1.5" style={{ color: "#B45309" }}>
                Already sent {visitor.challan_sent_count}× — why send again?
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
              <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}><span>Enrolment</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(netEnrollment)}</span></div>
              <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}><span>Monthly</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(netMonthly)}</span></div>
              {form.is_laptop && laptopFeeSetting > 0 && (
                <div className="flex justify-between" style={{ color: TEXT_SECONDARY }}><span>Laptop fee</span><span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{money(laptopFeeSetting)}</span></div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            <input type="checkbox" checked={form.is_laptop} onChange={(e) => set("is_laptop", e.target.checked)} /> Include laptop fee{laptopFeeSetting > 0 ? ` (${money(laptopFeeSetting)})` : ""}
          </label>

          {!isDownload && (
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Send via</label>
              <div className="flex gap-4 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.email} onChange={(e) => set("email", e.target.checked)} /> Email</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.whatsapp} onChange={(e) => set("whatsapp", e.target.checked)} /> WhatsApp</label>
              </div>
            </div>
          )}

          {(() => {
            const busy = isLoading || downloading;
            return (
              <button disabled={busy} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: busy ? 0.7 : 1 }}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : isDownload ? <Download size={15} /> : <Send size={15} />}
                {isDownload ? "Download challan" : "Send challan"}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
