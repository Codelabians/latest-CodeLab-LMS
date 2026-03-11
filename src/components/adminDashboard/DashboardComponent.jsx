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
  const [activeBatchTab, setActiveBatchTab] = useState("all"); // NEW: Batch filter state

  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isFetching: isDashboardFetching,
    refetch,
  } = useGetQuery({
    path: "/admin/dashboard",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });
  const { data: financeStats } = useGetQuery({
    path: "/admin/finance/get/summary",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });
  const financeData = financeStats?.data;
  const {
    data: adminProfileData,
    error: adminProfileError,
    isLoading: adminProfileLoading,
    refetch: refetchAdminProfiles,
  } = useGetQuery({
    path: "/admin",
  });

  useEffect(() => {
    if (adminProfileData?.data?.avatar?.file_url) {
      // Store image in local storage
      localStorage.setItem(
        "adminProfileImage",
        adminProfileData?.data?.avatar?.file_url,
      );
    }
  }, [adminProfileData]);

  const dashboardData = data?.data;
  if (isLoading || isDashboardFetching) {
    return <Loader />;
  }
  return (
    <div className="flex flex-col bg-midnight">
      <div className="px-12 pb-12">
        <div className="mb-10 text-2xl font-semiboldd text-heading font-poppins">
          Admin Dashboard
        </div>
        <BatchTabs
          activeBatchTab={activeBatchTab}
          setActiveBatchTab={setActiveBatchTab}
        />
        <TotalStats dashboardData={dashboardData} financeData={financeData} />

        <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 my-6">
          <div>
            <StudentFeeStats dashboardData={dashboardData} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[40%_60%] gap-4 my-4"></div>
        <div
          onClick={() => navigate("/dashboard/startup-summary")}
          className="grid grid-cols-2 gap-4"
        ></div>
      </div>
    </div>
  );
};

export default DashboardComponent;
