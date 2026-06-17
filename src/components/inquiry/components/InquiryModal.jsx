import React, { useEffect, useMemo, useState } from "react";
import {
  X, ClipboardList, User, Phone, Mail, MapPin, Calendar, BookOpen,
  CreditCard, Briefcase, FileText, Image as ImageIcon, Loader2,
  Users as UsersIcon, Sun,
} from "lucide-react";
import SearchableSelect from "../../ui/SearchableSelect";

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

const validate = (s) => {
  const e = {};
  if (!s.first_name.trim()) e.first_name = "First name is required";
  if (!s.last_name.trim()) e.last_name = "Last name is required";
  if (!s.email.trim()) e.email = "Email is required";
  else if (!EMAIL_RE.test(s.email)) e.email = "Enter a valid email";
  if (!s.phone_number.trim()) e.phone_number = "Phone is required";
  if (!s.guardian_name.trim()) e.guardian_name = "Guardian name is required";
  if (!s.guardian_phone.trim()) e.guardian_phone = "Guardian phone is required";
  if (!["male", "female"].includes(s.gender)) e.gender = "Pick gender";
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

const Segmented = ({ value, onChange, options, error }) => (
  <div
    className="inline-flex w-full items-center gap-1 p-0.5 rounded-lg"
    style={{ background: SURFACE_HOVER, border: `1px solid ${error ? "#FCA5A5" : BORDER}` }}
  >
    {options.map((opt) => (
      <button
        key={opt.v} type="button" onClick={() => onChange(opt.v)}
        className="flex-1 px-2 py-1.5 text-xs font-semibold transition rounded-md"
        style={{ color: value === opt.v ? "#fff" : TEXT_SECONDARY, background: value === opt.v ? BRAND_RED : "transparent" }}
      >{opt.l}</button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h4 className="text-[12px] font-bold uppercase tracking-wider mt-1 mb-3" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
    {children}
  </h4>
);

const InquiryModal = ({
  isOpen,
  mode,                // "add" | "edit"
  initialInquiry,
  courses = [],
  onClose,
  onSubmit,            // (payload, isMultipart) => Promise<{error: string|null}>
  isLoading,
}) => {
  const isEdit = mode === "edit";

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
    student_type: "", is_laptop_demanded: "No",
    profile_image: null,         // File (create only)
    qualification_file: null,    // File (create only)
    status: "pending",           // edit only
  };

  const [state, setState] = useState(blank);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTouched({});
    setServerError("");
    if (isEdit && initialInquiry) {
      setState({
        first_name: initialInquiry.first_name || "",
        last_name: initialInquiry.last_name || "",
        email: initialInquiry.email || "",
        phone_number: initialInquiry.phone_number || "",
        guardian_name: initialInquiry.guardian_name || "",
        guardian_phone: initialInquiry.guardian_phone || "",
        gender: initialInquiry.gender === "female" ? "female" : "male",
        shift: ["morning", "afternoon", "evening"].includes(initialInquiry.shift)
          ? initialInquiry.shift : "morning",
        city: initialInquiry.city || "",
        address: initialInquiry.address || "",
        date_of_birth: initialInquiry.date_of_birth || "",
        marital_status: initialInquiry.marital_status || "",
        cnic: initialInquiry.cnic || "",
        current_qualification: initialInquiry.current_qualification || "",
        qualification_programs: initialInquiry.qualification_programs || "",
        primary_course_id: initialInquiry.primary_course?.id
          ? String(initialInquiry.primary_course.id)
          : initialInquiry.primary_course_id
          ? String(initialInquiry.primary_course_id)
          : "",
        primary_status: initialInquiry.primary_status || "basic",
        secondary_course_id: initialInquiry.secondary_course?.id
          ? String(initialInquiry.secondary_course.id)
          : initialInquiry.secondary_course_id
          ? String(initialInquiry.secondary_course_id)
          : "",
        secondary_status: initialInquiry.secondary_status || "",
        company_name: initialInquiry.company_name || "",
        job_title: initialInquiry.job_title || "",
        joined_date: initialInquiry.joined_date || "",
        leaving_date: initialInquiry.leaving_date || "",
        student_type: initialInquiry.student_type || "",
        is_laptop_demanded: initialInquiry.is_laptop_demanded || "No",
        profile_image: null,
        qualification_file: null,
        status: initialInquiry.status || "pending",
      });
    } else {
      setState(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialInquiry?.id]);

  const errors = validate(state);
  const isValid = Object.keys(errors).length === 0;
  const showErr = (k) => (touched[k] && errors[k]) || "";

  const set = (k, v) => {
    setState((p) => ({ ...p, [k]: v }));
    if (serverError) setServerError("");
  };
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses]
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
    if (state.student_type.trim()) out.student_type = state.student_type.trim();
    if (isEdit) out.status = state.status;
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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setTouched(Object.fromEntries(Object.keys(state).map((k) => [k, true])));
    if (!isValid) return;

    setServerError("");
    let payload, isMultipart;
    if (isEdit) {
      payload = buildJsonPayload();
      isMultipart = false;
    } else {
      const hasFiles = !!state.profile_image || !!state.qualification_file;
      payload = hasFiles ? buildFormDataPayload() : buildJsonPayload();
      isMultipart = hasFiles;
    }
    const result = await onSubmit(payload, isMultipart);
    if (result?.error) setServerError(result.error);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <ClipboardList size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isEdit ? "Edit Inquiry" : "Create Inquiry"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                {isEdit
                  ? "File uploads can only be set at creation — delete and re-add to change them."
                  : "Admin-mediated enrolment intake — all required fields are marked *."}
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
        <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "75vh" }}>
          {serverError && (
            <div className="p-2.5 mb-4 text-[12px] rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
              {serverError}
            </div>
          )}

          <SectionTitle>Personal</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
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
              <Segmented value={state.gender} onChange={(v) => set("gender", v)} error={!!showErr("gender")} options={[
                { v: "male", l: "Male" }, { v: "female", l: "Female" },
              ]} />
            </Field>
            <Field label="Shift" icon={Sun} error={showErr("shift")} required>
              <Segmented value={state.shift} onChange={(v) => set("shift", v)} error={!!showErr("shift")} options={[
                { v: "morning", l: "Morning" }, { v: "afternoon", l: "Afternoon" }, { v: "evening", l: "Evening" },
              ]} />
            </Field>
            <Field label="Date of birth" icon={Calendar} error={showErr("date_of_birth")} required>
              <input type="date" max={todayStr()} value={state.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} onBlur={() => markTouched("date_of_birth")} disabled={isLoading} style={inputStyle(!!showErr("date_of_birth"))} />
            </Field>
            <Field label="CNIC" icon={CreditCard} error={showErr("cnic")} helper="13 digits, e.g. 35202-1234567-1" required>
              <input type="text" value={state.cnic} onChange={(e) => set("cnic", e.target.value)} onBlur={() => markTouched("cnic")} disabled={isLoading} placeholder="35202-1234567-1" style={inputStyle(!!showErr("cnic"))} />
            </Field>
            <Field label="Marital status" icon={User} helper="Optional">
              <input type="text" value={state.marital_status} onChange={(e) => set("marital_status", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="City" icon={MapPin} error={showErr("city")} required>
              <input type="text" value={state.city} onChange={(e) => set("city", e.target.value)} onBlur={() => markTouched("city")} disabled={isLoading} style={inputStyle(!!showErr("city"))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address" icon={MapPin} error={showErr("address")} required>
                <textarea rows={2} value={state.address} onChange={(e) => set("address", e.target.value)} onBlur={() => markTouched("address")} disabled={isLoading}
                  style={{ ...inputStyle(!!showErr("address")), height: "auto", padding: 12, resize: "vertical" }}
                />
              </Field>
            </div>
          </div>

          <SectionTitle>Guardian</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Guardian name" icon={User} error={showErr("guardian_name")} required>
              <input type="text" value={state.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} onBlur={() => markTouched("guardian_name")} disabled={isLoading} style={inputStyle(!!showErr("guardian_name"))} />
            </Field>
            <Field label="Guardian phone" icon={Phone} error={showErr("guardian_phone")} required>
              <input type="tel" value={state.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} onBlur={() => markTouched("guardian_phone")} disabled={isLoading} style={inputStyle(!!showErr("guardian_phone"))} />
            </Field>
          </div>

          <SectionTitle>Education</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Current qualification" icon={BookOpen} error={showErr("current_qualification")} required>
              <input type="text" value={state.current_qualification} onChange={(e) => set("current_qualification", e.target.value)} onBlur={() => markTouched("current_qualification")} disabled={isLoading} style={inputStyle(!!showErr("current_qualification"))} placeholder="Matric, Intermediate, BS…" />
            </Field>
            <Field label="Programme / specialisation" icon={BookOpen} error={showErr("qualification_programs")} required>
              <input type="text" value={state.qualification_programs} onChange={(e) => set("qualification_programs", e.target.value)} onBlur={() => markTouched("qualification_programs")} disabled={isLoading} style={inputStyle(!!showErr("qualification_programs"))} placeholder="BS Computer Science, Pre-engineering…" />
            </Field>
          </div>

          <SectionTitle>Courses</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
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
              <Segmented value={state.primary_status} onChange={(v) => set("primary_status", v)} error={!!showErr("primary_status")} options={[
                { v: "basic", l: "Basic" }, { v: "advanced", l: "Advanced" },
              ]} />
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
              <Segmented
                value={state.secondary_status}
                onChange={(v) => set("secondary_status", v)}
                error={!!showErr("secondary_status")}
                options={[{ v: "", l: "—" }, { v: "basic", l: "Basic" }, { v: "advanced", l: "Advanced" }]}
              />
            </Field>
          </div>

          <SectionTitle>Employment (optional)</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Company name" icon={Briefcase}>
              <input type="text" value={state.company_name} onChange={(e) => set("company_name", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Job title" icon={Briefcase}>
              <input type="text" value={state.job_title} onChange={(e) => set("job_title", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Joined date" icon={Calendar}>
              <input type="date" value={state.joined_date} onChange={(e) => set("joined_date", e.target.value)} disabled={isLoading} style={inputStyle(false)} />
            </Field>
            <Field label="Leaving date" icon={Calendar} error={showErr("leaving_date")}>
              <input type="date" value={state.leaving_date} onChange={(e) => set("leaving_date", e.target.value)} onBlur={() => markTouched("leaving_date")} disabled={isLoading} style={inputStyle(!!showErr("leaving_date"))} />
            </Field>
          </div>

          <SectionTitle>Additional</SectionTitle>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Student type" icon={User}>
              <input type="text" value={state.student_type} onChange={(e) => set("student_type", e.target.value)} disabled={isLoading} style={inputStyle(false)} placeholder="Self-paying / Sponsored…" />
            </Field>
            <Field label="Laptop demanded">
              <Segmented value={state.is_laptop_demanded} onChange={(v) => set("is_laptop_demanded", v)} options={[
                { v: "No", l: "No" }, { v: "Yes", l: "Yes" },
              ]} />
            </Field>
            {isEdit && (
              <Field label="Inquiry status">
                <Segmented value={state.status} onChange={(v) => set("status", v)} options={[
                  { v: "process",  l: "Process" },
                  { v: "pending",  l: "Pending" },
                  { v: "enrolled", l: "Enrolled" },
                  { v: "dropout",  l: "Dropout" },
                ]} />
              </Field>
            )}
          </div>

          {!isEdit && (
            <>
              <SectionTitle>Documents (optional, create only)</SectionTitle>
              <div className="grid grid-cols-1 gap-3 mb-2 md:grid-cols-2">
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
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <button
            type="button" onClick={onClose} disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={handleSubmit} disabled={isLoading || !isValid}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)",
            }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : isEdit ? "Save changes" : "Create inquiry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
