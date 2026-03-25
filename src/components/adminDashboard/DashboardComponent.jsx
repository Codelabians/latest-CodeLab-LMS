/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Instructors from "./components/Instructors";
import AttendanceChart from "./components/AttendenceChart";
import { useGetQuery } from "../../api/apiSlice";
import hostelImage from "../../assets/images/adminDashboard/hostel.png";
import HomeImage from "../../assets/images/adminDashboard/Home.png";
import Student from "../../assets/images/adminDashboard/student.png";
import StudentsStats from "../dashboard/StudentsStats";
import StudentFeeStats from "../dashboard/StudentFeeStats";
import FeeChart from "../dashboard/FeeStats";
import BatchStats from "../dashboard/BatchStats";
import StartsupsStats from "../dashboard/StartsupsStats";
import CoursesStats from "../dashboard/CoursesStats";
import RentStats from "../dashboard/RentStats";
import StudentPercentageStats from "../dashboard/StudentPercentageStats";
import EnrollmentChart from "./EnrollmentChart";
import TotalStats from "./components/TotalStats";
import Inventory from "../../inventory/Inventory";
import InventoryStats from "../dashboard/InventoryStats";
import EmployeeDetails from "../employees/employeeDetailsPages/EmployeeDetails";
import EmployeeStats from "./components/EmployeeStats";
import CompletionStats from "../dashboard/CompletionStats";
import { useNavigate } from "react-router-dom";
import BatchTabs from "../ui/BatchTabs";
import Loader from "../ui/common/LoaderComponent";

const DashboardComponent = () => {
  const [activeBatchTab, setActiveBatchTab] = useState("all");

  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isFetching: isDashboardFetching,
  } = useGetQuery({
    path: "/admin/dashboard",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });

  const { data: financeStats } = useGetQuery({
    path: "/admin/finance/get/summary",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });

  const financeData = financeStats?.data;

  const { data: adminProfileData } = useGetQuery({
    path: "/admin",
  });

  useEffect(() => {
    if (adminProfileData?.data?.avatar?.file_url) {
      localStorage.setItem(
        "adminProfileImage",
        adminProfileData?.data?.avatar?.file_url
      );
    }
  }, [adminProfileData]);

  const dashboardData = data?.data;

  if (isLoading || isDashboardFetching) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col bg-midnight min-h-screen">
      
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10 md:pb-12">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10 text-xl sm:text-2xl md:text-3xl font-semibold text-heading font-poppins">
          Admin Dashboard
        </div>

        {/* Batch Tabs */}
        <div className="mb-4 sm:mb-6">
          <BatchTabs
            activeBatchTab={activeBatchTab}
            setActiveBatchTab={setActiveBatchTab}
          />
        </div>

        {/* Total Stats */}
        <div className="mb-6">
          <TotalStats
            dashboardData={dashboardData}
            financeData={financeData}
          />
        </div>

        {/* Student Fee Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-4 sm:my-6">
          <StudentFeeStats dashboardData={dashboardData} />
        </div>

        {/* Optional future sections (kept structure clean & responsive) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[40%_60%] gap-4 my-4">
          {/* Add components here when needed */}
        </div>

        {/* Clickable Section */}
        <div
          onClick={() => navigate("/dashboard/startup-summary")}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 cursor-pointer my-4"
        >
          {/* Add content/cards here */}
        </div>

      </div>
    </div>
  );
};

export default DashboardComponent;