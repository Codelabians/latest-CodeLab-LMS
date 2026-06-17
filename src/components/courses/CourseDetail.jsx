import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, CalendarCheck, CircleDollarSign,
  Tag, Hash, Users, Award, Heart, GraduationCap,
  Loader2, AlertTriangle, ChevronDown, ChevronRight,
  Clock, Trophy, FileText, ListChecks, Target, Sparkles, UploadCloud,
} from "lucide-react";
import { toast } from "react-toastify";
import { useGetQuery, useSmartPostMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { COURSES } from "../routes/RouteConstants";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";

/* ───────────────── small reusable bits ───────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div
    className="flex items-center gap-4 p-4 bg-white rounded-xl"
    style={{ border: `1px solid ${BORDER}` }}
  >
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: 44, height: 44, borderRadius: 12, background: color.bg, color: color.fg }}
    >
      <Icon size={20} strokeWidth={2} />
    </div>
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div className="text-[22px] font-bold mt-1" style={{ color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>
        {value ?? 0}
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
    <div
      className="flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ width: 30, height: 30, borderRadius: 8, background: "#F1F5F9", color: TEXT_SECONDARY }}
    >
      <Icon size={14} strokeWidth={2} />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div className="text-sm mt-0.5" style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>
        {children}
      </div>
    </div>
  </div>
);

/* ───────────────── section label for expanded lecture content ───────────────── */
const SectionLabel = ({ icon: Icon, text, accent }) => (
  <div className="flex items-center gap-2 mb-2.5">
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-md"
      style={{
        width: 22, height: 22,
        background: accent?.bg || "#F1F5F9",
        color: accent?.fg || TEXT_SECONDARY,
      }}
    >
      <Icon size={12} strokeWidth={2.2} />
    </div>
    <span className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}>
      {text}
    </span>
  </div>
);

/* ───────────────── lecture card (inside curriculum tab) ───────────────── */
const LectureCard = ({ lecture }) => {
  const [open, setOpen] = useState(false);
  const objectives = Array.isArray(lecture.objectives) ? lecture.objectives : [];
  const topics = Array.isArray(lecture.topics_covered) ? lecture.topics_covered : [];
  const hasDetails =
    objectives.length > 0 || topics.length > 0 ||
    !!lecture.exercise || !!lecture.deliverable;

  const isCapstone = !!lecture.is_week_capstone;

  return (
    <div
      className="overflow-hidden transition-all rounded-xl"
      style={{
        background: "#fff",
        // Capstone gets a subtle left-border accent instead of a separate badge
        // so the cue is unmistakable but doesn't clutter the title row.
        border: `1px solid ${isCapstone ? "#FECACA" : BORDER}`,
        borderLeft: isCapstone ? `4px solid ${BRAND_RED}` : `1px solid ${BORDER}`,
      }}
    >
      {/* ── Row header ── */}
      <button
        type="button"
        onClick={() => hasDetails && setOpen((v) => !v)}
        className="flex items-start w-full gap-4 px-5 py-4 text-left transition-colors"
        style={{
          background: open ? "#FAFBFC" : "#fff",
          cursor: hasDetails ? "pointer" : "default",
        }}
        onMouseEnter={(e) => { if (hasDetails && !open) e.currentTarget.style.background = "#FAFBFC"; }}
        onMouseLeave={(e) => { if (hasDetails && !open) e.currentTarget.style.background = "#fff"; }}
      >
        {/* Lecture number badge */}
        <div
          className="flex items-center justify-center flex-shrink-0 text-[13px] font-bold rounded-lg"
          style={{
            width: 38, height: 38,
            color: isCapstone ? BRAND_RED : TEXT_SECONDARY,
            background: isCapstone ? BRAND_RED_TINT : "#F1F5F9",
            border: `1px solid ${isCapstone ? "#FECACA" : "transparent"}`,
          }}
          title={isCapstone ? "Capstone lecture" : `Lecture ${lecture.lecture_in_week}`}
        >
          {isCapstone ? <Trophy size={16} strokeWidth={2} /> : lecture.lecture_in_week}
        </div>

        {/* Title + topic */}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.005em" }}>
            {lecture.title}
            {isCapstone && (
              <span
                className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-[11px] font-semibold align-middle rounded-md"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
              >
                <Sparkles size={11} strokeWidth={2.2} />
                Capstone
              </span>
            )}
          </div>
          {lecture.topic && (
            <div className="text-[13px] mt-1 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              {lecture.topic}
            </div>
          )}
        </div>

        {/* Meta column */}
        <div className="flex flex-col items-end flex-shrink-0 gap-1.5">
          {lecture.duration_hours > 0 && (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-semibold rounded-md"
              style={{ color: TEXT_SECONDARY, background: "#F1F5F9" }}
              title="Duration"
            >
              <Clock size={12} strokeWidth={2.2} />
              {Number(lecture.duration_hours).toFixed(lecture.duration_hours % 1 ? 1 : 0)}h
            </div>
          )}
          {hasDetails && (
            <ChevronDown
              size={18}
              strokeWidth={2.25}
              style={{
                color: TEXT_MUTED,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          )}
        </div>
      </button>

      {/* ── Details (expanded) ── */}
      {open && hasDetails && (
        <div
          className="px-5 py-5 space-y-5"
          style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}
        >
          {objectives.length > 0 && (
            <section>
              <SectionLabel
                icon={Target}
                text="Learning objectives"
                accent={{ fg: "#1D4ED8", bg: "#EFF6FF" }}
              />
              <ul className="space-y-2 ml-1">
                {objectives.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    <span
                      className="flex items-center justify-center flex-shrink-0 mt-1 text-[10px] font-bold rounded-full"
                      style={{
                        width: 16, height: 16,
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {topics.length > 0 && (
            <section>
              <SectionLabel
                icon={ListChecks}
                text="Topics covered"
                accent={{ fg: "#15803D", bg: "#F0FDF4" }}
              />
              <div className="flex flex-wrap gap-2 ml-1">
                {topics.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-[12.5px] font-medium rounded-lg"
                    style={{
                      background: "#fff",
                      color: TEXT_PRIMARY,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {lecture.exercise && (
            <section>
              <SectionLabel
                icon={FileText}
                text="Exercise"
                accent={{ fg: "#B45309", bg: "#FFFBEB" }}
              />
              <div
                className="px-4 py-3 ml-1 rounded-lg"
                style={{
                  background: "#FFFBEB",
                  borderLeft: `3px solid #FDE68A`,
                }}
              >
                <p className="text-[13.5px] leading-relaxed" style={{ color: TEXT_PRIMARY }}>
                  {lecture.exercise}
                </p>
              </div>
            </section>
          )}

          {lecture.deliverable && (
            <section>
              <SectionLabel
                icon={Trophy}
                text="Deliverable"
                accent={{ fg: BRAND_RED, bg: BRAND_RED_TINT }}
              />
              <div
                className="px-4 py-3 ml-1 rounded-lg"
                style={{
                  background: BRAND_RED_TINT,
                  borderLeft: `3px solid #FECACA`,
                }}
              >
                <p className="text-[13.5px] leading-relaxed" style={{ color: TEXT_PRIMARY }}>
                  {lecture.deliverable}
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

/* ───────────────── week group (collapsible) ───────────────── */
const WeekGroup = ({ weekNumber, lectures }) => {
  const [open, setOpen] = useState(weekNumber === 1); // first week open by default
  const sorted = [...lectures].sort((a, b) => (a.lecture_in_week || 0) - (b.lecture_in_week || 0));
  const totalHours = sorted.reduce((sum, l) => sum + (Number(l.duration_hours) || 0), 0);
  const hasCapstone = sorted.some((l) => l.is_week_capstone);

  return (
    <div
      className="mb-4 overflow-hidden"
      style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: "#fff" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full gap-4 px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#FAFBFC" : "#fff" }}
      >
        {/* Week badge */}
        <div
          className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl"
          style={{
            width: 52, height: 52,
            color: "#fff",
            background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
            boxShadow: open ? "0 8px 22px -10px rgba(201,6,6,0.45)" : "none",
          }}
        >
          <span className="text-[9px] font-bold tracking-widest opacity-80">WEEK</span>
          <span className="text-[18px] font-bold leading-none mt-0.5">{weekNumber}</span>
        </div>

        {/* Week summary */}
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
            Week {weekNumber}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
            <span className="font-medium">
              {sorted.length} lecture{sorted.length === 1 ? "" : "s"}
            </span>
            {totalHours > 0 && (
              <>
                <span style={{ color: TEXT_MUTED }}>•</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <Clock size={12} strokeWidth={2.2} style={{ color: TEXT_MUTED }} />
                  {totalHours.toFixed(totalHours % 1 ? 1 : 0)}h total
                </span>
              </>
            )}
            {hasCapstone && (
              <>
                <span style={{ color: TEXT_MUTED }}>•</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md"
                  style={{ color: BRAND_RED, background: BRAND_RED_TINT }}
                >
                  <Sparkles size={11} strokeWidth={2.2} />
                  Capstone
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div
          className="flex items-center justify-center flex-shrink-0 transition-all rounded-lg"
          style={{
            width: 32, height: 32,
            background: open ? BRAND_RED_TINT : "#F1F5F9",
            color: open ? BRAND_RED : TEXT_SECONDARY,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown size={18} strokeWidth={2.25} />
        </div>
      </button>

      {/* Lectures list */}
      {open && (
        <div
          className="p-4 space-y-3"
          style={{ background: "#FAFBFC", borderTop: `1px solid ${BORDER}` }}
        >
          {sorted.map((l) => <LectureCard key={l.lecture_uuid || l.id} lecture={l} />)}
        </div>
      )}
    </div>
  );
};

/* ───────────────── tabs ───────────────── */
const Tabs = ({ tabs, current, onChange }) => (
  <div className="flex items-center gap-1 p-1 mb-6 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}`, width: "fit-content" }}>
    {tabs.map((t) => {
      const active = current === t.id;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition rounded-lg"
          style={{
            color: active ? "#fff" : TEXT_SECONDARY,
            background: active ? BRAND_RED : "transparent",
          }}
        >
          {t.icon && <t.icon size={14} strokeWidth={2} />}
          {t.label}
          {t.count !== undefined && (
            <span
              className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10.5px] font-bold rounded-full"
              style={{
                background: active ? "rgba(255,255,255,0.22)" : "#F1F5F9",
                color: active ? "#fff" : TEXT_SECONDARY,
                minWidth: 18,
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* ───────────────── main detail page ───────────────── */
const CourseDetail = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("tab") === "curriculum" ? "curriculum" : "overview";
  const setTab = (t) => {
    const next = new URLSearchParams(searchParams);
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    setSearchParams(next, { replace: true });
  };

  const { data, error, isLoading, refetch } = useGetQuery({ path: `/course/${uuid}` });
  const c = data?.data;

  // Curriculum Excel import (uploads to POST /api/course/{uuid}/curriculum/import).
  const fileRef = useRef(null);
  const [importCurriculum, { isLoading: importing }] = useSmartPostMutation();
  const onCurriculumFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await importCurriculum({
        path: `course/${uuid}/curriculum/import`,
        body: fd,
      });
      if (res?.error) {
        toast.error(res.error?.data?.message || "Curriculum import failed.");
      } else {
        const r = res?.data?.data || res?.data || {};
        toast.success(
          `Curriculum imported${r.total ? `: ${r.created ?? 0} added, ${r.updated ?? 0} updated` : ""}.`,
        );
        refetch();
      }
    } catch {
      toast.error("Curriculum import failed.");
    }
  };

  // Group lectures by week
  const lecturesByWeek = useMemo(() => {
    if (!c?.lectures) return [];
    const groups = new Map();
    for (const l of c.lectures) {
      const w = l.week_number;
      if (!groups.has(w)) groups.set(w, []);
      groups.get(w).push(l);
    }
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNumber, lectures]) => ({ weekNumber, lectures }));
  }, [c?.lectures]);

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: BRAND_RED }} />
      </div>
    );
  }

  if (error || !c) {
    return (
      <div className="px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC", fontFamily: "'Montserrat', sans-serif" }}>
        <button type="button" onClick={() => navigate(COURSES)}
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition"
          style={{ color: TEXT_SECONDARY }}
        >
          <ArrowLeft size={15} strokeWidth={2.25} /> Back to courses
        </button>
        <div className="flex items-center justify-center p-10 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-center">
            <AlertTriangle size={28} style={{ color: BRAND_RED }} className="mx-auto mb-3" />
            <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              Course not found or no permission to view.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalLectures = c.lectures_count ?? lecturesByWeek.reduce((s, w) => s + w.lectures.length, 0);
  const totalWeeks = c.weeks_count ?? lecturesByWeek.length;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Back link */}
      <button type="button" onClick={() => navigate(COURSES)}
        className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition"
        style={{ color: TEXT_SECONDARY }}
        onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_RED)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SECONDARY)}
      >
        <ArrowLeft size={15} strokeWidth={2.25} /> Back to courses
      </button>

      {/* Hero */}
      <div
        className="flex items-center justify-between gap-4 p-6 mb-6 overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, color: "#fff" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.18)" }}>
            <BookOpen size={26} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.01em" }}>{c.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>
              <span>{c.category}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{c.course_status_label || (c.course_status === "advance" ? "Advance" : "Basic")}</span>
              {c.course_code && c.course_code !== "N/A" && (
                <>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ fontFamily: "monospace" }}>{c.course_code}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Link
          to={`/dashboard/courses/${c.uuid}/classes`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition rounded-lg"
          style={{ color: BRAND_RED, background: "#fff" }}
        >
          <GraduationCap size={15} strokeWidth={2.25} />
          View Classes
        </Link>
      </div>

      {/* Tabs */}
      <Tabs
        current={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview", icon: BookOpen },
          { id: "curriculum", label: "Curriculum", icon: ListChecks, count: totalLectures || undefined },
        ]}
      />

      {/* ───────── Overview tab ───────── */}
      {tab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <StatCard icon={Users} label="Active Students" value={c.active_students_count} color={{ fg: "#15803D", bg: "#F0FDF4" }} />
            <StatCard icon={Award} label="Completed"      value={c.completed_students_count} color={{ fg: "#1D4ED8", bg: "#EFF6FF" }} />
            <StatCard icon={Heart} label="Interested"     value={c.interested_students_count} color={{ fg: BRAND_RED, bg: BRAND_RED_TINT }} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-6 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <h2 className="text-[14px] font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Course Information</h2>
              <InfoRow icon={Tag} label="Category">{c.category}</InfoRow>
              <InfoRow icon={Tag} label="Course type">
                {c.course_status_label || (c.course_status === "advance" ? "Advance" : "Basic")}
              </InfoRow>
              {c.course_code && c.course_code !== "N/A" && (
                <InfoRow icon={Hash} label="Course code">
                  <code className="px-2 py-0.5 rounded text-[12px]" style={{ background: "#F1F5F9" }}>{c.course_code}</code>
                </InfoRow>
              )}
              <InfoRow icon={CalendarCheck} label="Scheduled">
                {c.is_scheduled === 1 || c.is_scheduled === true ? (
                  <span style={{ color: "#15803D", fontWeight: 600 }}>Yes</span>
                ) : (
                  <span style={{ color: TEXT_MUTED }}>No</span>
                )}
              </InfoRow>
              <div className="flex items-start gap-3 py-3">
                <div className="flex items-center justify-center flex-shrink-0 mt-0.5" style={{ width: 30, height: 30, borderRadius: 8, background: "#F1F5F9", color: TEXT_SECONDARY }}>
                  <BookOpen size={14} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
                    Slug
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>
                    <code className="px-2 py-0.5 rounded text-[12px]" style={{ background: "#F1F5F9" }}>{c.slug}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <h2 className="text-[14px] font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Fees &amp; Duration</h2>
              <InfoRow icon={CircleDollarSign} label="Monthly fee">
                <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs. {Number(c.monthly_fee).toLocaleString()}</span>
              </InfoRow>
              <InfoRow icon={CircleDollarSign} label="Enrollment fee">
                <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs. {Number(c.enrollment_fee).toLocaleString()}</span>
              </InfoRow>
              <InfoRow icon={CalendarCheck} label="Duration">
                {c.min_duration_months} – {c.max_duration_months} months
              </InfoRow>
              <InfoRow icon={GraduationCap} label="Classes">
                {c.classes ?? 0}
              </InfoRow>
              <InfoRow icon={ListChecks} label="Curriculum">
                {totalLectures > 0 ? (
                  <>
                    {totalLectures} lecture{totalLectures === 1 ? "" : "s"} across {totalWeeks} week{totalWeeks === 1 ? "" : "s"}{" "}
                    <button type="button" onClick={() => setTab("curriculum")} className="ml-1 text-[12px] font-semibold underline" style={{ color: BRAND_RED }}>
                      view
                    </button>
                  </>
                ) : (
                  <span style={{ color: TEXT_MUTED }}>No curriculum yet</span>
                )}
              </InfoRow>
            </div>
          </div>
        </>
      )}

      {/* ───────── Curriculum tab ───────── */}
      {tab === "curriculum" && (
        <div>
          {/* Curriculum summary header */}
          <div
            className="flex items-center justify-between gap-4 px-5 py-4 mb-4 bg-white rounded-xl"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Course Curriculum</h2>
              <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {totalLectures > 0
                  ? <><span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{totalLectures}</span> lectures across{" "}
                      <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{totalWeeks}</span> weeks</>
                  : "No lectures yet — the curriculum hasn't been imported for this course."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {totalLectures > 0 && (
                <div className="hidden md:flex items-center gap-4 text-[11.5px]" style={{ color: TEXT_MUTED }}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} strokeWidth={2} />
                    {lecturesByWeek.reduce((s, w) => s + w.lectures.reduce((ss, l) => ss + (Number(l.duration_hours) || 0), 0), 0).toFixed(0)}h total
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={13} strokeWidth={2} style={{ color: BRAND_RED }} />
                    {lecturesByWeek.filter((w) => w.lectures.some((l) => l.is_week_capstone)).length} capstone{lecturesByWeek.filter((w) => w.lectures.some((l) => l.is_week_capstone)).length === 1 ? "" : "s"}
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onCurriculumFile}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                style={{ background: BRAND_RED }}
                title="Upload a curriculum .xlsx to import lectures"
              >
                <UploadCloud size={14} strokeWidth={2.25} />
                {importing ? "Importing…" : (totalLectures > 0 ? "Re-import" : "Import Curriculum")}
              </button>
            </div>
          </div>

          {/* Lectures grouped by week */}
          {totalLectures === 0 ? (
            <div className="flex items-center justify-center p-10 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <div className="text-center">
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                  <ListChecks size={22} />
                </div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                  No curriculum yet
                </div>
                <div className="text-[12px]" style={{ color: TEXT_MUTED, maxWidth: 360, margin: "0 auto" }}>
                  Import the curriculum spreadsheet for this course to see lectures grouped by week.
                </div>
              </div>
            </div>
          ) : (
            <div>
              {lecturesByWeek.map((g) => (
                <WeekGroup key={g.weekNumber} weekNumber={g.weekNumber} lectures={g.lectures} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
