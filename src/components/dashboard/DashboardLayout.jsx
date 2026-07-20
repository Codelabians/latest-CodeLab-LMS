import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import SidebarComponent from "./SidebarComponent";
import useFcmRegistration from "../../firebase/useFcmRegistration";
import { useGetQuery } from "../../api/apiSlice";
import { SIGNIN, PORTAL, TEACHER } from "../routes/RouteConstants";

// Roles that always get the admin console, even with no explicit permissions.
const LEADERSHIP_ROLES = ["admin", "super_admin", "ceo", "coo"];

/*
 * Admin-console shell. Every /dashboard/* route is a child of this layout,
 * so the role gate here covers the whole admin surface in one place —
 * mirroring PortalLayout (students only) and TeacherLayout (staff only).
 * All three logins mint tokens from the same pool, so a student or teacher
 * token is valid auth but must NOT open the admin console:
 *   - student-only accounts  -> their portal (/portal)
 *   - staff with no admin permissions (e.g. plain teachers) -> /staff-portal
 * Backend endpoints are already permission-gated (403); this stops the
 * pages themselves from being reachable.
 */
const DashboardLayout = () => {
  // Register this browser for Firebase push once authenticated. No-op
  // until Firebase is configured (VITE_FIREBASE_* env vars).
  useFcmRegistration();

  const { token, user } = useSelector((s) => s.auth);
  // Refresh-safe: auth state only persists the token, not the user object —
  // fetch the profile (role + permissions) when it isn't in memory.
  const { data: me } = useGetQuery(
    { path: "/user/get-user" },
    { skip: !token || !!(user?.role || user?.roles) },
  );

  if (!token) return <Navigate to={SIGNIN} replace />;

  const u = user?.role || user?.roles ? user : me?.data;
  if (!u) {
    // Role unknown yet (profile still loading) — render nothing rather than
    // flashing admin pages at a user who may be about to be redirected.
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #EEE", borderTopColor: "#C90606",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const roleNames = [u.role, ...(u.roles || [])].filter(Boolean);
  const isStudentOnly =
    roleNames.length > 0 && roleNames.every((r) => r === "user");
  if (isStudentOnly) return <Navigate to={PORTAL} replace />;

  const hasAdminAccess =
    roleNames.some((r) => LEADERSHIP_ROLES.includes(r)) ||
    (u.permissions || []).length > 0;
  if (!hasAdminAccess) return <Navigate to={TEACHER} replace />;

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
