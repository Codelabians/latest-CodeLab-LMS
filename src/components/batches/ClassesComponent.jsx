import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Trash,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useDeleteMutation,
  useGetQuery,
  usePatchMutation,
} from "../../api/apiSlice";
import Batches from "../../assets/icons/navbar/Batches";
import { getBatches } from "../../features/batches/batchesSlice";
import BulkDeleteModal from "../ui/BulkDeleteModal";
import { formatDate } from "../ui/common/FormatDate";
import Loader from "../ui/common/LoaderComponent";
import showError from "../ui/common/ShowError";
import { showToast } from "../ui/common/ShowToast";
import DeleteModal from "../ui/DeleteModal";
import EditModal from "../ui/EditModal";
import Header from "../ui/Header";
import DownloadStudentsModal from "./components/DownloadStudentsModal";
import BatchTabs from "../ui/BatchTabs";
import HallsTabs from "../ui/HallsTabs";

const COURSE_DOCUMENTS = {
  "Web Design & Development": {
    basic:
      "/documents/Web Design & Development (Full Stack)-Course Outline- (1).docx",
    advanced:
      "/documents/Web Design & Development (Full Stack)-Course Outline-Advance.docx",
  },
  "Mobile App Development": {
    basic: "/documents/Mobile App Development-Course Outline-Basic (1).docx",
    advanced: "/documents/Mobile App Development-Course Outline-Advance.docx",
  },
  "Network & Cyber Security": {
    basic: "/documents/Network & Cyber Security-Course Outline.docx",
    advanced:
      "/documents/Network & Cyber Security-Course Outline-Advance (1).docx1",
  },
  "Game Development": {
    basic: "/documents/Game Development-Course Outline.docx",
    advanced: "/documents/Game Development-Course Outline-Advance .docx",
  },
  "Graphic Designing & Video Editing": {
    basic:
      "/documents/Graphic Designing & Video Editing-Course Outline-Basic.docx",
    advanced:
      "/documents/Graphic Designing & Video Editing-Course Outline-Advance .docx",
  },
  "Social Media Marketing & Freelancing": {
    basic:
      "/documents/Social Media Marketing & Freelancing-Course Outline-Basic-Adv. (1).docx",
    advanced: "",
  },
  "AI Content Writing & SEO": {
    basic: "/documents/AI Content Writing & SEO-Course Outline .docx",
    advanced:
      "/documents/AI Content Writing & SEO -Course Outline-Advance.docx",
  },
  "E-commerce": {
    basic: "/documents/E Commerce-Course Outline-Basic.docx",
    advanced: "/documents/E Commerce-Course Outline-Advance.docx",
  },
};

const ClassesComponent = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedID, setSelectedID] = useState(null);
  const [currentItem, setCurrentItem] = useState([]);
  const [initialValues, setInitialValues] = useState([]);
  useState(false);
  const [activeTimeTab, setActiveTimeTab] = useState("all");
  const [activeHallTab, setActiveHallTab] = useState("all");
  const [activeBatchTab, setActiveBatchTab] = useState("all"); // NEW: Batch filter state
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [deleteBatch] = useDeleteMutation();
  const [patch] = usePatchMutation();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { courseUuid } = useParams();
  const location = useLocation();
  const course = location.state?.course;

  const queryParams = new URLSearchParams(location.search);
  const activeStatus = queryParams.get("active_status");

  const batches = useSelector((state) => state.batches.batches);

  // Fetch Teachers
  const { data: teacherData, refetch: refetchTeacher } = useGetQuery({
    path: "/admin/users/teacher",
    params: { active_status: 1 },
  });

  // Fetch Courses
  const { data: courseData, refetch: refetchcourse } = useGetQuery({
    path: "/admin/courses",
  });

  // Fetch Classes with batch_id filter
  const {
    data: batchData,
    error: batchError,
    isLoading: batchIsLoading,
    isFetching: isClassesFetching,

    refetch: refetchBatches,
  } = useGetQuery({
    path: "/admin/classes",
    params: {
      ...(activeStatus && { active_status: activeStatus }),
      ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }), // NEW: Add batch_id to query
      ...(activeTimeTab !== "all" && { availability: activeTimeTab }), // NEW: Add batch_id to query
      ...(activeHallTab !== "all" && { facility_id: activeHallTab }), // NEW: Add batch_id to query
      per_page: itemsPerPage,
    },
  });

  useEffect(() => {
    refetchcourse();
    refetchBatches();
    refetchTeacher();
  }, [courseUuid]);

  // NEW: Refetch classes when batch filter changes
  useEffect(() => {
    refetchBatches();
  }, [activeBatchTab, refetchBatches]);

  useEffect(() => {
    if (batchData) {
      let filteredData = batchData.data;

      if (courseUuid && course) {
        filteredData = batchData.data.filter(
          (cls) => cls.course?.id === course.id,
        );
      }

      dispatch(getBatches({ batches: filteredData }));
    }
  }, [batchData, dispatch, courseUuid, course]);

  useEffect(() => {
    if (teacherData) {
      const transformedTeacherOptions = teacherData.data.map((item) => ({
        value: item.id,
        label: `${item.first_name} ${item.last_name}`,
      }));
      setTeacherOptions(transformedTeacherOptions);
    }
  }, [teacherData]);

  useEffect(() => {
    if (courseData) {
      const transformedCourseOptions = courseData.data.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setCourseOptions(transformedCourseOptions);
    }
  }, [courseData]);

  useEffect(() => {
    const batch = batches?.find(
      (batch) => batch.batch_uuid === currentItem.uuid,
    );
    if (batch) {
      setInitialValues({
        batch: batch?.name,
        courseData: batch?.course?.id,
        instructorData: batch?.teacher?.id,
        time_slot: batch?.time_slot,
      });
    }
  }, [batches, currentItem]);

  const handleDeleteConfirm = async () => {
    try {
      await deleteBatch({ path: `/admin/class/${selectedID}` }).unwrap();
      setIsDeleteModalOpen(false);
      showToast("Deleted Successfully", "success");
      refetchBatches();
    } catch (err) {
      showError(err);
    }
  };

  const handleEditSubmit = async (formState) => {
    const values = {
      teacher_id: formState.instructorData,
      course_id: formState.courseData,
      is_active: currentItem.is_active,
      time_slot: `${formState.start_time} to ${formState.end_time}`,
      date: currentItem.date,
    };

    try {
      const response = await patch({
        path: `/admin/batch/${selectedID}`,
        body: values,
      }).unwrap();

      refetchBatches();
      if (response.message === "Success." && response.status === 1) {
        showToast("Edit Successfully", "success");
      }
      setIsEditModalOpen(false);
    } catch (err) {
      showError(err);
    }
  };

  const Editfields = [
    {
      name: "courseData",
      label: "Course",
      type: "select",
      options: courseOptions,
    },
    {
      name: "instructorData",
      label: "Instructor",
      type: "select",
      options: teacherOptions,
    },
    { name: "time_slot", label: "Time Slot", type: "time" },
  ];

  const handleEditClick = (cls) => {
    const classUuid = cls.class_id || cls.batch_uuid;
    navigate(`/dashboard/classes/edit/${classUuid}`, {
      state: { classData: cls },
    });
  };

  const handleDeleteClick = (cls) => {
    setSelectedID(cls.batch_uuid || cls.class_id);
    setIsDeleteModalOpen(true);
  };

  const handleClassClick = (cls) => {
    navigate(`/dashboard/classes/${cls.class_id}`, {
      state: {
        classData: cls,
        course: course,
      },
    });
  };

  const handleBackToCourses = () => {
    navigate("/dashboard/courses");
  };

  const handleDownloadCourseDocument = async (item, documentType) => {
    const course = item.course;
    const courseName = course?.name?.trim();
    const courseId = course?.id;

    let courseDocuments =
      COURSE_DOCUMENTS[courseName] || COURSE_DOCUMENTS[courseId];

    if (!courseDocuments) {
      showToast(`No documents configured for "${courseName}"`, "error");
      return;
    }

    const filePath = courseDocuments[documentType];
    if (!filePath) {
      showToast(`No ${documentType} outline available`, "error");
      return;
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("File not found or inaccessible");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${courseName.replace(/\s+/g, "-")}-${documentType}.docx`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(
        `${
          documentType.charAt(0).toUpperCase() + documentType.slice(1)
        } outline downloaded`,
        "success",
      );
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Failed to download file. Check console.", "error");
    }
  };

  return (
    <div className="w-11/12 mx-auto">
      {/* Breadcrumb Navigation */}
      {courseUuid && (
        <div className="mb-6">
          <button
            onClick={handleBackToCourses}
            className="flex items-center gap-2 text-[#014376] hover:text-[#31918D] transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </button>

          <div className="flex items-center justify-between mt-2">
            {course ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">
                  {course.name} - Classes
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCourseDocument({ course }, "basic");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    title="Download Basic Course Outline"
                  >
                    <Download className="w-5 h-5" />
                    <span>Basic Outline</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCourseDocument({ course }, "advanced");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    title="Download Advanced Course Outline"
                  >
                    <Download className="w-5 h-5" />
                    <span>Advanced Outline</span>
                  </button>
                </div>
              </>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
            )}
          </div>
        </div>
      )}

      <Header
        title={courseUuid ? "Course Classes" : "All Classes"}
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        icon={<Batches />}
        TotalCategories={batches.length}
        sourceComponent="BatchesComponent"
      />

      {(batchIsLoading || isClassesFetching) && <Loader />}
      {batchError && (
        <div className="py-4 text-center text-red-500">
          Error loading Classes
        </div>
      )}

      {!batchIsLoading && !batchError && (
        <>
          {/* NEW: Batch Filter Tabs */}
          <BatchTabs
            setActiveBatchTab={setActiveBatchTab}
            activeBatchTab={activeBatchTab}
          />

          {/* Time Tabs */}
          <div className="flex gap-2 mb-6">
            {["all", "morning", "evening"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTimeTab(tab)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  activeTimeTab === tab
                    ? "bg-[#014376] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Hall Tabs */}
          <HallsTabs
            activeHallTab={activeHallTab}
            setActiveHallTab={setActiveHallTab}
          />

          {/* Classes Cards */}
          {batchData?.data.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No classes found for the selected filters
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-2 lg:grid-cols-3">
              {batchData?.data.map((cls) => (
                <div
                  key={cls.class_id}
                  className="group p-6 transition-all bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl hover:scale-105 cursor-pointer relative"
                  onClick={() => handleClassClick(cls)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#014376]/5 to-[#31918D]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#014376] group-hover:text-[#31918D] transition-colors">
                        {cls.course?.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(cls);
                          }}
                          className="text-[#014376] hover:text-[#31918D] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {cls.student_count <= 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(cls);
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete class (no students)"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <p>
                        <span className="font-semibold">Instructor:</span>{" "}
                        {cls.teacher?.name || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Batch:</span>{" "}
                        {cls.batch?.name || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Hall:</span>{" "}
                        {cls.hall?.name || "N/A"}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="font-semibold">Students:</span>
                        <span className="flex items-center gap-1 text-[#31918D] font-bold">
                          <Users className="w-4 h-4" />
                          {cls.student_count || 0}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Time:</span>{" "}
                        {cls.timing || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Slot:</span>{" "}
                        <span className="capitalize">{cls.time_slot}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Military Quota:</span>{" "}
                        {cls.military_quota || 0}
                      </p>
                      <p>
                        <span className="font-semibold">Civilian Quota:</span>{" "}
                        {cls.civilians_quota || 0}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{" "}
                        {formatDate(cls.date)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-sm text-gray-600 group-hover:text-[#014376] transition-colors font-medium">
                        View Students
                      </span>
                      <div className="w-8 h-8 bg-gradient-to-r from-[#014376] to-[#31918D] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EditModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        title="Edit Class"
        fields={Editfields}
        initialValues={initialValues}
        handleSubmit={handleEditSubmit}
        submitButtonText="Save"
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Class"
        message="Are you sure you want to delete this class?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDeleteConfirm}
        successMessage="Deleted Successfully!"
      />

      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        setIsOpen={setIsBulkDeleteModalOpen}
        message="Are you sure you want to delete all the selected classes?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => console.log("Bulk delete")}
        successMessage="Deleted Successfully!"
      />
      <DownloadStudentsModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        // classData={selectedClassForDownload}
      />
    </div>
  );
};

export default ClassesComponent;
