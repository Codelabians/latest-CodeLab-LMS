import React, { useMemo } from "react";
import {
  Users,
  User,
  TrendingUp,
  ArrowLeft,
  Building,
  MapPin,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useGetQuery } from "../../api/apiSlice";

const StartupSummary = () => {
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/dashboard",
  });

  // Process workspace data
  const workspaceStats = useMemo(() => {
    const workspace = dashboardData?.data?.workspace || {
      revenue: 0,
      workspaces: [],
    };
    const workspaces = workspace.workspaces || [];

    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalAvailable = 0;
    let totalOccupiedByCompany = 0;
    let totalOccupiedByIndividual = 0;

    const categoryData = [];
    const typeBreakdown = [];

    workspaces.forEach((category) => {
      let categoryTotal = 0;
      let categoryOccupied = 0;
      let categoryAvailable = 0;

      category.types?.forEach((type) => {
        const typeTotal = type.total || 0;
        const typeOccupied = type.occupied || 0;
        const typeAvailable = type.available || 0;
        const occupiedByCompany = type.occupied_by_company || 0;
        const occupiedByIndividual = type.occupied_by_individual || 0;

        totalSpaces += typeTotal;
        totalOccupied += typeOccupied;
        totalAvailable += typeAvailable;
        totalOccupiedByCompany += occupiedByCompany;
        totalOccupiedByIndividual += occupiedByIndividual;

        categoryTotal += typeTotal;
        categoryOccupied += typeOccupied;
        categoryAvailable += typeAvailable;

        if (typeTotal > 0) {
          typeBreakdown.push({
            name: type.type,
            category: category.category,
            total: typeTotal,
            occupied: typeOccupied,
            available: typeAvailable,
            occupiedByCompany,
            occupiedByIndividual,
          });
        }
      });

      if (categoryTotal > 0) {
        categoryData.push({
          name: category.category,
          total: categoryTotal,
          occupied: categoryOccupied,
          available: categoryAvailable,
        });
      }
    });

    const occupancyRate =
      totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 100) : 0;

    return {
      revenue: workspace.revenue || 0,
      totalSpaces,
      totalOccupied,
      totalAvailable,
      totalOccupiedByCompany,
      totalOccupiedByIndividual,
      occupancyRate,
      categoryData,
      typeBreakdown,
    };
  }, [dashboardData]);

  // Prepare chart data
  const occupancyData = useMemo(() => {
    return [
      {
        name: "Company",
        occupied: workspaceStats.totalOccupiedByCompany,
        available: workspaceStats.totalSpaces - workspaceStats.totalOccupied,
      },
      {
        name: "Individual",
        occupied: workspaceStats.totalOccupiedByIndividual,
        available: workspaceStats.totalAvailable,
      },
    ];
  }, [workspaceStats]);

  const utilizationData = useMemo(() => {
    const data = [];

    if (workspaceStats.totalOccupiedByCompany > 0) {
      const companyRate =
        workspaceStats.totalSpaces > 0
          ? (workspaceStats.totalOccupiedByCompany /
              workspaceStats.totalSpaces) *
            100
          : 0;
      data.push({
        name: "Company",
        value: companyRate,
      });
    }

    if (workspaceStats.totalOccupiedByIndividual > 0) {
      const individualRate =
        workspaceStats.totalSpaces > 0
          ? (workspaceStats.totalOccupiedByIndividual /
              workspaceStats.totalSpaces) *
            100
          : 0;
      data.push({
        name: "Individual",
        value: individualRate,
      });
    }

    if (workspaceStats.totalAvailable > 0) {
      const availableRate =
        workspaceStats.totalSpaces > 0
          ? (workspaceStats.totalAvailable / workspaceStats.totalSpaces) * 100
          : 0;
      data.push({
        name: "Available",
        value: availableRate,
      });
    }

    return data;
  }, [workspaceStats]);

  const COLORS = ["#d61111", "#10B981", "#F59E0B", "#EF4444"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-600 text-xl mb-4">
            Failed to load workspace data
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="w-11/12 mx-auto">
        <ArrowLeft
          onClick={() => navigate(-1)}
          className="w-8 h-8 mb-4 text-brown cursor-pointer hover:text-brown-600"
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Workspace Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor workspace occupancy and revenue
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Individual</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workspaceStats.totalOccupiedByIndividual}
                </p>
                <p className="text-xs text-gray-500">Occupied</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Company</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workspaceStats.totalOccupiedByCompany}
                </p>
                <p className="text-xs text-gray-500">Occupied</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-lg font-bold text-yellow-600">PKR</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workspaceStats.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Occupancy Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workspaceStats.occupancyRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          {/* Occupancy Chart */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Workspace Occupancy
            </h3>
            {occupancyData.some((d) => d.occupied > 0 || d.available > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupied" fill="#d61111" name="Occupied" />
                  <Bar dataKey="available" fill="#10B981" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No occupancy data available
              </div>
            )}
          </div>

          {/* Utilization Pie Chart */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Utilization Rates
            </h3>
            {utilizationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No utilization data available
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        {workspaceStats.categoryData.length > 0 && (
          <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Location Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workspaceStats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#d61111" name="Occupied" />
                <Bar dataKey="available" fill="#10B981" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type Breakdown Table */}
        {workspaceStats.typeBreakdown.length > 0 && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Workspace Type Details
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      By Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      By Individual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workspaceStats.typeBreakdown.map((type, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {type.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {type.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {type.occupied}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {type.available}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type.occupiedByCompany}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type.occupiedByIndividual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {workspaceStats.totalSpaces === 0 && (
          <div className="p-12 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Workspace Data
            </h3>
            <p className="text-gray-500">
              There are currently no workspace records available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupSummary;
