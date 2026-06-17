import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SidebarComponent from "./SidebarComponent";
import useFcmRegistration from "../../firebase/useFcmRegistration";

const DashboardLayout = () => {
  // Register this browser for Firebase push once authenticated. No-op
  // until Firebase is configured (VITE_FIREBASE_* env vars).
  useFcmRegistration();

  return (
    <div className="flex w-full bg-midnight">
      <SidebarComponent />
      {/*
        `min-w-0` is the critical bit: by default a flex child can't shrink
        below its content's natural width. Without it, any page with wide
        content (e.g. the Company Settings tab strip, Email Templates split
        pane, wide tables) expands this container past the viewport and
        squeezes the sidebar narrower — causing sub-item labels to truncate
        even when there's nominally enough space. `min-w-0` lets the
        container shrink, and `overflow-x-scroll` (kept) handles the
        horizontal overflow inside the page, not at the layout level.
      */}
      <div className="flex-grow overflow-x-scroll min-w-0">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
