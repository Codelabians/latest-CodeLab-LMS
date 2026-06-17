import React, { useEffect, useMemo, useState } from "react";
import {
  X, Layers, BookOpen, UserCheck, MapPin, Calendar, Clock,
  Monitor, Globe2, Link as LinkIcon, ToggleRight, Hash, Loader2,
} from "lucide-react";
import SearchableSelect from "../../ui/SearchableSelect";

/* Brand tokens */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/* ────────────────────────── validation ────────────────────────── */
const URL_RE = /^https?:\/\/[^\s]+$/i;

const validate = (s) => {
  const errors = {};

  if (!s.course_id) errors.course_id = "Please pick a course";
  if (!s.teacher_id) errors.teacher_id = "Please pick a teacher";
  if (!s.hall_id) errors.hall_id = "Please pick a hall";
  if (!s.date) errors.date = "Pick a start date";
  if (!s.time_slot) errors.time_slot = "Pick a time slot";

  if (!s.start_time) errors.start_time = "Start time is required";
  if (!s.end_time) errors.end_time = "End time is required";
  if (s.start_time && s.end_time && s.end_time <= s.start_time) {
    errors.end_time = "End time must be after start time";
  }

  if (!["online", "in_person", "hybrid"].includes(s.mode)) {
    errors.mode = "Pick a delivery mode";
  }
  if ((s.mode === "online" || s.mode === "hybrid")) {
    if (!s.default_meeting_link) {
      errors.default_meeting_link = "Meeting link is required for online / hybrid";
    } else if (!URL_RE.test(s.default_meeting_link)) {
      errors.default_meeting_link = "Enter a valid URL starting with http(s)://";
    } else if (s.default_meeting_link.length > 500) {
      errors.default_meeting_link = "URL must be 500 characters or fewer";
    }
  }
  if (s.duration && s.duration.length > 255) {
    errors.duration = "Duration must be 255 characters or fewer";
  }

  return errors;
};

const inputStyle = (hasErr) => ({
  background: SURFACE_HOVER,
  border: `1px solid ${hasErr ? "#FCA5A5" : BORDER}`,
  color: TEXT_PRIMARY,
  fontFamily: "'Montserrat', sans-serif",
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  transition: "all .15s",
});

const Field = ({ label, icon: Icon, error, helper, required, children }) => (
  <div className="flex flex-col gap-1">
    <label
      className="flex items-center gap-1.5"
      style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}
    >
      {Icon && <Icon size={13} strokeWidth={2} style={{ color: TEXT_SECONDARY }} />}
      {label}
      {required && <span style={{ color: BRAND_RED }}>*</span>}
    </label>
    {children}
    {(error || helper) && (
      <p
        className="text-[11px]"
        style={{ color: error ? BRAND_RED : TEXT_MUTED, fontWeight: error ? 500 : 400, marginTop: 2 }}
      >
        {error || helper}
      </p>
    )}
  </div>
);

const Segmented = ({ value, onChange, options, error }) => (
  <div
    className="inline-flex w-full items-center gap-1 p-0.5 rounded-lg"
    style={{ background: SURFACE_HOVER, border: `1px solid ${error ? "#FCA5A5" : BORDER}` }}
  >
    {options.map((opt) => (
      <button
        key={opt.v}
        type="button"
        onClick={() => onChange(opt.v)}
        className="flex items-center justify-center flex-1 gap-1.5 px-2 py-1.5 text-xs font-semibold transition rounded-md"
        style={{
          color: value === opt.v ? "#fff" : TEXT_SECONDARY,
          background: value === opt.v ? BRAND_RED : "transparent",
        }}
      >
        {opt.icon && <opt.icon size={12} strokeWidth={2.2} />}
        {opt.l}
      </button>
    ))}
  </div>
);

/* ───────────────── main component ───────────────── */
const BatchModal = ({
  isOpen,
  mode,                // "add" | "edit"
  initialBatch,        // batch object when editing (null for add)
  courses = [],        // [{uuid, name, id, course_code}]
  teachers = [],       // [{id, name, avatar_url}]
  halls = [],          // [{id, hall_uuid, name}]
  onClose,
  onSubmit,            // (formData) => Promise<{ error: string | null }>
  isLoading,
}) => {
  const isEdit = mode === "edit";

  const blank = {
    course_id: "",          // course UUID — backend filter accepts both UUID and int
    teacher_id: "",         // teacher id (int as string)
    hall_id: "",            // hall id (int as string)
    date: "",               // YYYY-MM-DD
    time_slot: "",          // morning|noon|evening|night
    start_time: "",         // HH:MM
    end_time: "",           // HH:MM
    mode: "in_person",      // online|in_person|hybrid
    default_meeting_link: "",
    is_active: true,
    duration: "",
  };

  const [state, setState] = useState(blank);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  /* Reset on open / mode change */
  useEffect(() => {
    if (!isOpen) return;
    setTouched({});
    setServerError("");

    if (isEdit && initialBatch) {
      // Backend gives the timing back as "HH:MM to HH:MM" (single string).
      // Split it for the two time pickers; gracefully handle missing pieces.
      const [start = "", end = ""] = (initialBatch.timing || "").split(/\s*to\s*/i);
      // course_id in the list response is the integer FK; we need the
      // course UUID for the dropdown. Look it up from the courses list.
      const matchedCourse = courses.find((c) => c.id === initialBatch.course_id || c.uuid === initialBatch.course_uuid);
      setState({
        course_id: matchedCourse?.uuid || initialBatch.course_uuid || "",
        teacher_id: initialBatch.teacher_id ? String(initialBatch.teacher_id) : "",
        hall_id: initialBatch.hall_id ? String(initialBatch.hall_id) : "",
        date: initialBatch.date || "",
        time_slot: initialBatch.time_slot || "",
        start_time: start.trim(),
        end_time: end.trim(),
        mode: initialBatch.mode || "in_person",
        default_meeting_link: initialBatch.default_meeting_link || "",
        is_active: initialBatch.is_active === 1 || initialBatch.is_active === true,
        duration: initialBatch.duration || "",
      });
    } else {
      setState(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialBatch?.batch_uuid, courses?.length, teachers?.length, halls?.length]);

  const errors = validate(state);
  const isValid = Object.keys(errors).length === 0;

  /* show errors for touched fields only */
  const showErr = (k) => (touched[k] && errors[k]) || "";

  const set = (k, v) => {
    setState((p) => ({ ...p, [k]: v }));
    if (serverError) setServerError("");
  };
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  /* Course resolver — we need to send the integer ID to the backend
   * since CourseRequest validation expects `course_id` to exist in
   * courses.id. The dropdown value is a UUID; look up the int. */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setTouched({
      course_id: true, teacher_id: true, hall_id: true,
      date: true, time_slot: true, start_time: true, end_time: true,
      mode: true, default_meeting_link: true,
    });
    if (!isValid) return;

    const courseRow = courses.find((c) => c.uuid === state.course_id);
    if (!courseRow) {
      setServerError("Selected course is no longer in the list. Please pick again.");
      return;
    }

    const payload = {
      course_id: courseRow.id,                       // INT — what backend wants
      teacher_id: Number(state.teacher_id),
      // BatchRequest validation declares hall_id as `string|exists:halls,id`,
      // so send the id as a string even though it represents a numeric FK.
      hall_id: String(state.hall_id),
      date: state.date,
      time_slot: state.time_slot,
      timing: `${state.start_time} to ${state.end_time}`,
      mode: state.mode,
      is_active: !!state.is_active,
    };
    if (state.mode === "online" || state.mode === "hybrid") {
      payload.default_meeting_link = state.default_meeting_link;
    }
    if (state.duration?.trim()) payload.duration = state.duration.trim();

    setServerError("");
    const result = await onSubmit(payload);
    if (result?.error) setServerError(result.error);
  };

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.uuid, label: c.name })),
    [courses]
  );

  /* The batch delivery mode must match what the selected course offers.
   * Course modes use "physical"; batches use "in_person". */
  const ALL_MODES = [
    { v: "online", l: "Online", icon: Monitor },
    { v: "in_person", l: "In person", icon: MapPin },
    { v: "hybrid", l: "Hybrid", icon: Globe2 },
  ];
  const selectedCourse = useMemo(
    () => courses.find((c) => c.uuid === state.course_id) || null,
    [courses, state.course_id]
  );
  const allowedModes = useMemo(() => {
    const raw = Array.isArray(selectedCourse?.delivery_modes) ? selectedCourse.delivery_modes : [];
    const mapped = raw.map((m) => (m === "physical" ? "in_person" : m));
    const filtered = ALL_MODES.filter((o) => mapped.includes(o.v));
    return filtered.length ? filtered : ALL_MODES; // fall back to all if course has none set
  }, [selectedCourse]);

  /* Keep the chosen mode valid for the selected course. */
  useEffect(() => {
    if (!state.course_id) return;
    const ok = allowedModes.some((o) => o.v === state.mode);
    if (!ok) { set("mode", allowedModes[0]?.v || "in_person"); }
  }, [state.course_id, allowedModes]);
  const teacherOptions = useMemo(
    () => teachers.map((t) => ({
      value: String(t.id),
      label: t.name || `${t.first_name || ""} ${t.last_name || ""}`.trim(),
      avatarUrl: t.avatar_url || null,
    })),
    [teachers]
  );
  const hallOptions = useMemo(
    () => halls.map((h) => ({ value: String(h.id), label: h.name })),
    [halls]
  );

  if (!isOpen) return null;

  const needsLink = state.mode === "online" || state.mode === "hybrid";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <Layers size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isEdit ? "Edit Batch" : "Create New Batch"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {isEdit
                  ? "Update batch details"
                  : "Batch name is auto-generated. The curriculum will be snapshotted from the course."}
              </p>
            </div>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            className="flex items-center justify-center transition rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED, background: "transparent" }}
            onMouseEnter={(ev) => { ev.currentTarget.style.background = "#F1F5F9"; ev.currentTarget.style.color = TEXT_PRIMARY; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = TEXT_MUTED; }}
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {serverError && (
            <div
              className="p-2.5 mb-4 text-[12px] rounded-lg"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}
            >
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Course */}
            <Field label="Course" icon={BookOpen} error={showErr("course_id")} required>
              <SearchableSelect
                options={courseOptions}
                value={state.course_id}
                onChange={(v) => {
                  set("course_id", v || "");
                  markTouched("course_id");
                  const c = courses.find((x) => x.uuid === v);
                  const raw = Array.isArray(c?.delivery_modes) ? c.delivery_modes : [];
                  const mapped = raw.map((m) => (m === "physical" ? "in_person" : m));
                  if (mapped.length && !mapped.includes(state.mode)) { set("mode", mapped[0]); }
                }}
                placeholder="Select a course"
                hasError={!!showErr("course_id")}
              />
            </Field>

            {/* Teacher (with avatar) */}
            <Field label="Teacher" icon={UserCheck} error={showErr("teacher_id")} required>
              <SearchableSelect
                options={teacherOptions}
                value={state.teacher_id}
                onChange={(v) => { set("teacher_id", v || ""); markTouched("teacher_id"); }}
                placeholder={teachers.length ? "Select a teacher" : "No teachers yet — add one first"}
                disabled={teachers.length === 0}
                hasError={!!showErr("teacher_id")}
                showAvatars
              />
            </Field>

            {/* Hall */}
            <Field label="Hall" icon={MapPin} error={showErr("hall_id")} required>
              <SearchableSelect
                options={hallOptions}
                value={state.hall_id}
                onChange={(v) => { set("hall_id", v || ""); markTouched("hall_id"); }}
                placeholder={halls.length ? "Select a hall" : "No halls yet"}
                disabled={halls.length === 0}
                hasError={!!showErr("hall_id")}
              />
            </Field>

            {/* Date */}
            <Field label="Start date" icon={Calendar} error={showErr("date")} required>
              <input
                type="date"
                value={state.date}
                onChange={(ev) => set("date", ev.target.value)}
                onBlur={() => markTouched("date")}
                disabled={isLoading}
                style={inputStyle(!!showErr("date"))}
              />
            </Field>

            {/* Mode */}
            <Field label="Delivery mode" icon={Monitor} error={showErr("mode")} required>
              <Segmented
                value={state.mode}
                onChange={(v) => { set("mode", v); markTouched("mode"); }}
                error={!!showErr("mode")}
                options={allowedModes}
              />
              {state.course_id && allowedModes.length < 3 && (
                <p className="mt-1 text-[11px] text-slate-400">Limited to the study modes this course offers.</p>
              )}
            </Field>

            {/* Time slot */}
            <Field label="Time slot" icon={Clock} error={showErr("time_slot")} required>
              <Segmented
                value={state.time_slot}
                onChange={(v) => { set("time_slot", v); markTouched("time_slot"); }}
                error={!!showErr("time_slot")}
                options={[
                  { v: "morning", l: "Morning" },
                  { v: "noon", l: "Noon" },
                  { v: "evening", l: "Evening" },
                  { v: "night", l: "Night" },
                ]}
              />
            </Field>

            {/* Start + end time */}
            <Field label="Start time" icon={Clock} error={showErr("start_time")} required>
              <input
                type="time"
                value={state.start_time}
                onChange={(ev) => set("start_time", ev.target.value)}
                onBlur={() => markTouched("start_time")}
                disabled={isLoading}
                style={inputStyle(!!showErr("start_time"))}
              />
            </Field>
            <Field label="End time" icon={Clock} error={showErr("end_time")} required>
              <input
                type="time"
                value={state.end_time}
                onChange={(ev) => set("end_time", ev.target.value)}
                onBlur={() => markTouched("end_time")}
                disabled={isLoading}
                style={inputStyle(!!showErr("end_time"))}
              />
            </Field>

            {/* Conditional meeting link */}
            {needsLink && (
              <div className="md:col-span-2">
                <Field
                  label="Default meeting link"
                  icon={LinkIcon}
                  error={showErr("default_meeting_link")}
                  helper="Required for online / hybrid — students see this if no per-session link is set"
                  required
                >
                  <input
                    type="url"
                    value={state.default_meeting_link}
                    onChange={(ev) => set("default_meeting_link", ev.target.value)}
                    onBlur={() => markTouched("default_meeting_link")}
                    placeholder="https://zoom.us/j/123456789"
                    disabled={isLoading}
                    style={inputStyle(!!showErr("default_meeting_link"))}
                  />
                </Field>
              </div>
            )}

            {/* Duration (optional) */}
            <Field label="Duration" icon={Hash} helper="Optional, e.g. 4 months">
              <input
                type="text"
                value={state.duration}
                onChange={(ev) => set("duration", ev.target.value)}
                placeholder="4 months"
                disabled={isLoading}
                style={inputStyle(!!showErr("duration"))}
              />
            </Field>

            {/* Active toggle */}
            <div className="flex items-center md:col-span-1">
              <label
                className="flex items-center gap-3 p-3 cursor-pointer rounded-lg w-full"
                style={{
                  background: state.is_active ? "#F0FDF4" : SURFACE_HOVER,
                  border: `1px solid ${state.is_active ? "#BBF7D0" : BORDER}`,
                  marginTop: 22,
                }}
              >
                <input
                  type="checkbox"
                  checked={state.is_active}
                  disabled={isLoading}
                  onChange={(ev) => set("is_active", ev.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: "#15803D" }}
                />
                <ToggleRight size={15} strokeWidth={2} style={{ color: state.is_active ? "#15803D" : TEXT_SECONDARY }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{ color: state.is_active ? "#15803D" : TEXT_PRIMARY }}>
                    Active batch
                  </div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 1 }}>
                    Inactive batches are hidden from students by default
                  </div>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}
        >
          <button
            type="button" onClick={onClose} disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSubmit} disabled={isLoading || !isValid}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)",
            }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : isEdit ? "Save changes" : "Create batch"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchModal;
