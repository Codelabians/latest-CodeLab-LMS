import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Workflow,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Info,
  Lock,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_APPROVAL_CHAINS } from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ─────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ─────────────────────── role catalog ─────────────────────── */
const ROLE_OPTIONS = [
  { key: "HR",          label: "HR" },
  { key: "ADMIN",       label: "Admin" },
  { key: "TEAM_LEAD",   label: "Team Lead" },
  { key: "MANAGER",     label: "Manager" },
  { key: "FINANCE",     label: "Finance" },
  { key: "CEO",         label: "CEO" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
];

const roleColor = (roleKey) => {
  switch ((roleKey || "").toUpperCase()) {
    case "HR":          return { bg: "#FEF2F2", fg: "#C90606", border: "#FCA5A5" };
    case "ADMIN":       return { bg: "#EFF6FF", fg: "#1D4ED8", border: "#93C5FD" };
    case "TEAM_LEAD":   return { bg: "#F0FDF4", fg: "#15803D", border: "#86EFAC" };
    case "CEO":         return { bg: "#FAF5FF", fg: "#7E22CE", border: "#D8B4FE" };
    case "MANAGER":     return { bg: "#FFF7ED", fg: "#C2410C", border: "#FDBA74" };
    case "FINANCE":     return { bg: "#FEFCE8", fg: "#A16207", border: "#FDE047" };
    case "SUPER_ADMIN": return { bg: "#F5F3FF", fg: "#5B21B6", border: "#C4B5FD" };
    default:            return { bg: "#F1F5F9", fg: "#475569", border: "#CBD5E1" };
  }
};

/* ─────────────────────── primitives ─────────────────────── */
const Label = ({ children, required }) => (
  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: TEXT_SECONDARY }}>
    {children}
    {required && <span style={{ color: BRAND_RED, marginLeft: 4 }}>*</span>}
  </label>
);

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_PRIMARY,
  fontSize: 13.5, outline: "none", transition: "border-color 0.15s",
};

const TextField = ({ name, type = "text", placeholder, disabled, monospace }) => (
  <Field name={name} type={type} placeholder={placeholder} disabled={disabled}
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
  errors[name] && touched[name] ? <p className="text-[11.5px] mt-1" style={{ color: BRAND_RED }}>{errors[name]}</p> : null;

const Card = ({ children }) => (
  <div className="rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: 22 }}>{children}</div>
);

/* ─────────────────────── step builder ─────────────────────── */
const StepBuilder = ({ steps, onChange, disabled }) => {
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...steps];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(renumber(next));
  };
  const moveDown = (i) => {
    if (i === steps.length - 1) return;
    const next = [...steps];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(renumber(next));
  };
  const remove = (i) => onChange(renumber(steps.filter((_, idx) => idx !== i)));
  const add = () => onChange(renumber([...steps, { order: steps.length + 1, role_key: "HR", name: "" }]));
  const setAt = (i, k, v) => onChange(steps.map((s, idx) => idx === i ? { ...s, [k]: v } : s));

  return (
    <div>
      <div className="space-y-2.5">
        {steps.length === 0 && (
          <div className="text-center py-6 rounded-lg" style={{ background: SURFACE_ALT, border: `1px dashed ${BORDER}`, color: TEXT_MUTED, fontSize: 12.5 }}>
            No steps yet. Click <strong>Add step</strong> below.
          </div>
        )}

        {steps.map((step, i) => {
          const c = roleColor(step.role_key);
          return (
            <div key={i} className="rounded-lg flex items-center gap-2.5 p-3"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              {/* Order badge */}
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32, borderRadius: 8, background: BRAND_RED_TINT, color: BRAND_RED, fontWeight: 700, fontSize: 14 }}>
                {step.order || i + 1}
              </div>

              {/* Role picker */}
              <div className="shrink-0" style={{ minWidth: 160 }}>
                <select
                  value={step.role_key || "HR"}
                  onChange={(e) => setAt(i, "role_key", e.target.value)}
                  disabled={disabled}
                  style={{
                    ...inputStyle,
                    padding: "8px 10px",
                    fontWeight: 600,
                    background: c.bg,
                    color: c.fg,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Step label */}
              <input
                type="text"
                value={step.name || ""}
                onChange={(e) => setAt(i, "name", e.target.value)}
                placeholder="Step label (optional, e.g. 'HR review')"
                disabled={disabled}
                style={{ ...inputStyle, padding: "8px 10px" }}
                onFocus={(e) => (e.target.style.borderColor = BRAND_RED)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />

              {/* Reorder + remove */}
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => moveUp(i)} disabled={disabled || i === 0} title="Move up"
                  className="flex items-center justify-center"
                  style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED, cursor: (disabled || i === 0) ? "not-allowed" : "pointer", opacity: (disabled || i === 0) ? 0.4 : 1 }}>
                  <ArrowUp size={13} strokeWidth={2.25} />
                </button>
                <button type="button" onClick={() => moveDown(i)} disabled={disabled || i === steps.length - 1} title="Move down"
                  className="flex items-center justify-center"
                  style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED, cursor: (disabled || i === steps.length - 1) ? "not-allowed" : "pointer", opacity: (disabled || i === steps.length - 1) ? 0.4 : 1 }}>
                  <ArrowDown size={13} strokeWidth={2.25} />
                </button>
                <button type="button" onClick={() => remove(i)} disabled={disabled} title="Remove step"
                  className="flex items-center justify-center"
                  style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT_MUTED }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.borderColor = BRAND_RED; e.currentTarget.style.color = BRAND_RED; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_MUTED; }}>
                  <Trash2 size={13} strokeWidth={2.25} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={add} disabled={disabled}
        className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg"
        style={{ fontSize: 12.5, fontWeight: 600, background: BRAND_RED_TINT, color: BRAND_RED, border: `1px dashed ${BRAND_RED}`, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
        <Plus size={13} strokeWidth={2.5} />
        Add step
      </button>

      <div className="mt-4 rounded-lg px-3 py-2 flex items-start gap-2"
        style={{ background: SURFACE_ALT, border: `1px dashed ${BORDER}`, fontSize: 11.5, color: TEXT_MUTED, lineHeight: 1.5 }}>
        <Info size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" />
        <span>
          Steps are executed in order. Each role must approve before the next step opens. Rejection at any step
          stops the chain. Chains with active <em>pending</em> instances cannot have their steps replaced —
          finish or cancel those instances first.
        </span>
      </div>
    </div>
  );
};

const renumber = (steps) => steps.map((s, i) => ({ ...s, order: i + 1 }));

/* ─────────────────────── validation ─────────────────────── */
const baseSchema = {
  name: Yup.string().required("Name is required").max(200),
  description: Yup.string().nullable().max(1000),
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

/* ─────────────────────── main page ─────────────────────── */
const ApprovalChainFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get approval-chains");
  const canCreate = hasPermission(user, "create approval-chains");
  const canEdit = hasPermission(user, "update approval-chains");
  const canSubmit = isNew ? canCreate : canEdit;

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/approval-chains/${uuid}` },
    { skip: !canView || isNew },
  );

  const [create, { isLoading: isCreating }] = usePostMutation();
  const [update, { isLoading: isUpdating }] = usePatchMutation();

  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (data?.data) setSteps(data.data.steps || []);
  }, [data]);

  // For NEW chains, start with a sensible HR → CEO default
  useEffect(() => {
    if (isNew && steps.length === 0) {
      setSteps([
        { order: 1, role_key: "HR", name: "HR review" },
        { order: 2, role_key: "CEO", name: "CEO final" },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const initialValues = useMemo(() => ({
    key: data?.data?.key ?? "",
    name: data?.data?.name ?? "",
    description: data?.data?.description ?? "",
    is_active: data?.data?.is_active ?? true,
  }), [data]);

  const handleSubmit = async (values, { setSubmitting }) => {
    // Defensive: enforce contiguous 1-based order on submit
    const normalisedSteps = renumber(
      steps
        .filter((s) => s.role_key && s.role_key.trim() !== "")
        .map((s, i) => ({
          order: i + 1,
          role_key: s.role_key.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
          name: s.name || null,
        })),
    );
    if (normalisedSteps.length === 0) {
      showToast("Add at least one step before saving.", "error");
      setSubmitting(false);
      return;
    }

    try {
      const payload = { ...values, steps: normalisedSteps };
      if (isNew) {
        const res = await create({ path: "employee/approval-chains", body: payload }).unwrap();
        showToast(res?.message || "Chain created.", "success");
        navigate(HR_APPROVAL_CHAINS);
      } else {
        const patch = { ...payload };
        delete patch.key;
        const res = await update({ path: `employee/approval-chains/${uuid}`, body: patch }).unwrap();
        showToast(res?.message || "Chain updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg = err?.data?.message || (err?.data?.errors && Object.values(err.data.errors).flat().join("\n")) || "Failed to save chain.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <Card><div className="flex items-center gap-3" style={{ color: TEXT_SECONDARY }}><ShieldCheck size={18} /><span>You don&apos;t have permission to view approval chains.</span></div></Card>
      </div>
    );
  }
  if (!isNew && isLoading) return <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}><Loader2 size={20} className="animate-spin mr-2" />Loading chain…</div>;
  if (!isNew && isError) {
    return <div className="p-10"><Card><div style={{ color: BRAND_RED }}>Could not load chain. <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>Retry</button></div></Card></div>;
  }

  return (
    <div style={{ padding: "20px 24px 100px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
      <div className="mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(HR_APPROVAL_CHAINS)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }} aria-label="Back" title="Back to chains">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
            <Workflow size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[19px] font-bold" style={{ color: TEXT_PRIMARY }}>{isNew ? "New Approval Chain" : data?.data?.name || "Edit Chain"}</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              {isNew ? "Define a reusable approval workflow." : <>Key: <code style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>{data?.data?.key}</code> · immutable after create</>}
            </p>
          </div>
        </div>
      </div>

      <Formik initialValues={initialValues} validationSchema={isNew ? createSchema : editSchema} enableReinitialize onSubmit={handleSubmit}>
        {({ errors, touched, isSubmitting, dirty }) => (
          <Form>
            <div className="grid grid-cols-1 gap-5">
              <Card>
                <h3 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label required>Name</Label>
                    <TextField name="name" placeholder="Leave request approval" />
                    <FieldError name="name" errors={errors} touched={touched} />
                  </div>
                  <div className="md:col-span-2">
                    <Label required>Key</Label>
                    <TextField name="key" placeholder="leave" disabled={!isNew} monospace />
                    <p className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                      Code references the chain by this key. {!isNew && (
                        <span className="inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}>
                          <Lock size={10} /> Immutable after create.
                        </span>
                      )}
                    </p>
                    <FieldError name="key" errors={errors} touched={touched} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Field as="textarea" name="description" rows={2}
                      placeholder="What this chain is for (HR-facing)."
                      style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Field type="checkbox" id="is_active" name="is_active"
                        style={{ width: 18, height: 18, accentColor: BRAND_RED, cursor: "pointer" }} />
                      <label htmlFor="is_active" className="text-[13px] cursor-pointer" style={{ color: TEXT_PRIMARY }}>
                        Chain is active
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-[14px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Approval steps</h3>
                <p className="text-[11.5px] mb-4" style={{ color: TEXT_MUTED }}>
                  Add an ordered sequence of approvers. Drag up/down to reorder.
                </p>
                <StepBuilder steps={steps} onChange={setSteps} disabled={!canSubmit} />
              </Card>
            </div>

            {/* Sticky save bar */}
            <div className="flex items-center justify-end gap-3 sticky bottom-0 mt-6 -mx-6 px-6 py-4"
              style={{ background: "rgba(248,250,252,0.92)", backdropFilter: "blur(6px)", borderTop: `1px solid ${BORDER}` }}>
              <div className="mr-auto text-[12.5px]" style={{ color: TEXT_MUTED }}>
                {dirty ? "You have unsaved changes." : isNew ? "Fill in the fields and click Create." : "All changes saved."}
              </div>
              {!canSubmit && <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Read-only mode.</span>}
              <button type="button" onClick={() => navigate(HR_APPROVAL_CHAINS)}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit || isSubmitting || isCreating || isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
                style={{
                  background: !canSubmit ? "#CBD5E1" : BRAND_RED, color: "#fff",
                  fontWeight: 600, fontSize: 13.5,
                  cursor: !canSubmit ? "not-allowed" : "pointer",
                  opacity: (isSubmitting || isCreating || isUpdating) ? 0.7 : 1,
                  boxShadow: "0 4px 10px rgba(201,6,6,0.12)",
                }}
                onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED_DARK; }}
                onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = BRAND_RED; }}>
                {(isSubmitting || isCreating || isUpdating) ? (
                  <><Loader2 size={15} className="animate-spin" />{isNew ? "Creating…" : "Saving…"}</>
                ) : (
                  <><Save size={15} strokeWidth={2.25} />{isNew ? "Create chain" : "Save changes"}</>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ApprovalChainFormPage;
