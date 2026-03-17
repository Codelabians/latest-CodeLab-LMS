import {
  Box,
  Package,
  BookOpen,
  Award,
  ChevronRight,
  ArrowLeft,
  Grid,
  Layers,
  FolderOpen,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../api/apiSlice";
import Loader from "../components/ui/common/LoaderComponent";
import { toast } from "react-toastify";
import InventoryItems from "./components/InventoryItems";

// Pagination Component
const Pagination = ({ currentPage, lastPage, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(lastPage, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-all ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg transition-all font-medium ${
            currentPage === page
              ? "bg-brown text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className={`p-2 rounded-lg transition-all ${
          currentPage === lastPage
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Professional Header Component
const Header = ({ title, icon, subtitle }) => (
  <div className="mb-8">
    <div className="flex items-center gap-4 mb-2">
      <div className="p-3 custom-Background  rounded-xl shadow-lg">
        <div className="text-white">{icon}</div>
      </div>
      <div>
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

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
const NavigationCard = ({ item, icon, color, count, onClick, subtitle }) => {
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
            <span className="text-xs text-gray-500">items</span>
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brown transition-colors">
        {item.name}
      </h3>
      {(item.description || subtitle) && (
        <p className="text-gray-600 text-sm leading-relaxed">
          {item.description || subtitle}
        </p>
      )}
      <div className="mt-4 flex items-center text-brown text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        View Details
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

// Type Card with Edit/Delete Actions
const TypeCard = ({ item, icon, color, count, onClick, onEdit, onDelete }) => {
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
      </div>
      <h3 className="text-xl font-bold text-brown mb-2 group-hover:text-brown transition-colors">
        {item.name}
      </h3>
      <div className="mt-4 flex items-center text-brown text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        View Inventory
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

// Create/Edit Type Modal
const TypeModal = ({ isOpen, onClose, onSubmit, initialData, pivotId }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, pivot_id: pivotId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Type" : "Create New Type"}
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter type name"
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialData ? "Update" : "Create"}
            </button>
          </div>
        </div>
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
        className="flex items-center gap-2 px-4 py-2 custom-AddButton text-white rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Type
      </button>
    )}
  </div>
);

const Inventory = () => {
  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [typeSelected, setTypeSelected] = useState(null);
  const [selectedPivotId, setSelectedPivotId] = useState(null);
  const [currentTypesPage, setCurrentTypesPage] = useState(1);

  // Modal state
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useGetQuery({
    path: "/admin/inventory/categories/all",
  });

  // Fetch types based on pivot_id WITH PAGINATION
  const {
    data: typesData,
    isLoading: isTypesLoading,
    refetch: refetchTypes,
  } = useGetQuery({
    path: `/admin/inventory/types/all?pivot_id=${selectedPivotId}&page=${currentTypesPage}`,
    skip: !selectedPivotId,
  });

  // Mutations
  const [createType, { isLoading: isCreating }] = usePostMutation();
  const [updateType, { isLoading: isUpdating }] = usePostMutation();
  const [deleteType] = useDeleteMutation();

  // Professional color palette
  const colors = [
    "#d61111",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Get selected category data
  const getSelectedCategoryData = () => {
    if (!selectedCategory || !categoriesData?.data) return null;
    return categoriesData.data.find((cat) => cat.uuid === selectedCategory);
  };

  // Get subcategories for selected category
  const getSubCategories = () => {
    const categoryData = getSelectedCategoryData();
    return categoryData?.sub_categories || [];
  };

  // Get types for selected subcategory
  const getTypes = () => {
    return typesData?.data || [];
  };

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    const path = [{ name: "Categories", level: 0 }];

    if (selectedCategory) {
      const category = getSelectedCategoryData();
      path.push({ name: category?.name || "Category", level: 1 });
    }

    if (selectedSubCategory) {
      const subCategories = getSubCategories();
      const subCategory = subCategories.find(
        (s) => s.sub_category.sub_category_uuid === selectedSubCategory
      );
      path.push({
        name: subCategory?.sub_category?.name || "SubCategory",
        level: 2,
      });
    }

    if (selectedType) {
      const types = getTypes();
      const type = types.find((t) => t.uuid === selectedType);
      path.push({ name: type?.name || "Type", level: 3 });
    }

    return path;
  };

  // Navigation handlers
  const handleBreadcrumbNavigate = (level) => {
    if (level === 0) {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSelectedType(null);
      setSelectedPivotId(null);
      setCurrentTypesPage(1);
    } else if (level === 1) {
      setSelectedSubCategory(null);
      setSelectedType(null);
      setSelectedPivotId(null);
      setCurrentTypesPage(1);
    } else if (level === 2) {
      setSelectedType(null);
    }
  };

  const handelTypeClick = (item) => {
    setSelectedType(item.uuid);
    setTypeSelected(item);
  };

  const handleBackFromTable = () => {
    setSelectedType(null);
  };

  // Type CRUD handlers
  const handleCreateType = () => {
    setEditingType(null);
    setIsTypeModalOpen(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setIsTypeModalOpen(true);
  };

  const handleDeleteType = async (type) => {
    if (window.confirm(`Are you sure you want to delete "${type.name}"?`)) {
      try {
        await deleteType({
          path: `/admin/inventory/types/${type.uuid}`,
        }).unwrap();
        toast.success("Type deleted successfully!");
        refetchTypes();
      } catch (error) {
        toast.error("Failed to delete type");
        console.error("Failed to delete:", error);
      }
    }
  };

  const handleTypeSubmit = async (formData) => {
    try {
      if (editingType) {
        await updateType({
          path: `/admin/inventory/types/${editingType.uuid}?_method=put`,
          body: formData,
        }).unwrap();
        toast.success("Type updated successfully!");
      } else {
        await createType({
          path: "/admin/inventory/types",
          body: formData,
        }).unwrap();
        toast.success("Type created successfully!");
      }
      setIsTypeModalOpen(false);
      setEditingType(null);
      refetchTypes();
    } catch (error) {
      toast.error("Error saving type");
      console.error("Error saving type:", error);
    }
  };

  // Get current section info
  const getCurrentSectionInfo = () => {
    if (selectedType) {
      const types = getTypes();
      const type = types.find((t) => t.uuid === selectedType);
      return {
        title: "Inventory Table",
        count: type?.inventories?.length || 0,
        icon: <Grid className="w-6 h-6 text-brown" />,
        showAddButton: false,
      };
    }
    if (selectedSubCategory) {
      const pagination = typesData?.meta?.pagination;
      return {
        title: "Item Types",
        count: pagination?.total || 0,
        icon: <Layers className="w-6 h-6 text-brown" />,
        showAddButton: true,
      };
    }
    if (selectedCategory) {
      const subCategories = getSubCategories();
      return {
        title: "Subcategories",
        count: subCategories.length,
        icon: <FolderOpen className="w-6 h-6 text-brown" />,
        showAddButton: false,
      };
    }
    return {
      title: "Main Categories",
      count: categoriesData?.data?.length || 0,
      icon: <Grid className="w-6 h-6 text-brown" />,
      showAddButton: false,
    };
  };

  // Render current view
  const renderCurrentView = () => {
    // Show inventory table when type is selected
    if (selectedType) {
      const types = getTypes();
      const type = types.find((t) => t.uuid === selectedType);
      const inventories = type?.inventories || [];

      return <InventoryItems typeSelected={typeSelected} />;
    }

    const sectionInfo = getCurrentSectionInfo();

    // Show types (level 3) WITH PAGINATION
    if (selectedSubCategory && selectedPivotId) {
      const types = getTypes();
      const pagination = typesData?.meta?.pagination;

      return (
        <div>
          <SectionHeader {...sectionInfo} onAdd={handleCreateType} />
          {isTypesLoading ? (
            <Loader />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {types.map((item, index) => (
                  <TypeCard
                    key={item.uuid}
                    item={item}
                    icon={<Package className="w-6 h-6" />}
                    color="#aa0e0e"
                    count={
                      item.inventories_count || item.inventories?.length || 0
                    }
                    onClick={() => handelTypeClick(item)}
                    onEdit={handleEditType}
                    onDelete={handleDeleteType}
                  />
                ))}
              </div>

              {pagination && (
                <Pagination
                  currentPage={pagination.current_page}
                  lastPage={pagination.last_page}
                  onPageChange={(page) => setCurrentTypesPage(page)}
                />
              )}
            </>
          )}
          {!isTypesLoading && types.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Layers className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Types Available
              </h3>
              <p className="text-gray-500 mb-4">
                There are no types available in this subcategory.
              </p>
              <button
                onClick={handleCreateType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Type
              </button>
            </div>
          )}
        </div>
      );
    }

    // Show subcategories (level 2)
    if (selectedCategory) {
      const subCategories = getSubCategories();
      return (
        <div>
          <SectionHeader {...sectionInfo} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subCategories.map((item, index) => (
              <NavigationCard
                key={item.sub_category.sub_category_uuid}
                item={{
                  name: item.sub_category.name,
                  description: item.sub_category.description,
                }}
                icon={<FolderOpen className="w-8 h-8"/>}
                color={colors[index % colors.length]}
                count={item.types?.length || 0}
                onClick={() => {
                  setSelectedSubCategory(item.sub_category.sub_category_uuid);
                  setSelectedPivotId(item.pivot_id);
                }}
              />
            ))}
          </div>
          {subCategories.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FolderOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Subcategories
              </h3>
              <p className="text-gray-500">
                There are no subcategories available in this category.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Show categories (level 1)
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
              count={item.sub_categories?.length || 0}
              onClick={() => setSelectedCategory(item.uuid)}
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
          subtitle="Organize and track your inventory across all categories"
        />

        {/* Breadcrumb navigation */}
        {(selectedCategory || selectedSubCategory || selectedType) && (
          <Breadcrumb
            path={getBreadcrumbPath()}
            onNavigate={handleBreadcrumbNavigate}
          />
        )}

        {/* Current view */}
        {renderCurrentView()}

        {/* Type Modal */}
        <TypeModal
          isOpen={isTypeModalOpen}
          onClose={() => {
            setIsTypeModalOpen(false);
            setEditingType(null);
          }}
          onSubmit={handleTypeSubmit}
          initialData={editingType}
          pivotId={selectedPivotId}
        />
      </div>
    </div>
  );
};

export default Inventory;
