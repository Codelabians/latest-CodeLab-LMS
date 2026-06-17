import { useState } from "react";
import { useSelector } from "react-redux";
import {
  CalendarCheck,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

/* ─────────── brand tokens ─────────── */
const BRAND_RED       = "#C90606";
const BRAND_RED_TINT  = "#FEF2F2";
const TEXT_PRIMARY    = "#0F172A";
const TEXT_SECONDARY  = "#475569";
const TEXT_MUTED      = "#94A3B8";
const BORDER          = "#EEF2F6";
const SURFACE_ALT     = "#F8FAFC";

const STATUS_LABEL = {
  present:    "Present",
  absent:     "Absent",
  late:       "Late",
  early_out:  "Early out",
  half_day:   "Half day",
  on_leave:   "On leave",
  holiday:    "Holiday",
  wfh:        "WFH",
  at_stp:     "STP",
  mismatched: "Mismatched",
};

/**
 * Phase 2 — Employee-facing self-mark page.
 *
 * Drives /api/employee/me/attendance/at-stp. Lets a non-admin employee
 * tap "I'm at STP today" without going through HR. Lists their recent
 * self-marks so they can see what's already recorded.
 *
 * The page also lets the employee pre-load office (if their profile has
 * an STP office in office_user) and tweak the times. Default times come
 * from "now" so tapping the button is one click.
 */
export default function SelfMarkAttendancePage() {
  const user = useSelector(selectCurrentUser);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch my profile so we can show recent attendance + office options.
  const { data: myResp } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const my = myResp?.data;

  // Offices for the picker — limited to the offices the user belongs to.
  const { data: officesResp } = useGetQuery({ path: "employee/offices" });
  const offices = officesResp?.data || [];

  // Self-mark form state.
  const [date, setDate]     = useState(today);
  const [inTime, setInTime] = useState(`${today}T09:00`);
  const [outTime, setOutTime] = useState(`${today}T18:00`);
  const [officeId, setOfficeId] = useState("");
  const [note, setNote] = useState("");

  // Recent self-marks — read the monthly attendance for the employee's profile.
  // my-summary doesn't include profile_uuid, so look it up by email.
  const { data: profileLookupResp } = useGetQuery(
    my?.has_profile
      ? { path: "employee/profiles", params: { search: user?.email, per_page: 1 } }
      : { path: "" },
    { skip: !my?.has_profile }
  );
  const profileUuid = profileLookupResp?.data?.[0]?.uuid;
  const { data: monthAtt, refetch: refetchAtt } = useGetQuery(
    profileUuid
      ? { path: `employee/profiles/${profileUuid}/attendance`, params: { month: today.slice(0, 7) } }
      : { path: "" },
    { skip: !profileUuid }
  );
  const recent = (monthAtt?.data || []).filter((r) => r.source === "self_marked_stp").slice(0, 10);

  const [postMut, postState] = usePostMutation();

  const submit = async () => {
    try {
      await postMut({
        path: "employee/me/attendance/at-stp",
        body: {
          attendance_date: date,
          in_time:  inTime  ? inTime.replace("T", " ") + ":00"  : null,
          out_time: outTime ? outTime.replace("T", " ") + ":00" : null,
          office_id: officeId ? Number(officeId) : null,
          note: note || null,
        },
      }).unwrap();
      showToast("Marked at STP successfully.", "success");
      setNote("");
      refetchAtt();
    } catch (e) {
      showToast(e?.data?.message || "Failed to self-mark.", "error");
    }
  };

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
      <header className="flex items-center gap-3 mb-6">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <CalendarCheck size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>My attendance</h1>
          <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
            Self-mark when you&apos;re working from an STP partner site for the day. HR sees this immediately.
          </p>
        </div>
      </header>

      {!my?.has_profile ? (
        <SectionCard icon={AlertTriangle} title="No employee profile">
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            This account doesn&apos;t have an employee profile attached. Speak to HR if this looks wrong.
          </p>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <SectionCard icon={MapPin} title="Mark at STP" subtitle="Defaults to today + your normal hours">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Date">
                <input type="date" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                  value={date} onChange={(e) => {
                    setDate(e.target.value);
                    setInTime(`${e.target.value}T${inTime.slice(11) || "09:00"}`);
                    setOutTime(`${e.target.value}T${outTime.slice(11) || "18:00"}`);
                  }} />
              </Field>
              <Field label="Office (optional)">
                <select className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER, color: TEXT_PRIMARY }}
                  value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
                  <option value="">(not specified)</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.short_name || o.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="In time">
                <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                  value={inTime} onChange={(e) => setInTime(e.target.value)} />
              </Field>
              <Field label="Out time">
                <input type="datetime-local" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                  value={outTime} onChange={(e) => setOutTime(e.target.value)} />
              </Field>
              <Field label="Note (optional)">
                <input type="text" className="px-2 py-1 text-xs border rounded-md w-full" style={{ borderColor: BORDER }}
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. STP visit · client demo · etc." />
              </Field>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={submit} type="button" disabled={postState.isLoading}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white rounded-md"
                style={{ background: BRAND_RED, opacity: postState.isLoading ? 0.6 : 1 }}>
                {postState.isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Mark at STP
              </button>
            </div>
          </SectionCard>

          {/* Recent self-marks */}
          <SectionCard icon={CalendarCheck} title="My recent self-marks" subtitle="This month — newest first">
            {recent.length === 0 ? (
              <p className="text-xs" style={{ color: TEXT_MUTED }}>No self-marks this month.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recent.map((r) => (
                  <li key={r.uuid} className="px-3 py-2 border rounded-lg" style={{ borderColor: BORDER }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                        {r.attendance_date}
                      </span>
                      <span
                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{ color: "#BE185D", background: "#FDF2F8" }}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                      {r.in_time?.slice(11, 16) || "—"} → {r.out_time?.slice(11, 16) || "—"}
                      {r.note && <> · {r.note}</>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
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
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
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
