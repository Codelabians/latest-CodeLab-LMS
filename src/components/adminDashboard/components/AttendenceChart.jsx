import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// 🎨 Light & Unique Pastel Colors
const COLORS = {
  attendance: {
    present: "#107941", // light teal
    absent: "#AF1F1F",  // light red/pink
    leave: "#623CB7",   // light blue
  },
};

const AttendanceChart = ({ dashboardData }) => {
  const absentStudents = parseFloat(dashboardData?.attendance?.absent_percentage) || 0;
  const presentStudents = parseFloat(dashboardData?.attendance?.present_percentage) || 0;
  const leaveStudents = parseFloat(dashboardData?.attendance?.leave_percentage) || 0;

  const attendanceData = [
    { name: "Present", value: presentStudents, color: COLORS.attendance.present },
    { name: "Absent", value: absentStudents, color: COLORS.attendance.absent },
    { name: "Leave", value: leaveStudents, color: COLORS.attendance.leave },
  ];

  return (
    <div className="w-full bg-white rounded-[15px] p-5 max-h-[25rem] overflow-y-auto shadow-lg">
      <div className="mb-4 text-xl font-semibold md:text-2xl text-heading font-poppins">
        Attendance
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="w-full h-[200px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attendanceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-attendance-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between w-full mt-6">
          {attendanceData.map((item, index) => (
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

export default AttendanceChart;