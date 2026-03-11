// CourseInquiryDetails.jsx - With Status Badges
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useGetQuery } from "../../../api/apiSlice";
import Table from "../../ui/Table";
import { formatDate } from "../../ui/common/FormatDate";
import Header from "../../ui/Header";
import Loader from "../../ui/common/LoaderComponent";
import { toast } from "react-toastify";

// ✅ ADD STATUS CONFIG HELPER
const getStatusConfig = (status) => {
  const statusLower = status?.toLowerCase() || "";

  const statusConfigs = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    process: { bg: "bg-blue-100", text: "text-blue-800", label: "Process" },
    enrolled: { bg: "bg-green-100", text: "text-green-800", label: "Enrolled" },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    dropout: { bg: "bg-red-100", text: "text-red-800", label: "Dropout" },
    completed: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "Completed",
    },
  };

  for (const [key, config] of Object.entries(statusConfigs)) {
    if (statusLower.includes(key)) {
      return config;
    }
  }

  return { bg: "bg-gray-100", text: "text-gray-600", label: status || "N/A" };
};

export default function InquiryDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseName, courseType, courseId } = location.state || {};

  const [filteredInquiries, setFilteredInquiries] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    data: inquiryData,
    isLoading,
    isError,
  } = useGetQuery({
    path: `/admin/training-enrollments`,
    params: {
      per_page: itemsPerPage,
      page: currentPage,
      course_id: courseId,
      // include_class_details: true,
      // ...(selectedFilter !== "all" && { status: selectedFilter }),
    },
  });

  const meta = inquiryData?.meta?.pagination;

  useEffect(() => {
    if (inquiryData?.data?.data) {
      const filtered = inquiryData.data.data.map((enrollment) => {
        const statusValue = enrollment.status || "Pending";
        const statusConfig = getStatusConfig(statusValue); // ✅ ADD STATUS CONFIG

        return {
          id: enrollment.id,
          uuid: enrollment.id,
          name: `${enrollment.first_name} ${enrollment.last_name}`,
          email: enrollment.email,
          phone: enrollment.phone_number,
          city: enrollment.city,
          status: statusValue, // ✅ KEEP ORIGINAL STATUS
          statusConfig: statusConfig, // ✅ ADD STATUS CONFIG FOR STYLING
          date: formatDate(enrollment.submitted_at),
          // Store full enrollment for details view
          ...enrollment,
        };
      });

      setFilteredInquiries(filtered);
    }
  }, [inquiryData, courseName, courseType]);

  const handleViewDetails = (inquiry) => {
    navigate("/dashboard/training-inquiries/details", {
      state: { inquiry },
    });
  };

  if (!courseName || !courseType) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid course selection</p>
          <button
            onClick={() => navigate("/dashboard/training-inquiries")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isError) {
    toast.error("Error loading inquiries");
  }

  const columns = ["Name", "Email", "Phone", "City", "Status", "Date"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {isLoading && <Loader />}
      <div className="w-11/12 mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard/training-inquiries")}
            className="flex items-center gap-2 text-brown"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Inquiries
          </button>
        </div>

        <Header
          icon={<HelpCircle className="w-8 h-8 text-white" />}
          title={`${courseName} Course Inquiries`}
          showActionButton={false}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            data={filteredInquiries}
            columns={columns}
            handleEditClick={() => {}}
            TableHeadingAction={true}
            batchEditButton={false}
            sourceComponent="TrainingInquiries"
            onViewDetails={handleViewDetails}
            inquiryStatus={inquiryData?.status}
            setPage={setCurrentPage}
            setPer_page={setItemsPerPage}
            paginationMeta={meta}
          />
        </div>
      </div>
    </div>
  );
}
