import { X, AlertTriangle } from "lucide-react";

const RemoveLaptopModal = ({
  isOpen,
  onClose,
  onConfirm,
  laptopTag,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Remove Laptop
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove this laptop from the inventory?
          </p>

          {laptopTag && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Laptop Tag:</p>
              <p className="font-semibold text-gray-800">{laptopTag}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action will make the laptop
              available for other classes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Removing..." : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveLaptopModal;
