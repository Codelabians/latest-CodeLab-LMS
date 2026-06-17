import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, ClipboardList, User, Phone, Mail, MapPin, Calendar, BookOpen,
  CreditCard, Briefcase, FileText, Image as ImageIcon, Loader2,
  Users as UsersIcon, Sun, AlertTriangle, ChevronDown, Check, Circle,
  Sliders, FilePlus,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation,
} from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import AddressAutocomplete from "../ui/AddressAutocomplete";
import { TRAINING_INQUIRY } from "../routes/RouteConstants";

/* ───────────────── brand tokens ───────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const CNIC_RE = /^[0-9]{5}-?[0-9]{7}-?[0-9]$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ───────────────── validation ─────────────────
 *
 * Each rule maps to a tab id so the tab strip can show a red dot
 * indicator when there are visible errors in that section.
 */
const FIELD_TAB = {
  first_name: "personal",  last_name: "personal",  email: "personal", phone_number: "personal",
  gender: "personal",      shift: "personal",      city: "personal",  address: "personal",
  date_of_birth: "personal", marital_status: "personal", cnic: "personal",
  guardian_name: "guardian", guardian_phone: "guardian",
  current_qualification: "education", qualification_programs: "education",
  primary_course_id: "courses", primary_status: "courses",
  secondary_course_id: "courses", secondary_status: "courses",
  company_name: "employment", job_title: "employment",
  joined_date: "employment", leaving_date: "employment",
  student_type: "additional", is_laptop_demanded: "additional", status: "additional",
  profile_image: "documents", qualification_file: "documents",
};

const validate = (s) => {
  const e = {};
  if (!s.first_name.trim()) e.first_name = "First name is required";
  if (!s.last_name.trim()) e.last_name = "Last name is required";
  if (!s.email.trim()) e.email = "Email is required";
  else if (!EMAIL_RE.test(s.email)) e.email = "Enter a valid email";
  if (!s.phone_number.trim()) e.phone_number = "Phone is required";
  if (!s.guardian_name.trim()) e.guardian_name = "Guardian name is required";
  if (!s.guardian_phone.trim()) e.guardian_phone = "Guardian phone is required";
  if (!["male", "female", "other"].includes(s.gender)) e.gender = "Pick gender";
  if (!["morning", "afternoon", "evening"].includes(s.shift)) e.shift = "Pick a shift";
  if (!s.city.trim()) e.city = "City is required";
  if (!s.address.trim()) e.address = "Address is required";
  if (!s.date_of_birth) e.date_of_birth = "Date of birth is required";
  else if (s.date_of_birth >= todayStr()) e.date_of_birth = "Must be before today";
  if (!s.cnic.trim()) e.cnic = "CNIC is required";
  else if (!CNIC_RE.test(s.cnic)) e.cnic = "CNIC: 13 digits, e.g. 35202-1234567-1";
  if (!s.current_qualification.trim()) e.current_qualification = "Required";
  if (!s.qualification_programs.trim()) e.qualification_programs = "Required";
  if (!s.primary_course_id) e.primary_course_id = "Pick a primary course";
  if (!["basic", "advanced"].includes(s.primary_status)) e.primary_status = "Pick a level";

  if (s.secondary_course_id && s.secondary_course_id === s.primary_course_id) {
    e.secondary_course_id = "Must be different from primary";
  }
  if (s.secondary_course_id && !["basic", "advanced"].includes(s.secondary_status)) {
    e.secondary_status = "Pick a level for the secondary course";
  }
  if (s.leaving_date && s.joined_date && s.leaving_date < s.joined_date) {
    e.leaving_date = "Cannot be before joining date";
  }
  return e;
};

const inputStyle = (err) => ({
  background: SURFACE_HOVER,
  border: `1px solid ${err ? "#FCA5A5" : BORDER}`,
  color: TEXT_PRIMARY,
  fontFamily: "'Montserrat', sans-serif",
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
});

const Field = ({ label, icon: Icon, error, helper, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>
      {Icon && <Icon size={13} strokeWidth={2} style={{ color: TEXT_SECONDARY }} />}
      {label}
      {required && <span style={{ color: BRAND_RED }}>*</span>}
    </label>
    {children}
    {(error || helper) && (
      <p className="text-[11px]" style={{ color: error ? BRAND_RED : TEXT_MUTED, fontWeight: error ? 500 : 400, marginTop: 2 }}>
        {error || helper}
      </p>
    )}
  </div>
);

/* ───────────────── styled native select dropdown ───────────────── */
const Select = ({ value, onChange, options, error, disabled, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        ...inputStyle(error),
        appearance: "none",
        WebkitAppearance: "none",
        paddingRight: 34,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {placeholder !== undefined && (
        <option value="">{placeholder}</option>
      )}
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
    <ChevronDown
      size={14}
      strokeWidth={2.25}
      className="absolute pointer-events-none -translate-y-1/2 right-3 top-1/2"
      style={{ color: TEXT_MUTED }}
    />
  </div>
);

/* ───────────────── tabs strip ───────────────── */
/* HR-style equal-width tabs (matches hr/employees/EmployeeFormPage):
 *   - flex-1 buttons in a bordered white container
 *   - stacked icon-label + hint subtext
 *   - active state is a soft red tint with red text (NOT solid red),
 *     consistent with the HR forms
 *   - red dot indicator when there are validation errors in that tab
 */
const TabsStrip = ({ tabs, active, onChange, errorTabs }) => (
  <div
    className="sticky top-0 z-20 flex gap-1 p-1 mb-5 bg-white rounded-lg"
    style={{ border: `1px solid ${BORDER}` }}
  >
    {tabs.map((t) => {
      const Icon = t.icon;
      const isActive = active === t.id;
      const hasErr = errorTabs.has(t.id);
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-md transition"
          style={{
            background: isActive ? BRAND_RED_TINT : "transparent",
            color:      isActive ? BRAND_RED      : TEXT_SECONDARY,
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = SURFACE_HOVER; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
            {Icon && <Icon size={12} strokeWidth={2.25} />}
            {t.label}
            {hasErr && (
              <span
                className="inline-block rounded-full"
                style={{ width: 5, height: 5, background: BRAND_RED }}
                title="Has errors"
              />
            )}
          </span>
          {t.hint && (
            <span className="text-[10px]" style={{ color: isActive ? BRAND_RED : TEXT_MUTED }}>
              {t.hint}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* ───────────────── main full-page form ───────────────── */
const InquiryFormPage = ({ mode }) => {
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const { id } = useParams();
  // Prefill from navigate state — used when reception converts a visitor
  // into an inquiry. The visitor row carries name / contact / email /
  // interested course, which seeds the basics tab so the admin only has
  // to fill the rest of the intake.
  const location = useLocation();
  const prefill = location.state?.prefill || null;

  const blank = {
    first_name: "", last_name: "", email: "", phone_number: "",
    guardian_name: "", guardian_phone: "",
    gender: "male", shift: "morning",
    city: "", address: "", date_of_birth: "", marital_status: "",
    cnic: "",
    current_qualification: "", qualification_programs: "",
    primary_course_id: "", primary_status: "basic",
    secondary_course_id: "", secondary_status: "",
    company_name: "", job_title: "", joined_date: "", leaving_date: "",
    student_type: "", is_laptop_demanded: "No", laptop_fee: "",
    profile_image: null, qualification_file: null,
    status: "pending",
    // Phase F-Inquiry #8 — discount quoted at reception. Stored as flat
    // rupees. Resets to "" whenever primary_course_id changes (see effect
    // below) so a 2000 discount on a 10,000 course doesn't silently apply
    // to a 30,000 course after the admin switches it.
    enrollment_discount: "",
    monthly_discount: "",
    discount_reason: "",
  };

  const [state, setState] = useState(blank);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  /* dropdown data */
  const { data: coursesData } = useGetQuery({
    path: "/course/courses",
    params: { per_page: 100 },
  });
  const courses = coursesData?.data || [];

  /* cities for the City dropdown — reads the seeded reference data */
  const { data: citiesData } = useGetQuery({ path: "/core/cities/active" });
  // Org-wide default discounts (percent) — converted to a Rs amount per course.
  const { data: discSettings } = useGetQuery({ path: "finance/fee-discount-settings" });
  const defEnrPct = discSettings?.data?.enrollment_discount_percent ?? 0;
  const defMonPct = discSettings?.data?.monthly_discount_percent ?? 0;
  const cities = citiesData?.data || [];

  /* edit data — fetch inquiry by id */
  const { data: inquiryData, isLoading: loadingInquiry, error: loadError } = useGetQuery(
    { path: isEdit && id ? `/student/inquiry/${id}` : "", params: {} },
    { skip: !isEdit || !id }
  );

  /* mutations */
  const [createInquiry, { isLoading: creating }] = usePostMutation();
  const [updateInquiry, { isLoading: updating }] = usePatchMutation();

  /* hydrate in edit mode */
  useEffect(() => {
    if (!isEdit) return;
    const v = inquiryData?.data;
    if (!v) return;
    setState({
      first_name: v.first_name || "",
      last_name: v.last_name || "",
      email: v.email || "",
      phone_number: v.phone_number || "",
      guardian_name: v.guardian_name || "",
      guardian_phone: v.guardian_phone || "",
      gender: v.gender === "female" ? "female" : "male",
      shift: ["morning", "afternoon", "evening"].includes(v.shift) ? v.shift : "morning",
      city: v.city || "",
      address: v.address || "",
      date_of_birth: v.date_of_birth || "",
      marital_status: v.marital_status || "",
      cnic: v.cnic || "",
      current_qualification: v.current_qualification || "",
      qualification_programs: v.qualification_programs || "",
      primary_course_id: v.primary_course?.id
        ? String(v.primary_course.id)
        : v.primary_course_id ? String(v.primary_course_id) : "",
      primary_status: v.primary_status || "basic",
      secondary_course_id: v.secondary_course?.id
        ? String(v.secondary_course.id)
        : v.secondary_course_id ? String(v.secondary_course_id) : "",
      secondary_status: v.secondary_status || "",
      company_name: v.company_name || "",
      job_title: v.job_title || "",
      joined_date: v.joined_date || "",
      leaving_date: v.leaving_date || "",
      student_type: v.student_type || "",
      is_laptop_demanded: v.is_laptop_demanded || "No",
      laptop_fee: v.laptop_fee ?? "",
      profile_image: null,
      qualification_file: null,
      status: v.status || "pending",
      // Phase F-Inquiry #8 — hydrate quoted discount in edit mode.
      enrollment_discount: v.enrollment_discount ? String(v.enrollment_discount) : "",
      monthly_discount:    v.monthly_discount    ? String(v.monthly_discount)    : "",
      discount_reason:     v.discount_reason || "",
    });
  }, [isEdit, inquiryData?.data?.id]);

  /* Hydrate in ADD mode from visitor-convert prefill (if any). Runs once
   * per mount when a prefill payload is supplied through location.state. */
  useEffect(() => {
    if (isEdit) return;
    if (!prefill) return;
    setState((p) => ({
      ...p,
      first_name:        prefill.first_name        ?? p.first_name,
      last_name:         prefill.last_name         ?? p.last_name,
      email:             prefill.email             ?? p.email,
      phone_number:      prefill.phone_number      ?? p.phone_number,
      primary_course_id: prefill.primary_course_id ?? p.primary_course_id,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = validate(state);
  const isValid = Object.keys(errors).length === 0;
  const showErr = (k) => (touched[k] && errors[k]) || "";

  /* Which tabs have a touched-and-erroring field — drives the red dots */
  const errorTabs = useMemo(() => {
    const set = new Set();
    Object.entries(errors).forEach(([field]) => {
      if (touched[field] && FIELD_TAB[field]) set.add(FIELD_TAB[field]);
    });
    return set;
  }, [errors, touched]);

  const set = (k, v) => {
    setState((p) => ({ ...p, [k]: v }));
    if (serverError) setServerError("");
  };
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses]
  );

  /* Phase F-Inquiry #8 — base fees of the currently picked primary
   * course; drives the Fee & Discount panel below + clamps the discount
   * inputs so admin can't enter more than the base. */
  const primaryCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(state.primary_course_id)) || null,
    [courses, state.primary_course_id]
  );
  const baseEnrollmentFee = Number(primaryCourse?.enrollment_fee || 0);
  const baseMonthlyFee    = Number(primaryCourse?.monthly_fee    || 0);
  const enrollmentDiscountNum = Math.max(0, Math.min(baseEnrollmentFee, Number(state.enrollment_discount) || 0));
  const monthlyDiscountNum    = Math.max(0, Math.min(baseMonthlyFee,    Number(state.monthly_discount)    || 0));
  const netEnrollmentFee = Math.max(0, baseEnrollmentFee - enrollmentDiscountNum);
  const netMonthlyFee    = Math.max(0, baseMonthlyFee    - monthlyDiscountNum);

  /* Reset any quoted discount when the admin switches primary course —
   * a Rs. 2000 discount on Course A means nothing on Course B. */
  const lastCourseIdRef = useRef(state.primary_course_id);
  useEffect(() => {
    if (lastCourseIdRef.current !== state.primary_course_id) {
      lastCourseIdRef.current = state.primary_course_id;
      // Skip the very first hydration in edit mode (we *want* to keep
      // the persisted discount that came back from the API).
      if (!isEdit || (inquiryData?.data?.primary_course?.id && Number(inquiryData.data.primary_course.id) !== Number(state.primary_course_id))) {
        // Seed the org-wide default discount (% → Rs for this course) instead
        // of clearing; admin can still override.
        setState((p) => ({
          ...p,
          enrollment_discount: defEnrPct ? String(Math.round(baseEnrollmentFee * defEnrPct / 100)) : "",
          monthly_discount:    defMonPct ? String(Math.round(baseMonthlyFee    * defMonPct / 100)) : "",
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.primary_course_id]);

  /**
   * City dropdown options — labelled as "City · Province" so the admin
   * can tell apart cities with the same name across different provinces.
   * Values are city *names* (the inquiry table stores city as a plain
   * string), so we keep this normalized to a single string.
   */
  const cityOptions = useMemo(
    () => cities.map((c) => ({
      value: c.name,
      label: c.province_name ? `${c.name} · ${c.province_name}` : c.name,
    })),
    [cities]
  );

  const buildJsonPayload = () => {
    const out = {
      first_name: state.first_name.trim(),
      last_name: state.last_name.trim(),
      email: state.email.trim(),
      phone_number: state.phone_number.trim(),
      guardian_name: state.guardian_name.trim(),
      guardian_phone: state.guardian_phone.trim(),
      gender: state.gender,
      shift: state.shift,
      city: state.city.trim(),
      address: state.address.trim(),
      date_of_birth: state.date_of_birth,
      cnic: state.cnic.trim(),
      current_qualification: state.current_qualification.trim(),
      qualification_programs: state.qualification_programs.trim(),
      primary_course_id: Number(state.primary_course_id),
      primary_status: state.primary_status,
      is_laptop_demanded: state.is_laptop_demanded,
      laptop_required: state.is_laptop_demanded === "Yes",
      laptop_fee: state.is_laptop_demanded === "Yes" && state.laptop_fee !== "" ? (Number(state.laptop_fee) || 0) : 0,
    };
    if (state.marital_status.trim()) out.marital_status = state.marital_status.trim();
    if (state.secondary_course_id) {
      out.secondary_course_id = Number(state.secondary_course_id);
      out.secondary_status = state.secondary_status;
    }
    if (state.company_name.trim()) out.company_name = state.company_name.trim();
    if (state.job_title.trim()) out.job_title = state.job_title.trim();
    if (state.joined_date) out.joined_date = state.joined_date;
    if (state.leaving_date) out.leaving_date = state.leaving_date;
    if (state.student_type) out.student_type = state.student_type;
    if (isEdit) out.status = state.status;
    // Phase F-Inquiry #8 — quoted discount. Always sent so going back to
    // 0 explicitly clears the audit columns server-side.
    out.enrollment_discount = enrollmentDiscountNum;
    out.monthly_discount    = monthlyDiscountNum;
    if (state.discount_reason.trim()) {
      out.discount_reason = state.discount_reason.trim();
    } else {
      out.discount_reason = null;
    }
    return out;
  };

  const buildFormDataPayload = () => {
    const fd = new FormData();
    const json = buildJsonPayload();
    Object.entries(json).forEach(([k, v]) => fd.append(k, v));
    if (state.profile_image) fd.append("profile_image", state.profile_image);
    if (state.qualification_file) fd.append("qualification_file", state.qualification_file);
    return fd;
  };

  const handleSubmit = async () => {
    // Touch everything so any pending error dots light up on the tab strip.
    setTouched(Object.fromEntries(Object.keys(state).map((k) => [k, true])));
    if (!isValid) {
      // Auto-jump to the first tab that has an error.
      const firstBadField = Object.keys(errors)[0];
      const firstBadTab = FIELD_TAB[firstBadField];
      if (firstBadTab) setActiveTab(firstBadTab);
      return;
    }
    setServerError("");
    try {
      if (isEdit) {
        await updateInquiry({ path: `/student/inquiry/${id}`, body: buildJsonPayload() }).unwrap();
        showToast("Inquiry updated", "success");
      } else {
        const hasFiles = !!state.profile_image || !!state.qualification_file;
        const body = hasFiles ? buildFormDataPayload() : buildJsonPayload();
        await createInquiry({ path: "/student/inquiry", body }).unwrap();
        showToast("Inquiry created", "success");
      }
      navigate(TRAINING_INQUIRY);
    } catch (err) {
      const errs = err?.data?.errors || {};
      const firstFieldError = Object.values(errs)[0]?.[0];
      setServerError(firstFieldError || err?.data?.message || "Could not save inquiry.");
    }
  };

  /* edit-mode loading + error states */
  if (isEdit && loadingInquiry) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: BRAND_RED }} />
      </div>
    );
  }
  if (isEdit && loadError) {
    return (
      <div className="px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC", fontFamily: "'Montserrat', sans-serif" }}>
        <button type="button" onClick={() => navigate(TRAINING_INQUIRY)}
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition" style={{ color: TEXT_SECONDARY }}
        >
          <ArrowLeft size={15} strokeWidth={2.25} /> Back to inquiries
        </button>
        <div className="flex items-center justify-center p-10 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-center">
            <AlertTriangle size={28} style={{ color: BRAND_RED }} className="mx-auto mb-3" />
            <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              Inquiry not found or no permission to view.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = creating || updating;

  /* Tab definitions — order drives the strip and the Next button.
   * `hint` is the small subtext rendered under each tab label in the
   * HR-style strip. */
  const tabs = [
    { id: "personal",   label: "Personal",   icon: User,       hint: "Name, contact, CNIC" },
    { id: "guardian",   label: "Guardian",   icon: UsersIcon,  hint: "Parent / guardian"   },
    { id: "education",  label: "Education",  icon: BookOpen,   hint: "Qualifications"      },
    { id: "courses",    label: "Courses",    icon: BookOpen,   hint: "Primary + secondary" },
    { id: "employment", label: "Employment", icon: Briefcase,  hint: "Optional"            },
    { id: "additional", label: "Additional", icon: Sliders,    hint: "Type, laptop, status"},
    ...(isEdit ? [] : [{ id: "documents", label: "Documents", icon: FilePlus, hint: "Photo, files" }]),
  ];

  const goNext = () => {
    const i = tabs.findIndex((t) => t.id === activeTab);
    if (i >= 0 && i < tabs.length - 1) setActiveTab(tabs[i + 1].id);
  };
  const goPrev = () => {
    const i = tabs.findIndex((t) => t.id === activeTab);
    if (i > 0) setActiveTab(tabs[i - 1].id);
  };

  return (
    <div
      className="w-full px-6 py-6 pb-24 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      {/* Back link */}
      <button
        type="button" onClick={() => navigate(TRAINING_INQUIRY)}
        className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition"
        style={{ color: TEXT_SECONDARY }}
        onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_RED)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SECONDARY)}
      >
        <ArrowLeft size={15} strokeWidth={2.25} />
        Back to inquiries
      </button>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <ClipboardList size={20} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
            {isEdit ? "Edit Inquiry" : "Create New Inquiry"}
          </h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
            {isEdit
              ? "File uploads can only be set at creation — delete and re-add to change them."
              : "Tabs make this faster — jump between sections, validation errors appear as red dots."}
          </p>
        </div>
      </div>

      {/* Server-error banner */}
      {serverError && (
        <div
          className="px-4 py-3 mb-4 text-[13px] rounded-lg"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}
        >
          {serverError}
        </div>
      )}

      {/* Tabs strip */}
      <TabsStrip tabs={tabs} active={activeTab} onChange={setActiveTab} errorTabs={errorTabs} />

      {/* Section content card */}
      <div className="p-5 mb-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}`, minHeight: 280 }}>

        {/* ── PERSONAL ── */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="First name" icon={User} error={showErr("first_name")} required>
              <input type="text" value={state.first_name} onChange={(e) => set("first_name", e.target.value)} onBlur={() => markTouched("first_name")} disabled={isLoading} style={inputStyle(!!showErr("first_name"))} />
            </Field>
            <Field label="Last name" icon={User} error={showErr("last_name")} required>
              <input type="text" value={state.last_name} onChange={(e) => set("last_name", e.target.value)} onBlur={() => markTouched("last_name")} disabled={isLoading} style={inputStyle(!!showErr("last_name"))} />
            </Field>
            <Field label="Email" icon={Mail} error={showErr("email")} required>
              <input type="email" value={state.email} onChange={(e) => set("email", e.target.value)} onBlur={() => markTouched("email")} disabled={isLoading} style={inputStyle(!!showErr("email"))} />
            </Field>
            <Field label="Phone" icon={Phone} error={showErr("phone_number")} required>
              <input type="tel" value={state.phone_number} onChange={(e) => set("phone_number", e.target.value)} onBlur={() => markTouched("phone_number")} disabled={isLoading} style={inputStyle(!!showErr("phone_number"))} placeholder="0300 1234567" />
            </Field>
            <Field label="Gender" icon={UsersIcon} error={showErr("gender")} required>
              <Select
                value={state.gender}
                onChange={(v) => set("gender", v)}
                error={!!showErr("gender")}
                options={[
                  { v: "male",   l: "Male" },
                  { v: "female", l: "Female" },
                  { v: "other",  l: "Other" },
                ]}
              />
            </Field>
            <Field label="Shift" icon={Sun} error={showErr("shift")} required>
              <Select
                value={state.shift}
                onChange={(v) => set("shift", v)}
                error={!!showErr("shift")}
                options={[
                  { v: "morning",   l: "Morning" },
                  { v: "afternoon", l: "Afternoon" },
                  { v: "evening",   l: "Evening" },
                ]}
              />
            </Field>
            <Field label="Date of birth" icon={Calendar} error={showErr("date_of_birth")} required>
              <input type="date" max={todayStr()} value={state.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} onBlur={() => markTouched("date_of_birth")} disabled={isLoading} style={inputStyle(!!showErr("date_of_birth"))} />
            </Field>
            <Field label="CNIC" icon={CreditCard} error={showErr("cnic")} helper="13 digits, e.g. 35202-1234567-1" required>
              <input type="text" value={state.cnic} onChange={(e) => set("cnic", e.target.value)} onBlur={() => markTouched("cnic")} disabled={isLoading} placeholder="35202-1234567-1" style={inputStyle(!!showErr("cnic"))} />
            </Field>
            <Field label="Marital status" icon={User} helper="Optional">
              <Select
                value={state.marital_status}
                onChange={(v) => set("marital_status", v)}
                options={[
                  { v: "",          l: "— Select —" },
                  { v: "single",    l: "Single" },
                  { v: "married",   l: "Married" },
                  { v: "divorced",  l: "Divorced" },
                  { v: "widowed",   l: "Widowed" },
                  { v: "separated", l: "Separated" },
                ]}
              />
            </Field>
            <Field label="City" icon={MapPin} error={showErr("city")} helper={cityOptions.length === 0 ? "Add cities under System → Locations → Cities first." : ""} required>
              <SearchableSelect
                options={cityOptions}
                value={state.city}
                onChange={(v) => { set("city", v || ""); markTouched("city"); }}
                placeholder={cityOptions.length ? "Search city…" : "No cities yet"}
                disabled={cityOptions.length === 0}
                hasError={!!showErr("city")}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address" icon={MapPin} error={showErr("address")} required>
                <AddressAutocomplete
                  value={state.address}
                  onChange={(v) => { set("address", v); markTouched("address"); }}
                  hasError={!!showErr("address")}
                  disabled={isLoading}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── GUARDIAN ── */}
        {activeTab === "guardian" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Guardian name" icon={User} error={showErr("guardian_name")} required>
              <input type="text" value={state.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} onBlur={() => markTouched("guardian_name")} disabled={isLoading} style={inputStyle(!!showErr("guardian_name"))} />
            </Field>
            <Field label="Guardian phone" icon={Phone} error={showErr("guardian_phone")} required>
              <input type="tel" value={state.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} onBlur={() => markTouched("guardian_phone")} disabled={isLoading} style={inputStyle(!!showErr("guardian_phone"))} />
            </Field>
          </div>
        )}

        {/* ── EDUCATION ── */}
        {activeTab === "education" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Current qualification" icon={BookOpen} error={showErr("current_qualification")} required>
              <input type="text" value={state.current_qualification} onChange={(e) => set("current_qualification", e.target.value)} onBlur={() => markTouched("current_qualification")} disabled={isLoading} style={inputStyle(!!showErr("current_qualification"))} placeholder="Matric, Intermediate, BS…" />
            </Field>
            <Field label="Programme / specialisation" icon={BookOpen} error={showErr("qualification_programs")} required>
              <input type="text" value={state.qualification_programs} onChange={(e) => set("qualification_programs", e.target.value)} onBlur={() => markTouched("qualification_programs")} disabled={isLoading} style={inputStyle(!!showErr("qualification_programs"))} placeholder="BS Computer Science, Pre-engineering…" />
            </Field>
          </div>
        )}

        {/* ── COURSES ── */}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Primary course" icon={BookOpen} error={showErr("primary_course_id")} required>
              <SearchableSelect
                options={courseOptions}
                value={state.primary_course_id}
                onChange={(v) => { set("primary_course_id", v || ""); markTouched("primary_course_id"); }}
                placeholder="Pick a course"
                hasError={!!showErr("primary_course_id")}
              />
            </Field>
            <Field label="Primary level" error={showErr("primary_status")} required>
              <Select
                value={state.primary_status}
                onChange={(v) => set("primary_status", v)}
                error={!!showErr("primary_status")}
                options={[
                  { v: "basic",    l: "Basic" },
                  { v: "advanced", l: "Advanced" },
                ]}
              />
            </Field>
            <Field label="Secondary course" icon={BookOpen} error={showErr("secondary_course_id")} helper="Optional">
              <SearchableSelect
                options={courseOptions.filter((o) => o.value !== state.primary_course_id)}
                value={state.secondary_course_id}
                onChange={(v) => set("secondary_course_id", v || "")}
                placeholder="Optional"
                hasError={!!showErr("secondary_course_id")}
              />
            </Field>
            <Field label="Secondary level" error={showErr("secondary_status")} helper={state.secondary_course_id ? "" : "Pick a secondary course first"}>
              <Select
                value={state.secondary_status}
                onChange={(v) => set("secondary_status", v)}
                error={!!showErr("secondary_status")}
                placeholder="—"
                options={[
                  { v: "basic",    l: "Basic" },
                  { v: "advanced", l: "Advanced" },
                ]}
                disabled={!state.secondary_course_id}
              />
            </Field>

            {/* ── Phase F-Inquiry #8 — Fee & Discount panel ─────────────────
                Reception sometimes quotes a discount when the prospect walks
                in. We persist it on the inquiry so anyone re-opening the row
                later sees the same quote. At promotion time these numbers
                flow into fees.discount_fee + MonthlyFeeSchedule.amount so
                the recurring billing stays discounted forever. */}
            <div className="md:col-span-2"
                 style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, background: "#FAFBFD" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                    Fee &amp; discount (quoted at reception)
                  </h3>
                  <p style={{ fontSize: 11, color: TEXT_MUTED, margin: "2px 0 0" }}>
                    {primaryCourse
                      ? `Base fees from "${primaryCourse.name}". Discount is in rupees; can't exceed the base. Discounted monthly stays discounted forever.`
                      : "Pick a primary course above to enable discount inputs."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Enrollment */}
                <div style={{ background: "#fff", borderRadius: 8, padding: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.4 }}>Enrollment (one-time)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: TEXT_SECONDARY }}>
                    <span>Base</span>
                    <span>Rs. {baseEnrollmentFee.toLocaleString()}</span>
                  </div>
                  <label style={{ display: "block", fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>Discount (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    max={baseEnrollmentFee}
                    step="100"
                    value={state.enrollment_discount}
                    onChange={(e) => set("enrollment_discount", e.target.value)}
                    disabled={!primaryCourse || isLoading}
                    style={{ ...inputStyle(false), padding: "8px 10px", fontSize: 13 }}
                    placeholder="0"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, borderTop: `1px dashed ${BORDER}`, paddingTop: 6 }}>
                    <span>Net</span>
                    <span>Rs. {netEnrollmentFee.toLocaleString()}</span>
                  </div>
                </div>

                {/* Monthly */}
                <div style={{ background: "#fff", borderRadius: 8, padding: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.4 }}>Monthly (recurring)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: TEXT_SECONDARY }}>
                    <span>Base</span>
                    <span>Rs. {baseMonthlyFee.toLocaleString()}</span>
                  </div>
                  <label style={{ display: "block", fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>Discount (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    max={baseMonthlyFee}
                    step="100"
                    value={state.monthly_discount}
                    onChange={(e) => set("monthly_discount", e.target.value)}
                    disabled={!primaryCourse || isLoading}
                    style={{ ...inputStyle(false), padding: "8px 10px", fontSize: 13 }}
                    placeholder="0"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, borderTop: `1px dashed ${BORDER}`, paddingTop: 6 }}>
                    <span>Net</span>
                    <span>Rs. {netMonthlyFee.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total due now (for context) */}
                <div style={{ background: BRAND_RED_TINT, borderRadius: 8, padding: 10, border: `1px solid #FECACA` }}>
                  <div style={{ fontSize: 11, color: BRAND_RED, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Total due to start</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: BRAND_RED, marginTop: 8 }}>
                    Rs. {(netEnrollmentFee + netMonthlyFee).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>
                    Net enrollment + first month
                  </div>
                  {(enrollmentDiscountNum + monthlyDiscountNum) > 0 && (
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>
                      Saving Rs. {(enrollmentDiscountNum + monthlyDiscountNum).toLocaleString()} vs base
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>
                  Discount note <span style={{ color: TEXT_MUTED }}>(optional — e.g. "Admin approved 20% — single mother")</span>
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={state.discount_reason}
                  onChange={(e) => set("discount_reason", e.target.value)}
                  disabled={isLoading}
                  style={{ ...inputStyle(false), padding: "8px 10px", fontSize: 13 }}
                  placeholder="Reason / who approved"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYMENT ── */}
        {activeTab === "employment" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company name" icon={Briefcase} helper="Optional">
              <input type="text" value={state.company_name} onChange={(e) => set("company_name", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Job title" icon={Briefcase} helper="Optional">
              <input type="text" value={state.job_title} onChange={(e) => set("job_title", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Joined date" icon={Calendar}>
              <input type="date" value={state.joined_date} onChange={(e) => set("joined_date", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Leaving date" icon={Calendar} error={showErr("leaving_date")}>
              <input type="date" value={state.leaving_date} onChange={(e) => set("leaving_date", e.target.value)} onBlur={() => markTouched("leaving_date")} disabled={isLoading} style={inputStyle(!!showErr("leaving_date"))} />
            </Field>
          </div>
        )}

        {/* ── ADDITIONAL ── */}
        {activeTab === "additional" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Student type" icon={User} helper="Boarder on-campus or daily commuter">
              <Select
                value={state.student_type}
                onChange={(v) => set("student_type", v)}
                placeholder="Not specified"
                options={[
                  { v: "hostalite",   l: "Hostalite" },
                  { v: "day_scholar", l: "Day Scholar" },
                ]}
              />
            </Field>
            <Field label="Laptop demanded">
              <Select
                value={state.is_laptop_demanded}
                onChange={(v) => set("is_laptop_demanded", v)}
                options={[
                  { v: "No",  l: "No" },
                  { v: "Yes", l: "Yes" },
                ]}
              />
            </Field>
            {state.is_laptop_demanded === "Yes" && (
              <Field label="Monthly laptop fee (Rs.)">
                <input
                  type="number"
                  min={0}
                  step="100"
                  value={state.laptop_fee}
                  onChange={(e) => set("laptop_fee", e.target.value)}
                  disabled={isLoading}
                  style={{ ...inputStyle(false), padding: "8px 10px", fontSize: 13 }}
                  placeholder="0"
                />
              </Field>
            )}
            {isEdit && (
              <Field label="Inquiry status" helper="Cold = applicant stopped responding">
                <Select
                  value={state.status}
                  onChange={(v) => set("status", v)}
                  options={[
                    { v: "pending",  l: "Pending" },
                    { v: "process",  l: "Process" },
                    { v: "enrolled", l: "Enrolled" },
                    { v: "dropout",  l: "Dropout" },
                    { v: "cold",     l: "Cold" },
                  ]}
                />
              </Field>
            )}
          </div>
        )}

        {/* ── DOCUMENTS (create only) ── */}
        {activeTab === "documents" && !isEdit && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Profile image" icon={ImageIcon} helper="JPG / PNG, ≤ 5MB">
              <input
                type="file" accept=".jpg,.jpeg,.png"
                onChange={(e) => set("profile_image", e.target.files?.[0] || null)}
                disabled={isLoading}
                style={{ ...inputStyle(false), padding: "8px 12px", height: "auto" }}
              />
            </Field>
            <Field label="Qualification file" icon={FileText} helper="PDF / JPG, ≤ 5MB">
              <input
                type="file" accept=".pdf,.jpg,.jpeg"
                onChange={(e) => set("qualification_file", e.target.files?.[0] || null)}
                disabled={isLoading}
                style={{ ...inputStyle(false), padding: "8px 12px", height: "auto" }}
              />
            </Field>
          </div>
        )}

        {/* Prev / Next inside the section card */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button" onClick={goPrev}
            disabled={tabs.findIndex((t) => t.id === activeTab) === 0}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >
            ← Previous
          </button>
          <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
            Step {tabs.findIndex((t) => t.id === activeTab) + 1} of {tabs.length}
          </div>
          <button
            type="button" onClick={goNext}
            disabled={tabs.findIndex((t) => t.id === activeTab) === tabs.length - 1}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "#fff", background: BRAND_RED }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Sticky save toolbar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{ background: "#FFFFFFCC", backdropFilter: "blur(8px)", borderTop: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-3 mx-auto">
          <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
            {isValid ? (
              <span className="inline-flex items-center gap-1.5">
                <Check size={12} strokeWidth={2.5} style={{ color: "#15803D" }} />
                Ready to save
              </span>
            ) : errorTabs.size > 0 ? (
              <span className="inline-flex items-center gap-1.5" style={{ color: BRAND_RED }}>
                <AlertTriangle size={12} strokeWidth={2.25} />
                Fix the highlighted fields
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Circle size={10} strokeWidth={2.25} style={{ color: TEXT_MUTED }} />
                Fill in the required fields marked *
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={() => navigate(TRAINING_INQUIRY)} disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
              style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
            >Cancel</button>
            <button
              type="button" onClick={handleSubmit} disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)",
              }}
            >
              {isLoading ? (<><Loader2 size={14} className="animate-spin" />Saving…</>) : isEdit ? "Save changes" : "Create inquiry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryFormPage;
