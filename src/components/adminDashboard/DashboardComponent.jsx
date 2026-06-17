/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { firstAccessibleRoute } from "../dashboard/SidebarComponent";
import { useGetQuery } from "../../api/apiSlice";
import { useNavigate } from "react-router-dom";
import Loader from "../ui/common/LoaderComponent";
import TodayAttendanceWidget from "../hr/attendance/TodayAttendanceWidget";
import {
  Users, UserPlus, GraduationCap, Award, Building2, Layers,
  Wallet, TrendingUp, TrendingDown, Undo2,
} from "lucide-react";

const DashboardComponent = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  // The admin home shows company-wide finance summary + stats. Only users who
  // can see those analytics belong here (admin, finance/overview roles).
  // Operational roles that merely record income/expenses (e.g. Fiza) must NOT
  // land here — it would also 401 on the finance-summary fetch and log them
  // out. Bounce everyone else to the first page their role can actually open.
  const ANALYTICS_PERMS = ["get finance-summary", "get finance-stats", "get dashboard"];
  const canSeeAdminHome =
    currentUser?.role === "admin" ||
    (currentUser?.permissions || []).some((p) => ANALYTICS_PERMS.includes(p));

  useEffect(() => {
    if (currentUser && !canSeeAdminHome) {
      const target = firstAccessibleRoute(currentUser);
      if (target) navigate(target, { replace: true });
    }
  }, [currentUser, canSeeAdminHome, navigate]);

  // "Today at a glance" — cross-module counts/sums for the current day.
  const { data: todayResp } = useGetQuery(
    { path: "/admin/dashboard/today" },
    { skip: !canSeeAdminHome },
  );
  const today = todayResp?.data?.stats || {};
  const todayDate = todayResp?.data?.date || "";
  const money = (n) => "Rs " + Number(n || 0).toLocaleString();
  const todayCards = [
    { label: "Visitors",     value: today.visitors ?? 0,     icon: Users,         color: "#2563EB" },
    { label: "Inquiries",    value: today.inquiries ?? 0,    icon: UserPlus,      color: "#7C3AED" },
    { label: "New Students", value: today.students ?? 0,     icon: GraduationCap, color: "#C90606" },
    { label: "Certificates", value: today.certificates ?? 0, icon: Award,         color: "#B45309" },
    { label: "New Clients",  value: today.clients ?? 0,      icon: Building2,     color: "#0891B2" },
    { label: "New Batches",  value: today.batches_new ?? 0,  icon: Layers,        color: "#16A34A", sub: `${today.batches_active ?? 0} active` },
    { label: "Payments",     value: money(today.payments),   icon: Wallet,        color: "#15803D" },
    { label: "Income",       value: money(today.income),     icon: TrendingUp,    color: "#0D9488" },
    { label: "Expenses",     value: money(today.expenses),   icon: TrendingDown,  color: "#DC2626" },
    { label: "Refunds",      value: money(today.refunds),    icon: Undo2,         color: "#9333EA" },
  ];

  // Seed the header avatar from the already-authenticated user. The previous
  // GET "/admin" call has no matching backend route (only /admin/dashboard,
  // /admin/authentication/*, etc. exist) and returned 404 on every dashboard
  // load. currentUser already carries the avatar from login, so use that.
  const adminAvatarUrl = currentUser?.avatar?.file_url;
  useEffect(() => {
    if (adminAvatarUrl) {
      localStorage.setItem("adminProfileImage", adminAvatarUrl);
    }
  }, [adminAvatarUrl]);

  // Redirecting an HR-only user away — don't flash the finance home.
  if (currentUser && !canSeeAdminHome) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col bg-midnight min-h-screen">

      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10 md:pb-12">

        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10 text-xl sm:text-2xl md:text-3xl font-semibold text-heading font-poppins">
          Admin Dashboard
        </div>

        {/* Today at a glance */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-heading">
              Today at a glance
            </h2>
            {todayDate && (
              <span className="text-xs text-[#94A3B8]">{todayDate}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {todayCards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#EEF2F6] flex items-center gap-3"
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 rounded-xl"
                    style={{ width: 44, height: 44, background: `${c.color}1A`, color: c.color }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#94A3B8] truncate">
                      {c.label}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-[#0F172A] truncate">
                      {c.value}
                    </div>
                    {c.sub && <div className="text-[10.5px] text-[#64748B] truncate">{c.sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's employee attendance (hidden if no permission) */}
        <div className="mb-6 sm:mb-8">
          <TodayAttendanceWidget />
        </div>

      </div>
    </div>
  );
};

export default DashboardComponent;
