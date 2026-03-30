import { useState } from "react";
import {
  FiLayers,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiInbox,
  FiFilter,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";
import {
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../api/apiSlice";
import BatchCard from "./components/BatchCard";
import StatCard from "./components/StatCard";
import SkeletonCard from "./components/SkeletonCard";
import { toast } from "react-toastify";
import AddBatchModal from "./components/AddBatchModal";

const BatchesComponent = () => {
  const [localStatus, setLocalStatus] = useState({});
  const [toggleLoading, setToggleLoading] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateBatchConfirmModalOpen, setIsCreateBatchConfirmModalOpen] =
    useState(false);

  const {
    data: allbatches,
    isLoading,
    refetch: refetchBatches,
  } = useGetQuery({
    path: "/admin/batches",
  });

  const [patchBatch] = usePatchMutation();
  const [post] = usePostMutation();

  const batches = allbatches?.data || [];

  const isActive = (batch) => {
    if (localStatus[batch.id] !== undefined) return localStatus[batch.id];
    return batch.is_active ?? batch.active ?? false;
  };

  const handleToggle = async (batch) => {
    setToggleLoading((prev) => ({ ...prev, [batch.id]: true }));
    try {
      const res = await patchBatch({
        path: `/admin/batches/${batch.id}/toggle`,
      }).unwrap();

      if (res.error) {
        toast.error(res?.error?.data?.message);
      } else {
        toast.success(res?.message);
      }

      setLocalStatus((prev) => ({ ...prev, [batch.id]: !isActive(batch) }));
    } catch (error) {
      toast.error(error?.data?.message);
    } finally {
      setToggleLoading((prev) => ({ ...prev, [batch.id]: false }));
    }
  };

  const activeCount = batches.filter((b) => isActive(b)).length;
  const inactiveCount = batches.length - activeCount;

  const filtered = batches.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const active = isActive(b);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && active) ||
      (filter === "inactive" && !active);
    return matchSearch && matchFilter;
  });
  const handelModalOpen = () => {
    setIsCreateBatchConfirmModalOpen(true);
  };
  const handleCreateBatchConfirm = async () => {
    try {
      const response = await post({ path: "/admin/batches/create" }).unwrap();
      if (response.message === "Success." && response.status === 1) {
        toast.success("Batch Created Successfully", "success");
        refetchBatches();
      }
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-4 sm:p-6 lg:p-8">
      <div className=" mx-auto space-y-5">
        {/* ── Page Header ── */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#100F0F] to-[#100F0F] rounded-2xl shadow-lg shadow-teal-200/50">
                <FiLayers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  Batches
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Toggle visibility for student enrollment
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetchBatches?.()}
              className="
              group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0
              border-2 border-gray-200 bg-white text-xs font-bold text-gray-500
              hover:border-[#d61111] hover:text-[#d61111] hover:bg-teal-50/30
              transition-all duration-200 shadow-sm
            "
            >
              <FiRefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
            <button
              onClick={handelModalOpen}
              className="
    group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0
    border-2 border-gray-200 bg-white text-xs font-bold text-gray-500
    hover:border-[#d61111] hover:text-[#d61111] hover:bg-teal-50/30
    transition-all duration-200 shadow-sm
  "
            >
              <FiPlus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
              Add Batch
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Batches"
            value={isLoading ? "—" : batches.length}
            icon={FiLayers}
            gradient="bg-gradient-to-br from-white to-blue-50/60 border-blue-100/60"
            textColor="text-[#aa0e0e]"
            iconBg="bg-red-100/50"
          />
          <StatCard
            label="Active"
            value={isLoading ? "—" : activeCount}
            icon={FiCheckCircle}
            gradient="bg-gradient-to-br from-white to-emerald-50/60 border-emerald-100/60"
            textColor="text-emerald-700"
            iconBg="bg-emerald-100/50"
          />
          <StatCard
            label="Inactive"
            value={isLoading ? "—" : inactiveCount}
            icon={FiXCircle}
            gradient="bg-gradient-to-br from-white to-rose-50/60 border-rose-100/60"
            textColor="text-rose-500"
            iconBg="bg-rose-100/50"
          />
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by batch name…"
              className="
                w-full pl-11 pr-10 py-3 rounded-xl bg-white
                border-2 border-gray-100 text-sm font-semibold text-gray-700
                outline-none transition-all duration-200
                focus:border-[#aa0e0e] focus:shadow-sm
                placeholder:text-gray-300 placeholder:font-normal
              "
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
              >
                <FiXCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter group */}
          <div className="flex items-center bg-white border-2 border-gray-100 rounded-xl p-1 gap-0.5 flex-shrink-0">
            <div className="px-2 flex-shrink-0">
              <FiFilter className="w-3.5 h-3.5 text-gray-300" />
            </div>
            {[
              { key: "all", label: "All", count: batches.length },
              { key: "active", label: "Active", count: activeCount },
              { key: "inactive", label: "Inactive", count: inactiveCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold
                  transition-all duration-200
                  ${
                    filter === key
                      ? "bg-gradient-to-r from-[#aa0e0e] to-[#d61111] text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                {label}
                <span
                  className={`
                  text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center
                  ${filter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}
                `}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <AddBatchModal
          isOpen={isCreateBatchConfirmModalOpen}
          setIsOpen={setIsCreateBatchConfirmModalOpen}
          title="Confirm Batch Creation"
          message="Are you sure you want to create a new batch? This will automatically generate a new record."
          confirmText="Yes, Create"
          cancelText="Cancel"
          onConfirm={handleCreateBatchConfirm}
        />

        {/* ── Batch List ── */}
        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 80} />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                <FiInbox className="w-7 h-7 text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">
                No batches found
              </p>
              <p className="text-xs text-gray-300 mt-1.5 text-center max-w-xs">
                {search
                  ? `No results matching "${search}"`
                  : "No batches match the current filter"}
              </p>
              {(search || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#aa0e0e] to-[#d61111] text-white text-xs font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                index={batches.indexOf(batch)}
                active={isActive(batch)}
                loading={!!toggleLoading[batch.id]}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {!isLoading && batches.length > 0 && (
          <div className="flex items-center justify-between pt-0.5 pb-2">
            <p className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-600">{filtered.length}</span>{" "}
              of{" "}
              <span className="font-bold text-gray-600">{batches.length}</span>{" "}
              batches
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-[#d61111] font-bold hover:underline flex items-center gap-1"
              >
                View all
                <FiChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchesComponent;
