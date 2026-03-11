import { useState, useEffect } from "react";
import FormInput from "../../../ui/FormInput";
import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
} from "../../../../api/apiSlice";
import { toast } from "react-toastify";

const AddForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  mode = "create",
}) => {
  const [formData, setFormData] = useState({
    category: "",
    workspaceType: "",
    totalQuantity: "",
    perRoomPrice: "",
    perSeatPrice: "",
  });

  const [createWorkspace, { isLoading: isCreating }] = usePostMutation();
  const [updateWorkspace, { isLoading: isUpdating }] = usePatchMutation();

  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesIsLoading,
  } = useGetQuery({
    path: "/admin/workspace-categories",
  });

  const {
    data: workspaceTypesData,
    error: workspaceTypesError,
    isLoading: workspaceTypesIsLoading,
  } = useGetQuery({
    path: "/admin/workspace-types",
  });

  const selectedCategory = categoriesData?.data?.find(
    (cat) => cat.uuid === formData.category,
  );

  const filteredWorkspaceTypes =
    workspaceTypesData?.data?.filter(
      (type) => type.category?.id === selectedCategory?.id,
    ) || [];

  // Get selected workspace type details
  const selectedWorkspaceType = workspaceTypesData?.data?.find(
    (type) => type.uuid === formData.workspaceType,
  );

  // Check if selected type is "Individual Seats" (case-insensitive)
  const isIndividualSeats = selectedWorkspaceType?.name
    ?.toLowerCase()
    .includes("individual");

  // Check if selected type is "Executive Room" or "Private Room"
  const isRoomType =
    selectedWorkspaceType?.name?.includes("Executive") ||
    selectedWorkspaceType?.name?.includes("Private");

  // Reset workspace type when category changes
  useEffect(() => {
    if (formData.category) {
      setFormData((prev) => ({
        ...prev,
        workspaceType: "",
      }));
    }
  }, [formData.category]);

  // Reset prices when workspace type changes
  useEffect(() => {
    if (formData.workspaceType) {
      setFormData((prev) => ({
        ...prev,
        perRoomPrice: "",
        perSeatPrice: "",
      }));
    }
  }, [formData.workspaceType]);

  // Prefill form when editing
  useEffect(() => {
    if (initialValues && mode === "edit") {
      setFormData({
        category: initialValues.category || "",
        workspaceType:
          initialValues.workspaceType || initialValues.type_uuid || "",
        totalQuantity:
          initialValues.totalQuantity || initialValues.total_quantity || "",
        perRoomPrice:
          initialValues.perRoomPrice || initialValues.per_room_price || "",
        perSeatPrice:
          initialValues.perSeatPrice || initialValues.per_seat_price || "",
      });
    }
  }, [initialValues, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const price = isRoomType
        ? parseFloat(formData.perRoomPrice)
        : isIndividualSeats
          ? parseFloat(formData.perSeatPrice)
          : null;

      const payload = {
        type_uuid: formData.workspaceType,
        total_quantity: parseInt(formData.totalQuantity, 10) || 0,
        price: price,
      };
      let responseMessage = "";

      if (mode === "edit" && initialValues?.uuid) {
        await updateWorkspace({
          path: `/admin/workspaces/${initialValues.uuid}`,
          body: payload,
        }).unwrap();

        responseMessage = "Workspace updated successfully!";
      } else {
        await createWorkspace({
          path: "/admin/workspaces/create",
          body: payload,
        }).unwrap();

        responseMessage = "Workspace created successfully!";
      }

      // 🔥 Show success toaster
      toast.success(responseMessage);

      if (onSubmit) onSubmit(payload);

      // Reset and close
      setFormData({
        category: "",
        workspaceType: "",
        totalQuantity: "",
        perRoomPrice: "",
        perSeatPrice: "",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting workspace:", error);

      // ❌ Error toaster
      toast.error(
        error.data.message || "Failed to submit workspace. Please try again.",
      );
    }
  };

  const categoryOptions =
    categoriesData?.data?.map((category) => ({
      value: category.uuid,
      label: category.name,
    })) || [];

  const workspaceTypeOptions = filteredWorkspaceTypes.map((type) => ({
    value: type.uuid,
    label: type.name,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brown">
              {mode === "edit" ? "Edit Workspace" : "Add Workspace"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                type="select"
                label="Workspace Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                options={categoryOptions}
                placeholder="Select category"
                required
                disabled={categoriesIsLoading}
              />

              <FormInput
                type="select"
                label="Workspace Type"
                name="workspaceType"
                value={formData.workspaceType}
                onChange={handleInputChange}
                options={workspaceTypeOptions}
                placeholder={
                  formData.category
                    ? "Select workspace type"
                    : "Select category first"
                }
                disabled={!formData.category || workspaceTypesIsLoading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Total Quantity"
                name="totalQuantity"
                type="number"
                value={formData.totalQuantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                required
              />

              {/* Show Per Room Price for Executive Room and Private Room */}
              {isRoomType && (
                <FormInput
                  label="Per Room Price"
                  name="perRoomPrice"
                  type="number"
                  step="0.01"
                  value={formData.perRoomPrice}
                  onChange={handleInputChange}
                  placeholder="Enter room price"
                  required
                />
              )}

              {/* Show Per Seat Price for Individual Seats */}
              {isIndividualSeats && (
                <FormInput
                  label="Per Seat Price"
                  name="perSeatPrice"
                  type="number"
                  step="0.01"
                  value={formData.perSeatPrice}
                  onChange={handleInputChange}
                  placeholder="Enter seat price"
                  required
                />
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isCreating || isUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 text-white rounded-lg custom-AddButton disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? "Submitting..."
                  : mode === "edit"
                    ? "Update Workspace"
                    : "Add Workspace"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddForm;
