import { useEffect, useState } from "react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { useDispatch, useSelector } from "react-redux";
import { setCategories } from "../../features/categories/catogriesSlice";
import Categories from "../../assets/icons/navbar/Categories";
import Loader from "../ui/common/LoaderComponent";
import { BookOpen, GraduationCap, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COURSES } from "../routes/RouteConstants";
import AddCategory from "./AddCategory";

const CategoriesComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [nameError, setNameError] = useState("");

  const { data, error, isLoading, refetch } = useGetQuery({
    path: "/admin/categories",
    params: { per_page: 100 },
  });

  const [submitCategory, { isLoading: submitting }] = usePostMutation();

  useEffect(() => {
    if (data) {
      const formattedData = data.data.map((cat) => ({
        id: cat.id,
        uuid: cat.uuid,
        name: cat.name,
        slug: cat.slug,
        courses: cat.course_count,
      }));
      dispatch(setCategories(formattedData));
    }
  }, [data, dispatch]);

  const categoriesData = useSelector((state) => state.categories.categories);

  const handleCategoryClick = (category) => {
    navigate(`${COURSES}?tab=${category.slug}`);
  };

  // ✅ EDIT HANDLER - prevents category click when editing
  const handleEditClick = (e, category) => {
    e.stopPropagation();
    setEditCategory(category);
    setCategoryName(category.name);
    setNameError("");
    setIsModalOpen(true);
  };

  // ✅ ADD / EDIT SUBMIT WITH DUPLICATE CHECK
  const handleSubmitCategory = async () => {
    if (!categoryName.trim()) {
      setNameError("Category name is required");
      return;
    }

    // Check if category name already exists (excluding current category when editing)
    const alreadyExists = categoriesData?.some(
      (cat) =>
        cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim() &&
        cat.id !== editCategory?.id,
    );

    if (alreadyExists) {
      setNameError("Category with this name already exists");
      return;
    }

    try {
      setNameError("");

      if (editCategory) {
        await submitCategory({
          path: `/admin/category/${editCategory.uuid}?_method=patch`,
          body: { name: categoryName },
        }).unwrap();
      } else {
        await submitCategory({
          path: "/admin/category/create",
          body: { name: categoryName },
        }).unwrap();
      }

      setCategoryName("");
      setEditCategory(null);
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Category submit error", err);
      setNameError("Failed to save category. Please try again.");
    }
  };

  return (
    <div className="w-11/12 mx-auto py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg custom-Background">
            <Categories className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#aa0e0e]">
              Course Categories
            </h1>
            <p className="text-gray-600 mt-1">
              Explore our {categoriesData?.length || 0} course categories
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditCategory(null);
            setCategoryName("");
            setNameError("");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-lg custom-Background text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Loader */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-red-500 py-8">
          Error loading categories. Please try again.
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoriesData?.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="relative group bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-blue-400 overflow-hidden"
            >
              {/* ✅ EDIT ICON - Top right corner */}
              {/* <button
                onClick={(e) => handleEditClick(e, category)}
                className="absolute top-3 right-3 z-10 bg-white p-2 rounded-full shadow-md hover:bg-blue-50 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Pencil className="w-4 h-4 text-[#aa0e0e]" />
              </button> */}

              <div className="h-32 custom-Background relative">
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="bg-white/20 rounded-lg p-2">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white rounded-full px-3 py-1">
                    <span className="text-sm font-bold text-[#aa0e0e]">
                      {category.courses} Courses
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-[#aa0e0e] mb-4">
                  {category.name}
                </h3>

                <div className="flex justify-between items-center border-t pt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="w-5 h-5" />
                    View Courses
                  </div>
                  <span className="text-blue-600 font-bold">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && categoriesData?.length === 0 && (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-gray-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Categories className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Categories Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first course category
          </p>
          <button
            onClick={() => {
              setEditCategory(null);
              setCategoryName("");
              setNameError("");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg custom-Background text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Category
          </button>
        </div>
      )}

      {/* Modal */}
      <AddCategory
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditCategory(null);
          setCategoryName("");
          setNameError("");
        }}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        onSubmit={handleSubmitCategory}
        loading={submitting}
        isEdit={!!editCategory}
        nameError={nameError}
      />
    </div>
  );
};

export default CategoriesComponent;
