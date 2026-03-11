import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  Users,
  Clock,
  UserCheck,
  Armchair,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import { useNavigate } from "react-router-dom";
import BatchTabs from "../ui/BatchTabs";
import Loader from "../ui/common/LoaderComponent";
const CourseSummary = () => {
  const navigate = useNavigate();
  const [activeBatchTab, setActiveBatchTab] = useState("all");

  // Fetch course dashboard data with optional batch_id filter
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: isCourseFetching,
    refetch,
  } = useGetQuery({
    path:
      activeBatchTab === "all"
        ? "/admin/course-dashboard"
        : `/admin/course-dashboard?batch_id=${activeBatchTab}`,
  });

  // Refetch dashboard data when batch selection changes
  useEffect(() => {
    refetch();
  }, [activeBatchTab, refetch]);

  // Extract data from API
  const summary = dashboardData?.data?.summary || {
    total_courses: 0,
    running_courses: 0,
    scheduled_courses: 0,
    total_seats: 0,
    seats_occupied: 0,
    available_seats: 0,
    course_categories: 0,
    percentage_occupied: 0,
    percentage_available: 0,
  };

  const quotaSummary = dashboardData?.data?.quota_summary || {
    civilian: { occupied: 0, available: 0 },
    military: { occupied: 0, available: 0 },
    total_quota: { civilian_percent: 0, military_percent: 0 },
  };

  // const statusDistribution = dashboardData?.data?.status_distribution || {};
  const coursesByCategory = dashboardData?.data?.courses_by_category || [];
  const batchSummary = dashboardData?.data?.batch_summary || [];

  // Get selected batch details from batch_summary
  const selectedBatchData = batchSummary;

  // Prepare chart data for course status distribution
  const courseStatusData = [
    { name: "Running", value: summary.running_courses, color: "#014376" },
    { name: "Scheduled", value: summary.scheduled_courses, color: "#31918D" },
  ].filter((item) => item.value > 0); // Only show non-zero values

  // Prepare chart data for courses by category
  const categoryData = coursesByCategory.map((cat, index) => ({
    name: cat.category_name,
    count: cat.course_count,
    color: index % 2 === 0 ? "#014376" : "#31918D",
  }));

  const StatCard = ({
    title,
    value,
    subtitle,
    IconComponent,
    color = "#014376",
  }) => (
    <div
      className="bg-white rounded-lg shadow-md p-6 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold" style={{ color: color }}>
            {value}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full bg-gradient-to-br from-blue-50 to-teal-50">
          <IconComponent size={32} style={{ color: color }} />
        </div>
      </div>
    </div>
  );

  if (dashboardLoading || isCourseFetching) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-11/12 mx-auto">
        <ArrowLeft
          onClick={() => navigate(-1)}
          className="w-8 h-8 text-brown"
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Course Summary
          </h1>
        </div>
        <div className="mt-3">
          <BatchTabs
            activeBatchTab={activeBatchTab}
            setActiveBatchTab={setActiveBatchTab}
          />
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Courses"
            value={summary.total_courses}
            IconComponent={BookOpen}
            color="#014376"
          />
          <StatCard
            title="Running Courses"
            value={summary.running_courses}
            subtitle="Currently active"
            IconComponent={Users}
            color="#31918D"
          />
          <StatCard
            title="Scheduled Courses"
            value={summary.scheduled_courses}
            subtitle="Upcoming"
            IconComponent={Clock}
            color="#014376"
          />
          <StatCard
            title="Seats Occupied"
            value={summary.seats_occupied.toLocaleString()}
            subtitle={`${summary.percentage_occupied.toFixed(1)}% occupied`}
            IconComponent={UserCheck}
            color="#31918D"
          />
          <StatCard
            title="Available Seats"
            value={summary.available_seats.toLocaleString()}
            subtitle="Ready for enrollment"
            IconComponent={Armchair}
            color="#014376"
          />
          <StatCard
            title="Course Categories"
            value={summary.course_categories}
            subtitle="Different fields"
            IconComponent={FolderOpen}
            color="#31918D"
          />
        </div>

        {/* Quota Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Civilian Quota
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Occupied</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#014376" }}
                >
                  {quotaSummary.civilian.occupied}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#31918D" }}
                >
                  {quotaSummary.civilian.available}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Occupation Rate</span>
                  <span
                    className="text-lg font-semibold"
                    style={{ color: "#014376" }}
                  >
                    {quotaSummary.total_quota.civilian_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${quotaSummary.total_quota.civilian_percent}%`,
                      backgroundColor: "#014376",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Military Quota
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Occupied</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#014376" }}
                >
                  {quotaSummary.military.occupied}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#31918D" }}
                >
                  {quotaSummary.military.available}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Occupation Rate</span>
                  <span
                    className="text-lg font-semibold"
                    style={{ color: "#014376" }}
                  >
                    {quotaSummary.total_quota.military_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${quotaSummary.total_quota.military_percent}%`,
                      backgroundColor: "#31918D",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Selection and Specific Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
              Batch Details
            </h2>
          </div>

          {selectedBatchData && selectedBatchData?.length > 0 ? (
            selectedBatchData?.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
              >
                <StatCard
                  title="Total Seats"
                  value={item.total_seats}
                  subtitle={item.batch_name}
                  IconComponent={Armchair}
                  color="#014376"
                />
                <StatCard
                  title="Total Classes"
                  value={item.total_classes}
                  subtitle="In this batch"
                  IconComponent={BookOpen}
                  color="#31918D"
                />
                <StatCard
                  title="Batch ID"
                  value={item.batch_id}
                  subtitle="Unique identifier"
                  IconComponent={FolderOpen}
                  color="#014376"
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a specific batch to view detailed information</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Course Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Course Status Distribution
            </h3>
            {courseStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884D8"
                    dataKey="value"
                  >
                    {courseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No course status data available
              </div>
            )}
          </div>

          {/* Course Categories */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Courses by Category
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#014376" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSummary;
