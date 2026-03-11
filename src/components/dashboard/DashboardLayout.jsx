import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SidebarComponent from "./SidebarComponent";

const DashboardLayout = () => {
  return (
    <div className="flex w-full bg-midnight">
      <SidebarComponent />
      <div className="flex-grow overflow-x-scroll">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
