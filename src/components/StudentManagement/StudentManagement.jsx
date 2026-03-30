import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Search, Shield, UserCheck, Users2, Key, Mail } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import Header from "../ui/Header";
import Table from "../ui/Table";
import Loader from "../ui/common/LoaderComponent";

// Debounce hook
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Parse name input into first_name / last_name query params
const parseNameSearch = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // Single word — could be either first or last name; send as first_name
    return { first_name: parts[0] };
  }

  // Multiple words: first word → first_name, rest → last_name
  const [first, ...rest] = parts;
  return {
    first_name: first,
    last_name: rest.join(" "),
  };
};

const StudentManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Raw input states (for controlled inputs)
  const [nameSearch, setNameSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  // Debounced values — only these trigger API calls
  const debouncedName = useDebounce(nameSearch, 500);
  const debouncedEmail = useDebounce(emailSearch, 500);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedName, debouncedEmail, filterRole]);

  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [patchPassword, { isLoading: resetting }] = usePostMutation();

  // Build query params
  const searchParams = {
    page: currentPage,
    per_page: itemsPerPage,
    ...(filterRole !== "All" && { student_type: filterRole.toLowerCase() }),
    ...(debouncedEmail && { email: debouncedEmail }),
    ...parseNameSearch(debouncedName),
  };

  const {
    data: res,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/students",
    params: searchParams,
  });

  const students = res?.data || [];
  const meta = res?.meta?.pagination;

  const tableData = students.map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    email: s.email,
    raw: s,
  }));

  const openResetModal = (student) => {
    setSelectedStudent(student.raw || student);
    setShowModal(true);
    setResetSuccess(false);
  };

  const handleResetPassword = async () => {
    if (!selectedStudent) return;

    try {
      await patchPassword({
        path: `/admin/students/${selectedStudent.uuid}/reset-pwd?_method=PATCH`,
        data: {},
      }).unwrap();

      toast.success("Password reset successfully!");
      setResetSuccess(true);
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  return (
    <>
      <div className="w-11/12 mx-auto">
        <Header
          title="All Students"
          icon={<Users2 />}
          showActionButton={false}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total",
              value: meta?.total_count ?? students.length,
              icon: Users2,
              color: "#aa0e0e",
            },
            {
              label: "Enrolled",
              value: students.filter((s) => s.status === "enrolled").length,
              icon: UserCheck,
              color: "#d61111",
            },
            {
              label: "Military",
              value: students.filter((s) => s.student_type === "military")
                .length,
              icon: Shield,
              color: "#aa0e0e",
            },
            {
              label: "Civilian",
              value: students.filter((s) => s.student_type === "civilian")
                .length,
              icon: Shield,
              color: "#d61111",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 flex-wrap">
            <div className="flex flex-wrap gap-4">
              {/* Name Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[] w-56"
                />
              </div>

              {/* Email Search */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[] w-56"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[]"
              >
                <option value="All">All Types</option>
                <option value="Military">Military</option>
                <option value="Civilian">Civilian</option>
              </select>
            </div>

            <p className="text-sm text-gray-600 self-center">
              Showing {students.length}
              {meta?.total_count ? ` of ${meta.total_count}` : ""}
            </p>
          </div>

          {/* Active search hint */}
          {debouncedName && (
            <div className="mt-3 text-xs text-gray-500">
              Searching:{" "}
              {(() => {
                const parsed = parseNameSearch(debouncedName);
                return Object.entries(parsed)
                  .map(([k, v]) => `${k}: "${v}"`)
                  .join(", ");
              })()}
            </div>
          )}
        </div>

        {isLoading && <Loader />}

        {isError && (
          <div className="text-red-600 text-center py-8">
            Error loading students
          </div>
        )}

        {!isLoading && !isError && (
          <Table
            columns={["Name", "Email"]}
            data={tableData}
            isLoading={isLoading}
            handleEditClick={openResetModal}
            setPage={setCurrentPage}
            setPer_page={setItemsPerPage}
            paginationMeta={meta}
            setIsEditModalOpen={setShowModal}
            setSelectedID={setSelectedStudent}
          />
        )}

        {/* Password Reset Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              {!resetSuccess ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Key className="w-6 h-6" style={{ color: "#d61111" }} />
                    <h3 className="text-xl font-bold">Reset Password</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Reset password for{" "}
                    <strong>
                      {selectedStudent?.first_name} {selectedStudent?.last_name}
                    </strong>
                    ?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={resetting}
                      className="px-5 py-2 bg-[#aa0e0e] text-white rounded-lg hover:opacity-90 transition disabled:opacity-70"
                    >
                      {resetting ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Password Reset Successful!
                    </h3>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <p className="font-medium mb-1">New Credentials:</p>
                    <p className="text-sm">
                      <strong>Email:</strong> {selectedStudent?.email}
                    </p>
                    <p className="text-sm">
                      <strong>Password:</strong>{" "}
                      {selectedStudent?.cnic.slice(-6)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 bg-[#d61111] text-white rounded-lg hover:opacity-90 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentManagement;
