// ConfirmModal.jsx - Reusable confirmation modal
import { X, AlertCircle, CheckCircle } from "lucide-react";

const AddBatchModal = ({
  isOpen,
  setIsOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  onCancel,
  type = "warning", // warning, success, danger, info
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setIsOpen(false);
  };

  const typeStyles = {
    warning: {
      icon: AlertCircle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
      buttonBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
      iconBg: "bg-green-100",
      buttonBg: "bg-gradient-to-r from-green-500 to-emerald-500",
    },
    danger: {
      icon: AlertCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
      buttonBg: "bg-gradient-to-r from-red-500 to-rose-500",
    },
    info: {
      icon: AlertCircle,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      buttonBg: "bg-gradient-to-r from-[#014376] to-[#31918D]",
    },
  };

  const currentStyle = typeStyles[type] || typeStyles.info;
  const Icon = currentStyle.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative  px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-brown">{title}</h3>
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="inline-flex p-4 rounded-full mb-4">
            <Icon className="w-12 h-12 text-brown" />
          </div>
          <p className="t0 text-lg mb-6">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 custom-AddButton text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBatchModal;
