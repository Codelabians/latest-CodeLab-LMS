import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const InventoryCard = ({ item, icon, color }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dashboard/inventory/items/${item.id}`);
  };

  const totalInventory = parseInt(item.inventories_count) || 0;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 hover:scale-[1.02]"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between p-5">
        {/* Left Section - Icon and Name */}
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div
            className="p-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color: color }}>{icon}</div>
          </div>

          {/* Name */}
          <h2 className="text-lg font-bold text-gray-800 capitalize truncate">
            {item.name}
          </h2>
        </div>

        {/* Right Section - Total Items Count */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">{totalInventory}</p>
            <p className="text-xs text-gray-500 font-medium">
              {totalInventory === 1 ? "Item" : "Items"}
            </p>
          </div>

          {/* Arrow Icon */}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;
