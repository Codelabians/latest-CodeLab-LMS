import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  Package,
  Archive,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuery } from "../api/apiSlice";

const InventorySummary = () => {
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/dashboard",
  });

  // Process inventory data
  const processedData = useMemo(() => {
    const inventory = dashboardData?.data?.inventory || {};

    let totalAssets = 0;
    let totalAvailable = 0;
    let totalInUse = 0;
    const locationData = [];
    const categoryData = [];
    const typeBreakdown = [];

    // Process each location
    Object.keys(inventory).forEach((locationName) => {
      const location = inventory[locationName];
      const locationTotal = location.total || 0;
      const locationAvailable = location.available || 0;
      const locationInUse = location.in_use || 0;

      totalAssets += locationTotal;
      totalAvailable += locationAvailable;
      totalInUse += locationInUse;

      // Add to location data
      if (locationTotal > 0) {
        locationData.push({
          name: locationName.trim(),
          available: locationAvailable,
          inUse: locationInUse,
          total: locationTotal,
        });
      }

      // Process sub-categories
      const subCategories = location.sub_categories || {};
      Object.keys(subCategories).forEach((categoryName) => {
        const category = subCategories[categoryName];
        const categoryTotal = category.total || 0;

        if (categoryTotal > 0) {
          // Check if category already exists
          const existingCategory = categoryData.find(
            (c) => c.name === categoryName
          );
          if (existingCategory) {
            existingCategory.total += categoryTotal;
            existingCategory.available += category.available || 0;
            existingCategory.inUse += category.in_use || 0;
          } else {
            categoryData.push({
              name: categoryName,
              total: categoryTotal,
              available: category.available || 0,
              inUse: category.in_use || 0,
            });
          }

          // Process types
          const types = category.types || {};
          if (typeof types === "object" && !Array.isArray(types)) {
            Object.keys(types).forEach((typeName) => {
              const type = types[typeName];
              if (type.total > 0) {
                const existingType = typeBreakdown.find(
                  (t) => t.name === typeName
                );
                if (existingType) {
                  existingType.total += type.total || 0;
                  existingType.available += type.available || 0;
                  existingType.inUse += type.in_use || 0;
                } else {
                  typeBreakdown.push({
                    name: typeName,
                    total: type.total || 0,
                    available: type.available || 0,
                    inUse: type.in_use || 0,
                  });
                }
              }
            });
          }
        }
      });
    });

    const utilizationRate =
      totalAssets > 0 ? Math.round((totalInUse / totalAssets) * 100) : 0;

    return {
      totalAssets,
      totalAvailable,
      totalInUse,
      utilizationRate,
      locationData: locationData.sort((a, b) => b.total - a.total),
      categoryData: categoryData.sort((a, b) => b.total - a.total),
      typeBreakdown: typeBreakdown.sort((a, b) => b.total - a.total),
    };
  }, [dashboardData]);

  const {
    totalAssets,
    totalAvailable,
    totalInUse,
    utilizationRate,
    locationData,
    categoryData,
    typeBreakdown,
  } = processedData;

  // Prepare data for pie chart
  const pieData = [
    { name: "Available", value: totalAvailable, color: "#10B981" },
    { name: "In Use", value: totalInUse, color: "#3B82F6" },
  ];

  // Color palette for charts
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Status Distribution Pie Chart Component
  const StatusDistribution = () => {
    return (
      <div className="p-4 bg-white rounded-lg">
        <h4 className="mb-4 text-lg font-medium text-center text-gray-700">
          Overall Status Distribution
        </h4>
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">
                {totalAssets}
              </div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4 space-x-4">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-600 text-xl mb-4">
            Failed to load inventory data
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
          className="w-8 h-8 mb-4 cursor-pointer text-brown hover:text-brown-600"
        />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage your asset inventory
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Assets
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalAssets}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Archive className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-semibold text-green-600">
                  {totalAvailable}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Use</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {totalInUse}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Utilization Rate
                </p>
                <p className="text-2xl font-semibold text-orange-600">
                  {utilizationRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Location Distribution - Bar Chart */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Location Distribution
            </h3>
            {locationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="available"
                      stackId="stock"
                      fill="#10B981"
                      name="Available"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="inUse"
                      stackId="stock"
                      fill="#3B82F6"
                      name="In Use"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">In Use</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No location data available
              </div>
            )}
          </div>

          {/* Status Distribution - Pie Chart */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <StatusDistribution />
          </div>
        </div>

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className="p-6 mt-8 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="available"
                  stackId="category"
                  fill="#10B981"
                  name="Available"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="inUse"
                  stackId="category"
                  fill="#3B82F6"
                  name="In Use"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type Breakdown - Grid Cards */}
        {typeBreakdown.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Asset Types Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {typeBreakdown.map((type, index) => (
                <div
                  key={index}
                  className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: `${COLORS[index % COLORS.length]}20`,
                        }}
                      >
                        <Activity
                          className="w-6 h-6"
                          style={{ color: COLORS[index % COLORS.length] }}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {type.name}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        {type.total}
                      </p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Available</p>
                      <p className="text-xl font-semibold text-green-600">
                        {type.available}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">In Use</p>
                      <p className="text-xl font-semibold text-blue-600">
                        {type.inUse}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Details Table */}
        {locationData.length > 0 && (
          <div className="p-6 mt-8 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Location-wise Inventory
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Use
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locationData.map((location, index) => {
                    const util =
                      location.total > 0
                        ? Math.round((location.inUse / location.total) * 100)
                        : 0;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {location.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {location.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {location.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {location.inUse}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              util > 75
                                ? "bg-red-100 text-red-800"
                                : util > 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {util}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySummary;
