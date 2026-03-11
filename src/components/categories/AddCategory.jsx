import { X } from "lucide-react";

const AddCategory = ({
  isOpen,
  onClose,
  categoryName,
  setCategoryName,
  onSubmit,
  loading,
  isEdit,
  nameError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 custom-Background rounded-t-xl">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? "Edit Category" : "Add New Category"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block text-sm font-semibold mb-2">
            Category Name
          </label>

          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
              nameError ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter category name"
          />

          {/* 🔴 Error Message */}
          {nameError && (
            <p className="text-red-500 text-sm mt-2">
              {nameError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg custom-Background text-white disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update"
              : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
