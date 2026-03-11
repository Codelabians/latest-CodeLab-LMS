import React, { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

const AddExpense = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title ,
  type,
  categories = ["Bills", "Salary", "Stationary", "Electricity", "Internet Services", "Others"]
}) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    detail: '',
    receiptImage: null
  });

  const [dragActive, setDragActive] = useState(false);
  const modalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({
        ...prev,
        receiptImage: file
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (formData.title && formData.amount && formData.category) {
      onSubmit(formData);
      resetForm();
      onClose();
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      detail: '',
      receiptImage: null
    });
  };

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 ">
          <div></div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="p-6 space-y-4 rounded-lg">
            {/* Title Input */}
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Title"
              className="w-full px-3 py-2 placeholder-gray-500 bg-transparent border rounded-lg border-lightGray focus:outline-none"
              required
            />

            {/* Amount Input */}
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Amount"
              className="w-full px-3 py-2 placeholder-gray-500 bg-transparent border rounded-lg border-lightGray focus:outline-none"
              required
            />

            {/* Category Select */}
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 placeholder-gray-500 bg-transparent border rounded-lg border-lightGray focus:outline-none appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-no-repeat bg-right-1"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category, index) => (
                <option key={index} value={category} className="text-gray-900">
                  {category}
                </option>
              ))}
            </select>

            {/* Receipt Image Upload */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('receiptUpload').click()}
            >
              <input
                id="receiptUpload"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              {formData.receiptImage ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-lg">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">{formData.receiptImage.name}</p>
                  <p className="text-xs text-green-600">File uploaded successfully</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-lg">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Receipt Image</p>
                  <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
                </div>
              )}
            </div>

            {/* Detail Textarea */}
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleInputChange}
              placeholder="Detail"
              rows={4}
              className="w-full px-3 py-2 placeholder-gray-500 bg-transparent border rounded-lg border-lightGray focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center w-full mt-6 md:flex-row md:justify-evenly gap-y-2 lg:w-[50%] mx-auto md:gap-x-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full px-2 py-2 font-medium text-white transition-colors rounded-lg md:w-64 custom-AddButton "
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-2 w-full  md:w-64 font-medium text-gray-700 transition-colors rounded-lg bg-[#E2E1E1] hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
