import {
  AlertCircle,
  BookOpen,
  Calendar,
  Download,
  Edit2,
  FileText,
  Lock,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useDownloadChallanMutation,
  useGetQuery,
  usePostMutation,
} from "../../../api/apiSlice";
import DeleteModal from "../../ui/DeleteModal";
import ChallanApprovalModal from "../ChallanApprovalModal";
import StudentFeeEdit from "./StudentFeeEdit";

const StudentFeeTab = () => {
  const { id } = useParams();
  const [refundFee, { isLoading: isRefunding }] = usePostMutation();

  const [downloadChallan, { isLoading: isDownloading }] =
    useDownloadChallanMutation();
  const [downloadingInstallmentId, setDownloadingInstallmentId] =
    useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStudentInstallment, setSelectedStudentInstallment] =
    useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFeeUuid, setSelectedFeeUuid] = useState(null);

  const handleRefund = async (reason) => {
    if (!selectedFeeUuid) {
      toast.error("Fee UUID is missing");
      return;
    }

    try {
      await refundFee({
        path: `admin/fees/${selectedFeeUuid}/refund`,
        body: { remarks: reason },
      }).unwrap();

      toast.success("Refund processed successfully!");
      setIsDeleteModalOpen(false);
      setSelectedFeeUuid(null);
      refetchStudents();
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error(error?.data?.message || "Failed to process refund");
    }
  };

  const {
    data: studentData,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudents,
  } = useGetQuery({
    path: `/admin/student/${id}`,
  });

  useEffect(() => {
    refetchStudents();
  }, [refetchStudents]);

  // Check if an installment can be accessed based on previous installments
  const canAccessInstallment = (installments, currentIndex) => {
    // First installment is always accessible
    if (currentIndex === 0) {
      return true;
    }

    // Check if all previous installments are paid
    for (let i = 0; i < currentIndex; i++) {
      if (installments[i].status !== "paid") {
        return false;
      }
    }

    return true;
  };

  const classesWithFees = useMemo(() => {
    if (
      !studentData?.data?.class_details ||
      studentData.data.class_details.length === 0
    ) {
      return [];
    }

    return studentData.data.class_details.map((classDetail) => {
      const feeData = classDetail.fees || null;
      const installments = classDetail?.fees?.installments || [];

      // Check if any installment is paid
      const hasPaidInstallment = installments.some(
        (inst) => inst.status === "paid",
      );

      // ... rest of your paymentSummary logic
      let paymentSummary = null;
      if (feeData) {
        const totalFee = parseFloat(feeData.total_fee || 0);
        const discountFee = parseFloat(feeData.discount_fee || 0);
        const laptopFee = parseFloat(feeData.laptop_fee || 0);
        const netPayable = totalFee - discountFee + laptopFee;

        let totalPaid = 0;
        let totalPending = 0;
        let overdueCount = 0;

        installments.forEach((installment) => {
          const amount = parseFloat(installment.amount || 0);
          if (installment.status === "paid") {
            totalPaid += amount;
          } else if (
            installment.status === "pending" ||
            installment.is_overdue
          ) {
            totalPending += amount;
            if (installment.is_overdue) {
              overdueCount++;
            }
          }
        });

        paymentSummary = {
          totalFee,
          discountFee,
          laptopFee,
          netPayable,
          totalPaid,
          totalPending,
          remaining: netPayable - totalPaid,
          overdueCount,
        };
      }

      return {
        classDetail,
        feeData,
        installments,
        paymentSummary,
        hasPaidInstallment, // ← Add this
      };
    });
  }, [studentData]);

  const handleDownload = async (
    installment,
    installments,
    classIndex,
    installmentIndex,
  ) => {
    // Check if this installment can be accessed
    if (!canAccessInstallment(installments, installmentIndex)) {
      toast.error(
        `Please complete payment for Installment #${installmentIndex} first before downloading this challan.`,
      );
      return;
    }

    setDownloadingInstallmentId(installment.installment_id);
    try {
      await downloadChallan({
        path: `/admin/fees/installments/${installment.installment_uuid}/challan`,
        params: {},
        filename: `Challan_Class_${classIndex + 1}_Installment_${
          installmentIndex + 1
        }_${studentData.data.first_name}_${studentData.data.last_name}.pdf`,
      }).unwrap();

      toast.success(`Challan downloaded successfully`);
    } catch (error) {
      console.error("Challan download error:", error);
      toast.error("Failed to download challan. Please try again.");
    } finally {
      setDownloadingInstallmentId(null);
    }
  };

  const handleOpenUploadModal = (
    installment,
    installments,
    installmentIndex,
  ) => {
    // Check if this installment can be accessed
    if (!canAccessInstallment(installments, installmentIndex)) {
      toast.error(
        `Please complete payment for Installment #${installmentIndex} first before uploading payment proof.`,
      );
      return;
    }

    setSelectedStudentInstallment(installment);
    setIsUploadModalOpen(true);
  };

  if (studentIsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (studentError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <p className="text-red-600 text-center text-lg">
          Error loading fee information
        </p>
      </div>
    );
  }

  if (classesWithFees.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 m-4 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">
          No fee information available for this student
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Student Payment Overview */}
      <div className="custom-Background rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Student Fee Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Classes Enrolled</p>
            <p className="text-3xl font-bold">{classesWithFees.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Net Payable</p>
            <p className="text-3xl font-bold">
              Rs.{" "}
              {classesWithFees
                .reduce(
                  (sum, item) => sum + (item.paymentSummary?.netPayable || 0),
                  0,
                )
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Paid</p>
            <p className="text-3xl font-bold">
              Rs.{" "}
              {classesWithFees
                .reduce(
                  (sum, item) => sum + (item.paymentSummary?.totalPaid || 0),
                  0,
                )
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Class-wise Fee Details */}
      {classesWithFees.map((classItem, classIndex) => {
        const { classDetail, feeData, installments, paymentSummary } =
          classItem;

        return (
          <div
            key={classDetail.class_id}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Class Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6 text-brown" />
                    <h3 className="text-2xl font-bold text-gray-900">
                      {classDetail.course?.name}
                    </h3>
                  </div>
                  <p className="text-lg text-gray-700 font-medium mb-3">
                    {classDetail.name}
                  </p>
                </div>
                <span className="px-4 py-2 bg-beige text-white rounded-full text-sm font-semibold">
                  Class #{classIndex + 1}
                </span>
              </div>

              {/* Class Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-600 mb-1">Instructor</p>
                  <p className="font-semibold text-gray-800">
                    {classDetail.teacher?.name || "N/A"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-600 mb-1">Hall</p>
                  <p className="font-semibold text-gray-800">
                    {classDetail.hall?.name || "N/A"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-600 mb-1">Timing</p>
                  <p className="font-semibold text-gray-800">
                    {classDetail.timing || "N/A"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-600 mb-1">Batch</p>
                  <p className="font-semibold text-gray-800">
                    {classDetail.batch?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            {feeData && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between ">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <h1 className="w-10 h-10 flex bg-beige items-center justify-center rounded-full text-white text-md font-semibold">
                      Rs
                    </h1>
                    Fee Structure
                  </h4>
                  <div className="flex items-center gap-2">
                    {feeData.installments?.[0].status !== "paid" && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-white bg-brown  p-2 rounded-lg my-2"
                      >
                        <Edit2 />
                      </button>
                    )}

                    {classItem?.hasPaidInstallment && (
                      <button
                        onClick={() => {
                          setSelectedFeeUuid(feeData.fee_uuid);
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg my-2 transition-colors"
                        title="Refund Fee"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>

                <DeleteModal
                  isOpen={isDeleteModalOpen}
                  message="Are you sure you want to refund"
                  confirmText="Refund"
                  setIsOpen={setIsDeleteModalOpen}
                  cancelText="Cancel"
                  onClose={() => setIsDeleteModalOpen(false)}
                  successMessage="Record deleted successfully!"
                  requireReason={true}
                  reasonLabel="Reason"
                  onConfirm={handleRefund}
                />

                <StudentFeeEdit
                  isOpen={isEditModalOpen}
                  onClose={() => setIsEditModalOpen(false)}
                  studentData={studentData}
                  studentUuid={id}
                  refetch={refetchStudents}
                  isLoadingStudent={studentIsLoading}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Course Fee</p>
                    <p className="text-xl font-bold text-green-700">
                      Rs. {parseFloat(feeData.total_fee || 0).toLocaleString()}
                    </p>
                  </div>

                  {parseFloat(feeData.discount_fee || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                      <p className="text-sm text-gray-600 mb-1">Discount</p>
                      <p className="text-xl font-bold text-purple-700">
                        Rs.{" "}
                        {parseFloat(feeData.discount_fee || 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {parseFloat(feeData.laptop_fee || 0) > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600 mb-1">Laptop Fee</p>
                      <p className="text-xl font-bold text-orange-700">
                        Rs.{" "}
                        {parseFloat(feeData.laptop_fee || 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="custom-Background rounded-lg p-4 shadow-sm text-white">
                    <p className="text-sm opacity-90 mb-1">Net Payable</p>
                    <p className="text-xl font-bold">
                      Rs. {paymentSummary?.netPayable.toLocaleString()}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      {feeData.total_installments || 0} Installments
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Installments Details */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brown" />
                  Installments Details
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {installments.length} Installment
                    {installments.length !== 1 ? "s" : ""}
                  </span>
                  {paymentSummary?.overdueCount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold animate-pulse">
                      {paymentSummary.overdueCount} Overdue
                    </span>
                  )}
                </div>
              </div>

              {installments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No installments added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installments.map((installment, installmentIndex) => {
                    const dueDate = installment.due_date
                      ? new Date(installment.due_date)
                      : null;
                    const paidDate = installment.paid_date
                      ? new Date(installment.paid_date)
                      : null;

                    const isAccessible = canAccessInstallment(
                      installments,
                      installmentIndex,
                    );

                    let statusConfig;
                    if (installment.status === "paid") {
                      statusConfig = {
                        bg: "bg-green-50",
                        border: "border-green-200",
                        badge: "bg-green-100 text-green-700",
                        label: "Paid",
                        icon: "✓",
                      };
                    } else if (!isAccessible) {
                      statusConfig = {
                        bg: "bg-gray-50",
                        border: "border-gray-300",
                        badge: "bg-gray-100 text-gray-600",
                        label: "Locked",
                        icon: "🔒",
                      };
                    } else if (installment.is_overdue) {
                      statusConfig = {
                        bg: "bg-red-50",
                        border: "border-red-200",
                        badge: "bg-red-100 text-red-700",
                        label: "Overdue",
                        icon: "!",
                      };
                    } else {
                      statusConfig = {
                        bg: "bg-yellow-50",
                        border: "border-yellow-200",
                        badge: "bg-yellow-100 text-yellow-700",
                        label: "Pending",
                        icon: "⏱",
                      };
                    }

                    return (
                      <div
                        key={installment.installment_id}
                        className={`${statusConfig.bg} border-2 ${
                          statusConfig.border
                        } rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${
                          !isAccessible ? "opacity-70" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-gray-700 shadow-md border-2 border-gray-200">
                              #{installmentIndex + 1}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">
                                Installment Amount
                              </p>
                              <p className="text-2xl font-bold text-gray-800">
                                Rs.{" "}
                                {parseFloat(
                                  installment.amount,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-bold ${statusConfig.badge} shadow-sm`}
                            >
                              {statusConfig.icon} {statusConfig.label}
                            </span>

                            {/* Download Button */}
                            <button
                              onClick={() =>
                                handleDownload(
                                  installment,
                                  installments,
                                  classIndex,
                                  installmentIndex,
                                )
                              }
                              disabled={
                                !isAccessible ||
                                (isDownloading &&
                                  downloadingInstallmentId ===
                                    installment.installment_id)
                              }
                              className={`p-2 rounded-lg transition-colors shadow-md hover:shadow-lg ${
                                isAccessible
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              } disabled:opacity-50`}
                              title={
                                isAccessible
                                  ? "Download Challan"
                                  : "Complete previous installment first"
                              }
                            >
                              {isDownloading &&
                              downloadingInstallmentId ===
                                installment.installment_id ? (
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                              ) : isAccessible ? (
                                <Download className="w-5 h-5" />
                              ) : (
                                <Lock className="w-5 h-5" />
                              )}
                            </button>

                            {/* Upload Button */}
                            {installment.status !== "paid" && (
                              <button
                                onClick={() =>
                                  handleOpenUploadModal(
                                    installment,
                                    installments,
                                    installmentIndex,
                                  )
                                }
                                disabled={!isAccessible}
                                className={`p-2 rounded-lg shadow-md transition-colors ${
                                  isAccessible
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                                title={
                                  isAccessible
                                    ? "Upload Payment Proof"
                                    : "Complete previous installment first"
                                }
                              >
                                {isAccessible ? (
                                  <Upload className="w-5 h-5" />
                                ) : (
                                  <Lock className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Locked Warning Message */}
                        {!isAccessible && installment.status !== "paid" && (
                          <div className="mb-3 bg-gray-100 border border-gray-300 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Locked:</span>{" "}
                              Complete payment for Installment #
                              {installmentIndex} to unlock this installment.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Due Date
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                installment.is_overdue &&
                                installment.status !== "paid"
                                  ? "text-red-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {dueDate
                                ? dueDate.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Not set"}
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Paid Date
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                              {paidDate ? (
                                paidDate.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              ) : (
                                <span className="text-gray-400">
                                  Not paid yet
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {installment.note && (
                          <div className="mt-3 bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-600 mb-1 font-medium">
                              Note
                            </p>
                            <p className="text-sm text-gray-700">
                              {installment.note}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isUploadModalOpen && selectedStudentInstallment && (
        <ChallanApprovalModal
          isOpen={isUploadModalOpen}
          setIsOpen={setIsUploadModalOpen}
          student={selectedStudentInstallment}
          refetchStudents={refetchStudents}
        />
      )}
    </div>
  );
};

export default StudentFeeTab;
