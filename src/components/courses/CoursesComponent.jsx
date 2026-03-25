import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../api/apiSlice";
import {
  BookOpen,
  Laptop,
  Users,
  ChevronRight,
  XCircle,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  Plus,
  Edit,
} from "lucide-react";
import Loader from "../ui/common/LoaderComponent";
import Tabs from "../ui/Tabs";
import { toast } from "react-toastify";

const CourseModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  categories,
  initialData = null,
}) => {
  const isEditMode = !!initialData;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [fee, setFee] = useState("");
  const [courseStatus, setCourseStatus] = useState("basic");

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");

    const selectedCat = categories.find(
      (cat) => cat.id === initialData?.category_id,
    );
    setCategory(
      selectedCat?.uuid ||
        initialData?.category_id?.toString() ||
        categories?.[0]?.uuid ||
        "",
    );

    setFee(initialData?.fee?.toString() || "");
    setCourseStatus(initialData?.course_status || "basic");
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !category) return;

    onSubmit({
      name: name.trim(),
      category_id: category,
      fee: fee ? Number(fee) : undefined,
      course_status: courseStatus,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? "Edit Course" : "Add New Course"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Web Development Bootcamp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Type
            </label>
            <select
              value={courseStatus}
              onChange={(e) => setCourseStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="basic">Basic</option>
              <option value="advance">Advance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee (Rs.)
            </label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="20000"
              min="0"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !category}
            className="px-6 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition disabled:cursor-not-allowed"
          >
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Course"
                : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 8;

const CoursesComponent = () => {
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: coursesData,
    error: coursesError,
    isLoading: coursesIsLoading,
    refetch: refetchCourses,
  } = useGetQuery({
    path: "/admin/courses",
    params: { per_page: 100 },
  });

  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesIsLoading,
  } = useGetQuery({
    path: "/admin/categories",
    params: { per_page: 15 },
  });

  const [createCourse, { isLoading: creatingCourse }] = usePostMutation();
  const [updateCourse, { isLoading: updatingCourse }] = usePatchMutation();

  useEffect(() => {
    if (!categoriesData?.data?.length) return;

    const tabFromUrl = searchParams.get("tab");
    const tabFromStorage = localStorage.getItem("activeTab");

    const validCategory = categoriesData.data.find(
      (cat) => cat.slug === (tabFromUrl || tabFromStorage),
    );

    const newTab = validCategory
      ? validCategory.slug
      : categoriesData.data[0].slug;

    setActiveTab(newTab);
    localStorage.setItem("activeTab", newTab);

    if (!tabFromUrl || !validCategory) {
      setSearchParams({ tab: newTab }, { replace: true });
    }
  }, [categoriesData, searchParams, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const currentCategory = categoriesData?.data?.find(
    (cat) => cat.slug === activeTab,
  );
  const currentCourses =
    coursesData?.data?.filter(
      (course) => course.category === currentCategory?.name,
    ) || [];

  const totalPages = Math.ceil(currentCourses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCourses = currentCourses.slice(startIndex, endIndex);

  const handleCourseClick = (course) => {
    navigate(`/dashboard/courses/${course.uuid}/classes?tab=${activeTab}`, {
      state: { course, activeTab },
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveCourse = async (formData) => {
    try {
      if (editingCourse) {
        const res = await updateCourse({
          path: `admin/course/${editingCourse.uuid}`,
          body: {
            ...formData,
          },
        }).unwrap();
        toast.success(res.message);
      } else {
        await createCourse({
          path: "/admin/course/create",
          body: formData,
        }).unwrap();
      }

      setIsModalOpen(false);
      setEditingCourse(null);
      refetchCourses();
    } catch (err) {
      toast.error(err?.data?.message);
      console.error("Course save failed:", err);
      // TODO: show toast / alert
    }
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  if (coursesIsLoading || categoriesIsLoading) return <Loader />;

  if (coursesError || categoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Error loading data
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#aa0e0e] to-[#d61111] rounded-xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Courses
            </h1>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#aa0e0e] to-[#d61111] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition"
          >
            <Plus size={20} />
            Add Course
          </button>
        </div>

        <Tabs
          items={categoriesData?.data || []}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          getId={(cat) => cat.slug}
          getLabel={(cat) => cat.name}
          getCount={(cat) => cat.course_count}
          getIcon={(cat) => (cat.slug === "technical" ? Laptop : Briefcase)}
          storageKey="activeTab"
          urlParam="tab"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {paginatedCourses.length > 0 ? (
            paginatedCourses.map((course) => (
              <div
                key={course.uuid}
                onClick={() => handleCourseClick(course)}
                className="group relative bg-white rounded-2xl shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(course);
                  }}
                  className=" float-right rounded-full  text-brown  transition"
                  title="Edit course"
                >
                  <Edit size={16} />
                </button>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-[#100F0F] to-[#100F0F] rounded-xl shadow">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-[#100F0F] to-[#100F0F] text-white text-xs font-bold rounded-full">
                      {course.category}
                    </span>
                    {course.is_scheduled === 1 && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-4 group-hover:text-[#100F0F] transition-colors line-clamp-2 min-h-[2.75rem]">
                  {course.name}
                </h3>

                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Users size={16} className="text-[#d61111]" />
                      Classes
                    </span>
                    <span className="font-semibold">{course.classes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee</span>
                    <span className="font-bold text-[#100F0F]">
                      Rs. {course.fee}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600 group-hover:text-[#014376] transition">
                    View Classes
                  </span>
                  <div className="w-8 h-8 bg-gradient-to-r from-[#100F0F] to-[#100F0F] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl shadow border p-12 text-center">
              <BookOpen className="w-20 h-20 text-[#100F0F]/30 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No {currentCategory?.name || activeTab} courses found
              </h3>
              <p className="text-gray-600">
                There are currently no courses in this category.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="bg-white rounded-xl shadow border px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-[#100F0F] hover:bg-gray-100"}`}
              >
                <ChevronLeft size={20} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      currentPage === page
                        ? "bg-gradient-to-r from-[#100F0F] to-[#100F0F] text-white shadow"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-[#100F0F] hover:bg-gray-100"}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        <CourseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
          onSubmit={handleSaveCourse}
          loading={creatingCourse || updatingCourse}
          categories={categoriesData?.data || []}
          initialData={editingCourse}
        />
      </div>
    </div>
  );
};

export default CoursesComponent;
