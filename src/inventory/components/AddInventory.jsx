import { useEffect, useState } from "react";
import Select from "react-select";
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../api/apiSlice";
import FormInput from "../../components/ui/FormInput";
import Loader from "../../components/ui/common/LoaderComponent";

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "8px",
    paddingTop: "4px",
    paddingBottom: "4px",
    borderColor: "#d1d5db",
    boxShadow: "none",
    minHeight: "48px",
    "&:hover": { borderColor: "#d1d5db" },
    "&:focus-within": {
      borderColor: "transparent",
      boxShadow: "0 0 0 2px #3b82f6",
    },
  }),
  container: (provided) => ({
    ...provided,
    width: "100%",
  }),
};

const initialFormState = {
  category: "",
  type: "",
  quantity: "",
  military_quota: "",
  civil_quota: "",
  staff_quota: "",
  image: null,
};

export default function InventoryForm({
  isOpen,
  onClose,
  initialValues,
  mode = "create",
  handleCategoryChange = () => {},
  handleTypeChange = () => {},
  refetch,
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTypeLabel, setSelectedTypeLabel] = useState("");
  const [errors, setErrors] = useState({});

  // API Mutations
  const [createInventory, { isLoading: isCreating }] = usePostMutation();
  const [updateInventory, { isLoading: isUpdating }] = usePutMutation();
  const isSubmitting = isCreating || isUpdating;

  const { data: categories, isLoading: isCategoriesLoading } = useGetQuery({
    path: "/admin/inventory/categories/all",
  });

  const { data: types, isLoading } = useGetQuery({
    path: "/admin/inventory/types/all",
  });

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      setFormData({
        category: initialValues.category_id || "",
        type: initialValues.type_id || "",
        quantity: initialValues.total_quantity || "",
        military_quota: initialValues.military_quota || "",
        staff_quota: initialValues.staff_quota || "",
        civil_quota: initialValues.civil_quota || "",
        image: initialValues.image || null,
      });

      setSelectedCategory(initialValues.category_id || null);

      // Set the selected type label for edit mode
      const typeData = types?.data?.find(
        (t) => t.uuid === initialValues.type_id,
      );
      if (typeData) {
        setSelectedTypeLabel(typeData.name || "");
      }
    }
  }, [initialValues, mode, types]);

  const categoryOptions =
    categories?.data?.map((cat) => ({
      value: cat.uuid,
      label: cat.name,
    })) || [];

  const handleCategorySelect = (selected) => {
    setSelectedCategory(selected?.value || null);
    setFormData({ ...formData, category: selected?.value || "", type: "" });
    setSelectedTypeLabel(""); // Reset type label when category changes
    handleCategoryChange(selected);
  };

  const filteredTypeOptions =
    types?.data
      ?.filter(
        (t) => !selectedCategory || t.category?.uuid === selectedCategory,
      )
      .map((t) => ({
        value: t.uuid,
        label: t.name,
      })) || [];

  const handleTypeSelect = (selected) => {
    setFormData({ ...formData, type: selected?.value || "" });
    setSelectedTypeLabel(selected?.label || "");
    handleTypeChange(selected);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        category_id: formData.category,
        type_id: formData.type,
        quantity:
          selectedTypeLabel === "Laptop"
            ? undefined
            : parseInt(formData.quantity, 10),
        military_quota:
          selectedTypeLabel === "Laptop"
            ? parseInt(formData.military_quota, 10)
            : undefined,
        civilian_quota:
          selectedTypeLabel === "Laptop"
            ? parseInt(formData.civil_quota, 10)
            : undefined,
        staff_quota:
          selectedTypeLabel === "Laptop"
            ? parseInt(formData.staff_quota, 10)
            : undefined,
      };

      if (mode === "edit" && initialValues) {
        await updateInventory({
          path: `/admin/inventory/inventories/${initialValues.uuid}`,
          body: payload,
        }).unwrap();
      } else {
        await createInventory({
          path: "/admin/inventory/inventories",
          body: payload,
        }).unwrap();
      }

      setFormData(initialFormState);
      setSelectedCategory(null);
      setSelectedTypeLabel("");
      setErrors({});
      onClose();
      if (refetch) refetch();
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative p-10 bg-white shadow-lg rounded-xl w-[70%] flex flex-col space-y-4">
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 rounded-xl">
            <Loader />
          </div>
        )}
        <h2 className="mb-4 text-lg font-semibold text-center">
          {mode === "edit" ? "Edit Inventory" : "Add Inventory"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Select */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Category <span className="ml-1 text-red-500">*</span>
            </label>
            <Select
              onChange={handleCategorySelect}
              options={categoryOptions}
              styles={customStyles}
              placeholder={
                isCategoriesLoading ? "Loading..." : "Select Category"
              }
              isLoading={isCategoriesLoading}
              isDisabled={isSubmitting}
              value={
                categoryOptions.find(
                  (option) => option.value === formData.category,
                ) || null
              }
            />
          </div>

          {/* Type Select */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Type <span className="ml-1 text-red-500">*</span>
            </label>
            <Select
              onChange={handleTypeSelect}
              options={filteredTypeOptions}
              styles={customStyles}
              placeholder="Select Type"
              isDisabled={!selectedCategory || isSubmitting}
              value={
                filteredTypeOptions.find(
                  (option) => option.value === formData.type,
                ) || null
              }
            />
          </div>

          {/* Conditional Inputs */}
          {selectedTypeLabel === "Laptop" ? (
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                type="number"
                label="Military Quota"
                name="military_quota"
                value={formData.military_quota}
                onChange={handleInputChange}
                placeholder="Enter military quota"
                required={true}
                disabled={isSubmitting}
                min="0"
              />
              <FormInput
                type="number"
                label="Civil Quota"
                name="civil_quota"
                value={formData.civil_quota}
                onChange={handleInputChange}
                placeholder="Enter civil quota"
                required={true}
                disabled={isSubmitting}
                min="0"
              />
              <FormInput
                type="number"
                label="Staff Quota"
                name="staff_quota"
                value={formData.staff_quota}
                onChange={handleInputChange}
                placeholder="Enter staff quota"
                required={true}
                disabled={isSubmitting}
                min="0"
              />
            </div>
          ) : (
            <FormInput
              type="number"
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              required={true}
              disabled={isSubmitting}
              min="0"
            />
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="submit"
              className="px-10 py-2 font-semibold custom-AddButton text-white rounded-md custom-ActionBtn disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : mode === "edit"
                  ? "Update"
                  : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2 font-semibold bg-[#E2E1E1] rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
