import { useGetQuery } from "../../api/apiSlice";
import { useState, useEffect, useRef } from "react";

const BatchTabs = ({ setActiveBatchTab, activeBatchTab }) => {
  const { data: allbatches } = useGetQuery({ path: "/admin/batches" });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const batches = allbatches?.data || [];
  const options = [{ id: "all", name: "All Batches" }, ...batches];

  const handleSelect = (id) => {
    setActiveBatchTab(id.toString());
    setIsOpen(false);
  };

  const selectedBatch = options.find(
    (batch) => batch.id.toString() === activeBatchTab
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Value */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer border-[1.5px] border-[#d61111] rounded-md px-4 py-2 flex justify-between items-center text-[#d61111] font-medium w-full"
      >
        <span>{selectedBatch?.name || "Select Batch"}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <ul className="absolute z-50 w-full bg-white border-[1.5px] border-[#d61111] rounded-md mt-1 max-h-[400px] overflow-y-auto shadow-lg">
          {options.map((batch) => {
            const isActive = activeBatchTab === batch.id.toString();
            return (
              <li
                key={batch.id}
                onClick={() => handleSelect(batch.id)}
                className={`px-4 py-2 cursor-pointer ${
                  isActive
                    ? "bg-[#d61111] text-white"
                    : "hover:bg-[#d61111] hover:text-white"
                }`}
              >
                {batch.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BatchTabs;