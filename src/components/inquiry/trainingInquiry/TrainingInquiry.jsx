import { useEffect, useState } from "react";
import { useGetQuery } from "../../../api/apiSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../../ui/common/LoaderComponent";
import DownloadInquiriesModal from "../components/DownloadInquiryModal";
import {
  BookOpen,
  Code,
  Palette,
  ShoppingCart,
  Gamepad2,
  Sparkles,
  XCircle,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowBigRight,
  Download,
  Cpu,
  Briefcase,
  Users,
} from "lucide-react";

const courseIcons = {
  "Web Design & Development": Code,
  "Graphic Designing & Video Editing": Palette,
  "E-commerce": ShoppingCart,
  "AI Content Writing & SEO": Sparkles,
  "Game Development": Gamepad2,
  "Mobile App Development": Cpu,
  "Network & Cyber Security": Award,
  "Social Media Marketing & Freelancing": Briefcase,
  default: BookOpen,
};

const courseColors = {
  "Web Design & Development": "from-blue-500 to-cyan-500",
  "Graphic Designing & Video Editing": "from-pink-500 to-rose-500",
  "E-commerce": "from-green-500 to-emerald-500",
  "AI Content Writing & SEO": "from-purple-500 to-indigo-500",
  "Game Development": "from-orange-500 to-red-500",
  "Mobile App Development": "from-teal-500 to-cyan-500",
  "Network & Cyber Security": "from-red-500 to-pink-500",
  "Social Media Marketing & Freelancing": "from-indigo-500 to-purple-500",
  default: "from-gray-500 to-slate-500",
};

export default function TrainingInquiry() {
  const [activeTab, setActiveTab] = useState("Technical");
  const [courseData, setCourseData] = useState({
    Technical: {},
    "Non Technical": {},
  });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const {
    data: inquiryData,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/training-enrollments/by-course",
  });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize activeTab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const possibleTabs = ["Technical", "Non Technical"];
    const newTab = possibleTabs.includes(tabFromUrl) ? tabFromUrl : "Technical";

    setActiveTab(newTab);

    if (!tabFromUrl || !possibleTabs.includes(tabFromUrl)) {
      setSearchParams({ tab: newTab }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Process inquiryData to populate courseData with new structure
  useEffect(() => {
    if (inquiryData?.data) {
      const data = { Technical: {}, "Non Technical": {} };

      // Process Technical courses
      if (
        inquiryData.data.Technical &&
        Array.isArray(inquiryData.data.Technical)
      ) {
        inquiryData.data.Technical.forEach((course) => {
          data.Technical[course.course_name] = {
            pending: parseInt(course.pending) || 0,
            processing: parseInt(course.processing) || 0,
            enrolled: parseInt(course.enroll) || 0,
            total: parseInt(course.total) || 0,
            rawData: course,
          };
        });
      }

      // Process Non Technical courses
      if (
        inquiryData.data["Non Technical"] &&
        Array.isArray(inquiryData.data["Non Technical"])
      ) {
        inquiryData.data["Non Technical"].forEach((course) => {
          data["Non Technical"][course.course_name] = {
            pending: parseInt(course.pending) || 0,
            processing: parseInt(course.processing) || 0,
            enrolled: parseInt(course.enroll) || 0,
            total: parseInt(course.total) || 0,
            rawData: course,
          };
        });
      }

      setCourseData(data);
    }
  }, [inquiryData]);

  // Calculate total status counts across all courses for the active tab

  // const handleCourseClick = (courseName, courseType) => {
  //   navigate(`/dashboard/training-inquiries/course?tab=${activeTab}`, {
  //     state: { courseName, courseType },
  //   });
  // };
  const handleCourseClick = (courseName, courseType, courseId) => {
    navigate(`/dashboard/training-inquiries/course?tab=${activeTab}`, {
      state: { courseName, courseType, courseId },
    });
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading Inquiries</p>
        </div>
      </div>
    );
  }

  const currentCourses = courseData[activeTab] || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Training Inquiries
                </h1>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
            >
              <Download size={20} />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Tabs with Stats */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="flex">
            {/* Technical Tab */}
            <button
              onClick={() => handleTabChange("Technical")}
              className={`flex-1 px-8 py-6 text-center font-semibold transition-all relative ${
                activeTab === "Technical"
                  ? "text-white bg-gradient-to-r from-[#aa0e0e] to-[#d61111]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Code className="w-6 h-6" />
                <span className="text-lg">Technical Courses</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    activeTab === "Technical"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {Object.values(courseData.Technical).reduce(
                    (sum, stats) => sum + stats.total,
                    0,
                  )}
                </span>
              </div>
            </button>

            {/* Non Technical Tab */}
            <button
              onClick={() => handleTabChange("Non Technical")}
              className={`flex-1 px-8 py-6 text-center font-semibold transition-all relative ${
                activeTab === "Non Technical"
                  ? "text-white bg-gradient-to-r from-[#aa0e0e] to-[#d61111]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Briefcase className="w-6 h-6" />
                <span className="text-lg">Non Technical Courses</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    activeTab === "Non Technical"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {Object.values(courseData["Non Technical"]).reduce(
                    (sum, stats) => sum + stats.total,
                    0,
                  )}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(currentCourses).length > 0 ? (
            Object.entries(currentCourses).map(([courseName, courseStats]) => {
              const IconComponent =
                courseIcons[courseName] || courseIcons.default;
              const gradientColor =
                courseColors[courseName] || courseColors.default;

              return (
                <div
                  key={courseName}
                  onClick={() =>
                    handleCourseClick(
                      courseName,
                      activeTab,
                      courseStats.rawData.course_id,
                    )
                  }
                  className="group relative bg-white rounded-2xl shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Background Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  ></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-4 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-4 py-2 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] text-white text-lg font-bold rounded-full shadow-md">
                          {courseStats.total}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 font-medium">
                          Total
                        </span>
                      </div>
                    </div>

                    {/* Course Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4 group-hover:text-[#aa0e0e] transition-colors">
                      {courseName}
                    </h3>

                    {/* Student Enrollments Status Breakdown */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-[#d61111]" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Student Enrollments
                        </span>
                      </div>
                      <div className="space-y-2 bg-gradient-to-br from-teal-50 to-teal-50/50 rounded-xl p-3 border border-teal-100">
                        {/* Pending */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Pending
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              courseStats.pending > 0
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {courseStats.pending}
                          </span>
                        </div>

                        {/* Processing */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Processing
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              courseStats.processing > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {courseStats.processing}
                          </span>
                        </div>

                        {/* Enrolled */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Enrolled
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              courseStats.enrolled > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {courseStats.enrolled}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between border-t border-teal-200 pt-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#d61111]" />
                            <span className="text-sm font-bold text-gray-900">
                              Total
                            </span>
                          </div>
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-700">
                            {courseStats.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Details */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 text-[#d61111]" />
                      <span>View details</span>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] rounded-full flex items-center justify-center">
                      <ArrowBigRight color="white" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-[#aa0e0e]/10 to-[#d61111]/10 rounded-full mb-6">
                <BookOpen className="w-20 h-20 text-[#aa0e0e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No {activeTab} courses found
              </h3>
              <p className="text-gray-600">
                There are currently no enrollment inquiries for {activeTab}{" "}
                courses.
              </p>
            </div>
          )}
        </div>
      </div>
      <DownloadInquiriesModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}
