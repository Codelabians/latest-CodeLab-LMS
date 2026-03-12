import { useGetQuery } from "../../api/apiSlice";

const BatchTabs = ({ setActiveBatchTab, activeBatchTab }) => {
  const { data: allbatches } = useGetQuery({
    path: "/admin/batches",
  });

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      <button
        onClick={() => setActiveBatchTab("all")}
        className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
          activeBatchTab === "all"
            ? "bg-gradient-to-r from-[#aa0e0e] to-[#100F0F] text-white shadow-lg"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        All Batches
      </button>
      {allbatches?.data?.map((batch) => (
        <button
          key={batch.id}
          onClick={() => setActiveBatchTab(batch.id.toString())}
          className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeBatchTab === batch.id.toString()
              ? "bg-gradient-to-r from-[#014376] to-[#31918D] text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {batch.name}
        </button>
      ))}
    </div>
  );
};

export default BatchTabs;
