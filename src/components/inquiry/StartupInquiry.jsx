import React, { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Phone,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  Users,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import jsPDF from "jspdf";

export default function StartupInquiry() {
  const [activeTab, setActiveTab] = useState("individual");
  const [individualInquiries, setIndividualInquiries] = useState([]);
  const [companyInquiries, setCompanyInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: individualResponse, isLoading: individualLoading } =
    useGetQuery({ path: "admin/individual-enrollments" });
  const { data: companyResponse, isLoading: companyLoading } = useGetQuery({
    path: "admin/company-enrollments",
  });

  const transformIndividual = (e) => ({
    id: e.id,
    type: "individual",
    name: e.name,
    email: e.email,
    phone: e.phone,
    contact: e.contact,
    subject: `Workspace Registration - ${e.seats_required} Seat(s)`,
    status: e.rent_paid === "Paid" ? "resolved" : "pending",
    date: new Date(e.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }),
    cnic: e.cnic,
    address: e.address,
    seatsRequired: e.seats_required,
    dateRegistration: e.date_registration,
    dateTendency: e.date_tendency,
    periodTendency: e.period_tendency,
    rentPaid: e.rent_paid,
    advance: e.advance,
    security: e.security,
    price: e.price,
  });

  const transformCompany = (e) => ({
    id: e.id,
    type: "company",
    name: e.company_name,
    email: e.email,
    phone: e.phone,
    subject: `Company Workspace - ${e.workspace_seats} Seats`,
    status: e.rent_paid === "Paid" ? "resolved" : "pending",
    date: new Date(e.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }),
    companyName: e.company_name,
    ceo: e.ceo,
    cnic: e.cnic,
    regNo: e.reg_no,
    offices: e.offices,
    workspaceSeats: e.workspace_seats,
    dateTendency: e.date_tendency,
    periodTendency: e.period_tendency,
    rentPaid: e.rent_paid,
    advance: e.advance,
    security: e.security,
    price: e.price,
  });

  useEffect(() => {
    if (individualResponse?.success && individualResponse?.data) {
      setIndividualInquiries(individualResponse.data.map(transformIndividual));
    }
  }, [individualResponse]);

  useEffect(() => {
    if (companyResponse?.success && companyResponse?.data) {
      setCompanyInquiries(companyResponse.data.map(transformCompany));
    }
  }, [companyResponse]);

  useEffect(() => {
    setSelectedInquiry(null);
    setSearchTerm("");
    setFilterStatus("all");
  }, [activeTab]);

  const currentInquiries =
    activeTab === "individual" ? individualInquiries : companyInquiries;
  const isLoading =
    activeTab === "individual" ? individualLoading : companyLoading;

  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: AlertCircle,
    },
    "in-progress": {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Clock,
    },
    resolved: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
  };

  const handleDownload = () => {
    if (!selectedInquiry) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(
      `${
        selectedInquiry.type === "individual" ? "Individual" : "Company"
      } Startup Inquiry Details`,
      10,
      15
    );

    doc.setFontSize(12);
    let y = 30;

    const addLine = (label, value) => {
      doc.text(`${label}: ${value || "N/A"}`, 10, y);
      y += 8;
    };

    // Helper function to format date
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return isNaN(date)
        ? "N/A"
        : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });
    };

    if (selectedInquiry.type === "individual") {
      addLine("Name", selectedInquiry.name);
      addLine("Email", selectedInquiry.email);
      addLine("Phone", selectedInquiry.phone);
      addLine("Contact", selectedInquiry.contact);
      addLine("CNIC", selectedInquiry.cnic);
      addLine("Address", selectedInquiry.address);
      addLine("Seats Required", selectedInquiry.seatsRequired);
      addLine(
        "Date of Registration",
        formatDate(selectedInquiry.dateRegistration)
      );
      addLine("Date of Tendency", formatDate(selectedInquiry.dateTendency));
      addLine("Period of Tendency", formatDate(selectedInquiry.periodTendency));
      addLine("Rent Paid", selectedInquiry.rentPaid);
      addLine("Advance", selectedInquiry.advance);
      addLine("Security", selectedInquiry.security);
      addLine("Price", `Rs. ${selectedInquiry.price?.toLocaleString()}`);
      addLine("Submitted On", selectedInquiry.date);
    } else {
      addLine("Company Name", selectedInquiry.companyName);
      addLine("CEO", selectedInquiry.ceo);
      addLine("Registration No", selectedInquiry.regNo);
      addLine("CNIC", selectedInquiry.cnic);
      addLine("Email", selectedInquiry.email);
      addLine("Phone", selectedInquiry.phone);
      addLine("Offices", selectedInquiry.offices);
      addLine("Workspace Seats", selectedInquiry.workspaceSeats);
      addLine("Date of Tendency", formatDate(selectedInquiry.dateTendency));
      addLine("Period of Tendency", formatDate(selectedInquiry.periodTendency));
      addLine("Rent Paid", selectedInquiry.rentPaid);
      addLine("Advance", selectedInquiry.advance);
      addLine("Security", selectedInquiry.security);
      addLine("Price", `Rs. ${selectedInquiry.price?.toLocaleString()}`);
      addLine("Submitted On", selectedInquiry.date);
    }

    doc.save(`${selectedInquiry.name.replace(/\s/g, "_")}_Inquiry.pdf`);
  };

  const filteredInquiries = currentInquiries.filter((inq) => {
    const matchesStatus = filterStatus === "all" || inq.status === filterStatus;
    const matchesSearch = [inq.name, inq.email, inq.subject].some((f) =>
      f.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const TabButton = ({ value, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
        activeTab === value
          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
      <span
        className={`ml-2 px-2 py-1 text-xs rounded-full ${
          activeTab === value
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {count}
      </span>
    </button>
  );

  const Field = ({ label, value, icon: Icon, href, className }) => (
    <div>
      <label className="text-sm font-semibold text-gray-700 block mb-1">
        {label}
      </label>
      {href ? (
        <a
          href={href}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {value}
        </a>
      ) : (
        <p className={className || "text-gray-900"}>
          {Icon ? <Icon className="w-4 h-4 inline mr-2" /> : null}
          {value}
        </p>
      )}
    </div>
  );

  const InfoCard = ({ label, value, bgColor, textColor }) => (
    <div className={`${bgColor} p-3 rounded-lg`}>
      <label className={`text-xs font-semibold ${textColor} block mb-1`}>
        {label}
      </label>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-11/12 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Startup Workspace Inquiries
          </h1>
          <p className="text-gray-600">
            Manage individual and company workspace registration requests
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <TabButton
              value="individual"
              label="Individual Inquiries"
              icon={User}
              count={individualInquiries.length}
            />
            <TabButton
              value="company"
              label="Company Inquiries"
              icon={Building2}
              count={companyInquiries.length}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {["all", "pending", "in-progress", "resolved", "rejected"].map(
                (opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all"
                      ? "All Status"
                      : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`bg-white p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                  selectedInquiry?.id === inquiry.id
                    ? "border-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {inquiry.type === "individual" ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-purple-600" />
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        inquiry.type === "individual"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {inquiry.type}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${
                      statusConfig[inquiry.status].color
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {inquiry.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{inquiry.subject}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {inquiry.date}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-green-600">
                    <CreditCard className="w-3 h-3" />
                    Rs. {inquiry.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {filteredInquiries.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No inquiries found</p>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            {selectedInquiry ? (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedInquiry.type === "individual"
                      ? "Individual"
                      : "Company"}{" "}
                    Details
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full border flex items-center gap-1 ${
                      statusConfig[selectedInquiry.status].color
                    }`}
                  ></span>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedInquiry.type === "individual" ? (
                    <>
                      <Field label="Name" value={selectedInquiry.name} />
                      <Field
                        label="Email"
                        value={selectedInquiry.email}
                        icon={Mail}
                        href={`mailto:${selectedInquiry.email}`}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Phone"
                          value={selectedInquiry.phone}
                          icon={Phone}
                          href={`tel:${selectedInquiry.phone}`}
                        />
                        <Field
                          label="Contact"
                          value={selectedInquiry.contact}
                          icon={Phone}
                          href={`tel:${selectedInquiry.contact}`}
                        />
                      </div>
                      <Field label="CNIC" value={selectedInquiry.cnic} />
                      <Field
                        label="Address"
                        value={selectedInquiry.address}
                        icon={MapPin}
                      />

                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Workspace Details
                        </h3>
                        <InfoCard
                          label="Seats Required"
                          value={`${selectedInquiry.seatsRequired} Seat(s)`}
                          bgColor="bg-blue-50"
                          textColor="text-blue-700"
                        />
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <InfoCard
                            label="Registration Date"
                            value={new Date(
                              selectedInquiry.dateRegistration
                            ).toLocaleDateString()}
                            bgColor="bg-gray-50"
                            textColor="text-gray-700"
                          />
                          <InfoCard
                            label="Tendency Date"
                            value={new Date(
                              selectedInquiry.dateTendency
                            ).toLocaleDateString()}
                            bgColor="bg-gray-50"
                            textColor="text-gray-700"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Field
                        label="Company Name"
                        value={selectedInquiry.companyName}
                        icon={Building2}
                        className="text-gray-900 font-semibold flex items-center gap-2"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="CEO" value={selectedInquiry.ceo} />
                        <Field
                          label="Registration No"
                          value={selectedInquiry.regNo}
                        />
                      </div>
                      <Field label="CNIC" value={selectedInquiry.cnic} />
                      <Field
                        label="Email"
                        value={selectedInquiry.email}
                        icon={Mail}
                        href={`mailto:${selectedInquiry.email}`}
                      />
                      <Field
                        label="Phone"
                        value={selectedInquiry.phone}
                        icon={Phone}
                        href={`tel:${selectedInquiry.phone}`}
                      />

                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Workspace Requirements
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <InfoCard
                            label="Offices"
                            value={selectedInquiry.offices}
                            bgColor="bg-purple-50"
                            textColor="text-purple-700"
                          />
                          <InfoCard
                            label="Workspace Seats"
                            value={selectedInquiry.workspaceSeats}
                            bgColor="bg-blue-50"
                            textColor="text-blue-700"
                          />
                          <InfoCard
                            label="Tendency Date"
                            value={new Date(
                              selectedInquiry.dateTendency
                            ).toLocaleDateString()}
                            bgColor="bg-gray-50"
                            textColor="text-gray-700"
                          />
                          <InfoCard
                            label="Period Tendency"
                            value={new Date(
                              selectedInquiry.periodTendency
                            ).toLocaleDateString()}
                            bgColor="bg-gray-50"
                            textColor="text-gray-700"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Payment Information
                    </h3>
                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <label className="text-xs font-semibold text-green-700 block mb-1">
                        Total Price
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        Rs. {parseFloat(selectedInquiry.price).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard
                        label="Rent Status"
                        value={selectedInquiry.rentPaid}
                        bgColor="bg-gray-50"
                        textColor="text-gray-700"
                      />
                      <InfoCard
                        label="Advance"
                        value={selectedInquiry.advance}
                        bgColor="bg-gray-50"
                        textColor="text-gray-700"
                      />
                    </div>
                    {selectedInquiry.security && (
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-gray-700 block mb-2">
                          Security Document
                        </label>
                        <a
                          href={selectedInquiry.security}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View Document
                        </a>
                      </div>
                    )}
                  </div>

                  <Field
                    label="Submitted"
                    value={`${selectedInquiry.date} `}
                    icon={Calendar}
                    className="text-gray-600 flex items-center gap-1"
                  />
                </div>

                <button
                  className="w-full mt-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={handleDownload}
                >
                  <FileText className="w-4 h-4" />
                  Download Details
                </button>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                {activeTab === "individual" ? (
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                ) : (
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                )}
                <p className="text-gray-600">
                  Select an inquiry to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
