// import { XCircle } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useGetQuery, usePutMutation } from "../api/apiSlice";
// import FormInput from "../components/ui/FormInput";

// const UpdateAssignInventory = ({
//   isOpen,
//   onClose,
//   data,
//   onSubmit,
//   category_id,
// }) => {
//   const [name, setName] = useState("");
//   const [selectedInventory, setSelectedInventory] = useState([]);
//   const [initialInventory, setInitialInventory] = useState([]);
//   const [updateWorkspace, { isLoading }] = usePutMutation();

//   const { data: inventory, isLoading: inventoryLoading } = useGetQuery({
//     path: `admin/workspaces/get/fixed-inventories?category_id=${category_id}`,
//   });

//   useEffect(() => {
//     if (data) {
//       setName(data.name ?? "");

//       if (data.inventories && Array.isArray(data.inventories)) {
//         const inventoryIds = data.inventories.map((inv) => inv.id);
//         setSelectedInventory(inventoryIds);
//         setInitialInventory(inventoryIds);
//       } else {
//         setSelectedInventory([]);
//         setInitialInventory([]);
//       }
//     }
//   }, [data]);

//   if (!isOpen) return null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const removedInventories = initialInventory.filter(
//       (id) => !selectedInventory.includes(id)
//     );

//     const payload = {
//       type_id: data.type?.id || data.type?.uuid,
//       name: name,
//       inventories: selectedInventory,
//     };

//     if (removedInventories.length > 0) {
//       payload.removed_inventories = removedInventories;
//     }

//     if (onSubmit) {
//       await onSubmit(payload);
//     }
//   };

//   const existingInventoryOptions =
//     data?.inventories?.map((item) => ({
//       value: item.id,
//       label: item.tag,
//     })) || [];

//   const availableInventoryOptions =
//     inventory?.data?.map((item) => ({
//       value: item.id || item.uuid,
//       label: item.tag,
//     })) || [];

//   const allInventoryOptions = [
//     ...existingInventoryOptions,
//     ...availableInventoryOptions.filter(
//       (available) =>
//         !existingInventoryOptions.some(
//           (existing) => existing.value === available.value
//         )
//     ),
//   ];

//   const handleInventoryChange = (selectedOptions) => {
//     const values = selectedOptions
//       ? selectedOptions.map((opt) => opt.value)
//       : [];
//     setSelectedInventory(values);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
//         >
//           <XCircle className="w-6 h-6" />
//         </button>

//         <h2 className="text-2xl font-bold text-gray-800 mb-6">
//           Edit Workspace
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Select Inventories */}
//           <FormInput
//             type="select"
//             label="Select Inventories"
//             name="inventories"
//             value={selectedInventory}
//             onChange={handleInventoryChange}
//             options={allInventoryOptions}
//             isMulti={true}
//             isLoading={inventoryLoading}
//             placeholder="Select one or more inventories..."
//           />

//           {/* Name */}
//           <FormInput
//             type="text"
//             label="Name"
//             name="name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             placeholder="Enter name"
//             required={true}
//           />

//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg hover:from-[#31918D] hover:to-[#014376] transition-all disabled:opacity-50"
//             >
//               {isLoading ? "Saving..." : "Save Changes"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default UpdateAssignInventory;
import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetQuery, usePutMutation } from "../api/apiSlice";
import FormInput from "../components/ui/FormInput";
const UpdateAssignInventory = ({
  isOpen,
  onClose,
  data,
  onSubmit,
  category_id,
}) => {
  const [name, setName] = useState("");
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [initialInventory, setInitialInventory] = useState([]);
  const [updateWorkspace, { isLoading }] = usePutMutation();
  const { data: inventory, isLoading: inventoryLoading } = useGetQuery({
    path: `admin/workspaces/get/fixed-inventories?category_id=${category_id}`,
  });

  const editInventorys = data?.inventories?.props?.inventories;

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      if (editInventorys && Array.isArray(editInventorys)) {
        const inventoryIds = editInventorys.map((inv) => inv.id);
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
    const removedInventories = initialInventory.filter(
      (id) => !selectedInventory.includes(id)
    );
    const payload = {
      type_id: data.type?.id || data.type?.uuid,
      name: name,
      inventories: selectedInventory,
    };
    if (removedInventories.length > 0) {
      payload.removed_inventories = removedInventories;
    }
    if (onSubmit) {
      await onSubmit(payload);
    }
  };
  const existingInventoryOptions =
    editInventorys?.map((item) => ({
      value: item.id,
      label: `${
        item?.mapping?.type?.name ? `(${item?.mapping?.type?.name})` : ""
      } ${item.tag}`,
    })) || [];
  const availableInventoryOptions =
    inventory?.data?.map((item) => ({
      value: item.id || item.uuid,
      label: `${
        item?.mapping?.type?.name ? `(${item?.mapping?.type?.name})` : ""
      } ${item.tag}`,
    })) || [];
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
          {/* Select Inventories */}
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
          {/* Name */}
          <FormInput
            type="text"
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            required={true}
          />
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
export default UpdateAssignInventory;
