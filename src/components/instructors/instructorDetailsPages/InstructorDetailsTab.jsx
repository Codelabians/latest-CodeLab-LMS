import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../ui/Header";
import { useGetQuery } from "../../../api/apiSlice";
import { INSTRUCTORS } from "../../routes/RouteConstants";
import { formatDate } from "../../ui/common/FormatDate";
import InstructorBatchesTab from "../instructorDetailsPages/InstructorBatchesTab";
import InstructorDocumentTab from "./InstructorDocumentTab";
import {
  Mail,
  CreditCard,
  Calendar,
  Phone,
  User,
  MapPin,
  Heart,
  Home,
  GraduationCap,
  DollarSign,
  Briefcase,
  FileText,
  Building2,
  ArrowLeft,
  UserCircle,
  Award,
} from "lucide-react";

const InstructorDetailsTab = () => {
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Instructor Details");
  const navigate = useNavigate();

  const {
    data,
    error: emplpoyeeError,
    isLoading: employeeIsLoading,
    refetch: refetchEmployee,
  } = useGetQuery({
    path: `/admin/teacher/${id}`,
  });

  useEffect(() => {
    refetchEmployee();
  }, [refetchEmployee]);

  const instructorData = data?.data;

  const instructorImage = instructorData?.avatar?.file_url;
  const instructorName =
    instructorData?.first_name + " " + instructorData?.last_name;
  const instructorDesignation = instructorData?.designation;

  const personalDetails = [
    {
      label: "EMAIL",
      value: instructorData?.email,
      icon: Mail,
    },
    {
      label: "CNIC",
      value: instructorData?.cnic,
      icon: CreditCard,
    },
    {
      label: "DATE OF BIRTH",
      value: instructorData?.dob ? formatDate(instructorData.dob) : "",
      icon: Calendar,
    },
    {
      label: "PHONE",
      value: instructorData?.contact,
      icon: Phone,
    },
    {
      label: "GUARDIAN NAME",
      value: instructorData?.guardian_name,
      icon: User,
    },
    {
      label: "GUARDIAN PHONE",
      value: instructorData?.guardian_phone,
      icon: Phone,
    },
    {
      label: "GENDER",
      value: instructorData?.gender,
      icon: UserCircle,
    },
    {
      label: "CITY",
      value: instructorData?.city,
      icon: MapPin,
    },
    {
      label: "MARITAL STATUS",
      value: instructorData?.marital_status,
      icon: Heart,
    },
    {
      label: "ADDRESS",
      value: instructorData?.address,
      icon: Home,
    },
  ];

  const officialDetails = [
    {
      label: "QUALIFICATION",
      value: instructorData?.qualification,
      icon: GraduationCap,
    },
    {
      label: "BASIC SALARY",
      value: instructorData?.basic_salary,
      icon: DollarSign,
    },
    {
      label: "EXPERIENCE",
      value: instructorData?.experience,
      icon: Briefcase,
    },
    {
      label: "JOINING DATE",
      value: instructorData?.created_at
        ? formatDate(instructorData.created_at)
        : "",
      icon: Calendar,
    },
    {
      label: "HOSTILIZE",
      value: instructorData?.is_hostalize === 1 ? "Yes" : "No",
      icon: Building2,
    },
    {
      label: "NOTE",
      value: instructorData?.bio,
      icon: FileText,
    },
  ];

  const facilitiesDetails = instructorData?.facilities?.map((facility) => ({
    value: facility?.facility_name,
  }));

  const handleTabClick = (buttonType) => {
    setActiveTab(buttonType);
  };

  return (
    <div className="w-full lg:w-11/12 mx-auto px-4 lg:px-0">
      <Header
        title="Tech Trainer"
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        showActionButton={false}
      />

      {/* Header Section with gradient background */}
      <div className="bg-gradient-to-r from-[#0B5483] via-[#1a6d96] to-[#26A69A] rounded-t-2xl mt-4 lg:mt-6 p-4 lg:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              className={`px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 font-semibold rounded-lg transition-all text-sm lg:text-base whitespace-nowrap ${
                activeTab === "Instructor Details"
                  ? "bg-[#0B5483] text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
              }`}
              onClick={() => handleTabClick("Instructor Details")}
            >
              Trainer Details
            </button>
            <button
              className={`px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 font-semibold rounded-lg transition-all text-sm lg:text-base whitespace-nowrap ${
                activeTab === "Document Details"
                  ? "bg-[#0B5483] text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
              }`}
              onClick={() => handleTabClick("Document Details")}
            >
              Documents Details
            </button>
            <button
              className={`px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5 font-semibold rounded-lg transition-all text-sm lg:text-base whitespace-nowrap ${
                activeTab === "Batch Details"
                  ? "bg-[#0B5483] text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
              }`}
              onClick={() => handleTabClick("Batch Details")}
            >
              Class Details
            </button>
          </div>
          <button
            onClick={() => navigate(INSTRUCTORS)}
            className="text-white hover:scale-110 transition-transform bg-white/20 p-2 rounded-lg hover:bg-white/30"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>

      {activeTab === "Instructor Details" && (
        <div>
          {employeeIsLoading && (
            <div className="flex justify-center items-center h-64 bg-white rounded-b-2xl shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5483] mx-auto mb-4"></div>
                <p className="text-lg text-gray-600 font-medium">
                  Loading Instructor Details...
                </p>
              </div>
            </div>
          )}
          {emplpoyeeError && (
            <div className="flex justify-center items-center h-64 bg-white rounded-b-2xl shadow-lg">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-red-600 font-semibold">
                  Error loading Instructor
                </p>
              </div>
            </div>
          )}
          {!employeeIsLoading && !emplpoyeeError && (
            <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
              {/* Profile Header Section */}
              <div className="bg-gradient-to-r from-[#0B5483] via-[#1a6d96] to-[#26A69A] h-24 sm:h-32 lg:h-40"></div>

              <div className="px-4 sm:px-6 lg:px-12 pb-6 lg:pb-8">
                {/* Profile Image and Name */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 lg:-mt-20 mb-6 lg:mb-8">
                  <div className="bg-white rounded-2xl p-2 shadow-2xl">
                    <img
                      className="rounded-xl h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 object-cover"
                      src={instructorImage || "/api/placeholder/160/160"}
                      alt="Profile"
                    />
                  </div>
                  <div className="pb-0 sm:pb-4 text-center sm:text-left flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B5483] mb-2">
                      {instructorName}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 bg-[#E3F2FD] px-4 py-1.5 rounded-full w-fit mx-auto sm:mx-0">
                      <span className="w-2 h-2 bg-[#0B5483] rounded-full animate-pulse"></span>
                      <Award className="w-4 h-4 text-[#0B5483]" />
                      <span className="text-[#0B5483] font-semibold text-sm">
                        {instructorDesignation || "Instructor"}
                      </span>
                    </div>
                  </div>
                  {instructorData?.created_at && (
                    <div className="sm:ml-auto pb-0 sm:pb-4">
                      <div className="text-center sm:text-right bg-gradient-to-br from-[#E3F2FD] to-[#B2DFDB] px-4 py-3 rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide mb-1">
                          Joining Date
                        </p>
                        <p className="text-base sm:text-lg font-bold text-[#0B5483]">
                          {formatDate(instructorData.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Personal Information */}
                  <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-[#0B5483] to-[#26A69A] px-4 sm:px-6 py-3 sm:py-4">
                      <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                        <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        Personal Information
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                      {personalDetails.map((detail, index) => {
                        const IconComponent = detail.icon;
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-[#26A69A] mt-1 flex-shrink-0">
                              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {detail.label}
                              </p>
                              <p className="text-sm sm:text-base text-gray-800 font-medium break-words">
                                {detail.value || "N/A"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Official Information */}
                  <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-[#0B5483] to-[#26A69A] px-4 sm:px-6 py-3 sm:py-4">
                      <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                        Official Information
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                      {officialDetails.map((detail, index) => {
                        const IconComponent = detail.icon;
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-[#26A69A] mt-1 flex-shrink-0">
                              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {detail.label}
                              </p>
                              <p className="text-sm sm:text-base text-gray-800 font-medium break-words">
                                {detail.value || "N/A"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Facilities Section */}
                {facilitiesDetails && facilitiesDetails.length > 0 && (
                  <div className="mt-4 lg:mt-6 bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-[#0B5483] to-[#26A69A] px-4 sm:px-6 py-3 sm:py-4">
                      <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        Facilities & Benefits
                      </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {facilitiesDetails.map((detail, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-[#E3F2FD] to-[#B2DFDB] px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
                          >
                            <span className="text-[#0B5483] font-semibold text-xs sm:text-sm flex items-center gap-2">
                              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                              {detail.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Document Details" && <InstructorDocumentTab />}
      {activeTab === "Batch Details" && <InstructorBatchesTab />}
    </div>
  );
};

export default InstructorDetailsTab;