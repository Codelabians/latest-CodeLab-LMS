// ============================================
// ROLES COMPONENT - FIXED
// ============================================
import { useState } from "react";
import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../api/apiSlice";
import CreateEditModal from "../components/CreateEditModal";
import AssignPermissionModal from "../components/AssignPermissionModal";
import Table from "../../ui/Table";
import Header from "../../ui/Header";
import { toast } from "react-toastify";
import Loader from "../../ui/common/LoaderComponent";

const columns = ["Name", "Permissions"];

const Roles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    data: rolesResponse,
    isLoading,
    isError,
    refetch: refetchRoles,
  } = useGetQuery({
    path: "admin/roles",
    params: { page: currentPage, per_page: itemsPerPage },
  });

  const { data: permissionsResponse } = useGetQuery({
    path: "admin/permissions",
  });
  const roles = rolesResponse?.data || [];
  const permissions = permissionsResponse?.data || [];

  const [updateRole, { isLoading: isSubmitting }] = usePatchMutation();
  const [assignPermission, { isLoading: isAssigning }] = usePatchMutation();
  const [createRole] = usePostMutation();

  const mappedPermissions = permissions.map((p) => ({
    label: `${p.action} ${p.subject}`,
    value: p.id,
  }));

  const meta = rolesResponse?.meta?.pagination;

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
    setIsModalOpen(false);
  };

  // FIX: Pass the original role object, not the mapped one
  const handleEdit = (role) => {
    // Find the original role from the roles array
    const originalRole = roles.find((r) => r.id === role.id);
    setSelectedRole(originalRole);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        permissions: formData.permissions || [],
      };

      let response;

      if (selectedRole?.id) {
        // UPDATE: Use PATCH mutation
        response = await updateRole({
          path: `admin/role/${selectedRole.uuid}`,
          body: payload,
        });
        if (response.error) {
          toast.error(response?.error?.data?.message);
        } else {
          toast.success(response?.data?.message || "Role Updated");
          setIsModalOpen(false);
          refetchRoles();
        }
      } else {
        // CREATE: Use POST mutation
        response = await createRole({
          path: "admin/role/create",
          body: payload,
        });
        if (response.error) {
          toast.error(response?.error?.data?.message);
        } else {
          toast.success(response?.data?.message);
          setIsModalOpen(false);
          refetchRoles();
        }
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error(`Failed to ${selectedRole?.id ? "update" : "create"} role`);
    }
  };
  const handleAssign = (role) => {
    const originalRole = roles.find((r) => r.id === role.id);
    setSelectedRole(originalRole);
    setIsAssignModalOpen(true);
  };
  const handleAssignPermissions = async (permissionIds) => {
    // New handler
    try {
      await assignPermission({
        path: `admin/role/assign-permission/${selectedRole.uuid}`,
        body: { permissions: permissionIds },
      });

      toast.success("Permissions assigned successfully");
      setIsAssignModalOpen(false);
      refetchRoles();
    } catch (error) {
      console.error("Error assigning permissions:", error);
      toast.error("Failed to  permissions");
    }
  };

  const mappedRoles = roles?.map((role) => ({
    id: role.id,
    uuid: role.uuid,
    name: role.name,
    permissions: role?.permissions?.length ? (
      <div className="w-[48rem] flex gap-3 overflow-auto justify-center  ">
        {role.permissions.map((p, index) => (
          <span
            key={index}
            style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#e0e7ff",
              color: "#4338ca",
              borderRadius: "16px",
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            {p.subject}
          </span>
        ))}
      </div>
    ) : (
      ""
    ),
  }));
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Roles" setIsCreateModalOpen={setIsModalOpen} />

      {isLoading && <Loader />}

      {isError && (
        <div className="text-red-600 text-center py-8">Error loading Roles</div>
      )}

      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedRoles}
          setIsEditModalOpen={setIsModalOpen}
          setSelectedID={setSelectedRole}
          handleEditClick={handleEdit}
          paginationMeta={meta}
          setPage={setCurrentPage}
          setPer_page={setItemsPerPage}
          sourceComponent="RolesComponent"
          handleAssignClick={handleAssign}
        />
      )}

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={handleCreate}
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
