import React, { useState } from "react";
import { toast } from "react-toastify";
import Table from "../../ui/Table";
import Header from "../../ui/Header";
import { Search, Shield, UserCheck, Users2, Key } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import Loader from "../../ui/common/LoaderComponent";
import CreateEditModal from "../components/CreateEditModal";
import CreateEditUserModal from "../components/CreateEditUser";
import ChangeUserPassword from "../components/ChangeUserPassword";

const Users = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState(null);

  const [patchPassword, { isLoading: resetting }] = usePostMutation();
  const [changePassword, { isLoading: changingPassword }] = usePostMutation();

  const {
    data: res,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/user/employees",
    params: { page: currentPage, per_page: itemsPerPage },
  });

  const students = res?.data || [];
  const meta = res?.meta?.pagination;

  const filteredStudents = students.filter((s) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      s.first_name.toLowerCase().includes(search) ||
      s.last_name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search);
    const matchesRole =
      filterRole === "All" || s.student_type === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const tableData = filteredStudents.map((s) => ({
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
        path: `/admin/reset-password/${selectedStudent.uuid}?method=PATCH`,
        data: {},
      }).unwrap();

      toast.success("Password reset successfully!");
      setResetSuccess(true);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  const openResetPasswordModal = (student) => {
    setSelectedStudent(student.raw || student);
    setIsResetPassword(true); // This opens the reset password modal
    setResetSuccess(false);
  };

  const handleChangePasswordClick = (student) => {
    setChangePasswordUser(student.raw || student);
    setIsChangePasswordOpen(true);
  };

  const handleChangePassword = async ({
    userId,
    userEmail,
    confirmPassword,
    currentPassword,
    newPassword,
  }) => {
    try {
      await changePassword({
        path: `/admin/users/${userId}/change-password`,
        body: {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
          // email: userEmail,
        },
      }).unwrap();

      toast.success("Password changed successfully!");
      setIsChangePasswordOpen(false);
      setChangePasswordUser(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password");
      throw err;
    }
  };

  return (
    <>
      <Header
        title="All Users"
        icon={<Users2 />}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />

      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#aa0e0e] w-64"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#aa0e0e]"
            >
              <option value="All">All Types</option>
              <option value="Military">Military</option>
              <option value="Civilian">Civilian</option>
            </select>
          </div>
          <p className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length}
          </p>
        </div>
      </div>

      {isLoading && <Loader />}

      {isError && (
        <div className="text-red-600 text-center py-8">Error loading Users</div>
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
          sourceComponent="UsersComponents"
          handleResetPasswordClick={openResetPasswordModal}
          handleChangePasswordClick={handleChangePasswordClick}
        />
      )}
      <CreateEditUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        user={null}
        refetchUsers={() => {}}
      />
      <CreateEditUserModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStudent(null);
        }}
        user={selectedStudent}
        refetchUsers={() => {}}
      />
      <ChangeUserPassword
        isOpen={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setChangePasswordUser(null);
        }}
        user={changePasswordUser}
        onSubmit={handleChangePassword}
        isLoading={changingPassword}
      />

      {isResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {!resetSuccess ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Key className="w-6 h-6" style={{ color: "#4E5566" }} />
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
                    onClick={() => setIsResetPassword(false)}
                    className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="px-5 py-2 bg-[#d61111] text-white rounded-lg hover:opacity-90 transition disabled:opacity-70"
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
                    {selectedStudent?.cnic.replace(/-/g, "").slice(-6)}
                  </p>
                </div>
                <button
                  onClick={() => setIsResetPassword(false)}
                  className="w-full py-3 bg-[#aa0e0e] text-white rounded-lg hover:opacity-90 transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Users;
