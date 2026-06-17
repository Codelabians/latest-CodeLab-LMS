import React from "react";
import AccountForm from "../../ui/instructorModal/AccountForm";
import CloseIcon from "../../../assets/icons/Close";

const InstructorModal = ({
  setIsOpen,
  submitButtonText,
  isOpen,
  refetchInstructor,
  instructorApi = false,
  ModalTitle = null,
}) => {
  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50  ">
          <div className="bg-white p-3 w-[80%] rounded-[10px] shadow-lg ">
            <div className="flex justify-end">
              <button onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            <h1 className="text-center text-2xl font-bold tracking-wide pb-0 ">
              {ModalTitle}
            </h1>
            <AccountForm
              setIsOpen={setIsOpen}
              submitButtonText={submitButtonText}
              refetchInstructor={refetchInstructor}
              instructorApi={instructorApi}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default InstructorModal;
