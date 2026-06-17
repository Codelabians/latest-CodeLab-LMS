import { useEffect, useMemo, useState, useRef, forwardRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import {
  Mail,
  Save,
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  Sparkles,
  Lock,
  RefreshCw,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import RichTextEditor from "../common/RichTextEditor";
import VariablePickerModal from "../common/VariablePickerModal";
import { HR_EMAIL_TEMPLATES } from "../../routes/RouteConstants";

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

/* ─────────────────────── primitives ────────────────────────────────── */
const Label = ({ children, required }) => (
  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
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

const TextField = ({ name, type = "text", placeholder, disabled, monospace }) => (
  <Field
    name={name}
    type={type}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      ...inputStyle,
      opacity: disabled ? 0.6 : 1,
      background: disabled ? SURFACE_ALT : SURFACE,
      fontFamily: monospace ? "JetBrains Mono, ui-monospace, monospace" : "inherit",
    }}
    onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
    onBlur={(e) => (e.target.style.borderColor = BORDER)}
  />
);

const FieldError = ({ name, errors, touched }) =>
  errors[name] && touched[name] ? (
    <p className="text-[11.5px] mt-1" style={{ color: BRAND_RED }}>{errors[name]}</p>
  ) : null;

const Section = ({ title, subtitle, children }) => (
  <div className="rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: 18 }}>
    <div className="mb-3">
      <h3 className="text-[13.5px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
      {subtitle && <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ───────── Formik-bound rich text field ───────── */
const RichField = forwardRef(function RichField(
  { name, placeholder, minHeight, onRequestInsertVariable },
  ref,
) {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  return (
    <RichTextEditor
      ref={ref}
      value={values[name] ?? ""}
      onChange={(html) => {
        setFieldValue(name, html, true);
        setFieldTouched(name, true, false);
      }}
      placeholder={placeholder}
      minHeight={minHeight}
      onRequestInsertVariable={onRequestInsertVariable}
    />
  );
});

/* ───────── undocumented-vars warning under the body ───────── */
const UndocumentedVarsWarning = ({ knownNames, customNames }) => {
  const { values } = useFormikContext();
  const body = values.body_html || "";
  const subject = values.subject || "";

  const findings = useMemo(() => {
    const re = /\{([a-zA-Z0-9_]+)\}/g;
    const found = new Set();
    let m;
    while ((m = re.exec(body)) !== null) found.add(m[1]);
    while ((m = re.exec(subject)) !== null) found.add(m[1]);
    const undocumented = [];
    found.forEach((name) => {
      if (knownNames.has(name)) return;
      if (customNames.has(name)) return;
      undocumented.push(name);
    });
    undocumented.sort();
    return undocumented;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, subject, knownNames, customNames]);

  if (findings.length === 0) return null;

  return (
    <div
      className="mt-2 rounded-lg px-3 py-2 flex items-start gap-2"
      style={{
        background: "#FFFBEB",
        border: "1px solid #FCD34D",
        fontSize: 12,
        color: "#92400E",
        lineHeight: 1.5,
      }}
    >
      <span style={{ marginTop: 1 }}>⚠</span>
      <div className="flex-1">
        <strong>Undocumented variable{findings.length > 1 ? "s" : ""}:</strong>{" "}
        {findings.map((n, i) => (
          <span key={n}>
            <code
              style={{
                background: "#FEF3C7",
                color: "#78350F",
                padding: "0 5px",
                borderRadius: 3,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 11,
              }}
            >{`{${n}}`}</code>
            {i < findings.length - 1 ? " · " : ""}
          </span>
        ))}
        <div className="mt-1 text-[11px]" style={{ color: "#92400E", opacity: 0.85 }}>
          Add them to the <em>Variables</em> catalog below, pick from <em>Insert variable</em>, or remove the references from the body / subject.
          Missing values render as empty strings at send time.
        </div>
      </div>
    </div>
  );
};

/* ───────── variables editor (catalog) ───────── */
const VariablesEditor = ({ variables, onChange, variableSources, onOpenPicker }) => {
  const setAt = (i, k, v) => onChange(variables.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const remove = (i) => onChange(variables.filter((_, idx) => idx !== i));
  const addCustom = () => onChange([...variables, { name: "", description: "", sample: "" }]);

  // Build a quick lookup so we can show entity_label per row
  const entityLabels = useMemo(() => {
    const m = new Map();
    (variableSources || []).forEach((src) => m.set(src.entity_key, src.label));
    return m;
  }, [variableSources]);

  return (
    <div>
      <div className="space-y-2">
        {variables.length === 0 && (
          <div className="text-center py-5 rounded-lg" style={{ background: SURFACE_ALT, border: `1px dashed ${BORDER}`, color: TEXT_MUTED, fontSize: 12 }}>
            No variables defined yet. Click <strong>Add from registry</strong> to bind to an entity field, or <strong>Add custom variable</strong> for free-form values.
          </div>
        )}
        {variables.map((v, i) => {
          const isBound = !!(v.source_entity && v.field_path);
          const entityLabel = isBound ? (entityLabels.get(v.source_entity) || v.source_entity) : null;
          return (
            <div
              key={i}
              className="rounded-lg p-2.5"
              style={{
                background: isBound ? "#F0F9FF" : SURFACE,
                border: `1px solid ${isBound ? "#BAE6FD" : BORDER}`,
              }}
            >
              {/* Top row: name + binding badge */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <code
                  style={{
                    background: SURFACE_ALT,
                    color: BRAND_RED,
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 12,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  {`{${v.name || "…"}}`}
                </code>
                {isBound ? (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold tracking-[0.4px]"
                    style={{ background: "#0EA5E9", color: "#fff" }}
                  >
                    📦 {entityLabel} · {v.field_path}
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold tracking-[0.4px]"
                    style={{ background: SURFACE_ALT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
                  >
                    CUSTOM
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="button" onClick={() => remove(i)}
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.borderColor = BRAND_RED; e.currentTarget.style.color = BRAND_RED; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_MUTED; }}
                  title="Remove"
                >
                  <Trash2 size={11} strokeWidth={2.25} />
                </button>
              </div>

              {/* Editable fields (name is read-only for entity-bound rows so the binding stays consistent) */}
              <div className="grid items-start gap-2" style={{ gridTemplateColumns: "1fr 1.2fr 1fr" }}>
                <input
                  type="text"
                  placeholder="variable_name"
                  value={v.name || ""}
                  onChange={(e) => setAt(i, "name", e.target.value)}
                  disabled={isBound}
                  style={{
                    ...inputStyle,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    fontSize: 12.5,
                    opacity: isBound ? 0.7 : 1,
                    background: isBound ? SURFACE_ALT : SURFACE,
                  }}
                  title={isBound ? "Read-only — derived from the entity field" : ""}
                />
                <input
                  type="text"
                  placeholder="Description (HR-facing note)"
                  value={v.description || ""}
                  onChange={(e) => setAt(i, "description", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Sample value (used in preview)"
                  value={v.sample || ""}
                  onChange={(e) => setAt(i, "sample", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button" onClick={onOpenPicker}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ fontSize: 12.5, fontWeight: 600, background: BRAND_RED_TINT, color: BRAND_RED, border: `1px dashed ${BRAND_RED}` }}
          title="Pick a variable from a registered entity (Company, Brand, User…)"
        >
          <Sparkles size={13} strokeWidth={2.25} />
          Add from registry
        </button>
        <button
          type="button" onClick={addCustom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ fontSize: 12.5, fontWeight: 600, background: SURFACE, color: TEXT_SECONDARY, border: `1px dashed ${BORDER}` }}
          title="Add a free-form variable that's not bound to a registered entity"
        >
          <Plus size={13} strokeWidth={2.5} />
          Add custom variable
        </button>
      </div>

      <p className="text-[10.5px] mt-2" style={{ color: TEXT_MUTED, lineHeight: 1.5 }}>
        <strong style={{ color: TEXT_SECONDARY }}>Entity-bound</strong> (blue): the dispatcher reads the field off the live entity at send time —
        e.g. <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{employee_name}`}</code> from Employee.full_name.
        Picking from the registry is the safest way to add new variables.
        <br />
        <strong style={{ color: TEXT_SECONDARY }}>Custom</strong> (gray): free-form variables that code must supply by name at send time, OR
        used for preview-only placeholders. Sample value feeds the live preview on the right.
      </p>
    </div>
  );
};

/* ─────────────────────── validation ──────────────────────────────── */
const baseSchema = {
  name: Yup.string().required("Name is required").max(200),
  description: Yup.string().nullable().max(1000),
  subject: Yup.string().required("Subject is required").max(500),
  body_html: Yup.string().required("Body is required").max(200000),
  is_active: Yup.boolean(),
};
const createSchema = Yup.object({
  ...baseSchema,
  key: Yup.string()
    .required("Key is required")
    .matches(/^[a-z0-9_]+$/i, "Lowercase letters, numbers, underscores only")
    .max(100),
});
const editSchema = Yup.object(baseSchema);

/* ─────────────────────── main page ───────────────────────────────── */
const EmailTemplateFormPage = ({ group = null, listRoute = HR_EMAIL_TEMPLATES } = {}) => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get email-templates");
  const canCreate = hasPermission(user, "create email-templates");
  const canEdit = hasPermission(user, "update email-templates");
  const canTestSend = hasPermission(user, "send test-email");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/email-templates/${uuid}` },
    { skip: !canView || isNew },
  );
  const { data: brandsData } = useGetQuery(
    { path: "employee/company-brands" },
    { skip: !canView },
  );
  const { data: varSourcesData } = useGetQuery(
    { path: "employee/email-templates/variable-sources" },
    { skip: !canView },
  );

  const [create, { isLoading: isCreating }] = usePostMutation();
  const [update, { isLoading: isUpdating }] = usePatchMutation();
  const [renderPreview, { isLoading: isRendering }] = usePostMutation();
  const [sendTest, { isLoading: isSendingTest }] = usePostMutation();

  const brands = useMemo(() => brandsData?.data || [], [brandsData]);
  const variableSources = useMemo(() => varSourcesData?.data || [], [varSourcesData]);

  // Build a fast lookup of every known variable name (entity-bound + already in catalog)
  // so the undocumented-vars scanner can recognise legitimate references.
  const knownVariableNames = useMemo(() => {
    const set = new Set();
    variableSources.forEach((src) => (src.fields || []).forEach((f) => set.add(f.name)));
    return set;
  }, [variableSources]);

  // Picker modal — has two modes: 'body' (drop {var} into the editor)
  // and 'catalog' (add a row to the variables catalog with the binding).
  const [pickerMode, setPickerMode] = useState(null); // null | 'body' | 'catalog'
  const pickerOpen = pickerMode !== null;
  const bodyEditorRef = useRef(null);

  const handlePickerSelection = (varName, fullRow) => {
    if (pickerMode === "body") {
      bodyEditorRef.current?.insertText(`{${varName}}`);
      return;
    }
    if (pickerMode === "catalog") {
      // Skip if already in catalog
      if (variables.some((v) => v.name === varName)) {
        showToast(`Variable {${varName}} is already in the catalog.`, "error");
        return;
      }
      setVariables([
        ...variables,
        {
          name: varName,
          description: fullRow?.label || "",
          sample: fullRow?.sample || "",
          source_entity: fullRow?.entity_key || null,
          field_path: fullRow?.field_path || null,
        },
      ]);
    }
  };
  const isSystem = data?.data?.is_system === true;
  const canSubmit = isNew ? canCreate : canEdit;

  const [variables, setVariables] = useState([]);
  const [previewBrand, setPreviewBrand] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [testTo, setTestTo] = useState("");
  const previewDebounce = useRef(null);

  useEffect(() => {
    if (data?.data) setVariables(data.data.variables || []);
  }, [data]);

  useEffect(() => {
    if (brands.length > 0 && !previewBrand) {
      const def = brands.find((b) => b.is_default) || brands[0];
      setPreviewBrand(def.slug);
    }
  }, [brands, previewBrand]);

  const initialValues = useMemo(
    () => ({
      key: data?.data?.key ?? "",
      name: data?.data?.name ?? "",
      description: data?.data?.description ?? "",
      subject: data?.data?.subject ?? "",
      body_html: data?.data?.body_html ?? "",
      is_active: data?.data?.is_active ?? true,
      brand_id: data?.data?.brand_id ?? "",
    }),
    [data],
  );

  // Live preview — debounced re-render whenever the body / subject changes
  const FormPreviewSync = () => {
    const { values } = useFormikContext();
    useEffect(() => {
      if (isNew || !data?.data?.uuid) return; // need an existing uuid to preview against
      if (previewDebounce.current) clearTimeout(previewDebounce.current);
      previewDebounce.current = setTimeout(async () => {
        try {
          // First: persist a tentative state? No — instead use the preview
          // endpoint against the saved version + per-call overrides built
          // from the variable catalog so HR sees up-to-date sample renders.
          const vars = {};
          variables.forEach((v) => { if (v.name) vars[v.name] = v.sample || ""; });
          const res = await renderPreview({
            path: `employee/email-templates/${data.data.uuid}/preview`,
            body: { variables: vars, brand_key: previewBrand || undefined },
          }).unwrap();
          setPreviewSubject(res?.data?.subject || "");
          setPreviewHtml(res?.data?.body_html || "");
        } catch (_) {
          // Preview failures are silent — they don't block editing
        }
      }, 300);
      // We intentionally depend on subject + body_html + variables + brand
      // even though we send to the server (the server uses the SAVED row).
      // After Save, the next debounced fetch will reflect the new values.
      // Until then, the preview tells HR what would render if they saved now.
      return () => previewDebounce.current && clearTimeout(previewDebounce.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.subject, values.body_html, JSON.stringify(variables), previewBrand]);
    return null;
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        variables: variables.filter((v) => (v.name || "").trim() !== ""),
        brand_id: values.brand_id === "" ? null : Number(values.brand_id),
        ...(group ? { group } : {}),
      };
      if (isNew) {
        const res = await create({ path: "employee/email-templates", body: payload }).unwrap();
        showToast(res?.message || "Template created.", "success");
        navigate(listRoute);
      } else {
        const patch = { ...payload };
        delete patch.key;
        const res = await update({ path: `employee/email-templates/${uuid}`, body: patch }).unwrap();
        showToast(res?.message || "Template updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg = err?.data?.message
        || (err?.data?.errors && Object.values(err.data.errors).flat().join("\n"))
        || "Failed to save template.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestSend = async () => {
    if (!testTo || isNew) return;
    try {
      const vars = {};
      variables.forEach((v) => { if (v.name) vars[v.name] = v.sample || ""; });
      const res = await sendTest({
        path: `employee/email-templates/${uuid}/test-send`,
        body: { to: testTo, variables: vars, brand_key: previewBrand || undefined },
      }).unwrap();
      showToast(res?.message || "Test email dispatched.", "success");
    } catch (err) {
      const msg = err?.data?.message || "Failed to send test email.";
      showToast(msg, "error");
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view email templates.</span>
        </div>
      </div>
    );
  }
  if (!isNew && isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading template…
      </div>
    );
  }
  if (!isNew && isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load template. <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px 90px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
      {/* Page header */}
      <div className="mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(listRoute)}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
            aria-label="Back" title="Back to list"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Mail size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[19px] font-bold" style={{ color: TEXT_PRIMARY }}>
                {isNew ? "New Email Template" : data?.data?.name || "Edit Template"}
              </h1>
              {isSystem && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.4px]" style={{ background: SURFACE_ALT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}>
                  <Lock size={10} /> SYSTEM
                </span>
              )}
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              {isNew
                ? "Create a new email template that code can dispatch by key."
                : <>Key: <code style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{data?.data?.key}</code> · Immutable after create</>}
            </p>
          </div>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={isNew ? createSchema : editSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting, dirty }) => (
          <Form>
            <FormPreviewSync />

            {/* Split layout: editor (left) + preview (right) */}
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)" }}
            >
              {/* ────────────── LEFT: editor ────────────── */}
              <div className="space-y-4">
                <Section title="Identity" subtitle="Code dispatches by key. Display name + description are HR-facing only.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label required>Name</Label>
                      <TextField name="name" placeholder="Welcome email" />
                      <FieldError name="name" errors={errors} touched={touched} />
                    </div>
                    <div className="md:col-span-2">
                      <Label required>Key</Label>
                      <TextField name="key" placeholder="welcome" disabled={!isNew} monospace />
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                        Lowercase, underscores, numbers. {!isNew && "Immutable after create."}
                      </p>
                      <FieldError name="key" errors={errors} touched={touched} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Field
                        as="textarea" name="description" rows={2}
                        placeholder="What this template is for (HR-facing)."
                        style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Subject + body" subtitle="Use {variable_name} to interpolate. Company vars like {company_name} and brand vars like {brand_email_hr} are always available.">
                  <Label required>Subject</Label>
                  <TextField name="subject" placeholder="Welcome to {company_name}, {employee_name}!" />
                  <FieldError name="subject" errors={errors} touched={touched} />

                  <div className="mt-4">
                    <Label required>Body</Label>
                    <RichField
                      ref={bodyEditorRef}
                      name="body_html"
                      placeholder="Write the email body… use the toolbar's Insert variable button to drop in entity-bound vars."
                      minHeight={320}
                      onRequestInsertVariable={
                        variableSources.length > 0 ? () => setPickerMode("body") : undefined
                      }
                    />
                    <FieldError name="body_html" errors={errors} touched={touched} />
                    <UndocumentedVarsWarning
                      knownNames={knownVariableNames}
                      customNames={new Set((variables || []).map((v) => v.name).filter(Boolean))}
                    />
                    <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                      Plain-text fallback is auto-derived on save — no separate field needed.
                    </p>
                  </div>
                </Section>

                <Section title="Variables" subtitle="Pick entity-bound variables from the registry, or add free-form custom ones.">
                  <VariablesEditor
                    variables={variables}
                    onChange={setVariables}
                    variableSources={variableSources}
                    onOpenPicker={() => setPickerMode("catalog")}
                  />
                </Section>

                <Section title="Settings" subtitle="Active flag and brand pinning.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Field
                          type="checkbox" id="is_active" name="is_active"
                          style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }}
                        />
                        <label htmlFor="is_active" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>
                          Template is active
                        </label>
                      </div>
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                        Inactive templates won&apos;t be dispatched even if code asks for them.
                      </p>
                    </div>
                    <div>
                      <Label>Pin to brand</Label>
                      <Field
                        as="select" name="brand_id"
                        style={{ ...inputStyle, background: SURFACE }}
                      >
                        <option value="">Any brand (default)</option>
                        {brands.map((b) => <option key={b.uuid} value={b.id || b.brand_id}>{b.name}</option>)}
                      </Field>
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                        Pinned templates only fire for that brand. Leave on &quot;Any&quot; for cross-brand templates.
                      </p>
                    </div>
                  </div>
                </Section>
              </div>

              {/* ────────────── RIGHT: live preview ────────────── */}
              <div className="space-y-4">
                <div
                  className="rounded-2xl overflow-hidden sticky"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    top: 16,
                  }}
                >
                  <div
                    className="flex items-center justify-between gap-3 px-4 py-3"
                    style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center gap-2">
                      <Eye size={14} style={{ color: BRAND_RED }} />
                      <span className="text-[12.5px] font-bold" style={{ color: TEXT_PRIMARY }}>Live preview</span>
                      {isRendering && <Loader2 size={12} className="animate-spin" style={{ color: TEXT_MUTED }} />}
                    </div>
                    {brands.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Sparkles size={12} style={{ color: TEXT_MUTED }} />
                        <select
                          value={previewBrand}
                          onChange={(e) => setPreviewBrand(e.target.value)}
                          style={{
                            border: `1px solid ${BORDER}`, borderRadius: 6,
                            padding: "4px 8px", fontSize: 12, background: SURFACE,
                            color: TEXT_SECONDARY, fontWeight: 600, outline: "none",
                          }}
                        >
                          {brands.map((b) => (
                            <option key={b.uuid} value={b.slug}>
                              {b.name}{b.is_default ? " (default)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {isNew ? (
                    <div className="px-6 py-10 text-center" style={{ color: TEXT_MUTED }}>
                      <RefreshCw size={20} className="mx-auto mb-2" />
                      <p className="text-[12.5px]">Create the template first to see the live preview.</p>
                    </div>
                  ) : (
                    <>
                      {/* Subject row */}
                      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                        <div className="text-[10px] font-bold tracking-[0.6px] uppercase mb-1" style={{ color: TEXT_MUTED }}>Subject</div>
                        <div className="text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                          {previewSubject || <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>Awaiting render…</span>}
                        </div>
                      </div>

                      {/* Body iframe (sandboxed, no execution of scripts) */}
                      <iframe
                        title="Email preview"
                        srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>
                          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; padding: 18px; line-height: 1.55; font-size: 14px; }
                          a { color: ${BRAND_RED}; }
                          h1,h2,h3 { color: #0F172A; }
                          img { max-width: 100%; }
                          blockquote { margin: 0 0 12px; padding: 4px 12px; border-left: 3px solid ${BRAND_RED}; background: ${BRAND_RED_TINT}; color: ${TEXT_SECONDARY}; }
                        </style></head><body>${previewHtml || "<em style='color:#94A3B8'>Render pending — start typing in the body…</em>"}</body></html>`}
                        sandbox=""
                        style={{
                          width: "100%",
                          height: 540,
                          border: "none",
                          background: SURFACE,
                          display: "block",
                        }}
                      />

                      {/* Test-send row */}
                      {canTestSend && (
                        <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT }}>
                          <input
                            type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)}
                            placeholder="Send test to: you@codelab.pk"
                            className="flex-1 px-3 py-1.5 rounded-md"
                            style={{ border: `1px solid ${BORDER}`, fontSize: 12, background: SURFACE, outline: "none" }}
                            onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
                            onBlur={(e) => (e.target.style.borderColor = BORDER)}
                          />
                          <button
                            type="button"
                            onClick={handleTestSend}
                            disabled={!testTo || isSendingTest}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md"
                            style={{
                              fontSize: 12, fontWeight: 600,
                              background: !testTo ? "#CBD5E1" : BRAND_RED, color: "#fff",
                              cursor: !testTo ? "not-allowed" : "pointer",
                              opacity: isSendingTest ? 0.7 : 1,
                            }}
                          >
                            {isSendingTest
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Send size={11} strokeWidth={2.5} />}
                            Send test
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky save bar */}
            <div
              className="flex items-center justify-end gap-3 sticky bottom-0 mt-6 -mx-6 px-6 py-4"
              style={{
                background: "rgba(248,250,252,0.92)",
                backdropFilter: "blur(6px)",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              <div className="mr-auto text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {dirty ? "You have unsaved changes." : isNew ? "Fill in the fields and click Create." : "All changes saved."}
              </div>
              {!canSubmit && <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Read-only mode.</span>}
              <button
                type="button" onClick={() => navigate(listRoute)}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={!canSubmit || isSubmitting || isCreating || isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
                style={{
                  background: !canSubmit ? "#CBD5E1" : BRAND_RED,
                  color: "#fff", fontWeight: 600, fontSize: 13.5,
                  cursor: !canSubmit ? "not-allowed" : "pointer",
                  opacity: (isSubmitting || isCreating || isUpdating) ? 0.7 : 1,
                  boxShadow: "0 4px 10px rgba(201,6,6,0.12)",
                }}
                onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED_DARK; }}
                onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED; }}
              >
                {(isSubmitting || isCreating || isUpdating) ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {isNew ? "Creating…" : "Saving…"}
                  </>
                ) : (
                  <>
                    <Save size={15} strokeWidth={2.25} />
                    {isNew ? "Create template" : "Save changes"}
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {/* Insert-variable picker — shared by body editor + catalog flows */}
      <VariablePickerModal
        open={pickerOpen}
        onClose={() => setPickerMode(null)}
        onInsert={handlePickerSelection}
        variableSources={variableSources}
        title={
          pickerMode === "body"
            ? "Insert variable into body"
            : pickerMode === "catalog"
              ? "Add variable from registry"
              : "Insert variable"
        }
      />
    </div>
  );
};

export default EmailTemplateFormPage;
