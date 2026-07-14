import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  GraduationCap, Loader2, ChevronLeft, ChevronRight, ChevronDown, Check, User, Users as UsersIcon,
  BookOpen, Home, Laptop, Wallet, ClipboardCheck, Mail, Phone, CreditCard, Calendar, MapPin,
  Building, Circle, ArrowLeft, Plus, Trash2,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import { useLaptopFee } from "../../hooks/useLaptopFee";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const todayStr = () => new Date().toISOString().slice(0, 10);
const clean = (v) => { const t = String(v ?? "").trim(); return (!t || t === "-" || t === "—" || t.toLowerCase() === "unknown") ? "" : t; };
const cleanEmail = (v) => { const t = clean(v); return /@placeholder\.local$/i.test(t) ? "" : t; };

const inputStyle = (err) => ({
  background: SURFACE_HOVER, border: `1px solid ${err ? "#FCA5A5" : BORDER}`, color: TEXT_PRIMARY,
  fontFamily: "'Montserrat', sans-serif", width: "100%", height: 40, padding: "0 12px",
  borderRadius: 8, fontSize: 13, outline: "none",
});

const Field = ({ label, icon: Icon, required, helper, children }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {Icon && <Icon size={13} strokeWidth={2} style={{ color: TEXT_SECONDARY }} />}
        {label}{required && <span style={{ color: BRAND_RED }}>*</span>}
      </label>
    )}
    {children}
    {helper && <p className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 2 }}>{helper}</p>}
  </div>
);

const TextInput = (props) => <input {...props} style={inputStyle(false)} />;

const Select = ({ value, onChange, children }) => (
  <div className="relative">
    <select value={value} onChange={onChange} style={{ ...inputStyle(false), appearance: "none", WebkitAppearance: "none", paddingRight: 34, cursor: "pointer" }}>{children}</select>
    <ChevronDown size={14} strokeWidth={2.25} className="absolute pointer-events-none -translate-y-1/2 right-3 top-1/2" style={{ color: TEXT_MUTED }} />
  </div>
);

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" }, { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" }, { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" }, { value: "other", label: "Other" },
];

const STEPS = [
  { key: "student", label: "Student details", icon: User },
  { key: "course", label: "Course & batch", icon: BookOpen },
  { key: "extras", label: "Hostel & laptop", icon: Home },
  { key: "fee", label: "Fee & review", icon: Wallet },
];

export default function EnrollStudentWizard() {
  const { id } = useParams();
  const direct = !id;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");

  const { data: inqRes, isLoading: inqLoadingRaw } = useGetQuery({ path: `/student/inquiry/${id}` }, { skip: !id });
  const inqLoading = id ? inqLoadingRaw : false;
  const inquiry = inqRes?.data || inqRes || null;

  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const { data: cityData } = useGetQuery({ path: "/core/cities/active" });
  const { data: discSettings } = useGetQuery({ path: "finance/fee-discount-settings" });
  const { data: instData } = useGetQuery({ path: "/employee/institutes" });
  const { data: progData } = useGetQuery({ path: "student/scholarship-programs/active" });
  const { data: courseData } = useGetQuery({ path: "/course/courses", params: { per_page: 200 } }, { skip: !direct });

  const [stu, setStu] = useState({});
  const [courseId, setCourseId] = useState("");
  const [batchUuid, setBatchUuid] = useState("");
  const [joiningDate, setJoiningDate] = useState(todayStr());
  const [enrollmentDue, setEnrollmentDue] = useState("");
  const [monthlyDue, setMonthlyDue] = useState("");
  const [hostalize, setHostalize] = useState(false);
  // Configured monthly laptop fee (Website Settings) — shown when a laptop
  // is assigned. The actual recurring charge is created server-side from the
  // laptop assignment, so this is informational and not added to the payload.
  const laptopFeeSetting = useLaptopFee(0);
  const [needsLaptop, setNeedsLaptop] = useState(false);
  const [laptopUuid, setLaptopUuid] = useState("");
  const [laptopFullCourse, setLaptopFullCourse] = useState(true);
  const [laptopDays, setLaptopDays] = useState("");
  const [laptopDiscType, setLaptopDiscType] = useState("");
  const [laptopDiscValue, setLaptopDiscValue] = useState("");
  const [payNow, setPayNow] = useState(false);
  // Repeatable payment lines — each line targets a fee (enrollment or
  // monthly) and carries its own amount, method, account and reference.
  // This mirrors the fee-collection screen so the admin can say e.g.
  // "Rs 5k enrollment by bank + Rs 2k monthly cash", and split a single
  // fee across methods (two enrollment lines: 6k bank + 6k cash).
  const [payLines, setPayLines] = useState([
    { fee_slot: "enrollment", amount: "", payment_method: "cash", payment_account_uuid: "", payment_reference: "" },
  ]);
  const [enrollDisc, setEnrollDisc] = useState("");
  const [monthlyDisc, setMonthlyDisc] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [scholarshipProgram, setScholarshipProgram] = useState("");

  // Slot-aware laptops from the new asset system (only units free in the
  // selected batch's time slot).
  const laptopSlot = (batchData?.data || []).find((b) => String(b.batch_uuid) === String(batchUuid))?.time_slot;
  const { data: laptopData } = useGetQuery(
    { path: "/assets/laptops-available", params: laptopSlot ? { time_slot: laptopSlot } : undefined },
    { skip: !needsLaptop },
  );
  const { data: acctData } = useGetQuery({ path: "/finance/payment-accounts/active" }, { skip: !payNow });

  useEffect(() => {
    if (!inquiry) return;
    setStu({
      first_name: clean(inquiry.first_name), last_name: clean(inquiry.last_name),
      email: cleanEmail(inquiry.email), phone_number: clean(inquiry.phone_number || inquiry.phone),
      cnic: clean(inquiry.cnic),
      gender: ["male", "female", "other"].includes(String(inquiry.gender || "").toLowerCase()) ? String(inquiry.gender).toLowerCase() : "",
      date_of_birth: inquiry.date_of_birth ? String(inquiry.date_of_birth).slice(0, 10) : "",
      city: clean(inquiry.city), address: clean(inquiry.address),
      guardian_name: clean(inquiry.guardian_name), guardian_phone: clean(inquiry.guardian_phone),
      university: clean(inquiry.university), current_qualification: clean(inquiry.current_qualification),
    });
    setNeedsLaptop(inquiry.is_laptop_demanded === "Yes");
    // Prefill any discount already quoted on the inquiry (admin can edit).
    if (Number(inquiry.enrollment_discount) > 0) setEnrollDisc(String(inquiry.enrollment_discount));
    if (Number(inquiry.monthly_discount) > 0) setMonthlyDisc(String(inquiry.monthly_discount));
  }, [inquiry]);

  const courses = courseData?.data || [];
  const batches = useMemo(() => {
    const list = batchData?.data || [];
    const cid = direct ? courseId : inquiry?.primary_course_id;
    return list.filter((b) => b.is_active && (!cid || String(b.course_id) === String(cid)));
  }, [batchData, inquiry, direct, courseId]);
  const cityOptions = (cityData?.data || []).map((c) => ({ value: c.name, label: c.name })).filter((o) => o.value);
  const instOptions = (instData?.data || []).map((i) => ({ value: i.name, label: i.name })).filter((o) => o.value);
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.name }));
  const batchOptions = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.timing ? ` · ${b.timing}` : ""}${b.course_name ? ` · ${b.course_name}` : ""}` }));
  const laptops = laptopData?.data || [];
  const accounts = acctData?.data || [];

  // Base fees: from the picked course (direct enrol) or the inquiry's
  // primary_course (promote) — the inquiry payload carries the fees.
  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));
  // Selected batch — used as a fee fallback when the inquiry has no
  // primary course (visitor→inquiry conversions). The batch's course
  // becomes the primary course on enrol, so its fees apply.
  const selBatch = batches.find((b) => String(b.batch_uuid) === String(batchUuid));
  const baseEnroll = Number(
    direct
      ? (selectedCourse?.enrollment_fee || 0)
      : (inquiry?.primary_course?.enrollment_fee || selBatch?.course_enrollment_fee || 0)
  );
  const baseMonthly = Number(
    direct
      ? (selectedCourse?.monthly_fee || 0)
      : (inquiry?.primary_course?.monthly_fee || selBatch?.course_monthly_fee || 0)
  );
  const selProgram = (progData?.data || []).find((pp) => pp.uuid === scholarshipProgram) || null;
  // When a scholarship/NGO program is selected, the program's fixed rates drive
  // the fees (and the payment lines) — manual/auto discounts are ignored.
  const netEnroll = selProgram
    ? (selProgram.enrollment_fee_override != null ? Number(selProgram.enrollment_fee_override) : baseEnroll)
    : Math.max(baseEnroll - (Number(enrollDisc) || 0), 0);
  const netMonthly = selProgram
    ? Number(selProgram.monthly_fee_override || 0)
    : Math.max(baseMonthly - (Number(monthlyDisc) || 0), 0);
  const laptopDiscAmt = !needsLaptop ? 0 : laptopDiscType === "flat" ? (Number(laptopDiscValue) || 0) : laptopDiscType === "percent" ? Math.round((laptopFeeSetting * (Number(laptopDiscValue) || 0)) / 100) : 0;
  const netLaptop = needsLaptop
    ? (selProgram && selProgram.laptop_fee_override != null
        ? Number(selProgram.laptop_fee_override)
        : Math.max(0, laptopFeeSetting - laptopDiscAmt))
    : 0;
  const money = (n) => "Rs " + Number(n || 0).toLocaleString();

  // Seed the org-wide default discount (% → Rs for this course) when nothing
  // is quoted yet. Won't override an inquiry-quoted discount or admin edits.
  // Discount handling:
  //  - When a scholarship/NGO program is selected, clear the discounts (the
  //    program's fixed rate drives the fee instead).
  //  - When NO program is selected, (re)fill the discount from the inquiry's
  //    quoted value, else the org-wide default % from settings. So removing a
  //    program restores the normal discounts.
  useEffect(() => {
    if (scholarshipProgram) {
      setEnrollDisc("");
      setMonthlyDisc("");
      return;
    }
    const d = discSettings?.data;
    if (!enrollDisc) {
      if (Number(inquiry?.enrollment_discount) > 0) {
        setEnrollDisc(String(inquiry.enrollment_discount));
      } else if (d && baseEnroll > 0 && d.enrollment_discount_percent) {
        setEnrollDisc(String(Math.round((baseEnroll * d.enrollment_discount_percent) / 100)));
      }
    }
    if (!monthlyDisc) {
      if (Number(inquiry?.monthly_discount) > 0) {
        setMonthlyDisc(String(inquiry.monthly_discount));
      } else if (d && baseMonthly > 0 && d.monthly_discount_percent) {
        setMonthlyDisc(String(Math.round((baseMonthly * d.monthly_discount_percent) / 100)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discSettings, baseEnroll, baseMonthly, scholarshipProgram]);

  // Payment-line helpers (amount/method/account/reference per line).
  const sumForSlot = (slot) => payLines.reduce((s, l) => (l.fee_slot === slot ? s + (Number(l.amount) || 0) : s), 0);
  const payTotal = payLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const updateLine = (i, field, value) => setPayLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  const addLine = (slot = "enrollment") => setPayLines((prev) => [...prev, { fee_slot: slot, amount: "", payment_method: "cash", payment_account_uuid: "", payment_reference: "" }]);
  const removeLine = (i) => setPayLines((prev) => prev.filter((_, idx) => idx !== i));

  // Default the first line's amount to the net enrollment fee (until the
  // admin edits any line).
  const [payTouched, setPayTouched] = useState(false);

  // Changing the scholarship program resets the payment lines so their amounts
  // re-seed from the program rate (on select) or the restored discounted fee
  // (on remove) instead of keeping the previous values.
  useEffect(() => {
    setPayLines([{ fee_slot: "enrollment", amount: "", payment_method: "cash", payment_account_uuid: "", payment_reference: "" }]);
    setPayTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scholarshipProgram]);
  useEffect(() => {
    if (!payTouched && netEnroll > 0) {
      setPayLines((prev) => prev.map((l, idx) => (idx === 0 ? { ...l, amount: String(netEnroll) } : l)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netEnroll, scholarshipProgram]);

  const [promotePost, { isLoading: saving }] = usePostMutation();

  const validateStep = (s) => {
    if (s === 0) { if (!stu.first_name) return "Enter the student's first name."; if (!stu.gender) return "Select the student's gender."; }
    if (s === 1) { if (direct && !courseId) return "Select a course."; if (!batchUuid) return "Select a batch."; if (!joiningDate) return "Set the joining date."; }
    if (s === 2 && needsLaptop && !laptopUuid) return "Pick a laptop unit, or turn off 'needs laptop'.";
    if (s === 3 && payNow) {
      if (payTotal <= 0) return "Add at least one payment line with an amount, or turn off 'record payment'.";
      if (sumForSlot("enrollment") > netEnroll) return `Enrollment payments can't exceed the net enrollment fee (${money(netEnroll)}).`;
      if (sumForSlot("monthly") > netMonthly) return `Monthly payments can't exceed one month's net fee (${money(netMonthly)}).`;
      if (sumForSlot("laptop") > netLaptop) return `Laptop payment can't exceed the laptop fee (${money(netLaptop)}).`;
    }
    return "";
  };
  const errSteps = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < STEPS.length; i++) if (validateStep(i)) set.add(i);
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stu, courseId, batchUuid, joiningDate, needsLaptop, laptopUuid, payNow, payLines, netEnroll, netMonthly, netLaptop]);
  const allValid = errSteps.size === 0;

  const next = () => { const e = validateStep(step); if (e) { setErr(e); return; } setErr(""); setStep((p) => Math.min(STEPS.length - 1, p + 1)); };
  const back = () => { setErr(""); setStep((p) => Math.max(0, p - 1)); };

  const submit = async () => {
    for (let i = 0; i < STEPS.length; i++) { const e = validateStep(i); if (e) { setErr(e); setStep(i); return; } }
    const body = {
      batch_uuid: batchUuid, joining_date: joiningDate, is_hostalize: hostalize,
      student: Object.fromEntries(Object.entries(stu).filter(([, v]) => v !== "" && v != null)),
    };
    if (enrollmentDue) body.enrollment_due_date = enrollmentDue;
    if (monthlyDue) body.first_monthly_due_date = monthlyDue;
    if (!scholarshipProgram) {
      if (Number(enrollDisc) > 0) body.enrollment_discount = Number(enrollDisc);
      if (Number(monthlyDisc) > 0) body.monthly_discount = Number(monthlyDisc);
    }
    if (promoCode.trim()) body.promo_code = promoCode.trim();
    if (scholarshipProgram) body.scholarship_program_uuid = scholarshipProgram;
    if (needsLaptop && laptopUuid) {
      body.laptop_inventory_uuid = laptopUuid;
      body.laptop_full_course = laptopFullCourse;
      if (!laptopFullCourse && Number(laptopDays) > 0) body.laptop_days = Number(laptopDays);
      if (laptopDiscType && Number(laptopDiscValue) > 0) {
        body.laptop_discount_type = laptopDiscType;
        body.laptop_discount_value = Number(laptopDiscValue);
      }
    }
    if (payNow) {
      const slots = payLines
        .map((l) => ({ ...l, amount: Number(l.amount) }))
        .filter((l) => l.amount > 0 && l.payment_method)
        .map((l) => ({
          fee_slot: l.fee_slot,
          amount: l.amount,
          payment_method: l.payment_method,
          ...(l.payment_account_uuid ? { payment_account_uuid: l.payment_account_uuid } : {}),
          ...(l.payment_reference ? { payment_reference: l.payment_reference } : {}),
        }));
      if (slots.length) {
        body.payment = { payment_method: slots[0].payment_method, paid_at: todayStr(), slots };
      }
    }
    try {
      if (direct) { body.primary_course_id = Number(courseId); await promotePost({ path: `/student/inquiry/direct-enroll`, body }).unwrap(); showToast("Student added & enrolled", "success"); }
      else { await promotePost({ path: `/student/inquiry/${id}/promote-to-student`, body }).unwrap(); showToast("Student enrolled successfully", "success"); }
      navigate(-1);
    } catch (e) { setErr(e?.data?.message || "Failed to enroll."); }
  };

  const Toggle = ({ on, set }) => (
    <button type="button" onClick={() => set(!on)} className="relative inline-block rounded-full transition" style={{ width: 42, height: 24, background: on ? BRAND_RED : "#CBD5E1" }}>
      <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: on ? 20 : 2 }} />
    </button>
  );

  if (!direct && inqLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC" }}><Loader2 size={28} className="animate-spin" style={{ color: BRAND_RED }} /></div>;
  if (!direct && !inquiry) return <div className="w-full px-6 py-20 text-center" style={{ color: TEXT_MUTED }}>Inquiry not found.</div>;

  const name = direct ? "" : `${inquiry?.first_name || ""} ${inquiry?.last_name || ""}`.trim();

  return (
    <div className="w-full px-6 py-6 pb-24 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-sm font-semibold" style={{ color: TEXT_SECONDARY }}
        onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_RED)} onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SECONDARY)}>
        <ArrowLeft size={15} strokeWidth={2.25} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}><GraduationCap size={20} strokeWidth={2} /></div>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>{direct ? "Add Student" : `Enroll ${name || "student"}`}</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_MUTED }}>{direct ? "Create a student and enrol them — fees & schedule are generated automatically." : `${inquiry?.primary_course?.name || selBatch?.course_name || "Course"} — review details, then enrol & generate fees.`}</p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="sticky top-0 z-20 flex gap-1 p-1 mb-5 bg-white rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
        {STEPS.map((s, i) => {
          const isActive = step === i; const hasErr = errSteps.has(i) && i < step;
          return (
            <button key={s.key} type="button" onClick={() => i <= step && setStep(i)}
              className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-md transition"
              style={{ background: isActive ? BRAND_RED_TINT : "transparent", color: isActive ? BRAND_RED : TEXT_SECONDARY }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                {i < step ? <Check size={12} strokeWidth={2.5} /> : <s.icon size={12} strokeWidth={2.25} />}{s.label}
                {hasErr && <span className="inline-block rounded-full" style={{ width: 5, height: 5, background: BRAND_RED }} />}
              </span>
              <span className="text-[10px]" style={{ color: isActive ? BRAND_RED : TEXT_MUTED }}>Step {i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${BORDER}`, minHeight: 300 }}>
        {step === 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="First name" icon={User} required><TextInput value={stu.first_name || ""} onChange={(e) => setStu({ ...stu, first_name: e.target.value })} placeholder="First name" /></Field>
            <Field label="Last name" icon={User}><TextInput value={stu.last_name || ""} onChange={(e) => setStu({ ...stu, last_name: e.target.value })} placeholder="Last name" /></Field>
            <Field label="Gender" icon={UsersIcon} required>
              <Select value={stu.gender || ""} onChange={(e) => setStu({ ...stu, gender: e.target.value })}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select>
            </Field>
            <Field label="CNIC" icon={CreditCard} helper="e.g. 35202-1234567-1"><TextInput value={stu.cnic || ""} onChange={(e) => setStu({ ...stu, cnic: e.target.value })} placeholder="35202-1234567-1" /></Field>
            <Field label="Email" icon={Mail}><TextInput value={stu.email || ""} onChange={(e) => setStu({ ...stu, email: e.target.value })} placeholder="email@example.com" /></Field>
            <Field label="Phone" icon={Phone}><TextInput value={stu.phone_number || ""} onChange={(e) => setStu({ ...stu, phone_number: e.target.value })} placeholder="0300 1234567" /></Field>
            <Field label="Date of birth" icon={Calendar}><TextInput type="date" max={todayStr()} value={stu.date_of_birth || ""} onChange={(e) => setStu({ ...stu, date_of_birth: e.target.value })} /></Field>
            <Field label="City" icon={MapPin}>
              <SearchableSelect options={cityOptions} value={stu.city || ""} onChange={(v) => setStu({ ...stu, city: v || "" })} placeholder={cityOptions.length ? "Search city…" : "No cities yet"} />
            </Field>
            <Field label="Institute" icon={Building} helper="optional">
              <SearchableSelect options={instOptions} value={stu.university || ""} onChange={(v) => setStu({ ...stu, university: v || "" })} placeholder="Search institute…" />
            </Field>
            <Field label="Degree" icon={GraduationCap} helper="optional"><TextInput value={stu.current_qualification || ""} onChange={(e) => setStu({ ...stu, current_qualification: e.target.value })} placeholder="e.g. Intermediate, BSCS" /></Field>
            <Field label="Guardian name" icon={User}><TextInput value={stu.guardian_name || ""} onChange={(e) => setStu({ ...stu, guardian_name: e.target.value })} placeholder="Guardian name" /></Field>
            <Field label="Guardian phone" icon={Phone}><TextInput value={stu.guardian_phone || ""} onChange={(e) => setStu({ ...stu, guardian_phone: e.target.value })} placeholder="0300 1234567" /></Field>
            <div className="md:col-span-2"><Field label="Address" icon={MapPin}><TextInput value={stu.address || ""} onChange={(e) => setStu({ ...stu, address: e.target.value })} placeholder="Address" /></Field></div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {direct && (
              <div className="md:col-span-2"><Field label="Course" icon={BookOpen} required>
                <SearchableSelect options={courseOptions} value={courseId} onChange={(v) => { setCourseId(v || ""); setBatchUuid(""); }} placeholder="Search course…" />
              </Field></div>
            )}
            <div className="md:col-span-2"><Field label="Batch" icon={GraduationCap} required helper={batches.length === 0 ? "No active batch for this course — create one under Batches first." : undefined}>
              <SearchableSelect options={batchOptions} value={batchUuid} onChange={(v) => setBatchUuid(v || "")} placeholder={batchOptions.length ? "Search batch…" : "No active batch"} disabled={batchOptions.length === 0} />
            </Field></div>
            <Field label="Joining date" icon={Calendar} required><TextInput type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} /></Field>
            <Field label="Enrollment fee due" icon={Calendar}><TextInput type="date" value={enrollmentDue} onChange={(e) => setEnrollmentDue(e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="First monthly fee due" icon={Calendar}><TextInput type="date" value={monthlyDue} onChange={(e) => setMonthlyDue(e.target.value)} /></Field></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Home size={15} style={{ color: BRAND_RED }} /> Hostelite (boarder)</span>
              <Toggle on={hostalize} set={setHostalize} />
            </div>
            <div className="px-4 py-3 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Laptop size={15} style={{ color: BRAND_RED }} /> Needs a laptop</span>
                <Toggle on={needsLaptop} set={setNeedsLaptop} />
              </div>
              {needsLaptop && (
                <div className="mt-3 space-y-2.5">
                  <SearchableSelect
                    options={laptops.map((l) => ({ value: l.uuid, label: `${l.asset_tag}${l.name ? ` · ${l.name}` : ""}${l.serial_number ? ` · SN ${l.serial_number}` : ""}` }))}
                    value={laptopUuid}
                    onChange={(v) => setLaptopUuid(v || "")}
                    placeholder={laptopSlot ? `Laptops free in the ${laptopSlot} slot…` : (batchUuid ? "No laptops free in this slot" : "Select a batch first")}
                  />
                  {laptopUuid && (
                    <>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setLaptopFullCourse(true)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: laptopFullCourse ? BRAND_RED_TINT : "#fff", color: laptopFullCourse ? BRAND_RED : TEXT_SECONDARY, border: `1px solid ${laptopFullCourse ? BRAND_RED : BORDER}` }}>Full course</button>
                        <button type="button" onClick={() => setLaptopFullCourse(false)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: !laptopFullCourse ? BRAND_RED_TINT : "#fff", color: !laptopFullCourse ? BRAND_RED : TEXT_SECONDARY, border: `1px solid ${!laptopFullCourse ? BRAND_RED : BORDER}` }}>For N days</button>
                      </div>
                      {!laptopFullCourse && <input type="number" min="1" value={laptopDays} onChange={(e) => setLaptopDays(e.target.value)} placeholder="Days (return-by reminder)" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: `1px solid ${BORDER}` }} />}
                      <div className="grid grid-cols-2 gap-2">
                        <select value={laptopDiscType} onChange={(e) => setLaptopDiscType(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ border: `1px solid ${BORDER}` }}>
                          <option value="">No laptop discount</option>
                          <option value="flat">Flat Rs/mo</option>
                          <option value="percent">% / mo</option>
                        </select>
                        <input type="number" min="0" value={laptopDiscValue} onChange={(e) => setLaptopDiscValue(e.target.value)} disabled={!laptopDiscType} placeholder="Discount" className="px-3 py-2 text-sm rounded-lg outline-none" style={{ border: `1px solid ${BORDER}`, opacity: laptopDiscType ? 1 : 0.5 }} />
                      </div>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>A recurring laptop fee bills monthly at the standard rate{laptopDiscType ? " minus this discount" : ""} while assigned.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {/* Fees & discount */}
            <div className="px-4 py-3 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Wallet size={15} style={{ color: BRAND_RED }} /> Fees & discount</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Field label={`Enrollment discount (base ${money(baseEnroll)})`} icon={Wallet}>
                    <TextInput type="number" min="0" value={enrollDisc} onChange={(e) => setEnrollDisc(e.target.value)} placeholder="0" disabled={!!selProgram} />
                  </Field>
                  <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>Net enrollment: <b style={{ color: "#15803D" }}>{money(netEnroll)}</b></div>
                </div>
                <div>
                  <Field label={`Monthly discount (base ${money(baseMonthly)})`} icon={Wallet}>
                    <TextInput type="number" min="0" value={monthlyDisc} onChange={(e) => setMonthlyDisc(e.target.value)} placeholder="0" disabled={!!selProgram} />
                  </Field>
                  <div className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>Net monthly: <b style={{ color: "#15803D" }}>{money(netMonthly)}</b> <span style={{ color: TEXT_MUTED }}>(applies to every month)</span></div>
                </div>
                <div className="md:col-span-2">
                  <Field label="Promo code (optional — applies referrer)" icon={ClipboardCheck}>
                    <TextInput value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. ALI7K3Q" />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Scholarship / NGO program (optional)" icon={Wallet}>
                    <SearchableSelect
                      options={(progData?.data || []).map((pr) => ({ value: pr.uuid, label: `${pr.name} — monthly ${money(pr.monthly_fee_override)}` }))}
                      value={scholarshipProgram}
                      onChange={(v) => setScholarshipProgram(v || "")}
                      placeholder="No program"
                    />
                  </Field>
                  {selProgram && <div className="text-[11px] mt-1" style={{ color: "#6D28D9" }}>Using <b>{selProgram.name}</b> rates — enrollment {money(netEnroll)}, monthly {money(netMonthly)}. Discounts are ignored; the waived difference is tracked as this program&apos;s subsidy.</div>}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Wallet size={15} style={{ color: BRAND_RED }} /> Record a payment now</span>
                <Toggle on={payNow} set={setPayNow} />
              </div>
              {payNow && (
                <>
                  <div className="text-[11px] mt-3 mb-2" style={{ color: TEXT_MUTED }}>
                    Each line is one payment — pick which fee it pays, how much, and how (cash / account). Add lines to split across methods or fees.
                  </div>
                  <div className="space-y-2">
                    {payLines.map((line, idx) => {
                      const slotNet = line.fee_slot === "laptop" ? netLaptop : line.fee_slot === "monthly" ? netMonthly : netEnroll;
                      return (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg p-2.5" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] mb-1" style={{ color: TEXT_MUTED }}>Pays for</label>
                            <Select value={line.fee_slot} onChange={(e) => {
                              setPayTouched(true);
                              const slot = e.target.value;
                              const net = slot === "laptop" ? netLaptop : slot === "monthly" ? netMonthly : netEnroll;
                              setPayLines((prev) => prev.map((l, i2) => (i2 === idx ? { ...l, fee_slot: slot, amount: String(net || 0) } : l)));
                            }}>
                              <option value="enrollment">Enrollment</option>
                              <option value="monthly">Monthly</option>
                              {needsLaptop && <option value="laptop">Laptop</option>}
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] mb-1" style={{ color: TEXT_MUTED }}>Amount</label>
                            <TextInput type="number" min="0" max={slotNet} value={line.amount} onChange={(e) => { setPayTouched(true); updateLine(idx, "amount", e.target.value); }} placeholder="0" />
                            <div className="text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>of {money(slotNet)}</div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] mb-1" style={{ color: TEXT_MUTED }}>Method</label>
                            <Select value={line.payment_method} onChange={(e) => { setPayTouched(true); updateLine(idx, "payment_method", e.target.value); }}>{PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] mb-1" style={{ color: TEXT_MUTED }}>Account</label>
                            <Select value={line.payment_account_uuid} onChange={(e) => { setPayTouched(true); updateLine(idx, "payment_account_uuid", e.target.value); }}><option value="">—</option>{accounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.display_name || a.account_title || a.bank_name}</option>)}</Select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[11px] mb-1" style={{ color: TEXT_MUTED }}>Reference</label>
                            <TextInput value={line.payment_reference} onChange={(e) => { setPayTouched(true); updateLine(idx, "payment_reference", e.target.value); }} placeholder="TXN / cheque #" />
                          </div>
                          <div className="md:col-span-1 flex md:justify-center">
                            {payLines.length > 1 && (
                              <button type="button" onClick={() => removeLine(idx)} className="p-1.5 rounded-md" style={{ color: BRAND_RED }} title="Remove line"><Trash2 size={15} /></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button type="button" onClick={() => addLine("enrollment")} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: BRAND_RED }}>
                      <Plus size={14} /> Add payment line
                    </button>
                    <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                      Paying now: {money(payTotal)} <span className="font-normal" style={{ color: TEXT_MUTED }}>({money(sumForSlot("enrollment"))} enrol · {money(sumForSlot("monthly"))} monthly{needsLaptop ? ` · ${money(sumForSlot("laptop"))} laptop` : ""})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-3 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><ClipboardCheck size={15} style={{ color: BRAND_RED }} /> Review</div>
              <div className="grid grid-cols-2 gap-y-1.5 text-[13px]" style={{ color: TEXT_SECONDARY }}>
                <span>Student</span><span style={{ color: TEXT_PRIMARY }}>{stu.first_name} {stu.last_name} ({stu.gender || "—"})</span>
                <span>Course</span><span style={{ color: TEXT_PRIMARY }}>{direct ? (courses.find((c) => String(c.id) === String(courseId))?.name || "—") : (inquiry?.primary_course?.name || selBatch?.course_name || "—")}</span>
                <span>Batch</span><span style={{ color: TEXT_PRIMARY }}>{batches.find((b) => b.batch_uuid === batchUuid)?.name || "—"}</span>
                <span>Joining</span><span style={{ color: TEXT_PRIMARY }}>{joiningDate}</span>
                <span>Hostelite</span><span style={{ color: TEXT_PRIMARY }}>{hostalize ? "Yes" : "No"}</span>
                <span>Laptop</span><span style={{ color: TEXT_PRIMARY }}>{needsLaptop ? (laptops.find((l) => l.uuid === laptopUuid)?.asset_tag || "selected") : "No"}</span>
                <span>Enrollment (net)</span><span style={{ color: TEXT_PRIMARY }}>{money(netEnroll)}{Number(enrollDisc) > 0 ? ` (−${money(enrollDisc)})` : ""}</span>
                <span>Monthly (net)</span><span style={{ color: TEXT_PRIMARY }}>{money(netMonthly)}{Number(monthlyDisc) > 0 ? ` (−${money(monthlyDisc)})` : ""}</span>
                {needsLaptop ? (<><span>Laptop fee</span><span style={{ color: TEXT_PRIMARY }}>{money(netLaptop)}<span style={{ color: TEXT_MUTED }}> /month (billed monthly)</span>{netLaptop <= 0 ? <span style={{ color: "#B45309" }}> — set laptop fee in Website Settings</span> : null}</span></>) : null}
                {promoCode.trim() ? (<><span>Promo code</span><span style={{ color: TEXT_PRIMARY }}>{promoCode.trim()}</span></>) : null}
                <span>Payment now</span><span style={{ color: TEXT_PRIMARY }}>{(() => {
                  if (!payNow || payTotal <= 0) return "None";
                  const e = sumForSlot("enrollment"), m = sumForSlot("monthly");
                  const parts = [];
                  if (e > 0) parts.push(`${money(e)} enrollment`);
                  if (m > 0) parts.push(`${money(m)} monthly`);
                  return parts.join(" + ");
                })()}</span>
              </div>
            </div>
          </div>
        )}

        {err && <div className="mt-4 px-3 py-2 rounded-lg text-[13px] font-semibold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>{err}</div>}
      </div>

      {/* Sticky save toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30" style={{ background: "#FFFFFFCC", backdropFilter: "blur(8px)", borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
            {allValid ? <span className="inline-flex items-center gap-1.5"><Check size={12} strokeWidth={2.5} style={{ color: "#15803D" }} /> Ready to enrol</span>
              : <span className="inline-flex items-center gap-1.5"><Circle size={10} strokeWidth={2.25} /> Step {step + 1} of {STEPS.length} — fill required fields marked *</span>}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && <button onClick={back} disabled={saving} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ background: "#F1F5F9", color: TEXT_PRIMARY }}><ChevronLeft size={15} /> Back</button>}
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="inline-flex items-center gap-1 px-5 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)" }}>Continue <ChevronRight size={15} /></button>
            ) : (
              <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)" }}>{saving ? <><Loader2 size={14} className="animate-spin" /> Enrolling…</> : <><GraduationCap size={15} /> {direct ? "Add student" : "Enroll student"}</>}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
