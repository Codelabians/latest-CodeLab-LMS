import { X, FileText, Users, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
// import { downloadStudentsPDF } from "./utils/downloadHelpers";
import { downloadStudentsPDF } from "./utils/DownloadHelpers";
import { useGetQuery } from "../../../api/apiSlice";
import Loader from "../../ui/common/LoaderComponent";

const DownloadStudentsModal = ({ isOpen, onClose, classData , allStudents = []}) => {
  const [isDownloading, setIsDownloading] = useState(false);


const handleDownload = async (filterType) => {
  setIsDownloading(true);
  try {
    if (!allStudents || allStudents.length === 0 || !classData) {
      toast.error("No students data available");
      return;
    }

    // allStudents is ALREADY filtered by class_id from parent query
    let filteredStudents = [...allStudents];

    // Apply status filter only
    if (filterType === "enrolled") {
      filteredStudents = filteredStudents.filter(
        (s) => s.status?.toLowerCase() === "enrolled"
      );
    } else if (filterType === "processing") {
      filteredStudents = filteredStudents.filter(
        (s) => s.status?.toLowerCase() === "process"
      );
    }
    // "all" → no extra filtering

    if (filteredStudents.length === 0) {
      const label = filterType === "all" ? "" : filterType + " ";
      toast.warning(`No ${label}students found in this class`);
      return;
    }

    const fileName = `${classData.name}_${filterType}_students.pdf`;
    downloadStudentsPDF(filteredStudents, classData, filterType, fileName);

    toast.success(`Downloaded ${filteredStudents.length} student(s) successfully!`);
    onClose();
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to generate PDF");
  } finally {
    setIsDownloading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#aa0e0e]">
            Download Students List
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isDownloading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Class Info */}
        {classData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1">{classData.name}</h3>
            <p className="text-sm text-gray-600">{classData.course?.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Instructor: {classData.teacher?.name}
            </p>
          </div>
        )}

        {/* {isLoading ? (
          <Loader />
        ) : ( */}
          <>
            {/* Download Options */}
            <div className="space-y-3">
              {/* All Students */}
              <button
                onClick={() => handleDownload("all")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-[#aa0e0e] hover:bg-blue-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-[#aa0e0e] transition">
                  <Users size={24} className="text-blue-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">All Students</h3>
                  <p className="text-sm text-gray-500">
                    Download complete students list
                  </p>
                </div>
              </button>

              {/* Enrolled Students */}
              <button
                onClick={() => handleDownload("enrolled")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-500 transition">
                  <UserCheck size={24} className="text-green-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Enrolled Students</h3>
                  <p className="text-sm text-gray-500">
                    Download only enrolled students
                  </p>
                </div>
              </button>

              {/* Processing Students */}
              <button
                onClick={() => handleDownload("processing")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-yellow-100 group-hover:bg-yellow-500 transition">
                  <FileText size={24} className="text-yellow-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Processing Students</h3>
                  <p className="text-sm text-gray-500">
                    Download students in process
                  </p>
                </div>
              </button>
            </div>

            {isDownloading && (
              <div className="mt-4 text-center text-gray-600">
                <p>Generating PDF...</p>
              </div>
            )}
          </>
        {/* )} */}

        {/* Cancel Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="w-full px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadStudentsModal;