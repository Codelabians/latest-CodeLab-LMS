import {
  BookOpen,
  Box,
  ChevronRight,
  Grid,
  Package,
  Plus,
  Tag,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useDeleteMutation,
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../api/apiSlice";
import Loader from "../components/ui/common/LoaderComponent";
import DeleteModal from "../components/ui/DeleteModal";
import Table from "../components/ui/Table";
import UpdateAssignInventory from "./UpdateAssignInventory";

// Professional Header Component
const Header = ({ title, icon, subtitle }) => (
  <div className="mb-8">
    <div className="flex items-center gap-4 mb-2">
      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
        <div className="text-white">{icon}</div>
      </div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// Add Space Modal Component
const AddSpaceModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim() });
      setName("");
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Space</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Space Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter space name"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg hover:from-[#31918D] hover:to-[#014376] transition-all disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Professional Breadcrumb Component
const Breadcrumb = ({ path, onNavigate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center gap-2 text-sm">
        {path.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <button
              onClick={() => onNavigate(index)}
              className={`px-3 py-1 rounded-lg transition-all ${
                index === path.length - 1
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Professional Card Component
const NavigationCard = ({ item, icon, color, count, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
          style={{
            backgroundColor: `${color}15`,
            border: `2px solid ${color}30`,
          }}
        >
          <div style={{ color: color }}>{icon}</div>
        </div>
        {count !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <span
              className="px-4 py-1.5 rounded-lg text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {count}
            </span>
            <span className="text-xs text-gray-500">spaces</span>
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {item.name}
      </h3>
      {item.description && (
        <p className="text-gray-600 text-sm leading-relaxed">
          {item.description}
        </p>
      )}
      <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        View Spaces
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ title, count, icon, onAdd, showAddButton }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{count} items available</p>
      </div>
    </div>
    {showAddButton && (
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg hover:from-[#31918D] hover:to-[#014376] transition-all shadow-md"
      >
        <Plus className="w-5 h-5" />
        Add Space
      </button>
    )}
  </div>
);

const AssignInventory = () => {
  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedID, setSelectedID] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGetQuery({
    path: "/admin/inventory/categories/all",
  });

  // Fetch spaces based on selected category with pagination
  const {
    data: spacesData,
    isLoading: isSpacesLoading,
    refetch: refetchSpaces,
  } = useGetQuery({
    path: `/admin/spaces?category_id=${selectedCategory}&page=${page}&per_page=${perPage}`,
    skip: !selectedCategory,
  });

  // Mutations
  const [updateSpace] = usePutMutation();
  const [deleteSpace, { isLoading: isDeleting }] = useDeleteMutation();
  const [createSpace, { isLoading: isCreating }] = usePostMutation();

  // Professional color palette
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Inventory Tags Component
  const InventoryTags = ({ inventories }) => {
    if (!inventories || inventories.length === 0) {
      return (
        <span className="text-gray-400 text-sm italic">
          No inventories assigned
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {Array.from(
          { length: Math.ceil(inventories.length / 10) },
          (_, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-2">
              {inventories
                .slice(rowIndex * 7, (rowIndex + 1) * 7)
                .map((inventory) => (
                  <div
                    key={inventory.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Tag size={14} />
                    <span>{inventory.tag}</span>
                    {inventory.serial_number && (
                      <span className="text-blue-500 text-xs">
                        • {inventory.serial_number}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          ),
        )}
      </div>
    );
  };

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    const path = [{ name: "Categories", level: 0 }];

    if (selectedCategory) {
      path.push({
        name: selectedCategoryData?.name || "Category",
        level: 1,
      });
    }

    return path;
  };

  // Navigation handlers
  const handleBreadcrumbNavigate = (level) => {
    if (level === 0) {
      setSelectedCategory(null);
      setSelectedCategoryData(null);
      setPage(1);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    setSelectedCategoryData(category);
    setPage(1);
  };

  // Table columns
  const columns = ["Name", "Inventories"];

  // Map space data for table
  const mappedData =
    spacesData?.data?.map((space) => ({
      id: space.id,
      name: space?.name || "N/A",
      inventories: <InventoryTags inventories={space.inventories} />,
      _rawInventories: space.inventories || [],
    })) || [];

  // Edit handler
  const handleEdit = (space) => {
    setEditData(space);
    setIsEditModalOpen(true);
  };

  // Update handler
  const handleUpdate = async (payload) => {
    try {
      await updateSpace({
        path: `/admin/spaces/update-space/${editData.id}`,
        body: payload,
      }).unwrap();

      toast.success("Space updated successfully!");
      await refetchSpaces();
      setIsEditModalOpen(false);
      setEditData(null);
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.data?.message || "Failed to update space");
    }
  };

  // Delete handler
  const handleDelete = (space) => {
    setSelectedWorkspace(space);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSpace({
        path: `/admin/spaces/${selectedWorkspace.id}`,
      }).unwrap();

      toast.success("Space deleted successfully!");
      await refetchSpaces();
      setIsDeleteModalOpen(false);
      setSelectedWorkspace(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete space");
    }
  };

  // Add Space handler
  const handleAddSpace = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateSpace = async (formData) => {
    try {
      await createSpace({
        path: "/admin/spaces/create/space",
        body: {
          name: formData.name,
          category_id: selectedCategory,
        },
      }).unwrap();

      toast.success("Space created successfully!");
      await refetchSpaces();
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create space");
    }
  };

  // Get current section info
  const getCurrentSectionInfo = () => {
    if (selectedCategory) {
      return {
        title: `${selectedCategoryData?.name || "Category"} Spaces`,
        count: spacesData?.meta?.pagination?.total || 0,
        icon: <Grid className="w-6 h-6 text-blue-600" />,
      };
    }
    return {
      title: "Main Categories",
      count: categoriesData?.data?.length || 0,
      icon: <Grid className="w-6 h-6 text-blue-600" />,
    };
  };

  // Render current view
  const renderCurrentView = () => {
    const sectionInfo = getCurrentSectionInfo();

    // Show space table when category is selected
    if (selectedCategory) {
      return (
        <div>
          <SectionHeader
            {...sectionInfo}
            onAdd={handleAddSpace}
            showAddButton={true}
          />
          {isSpacesLoading ? (
            <Loader />
          ) : (
            <>
              {mappedData.length > 0 ? (
                <Table
                  columns={columns}
                  data={mappedData}
                  setIsEditModalOpen={setIsEditModalOpen}
                  handleEditClick={handleEdit}
                  setSelectedID={setSelectedID}
                  setPage={setPage}
                  setPer_page={setPerPage}
                  paginationMeta={spacesData?.meta?.pagination}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Spaces
                  </h3>
                  <p className="text-gray-500">
                    There are no spaces available in this category.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // Show categories (default view)
    return (
      <div>
        <SectionHeader {...sectionInfo} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesData?.data?.map((item, index) => (
            <NavigationCard
              key={item.uuid}
              item={item}
              icon={<BookOpen className="w-8 h-8" />}
              color={colors[index % colors.length]}
              count={item.spaces || 0}
              onClick={() => handleCategoryClick(item)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isCategoriesLoading) {
    return <Loader />;
  }

  if (isCategoriesError) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading categories
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-11/12 mx-auto py-8">
        <Header
          title="Inventory Management"
          icon={<Box className="w-8 h-8" />}
          subtitle="Organize and manage your inventory across all categories"
        />

        {selectedCategory && (
          <Breadcrumb
            path={getBreadcrumbPath()}
            onNavigate={handleBreadcrumbNavigate}
          />
        )}

        {renderCurrentView()}

        <UpdateAssignInventory
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditData(null);
          }}
          onSubmit={handleUpdate}
          data={editData}
          category_id={selectedCategory}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          setIsOpen={setIsDeleteModalOpen}
          title="Delete Space"
          message="Are you sure you want to delete this space?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onClose={() => setSelectedWorkspace(null)}
          successMessage="Space deleted successfully!"
          isLoading={isDeleting}
        />

        <AddSpaceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateSpace}
          isLoading={isCreating}
        />
      </div>
    </div>
  );
};

export default AssignInventory;
