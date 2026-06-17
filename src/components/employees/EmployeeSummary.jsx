import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Users, Award, UserCog, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuery } from "../../api/apiSlice";

const EmployeeSummary = () => {
  const navigate = useNavigate();

  const { data: employee } = useGetQuery({
    path: "/admin/dashboard",
  });

  // Employee Data from API
  const employeeData = employee?.data?.employees || {};

  const roles = [
    {
      name: "SMEs",
      count: employeeData.sme_employees || 0,
      icon: Award,
      color: "#8B5CF6",
    },
    {
      name: "STP",
      count: employeeData.stp_employees || 0,
      icon: UserCog,
      color: "#3B82F6",
    },
  ];

  const departmentData = [
    { name: "Engineering", value: 12, color: "#3B82F6" },
    { name: "Development", value: 8, color: "#10B981" },
    { name: "Operations", value: 9, color: "#F59E0B" },
    { name: "Strategy", value: 5, color: "#8B5CF6" },
  ];

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="w-11/12 mx-auto">
        <ArrowLeft
          onClick={() => navigate(-1)}
          className="w-8 h-8 mb-4 text-brown"
        />
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brown">HR Managements</h1>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employeeData.total_employees || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Employees
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employeeData.active_employees || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Inactive Employees
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employeeData.inactive_employees || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          {roles.map((role, index) => (
            <div
              key={index}
              className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${role.color}20` }}
                  >
                    <role.icon
                      className="w-6 h-6"
                      style={{ color: role.color }}
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {role.name}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {role.count}
                  </p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
      </div>
    </div>
  );
};

export default EmployeeSummary;
