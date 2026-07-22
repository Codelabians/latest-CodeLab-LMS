import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, RefreshCw, Users, FileText, BookOpen, Award, Megaphone, Gift, Briefcase, ChevronDown, ChevronRight, LogOut, Menu, X, ShieldCheck, Brain, MessageSquareWarning, Share2, CalendarDays, AlarmClock, MessagesSquare,
} from "lucide-react";
import { clearCredentials } from "../../features/auth/authSlice";
import { useGetQuery } from "../../api/apiSlice";
import ForcePasswordReset from "../portal/ForcePasswordReset";
import BrandMark from "../common/BrandMark";
import FirstLoginTour from "../common/FirstLoginTour";
import RefreshButton from "../common/RefreshButton";
import { EMPLOYMENT_SECTIONS } from "./employmentSections";
import useChatChime from "../../hooks/useChatChime";
import { firstAccessibleRoute } from "../dashboard/SidebarComponent";
import {
  TEACHER, TEACHER_ATTENDANCE, TEACHER_MAKEUPS, TEACHER_STUDENTS, TEACHER_ASSIGNMENTS, TEACHER_CONTENT, TEACHER_PERFORMANCE, TEACHER_ANNOUNCEMENTS, TEACHER_REWARDS, TEACHER_EMPLOYMENT, TEACHER_RULES, TEACHER_ASSESSMENT, TEACHER_COMPLAINTS, TEACHER_SHARE_EARN, TEACHER_STUDENT_LEAVES, TEACHER_LOGIN,
  STAFF_REMINDERS, STAFF_CHATS, ADMINDASHBOARD, PORTAL,
} from "../routes/RouteConstants";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const BRAND_RED_RING = "rgba(201, 6, 6, 0.22)";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";
const ICON_BG_IDLE = "#F1F5F9";
const ICON_TX_IDLE = "#475569";

const NAV = [
  { route: TEACHER, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { route: TEACHER_ATTENDANCE, label: "Mark Attendance", icon: ClipboardCheck },
  { route: TEACHER_CONTENT, label: "Course Content", icon: BookOpen },
  { route: TEACHER_ASSIGNMENTS, label: "Assignments", icon: FileText },
  { route: TEACHER_PERFORMANCE, label: "Performance", icon: Award },
  { route: TEACHER_STUDENTS, label: "My Students", icon: Users },
  { route: TEACHER_MAKEUPS, label: "Makeups", icon: RefreshCw },
  { route: TEACHER_STUDENT_LEAVES, label: "Student Leaves", icon: CalendarDays },
  { route: TEACHER_REWARDS, label: "Rewards", icon: Gift },
  { route: STAFF_CHATS, label: "Chats", icon: MessagesSquare },
  { route: STAFF_REMINDERS, label: "Reminders", icon: AlarmClock },
  { route: TEACHER_ANNOUNCEMENTS, label: "Announcements", icon: Megaphone },
  { route: TEACHER_ASSESSMENT, label: "Skills Assessment", icon: Brain },
  { route: TEACHER_SHARE_EARN, label: "Share & Earn", icon: Share2 },
  { route: TEACHER_COMPLAINTS, label: "Complaints", icon: MessageSquareWarning },
  { route: TEACHER_RULES, label: "Rules & Regulations", icon: ShieldCheck },
];

// Nav items every staff member sees (the rest are teaching-only).
const GENERAL_ROUTES = [TEACHER_REWARDS, STAFF_REMINDERS, STAFF_CHATS, TEACHER_ANNOUNCEMENTS, TEACHER_ASSESSMENT, TEACHER_RULES, TEACHER_COMPLAINTS, TEACHER_SHARE_EARN];

function NavItem({ item, active, collapsed, onClick, badge = 0 }) {
  const Icon = item.icon;
  return (
    <button type="button" data-tour={item.route} onClick={() => onClick(item.route)} title={collapsed ? item.label : undefined}
      className="relative flex items-center w-full gap-2.5 px-2 py-1.5 transition-all duration-150 rounded-lg"
      style={{ background: active ? BRAND_RED_TINT : "transparent", fontFamily: "'Montserrat', sans-serif", boxShadow: active ? `inset 0 0 0 1px ${BRAND_RED_RING}` : "none" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = SURFACE_HOVER; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 28, height: 28, background: active ? "#FEE2E2" : ICON_BG_IDLE, color: active ? BRAND_RED : ICON_TX_IDLE }}>
        <Icon size={16} strokeWidth={1.75} />
      </span>
      {!collapsed && <span className="flex-1 text-left text-[13px] truncate" style={{ color: active ? BRAND_RED : TEXT_PRIMARY, fontWeight: active ? 600 : 500 }}>{item.label}</span>}
      {badge > 0 && (
        <span
          className="flex items-center justify-center flex-shrink-0 text-white font-bold rounded-full"
          style={collapsed
            ? { position: "absolute", top: 2, right: 2, minWidth: 14, height: 14, fontSize: 9, background: BRAND_RED, padding: "0 3px" }
            : { minWidth: 18, height: 18, fontSize: 10, background: BRAND_RED, padding: "0 5px" }}
        >
          {badge > 99 ? "99+" : badge}
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
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}><LogOut size={20} /></div>
        <h3 className="text-base font-semibold text-center text-black">Sign out</h3>
        <p className="mt-1 text-sm text-center text-gray-500">You&apos;ll need to sign in again to access the portal.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onCancel} className="py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: BRAND_RED }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);

  // Refresh-safe profile fetch so the force-reset gate survives a reload.
  const { data: me } = useGetQuery({ path: "/teacher/get-teacher" }, { skip: !token });
  // Role fetch for the gate below via the ungated endpoint — get-teacher is
  // staff-only (403 for students), which would leave a student stuck on a
  // blank page instead of being sent back to their portal.
  const { data: meUser } = useGetQuery(
    { path: "/user/get-user" },
    { skip: !token || !!(user?.role || user?.roles) },
  );
  // Unified Staff Portal context: drives teaching vs employee-only nav.
  const { data: ctx } = useGetQuery({ path: "/teacher/me/context" }, { skip: !token });
  // Chime on new chat messages while anywhere in the portal + badge count.
  const chatUnread = useChatChime({ skip: !token });

  if (!token) return <Navigate to={TEACHER_LOGIN} replace />;

  // Role gate (mirror of PortalLayout): all logins share one auth token, so
  // without this a student could open /staff-portal/* URLs. Users whose only
  // role is "user" (student) belong in the student portal.
  const roleSource = user?.role || user?.roles ? user : (meUser?.data || me?.data);
  let hasStudentRole = false;
  if (roleSource) {
    const roleNames = [roleSource.role, ...(roleSource.roles || [])].filter(Boolean);
    if (roleNames.length && roleNames.every((r) => r === "user")) {
      return <Navigate to={PORTAL} replace />;
    }
    // Dual-role (intern who is still a student): same login, both portals.
    hasStudentRole = roleNames.includes("user");
  } else {
    // Role unknown yet (profile still loading after a refresh) — hold the
    // render instead of flashing staff pages at a student.
    return null;
  }

  const mustReset = user?.must_reset_password ?? me?.data?.must_reset_password;
  if (mustReset) {
    return <ForcePasswordReset changePath="/teacher/password" loginRoute={TEACHER_LOGIN} subtitle="Set a new password to access your teacher portal" />;
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || user?.email || "Teacher";
  const initials = (user?.first_name || user?.name || user?.email || "TR").toString().split(/[\s.@]+/).map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);

  const isActive = (item) => item.exact ? location.pathname === item.route : location.pathname === item.route || location.pathname.startsWith(item.route + "/");

  // Role-aware nav. Teaching tools only for teachers / batch-assigned staff;
  // everyone gets employment self-service + announcements/rewards.
  const ctxLoaded = !!ctx;
  const teaches = !!ctx?.data?.teaches;
  const isTeacher = !!ctx?.data?.is_teacher;
  const hasStp = !!ctx?.data?.has_stp_office;
  const portalLabel = isTeacher ? "Teacher Portal" : "Staff Portal";
  const navItems = teaches ? NAV : NAV.filter((n) => GENERAL_ROUTES.includes(n.route));

  // Non-teaching staff have no teaching Dashboard — send them to their
  // employment profile as home.
  if (ctxLoaded && !teaches && location.pathname === TEACHER) {
    return <Navigate to={`${TEACHER_EMPLOYMENT}/profile`} replace />;
  }

  // Employment group (collapsible). STP child only for partner-site staff.
  const empItems = EMPLOYMENT_SECTIONS.filter((s) => !s.stpOnly || hasStp);
  const onEmployment = location.pathname === TEACHER_EMPLOYMENT || location.pathname.startsWith(TEACHER_EMPLOYMENT + "/");
  const empExpanded = empOpen || onEmployment;
  const empRoute = (key) => `${TEACHER_EMPLOYMENT}/${key}`;
  const empActive = (key) => location.pathname === empRoute(key) || (key === "profile" && location.pathname === TEACHER_EMPLOYMENT);
  const activeEmp = empItems.find((s) => empActive(s.key));
  const activeLabel = activeEmp ? activeEmp.label : (NAV.find((n) => isActive(n))?.label || "Dashboard");

  const logout = () => { dispatch(clearCredentials()); localStorage.removeItem("token"); setLogoutOpen(false); navigate(TEACHER_LOGIN, { replace: true }); };

  // Staff who also hold admin/management permissions (HR/TechSchool/Finance/
  // Reception managers) get a switcher into their admin workspace, landing on
  // the first page their role can open. Pure teachers have no admin perms, so
  // they never see it.
  const canAccessAdmin = (user?.permissions?.length || 0) > 0;
  const goToAdmin = () => navigate(firstAccessibleRoute(user) || ADMINDASHBOARD);

  const tourSteps = [
    { title: `Welcome to the ${portalLabel}`, body: "This is your staff space. Let's take a quick tour of the menu on the left." },
    ...(teaches ? [
      { selector: `[data-tour="${TEACHER_ATTENDANCE}"]`, placement: "right", title: "Mark Attendance", body: "Click here to mark your students' attendance for each class." },
      { selector: `[data-tour="${TEACHER_ASSIGNMENTS}"]`, placement: "right", title: "Assignments", body: "Create assignments and enter marks and feedback for your students here." },
      { selector: `[data-tour="${TEACHER_PERFORMANCE}"]`, placement: "right", title: "Performance", body: "Record weekly performance grades for each student here." },
    ] : []),
    { selector: `[data-tour="${TEACHER_RULES}"]`, placement: "right", title: "Rules & Regulations", body: "Please review these — ID cards, conduct, working hours, and workplace policies." },
    { title: "You're all set", body: "Your profile, leaves and documents live under Employment. Welcome to the team!" },
  ];

  return (
    <div className="flex w-full" style={{ background: "#FAFBFC", minHeight: "100vh", fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`.cw-sidebar-scroll{scrollbar-width:thin;scrollbar-color:transparent transparent}.cw-sidebar-scroll:hover{scrollbar-color:rgba(0,0,0,.18) transparent}.cw-sidebar-scroll::-webkit-scrollbar{width:6px}.cw-sidebar-scroll::-webkit-scrollbar-thumb{background:transparent;border-radius:999px}.cw-sidebar-scroll:hover::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15)}`}</style>

      <aside className="sticky top-0 flex flex-col h-screen overflow-hidden transition-all duration-300 shrink-0" style={{ width: collapsed ? 68 : 252, minWidth: collapsed ? 68 : 252, background: "#FFFFFF", borderRight: "1px solid #EEF2F6" }}>
        <div className="flex items-center justify-between flex-shrink-0 px-3" style={{ height: 64, borderBottom: "1px solid #F1F5F9" }}>
          {!collapsed ? (
            <BrandMark subtitle={portalLabel} />
          ) : <BrandMark collapsed size={34} />}
          {!collapsed && <button onClick={() => setCollapsed(true)} className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, color: TEXT_MUTED }}><X size={14} /></button>}
        </div>
        {collapsed && (
          <div className="flex justify-center flex-shrink-0 mt-2">
            <button onClick={() => setCollapsed(false)} className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, color: TEXT_MUTED }}><Menu size={16} /></button>
          </div>
        )}
        <nav className="flex-1 px-2 py-3 overflow-y-auto cw-sidebar-scroll">
          {/* Switch to admin workspace — only for staff with management perms. */}
          {canAccessAdmin && (
            collapsed ? (
              <div className="mb-3 flex justify-center">
                <button type="button" onClick={goToAdmin} title="Admin Workspace"
                  className="flex items-center justify-center rounded-md"
                  style={{ width: 34, height: 34, background: BRAND_RED_TINT, color: BRAND_RED }}>
                  <LayoutDashboard size={16} strokeWidth={1.9} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={goToAdmin}
                className="mb-3 flex items-center w-full gap-2.5 px-2.5 py-2 rounded-lg"
                style={{ background: BRAND_RED_TINT, border: `1px solid ${BRAND_RED}`, color: BRAND_RED }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED_TINT)}>
                <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 26, height: 26, background: "#fff", color: BRAND_RED }}>
                  <LayoutDashboard size={15} strokeWidth={2} />
                </span>
                <span className="flex-1 text-left text-[12.5px]" style={{ fontWeight: 600 }}>Admin Workspace</span>
                <ChevronRight size={14} />
              </button>
            )
          )}
          {!collapsed && <div className="px-2 mb-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: TEXT_MUTED, textTransform: "uppercase" }}>Teaching</div>}
          <div className="space-y-0.5">
            {navItems.map((item) => <NavItem key={item.route} item={item} active={isActive(item)} collapsed={collapsed} onClick={(r) => navigate(r)} badge={item.route === STAFF_CHATS ? chatUnread : 0} />)}
          </div>

          {/* Collapsible My Employment group */}
          {!collapsed ? (
            <div className="mt-2">
              <div className="px-2 mb-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: TEXT_MUTED, textTransform: "uppercase" }}>Employment</div>
              <button type="button" onClick={() => setEmpOpen((o) => !o)}
                className="relative flex items-center w-full gap-2.5 px-2 py-1.5 rounded-lg"
                style={{ background: onEmployment ? BRAND_RED_TINT : "transparent" }}
                onMouseEnter={(e) => { if (!onEmployment) e.currentTarget.style.background = SURFACE_HOVER; }}
                onMouseLeave={(e) => { if (!onEmployment) e.currentTarget.style.background = "transparent"; }}>
                <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 28, height: 28, background: onEmployment ? "#FEE2E2" : ICON_BG_IDLE, color: onEmployment ? BRAND_RED : ICON_TX_IDLE }}>
                  <Briefcase size={16} strokeWidth={1.75} />
                </span>
                <span className="flex-1 text-left text-[13px] truncate" style={{ color: onEmployment ? BRAND_RED : TEXT_PRIMARY, fontWeight: onEmployment ? 600 : 500 }}>My Employment</span>
                {empExpanded ? <ChevronDown size={15} style={{ color: TEXT_MUTED }} /> : <ChevronRight size={15} style={{ color: TEXT_MUTED }} />}
              </button>
              {empExpanded && (
                <div className="mt-0.5 ml-3 pl-2 space-y-0.5" style={{ borderLeft: `1px solid ${BORDER}` }}>
                  {empItems.map((s) => {
                    const SubIcon = s.icon; const on = empActive(s.key);
                    return (
                      <button key={s.key} type="button" onClick={() => navigate(empRoute(s.key))}
                        className="flex items-center w-full gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: on ? BRAND_RED_TINT : "transparent" }}
                        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = SURFACE_HOVER; }}
                        onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                        <SubIcon size={14} style={{ color: on ? BRAND_RED : TEXT_MUTED }} />
                        <span className="flex-1 text-left text-[12.5px] truncate" style={{ color: on ? BRAND_RED : TEXT_SECONDARY, fontWeight: on ? 600 : 500 }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={() => navigate(TEACHER_EMPLOYMENT)} title="My Employment"
                className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, background: onEmployment ? "#FEE2E2" : ICON_BG_IDLE, color: onEmployment ? BRAND_RED : ICON_TX_IDLE }}>
                <Briefcase size={16} strokeWidth={1.75} />
              </button>
            </div>
          )}
        </nav>
        <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid #F1F5F9" }}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
              <button onClick={() => setLogoutOpen(true)} title="Sign out" className="flex items-center justify-center rounded-md" style={{ width: 34, height: 34, color: TEXT_SECONDARY }}><LogOut size={15} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #EEF2F6", padding: 8 }}>
              <div className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY }}>{fullName}</div>
                <div className="truncate capitalize" style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 1 }}>{ctx?.data?.designation || (isTeacher ? "Teacher" : "Staff")}</div>
              </div>
              <button onClick={() => setLogoutOpen(true)} title="Sign out" className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, color: TEXT_SECONDARY }}><LogOut size={13} /></button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-grow min-w-0 overflow-x-hidden">
        <div className="h-16 flex items-center justify-between px-6 bg-white" style={{ borderBottom: "1px solid #EEF2F6" }}>
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{activeLabel}</h2>
          <div className="flex items-center gap-2.5">
            {hasStudentRole && (
              <button type="button" onClick={() => navigate(PORTAL)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                style={{ border: "1px solid #EEF2F6", color: BRAND_RED }}
                title="You are also a student — open your student portal with this same login">
                <RefreshCw size={12} /> Student Portal
              </button>
            )}
            {/* Soft refresh — refetches the data on screen, no page reload */}
            <RefreshButton />
            <span className="text-[13px] font-semibold hidden sm:block" style={{ color: TEXT_SECONDARY }}>{fullName}</span>
            <div className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>{initials}</div>
          </div>
        </div>
        <main className="px-6 py-6"><Outlet /></main>
      </div>

      <LogoutConfirm open={logoutOpen} onCancel={() => setLogoutOpen(false)} onConfirm={logout} />
      <FirstLoginTour storageKey={`tour_seen_staff_${me?.data?.id || user?.id || "me"}`} steps={tourSteps} brandName="CodeLab" />
    </div>
  );
}
