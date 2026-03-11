import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Filter,
  X,
  Users,
  Shield,
  Sunrise,
  Sunset,
  Briefcase,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useDeleteMutation,
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../api/apiSlice";
import Table from "../../components/ui/Table";
import Header from "../../components/ui/Header";
import DeleteModal from "../../components/ui/DeleteModal";
import Loader from "../../components/ui/common/LoaderComponent";
import ItemAddForm from "./ItemAddForm";
import MakeAvailableModal from "./MakeAvailableModal";
import { toast } from "react-toastify";

const InventoryItems = ({ typeSelected }) => {
  const navigate = useNavigate();
  const { uuid } = useParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [per_page, setPer_page] = useState(15);
  const [page, setPage] = useState(1);
  const [selectedID, setSelectedID] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [typeName, setTypeName] = useState(null);

  const [filters, setFilters] = useState({
    availability: "all",
    quota: "all",
  });

  const { data: classesData } = useGetQuery({
    path: "admin/classes?per_page=100",
  });

  const queryPath = useMemo(() => {
    let path = `admin/inventory/inventories/all?mapping_id=${typeSelected.mappings?.[0]?.mapping_id}&page=${page}&per_page=${per_page}`;

    if (filters.availability !== "all") {
      path += `&availability=${encodeURIComponent(filters.availability)}`;
    }

    if (filters.quota !== "all") {
      path += `&quota=${filters.quota}`;
    }

    return path;
  }, [
    typeSelected.mappings?.[0]?.mapping_id,
    page,
    per_page,
    filters.availability,
    filters.quota,
  ]);

  const {
    data: inventory,
    isLoading,
    isError,
    refetch,
  } = useGetQuery({
    path: queryPath,
  });

  const { data: types } = useGetQuery({
    path: "/admin/inventory/types/all",
  });

  const stats = useMemo(() => {
    if (!types?.data || !uuid) {
      return null;
    }

    const currentType = types.data.find(
      (type) => String(type.id) === String(uuid),
    );

    if (!currentType) {
      console.log("No type found for id:", uuid);
      return null;
    }

    const totalInventory = parseInt(currentType.inventories_count) || 0;

    const civilianMorningAvailable =
      parseInt(currentType.civilian_morning_available_count) || 0;
    const civilianEveningAvailable =
      parseInt(currentType.civilian_evening_available_count) || 0;
    const militaryMorningAvailable =
      parseInt(currentType.military_morning_available_count) || 0;
    const militaryEveningAvailable =
      parseInt(currentType.military_evening_available_count) || 0;
    const staffMorningAvailable =
      parseInt(currentType.staff_morning_available_count) || 0;
    const staffEveningAvailable =
      parseInt(currentType.staff_evening_available_count) || 0;

    const militaryQuota = parseInt(currentType.military_quota) || 0;
    const civilianQuota = parseInt(currentType.civilian_quota) || 0;
    const staffQuota = parseInt(currentType.staff_quota) || 0;

    const civilianCount = parseInt(currentType.civilian_count) || 0;
    const militaryCount = parseInt(currentType.military_count) || 0;
    const staffCount = parseInt(currentType.staff_count) || 0;

    const morningTotal =
      civilianMorningAvailable +
      militaryMorningAvailable +
      staffMorningAvailable;
    const eveningTotal =
      civilianEveningAvailable +
      militaryEveningAvailable +
      staffEveningAvailable;

    const bothSlotsAvailable = Math.min(morningTotal, eveningTotal);
    const totalAvailable = Math.max(morningTotal, eveningTotal);
    const unavailable = totalInventory - totalAvailable;

    return {
      total: totalInventory,
      morning: morningTotal,
      evening: eveningTotal,
      bothSlots: bothSlotsAvailable,
      available: totalAvailable,
      unavailable: unavailable,
      civilianQuota,
      militaryQuota,
      staffQuota,
      civilianCount,
      militaryCount,
      staffCount,
      civilianMorning: civilianMorningAvailable,
      civilianEvening: civilianEveningAvailable,
      militaryMorning: militaryMorningAvailable,
      militaryEvening: militaryEveningAvailable,
      staffMorning: staffMorningAvailable,
      staffEvening: staffEveningAvailable,
    };
  }, [types?.data, uuid]);

  const [createInventory] = usePostMutation();
  const [updateInventory] = usePutMutation();
  const [deleteInventory] = useDeleteMutation();

  useEffect(() => {
    if (typeSelected.name) {
      setTypeName(typeSelected.name.toLowerCase());
    }
  }, [inventory?.data]);

  const categoryName = useMemo(() => {
    if (!typeSelected.name) return null;
    return typeSelected?.name || "";
  }, [typeSelected.name]);

  // Flexible check for "lendable" in category name
  const isLendableCategory = useMemo(() => {
    if (!categoryName) return false;
    return categoryName.toLowerCase().includes("moveable assets");
  }, [categoryName]);

  const isLaptopType = typeName === "laptop" || typeName === "laptops";

  // Update the condition for showing stats
  const shouldShowStats = isLaptopType;

  console.log("Debug Info:", {
    typeName,
    categoryName,
    isLaptopType,
    isLendableCategory,
    shouldShowStats,
  });

  // Check if serial number should be shown - for laptops specifically
  const hasSerialNumber = useMemo(() => {
    return isLaptopType;
  }, [isLaptopType]);

  // const columns = useMemo(() => {
  //   const baseColumns = ["Tag"];

  //   if (hasSerialNumber) {
  //     baseColumns.push("Serial Number");
  //   }

  //   baseColumns.push("Category", "Type");

  //   // Show availability, quota, and assigned to columns for all lendable items
  //   if (isLendableCategory) {
  //     baseColumns.push("Availability", "Quota", "Assigned to");
  //   }

  //   if (!isLendableCategory) {
  //     baseColumns.push("Note");
  //   }

  //   return baseColumns;
  // }, [hasSerialNumber, isLendableCategory]);
  const columns = useMemo(() => {
    const baseColumns = ["Tag"];

    if (hasSerialNumber) {
      baseColumns.push("Serial Number");
    }

    baseColumns.push("Category", "Type");

    // Laptops also show availability/quota
    if (isLendableCategory || isLaptopType) {
      baseColumns.push("Availability", "Quota", "Assigned to");
    }

    if (!isLendableCategory && !isLaptopType) {
      baseColumns.push("Note");
    }

    return baseColumns;
  }, [hasSerialNumber, isLendableCategory, isLaptopType]);

  const handleEditClick = (item) => {
    const fullItem = inventory?.data?.find(
      (invItem) => invItem.uuid === item.uuid,
    );
    setEditingItem(fullItem);
    setIsSerialModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        category_id: formData.category,
        type_id: formData.type,
        name: formData.name,
        total_quantity: parseInt(formData.quantity, 10),
        image:
          typeof formData.image === "string"
            ? formData.image
            : formData.image?.name || "",
      };

      if (editingItem) {
        await updateInventory({
          path: `/admin/inventory/inventories/${editingItem.uuid}`,
          body: payload,
          method: "PUT",
        }).unwrap();
        toast.success("Inventory updated successfully!");
      } else {
        await createInventory({
          path: `/admin/inventory/inventories/all${typeSelected.mappings?.[0]?.mapping_id}`,
          body: payload,
        }).unwrap();
        toast.success("Inventory created successfully!");
      }

      setIsModalOpen(false);
      setEditingItem(null);
      // refetchInventory?.();
      // refetchTypes?.();
    } catch (error) {
      toast.error("Error saving inventory");
      console.error("Error saving inventory:", error);
    }
  };

  const handleMakeAvailable = async (data) => {
    try {
      await createInventory({
        path: `/admin/inventory/inventories/set-available/${data.class_id}`,
      }).unwrap();

      setIsAvailabilityModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error making inventory available:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInventory({
        path: `/admin/inventory/inventories/${selectedID}`,
      }).unwrap();
      refetch();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleCloseSerialModal = () => {
    setIsSerialModalOpen(false);
    setEditingItem(null);
  };

  const handleResetFilters = () => {
    setFilters({
      availability: "all",
      quota: "all",
    });
  };

  const handelAvailability = () => {
    setIsAvailabilityModalOpen(true);
  };

  // Helper function to get quota badge
  const getQuotaBadge = (quotaValue) => {
    const quotaLower = quotaValue?.toLowerCase();

    if (quotaLower === "civilian") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Civilian
        </span>
      );
    } else if (quotaLower === "staff") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
          Staff
        </span>
      );
    } else {
      // Default to military
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Military
        </span>
      );
    }
  };

  // Updated mappedData to use isLendableCategory
  const mappedData = useMemo(() => {
    return inventory?.data?.map((item) => {
      const baseData = {
        uuid: item.uuid,
        tag: item.tag,
      };

      // Serial Number
      if (hasSerialNumber) {
        baseData["serial number"] = item.serial_number ? (
          <span>{item.serial_number}</span>
        ) : (
          <span>_</span>
        );
      }

      // Note for non-lendable
      if (!isLendableCategory) {
        baseData["note"] = item.note ? (
          <span>{item.note}</span>
        ) : (
          <span>_</span>
        );
      }

      // ✅ FIXED CATEGORY & TYPE — matches your API
      baseData.category = item?.mapping?.pivot?.main_category?.name || "N/A";

      baseData.type = item?.mapping?.type?.name || "N/A";

      // Lendable extra fields
      if (isLendableCategory || isLaptopType) {
        baseData.availability = item?.availability_message || "N/A";

        // Quota Badge
        baseData.quota = getQuotaBadge(item.quota || "military");

        // Assigned to users
        if (item?.inventory_classes?.length > 0) {
          const uniqueUsers = [
            ...new Set(
              item.inventory_classes.map((ic) => ic.user_name).filter(Boolean),
            ),
          ];

          baseData["assigned to"] =
            uniqueUsers.length > 0 ? (
              <div className="flex flex-col gap-1">
                {uniqueUsers.map((userName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {userName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-xs italic">Not Assigned</span>
            );
        } else {
          baseData["assigned to"] = (
            <span className="text-gray-400 text-xs italic">Not Assigned</span>
          );
        }
      }

      return baseData;
    });
  }, [inventory?.data, hasSerialNumber, isLendableCategory]);

  return (
    <div className=" mx-auto">
      {/* Stats Card - Only for Lendable Assets */}
      {shouldShowStats && stats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          {/* Civilian Statistics Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Civilian Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.civilianQuota}
                  </p>
                  <p className="text-xs text-gray-600">Quota</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sunrise className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.civilianMorning}
                  </p>
                  <p className="text-xs text-gray-600">Morning Available</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sunset className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.civilianEvening}
                  </p>
                  <p className="text-xs text-gray-600">Evening Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Military Statistics Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Military Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.militaryQuota}
                  </p>
                  <p className="text-xs text-gray-600">Quota</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Sunrise className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.militaryMorning}
                  </p>
                  <p className="text-xs text-gray-600">Morning Available</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Sunset className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.militaryEvening}
                  </p>
                  <p className="text-xs text-gray-600">Evening Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Statistics Section */}
          <div>
            <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Staff Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.staffQuota}
                  </p>
                  <p className="text-xs text-gray-600">Quota</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Sunrise className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.staffMorning}
                  </p>
                  <p className="text-xs text-gray-600">Morning Available</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Sunset className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.staffEvening}
                  </p>
                  <p className="text-xs text-gray-600">Evening Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => navigate("/dashboard/inventory")}
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800 transition-colors"
        ></button>
        {shouldShowStats && (
          <button
            onClick={handelAvailability}
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800 transition-colors bg-green-600 px-4 py-3 rounded-md text-white"
          >
            <span className="font-semibold">Make Available</span>
          </button>
        )}
      </div>

      <Header
        title="Inventory Items"
        icon={<Box />}
        setIsCreateModalOpen={setIsModalOpen}
        // sourceComponent="Inventory"
      />
      {/* Filters - Only for Lendable Assets */}
      {shouldShowStats && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            </div>
            {(filters.availability !== "all" || filters.quota !== "all") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) =>
                  setFilters({ ...filters, availability: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="Available for Morning">
                  Available for Morning
                </option>
                <option value="Available for Evening">
                  Available for Evening
                </option>
                <option value="Available for Both Slots">
                  Available for Both Slots
                </option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>

            {/* Quota Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quota Type
              </label>
              <select
                value={filters.quota}
                onChange={(e) =>
                  setFilters({ ...filters, quota: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="civilian">Civilian</option>
                <option value="military">Military</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.availability !== "all" || filters.quota !== "all") && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.availability !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Availability: {filters.availability}
                  <button
                    onClick={() =>
                      setFilters({ ...filters, availability: "all" })
                    }
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.quota !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Quota:{" "}
                  {filters.quota.charAt(0).toUpperCase() +
                    filters.quota.slice(1)}
                  <button
                    onClick={() => setFilters({ ...filters, quota: "all" })}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {mappedData?.length || 0} items
          </div>
        </div>
      )}

      {isLoading && <Loader />}
      {isError && <div>Error loading Inventory Items</div>}

      {!isLoading && !isError && (
        <Table
          columns={columns}
          data={mappedData}
          setPer_page={setPer_page}
          setPage={setPage}
          paginationMeta={inventory?.meta?.pagination}
          setSelectedID={setSelectedID}
          handleEditClick={handleEditClick}
          setIsEditModalOpen={setIsSerialModalOpen}
        />
      )}
      <ItemAddForm
        isOpen={isModalOpen}
        typeSelected={typeSelected}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingItem}
        mode={editingItem ? "edit" : "create"}
        // refetch={refetchInventory}
      />
      <ItemAddForm
        isOpen={isSerialModalOpen}
        onClose={handleCloseSerialModal}
        inventoryItems={inventory?.data || []}
        refetch={refetch}
        editingItem={editingItem}
        mode={editingItem ? "edit" : "create"}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Record"
        message="Are you sure you want to delete this record?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDelete}
        successMessage="Record deleted successfully!"
      />
      <MakeAvailableModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSubmit={handleMakeAvailable}
        classes={classesData?.data || []}
      />
      {/* <Addinventory
        isOpen={isSerialModalOpen}
        initialValues={editingItem}
        onClose={() => {
          setIsSerialModalOpen(false);
        }}
      /> */}
      {/* <Addinventory
        isOpen={isSerialModalOpen}
        initialValues={editingItem}
        onClose={() => setIsSerialModalOpen(false)}
        mode="edit"
        refetch={refetch}
      /> */}
    </div>
  );
};

export default InventoryItems;
