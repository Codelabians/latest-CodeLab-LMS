import React, { useEffect, useState } from "react";
import CloseIcon from "../../assets/icons/Close";
import TickIcon from "../../assets/icons/Tick";

const DeleteModal = ({
  isOpen,
  setIsOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
  successMessage,
    requireReason = false, 
  reasonLabel = "Reason"
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
   const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  

  const closeDeleteModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

const handleConfirm = () => {
    // Validate reason if required
    if (requireReason && !reason.trim()) {
      setReasonError("Reason is required");
      return;
    }

    setIsOpen(false);
    setIsConfirmModalOpen(true);
    
    // Pass reason to onConfirm if provided
    if (onConfirm) {
      requireReason ? onConfirm(reason) : onConfirm();
    }
    
    // Reset reason after confirmation
    setReason("");
    setReasonError("");
  };


  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  // Add useEffect to handle automatic closing of confirm modal
  useEffect(() => {
    if (isConfirmModalOpen) {
      const timer = setTimeout(() => {
        closeConfirmModal();
      }, 1000); // Close after 1 second

      return () => clearTimeout(timer); // Clean up the timer
    }
  }, [isConfirmModalOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-3 rounded shadow-lg w-[430px] ">
            <div className="flex justify-end">
              <button onClick={closeDeleteModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex justify-center mt-5 mb-8">
              <p className="text-lg font-medium font-poppins w-[290px] text-center">
                {message}
              </p>
            </div>
            {requireReason && (
              <div className="px-6 mb-4">
                <label className="block font-medium font-poppins  mb-2">
                  {reasonLabel}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setReasonError("");
                  }}
                  placeholder="Enter reason..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-poppins ${
                    reasonError ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={3}
                />
                {reasonError && (
                  <p className="text-red-500 text-sm mt-1 font-poppins">
                    {reasonError}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={handleConfirm}
                className="custom-AddButton text-white py-2 rounded w-[85px] font-semibold font-poppins text-lg"
              >
                {confirmText}
              </button>
              <button
                onClick={closeDeleteModal}
                className="bg-buttonGray text-heading py-2 rounded w-[85px] font-semibold font-poppins text-lg"
              >
                {cancelText}
              </button>
            </div>
          </div>
               
        </div>

        
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-3 rounded shadow-lg w-[430px] ">
            <div className="flex justify-end">
              <button onClick={closeConfirmModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 mt-5 mb-8">
              <div className="flex justify-center items-center custom-Delete rounded-full w-[60px] h-[60px]">
                <TickIcon />
              </div>
              <div className="text-2xl font-medium font-poppins">
                {successMessage}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteModal;
