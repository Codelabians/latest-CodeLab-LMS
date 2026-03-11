import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const StudentsStats = ({ title, percentage, color }) => {
  // Ensure percentage is a valid number between 0 and 100, default to 0 if invalid
  const validPercentage = isNaN(percentage) || percentage < 0 || percentage > 100 ? 0 : Number(percentage).toFixed(1);
  const chartValue = parseFloat(validPercentage); // Convert to number for chart rendering
  const data = [
    { name: "filled", value: chartValue },
    { name: "remaining", value: 100 - chartValue },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-h-[260px]">
      <div className="mb-2 text-4xl font-bold text-brown">
        {validPercentage}%
      </div>
      <div className="relative w-32 h-32 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#f0f0f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm text-center text-gray-700">
        {title}
      </div>
    </div>
  );
};

export default StudentsStats;