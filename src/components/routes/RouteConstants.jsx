export const DASHBOARD = "/dashboard";
export const ADMINDASHBOARD = "/dashboard";

// Student portal (separate student-facing app surface)
export const PORTAL_LOGIN = "/portal/login";
export const PORTAL = "/portal";
export const PORTAL_ATTENDANCE = "/portal/attendance";
export const PORTAL_FEES = "/portal/fees";
export const PORTAL_ASSETS = "/portal/assets";
export const PORTAL_LEAVES = "/portal/leaves";
export const PORTAL_COMPLAINTS = "/portal/complaints";
export const PORTAL_MAKEUPS = "/portal/makeups";
export const PORTAL_ASSIGNMENTS = "/portal/assignments";
export const PORTAL_CONTENT = "/portal/content";
export const PORTAL_ANNOUNCEMENTS = "/portal/announcements";
export const PORTAL_REWARDS = "/portal/rewards";
export const PORTAL_PROFILE = "/portal/profile";
export const PORTAL_RULES = "/portal/rules";
export const PORTAL_CAREER = "/portal/career-path";
export const PORTAL_QUIZ = "/portal/quiz";

// Staff portal (unified — teachers + all employees). Constants keep the
// TEACHER_* names for back-compat; the URL is /staff-portal.
export const TEACHER_LOGIN = "/staff-portal/login";
export const TEACHER = "/staff-portal";
export const TEACHER_ATTENDANCE = "/staff-portal/attendance";
export const TEACHER_STUDENTS = "/staff-portal/students";
export const TEACHER_MAKEUPS = "/staff-portal/makeups";
export const TEACHER_ASSIGNMENTS = "/staff-portal/assignments";
export const TEACHER_CONTENT = "/staff-portal/content";
export const TEACHER_PERFORMANCE = "/staff-portal/performance";
export const TEACHER_ANNOUNCEMENTS = "/staff-portal/announcements";
export const TEACHER_REWARDS = "/staff-portal/rewards";
export const TEACHER_EMPLOYMENT = "/staff-portal/employment";
export const TEACHER_RULES = "/staff-portal/rules";
export const TEACHER_ASSESSMENT = "/staff-portal/assessment";
export const STUDENTS = "/dashboard/students";
export const STUDENT = "/dashboard/students";
export const DROPOUT_STUDENTS = "/dashboard/dropout-students";
export const PROFILE = "/dashboard/profile";
export const WORKINGSPACE = "/dashboard/working-space";
export const INCOME = "/dashboard/income";
export const COURSE = "/dashboard/course";
export const EXPENSES = "/dashboard/expenses";
export const WS_EXPENSE_DETAILS = "/dashboard/workspace-expenses/:uuid";
export const Course_EXPENSE_DETAILS = "/dashboard/courses-expenses/:uuid";
export const INSTRUCTORS = "/dashboard/smes";
export const INSTRUCTORSID = "/dashboard/smes";
export const EMPLOYEE = "/dashboard/employees";
export const EMPLOYEEID = "/dashboard/employees";
export const WORKSPACES = "/dashboard/workspaces/:uuid";
export const MANAGE_WORKINGSPACE = "/dashboard/manage-workspaces";
export const COMPANY = "/dashboard/working-spaces/company";
export const COMPANY_INDIVIDUAL =
  "/dashboard/working-spaces/company-individual";
export const COMPANY_DETAIL = "/dashboard/working-spaces/company/:uuid";
export const INDIVIDUAL = "/dashboard/working-spaces/individual";
export const INDIVIDUAL_DETAIL = "/dashboard/working-spaces/individual/:uuid";
export const INDIVIDUAL_STARTUP_REGISTRATION =
  "/dashboard/working-spaces/individual/register";
export const INDIVIDUAL_WORKSPACE_EDIT =
  "/dashboard/working-spaces/individual/edit/:uuid";
export const COMPANY_STARTUP_REGISTRATION =
  "/dashboard/working-spaces/company/register";
export const COMPANY_WORKSPACE_EDIT =
  "/dashboard/working-spaces/company/edit/:uuid";
export const INDIVIDUAL_COMPANY_REGISTER =
  "/dashboard/working-spaces/company-individual/register";
export const INDIVIDUAL_COMPANY_DETAILS =
  "/dashboard/working-spaces/company-individual/details/:uuid";
export const CATEGORIES = "/dashboard/categories";
export const COURSES = "/dashboard/courses";
export const CATEGORY_COURSES = "/dashboard/courses";
export const COURSE_STUDENTS = "/dashboard/courses/:uuid/students";
export const BATCHES = "/dashboard/classes";
export const ALLBATCHES = "/dashboard/batches";
export const BATCH_CREATE = "/dashboard/batches/create";
export const BATCH_EDIT = "/dashboard/classes/edit/:uuid";
export const FEES = "/dashboard/fees";
export const ANNOUNCEMENTS = "/dashboard/announcements";
export const APPLICANTS = "/dashboard/applicants";
export const RECEPTION_DASHBOARD = "/dashboard/reception";
export const STUDENT_JOURNEY = "/dashboard/student-journey";
export const CERTIFICATE_APPLICATIONS = "/dashboard/certificate-applications";
export const NEWSLETTER_SUBSCRIBERS = "/dashboard/newsletter-subscribers";
export const REFERRAL_LEADERBOARD = "/dashboard/referrals";
export const BRAND_AMBASSADORS = "/dashboard/ambassadors";
export const FEE_COLLECTION = "/dashboard/fee-collection";
export const FINANCE_STATS = "/dashboard/finance/stats";
export const EMPLOYEE_PAYOUTS = "/dashboard/finance/payouts";
export const PAYMENT_ACCOUNTS = "/dashboard/finance/payment-accounts";
export const STUDENT_LOANS = "/dashboard/finance/student-loans";
export const LEDGER_ACCOUNTS = "/dashboard/finance/ledger";
export const COMMISSIONS = "/dashboard/finance/commissions";
export const ALL_EXPENSES = "/dashboard/finance/all-expenses";
export const DELETED_EXPENSES = "/dashboard/finance/deleted-expenses";
export const WHATSAPP_INBOX = "/dashboard/whatsapp-inbox";
export const STUDENT_ENROLL = "/dashboard/enroll/:id";
export const STUDENT_ADD = "/dashboard/students/add";
export const TECHSCHOOL_EMAIL_TEMPLATES = "/dashboard/techschool/email-templates";
export const TECHSCHOOL_EMAIL_TEMPLATE_NEW = "/dashboard/techschool/email-templates/new";
export const TECHSCHOOL_EMAIL_TEMPLATE_EDIT = "/dashboard/techschool/email-templates/:uuid";
export const ATTENDANCE = "/dashboard/attendance";
export const PROJECTS = "/dashboard/projects";
export const SIGNIN = "/signin";
export const SIGNUP = "/signup";
export const LOGOUT = "/logout";
export const FORGET = "/forget";
export const RESET = "/reset";
export const OTP = "/otpcode";
export const NEWPASSWORD = "/newpassword";
export const INVENTORY = "/dashboard/inventory";
export const INVENTORYASSIGN = "/dashboard/inventory/assign";
export const INVENTORY_ITEMS = "/dashboard/inventory/items/:uuid?";
export const INVENTORY_SUMMARY = "/dashboard/inventory-summary";
export const STUDENT_SUMMARY = "/dashboard/student-summary";
export const STUDENT_LEAVES = "/dashboard/students/leaves";
export const STUDENT_COMPLAINTS = "/dashboard/students/complaints";
export const STUDENT_LAPTOPS = "/dashboard/students/laptops";
export const BATCH_ATTENDANCE = "/dashboard/students/batch-attendance";
export const ADMIN_MAKEUPS = "/dashboard/students/makeups";
export const COURSE_SUMMARY = "/dashboard/course-summary";
export const TOTAL_STATS = "/dashboard/summary";
export const STARTUP_SUMMARY = "/dashboard/startup-summary";
export const EMPLOYEE_SUMMARY = "/dashboard/employee-summary";
export const USER_MANAGEMENT = "/dashboard/user-management";
export const REPORTS = "/dashboard/reports";
export const ENROLL_STUDENT = "/dashboard/students/enroll";
export const STUDENTS_EDIT = "/dashboard/students/edit/:studentUuid";
export const TRAINING_INQUIRY = "/dashboard/training-inquiries";
export const TRAINING_INQUIRY_CREATE = "/dashboard/training-inquiries/create";
export const TRAINING_INQUIRY_EDIT = "/dashboard/training-inquiries/:id/edit";
export const TRAINING_INQUIRY_ENROLL = "/dashboard/training-inquiries/enroll";
export const TRAINING_INQUIRY_COURSE = "/dashboard/training-inquiries/course";
export const TRAINING_INQUIRY_DETAILS = "/dashboard/training-inquiries/details";
export const STARTUP_INQUIRY = "/dashboard/startup-inquiry";
export const INSTRUCTORS_ADD = "/dashboard/smes/add";
export const INSTRUCTORS_EDIT = "/dashboard/smes/edit/:uuid";
export const EMPLOYEES_ADD = "/dashboard/employees/add";
export const EMPLOYEES_EDIT = "/dashboard/employees/edit/:uuid";
export const COURSE_CLASS = "/dashboard/courses/:courseUuid/classes";
export const COURSE_DETAIL = "/dashboard/courses/:uuid";
export const VISITORS = "/dashboard/visitors";
export const VISIT_PURPOSES = "/dashboard/visit-purposes";
export const PROVINCES = "/dashboard/locations/provinces";
export const CITIES = "/dashboard/locations/cities";
export const BANKS = "/dashboard/locations/banks";
export const CLASS_STUDENTS = "/dashboard/classes/:classUuid";
export const CLASS_STUDENT_EDIT = "/dashboard/classes/student/edit/:uuid?";
export const NOTIFICATIONS = "/dashboard/notifications";
export const NOTIFICATIONS_LOG = "/dashboard/notifications-log";
export const NOTIFICATION_SETTINGS = "/dashboard/notification-settings";
export const MEMBERS = "/dashboard/working-spaces/company/members/add";
export const REFUND = "/dashboard/refund";
export const STUDENT_MANAGEMENT = "/dashboard/student-management";
export const SETTINGS = "/dashboard/settings";
export const RULES_REGULATIONS = "/dashboard/rules-regulations";
export const QUIZ_ANALYTICS = "/dashboard/quiz-analytics";
export const EMPLOYEE_ASSESSMENTS = "/dashboard/employee-assessments";

// HR module routes (Phase 0+)
export const HR_COMPANY_SETTINGS    = "/dashboard/hr/company-settings";
export const HR_COMPANY_BRANDS      = "/dashboard/hr/company-brands";
export const HR_COMPANY_BRAND_NEW   = "/dashboard/hr/company-brands/new";
export const HR_COMPANY_BRAND_EDIT  = "/dashboard/hr/company-brands/:uuid";
export const HR_EMAIL_TEMPLATES     = "/dashboard/hr/email-templates";
export const HR_EMAIL_TEMPLATE_NEW  = "/dashboard/hr/email-templates/new";
export const HR_EMAIL_TEMPLATE_EDIT = "/dashboard/hr/email-templates/:uuid";
export const HR_APPROVAL_CHAINS     = "/dashboard/hr/approval-chains";
export const HR_APPROVAL_CHAIN_NEW  = "/dashboard/hr/approval-chains/new";
export const HR_APPROVAL_CHAIN_EDIT = "/dashboard/hr/approval-chains/:uuid";
export const HR_APPROVAL_INBOX      = "/dashboard/hr/approval-inbox";

// HR > Employee Dashboard (Phase 1.95) — separate from /dashboard which is
// the LMS admin dashboard.
export const HR_EMPLOYEE_DASHBOARD      = "/dashboard/hr/employee-dashboard";

// HR > Dashboard — every HR metric on one page, with cards + charts
// views and a date-range filter. The route was renamed from
// organization-summary → hr-dashboard on 2026-05-25 per HR ask. We keep
// HR_ORGANIZATION_SUMMARY pointing to the new path so the old constant
// (still referenced in some imports) continues to work without a sweep.
export const HR_DASHBOARD               = "/dashboard/hr/hr-dashboard";
export const HR_ORGANIZATION_SUMMARY    = HR_DASHBOARD;

// HR > Attendance + Schedules (Phase 2)
export const HR_SCHEDULES               = "/dashboard/hr/schedules";
export const HR_ATTENDANCE              = "/dashboard/hr/attendance";
export const HR_MARK_ATTENDANCE         = "/dashboard/hr/mark-attendance";

// HR > Payroll (Phase 3) — cycles list + per-cycle detail.
// Detail is keyed by cycle uuid.
export const HR_PAYROLL_CYCLES          = "/dashboard/hr/payroll";
export const HR_PAYROLL_CYCLE_DETAIL    = "/dashboard/hr/payroll/:uuid";

// HR > Leave management (Phase 4)
export const HR_LEAVE_REQUESTS          = "/dashboard/hr/leave/requests";
export const HR_LEAVE_TYPES             = "/dashboard/hr/leave/types";

// HR > Loans + Security Retention (Phase 6)
export const HR_LOANS                   = "/dashboard/hr/loans";
export const HR_LOAN_DETAIL             = "/dashboard/hr/loans/:uuid";
export const HR_SECURITY_RETENTION      = "/dashboard/hr/security-retention";

// Me > My Leave (Phase 4 — employee-self)
export const ME_MY_LEAVE                = "/dashboard/me/leave";

// Me > self-mark STP attendance (Phase 2 — employee-facing)
export const ME_SELF_MARK_ATTENDANCE    = "/dashboard/me/attendance";

// HR > Employees (Phase 1)
export const HR_EMPLOYEES               = "/dashboard/hr/employees";
export const HR_EMPLOYEE_NEW            = "/dashboard/hr/employees/new";
export const HR_EMPLOYEE_DETAIL         = "/dashboard/hr/employees/:uuid";
export const HR_EMPLOYEE_EDIT           = "/dashboard/hr/employees/:uuid/edit";
export const HR_CONTRACT_TEMPLATES      = "/dashboard/hr/contract-templates";
export const HR_CONTRACT_TEMPLATE_NEW   = "/dashboard/hr/contract-templates/new";
export const HR_CONTRACT_TEMPLATE_EDIT  = "/dashboard/hr/contract-templates/:uuid";

// HR — org structure (Phase 1)
export const HR_DEPARTMENTS         = "/dashboard/hr/departments";
export const HR_DEPARTMENT_NEW      = "/dashboard/hr/departments/new";
export const HR_DEPARTMENT_EDIT     = "/dashboard/hr/departments/:uuid";
export const HR_TEAMS               = "/dashboard/hr/teams";
export const IT_CLIENTS             = "/dashboard/it-solutions/clients";
export const IT_PROJECTS            = "/dashboard/it-solutions/projects";
export const IT_PROJECT_BOARD       = "/dashboard/it-solutions/projects/:uuid";
export const IT_TEAM_PERFORMANCE    = "/dashboard/it-solutions/team-performance";
export const IT_INVOICES            = "/dashboard/it-solutions/invoices";
export const IT_CLIENT_PAYMENTS     = "/dashboard/it-solutions/clients-payments";
export const HR_SERVICES            = "/dashboard/hr/services";
export const HR_SERVICE_NEW         = "/dashboard/hr/services/new";
export const HR_SERVICE_EDIT        = "/dashboard/hr/services/:uuid";
export const HR_OFFICES             = "/dashboard/hr/offices";

// HR > Designations (Phase 1) — job-title catalog under Org structure
export const HR_DESIGNATIONS        = "/dashboard/hr/designations";
export const HR_DESIGNATION_NEW     = "/dashboard/hr/designations/new";
export const HR_DESIGNATION_EDIT    = "/dashboard/hr/designations/:uuid";

// HR > Institutes — universities / colleges / schools catalog
// Institutes moved out of HR and into System (2026-05-25) — universities /
// colleges / schools are a shared lookup, not an HR-only concern. Constant
// names kept (HR_INSTITUTES…) so existing imports don't break; only the
// URL paths shift to /dashboard/system/institutes/*.
export const HR_INSTITUTES          = "/dashboard/system/institutes";
export const HR_INSTITUTE_NEW       = "/dashboard/system/institutes/new";
export const HR_INSTITUTE_EDIT      = "/dashboard/system/institutes/:uuid";

// HR > Roles & Permissions (Phase 1)
export const HR_ROLES         = "/dashboard/hr/roles";
export const HR_ROLE_NEW      = "/dashboard/hr/roles/new";
export const HR_ROLE_EDIT     = "/dashboard/hr/roles/:uuid";
export const HR_PERMISSIONS   = "/dashboard/hr/permissions";
export const HR_OFFICE_NEW          = "/dashboard/hr/offices/new";
export const HR_OFFICE_EDIT         = "/dashboard/hr/offices/:uuid";
