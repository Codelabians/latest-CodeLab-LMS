import {
  Building2,
  Layers,
  Loader2,
  Package,
  Pencil,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useDeleteMutation,
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../../api/apiSlice";
import Loader from "../../ui/common/LoaderComponent";
import DeleteModal from "../../ui/DeleteModal";
import AddForm from "./components/AddForm";
import Header from "../../ui/Header";
import EditWorkspace from "./components/EditWorkspace";
import Tabs from "../../ui/Tabs";

const ITEMS_PER_PAGE = 8;

const ManageSpaces = () => {
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch categories
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesIsLoading,
  } = useGetQuery({
    path: "/admin/workspace-categories",
  });

  const {
    data: workspaceTypesData,
    error: workspaceTypesError,
    isLoading: workspaceTypesIsLoading,
    refetch,
    isFetching,
  } = useGetQuery({
    path: "/admin/workspace-types",
  });

  const [createWorkspace, { isLoading: isCreating }] = usePostMutation();
  const [updateWorkspace, { isLoading: isUpdating }] = usePutMutation();
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteMutation();

  // Initialize activeTab
  useEffect(() => {
    if (categoriesData?.data?.length > 0) {
      const tabFromUrl = searchParams.get("tab");
      const tabFromStorage = localStorage.getItem("activeWorkspaceTab");
      const validCategory = categoriesData.data.find(
        (cat) => cat.uuid === (tabFromUrl || tabFromStorage),
      );
      const newTab = validCategory
        ? validCategory.uuid
        : categoriesData.data[0].uuid;

      setActiveTab(newTab);
      localStorage.setItem("activeWorkspaceTab", newTab);

      if (!tabFromUrl || !validCategory) {
        setSearchParams({ tab: newTab }, { replace: true });
      }
    }
  }, [categoriesData, searchParams, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (workspaceTypesIsLoading || categoriesIsLoading) return <Loader />;

  if (workspaceTypesError || categoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading data</p>
        </div>
      </div>
    );
  }

  const currentCategory = categoriesData?.data?.find(
    (cat) => cat.uuid === activeTab,
  );

  const currentWorkspaceTypes =
    workspaceTypesData?.data?.filter(
      (workspaceType) => workspaceType?.category?.id === currentCategory?.id,
    ) || [];

  const totalPages = Math.ceil(currentWorkspaceTypes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWorkspaceTypes = currentWorkspaceTypes.slice(
    startIndex,
    endIndex,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWorkspaceTypeClick = (workspaceType) => {
    navigate(`/dashboard/workspaces/${workspaceType.id}`, {
      state: {
        workspaceType,
        categoryName: currentCategory?.name,
      },
    });
  };

  // const handleCreate = async (formData) => {
  //   try {
  //     await createWorkspace({
  //       path: "/admin/workspaces",
  //       body: formData,
  //     }).unwrap();

  //     toast.success("Workspace created successfully!");
  //     await refetch();
  //     setIsAddModalOpen(false);
  //   } catch (error) {
  //     toast.error(error?.data?.message || "Failed to create workspace");
  //   }
  // };

  // const handleUpdate = async (payload) => {
  //   try {
  //     await updateWorkspace({
  //       path: `/admin/workspaces/${payload.uuid}`,
  //       body: payload,
  //     }).unwrap();

  //     toast.success("Workspace updated successfully!");
  //     await refetch();
  //     setIsEditModalOpen(false);
  //     setEditData(null);
  //   } catch (err) {
  //     toast.error(err?.data?.message || "Failed to update workspace");
  //   }
  // };

  // Delete Workspace
  const confirmDelete = async () => {
    try {
      await deleteWorkspace({
        path: `/admin/workspaces/${selectedID}`,
      }).unwrap();

      toast.success("Workspace deleted successfully!");
      await refetch();
      setIsDeleteModalOpen(false);
      setSelectedID(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete workspace");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 mx-auto">
        <Header
          title="Manage Workspaces"
          setIsCreateModalOpen={setIsAddModalOpen}
          sourceComponent="Workspace"
        />

        <Tabs
          items={categoriesData?.data}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          getId={(cat) => cat.uuid}
          getLabel={(cat) => cat.name}
          getCount={null}
          getIcon={() => Building2}
          storageKey="activeWorkspaceTab"
          urlParam="tab"
        />

        {isFetching && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#aa0e0e] animate-spin" />
              <span className="text-gray-700 font-medium">
                Loading workspace types...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedWorkspaceTypes.length > 0 ? (
            paginatedWorkspaceTypes.map((workspaceType) => (
              <div
                key={workspaceType.id}
                onClick={() => handleWorkspaceTypeClick(workspaceType)}
                className="group relative bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 custom-Background rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white text-xs font-bold rounded-full">
                      {workspaceType.category?.name}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#aa0e0e] transition-colors line-clamp-2">
                  {workspaceType.name}
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Total Workspaces
                    </span>
                    <span className="text-lg font-bold text-[#aa0e0e]">
                      {workspaceType.workspaces_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Click to view workspaces →
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
              <Layers className="w-20 h-20 text-[#aa0e0e] mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No workspace types found for {currentCategory?.name}
              </h3>
              <p className="text-gray-600">
                There are currently no workspace types available in this
                category.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <AddForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onsubmit}
        mode="create"
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Workspace"
        message="Are you sure you want to delete this workspace?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setSelectedID(null)}
        successMessage="Workspace deleted successfully!"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageSpaces;
