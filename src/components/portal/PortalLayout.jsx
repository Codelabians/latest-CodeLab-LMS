import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarCheck, Wallet, CalendarDays, RefreshCw, FileText, BookOpen,
  Megaphone, Gift, UserCircle, LogOut, Menu, X, Boxes, ShieldCheck, Sparkles, Brain,
  MessageSquareWarning,
} from "lucide-react";
import { clearCredentials } from "../../features/auth/authSlice";
import { useGetQuery } from "../../api/apiSlice";
import ForcePasswordReset from "./ForcePasswordReset";
import BrandMark from "../common/BrandMark";
import FirstLoginTour from "../common/FirstLoginTour";
import {
  PORTAL, PORTAL_ATTENDANCE, PORTAL_FEES, PORTAL_ASSETS, PORTAL_LEAVES, PORTAL_MAKEUPS, PORTAL_ASSIGNMENTS, PORTAL_CONTENT, PORTAL_ANNOUNCEMENTS, PORTAL_REWARDS, PORTAL_PROFILE, PORTAL_RULES, PORTAL_CAREER, PORTAL_QUIZ, PORTAL_LOGIN, PORTAL_COMPLAINTS,
} from "../routes/RouteConstants";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const BRAND_RED_RING = "rgba(201, 6, 6, 0.22)";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";
const ICON_BG_IDLE = "#F1F5F9";
const ICON_TX_IDLE = "#475569";

const NAV = [
  { route: PORTAL, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { route: PORTAL_CONTENT, label: "Course Content", icon: BookOpen },
  { route: PORTAL_ATTENDANCE, label: "Attendance", icon: CalendarCheck },
  { route: PORTAL_ASSIGNMENTS, label: "Assignments", icon: FileText },
  { route: PORTAL_FEES, label: "Fees", icon: Wallet },
  { route: PORTAL_ASSETS, label: "My Items", icon: Boxes },
  { route: PORTAL_LEAVES, label: "Leaves", icon: CalendarDays },
  { route: PORTAL_COMPLAINTS, label: "Complaints", icon: MessageSquareWarning },
  { route: PORTAL_MAKEUPS, label: "Makeups", icon: RefreshCw },
  { route: PORTAL_REWARDS, label: "Rewards", icon: Gift },
  { route: PORTAL_CAREER, label: "My Career Path", icon: Sparkles },
  { route: PORTAL_QUIZ, label: "Quizzes", icon: Brain },
  { route: PORTAL_ANNOUNCEMENTS, label: "Announcements", icon: Megaphone },
  { route: PORTAL_RULES, label: "Rules & Regulations", icon: ShieldCheck },
  { route: PORTAL_PROFILE, label: "My Profile", icon: UserCircle },
];

function NavItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      data-tour={item.route}
      onClick={() => onClick(item.route)}
      title={collapsed ? item.label : undefined}
      className="relative flex items-center w-full gap-2.5 px-2 py-1.5 transition-all duration-150 rounded-lg"
      style={{
        background: active ? BRAND_RED_TINT : "transparent",
        fontFamily: "'Montserrat', sans-serif",
        boxShadow: active ? `inset 0 0 0 1px ${BRAND_RED_RING}` : "none",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = SURFACE_HOVER; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0 transition-all duration-150 rounded-md"
        style={{ width: 28, height: 28, background: active ? "#FEE2E2" : ICON_BG_IDLE, color: active ? BRAND_RED : ICON_TX_IDLE }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </span>
      {!collapsed && (
        <span className="flex-1 text-left text-[13px] truncate" style={{ color: active ? BRAND_RED : TEXT_PRIMARY, fontWeight: active ? 600 : 500, letterSpacing: "-0.005em" }}>
          {item.label}
        </span>
      )}
    </button>
  );
}

function LogoutConfirm({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.4)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-sm p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <LogOut size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center text-black">Sign out</h3>
        <p className="mt-1 text-sm text-center text-gray-500">You&apos;ll need to sign in again to access the portal.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} className="py-2.5 text-sm font-semibold text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button type="button" onClick={onConfirm} className="py-2.5 text-sm font-semibold text-white transition rounded-lg" style={{ background: BRAND_RED }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export default function PortalLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Refresh-safe profile fetch (auth state only persists the token, not the
  // user) so the force-reset gate still fires after a page reload.
  const { data: me } = useGetQuery({ path: "/user/get-user" }, { skip: !token });

  if (!token) return <Navigate to={PORTAL_LOGIN} replace />;

  // Force-reset gate: account created with a temporary password must set
  // their own before they can use the portal.
  const mustReset = user?.must_reset_password ?? me?.data?.must_reset_password;
  if (mustReset) {
    return <ForcePasswordReset changePath="/user/password" loginRoute={PORTAL_LOGIN} subtitle="Set a new password to access your student portal" />;
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || user?.email || "Student";
  const initials = (user?.first_name || user?.name || user?.email || "ST")
    .toString().split(/[\s.@]+/).map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);

  const isActive = (item) =>
    item.exact ? location.pathname === item.route : location.pathname === item.route || location.pathname.startsWith(item.route + "/");
  const activeLabel = NAV.find((n) => isActive(n))?.label || "Dashboard";

  const logout = () => {
    dispatch(clearCredentials());
    localStorage.removeItem("token");
    setLogoutOpen(false);
    navigate(PORTAL_LOGIN, { replace: true });
  };

  const tourSteps = [
    { title: "Welcome to your portal", body: "This is your student space. Let's take a 30-second tour of the menu on the left." },
    { selector: `[data-tour="${PORTAL_CONTENT}"]`, placement: "right", title: "Course Content", body: "Click here to open your lectures and learning material for each week." },
    { selector: `[data-tour="${PORTAL_ASSIGNMENTS}"]`, placement: "right", title: "Assignments", body: "Submit your assignments here and see the marks and feedback your teacher gives." },
    { selector: `[data-tour="${PORTAL_ATTENDANCE}"]`, placement: "right", title: "Attendance", body: "Track your attendance record class by class." },
    { selector: `[data-tour="${PORTAL_FEES}"]`, placement: "right", title: "Fees", body: "Review and pay your fees right from here." },
    { selector: `[data-tour="${PORTAL_CAREER}"]`, placement: "right", title: "My Career Path", body: "A personalised AI roadmap built from your grades — your next track, skills to grow, and courses to take next at CodeLab." },
    { selector: `[data-tour="${PORTAL_RULES}"]`, placement: "right", title: "Rules & Regulations", body: "Please read these — they cover attendance, conduct, ID cards, and campus rules." },
    { title: "You're all set", body: "Explore the menu anytime. Welcome aboard!" },
  ];

  return (
    <div className="flex w-full" style={{ background: "#FAFBFC", minHeight: "100vh", fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        .cw-sidebar-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .cw-sidebar-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .cw-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .cw-sidebar-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; }
        .cw-sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
      `}</style>

      {/* Sidebar */}
      <aside
        className="sticky top-0 flex flex-col h-screen overflow-hidden transition-all duration-300 shrink-0"
        style={{ width: collapsed ? 68 : 252, minWidth: collapsed ? 68 : 252, background: "#FFFFFF", borderRight: "1px solid #EEF2F6" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 px-3" style={{ height: 64, borderBottom: "1px solid #F1F5F9" }}>
          {!collapsed ? (
            <BrandMark subtitle="Student Portal" />
          ) : <BrandMark collapsed size={34} />}
          {!collapsed && (
            <button type="button" onClick={() => setCollapsed(true)} className="flex items-center justify-center transition-all rounded-md" style={{ width: 28, height: 28, color: TEXT_MUTED }}>
              <X size={14} strokeWidth={2.25} />
            </button>
          )}
        </div>
        {collapsed && (
          <div className="flex justify-center flex-shrink-0 mt-2">
            <button type="button" onClick={() => setCollapsed(false)} className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, color: TEXT_MUTED }}>
              <Menu size={16} strokeWidth={2.25} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto cw-sidebar-scroll">
          {!collapsed && (
            <div className="px-2 mb-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: TEXT_MUTED, textTransform: "uppercase" }}>My Portal</div>
          )}
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <NavItem key={item.route} item={item} active={isActive(item)} collapsed={collapsed} onClick={(r) => navigate(r)} />
            ))}
          </div>
        </nav>

        {/* Footer user card */}
        <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid #F1F5F9" }}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
              <button type="button" onClick={() => setLogoutOpen(true)} title="Sign out" className="flex items-center justify-center rounded-md" style={{ width: 34, height: 34, color: TEXT_SECONDARY }}><LogOut size={15} strokeWidth={2} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #EEF2F6", padding: 8 }}>
              <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY }}>{fullName}</div>
                <div className="truncate" style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 1 }}>Student</div>
              </div>
              <button type="button" onClick={() => setLogoutOpen(true)} title="Sign out" className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, color: TEXT_SECONDARY }}><LogOut size={13} strokeWidth={2} /></button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-grow min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between px-6 bg-white" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{activeLabel}</h2>
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold hidden sm:block" style={{ color: TEXT_SECONDARY }}>{fullName}</span>
            <div className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
          </div>
        </div>
        <main className="px-6 py-6">
          <Outlet />
        </main>
      </div>

      <LogoutConfirm open={logoutOpen} onCancel={() => setLogoutOpen(false)} onConfirm={logout} />
      <FirstLoginTour storageKey={`tour_seen_student_${me?.data?.id || user?.id || "me"}`} steps={tourSteps} brandName="CodeLab" />
    </div>
  );
}
