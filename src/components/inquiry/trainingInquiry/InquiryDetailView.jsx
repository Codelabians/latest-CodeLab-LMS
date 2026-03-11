// InquiryDetailView.jsx - Individual inquiry details page
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Briefcase,
  Home,
  Users,
  Shield,
  Award,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import DownloadPDFButton from "../components/DownloadPdfButton";

const statusConfig = {
  pending: {
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock,
  },
  "in-progress": {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: AlertCircle,
  },
  resolved: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: CheckCircle,
  },
  rejected: {
    color: "bg-rose-100 text-rose-700 border-rose-300",
    icon: XCircle,
  },
  default: {
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: AlertCircle,
  },
};

export default function InquiryDetailView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { inquiry } = location.state || {};
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-4">Inquiry not found</p>
          <button
            onClick={() => navigate("/dashboard/training-inquiries")}
            className="px-6 py-3 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon =
    statusConfig[inquiry.status]?.icon || statusConfig.default.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[#014376] hover:text-[#31918D] mb-6 font-medium transition-colors"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span>Back</span>
        </button>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header with Gradient */}
          <div className="custom-Background p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    Enrollment Details
                  </h2>
                  <p className="text-white/80">
                    Complete applicant information
                  </p>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Left Section - Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <DownloadPDFButton inquiry={inquiry} />

                  {role === "admin" && (
                    <button
                      className="px-6 py-3 bg-white text-brown rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                      onClick={() =>
                        navigate("/dashboard/training-inquiries/enroll", {
                          state: {
                            inquiryData: inquiry,
                            enrollmentId: inquiry.id,
                          },
                        })
                      }
                    >
                      <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Enroll as Student
                    </button>
                  )}
                </div>

                {/* Right Section - Status */}
                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 flex items-center gap-2 bg-white ${
                    statusConfig[inquiry.status]?.color ||
                    statusConfig.default.color
                  }`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {inquiry.status.charAt(0).toUpperCase() +
                    inquiry.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Profile Image */}
            {inquiry.profile_image && (
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <img
                    src={inquiry.profile_image}
                    alt={inquiry.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#014376] shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-[#014376] to-[#31918D] rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-[#014376] to-[#31918D] rounded-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField
                    label="Full Name"
                    value={inquiry.name}
                    icon={User}
                  />
                  <InfoField
                    label="Email"
                    value={inquiry.email}
                    icon={Mail}
                    isLink={`mailto:${inquiry.email}`}
                  />
                  <InfoField
                    label="Phone"
                    value={inquiry.phone}
                    icon={Phone}
                    isLink={`tel:${inquiry.phone}`}
                  />
                  <InfoField label="CNIC" value={inquiry.cnic} icon={Shield} />
                  <InfoField
                    label="Gender"
                    value={inquiry.gender}
                    icon={Users}
                  />
                  <InfoField
                    label="Date of Birth"
                    value={
                      inquiry.date_of_birth
                        ? new Date(inquiry.date_of_birth).toLocaleDateString(
                            "en-GB"
                          )
                        : ""
                    }
                    icon={Calendar}
                  />
                  <InfoField label="City" value={inquiry.city} icon={MapPin} />
                  <InfoField
                    label="Marital Status"
                    value={inquiry.marital_status}
                    icon={Users}
                  />
                  <div className="mt-6">
                    <InfoField
                      label="Date of Birth"
                      value={
                        inquiry.date_of_birth
                          ? new Date(inquiry.date_of_birth).toLocaleDateString(
                              "en-GB"
                            )
                          : ""
                      }
                      icon={Home}
                      fullWidth
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <InfoField
                    label="Address"
                    value={inquiry.address}
                    icon={Home}
                    fullWidth
                  />
                </div>
              </div>

              {/* Guardian Information */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Guardian Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField
                    label="Guardian Name"
                    value={inquiry.guardian_name}
                    icon={User}
                  />
                  <InfoField
                    label="Guardian Phone"
                    value={inquiry.guardian_phone_number}
                    icon={Phone}
                  />
                </div>
              </div>

              {/* Course Selection */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Course Selection
                  </h3>
                </div>
                <div className="space-y-4">
                  <CourseCard
                    title="Primary Course"
                    course={inquiry.primary_course}
                    status={inquiry.primary_status}
                    isPrimary
                  />
                  <CourseCard
                    title="Secondary Course"
                    course={inquiry.secondary_course}
                    status={inquiry.secondary_status}
                  />
                  <CourseCard
                    title="Tertiary Course"
                    course={inquiry.tertiary_course}
                    status={inquiry.tertiary_status}
                  />
                </div>
              </div>

              {/* Academic Qualification */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Academic Qualification
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField
                    label="Current Qualification"
                    value={inquiry.current_qualification}
                    icon={GraduationCap}
                  />
                  <InfoField
                    label="Programs"
                    value={inquiry.qualification_programs}
                    icon={FileText}
                  />
                </div>
              </div>

              {/* Work Experience (if available) */}
              {(inquiry.company_name || inquiry.job_title) && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Work Experience
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inquiry.company_name && (
                      <InfoField
                        label="Company"
                        value={inquiry.company_name}
                        icon={Briefcase}
                      />
                    )}
                    {inquiry.job_title && (
                      <InfoField
                        label="Job Title"
                        value={inquiry.job_title}
                        icon={Award}
                      />
                    )}
                    {inquiry.civil_military && (
                      <InfoField
                        label="Civil/Military"
                        value={inquiry.civil_military}
                        icon={Shield}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-gray-600 to-slate-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Additional Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoField
                    label="Laptop Demanded"
                    value={inquiry.is_labtop_demanded || "No"}
                    icon={AlertCircle}
                  />
                  {inquiry.price && (
                    <InfoField
                      label="Fee"
                      value={`Rs. ${inquiry.price}`}
                      icon={FileText}
                    />
                  )}
                  <InfoField
                    label="Submitted Date"
                    value={inquiry.date}
                    icon={Calendar}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Info Fields
function InfoField({ label, value, icon: Icon, isLink, fullWidth }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4 text-[#31918D]" />}
        {label}
      </label>
      {isLink ? (
        <a
          href={isLink}
          className="text-[#014376] hover:text-[#31918D] font-medium flex items-center gap-2 transition-colors"
        >
          {value}
        </a>
      ) : (
        <p className="text-gray-900 font-medium">{value || "N/A"}</p>
      )}
    </div>
  );
}

// Helper Component for Course Cards
function CourseCard({ title, course, status, isPrimary }) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isPrimary
          ? "bg-white border-[#014376] shadow-md"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          {title}
        </label>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            status?.toLowerCase() === "basic"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-gray-900 font-semibold">{course}</p>
    </div>
  );
}
