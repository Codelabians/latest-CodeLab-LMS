import { ArrowLeft, Loader2, Package, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useDeleteMutation,
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../api/apiSlice";
import Loader from "../ui/common/LoaderComponent";
import DeleteModal from "../ui/DeleteModal";
import Header from "../ui/Header";
import Table from "../ui/Table";
import EditWorkspace from "./manageSpaces/components/EditWorkspace";

const columns = ["Name", "price"];

const WorkspaceDetail = () => {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { workspaceType, categoryName } = location.state || {};

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);

  const {
    data: workspacesData,
    error: workspacesError,
    isLoading: workspacesIsLoading,
    refetch,
    isFetching,
  } = useGetQuery({
    path: `/admin/workspaces?type_id=${uuid}`,
  });

  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteMutation();
  const [updateWorkspace, { isLoading: isUpdating }] = usePutMutation();
  const [createWorkspace, { isLoading: isCreating }] = usePostMutation();

  if (workspacesIsLoading) return <Loader />;

  if (workspacesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading workspaces</p>
        </div>
      </div>
    );
  }

  const filteredWorkspaces = workspacesData?.data;

  // const handleDelete = (workspace) => {
  //   setSelectedWorkspace(workspace);
  //   setIsDeleteModalOpen(true);
  // };

  const confirmDelete = async () => {
    try {
      await deleteWorkspace({
        path: `/admin/workspaces/${selectedWorkspace.uuid}`,
      }).unwrap();

      toast.success("Workspace deleted successfully!");
      await refetch();
      setIsDeleteModalOpen(false);
      setSelectedWorkspace(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete workspace");
    }
  };

  const mappedData = filteredWorkspaces.map((workspace) => ({
    uuid: workspace.uuid,
    id: workspace.id,
    type: workspace.type, // Workspace type info
    inventories: workspace.inventories || [], // Array of assigned inventories
    description: workspace.description || "",
    name: workspace.type?.name || "N/A",
    price: `Rs. ${parseFloat(workspace.price || 0).toFixed(2)}`,
  }));

  const handleEdit = (workspace) => {
    setEditData(workspace);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (payload) => {
    try {
      // Use the workspace UUID from editData, not the type UUID from params
      await updateWorkspace({
        path: `/admin/workspaces/update-w/${editData.uuid}`,
        body: payload,
      }).unwrap();

      toast.success("Workspace updated successfully!");
      await refetch();
      setIsEditModalOpen(false);
      setEditData(null);
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.data?.message || "Failed to update workspace");
    }
  };

  // const handleCreate = async (formData) => {
  //   try {
  //     await createWorkspace({
  //       path: "/admin/workspaces",
  //       body: { ...formData, type_uuid: uuid },
  //     }).unwrap();

  //     toast.success("Workspace created successfully!");
  //     await refetch();
  //     setIsAddModalOpen(false);
  //   } catch (error) {
  //     toast.error(error?.data?.message || "Failed to create workspace");
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#aa0e0e] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Workspace Types</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div></div>
            </div>
          </div>
          <Header
            title={workspaceType?.name || "Workspace Details"}
            icon={<Package />}
            showActionButton={false}
          />
        </div>

        {isFetching && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#aa0e0e] animate-spin" />
              <span className="text-gray-700 font-medium">
                Loading workspaces...
              </span>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          data={mappedData}
          setIsEditModalOpen={setIsEditModalOpen}
          handleEditClick={handleEdit}
          setSelectedID={setSelectedID}
        />
      </div>

      <EditWorkspace
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        data={editData}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Workspace"
        message={`Are you sure you want to delete this workspace?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setSelectedWorkspace(null)}
        successMessage="Workspace deleted successfully!"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WorkspaceDetail;
