import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useDeleteMutation,
  useGetQuery,
  usePatchMutation,
} from "../../api/apiSlice";
import Students from "../../assets/icons/navbar/students";
import BulkDeleteModal from "../ui/BulkDeleteModal";
import Loader from "../ui/common/LoaderComponent";
import { showToast } from "../ui/common/ShowToast";
import DeleteModal from "../ui/DeleteModal";
import Header from "../ui/Header";
import Table from "../ui/Table";
import ChallanApprovalModal from "./ChallanApprovalModal";
import EditStudentModal from "./editStudentModal/EditStudentModal";
import GenerateChallanModal from "./GenerateChallanModal";
import StudentDetailsModal from "./StudentDetailsModal";
import BatchTabs from "../ui/BatchTabs";

const getStatusConfig = (status) => {
  const statusLower = status?.toLowerCase() || "";
  const statusConfigs = {
    enrolled: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Enrolled",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
    },
    process: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      label: "Process",
    },
  };

  for (const [key, config] of Object.entries(statusConfigs)) {
    if (statusLower.includes(key)) {
      return config;
    }
  }

  return {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: status || "N/A",
  };
};

const columns = [
  "Name",
  "Email",
  "Instructor",
  "Class",
  "Course",
  "Category",
  // "Status",
];

const columnsFilters = [
  {
    field: "number",
    key: "serialNumber",
    placeholder: "Search SR #",
    isDisabled: true,
  },
  {
    field: "text",
    key: "name",
    placeholder: "Search Name",
    isDisabled: false,
  },
  {
    field: "email",
    key: "email",
    placeholder: "Search Email",
    isDisabled: false,
  },

  {
    field: "text",
    key: "instructor",
    placeholder: "Search Instructor",
    isDisabled: false,
  },

  {
    field: "number",
    key: "fee",
    placeholder: "Search Fee",
    isDisabled: false,
  },
  {
    field: "date",
    key: "dueDate",
    placeholder: "Search Due Date",
    isDisabled: false,
  },
  {
    field: "Dropdown",
    key: "status",
    placeholder: "Search Status",
    isDisabled: false,
  },
  {
    field: "button",
    key: "action",
    placeholder: "Reset",
    isDisabled: false,
  },
];

const StudentsComponent = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] =
    useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [initialValues, setInitialValues] = useState({});
  const [batchOptions, setBatchOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeBatchTab, setActiveBatchTab] = useState("all"); // NEW: Batch filter state

  // Search/Filter state
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    instructor: "",
    course: "",
    fee: "",
    dueDate: "",
    status: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [selectedStudentForChallan, setSelectedStudentForChallan] =
    useState(null);
  const [isGenerateChallanModalOpen, setIsGenerateChallanModalOpen] =
    useState(false);
  const [selectedStudentForGeneration, setSelectedStudentForGeneration] =
    useState(null);

  const FILTER_OPTIONS = [
    { value: "all", label: "All Students" },
    { value: "enrolled", label: "Enrolled" },
    { value: "process", label: "In Process" }, // matches API status exactly
  ];

  const { classUuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const classData = location.state?.classData;
  const course = location.state?.course;

  const handleViewChallan = (student) => {
    setSelectedStudentForChallan(student);
    setIsChallanModalOpen(true);
  };

  const handleGenerateChallan = (student) => {
    setSelectedStudentForGeneration(student);
    setIsGenerateChallanModalOpen(true);
  };

  const [deleteStudent] = useDeleteMutation();
  const [patch] = usePatchMutation();

  const queryParams = new URLSearchParams(location.search);
  const activeStatus = queryParams.get("active_status");
  const gender = queryParams.get("gender");
  const dailyPaidFee = queryParams.get("daily_paid_fee");
  const weeklyPaidFee = queryParams.get("weekly_paid_fee");
  const monthlyPaidFee = queryParams.get("monthly_paid_fee");
  const dailyPendingFee = queryParams.get("daily_pending_fee");
  const weeklyPendingFee = queryParams.get("weekly_pending_fee");
  const monthlyPendingFee = queryParams.get("monthly_pending_fee");
  const isHostalize = queryParams.get("isHostalize");
  const dailyFee = queryParams.get("daily_fee");
  const weeklyFee = queryParams.get("weekly_fee");
  const monthlyFee = queryParams.get("monthly_fee");

  // Debounce effect - wait 500ms after user stops typing before making API call
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1); // Reset to first page when filters change
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const apiParams = useMemo(() => {
    const params = {
      page: currentPage,
      per_page: itemsPerPage,
      class_id: classUuid,
      include_class_details: true,
      ...(selectedFilter !== "all" && { status: selectedFilter }),
      ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }),

      // Previous dynamic states
      ...(activeStatus && { active_status: activeStatus }),
      ...(gender && { gender }),
      ...(dailyPaidFee && { daily_paid_fee: dailyPaidFee }),
      ...(weeklyPaidFee && { weekly_paid_fee: weeklyPaidFee }),
      ...(monthlyPaidFee && { monthly_paid_fee: monthlyPaidFee }),
      ...(dailyPendingFee && { daily_pending_fee: dailyPendingFee }),
      ...(weeklyPendingFee && { weekly_pending_fee: weeklyPendingFee }),
      ...(monthlyPendingFee && { monthly_pending_fee: monthlyPendingFee }),
      ...(dailyFee && { daily_fee: dailyFee }),
      ...(weeklyFee && { weekly_fee: weeklyFee }),
      ...(monthlyFee && { monthly_fee: monthlyFee }),
      ...(isHostalize && { is_hostalize: isHostalize }),
    };

    // ✅ Name filter: first_name / last_name logic
    if (debouncedFilters.name?.trim()) {
      const nameQuery = debouncedFilters.name.trim();
      const parts = nameQuery.split(/\s+/).filter(Boolean);

      if (parts.length >= 2) {
        params.first_name = parts[0];
        params.last_name = parts[parts.length - 1];
      } else {
        params.first_name = nameQuery;
        params.last_name = nameQuery;
      }
    }

    // Other filters
    if (debouncedFilters.instructor?.trim()) {
      params.teacher = debouncedFilters.instructor.trim();
    }
    if (debouncedFilters.course?.trim()) {
      params.course = debouncedFilters.course.trim();
    }
    if (debouncedFilters.email?.trim()) {
      params.email = debouncedFilters.email.trim();
    }
    if (debouncedFilters.fee?.trim()) {
      params.fee = debouncedFilters.fee.trim();
    }
    if (debouncedFilters.dueDate?.trim()) {
      params.due_date = debouncedFilters.dueDate.trim();
    }
    if (debouncedFilters.status?.trim()) {
      params.status = debouncedFilters.status.trim();
    }

    return params;
  }, [
    currentPage,
    itemsPerPage,
    classUuid,
    selectedFilter,

    debouncedFilters,
    activeStatus,
    gender,

    dailyPaidFee,
    weeklyPaidFee,
    monthlyPaidFee,
    activeBatchTab,
    dailyPendingFee,
    weeklyPendingFee,
    monthlyPendingFee,

    dailyFee,
    weeklyFee,
    monthlyFee,

    isHostalize,
  ]);

  // FINAL API CALL
  const {
    data: studentsData,
    error: studentError,
    isLoading: studentIsLoading,
    isFetching: isStudentsFetching,

    refetch: refetchStudents,
  } = useGetQuery({
    path: `/admin/students`,
    params: apiParams,
  });

  const meta = studentsData?.meta?.pagination;

  // const meta = studentsData?.meta?.pagination;

  const students = useMemo(() => {
    if (!studentsData?.data) return [];
    let filteredStudents = studentsData.data;

    if (classUuid && classData) {
      filteredStudents = studentsData.data.filter(
        (student) => student.class_id === classData.class_id,
      );
    }

    return filteredStudents;
  }, [studentsData, classUuid, classData]);

  const handleEditClick = (item) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const handleBackToClasses = () => {
    if (course) {
      navigate(`/dashboard/courses/${course.uuid}/classes`, {
        state: { course },
      });
    } else {
      navigate("/dashboard/classes");
    }
  };

  useEffect(() => {
    if (currentItem) {
      const student = students?.find(
        (student) => student.uuid === currentItem.uuid,
      );
      if (student) {
        const newInitialValues = {
          firstName: student.first_name || "",
          lastName: student.last_name || "",
          email: student.email || "",
          fixed_fee: student.fixed_fee || "",
          cnic: student.cnic || "",
          category: student.student_type || "",
          phoneNo: student.contact || "",
          qualification: student.qualification || "",
          guardianName: student.father_name || "",
          guardianPhoneNo: student.father_contact || "",
          address: student.address || "",
          gender: student.gender || "",
          city: student.city || "",
          class_id: student.class_id || "",
          fixed_fee_date: student.fixed_fee_date || "",
          dateOfBirth: student.dob || "",
          bio: student.bio || "",
          is_hostalize: student.is_hostalize === 1 || false,
          marital_status: student.marital_status || "",
          batchOptions: batchOptions,
          // teacherOptions: teacherOptions,
          instructor: student.teacher_id ? String(student.teacher_id) : "",
          user_image: student.user_image || null,
        };
        setInitialValues(newInitialValues);
        setSelectedID(student.id);
        setSelectedUuid(student.uuid);
      } else {
        console.log("Student not found for uuid:", currentItem.uuid);
      }
    }
  }, [currentItem, students, batchOptions]);

  // const mappedStudentsData = useMemo(() => {
  //   return students?.map((student) => {
  //     const allInstallments =
  //       student?.class_details?.flatMap(
  //         (classItem) => classItem?.fees?.installments || [],
  //       ) || [];

  //     const firstPendingInstallment = allInstallments.find(
  //       (inst) => inst.status === "pending",
  //     );

  //     const hasNoFees = allInstallments.length === 0;
  //     const statusValue = student?.status || "Pending";
  //     const statusConfig = getStatusConfig(statusValue);
  //     const firstClassDetail = student?.class_details?.[0];

  //     return {
  //       id: student.id,
  //       uuid: student.uuid,
  //       name: student.first_name + " " + student.last_name,
  //       email: student.email,
  //       instructor:
  //         firstClassDetail?.teacher?.name || student?.teacher_name || "_",
  //       class: firstClassDetail?.name || "_",
  //       course: firstClassDetail?.course?.name || "_",
  //       category: student?.student_type,
  //       fee: student.fixed_fee,
  //       "due date": student.fixed_fee_date,
  //       is_active: student.active_status,
  //       role: student.role,
  //       has_pending_installment: !!firstPendingInstallment,
  //       first_pending_installment: firstPendingInstallment,
  //       has_no_fees: hasNoFees,
  //       class_id: student.class_id,
  //       laptopProvided: student.laptop_provided,
  //       class_details: firstClassDetail,
  //       status: statusValue,
  //       statusConfig: statusConfig,
  //     };
  //   });
  // }, [students]);

  // No need for frontend filtering anymore - backend handles it

  // const mappedStudentsData = useMemo(() => {
  //   return students?.map((student) => {
  //     const allInstallments =
  //       student?.class_details?.flatMap(
  //         (classItem) => classItem?.fees?.installments || [],
  //       ) || [];

  //     const firstPendingInstallment = allInstallments.find(
  //       (inst) => inst.status === "pending",
  //     );

  //     const hasNoFees = allInstallments.length === 0;
  //     const statusValue = student?.status || "Pending";
  //     const statusConfig = getStatusConfig(statusValue);
  //     const firstClassDetail = student?.class_details?.[0];

  //     // ✅ Extract fee status from class_details.fees.status
  //     const classFeeStatus = firstClassDetail?.fees?.status || null;
  //     const classFeeStatusConfig = classFeeStatus
  //       ? getStatusConfig(classFeeStatus)
  //       : null;

  //     return {
  //       id: student.id,
  //       uuid: student.uuid,
  //       name: student.first_name + " " + student.last_name,
  //       email: student.email,
  //       instructor:
  //         firstClassDetail?.teacher?.name || student?.teacher_name || "_",
  //       class: firstClassDetail?.name || "_",
  //       class_fee_status: classFeeStatus, // ✅ e.g. "process", "paid", "pending"
  //       class_fee_status_config: classFeeStatusConfig, // ✅ config for badge styling
  //       course: firstClassDetail?.course?.name || "_",
  //       category: student?.student_type,
  //       fee: student.fixed_fee,
  //       "due date": student.fixed_fee_date,
  //       is_active: student.active_status,
  //       role: student.role,
  //       has_pending_installment: !!firstPendingInstallment,
  //       first_pending_installment: firstPendingInstallment,
  //       has_no_fees: hasNoFees,
  //       class_id: student.class_id,
  //       laptopProvided: student.laptop_provided,
  //       class_details: firstClassDetail,
  //       status: statusValue,
  //       statusConfig: statusConfig,
  //     };
  //   });
  // }, [students]);

  const mappedStudentsData = useMemo(() => {
    return students?.map((student) => {
      const allInstallments =
        student?.class_details?.flatMap(
          (classItem) => classItem?.fees?.installments || [],
        ) || [];

      const firstPendingInstallment = allInstallments.find(
        (inst) => inst.status === "pending",
      );

      const hasNoFees = allInstallments.length === 0;
      const statusValue = student?.status || "Pending";
      const statusConfig = getStatusConfig(statusValue);

      // ✅ Map ALL classes with their individual fee status
      const allClasses =
        student?.class_details?.map((classItem) => ({
          name: classItem?.name || "_",
          fee_status: classItem?.fees?.status || null,
        })) || [];

      // Keep first class for instructor/course (used elsewhere)
      const firstClassDetail = student?.class_details?.[0];

      return {
        id: student.id,
        uuid: student.uuid,
        name: student.first_name + " " + student.last_name,
        email: student.email,
        instructor:
          firstClassDetail?.teacher?.name || student?.teacher_name || "_",
        // ✅ Replace single class with all_classes array
        class: firstClassDetail?.name || "_", // kept for fallback
        all_classes: allClasses, // ✅ NEW: all classes
        class_fee_status: firstClassDetail?.fees?.status || null, // fallback
        course: firstClassDetail?.course?.name || "_",
        category: student?.student_type,
        fee: student.fixed_fee,
        "due date": student.fixed_fee_date,
        is_active: student.active_status,
        role: student.role,
        has_pending_installment: !!firstPendingInstallment,
        first_pending_installment: firstPendingInstallment,
        has_no_fees: hasNoFees,
        class_id: student.class_id,
        laptopProvided: student.laptop_provided,
        class_details: firstClassDetail,
        status: statusValue,
        statusConfig: statusConfig,
      };
    });
  }, [students]);
  const filteredStudentsData = mappedStudentsData;

  const { data: batchData } = useGetQuery({
    path: "/admin/batches",
    params: { active_status: 1 },
  });

  useEffect(() => {
    if (batchData) {
      const transformedBatchOptions = batchData.data.map((item) => ({
        value: item.class_id,
        label: item.name,
      }));
      setBatchOptions(transformedBatchOptions);
    }
  }, [batchData]);

  const handleDeleteConfirm = async () => {
    try {
      await deleteStudent({ path: `/admin/student/${selectedID}` }).unwrap();
      setIsDeleteModalOpen(false);
      refetchStudents();
      showToast("Student deleted successfully", "success");
    } catch (err) {
      showToast(
        "Failed to delete student: " + (err.data?.message || err.message),
        "error",
      );
    }
  };

  const handleBulkDeleteConfirm = () => {};

  const handleEditSubmit = async (formState) => {
    const formData = new FormData();
    formData.append("first_name", formState.firstName || "");
    formData.append("last_name", formState.lastName || "");
    formData.append("email", formState.email || "");
    formData.append("fixed_fee", formState.fixed_fee || "");
    formData.append("cnic", formState.cnic || "");
    formData.append("contact", formState.phoneNo || "");
    formData.append("qualification", formState.qualification || "");
    formData.append("father_name", formState.guardianName || "");
    formData.append("father_contact", formState.guardianPhoneNo || "");
    formData.append("address", formState.address || "");
    formData.append("gender", formState.gender || "");
    formData.append("city", formState.city || "");
    formData.append("class_id", formState.class_id || "");
    formData.append("fixed_fee_date", formState.fixed_fee_date || "");
    formData.append("dob", formState.dateOfBirth || "");
    formData.append("bio", formState.bio || "");
    formData.append("is_hostalize", formState.is_hostalize ? "1" : "0");
    formData.append("marital_status", formState.marital_status || "");
    formData.append("teacher_id", formState.instructor || "");

    if (formState.user_image) {
      formData.append("user_image", formState.user_image);
    }

    formData.append("password", formState.cnic || "");
    formData.append("active_status", formState.active_status || "0");

    try {
      const response = await patch({
        path: `/admin/student/${selectedUuid}`,
        body: formData,
      }).unwrap();

      if (response.message === "Success." && response.status === 1) {
        showToast("Student updated successfully", "success");
        setIsEditModalOpen(false);
        refetchStudents();
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      showToast(
        "Failed to update student: " + (err.data?.message || err.message),
        "error",
      );
      setIsEditModalOpen(true);
    }
  };

  const handleSwitchToggle = async (modifiedItemId) => {
    const student = students.find((student) => student.id === modifiedItemId);

    const modifiedItemUuid = student.uuid;

    try {
      await patch({
        path: `/admin/student/${modifiedItemUuid}`,
      }).unwrap();
      refetchStudents();
      showToast("Student status updated successfully", "success");
    } catch (err) {
      showToast(
        "Failed to update status: " + (err.data?.message || err.message),
        "error",
      );
    }
  };

  const handleResetChange = () => {
    setFilters({
      name: "",
      instructor: "",
      course: "",
      fee: "",
      dueDate: "",
      status: "",
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {classUuid && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={handleBackToClasses}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Classes
          </button>
          {classData && (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {classData.course?.name} - {classData.name}
              </h1>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>
                  <span className="font-medium">Instructor:</span>{" "}
                  {classData.teacher?.name}
                </span>
                <span>
                  <span className="font-medium">Hall:</span>{" "}
                  {classData.hall?.name}
                </span>
                <span>
                  <span className="font-medium">Time:</span> {classData.timing}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* <div className="flex gap-6">
          {statsData.map((data, index) => (
            <StatsCards
              key={index}
              label={data.label}
              value={data.value}
              showDate={false}
            />
          ))}
        </div> */}

        <Header
          IconComponent={Students}
          batchButton="student"
          title="Students"
          TotalCategories={
            studentIsLoading || studentError || isStudentsFetching
              ? null
              : meta?.total || mappedStudentsData?.length
          }
          sourceComponent="StudentsComponent"
        />
        <BatchTabs
          setActiveBatchTab={setActiveBatchTab}
          activeBatchTab={activeBatchTab}
        />
        <div className="mb-6 flex gap-3 flex-wrap">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedFilter === filter.value
                  ? "bg-brown text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
          {/* NEW: Batch Filter Tabs */}
        </div>

        {(studentIsLoading || isStudentsFetching) && <Loader />}

        {studentError && (
          <div className="text-red-600 text-center py-8">
            Error loading students
          </div>
        )}

        {!studentIsLoading && !studentError && (
          <Table
            data={filteredStudentsData}
            columns={columns}
            columnsFilters={columnsFilters}
            handleFilterChange={handleFilterChange}
            handleResetChange={handleResetChange}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
            setIsStudentDetailsModalOpen={setIsStudentDetailsModalOpen}
            setSelectedID={setSelectedID}
            handleSwitchToggle={handleSwitchToggle}
            handleEditClick={handleEditClick}
            onViewChallan={handleViewChallan}
            onGenerateChallan={handleGenerateChallan}
            ColumnUnderline={true}
            sourceComponent="StudentsComponent"
            borderNone={false}
            setPage={setCurrentPage}
            setPer_page={setItemsPerPage}
            paginationMeta={meta}
          />
        )}

        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialValues={initialValues}
          onSubmit={handleEditSubmit}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemName="student"
        />

        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
        />

        <StudentDetailsModal
          isOpen={isStudentDetailsModalOpen}
          onClose={() => setIsStudentDetailsModalOpen(false)}
          student={currentItem}
        />

        <ChallanApprovalModal
          isOpen={isChallanModalOpen}
          onClose={() => setIsChallanModalOpen(false)}
          student={selectedStudentForChallan}
        />

        <GenerateChallanModal
          isOpen={isGenerateChallanModalOpen}
          onClose={() => setIsGenerateChallanModalOpen(false)}
          student={selectedStudentForGeneration}
        />
      </div>
    </div>
  );
};

export default StudentsComponent;
