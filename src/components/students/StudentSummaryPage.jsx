import {
  Shield,
  User,
  UserCheck,
  Users,
  Users2,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { useGetQuery } from "../../api/apiSlice";
import { useNavigate } from "react-router-dom";
import BatchTabs from "../ui/BatchTabs";
import Loader from "../ui/common/LoaderComponent";

const StudentSummaryPage = () => {
  const [activeBatchTab, setActiveBatchTab] = useState("all"); // NEW: Batch filter state

  const {
    data,
    error,
    isLoading,
    isFetching: isStudentsFetching,
  } = useGetQuery({
    path: "/admin/dashboard",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });
  const navigate = useNavigate();

  const dashboardData = data?.data;

  // Extract student data from API or use defaults
  const students = dashboardData?.students || {
    current_enrolled_students: 0,
    total_enrolled_students: 0,
    inactive_students: 0,
    total_students: 0,
    total_military_students: 0,
    total_civilian_students: 0,
    military_active_students: 0,
    civilian_active_students: 0,
    military_inactive_students: 0,
    civilian_inactive_students: 0,
    total_female_students: 0,
    total_male_students: 0,
    total_dropout_students: 0,
  };

  // Extract course enrollment data from API
  // const courseEnrollment = (
  //   dashboardData?.classes?.students_by_class || []
  // )?.map((course) => ({
  //   course: course.class_name,
  //   students: course.students,
  //   military: course.military_students,
  //   civilian: course.civilian_students,
  //   courseId: course.course_id,
  // }));
  const courseEnrollment = (
    dashboardData?.classes?.students_by_class || []
  )?.map((course) => ({
    course: course.class_name,
    students: course.students,
    military: course.military_students,
    civilian: course.civilian_students,
    courseId: course.course_id,
  }));
  const chartHeight = Math.max(350, courseEnrollment.length * 50);

  // Map API data to component variables
  const studentsData = {
    currentEnrolled: students.current_enrolled_students,
    totalStudents: students.total_students,
    military: students.total_military_students,
    civil: students.total_civilian_students,
    male: students.total_male_students,
    female: students.total_female_students,
  };

  const pieData = [
    {
      name: "Military Students",
      value: studentsData.military,
      color: "#31918D",
    },
    { name: "Civil Students", value: studentsData.civil, color: "#014376" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const current = payload[0];
      const value = current.value;
      const name = current.name || label;

      // Identify the correct data array (pieData or courseEnrollment)
      const isPieChart =
        current?.payload?.name === "Civil Students" ||
        current?.payload?.name === "Military Students";
      const allData = isPieChart ? pieData : courseEnrollment;

      // Calculate total
      const totalValue = allData.reduce(
        (acc, cur) => acc + (cur.value || cur.students || 0),
        0,
      );

      // Get percentage for hover item
      const percentage =
        totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-800 font-semibold">{`${name}: ${value}`}</p>
          <p className="text-gray-600 text-sm">{`Total: ${totalValue}`}</p>
          <p className="text-gray-500 text-xs">{`(${percentage}% of total)`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate safe percentages based on total_students
  const getMilitaryPercentage = () => {
    return studentsData.totalStudents > 0
      ? Math.round((studentsData.military / studentsData.totalStudents) * 100)
      : 0;
  };

  const getCivilPercentage = () => {
    return studentsData.totalStudents > 0
      ? Math.round((studentsData.civil / studentsData.totalStudents) * 100)
      : 0;
  };

  const getMalePercentage = () => {
    return studentsData.totalStudents > 0
      ? Math.round((studentsData.male / studentsData.totalStudents) * 100)
      : 0;
  };

  const getFemalePercentage = () => {
    return studentsData.totalStudents > 0
      ? Math.round((studentsData.female / studentsData.totalStudents) * 100)
      : 0;
  };

  // Add console logs to debug

  if (isLoading || isStudentsFetching) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="w-11/12 mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <ArrowLeft
            onClick={() => navigate(-1)}
            className="w-8 h-8 mb-2 text-brown"
          />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-brown mb-2">
                Student Summary
              </h2>
            </div>

            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <Activity className="w-5 h-5" style={{ color: "#31918D" }} />
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
          </div>
          <div className="mt-3">
            <BatchTabs
              activeBatchTab={activeBatchTab}
              setActiveBatchTab={setActiveBatchTab}
            />
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Currently Enrolled Students Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 md:col-span-2 lg:col-span-1 hover:shadow-xl transition-shadow duration-300"
            style={{ borderTopColor: "#014376" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="p-4 rounded-xl shadow-md"
                  style={{ backgroundColor: "#014376" }}
                >
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Currently Enrolled
              </h3>
              <span className="text-4xl font-bold" style={{ color: "#014376" }}>
                {studentsData.currentEnrolled.toLocaleString()}
              </span>
              <p className="text-sm text-gray-500 mt-2">Active Students</p>
            </div>
          </div>

          {/* Military Students Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 hover:shadow-xl transition-shadow duration-300"
            style={{ borderTopColor: "#31918D" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="p-4 rounded-xl shadow-md"
                  style={{ backgroundColor: "#31918D" }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Military Students
              </h3>
              <span className="text-3xl font-bold" style={{ color: "#31918D" }}>
                {studentsData.military}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {getMilitaryPercentage()}% of total
              </p>
            </div>
          </div>

          {/* Civil Students Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 hover:shadow-xl transition-shadow duration-300"
            style={{ borderTopColor: "#014376" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="p-4 rounded-xl shadow-md"
                  style={{ backgroundColor: "#014376" }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Civil Students
              </h3>
              <span className="text-3xl font-bold" style={{ color: "#014376" }}>
                {studentsData.civil}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {getCivilPercentage()}% of total
              </p>
            </div>
          </div>

          {/* Male Students Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 hover:shadow-xl transition-shadow duration-300"
            style={{ borderTopColor: "#31918D" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="p-4 rounded-xl shadow-md"
                  style={{ backgroundColor: "#31918D" }}
                >
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Male Students
              </h3>
              <span className="text-3xl font-bold" style={{ color: "#31918D" }}>
                {studentsData.male}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {getMalePercentage()}% of total
              </p>
            </div>
          </div>

          {/* Female Students Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border-t-4 hover:shadow-xl transition-shadow duration-300"
            style={{ borderTopColor: "#014376" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="p-4 rounded-xl shadow-md"
                  style={{ backgroundColor: "#014376" }}
                >
                  <Users2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Female Students
              </h3>
              <span className="text-3xl font-bold" style={{ color: "#014376" }}>
                {studentsData.female}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {getFemalePercentage()}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Student Categories
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: "#31918D" }}
                ></div>
                <span className="text-sm text-gray-600">
                  Military ({getMilitaryPercentage()}%)
                </span>
              </div>
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: "#014376" }}
                ></div>
                <span className="text-sm text-gray-600">
                  Civil ({getCivilPercentage()}%)
                </span>
              </div>
            </div>
          </div>

          {/* Course Enrollment */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Course Vs Students Enrolled
            </h3>
            {courseEnrollment.length > 0 ? (
              <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                <ResponsiveContainer
                  width="100%"
                  height={courseEnrollment.length * 50}
                >
                  <BarChart
                    data={courseEnrollment}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis
                      dataKey="course"
                      type="category"
                      stroke="#666"
                      width={200}
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="students"
                      fill="#31918D"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="students"
                        position="insideRight"
                        style={{
                          fill: "white",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No course enrollment data available
              </div>
            )}
          </div>

          {/* <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-3">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Courses Vs Students Enrolled
            </h3>
            {currentlyEnrolledCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={currentlyEnrolledCourses}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis
                    dataKey="course"
                    type="category"
                    stroke="#666"
                    width={200}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="students" fill="#014376" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="students"
                      position="insideRight"
                      style={{
                        fill: "white",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                      formatter={(value) => value}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No currently enrolled course data available
              </div>
            )}
          </div> */}
        </div>

        {/* Detailed Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Military Students Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-2" style={{ color: "#31918D" }} />
              Military Students Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Total Military Students
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#31918D" }}
                >
                  {students.total_military_students}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Active Military Students
                </span>
                <span className="text-xl font-bold text-green-600">
                  {students.military_active_students}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Inactive Military Students
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {students.military_inactive_students}
                </span>
              </div>
            </div>
          </div>

          {/* Civilian Students Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <User className="w-6 h-6 mr-2" style={{ color: "#014376" }} />
              Civilian Students Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Total Civilian Students
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#014376" }}
                >
                  {students.total_civilian_students}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Active Civilian Students
                </span>
                <span className="text-xl font-bold text-green-600">
                  {students.civilian_active_students}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Inactive Civilian Students
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {students.civilian_inactive_students}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-2" style={{ color: "#31918D" }} />
            Overall Student Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Total Students</p>
              <p className="text-3xl font-bold" style={{ color: "#014376" }}>
                {students.total_students}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Currently Enrolled</p>
              <p className="text-3xl font-bold text-green-600">
                {students.current_enrolled_students}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Inactive Students</p>
              <p className="text-3xl font-bold text-orange-600">
                {students.inactive_students}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-gray-600 text-sm mb-2">Dropout Students</p>
              <p className="text-3xl font-bold text-red-600">
                {students.total_dropout_students}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSummaryPage;
