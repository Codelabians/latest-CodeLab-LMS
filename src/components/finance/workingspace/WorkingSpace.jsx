/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import financeIcon from "../../../assets/icons/Group.png";
import expensesIcon from "../../../assets/icons/Group (1).png";
import profitIcon from "../../../assets/icons/Vector.png";
import downloadIcon from "../../../assets/icons/Vector (3).png";
import StatsCards from "./components/StatsCards";

const WorkingSpace = () => {
  const [activeView, setActiveView] = useState("both"); // 'both', 'individual', 'company'
  const [selectedOverview, setSelectedOverview] = useState("Daily");
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const overviewOptions = ["Daily", "Monthly", "Yearly"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = [
          { label: "Income", value: 567, icon: financeIcon },
          { label: "Expenses", value: 567, icon: expensesIcon },
          { label: "Profit", value: 567, icon: profitIcon },
        ];

        const chartData = [
          { day: "Sun", date: "17 Sun", individual: 250000, company: 50000 },
          { day: "Mon", date: "18 Mon", individual: 25000, company: 20000 },
          { day: "Tue", date: "19 Tue", individual: 8000, company: 50000 },
          { day: "Wed", date: "20 Wed", individual: 50000, company: 50000 },
          { day: "Thu", date: "21 Thu", individual: 50000, company: 25000 },
          { day: "Fri", date: "22 Fri", individual: 70000, company: 5000 },
          { day: "Sat", date: "23 Sat", individual: 45000, company: 35000 },
        ];

        setDashboardData({ stats: statsData, chartData });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatYAxisTick = (value) => {
    if (value >= 1000) {
      return `${value / 1000}k`;
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="animate-pulse">
          <div className="w-32 h-8 mb-6 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow-sm">
                <div className="w-20 h-6 mb-2 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const data = dashboardData.chartData;

    if (activeView === "both") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="individual"
              fill="#aa0e0e"
              name="Individual"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="company"
              fill="#d61111"
              name="Company"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (activeView === "individual") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "#d61111" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="individual"
              fill="#aa0e0e"
              name="Individual"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="company"
              fill="#d61111"
              name="Company"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  const getChartTitle = () => {
    if (activeView === "individual") return "Individual";
    if (activeView === "company") return "Company";
    return "";
  };

  return (
    <div className="min-h-screen w-[90%] mx-auto bg-gray-50">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Workspace</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        {dashboardData.stats?.map((stat, index) => (
          <StatsCards
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      {/* Chart Section */}
      <div className="relative p-6 bg-white rounded-lg shadow-sm">
        {/* Overview Dropdown */}
        <div className="flex items-center justify-end mb-4">
          <div className="relative">
            <select
              value={selectedOverview}
              onChange={(e) => setSelectedOverview(e.target.value)}
              className="px-4 py-2 pr-8 text-sm text-white transition-colors outline-none appearance-none cursor-pointer bg-brown rounded-3xl"
            >
              {overviewOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="text-black bg-white"
                >
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Legend for both view */}
        {activeView === "both" && (
          <div className="flex items-center justify-center mb-4 space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-brown"></div>
              <span className="text-sm font-medium text-gray-700">
                Individual
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-beige"></div>
              <span className="text-sm font-medium text-gray-700">Company</span>
            </div>
          </div>
        )}

        {/* Chart Title */}
        {getChartTitle() && (
          <h3 className="mb-4 text-lg font-semibold text-center text-gray-800">
            {getChartTitle()}
          </h3>
        )}

        {/* Chart */}
        {renderChart()}

        {/* Report Button */}

        {/* Quick Toggle Buttons (floating) */}
        <div className="absolute flex space-x-2 top-4 left-4">
          <button
            onClick={() => setActiveView("individual")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              activeView === "individual"
                ? "bg-brown text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setActiveView("company")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              activeView === "company"
                ? "bg-beige text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Company
          </button>
          <button
            onClick={() => setActiveView("both")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              activeView === "both"
                ? "custom-ActionBtn text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Both
          </button>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button className="flex items-center px-4 py-2 space-x-2 font-medium text-white transition-colors rounded-lg custom-ActionBtn hover:bg-teal-700">
          <img src={downloadIcon} alt="" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

export default WorkingSpace;
