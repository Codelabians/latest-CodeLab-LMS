import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import {
  Building2,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Link as LinkIcon,
  ShieldCheck,
  Info,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from "lucide-react";

import {
  useGetQuery,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import RichTextEditor from "../common/RichTextEditor";
import FileUploadField from "../common/FileUploadField";

/* ─────────────────────── brand tokens (matches Categories) ─────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/* ─────────────────────── permission helper ─────────────────────────── */
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────────────── small UI primitives ───────────────────────── */
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div
      className="flex items-center justify-center"
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: BRAND_RED_TINT,
        color: BRAND_RED,
      }}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
    <div>
      <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
        {title}
      </h3>
      {subtitle && (
        <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const Label = ({ htmlFor, children, required }) => (
  <label
    htmlFor={htmlFor}
    className="block text-[12px] font-semibold mb-1.5"
    style={{ color: TEXT_SECONDARY }}
  >
    {children}
    {required && <span style={{ color: BRAND_RED, marginLeft: 4 }}>*</span>}
  </label>
);

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: SURFACE,
  color: TEXT_PRIMARY,
  fontSize: 13.5,
  outline: "none",
  transition: "border-color 0.15s",
};

const TextField = ({ name, type = "text", placeholder, icon: Icon, disabled }) => (
  <div style={{ position: "relative" }}>
    {Icon && (
      <Icon
        size={15}
        strokeWidth={2}
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: TEXT_MUTED,
          pointerEvents: "none",
        }}
      />
    )}
    <Field
      name={name}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...inputStyle,
        paddingLeft: Icon ? 34 : 12,
        opacity: disabled ? 0.6 : 1,
        background: disabled ? SURFACE_ALT : SURFACE,
      }}
      onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
      onBlur={(e) => (e.target.style.borderColor = BORDER)}
    />
  </div>
);

/* ─── Formik-bound rich text field ─── */
const RichField = ({ name, placeholder, minHeight }) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  return (
    <RichTextEditor
      value={values[name] ?? ""}
      onChange={(html) => {
        setFieldValue(name, html, true);
        setFieldTouched(name, true, false);
      }}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
};

/* ─── Formik-bound file upload field ─── */
const UploadField = ({ name, folder, purpose, label, helperText }) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  return (
    <FileUploadField
      value={values[name] ?? ""}
      onChange={(path) => {
        setFieldValue(name, path, true);
        setFieldTouched(name, true, false);
      }}
      folder={folder}
      purpose={purpose}
      label={label}
      helperText={helperText}
    />
  );
};

const FieldError = ({ name, errors, touched }) =>
  errors[name] && touched[name] ? (
    <p className="text-[11.5px] mt-1" style={{ color: BRAND_RED }}>
      {errors[name]}
    </p>
  ) : null;

const Card = ({ children, style }) => (
  <div
    className="rounded-2xl"
    style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      padding: 22,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─────────────────── dynamic key→value rows editor ────────────────── */
const KeyValueRows = ({
  keyPlaceholder,
  valuePlaceholder,
  rows,
  onChange,
  valueType = "text",
  keyHelper,
}) => {
  const setKey = (i, k) => onChange(rows.map((r, idx) => (idx === i ? { ...r, key: k } : r)));
  const setVal = (i, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, value: v } : r)));
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const addRow = () => onChange([...rows, { key: "", value: "" }]);

  return (
    <div>
      <div className="space-y-2.5">
        {rows.length === 0 && (
          <div
            className="text-center py-6 rounded-lg"
            style={{
              background: SURFACE_ALT,
              border: `1px dashed ${BORDER}`,
              color: TEXT_MUTED,
              fontSize: 12.5,
            }}
          >
            No entries yet. Click <strong>Add row</strong> below to create one.
          </div>
        )}
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid items-start gap-2"
            style={{ gridTemplateColumns: "1fr 1.4fr auto" }}
          >
            <div>
              <input
                type="text"
                value={row.key}
                onChange={(e) => setKey(i, e.target.value)}
                placeholder={keyPlaceholder}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
              {keyHelper && (
                <div
                  className="text-[10.5px] mt-1"
                  style={{ color: TEXT_MUTED, lineHeight: 1.3 }}
                >
                  {keyHelper}
                </div>
              )}
            </div>
            <input
              type={valueType}
              value={row.value}
              onChange={(e) => setVal(i, e.target.value)}
              placeholder={valuePlaceholder}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
              onBlur={(e) => (e.target.style.borderColor = BORDER)}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove row"
              className="flex items-center justify-center transition"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                color: TEXT_MUTED,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BRAND_RED_TINT;
                e.currentTarget.style.borderColor = BRAND_RED;
                e.currentTarget.style.color = BRAND_RED;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = SURFACE;
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.color = TEXT_MUTED;
              }}
            >
              <Trash2 size={15} strokeWidth={2.25} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg transition"
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          background: BRAND_RED_TINT,
          color: BRAND_RED,
          border: `1px dashed ${BRAND_RED}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#FCE7E7")}
        onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED_TINT)}
      >
        <Plus size={13} strokeWidth={2.5} />
        Add row
      </button>
    </div>
  );
};

/* ─────────────────── validation schema ─────────────────────────────── */
const validationSchema = Yup.object({
  name: Yup.string().required("Company name is required").max(255),
  // Rich text stores HTML, so limits are bumped well above the API limit so
  // the editor's tag overhead never trips a client-side validation false
  // positive. The server has its own validation as the source of truth.
  vision: Yup.string().nullable().max(20000),
  mission: Yup.string().nullable().max(20000),
  intro: Yup.string().nullable().max(40000),
  address: Yup.string().nullable().max(500),
  phone: Yup.string().nullable().max(50),
  email: Yup.string().nullable().email("Invalid email").max(255),
  website: Yup.string().nullable().max(255),
  logo_path: Yup.string().nullable().max(500),
  letterhead_path: Yup.string().nullable().max(500),
  signature_path: Yup.string().nullable().max(500),
  stamp_path: Yup.string().nullable().max(500),
});

/* ─────────────────── helpers: API object ↔ row list ────────────────── */
const objectToRows = (obj) =>
  obj && typeof obj === "object"
    ? Object.entries(obj).map(([key, value]) => ({ key, value: String(value ?? "") }))
    : [];

const rowsToObject = (rows) => {
  const out = {};
  rows.forEach(({ key, value }) => {
    const cleanKey = String(key || "").trim();
    if (cleanKey === "") return;
    out[cleanKey] = String(value ?? "").trim();
  });
  return out;
};

/* ─────────────────── tabs configuration ────────────────────────────── */
const TABS = [
  { id: "general",  label: "General",       icon: Info,        hint: "Name, vision, mission, intro" },
  { id: "contact",  label: "Contact",       icon: Phone,       hint: "Address, default phone, default email, website" },
  { id: "inboxes",  label: "Email Inboxes", icon: Mail,        hint: "Typed contact emails (HR, info, ceo, …)" },
  { id: "phones",   label: "Phone Numbers", icon: Phone,       hint: "Typed phone numbers (main, support, whatsapp, …)" },
  { id: "social",   label: "Social",        icon: LinkIcon,    hint: "Social links (LinkedIn, Facebook, …)" },
  { id: "branding", label: "Branding",      icon: ImageIcon,   hint: "Logo, letterhead, signature, stamp uploads" },
  { id: "extras",   label: "Extras",        icon: Sparkles,    hint: "Free-form key-value bag" },
];

const initialTab = () => {
  if (typeof window === "undefined") return TABS[0].id;
  const hash = window.location.hash.replace("#", "");
  return TABS.find((t) => t.id === hash)?.id ?? TABS[0].id;
};

/* ─────────────────── per-tab content (shared by desktop + mobile) ──── */
const TabContent = ({
  activeTab,
  errors,
  touched,
  contactEmailRows,
  setContactEmailRows,
  contactPhoneRows,
  setContactPhoneRows,
  socialLinkRows,
  setSocialLinkRows,
  extrasRows,
  setExtrasRows,
}) => {
  if (activeTab === "general") {
    return (
      <Card>
        <SectionHeader
          icon={Info}
          title="General"
          subtitle="Used by templates as {company_name}, {company_vision}, {company_mission}, {company_intro}."
        />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name" required>
              Company name
            </Label>
            <TextField name="name" placeholder="Codelab Tech School & IT Solutions" />
            <FieldError name="name" errors={errors} touched={touched} />
          </div>
          <div>
            <Label htmlFor="vision">Vision</Label>
            <RichField name="vision" placeholder="Our north star…" minHeight={120} />
          </div>
          <div>
            <Label htmlFor="mission">Mission</Label>
            <RichField name="mission" placeholder="What we do every day…" minHeight={120} />
          </div>
          <div>
            <Label htmlFor="intro">Intro paragraph</Label>
            <RichField
              name="intro"
              placeholder="Used in welcome emails — 2–3 sentences about the company. Use bold for keywords, bullets for values, etc."
              minHeight={180}
            />
          </div>
        </div>
      </Card>
    );
  }

  if (activeTab === "contact") {
    return (
      <Card>
        <SectionHeader
          icon={Phone}
          title="Primary contact"
          subtitle="The default contact details. {company_email} resolves to the email below."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <TextField name="address" icon={MapPin} placeholder="Street, city, country" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <TextField name="phone" icon={Phone} placeholder="+92 …" />
          </div>
          <div>
            <Label htmlFor="email">Default email</Label>
            <TextField name="email" type="email" icon={Mail} placeholder="hr@codelab.pk" />
            <FieldError name="email" errors={errors} touched={touched} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <TextField name="website" icon={Globe} placeholder="https://codelab.pk" />
          </div>
        </div>
      </Card>
    );
  }

  if (activeTab === "inboxes") {
    return (
      <Card>
        <SectionHeader
          icon={Mail}
          title="Typed contact emails"
          subtitle="Each row becomes a template variable {company_email_<type>}. Add as many as you need — HR, info, ceo, support, billing, etc."
        />
        <KeyValueRows
          rows={contactEmailRows}
          onChange={setContactEmailRows}
          keyPlaceholder="hr, info, ceo, finance, support…"
          valuePlaceholder="hr@codelab.pk"
          valueType="email"
          keyHelper="Keys auto-normalise to lowercase + underscores (BILLING → billing)."
        />
      </Card>
    );
  }

  if (activeTab === "phones") {
    return (
      <Card>
        <SectionHeader
          icon={Phone}
          title="Typed phone numbers"
          subtitle="Each row becomes a template variable {company_phone_<type>}. Add as many as you need — main, hr, support, admissions, whatsapp, ceo_office, etc."
        />
        <KeyValueRows
          rows={contactPhoneRows}
          onChange={setContactPhoneRows}
          keyPlaceholder="main, support, hr, whatsapp, admissions…"
          valuePlaceholder="+92 336-6760604"
          keyHelper="Keys auto-normalise to lowercase + underscores. Free-form values (PTCL landline, mobile, international, WhatsApp links all accepted)."
        />
      </Card>
    );
  }

  if (activeTab === "social") {
    return (
      <Card>
        <SectionHeader
          icon={LinkIcon}
          title="Social links"
          subtitle="Each row becomes {company_social_<key>}. Common keys: linkedin, facebook, instagram, youtube, twitter, whatsapp."
        />
        <KeyValueRows
          rows={socialLinkRows}
          onChange={setSocialLinkRows}
          keyPlaceholder="linkedin, facebook, instagram…"
          valuePlaceholder="https://…"
        />
      </Card>
    );
  }

  if (activeTab === "branding") {
    return (
      <Card>
        <SectionHeader
          icon={ImageIcon}
          title="Branding assets"
          subtitle="Logo, letterhead, signature, and stamp. Auto-resized + compressed on upload. PNG / JPG / SVG / WEBP up to 5 MB."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UploadField
            name="logo_path"
            folder="company/logos"
            purpose="logo"
            label="Logo"
            helperText="Resized to max 400px on the long edge. Used in headers and email signatures."
          />
          <UploadField
            name="letterhead_path"
            folder="company/letterheads"
            purpose="letterhead"
            label="Letterhead"
            helperText="Resized to max 1200px (A4-friendly). Used in clearance + experience letters."
          />
          <UploadField
            name="signature_path"
            folder="company/signatures"
            purpose="signature"
            label="Signature"
            helperText="Resized to max 400px. Appears at the bottom of letters."
          />
          <UploadField
            name="stamp_path"
            folder="company/stamps"
            purpose="stamp"
            label="Company stamp"
            helperText="Resized to max 400px. Stamped on affidavits, clearance certificates, etc."
          />
        </div>
        <div
          className="mt-4 rounded-lg px-3 py-2 flex items-start gap-2"
          style={{
            background: SURFACE_ALT,
            border: `1px dashed ${BORDER}`,
            fontSize: 11.5,
            color: TEXT_MUTED,
            lineHeight: 1.5,
          }}
        >
          <Info size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          <span>
            These are the fallback assets. Each brand under <strong>HR → Company Brands</strong>{" "}
            can override these for its own emails and letters via{" "}
            <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{brand_logo}`}</code>,{" "}
            <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{brand_letterhead}`}</code>,{" "}
            <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{brand_signature}`}</code>,{" "}
            <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{brand_stamp}`}</code>.
          </span>
        </div>
      </Card>
    );
  }

  if (activeTab === "extras") {
    return (
      <Card>
        <SectionHeader
          icon={Sparkles}
          title="Extras (free-form)"
          subtitle="Anything else you want available as a template variable {company_<key>}. Example: city, country, founded_year, team_size."
        />
        <KeyValueRows
          rows={extrasRows}
          onChange={setExtrasRows}
          keyPlaceholder="city, country, team_size…"
          valuePlaceholder="any value"
        />
      </Card>
    );
  }

  return null;
};

/* ─────────────────── main page component ───────────────────────────── */
const CompanySettingsPage = () => {
  const user = useSelector(selectCurrentUser);
  const canView = hasPermission(user, "get company-settings");
  const canEdit = hasPermission(user, "update company-settings");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: "employee/company-settings" },
    { skip: !canView },
  );

  const [savePatch, { isLoading: isSaving }] = usePatchMutation();

  // Local row state for the dynamic editors (kept outside Formik for ergonomics)
  const [contactEmailRows, setContactEmailRows] = useState([]);
  const [contactPhoneRows, setContactPhoneRows] = useState([]);
  const [socialLinkRows, setSocialLinkRows] = useState([]);
  const [extrasRows, setExtrasRows] = useState([]);

  // Active tab — persisted in URL hash so back/forward + share-links work
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    const handler = () => setActiveTab(initialTab());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const changeTab = (id) => {
    setActiveTab(id);
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Hydrate row editors when data arrives
  useEffect(() => {
    if (data?.data) {
      setContactEmailRows(objectToRows(data.data.contact_emails));
      setContactPhoneRows(objectToRows(data.data.contact_phones));
      setSocialLinkRows(objectToRows(data.data.social_links));
      setExtrasRows(objectToRows(data.data.extras));
    }
  }, [data]);

  const initialValues = useMemo(
    () => ({
      name: data?.data?.name ?? "",
      vision: data?.data?.vision ?? "",
      mission: data?.data?.mission ?? "",
      intro: data?.data?.intro ?? "",
      address: data?.data?.address ?? "",
      phone: data?.data?.phone ?? "",
      email: data?.data?.email ?? "",
      website: data?.data?.website ?? "",
      logo_path: data?.data?.logo_path ?? "",
      letterhead_path: data?.data?.letterhead_path ?? "",
      signature_path: data?.data?.signature_path ?? "",
      stamp_path: data?.data?.stamp_path ?? "",
    }),
    [data],
  );

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        contact_emails: rowsToObject(contactEmailRows),
        contact_phones: rowsToObject(contactPhoneRows),
        social_links: rowsToObject(socialLinkRows),
        extras: rowsToObject(extrasRows),
      };
      const res = await savePatch({
        path: "employee/company-settings",
        body: payload,
      }).unwrap();
      showToast(res?.message || "Company settings updated.", "success");
      refetch();
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors && Object.values(err.data.errors).flat().join("\n")) ||
        "Failed to update company settings.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <Card>
          <div className="flex items-center gap-3" style={{ color: TEXT_SECONDARY }}>
            <ShieldCheck size={18} />
            <span>You don&apos;t have permission to view company settings.</span>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading company settings…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10">
        <Card>
          <div style={{ color: BRAND_RED }}>
            Could not load company settings.{" "}
            <button
              onClick={refetch}
              className="underline"
              style={{ color: BRAND_RED, fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
          <p className="mt-2 text-[12px]" style={{ color: TEXT_MUTED }}>
            Verify you&apos;re signed in and have the &apos;get company-settings&apos; permission.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px 28px 100px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: BRAND_RED_TINT,
              color: BRAND_RED,
            }}
          >
            <Building2 size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              Company Settings
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Umbrella identity for{" "}
              <strong style={{ color: TEXT_PRIMARY }}>
                {data?.data?.name || "your organization"}
              </strong>
              .
            </p>
          </div>
        </div>
      </div>

      {/* ── Umbrella vs Brand explainer banner ───────────────────── */}
      <div
        className="mb-5 rounded-xl flex items-start gap-3 px-4 py-3"
        style={{
          background: "#F0F9FF",
          border: "1px solid #BAE6FD",
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 mt-0.5"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#0EA5E9",
            color: "#fff",
          }}
        >
          <Layers size={14} strokeWidth={2.25} />
        </div>
        <div style={{ fontSize: 12.5, color: "#0C4A6E", lineHeight: 1.5 }}>
          <strong>This page is for your parent organisation.</strong>{" "}
          Same kinds of fields (vision, mission, contact emails, logo, social…) ALSO exist
          for each brand under <em>HR → Company Brands</em>. When an email sends for a
          specific brand, the brand values are used; this page is the fallback and the
          source of cross-brand info (HR/CEO/COO inboxes that apply to every brand).
        </div>
      </div>

      {/* ── Full-width tab bar (equal share, fills the page) ────── */}
      <div
        className="mb-6 w-full flex items-stretch rounded-xl overflow-hidden"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        }}
        role="tablist"
      >
        {TABS.map((t, idx) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => changeTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2.5 transition relative"
              style={{
                padding: "16px 12px",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? BRAND_RED : TEXT_SECONDARY,
                background: isActive ? BRAND_RED_TINT : "transparent",
                border: "none",
                borderLeft:
                  idx === 0 ? "none" : `1px solid ${BORDER}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = SURFACE_ALT;
                  e.currentTarget.style.color = TEXT_PRIMARY;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = TEXT_SECONDARY;
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {t.label}
              {/* Active indicator strip at bottom */}
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    background: BRAND_RED,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, dirty }) => (
          <Form>
            {/* ── Active tab content (single render, full width) ── */}
            <TabContent
              activeTab={activeTab}
              errors={errors}
              touched={touched}
              contactEmailRows={contactEmailRows}
              setContactEmailRows={setContactEmailRows}
              contactPhoneRows={contactPhoneRows}
              setContactPhoneRows={setContactPhoneRows}
              socialLinkRows={socialLinkRows}
              setSocialLinkRows={setSocialLinkRows}
              extrasRows={extrasRows}
              setExtrasRows={setExtrasRows}
            />
            {/* ── Sticky action bar (single save covers all tabs) ── */}
            <div
              className="flex items-center justify-end gap-3 sticky bottom-0 mt-6 -mx-7 px-7 py-4"
              style={{
                background: "rgba(248,250,252,0.92)",
                backdropFilter: "blur(6px)",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <div className="mr-auto text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {dirty
                  ? "You have unsaved changes."
                  : "All changes saved."}
              </div>
              {!canEdit && (
                <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
                  Read-only mode.
                </span>
              )}
              <button
                type="submit"
                disabled={!canEdit || isSubmitting || isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
                style={{
                  background: !canEdit ? "#CBD5E1" : BRAND_RED,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: !canEdit ? "not-allowed" : "pointer",
                  opacity: isSubmitting || isSaving ? 0.7 : 1,
                  boxShadow: "0 4px 10px rgba(201,6,6,0.12)",
                }}
                onMouseEnter={(e) => {
                  if (canEdit) e.currentTarget.style.background = BRAND_RED_DARK;
                }}
                onMouseLeave={(e) => {
                  if (canEdit) e.currentTarget.style.background = BRAND_RED;
                }}
                title={!canEdit ? "You don't have permission to update company settings." : ""}
              >
                {isSubmitting || isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} strokeWidth={2.25} />
                    Save all changes
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CompanySettingsPage;
