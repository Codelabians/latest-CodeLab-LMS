import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Home,
  Mail,
  Phone,
  User,
  XCircle,
  Shield,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { FaChair } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useGetQuery } from "../../../../api/apiSlice";

const IndividualCompanyDetails = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isError,
  } = useGetQuery({
    path: `/admin/individual-company-bookings/get-individual/${uuid}`, // ✅ fixed template literal
  });

  const details = response?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 mb-4">Failed to load details</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No details found</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const infoSections = [
    {
      title: "Personal Information",
      icon: User,
      bgGradient: "custom-Background",
      items: [
        { label: "Full Name", value: details.name, icon: User },
        { label: "Email", value: details.email, icon: Mail },
        { label: "CNIC", value: details.cnic, icon: CreditCard },
        { label: "Contact Number", value: details.contact_number, icon: Phone },
        { label: "Address", value: details.address, icon: Home },
      ],
    },
    {
      title: "Workspace Details",
      icon: Building,
      bgGradient: "custom-Background",
      items: [
        { label: "Rooms Taken", value: details.rooms_taken, icon: Building },
        { label: "Seats Taken", value: details.seats_taken, icon: FaChair },
        {
          label: "Total Price",
          value: `PKR ${parseFloat(details.total_price).toFixed(2)}`,
          icon: DollarSign,
        },
        {
          label: "Start Date",
          value: formatDate(details.start_date),
          icon: Calendar,
        },
        {
          label: "End Date",
          value: formatDate(details.end_date),
          icon: Calendar,
        },
      ],
    },
    {
      title: "Status & Verification",
      icon: BadgeCheck,
      bgGradient: "custom-Background",
      items: [
        {
          label: "Account Status",
          value: details.is_active ? "Active" : "Inactive",
          icon: details.is_active ? CheckCircle : XCircle,
          statusColor: details.is_active ? "text-green-600" : "text-red-600",
          badgeColor: details.is_active ? "bg-green-100" : "bg-red-100",
        },
        {
          label: "PCC Expiry Date",
          value: formatDate(details.police_verification_expiry),
          icon: Shield,
          statusColor: "text-gray-700",
        },
     
      ],
    },
  ];

  return (
    <div className="w-11/12 min-h-screen mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="custom-Background rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{details.name}</h1>
            <p className="text-blue-100">Individual Workspace Booking</p>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              details.is_active
                ? "bg-green-500/20 text-green-100 border border-green-300/30"
                : "bg-red-500/20 text-red-100 border border-red-300/30"
            }`}
          >
            {details.is_active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {infoSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Card Header */}
            <div
              className={`bg-gradient-to-r ${section.bgGradient} p-6 text-white`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <section.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3 group">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                      <item.icon
                        className={`w-4 h-4 ${
                          item.statusColor || "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        {item.label}
                      </p>
                      <p
                        className={`font-semibold ${
                          item.statusColor || "text-gray-900"
                        } break-words`}
                      >
                        {item.badgeColor ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm ${item.badgeColor} ${item.statusColor}`}
                          >
                            {item.value}
                          </span>
                        ) : (
                          item.value
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndividualCompanyDetails;
