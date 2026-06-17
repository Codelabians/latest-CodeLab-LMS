import { useState } from "react";
import { Loader2, Plus, Star, Trash2, Phone, X } from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../../../api/apiSlice";
import { showToast } from "../../../ui/common/ShowToast";

/* tokens (mirror EmployeeDetailPage) */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const inputCls =
  "w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2";

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const EmergencyContactsTab = ({ profile, refetch: refetchParent }) => {
  const {
    data,
    isFetching,
    refetch,
  } = useGetQuery({ path: `employee/profiles/${profile.uuid}/emergency-contacts` });

  const list = unwrap(data);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relation: "",
    phone: "",
    phone_alt: "",
    address: "",
    is_primary: false,
  });

  const [createContact, { isLoading: creating }] = usePostMutation();
  const [setPrimary, { isLoading: settingPrimary }] = usePostMutation();
  const [removeContact, { isLoading: removing }] = useDeleteMutation();

  const reset = () => {
    setForm({ name: "", relation: "", phone: "", phone_alt: "", address: "", is_primary: false });
    setAddOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      showToast("Name and phone are required.", "error");
      return;
    }
    try {
      await createContact({
        path: `employee/profiles/${profile.uuid}/emergency-contacts`,
        body: form,
      }).unwrap();
      showToast("Emergency contact added", "success");
      reset();
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not add contact.", "error");
    }
  };

  const handleSetPrimary = async (uuid) => {
    try {
      await setPrimary({
        path: `employee/emergency-contacts/${uuid}/set-primary`,
        body: {},
      }).unwrap();
      showToast("Primary contact updated", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not set primary.", "error");
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm("Delete this emergency contact?")) return;
    try {
      await removeContact({ path: `employee/emergency-contacts/${uuid}` }).unwrap();
      showToast("Contact deleted", "success");
      refetch();
      refetchParent?.();
    } catch (err) {
      showToast(err?.data?.message || "Could not delete.", "error");
    }
  };

  return (
    <div className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            Emergency contacts
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            People to reach if something happens to this employee.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
          style={{ background: BRAND_RED }}
        >
          {addOpen ? <X size={12} /> : <Plus size={12} />}
          {addOpen ? "Cancel" : "Add contact"}
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 p-4 mb-4 border rounded-lg md:grid-cols-2"
          style={{ borderColor: BORDER, background: SURFACE_ALT }}
        >
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Name *
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Relation
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              placeholder="e.g. Father, Spouse, Sibling"
              value={form.relation}
              onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Phone *
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Alternate phone
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.phone_alt}
              onChange={(e) => setForm((f) => ({ ...f, phone_alt: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Address
            </label>
            <input
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-xs md:col-span-2" style={{ color: TEXT_SECONDARY }}>
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
            />
            Mark as primary contact
          </label>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 text-xs border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
              style={{ background: BRAND_RED }}
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Save contact
            </button>
          </div>
        </form>
      )}

      {isFetching && !list.length ? (
        <div className="py-8 text-center text-xs" style={{ color: TEXT_MUTED }}>
          <Loader2 size={14} className="inline mr-2 animate-spin" /> Loading contacts…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: TEXT_MUTED }}>
          No emergency contacts yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c.uuid}
              className="flex items-start justify-between gap-3 px-4 py-3 border rounded-md"
              style={{ borderColor: BORDER, background: SURFACE_ALT }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                    {c.name}
                  </span>
                  {c.relation && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full"
                      style={{ color: TEXT_SECONDARY, background: "#F1F5F9" }}
                    >
                      {c.relation}
                    </span>
                  )}
                  {c.is_primary && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ color: "#CA8A04", background: "#FEFCE8" }}
                    >
                      <Star size={10} /> Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1 hover:underline"
                      style={{ color: BRAND_RED }}
                    >
                      <Phone size={11} /> {c.phone}
                    </a>
                  )}
                  {c.phone_alt && (
                    <span style={{ color: TEXT_MUTED }}>alt: {c.phone_alt}</span>
                  )}
                </div>
                {c.address && (
                  <div
                    className="mt-1 text-xs truncate"
                    style={{ color: TEXT_MUTED, maxWidth: 560 }}
                    title={c.address}
                  >
                    {c.address}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!c.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(c.uuid)}
                    disabled={settingPrimary}
                    className="px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                    style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(c.uuid)}
                  disabled={removing}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                  style={{ borderColor: "#FECACA", color: BRAND_RED, background: BRAND_RED_TINT }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmergencyContactsTab;
