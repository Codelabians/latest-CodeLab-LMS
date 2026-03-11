/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { X, Receipt, DollarSign, Tag, FileText, Image, Upload } from "lucide-react";

const ExpenseModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  isEdit = false, // ✅ new prop
  onSubmit,       // ✅ pass handler from parent
  categories = ["Bills", "Salary", "Stationery", "Electricity", "Internet Services", "Others"],
}) => {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    note: "",
    receiptImage: null,
  });

  // ✅ Prefill when expense is available
  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title || "",
        amount: expense.amount || "",
        category: expense.category || "",
        note: expense.note || "",
        receiptImage: null, // keep null unless user uploads new
      });
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({
        ...prev,
        receiptImage: file,
      }));
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData, expense.uuid); // ✅ send uuid too
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 custom-Background">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-semibold text-white">
                {isEdit ? "Edit Expense" : expense.title}
              </h3>
              <p className="text-sm text-gray-300">
                {isEdit ? "Update expense details" : "Expense Details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 transition-colors duration-200 rounded-lg hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isEdit ? (
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              {/* Amount */}
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              {/* Category */}
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Upload New Receipt */}
              <div
                className="p-6 text-center border-2 border-dashed rounded-lg cursor-pointer"
                onClick={() => document.getElementById("editReceiptUpload").click()}
              >
                <input
                  id="editReceiptUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                {formData.receiptImage ? (
                  <p className="text-sm text-green-600">{formData.receiptImage.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Upload new receipt (optional)</p>
                )}
              </div>

              {/* Note */}
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Note"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          ) : (
            <>
              {/* ✅ Same as your existing detail view */}
              <div className="flex items-center justify-between p-4 mb-6 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-green-600">{expense.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-brown">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">{expense.category}</span>
                </div>
              </div>

              {/* Receipt Image */}
              {expense.receipt_image && (
                <div className="mb-6">
                  <img src={expense.receipt_image} alt="Expense Receipt" className="object-cover w-full h-64 rounded-lg" />
                </div>
              )}

              {/* Note */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-700">{expense.note || "No notes"}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          {isEdit ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 font-medium text-white rounded-lg custom-AddButton "
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 font-medium text-white bg-[#E2E1E1] rounded-lg custom-ActionBtn"
            >
              Close
            </button>
          )}s
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
