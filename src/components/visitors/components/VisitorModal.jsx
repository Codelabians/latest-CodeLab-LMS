import React, { useEffect, useMemo, useState } from "react";
import {
  X, UserSearch, Phone, Mail, BookOpen, MessageSquare,
  CalendarClock, Loader2, Bell, Instagram, UserCheck, Tag, Layers,
  Laptop, Percent,
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

const REFERRAL_SOURCES = [
  { value: "walk_in",            label: "Walk-in" },
  { value: "whatsapp",           label: "WhatsApp" },
  { value: "instagram",          label: "Instagram" },
  { value: "facebook",           label: "Facebook" },
  { value: "website",            label: "Website" },
  { value: "referral_friend",    label: "Referral – Friend" },
  { value: "referral_employee",  label: "Referral – Employee" },
  { value: "google_ads",         label: "Google Ads" },
  { value: "other",              label: "Other" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const validate = (s) => {
  const e = {};
  if (!s.name || s.name.trim().length === 0) e.name = "Name is required";
  else if (s.name.length > 255) e.name = "Name must be 255 characters or fewer";
  if (!s.contact || s.contact.trim().length === 0) e.contact = "Contact is required";
  else if (s.contact.length > 50) e.contact = "Contact must be 50 characters or fewer";
  if (s.email && !/^\S+@\S+\.\S+$/.test(s.email)) e.email = "Enter a valid email";
  if (!["tech_school", "it_solutions", "other"].includes(s.section)) e.section = "Pick a section";
  if (!s.visit_purpose_id) e.visit_purpose_id = "Pick a visit purpose";
  if (s.notes && s.notes.length > 2000) e.notes = "Notes must be 2000 characters or fewer";
  if (s.referral_note && s.referral_note.length > 500) e.referral_note = "Max 500 chars";
  if (s.reminder_note && s.reminder_note.length > 500) e.reminder_note = "Max 500 chars";
  if (s.instagram_handle && s.instagram_handle.length > 100) e.instagram_handle = "Max 100 chars";
  if (s.follow_up_date && s.follow_up_date < todayStr()) e.follow_up_date = "Must be today or later";
  if (s.reminder_date   && s.reminder_date   < todayStr()) e.reminder_date   = "Must be today or later";
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

const Segmented = ({ value, onChange, options }) => (
  <div className="inline-flex w-full items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
    {options.map((opt) => (
      <button
        key={opt.v} type="button" onClick={() => onChange(opt.v)}
        className="flex-1 px-2 py-1.5 text-xs font-semibold transition rounded-md"
        style={{ color: value === opt.v ? "#fff" : TEXT_SECONDARY, background: value === opt.v ? BRAND_RED : "transparent" }}
      >{opt.l}</button>
    ))}
  </div>
);

const VisitorModal = ({
  isOpen,
  mode,                  // "add" | "edit"
  initialVisitor,
  purposes = [],         // [{id, name, section}]
  courses = [],          // [{id, uuid, name}]
  referrerUsers = [],    // [{id, first_name, last_name, name}]
  onClose,
  onSubmit,              // (payload) => Promise<{error: string|null}>
  isLoading,
}) => {
  const isEdit = mode === "edit";

  const blank = {
    name: "",
    contact: "",
    email: "",
    section: "tech_school",
    visit_purpose_id: "",
    interested_course_id: "",
    notes: "",
    follow_up_required: false,
    follow_up_date: "",
    referral_source: "",
    referral_note: "",
    referrer_user_id: "",
    instagram_handle: "",
    reminder_date: "",
    reminder_note: "",
    enrollment_discount: "",
    monthly_discount: "",
    discount_reason: "",
    laptop_required: false,
    laptop_fee: "",
  };

  const [state, setState] = useState(blank);
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTouched({});
    setServerError("");
    if (isEdit && initialVisitor) {
      setState({
        name: initialVisitor.name || "",
        contact: initialVisitor.contact || "",
        email: initialVisitor.email || "",
        section: initialVisitor.section || "tech_school",
        visit_purpose_id: initialVisitor.visit_purpose_id ? String(initialVisitor.visit_purpose_id) : "",
        interested_course_id: initialVisitor.interested_course?.id
          ? String(initialVisitor.interested_course.id)
          : "",
        notes: initialVisitor.notes || "",
        follow_up_required: !!initialVisitor.follow_up_required,
        follow_up_date: initialVisitor.follow_up_date || "",
        referral_source: initialVisitor.referral_source || "",
        referral_note: initialVisitor.referral_note || "",
        referrer_user_id: initialVisitor.referrer_user_id ? String(initialVisitor.referrer_user_id) : "",
        instagram_handle: initialVisitor.instagram_handle || "",
        reminder_date: initialVisitor.reminder_date || "",
        reminder_note: initialVisitor.reminder_note || "",
        enrollment_discount: initialVisitor.enrollment_discount ?? "",
        monthly_discount: initialVisitor.monthly_discount ?? "",
        discount_reason: initialVisitor.discount_reason || "",
        laptop_required: !!initialVisitor.laptop_required,
        laptop_fee: initialVisitor.laptop_fee ?? "",
      });
    } else {
      setState(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialVisitor?.id]);

  const errors = validate(state);
  const isValid = Object.keys(errors).length === 0;
  const showErr = (k) => (touched[k] && errors[k]) || "";

  const set = (k, v) => {
    setState((p) => {
      const next = { ...p, [k]: v };
      // When section changes, clear the visit_purpose_id since the new
      // section's purposes may be different.
      if (k === "section" && p.section !== v) next.visit_purpose_id = "";
      return next;
    });
    if (serverError) setServerError("");
  };
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  /* Filter purposes by selected section */
  const purposeOptions = useMemo(
    () => purposes
      .filter((p) => !state.section || p.section === state.section)
      .map((p) => ({ value: String(p.id), label: p.name })),
    [purposes, state.section]
  );

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses]
  );

  const referrerOptions = useMemo(
    () => referrerUsers.map((u) => ({
      value: String(u.id),
      label: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim(),
    })),
    [referrerUsers]
  );

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setTouched({ name: true, contact: true, section: true, visit_purpose_id: true });
    if (!isValid) return;

    const payload = {
      name: state.name.trim(),
      contact: state.contact.trim(),
      section: state.section,
      visit_purpose_id: Number(state.visit_purpose_id),
      follow_up_required: !!state.follow_up_required,
    };
    if (state.email.trim()) payload.email = state.email.trim();
    if (state.interested_course_id) payload.interested_course_id = Number(state.interested_course_id);
    if (state.notes.trim()) payload.notes = state.notes.trim();
    if (state.follow_up_required && state.follow_up_date) payload.follow_up_date = state.follow_up_date;
    if (state.referral_source) payload.referral_source = state.referral_source;
    if (state.referral_note.trim()) payload.referral_note = state.referral_note.trim();
    if (state.referrer_user_id) payload.referrer_user_id = Number(state.referrer_user_id);
    if (state.instagram_handle.trim()) payload.instagram_handle = state.instagram_handle.trim();
    if (state.reminder_date) payload.reminder_date = state.reminder_date;
    if (state.reminder_note.trim()) payload.reminder_note = state.reminder_note.trim();
    if (state.enrollment_discount !== "") payload.enrollment_discount = Number(state.enrollment_discount) || 0;
    if (state.monthly_discount !== "") payload.monthly_discount = Number(state.monthly_discount) || 0;
    if (state.discount_reason.trim()) payload.discount_reason = state.discount_reason.trim();
    payload.laptop_required = !!state.laptop_required;
    payload.laptop_fee = state.laptop_required && state.laptop_fee !== "" ? (Number(state.laptop_fee) || 0) : 0;

    setServerError("");
    const result = await onSubmit(payload);
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
        className="w-full max-w-3xl overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <UserSearch size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isEdit ? "Edit Visitor" : "Log New Visitor"}
              </h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                Record a walk-in or remote enquiry — only the basics are required
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

          {/* Basics */}
          <div className="mb-2">
            <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
              Basics
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Name" icon={UserSearch} error={showErr("name")} required>
              <input type="text" value={state.name} onChange={(ev) => set("name", ev.target.value)} onBlur={() => markTouched("name")} placeholder="Ali Khan" disabled={isLoading} style={inputStyle(!!showErr("name"))} />
            </Field>
            <Field label="Contact (phone / WhatsApp)" icon={Phone} error={showErr("contact")} required>
              <input type="tel" value={state.contact} onChange={(ev) => set("contact", ev.target.value)} onBlur={() => markTouched("contact")} placeholder="0300 1234567" disabled={isLoading} style={inputStyle(!!showErr("contact"))} />
            </Field>
            <Field label="Email" icon={Mail} error={showErr("email")} helper="Optional">
              <input type="email" value={state.email} onChange={(ev) => set("email", ev.target.value)} onBlur={() => markTouched("email")} placeholder="ali@example.com" disabled={isLoading} style={inputStyle(!!showErr("email"))} />
            </Field>
            <Field label="Section" icon={Layers} error={showErr("section")} required>
              <Segmented
                value={state.section}
                onChange={(v) => set("section", v)}
                options={[
                  { v: "tech_school",  l: "Tech School" },
                  { v: "it_solutions", l: "IT Solutions" },
                  { v: "other",        l: "Other" },
                ]}
              />
            </Field>
            <Field label="Visit purpose" icon={Tag} error={showErr("visit_purpose_id")} required>
              <SearchableSelect
                options={purposeOptions}
                value={state.visit_purpose_id}
                onChange={(v) => { set("visit_purpose_id", v || ""); markTouched("visit_purpose_id"); }}
                placeholder={purposeOptions.length ? "Pick a purpose" : "No purposes for this section"}
                hasError={!!showErr("visit_purpose_id")}
              />
            </Field>
            <Field label="Interested in course" icon={BookOpen} helper="Optional">
              <SearchableSelect
                options={courseOptions}
                value={state.interested_course_id}
                onChange={(v) => set("interested_course_id", v || "")}
                placeholder="Optional"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes" icon={MessageSquare} error={showErr("notes")} helper={`${state.notes.length}/2000`}>
                <textarea
                  rows={3} value={state.notes} onChange={(ev) => set("notes", ev.target.value)} disabled={isLoading}
                  placeholder="Anything worth remembering about this visit…"
                  style={{ ...inputStyle(!!showErr("notes")), height: "auto", padding: 12, resize: "vertical" }}
                />
              </Field>
            </div>
          </div>

          {/* Follow-up */}
          <div className="mb-2">
            <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
              Follow-up
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <label
              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
              style={{
                background: state.follow_up_required ? "#FFFBEB" : SURFACE_HOVER,
                border: `1px solid ${state.follow_up_required ? "#FDE68A" : BORDER}`,
              }}
            >
              <input
                type="checkbox" checked={state.follow_up_required}
                onChange={(ev) => set("follow_up_required", ev.target.checked)}
                className="w-4 h-4 cursor-pointer" style={{ accentColor: "#B45309" }}
              />
              <CalendarClock size={15} strokeWidth={2} style={{ color: state.follow_up_required ? "#B45309" : TEXT_SECONDARY }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: state.follow_up_required ? "#B45309" : TEXT_PRIMARY }}>
                  Follow-up required
                </div>
                <div className="text-[11px]" style={{ color: TEXT_MUTED, marginTop: 1 }}>
                  Toggle on if reception needs to call back
                </div>
              </div>
            </label>

            <Field label="Follow-up date" icon={CalendarClock} error={showErr("follow_up_date")} helper="Today or later">
              <input
                type="date" min={todayStr()} value={state.follow_up_date}
                onChange={(ev) => set("follow_up_date", ev.target.value)} onBlur={() => markTouched("follow_up_date")}
                disabled={isLoading || !state.follow_up_required}
                style={inputStyle(!!showErr("follow_up_date"))}
              />
            </Field>
          </div>

          {/* Source & referrer */}
          <div className="mb-2">
            <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
              Source & referrer
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-2">
            <Field label="Referral source" icon={Tag} helper="How did they hear about us?">
              <SearchableSelect
                options={REFERRAL_SOURCES}
                value={state.referral_source}
                onChange={(v) => set("referral_source", v || "")}
                placeholder="Optional"
              />
            </Field>
            <Field label="Referrer (employee)" icon={UserCheck} helper="Used for referral rewards">
              <SearchableSelect
                options={referrerOptions}
                value={state.referrer_user_id}
                onChange={(v) => set("referrer_user_id", v || "")}
                placeholder="Optional"
              />
            </Field>
            <Field label="Referral note" icon={MessageSquare} error={showErr("referral_note")} helper={`${state.referral_note.length}/500`}>
              <input type="text" value={state.referral_note} onChange={(ev) => set("referral_note", ev.target.value)} disabled={isLoading} style={inputStyle(!!showErr("referral_note"))} />
            </Field>
            <Field label="Instagram handle" icon={Instagram} error={showErr("instagram_handle")} helper="Without @">
              <input type="text" value={state.instagram_handle} onChange={(ev) => set("instagram_handle", ev.target.value)} disabled={isLoading} placeholder="aleeyakhan" style={inputStyle(!!showErr("instagram_handle"))} />
            </Field>
          </div>

          {/* Reminder (cron / n8n) */}
          <div className="mb-2">
            <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
              Reminder (automated nudge)
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Reminder date" icon={Bell} error={showErr("reminder_date")} helper="Today or later">
              <input type="date" min={todayStr()} value={state.reminder_date} onChange={(ev) => set("reminder_date", ev.target.value)} onBlur={() => markTouched("reminder_date")} disabled={isLoading} style={inputStyle(!!showErr("reminder_date"))} />
            </Field>
            <Field label="Reminder note" icon={MessageSquare} error={showErr("reminder_note")} helper={`${state.reminder_note.length}/500`}>
              <input type="text" value={state.reminder_note} onChange={(ev) => set("reminder_note", ev.target.value)} disabled={isLoading} style={inputStyle(!!showErr("reminder_note"))} />
            </Field>
          </div>
          {/* Discount & laptop */}
          <div className="mb-2 mt-5">
            <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
              Discount & laptop (what we offer)
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Enrollment discount (Rs)" icon={Percent} helper="Rs off the one-time enrollment fee">
              <input type="number" min="0" value={state.enrollment_discount} onChange={(ev) => set("enrollment_discount", ev.target.value)} disabled={isLoading} placeholder="0" style={inputStyle(false)} />
            </Field>
            <Field label="Monthly discount (Rs)" icon={Percent} helper="Rs off every monthly fee">
              <input type="number" min="0" value={state.monthly_discount} onChange={(ev) => set("monthly_discount", ev.target.value)} disabled={isLoading} placeholder="0" style={inputStyle(false)} />
            </Field>
            <Field label="Discount reason" icon={MessageSquare} helper="Why this discount">
              <input type="text" value={state.discount_reason} onChange={(ev) => set("discount_reason", ev.target.value)} disabled={isLoading} placeholder="e.g. sibling discount" style={inputStyle(false)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg cursor-pointer" style={{ background: state.laptop_required ? "#EFF6FF" : SURFACE_HOVER, border: `1px solid ${state.laptop_required ? "#BFDBFE" : BORDER}` }}>
            <input type="checkbox" checked={state.laptop_required} onChange={(ev) => set("laptop_required", ev.target.checked)} disabled={isLoading} />
            <Laptop size={15} strokeWidth={2} style={{ color: state.laptop_required ? "#1D4ED8" : TEXT_SECONDARY }} />
            <div className="text-[13px] font-semibold" style={{ color: state.laptop_required ? "#1D4ED8" : TEXT_PRIMARY }}>Wants a laptop (adds a monthly laptop fee)</div>
          </label>
          {state.laptop_required && (
            <div className="grid grid-cols-1 gap-3 mt-3 md:grid-cols-2">
              <Field label="Monthly laptop fee (Rs)" icon={Laptop} helper="Added on top of the monthly fee">
                <input type="number" min="0" value={state.laptop_fee} onChange={(ev) => set("laptop_fee", ev.target.value)} disabled={isLoading} placeholder="0" style={inputStyle(false)} />
              </Field>
            </div>
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
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : isEdit ? "Save changes" : "Log visitor"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorModal;
