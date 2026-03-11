// export default IncomeCategoriesSystem;
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  DollarSign,
  Briefcase,
  TrendingUp,
  PiggyBank,
  Calendar,
  FileText,
  Gift,
  Building,
  Book,
} from "lucide-react";
import {
  useGetQuery,
  usePostMutation,
  useDeleteMutation,
} from "../../api/apiSlice";
import Header from "../ui/Header";
import Table from "../ui/Table";
import Loader from "../ui/common/LoaderComponent";
import BatchTabs from "../ui/BatchTabs";

const columns = ["Amount", "Date", "Description"];
const tabs = [
  { id: "all", label: "All", param: null },
  { id: "military", label: "Military", param: 0 },
  { id: "civilian", label: "Civilian", param: 1 },
];

// Category Card Component
const CategoryCard = ({ category, onClick }) => {
  const getCategoryIcon = (key) => {
    const icons = {
      salary: Briefcase,
      business: Building,
      investment: TrendingUp,
      freelance: Book,
      rental: Building,
      bonus: Gift,
      other: PiggyBank,
    };
    return icons[key] || DollarSign;
  };

  const getGradientColor = (key) => {
    const gradients = {
      salary: "from-emerald-500 to-emerald-600",
      business: "from-blue-500 to-blue-600",
      investment: "from-purple-500 to-purple-600",
      freelance: "from-orange-500 to-orange-600",
      rental: "from-cyan-500 to-cyan-600",
      bonus: "from-pink-500 to-pink-600",
      other: "from-indigo-500 to-indigo-600",
    };
    return gradients[key] || "from-green-500 to-green-600";
  };

  const Icon = getCategoryIcon(category.key);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer p-6 border border-gray-100 hover:border-transparent overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientColor(
          category.key,
        )} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>

      <div className="relative">
        <div
          className={`w-14 h-14 bg-gradient-to-br ${getGradientColor(
            category.key,
          )} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <h1 className="w-7 h-7 text-white">PKR</h1>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-gray-900">
          {category.name}
        </h3>
        <p className="text-sm text-gray-500 capitalize flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          {category.type}
        </p>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
        </div>
      </div>
    </div>
  );
};

// Add Income Modal
const AddIncomeModal = ({
  isOpen,
  onClose,
  onSubmit,
  categoryId,
  categoryName,
  income,
}) => {
  const isEditMode = !!income;

  const [formData, setFormData] = useState({
    amount: "",
    transaction_date: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && income) {
        setFormData({
          amount: income.amount?.toString() || "",
          transaction_date: income.date || "",
          description: income.description || "",
        });
      } else {
        setFormData({
          amount: "",
          transaction_date: "",
          description: "",
        });
      }
    }
  }, [isOpen, income, isEditMode]);

  const handleSubmit = () => {
    const data = {
      category_id: categoryId,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      description: formData.description,
    };

    // Pass the income ID if editing
    if (isEditMode) {
      data.id = income.id;
    }

    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Income" : "Add New Income"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode
                ? "Update income details"
                : "Fill in the income details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={categoryName}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 font-medium">
                PKR
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Transaction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              rows="3"
              placeholder="Add notes about this income..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.transaction_date}
              className="flex-1 px-6 py-3 custom-Background text-white rounded-lg font-medium shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {isEditMode ? "Update Income" : "Add Income"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl transform transition-all">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-8">
            This action cannot be undone. Are you sure you want to proceed?
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IncomeTable = ({ categoryId, categoryName, onBack }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState("all");

  const [activeBatchTab, setActiveBatchTab] = useState("all");

  const activeTabParam = tabs.find((t) => t.id === activeTab)?.param;

  const {
    data: incomeData,
    isLoading,
    isError,
    refetch,
  } = useGetQuery({
    path: `/admin/finance`,
    params: {
      category_id: categoryId,
      page: currentPage,
      per_page: itemsPerPage,
      ...(activeTab !== "all" && { is_civilian: activeTabParam }),
      ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }),
    },
  });

  useEffect(() => {
    refetch();
  }, [currentPage, itemsPerPage, refetch]);

  const mappedIncomes = incomeData?.data?.data?.map((income) => ({
    uuid: income.finance_uuid,
    amount: income.amount,
    date: income.transaction_date,
    description: income.description,
  }));

  const paginationMeta = incomeData?.meta?.pagination;

  const [createIncome] = usePostMutation();
  const [updateIncome] = usePostMutation();
  const [deleteIncome] = useDeleteMutation();

  const incomes = incomeData?.data?.data || [];

  const handleAddIncome = async (formData) => {
    try {
      await createIncome({
        path: "/admin/finance/create",
        body: formData,
      }).unwrap();

      refetch();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error creating income:", error);
    }
  };

  const handleDeleteIncome = async () => {
    try {
      await deleteIncome({
        path: `/admin/finance/${selectedIncomeId}`,
        body: {},
      }).unwrap();

      refetch();
      setIsDeleteModalOpen(false);
      setSelectedIncomeId(null);
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const handleEditClick = (income) => {
    setSelectedIncome(income);
    setIsEditModalOpen(true);
  };

  const handleUpdateIncome = async (formData) => {
    try {
      await updateIncome({
        path: `/admin/finance/update/${selectedIncome.uuid}?_method=PATCH`,
        body: formData,
      }).unwrap();

      refetch();
      setIsEditModalOpen(false);
      setSelectedIncome(null);
    } catch (error) {
      console.error("Error updating income:", error);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
      <Header
        title={categoryName + " Income Records"}
        setIsCreateModalOpen={setIsAddModalOpen}
      />

      {categoryName === "Courses" && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {/* {studentsData?.meta?.total && activeTab === tab.id && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {studentsData.meta.total}
              </span>
            )} */}
            </button>
          ))}
        </div>
      )}

      {isLoading && <Loader />}
      {isError && (
        <div className="text-red-600 text-center py-8">
          Error loading students
        </div>
      )}
      <BatchTabs
        activeBatchTab={activeBatchTab}
        setActiveBatchTab={setActiveBatchTab}
      />
      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedIncomes}
          setPage={setCurrentPage}
          setPer_page={setItemsPerPage}
          paginationMeta={paginationMeta}
          setIsEditModalOpen={setIsEditModalOpen}
          setSelectedIncome={setSelectedIncome}
          selectedIncome={selectedIncome}
          handleEditClick={handleEditClick}
          setSelectedID={setSelectedIncomeId}
        />
      )}
      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddIncome}
        categoryId={categoryId}
        categoryName={categoryName}
      />

      <AddIncomeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        categoryName={categoryName}
        income={selectedIncome}
        onSubmit={handleUpdateIncome}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedIncomeId(null);
        }}
        onConfirm={handleDeleteIncome}
        title="Delete Income"
      />
    </div>
  );
};

// Main Component
const IncomeCategoriesSystem = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const {
    data: categories,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/finance/categories/income",
  });

  if (selectedCategory) {
    return (
      <div className="w-11/12 mx-auto py-8">
        <IncomeTable
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          onBack={() => setSelectedCategory(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-11/12 mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Income Categories
        </h1>
        <p className="text-gray-600">
          Select a category to view and manage income
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-600">
          Error loading categories. Please try again.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories?.data?.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomeCategoriesSystem;
