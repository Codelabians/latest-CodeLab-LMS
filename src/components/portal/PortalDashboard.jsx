import {
  Loader2, Award, Home, Laptop, CalendarCheck, Wallet, CalendarDays, BookOpen, Gift, CalendarClock,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import PortalHero from "./PortalHero";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();

const Card = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center rounded-lg" style={{ width: 36, height: 36, background: `${color}14`, color }}><Icon size={17} /></span>
      <div>
        <div className="text-[17px] font-bold" style={{ color: "#0F172A" }}>{value}</div>
        <div className="text-[11px]" style={{ color: "#94A3B8" }}>{label}</div>
      </div>
    </div>
    {sub != null && <div className="mt-2 text-[12px]" style={{ color: "#475569" }}>{sub}</div>}
  </div>
);

export default function PortalDashboard() {
  const { data: prof, isLoading } = useGetQuery({ path: "/student-portal/profile" });
  const { data: dash } = useGetQuery({ path: "/student-portal/dashboard" });
  const { data: nextFeeData } = useGetQuery({ path: "/student-portal/next-month-fee" });
  const nextFee = nextFeeData?.data;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  }

  const d = prof?.data || {};
  const s = d.student || {};
  const sum = d.summary || {};
  const enrollments = d.enrollments || [];
  const rewards = d.rewards || [];
  const rewardsSummary = d.rewards_summary || {};
  const benefitText = d.rewards_benefit_text || "";
  const referralCode = d.referral_code || "";
  const rewardAmount = d.reward_amount;
  const dd = dash?.data || {};
  const up = dd.upcoming_session;
  const makeup = dd.upcoming_makeup?.data || dd.upcoming_makeup;
  const name = s.name || "Student";

  // ---- Hero: derive the student's course journey + achievements ----
  const activeEnroll = enrollments.find((e) => e.is_active) || enrollments[0] || null;
  const heroCourse = activeEnroll?.course?.name || null;
  const heroProgress = Math.round(
    activeEnroll?.attendance?.percentage ?? sum.attendance_percentage ?? 0
  );
  // Course stages become the hurdles; cleared by attendance progress.
  const heroMilestones = [
    { label: "Enrolled", threshold: 0 },
    { label: "Foundations", threshold: 25 },
    { label: "Core", threshold: 50 },
    { label: "Assessment", threshold: 75 },
    { label: "Certified", threshold: 100 },
  ].map((m) => ({ label: m.label, done: heroProgress >= m.threshold }));

  const rewardCount = rewardsSummary.count ?? rewards.length ?? 0;
  const completedCourses = enrollments.filter((e) => !e.is_active).length;
  const heroAchievements = [];
  if (sum.attendance_percentage)
    heroAchievements.push({ icon: "attendance", label: `${Math.round(sum.attendance_percentage)}% attendance` });
  if (completedCourses > 0)
    heroAchievements.push({ icon: "trophy", label: `${completedCourses} completed` });
  if (enrollments.length > 0)
    heroAchievements.push({ icon: "courses", label: `${enrollments.length} course${enrollments.length === 1 ? "" : "s"}` });
  if (rewardCount > 0)
    heroAchievements.push({ icon: "rewards", label: `${rewardCount} reward${rewardCount === 1 ? "" : "s"}` });
  if (s.is_brand_ambassador)
    heroAchievements.push({ icon: "ambassador", label: "Brand Ambassador" });
  if (sum.billed > 0 && (sum.pending || 0) === 0)
    heroAchievements.push({ icon: "fees", label: "Fees cleared" });

  return (
    <div className="space-y-4">
      {/* Animated welcome hero — course journey + achievements */}
      <PortalHero
        name={name}
        courseName={heroCourse}
        progress={heroProgress}
        milestones={heroMilestones}
        achievements={heroAchievements}
      />

      {/* Profile header */}
      <div className="bg-white rounded-xl p-5 flex flex-wrap items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
        {s.image
          ? <img src={s.image} alt={name} className="rounded-full object-cover" style={{ width: 56, height: 56, border: `2px solid ${BORDER}` }} />
          : <span className="grid place-items-center rounded-full text-white font-bold" style={{ width: 56, height: 56, background: BRAND, fontSize: 22 }}>{name.charAt(0).toUpperCase()}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>{name}</h1>
            {s.status && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize" style={{ background: "#F8FAFC", color: "#475569" }}>{String(s.status).replace(/_/g, " ")}</span>}
            {s.is_hostalize && <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#0891B2" }}><Home size={12} /> Hostelite</span>}
            {s.laptop_provided && <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#B45309" }}><Laptop size={12} /> Laptop</span>}
            {s.is_brand_ambassador && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#FEF3C7", color: "#B45309" }}><Award size={12} /> Brand Ambassador</span>}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "#94A3B8" }}>{s.email}{s.registration_no ? ` · Reg ${s.registration_no}` : ""}</div>
          {s.is_brand_ambassador && s.promo_code && (
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: "#FEF2F2", color: BRAND }}>
              <Award size={11} /> Promo code: {s.promo_code}{s.brand_ambassador_reason_label ? ` · ${s.brand_ambassador_reason_label}` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Referral code */}
      {referralCode && (
        <div className="rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <Gift size={18} style={{ color: BRAND }} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold" style={{ color: BRAND }}>Your referral code</div>
            <div className="text-[20px] font-bold tracking-wide" style={{ color: "#0F172A" }}>{referralCode}</div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(referralCode)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: BRAND }}
          >
            Copy
          </button>
          {rewardAmount ? (
            <div className="w-full text-[12.5px]" style={{ color: "#7F1D1D" }}>
              Share it — you earn {money(rewardAmount)} for every new student who enrols using your code.
            </div>
          ) : null}
        </div>
      )}

      {/* Next month's fee — due date, amount + breakdown */}
      {nextFee && (
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-bold flex items-center gap-1.5" style={{ color: "#0F172A" }}><Wallet size={14} style={{ color: BRAND }} /> Next month&apos;s fee</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F8FAFC", color: "#475569" }}>{nextFee.billing_month}</span>
          </div>
          <div className="space-y-1">
            {(nextFee.items || []).map((it, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]"><span style={{ color: "#475569" }}>{it.label} (monthly)</span><span style={{ color: "#0F172A" }}>{money(it.amount)}</span></div>
            ))}
            {nextFee.laptop_fee > 0 && (
              <div className="flex items-center justify-between text-[12.5px]"><span style={{ color: "#475569" }}>Laptop fee</span><span style={{ color: "#0F172A" }}>{money(nextFee.laptop_fee)}</span></div>
            )}
            {nextFee.referral_discount > 0 && (
              <div className="flex items-center justify-between text-[12.5px]"><span style={{ color: "#15803D" }}>Referral discount</span><span style={{ color: "#15803D" }}>- {money(nextFee.referral_discount)}</span></div>
            )}
            <div className="flex items-center justify-between pt-1.5 mt-1.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="text-[13px] font-bold" style={{ color: "#0F172A" }}>Estimated total</span>
              {nextFee.is_waived
                ? <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#6D28D9" }}>Waived{nextFee.scholarship_program ? ` · ${nextFee.scholarship_program}` : ""}</span>
                : <span className="text-[15px] font-bold" style={{ color: BRAND }}>{money(nextFee.total)}</span>}
            </div>
          </div>
          <p className="text-[10.5px] mt-2" style={{ color: "#94A3B8" }}>Your next monthly bill, generated automatically on the 1st.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={CalendarCheck} label="Attendance" value={`${sum.attendance_percentage || 0}%`} color="#15803D" sub={`${sum.attendance_present || 0} / ${sum.attendance_total || 0} sessions`} />
        <Card icon={Wallet} label="Fee pending" value={money(sum.pending)} color={BRAND} sub={`${money(sum.collected)} paid of ${money(sum.billed)}`} />
        <Card icon={CalendarDays} label="Pending leaves" value={dd.pending_leaves ?? 0} color="#7C3AED" sub="awaiting approval" />
        <Card icon={Gift} label="Rewards" value={rewardsSummary.count ?? rewards.length ?? 0} color="#1D4ED8" sub={rewardsSummary.total ? `${money(rewardsSummary.total)} total` : "referral rewards"} />
      </div>

      {/* Upcoming */}
      {(up || makeup) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {up && (
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-1 text-[12px] font-bold" style={{ color: "#0F172A" }}><CalendarClock size={15} style={{ color: BRAND }} /> Next class</div>
              <div className="text-[13px]" style={{ color: "#475569" }}>{up.course_name || up.batch_name}{up.batch_name && up.course_name ? ` · ${up.batch_name}` : ""}{up.teacher_name ? ` · ${up.teacher_name}` : ""}</div>
              <div className="text-[12px]" style={{ color: "#94A3B8" }}>{up.session_date}{up.mode ? ` · ${up.mode}` : ""}</div>
              {up.meeting_link && <a href={up.meeting_link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[12px] font-semibold" style={{ color: BRAND }}>Join link →</a>}
            </div>
          )}
          {makeup && (
            <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-1 text-[12px] font-bold" style={{ color: "#0F172A" }}><RefreshIcon /> Upcoming makeup</div>
              <div className="text-[13px]" style={{ color: "#475569" }}>{makeup.topic || "Makeup class"}</div>
              <div className="text-[12px]" style={{ color: "#94A3B8" }}>{makeup.scheduled_date}{makeup.scheduled_time ? ` · ${makeup.scheduled_time}` : ""}</div>
            </div>
          )}
        </div>
      )}

      {/* Batches */}
      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>My courses & batches</h3>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No active enrolments.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {enrollments.map((e, i) => (
              <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${e.is_active ? "#BBF7D0" : BORDER}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid place-items-center rounded-lg" style={{ width: 30, height: 30, background: "#FEF2F2", color: BRAND }}><BookOpen size={14} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] truncate" style={{ color: "#0F172A" }}>{e.course?.name || "—"}</div>
                    <div className="text-[11px] truncate" style={{ color: "#94A3B8" }}>{e.batch?.name || "—"}{e.batch?.timing ? ` · ${e.batch.timing}` : ""}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={e.is_active ? { background: "#F0FDF4", color: "#15803D" } : { background: "#F8FAFC", color: "#94A3B8" }}>{e.is_active ? "Active" : "Past"}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span style={{ color: "#475569" }}>Teacher: <b>{e.instructor || "—"}</b></span>
                  <span style={{ color: "#475569" }}>Attendance: <b style={{ color: (e.attendance?.percentage || 0) >= 75 ? "#15803D" : BRAND }}>{e.attendance?.percentage || 0}%</b></span>
                </div>
                {e.fees && (
                  <div className="mt-1 text-[12px]" style={{ color: e.fees.pending > 0 ? BRAND : "#15803D" }}>{e.fees.pending > 0 ? `Fee pending: ${money(e.fees.pending)}` : "Fee cleared"}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards benefit blurb (admin-configured) */}
      {benefitText && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <Gift size={18} style={{ color: "#1D4ED8", marginTop: 1 }} />
          <div>
            <div className="text-[12.5px] font-bold mb-0.5" style={{ color: "#1D4ED8" }}>Rewards & referrals</div>
            <p className="text-[12.5px]" style={{ color: "#1E3A8A" }}>{benefitText}</p>
          </div>
        </div>
      )}

      {/* Rewards detail */}
      {rewards.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>My rewards</h3>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[12px]">
              <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Type", "Amount", "Status", "Referred", "Date"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {rewards.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2 capitalize" style={{ color: "#0F172A" }}>{String(r.reward_type || "").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: "#0F172A" }}>{money(r.amount)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>
                      <span className="capitalize">{r.status}</span>
                      {r.status === "cancelled" && r.cancellation_reason && (
                        <div className="text-[10.5px] mt-0.5" style={{ color: "#B91C1C" }}>{r.cancellation_reason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{r.referred_name || "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#94A3B8" }}>{(r.applied_at || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshIcon() {
  return <CalendarClock size={15} style={{ color: BRAND }} />;
}
