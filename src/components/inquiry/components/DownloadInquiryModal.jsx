import { X, FileText, Users, UserCheck, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useGetQuery } from "../../../api/apiSlice";
import Loader from "../../ui/common/LoaderComponent";
import { downloadInquiriesPDF } from "../../batches/components/utils/DownloadHelpers";

const DownloadInquiriesModal = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch all inquiries
  const { data: inquiriesData, isLoading } = useGetQuery({
    path: "/admin/training-enrollments",
    params: { per_page: 10000 },
  });
  const inquiries = inquiriesData?.data?.data;
  const handleDownload = async (filterType) => {
    setIsDownloading(true);
    try {
      if (!inquiries) {
        toast.error("No inquiry data available");
        return;
      }

      let filteredInquiries = [...inquiries];

      // Apply filters based on type
      switch (filterType) {
        case "process":
          filteredInquiries = filteredInquiries.filter(
            (inquiry) => inquiry.status?.toLowerCase() === "process"
          );
          break;
        case "enrolled":
          filteredInquiries = filteredInquiries.filter(
            (inquiry) => inquiry.status?.toLowerCase() === "enrolled"
          );
          break;
        case "all":
        default:
          break;
      }

      if (filteredInquiries.length === 0) {
        toast.warning(`No ${filterType} inquiries found`);
        return;
      }

      const fileName = `inquiries_${filterType}.pdf`;
      downloadInquiriesPDF(filteredInquiries, filterType, fileName);

      toast.success(
        `Downloaded ${filteredInquiries.length} inquiries successfully!`
      );
      onClose();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download inquiries list");
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
            Download Inquiries List
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isDownloading}
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <>
            {/* Download Options */}
            <div className="space-y-3">
              {/* All Inquiries */}
              <button
                onClick={() => handleDownload("all")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-[#aa0e0e] hover:bg-blue-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-[#aa0e0e] transition">
                  <Users
                    size={24}
                    className="text-blue-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">All Inquiries</h3>
                  <p className="text-sm text-gray-500">
                    Download complete inquiries list
                  </p>
                </div>
              </button>

              {/* Enrolled Inquiries */}
              <button
                onClick={() => handleDownload("enrolled")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-500 transition">
                  <UserCheck
                    size={24}
                    className="text-green-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">
                    Enrolled Inquiries
                  </h3>
                  <p className="text-sm text-gray-500">
                    Download only enrolled inquiries
                  </p>
                </div>
              </button>

              {/* Processing Inquiries */}
              <button
                onClick={() => handleDownload("process")}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition group disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-yellow-100 group-hover:bg-yellow-500 transition">
                  <FileText
                    size={24}
                    className="text-yellow-600 group-hover:text-white"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">
                    Processing Inquiries
                  </h3>
                  <p className="text-sm text-gray-500">
                    Download inquiries in process
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
        )}

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

export default DownloadInquiriesModal;
