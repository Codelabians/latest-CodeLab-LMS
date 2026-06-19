import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Search,
  Check,
  ChevronDown,
  X,
  ClipboardList,
  Heart,
  Building2,
  Clock,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_EMPLOYEES, HR_EMPLOYEE_DETAIL } from "../../routes/RouteConstants";

/* ─────────────── brand tokens (mirror BrandsListPage style) ─────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

/**
 * Curated designation suggestions, grouped by department-ish theme.
 * Free text is still allowed — this is just an autocomplete catalog so
 * HR doesn't have to invent the same titles repeatedly and we get
 * consistent spelling across the org.
 *
 * Add new ones as HR coins them; we don't enforce this list anywhere.
 */
const DESIGNATION_SUGGESTIONS = [
  // Engineering
  "Junior Backend Developer", "Backend Developer", "Senior Backend Developer", "Lead Backend Developer",
  "Junior Frontend Developer", "Frontend Developer", "Senior Frontend Developer", "Lead Frontend Developer",
  "Full Stack Developer", "Senior Full Stack Developer", "Lead Full Stack Developer",
  "Mobile Developer (Android)", "Mobile Developer (iOS)", "Mobile Developer (Cross-platform)",
  "DevOps Engineer", "Senior DevOps Engineer", "Site Reliability Engineer",
  "QA Engineer", "Senior QA Engineer", "QA Lead",
  "Engineering Manager", "Project Manager", "Product Manager",
  // Design
  "UI Designer", "UX Designer", "UI/UX Designer", "Senior UI/UX Designer",
  "Graphic Designer", "Motion Designer", "Brand Designer",
  // Marketing & SEO
  "Marketing Specialist", "Marketing Manager", "Brand Manager",
  "SEO Specialist", "Senior SEO Specialist", "SEM Specialist",
  "Content Writer", "Content Strategist", "Copywriter",
  "Social Media Manager", "Digital Marketing Specialist",
  // Sales
  "Sales Officer", "Senior Sales Officer", "Sales Executive",
  "Account Manager", "Business Development Manager",
  // Operations / HR / Finance / Admin
  "Operations Coordinator", "Operations Manager",
  "HR Officer", "Senior HR Officer", "HR Business Partner", "HR Manager",
  "Accountant", "Senior Accountant", "Finance Officer", "Finance Manager",
  "Office Manager", "Administrative Assistant",
  // Teaching
  "Trainer", "Senior Trainer", "Lead Trainer",
  "Curriculum Designer", "Instructional Designer",
  // Leadership / C-suite
  "Team Lead", "Chief Technology Officer", "Chief Operating Officer", "Chief Sales Officer", "CEO",
];

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/**
 * Pakistani CNIC mask. Caps at 13 digits and auto-inserts dashes:
 *   "3120123685150" → "31201-2368515-0"
 *
 * Pasting works too — non-digits are stripped before the mask is applied.
 */
const formatCnic = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5)  return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

/**
 * Pakistani mobile mask. Accepts pastes like "03098201013", "+923098201013",
 * "923098201013", "3098201013" and normalises to "+92309-8201013".
 * Format: +92 + 3-digit operator code + dash + 7-digit subscriber number.
 */
const formatPhonePk = (raw) => {
  let s = String(raw || "").replace(/\D/g, "");
  // Strip country code if pasted in, then any leading 0.
  if (s.startsWith("92")) s = s.slice(2);
  if (s.startsWith("0"))  s = s.slice(1);
  s = s.slice(0, 10); // 10 digits total: 3-operator + 7-subscriber
  if (s.length === 0) return "";
  if (s.length <= 3)  return `+92${s}`;
  return `+92${s.slice(0, 3)}-${s.slice(3)}`;
};

/**
 * Snake/space/dash-separated string → Title Case.
 *   "hr_manager"     → "HR Manager"
 *   "sales_officer"  → "Sales Officer"
 *   "ceo"            → "CEO"
 *   "tech_school"    → "Tech School"
 *
 * Acronyms (≤3 chars + all letters) get uppercased; other tokens
 * get capitalised normally.
 */
const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      // Treat well-known short tokens as acronyms.
      const acronyms = new Set(["ceo", "coo", "cto", "cfo", "cso", "hr", "it", "qa", "ui", "ux", "seo", "api", "sme", "vp"]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

/* ─────────────── reusable field wrappers ────────────────────────────── */
const Label = ({ children, required }) => (
  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
    {children} {required && <span style={{ color: BRAND_RED }}>*</span>}
  </label>
);

const inputStyle = {
  borderColor: BORDER,
  color: TEXT_PRIMARY,
  background: "white",
};

const TextField = ({ label, required, value, onChange, type = "text", placeholder, autoComplete }) => (
  <div className="flex flex-col gap-1.5">
    <Label required={required}>{label}</Label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
      style={inputStyle}
    />
  </div>
);

/** Plain enum-style select (small fixed lists like work_location). */
const SelectField = ({ label, required, value, onChange, options, placeholder = "Select…" }) => (
  <div className="flex flex-col gap-1.5">
    <Label required={required}>{label}</Label>
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
      style={inputStyle}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

/**
 * Searchable combobox — type to filter, click to pick. Used for role,
 * brand, department, service pickers where the list is unbounded and a
 * plain <select> is awkward.
 *
 * `options`: [{ value, label }]
 * `value`:   the selected option's value (or "" / null)
 * `onChange(newValue, option)`
 */
const SearchableSelect = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Search and select…",
  emptyMessage = "No matches.",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) || null,
    [options, value]
  );

  // When `value` changes externally, keep the input's display text in sync.
  useEffect(() => {
    setQuery(selected ? selected.label : "");
  }, [selected]);

  // Close on outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (selected && selected.label.toLowerCase() === q)) {
      return options;
    }
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q)
        || String(o.value).toLowerCase().includes(q)
    );
  }, [options, query, selected]);

  const handlePick = (opt) => {
    setQuery(opt.label);
    setOpen(false);
    onChange?.(opt.value, opt);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    onChange?.("", null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      <div ref={wrapRef} className="relative">
        <div
          className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-text focus-within:ring-2 focus-within:ring-red-100"
          style={inputStyle}
          onClick={() => setOpen(true)}
        >
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: TEXT_PRIMARY }}
            autoComplete="off"
          />
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-100"
              style={{ color: TEXT_MUTED }}
              title="Clear selection"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={14}
            style={{ color: TEXT_MUTED, transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
          />
        </div>
        {open && (
          <div
            className="absolute z-20 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg max-h-60"
            style={{ borderColor: BORDER }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: TEXT_MUTED }}>
                {emptyMessage}
              </div>
            ) : (
              filtered.map((o) => {
                const isSelected = String(o.value) === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handlePick(o)}
                    className="flex items-center justify-between w-full gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50"
                    style={{ color: TEXT_PRIMARY, background: isSelected ? "#FEF2F2" : "transparent" }}
                  >
                    <span>{o.label}</span>
                    {isSelected && <Check size={14} style={{ color: BRAND_RED }} />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────── main page ──────────────────────────────────────────── */
const EmployeeFormPage = () => {
  const navigate = useNavigate();
  const { uuid: editUuid } = useParams();
  const isEdit = !!editUuid;
  const user = useSelector(selectCurrentUser);
  const canCreate = hasPermission(user, "create employee") || hasPermission(user, "create users");
  const canUpdateGate = hasPermission(user, "update employee");
  const canSubmit = isEdit ? canUpdateGate : canCreate;

  /* user-side fields */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");   // WORK email — login
  const [personalEmail, setPersonalEmail] = useState(""); // off-system HR record
  const [password, setPassword]   = useState("");
  const [contact, setContact]     = useState("");
  const [cnic, setCnic]           = useState("");
  // Personal identity fields the hire form should also capture upfront.
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob]               = useState("");
  const [gender, setGender]         = useState("");
  const [address, setAddress]       = useState("");

  // Emergency contact (first one) — captured at hire to satisfy the
  // payroll-readiness gate and ensure HR has a contact from day one.
  const [emergencyName, setEmergencyName]         = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone]       = useState("");
  const [emergencyAddress, setEmergencyAddress]   = useState("");

  // Bank account (will be created as primary + auto-verified=false).
  const [bankAccountTitle, setBankAccountTitle]   = useState("");
  const [bankName, setBankName]                   = useState("");
  const [bankBranch, setBankBranch]               = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIban, setBankIban]                   = useState("");

  // File uploads (uploaded AFTER user+profile creation via /documents).
  const [cnicFrontFile, setCnicFrontFile]         = useState(null);
  const [cnicBackFile, setCnicBackFile]           = useState(null);
  const [professionalPhotoFile, setProfessionalPhotoFile] = useState(null);

  // Multi-role: a person can be a Teacher AND a Developer. selectedRoles
  // is a list of { id, name, is_primary } — exactly one row is primary
  // (drives users.role_id cache + landing page).
  const [selectedRoles, setSelectedRoles] = useState([]); // [{id, name, is_primary}]
  const [roleToAdd, setRoleToAdd] = useState("");

  /* employee_profile fields (applied AFTER user creation) */
  const [designation, setDesignation]         = useState("");
  const [basicSalary, setBasicSalary]         = useState("");
  const [employmentType, setEmploymentType]   = useState("permanent");
  const [workScheduleType, setWorkScheduleType] = useState("full_time");
  const [workLocation, setWorkLocation]       = useState("in_office");
  const [brandId, setBrandId]                 = useState("");
  const [joiningDate, setJoiningDate]         = useState("");
  const [probationMonths, setProbationMonths] = useState("3");
  const [internIsPaid, setInternIsPaid]       = useState(true);

  /* Phase 1 — Personal / Family / Education / Tax */
  const [bloodGroup, setBloodGroup]           = useState("");
  const [religion, setReligion]               = useState("");
  const [nationality, setNationality]         = useState("PK");
  const [spouseName, setSpouseName]           = useState("");
  const [spouseCnic, setSpouseCnic]           = useState("");
  const [spousePhone, setSpousePhone]         = useState("");
  const [dependentsCount, setDependentsCount] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [universityName, setUniversityName]   = useState("");
  // institute_id is the FK pointer into the institutes catalog. When the
  // user picks from the dropdown we set BOTH instituteId (saved as FK) and
  // universityName (kept as denormalised text fallback for older records).
  const [instituteId, setInstituteId]         = useState("");
  const [graduationYear, setGraduationYear]   = useState("");
  const [ntnNumber, setNtnNumber]             = useState("");
  const [eobiNumber, setEobiNumber]           = useState("");
  const [ssiNumber, setSsiNumber]             = useState("");
  const [pfNumber, setPfNumber]               = useState("");
  const [taxFilingStatus, setTaxFilingStatus] = useState("");

  /* Tab navigation — 4 logical groups instead of one long-scroll page. */
  const [activeTab, setActiveTab] = useState("basics");
  const TABS = [
    { id: "basics",   label: "Basics",        icon: ClipboardList, hint: "Identity · roles · brand · employment" },
    { id: "personal", label: "Personal",      icon: Heart,         hint: "Family · emergency contact · education · tax" },
    { id: "bank",     label: "Bank & Docs",   icon: ClipboardList, hint: "Bank account · CNIC scans · professional photo" },
    { id: "org",      label: "Org & Offices", icon: Building2,     hint: "Departments · services · offices" },
    { id: "schedule", label: "Schedule",      icon: Clock,         hint: "Weekly working hours per day" },
  ];
  // Cycle helpers for prev/next buttons
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);
  const goTab = (dir) => {
    // Moving forward: validate the current tab first so problems are fixed
    // in place instead of letting the user reach the end and get bounced
    // back to the first page. Backward navigation is always allowed.
    if (dir > 0) {
      const stepError = validateTab(activeTab);
      if (stepError) {
        showToast(stepError, "error");
        return;
      }
    }
    const i = Math.max(0, Math.min(TABS.length - 1, tabIndex + dir));
    setActiveTab(TABS[i].id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* fetch role + brand + department + office lookups — apiSlice expects { path } */
  const { data: rolesData }    = useGetQuery({ path: "core/roles" });
  const { data: brandsData }   = useGetQuery({ path: "employee/company-brands" });
  const { data: deptsData }    = useGetQuery({ path: "employee/departments" });
  const { data: officesData }       = useGetQuery({ path: "employee/offices" });
  const { data: designationsData }  = useGetQuery({ path: "employee/designations" });
  const { data: institutesData }    = useGetQuery({ path: "employee/institutes" });

  // ApiResponse wraps results as { status, message, data: <inner> }. For
  // JsonResource collections the inner can be {data:[...]} OR the array
  // directly depending on whether ::wrap('data') is active — handle both.
  const unwrap = (resp) => {
    const root = resp?.data ?? resp ?? [];
    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    return [];
  };

  const roles = useMemo(() => {
    const list = unwrap(rolesData);
    // Show EVERY assignable role (the API already hides the generic
    // `employee` and the student `user` role). We only hide the workspace
    // tenant pseudo-roles, which aren't staff roles. Using a deny-list (not a
    // hardcoded allow-list) means any NEW role an admin creates — e.g.
    // junior_accountant — automatically shows up here.
    const hidden = ["user", "individual_workspace", "company_workspace"];
    return list
      .filter((r) => !hidden.includes(r.name))
      .map((r) => ({ value: r.id, label: titleCase(r.name), raw: r.name }));
  }, [rolesData]);

  const brands = useMemo(
    () => unwrap(brandsData).map((b) => ({ value: b.id, label: b.name })),
    [brandsData]
  );

  const departments = useMemo(
    () => unwrap(deptsData).map((d) => ({
      id: d.id, slug: d.slug, name: d.name || titleCase(d.slug), brand_id: d.brand_id,
    })),
    [deptsData]
  );

  const offices = useMemo(
    () => unwrap(officesData).map((o) => ({
      id: o.id, slug: o.slug, name: o.name, type: o.type, partner_company: o.partner_company,
    })),
    [officesData]
  );

  // Live designation catalog from HR > Org structure > Designations. The
  // hardcoded DESIGNATION_SUGGESTIONS list above stays as a fallback for
  // dev/test scenarios where the API isn't reachable; in normal flow this
  // list takes precedence.
  const designationSuggestions = useMemo(() => {
    const live = unwrap(designationsData).map((d) => d.name).filter(Boolean);
    if (live.length > 0) return live;
    return DESIGNATION_SUGGESTIONS;
  }, [designationsData]);

  // Institutes catalog — feeds the education-section searchable dropdown.
  // Label format: "Name, City" so HR can disambiguate UET Lahore vs Taxila.
  const instituteOptions = useMemo(
    () => unwrap(institutesData)
      .filter((i) => i.is_active !== false)
      .map((i) => ({
        value: i.id,
        label: i.city ? `${i.name}, ${i.city}` : i.name,
        raw: i.name,
      })),
    [institutesData],
  );

  /* offices selection state */
  const [selectedOffices, setSelectedOffices] = useState([]); // [{id, slug, name, days[], is_primary}]
  const [officeToAdd, setOfficeToAdd]         = useState("");
  const DAYS = [
    { value: "mon", label: "Mon" }, { value: "tue", label: "Tue" }, { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" }, { value: "fri", label: "Fri" }, { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
  ];

  /* weekly_schedule state — keyed by full day name to match the JSON shape */
  const SCHED_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  // Schedule supports MULTI-SHIFT days: each day is an array of shifts.
  // A person at HQ 9am-3pm then STP 3pm-6pm on Monday has 2 entries in
  // monday[]. Empty array = day off. Defaults to empty arrays everywhere.
  const [weeklySchedule, setWeeklySchedule] = useState(
    Object.fromEntries(SCHED_DAYS.map((d) => [d, []]))
  );

  // Bulk-edit state: HR enters shifts once, selects which days they apply
  // to, hits Apply. Common patterns are pre-presets (Weekdays/Weekend).
  const [bulkDays, setBulkDays] = useState(new Set(["monday","tuesday","wednesday","thursday","friday"]));
  const [bulkShifts, setBulkShifts] = useState([
    { start: "09:00", end: "18:00", office_slug: "" },
  ]);

  /* ─── Edit-mode prefill ────────────────────────────────────────────── */
  // In edit mode, fetch the profile and seed every form field. Relationship
  // collections (roles, depts, services, offices, contacts, bank, docs) are
  // intentionally NOT loaded here — they're managed via the detail page's
  // own tabs so we never overwrite live data with stale form state.
  const { data: editProfileData } = useGetQuery(
    { path: `employee/profiles/${editUuid}` },
    { skip: !isEdit },
  );
  useEffect(() => {
    if (!isEdit) return;
    const p = editProfileData?.data;
    if (!p) return;
    // User-side identity (read-only-ish in edit mode — see submit guard).
    if (p.user) {
      setFirstName(p.user.first_name || "");
      setLastName(p.user.last_name   || "");
      setEmail(p.user.email          || "");
      setContact(p.user.contact      || "");
      setCnic(p.user.cnic            || "");
      setFatherName(p.user.father_name || "");
      setDob(p.user.dob              || "");
      setGender(p.user.gender        || "");
      setAddress(p.user.address      || "");
    }
    // Profile-side
    setDesignation(p.designation         || "");
    setBasicSalary(p.basic_salary        ?? "");
    setEmploymentType(p.employment_type  || "permanent");
    setWorkScheduleType(p.work_schedule_type || "full_time");
    setWorkLocation(p.work_location      || "in_office");
    setBrandId(p.brand_id ? String(p.brand_id) : "");
    setJoiningDate(p.joining_date_effective || "");
    setProbationMonths(p.probation_months != null ? String(p.probation_months) : "3");
    setInternIsPaid(!!p.intern_is_paid);
    // Personal / family / education / tax
    setBloodGroup(p.personal?.blood_group  || "");
    setReligion(p.personal?.religion        || "");
    setNationality(p.personal?.nationality  || "PK");
    setPersonalEmail(p.personal?.personal_email || "");
    setSpouseName(p.family?.spouse_name     || "");
    setSpouseCnic(p.family?.spouse_cnic     || "");
    setSpousePhone(p.family?.spouse_phone   || "");
    setDependentsCount(p.family?.dependents_count != null ? String(p.family.dependents_count) : "");
    setHighestQualification(p.education?.highest_qualification || "");
    setUniversityName(p.education?.university_name || "");
    setInstituteId(p.education?.institute_id ? String(p.education.institute_id) : "");
    setGraduationYear(p.education?.graduation_year != null ? String(p.education.graduation_year) : "");
    setNtnNumber(p.tax_statutory?.ntn_number   || "");
    setEobiNumber(p.tax_statutory?.eobi_number || "");
    setSsiNumber(p.tax_statutory?.ssi_number   || "");
    setPfNumber(p.tax_statutory?.pf_number     || "");
    setTaxFilingStatus(p.tax_statutory?.tax_filing_status || "");
    // Weekly schedule — normalise old single-object-per-day shape to array.
    if (p.weekly_schedule && typeof p.weekly_schedule === "object") {
      const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
      const norm = {};
      days.forEach((d) => {
        const v = p.weekly_schedule[d];
        norm[d] = Array.isArray(v) ? v : (v ? [v] : []);
      });
      setWeeklySchedule(norm);
    }
    // Multi-role chips — transformer exposes p.roles[] AND p.user.roles[];
    // either shape is acceptable. Map to FE shape {id, name, is_primary}
    // where `name` is the Title Case label for display in the chip.
    const apiRoles = Array.isArray(p.roles)
      ? p.roles
      : (Array.isArray(p.user?.roles) ? p.user.roles : []);
    if (apiRoles.length > 0) {
      setSelectedRoles(apiRoles.map((r) => ({
        id: r.id,
        name: titleCase(r.name || ""),
        is_primary: !!r.is_primary,
      })));
    }
    // Departments — FE shape: [{id, slug, name, brand_id, role}]
    if (Array.isArray(p.departments)) {
      setSelectedDepts(p.departments.map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name || titleCase(d.slug || ""),
        brand_id: d.brand_id ?? null,
        role: d.role_in_department || "member",
        is_primary: !!d.is_primary,
      })));
    }
    // Services — FE shape: [{id, slug, name, department_id, proficiency}]
    if (Array.isArray(p.services)) {
      setSelectedServices(p.services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name || titleCase(s.slug || ""),
        department_id: s.department_id ?? null,
        proficiency: s.proficiency || "mid",
        is_primary: !!s.is_primary,
      })));
    }
    // Offices — FE shape: [{id, slug, name, days[], is_primary}]
    if (Array.isArray(p.offices)) {
      setSelectedOffices(p.offices.map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        type: o.type ?? null,
        partner_company: o.partner_company ?? null,
        days: Array.isArray(o.days) ? o.days : [],
        is_primary: !!o.is_primary,
      })));
    }
  }, [isEdit, editProfileData]);

  /* department + service selection state (multi) */
  const [selectedDepts, setSelectedDepts]       = useState([]); // [{id, slug, name, role}]
  const [selectedServices, setSelectedServices] = useState([]); // [{id, slug, name, proficiency}]
  const [deptToAdd, setDeptToAdd]               = useState("");
  const [svcToAdd, setSvcToAdd]                 = useState("");
  const [proficiencyToAdd, setProficiencyToAdd] = useState("mid");
  const [deptRoleToAdd, setDeptRoleToAdd]       = useState("member");

  // Services depend on selected departments — fetch when any dept is picked.
  const deptIds = useMemo(() => selectedDepts.map((d) => d.id).join(","), [selectedDepts]);
  const { data: svcsData } = useGetQuery(
    { path: `employee/services${deptIds ? `?department_ids=${deptIds}` : ""}` },
    { skip: !deptIds }
  );
  const availableServices = useMemo(
    () => unwrap(svcsData).map((s) => ({
      id: s.id, slug: s.slug, name: s.name, department_id: s.department_id,
    })),
    [svcsData]
  );

  const [createUser, { isLoading: creating }]   = usePostMutation();
  const [patchProfile, { isLoading: patching }] = usePatchMutation();
  const [assignDept]                            = usePostMutation();
  const [assignSvc]                             = usePostMutation();
  const [assignRole]                            = usePostMutation();
  const [assignOffice]                          = usePostMutation();
  const [createEmergencyContact]                = usePostMutation();
  const [createBankAccount]                     = usePostMutation();
  const [uploadDocument]                        = usePostMutation();
  // Used to fill father_name/dob/address on the User row after create
  // (the lean create-with-role endpoint doesn't accept those).
  const [patchUser]                             = usePatchMutation();
  // Used to look up the newly created profile by email when the create-user
  // response doesn't include profile_uuid (apiSlice handles auth headers).
  const [lookupProfile]                         = usePostMutation();

  if (!canSubmit) {
    return (
      <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>You don&apos;t have permission to {isEdit ? "edit" : "create"} employees.</p>
      </div>
    );
  }

  // Per-tab validation, mirroring the backend CreateEmployeeRequest rules.
  // All backend-required fields live on the Basics tab; the other tabs have
  // no required fields for user creation, so they pass. Returns an error
  // string for the given tab, or null when that tab is valid.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const BLOCKED_ROLE_NAMES = ["admin", "ceo", "coo"]; // matches backend blocklist
  const validateTab = (tabId) => {
    if (tabId === "basics") {
      if (!firstName || firstName.trim().length < 3) return "First name (3+ characters) is required.";
      if (firstName.length > 99)                     return "First name must be at most 99 characters.";
      if (!lastName || lastName.trim().length < 3)   return "Last name (3+ characters) is required.";
      if (lastName.length > 99)                      return "Last name must be at most 99 characters.";
      if (!email)                                    return "Email is required.";
      if (!EMAIL_RE.test(email))                     return "Enter a valid email address.";
      if (!contact)                                  return "Phone number is required.";
      if (password && password.length < 6)           return "Password must be at least 6 characters.";
      if (selectedRoles.length === 0)                return "At least one role is required.";
      if (!selectedRoles.some((r) => r.is_primary))  return "Mark one role as primary.";
      const primary = selectedRoles.find((r) => r.is_primary);
      const primaryName = String(primary?.name || primary?.slug || "").toLowerCase();
      if (primaryName && BLOCKED_ROLE_NAMES.includes(primaryName)) {
        return "You are not allowed to assign this role.";
      }
    }
    return null;
  };

  // Full-form validation: walk every tab in order and return the first
  // failing tab so handleSubmit can focus it. Driven by validateTab so the
  // step-by-step and final checks never drift apart.
  const validate = () => {
    for (const t of TABS) {
      const message = validateTab(t.id);
      if (message) return { tab: t.id, message };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create flow: never fire the request before the final (Schedule) tab.
    // The submit button only renders on the last tab, but an Enter keypress
    // on an earlier tab (e.g. Org, the second-last) would otherwise submit
    // the form prematurely and skip the scheduler. Treat any such early
    // submit as a "Next" so the user can finish setting the schedule.
    if (!isEdit && tabIndex < TABS.length - 1) {
      goTab(1);
      return;
    }

    // In edit mode the validation rules are looser (no password required) —
    // but we DO still require at least one role + a primary marked, since
    // the BE sync endpoint enforces both. Same as create-mode role rules.
    if (isEdit) {
      if (!firstName || firstName.length < 1) {
        showToast("First name is required.", "error");
        return;
      }
      if (selectedRoles.length === 0) {
        setActiveTab("basics");
        showToast("At least one role is required.", "error");
        return;
      }
      if (!selectedRoles.some((r) => r.is_primary)) {
        setActiveTab("basics");
        showToast("Mark one role as primary.", "error");
        return;
      }
      try {
        /* ─── Step A: PATCH profile (employee_profiles row) ─── */
        const profilePatch = {
          designation: designation || undefined,
          basic_salary: basicSalary === "" ? undefined : Number(basicSalary),
          employment_type: employmentType,
          work_schedule_type: workScheduleType,
          work_location: workLocation,
          brand_id: brandId ? Number(brandId) : undefined,
          joining_date_effective: joiningDate || undefined,
          probation_months: probationMonths ? Number(probationMonths) : undefined,
          intern_is_paid: employmentType === "intern" ? internIsPaid : undefined,
          weekly_schedule: Object.values(weeklySchedule).some((arr) => Array.isArray(arr) && arr.length > 0) ? weeklySchedule : undefined,
          blood_group: bloodGroup || undefined,
          religion: religion || undefined,
          nationality: nationality || undefined,
          spouse_name: spouseName || undefined,
          spouse_cnic: spouseCnic || undefined,
          spouse_phone: spousePhone || undefined,
          dependents_count: dependentsCount ? Number(dependentsCount) : undefined,
          highest_qualification: highestQualification || undefined,
          university_name: universityName || undefined,
          institute_id: instituteId ? Number(instituteId) : null,
          graduation_year: graduationYear ? Number(graduationYear) : undefined,
          ntn_number: ntnNumber || undefined,
          eobi_number: eobiNumber || undefined,
          ssi_number: ssiNumber || undefined,
          pf_number: pfNumber || undefined,
          tax_filing_status: taxFilingStatus || undefined,
          personal_email: personalEmail || undefined,
        };
        Object.keys(profilePatch).forEach((k) => profilePatch[k] === undefined && delete profilePatch[k]);
        await patchProfile({
          path: `employee/profiles/${editUuid}`,
          body: profilePatch,
        }).unwrap();

        /* ─── Step B: PATCH user (users row — identity + father_name + dob + address) ─── */
        // The legacy admin user-update endpoint is /api/user/{type}/{uuid}
        // and uses CAMELCASE keys via UserUpdateRequest::rules() — sending
        // snake_case here silently drops the fields. Also `email` is
        // marked required by the FormRequest, so we always echo it back.
        const userKey = editProfileData?.data?.user?.uuid || editProfileData?.data?.user?.id;
        const typeSlug = editProfileData?.data?.user?.role_name || "employee";
        if (userKey) {
          try {
            const userPatch = {
              email:        email,        // required by FormRequest
              firstName:    firstName    || undefined,
              lastName:     lastName     || undefined,
              contact:      contact      || undefined,
              cnic:         cnic         || undefined,
              fatherName:   fatherName   || undefined,
              dob:          dob          || undefined,
              gender:       gender       || undefined,
              address:      address      || undefined,
            };
            Object.keys(userPatch).forEach((k) => userPatch[k] === undefined && delete userPatch[k]);
            await patchUser({
              path: `user/${typeSlug}/${userKey}`,
              body: userPatch,
            }).unwrap();
          } catch (e) {
            console.warn("[edit] patchUser failed", e);
            // Don't block the rest of the save — surface a soft warning.
            showToast(
              "Profile saved, but identity fields (father name / DOB / address) may not have persisted.",
              "warning",
            );
          }
        }

        /* ─── Step C: sync roles / departments / services / offices ─── */
        // Each sync endpoint wipes the pivot for this user and re-inserts.
        // We only call them when the edit form actually has entries; an
        // empty `departments` array is still sent (so removing all depts
        // works), but roles requires at least one item.
        if (userKey && selectedRoles.length > 0) {
          try {
            await assignRole({
              path: `employee/users/${userKey}/roles/sync`,
              body: {
                roles: selectedRoles.map((r) => ({
                  id: Number(r.id),
                  is_primary: !!r.is_primary,
                })),
              },
            }).unwrap();
          } catch (e) {
            console.warn("[edit] syncRoles failed", e);
            showToast("Couldn't update roles. Check permissions.", "warning");
          }
        }

        if (userKey) {
          try {
            await assignDept({
              path: `employee/users/${userKey}/departments/sync`,
              body: {
                departments: selectedDepts.map((d) => ({
                  id: Number(d.id),
                  role_in_department: d.role || "member",
                  is_primary: !!d.is_primary,
                })),
              },
            }).unwrap();
          } catch (e) { console.warn("[edit] syncDepartments failed", e); }
        }

        if (userKey) {
          try {
            await assignSvc({
              path: `employee/users/${userKey}/services/sync`,
              body: {
                services: selectedServices.map((s) => ({
                  id: Number(s.id),
                  proficiency: s.proficiency || "mid",
                  is_primary: !!s.is_primary,
                })),
              },
            }).unwrap();
          } catch (e) { console.warn("[edit] syncServices failed", e); }
        }

        if (userKey) {
          try {
            await assignOffice({
              path: `employee/users/${userKey}/offices/sync`,
              body: {
                offices: selectedOffices.map((o) => ({
                  id: Number(o.id),
                  days_of_week: Array.isArray(o.days) ? o.days : [],
                  is_primary: !!o.is_primary,
                })),
              },
            }).unwrap();
          } catch (e) { console.warn("[edit] syncOffices failed", e); }
        }

        showToast("Profile updated.", "success");
        navigate(HR_EMPLOYEE_DETAIL.replace(":uuid", editUuid));
        return;
      } catch (err) {
        const msg = err?.data?.message
          || (err?.data?.errors ? Object.values(err.data.errors).flat().join(" · ") : "Save failed.");
        showToast(msg, "error");
        return;
      }
    }

    /* ─── Create-mode validation ─── */
    const error = validate();
    if (error) {
      // Jump to the tab that owns the failed field so HR sees what to fix.
      if (error.tab && error.tab !== activeTab) {
        setActiveTab(error.tab);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      }
      showToast(error.message, "error");
      return;
    }

    try {
      /* ─── Step 1: create the User row ─── */
      // POST /user/create-with-role expects: firstName, lastName, email,
      // password, contact, cnic, role_id. The matching role's strategy
      // (Teacher/Employee/Admin/Default) auto-creates the employee_profile
      // via the EnsuresEmployeeProfile trait.
      const created = await createUser({
        path: "user/create-with-role",
        body: {
          firstName,
          lastName,
          email,
          password: password || undefined,
          contact,
          cnic: cnic || undefined,
          // Primary role drives users.role_id; the secondaries are
          // attached via /roles after creation.
          role_id: Number(selectedRoles.find((r) => r.is_primary)?.id),
        },
      }).unwrap();

      const createdUser = created?.data || created || {};
      const userId   = createdUser.id;
      const profileUuid = createdUser.employee_id  // some response shapes
        ? createdUser.profile_uuid
        : null;

      /* ─── Step 2: enrich the auto-created employee_profile with HR fields ─── */
      // The strategy already created a bare profile (just user_id, role,
      // sensible defaults). We patch the rest via PATCH /employee/profiles/{uuid}.
      // We need the profile_uuid — fetch by user id if not in the create response.
      let targetUuid = profileUuid;
      if (!targetUuid && userId) {
        // Use the apiSlice POST proxy (it carries auth + base URL) — a tiny
        // GET via the same `lookupProfile` mutation is fine; the BE accepts
        // GET search and ignores POST body if any.
        try {
          const found = await lookupProfile({
            path: `employee/profiles?search=${encodeURIComponent(email)}`,
            body: {},
          }).unwrap();
          targetUuid = ((found?.data || found) || [])[0]?.uuid;
        } catch (_e) {
          targetUuid = null;
        }
      }

      if (targetUuid) {
        const profilePatch = {
          designation: designation || undefined,
          basic_salary: basicSalary ? Number(basicSalary) : undefined,
          employment_type: employmentType,
          work_schedule_type: workScheduleType,
          work_location: workLocation,
          brand_id: brandId ? Number(brandId) : undefined,
          joining_date_effective: joiningDate || undefined,
          probation_months: probationMonths ? Number(probationMonths) : undefined,
          intern_is_paid: employmentType === "intern" ? internIsPaid : undefined,
          // Only send schedule if at least one day is set; sending an
          // all-null map is wasteful and confusing.
          weekly_schedule: Object.values(weeklySchedule).some((arr) => Array.isArray(arr) && arr.length > 0) ? weeklySchedule : undefined,
          // Phase 1 — Personal / Family / Education / Tax
          blood_group:           bloodGroup || undefined,
          religion:              religion || undefined,
          nationality:           nationality || undefined,
          spouse_name:           spouseName || undefined,
          spouse_cnic:           spouseCnic || undefined,
          spouse_phone:          spousePhone || undefined,
          dependents_count:      dependentsCount ? Number(dependentsCount) : undefined,
          highest_qualification: highestQualification || undefined,
          university_name:       universityName || undefined,
          institute_id:          instituteId ? Number(instituteId) : null,
          graduation_year:       graduationYear ? Number(graduationYear) : undefined,
          ntn_number:            ntnNumber || undefined,
          eobi_number:           eobiNumber || undefined,
          ssi_number:            ssiNumber || undefined,
          pf_number:             pfNumber || undefined,
          tax_filing_status:     taxFilingStatus || undefined,
          // Phase 1 — off-system contact email (User.email is the login)
          personal_email:        personalEmail || undefined,
        };
        // strip undefined keys so PATCH only sends what changed
        Object.keys(profilePatch).forEach((k) => profilePatch[k] === undefined && delete profilePatch[k]);

        if (Object.keys(profilePatch).length > 0) {
          await patchProfile({
            path: `employee/profiles/${targetUuid}`,
            body: profilePatch,
          }).unwrap();
        }

        /* ─── Step 3: assign departments + services + secondary roles ─── */
        // BE endpoints are nested under /api/employee/users/{userUuid}/*.
        const userKey = createdUser.user_uuid || createdUser.uuid || createdUser.id;

        // Secondary roles (primary already attached via role_id on creation).
        const secondaryRoles = selectedRoles.filter((r) => !r.is_primary);
        for (const r of secondaryRoles) {
          try {
            // Reuse the brand-existing /role/assign endpoint if present, else
            // a fallback uses PATCH /users to add a pivot row. Easiest path
            // is the user-side role pivot endpoint:
            await assignRole({
              path: `core/users/${userKey}/roles`,
              body: { role_id: r.id },
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        }
        for (const d of selectedDepts) {
          try {
            await assignDept({
              path: `employee/users/${userKey}/departments`,
              body: {
                department_id: d.id,
                role_in_department: d.role || "member",
                is_primary: d.is_primary || false,
              },
            }).unwrap();
          } catch (e) { /* soft-fail — HR can fix from profile page */ }
        }
        for (const s of selectedServices) {
          try {
            await assignSvc({
              path: `employee/users/${userKey}/services`,
              body: {
                service_id: s.id,
                proficiency: s.proficiency || "mid",
                is_primary: s.is_primary || false,
              },
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        }

        // Offices — multi-assign with days-of-week per office.
        for (const o of selectedOffices) {
          try {
            await assignOffice({
              path: `employee/users/${userKey}/offices`,
              body: {
                office_id: o.id,
                days_of_week: o.days || [],
                is_primary: o.is_primary || false,
              },
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        }

        /* ─── Step 4: father_name / dob / gender / address on the User row ─── */
        // The lean create-with-role endpoint doesn't accept these fields,
        // so PATCH them in afterwards via the admin user-update route. That
        // endpoint uses CAMELCASE keys via UserUpdateRequest and requires
        // `email` — see edit-mode for the same shape.
        if (fatherName || dob || gender || address) {
          try {
            const primary = selectedRoles.find((r) => r.is_primary);
            const primaryRoleObj = roles.find((r) => String(r.value) === String(primary?.id));
            const typeSlug = primaryRoleObj?.raw || "employee";
            const userPatch = {
              email,                              // required by FormRequest
              firstName:  firstName  || undefined,
              lastName:   lastName   || undefined,
              contact:    contact    || undefined,
              cnic:       cnic       || undefined,
              fatherName: fatherName || undefined,
              dob:        dob        || undefined,
              gender:     gender     || undefined,
              address:    address    || undefined,
            };
            Object.keys(userPatch).forEach((k) => userPatch[k] === undefined && delete userPatch[k]);
            await patchUser({
              path: `user/${typeSlug}/${userKey}`,
              body: userPatch,
            }).unwrap();
          } catch (e) { console.warn("[create] post-create user PATCH failed", e); }
        }

        /* ─── Step 5: emergency contact (if filled) ─── */
        if (emergencyName && emergencyPhone) {
          try {
            await createEmergencyContact({
              path: `employee/profiles/${targetUuid}/emergency-contacts`,
              body: {
                name: emergencyName,
                relation: emergencyRelation || "other",
                phone: emergencyPhone,
                address: emergencyAddress || undefined,
                is_primary: true,
              },
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        }

        /* ─── Step 6: bank account (if filled) ─── */
        if (bankAccountTitle && bankName && (bankAccountNumber || bankIban)) {
          try {
            await createBankAccount({
              path: `employee/profiles/${targetUuid}/bank-accounts`,
              body: {
                account_title: bankAccountTitle,
                bank_name: bankName,
                branch_name: bankBranch || undefined,
                account_number: bankAccountNumber || undefined,
                iban: bankIban || undefined,
                is_primary: true,
              },
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        }

        /* ─── Step 7: identity document uploads (multipart) ─── */
        // Each file goes to the documents endpoint as multipart. We use
        // FormData so the apiSlice's content-type handling stays intact.
        const uploadFile = async (type, file) => {
          if (!file) return;
          const fd = new FormData();
          fd.append("file", file);
          fd.append("type", type);
          try {
            await uploadDocument({
              path: `employee/profiles/${targetUuid}/documents`,
              body: fd,
            }).unwrap();
          } catch (e) { /* soft-fail */ }
        };
        await uploadFile("cnic_front",         cnicFrontFile);
        await uploadFile("cnic_back",          cnicBackFile);
        await uploadFile("professional_photo", professionalPhotoFile);
      }

      showToast("Employee created — profile auto-attached", "success");
      if (targetUuid) {
        navigate(HR_EMPLOYEE_DETAIL.replace(":uuid", targetUuid));
      } else {
        navigate(HR_EMPLOYEES);
      }
    } catch (err) {
      const msg = err?.data?.message
        || (err?.data?.errors ? Object.values(err.data.errors).flat().join(" · ") : "Could not create employee.");
      showToast(msg, "error");
    }
  };

  const submitting = creating || patching;
  const isIntern = employmentType === "intern";

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh", color: TEXT_PRIMARY }}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(HR_EMPLOYEES)}
            className="p-2 rounded-md hover:bg-slate-100"
            style={{ color: TEXT_SECONDARY }}
          >
            <ChevronLeft size={16} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit employee profile" : "Hire new employee"}</h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              {isEdit
                ? "Edit profile fields. Relationships (roles, departments, services, offices, bank, documents, contracts) are managed via the profile tabs."
                : "Creates the User account and the linked employee_profile in one step. You can edit the rest from the profile page."}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Tabs (horizontal underline-style, matches CompanySettings tone) ─── */}
      <div className="flex gap-1 p-1 mb-5 bg-white border rounded-lg" style={{ borderColor: BORDER }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-md transition"
              style={{
                background: active ? BRAND_RED_TINT : "transparent",
                color: active ? BRAND_RED : TEXT_SECONDARY,
              }}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Icon size={12} />
                {t.label}
              </span>
              <span className="text-[10px]" style={{ color: active ? BRAND_RED : TEXT_MUTED }}>
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {activeTab === "basics" && (
        <>
        {/* ─── Identity section ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextField label="First name" required value={firstName} onChange={setFirstName} placeholder="Ali" autoComplete="given-name" />
            <TextField label="Last name"  required value={lastName}  onChange={setLastName}  placeholder="Khan" autoComplete="family-name" />
            {/* WORK email = login + welcome / contract / payslip sends. */}
            <TextField label="Work email (login)" required value={email} onChange={setEmail} type="email" placeholder="ali@codelab.pk" autoComplete="off" />
            {/* PERSONAL email = HR off-system contact (no auth implications). */}
            <TextField label="Personal email"     value={personalEmail} onChange={setPersonalEmail} type="email" placeholder="ali.khan@gmail.com" autoComplete="off" />
            <TextField label="Phone"      required value={contact}   onChange={(v) => setContact(formatPhonePk(v))}   placeholder="+92309-8201013" autoComplete="off" />
            <TextField label="CNIC"                value={cnic}      onChange={(v) => setCnic(formatCnic(v))}      placeholder="31201-2368515-0" />
            <TextField label="Father name"         value={fatherName} onChange={setFatherName} placeholder="Father's full name" />
            <TextField label="Date of birth"       type="date" value={dob} onChange={setDob} />
            <SelectField
              label="Gender"
              value={gender}
              onChange={setGender}
              options={[
                { value: "male",   label: "Male" },
                { value: "female", label: "Female" },
                { value: "other",  label: "Other" },
              ]}
            />
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
              <Label>Address</Label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Street, area, city, postal code"
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              />
            </div>
            <TextField label="Password (optional)" type="password" value={password} onChange={setPassword} placeholder="Leave blank to auto-generate" autoComplete="new-password" />
          </div>
        </section>

        {/* ─── Role + brand ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Role &amp; brand</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Multi-role: pick any number; mark one as primary (drives users.role_id) */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label required>Roles (multi)</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px]">
                <SearchableSelect
                  label=""
                  value={roleToAdd}
                  onChange={setRoleToAdd}
                  options={roles
                    .filter((r) => !selectedRoles.find((sr) => sr.id === r.value))
                    .map((r) => ({ value: r.value, label: r.label }))
                  }
                  placeholder="Search a role to add…"
                  emptyMessage="All matching roles already added."
                />
                <button
                  type="button"
                  disabled={!roleToAdd}
                  onClick={() => {
                    const r = roles.find((x) => String(x.value) === String(roleToAdd));
                    if (!r) return;
                    const isFirst = selectedRoles.length === 0;
                    setSelectedRoles((prev) => [...prev, {
                      id: r.value,
                      name: r.label,
                      is_primary: isFirst, // auto-primary if first
                    }]);
                    setRoleToAdd("");
                  }}
                  className="px-3 py-2 text-xs font-medium border rounded-md disabled:opacity-40"
                  style={{ borderColor: BRAND_RED, color: BRAND_RED, background: BRAND_RED_TINT }}
                >
                  Add role
                </button>
              </div>
              {selectedRoles.length === 0 ? (
                <p className="text-[11px] italic mt-1" style={{ color: TEXT_MUTED }}>
                  At least one role required. The first added is auto-primary; click a chip to change primary.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md cursor-pointer"
                      style={{
                        background: r.is_primary ? BRAND_RED_TINT : SURFACE_ALT,
                        border: `1px solid ${r.is_primary ? BRAND_RED : BORDER}`,
                        color: r.is_primary ? BRAND_RED : TEXT_PRIMARY,
                      }}
                      onClick={() =>
                        setSelectedRoles((prev) =>
                          prev.map((x) => ({ ...x, is_primary: x.id === r.id }))
                        )
                      }
                      title={r.is_primary ? "Primary role" : "Click to make primary"}
                    >
                      {r.is_primary && <Check size={11} />}
                      <span className="font-medium">{r.name}</span>
                      {r.is_primary && <span className="text-[10px] uppercase">primary</span>}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoles((prev) => {
                            const next = prev.filter((x) => x.id !== r.id);
                            // If we removed the primary, promote the first remaining.
                            if (r.is_primary && next.length > 0) next[0].is_primary = true;
                            return [...next];
                          });
                        }}
                        className="rounded-full hover:bg-slate-200"
                        style={{ color: TEXT_MUTED }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <SearchableSelect
              label="Brand"
              value={brandId}
              onChange={setBrandId}
              options={brands}
              placeholder="Search or pick a brand…"
              emptyMessage="No brands configured yet."
            />
            {/* Designation — curated suggestions via native <datalist>,
                with free text allowed. Roles are permission groups; this
                is the HR-facing job-title label. */}
            <div className="flex flex-col gap-1.5">
              <Label>Designation</Label>
              <input
                type="text"
                list="designation-suggestions"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Full Stack Developer"
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
                autoComplete="off"
              />
              <datalist id="designation-suggestions">
                {designationSuggestions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </section>

        {/* ─── Employment metadata ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Employment</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Employment type"
              value={employmentType}
              onChange={setEmploymentType}
              options={[
                { value: "permanent",  label: "Permanent" },
                { value: "contract",   label: "Contract" },
                { value: "consultant", label: "Consultant" },
                { value: "intern",     label: "Intern" },
                { value: "outsourced", label: "Outsourced" },
              ]}
            />
            <SelectField
              label="Work schedule"
              value={workScheduleType}
              onChange={setWorkScheduleType}
              options={[
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
              ]}
            />
            <SelectField
              label="Work location"
              value={workLocation}
              onChange={setWorkLocation}
              options={[
                { value: "in_office", label: "In-office" },
                { value: "remote",    label: "Remote" },
                { value: "hybrid",    label: "Hybrid" },
              ]}
            />
            <TextField label="Basic salary (PKR)" type="number" value={basicSalary} onChange={setBasicSalary} placeholder="100000" />
            <TextField label="Joining date"       type="date"   value={joiningDate} onChange={setJoiningDate} />
            <TextField label="Probation months"   type="number" value={probationMonths} onChange={setProbationMonths} placeholder="3" />
            {isIntern && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="intern_is_paid"
                  type="checkbox"
                  checked={internIsPaid}
                  onChange={(e) => setInternIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: BRAND_RED }}
                />
                <label htmlFor="intern_is_paid" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                  Paid internship (stipend goes through payroll)
                </label>
              </div>
            )}
          </div>
        </section>

        </>
        )}

        {activeTab === "org" && (
        <>
        {/* ─── Departments + Services ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Departments &amp; Services</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            A person can be in multiple departments (e.g. CEO in Admin + IT Solutions + Tech School).
            Services are picked from inside the chosen departments.
          </p>

          {/* Departments — add row + chips */}
          <div className="mb-5">
            <Label>Departments</Label>
            <div className="grid grid-cols-1 gap-2 mt-1 md:grid-cols-[1fr_180px_120px]">
              <SearchableSelect
                label=""
                value={deptToAdd}
                onChange={setDeptToAdd}
                options={departments
                  .filter((d) => !selectedDepts.find((sd) => sd.id === d.id))
                  .map((d) => ({ value: d.id, label: d.name }))
                }
                placeholder="Search or pick a department…"
                emptyMessage="All departments already added."
              />
              <SelectField
                label=""
                value={deptRoleToAdd}
                onChange={setDeptRoleToAdd}
                options={[
                  { value: "member", label: "Member" },
                  { value: "lead",   label: "Lead" },
                  { value: "head",   label: "Head of Dept" },
                ]}
              />
              <button
                type="button"
                disabled={!deptToAdd}
                onClick={() => {
                  const d = departments.find((x) => String(x.id) === String(deptToAdd));
                  if (!d) return;
                  setSelectedDepts((prev) => [...prev, { ...d, role: deptRoleToAdd }]);
                  setDeptToAdd("");
                  setDeptRoleToAdd("member");
                }}
                className="px-3 py-2 text-xs font-medium border rounded-md disabled:opacity-40"
                style={{ borderColor: BRAND_RED, color: BRAND_RED, background: BRAND_RED_TINT }}
              >
                Add department
              </button>
            </div>
            {selectedDepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedDepts.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md"
                    style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="text-[10px] uppercase" style={{ color: TEXT_MUTED }}>{d.role}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDepts((prev) => prev.filter((x) => x.id !== d.id))}
                      className="rounded-full hover:bg-slate-200"
                      style={{ color: TEXT_MUTED }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Services — only enabled when at least one dept is picked */}
          <div>
            <Label>Services</Label>
            <div className="grid grid-cols-1 gap-2 mt-1 md:grid-cols-[1fr_180px_120px]">
              <SearchableSelect
                label=""
                value={svcToAdd}
                onChange={setSvcToAdd}
                options={availableServices
                  .filter((s) => !selectedServices.find((ss) => ss.id === s.id))
                  .map((s) => ({ value: s.id, label: s.name }))
                }
                placeholder={
                  selectedDepts.length === 0
                    ? "Pick a department first to see its services…"
                    : "Search or pick a service…"
                }
                emptyMessage={
                  selectedDepts.length === 0
                    ? "Pick at least one department above first."
                    : "All services in this department are already added."
                }
              />
              <SelectField
                label=""
                value={proficiencyToAdd}
                onChange={setProficiencyToAdd}
                options={[
                  { value: "trainee", label: "Trainee" },
                  { value: "junior",  label: "Junior" },
                  { value: "mid",     label: "Mid" },
                  { value: "senior",  label: "Senior" },
                  { value: "lead",    label: "Lead" },
                ]}
              />
              <button
                type="button"
                disabled={!svcToAdd}
                onClick={() => {
                  const s = availableServices.find((x) => String(x.id) === String(svcToAdd));
                  if (!s) return;
                  setSelectedServices((prev) => [...prev, { ...s, proficiency: proficiencyToAdd }]);
                  setSvcToAdd("");
                  setProficiencyToAdd("mid");
                }}
                className="px-3 py-2 text-xs font-medium border rounded-md disabled:opacity-40"
                style={{ borderColor: BRAND_RED, color: BRAND_RED, background: BRAND_RED_TINT }}
              >
                Add service
              </button>
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedServices.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md"
                    style={{ background: SURFACE_ALT, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[10px] uppercase" style={{ color: TEXT_MUTED }}>{s.proficiency}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedServices((prev) => prev.filter((x) => x.id !== s.id))}
                      className="rounded-full hover:bg-slate-200"
                      style={{ color: TEXT_MUTED }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        </>
        )}

        {activeTab === "personal" && (
        <>
        {/* ─── Personal / Family / Education / Tax ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Personal</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>All optional — fill what you have, edit later from the profile.</p>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
            <TextField label="Blood group"  value={bloodGroup}  onChange={setBloodGroup}  placeholder="e.g. O+, A-, AB+" />
            <TextField label="Religion"     value={religion}    onChange={setReligion}    placeholder="e.g. Islam" />
            <TextField label="Nationality"  value={nationality} onChange={setNationality} placeholder="PK" />
          </div>

          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Family</h2>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
            <TextField label="Spouse name"     value={spouseName}      onChange={setSpouseName} />
            <TextField label="Spouse CNIC"     value={spouseCnic}      onChange={(v) => setSpouseCnic(formatCnic(v))} placeholder="31201-2368515-0" />
            <TextField label="Spouse phone"    value={spousePhone}     onChange={(v) => setSpousePhone(formatPhonePk(v))} placeholder="+92309-8201013" />
            <TextField label="Dependents"      type="number" value={dependentsCount} onChange={setDependentsCount} placeholder="0" />
          </div>

          {/* Emergency contact — at least one is required by the payroll-readiness gate. */}
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Emergency contact</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            Required for payroll readiness. Add more after hire from the Contacts tab.
          </p>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
            <TextField label="Contact name"    value={emergencyName}     onChange={setEmergencyName}     placeholder="e.g. Father / Spouse / Friend" />
            <TextField label="Relation"        value={emergencyRelation} onChange={setEmergencyRelation} placeholder="e.g. father, brother, spouse" />
            <TextField label="Phone"           value={emergencyPhone}    onChange={(v) => setEmergencyPhone(formatPhonePk(v))}    placeholder="+92309-8201013" />
            <TextField label="Address (opt.)"  value={emergencyAddress}  onChange={setEmergencyAddress}  placeholder="Optional address" />
          </div>

          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Education</h2>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <TextField label="Highest qualification" value={highestQualification} onChange={setHighestQualification} placeholder="e.g. MSc Computer Science" />
            {/* Searchable Institute picker backed by HR > Institutes catalog.
                Selecting an option pins the FK (instituteId) AND auto-fills
                the free-text universityName so older transformers still work. */}
            <SearchableSelect
              label="University / Institute"
              value={instituteId}
              onChange={(val, opt) => {
                setInstituteId(val ?? "");
                if (opt?.raw) setUniversityName(opt.raw);
              }}
              options={instituteOptions}
              placeholder="Search universities, colleges, schools…"
              emptyMessage="No institutes match. Add one from HR › Institutes."
            />
            <TextField label="Graduation year" type="number" value={graduationYear} onChange={setGraduationYear} placeholder="2023" />
          </div>

          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Tax &amp; Statutory</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <TextField label="NTN #"  value={ntnNumber}  onChange={setNtnNumber}  placeholder="1234567" />
            <TextField label="EOBI #" value={eobiNumber} onChange={setEobiNumber} />
            <TextField label="SSI #"  value={ssiNumber}  onChange={setSsiNumber} />
            <TextField label="PF #"   value={pfNumber}   onChange={setPfNumber} />
            <SelectField
              label="Tax filing"
              value={taxFilingStatus}
              onChange={setTaxFilingStatus}
              options={[
                { value: "filer",      label: "Filer" },
                { value: "non_filer",  label: "Non-filer" },
                { value: "late_filer", label: "Late filer" },
                { value: "unknown",    label: "Unknown" },
              ]}
            />
          </div>
        </section>

        </>
        )}

        {activeTab === "bank" && (
        <>
        {/* ─── Bank account + identity documents ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Primary bank account</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            Payroll routes salary to this account. HR can verify it after hire from the Bank tab.
          </p>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
            <TextField label="Account title"      value={bankAccountTitle}  onChange={setBankAccountTitle}  placeholder="As printed on the bank letter" />
            <TextField label="Bank name"          value={bankName}          onChange={setBankName}          placeholder="e.g. MCB, Allied, HBL" />
            <TextField label="Branch (optional)"  value={bankBranch}        onChange={setBankBranch}        placeholder="e.g. Bahawalpur Main" />
            <TextField label="Account number"     value={bankAccountNumber} onChange={setBankAccountNumber} placeholder="Bank-specific format" />
            <TextField label="IBAN"               value={bankIban}          onChange={setBankIban}          placeholder="PK36MCBA1234567890123456" />
          </div>

          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Identity documents</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            Required for payroll readiness. PDF or image (PNG/JPG). Each uploaded file becomes a document
            row HR can replace later if needed.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>CNIC front</Label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setCnicFrontFile(e.target.files?.[0] ?? null)}
                className="px-2 py-1.5 text-xs border rounded outline-none"
                style={inputStyle}
              />
              {cnicFrontFile && (
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {cnicFrontFile.name} · {(cnicFrontFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CNIC back</Label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setCnicBackFile(e.target.files?.[0] ?? null)}
                className="px-2 py-1.5 text-xs border rounded outline-none"
                style={inputStyle}
              />
              {cnicBackFile && (
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {cnicBackFile.name} · {(cnicBackFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Professional photo</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfessionalPhotoFile(e.target.files?.[0] ?? null)}
                className="px-2 py-1.5 text-xs border rounded outline-none"
                style={inputStyle}
              />
              {professionalPhotoFile && (
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {professionalPhotoFile.name} · {(professionalPhotoFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
          </div>
        </section>
        </>
        )}

        {activeTab === "org" && (
        <>
        {/* ─── Offices (multi with days-of-week) ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Offices</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            Where this person works. A single employee can be at multiple offices (e.g. Codelab HQ Mon-Wed + STP partner Thu-Fri).
            Pick days per office; mark the home base as primary.
          </p>

          <div className="grid grid-cols-1 gap-2 mb-3 md:grid-cols-[1fr_120px]">
            <SearchableSelect
              label=""
              value={officeToAdd}
              onChange={setOfficeToAdd}
              options={offices
                .filter((o) => !selectedOffices.find((so) => so.id === o.id))
                .map((o) => ({ value: o.id, label: o.type === "partner" && o.partner_company ? `${o.name} (${o.partner_company})` : o.name }))
              }
              placeholder="Search or pick an office to add…"
              emptyMessage="All offices already added."
            />
            <button
              type="button"
              disabled={!officeToAdd}
              onClick={() => {
                const o = offices.find((x) => String(x.id) === String(officeToAdd));
                if (!o) return;
                const isFirst = selectedOffices.length === 0;
                setSelectedOffices((prev) => [...prev, { ...o, days: [], is_primary: isFirst }]);
                setOfficeToAdd("");
              }}
              className="px-3 py-2 text-xs font-medium border rounded-md disabled:opacity-40"
              style={{ borderColor: BRAND_RED, color: BRAND_RED, background: BRAND_RED_TINT }}
            >
              Add office
            </button>
          </div>

          {selectedOffices.length === 0 ? (
            <p className="text-[11px] italic" style={{ color: TEXT_MUTED }}>
              No offices selected yet.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedOffices.map((o) => (
                <div
                  key={o.id}
                  className="p-3 border rounded-md"
                  style={{ borderColor: o.is_primary ? BRAND_RED : BORDER, background: o.is_primary ? BRAND_RED_TINT : SURFACE_ALT }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{o.name}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "white", color: TEXT_MUTED, border: `1px solid ${BORDER}` }}>
                        {o.type}
                      </span>
                      {o.is_primary && (
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold" style={{ background: BRAND_RED, color: "white" }}>
                          primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!o.is_primary && (
                        <button
                          type="button"
                          onClick={() => setSelectedOffices((prev) => prev.map((x) => ({ ...x, is_primary: x.id === o.id })))}
                          className="text-[11px] underline"
                          style={{ color: BRAND_RED }}
                        >
                          Make primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOffices((prev) => {
                          const next = prev.filter((x) => x.id !== o.id);
                          if (o.is_primary && next.length > 0) next[0].is_primary = true;
                          return [...next];
                        })}
                        className="p-1 rounded hover:bg-slate-200"
                        style={{ color: TEXT_MUTED }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DAYS.map((d) => {
                      const picked = (o.days || []).includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setSelectedOffices((prev) =>
                            prev.map((x) => x.id === o.id ? {
                              ...x,
                              days: picked ? x.days.filter((dd) => dd !== d.value) : [...(x.days || []), d.value],
                            } : x)
                          )}
                          className="text-[11px] px-2 py-1 rounded border font-medium"
                          style={{
                            borderColor: picked ? BRAND_RED : BORDER,
                            color: picked ? BRAND_RED : TEXT_SECONDARY,
                            background: picked ? BRAND_RED_TINT : "white",
                          }}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        </>
        )}

        {activeTab === "schedule" && (
        <>
        {/* ─── Weekly schedule grid (multi-shift) ─── */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Weekly Schedule</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            A person can have <strong>multiple shifts</strong> in a single day
            (e.g. HQ&nbsp;9–3, then STP&nbsp;3–6). Use the bulk-edit panel
            below to apply the same shifts to several days at once, then
            fine-tune individual days as needed.
          </p>

          {/* ─── Bulk-edit panel ─── */}
          <div className="p-3 mb-4 border rounded-md" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold" style={{ color: TEXT_PRIMARY }}>Quick setup — apply same shifts to multiple days</span>
            </div>

            {/* Day toggle chips + presets */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {SCHED_DAYS.map((day) => {
                const picked = bulkDays.has(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setBulkDays((prev) => {
                      const next = new Set(prev);
                      if (next.has(day)) next.delete(day); else next.add(day);
                      return next;
                    })}
                    className="text-[11px] capitalize px-2 py-1 rounded border font-medium"
                    style={{
                      borderColor: picked ? BRAND_RED : BORDER,
                      color: picked ? BRAND_RED : TEXT_SECONDARY,
                      background: picked ? BRAND_RED_TINT : "white",
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
              <span className="mx-2 text-[10px]" style={{ color: TEXT_MUTED }}>presets:</span>
              <button
                type="button"
                onClick={() => setBulkDays(new Set(["monday","tuesday","wednesday","thursday","friday"]))}
                className="text-[10px] px-2 py-1 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >Weekdays</button>
              <button
                type="button"
                onClick={() => setBulkDays(new Set(["saturday","sunday"]))}
                className="text-[10px] px-2 py-1 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >Weekend</button>
              <button
                type="button"
                onClick={() => setBulkDays(new Set(SCHED_DAYS))}
                className="text-[10px] px-2 py-1 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >All days</button>
              <button
                type="button"
                onClick={() => setBulkDays(new Set())}
                className="text-[10px] px-2 py-1 rounded border"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >Clear</button>
            </div>

            {/* Shift rows for the bulk template */}
            <div className="space-y-2">
              {bulkShifts.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[120px_120px_1fr_40px] md:items-center">
                  <input
                    type="time"
                    value={s.start || ""}
                    onChange={(e) => setBulkShifts((p) => p.map((x, i) => i === idx ? { ...x, start: e.target.value } : x))}
                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                    style={inputStyle}
                  />
                  <input
                    type="time"
                    value={s.end || ""}
                    onChange={(e) => setBulkShifts((p) => p.map((x, i) => i === idx ? { ...x, end: e.target.value } : x))}
                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                    style={inputStyle}
                  />
                  <select
                    value={s.office_slug || ""}
                    onChange={(e) => setBulkShifts((p) => p.map((x, i) => i === idx ? { ...x, office_slug: e.target.value } : x))}
                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                    style={inputStyle}
                  >
                    <option value="">— pick office —</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.slug}>
                        {o.name}{o.type === "partner" && o.partner_company ? ` (${o.partner_company})` : ""}
                      </option>
                    ))}
                    <option value="remote">Remote / work from home</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setBulkShifts((p) => p.filter((_, i) => i !== idx))}
                    disabled={bulkShifts.length === 1}
                    className="px-2 py-1 text-xs rounded-md hover:bg-slate-100 disabled:opacity-30"
                    style={{ color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
                    title="Remove this shift"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  const lastEnd = bulkShifts.length ? bulkShifts[bulkShifts.length - 1].end : "09:00";
                  setBulkShifts((p) => [...p, { start: lastEnd || "09:00", end: "18:00", office_slug: offices[0]?.slug || "" }]);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border rounded-md"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> Add another shift
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {bulkDays.size === 0 ? "No days selected" : `Will apply to ${bulkDays.size} day${bulkDays.size === 1 ? "" : "s"}`}
                </span>
                <button
                  type="button"
                  disabled={bulkDays.size === 0 || bulkShifts.length === 0}
                  onClick={() => {
                    // Copy the template into every selected day. Overwrites
                    // whatever was there — clearer than merging.
                    const template = bulkShifts.map((s) => ({ ...s }));
                    setWeeklySchedule((prev) => {
                      const next = { ...prev };
                      bulkDays.forEach((day) => { next[day] = template.map((s) => ({ ...s })); });
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-40"
                  style={{ background: BRAND_RED }}
                >
                  Apply to selected days
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {SCHED_DAYS.map((day) => {
              const shifts = Array.isArray(weeklySchedule[day]) ? weeklySchedule[day] : [];
              const isOff = shifts.length === 0;

              const addShift = () => {
                // Default: continue from the last shift's end time, or 09:00.
                const lastEnd = shifts.length ? shifts[shifts.length - 1].end : "09:00";
                setWeeklySchedule((p) => ({
                  ...p,
                  [day]: [
                    ...(p[day] || []),
                    { start: lastEnd || "09:00", end: "18:00", office_slug: offices[0]?.slug || "" },
                  ],
                }));
              };
              const updateShift = (idx, patch) => setWeeklySchedule((p) => ({
                ...p,
                [day]: p[day].map((s, i) => (i === idx ? { ...s, ...patch } : s)),
              }));
              const removeShift = (idx) => setWeeklySchedule((p) => ({
                ...p,
                [day]: p[day].filter((_, i) => i !== idx),
              }));

              return (
                <div
                  key={day}
                  className="border rounded-md"
                  style={{ borderColor: BORDER, background: isOff ? SURFACE_ALT : "white" }}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold capitalize" style={{ color: TEXT_PRIMARY }}>{day}</span>
                      {isOff ? (
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: SURFACE_ALT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}>
                          off
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                          {shifts.length} {shifts.length === 1 ? "shift" : "shifts"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addShift}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border rounded-md"
                      style={{ borderColor: BRAND_RED, color: BRAND_RED, background: BRAND_RED_TINT }}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> Add shift
                    </button>
                  </div>

                  {/* Shifts list */}
                  {shifts.length > 0 && (
                    <div className="p-3 space-y-2">
                      {shifts.map((s, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 gap-2 md:grid-cols-[120px_120px_1fr_40px] md:items-center"
                        >
                          <input
                            type="time"
                            value={s.start || ""}
                            onChange={(e) => updateShift(idx, { start: e.target.value })}
                            className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                            style={inputStyle}
                          />
                          <input
                            type="time"
                            value={s.end || ""}
                            onChange={(e) => updateShift(idx, { end: e.target.value })}
                            className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                            style={inputStyle}
                          />
                          <select
                            value={s.office_slug || ""}
                            onChange={(e) => updateShift(idx, { office_slug: e.target.value })}
                            className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-2 focus:ring-red-100"
                            style={inputStyle}
                          >
                            <option value="">— pick office —</option>
                            {offices.map((o) => (
                              <option key={o.id} value={o.slug}>
                                {o.name}{o.type === "partner" && o.partner_company ? ` (${o.partner_company})` : ""}
                              </option>
                            ))}
                            <option value="remote">Remote / work from home</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeShift(idx)}
                            className="px-2 py-1 text-xs rounded-md hover:bg-slate-100"
                            style={{ color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
                            title="Remove this shift"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        </>
        )}

        {/* ─── Persistent footer: Prev / Next / Save ─── */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(HR_EMPLOYEES)}
              className="px-3 py-2 text-sm border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
          </div>

          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
            Tab {tabIndex + 1} of {TABS.length} — {TABS[tabIndex].label}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTab(-1)}
              disabled={tabIndex === 0}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md disabled:opacity-40"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {tabIndex < TABS.length - 1 ? (
              <button
                type="button"
                onClick={() => goTab(1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white rounded-md"
                style={{ background: BRAND_RED }}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                style={{ background: BRAND_RED }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {submitting ? (isEdit ? "Saving…" : "Hiring…") : (isEdit ? "Save changes" : "Hire employee")}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeFormPage;
