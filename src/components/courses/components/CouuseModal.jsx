import { useEffect, useState } from "react";
import {
  X, BookOpen, Tag, Hash, CalendarCheck, Loader2,
  CircleDollarSign,
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

/* ─── validation rules ───
 *   name:           required, min 3
 *   category_uuid:  required
 *   monthly_fee:    required, 1000–99,999  (4–5 digit rule)
 *   enrollment_fee: required, 1000–99,999  (4–5 digit rule)
 *   course_status:  enum (basic|advance), defaults to basic
 *   course_code:    optional string
 *   is_scheduled:   optional boolean
 */
const FEE_MIN = 1000;
const FEE_MAX = 99999;

const validate = (state) => {
  const errors = {};
  if (!state.name || state.name.trim().length < 3) {
    errors.name = "Course name must be at least 3 characters";
  }
  if (!state.category_id) {
    errors.category_id = "Please choose a category";
  }
  const m = Number(state.monthly_fee);
  if (state.monthly_fee === "" || Number.isNaN(m)) {
    errors.monthly_fee = "Monthly fee is required";
  } else if (m < FEE_MIN || m > FEE_MAX) {
    errors.monthly_fee = `Monthly fee must be between ${FEE_MIN} and ${FEE_MAX}`;
  }
  const e = Number(state.enrollment_fee);
  if (state.enrollment_fee === "" || Number.isNaN(e)) {
    errors.enrollment_fee = "Enrollment fee is required";
  } else if (e < FEE_MIN || e > FEE_MAX) {
    errors.enrollment_fee = `Enrollment fee must be between ${FEE_MIN} and ${FEE_MAX}`;
  }
  if (!["basic", "advance"].includes(state.course_status)) {
    errors.course_status = "Course type must be Basic or Advance";
  }
  return errors;
};

const Field = ({ label, icon: Icon, error, children, helper, required }) => (
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
    <p
      className="text-[11px]"
      style={{ color: error ? BRAND_RED : TEXT_MUTED, fontWeight: error ? 500 : 400, marginTop: 2 }}
    >
      {error || helper || " "}
    </p>
  </div>
);

const inputStyle = (hasError) => ({
  background: "#F8FAFC",
  border: `1px solid ${hasError ? "#FCA5A5" : BORDER}`,
  color: TEXT_PRIMARY,
  fontFamily: "'Montserrat', sans-serif",
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
  transition: "all .15s",
});

const CourseModal = ({
  isOpen,
  mode,            // "add" | "edit"
  initialCourse,   // course object when editing
  categories,
  onClose,
  onSubmit,        // (formData) => Promise<{error: string|null}>
  isLoading,
}) => {
  const isEdit = mode === "edit";

  const blank = {
    name: "",
    category_id: "",       // category UUID (not numeric id)
    monthly_fee: "",
    enrollment_fee: "",
    course_status: "basic",
    course_code: "",
    is_scheduled: false,
  };

  const [state, setState] = useState(blank);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  /* Reset state on open / mode change */
  useEffect(() => {
    if (!isOpen) return;
    setTouched({});
    setServerError("");

    if (isEdit && initialCourse) {
      // The list response gives us `category_id` as an INT and `category`
      // as the name. We need the UUID for submission — look it up from
      // the categories list.
      const cat = categories?.find((c) => c.id === initialCourse.category_id);
      setState({
        name: initialCourse.name || "",
        category_id: cat?.uuid || "",
        monthly_fee: initialCourse.monthly_fee != null ? String(parseFloat(initialCourse.monthly_fee)) : "",
        enrollment_fee: initialCourse.enrollment_fee != null ? String(parseFloat(initialCourse.enrollment_fee)) : "",
        course_status: initialCourse.course_status || "basic",
        course_code: initialCourse.course_code && initialCourse.course_code !== "N/A" ? initialCourse.course_code : "",
        is_scheduled: !!initialCourse.is_scheduled,
      });
    } else {
      setState(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialCourse?.uuid, categories?.length]);

  if (!isOpen) return null;

  const errors = validate(state);
  const isValid = Object.keys(errors).length === 0;

  const showErr = (field) => (touched[field] && errors[field]) || "";

  const set = (k, v) => {
    setState((prev) => ({ ...prev, [k]: v }));
    if (serverError) setServerError("");
  };

  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    // touch all fields so all errors show
    setTouched({
      name: true, category_id: true, monthly_fee: true,
      enrollment_fee: true, course_status: true,
    });
    if (!isValid) return;

    setServerError("");
    const payload = {
      name: state.name.trim(),
      category_id: state.category_id,
      monthly_fee: Number(state.monthly_fee),
      enrollment_fee: Number(state.enrollment_fee),
      course_status: state.course_status,
      is_scheduled: !!state.is_scheduled,
    };
    if (state.course_code.trim()) payload.course_code = state.course_code.trim();

    const result = await onSubmit(payload);
    if (result?.error) setServerError(result.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <BookOpen size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isEdit ? "Edit Course" : "Add New Course"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {isEdit ? "Update course details" : "Fill in the details to create a new course"}
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
        <form onSubmit={handleSubmit} className="px-5 py-5">
          {/* Server-side error banner */}
          {serverError && (
            <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid #FECACA`, fontWeight: 500 }}>
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Field label="Course name" icon={BookOpen} error={showErr("name")} required>
              <input
                type="text" value={state.name} disabled={isLoading}
                onChange={(ev) => set("name", ev.target.value)}
                onBlur={() => markTouched("name")}
                placeholder="e.g. Full-Stack Web Development"
                style={inputStyle(!!showErr("name"))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" icon={Tag} error={showErr("category_id")} required>
                <SearchableSelect
                  options={(categories || []).map((c) => ({ value: c.uuid, label: c.name }))}
                  value={state.category_id || ""}
                  onChange={(v) => { set("category_id", v || ""); markTouched("category_id"); }}
                  placeholder="Select a category"
                  disabled={isLoading}
                  hasError={!!showErr("category_id")} />
              </Field>

              <Field label="Course type" icon={Tag} error={showErr("course_status")} required>
                <select
                  value={state.course_status} disabled={isLoading}
                  onChange={(ev) => set("course_status", ev.target.value)}
                  style={inputStyle(!!showErr("course_status"))}
                >
                  <option value="basic">Basic</option>
                  <option value="advance">Advance</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Monthly fee (Rs.)" icon={CircleDollarSign}
                error={showErr("monthly_fee")}
                helper="1,000 – 99,999"
                required
              >
                <input
                  type="number" inputMode="numeric" min={FEE_MIN} max={FEE_MAX} step="1"
                  value={state.monthly_fee} disabled={isLoading}
                  onChange={(ev) => set("monthly_fee", ev.target.value)}
                  onBlur={() => markTouched("monthly_fee")}
                  placeholder="8000"
                  style={inputStyle(!!showErr("monthly_fee"))}
                />
              </Field>

              <Field
                label="Enrollment fee (Rs.)" icon={CircleDollarSign}
                error={showErr("enrollment_fee")}
                helper="1,000 – 99,999"
                required
              >
                <input
                  type="number" inputMode="numeric" min={FEE_MIN} max={FEE_MAX} step="1"
                  value={state.enrollment_fee} disabled={isLoading}
                  onChange={(ev) => set("enrollment_fee", ev.target.value)}
                  onBlur={() => markTouched("enrollment_fee")}
                  placeholder="10000"
                  style={inputStyle(!!showErr("enrollment_fee"))}
                />
              </Field>
            </div>

            <Field label="Course code" icon={Hash} helper="Optional short identifier, e.g. CL-WD">
              <input
                type="text" value={state.course_code} disabled={isLoading}
                onChange={(ev) => set("course_code", ev.target.value)}
                placeholder="CL-WD"
                style={inputStyle(false)}
              />
            </Field>

            <label
              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
              style={{ background: state.is_scheduled ? BRAND_RED_TINT : "#F8FAFC", border: `1px solid ${state.is_scheduled ? "#FECACA" : BORDER}` }}
            >
              <input
                type="checkbox" checked={state.is_scheduled} disabled={isLoading}
                onChange={(ev) => set("is_scheduled", ev.target.checked)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_RED }}
              />
              <CalendarCheck size={15} strokeWidth={2} style={{ color: state.is_scheduled ? BRAND_RED : TEXT_SECONDARY }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: state.is_scheduled ? BRAND_RED : TEXT_PRIMARY }}>
                  Scheduled course
                </div>
                <div className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 1 }}>
                  Toggle on if this course follows a fixed schedule
                </div>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
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
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : isEdit ? "Save changes" : "Create course"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
