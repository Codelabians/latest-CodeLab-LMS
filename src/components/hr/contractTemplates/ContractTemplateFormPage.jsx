import { useEffect, useMemo, useState, useRef, forwardRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, useFormikContext } from "formik";
import * as Yup from "yup";
import {
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  Sparkles,
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
import { HR_CONTRACT_TEMPLATES } from "../../routes/RouteConstants";

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

const APPLIES_TO = [
  { value: "any", label: "Any role type" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "consultant", label: "Consultant" },
  { value: "intern_paid", label: "Intern (paid)" },
  { value: "intern_unpaid", label: "Intern (unpaid)" },
  { value: "outsourced", label: "Outsourced" },
];

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

  const findings = useMemo(() => {
    const re = /\{([a-zA-Z0-9_]+)\}/g;
    const found = new Set();
    let m;
    while ((m = re.exec(body)) !== null) found.add(m[1]);
    const undocumented = [];
    found.forEach((name) => {
      if (knownNames.has(name)) return;
      if (customNames.has(name)) return;
      undocumented.push(name);
    });
    undocumented.sort();
    return undocumented;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, knownNames, customNames]);

  if (findings.length === 0) return null;

  return (
    <div
      className="mt-2 rounded-lg px-3 py-2 flex items-start gap-2"
      style={{ background: "#FFFBEB", border: "1px solid #FCD34D", fontSize: 12, color: "#92400E", lineHeight: 1.5 }}
    >
      <span style={{ marginTop: 1 }}>⚠</span>
      <div className="flex-1">
        <strong>Undocumented variable{findings.length > 1 ? "s" : ""}:</strong>{" "}
        {findings.map((n, i) => (
          <span key={n}>
            <code
              style={{ background: "#FEF3C7", color: "#78350F", padding: "0 5px", borderRadius: 3, fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: 11 }}
            >{`{${n}}`}</code>
            {i < findings.length - 1 ? " · " : ""}
          </span>
        ))}
        <div className="mt-1 text-[11px]" style={{ color: "#92400E", opacity: 0.85 }}>
          Add them to the <em>Variables</em> catalog below, pick from <em>Insert variable</em>, or remove the references from the body.
          Missing values render as empty strings when the contract is generated.
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
              style={{ background: isBound ? "#F0F9FF" : SURFACE, border: `1px solid ${isBound ? "#BAE6FD" : BORDER}` }}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <code
                  style={{ background: SURFACE_ALT, color: BRAND_RED, padding: "3px 8px", borderRadius: 5, fontSize: 12, fontFamily: "JetBrains Mono, ui-monospace, monospace", border: `1px solid ${BORDER}` }}
                >
                  {`{${v.name || "…"}}`}
                </code>
                {isBound ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold tracking-[0.4px]" style={{ background: "#0EA5E9", color: "#fff" }}>
                    📦 {entityLabel} · {v.field_path}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold tracking-[0.4px]" style={{ background: SURFACE_ALT, color: TEXT_MUTED, border: `1px solid ${BORDER}` }}>
                    CUSTOM
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="button" onClick={() => remove(i)}
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED }}
                  title="Remove"
                >
                  <Trash2 size={11} strokeWidth={2.25} />
                </button>
              </div>

              <div className="grid items-start gap-2" style={{ gridTemplateColumns: "1fr 1.2fr 1fr" }}>
                <input
                  type="text" placeholder="variable_name" value={v.name || ""}
                  onChange={(e) => setAt(i, "name", e.target.value)}
                  disabled={isBound}
                  style={{ ...inputStyle, fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: 12.5, opacity: isBound ? 0.7 : 1, background: isBound ? SURFACE_ALT : SURFACE }}
                  title={isBound ? "Read-only — derived from the entity field" : ""}
                />
                <input
                  type="text" placeholder="Description (HR-facing note)" value={v.description || ""}
                  onChange={(e) => setAt(i, "description", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text" placeholder="Sample value (used in preview)" value={v.sample || ""}
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
          title="Pick a variable from a registered entity (Company, Brand, Employee…)"
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
        <strong style={{ color: TEXT_SECONDARY }}>Entity-bound</strong> (blue): the renderer reads the field off the live entity when the contract is generated —
        e.g. <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{`{employee_name}`}</code> from Employee.full_name.
        <br />
        <strong style={{ color: TEXT_SECONDARY }}>Custom</strong> (gray): free-form variables supplied by name at generation time. The sample value feeds the live preview on the right.
      </p>
    </div>
  );
};

/* ───────── live (client-side) preview ───────── */
const LivePreview = ({ variables, brands, previewBrandSlug }) => {
  const { values } = useFormikContext();
  const html = values.body_html || "";

  const rendered = useMemo(() => {
    // Substitute {var} with sample values for a faithful preview. Brand
    // vars get a best-effort fill from the selected brand's known fields.
    const varMap = {};
    (variables || []).forEach((v) => { if (v.name) varMap[v.name] = v.sample || ""; });
    const brand = brands.find((b) => b.slug === previewBrandSlug) || brands.find((b) => b.is_default) || brands[0];
    if (brand) {
      varMap.brand_name = varMap.brand_name || brand.name || "";
      varMap.company_name = varMap.company_name || brand.name || "";
    }
    return html.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, name) =>
      Object.prototype.hasOwnProperty.call(varMap, name) ? varMap[name] : full,
    );
  }, [html, variables, brands, previewBrandSlug]);

  return (
    <iframe
      title="Contract preview"
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; padding: 22px; line-height: 1.6; font-size: 13.5px; }
        a { color: ${BRAND_RED}; }
        h1,h2,h3 { color: #0F172A; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #E2E8F0; padding: 6px 8px; }
        blockquote { margin: 0 0 12px; padding: 4px 12px; border-left: 3px solid ${BRAND_RED}; background: ${BRAND_RED_TINT}; color: ${TEXT_SECONDARY}; }
      </style></head><body>${rendered || "<em style='color:#94A3B8'>Render pending — start writing the body…</em>"}</body></html>`}
      sandbox=""
      style={{ width: "100%", height: 620, border: "none", background: SURFACE, display: "block" }}
    />
  );
};

/* ─────────────────────── validation ──────────────────────────────── */
const baseSchema = {
  name: Yup.string().required("Name is required").max(200),
  designation: Yup.string().required("Designation is required").max(120),
  applies_to: Yup.string().oneOf(APPLIES_TO.map((a) => a.value)),
  description: Yup.string().nullable().max(2000),
  body_html: Yup.string().required("Body is required").max(500000),
  is_active: Yup.boolean(),
  is_default: Yup.boolean(),
};
const createSchema = Yup.object({
  ...baseSchema,
  key: Yup.string()
    .nullable()
    .matches(/^[a-z0-9_]*$/i, "Lowercase letters, numbers, underscores only")
    .max(80),
});
const editSchema = Yup.object(baseSchema);

/* ─────────────────────── main page ───────────────────────────────── */
const ContractTemplateFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get employee-contract-templates");
  const canCreate = hasPermission(user, "create employee-contract-templates");
  const canEdit = hasPermission(user, "update employee-contract-templates");

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/contract-templates/${uuid}` },
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

  const brands = useMemo(() => brandsData?.data || [], [brandsData]);
  const variableSources = useMemo(() => varSourcesData?.data || [], [varSourcesData]);

  const knownVariableNames = useMemo(() => {
    const set = new Set();
    variableSources.forEach((src) => (src.fields || []).forEach((f) => set.add(f.name)));
    return set;
  }, [variableSources]);

  const [pickerMode, setPickerMode] = useState(null); // null | 'body' | 'catalog'
  const pickerOpen = pickerMode !== null;
  const bodyEditorRef = useRef(null);

  const [variables, setVariables] = useState([]);
  const [previewBrand, setPreviewBrand] = useState("");

  const canSubmit = isNew ? canCreate : canEdit;

  const handlePickerSelection = (varName, fullRow) => {
    if (pickerMode === "body") {
      bodyEditorRef.current?.insertText(`{${varName}}`);
      return;
    }
    if (pickerMode === "catalog") {
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
      designation: data?.data?.designation ?? "",
      applies_to: data?.data?.applies_to ?? "any",
      description: data?.data?.description ?? "",
      body_html: data?.data?.body_html ?? "",
      is_active: data?.data?.is_active ?? true,
      is_default: data?.data?.is_default ?? false,
      brand_id: data?.data?.brand_id ?? "",
    }),
    [data],
  );

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        variables: variables.filter((v) => (v.name || "").trim() !== ""),
        brand_id: values.brand_id === "" ? null : Number(values.brand_id),
      };
      if (isNew) {
        if (!payload.key) delete payload.key; // BE derives a slug from name
        const res = await create({ path: "employee/contract-templates", body: payload }).unwrap();
        showToast(res?.message || "Template created.", "success");
        navigate(HR_CONTRACT_TEMPLATES);
      } else {
        const patch = { ...payload };
        delete patch.key; // key is immutable after create
        const res = await update({ path: `employee/contract-templates/${uuid}`, body: patch }).unwrap();
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

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view contract templates.</span>
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
            onClick={() => navigate(HR_CONTRACT_TEMPLATES)}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
            aria-label="Back" title="Back to list"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <FileText size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[19px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "New Contract Template" : data?.data?.name || "Edit Template"}
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              {isNew
                ? "Create a reusable contract blueprint HR can issue to employees."
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
            <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)" }}>
              {/* ────────────── LEFT: editor ────────────── */}
              <div className="space-y-4">
                <Section title="Identity" subtitle="Code/HR references this template by key. Display name + description are HR-facing only.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label required>Name</Label>
                      <TextField name="name" placeholder="Permanent employment agreement" />
                      <FieldError name="name" errors={errors} touched={touched} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Key</Label>
                      <TextField name="key" placeholder="auto-generated from name if left blank" disabled={!isNew} monospace />
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                        Lowercase, underscores, numbers. {isNew ? "Leave blank to auto-derive from the name." : "Immutable after create."}
                      </p>
                      <FieldError name="key" errors={errors} touched={touched} />
                    </div>
                    <div>
                      <Label required>Designation</Label>
                      <TextField name="designation" placeholder="e.g. Software Engineer" />
                      <FieldError name="designation" errors={errors} touched={touched} />
                    </div>
                    <div>
                      <Label>Applies to</Label>
                      <Field as="select" name="applies_to" style={{ ...inputStyle, background: SURFACE }}>
                        {APPLIES_TO.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </Field>
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

                <Section title="Body" subtitle="Use {variable_name} to interpolate. Entity vars like {employee_name} and brand vars like {company_name} are filled when the contract is generated.">
                  <Label required>Contract body</Label>
                  <RichField
                    ref={bodyEditorRef}
                    name="body_html"
                    placeholder="Write the contract body… use the toolbar's Insert variable button to drop in entity-bound vars."
                    minHeight={380}
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
                    The body is frozen as a snapshot when a contract is issued, so later edits here never change already-signed contracts.
                  </p>
                </Section>

                <Section title="Variables" subtitle="Pick entity-bound variables from the registry, or add free-form custom ones.">
                  <VariablesEditor
                    variables={variables}
                    onChange={setVariables}
                    variableSources={variableSources}
                    onOpenPicker={() => setPickerMode("catalog")}
                  />
                </Section>

                <Section title="Settings" subtitle="Active flag, default selection, and brand pinning.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Field type="checkbox" id="is_active" name="is_active" style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }} />
                        <label htmlFor="is_active" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>Template is active</label>
                      </div>
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>Inactive templates aren&apos;t offered when issuing a contract.</p>
                    </div>
                    <div>
                      <Label>Default</Label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Field type="checkbox" id="is_default" name="is_default" style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }} />
                        <label htmlFor="is_default" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>Use as the default template</label>
                      </div>
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>The default is pre-selected when HR issues a new contract.</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Pin to brand</Label>
                      <Field as="select" name="brand_id" style={{ ...inputStyle, background: SURFACE }}>
                        <option value="">Any brand (default)</option>
                        {brands.map((b) => <option key={b.uuid} value={b.id || b.brand_id}>{b.name}</option>)}
                      </Field>
                      <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                        Pinned templates only apply to that brand. Leave on &quot;Any&quot; for cross-brand templates.
                      </p>
                    </div>
                  </div>
                </Section>
              </div>

              {/* ────────────── RIGHT: live preview ────────────── */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden sticky" style={{ background: SURFACE, border: `1px solid ${BORDER}`, top: 16 }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: SURFACE_ALT, borderBottom: `1px solid ${BORDER}` }}>
                    <div className="flex items-center gap-2">
                      <Eye size={14} style={{ color: BRAND_RED }} />
                      <span className="text-[12.5px] font-bold" style={{ color: TEXT_PRIMARY }}>Live preview</span>
                    </div>
                    {brands.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Sparkles size={12} style={{ color: TEXT_MUTED }} />
                        <select
                          value={previewBrand}
                          onChange={(e) => setPreviewBrand(e.target.value)}
                          style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, background: SURFACE, color: TEXT_SECONDARY, fontWeight: 600, outline: "none" }}
                        >
                          {brands.map((b) => (
                            <option key={b.uuid} value={b.slug}>{b.name}{b.is_default ? " (default)" : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <LivePreview variables={variables} brands={brands} previewBrandSlug={previewBrand} />
                  <div className="px-4 py-2.5 text-[10.5px]" style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE_ALT, color: TEXT_MUTED }}>
                    Preview substitutes each variable&apos;s sample value. Real entity data is filled at generation time.
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky save bar */}
            <div
              className="flex items-center justify-end gap-3 sticky bottom-0 mt-6 -mx-6 px-6 py-4"
              style={{ background: "rgba(248,250,252,0.92)", backdropFilter: "blur(6px)", borderTop: `1px solid ${BORDER}` }}
            >
              <div className="mr-auto text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {dirty ? "You have unsaved changes." : isNew ? "Fill in the fields and click Create." : "All changes saved."}
              </div>
              {!canSubmit && <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Read-only mode.</span>}
              <button
                type="button" onClick={() => navigate(HR_CONTRACT_TEMPLATES)}
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
                  <><Loader2 size={15} className="animate-spin" />{isNew ? "Creating…" : "Saving…"}</>
                ) : (
                  <><Save size={15} strokeWidth={2.25} />{isNew ? "Create template" : "Save changes"}</>
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

export default ContractTemplateFormPage;
