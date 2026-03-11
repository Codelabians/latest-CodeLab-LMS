import { useState, useEffect } from "react";
import { XCircle } from "lucide-react";
import { useGetQuery, usePutMutation } from "../../../../api/apiSlice";
import FormInput from "../../../ui/FormInput";

const EditWorkspace = ({ isOpen, onClose, data, onSubmit }) => {
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [initialInventory, setInitialInventory] = useState([]);
  const [updateWorkspace, { isLoading }] = usePutMutation();
  const { data: inventory, isLoading: inventoryLoading } = useGetQuery({
    path: "admin/workspaces/get/fixed-inventories?category_id=1",
  });

  useEffect(() => {
    if (data) {
      const priceValue =
        typeof data.price === "string"
          ? data.price.replace("Rs. ", "").trim()
          : data.price;
      setPrice(priceValue ?? "");
      setDescription(data.description ?? "");

      if (data.inventories && Array.isArray(data.inventories)) {
        const inventoryIds = data.inventories.map((inv) => inv.id);
        setSelectedInventory(inventoryIds);
        setInitialInventory(inventoryIds);
      } else {
        setSelectedInventory([]);
        setInitialInventory([]);
      }
    }
  }, [data]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Find removed inventories (were in initial but not in current selection)
    const removedInventories = initialInventory.filter(
      (id) => !selectedInventory.includes(id)
    );

    // Build payload
    const payload = {
      type_id: data.type?.id || data.type?.uuid,
      price: Number(price),
      description: description,
      inventories: selectedInventory, // All currently selected inventory IDs
    };

    // Only add removed_inventories key if there are actually removed items
    if (removedInventories.length > 0) {
      payload.removed_inventories = removedInventories;
    }

    if (onSubmit) {
      await onSubmit(payload);
    }
  };

  // Combine existing assigned inventories with available inventories
  const existingInventoryOptions =
    data?.inventories?.map((item) => ({
      value: item.id,
      label: item.tag,
    })) || [];

  const availableInventoryOptions =
    inventory?.data?.map((item) => ({
      value: item.id || item.uuid,
      label: item.tag,
    })) || [];

  // Merge both arrays and remove duplicates based on value (id)
  const allInventoryOptions = [
    ...existingInventoryOptions,
    ...availableInventoryOptions.filter(
      (available) =>
        !existingInventoryOptions.some(
          (existing) => existing.value === available.value
        )
    ),
  ];

  const handleInventoryChange = (selectedOptions) => {
    // Extract just the values (IDs) from selected options
    const values = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setSelectedInventory(values);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Workspace
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Multi-Select Inventory Dropdown */}
          <FormInput
            type="select"
            label="Select Inventories"
            name="inventories"
            value={selectedInventory}
            onChange={handleInventoryChange}
            options={allInventoryOptions}
            isMulti={true}
            isLoading={inventoryLoading}
            placeholder="Select one or more inventories..."
          />

          {/* Price */}
          <FormInput
            type="number"
            label="Price (Rs.)"
            name="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            min="0"
            step="0.01"
            required={true}
          />

          {/* Description */}
          <FormInput
            type="textarea"
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter workspace description"
            rows={4}
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg hover:from-[#31918D] hover:to-[#014376] transition-all disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkspace;
