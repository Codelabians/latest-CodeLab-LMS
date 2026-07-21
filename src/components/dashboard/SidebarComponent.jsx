import {
  LayoutDashboard,
  Award,
  Mail,
  Briefcase,
  FolderKanban,
  Trophy,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  Package,
  HelpCircle,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Wallet,
  Loader2,
  // Sub-item icons
  BarChart3,
  ArrowDownCircle,
  Trash2,
  ArrowUpCircle,
  Undo2,
  Tag,
  Book,
  Layers,
  CalendarDays,
  CalendarCheck,
  MessageSquareWarning,
  RefreshCw,
  Building,
  User,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Plane,
  Tags,
  Shield,
  ShieldCheck,
  Banknote,
  Key,
  UserSearch,
  Megaphone,
  MessageCircle,
  UserCheck,
  FileText,
  Bell,
  Activity,
  Landmark,
  HeartHandshake,
  PauseCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ALLBATCHES,
  CATEGORIES,
  COMPANY,
  COURSE_SUMMARY,
  COURSES,
  DASHBOARD,
  EXPENSES,
  INCOME,
  IT_CLIENTS,
  IT_INVOICES,
  IT_CLIENT_PAYMENTS,
  IT_PROJECTS,
  IT_TEAM_PERFORMANCE,
  INDIVIDUAL,
  INVENTORY,
  MANAGE_WORKINGSPACE,
  REFUND,
  SETTINGS,
  RULES_REGULATIONS,
  QUIZ_ANALYTICS,
  EMPLOYEE_ASSESSMENTS,
  HR_COMPANY_SETTINGS,
  HR_COMPANY_BRANDS,
  HR_EMAIL_TEMPLATES,
  HR_CONTRACT_TEMPLATES,
  HR_DASHBOARD,
  HR_TEAMS,
  HR_SCHEDULES,
  HR_ATTENDANCE,
  HR_MARK_ATTENDANCE,
  HR_PAYROLL_CYCLES,
  HR_LEAVE_REQUESTS,
  HR_LEAVE_TYPES,
  HR_LOANS,
  HR_SECURITY_RETENTION,
  ME_SELF_MARK_ATTENDANCE,
  TEACHER_EMPLOYMENT,
  HR_EMPLOYEES,
  HR_DEPARTMENTS,
  HR_INSTITUTES,
  HR_ROLES,
  HR_PERMISSIONS,
  HR_OFFICES,
  HR_APPROVAL_CHAINS,
  HR_APPROVAL_INBOX,
  SIGNIN,
  STARTUP_SUMMARY,
  STUDENT_SUMMARY,
  STUDENT_LEAVES,
  STUDENTS_ON_BREAK,
  STUDENT_COMPLAINTS,
  EMPLOYEE_COMPLAINTS,
  STUDENT_LAPTOPS,
  BATCH_ATTENDANCE,
  ADMIN_MAKEUPS,
  STUDENTS,
  TRAINING_INQUIRY,
  USER_MANAGEMENT,
  VISITORS,
  VISIT_PURPOSES,
  PROVINCES,
  CITIES,
  BANKS,
  ANNOUNCEMENTS,
  APPLICANTS,
  NOTIFICATIONS_LOG,
  NOTIFICATION_SETTINGS,
  RECEPTION_DASHBOARD,
  STUDENT_JOURNEY,
  CERTIFICATE_APPLICATIONS,
  NEWSLETTER_SUBSCRIBERS,
  REFERRAL_LEADERBOARD,
  SHARE_EARN_ADMIN,
  BRAND_AMBASSADORS,
  FEE_COLLECTION,
  FINANCE_STATS,
  EMPLOYEE_PAYOUTS,
  PAYMENT_ACCOUNTS,
  SCHOLARSHIP_PROGRAMS,
  FEE_STATUS,
  STUDENT_LOANS,
  LEDGER_ACCOUNTS,
  COMMISSIONS,
  ALL_EXPENSES,
  ALL_INCOME,
  DELETED_EXPENSES,
  WHATSAPP_INBOX,
  TECHSCHOOL_EMAIL_TEMPLATES,
} from "../routes/RouteConstants";
import {
  clearCredentials,
  selectCurrentUser,
} from "../../features/auth/authSlice";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

/* ───────────────────────── brand tokens ───────────────────────── */
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

/* ───────────────── permission helpers ───────────────── */
const hasAnyPermission = (user, gate) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!gate || gate.length === 0) return true;
  const perms = user.permissions || [];
  return gate.some((p) => perms.includes(p));
};

/* ─────────────────── menu configuration ─────────────────── */
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        route: DASHBOARD,
        label: "Dashboard",
        icon: LayoutDashboard,
        gate: ["get dashboard"],
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        route: ANNOUNCEMENTS,
        label: "Announcements",
        icon: Megaphone,
        // "get announcements" is not a real permission, so it only ever
        // showed for admin. Communication is shared by HR/ops roles, so gate
        // on the real notification permission instead.
        gate: ["get notification"],
      },
      {
        route: WHATSAPP_INBOX,
        label: "WhatsApp Inbox",
        icon: MessageCircle,
        gate: ["get whatsapp-inbox"],
      },
      {
        route: APPLICANTS,
        label: "Applicants",
        icon: UserCheck,
        gate: ["get notification"],
      },
      {
        route: NOTIFICATIONS_LOG,
        label: "Notifications Log",
        icon: Activity,
        gate: ["get notification"],
      },
      {
        route: NOTIFICATION_SETTINGS,
        label: "Notification Settings",
        icon: Bell,
        gate: ["update notification"],
      },
      {
        route: RULES_REGULATIONS,
        label: "Rules & Regulations",
        icon: ShieldCheck,
        gate: ["get policy", "create policy", "update policy", "delete policy"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Finance",
        icon: Wallet,
        // Show the section if the user holds ANY finance permission — including
        // just the create/update variants — so e.g. someone granted only
        // "create expenses" can still reach Expense management.
        gate: ["get finance-stats", "get expenses", "create expenses", "update expenses", "delete expenses", "get income", "create income", "update income", "record payments", "get finance-summary", "get refund", "create refund", "get student-loans", "get ledger", "get commissions"],
        children: [
          { route: FINANCE_STATS, label: "Finance Stats", icon: TrendingUp, gate: ["get finance-stats"] },
          { route: FEE_COLLECTION, label: "Collect Fee", icon: Wallet, gate: ["record payments"] },
          { route: FEE_STATUS, label: "Fee Status", icon: Wallet, gate: ["record payments"] },
          { route: EMPLOYEE_PAYOUTS, label: "Employee Payouts", icon: Banknote, gate: ["get finance-summary"] },
          { route: EXPENSES, label: "Expenses", icon: ArrowDownCircle, gate: ["get expenses", "create expenses", "update expenses", "delete expenses"] },
          { route: ALL_EXPENSES, label: "All Expenses", icon: ArrowDownCircle, gate: ["get expenses", "create expenses", "update expenses", "delete expenses", "get finance-summary"] },
          { route: ALL_INCOME, label: "All Income", icon: ArrowUpCircle, gate: ["get income", "create income", "update income", "delete income", "get finance-summary"] },
          { route: DELETED_EXPENSES, label: "Deleted Expenses", icon: Trash2, gate: ["get expenses", "update expenses", "delete expenses", "get finance-summary"] },
          { route: INCOME, label: "Income", icon: ArrowUpCircle, gate: ["get income", "create income", "update income", "delete income"] },
          // Refunds now have their own dedicated permission so refund access
          // can be granted/removed independently of finance-summary.
          { route: REFUND, label: "Refund", icon: Undo2, gate: ["get refund", "create refund"] },
          { route: PAYMENT_ACCOUNTS, label: "Payment Accounts", icon: Landmark, gate: ["get finance-summary"] },
          { route: STUDENT_LOANS, label: "Student Loans", icon: Banknote, gate: ["get student-loans"] },
          { route: LEDGER_ACCOUNTS, label: "Accounts & Ledger", icon: Landmark, gate: ["get ledger"] },
          { route: SCHOLARSHIP_PROGRAMS, label: "Scholarship / NGO", icon: HeartHandshake, gate: ["get scholarship-programs"] },
          { route: COMMISSIONS, label: "Commissions", icon: Banknote, gate: ["get commissions"] },
        ],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Students",
        icon: GraduationCap,
        gate: ["get student", "get student-summary", "get student-management", "get complaints"],
        children: [
          { route: STUDENT_SUMMARY, label: "Students Summary", icon: BarChart3, gate: ["get student-summary"] },
          { route: STUDENTS, label: "All Students", icon: Users, gate: ["get student"] },
          { route: STUDENT_LEAVES, label: "Leave Requests", icon: CalendarCheck, gate: ["get student-leaves"] },
          { route: STUDENTS_ON_BREAK, label: "On Break", icon: PauseCircle, gate: ["get student"] },
          { route: STUDENT_COMPLAINTS, label: "Complaints", icon: MessageSquareWarning, gate: ["get complaints"] },
          { route: EMPLOYEE_COMPLAINTS, label: "Employee Complaints", icon: MessageSquareWarning, gate: ["get complaints"] },
          { route: STUDENT_LAPTOPS, label: "Laptops", icon: Boxes, gate: ["get inventory-assign", "update inventory-assign"] },
          { route: BATCH_ATTENDANCE, label: "Batch Attendance", icon: CalendarCheck, gate: ["get student"] },
          { route: ADMIN_MAKEUPS, label: "Makeups", icon: RefreshCw, gate: ["get makeup-classes"] },
        ],
      },
      // Phase 1 — Legacy "Employees" top-level group removed.
      // HR > Employees (and HR > Org structure) now covers Employee Summary,
      // SMEs (teachers), and the general Employees list in one place. The
      // legacy routes still resolve so any deep links keep working; only the
      // sidebar entries are hidden.
      //
      // User Management is also removed from here — it now lives under HR
      // as "Users & Roles".
    ],
  },
  {
    label: "Reception",
    items: [
      {
        route: RECEPTION_DASHBOARD,
        label: "Reception Dashboard",
        icon: LayoutDashboard,
        gate: ["get visitors"],
      },
      {
        route: STUDENT_JOURNEY,
        label: "Student Journey",
        icon: TrendingDown,
        gate: ["get visitors"],
      },
      {
        route: VISITORS,
        label: "Visitors",
        icon: UserSearch,
        gate: ["get visitors"],
      },
      // Admin-managed catalog of WHY a person walked in. Feeds the
      // visitor form's purpose dropdown.
      {
        route: VISIT_PURPOSES,
        label: "Visit Purposes",
        icon: Tags,
        gate: ["get visit-purposes"],
      },
      // Inquiries live in Reception too — visitor → inquiry → student is
      // the natural funnel that reception drives.
      {
        route: TRAINING_INQUIRY,
        label: "Inquiries",
        icon: HelpCircle,
        gate: ["get training-inquiries"],
      },
    ],
  },
  {
    label: "Learning",
    items: [
      {
        label: "Catalog",
        icon: BookOpen,
        gate: ["get course", "get course-summary", "get category", "get batches"],
        children: [
          { route: COURSE_SUMMARY, label: "Course Summary", icon: BarChart3, gate: ["get course-summary"] },
          { route: CATEGORIES, label: "Categories", icon: Tag, gate: ["get category"] },
          { route: COURSES, label: "Courses", icon: Book, gate: ["get course"] },
          { route: ALLBATCHES, label: "Batches", icon: Layers, gate: ["get batches"] },
        ],
      },
      {
        route: CERTIFICATE_APPLICATIONS,
        label: "Certificate Applications",
        icon: Award,
        gate: ["get certificate-applications"],
      },
      {
        route: QUIZ_ANALYTICS,
        label: "Quiz Performance",
        icon: BarChart3,
        gate: ["get quiz"],
      },
      {
        route: NEWSLETTER_SUBSCRIBERS,
        label: "Subscribers",
        icon: Mail,
        gate: ["get subscribers"],
      },
      {
        route: REFERRAL_LEADERBOARD,
        label: "Referrals",
        icon: Trophy,
        gate: ["get referrals"],
      },
      {
        route: SHARE_EARN_ADMIN,
        label: "Share & Earn",
        icon: Trophy,
        gate: ["get referrals"],
      },
      {
        route: BRAND_AMBASSADORS,
        label: "Brand Ambassadors",
        icon: Award,
        gate: ["get referrals"],
      },
    ],
  },
  {
    label: "HR Admin — TechSchool",
    items: [
      {
        route: TECHSCHOOL_EMAIL_TEMPLATES,
        label: "Email Templates",
        icon: Mail,
        gate: ["get email-templates"],
      },
    ],
  },
  {
    // Standalone section — accessible to Team Leads (gated on team/client
    // permissions), not nested under HR.
    label: "IT Solutions",
    items: [
      {
        route: IT_CLIENTS,
        label: "Clients",
        icon: Briefcase,
        gate: ["get it-clients"],
      },
      {
        route: IT_PROJECTS,
        label: "Projects",
        icon: FolderKanban,
        gate: ["get projects"],
      },
      {
        route: IT_INVOICES,
        label: "Invoices",
        icon: FileText,
        gate: ["get client-invoices"],
      },
      {
        route: IT_CLIENT_PAYMENTS,
        label: "Clients & Payments",
        icon: Wallet,
        gate: ["get client-invoices"],
      },
      {
        route: HR_TEAMS,
        label: "Teams",
        icon: Users,
        gate: ["get teams"],
      },
      {
        route: IT_TEAM_PERFORMANCE,
        label: "Team Performance",
        icon: BarChart3,
        gate: ["get teams"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      // Training Inquiries moved to Reception (2026-05-25) since it's the
      // last step of the reception funnel (visitor → inquiry → student).
      // The route still lives at /dashboard/training-inquiries — only the
      // sidebar location changed.
      {
        label: "Working Spaces",
        icon: Building2,
        // Hidden for now (Phase 2). To restore, swap this gate back to the
        // original workspace permissions listed just below.
        gate: ["__working_spaces_phase2__"],
        // Original gate (Phase 2): [
        //   "get startup-summary", "get manage-workspace",
        //   "get individual-workspace", "get company-workspace",
        // ],
        children: [
          { route: STARTUP_SUMMARY, label: "Startup Summary", icon: BarChart3, gate: ["get startup-summary"] },
          { route: MANAGE_WORKINGSPACE, label: "Manage Workspace", icon: Building, gate: ["get manage-workspace"] },
          { route: INDIVIDUAL, label: "Individual", icon: User, gate: ["get individual-workspace"] },
          { route: COMPANY, label: "Company", icon: Building2, gate: ["get company-workspace"] },
        ],
      },
      {
        // One unified Inventory & Assets page (assets, bulk stock, categories,
        // locations, assign/return) — replaces the old 3 sub-pages.
        route: INVENTORY,
        label: "Inventory & Assets",
        icon: Package,
        gate: ["get inventory", "get inventory-summary", "get inventory-assign"],
      },
    ],
  },
  {
    label: "HR",
    // The HR section is for HR roles only. TechSchool/finance roles (e.g.
    // Fiza) hold email-templates + company-brands for the TechSchool editor,
    // which would otherwise surface HR via its child gates — so exclude them
    // by role explicitly.
    hideForRoles: ["techschool_finance_manager", "receptionist"],
    items: [
      {
        label: "HR",
        icon: Building,
        // NOTE: "get email-templates" and "get company-brands" intentionally
        // NOT here. Both are shared with the TechSchool email-template editor
        // (TechSchool/finance roles like Fiza hold them as reads), so
        // including either would make the whole HR section appear for them.
        // Gate the section only on genuinely HR-employee permissions.
        gate: [
          "get company-settings",
          "get approval-chains",
          "get employee",
          "get employee-leaves",
          "get payroll-cycles",
        ],
        // Sequence locked per HR ask (2026-05-25):
        //   Org Summary → Org Structure → Approvals → Attendance →
        //   Employees → Templates → Inbox → Schedules → Institutes →
        //   Offices → Brands → Settings.
        // Employee Dashboard was removed from HR — Org Summary covers it.
        // Roles / Permissions / User Management moved out to a separate
        // top-level "User Management" section since they're admin concerns,
        // not HR concerns.
        children: [
          {
            // HR > Dashboard — every HR metric on one page (renamed from
            // "Org Summary" 2026-05-25 per HR ask).
            route: HR_DASHBOARD,
            label: "Dashboard",
            icon: Boxes,
            gate: ["view hr-dashboard-all-employees"],
          },
          {
            // Departments + Services tabs
            route: HR_DEPARTMENTS,
            label: "Org Structure",
            icon: Layers,
            gate: ["get employee"],
          },
          {
            route: EMPLOYEE_ASSESSMENTS,
            label: "Employee Assessments",
            icon: BarChart3,
            gate: ["get assessment"],
          },
          {
            // Approval chain definitions (HR → Admin → Team Lead → CEO etc.)
            route: HR_APPROVAL_CHAINS,
            label: "Approvals",
            icon: ClipboardCheck,
            gate: ["get approval-chains"],
          },
          {
            // Fast daily roster — mark everyone for today in one screen
            route: HR_MARK_ATTENDANCE,
            label: "Mark Attendance",
            icon: CalendarCheck,
            gate: ["create employee-attendance"],
          },
          {
            // Phase 2 — Attendance + CSV import + regularization inbox
            route: HR_ATTENDANCE,
            label: "Attendance",
            icon: CalendarCheck,
            gate: ["get employee-attendance"],
          },
          {
            // Phase 3 — Payroll cycles + salaries + payslips
            route: HR_PAYROLL_CYCLES,
            label: "Payroll",
            icon: Wallet,
            gate: ["get payroll-cycles"],
          },
          {
            // Phase 4 — Leave requests inbox (approve/reject)
            route: HR_LEAVE_REQUESTS,
            label: "Leave",
            icon: Plane,
            gate: ["get employee-leaves"],
          },
          {
            // Phase 4 — Leave types CRUD (HR admin)
            route: HR_LEAVE_TYPES,
            label: "Leave Types",
            icon: Tags,
            gate: ["get leave-types"],
          },
          {
            // Phase 6 — Employee loans (advances + auto installments)
            route: HR_LOANS,
            label: "Loans",
            icon: Banknote,
            gate: ["get employee-loans"],
          },
          {
            // Phase 6 — Security retention (per-employee hold-back)
            route: HR_SECURITY_RETENTION,
            label: "Security Retention",
            icon: ShieldCheck,
            gate: ["get security-retentions"],
          },
          {
            // Phase 1.9 — Employees CRUD
            route: HR_EMPLOYEES,
            label: "Employees",
            icon: Users,
            gate: ["get employee"],
          },
          {
            // Email template manager
            route: HR_EMAIL_TEMPLATES,
            label: "Templates",
            icon: ClipboardList,
            gate: ["get email-templates"],
          },
          {
            // Reusable contract blueprints (rich-text body + variables).
            // Backend: Modules/Employee EmployeeContractTemplateController.
            route: HR_CONTRACT_TEMPLATES,
            label: "Contract Templates",
            icon: FileText,
            gate: ["get employee-contract-templates"],
          },
          {
            // Pending approvals inbox (separate from chain definitions)
            route: HR_APPROVAL_INBOX,
            label: "Inbox",
            icon: ClipboardList,
            gate: ["get approval-instances"],
          },
          {
            // Phase 2 — Date-ranged schedules + seasonal overrides
            route: HR_SCHEDULES,
            label: "Schedules",
            icon: CalendarDays,
            gate: ["get employee-schedules"],
          },
          // Phase 6 (2026-05-25): Institutes moved out of HR to System
          // section. Universities / colleges / schools are added by admin
          // officers, HR, and admins — not an HR-exclusive concern.
          {
            // Office locations catalog. Kept inside HR since it pairs with
            // schedules and employees — not explicitly listed in the HR ask
            // but doesn't logically belong anywhere else.
            route: HR_OFFICES,
            label: "Offices",
            icon: Building2,
            gate: ["get employee"],
          },
          {
            route: HR_COMPANY_BRANDS,
            label: "Brands",
            icon: Layers,
            gate: ["get company-brands"],
          },
          {
            route: HR_COMPANY_SETTINGS,
            label: "Settings",
            icon: SettingsIcon,
            gate: ["get company-settings"],
          },
        ],
      },
    ],
  },
  {
    // User Management — moved out of HR so admin (not HR) owns roles, perms,
    // and the full user list. HR's job is people, not auth identities.
    label: "User Management",
    items: [
      {
        route: USER_MANAGEMENT,
        label: "User Management",
        icon: Shield,
        gate: ["get users", "get roles", "get permissions"],
      },
    ],
  },
  {
    // Me — personal page(s) for the logged-in user.
    //  · "My Leave" is visible to anyone who can create their own leave
    //    requests (i.e. every employee with the basic permission).
    //  · "My Attendance" is STP-only (further restricted at render time
    //    via the `requiresStpOffice` flag — see filterNav() below).
    label: "Me",
    items: [
      {
        // Every staff member can see their own employment self-service
        // (profile, schedule, payslips, leave, loans, bank, documents,
        // contracts). Uses the /teacher/me/* endpoints which work for any
        // logged-in staff regardless of admin permissions — so no gate.
        route: TEACHER_EMPLOYMENT,
        label: "My Employment",
        icon: User,
        gate: [],
      },
      {
        route: ME_SELF_MARK_ATTENDANCE,
        label: "My Attendance",
        icon: CalendarCheck,
        gate: ["self-mark stp-attendance"],
        requiresStpOffice: true,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        route: SETTINGS,
        label: "Settings",
        icon: SettingsIcon,
        gate: ["get settings"],
      },
      {
        // Moved out of HR (2026-05-25). Universities / colleges / schools
        // catalog is a shared lookup — admin officers, HR, and admins all
        // add to it. Gated on a broad permission so all three roles see it.
        route: HR_INSTITUTES,
        label: "Institutes",
        icon: GraduationCap,
        gate: ["get employee"],
      },
      {
        label: "Locations",
        icon: Building,
        gate: ["manage provinces", "manage cities", "manage banks"],
        children: [
          { route: PROVINCES, label: "Provinces", icon: Building, gate: ["manage provinces"] },
          { route: CITIES,    label: "Cities",    icon: Building, gate: ["manage cities"] },
          { route: BANKS,     label: "Banks",     icon: Building, gate: ["manage banks"] },
        ],
      },
    ],
  },
];

const filterNav = (user, hasStpOffice = false) =>
  NAV_SECTIONS.map((section) => {
    // Role-level exclusion: some sections are conceptually off-limits to a
    // role even if it happens to hold a permission that a child gates on
    // (e.g. TechSchool/finance roles hold `email-templates` + `company-brands`
    // for the TechSchool editor, which would otherwise reveal the HR section).
    const userRole = user?.role;
    if (section.hideForRoles && userRole && section.hideForRoles.includes(userRole)) {
      return { ...section, items: [] };
    }
    const items = (section.items || [])
      .map((item) => {
        // STP-only items (currently just "My Attendance") are hidden when
        // the user has no partner / client_site office assignment. Keeps
        // the sidebar uncluttered for staff who only work in-office.
        if (item.requiresStpOffice && !hasStpOffice) return null;
        if (item.children) {
          const allowedChildren = item.children
            .filter((c) => !(c.requiresStpOffice && !hasStpOffice))
            .filter((c) => hasAnyPermission(user, c.gate));
          if (allowedChildren.length === 0) return null;
          return { ...item, children: allowedChildren };
        }
        return hasAnyPermission(user, item.gate) ? item : null;
      })
      .filter(Boolean);
    return { ...section, items };
  }).filter((s) => s.items.length > 0);

// First dashboard route the user can actually open, computed from the SAME
// permission-gated nav the sidebar renders. Used for post-login landing and
// the staff-portal → admin switcher so no one is ever dropped on a page they
// lack permission for (which the API turns into a 401 → forced logout).
export const firstAccessibleRoute = (user, hasStpOffice = false) => {
  const sections = filterNav(user, hasStpOffice);
  for (const s of sections) {
    for (const item of s.items) {
      if (item.children && item.children.length) return item.children[0].route;
      if (item.route) return item.route;
    }
  }
  return null;
};

const findActive = (pathname, sections) => {
  let bestRoute = null;
  let bestParentLabel = null;
  let bestLen = -1;
  sections.forEach((section) => {
    section.items.forEach((item) => {
      const candidates = item.children
        ? item.children.map((c) => ({ route: c.route, parent: item.label }))
        : [{ route: item.route, parent: null }];
      candidates.forEach(({ route, parent }) => {
        if (!route) return;
        if (pathname === route || pathname.startsWith(route + "/")) {
          if (route.length > bestLen) {
            bestLen = route.length;
            bestRoute = route;
            bestParentLabel = parent;
          }
        }
      });
    });
  });
  return { activeRoute: bestRoute, activeParentLabel: bestParentLabel };
};

/* ───────────────── child item ───────────────── */
const ChildItem = ({ child, isActive, onClick, collapsed }) => {
  if (collapsed) return null;
  const Icon = child.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(child.route)}
      // `items-center` → `items-start` so when the label wraps to two lines
      // the icon stays aligned to the first line rather than centering vertically.
      className="relative flex items-start w-full gap-2.5 px-2 py-1.5 text-[12.5px] transition-all duration-150 rounded-md"
      style={{
        color: isActive ? BRAND_RED : TEXT_SECONDARY,
        background: isActive ? BRAND_RED_TINT : "transparent",
        fontWeight: isActive ? 600 : 500,
        fontFamily: "'Montserrat', sans-serif",
        minHeight: 32,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = SURFACE_HOVER;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* small left indent so children visually nest under parent's icon */}
      <span style={{ width: 12, flexShrink: 0 }} />
      {/* icon — replaces the old bullet dot */}
      <span
        className="flex items-center justify-center flex-shrink-0 transition-all duration-150 rounded-md"
        style={{
          width: 22,
          height: 22,
          background: isActive ? "#FEE2E2" : "transparent",
          color: isActive ? BRAND_RED : TEXT_MUTED,
          marginTop: 1, // optical alignment with the first line of the label
        }}
      >
        {Icon ? <Icon size={13} strokeWidth={1.9} /> : null}
      </span>
      {/* Long labels ("Company Settings", "Email Templates", "Approval Inbox")
         must NOT truncate. Allow wrap, keep tight line-height so 2-line rows
         still look compact. */}
      <span
        className="flex-1 text-left"
        style={{
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: 1.3,
          paddingTop: 2,
        }}
      >
        {child.label}
      </span>
      <UnreadBadge route={child.route} />
    </button>
  );
};


/* Small red count pill for sidebar rows with unread items. Reads the same
   polled unread-count query as the navbar bell (RTK Query dedupes it). */
const UnreadBadge = ({ route }) => {
  const { data } = useGetQuery(
    { path: "communication/notifications/unread-count" },
    { pollingInterval: 15000 },
  );
  const count =
    route === WHATSAPP_INBOX ? data?.data?.whatsapp_unread || 0
    : route === NOTIFICATIONS_LOG ? data?.data?.unread || 0
    : route === STUDENT_LEAVES ? data?.data?.pending_student_leaves || 0
    : route === HR_LEAVE_REQUESTS ? data?.data?.pending_leave_requests || 0
    : 0;
  if (!count) return null;
  return (
    <span
      className="flex items-center justify-center flex-shrink-0 text-white font-bold rounded-full"
      style={{ minWidth: 18, height: 18, padding: "0 5px", fontSize: 10, background: BRAND_RED }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

/* ───────────────── group / leaf item ───────────────── */
const NavItem = ({
  item,
  collapsed,
  expanded,
  onToggleExpand,
  activeRoute,
  activeParentLabel,
  onNavigate,
}) => {
  const Icon = item.icon;
  const isGroup = Array.isArray(item.children);
  const open = expanded === item.label;
  const isActiveLeaf = !isGroup && activeRoute === item.route;
  const groupHasActiveChild = isGroup && activeParentLabel === item.label;
  const isActive = isActiveLeaf || groupHasActiveChild;

  const handleClick = () => {
    if (isGroup) onToggleExpand(open ? null : item.label);
    else onNavigate(item.route);
  };

  const pillBg = isActive ? BRAND_RED_TINT : "transparent";
  const iconBg = isActive ? "#FEE2E2" : ICON_BG_IDLE;
  const iconColor = isActive ? BRAND_RED : ICON_TX_IDLE;
  const labelColor = isActive ? BRAND_RED : TEXT_PRIMARY;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        className="relative flex items-center w-full gap-2.5 px-2 py-1.5 transition-all duration-150 rounded-lg"
        style={{
          background: pillBg,
          fontFamily: "'Montserrat', sans-serif",
          boxShadow: isActive ? `inset 0 0 0 1px ${BRAND_RED_RING}` : "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = SURFACE_HOVER;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Icon container */}
        <span
          className="flex items-center justify-center flex-shrink-0 transition-all duration-150 rounded-md"
          style={{
            width: 28,
            height: 28,
            background: iconBg,
            color: iconColor,
          }}
        >
          {Icon ? <Icon size={16} strokeWidth={1.75} /> : null}
        </span>

        {!collapsed && (
          <>
            <span
              className="flex-1 text-left text-[13px] truncate"
              style={{
                color: labelColor,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.005em",
              }}
            >
              {item.label}
            </span>
            {!isGroup && <UnreadBadge route={item.route} />}
            {isGroup && (
              <span
                className="transition-transform duration-200 mr-0.5"
                style={{
                  color: isActive ? BRAND_RED : TEXT_MUTED,
                  transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                }}
              >
                <ChevronDown size={14} strokeWidth={2.25} />
              </span>
            )}
          </>
        )}
      </button>

      {/* Children */}
      {isGroup && !collapsed && (
        <div
          className="overflow-hidden transition-all duration-200 ease-out"
          // Per-row estimate must allow for labels that wrap to two lines
          // ("Contract Templates", "Security Retention", etc.). A 34px/row
          // assumption clipped the last item in long sections (e.g. HR). Use a
          // generous per-row height + buffer so nothing is ever cut off.
          style={{ maxHeight: open ? item.children.length * 56 + 24 : 0 }}
        >
          <div className="relative py-1 pl-3">
            {/* subtle vertical guide */}
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-3"
              style={{ width: 1, background: "#E2E8F0" }}
            />
            {item.children.map((child) => (
              <ChildItem
                key={child.route}
                child={child}
                isActive={activeRoute === child.route}
                onClick={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ───────────────── logout confirmation modal ───────────────── */
const LogoutConfirm = ({ open, onCancel, onConfirm, isLoading }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm p-6 bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <LogOut size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center text-black">Sign out</h3>
        <p className="mt-1 text-sm text-center text-gray-500">
          You&apos;ll need to sign in again to access the dashboard.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="py-2.5 text-sm font-semibold text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: BRAND_RED }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Signing out…
              </>
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── main component ─────────────────────── */
const SidebarComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [logoutMutation, { isLoading: isLoggingOut }] = usePostMutation();

  // Fetch the my-summary payload so we can gate STP-only items in the
  // sidebar. The endpoint is auth-only (no permission needed) and 200s
  // for non-employee users too — those just get has_profile=false.
  const { data: mySummaryResp } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const hasStpOffice = !!mySummaryResp?.data?.has_stp_office;

  // Console branding (logo + name) from Settings; falls back to the "C/L"
  // badge below when no logo is configured / branding endpoint unavailable.
  const { data: brandingResp } = useGetQuery({ path: "branding" });
  const brandLogo = brandingResp?.data?.logo_url || "";
  const brandTitle = brandingResp?.data?.app_name || "Codelab Console";

  const sections = useMemo(
    () => filterNav(user, hasStpOffice),
    [user, hasStpOffice],
  );
  const { activeRoute, activeParentLabel } = useMemo(
    () => findActive(location.pathname, sections),
    [location.pathname, sections]
  );

  useEffect(() => {
    if (activeParentLabel) setExpanded(activeParentLabel);
  }, [activeParentLabel]);

  const handleNavigate = (route) => {
    if (route) navigate(route);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation({
        path: "/admin/authentication/logout",
        body: {},
      }).unwrap();
    } catch (_err) {
      /* still log out locally */
    } finally {
      dispatch(clearCredentials());
      localStorage.removeItem("token");
      localStorage.removeItem("rememberMe");
      setLogoutOpen(false);
      showToast("Signed out successfully", "success");
      navigate(SIGNIN, { replace: true });
    }
  };

  const initials = (user?.first_name || user?.name || user?.email || "AD")
    .toString()
    .split(/[\s.@]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Admin";

  return (
    <>
      {/* Custom scrollbar — invisible until you hover the sidebar */}
      <style>{`
        .cw-sidebar-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .cw-sidebar-scroll:hover { scrollbar-color: rgba(0,0,0,0.18) transparent; }
        .cw-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .cw-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .cw-sidebar-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; transition: background 0.2s ease; }
        .cw-sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }
        .cw-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
      `}</style>

      <aside
        // shrink-0 here is critical: the sidebar is a flex child inside
        // DashboardLayout. Without it, when any page's content has a wide
        // natural width (tab strips, split panes, big tables) the flex
        // algorithm steals horizontal space from the sidebar, causing
        // sub-item labels to truncate. Locking width + min-width + max-width
        // + flex-shrink:0 makes the sidebar physically incompressible.
        className="sticky top-0 flex flex-col h-screen overflow-hidden transition-all duration-300 shrink-0"
        style={{
          width: collapsed ? 68 : 252,
          minWidth: collapsed ? 68 : 252,
          maxWidth: collapsed ? 68 : 252,
          flexShrink: 0,
          fontFamily: "'Montserrat', sans-serif",
          background: "#FFFFFF",
          borderRight: "1px solid #EEF2F6",
        }}
      >
        {/* ─── Header ─── */}
        <div
          className="flex items-center justify-between flex-shrink-0 px-3"
          style={{ height: 64, borderBottom: "1px solid #F1F5F9" }}
        >
          {!collapsed ? (
            brandLogo ? (
              // Logo set in Settings → render it at full size; the logo
              // already carries the brand name, so hide the text labels.
              <img
                src={brandLogo}
                alt={brandTitle}
                className="object-contain"
                style={{ height: 52, maxHeight: 52, maxWidth: 190, objectPosition: "left center" }}
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    boxShadow: `0 6px 18px -10px ${BRAND_RED_RING}`,
                  }}
                >
                  C<span style={{ opacity: 0.7, margin: "0 1px" }}>/</span>L
                </div>
                <div className="min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "0.02em" }}
                  >
                    CODELAB
                  </div>
                  <div
                    className="truncate"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      color: TEXT_MUTED,
                      textTransform: "uppercase",
                      marginTop: 1,
                    }}
                  >
                    Admin Panel
                  </div>
                </div>
              </div>
            )
          ) : brandLogo ? (
            <img
              src={brandLogo}
              alt={brandTitle}
              className="mx-auto object-contain"
              style={{ width: 34, height: 34, borderRadius: 10 }}
            />
          ) : (
            <div
              className="flex items-center justify-center mx-auto"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                boxShadow: `0 6px 18px -10px ${BRAND_RED_RING}`,
              }}
            >
              C<span style={{ opacity: 0.7, margin: "0 1px" }}>/</span>L
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="flex items-center justify-center transition-all rounded-md"
              style={{ width: 28, height: 28, color: TEXT_MUTED, background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = TEXT_MUTED;
              }}
            >
              <X size={14} strokeWidth={2.25} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center flex-shrink-0 mt-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="flex items-center justify-center transition-all rounded-md"
              style={{ width: 32, height: 32, color: TEXT_MUTED, background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = TEXT_MUTED;
              }}
            >
              <Menu size={16} strokeWidth={2.25} />
            </button>
          </div>
        )}

        {/* ─── Nav body — tight left spacing ─── */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto cw-sidebar-scroll">
          {sections.map((section, si) => (
            <div key={section.label} className={si > 0 ? "mt-4" : ""}>
              {!collapsed && (
                <div
                  className="px-2 mb-1.5"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: TEXT_MUTED,
                    textTransform: "uppercase",
                  }}
                >
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.route || item.label}
                    item={item}
                    collapsed={collapsed}
                    expanded={expanded}
                    onToggleExpand={setExpanded}
                    activeRoute={activeRoute}
                    activeParentLabel={activeParentLabel}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          ))}

          {sections.length === 0 && !collapsed && (
            <div className="px-3 py-10 text-xs text-center" style={{ color: TEXT_MUTED }}>
              You don&apos;t have access to any modules yet. Please contact your administrator.
            </div>
          )}
        </nav>

        {/* ─── Footer ─── */}
        <div
          className="flex-shrink-0 p-2.5"
          style={{ borderTop: "1px solid #F1F5F9" }}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                }}
              >
                {initials}
              </div>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                title="Sign out"
                className="flex items-center justify-center transition-all rounded-md"
                style={{ width: 34, height: 34, color: TEXT_SECONDARY, background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = BRAND_RED_TINT;
                  e.currentTarget.style.color = BRAND_RED;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = TEXT_SECONDARY;
                }}
              >
                <LogOut size={15} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2.5 rounded-lg"
              style={{ background: "#F8FAFC", border: "1px solid #EEF2F6", padding: 8 }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_PRIMARY }}>
                  {fullName}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 10.5, color: TEXT_MUTED, textTransform: "capitalize", marginTop: 1 }}
                >
                  {user?.role || "User"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                title="Sign out"
                className="flex items-center justify-center transition-all rounded-md"
                style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = BRAND_RED_TINT;
                  e.currentTarget.style.color = BRAND_RED;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = TEXT_SECONDARY;
                }}
              >
                <LogOut size={13} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <LogoutConfirm
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default SidebarComponent;
