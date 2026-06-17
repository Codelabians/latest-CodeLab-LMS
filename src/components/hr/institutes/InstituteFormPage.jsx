import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  GraduationCap,
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
import { HR_INSTITUTES } from "../../routes/RouteConstants";

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

const InstituteFormPage = () => {
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
  const [type, setType] = useState("university");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  /* edit-mode prefill */
  const { data: rowData } = useGetQuery(
    { path: `employee/institutes/${uuid}` },
    { skip: !isEdit },
  );

  useEffect(() => {
    if (!isEdit) return;
    const row = rowData?.data;
    if (!row) return;
    setName(row.name || "");
    setSlug(row.slug || "");
    setType(row.type || "university");
    setCity(row.city || "");
    setCountry(row.country || "Pakistan");
    setWebsite(row.website || "");
    setNotes(row.notes || "");
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
          You don&apos;t have permission to {isEdit ? "edit" : "create"} institutes.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      showToast("Institute name is required.", "error");
      return;
    }

    const body = {
      name: name.trim(),
      slug: slug ? slug.trim() : undefined,
      type,
      city: city ? city.trim() : null,
      country: country ? country.trim() : null,
      website: website ? website.trim() : null,
      notes: notes ? notes.trim() : null,
      is_active: isActive,
      sort_order: Number(sortOrder) || 0,
    };

    try {
      if (isEdit) {
        await patchRow({ path: `employee/institutes/${uuid}`, body }).unwrap();
        showToast("Institute updated.", "success");
      } else {
        await createRow({ path: "employee/institutes", body }).unwrap();
        showToast("Institute created.", "success");
      }
      navigate(HR_INSTITUTES);
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
          onClick={() => navigate(HR_INSTITUTES)}
          className="p-2 rounded-md hover:bg-slate-100"
          style={{ color: TEXT_SECONDARY }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{isEdit ? "Edit institute" : "New institute"}</h1>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            Add a university, college, school or training institute that employees / students can be linked to.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Identity</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <TextField label="Name" required value={name} onChange={setName} placeholder="e.g. University of the Punjab" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label required>Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              >
                <option value="university">University</option>
                <option value="college">College</option>
                <option value="school">School</option>
                <option value="institute">Institute / Training centre</option>
              </select>
            </div>
            <TextField label="Slug" value={slug} onChange={setSlug} placeholder="auto-generated if blank" />
          </div>
        </section>

        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Location & web</h2>
          <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
            City helps disambiguate when the same name appears in multiple places
            (e.g. UET Lahore vs UET Taxila).
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField label="City" value={city} onChange={setCity} placeholder="Lahore" />
            <TextField label="Country" value={country} onChange={setCountry} placeholder="Pakistan" />
            <TextField label="Website" value={website} onChange={setWebsite} placeholder="https://example.edu.pk" />
          </div>
        </section>

        <section className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
          <h2 className="mb-4 text-sm font-semibold">Notes & status</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional — Public/Private, HEC ranking, programmes offered, etc."
                className="px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-red-100"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  Active — show in form pickers
                </label>
              </div>
              <TextField label="Sort order" type="number" value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(HR_INSTITUTES)}
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create institute"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstituteFormPage;
