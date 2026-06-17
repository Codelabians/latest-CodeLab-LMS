import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Check,
  ChevronDown,
  X,
  ShieldCheck,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_SERVICES } from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ──────────────────────────────── */
const BRAND_RED = "#C90606";
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

const titleCase = (raw) => {
  if (!raw) return "";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      const acronyms = new Set(["ceo", "coo", "cto", "cfo", "cso", "hr", "it", "qa", "ui", "ux", "seo", "api", "sme", "vp"]);
      if (acronyms.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/* ─────────────────────── primitives ────────────────────────────────── */
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

const TextInput = ({ value, onChange, type = "text", placeholder, onBlur }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
    style={inputStyle}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
    style={{ ...inputStyle, resize: "vertical" }}
  />
);

/* ─────────────────────── searchable select ─────────────────────────── */
const SearchableSelect = ({
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
    [options, value],
  );

  useEffect(() => {
    setQuery(selected ? selected.label : "");
  }, [selected]);

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
    if (!q || (selected && selected.label.toLowerCase() === q)) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q)
        || String(o.value).toLowerCase().includes(q),
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
          <button type="button" onClick={handleClear} className="p-0.5 rounded hover:bg-slate-100" style={{ color: TEXT_MUTED }} title="Clear">
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          style={{ color: TEXT_MUTED, transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
        />
      </div>
      {open && (
        <div className="absolute z-20 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg max-h-60" style={{ borderColor: BORDER }}>
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
                  style={{ color: TEXT_PRIMARY, background: isSelected ? BRAND_RED_TINT : "transparent" }}
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
  );
};

/* ─────────────────────── main form page ────────────────────────────── */
const ServiceFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canSubmit = isNew ? canCreate : canEdit;

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/services/${uuid}` },
    { skip: !canView || isNew },
  );
  const { data: deptsData } = useGetQuery({ path: "employee/departments" }, { skip: !canView });

  const departmentOptions = useMemo(
    () => unwrap(deptsData).map((d) => ({
      value: d.id,
      label: d.name && !/^[a-z0-9]+([_-][a-z0-9]+)*$/.test(d.name) ? d.name : titleCase(d.slug || d.name || ""),
    })),
    [deptsData],
  );

  const current = data?.data;

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [defaultBillingRate, setDefaultBillingRate] = useState("");
  const [billingCurrency, setBillingCurrency] = useState("PKR");
  // lead_user_id intentionally omitted from v1 — too many users to pick cleanly.
  // const [leadUserId, setLeadUserId] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#C90606");
  const [isActive, setIsActive] = useState(true);
  const [isClientFacing, setIsClientFacing] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!current) return;
    setSlug(current.slug ?? "");
    setName(current.name ?? "");
    setCode(current.code ?? "");
    setDepartmentId(current.department_id ?? "");
    setDescription(current.description ?? "");
    setDefaultBillingRate(current.default_billing_rate ?? "");
    setBillingCurrency(current.billing_currency ?? "PKR");
    setIcon(current.icon ?? "");
    setColor(current.color ?? "#C90606");
    setIsActive(current.is_active ?? true);
    setIsClientFacing(current.is_client_facing ?? false);
    setSortOrder(current.sort_order ?? 0);
  }, [current]);

  const [createSvc, { isLoading: isCreating }] = usePostMutation();
  const [updateSvc, { isLoading: isUpdating }] = usePatchMutation();

  const handleSlugAutofill = () => {
    if (!isNew) return;
    if (slug && slug.trim().length > 0) return;
    if (!name) return;
    setSlug(slugify(name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      showToast("Name is required.", "error");
      return;
    }
    if (!departmentId) {
      showToast("Department is required.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : null,
      department_id: Number(departmentId),
      description: description || null,
      default_billing_rate: defaultBillingRate !== "" && defaultBillingRate !== null
        ? Number(defaultBillingRate)
        : null,
      billing_currency: billingCurrency || "PKR",
      icon: icon || null,
      color: color || null,
      is_active: !!isActive,
      is_client_facing: !!isClientFacing,
      sort_order: sortOrder ? Number(sortOrder) : 0,
    };

    try {
      if (isNew) {
        const finalSlug = (slug && slug.trim()) || slugify(name);
        const res = await createSvc({
          path: "employee/services",
          body: { ...payload, slug: finalSlug },
        }).unwrap();
        showToast(res?.message || "Service created.", "success");
        navigate(HR_SERVICES);
      } else {
        const res = await updateSvc({
          path: `employee/services/${uuid}`,
          body: payload,
        }).unwrap();
        showToast(res?.message || "Service updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors && Object.values(err.data.errors).flat().join(" · ")) ||
        "Failed to save service.";
      showToast(msg, "error");
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view services.</span>
        </div>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading service…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load service.{" "}
          <button onClick={refetch} className="underline" style={{ color: BRAND_RED, fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const submitting = isCreating || isUpdating;

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(HR_SERVICES)}
            className="flex items-center justify-center"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`,
            }}
            aria-label="Back to services"
            title="Back to services"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Briefcase size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "New service" : current?.name || "Edit service"}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {isNew
                ? "Define a service that sits inside a department."
                : <>Editing <strong style={{ color: TEXT_PRIMARY }}>{current?.slug}</strong>.</>}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identity */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label required>Name</Label>
              <TextInput value={name} onChange={setName} placeholder="Web Development" onBlur={handleSlugAutofill} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <TextInput value={slug} onChange={setSlug} placeholder="web_development" />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Auto-derived from name if left blank.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Code</Label>
              <TextInput
                value={code}
                onChange={(v) => setCode(v.toUpperCase().slice(0, 6))}
                placeholder="WD"
              />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Short uppercase ID, usually 2–3 letters (e.g. WD, MOB, QA).
              </span>
            </div>
          </div>
        </section>

        {/* Department + description */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Placement</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label required>Department</Label>
              <SearchableSelect
                value={departmentId}
                onChange={setDepartmentId}
                options={departmentOptions}
                placeholder="Search or pick a department…"
                emptyMessage="No departments configured yet."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-4">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={setDescription}
              placeholder="What does this service cover?"
              rows={4}
            />
          </div>
        </section>

        {/* Billing */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Billing</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Default billing rate</Label>
              <TextInput
                value={defaultBillingRate}
                onChange={setDefaultBillingRate}
                type="number"
                placeholder="3500"
              />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Per hour. Used as the default when client work is logged.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <select
                value={billingCurrency || "PKR"}
                onChange={(e) => setBillingCurrency(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>
          {/* lead_user_id picker intentionally omitted in v1 — users list is unbounded. */}
        </section>

        {/* Visuals + flags */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Visuals &amp; flags</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <TextInput value={icon} onChange={setIcon} placeholder="emoji or short text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <input
                type="color"
                value={color || "#C90606"}
                onChange={(e) => setColor(e.target.value)}
                className="border rounded-md"
                style={{ height: 38, padding: 2, borderColor: BORDER, background: "white" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sort order</Label>
              <TextInput value={sortOrder} onChange={setSortOrder} type="number" placeholder="0" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="svc_is_active"
                type="checkbox"
                checked={!!isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="svc_is_active" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Active
              </label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="svc_is_client_facing"
                type="checkbox"
                checked={!!isClientFacing}
                onChange={(e) => setIsClientFacing(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="svc_is_client_facing" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Client-facing
              </label>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(HR_SERVICES)}
            className="px-4 py-2 text-sm border rounded-md"
            style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ background: BRAND_RED }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? (isNew ? "Creating…" : "Saving…") : (isNew ? "Create service" : "Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceFormPage;
