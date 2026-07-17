import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Loader2, Home, Laptop, Pencil, Wallet, CalendarCheck, GraduationCap,
  Mail, Phone, CreditCard, MapPin, User, BookOpen, Layers, Award, ArrowRightLeft,
  CheckCircle2, AlertTriangle, X, Repeat, History, UserPlus, RotateCcw,
  ChevronDown, ChevronRight, Plus, FileText, Gift, Send, Download, MessageCircle, PauseCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { useGetQuery, usePostMutation, usePatchMutation, useDownloadChallanMutation } from "../../api/apiSlice";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { STUDENTS_EDIT } from "../routes/RouteConstants";
import PrintIdCard from "../common/PrintIdCard";
import { DiscountModal } from "../finance/FeeCollection";
import SearchableSelect from "../ui/SearchableSelect";
import PhoneActions from "../ui/PhoneActions";
import RecordPaymentModal from "./studentDetailsPages/RecordPaymentModal";
import StudentLaptopCard from "./StudentLaptopCard";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const STATUS_BADGE = { paid: { bg: "#F0FDF4", fg: "#15803D" }, pending: { bg: "#FFFBEB", fg: "#B45309" }, overdue: { bg: "#FEF2F2", fg: BRAND_RED }, break: { bg: "#EFF6FF", fg: "#1D4ED8" }, waived: { bg: "#F5F3FF", fg: "#6D28D9" } };
const METHOD_LABELS = { cash: "Cash", jazzcash: "JazzCash", easypaisa: "EasyPaisa", bank_transfer: "Bank Transfer", cheque: "Cheque", other: "Other" };
const fmtDateTime = (v) => {
  if (!v) return "—";
  const dt = new Date(String(v).replace(" ", "T"));
  return Number.isNaN(dt.getTime()) ? v : dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useGetQuery({ path: `/student/students/${id}` });
  const d = data?.data;
  // Consolidated management data (lecture-progress breakdown, performance, etc.)
  const { data: mgmtData } = useGetQuery({ path: `/student/students/${id}/management` });
  const mgmt = mgmtData?.data;
  // Projected next month's fee (course monthly + net laptop fee).
  const { data: nextFeeData, refetch: refetchNextFee } = useGetQuery({ path: `/student/students/${id}/next-month-fee` });
  const nextFee = nextFeeData?.data;
  const [adjustSchedule, setAdjustSchedule] = useState(null); // monthly-schedule line being adjusted
  const [discountFor, setDiscountFor] = useState(null); // installment for manual discount
  const [photoPreview, setPhotoPreview] = useState(null); // full-size photo lightbox url

  const [toast, setToast] = useState(null);
  const [showSwitch, setShowSwitch] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [recordTarget, setRecordTarget] = useState(null);
  const [showMakeBA, setShowMakeBA] = useState(false);
  const [dueDateTarget, setDueDateTarget] = useState(null);
  const [shiftTarget, setShiftTarget] = useState(null);
  const [openRows, setOpenRows] = useState({});
  const [post, { isLoading: posting }] = usePostMutation();
  const [dlChallan] = useDownloadChallanMutation();
  const [challanBusy, setChallanBusy] = useState(null);
  const toggleRow = (k) => setOpenRows((p) => ({ ...p, [k]: !p[k] }));
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };
  const currentUser = useSelector(selectCurrentUser);
  const canManageRecords = currentUser?.role === "admin" || (currentUser?.permissions || []).includes("record historical-payment");

  const resetInstallment = async (uuid) => {
    if (!window.confirm("Undo all payments on this installment and set it back to pending? Any finance income/ledger for it is reversed.")) return;
    try {
      await post({ path: `finance/installments/${uuid}/reset`, body: {} }).unwrap();
      notify("Installment reset to pending."); refetch();
    } catch (e) { notify(e?.data?.message || "Could not reset installment.", false); }
  };

  const toggleBreak = async (uuid) => {
    try {
      const res = await post({ path: `finance/installments/${uuid}/toggle-break`, body: {} }).unwrap();
      notify(res?.message || "Break status updated."); refetch();
    } catch (e) { notify(e?.data?.message || "Could not update break status.", false); }
  };

  const toggleWaive = async (uuid) => {
    try {
      const res = await post({ path: `finance/installments/${uuid}/toggle-waive`, body: {} }).unwrap();
      notify(res?.message || "Waiver updated."); refetch();
    } catch (e) { notify(e?.data?.message || "Could not update waiver.", false); }
  };

  const deleteInstallment = async (uuid) => {
    if (!window.confirm("Delete this fee record permanently? Use this for months the student is not liable for (e.g. approved leave). Any finance income/ledger for it is reversed. This cannot be undone.")) return;
    try {
      await post({ path: `finance/installments/${uuid}/delete`, body: {} }).unwrap();
      notify("Fee record deleted."); refetch();
    } catch (e) { notify(e?.data?.message || "Could not delete the fee record.", false); }
  };

  const downloadChallanFor = async (uuid) => {
    setChallanBusy(`dl-${uuid}`);
    try {
      await dlChallan({ path: `finance/installments/${uuid}/challan`, params: {}, filename: `challan-${uuid}.pdf` }).unwrap();
    } catch { notify("Could not download challan.", false); }
    finally { setChallanBusy(null); }
  };
  const sendChallanFor = async (uuid, channel) => {
    setChallanBusy(`${channel}-${uuid}`);
    try {
      const res = await post({ path: `finance/installments/${uuid}/${channel === "email" ? "email-challan" : "whatsapp-challan"}`, body: {} }).unwrap();
      notify(res?.message || (channel === "email" ? "Challan emailed." : "Challan sent on WhatsApp."));
    } catch (e) { notify(e?.data?.message || `Could not send the challan via ${channel}.`, false); }
    finally { setChallanBusy(null); }
  };

  const toggleStudentBreak = async () => {
    const onBreak = !!(data?.data?.student?.on_break);
    if (onBreak) {
      if (!window.confirm("Resume this student from break? Their monthly billing restarts and frozen fees become due again.")) return;
      try { await post({ path: `/student/${id}/resume-break`, body: {} }).unwrap(); notify("Resumed from break."); refetch(); }
      catch (e) { notify(e?.data?.message || "Action failed.", false); }
    } else {
      const note = window.prompt("Put this student on break (indefinite pause). Their billing is frozen until you resume. Add a note (optional):", "");
      if (note === null) return;
      try { await post({ path: `/student/${id}/put-on-break`, body: { note: note || undefined } }).unwrap(); notify("Student put on break."); refetch(); }
      catch (e) { notify(e?.data?.message || "Action failed.", false); }
    }
  };

  const removeReferrer = async () => {
    if (!window.confirm("Remove this student's referrer? Any still-active referral reward for this pairing is cancelled and the recurring credit stops.")) return;
    try { await post({ path: `/student/${id}/remove-referrer`, body: {} }).unwrap(); notify("Referral removed."); refetch(); }
    catch (e) { notify(e?.data?.message || "Could not remove the referral.", false); }
  };

  const toggleAlumni = async (makeAlumni) => {
    try {
      await post({ path: `/student/${id}/${makeAlumni ? "convert-to-alumni" : "revert-alumni"}`, body: {} }).unwrap();
      notify(makeAlumni ? "Marked as alumni." : "Alumni status removed."); refetch();
    } catch (e) { notify(e?.data?.message || "Action failed.", false); }
  };

  const removeAmbassador = async () => {
    try {
      await post({ path: `/user/${id}/demote-brand-ambassador`, body: { reason: "Removed by admin" } }).unwrap();
      notify("Brand ambassador status removed."); refetch();
    } catch (e) { notify(e?.data?.message || "Action failed.", false); }
  };

  // Reset the student's password and email them fresh login details — for
  // when they forget or can't recover their account themselves.
  const resendLogin = async () => {
    if (!window.confirm("Email fresh login details to this student? Their current password will be reset.")) return;
    try {
      const res = await post({ path: `user/${id}/resend-credentials`, body: {} }).unwrap();
      notify(res?.message || res?.data || "Login details emailed.");
    } catch (e) { notify(e?.data?.message || "Could not send login details.", false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC" }}><Loader2 size={28} className="animate-spin" style={{ color: BRAND_RED }} /></div>;
  if (!d) return <div className="w-full px-6 py-20 text-center" style={{ color: TEXT_MUTED }}>Student not found.</div>;

  const s = d.student, sum = d.summary || {}, enrollments = d.enrollments || [], transfers = d.transfers || [];
  const primaryEnrol = enrollments.find((e) => e.is_active) || enrollments[0] || {};

  // Attendance breakdown for the donut. Prefer lecture-progress (which
  // distinguishes leave + made-up); fall back to the raw present/absent
  // attendance summary when no lecture progress is recorded yet.
  const prog = mgmt?.progress || {};
  const hasProgress = (prog.total || 0) > 0;
  const attSlices = hasProgress
    ? [
        { name: "Attended", value: prog.attended || 0, color: "#15803D" },
        { name: "Absent", value: prog.absent || 0, color: "#C90606" },
        { name: "Leave", value: prog.leave || 0, color: "#B45309" },
        { name: "Made up", value: prog.made_up || 0, color: "#1D4ED8" },
      ].filter((x) => x.value > 0)
    : [
        { name: "Present", value: sum.attendance_present || 0, color: "#15803D" },
        { name: "Absent", value: Math.max((sum.attendance_total || 0) - (sum.attendance_present || 0), 0), color: "#C90606" },
      ].filter((x) => x.value > 0);
  const attDenom = hasProgress ? prog.total : sum.attendance_total || 0;

  const Stat = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2.5">
        <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: `${color}14`, color }}><Icon size={17} /></span>
        <div><div className="text-[17px] font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div><div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div></div>
      </div>
      {sub != null && <div className="mt-2 text-[12px]" style={{ color: TEXT_SECONDARY }}>{sub}</div>}
    </div>
  );
  const Info = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2">
      <Icon size={14} style={{ color: TEXT_MUTED }} className="mt-0.5" />
      <div><div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div><div className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{value || "—"}</div></div>
    </div>
  );

  return (
    <div className="w-full px-6 py-6 pb-16 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-5 text-sm font-semibold" style={{ color: TEXT_SECONDARY }}><ChevronLeft size={16} /> Back</button>

      {/* Header */}
      <div className="bg-white rounded-xl p-5 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          {s.image
            ? <img src={s.image} alt={s.name} onClick={() => setPhotoPreview(s.image)} className="object-cover rounded-full cursor-zoom-in" style={{ width: 56, height: 56, border: `2px solid ${BORDER}` }} title="Click to view full size" />
            : <span className="grid rounded-full place-items-center text-white font-bold" style={{ width: 56, height: 56, background: BRAND_RED, fontSize: 22 }}>{(s.name || "?").charAt(0).toUpperCase()}</span>}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{s.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>{(s.status || "").replace(/_/g, " ")}</span>
              {s.on_break && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#EFF6FF", color: "#1D4ED8" }} title={s.break_since ? `On break since ${s.break_since}` : "On break"}>On break</span>
              )}
              {s.scholarship_program && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#F5F3FF", color: "#6D28D9" }} title={`Scholarship: monthly Rs ${Number(s.scholarship_program.monthly_fee_override||0).toLocaleString()}`}>{s.scholarship_program.name}</span>
              )}
              {s.is_hostalize && <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#0891B2" }}><Home size={12} /> Hostelite</span>}
              {s.laptop_provided && <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#B45309" }}><Laptop size={12} /> Laptop</span>}
              {s.is_alumni && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#EDE9FE", color: "#6D28D9" }}><GraduationCap size={12} /> Alumni</span>}
              {s.is_brand_ambassador && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#FEF3C7", color: "#B45309" }}><Award size={12} /> Brand Ambassador</span>}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              {sum.enrollments} enrolment{sum.enrollments === 1 ? "" : "s"} ({sum.active} active){s.registration_no ? ` · Reg ${s.registration_no}` : ""}{s.email ? ` · ${s.email}` : ""}
            </div>
            {s.is_brand_ambassador && (
              <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap" style={{ color: TEXT_SECONDARY }}>
                {s.brand_ambassador_reason_label && <span>{s.brand_ambassador_reason_label}</span>}
                {s.promo_code && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <Award size={11} /> Promo: {s.promo_code}
                  </span>
                )}
              </div>
            )}
            <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap">
              {s.referral_code && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }} title="This student's personal referral code">
                  <Gift size={11} /> Referral code: {s.referral_code}
                </span>
              )}
              {s.referrer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ color: "#6D28D9", background: "#F5F3FF" }}>
                  <UserPlus size={12} /> Referred by: {`${s.referrer.first_name || ""} ${s.referrer.last_name || ""}`.trim() || "—"}
                  {s.referrer.referral_code ? ` (${s.referrer.referral_code})` : ""}
                  {s.referrer_reward_status ? ` · reward ${s.referrer_reward_status}` : ""}
                  {["paid", "completed"].includes(s.referrer_reward_status) ? null : (
                    <button
                      disabled={posting}
                      onClick={removeReferrer}
                      className="ml-1 font-bold hover:opacity-70"
                      title="Remove this referral (cancels any active reward)"
                      style={{ color: "#B91C1C" }}
                    >
                      ✕
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintIdCard
            variant="student"
            label="Print Card"
            person={{
              name: s.name,
              photoUrl: s.image,
              idLabel: "Student ID",
              idValue:
                s.registration_no ||
                ("STU-" + String(s.uuid || "").replace(/-/g, "").slice(0, 8).toUpperCase()),
              roleLine: primaryEnrol.course?.name || "",
              subLine: primaryEnrol.batch?.name ? `Batch: ${primaryEnrol.batch.name}${primaryEnrol.instructor ? ` · ${primaryEnrol.instructor}` : ""}` : "",
              dateLabel: "Enrolled",
              dateValue: primaryEnrol.join_date || primaryEnrol.enrolled_at || "",
              email: s.email,
              website: "techschool.codelab.pk",
              profileUrl: s.uuid ? `${window.location.origin}/u/${s.uuid}` : (s.registration_no || s.name),
            }}
          />
          <button onClick={() => setShowSwitch(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}><ArrowRightLeft size={14} /> Switch / Add batch</button>
          <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} title="Set who referred this student"><UserPlus size={14} /> Set referrer</button>
          <button disabled={posting} onClick={resendLogin} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }} title="Reset password and email login details to the student"><Send size={14} /> Send login details</button>
          {s.is_brand_ambassador
            ? <button disabled={posting} onClick={removeAmbassador} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><RotateCcw size={14} /> Remove ambassador</button>
            : <button onClick={() => setShowMakeBA(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: "#B45309" }}><Award size={14} /> Make ambassador</button>}
          {s.is_alumni
            ? <button disabled={posting} onClick={() => toggleAlumni(false)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><RotateCcw size={14} /> Remove alumni</button>
            : <button disabled={posting} onClick={() => toggleAlumni(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: "#6D28D9" }}><GraduationCap size={14} /> Mark alumni</button>}
          {s.on_break
            ? <button disabled={posting} onClick={toggleStudentBreak} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: "#15803D" }}><RotateCcw size={14} /> Resume</button>
            : <button disabled={posting} onClick={toggleStudentBreak} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><PauseCircle size={14} /> Put on break</button>}
          <button onClick={() => navigate(STUDENTS_EDIT.replace(":studentUuid", s.uuid))} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}><Pencil size={14} /> Edit</button>
        </div>
      </div>

      {/* Aggregate summary */}
      <div className="grid gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Layers} label="Enrolments" value={`${sum.active} / ${sum.enrollments}`} color="#7C3AED" sub="active / total" />
        <Stat icon={Wallet} label="Total fee pending" value={money(sum.pending)} color={BRAND_RED} sub={`${money(sum.collected)} paid of ${money(sum.billed)}`} />
        <Stat icon={CalendarCheck} label="Overall attendance" value={`${sum.attendance_percentage || 0}%`} color="#15803D" sub={`${sum.attendance_present || 0} present / ${sum.attendance_total || 0} sessions`} />
        <Stat icon={GraduationCap} label="Joined" value={(s.date_of_joining || "").slice(0, 10) || "—"} color="#1D4ED8" sub={s.guardian_name ? `Guardian: ${s.guardian_name}` : null} />
      </div>

      {/* Next month's fee projection */}
      {nextFee && (
        <div className="bg-white rounded-xl p-4 mb-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}><Wallet size={14} /> Next month&apos;s fee</h3>
            <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>{nextFee.billing_month}</span>
          </div>
          <div className="space-y-1">
            {(nextFee.items || []).map((it, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: TEXT_SECONDARY }}>
                  {it.label} (monthly)
                  {it.schedule_discount > 0 && (
                    <span style={{ color: TEXT_MUTED }}> · {money(it.base_amount)} − {money(it.schedule_discount)} discount</span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}>
                  {money(it.amount)}
                  {it.schedule_uuid && (
                    <button
                      onClick={() => setAdjustSchedule(it)}
                      className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
                      title="Adjust the standing monthly amount / discount"
                    >
                      Adjust
                    </button>
                  )}
                </span>
              </div>
            ))}
            {nextFee.laptop_fee > 0 && (
              <div className="flex items-center justify-between text-[12.5px]"><span style={{ color: TEXT_SECONDARY }}>Laptop fee</span><span style={{ color: TEXT_PRIMARY }}>{money(nextFee.laptop_fee)}</span></div>
            )}
            {nextFee.referral_discount > 0 && (
              <div className="flex items-center justify-between text-[12.5px]"><span style={{ color: "#15803D" }}>Referral discount</span><span style={{ color: "#15803D" }}>- {money(nextFee.referral_discount)}</span></div>
            )}
            <div className="flex items-center justify-between pt-1.5 mt-1.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Estimated total</span>
              {nextFee.is_waived
                ? <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#6D28D9" }}>Waived{nextFee.scholarship_program ? ` · ${nextFee.scholarship_program}` : ""}</span>
                : <span className="text-[15px] font-bold" style={{ color: BRAND_RED }}>{money(nextFee.total)}</span>}
            </div>
          </div>
          <p className="text-[10.5px] mt-2" style={{ color: TEXT_MUTED }}>Projection of the next monthly bill — generated automatically on the 1st.</p>
        </div>
      )}

      {/* Referrals this student MADE — the source of their referral
          discount. Each row can be removed (cancels that reward). */}
      {(s.referrals_made || []).length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-[13px] font-bold flex items-center gap-1.5 mb-2" style={{ color: TEXT_PRIMARY }}>
            <Gift size={14} /> Referrals made ({s.referrals_made.length})
          </h3>
          <div className="space-y-1.5">
            {s.referrals_made.map((r) => {
              const delivered = ["paid", "completed"].includes(r.reward_status);
              return (
                <div key={r.uuid} className="flex items-center justify-between gap-2 text-[12.5px] py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div className="min-w-0">
                    <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name || "—"}</span>
                    <span style={{ color: TEXT_MUTED }}>
                      {r.student_status ? ` · ${r.student_status}` : ""}
                      {r.reward_type ? ` · ${String(r.reward_type).replace(/_/g, " ")}` : " · no reward yet"}
                      {r.reward_status ? ` (${r.reward_status})` : ""}
                      {r.reward_amount ? ` · ${money(r.reward_amount)}/referral` : ""}
                      {r.total_credited > 0 ? ` · credited ${money(r.total_credited)} so far` : ""}
                    </span>
                  </div>
                  {!delivered && (
                    <button
                      disabled={posting}
                      onClick={async () => {
                        if (!window.confirm(`Remove ${r.name || "this student"}'s referral link to this student? Their reward is cancelled and the recurring discount stops.`)) return;
                        try {
                          await post({ path: `/student/${r.uuid}/remove-referrer`, body: {} }).unwrap();
                          notify("Referral removed."); refetch(); refetchNextFee();
                        } catch (e) { notify(e?.data?.message || "Could not remove the referral.", false); }
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0"
                      style={{ border: "1px solid #FCA5A5", color: "#B91C1C" }}
                      title="Remove this referral (cancels the reward and its discount)"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10.5px] mt-2" style={{ color: TEXT_MUTED }}>
            These referrals are why this student gets a &quot;Referral discount&quot; on their monthly fee. Removing one cancels its reward — already-delivered rewards can&apos;t be removed.
          </p>
        </div>
      )}

      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out" style={{ background: "rgba(15,23,42,0.85)" }} onClick={() => setPhotoPreview(null)}>
          <img src={photoPreview} alt="Student" className="object-contain rounded-2xl" style={{ maxWidth: "90vw", maxHeight: "85vh", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}

      {discountFor && (
        <DiscountModal
          installment={discountFor}
          onClose={() => setDiscountFor(null)}
          onDone={(msg) => { notify(msg); setDiscountFor(null); refetch(); refetchNextFee(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {adjustSchedule && (
        <AdjustScheduleModal
          item={adjustSchedule}
          onClose={() => setAdjustSchedule(null)}
          onDone={(msg) => { notify(msg); setAdjustSchedule(null); refetchNextFee(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {/* Laptop / assets — assign a laptop later, manage billing */}
      <StudentLaptopCard studentId={s.id} studentName={s.name} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Enrolments (each course + batch) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Attendance overview */}
          <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}><CalendarCheck size={14} /> Attendance overview</h3>
              <span className="text-[12px] font-bold" style={{ color: (sum.attendance_percentage || 0) >= 75 ? "#15803D" : BRAND_RED }}>{sum.attendance_percentage || 0}% present</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-center" style={{ minHeight: 160 }}>
                {attSlices.length === 0 ? (
                  <div className="text-[12px] text-center" style={{ color: TEXT_MUTED }}>No attendance recorded yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={attSlices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2}>
                        {attSlices.map((e2, i) => <Cell key={i} fill={e2.color} />)}
                      </Pie>
                      <ReTooltip formatter={(v, n) => [`${v}${attDenom ? ` of ${attDenom}` : ""}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-col justify-center gap-2">
                {attSlices.map((x) => (
                  <div key={x.name} className="flex items-center justify-between text-[12px]">
                    <span className="inline-flex items-center gap-2" style={{ color: TEXT_SECONDARY }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: x.color }} /> {x.name}
                    </span>
                    <span className="font-bold" style={{ color: TEXT_PRIMARY }}>{x.value}{attDenom ? ` (${Math.round((x.value / attDenom) * 100)}%)` : ""}</span>
                  </div>
                ))}
                {attSlices.length === 0 && <span className="text-[12px]" style={{ color: TEXT_MUTED }}>—</span>}
              </div>
            </div>

            {/* Per-batch attendance with teacher */}
            {enrollments.length > 0 && (
              <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                {enrollments.map((e, i) => {
                  const a = e.attendance || {};
                  const pctA = a.percentage || 0;
                  return (
                    <div key={i} className="flex items-center gap-3 text-[12px]">
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold" style={{ color: TEXT_PRIMARY }}>{e.course?.name || e.batch?.name || "—"}</div>
                        <div className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>{e.instructor ? `Teacher: ${e.instructor}` : "Teacher: —"}{e.batch?.timing ? ` · ${e.batch.timing}` : ""}</div>
                      </div>
                      <div style={{ width: 120 }}>
                        <div className="w-full rounded-full" style={{ height: 6, background: BORDER }}>
                          <div style={{ height: 6, width: `${pctA}%`, background: pctA >= 75 ? "#15803D" : BRAND_RED, borderRadius: 999 }} />
                        </div>
                      </div>
                      <span className="font-bold w-20 text-right" style={{ color: TEXT_SECONDARY }}>{a.present || 0}/{a.total || 0} · {pctA}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Courses & batches</h3>
          {enrollments.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}>No enrolments yet.</div>}
          {enrollments.map((e, i) => {
            const pct = e.course.duration_months ? Math.round((e.fees.months_paid / e.course.duration_months) * 100) : 0;
            return (
              <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${e.is_active ? "#BBF7D0" : BORDER}` }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid rounded-lg place-items-center" style={{ width: 32, height: 32, background: BRAND_RED_TINT, color: BRAND_RED }}><BookOpen size={15} /></span>
                    <div>
                      <div className="font-bold text-[14px]" style={{ color: TEXT_PRIMARY }}>{e.course.name || "—"}</div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{e.batch.name || "—"}{e.instructor ? ` · ${e.instructor}` : ""}{e.batch.timing ? ` · ${e.batch.timing}` : ""}{e.join_date ? ` · joined ${String(e.join_date).slice(0,10)}` : ""}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={e.is_active ? { background: "#F0FDF4", color: "#15803D" } : { background: SURFACE_HOVER, color: TEXT_MUTED }}>{e.is_active ? "Current" : "Past"}</span>
                    {e.is_active && e.batch?.uuid && (
                      <button
                        disabled={posting}
                        onClick={async () => {
                          if (!window.confirm(`Remove ${s.name} from ${e.batch.name}? This closes the enrollment and stops its monthly billing. Fees already attached stay for history.`)) return;
                          const note = window.prompt("Reason (optional):", "Added by mistake — meant to switch");
                          if (note === null) return;
                          try {
                            const res = await post({ path: `/student/${id}/remove-from-batch`, body: { batch_uuid: e.batch.uuid, ...(note.trim() ? { note: note.trim() } : {}) } }).unwrap();
                            notify(res?.message || "Removed from batch."); refetch(); refetchNextFee();
                          } catch (err) { notify(err?.data?.message || "Could not remove from the batch.", false); }
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ border: "1px solid #FCA5A5", color: "#B91C1C" }}
                        title="Remove this student from this batch entirely (closes the enrollment + stops its billing)"
                      >
                        Remove from batch
                      </button>
                    )}
                    {(!e.is_active || s.status === "dropout") && e.student_batch_uuid && (
                      <button
                        disabled={posting}
                        onClick={async () => {
                          try {
                            const res = await post({ path: `/student/student-batches/${e.student_batch_uuid}/toggle-teacher-visibility`, body: {} }).unwrap();
                            notify(res?.message || "Teacher visibility updated."); refetch();
                          } catch (err) { notify(err?.data?.message || "Could not update teacher visibility.", false); }
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                        style={e.visible_to_teacher
                          ? { border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#15803D" }
                          : { border: `1px solid ${BORDER}`, background: SURFACE_HOVER, color: TEXT_MUTED }}
                        title="Controls whether the TEACHER still sees this past student in their roster and attendance screens"
                      >
                        {e.visible_to_teacher ? "Visible to teacher" : "Hidden from teacher"}
                      </button>
                    )}
                  </span>
                </div>

                {/* per-enrolment mini stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="px-3 py-2 rounded-lg" style={{ background: SURFACE_HOVER }}>
                    <div className="text-[13px] font-bold" style={{ color: "#7C3AED" }}>{e.fees.months_paid}/{e.course.duration_months}</div>
                    <div className="text-[10px]" style={{ color: TEXT_MUTED }}>months paid</div>
                    <div className="w-full rounded-full mt-1" style={{ height: 5, background: BORDER }}><div style={{ height: 5, width: `${pct}%`, background: "#7C3AED", borderRadius: 999 }} /></div>
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ background: SURFACE_HOVER }}>
                    <div className="text-[13px] font-bold" style={{ color: e.fees.pending > 0 ? BRAND_RED : "#15803D" }}>{money(e.fees.pending)}</div>
                    <div className="text-[10px]" style={{ color: TEXT_MUTED }}>fee pending</div>
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ background: SURFACE_HOVER }}>
                    <div className="text-[13px] font-bold" style={{ color: "#15803D" }}>{e.attendance.percentage}%</div>
                    <div className="text-[10px]" style={{ color: TEXT_MUTED }}>attendance ({e.attendance.present}/{e.attendance.total})</div>
                  </div>
                </div>

                {/* fee schedule */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold" style={{ color: TEXT_SECONDARY }}>Fee schedule</span>
                  {e.student_batch_uuid && (
                    <button
                      onClick={() => setShiftTarget({ studentBatchUuid: e.student_batch_uuid, label: e.course?.name || e.batch?.name })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
                      title="Shift upcoming fee due dates (e.g. after a leave)"
                    >
                      <CalendarCheck size={12} /> Shift fee dates
                    </button>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead><tr style={{ color: TEXT_SECONDARY }}>{["Fee", "Amount", "Paid", "Due", "Status", ""].map((h, j) => <th key={j} className="px-2 py-1.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {e.fees.schedule.length === 0 && <tr><td colSpan={6} className="px-2 py-4 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No fee schedule.</td></tr>}
                    {e.fees.schedule.map((r, j) => {
                      const b = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                      const payments = r.payments || [];
                      const remaining = r.remaining != null ? r.remaining : Math.max((r.amount || 0) - (r.paid || 0), 0);
                      const rowKey = `${e.student_batch_uuid}-${r.installment_uuid}`;
                      const isOpen = !!openRows[rowKey];
                      // distinct methods used on this installment, for the inline chips
                      const methods = [...new Set(payments.map((p) => p.payment_method))];
                      return (
                        <React.Fragment key={j}>
                        <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td className="px-2 py-2" style={{ color: TEXT_PRIMARY }}>
                            <button
                              onClick={() => payments.length && toggleRow(rowKey)}
                              className="inline-flex items-center gap-1"
                              style={{ color: TEXT_PRIMARY, cursor: payments.length ? "pointer" : "default" }}
                            >
                              {payments.length > 0 && (isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                              {r.type}
                            </button>
                          </td>
                          <td className="px-2 py-2" style={{ color: TEXT_PRIMARY }}>{money(r.amount)}</td>
                          <td className="px-2 py-2" style={{ color: TEXT_SECONDARY }}>
                            {money(r.paid)}
                            {remaining > 0 && r.paid > 0 && (
                              <span className="block text-[10px]" style={{ color: BRAND_RED }}>{money(remaining)} left</span>
                            )}
                            {methods.length > 0 && (
                              <span className="flex flex-wrap gap-1 mt-1">
                                {methods.map((m) => (
                                  <span key={m} className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "#F1F5F9", color: "#475569" }}>{METHOD_LABELS[m] || m}</span>
                                ))}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-[12px]" style={{ color: TEXT_MUTED }}>{(r.due_date || "").slice(0, 10) || "—"}</td>
                          <td className="px-2 py-2"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: b.bg, color: b.fg }}>{r.status === "break" ? "On break" : r.status}</span></td>
                          <td className="px-2 py-2 text-right align-middle" style={{ minWidth: 230 }}>
                            <span className="flex flex-wrap items-center gap-1.5 justify-end">
                              <button onClick={() => downloadChallanFor(r.installment_uuid)} disabled={challanBusy === `dl-${r.installment_uuid}`} title="Download challan" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#15803D" }}>
                                {challanBusy === `dl-${r.installment_uuid}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                              </button>
                              <button onClick={() => sendChallanFor(r.installment_uuid, "email")} disabled={challanBusy === `email-${r.installment_uuid}`} title="Email challan to student" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}>
                                {challanBusy === `email-${r.installment_uuid}` ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                              </button>
                              <button onClick={() => sendChallanFor(r.installment_uuid, "whatsapp")} disabled={challanBusy === `whatsapp-${r.installment_uuid}`} title="Send challan on WhatsApp" className="inline-flex items-center p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#059669" }}>
                                {challanBusy === `whatsapp-${r.installment_uuid}` ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                              </button>
                              {r.status !== "paid" && (
                                <>
                                  <button
                                    onClick={() => setDueDateTarget({ installment_uuid: r.installment_uuid, due_date: (r.due_date || "").slice(0, 10), label: r.type })}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                    style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
                                    title="Change due date"
                                  >
                                    <CalendarCheck size={12} /> Date
                                  </button>
                                  <button
                                    onClick={() => setRecordTarget({
                                      studentBatchUuid: e.student_batch_uuid,
                                      installmentIndex: j,
                                      installment: { installment_uuid: r.installment_uuid, amount: r.amount, paid_amount: r.paid, remaining },
                                    })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                                    style={{ background: BRAND_RED }}
                                  >
                                    <Plus size={12} /> Record
                                  </button>
                                </>
                              )}
                              {canManageRecords && r.status === "paid" && (
                                <button
                                  onClick={() => resetInstallment(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #FCD34D", color: "#B45309", background: "#FFFBEB" }}
                                  title="Undo payments → pending"
                                >
                                  <RotateCcw size={12} /> Reset
                                </button>
                              )}
                              {canManageRecords && (
                                <button
                                  onClick={() => deleteInstallment(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #FCA5A5", color: "#B91C1C", background: BRAND_RED_TINT }}
                                  title="Delete this fee record (e.g. leave month)"
                                >
                                  <X size={12} /> Delete
                                </button>
                              )}
                              {canManageRecords && r.status === "break" && (
                                <button
                                  onClick={() => toggleBreak(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}
                                  title="Remove break → pending"
                                >
                                  <Repeat size={12} /> Unbreak
                                </button>
                              )}
                              {canManageRecords && r.status !== "break" && r.status !== "paid" && (
                                <button
                                  onClick={() => toggleBreak(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }}
                                  title="Student on break — not owed for this month"
                                >
                                  <Repeat size={12} /> Break
                                </button>
                              )}
                              {canManageRecords && r.status === "waived" && (
                                <button
                                  onClick={() => toggleWaive(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}
                                  title="Remove waiver → pending"
                                >
                                  <Gift size={12} /> Unwaive
                                </button>
                              )}
                              {canManageRecords && r.status !== "waived" && r.status !== "paid" && (
                                <button
                                  onClick={() => toggleWaive(r.installment_uuid)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#6D28D9" }}
                                  title="Waive this fee — relief, not owed"
                                >
                                  <Gift size={12} /> Waive
                                </button>
                              )}
                              {canManageRecords && r.status !== "waived" && r.status !== "paid" && remaining > 0 && (
                                <button
                                  onClick={() => setDiscountFor({ installment_uuid: r.installment_uuid, remaining })}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                  style={{ border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309" }}
                                  title="Discount — write off part or all of the remaining amount with a reason (works even when payments exist)"
                                >
                                  <Gift size={12} /> Discount
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                        {isOpen && payments.length > 0 && (
                          <tr style={{ background: SURFACE_HOVER }}>
                            <td colSpan={6} className="px-3 py-2">
                              <table className="w-full text-[12px]">
                                <thead><tr style={{ color: TEXT_MUTED }}>{["Amount", "Method", "Date", "Reference", "Recorded by", "Notes"].map((h, k) => <th key={k} className="px-2 py-1 text-left font-semibold text-[10px]">{h}</th>)}</tr></thead>
                                <tbody>
                                  {payments.map((p, k) => (
                                    <tr key={p.uuid || k} style={{ borderTop: `1px solid ${BORDER}` }}>
                                      <td className="px-2 py-1.5 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(p.amount)}</td>
                                      <td className="px-2 py-1.5" style={{ color: TEXT_SECONDARY }}>
                                        {METHOD_LABELS[p.payment_method] || p.payment_method}
                                        {p.account_name && <span className="block text-[10px]" style={{ color: TEXT_MUTED }}>{p.account_name}</span>}
                                      </td>
                                      <td className="px-2 py-1.5" style={{ color: TEXT_SECONDARY }}>{fmtDateTime(p.paid_at)}</td>
                                      <td className="px-2 py-1.5" style={{ color: TEXT_SECONDARY }}>{p.payment_reference || "—"}</td>
                                      <td className="px-2 py-1.5" style={{ color: TEXT_SECONDARY }}>{p.recorded_by || "—"}</td>
                                      <td className="px-2 py-1.5" style={{ color: TEXT_SECONDARY }}>{p.notes || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Assignments & performance (graded work + weekly grades) */}
          <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Assignments & performance</h3>
          <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-[11px] font-bold mb-2 flex items-center gap-1.5" style={{ color: TEXT_SECONDARY }}><FileText size={13} /> Graded assignments</div>
            {(mgmt?.assignments || []).length === 0 ? (
              <div className="text-[12px] py-3 text-center" style={{ color: TEXT_MUTED }}>No graded assignments yet.</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead><tr style={{ color: TEXT_SECONDARY }}>{["Title", "Batch", "Score", "Feedback", "Graded"].map((h, j) => <th key={j} className="px-2 py-1.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
                <tbody>
                  {(mgmt.assignments).map((a, i) => {
                    const pct = a.max_marks ? Math.round((a.marks / a.max_marks) * 100) : null;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="px-2 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{a.title}</td>
                        <td className="px-2 py-2" style={{ color: TEXT_SECONDARY }}>{a.batch || "—"}</td>
                        <td className="px-2 py-2 font-bold" style={{ color: pct != null && pct >= 50 ? "#15803D" : BRAND_RED }}>{a.marks}<span style={{ color: TEXT_MUTED, fontWeight: 400 }}>/{a.max_marks}</span></td>
                        <td className="px-2 py-2" style={{ color: TEXT_SECONDARY }}>{a.feedback || "—"}</td>
                        <td className="px-2 py-2" style={{ color: TEXT_MUTED }}>{a.graded_at ? String(a.graded_at).slice(0, 10) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="text-[11px] font-bold mt-4 mb-2 flex items-center gap-1.5" style={{ color: TEXT_SECONDARY }}><Award size={13} /> Weekly performance</div>
            {(mgmt?.performance || []).length === 0 ? (
              <div className="text-[12px] py-3 text-center" style={{ color: TEXT_MUTED }}>No performance grades yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(mgmt.performance).map((p, i) => {
                  const g = String(p.grade_status || "").toUpperCase();
                  const good = ["A", "A+", "B"].includes(g);
                  const mid = ["C", "D"].includes(g);
                  const col = good ? { fg: "#15803D", bg: "#F0FDF4" } : mid ? { fg: "#B45309", bg: "#FFFBEB" } : { fg: BRAND_RED, bg: BRAND_RED_TINT };
                  return (
                    <div key={i} className="rounded-lg p-2.5 min-w-[120px]" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }} title={p.remarks || ""}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>Week {p.week_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ color: col.fg, background: col.bg }}>{g || "—"}</span>
                      </div>
                      {p.remarks && <div className="text-[11px] mt-1 line-clamp-2" style={{ color: TEXT_SECONDARY }}>{p.remarks}</div>}
                      {p.teacher && <div className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>{p.teacher}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl p-4 self-start" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-[13px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Profile</h3>
          <div className="grid grid-cols-1 gap-3">
            <Info icon={Mail} label="Email" value={s.email} />
            <Info icon={Phone} label="Phone" value={s.contact ? <PhoneActions number={s.contact} name={s.name} /> : "—"} />
            <Info icon={CreditCard} label="CNIC" value={s.cnic} />
            <Info icon={User} label="Gender" value={s.gender} />
            <Info icon={GraduationCap} label="Qualification" value={s.qualification} />
            <Info icon={MapPin} label="City" value={s.city} />
            <Info icon={User} label="Guardian" value={s.guardian_name ? <>{s.guardian_name}{s.guardian_phone ? <> · <PhoneActions number={s.guardian_phone} name={s.guardian_name} /></> : null}</> : "—"} />
            <Info icon={MapPin} label="Address" value={s.address} />
          </div>

          {transfers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[13px] font-bold mb-2 flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}><History size={14} /> Batch / course history</h3>
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <div key={i} className="text-[12px] p-2.5 rounded-lg" style={{ background: SURFACE_HOVER }}>
                    <div className="font-semibold capitalize" style={{ color: TEXT_PRIMARY }}>{(t.action || "").replace(/_/g, " ")}</div>
                    <div style={{ color: TEXT_SECONDARY }}>
                      {t.from_course || t.from_batch ? `${t.from_course || ""}${t.from_batch ? ` (${t.from_batch})` : ""} → ` : ""}
                      {t.to_course || "—"}{t.to_batch ? ` (${t.to_batch})` : ""}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>
                      Fee: {t.fee_action}{t.created_at ? ` · ${String(t.created_at).slice(0, 10)}` : ""}{t.note ? ` · ${t.note}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSwitch && <SwitchBatchModal studentUuid={id} onClose={() => setShowSwitch(false)} onDone={(m) => { notify(m); setShowSwitch(false); refetch(); }} onError={(m) => notify(m, false)} />}
      {showAssign && <AssignAmbassadorModal studentUuid={id} onClose={() => setShowAssign(false)} onDone={(m) => { notify(m); setShowAssign(false); refetch(); }} onError={(m) => notify(m, false)} />}
      {showMakeBA && <MakeAmbassadorModal studentUuid={id} onClose={() => setShowMakeBA(false)} onDone={(m) => { notify(m); setShowMakeBA(false); refetch(); }} onError={(m) => notify(m, false)} />}
      {dueDateTarget && <DueDateModal target={dueDateTarget} onClose={() => setDueDateTarget(null)} onDone={(m) => { notify(m); setDueDateTarget(null); refetch(); }} onError={(m) => notify(m, false)} />}
      {shiftTarget && <ShiftFeeDatesModal target={shiftTarget} onClose={() => setShiftTarget(null)} onDone={(m) => { notify(m); setShiftTarget(null); refetch(); }} onError={(m) => notify(m, false)} />}

      <RecordPaymentModal
        isOpen={!!recordTarget}
        onClose={() => setRecordTarget(null)}
        studentBatchUuid={recordTarget?.studentBatchUuid}
        installment={recordTarget?.installment}
        installmentIndex={recordTarget?.installmentIndex}
        onRecorded={() => { notify("Payment recorded."); refetch(); }}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg" style={{ background: toast.ok ? "#15803D" : BRAND_RED }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch / Add batch modal                                            */
/* ------------------------------------------------------------------ */
function SwitchBatchModal({ studentUuid, onClose, onDone, onError }) {
  const [action, setAction] = useState("switch_batch"); // add | switch_batch | switch_course
  const [batchUuid, setBatchUuid] = useState(null);
  const [feeAction, setFeeAction] = useState("carry"); // carry | new | none
  const [newTotal, setNewTotal] = useState("");
  const [newInstallments, setNewInstallments] = useState("1");
  const [note, setNote] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const batches = batchData?.data || [];
  const batchOptions = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.teacher_name ? ` · ${b.teacher_name}` : ""}${b.course_name ? ` · ${b.course_name}` : ""}${b.timing ? ` · ${b.timing}` : ""}` }));

  const submit = async () => {
    if (!batchUuid) { onError("Pick the destination batch."); return; }
    if (feeAction === "new" && !(parseFloat(newTotal) > 0)) { onError("Enter the new fee amount."); return; }
    try {
      await post({
        path: `/student/${studentUuid}/transfer`,
        body: {
          to_batch_uuid: batchUuid,
          action,
          fee_action: feeAction,
          new_total_fee: feeAction === "new" ? parseFloat(newTotal) : undefined,
          new_installments: feeAction === "new" ? parseInt(newInstallments || "1", 10) : undefined,
          note: note || undefined,
        },
      }).unwrap();
      onDone("Student transferred.");
    } catch (e) { onError(e?.data?.message || "Transfer failed."); }
  };

  const cell = { background: "#F8FAFC", border: "1px solid #EEF2F6", color: "#0F172A", fontFamily: "'Montserrat', sans-serif" };
  const Seg = ({ id, label, val, set }) => (
    <button onClick={() => set(id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
      style={val === id ? { background: "#C90606", color: "#fff" } : { background: "#fff", color: "#475569", border: "1px solid #EEF2F6" }}>{label}</button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Repeat size={17} /> Switch / Add batch</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Action</div>
            <div className="flex gap-2 flex-wrap">
              <Seg id="switch_batch" label="Switch batch" val={action} set={setAction} />
              <Seg id="switch_course" label="Switch course" val={action} set={setAction} />
              <Seg id="add" label="Add (keep current)" val={action} set={setAction} />
            </div>
          </div>
          <SearchableSelect options={batchOptions} value={batchUuid} onChange={setBatchUuid} placeholder="Search destination batch…" label="Destination batch" />
          <div>
            <div className="text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Fee</div>
            <div className="flex gap-2 flex-wrap">
              <Seg id="carry" label="Carry existing fee" val={feeAction} set={setFeeAction} />
              <Seg id="new" label="New fee" val={feeAction} set={setFeeAction} />
              <Seg id="none" label="No change" val={feeAction} set={setFeeAction} />
            </div>
          </div>
          {feeAction === "new" && (
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" placeholder="Total fee" value={newTotal} onChange={(e) => setNewTotal(e.target.value)} className="px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
              <input type="number" min="1" placeholder="Installments" value={newInstallments} onChange={(e) => setNewInstallments(e.target.value)} className="px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #EEF2F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: "1px solid #EEF2F6", color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !batchUuid} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "linear-gradient(135deg, #C90606, #A30505)", opacity: (isLoading || !batchUuid) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assign ambassador modal                                             */
/* ------------------------------------------------------------------ */
/*
 * Adjust a monthly fee schedule's standing amount / recurring discount —
 * fixes mistyped enrollment values (e.g. 8,001) or changed agreements.
 * PATCH finance/monthly-fee-schedules/{uuid}/amounts. Applies from the
 * next generated bill; the current installment is corrected separately
 * via the fee tab's Discount action.
 */
function AdjustScheduleModal({ item, onClose, onDone, onError }) {
  const [amount, setAmount] = useState(String(item.base_amount ?? ""));
  const [discount, setDiscount] = useState(String(item.schedule_discount ?? 0));
  const [note, setNote] = useState("");
  const [patch, { isLoading }] = usePatchMutation();

  const submit = async () => {
    const a = parseFloat(amount); const d = parseFloat(discount);
    if (!(a >= 0)) { onError("Enter a valid monthly amount."); return; }
    if (!(d >= 0)) { onError("Enter a valid discount (0 for none)."); return; }
    if (!note.trim()) { onError("A reason note is required."); return; }
    try {
      const res = await patch({
        path: `finance/monthly-fee-schedules/${item.schedule_uuid}/amounts`,
        body: { amount: a, discount: d, note: note.trim() },
      }).unwrap();
      onDone(res?.message || "Monthly schedule updated.");
    } catch (e) {
      const errs = e?.data?.errors;
      onError((errs && Object.values(errs)[0]?.[0]) || e?.data?.message || "Could not update the schedule.");
    }
  };

  const inp = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
  const net = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(discount) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Adjust monthly fee — {item.label}</span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Changes apply from the <b>next generated bill</b>. To fix the current unpaid installment too, use the Discount action on the Fees tab.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Monthly amount (Rs)</label>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inp} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Recurring discount (Rs)</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inp} />
            </div>
          </div>
          <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}>Net per month: <b style={{ color: TEXT_PRIMARY }}>Rs {net.toLocaleString()}</b> (before any referral credit)</div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Reason / note (required)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. fee was mistyped at enrollment" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inp} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !note.trim()} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND_RED, opacity: (isLoading || !note.trim()) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignAmbassadorModal({ studentUuid, onClose, onDone, onError }) {
  const [q, setQ] = useState("");
  const [ambUuid, setAmbUuid] = useState(null);
  const [post, { isLoading }] = usePostMutation();

  // Students AND employees/teachers can be referrers (brand ambassadors
  // included). referrer-candidates searches both; employees earn cash.
  const { data } = useGetQuery({ path: `student/referrer-candidates?q=${encodeURIComponent(q)}&per_page=50` });
  const list = data?.data || [];
  const options = list
    .filter((a) => a.uuid !== studentUuid) // can't refer themselves
    .map((a) => ({
      value: a.uuid,
      label: `${a.name || a.email}${a.is_brand_ambassador ? " · Ambassador" : a.type === "employee" ? " · Employee" : ""}`,
      avatarUrl: a.image || null,
    }));

  const submit = async () => {
    if (!ambUuid) { onError("Pick a referrer."); return; }
    try {
      await post({ path: `/student/${studentUuid}/assign-ambassador`, body: { ambassador_uuid: ambUuid } }).unwrap();
      onDone("Referrer assigned.");
    } catch (e) { onError(e?.data?.message || "Could not assign."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><UserPlus size={17} /> Set referrer</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12px] mb-3" style={{ color: "#475569" }}>Record who referred this student. Any existing student or employee can be a referrer; if they qualify they earn leaderboard / reward credit (employees are paid in cash).</p>
          <SearchableSelect options={options} value={ambUuid} onChange={setAmbUuid} onSearch={setQ} showAvatars placeholder="Search students or employees…" label="Referrer" />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #EEF2F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: "1px solid #EEF2F6", color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !ambUuid} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "linear-gradient(135deg, #C90606, #A30505)", opacity: (isLoading || !ambUuid) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shift ALL upcoming fee due dates for a batch (e.g. after a leave)   */
/* ------------------------------------------------------------------ */
function ShiftFeeDatesModal({ target, onClose, onDone, onError }) {
  const [days, setDays] = useState("15");
  const [patch, { isLoading }] = usePatchMutation();

  const submit = async () => {
    const n = parseInt(days, 10);
    if (!n || n === 0) { onError("Enter a non-zero number of days."); return; }
    try {
      await patch({ path: `finance/student-batches/${target.studentBatchUuid}/shift-future-fee-dates`, body: { shift_days: n } }).unwrap();
      onDone(`Upcoming fee dates shifted by ${n} day${Math.abs(n) === 1 ? "" : "s"}.`);
    } catch (e) { onError(e?.data?.message || "Could not shift fee dates."); }
  };

  const cell = { background: "#F8FAFC", border: "1px solid #EEF2F6", color: "#0F172A", fontFamily: "'Montserrat', sans-serif" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><CalendarCheck size={17} /> Shift fee dates</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: "#475569" }}>Push all <b>upcoming (unpaid)</b> installments for <b>{target.label}</b> forward by a number of days — e.g. a 15-day leave. Use a negative number to pull them earlier. Paid installments are untouched.</p>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Shift by (days)</label>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="15" />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #EEF2F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: "1px solid #EEF2F6", color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "linear-gradient(135deg, #C90606, #A30505)", opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Shift
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Change installment due date                                         */
/* ------------------------------------------------------------------ */
function DueDateModal({ target, onClose, onDone, onError }) {
  const [date, setDate] = useState(target.due_date || "");
  const [patch, { isLoading }] = usePatchMutation();

  const submit = async () => {
    if (!date) { onError("Pick a new due date."); return; }
    try {
      await patch({ path: `finance/installments/${target.installment_uuid}/due-date`, body: { new_due_date: date } }).unwrap();
      onDone("Due date updated.");
    } catch (e) { onError(e?.data?.message || "Could not change due date."); }
  };

  const cell = { background: "#F8FAFC", border: "1px solid #EEF2F6", color: "#0F172A", fontFamily: "'Montserrat', sans-serif" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><CalendarCheck size={17} /> Change due date</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px]" style={{ color: "#475569" }}>{target.label} installment — set a new due date (paid installments can&apos;t be shifted).</p>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #EEF2F6" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: "1px solid #EEF2F6", color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "linear-gradient(135deg, #C90606, #A30505)", opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Make brand ambassador modal (gives the student the title + a       */
/* promo code that plugs into the referral system)                    */
/* ------------------------------------------------------------------ */
const MANUAL_BA_REASONS = [
  { value: "social_media_advocacy", label: "Social media advocacy" },
  { value: "seminar_speaker", label: "Seminar speaker" },
  { value: "community_leader", label: "Community leader" },
  { value: "help_desk", label: "Help desk / event support" },
  { value: "reels_content", label: "Reels / content creation" },
  { value: "other", label: "Other" },
];

function MakeAmbassadorModal({ studentUuid, onClose, onDone, onError }) {
  const [reason, setReason] = useState("social_media_advocacy");
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [issued, setIssued] = useState(null);
  const [post, { isLoading }] = usePostMutation();

  const submit = async () => {
    try {
      const res = await post({
        path: `/user/${studentUuid}/promote-brand-ambassador`,
        body: {
          reason,
          notes: notes || undefined,
          promo_code: promoCode.trim() || undefined,
        },
      }).unwrap();
      const code = res?.data?.promo_code;
      if (code) { setIssued(code); }
      else { onDone("Brand ambassador title given."); }
    } catch (e) { onError(e?.data?.message || "Could not promote."); }
  };

  const cell = { background: "#F8FAFC", border: "1px solid #EEF2F6", color: "#0F172A", fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Award size={17} /> Make brand ambassador</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>

        {issued ? (
          <div className="px-5 py-6 text-center">
            <CheckCircle2 size={34} className="mx-auto mb-2" style={{ color: "#15803D" }} />
            <p className="text-[13px] mb-3" style={{ color: "#475569" }}>Ambassador title granted. Their promo code:</p>
            <div className="inline-block px-4 py-2 rounded-lg text-[18px] font-bold tracking-wider" style={{ background: "#FEF2F2", color: "#C90606" }}>{issued}</div>
            <div className="px-0 py-4 flex justify-center">
              <button onClick={() => onDone("Brand ambassador created.")} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #C90606, #A30505)" }}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              <p className="text-[12px]" style={{ color: "#475569" }}>Gives this student the brand-ambassador title and a promo code others can use — tracked in the referral leaderboard.</p>
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Reason</div>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                  {MANUAL_BA_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Promo code <span style={{ color: "#94A3B8" }}>(optional — auto-generated if blank)</span></div>
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. KASPER10" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none tracking-wider" style={cell} />
              </div>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
            <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid #EEF2F6" }}>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: "1px solid #EEF2F6", color: "#475569" }}>Cancel</button>
              <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: "linear-gradient(135deg, #C90606, #A30505)", opacity: isLoading ? 0.6 : 1 }}>
                {isLoading && <Loader2 size={15} className="animate-spin" />} Make ambassador
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
