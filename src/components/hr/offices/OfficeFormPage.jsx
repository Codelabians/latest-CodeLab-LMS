import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
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
import { HR_OFFICES } from "../../routes/RouteConstants";

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

/* ─────────────────────── office types ──────────────────────────────── */
const OFFICE_TYPES = [
  { value: "hq",          label: "HQ",          color: "#C90606", tint: "#FEF2F2", desc: "Main headquarters." },
  { value: "branch",      label: "Branch",      color: "#1D4ED8", tint: "#EFF6FF", desc: "Regional office." },
  { value: "partner",     label: "Partner",     color: "#B45309", tint: "#FFFBEB", desc: "Shared/partner space (e.g. STP)." },
  { value: "client_site", label: "Client Site", color: "#7E22CE", tint: "#FAF5FF", desc: "On-site at a client location." },
  { value: "remote_only", label: "Remote",      color: "#475569", tint: "#F1F5F9", desc: "Fully remote, no physical address." },
];

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
const OfficeFormPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isNew = !uuid || uuid === "new";

  const canView = hasPermission(user, "get employee");
  const canCreate = hasPermission(user, "create employee");
  const canEdit = hasPermission(user, "update employee");
  const canSubmit = isNew ? canCreate : canEdit;

  const { data, isLoading, isError, refetch } = useGetQuery(
    { path: `employee/offices/${uuid}` },
    { skip: !canView || isNew },
  );
  const { data: brandsData } = useGetQuery({ path: "employee/company-brands" }, { skip: !canView });

  const brandOptions = useMemo(
    () => unwrap(brandsData).map((b) => ({ value: b.id, label: b.name })),
    [brandsData],
  );

  const current = data?.data;

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [type, setType] = useState("branch");
  const [brandId, setBrandId] = useState("");
  const [partnerCompany, setPartnerCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("PK");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#C90606");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!current) return;
    setSlug(current.slug ?? "");
    setName(current.name ?? "");
    setShortName(current.short_name ?? "");
    setType(current.type ?? "branch");
    setBrandId(current.brand_id ?? "");
    setPartnerCompany(current.partner_company ?? "");
    setAddress(current.address ?? "");
    setCity(current.city ?? "");
    setCountry(current.country ?? "PK");
    setContactPhone(current.contact_phone ?? "");
    setContactEmail(current.contact_email ?? "");
    setTimezone(current.timezone ?? "Asia/Karachi");
    setIcon(current.icon ?? "");
    setColor(current.color ?? "#C90606");
    setIsActive(current.is_active ?? true);
    setIsDefault(current.is_default ?? false);
    setSortOrder(current.sort_order ?? 0);
  }, [current]);

  const [createOffice, { isLoading: isCreating }] = usePostMutation();
  const [updateOffice, { isLoading: isUpdating }] = usePatchMutation();

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
    if (!type) {
      showToast("Office type is required.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      short_name: shortName ? shortName.trim() : null,
      type,
      brand_id: brandId ? Number(brandId) : null,
      partner_company: type === "partner" ? (partnerCompany || null) : null,
      address: address || null,
      city: city || null,
      country: country || null,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
      timezone: timezone || null,
      icon: icon || null,
      color: color || null,
      is_active: !!isActive,
      is_default: !!isDefault,
      sort_order: sortOrder ? Number(sortOrder) : 0,
    };

    try {
      if (isNew) {
        const finalSlug = (slug && slug.trim()) || slugify(name);
        const res = await createOffice({
          path: "employee/offices",
          body: { ...payload, slug: finalSlug },
        }).unwrap();
        showToast(res?.message || "Office created.", "success");
        navigate(HR_OFFICES);
      } else {
        const res = await updateOffice({
          path: `employee/offices/${uuid}`,
          body: payload,
        }).unwrap();
        showToast(res?.message || "Office updated.", "success");
        refetch();
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors && Object.values(err.data.errors).flat().join(" · ")) ||
        "Failed to save office.";
      showToast(msg, "error");
    }
  };

  if (!canView) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
          <ShieldCheck size={18} />
          <span>You don&apos;t have permission to view offices.</span>
        </div>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-10 flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading office…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="p-10">
        <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: BRAND_RED }}>
          Could not load office.{" "}
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
            onClick={() => navigate(HR_OFFICES)}
            className="flex items-center justify-center"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}`,
            }}
            aria-label="Back to offices"
            title="Back to offices"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <div
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 14, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Building2 size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: TEXT_PRIMARY }}>
              {isNew ? "New office" : current?.name || "Edit office"}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
              {isNew
                ? "Add a physical or remote location."
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
              <TextInput value={name} onChange={setName} placeholder="Codelab HQ – STP Peshawar" onBlur={handleSlugAutofill} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <TextInput value={slug} onChange={setSlug} placeholder="codelab_hq" />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Auto-derived from name if blank.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Short name</Label>
              <TextInput value={shortName} onChange={setShortName} placeholder="HQ" />
            </div>
          </div>
        </section>

        {/* Type */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Type</h2>
          <p className="mb-4 text-xs" style={{ color: TEXT_MUTED }}>
            Pick the kind of office. Partner offices need a partner company name.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {OFFICE_TYPES.map((t) => {
              const isActiveBtn = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className="flex flex-col items-start text-left px-3 py-2.5 rounded-lg transition"
                  style={{
                    background: isActiveBtn ? t.tint : SURFACE,
                    border: `1.5px solid ${isActiveBtn ? t.color : BORDER}`,
                    color: isActiveBtn ? t.color : TEXT_PRIMARY,
                    boxShadow: isActiveBtn ? `0 0 0 3px ${t.tint}` : "none",
                  }}
                >
                  <span className="text-[12.5px] font-bold">{t.label}</span>
                  <span className="text-[10.5px] mt-0.5" style={{ color: isActiveBtn ? t.color : TEXT_MUTED, lineHeight: 1.4 }}>
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {type === "partner" && (
            <div className="mt-4 flex flex-col gap-1.5">
              <Label>Partner company</Label>
              <TextInput value={partnerCompany} onChange={setPartnerCompany} placeholder="Science & Technology Park (STP)" />
              <span className="text-[10.5px]" style={{ color: TEXT_MUTED }}>
                Name of the host organisation/partner.
              </span>
            </div>
          )}
        </section>

        {/* Brand */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Brand</h2>
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
                Leave empty for cross-brand offices.
              </span>
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Address &amp; contact</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
              <Label>Address</Label>
              <Textarea value={address} onChange={setAddress} placeholder="Street, building, suite…" rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>City</Label>
              <TextInput value={city} onChange={setCity} placeholder="Peshawar" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Country</Label>
              <TextInput value={country} onChange={setCountry} placeholder="PK" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Timezone</Label>
              <TextInput value={timezone} onChange={setTimezone} placeholder="Asia/Karachi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contact phone</Label>
              <TextInput value={contactPhone} onChange={setContactPhone} placeholder="+92 …" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contact email</Label>
              <TextInput value={contactEmail} onChange={setContactEmail} type="email" placeholder="office@codelab.pk" />
            </div>
          </div>
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
                id="off_is_active"
                type="checkbox"
                checked={!!isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="off_is_active" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Active
              </label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="off_is_default"
                type="checkbox"
                checked={!!isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: BRAND_RED }}
              />
              <label htmlFor="off_is_default" className="text-sm" style={{ color: TEXT_SECONDARY }}>
                Default office
              </label>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(HR_OFFICES)}
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
            {submitting ? (isNew ? "Creating…" : "Saving…") : (isNew ? "Create office" : "Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficeFormPage;
