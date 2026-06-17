import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layers,
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Check,
  ChevronDown,
  X,
  ShieldCheck,
  Shield,
  Users as UsersIcon,
  Banknote,
  Code,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Building2,
  Wrench,
  Megaphone,
  Headphones,
  Heart,
  Settings,
  Truck,
  Globe,
  BookOpen,
  Calculator,
  Wallet,
  Palette,
  Server,
  Database,
  PenTool,
  ClipboardList,
  Target,
  Crown,
  Star,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import { HR_DEPARTMENTS } from "../../routes/RouteConstants";

/* ─────────────────────── brand tokens ──────────────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#F8FAFC";

/* ─────────────────────── helpers ───────────────────────────────────── */
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/**
 * Visual icon picker options. The `slug` is what gets stored on the
 * department row; the list page maps the same slugs back into Lucide
 * components for display (see DEPT_ICON_MAP in DepartmentsListPage).
 *
 * Keep this list in sync with DEPT_ICON_MAP — every slug here should be
 * a key there.
 */
const ICON_OPTIONS = [
  { slug: "shield",          label: "Shield",        Cmp: Shield },
  { slug: "shield-check",    label: "Shield check",  Cmp: ShieldCheck },
  { slug: "users",           label: "People",        Cmp: UsersIcon },
  { slug: "banknote",        label: "Cash",          Cmp: Banknote },
  { slug: "wallet",          label: "Wallet",        Cmp: Wallet },
  { slug: "calculator",      label: "Calculator",    Cmp: Calculator },
  { slug: "code",            label: "Code",          Cmp: Code },
  { slug: "server",          label: "Server",        Cmp: Server },
  { slug: "database",        label: "Database",      Cmp: Database },
  { slug: "palette",         label: "Design",        Cmp: Palette },
  { slug: "pen-tool",        label: "Pen tool",      Cmp: PenTool },
  { slug: "megaphone",       label: "Marketing",     Cmp: Megaphone },
  { slug: "trending-up",     label: "Sales",         Cmp: TrendingUp },
  { slug: "target",          label: "Target",        Cmp: Target },
  { slug: "headphones",      label: "Support",       Cmp: Headphones },
  { slug: "heart",           label: "Care",          Cmp: Heart },
  { slug: "graduation-cap",  label: "Education",     Cmp: GraduationCap },
  { slug: "book-open",       label: "Curriculum",    Cmp: BookOpen },
  { slug: "briefcase",       label: "Business",      Cmp: Briefcase },
  { slug: "building",        label: "Office",        Cmp: Building2 },
  { slug: "settings",        label: "Operations",    Cmp: Settings },
  { slug: "wrench",          label: "Tools",         Cmp: Wrench },
  { slug: "truck",           label: "Logistics",     Cmp: Truck },
  { slug: "globe",           label: "Global",        Cmp: Globe },
  { slug: "clipboard-list",  label: "Admin",         Cmp: ClipboardList },
  { slug: "crown",           label: "Leadership",    Cmp: Crown },
  { slug: "star",            label: "Featured",      Cmp: Star },
  { slug: "layers",          label: "Default",       Cmp: Layers },
];

const IconPicker = ({ value, onChange, color = BRAND_RED }) => {
  // Allow free text too (emoji / short label) — clicking a tile sets the
  // canonical slug, the input below can still hold an emoji.
  return (
    <div className="flex flex-col gap-2">
      <div
        className="grid gap-1.5 p-2 border rounded-md max-h-44 overflow-y-auto"
        style={{ borderColor: BORDER, background: SURFACE, gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))" }}
      >
        {ICON_OPTIONS.map(({ slug, label, Cmp }) => {
          const active = String(value).toLowerCase() === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onChange(slug)}
              title={label}
              className="flex items-center justify-center transition rounded-md"
              style={{
                width: 36, height: 36,
                background: active ? `${color}1A` : SURFACE_ALT,
                color: active ? color : TEXT_SECONDARY,
                border: `1px solid ${active ? color : BORDER}`,
              }}
            >
              <Cmp size={16} strokeWidth={2} />
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or type a Lucide name / emoji"
        className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
        style={{ borderColor: BORDER, color: TEXT_PRIMARY, background: SURFACE }}
      />
    </div>
  );
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

/* ─────────────────────── shared UI primitives ──────────────────────── */
const Label = ({ children, required, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
    {children} {required && <span style={{ color: BRAND_RED }}>*</span>}
  </label>
);

const inputStyle = {
  borderColor: BORDER,
  color: TEXT_PRIMARY,
  background: "white",
};

const TextInput = ({ value, onChange, type = "text", placeholder, autoComplete, onBlur }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    autoComplete={autoComplete}
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
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-slate-100"
            style={{ color: TEXT_MUTED }}
            title="Clear selection"
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          style={{ color: TEXT_MUTED, transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
        />
      </div>
      {open && (
        <div
          className="absolute z-20 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg max-h-60"
          style={{ borderColor: BORDER }}
        >
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
const DepartmentFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canSubmit = isNew ? canCreate : canEdit;

  /* ─── load current entity + lookups ─── */
  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/departments/${uuid}` },
    { skip: !canView || isNew },
  );
  const { data: brandsData } = useGetQuery({ path: "employee/company-brands" }, { skip: !canView });
  const { data: deptsData } = useGetQuery({ path: "employee/departments" }, { skip: !canView });

  const brandOptions = useMemo(
    () => unwrap(brandsData).map((b) => ({ value: b.id, label: b.name })),
    [brandsData],
  );

  const current = data?.data;
  const parentOptions = useMemo(() => {
    const list = unwrap(deptsData).map((d) => ({
      value: d.id,
      label: d.name && !/^[a-z0-9]+([_-][a-z0-9]+)*$/.test(d.name) ? d.name : titleCase(d.slug || d.name || ""),
      id: d.id,
      uuid: d.uuid,
    }));
    if (!isNew && current?.id) {
      return list.filter((o) => o.id !== current.id);
    }
    return list;
  }, [deptsData, isNew, current]);

  /* ─── form state ─── */
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [parentDeptId, setParentDeptId] = useState("");
  const [description, setDescription] = useState("");
  // head_user_id intentionally omitted from v1 — too many users to pick cleanly.
  // const [headUserId, setHeadUserId] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#C90606");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  /* ─── prefill on edit ─── */
  useEffect(() => {
    if (!current) return;
    setSlug(current.slug ?? "");
    setName(current.name ?? "");
    setShortName(current.short_name ?? "");
    setBrandId(current.brand_id ?? "");
    setParentDeptId(current.parent_department_id ?? "");
    setDescription(current.description ?? "");
    setIcon(current.icon ?? "");
    setColor(current.color ?? "#C90606");
    setIsActive(current.is_active ?? true);
    setIsDefault(current.is_default ?? false);
    setSortOrder(current.sort_order ?? 0);
  }, [current]);

  /* ─── mutations ─── */
  const [createDept, { isLoading: isCreating }] = usePostMutation();
  const [updateDept, { isLoading: isUpdating }] = usePatchMutation();

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

    const payload = {
      name: name.trim(),
      short_name: shortName ? shortName.trim() : null,
      brand_id: brandId ? Number(brandId) : null,
      parent_department_id: parentDeptId ? Number(parentDeptId) : null,
      description: description || null,
      icon: icon || null,
      color: color || null,
      is_active: !!isActive,
      is_default: !!isDefault,
      sort_order: sortOrder ? Number(sortOrder) : 0,
    };

    try {
      if (isNew) {
        const finalSlug = (slug && slug.trim()) || slugify(name);
        const res = await createDept({
          path: "employee/departments",
          body: { ...payload, slug: finalSlug },
        }).unwrap();
        showToast(res?.message || "Department created.", "success");
        navigate(HR_DEPARTMENTS);
      } else {
        const res = await updateDept({
          path: `employee/departments/${uuid}`,
          body: payload,
        }).unwrap();
        showToast(res?.message || "Department updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors && Object.values(err.data.errors).flat().join(" · ")) ||
        "Failed to save department.";
      showToast(msg, "error");
    }
  };

  /* ─── early returns ─── */
  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view departments.</span>
        </div>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading department…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load department.{" "}
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
            onClick={() => navigate(HR_DEPARTMENTS)}
            className="flex items-center justify-center"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`,
            }}
            aria-label="Back to departments"
            title="Back to departments"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "New department" : current?.name || "Edit department"}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {isNew
                ? "Create a department to group employees and services."
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
              <TextInput value={name} onChange={setName} placeholder="IT Solutions" onBlur={handleSlugAutofill} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <TextInput value={slug} onChange={setSlug} placeholder="it_solutions" />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Auto-derived from name if left blank. Immutable on edit.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Short name</Label>
              <TextInput value={shortName} onChange={setShortName} placeholder="IT" />
            </div>
          </div>
        </section>

        {/* Org placement */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Placement</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Brand</Label>
              <SearchableSelect
                value={brandId}
                onChange={setBrandId}
                options={brandOptions}
                placeholder="Search or pick a brand…"
                emptyMessage="No brands configured yet."
              />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Optional. Leave empty for cross-brand departments.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Parent department</Label>
              <SearchableSelect
                value={parentDeptId}
                onChange={setParentDeptId}
                options={parentOptions}
                placeholder="Search or pick a parent…"
                emptyMessage="No matching department."
              />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Optional. Use for nested org units.
              </span>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Description</h2>
          <div className="flex flex-col gap-1.5">
            <Label>Internal description</Label>
            <Textarea
              value={description}
              onChange={setDescription}
              placeholder="A short note about what this department covers."
              rows={4}
            />
          </div>
          {/* head_user_id picker intentionally omitted in v1 — users list is unbounded. */}
        </section>

        {/* Visuals + flags */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Visuals &amp; flags</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} color={color || BRAND_RED} />
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
                id="dept_is_active"
                type="checkbox"
                checked={!!isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="dept_is_active" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Active
              </label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="dept_is_default"
                type="checkbox"
                checked={!!isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="dept_is_default" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Default department
              </label>
            </div>
          </div>
        </section>

        {/* Submit row */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(HR_DEPARTMENTS)}
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
            {submitting ? (isNew ? "Creating…" : "Saving…") : (isNew ? "Create department" : "Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentFormPage;
