import { useGetQuery } from "../../api/apiSlice";

const HallsTabs = ({ setActiveHallTab, activeHallTab }) => {
  const { data: hallData } = useGetQuery({
    path: "/admin/halls",
  });
  return (
    <>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveHallTab("all")}
          className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
            activeHallTab === "all"
              ? "bg-[#100F0F] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Halls
        </button>
        {hallData?.data?.map((hall) => (
          <button
            key={hall.id}
            onClick={() => setActiveHallTab(hall.id.toString())}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeHallTab === hall.id.toString()
                ? "bg-[#100F0F] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {hall.name}
          </button>
        ))}
      </div>
    </>
  );
};

export default HallsTabs;
