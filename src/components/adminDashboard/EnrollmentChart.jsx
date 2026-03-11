import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// 🎨 Light & Unique Pastel Colors
const COLORS = {
  enrollment: {
    weekly: "#D68443",  // light purple
    monthly: "#0268E1", // light indigo
  },
};

const EnrollmentChart = ({ dashboardData }) => {
  const weeklyEnrollments = parseFloat(dashboardData?.enrollments?.weekly_enrollments_count) || 0;
  const monthlyEnrollments = parseFloat(dashboardData?.enrollments?.monthly_enrollments_count) || 0;

  const enrollmentData = [
    { name: "Weekly", value: weeklyEnrollments, color: COLORS.enrollment.weekly },
    { name: "Monthly", value: monthlyEnrollments, color: COLORS.enrollment.monthly },
  ];

  return (
    <div className="w-full bg-white rounded-[15px] p-5 max-h-[25rem] overflow-y-auto shadow-lg">
      <div className="mb-4 text-xl font-semibold md:text-2xl text-heading font-poppins">
        Enrollments
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full h-[200px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enrollmentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {enrollmentData.map((entry, index) => (
                  <Cell key={`cell-enrollment-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between w-full mt-6">
          {enrollmentData.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="w-16 h-2 mb-2 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <div
                className="text-base font-bold font-poppins sm:text-lg"
                style={{ color: item.color }}
              >
                {item.name}
              </div>
              <div className="font-nunito">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentChart;