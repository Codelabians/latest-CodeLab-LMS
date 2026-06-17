import React, { useState } from "react";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { Edit2, Plus, Trash2 } from "lucide-react";
import CreateEditModal from "../components/CreateEditModal";
import Table from "../../ui/Table";
import Header from "../../ui/Header";
import { toast } from "react-toastify";
import Loader from "../../ui/common/LoaderComponent";

const columns = ["Action", "Subject"];

const Permissions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const {
    data: permissionsResponse,
    isLoading,
    isError,
    refetch: refetchPermissions,
  } = useGetQuery({
    path: "core/permissions",
    params: { page: currentPage, per_page: itemsPerPage },
  });

  const meta = permissionsResponse?.meta?.pagination;
  const [createPermission, { isLoading: isSubmitting }] = usePostMutation();
  const permissions = permissionsResponse?.data || [];

  const handleCreate = () => {
    setSelectedPermission(null);
    setIsModalOpen(true);
  };

  // FIX: Pass the original permission object
  const handleEdit = (permission) => {
    // Find the original permission from the permissions array
    const originalPermission = permissions.find((p) => p.id === permission.id);
    setSelectedPermission(originalPermission);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      const endpoint = selectedPermission?.id
        ? `core/permission/${selectedPermission.id}`
        : "core/permission/create";

      const response = await createPermission({
        path: endpoint,
        body: { name: formData.name },
      }).unwrap();

      toast.success(
        selectedPermission?.id ? "Permission Updated" : "Permission Created",
      );
      setIsModalOpen(false);
      refetchPermissions();
    } catch (error) {
      console.error("Failed to save permission:", error);
      toast.error(
        `Failed to ${selectedPermission?.id ? "update" : "create"} permission`,
      );
    }
  };

  // FIX: Include the id in mapped permissions
  const mappedPermissions = permissions?.map((permission) => ({
    id: permission.id,
    action: permission?.action,
    subject: permission.subject,
  }));

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Permissions" setIsCreateModalOpen={setIsModalOpen} />
      {isLoading && <Loader />}

      {isError && (
        <div className="text-red-600 text-center py-8">
          Error loading students
        </div>
      )}

      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedPermissions}
          setIsEditModalOpen={setIsModalOpen}
          handleEditClick={handleEdit}
          paginationMeta={meta}
          setPage={setCurrentPage}
          setPer_page={setItemsPerPage}
        />
      )}

      <CreateEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedPermission}
        type="permission"
        onSave={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Permissions;
