import React, { useState, useEffect } from "react";
import { usePostMutation, usePutMutation } from "../../api/apiSlice";
import { X, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import FormInput from "../../components/ui/FormInput";

const ItemAddForm = ({
  isOpen,
  onClose,
  refetch,
  editingItem = null,
  mappingId,
  typeName = "",
  typeSelected = {},
}) => {
  // Form state for laptop creation (quota-based)
  const [laptopCreateFormData, setLaptopCreateFormData] = useState({
    military_quota: "",
    civilian_quota: "",
    staff_quota: "",
  });

  // Form state for non-laptop creation (simple count)
  const [simpleCreateFormData, setSimpleCreateFormData] = useState({
    quantity: "",
    note: "",
  });

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    tag: "",
    serial_number: "",
    note: "",
    quota: "military",
  });

  const [createInventory, { isLoading: isCreating }] = usePostMutation();
  const [updateInventory, { isLoading: isUpdating }] = usePostMutation();

  const isLoading = isCreating || isUpdating;

  // Determine if it's a laptop type
  const isLaptopType =
    editingItem?.mapping?.type?.name?.toLowerCase() === "laptop" ||
    editingItem?.mapping?.type?.name?.toLowerCase() === "laptops" ||
    editingItem?.mapping?.type?.name?.toLowerCase() === "laptop" ||
    editingItem?.mapping?.type?.name?.toLowerCase() === "laptops";

  const isFixedAsset =
    editingItem?.type?.category?.name === "Fixed Assets" ||
    editingItem?.category?.name === "Fixed Assets";

  const isLendable =
    editingItem?.type?.category?.name
      ?.toLowerCase()
      .includes("moveable assets") ||
    editingItem?.category?.name?.toLowerCase().includes("moveable assets");

  // Quota options
  const quotaOptions = [
    { value: "civilian", label: "Civilian" },
    { value: "military", label: "Military" },
    { value: "staff", label: "Staff" },
  ];

  // Reset forms when modal opens/closes or editing item changes
  useEffect(() => {
    if (editingItem) {
      // Editing mode - populate edit form
      let quotaValue = "military";
      if (editingItem.quota) {
        quotaValue = editingItem.quota;
      } else if (
        editingItem.is_civilian === "1" ||
        editingItem.is_civilian === true
      ) {
        quotaValue = "civilian";
      }

      setEditFormData({
        tag: editingItem.tag || "",
        serial_number: editingItem.serial_number || "",
        note: editingItem.note || "",
        quota: quotaValue,
      });
    } else {
      // Creation mode - reset all forms
      setLaptopCreateFormData({
        military_quota: "",
        civilian_quota: "",
        staff_quota: "",
      });
      setSimpleCreateFormData({
        quantity: "",
        note: "",
      });
      setEditFormData({
        tag: "",
        serial_number: "",
        note: "",
        quota: "military",
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Handle changes for laptop quota form
  const handleLaptopCreateChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : parseInt(value, 10);
    if (value !== "" && (isNaN(numValue) || numValue < 0)) return;

    setLaptopCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSimpleCreateChange = (e) => {
    const { name, value } = e.target;

    // For quantity (number field)
    if (name === "quantity") {
      const numValue = value === "" ? "" : parseInt(value, 10);
      if (value !== "" && (isNaN(numValue) || numValue < 1)) return;

      setSimpleCreateFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }

    // For note (text field)
    setSimpleCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes for edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate total quantity for laptop creation
  const getLaptopTotalQuantity = () => {
    const military = parseInt(laptopCreateFormData.military_quota, 10) || 0;
    const civilian = parseInt(laptopCreateFormData.civilian_quota, 10) || 0;
    const staff = parseInt(laptopCreateFormData.staff_quota, 10) || 0;
    return military + civilian + staff;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // EDITING MODE
    if (editingItem) {
      try {
        const payload = {
          tag: editFormData.tag.trim(),
          note: editFormData.note.trim(),
        };

        // Add serial number for laptops
        if (isLaptopType || editFormData.serial_number.trim()) {
          payload.serial_number = editFormData.serial_number.trim();
        }

        // Add quota for lendable items
        if (isLendable) {
          payload.is_civilian = editFormData.quota;
        }

        payload.mapping_id =
          typeSelected?.mappings?.[0]?.mapping_id || mappingId;

        await updateInventory({
          path: `/admin/inventory/inventories/${editingItem.uuid}?_method=put`,
          body: payload,
        }).unwrap();

        toast.success("Inventory item updated successfully!");
        handleClose();
        refetch?.();
      } catch (error) {
        console.error("Error updating inventory item:", error);
        toast.error(
          error?.data?.message ||
            error?.message ||
            "Failed to update inventory item"
        );
      }
      return;
    }

    // CREATING MODE - LAPTOP (Quota-based creation)
    if (isLaptopType) {
      try {
        if (!typeSelected?.mappings?.[0]?.mapping_id && !mappingId) {
          toast.error("Mapping ID is required");
          return;
        }

        const totalQuantity = getLaptopTotalQuantity();
        if (totalQuantity === 0) {
          toast.error("Please enter at least one quota quantity");
          return;
        }

        const payload = {
          mapping_id: typeSelected?.mappings?.[0]?.mapping_id || mappingId,
          military_quota:
            parseInt(laptopCreateFormData.military_quota, 10) || 0,
          civilian_quota:
            parseInt(laptopCreateFormData.civilian_quota, 10) || 0,
          staff_quota: parseInt(laptopCreateFormData.staff_quota, 10) || 0,
        };

        await createInventory({
          path: "/admin/inventory/inventories",
          body: payload,
        }).unwrap();

        toast.success(`Successfully created ${totalQuantity} laptop items!`);
        handleClose();
        refetch?.();
      } catch (error) {
        console.error("Error creating laptop items:", error);
        toast.error(
          error?.data?.message ||
            error?.message ||
            "Failed to create laptop items"
        );
      }
      return;
    }

    // CREATING MODE - NON-LAPTOP (Simple quantity creation)
    try {
      if (!typeSelected?.mappings?.[0]?.mapping_id && !mappingId) {
        toast.error("Mapping ID is required");
        return;
      }

      const quantity = parseInt(simpleCreateFormData.quantity, 10);
      if (!quantity || quantity < 1) {
        toast.error("Please enter a valid quantity (minimum 1)");
        return;
      }

      const payload = {
        mapping_id: typeSelected?.mappings?.[0]?.mapping_id || mappingId,
        quantity: quantity,
        note: simpleCreateFormData.note.trim(),
      };

      await createInventory({
        path: "/admin/inventory/inventories",
        body: payload,
      }).unwrap();

      toast.success(`Successfully created ${quantity} inventory items!`);
      handleClose();
      refetch?.();
    } catch (error) {
      console.error("Error creating inventory items:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to create inventory items"
      );
    }
  };

  const handleClose = () => {
    setLaptopCreateFormData({
      military_quota: "",
      civilian_quota: "",
      staff_quota: "",
    });
    setSimpleCreateFormData({
      quantity: "",
    });
    setEditFormData({
      tag: "",
      serial_number: "",
      note: "",
      quota: "military",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#014376] to-[#31918D]">
          <h2 className="text-xl font-bold text-white font-poppins">
            {editingItem ? "Edit Inventory Item" : "Add Inventory Items"}
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!editingItem && isLaptopType && (
            <>
              {typeName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Creating laptops for:</span>{" "}
                    {typeName}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Specify Quantities by Quota
                  </h3>
                </div>

                <FormInput
                  type="number"
                  label="Military Quota"
                  name="military_quota"
                  value={laptopCreateFormData.military_quota}
                  onChange={handleLaptopCreateChange}
                  min="0"
                  placeholder="Enter military quota quantity"
                />

                <FormInput
                  type="number"
                  label="Civilian Quota"
                  name="civilian_quota"
                  value={laptopCreateFormData.civilian_quota}
                  onChange={handleLaptopCreateChange}
                  min="0"
                  placeholder="Enter civilian quota quantity"
                />

                <FormInput
                  type="number"
                  label="Staff Quota"
                  name="staff_quota"
                  value={laptopCreateFormData.staff_quota}
                  onChange={handleLaptopCreateChange}
                  min="0"
                  placeholder="Enter staff quota quantity"
                />

                {/* Total Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-semibold">
                    Total Laptops to Create: {getLaptopTotalQuantity()}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    System will automatically generate tags, serial numbers, and
                    assign quotas
                  </p>
                </div>
              </div>
            </>
          )}

          {!editingItem && !isLaptopType && (
            <>
              {typeName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Creating items for:</span>{" "}
                    {typeName}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Specify Total Quantity
                  </h3>
                </div>

                <FormInput
                  type="number"
                  label="Number of Items *"
                  name="quantity"
                  value={simpleCreateFormData.quantity}
                  onChange={handleSimpleCreateChange}
                  min="1"
                  placeholder="Enter total quantity"
                  required
                />
                {/* 
                <FormInput
                  type="text"
                  label="Note"
                  name="note"
                  value={simpleCreateFormData.note }
                  onChange={handleSimpleCreateChange}
                  placeholder="Enter Note"
                /> */}

                {simpleCreateFormData.quantity && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-semibold">
                      Total Items to Create: {simpleCreateFormData.quantity}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      System will automatically generate tags
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {editingItem && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Item Type:</span>{" "}
                  {editingItem?.mapping?.type?.name || "N/A"}
                </p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Main Category:</span>{" "}
                  {editingItem.mapping?.pivot?.main_category?.name || "N/A"}
                </p>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Sub Category:</span>{" "}
                  {editingItem.mapping?.pivot?.sub_category?.name || "N/A"}
                </p>
              </div>

              {/* Tag - Always Required */}
              <FormInput
                type="text"
                label="Tag"
                name="tag"
                value={editFormData.tag}
                onChange={handleEditChange}
                placeholder="Enter tag (e.g., LAP001)"
                required
              />
              <div>
                <label
                  htmlFor="note"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Note
                </label>
                <div className="border border-gray-300 rounded-lg p-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <textarea
                    id="note"
                    name="note"
                    value={editFormData.note}
                    onChange={handleEditChange}
                    rows={4}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border-0 rounded-md focus:outline-none focus:ring-0 resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Serial Number - Show ONLY for laptops */}
              {isLaptopType && (
                <div>
                  <FormInput
                    type="text"
                    label="Serial Number *"
                    name="serial_number"
                    value={editFormData.serial_number}
                    onChange={handleEditChange}
                    placeholder="Enter serial number"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laptop Type: {editingItem.type?.name}
                  </p>
                </div>
              )}

              {/* Quota - Show ONLY for laptops (lendable items) */}
              {isLaptopType && (
                <FormInput
                  type="select"
                  label="Quota"
                  name="quota"
                  value={editFormData.quota}
                  onChange={handleEditChange}
                  options={quotaOptions}
                  placeholder="Select Quota"
                  required
                />
              )}

              {/* Note - Show for Fixed Assets or if already exists */}
              {/* {(isFixedAsset || editingItem.note) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Note {isFixedAsset ? "*" : ""}
                  </label>
                  <textarea
                    name="note"
                    value={editFormData.note}
                    onChange={handleEditChange}
                    placeholder="Enter note"
                    required={isFixedAsset}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              )} */}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold font-poppins hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white font-semibold font-poppins rounded-lg hover:from-[#31918D] hover:to-[#014376] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading
                ? editingItem
                  ? "Updating..."
                  : "Creating..."
                : editingItem
                ? "Update Item"
                : isLaptopType
                ? `Create ${getLaptopTotalQuantity()} Laptops`
                : `Create ${simpleCreateFormData.quantity || 0} Items`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemAddForm;
