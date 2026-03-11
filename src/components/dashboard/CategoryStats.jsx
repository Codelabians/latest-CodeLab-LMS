import React from "react";

const CategoryStats = ({ data }) => {
  return (
    <div className="flex flex-col justify-center w-full p-4 bg-white shadow rounded-xl">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex gap-4 mb-6 sm:flex-row sm:items-center"
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center w-16 h-16 mx-auto sm:w-20 sm:h-20 sm:mx-0"
            style={{ backgroundColor: item.bgColor }}
          >
            <img
              src={item.icon}
              alt={item.label}
              className="w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>

          {/* Text + Progress */}
          <div className="flex-1 w-full">
            <div className="w-full h-3 mt-2 bg-gray-200 rounded-full">
              <div
                className="h-3 rounded-full sm:h-5"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              ></div>
            </div>
            <p className="mt-2 text-center sm:text-left">{item.label}</p>
          </div>

          {/* Percentage */}
          {/* Percentage */}
          <span className="text-center sm:text-right">
            {parseFloat(item.percentage).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryStats;
