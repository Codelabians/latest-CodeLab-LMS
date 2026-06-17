// Roles — restyled to match the modern card pages (Banks / Admins & Access).
// Keeps the existing data hooks + Create/Edit + Assign-Permission modals.
import { useState } from "react";
import { Plus, Pencil, ShieldCheck, Loader2, Shield, Trash2, Search } from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation } from "../../../api/apiSlice";
import CreateEditModal from "../components/CreateEditModal";
import AssignPermissionModal from "../components/AssignPermissionModal";
import { toast } from "react-toastify";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BRAND_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#F8FAFC";

const prettyRole = (n) => (n || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const Roles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: rolesResponse, isLoading, isError, refetch: refetchRoles } = useGetQuery({
    path: "core/roles",
    params: { page: 1, per_page: 100 },
  });
  const { data: permissionsResponse } = useGetQuery({ path: "core/permissions" });

  const allRoles = rolesResponse?.data || [];
  const roles = allRoles.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return prettyRole(r.name).toLowerCase().includes(q) || String(r.name || "").toLowerCase().includes(q);
  });
  const permissions = permissionsResponse?.data || [];
  const mappedPermissions = permissions.map((p) => ({ label: `${p.action} ${p.subject}`, value: p.id }));

  const [updateRole, { isLoading: isSubmitting }] = usePatchMutation();
  const [assignPermission, { isLoading: isAssigning }] = usePatchMutation();
  const [createRole] = usePostMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteMutation();
  const [deletingUuid, setDeletingUuid] = useState(null);

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete the "${prettyRole(role.name)}" role? This can't be undone.`)) return;
    setDeletingUuid(role.uuid);
    try {
      const response = await deleteRole({ path: `core/role/${role.uuid}` });
      if (response.error) {
        // 409 = still assigned to users; show the backend's clear message.
        toast.error(response?.error?.data?.message || "Could not delete this role.");
        return;
      }
      toast.success(response?.data?.message || "Role deleted");
      refetchRoles();
    } catch (e) {
      toast.error("Could not delete this role.");
    } finally {
      setDeletingUuid(null);
    }
  };

  const openCreate = () => { setSelectedRole(null); setIsModalOpen(true); };
  const handleEdit = (role) => { setSelectedRole(role); setIsModalOpen(true); };
  const handleAssign = (role) => { setSelectedRole(role); setIsAssignModalOpen(true); };

  const handleSave = async (formData) => {
    try {
      const payload = { name: formData.name, permissions: formData.permissions || [] };
      let response;
      if (selectedRole?.id) {
        response = await updateRole({ path: `core/role/${selectedRole.uuid}`, body: payload });
      } else {
        response = await createRole({ path: "core/role/create", body: payload });
      }
      if (response.error) { toast.error(response?.error?.data?.message || "Failed to save role"); return; }
      toast.success(response?.data?.message || "Role saved");
      setIsModalOpen(false);
      refetchRoles();
    } catch (e) { toast.error(`Failed to ${selectedRole?.id ? "update" : "create"} role`); }
  };

  const handleAssignPermissions = async (permissionIds) => {
    try {
      await assignPermission({ path: `core/role/assign-permission/${selectedRole.uuid}`, body: { permissions: permissionIds } });
      toast.success("Permissions assigned");
      setIsAssignModalOpen(false);
      refetchRoles();
    } catch (e) { toast.error("Failed to assign permissions"); }
  };

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}><Shield size={18} /></div>
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>Roles</h2>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Each role bundles a set of permissions. Assign roles to users on the Admins &amp; Access tab.</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
          <Plus size={15} /> New role
        </button>
      </div>

      <div className="relative mb-4" style={{ maxWidth: 360 }}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
        />
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3" style={{ width: 56 }}>#</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Permissions</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
            {!isLoading && isError && <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px]" style={{ color: BRAND }}>Couldn&apos;t load roles.</td></tr>}
            {!isLoading && !isError && roles.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No roles yet.</td></tr>}
            {!isLoading && !isError && roles.map((role, i) => {
              const perms = role?.permissions || [];
              const shown = perms.slice(0, 6);
              return (
                <tr key={role.uuid || role.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-5 py-3 text-sm" style={{ color: TEXT_MUTED }}>{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{prettyRole(role.name)}</td>
                  <td className="px-5 py-3">
                    {perms.length === 0 ? (
                      <span className="text-[11px]" style={{ color: TEXT_MUTED }}>No permissions</span>
                    ) : (
                      <div className="flex flex-wrap gap-1" style={{ maxWidth: 560 }}>
                        {shown.map((p, idx) => (
                          <span key={idx} className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: "#EEF2FF", color: "#4338CA" }}>{p.subject || p.action}</span>
                        ))}
                        {perms.length > shown.length && <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: SURFACE, color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>+{perms.length - shown.length} more</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => handleAssign(role)} title="Assign permissions" className="inline-flex items-center gap-1 px-2.5 py-1.5 mr-1 text-[11px] font-semibold rounded-md" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><ShieldCheck size={13} /> Permissions</button>
                    <button type="button" onClick={() => handleEdit(role)} title="Edit" className="grid rounded-md w-8 h-8 place-items-center" style={{ color: TEXT_SECONDARY, display: "inline-grid" }}><Pencil size={14} /></button>
                    <button type="button" onClick={() => handleDelete(role)} disabled={isDeleting && deletingUuid === role.uuid} title="Delete role" className="grid rounded-md w-8 h-8 place-items-center" style={{ color: BRAND, display: "inline-grid", opacity: isDeleting && deletingUuid === role.uuid ? 0.5 : 1 }}>{isDeleting && deletingUuid === role.uuid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedRole}
        type="role"
        onSave={handleSave}
        permissions={mappedPermissions}
        isSubmitting={isSubmitting}
      />
      <AssignPermissionModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        role={selectedRole}
        permissions={mappedPermissions}
        onSave={handleAssignPermissions}
        isSubmitting={isAssigning}
      />
    </div>
  );
};

export default Roles;
