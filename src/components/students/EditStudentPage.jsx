import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Loader2, Save, User, Mail, Phone, CreditCard, MapPin,
  GraduationCap, Users as UsersIcon, Home, CheckCircle2, AlertTriangle,
  Gift, UserPlus,
} from "lucide-react";
import { useGetQuery, usePatchMutation, usePostMutation, useDeleteMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const inputStyle = (err) => ({
  background: SURFACE_HOVER,
  border: `1px solid ${err ? BRAND : BORDER}`,
  color: TEXT_PRIMARY,
  fontFamily: "'Montserrat', sans-serif",
  height: 40,
});

function Field({ icon: Icon, label, required, error, helper, children }) {
  return (
    <div>
      <label className="text-[12px] font-semibold flex items-center gap-1 mb-1" style={{ color: TEXT_SECONDARY }}>
        {Icon && <Icon size={13} style={{ color: TEXT_MUTED }} />} {label}{required && <span style={{ color: BRAND }}>*</span>}
      </label>
      {children}
      {helper && <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>{helper}</p>}
      {error && <p className="text-[11px] mt-1" style={{ color: BRAND }}>{error}</p>}
    </div>
  );
}

export default function EditStudentPage() {
  const { studentUuid } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetQuery({ path: `/student/students/${studentUuid}` });
  const [patch, { isLoading: saving }] = usePatchMutation();
  const [uploadAvatar, { isLoading: uploadingPhoto }] = usePostMutation();
  const [assignProg] = usePostMutation();
  const [unassignProg] = useDeleteMutation();
  const { data: progData } = useGetQuery({ path: "student/scholarship-programs/active" });
  const programs = progData?.data || [];
  const [imageFile, setImageFile] = useState(null);
  const { data: cityData } = useGetQuery({ path: "/core/cities/active" });

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    const s = data?.data?.student;
    if (s && !form) {
      const enrollments = data?.data?.enrollments || [];
      const activeEnr =
        enrollments.find((e) => e.is_active) || enrollments[0];
      const enrSchedule = activeEnr?.fees?.schedule || [];
      const enrInst =
        enrSchedule.find(
          (r) => String(r.type).toLowerCase() === "enrollment" && r.status !== "paid",
        ) ||
        enrSchedule.find((r) => String(r.type).toLowerCase() === "enrollment");
      setForm({
        first_name: s.first_name || "",
        last_name: s.last_name || "",
        email: s.email || "",
        contact: s.contact || "",
        cnic: s.cnic || "",
        gender: (s.gender || "").toLowerCase(),
        city: s.city || "",
        address: s.address || "",
        guardian_name: s.guardian_name || "",
        guardian_phone: s.guardian_phone || "",
        qualification: s.qualification || "",
        is_hostalize: !!s.is_hostalize,
        father_name: s.father_name || "",
        dob: s.dob ? String(s.dob).slice(0, 10) : "",
        marital_status: s.marital_status || "",
        student_type: s.student_type || "",
        province: s.province || "",
        university: s.university || "",
        current_qualification: s.current_qualification || "",
        is_laptop_demanded: s.is_laptop_demanded || "",
        fixed_fee: s.fixed_fee ?? "",
        join_date: (activeEnr?.join_date || "").slice(0, 10),
        enrollment_fee_due_date: (enrInst?.due_date || "").slice(0, 10),
        monthly_billing_day: "",
        enrollment_discount:
          activeEnr?.fees?.enrollment_fee_discount != null
            ? String(activeEnr.fees.enrollment_fee_discount)
            : "",
        monthly_discount: activeEnr?.fees?.monthly_fee_discount
          ? String(activeEnr.fees.monthly_fee_discount)
          : "",
        monthly_discount_scope: "existing",
        scholarship_program_uuid: s.scholarship_program?.scholarship_program_uuid || "",
        // Referral: the student's OWN shareable code + who referred them.
        referral_code: s.referral_code || "",
        referrer_code: s.referrer?.referral_code || "",
      });
    }
  }, [data, form]);

  const cityOptions = useMemo(
    () => (cityData?.data || []).map((c) => ({ value: c.name || c, label: c.name || c })),
    [cityData]
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.first_name?.trim()) e.first_name = "First name is required.";
    if (!form.email?.trim()) e.email = "Email is required.";
    if (!form.gender) e.gender = "Select gender.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) { notify("Fix the highlighted fields.", false); return; }
    const body = {
      ...form,
      fixed_fee: form.fixed_fee === "" || form.fixed_fee == null ? null : Number(form.fixed_fee),
      join_date: form.join_date || undefined,
      enrollment_fee_due_date: form.enrollment_fee_due_date || undefined,
      monthly_billing_day: form.monthly_billing_day ? Number(form.monthly_billing_day) : undefined,
      enrollment_discount:
        form.enrollment_discount === "" || form.enrollment_discount == null
          ? undefined
          : Number(form.enrollment_discount),
      monthly_discount:
        form.monthly_discount === "" || form.monthly_discount == null
          ? undefined
          : Number(form.monthly_discount),
      monthly_discount_scope: form.monthly_discount_scope || "existing",
    };
    try {
      await patch({ path: `/student/students/${studentUuid}`, body }).unwrap();
      // Scholarship/NGO program assignment (separate endpoints). Re-bills the
      // student's unpaid fees to the program rate on assign.
      const origProg = data?.data?.student?.scholarship_program?.scholarship_program_uuid || "";
      const newProg = form.scholarship_program_uuid || "";
      if (newProg !== origProg) {
        try {
          if (newProg) {
            await assignProg({ path: `student/scholarship-programs/${newProg}/assign/${studentUuid}`, body: {} }).unwrap();
          } else if (origProg) {
            await unassignProg({ path: `student/scholarship-programs/${origProg}/assign/${studentUuid}` }).unwrap();
          }
        } catch (e) {
          notify("Saved, but the scholarship program change failed.", false);
        }
      }
      // Photo is stored via the dedicated admin avatar endpoint (the student
      // PATCH does not handle images). Best-effort so it never blocks the save.
      if (imageFile instanceof File) {
        try {
          const fd = new FormData();
          fd.append("avatar", imageFile);
          await uploadAvatar({ path: `user/${studentUuid}/avatar`, body: fd }).unwrap();
        } catch (e) {
          notify("Saved, but the photo upload failed.", false);
        }
      }
      notify("Student updated.");
      setTimeout(() => navigate(-1), 700);
    } catch (err) {
      notify(err?.data?.message || "Update failed.", false);
    }
  };

  if (isLoading || !form) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ background: "#FAFBFC" }}><Loader2 size={28} className="animate-spin" style={{ color: BRAND }} /></div>;
  }

  const s = data?.data?.student;
  const inp = "w-full px-3 rounded-lg text-[13px] outline-none";

  return (
    <div className="w-full px-6 py-6 pb-28 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: TEXT_SECONDARY }}><ChevronLeft size={16} /> Back</button>

      <div className="flex items-center gap-3 mb-5">
        {s?.image
          ? <img src={s.image} alt="" className="rounded-full object-cover" style={{ width: 44, height: 44 }} />
          : <span className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `${BRAND}14`, color: BRAND }}><User size={22} /></span>}
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>Edit Student</h1>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{s?.name}{s?.registration_no ? ` · Reg ${s.registration_no}` : ""}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${BORDER}` }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-4 pb-2">
            {(imageFile || s?.image) ? (
              <img src={imageFile ? URL.createObjectURL(imageFile) : s.image} alt="" className="rounded-full object-cover" style={{ width: 64, height: 64, border: `2px solid ${BORDER}` }} />
            ) : (
              <span className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: `${BRAND}14`, color: BRAND }}><User size={28} /></span>
            )}
            <div>
              <label className="text-[12px] font-semibold flex items-center gap-1 mb-1" style={{ color: TEXT_SECONDARY }}>Profile photo</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" />
              <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>Optional — add or change the photo anytime.</p>
            </div>
          </div>
          <Field icon={User} label="First name" required error={errors.first_name}>
            <input className={inp} style={inputStyle(errors.first_name)} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </Field>
          <Field icon={User} label="Last name">
            <input className={inp} style={inputStyle()} value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </Field>
          <Field icon={Mail} label="Email" required error={errors.email}>
            <input className={inp} style={inputStyle(errors.email)} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field icon={Phone} label="Phone">
            <input className={inp} style={inputStyle()} value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="CNIC">
            <input className={inp} style={inputStyle()} value={form.cnic} onChange={(e) => set("cnic", e.target.value)} />
          </Field>
          <Field icon={User} label="Gender" required error={errors.gender}>
            <select className={inp} style={inputStyle(errors.gender)} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field icon={MapPin} label="City">
            <SearchableSelect options={cityOptions} value={form.city} onChange={(v) => set("city", v || "")} placeholder="Select city…" />
          </Field>
          <Field icon={GraduationCap} label="Qualification">
            <input className={inp} style={inputStyle()} value={form.qualification} onChange={(e) => set("qualification", e.target.value)} />
          </Field>
          <Field icon={User} label="Father name">
            <input className={inp} style={inputStyle()} value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Date of birth">
            <input type="date" className={inp} style={inputStyle()} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field icon={User} label="Marital status">
            <select className={inp} style={inputStyle()} value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)}>
              <option value="">Select…</option>
              {["Single", "Married", "Divorced", "Widowed", "Separated"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field icon={Home} label="Student type">
            <select className={inp} style={inputStyle()} value={form.student_type} onChange={(e) => set("student_type", e.target.value)}>
              <option value="">Select…</option>
              <option value="hostalite">Hostalite</option>
              <option value="day_scholar">Day scholar</option>
            </select>
          </Field>
          <Field icon={MapPin} label="Province">
            <input className={inp} style={inputStyle()} value={form.province} onChange={(e) => set("province", e.target.value)} />
          </Field>
          <Field icon={GraduationCap} label="University / Institute">
            <input className={inp} style={inputStyle()} value={form.university} onChange={(e) => set("university", e.target.value)} />
          </Field>
          <Field icon={GraduationCap} label="Current qualification">
            <input className={inp} style={inputStyle()} value={form.current_qualification} onChange={(e) => set("current_qualification", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Fixed fee (Rs)">
            <input type="number" min="0" className={inp} style={inputStyle()} value={form.fixed_fee} onChange={(e) => set("fixed_fee", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Enrollment date">
            <input type="date" className={inp} style={inputStyle()} value={form.join_date} onChange={(e) => set("join_date", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Enrollment fee due date">
            <input type="date" className={inp} style={inputStyle()} value={form.enrollment_fee_due_date} onChange={(e) => set("enrollment_fee_due_date", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Enrollment discount (Rs)" helper="Discount off the enrollment fee. Set it to the full enrollment fee to waive it — the fee becomes Rs 0 and is auto-marked paid. Only applies if the enrollment fee is not already paid.">
            <input type="number" min="0" className={inp} style={inputStyle()} value={form.enrollment_discount} onChange={(e) => set("enrollment_discount", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Monthly fee discount (Rs / month)" helper="Reduces every UNPAID month by this amount; paid months are untouched. Choose the scope below.">
            <input type="number" min="0" className={inp} style={inputStyle()} value={form.monthly_discount} onChange={(e) => set("monthly_discount", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Apply monthly discount to">
            <select className={inp} style={inputStyle()} value={form.monthly_discount_scope} onChange={(e) => set("monthly_discount_scope", e.target.value)}>
              <option value="existing">Only existing unpaid months</option>
              <option value="future">Existing + all future months</option>
            </select>
          </Field>
          <Field icon={GraduationCap} label="Scholarship / NGO program" helper="Sponsored students pay the program's fixed fees; unpaid fees are re-billed to that rate and the difference tracked as the program's subsidy.">
            <select className={inp} style={inputStyle()} value={form.scholarship_program_uuid} onChange={(e) => set("scholarship_program_uuid", e.target.value)}>
              <option value="">No program</option>
              {programs.map((pr) => (
                <option key={pr.uuid} value={pr.uuid}>{pr.name} (monthly Rs {Number(pr.monthly_fee_override || 0).toLocaleString()})</option>
              ))}
            </select>
          </Field>
          <Field icon={CreditCard} label="Monthly fee day (1-28)">
            <input type="number" min="1" max="28" className={inp} style={inputStyle()} value={form.monthly_billing_day} onChange={(e) => set("monthly_billing_day", e.target.value)} />
          </Field>
          <Field icon={GraduationCap} label="Laptop demanded">
            <select className={inp} style={inputStyle()} value={form.is_laptop_demanded} onChange={(e) => set("is_laptop_demanded", e.target.value)}>
              <option value="">—</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field icon={UsersIcon} label="Guardian name">
            <input className={inp} style={inputStyle()} value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} />
          </Field>
          <Field icon={Phone} label="Guardian phone">
            <input className={inp} style={inputStyle()} value={form.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field icon={MapPin} label="Address">
              <input className={inp} style={inputStyle()} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input type="checkbox" checked={form.is_hostalize} onChange={(e) => set("is_hostalize", e.target.checked)} />
            <span className="text-[13px] inline-flex items-center gap-1" style={{ color: TEXT_SECONDARY }}><Home size={14} /> Hostelite</span>
          </label>
        </div>
      </div>

      {/* Referral */}
      <div className="bg-white rounded-xl p-5 mt-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="text-[14px] font-bold mb-1 flex items-center gap-2" style={{ color: TEXT_PRIMARY }}><Gift size={16} /> Referral</h3>
        <p className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
          The student&apos;s own shareable code, and who referred them. Set the referrer for a walk-in who came directly — if they haven&apos;t paid yet the reward applies on their first payment; if they&apos;ve already paid it&apos;s credited immediately.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field icon={Gift} label="Own referral code">
            <input className={inp} style={inputStyle()} value={form.referral_code}
              onChange={(e) => set("referral_code", e.target.value.toUpperCase())} placeholder="e.g. ABDUL-CSYP" />
          </Field>
          <Field icon={UserPlus} label="Referred by (referrer's code)">
            <input className={inp} style={inputStyle()} value={form.referrer_code}
              onChange={(e) => set("referrer_code", e.target.value.toUpperCase())} placeholder="Enter referrer's code, or clear to remove" />
          </Field>
        </div>
      </div>

      {/* Sticky save toolbar */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between" style={{ background: "#fff", borderTop: `1px solid ${BORDER}`, zIndex: 30 }}>
        <span className="text-[12px]" style={{ color: Object.keys(errors).length ? BRAND : TEXT_MUTED }}>
          {Object.keys(errors).length ? "Fix the highlighted fields" : "Ready to save"}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${BRAND}, #A30505)`, opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Update Student
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg" style={{ background: toast.ok ? "#15803D" : BRAND }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
