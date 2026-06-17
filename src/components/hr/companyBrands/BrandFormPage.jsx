import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import {
  Layers,
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
  Sparkles,
  ArrowLeft,
  Settings as SettingsIcon,
  Clock,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import RichTextEditor from "../common/RichTextEditor";
import FileUploadField from "../common/FileUploadField";
import { HR_COMPANY_BRANDS } from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ──────────────────────────────── */
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

/* ─────────────────────── UI primitives (mirror Company Settings) ───── */
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div
      className="flex items-center justify-center"
      style={{ width: 38, height: 38, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
    <div>
      <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
      {subtitle && (
        <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>{subtitle}</p>
      )}
    </div>
  </div>
);

const Label = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
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

const TextField = ({ name, type = "text", placeholder, icon: Icon, disabled, monospace }) => (
  <div style={{ position: "relative" }}>
    {Icon && (
      <Icon
        size={15}
        strokeWidth={2}
        style={{
          position: "absolute", left: 11, top: "50%",
          transform: "translateY(-50%)", color: TEXT_MUTED, pointerEvents: "none",
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
        fontFamily: monospace ? "JetBrains Mono, ui-monospace, monospace" : "inherit",
      }}
      onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
      onBlur={(e) => (e.target.style.borderColor = BORDER)}
    />
  </div>
);

const FieldError = ({ name, errors, touched }) =>
  errors[name] && touched[name] ? (
    <p className="text-[11.5px] mt-1" style={{ color: BRAND_RED }}>{errors[name]}</p>
  ) : null;

const Card = ({ children }) => (
  <div className="rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: 22 }}>
    {children}
  </div>
);

/* ─────────────────── Formik-bound rich text field ──────────────────── */
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

/* ─────────────────── Formik-bound file upload field ────────────────── */
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

/* ─────────────────── dynamic key→value rows editor ────────────────── */
const KeyValueRows = ({ keyPlaceholder, valuePlaceholder, rows, onChange, valueType = "text", keyHelper }) => {
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
            style={{ background: SURFACE_ALT, border: `1px dashed ${BORDER}`, color: TEXT_MUTED, fontSize: 12.5 }}
          >
            No entries yet. Click <strong>Add row</strong> below to create one.
          </div>
        )}
        {rows.map((row, i) => (
          <div key={i} className="grid items-start gap-2" style={{ gridTemplateColumns: "1fr 1.4fr auto" }}>
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
                <div className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED, lineHeight: 1.3 }}>
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
              className="flex items-center justify-center"
              style={{
                width: 38, height: 38, borderRadius: 8,
                border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED,
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
        className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg"
        style={{
          fontSize: 12.5, fontWeight: 600,
          background: BRAND_RED_TINT, color: BRAND_RED, border: `1px dashed ${BRAND_RED}`,
        }}
      >
        <Plus size={13} strokeWidth={2.5} />
        Add row
      </button>
    </div>
  );
};

/* ─────────────────── helpers ───────────────────────────────────────── */
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

/* ─────────────────── tabs ─────────────────────────────────────────── */
const TABS = [
  { id: "brand",    label: "Brand Settings", icon: SettingsIcon, hint: "Slug, tagline, default, active, sort order" },
  { id: "general",  label: "General",        icon: Info,         hint: "Name, vision, mission, intro" },
  { id: "contact",  label: "Contact",        icon: Phone,        hint: "Address, phone, default email, website, hours" },
  { id: "inboxes",  label: "Email Inboxes",  icon: Mail,         hint: "Typed contact emails (HR, admissions, support, …)" },
  { id: "phones",   label: "Phone Numbers",  icon: Phone,        hint: "Typed phone numbers (main, support, whatsapp, …)" },
  { id: "social",   label: "Social",         icon: LinkIcon,     hint: "Social links (LinkedIn, Facebook, …)" },
  { id: "branding", label: "Branding",       icon: ImageIcon,    hint: "Logo, letterhead, signature, stamp uploads" },
  { id: "extras",   label: "Extras",         icon: Sparkles,     hint: "Free-form key-value bag" },
];

const initialTab = () => {
  if (typeof window === "undefined") return TABS[0].id;
  const hash = window.location.hash.replace("#", "");
  return TABS.find((t) => t.id === hash)?.id ?? TABS[0].id;
};

/* ─────────────────── tab content ──────────────────────────────────── */
const TabContent = ({
  activeTab, errors, touched,
  contactEmailRows, setContactEmailRows,
  contactPhoneRows, setContactPhoneRows,
  socialLinkRows, setSocialLinkRows,
  extrasRows, setExtrasRows,
  isNew,
}) => {
  if (activeTab === "brand") {
    return (
      <Card>
        <SectionHeader
          icon={SettingsIcon}
          title="Brand settings"
          subtitle="Identifier, default flag, and ordering. Slug becomes the dispatch key in code."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="slug" required>Slug</Label>
            <TextField
              name="slug"
              placeholder="codelab-agency"
              monospace
              disabled={!isNew}
            />
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED, lineHeight: 1.4 }}>
              Immutable identifier used by code (e.g. <code style={{ fontFamily: "JetBrains Mono, monospace" }}>brand_key</code> in template dispatch).
              {!isNew && <> Cannot be changed after creation.</>}
            </p>
            <FieldError name="slug" errors={errors} touched={touched} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <TextField name="tagline" placeholder="Build The Digital Future With Us." />
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
              One-line catchphrase used in welcome emails as <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{brand_tagline}`}</code>.
            </p>
          </div>
          <div>
            <Label htmlFor="is_active">Active</Label>
            <div className="flex items-center gap-3 mt-2">
              <Field
                type="checkbox"
                id="is_active"
                name="is_active"
                style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }}
              />
              <label htmlFor="is_active" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>
                Brand is active
              </label>
            </div>
          </div>
          <div>
            <Label htmlFor="is_default">Default brand</Label>
            <div className="flex items-center gap-3 mt-2">
              <Field
                type="checkbox"
                id="is_default"
                name="is_default"
                style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }}
              />
              <label htmlFor="is_default" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>
                Use this brand as the system default
              </label>
            </div>
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
              Exactly one brand can be default; turning this on flips it off on others.
            </p>
          </div>
          <div>
            <Label htmlFor="sort_order">Sort order</Label>
            <TextField name="sort_order" type="number" placeholder="1" />
            <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
              Lower numbers appear first in lists.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="description">Internal description</Label>
          <RichField name="description" placeholder="A short note for HR about this brand…" minHeight={100} />
        </div>
      </Card>
    );
  }

  if (activeTab === "general") {
    return (
      <Card>
        <SectionHeader
          icon={Info}
          title="General"
          subtitle="Used by templates as {brand_name}, {brand_vision}, {brand_mission}, {brand_intro}."
        />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name" required>Brand name</Label>
            <TextField name="name" placeholder="Codelab IT Solutions" />
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
            <RichField name="intro" placeholder="2–3 sentences about this brand for welcome emails." minHeight={180} />
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
          subtitle="Default contact details for this brand. {brand_email} = the email below."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <TextField name="address" icon={MapPin} placeholder="Street, city, country" />
          </div>
          <div>
            <Label htmlFor="phone">Default phone</Label>
            <TextField name="phone" icon={Phone} placeholder="+92 …" />
          </div>
          <div>
            <Label htmlFor="email">Default email</Label>
            <TextField name="email" type="email" icon={Mail} placeholder="brand@codelab.pk" />
            <FieldError name="email" errors={errors} touched={touched} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <TextField name="website" icon={Globe} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="working_hours">Working hours</Label>
            <TextField name="working_hours" icon={Clock} placeholder="Mon – Sat, 9:30 AM – 5:30 PM" />
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
          subtitle="Each row becomes {brand_email_<type>} in templates. Add as many as you need."
        />
        <KeyValueRows
          rows={contactEmailRows}
          onChange={setContactEmailRows}
          keyPlaceholder="hr, admissions, support, sales…"
          valuePlaceholder="contact@codelab.pk"
          valueType="email"
          keyHelper="Keys auto-normalise to lowercase + underscores."
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
          subtitle="Each row becomes {brand_phone_<type>} in templates. Free-form values (PTCL, mobile, international, WhatsApp links)."
        />
        <KeyValueRows
          rows={contactPhoneRows}
          onChange={setContactPhoneRows}
          keyPlaceholder="main, support, admissions, whatsapp…"
          valuePlaceholder="+92 336-6760604"
          keyHelper="Keys auto-normalise to lowercase + underscores."
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
          subtitle="Each row becomes {brand_social_<key>}. Common keys: linkedin, facebook, instagram, youtube, twitter, whatsapp."
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
    // Build a brand-specific folder so uploads don't collide between brands.
    const slug = (typeof window !== "undefined")
      ? (window.location.pathname.split("/").pop() || "brand")
      : "brand";
    return (
      <Card>
        <SectionHeader
          icon={ImageIcon}
          title="Branding assets"
          subtitle="Logo, letterhead, signature, and stamp for THIS brand. Auto-resized + compressed. PNG / JPG / SVG / WEBP up to 5 MB."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UploadField
            name="logo_path"
            folder={`brands/${slug}/logos`}
            purpose="logo"
            label="Logo"
            helperText="Resized to max 400px on the long edge. Used in headers and email signatures for this brand."
          />
          <UploadField
            name="letterhead_path"
            folder={`brands/${slug}/letterheads`}
            purpose="letterhead"
            label="Letterhead"
            helperText="Resized to max 1200px. Used in this brand's clearance + experience letters."
          />
          <UploadField
            name="signature_path"
            folder={`brands/${slug}/signatures`}
            purpose="signature"
            label="Signature"
            helperText="Resized to max 400px. Appears at the bottom of this brand's letters."
          />
          <UploadField
            name="stamp_path"
            folder={`brands/${slug}/stamps`}
            purpose="stamp"
            label="Brand stamp"
            helperText="Resized to max 400px. Stamped on this brand's affidavits / certificates."
          />
        </div>
        <div
          className="mt-4 rounded-lg px-3 py-2 flex items-start gap-2"
          style={{ background: SURFACE_ALT, border: `1px dashed ${BORDER}`, fontSize: 11.5, color: TEXT_MUTED, lineHeight: 1.5 }}
        >
          <Info size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          <span>
            These override the umbrella Company Settings when emails dispatch for this brand.
            Template variables:{" "}
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
          subtitle="Anything else you want available as {brand_<key>}. E.g. founded_year, team_size, location_code."
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

/* ─────────────────── validation ───────────────────────────────────── */
const baseSchema = {
  name: Yup.string().required("Brand name is required").max(200),
  description: Yup.string().nullable().max(20000),
  tagline: Yup.string().nullable().max(500),
  vision: Yup.string().nullable().max(20000),
  mission: Yup.string().nullable().max(20000),
  intro: Yup.string().nullable().max(40000),
  address: Yup.string().nullable().max(500),
  phone: Yup.string().nullable().max(50),
  email: Yup.string().nullable().email("Invalid email").max(255),
  website: Yup.string().nullable().max(255),
  working_hours: Yup.string().nullable().max(200),
  logo_path: Yup.string().nullable().max(500),
  letterhead_path: Yup.string().nullable().max(500),
  signature_path: Yup.string().nullable().max(500),
  stamp_path: Yup.string().nullable().max(500),
  is_active: Yup.boolean(),
  is_default: Yup.boolean(),
  sort_order: Yup.number().integer().min(0).max(10000).nullable(),
};

const createSchema = Yup.object({
  ...baseSchema,
  slug: Yup.string()
    .required("Slug is required")
    .matches(/^[a-z0-9-_]+$/, "Slug may only contain lowercase letters, numbers, hyphens, underscores")
    .max(100),
});

const editSchema = Yup.object(baseSchema);

/* ─────────────────── main page ────────────────────────────────────── */
const BrandFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get company-brands");
  const canCreate = hasPermission(user, "create company-brands");
  const canEdit = hasPermission(user, "update company-brands");
  const canSubmit = isNew ? canCreate : canEdit;

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/company-brands/${uuid}` },
    { skip: !canView || isNew },
  );

  const [createBrand, { isLoading: isCreating }] = usePostMutation();
  const [updateBrand, { isLoading: isUpdating }] = usePatchMutation();

  const [contactEmailRows, setContactEmailRows] = useState([]);
  const [contactPhoneRows, setContactPhoneRows] = useState([]);
  const [socialLinkRows, setSocialLinkRows] = useState([]);
  const [extrasRows, setExtrasRows] = useState([]);

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
      slug: data?.data?.slug ?? "",
      name: data?.data?.name ?? "",
      description: data?.data?.description ?? "",
      tagline: data?.data?.tagline ?? "",
      vision: data?.data?.vision ?? "",
      mission: data?.data?.mission ?? "",
      intro: data?.data?.intro ?? "",
      address: data?.data?.address ?? "",
      phone: data?.data?.phone ?? "",
      email: data?.data?.email ?? "",
      website: data?.data?.website ?? "",
      working_hours: data?.data?.working_hours ?? "",
      logo_path: data?.data?.logo_path ?? "",
      letterhead_path: data?.data?.letterhead_path ?? "",
      signature_path: data?.data?.signature_path ?? "",
      stamp_path: data?.data?.stamp_path ?? "",
      is_active: data?.data?.is_active ?? true,
      is_default: data?.data?.is_default ?? false,
      sort_order: data?.data?.sort_order ?? 0,
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

      if (isNew) {
        const res = await createBrand({
          path: "employee/company-brands",
          body: payload,
        }).unwrap();
        showToast(res?.message || "Brand created.", "success");
        navigate(HR_COMPANY_BRANDS);
      } else {
        // PATCH — slug is immutable; service ignores it but we strip it client-side too
        const patchPayload = { ...payload };
        delete patchPayload.slug;
        const res = await updateBrand({
          path: `employee/company-brands/${uuid}`,
          body: patchPayload,
        }).unwrap();
        showToast(res?.message || "Brand updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors && Object.values(err.data.errors).flat().join("\n")) ||
        "Failed to save brand.";
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
            <span>You don&apos;t have permission to view brands.</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading brand…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="p-10">
        <Card>
          <div style={{ color: BRAND_RED }}>
            Could not load brand.{" "}
            <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>
              Retry
            </button>
          </div>
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
      {/* Page header */}
      <div className="mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(HR_COMPANY_BRANDS)}
            className="flex items-center justify-center"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`,
            }}
            aria-label="Back to brands"
            title="Back to brands"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: BRAND_RED_TINT, color: BRAND_RED,
            }}
          >
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "Add Brand" : data?.data?.name || "Edit Brand"}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {isNew
                ? "Create a new brand identity."
                : <>Editing <strong style={{ color: TEXT_PRIMARY }}>{data?.data?.slug}</strong>. Slug is immutable.</>}
            </p>
          </div>
        </div>
      </div>

      {/* Tab strip — full width, equal share (matches Settings) */}
      <div
        className="mb-6 w-full flex items-stretch rounded-xl overflow-hidden"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
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
              className="flex-1 flex items-center justify-center gap-2.5 relative"
              style={{
                padding: "16px 10px",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? BRAND_RED : TEXT_SECONDARY,
                background: isActive ? BRAND_RED_TINT : "transparent",
                border: "none",
                borderLeft: idx === 0 ? "none" : `1px solid ${BORDER}`,
                cursor: "pointer", whiteSpace: "nowrap", outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) { e.currentTarget.style.background = SURFACE_ALT; e.currentTarget.style.color = TEXT_PRIMARY; }
              }}
              onMouseLeave={(e) => {
                if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {t.label}
              {isActive && (
                <span
                  aria-hidden
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: BRAND_RED }}
                />
              )}
            </button>
          );
        })}
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={isNew ? createSchema : editSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, dirty }) => (
          <Form>
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
              isNew={isNew}
            />

            <div
              className="flex items-center justify-end gap-3 sticky bottom-0 mt-6 -mx-7 px-7 py-4"
              style={{
                background: "rgba(248,250,252,0.92)",
                backdropFilter: "blur(6px)",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <div className="mr-auto text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {dirty ? "You have unsaved changes." : isNew ? "Fill in the fields and click Create." : "All changes saved."}
              </div>
              {!canSubmit && (
                <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>
                  Read-only mode.
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate(HR_COMPANY_BRANDS)}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || isCreating || isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
                style={{
                  background: !canSubmit ? "#CBD5E1" : BRAND_RED,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: !canSubmit ? "not-allowed" : "pointer",
                  opacity: isSubmitting || isCreating || isUpdating ? 0.7 : 1,
                  boxShadow: "0 4px 10px rgba(201,6,6,0.12)",
                }}
                onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED_DARK; }}
                onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED; }}
              >
                {isSubmitting || isCreating || isUpdating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {isNew ? "Creating…" : "Saving…"}
                  </>
                ) : (
                  <>
                    <Save size={15} strokeWidth={2.25} />
                    {isNew ? "Create brand" : "Save all changes"}
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

export default BrandFormPage;
