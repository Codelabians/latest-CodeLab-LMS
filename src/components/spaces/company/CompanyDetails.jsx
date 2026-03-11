import {
  ArrowLeft,
  Building,
  CheckCircle,
  CreditCard,
  DollarSign,
  Phone,
  User,
  XCircle,
  Mail,
  UserPlus,
  Calendar,
  Receipt,
  Lock,
  Plus,
  Building2,
  Coins,
} from "lucide-react";
import { useState } from "react";
import { FaChair, FaMoneyCheck } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import PayRentModal from "../company-individual/components/PayRent";
import { toast } from "react-toastify";
import AddNewWorkspaceModal from "../component/AddNewWorkspace";
import RefundSecurity from "../company-individual/components/RefundSecurity";

const CompanyDetails = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [isPayRentModalOpen, setIsPayRentModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addWorkspaceModalOpen, setAddWorkspaceModalOpen] = useState(false);
  const [isRefundModal, setIsRefundModal] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    name: "",
    email: "",
    cnic: "",
    contact_number: "",
  });

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetQuery({
    path: `/admin/clients/${uuid}`,
  });

  const [createMember, { isLoading: isCreatingMember }] = usePostMutation();

  const details = response?.data;

  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setMemberFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = async () => {
    if (
      !memberFormData.name ||
      !memberFormData.email ||
      !memberFormData.cnic ||
      !memberFormData.contact_number
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      company_id: details.id,
      name: memberFormData.name,
      cnic: memberFormData.cnic,
      email: memberFormData.email,
      contact_number: memberFormData.contact_number,
    };

    try {
      await createMember({
        path: "/admin/clients/members",
        body: payload,
      }).unwrap();

      toast.success("Member added successfully!");
      setMemberFormData({
        name: "",
        email: "",
        cnic: "",
        contact_number: "",
      });
      setIsAddMemberModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to add member:", err);
      const msg = err?.data?.message || "Failed to add member";
      toast.error(`Error: ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 mb-4">
            Failed to load company details
          </p>
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
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500">
            No details found for this company
          </p>
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

  // Calculate total paid rent
  const totalPaidRent =
    details.paid_rent?.reduce((sum, payment) => {
      return sum + parseFloat(payment.clients_uuid || 0);
    }, 0) || 0;

  // const remainingRent = details.total_rent - totalPaidRent;

  const infoSections = [
    {
      title: "Company Information",
      icon: Building,
      bgGradient: "custom-Background",
      items: [
        { label: "Company Name", value: details.name, icon: Building },
        { label: "CNIC", value: details.cnic, icon: CreditCard },
        { label: "Contact", value: details.contact_number, icon: Phone },
      ],
    },
    {
      title: "Workspace Details",
      icon: FaChair,
      bgGradient: "custom-Background",
      items: [
        {
          label: "Rooms Taken",
          value: details.rooms_taken,
          icon: Building,
        },
        {
          label: "Individual Seats Taken",
          value: details.seats_taken,
          icon: FaChair,
        },
        {
          label: "Total Rent",
          value: `PKR ${details.total_rent?.toLocaleString()}`,
          icon: Coins,
        },
        {
          label: "Security Payment",
          value: `PKR ${Number(
            details.security_payment || 0
          ).toLocaleString()}`,
          icon: Lock,
        },
      ],
    },
    {
      title: "Rent Summary",
      icon: Coins,
      bgGradient: "custom-Background",
      items: [
        {
          label: "Total Rent",
          value: `PKR ${details.total_rent?.toLocaleString()}`,
          icon: Coins,
          statusColor: "text-gray-900",
        },
        {
          label: "Paid Rent",
          value: `PKR ${totalPaidRent.toLocaleString()}`,
          icon: CheckCircle,
          statusColor: "text-green-600",
        },
        // {
        //   label: "Remaining",
        //   value: `PKR ${remainingRent.toLocaleString()}`,
        //   icon: DollarSign,
        //   statusColor: remainingRent > 0 ? "text-red-600" : "text-green-600",
        // },
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{details.name}</h1>
              <p className="text-white/80 mt-1">Company Details</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white text-brown rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <FaMoneyCheck className="w-5 h-5" />
              <button
                onClick={() => setIsRefundModal(true)}
                className="font-semibold"
              >
                Refund Security
              </button>
            </div>
            <div className="bg-white text-brown rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <FaMoneyCheck className="w-5 h-5" />
              <button
                onClick={() => setIsPayRentModalOpen(true)}
                className="font-semibold"
              >
                Pay Rent
              </button>
            </div>
            <div className="bg-white text-brown rounded-lg px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <Plus className="w-5 h-5" />
              <button
                onClick={() => setAddWorkspaceModalOpen(true)}
                className="font-semibold"
              >
                Add Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {infoSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Card Header */}
            <div className={`${section.bgGradient} p-6 text-white`}>
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
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rent Payment History */}
      <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
        <div className="custom-Background p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Receipt className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Rent Payment History</h2>
          </div>
        </div>

        <div className="p-6">
          {details.paid_rent && details.paid_rent.length > 0 ? (
            <div className="space-y-3">
              {details.paid_rent.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        PKR {parseFloat(payment.clients_uuid).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Payment #{payment.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatDate(payment.name)}
                      </span>
                    </div>
                    {payment.note && (
                      <p className="text-xs text-gray-500 mt-1">
                        {payment.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No payment history available
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
        <div className="custom-Background p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Company Workspaces</h2>
          </div>
        </div>

        <div className="p-6">
          {details.workspaces && details.workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-scroll">
              {details.workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Active
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-3">
                    {workspace.type?.name || "Workspace"}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-50 rounded">
                        <Coins className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="font-semibold text-gray-900">
                          PKR {parseFloat(workspace.price).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Contract Period</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(workspace.start_date)} -{" "}
                          {formatDate(workspace.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No workspaces assigned yet
              </p>
              <p className="text-gray-400 text-sm">
                Click "Add Workspace" button to assign a workspace to this
                company
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Company Members */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="custom-Background p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Company Members</h2>
            </div>
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="bg-white text-brown rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors font-semibold shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>

        <div className="p-6">
          {details.members && details.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-scroll">
              {details.members.map((member) => (
                <div
                  key={member.id}
                  className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-3">
                        {member.name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{member.cnic}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {member.contact_number}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No members added yet
            </p>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="custom-Background p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Member</h2>
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={memberFormData.name}
                  onChange={handleMemberInputChange}
                  placeholder="Enter member name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={memberFormData.email}
                  onChange={handleMemberInputChange}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CNIC *
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={memberFormData.cnic}
                  onChange={handleMemberInputChange}
                  placeholder="Enter CNIC number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={memberFormData.contact_number}
                  onChange={handleMemberInputChange}
                  placeholder="Enter contact number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddMember}
                  disabled={isCreatingMember}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                    isCreatingMember
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "custom-Background text-white"
                  }`}
                >
                  {isCreatingMember ? "Adding..." : "Add Member"}
                </button>
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PayRentModal
        isOpen={isPayRentModalOpen}
        onClose={() => setIsPayRentModalOpen(false)}
        companyUuid={uuid}
        rentAmount={details?.total_rent || details?.total_price || ""}
      />
      <AddNewWorkspaceModal
        isOpen={addWorkspaceModalOpen}
        onClose={() => setAddWorkspaceModalOpen(false)}
        companyUuid={uuid}
      />

      <RefundSecurity
        isOpen={isRefundModal}
        onClose={() => setIsRefundModal(false)}
        securityAmount={details?.security_payment || 0}
        companyUuid={uuid}
        onSuccess={refetch}
      />
    </div>
  );
};

export default CompanyDetails;
