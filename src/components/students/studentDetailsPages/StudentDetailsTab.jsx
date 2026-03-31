import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Users,
  Clock,
  Building,
  GraduationCap,
  Heart,
  CreditCard,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../../api/apiSlice";
import { formatDate } from "../../ui/common/FormatDate";
import Loader from "../../ui/common/LoaderComponent";
import { toast } from "react-toastify";

const StudentDetailsTab = () => {
  const { id } = useParams();
  const [isActive, setIsActive] = useState(false);

  const {
    data,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudent,
  } = useGetQuery(
    id
      ? {
          path: `/admin/student/${id}`,
        }
      : null,
    {
      skip: !id,
    },
  );

  const [statuschange, { isLoading: statusLoad }] = usePatchMutation();

  useEffect(() => {
    if (id) {
      refetchStudent();
    }
  }, [id, refetchStudent]);

  const studentData = data?.data;

  // Update local state when student data changes
  useEffect(() => {
    if (studentData) {
      setIsActive(studentData.active_status === true);
    }
  }, [studentData]);

  const firstClassDetail = useMemo(() => {
    if (!studentData?.class_details || studentData.class_details.length === 0) {
      return null;
    }
    return studentData.class_details[0];
  }, [studentData]);

  const studentImage = studentData?.user_image || studentData?.avatar?.file_url;
  const studentName = `${studentData?.first_name || ""} ${
    studentData?.last_name || ""
  }`.trim();

  // Handle status toggle
  const handleStatusToggle = async () => {
    const newStatus = !isActive;

    // Optimistically update UI
    setIsActive(newStatus);

    try {
      const res = await statuschange({
        // method: "POST",
        path: `admin/users/${studentData?.uuid}/toggle-status`,
        body: { active_status: newStatus },
      });
      if (res.error) {
        toast.error(res?.error?.data?.message);
        setIsActive(false);
      } else {
        toast.success(
          res?.data?.message || "Successfully change student status",
        );
      }
    } catch (error) {
      // Revert on error
      setIsActive(!newStatus);
      console.error("Error updating student status:", error);
      // Show error message to user
    }
  };

  const InfoCard = ({ icon: Icon, label, value, className = "" }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-brown">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 break-words">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  if (studentIsLoading || statusLoad) {
    return <Loader />;
  }

  if (studentError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-lg text-red-600 font-semibold">
            Error loading student data
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="custom-Background h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {studentImage ? (
                  <img
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                    src={studentImage}
                    alt={`${studentName}'s Profile`}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#ff0000] to-[#100F0F] border-4 border-white shadow-xl flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {studentData?.first_name?.charAt(0)}
                      {studentData?.last_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-20 pb-6 px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-brown mb-2">
                  {studentName}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {studentData?.student_type && (
                    <span className="px-3 py-1 bg-blue-100 text-brown rounded-full text-xs font-semibold capitalize inline-flex items-center gap-1">
                      <CreditCard size={14} />
                      {studentData.student_type}
                    </span>
                  )}
                  {isActive && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                      <UserCheck size={14} />
                      Active
                    </span>
                  )}
                  {!isActive && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                      <UserX size={14} />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Toggle Switch */}
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Student Status
                  </span>
                  <button
                    onClick={handleStatusToggle}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isActive
                        ? "bg-green-500 focus:ring-green-500"
                        : "bg-red-400 focus:ring-red-400"
                    }`}
                    role="switch"
                    aria-checked={isActive}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                        isActive ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">
                    Admission Date
                  </p>
                  <p className="text-sm font-bold text-beige">
                    {studentData?.created_at
                      ? formatDate(studentData.created_at)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="custom-Background px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User size={24} />
                Personal Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-2">
              <InfoCard icon={Mail} label="Email" value={studentData?.email} />
              <InfoCard
                icon={CreditCard}
                label="CNIC"
                value={studentData?.cnic}
              />
              <InfoCard
                icon={Calendar}
                label="Date of Birth"
                value={studentData?.dob ? formatDate(studentData.dob) : "N/A"}
              />
              <InfoCard
                icon={Phone}
                label="Phone"
                value={studentData?.contact}
              />
              <InfoCard
                icon={User}
                label="Guardian Name"
                value={studentData?.guardian_name}
              />
              <InfoCard
                icon={Phone}
                label="Guardian Phone"
                value={studentData?.guardian_phone}
              />
              <InfoCard
                icon={User}
                label="Gender"
                value={studentData?.gender}
              />
              <InfoCard icon={MapPin} label="City" value={studentData?.city} />
              <InfoCard
                icon={Heart}
                label="Marital Status"
                value={studentData?.marital_status}
              />
              <InfoCard
                icon={MapPin}
                label="Address"
                value={studentData?.address}
                className="col-span-1"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="custom-Background px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap size={24} />
                Academic Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-2">
              <InfoCard
                icon={Award}
                label="Qualification"
                value={studentData?.qualification}
              />
              <InfoCard
                icon={BookOpen}
                label="Course Name"
                value={
                  firstClassDetail?.course?.name || studentData?.course_name
                }
              />
              <InfoCard
                icon={Users}
                label="Batch Name"
                value={firstClassDetail?.batch?.name || studentData?.batch_name}
              />
              <InfoCard
                icon={User}
                label="Instructor"
                value={
                  firstClassDetail?.teacher?.name || studentData?.teacher_name
                }
              />
              <InfoCard
                icon={BookOpen}
                label="Class Name"
                value={firstClassDetail?.name}
              />
              <InfoCard
                icon={Building}
                label="Hall"
                value={firstClassDetail?.hall?.name}
              />
              <InfoCard
                icon={Clock}
                label="Class Timing"
                value={firstClassDetail?.timing}
              />
              <InfoCard
                icon={Clock}
                label="Time Slot"
                value={
                  firstClassDetail?.time_slot
                    ? firstClassDetail.time_slot.charAt(0).toUpperCase() +
                      firstClassDetail.time_slot.slice(1)
                    : "N/A"
                }
              />
              <InfoCard
                icon={Building}
                label="Hostilize"
                value={studentData?.is_hostalize === 1 ? "Yes" : "No"}
              />
            </div>
          </div>
        </div>

        {/* Additional Classes Section */}
        {studentData?.class_details && studentData.class_details.length > 1 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen size={24} />
                All Enrolled Classes ({studentData.class_details.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentData.class_details.map((classDetail, index) => (
                  <div
                    key={classDetail.class_id || index}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-gray-900">
                        {classDetail.name || "Class"}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <BookOpen
                          size={16}
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Course
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {classDetail.course?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User
                          size={16}
                          className="text-purple-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Teacher
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {classDetail.teacher?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building
                          size={16}
                          className="text-green-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Hall
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {classDetail.hall?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock
                          size={16}
                          className="text-orange-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Timing
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {classDetail.timing || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <Users
                          size={16}
                          className="text-indigo-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Batch
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {classDetail.batch?.name || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailsTab;
