import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  ChevronLeft,
  Loader2,
  Save,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_DEPARTMENTS } from "../../routes/RouteConstants";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const inputStyle = { borderColor: BORDER, color: TEXT_PRIMARY, background: "white" };

const Label = ({ children, required }) => (
  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
    {children} {required && <span style={{ color: BRAND_RED }}>*</span>}
  </label>
);

const TextField = ({ label, required, value, onChange, type = "text", placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <Label required={required}>{label}</Label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
      style={inputStyle}
    />
  </div>
);

const DesignationFormPage = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEdit = !!uuid;
  const user = useSelector(selectCurrentUser);
  const canSubmit = isEdit
    ? hasPermission(user, "update employee")
    : hasPermission(user, "create employee");

  /* form state */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("PKR");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  /* lookups */
  const { data: deptsData } = useGetQuery({ path: "employee/departments" });
  const departments = useMemo(() => unwrap(deptsData), [deptsData]);

  /* edit-mode prefill */
  const { data: rowData } = useGetQuery(
    { path: `employee/designations/${uuid}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit) return;
    const row = rowData?.data;
    if (!row) return;
    setName(row.name || "");
    setSlug(row.slug || "");
    setDepartmentId(row.department_id ? String(row.department_id) : "");
    setDescription(row.description || "");
    setSalaryMin(row.salary_min ?? "");
    setSalaryMax(row.salary_max ?? "");
    setSalaryCurrency(row.salary_currency || "PKR");
    setIsActive(!!row.is_active);
    setSortOrder(String(row.sort_order ?? 0));
  }, [isEdit, rowData]);

  const [createRow, { isLoading: creating }] = usePostMutation();
  const [patchRow, { isLoading: patching }] = usePatchMutation();
  const submitting = creating || patching;

  if (!canSubmit) {
    return (
      <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: TEXT_MUTED }}>
          You don&apos;t have permission to {isEdit ? "edit" : "create"} designations.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      showToast("Designation name is required.", "error");
      return;
    }

    const body = {
      name: name.trim(),
      slug: slug ? slug.trim() : undefined,
      department_id: departmentId ? Number(departmentId) : null,
      description: description || undefined,
      salary_min: salaryMin === "" ? null : Number(salaryMin),
      salary_max: salaryMax === "" ? null : Number(salaryMax),
      salary_currency: salaryCurrency,
      is_active: isActive,
      sort_order: Number(sortOrder) || 0,
    };

    try {
      if (isEdit) {
        await patchRow({ path: `employee/designations/${uuid}`, body }).unwrap();
        showToast("Designation updated.", "success");
      } else {
        await createRow({ path: "employee/designations", body }).unwrap();
        showToast("Designation created.", "success");
      }
      navigate(`${HR_DEPARTMENTS}?tab=designations`);
    } catch (err) {
      const msg = err?.data?.message
        || (err?.data?.errors ? Object.values(err.data.errors).flat().join(" · ") : "Save failed.");
      showToast(msg, "error");
    }
  };

  return (
    <div style={{ padding: "28px 28px 60px", fontFamily: "'Montserrat', sans-serif", background: SURFACE_ALT, minHeight: "100vh", color: TEXT_PRIMARY }}>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(`${HR_DEPARTMENTS}?tab=designations`)}
          className="p-2 rounded-md hover:bg-slate-100"
          style={{ color: TEXT_SECONDARY }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <BadgeCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{isEdit ? "Edit designation" : "New designation"}</h1>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            Job titles HR can pick from when hiring. Free text is still allowed in the employee form.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextField label="Name" required value={name} onChange={setName} placeholder="e.g. Senior Backend Developer" />
            <TextField label="Slug" value={slug} onChange={setSlug} placeholder="auto-generated if blank" />
            <div className="flex flex-col gap-1.5">
              <Label>Department (optional)</Label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              >
                <option value="">Cross-department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short description shown in the HR catalog."
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Salary range (optional)</h2>
          <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
            Informational only — payroll doesn&apos;t enforce these bounds. Helps HR
            set offers consistently.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <TextField label="Min salary" type="number" value={salaryMin} onChange={setSalaryMin} placeholder="80000" />
            <TextField label="Max salary" type="number" value={salaryMax} onChange={setSalaryMax} placeholder="150000" />
            <TextField label="Currency" value={salaryCurrency} onChange={setSalaryCurrency} placeholder="PKR" />
            <TextField label="Sort order" type="number" value={sortOrder} onChange={setSortOrder} />
          </div>
        </section>

        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Status</h2>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: BRAND_RED }}
            />
            <label htmlFor="is_active" className="text-sm" style={{ color: TEXT_SECONDARY }}>
              Active — show in the hire-form autocomplete
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`${HR_DEPARTMENTS}?tab=designations`)}
            className="px-4 py-2 text-sm border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ background: BRAND_RED }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create designation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DesignationFormPage;
