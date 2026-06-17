import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  Upload,
} from "lucide-react";
import { usePostMutation, usePatchMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";

const ChallanApprovalModal = ({
  isOpen,
  setIsOpen,
  student,
  refetchStudents,
}) => {
  const [approveApi, { isLoading: isApproving }] = usePostMutation();
  const [uploadApi, { isLoading: isUploading }] = usePostMutation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(student);

  // Update current student when prop changes
  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  if (!isOpen || !currentStudent) return null;

  const firstPendingInstallment = currentStudent;
  const challanImages = firstPendingInstallment?.challan || [];
  const hasStudentChallan = challanImages.length > 0;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(
      files.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        name: file.name,
      }))
    );
  };

  const handleUploadChallan = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    try {
      const formData = new FormData();
      if (uploadedFiles.length === 1) {
        formData.append("challan_file", uploadedFiles[0].file);
      } else {
        uploadedFiles.forEach((fileObj) => {
          formData.append("challan_file[]", fileObj.file);
        });
      }

      const response = await uploadApi({
        path: `/admin/fees/installments/${firstPendingInstallment.installment_uuid}/upload-paid-challan?_method=patch`,
        body: formData,
      }).unwrap();

      toast.success("Challan uploaded successfully!");

      // Update local state with new challan data
      const newChallan =
        response.data?.challan ||
        uploadedFiles.map((f, i) => ({
          id: Date.now() + i,
          file_url: f.preview || "/placeholder.pdf",
          file_name: f.name,
        }));

      setCurrentStudent((prev) => ({
        ...prev,
        challan: newChallan,
      }));

      setUploadedFiles([]); // Clear UI

      await handleApprove();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload challan");
    }
  };

  const handleApprove = async () => {
    try {
      await approveApi({
        path: `/admin/fees/installments/${firstPendingInstallment.installment_uuid}/mark-paid`,
        body: {},
      }).unwrap();

      toast.success("Challan approved successfully!");
      setIsOpen(false);
      refetchStudents();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve challan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Challan Approval</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-[#aa0e0e]">
            <h3 className="text-lg font-bold text-[#aa0e0e] mb-3">
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-gray-900">
                  {currentStudent.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-semibold text-gray-900">
                  {currentStudent.course}
                </p>
              </div>
            </div>
          </div>

          {/* Installment Details */}
          {firstPendingInstallment && (
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-5 border-2 border-[#d61111]">
              <h3 className="text-lg font-bold text-[#aa0e0e] mb-4">
                Installment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#d61111]" />
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-gray-900">
                      Rs. {firstPendingInstallment.amount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#d61111]" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        firstPendingInstallment.due_date
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challan Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-lg font-bold text-[#aa0e0e] mb-4">
              {hasStudentChallan
                ? "Student Uploaded Challan"
                : "Upload Challan"}
            </h3>

            {hasStudentChallan ? (
              /* Show student's challan */
              <div className="space-y-4">
                <div className="relative bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                  <img
                    src={challanImages[selectedImageIndex].file_url}
                    alt={`Challan ${selectedImageIndex + 1}`}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  <button
                    onClick={() =>
                      window.open(
                        challanImages[selectedImageIndex].file_url,
                        "_blank"
                      )
                    }
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5 text-[#aa0e0e]" />
                  </button>
                </div>

                {challanImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {challanImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index
                            ? "border-[#aa0e0e]"
                            : "border-gray-300"
                        }`}
                      >
                        <img
                          src={image.file_url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-20 h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Admin upload section */
              <div className="space-y-4">
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <input
                    type="file"
                    id="challan-upload"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="challan-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-semibold mb-2">
                      Click to upload challan
                    </p>
                    <p className="text-sm text-gray-500">
                      Images and PDF files
                    </p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Selected Files ({uploadedFiles.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedFiles.map((fileObj, index) => (
                        <div
                          key={index}
                          className="relative bg-white rounded-lg border-2 border-gray-300 overflow-hidden"
                        >
                          {fileObj.preview ? (
                            <img
                              src={fileObj.preview}
                              alt={fileObj.name}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-100">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <p className="text-xs p-1 truncate">{fileObj.name}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUploadChallan}
                      disabled={isUploading}
                      className="w-full mt-3 py-3 bg-[#aa0e0e] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {isUploading ? "Uploading..." : "Upload Challan"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex gap-4 justify-end border-t">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isApproving || !hasStudentChallan}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            {isApproving ? "Approving..." : "Approve Challan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanApprovalModal;
