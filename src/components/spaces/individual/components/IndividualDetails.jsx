import { useGetQuery } from "../../../../api/apiSlice";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  Mail,
  CreditCard,
  Home,
  Phone,
  User,
  XCircle,
  Shield,
  Clock,
  BadgeCheck,
  DollarSign,
} from "lucide-react";
import { FaChair, FaMoneyCheck } from "react-icons/fa";
import PayRentModal from "../../company-individual/components/PayRent";
import { useState } from "react";

const IndividualDetails = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [isPayRentModalOpen, setIsPayRentModalOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetQuery({
    path: `/admin/clients/${uuid}`,
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount || 0).toLocaleString()}`;
  };

  // Calculate total paid rent
  const totalPaidRent =
    details.paid_rent?.reduce((sum, rent) => {
      return sum + parseFloat(rent.clients_uuid || 0);
    }, 0) || 0;

  // Calculate remaining rent
  const remainingRent = (details.total_rent || 0) - totalPaidRent;

  // Get workspace details
  const workspace = details.workspaces?.[0];
  const workspaceType = workspace?.type?.name || "N/A";
  const workspacePrice = workspace?.price || "0";

  // Check if verification is expired
  const verificationExpired = details.police_verification_expiry
    ? new Date(details.police_verification_expiry) < new Date()
    : false;

  const infoSections = [
    {
      title: "Personal Information",
      icon: User,
      bgGradient: "custom-Background",
      items: [
        { label: "Full Name", value: details.name || "N/A", icon: User },
        { label: "Email", value: details.email || "N/A", icon: Mail },
        { label: "CNIC", value: details.cnic || "N/A", icon: CreditCard },
        {
          label: "Contact Number",
          value: details.contact_number || "N/A",
          icon: Phone,
        },
        { label: "Address", value: details.address || "N/A", icon: Home },
      ],
    },
    {
      title: "Workspace Details",
      icon: Building,
      bgGradient: "custom-Background",
      items: [
        {
          label: "Workspace Type",
          value: workspaceType,
          icon: Building,
        },
        {
          label: "Workspace Price",
          value: formatCurrency(workspacePrice),
          icon: DollarSign,
        },
        {
          label: "Start Date",
          value: formatDate(workspace?.start_date),
          icon: Calendar,
        },
        {
          label: "End Date",
          value: formatDate(workspace?.end_date),
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
          label: "Verification Status",
          value: verificationExpired ? "Expired" : "Valid",
          icon: Shield,
          statusColor: verificationExpired ? "text-red-600" : "text-green-600",
          badgeColor: verificationExpired ? "bg-red-100" : "bg-green-100",
        },
        {
          label: "PCC Expiry Date",
          value: formatDate(details.police_verification_expiry),
          icon: Clock,
          statusColor: verificationExpired ? "text-red-600" : "text-gray-700",
        },
        {
          label: "Client Type",
          value: details.type_label || "Individual",
          icon: User,
          statusColor: "text-blue-600",
          badgeColor: "bg-blue-100",
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{details.name}</h1>
              <p className="text-blue-100">
                {details.type_label} Workspace Booking
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPayRentModalOpen(true)}
            className="bg-white text-[#aa0e0e] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-blue-50 transition-colors font-semibold shadow-lg"
          >
            <FaMoneyCheck className="w-5 h-5" />
            Pay Rent
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              details.is_active
                ? "bg-green-500/20 text-green-100 border border-green-300/30"
                : "bg-red-500/20 text-red-100 border border-red-300/30"
            }`}
          >
            {details.is_active ? "Active" : "Inactive"}
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              verificationExpired
                ? "bg-red-500/20 text-red-100 border border-red-300/30"
                : "bg-green-500/20 text-green-100 border border-green-300/30"
            }`}
          >
            {verificationExpired ? "Verification Expired" : "Verified"}
          </div>
        </div>
      </div>

      {/* Rent Payment Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] rounded-lg text-white">
            <DollarSign className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Rent Payment Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-600 mb-1">
              Rent Per Month
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(details.total_rent)}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm font-medium text-green-600 mb-1">Paid Rent</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(totalPaidRent)}
            </p>
          </div>
        </div>

        {/* Payment History */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Payment History
          </h3>
          {details.paid_rent && details.paid_rent.length > 0 ? (
            <div className="space-y-3">
              {details.paid_rent.map((rent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Payment #{index + 1}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(rent.name)}
                      </p>
                      {rent.note && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {rent.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      {formatCurrency(rent.clients_uuid)}
                    </p>
                    <p className="text-xs text-gray-500">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No payment history available</p>
            </div>
          )}
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

      <PayRentModal
        isOpen={isPayRentModalOpen}
        onClose={() => {
          setIsPayRentModalOpen(false);
          refetch(); // Refresh data after payment
        }}
        companyUuid={uuid}
        rentAmount={remainingRent || details.total_rent || ""}
      />
    </div>
  );
};

export default IndividualDetails;
