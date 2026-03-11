import { ChevronLeft, Download, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDeleteMutation, useGetQuery } from "../../../../api/apiSlice";
import StudentsIcon from "../../../../assets/icons/navbar/students";
import DeleteModal from "../../../ui/DeleteModal";
import Header from "../../../ui/Header";
import Table from "../../../ui/Table";
import Loader from "../../../ui/common/LoaderComponent";
import { showToast } from "../../../ui/common/ShowToast";
import DownloadStudentsModal from "../DownloadStudentsModal";
import ClassFeedBackAverage from "./ClassFeedBackAvrage";

const columns = ["Name", "email", "Instructor", "Class", "Course", "Category"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Students" },
  { value: "enrolled", label: "Enrolled" },
  { value: "process", label: "In Process" },
];
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

const ClassStudents = () => {
  const { classUuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [itemPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFeedbackAverage, setShowFeedbackAverage] = useState(false);
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
  const course = location.state?.course;
  const [deleteStudent] = useDeleteMutation();

  const { data: feedbackData } = useGetQuery({
    path: `admin/feedback/classes/${classUuid}/summary`,
  });
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
      per_page: itemPerPage, // ✅ use itemPerPage (the stateful one)
      class_id: classUuid,
      include_class_details: true,
      ...(selectedFilter !== "all" && { status: selectedFilter }),
    };

    // Name filter: split into first_name / last_name
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
  }, [currentPage, itemPerPage, classUuid, selectedFilter, debouncedFilters]);

  const {
    data: studentsResponse,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudents,
  } = useGetQuery({
    path: `/admin/students`,
    // params: {
    //   per_page: itemPerPage,
    //   page: currentPage,
    //   class_id: classUuid,
    //   include_class_details: true,
    //   ...(selectedFilter !== "all" && { status: selectedFilter }),
    // },
    params: apiParams,
  });

  useEffect(() => {
    refetchStudents();
  }, [refetchStudents]);

  const handleBackToClasses = () => {
    if (course) {
      navigate(`/dashboard/courses/${course.uuid}/classes`, {
        state: { course },
      });
    } else {
      navigate("/dashboard/classes");
    }
  };

  const studentsData = studentsResponse?.data || [];
  const meta = studentsResponse?.meta?.pagination;

  const classData =
    studentsData.length > 0
      ? studentsData[0]?.class_details?.[0] || null
      : null;

  const mappedStudentsData = useMemo(() => {
    return studentsData?.map((student) => {
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
  }, [studentsData]);
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

  const handleSwitchToggle = (studentId, newStatus) => {
    console.log("Toggle status for student:", studentId, newStatus);
  };

  const handleEditClick = (student) => {
    navigate(`/dashboard/classes/student/edit/${student.uuid}`);
  };

  const handleViewChallan = (studentId) => {
    console.log("View challan for student:", studentId);
  };

  const handleGenerateChallan = (studentId) => {
    console.log("Generate challan for student:", studentId);
  };

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

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };

  // Check if feedback data exists and has responses
  const hasFeedbackData =
    feedbackData && feedbackData.questions && feedbackData.questions.length > 0;

  // Conditionally render feedback average component
  if (showFeedbackAverage) {
    return (
      <ClassFeedBackAverage
        feedbackData={feedbackData}
        classData={classData}
        onBack={() => setShowFeedbackAverage(false)}
      />
    );
  }

  return (
    <div className="w-11/12 mx-auto">
      {classUuid && (
        <div className="mb-6">
          <button
            onClick={handleBackToClasses}
            className="flex items-center gap-2 text-brown hover:text-beige transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Classes</span>
          </button>

          {classData && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {classData.course?.name} - {classData.name}
                  </h2>
                  <div className="flex gap-6 mt-3 text-sm text-gray-600">
                    <span>
                      <span className="font-semibold text-gray-800">
                        Instructor:
                      </span>{" "}
                      {classData.teacher?.name || "Not assigned"}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-800">Hall:</span>{" "}
                      {classData.hall?.name || "Not assigned"}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-800">Time:</span>{" "}
                      {classData.timing || "Not scheduled"}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-800">
                        Batch:
                      </span>{" "}
                      {classData.batch?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm">
                    <span>
                      <span className="font-semibold text-gray-800">
                        Total Students:
                      </span>{" "}
                      <span className="text-brown font-medium">
                        {meta?.total}
                      </span>
                    </span>
                    <span>
                      <span className="font-semibold text-gray-800">
                        Capacity:
                      </span>{" "}
                      <span className="text-brown font-medium">
                        {classData.total_students}/{classData.seats} (
                        {classData.capacity_percentage}%)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* Feedback Average Button - Only show if feedback data exists */}
                  {hasFeedbackData && (
                    <button
                      onClick={() => setShowFeedbackAverage(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                      title="View Class Feedback Average"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Feedback Average</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownloadClick}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                    title="Download Students List"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Header
        title="Class Students"
        icon={<StudentsIcon />}
        batchButton="student"
        sourceComponent="StudentsComponent"
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
            {selectedFilter === filter.value && (
              <span className="text-sm opacity-90">({meta?.total})</span>
            )}
          </button>
        ))}
      </div>

      {studentIsLoading && <Loader />}

      {studentError && (
        <div className="text-red-500 text-center py-8">
          Error loading students data
        </div>
      )}

      {!studentIsLoading && !studentError && (
        <Table
          data={mappedStudentsData}
          columns={columns}
          columnsFilters={columnsFilters}
          handleFilterChange={handleFilterChange}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setSelectedID={setSelectedID}
          handleSwitchToggle={handleSwitchToggle}
          handleEditClick={handleEditClick}
          onViewChallan={handleViewChallan}
          onGenerateChallan={handleGenerateChallan}
          ColumnUnderline={true}
          sourceComponent="StudentsComponent"
          borderNone={false}
          link={"/dashboard/class-student/edit"}
          setPage={setCurrentPage}
          setPer_page={setItemsPerPage}
          paginationMeta={meta}
        />
      )}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Student"
        message="Are you sure you want to delete this Student?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDeleteConfirm}
        successMessage="Deleted Successfully!"
      />

      <DownloadStudentsModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        classData={classData}
        allStudents={studentsData}
        filteredStudents={studentsData}
      />
    </div>
  );
};

export default ClassStudents;
