import { Navigate, useRoutes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { useGetQuery } from "../../api/apiSlice";

// Back-compat: map any old /teacher-portal/* URL to the new /staff-portal/* path.
function LegacyTeacherPortalRedirect() {
  const loc = useLocation();
  const to = loc.pathname.replace("/teacher-portal", "/staff-portal") + (loc.search || "");
  return <Navigate to={to} replace />;
}

// Catch-all: any URL that matches no route sends the user to THEIR home —
// students to /portal, teacher-only accounts to /staff-portal, everyone
// else to the admin dashboard (whose own layout gate re-checks access).
function RoleHomeRedirect() {
  const { token, user } = useSelector((s) => s.auth);
  const { data: me } = useGetQuery(
    { path: "/user/get-user" },
    { skip: !token || !!(user?.role || user?.roles) },
  );
  if (!token) return <Navigate to={SIGNIN} replace />;
  const u = user?.role || user?.roles ? user : me?.data;
  if (!u) return null; // role still loading — hold the render
  const roles = [u.role, ...(u.roles || [])].filter(Boolean);
  if (roles.length && roles.every((r) => r === "user")) {
    return <Navigate to={PORTAL} replace />;
  }
  if (roles.length && roles.every((r) => r === "user" || r === "teacher")) {
    return <Navigate to={TEACHER} replace />;
  }
  return <Navigate to={ADMINDASHBOARD} replace />;
}
import { useCheckAuthToken } from "../../hooks/useCheckAuthToken";
const AssetsManager = lazy(() => import("../inventory/AssetsManager"));
import PrivateRoute from "../../utils/PrivateRoutes";
import PublicRoutes from "../../utils/PublicRoutes";
const AttendanceMarkSection = lazy(() => import("../AttendanceSection/AttendanceMarkSection"));
const Reports = lazy(() => import("../Reports/Reports"));
const UserManagement = lazy(() => import("../UserManagement/UserManagement"));
const DashboardComponent = lazy(() => import("../adminDashboard/DashboardComponent"));
const Announcements = lazy(() => import("../announcements/Announcements"));
const ApplicantsComponent = lazy(() => import("../applicants/ApplicantsComponent"));
const ReceptionDashboard = lazy(() => import("../reception/ReceptionDashboard"));
const StudentJourney = lazy(() => import("../journey/StudentJourney"));
const CertificateApplications = lazy(() => import("../certificates/CertificateApplications"));
const NewsletterSubscribers = lazy(() => import("../newsletter/NewsletterSubscribers"));
const ReferralLeaderboard = lazy(() => import("../referrals/ReferralLeaderboard"));
const BrandAmbassadors = lazy(() => import("../referrals/BrandAmbassadors"));
const FeeCollection = lazy(() => import("../finance/FeeCollection"));
const EditStudentPage = lazy(() => import("../students/EditStudentPage"));
const FinanceStats = lazy(() => import("../finance/FinanceStats"));
const EmployeePayouts = lazy(() => import("../finance/EmployeePayouts"));
const StudentLoans = lazy(() => import("../finance/StudentLoans"));
const LedgerAccounts = lazy(() => import("../finance/LedgerAccounts"));
const Commissions = lazy(() => import("../finance/Commissions"));
const WhatsAppInbox = lazy(() => import("../communication/WhatsAppInbox"));
const PaymentAccounts = lazy(() => import("../finance/PaymentAccounts"));
const ScholarshipPrograms = lazy(() => import("../finance/ScholarshipPrograms"));
const FeeStatusList = lazy(() => import("../finance/FeeStatusList"));
const StudentsOnBreak = lazy(() => import("../students/StudentsOnBreak"));
const EnrollStudentWizard = lazy(() => import("../students/EnrollStudentWizard"));
const SignInHero = lazy(() => import("../auth/SignIn/SignInHero"));
const SignUpHero = lazy(() => import("../auth/SignUp/SignUpHero"));
const ForgetComponent = lazy(() => import("../auth/forget/ForgetComponent"));
const NewPasswordComponent = lazy(() => import("../auth/newpassword/NewPasswordComponent"));
const OtpComponent = lazy(() => import("../auth/otpcode/OtpComponent"));
const ResetComponent = lazy(() => import("../auth/reset/ResetComponent"));
const CategoriesComponent = lazy(() => import("../categories/CategoriesComponent"));
const CourseSummary = lazy(() => import("../courses/CourseSummary"));
const CoursesComponent = lazy(() => import("../courses/CoursesComponent"));
const VisitorsComponent = lazy(() => import("../visitors/VisitorsComponent"));
const CourseDetail = lazy(() => import("../courses/CourseDetail"));
import DashboardLayout from "../dashboard/DashboardLayout";
const EmployeeSummary = lazy(() => import("../employees/EmployeeSummary"));
const AddEmployee = lazy(() => import("../employees/components/AddEmployee"));
const EmployeeDetails = lazy(() => import("../employees/employeeDetailsPages/EmployeeDetails"));
const CoursesExpenses = lazy(() => import("../expenses/CoursesExpenses"));
const WsExpenses = lazy(() => import("../expenses/WsExpenses"));
const AllExpenses = lazy(() => import("../expenses/AllExpenses"));
const AllIncome = lazy(() => import("../income/AllIncome"));
const DeletedExpenses = lazy(() => import("../expenses/DeletedExpenses"));
const ExpenseDetails = lazy(() => import("../expenses/components/ExpenseModal"));
const FeesComponent = lazy(() => import("../fees/FeesComponent"));
const Course = lazy(() => import("../finance/courses/Course"));
const WorkingSpace = lazy(() => import("../finance/workingspace/WorkingSpace"));
const StartupInquiry = lazy(() => import("../inquiry/StartupInquiry"));
// Old TrainingInquiry (by-course cards view) is superseded by the new
// CRUD-style InquiriesComponent. Import kept commented in case we want
// to restore the legacy page during transition.
// import TrainingInquiry from "../inquiry/trainingInquiry/TrainingInquiry";
const InquiriesComponent = lazy(() => import("../inquiry/InquiriesComponent"));
const InquiryFormPage = lazy(() => import("../inquiry/InquiryFormPage"));
const ProvincesComponent = lazy(() => import("../locations/ProvincesComponent"));
const CitiesComponent = lazy(() => import("../locations/CitiesComponent"));
const BanksComponent = lazy(() => import("../locations/BanksComponent"));
const InstructorsComponent = lazy(() => import("../instructors/InstructorsComponent"));
const InstructorDetailsTab = lazy(() => import("../instructors/instructorDetailsPages/InstructorDetailsTab"));
const AdminProfile = lazy(() => import("../profile/AdminProfile"));
const StartupSummary = lazy(() => import("../spaces/StartupSummary"));
const Company = lazy(() => import("../spaces/company/Company"));
const CompanyDetails = lazy(() => import("../spaces/company/CompanyDetails"));
const Individual = lazy(() => import("../spaces/individual/Individual"));
const IndividualDetails = lazy(() => import("../spaces/individual/components/IndividualDetails"));
const Managespaces = lazy(() => import("../spaces/manageSpaces/Managespaces"));
const StudentSummary = lazy(() => import("../students/StudentSummary"));
const StudentsList = lazy(() => import("../students/StudentsList"));
const StudentDetailPage = lazy(() => import("../students/StudentDetailPage"));
const StudentLeavesPage = lazy(() => import("../students/leaves/StudentLeavesPage"));
const StudentComplaintsPage = lazy(() => import("../students/complaints/StudentComplaintsPage"));
const StudentLaptops = lazy(() => import("../students/StudentLaptops"));
const BatchAttendancePage = lazy(() => import("../students/BatchAttendancePage"));
const MakeupsPage = lazy(() => import("../students/MakeupsPage"));
const PortalLogin = lazy(() => import("../portal/PortalLogin"));
import PortalLayout from "../portal/PortalLayout";
const PortalDashboard = lazy(() => import("../portal/PortalDashboard"));
const PortalAttendance = lazy(() => import("../portal/PortalAttendance"));
const PortalFees = lazy(() => import("../portal/PortalFees"));
const PortalAssets = lazy(() => import("../portal/PortalAssets"));
const PortalLeaves = lazy(() => import("../portal/PortalLeaves"));
const PortalComplaints = lazy(() => import("../portal/PortalComplaints"));
const PortalMakeups = lazy(() => import("../portal/PortalMakeups"));
const PortalAssignments = lazy(() => import("../portal/PortalAssignments"));
const PortalContent = lazy(() => import("../portal/PortalContent"));
const PortalAnnouncements = lazy(() => import("../portal/PortalAnnouncements"));
const PortalRewards = lazy(() => import("../portal/PortalRewards"));
const PortalProfile = lazy(() => import("../portal/PortalProfile"));
const TeacherLogin = lazy(() => import("../teacher/TeacherLogin"));
import TeacherLayout from "../teacher/TeacherLayout";
const TeacherDashboard = lazy(() => import("../teacher/TeacherDashboard"));
const TeacherAttendance = lazy(() => import("../teacher/TeacherAttendance"));
const TeacherStudents = lazy(() => import("../teacher/TeacherStudents"));
const TeacherMakeups = lazy(() => import("../teacher/TeacherMakeups"));
const TeacherAssignments = lazy(() => import("../teacher/TeacherAssignments"));
const TeacherContent = lazy(() => import("../teacher/TeacherContent"));
const TeacherPerformance = lazy(() => import("../teacher/TeacherPerformance"));
const TeacherAnnouncements = lazy(() => import("../teacher/TeacherAnnouncements"));
const TeacherRewards = lazy(() => import("../teacher/TeacherRewards"));
const TeacherEmployment = lazy(() => import("../teacher/TeacherEmployment"));
const StudentForm = lazy(() => import("../students/addStudentModal/StudentForm."));
import {
  ADMINDASHBOARD,
  ANNOUNCEMENTS,
  APPLICANTS,
  RECEPTION_DASHBOARD,
  STUDENT_JOURNEY,
  CERTIFICATE_APPLICATIONS,
  NEWSLETTER_SUBSCRIBERS,
  REFERRAL_LEADERBOARD,
  BRAND_AMBASSADORS,
  FEE_COLLECTION,
  STUDENT_LOANS,
  LEDGER_ACCOUNTS,
  COMMISSIONS,
  ALL_EXPENSES,
  ALL_INCOME,
  DELETED_EXPENSES,
  WHATSAPP_INBOX,
  FINANCE_STATS,
  EMPLOYEE_PAYOUTS,
  PAYMENT_ACCOUNTS,
  SCHOLARSHIP_PROGRAMS,
  FEE_STATUS,
  STUDENTS_ON_BREAK,
  STUDENT_ENROLL,
  STUDENT_ADD,
  TECHSCHOOL_EMAIL_TEMPLATES,
  TECHSCHOOL_EMAIL_TEMPLATE_NEW,
  TECHSCHOOL_EMAIL_TEMPLATE_EDIT,
  ATTENDANCE,
  BATCH_CREATE,
  BATCH_EDIT,
  BATCHES,
  CATEGORIES,
  CLASS_STUDENT_EDIT,
  CLASS_STUDENTS,
  COMPANY,
  COMPANY_DETAIL,
  COMPANY_INDIVIDUAL,
  COMPANY_STARTUP_REGISTRATION,
  COMPANY_WORKSPACE_EDIT,
  COURSE,
  COURSE_CLASS,
  COURSE_DETAIL,
  VISITORS,
  VISIT_PURPOSES,
  Course_EXPENSE_DETAILS,
  COURSE_SUMMARY,
  COURSES,
  INCOME,
  EMPLOYEE,
  EMPLOYEE_SUMMARY,
  EMPLOYEEID,
  EMPLOYEES_ADD,
  EMPLOYEES_EDIT,
  ENROLL_STUDENT,
  EXPENSES,
  FEES,
  FORGET,
  INDIVIDUAL,
  INDIVIDUAL_COMPANY_DETAILS,
  INDIVIDUAL_COMPANY_REGISTER,
  INDIVIDUAL_DETAIL,
  INDIVIDUAL_STARTUP_REGISTRATION,
  INDIVIDUAL_WORKSPACE_EDIT,
  INSTRUCTORS,
  INSTRUCTORS_ADD,
  INSTRUCTORS_EDIT,
  INSTRUCTORSID,
  INVENTORY,
  INVENTORY_SUMMARY,
  MANAGE_WORKINGSPACE,
  MEMBERS,
  NEWPASSWORD,
  NOTIFICATIONS,
  NOTIFICATIONS_LOG,
  NOTIFICATION_SETTINGS,
  RULES_REGULATIONS,
  QUIZ_ANALYTICS,
  EMPLOYEE_ASSESSMENTS,
  OTP,
  PROFILE,
  REPORTS,
  RESET,
  SIGNIN,
  SIGNUP,
  STARTUP_INQUIRY,
  STARTUP_SUMMARY,
  STUDENT,
  STUDENT_SUMMARY,
  STUDENT_LEAVES,
  STUDENT_COMPLAINTS,
  EMPLOYEE_COMPLAINTS,
  STUDENT_LAPTOPS,
  BATCH_ATTENDANCE,
  ADMIN_MAKEUPS,
  PORTAL,
  PORTAL_LOGIN,
  PORTAL_ATTENDANCE,
  PORTAL_FEES,
  PORTAL_ASSETS,
  PORTAL_LEAVES,
  PORTAL_COMPLAINTS,
  PORTAL_MAKEUPS,
  PORTAL_ASSIGNMENTS,
  PORTAL_CONTENT,
  PORTAL_ANNOUNCEMENTS,
  PORTAL_REWARDS,
  PORTAL_PROFILE,
  PORTAL_RULES,
  PORTAL_CAREER,
  PORTAL_QUIZ,
  TEACHER,
  TEACHER_LOGIN,
  TEACHER_ATTENDANCE,
  TEACHER_STUDENTS,
  TEACHER_MAKEUPS,
  TEACHER_ASSIGNMENTS,
  TEACHER_CONTENT,
  TEACHER_PERFORMANCE,
  TEACHER_ANNOUNCEMENTS,
  TEACHER_REWARDS,
  TEACHER_EMPLOYMENT,
  TEACHER_RULES,
  TEACHER_ASSESSMENT,
  TEACHER_COMPLAINTS,
  STUDENTS,
  STUDENTS_EDIT,
  TRAINING_INQUIRY,
  TRAINING_INQUIRY_CREATE,
  TRAINING_INQUIRY_EDIT,
  PROVINCES,
  CITIES,
  BANKS,
  TRAINING_INQUIRY_COURSE,
  TRAINING_INQUIRY_DETAILS,
  TRAINING_INQUIRY_ENROLL,
  USER_MANAGEMENT,
  WORKINGSPACE,
  WORKSPACES,
  WS_EXPENSE_DETAILS,
  INVENTORYASSIGN,
  REFUND,
  STUDENT_MANAGEMENT,
  SETTINGS,
  ALLBATCHES,
  HR_COMPANY_SETTINGS,
  HR_COMPANY_BRANDS,
  HR_COMPANY_BRAND_NEW,
  HR_COMPANY_BRAND_EDIT,
  HR_EMAIL_TEMPLATES,
  HR_EMAIL_TEMPLATE_NEW,
  HR_EMAIL_TEMPLATE_EDIT,
  HR_CONTRACT_TEMPLATES,
  HR_CONTRACT_TEMPLATE_NEW,
  HR_CONTRACT_TEMPLATE_EDIT,
  HR_APPROVAL_CHAINS,
  HR_APPROVAL_CHAIN_NEW,
  HR_APPROVAL_CHAIN_EDIT,
  HR_APPROVAL_INBOX,
  HR_EMPLOYEE_DASHBOARD,
  HR_DASHBOARD,
  HR_SCHEDULES,
  HR_ATTENDANCE,
  HR_MARK_ATTENDANCE,
  HR_PAYROLL_CYCLES,
  HR_PAYROLL_CYCLE_DETAIL,
  HR_LEAVE_REQUESTS,
  HR_LEAVE_TYPES,
  HR_LOANS,
  HR_LOAN_DETAIL,
  HR_SECURITY_RETENTION,
  ME_MY_LEAVE,
  ME_SELF_MARK_ATTENDANCE,
  HR_EMPLOYEES,
  HR_EMPLOYEE_NEW,
  HR_EMPLOYEE_DETAIL,
  HR_EMPLOYEE_EDIT,
  HR_DEPARTMENTS,
  HR_TEAMS,
  IT_CLIENTS,
  IT_INVOICES,
  IT_CLIENT_PAYMENTS,
  IT_PROJECTS,
  IT_PROJECT_BOARD,
  IT_TEAM_PERFORMANCE,
  HR_DEPARTMENT_NEW,
  HR_DEPARTMENT_EDIT,
  HR_SERVICES,
  HR_SERVICE_NEW,
  HR_SERVICE_EDIT,
  HR_OFFICES,
  HR_OFFICE_NEW,
  HR_OFFICE_EDIT,
  HR_ROLES,
  HR_ROLE_NEW,
  HR_ROLE_EDIT,
  HR_PERMISSIONS,
  HR_DESIGNATIONS,
  HR_DESIGNATION_NEW,
  HR_DESIGNATION_EDIT,
  HR_INSTITUTES,
  HR_INSTITUTE_NEW,
  HR_INSTITUTE_EDIT,
} from "./RouteConstants";
const InquiryDetailPage = lazy(() => import("../inquiry/trainingInquiry/InquiryDetailPage"));
const InquiryDetailView = lazy(() => import("../inquiry/trainingInquiry/InquiryDetailView"));
const EmployeesComponent = lazy(() => import("../employees/EmployeesComponent"));
const VisitPurposesComponent = lazy(() => import("../visitors/VisitPurposesComponent"));
const ClassStudents = lazy(() => import("../batches/components/utils/ClassStudents"));
const ClassStudentEdit = lazy(() => import("../batches/components/ClassStudentEdit"));
const InquiryForm = lazy(() => import("../inquiry/trainingInquiry/InquiryForm"));
const NotificationPage = lazy(() => import("../dashboard/Notification"));
const NotificationsLogPage = lazy(() => import("../notifications/NotificationsLogPage"));
const NotificationSettingsPage = lazy(() => import("../notifications/NotificationSettingsPage"));
const IndividualWorkSpaceForm = lazy(() => import("../spaces/individual/components/IndividualWorkSpaceForm"));
const CompanyWorkspaceForm = lazy(() => import("../spaces/component/CompanyWorkspaceForm"));
const CompanyIndividual = lazy(() => import("../spaces/company-individual/CompanyIndividual"));
const IndividualCompanyForm = lazy(() => import("../spaces/company-individual/components/IndividualCompanyForm"));
const IndividualCompanyDetails = lazy(() => import("../spaces/company-individual/components/IndividualCompanyDetails"));
const WorkspaceDetail = lazy(() => import("../spaces/Workspace"));
const Refund = lazy(() => import("../finance/refund/Refund"));
const StudentManagement = lazy(() => import("../StudentManagement/StudentManagement"));
const Settings = lazy(() => import("../settings/Settings"));
const RulesRegulationsPage = lazy(() => import("../policies/RulesRegulationsPage"));
const RulesView = lazy(() => import("../policies/RulesView"));
const PortalCareerPath = lazy(() => import("../portal/PortalCareerPath"));
const PortalQuiz = lazy(() => import("../portal/PortalQuiz"));
const QuizAnalyticsPage = lazy(() => import("../quizzes/QuizAnalyticsPage"));
const TeacherAssessment = lazy(() => import("../teacher/TeacherAssessment"));
const TeacherComplaints = lazy(() => import("../teacher/TeacherComplaints"));
const EmployeeAssessmentAnalytics = lazy(() => import("../assessments/EmployeeAssessmentAnalytics"));
const CompanySettingsPage = lazy(() => import("../hr/companySettings/CompanySettingsPage"));
const BrandsListPage = lazy(() => import("../hr/companyBrands/BrandsListPage"));
const BrandFormPage = lazy(() => import("../hr/companyBrands/BrandFormPage"));
const EmailTemplatesListPage = lazy(() => import("../hr/emailTemplates/EmailTemplatesListPage"));
const EmailTemplateFormPage = lazy(() => import("../hr/emailTemplates/EmailTemplateFormPage"));
const ContractTemplatesListPage = lazy(() => import("../hr/contractTemplates/ContractTemplatesListPage"));
const ContractTemplateFormPage = lazy(() => import("../hr/contractTemplates/ContractTemplateFormPage"));
const ApprovalChainsListPage = lazy(() => import("../hr/approvalChains/ApprovalChainsListPage"));
const ApprovalChainFormPage = lazy(() => import("../hr/approvalChains/ApprovalChainFormPage"));
const ApprovalInboxPage = lazy(() => import("../hr/approvalInbox/ApprovalInboxPage"));
const EmployeesListPage = lazy(() => import("../hr/employees/EmployeesListPage"));
const HrEmployeeDashboard = lazy(() => import("../hr/employees/HrEmployeeDashboard"));
const OrganizationSummaryPage = lazy(() => import("../hr/dashboards/OrganizationSummaryPage"));
const SchedulesPage = lazy(() => import("../hr/schedules/SchedulesPage"));
const AttendancePage = lazy(() => import("../hr/attendance/AttendancePage"));
const MarkAttendancePage = lazy(() => import("../hr/attendance/MarkAttendancePage"));
const SelfMarkAttendancePage = lazy(() => import("../me/SelfMarkAttendancePage"));
const PayrollCyclesListPage = lazy(() => import("../hr/payroll/PayrollCyclesListPage"));
const PayrollCycleDetailPage = lazy(() => import("../hr/payroll/PayrollCycleDetailPage"));
const LeaveTypesPage = lazy(() => import("../hr/leave/LeaveTypesPage"));
const LeaveRequestsInboxPage = lazy(() => import("../hr/leave/LeaveRequestsInboxPage"));
const LoansListPage = lazy(() => import("../hr/loans/LoansListPage"));
const LoanDetailPage = lazy(() => import("../hr/loans/LoanDetailPage"));
const SecurityRetentionPage = lazy(() => import("../hr/loans/SecurityRetentionPage"));
const MyLeavePage = lazy(() => import("../me/MyLeavePage"));
const EmployeeDetailPage = lazy(() => import("../hr/employees/EmployeeDetailPage"));
const EmployeeFormPage = lazy(() => import("../hr/employees/EmployeeFormPage"));
const OrgStructurePage = lazy(() => import("../hr/departments/OrgStructurePage"));
const TeamsManagement = lazy(() => import("../teams/TeamsManagement"));
const ClientsManagement = lazy(() => import("../itclients/ClientsManagement"));
const ProjectWorkspace = lazy(() => import("../itclients/ProjectWorkspace"));
const ProjectsList = lazy(() => import("../itclients/ProjectsList"));
const ClientInvoices = lazy(() => import("../itclients/ClientInvoices"));
const ClientsAndPayments = lazy(() => import("../itclients/ClientsAndPayments"));
const TeamPerformance = lazy(() => import("../itclients/TeamPerformance"));
const DepartmentFormPage = lazy(() => import("../hr/departments/DepartmentFormPage"));
const ServiceFormPage = lazy(() => import("../hr/services/ServiceFormPage"));
const OfficesListPage = lazy(() => import("../hr/offices/OfficesListPage"));
const OfficeFormPage = lazy(() => import("../hr/offices/OfficeFormPage"));
const RolesListPage = lazy(() => import("../hr/roles/RolesListPage"));
const RoleFormPage = lazy(() => import("../hr/roles/RoleFormPage"));
const PermissionsListPage = lazy(() => import("../hr/roles/PermissionsListPage"));
const DesignationsListPage = lazy(() => import("../hr/designations/DesignationsListPage"));
const DesignationFormPage = lazy(() => import("../hr/designations/DesignationFormPage"));
const InstitutesListPage = lazy(() => import("../hr/institutes/InstitutesListPage"));
const InstituteFormPage = lazy(() => import("../hr/institutes/InstituteFormPage"));
const BatchesComponent = lazy(() => import("../batches/BatchesComonent"));

export default function Router() {
  const routes = useRoutes([
    { element: <Navigate to={SIGNIN} />, index: true },

    {
      path: ADMINDASHBOARD,
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          path: ADMINDASHBOARD,
          element: (
            <PrivateRoute
              element={<DashboardComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // {
        //   path: ADMINDASHBOARD,
        //   element: <DashboardComponent />,
        //   index: true,
        // },
        {
          path: INSTRUCTORS,
          element: (
            <PrivateRoute
              element={<InstructorsComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INSTRUCTORSID + "/:id",
          element: <InstructorDetailsTab />,
        },

        {
          path: EMPLOYEE,
          element: (
            <PrivateRoute
              element={<EmployeesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: INSTRUCTORS,
          element: <InstructorsComponent />,
        },
        {
          path: EMPLOYEEID + "/:id",
          element: <EmployeeDetails />,
        },
        {
          path: INDIVIDUAL,
          element: (
            <PrivateRoute
              element={<Individual />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INDIVIDUAL_DETAIL,
          element: <IndividualDetails />,
        },
        {
          path: COMPANY,
          element: (
            <PrivateRoute
              element={<Company />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: COMPANY_DETAIL,
          element: <CompanyDetails />,
        },
        {
          path: COMPANY_STARTUP_REGISTRATION,
          element: <CompanyWorkspaceForm />,
        },
        {
          path: COMPANY_WORKSPACE_EDIT,
          element: <CompanyWorkspaceForm />,
        },

        {
          path: INDIVIDUAL_STARTUP_REGISTRATION,
          element: <IndividualWorkSpaceForm />,
        },
        {
          path: INDIVIDUAL_WORKSPACE_EDIT,
          element: <IndividualWorkSpaceForm />,
        },

        {
          path: COMPANY_INDIVIDUAL,
          element: (
            <PrivateRoute
              element={<CompanyIndividual />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: COMPANY_INDIVIDUAL,
          element: (
            <PrivateRoute
              element={<CompanyIndividual />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: INDIVIDUAL_COMPANY_REGISTER,
          element: <IndividualCompanyForm />,
        },

        {
          path: INDIVIDUAL_COMPANY_DETAILS,
          element: <IndividualCompanyDetails />,
        },

        {
          path: MANAGE_WORKINGSPACE,
          element: <Managespaces />,
        },
        {
          path: WORKSPACES,
          element: <WorkspaceDetail />,
        },

        {
          path: CATEGORIES,
          element: (
            <PrivateRoute
              element={<CategoriesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // {
        //   path: CATEGORIES,
        //   element: <CategoriesComponent />,
        // },
        {
          path: COURSE_DETAIL,
          element: (
            <PrivateRoute
              element={<CourseDetail />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: COURSES,
          element: (
            <PrivateRoute
              element={<CoursesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: VISITORS,
          element: (
            <PrivateRoute
              element={<VisitorsComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: PROVINCES,
          element: (
            <PrivateRoute
              element={<ProvincesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: CITIES,
          element: (
            <PrivateRoute
              element={<CitiesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: BANKS,
          element: (
            <PrivateRoute
              element={<BanksComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          // Legacy "classes" routes now resolve to the Batches list —
          // Classes was renamed to Batches; keep deep links working.
          path: COURSE_CLASS,
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          // Per-batch student roster (still used by the student funnel).
          path: CLASS_STUDENTS,
          element: <ClassStudents />,
        },
        {
          path: CLASS_STUDENT_EDIT,
          element: <ClassStudentEdit />,
        },

        {
          path: BATCHES + "/:id",
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: ALLBATCHES,
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: BATCHES,
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // Create/edit now happen via modals inside the Batches list;
          // these legacy paths fall back to the list.
          path: BATCH_CREATE,
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: BATCH_EDIT,
          element: (
            <PrivateRoute
              element={<BatchesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: VISIT_PURPOSES,
          element: (
            <PrivateRoute
              element={<VisitPurposesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENTS,
          element: (
            <PrivateRoute
              element={<StudentsList />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: SETTINGS,
          element: (
            <PrivateRoute
              element={<Settings />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: RULES_REGULATIONS,
          element: (
            <PrivateRoute
              element={<RulesRegulationsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: QUIZ_ANALYTICS,
          element: (
            <PrivateRoute
              element={<QuizAnalyticsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: EMPLOYEE_ASSESSMENTS,
          element: (
            <PrivateRoute
              element={<EmployeeAssessmentAnalytics />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // HR module — Phase 0 wired routes
          path: HR_COMPANY_SETTINGS,
          element: (
            <PrivateRoute
              element={<CompanySettingsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_COMPANY_BRANDS,
          element: (
            <PrivateRoute
              element={<BrandsListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // 'new' must come before ':uuid' so React Router matches the literal first
          path: HR_COMPANY_BRAND_NEW,
          element: (
            <PrivateRoute
              element={<BrandFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_COMPANY_BRAND_EDIT,
          element: (
            <PrivateRoute
              element={<BrandFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_EMAIL_TEMPLATES,
          element: (
            <PrivateRoute
              element={<EmailTemplatesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_EMAIL_TEMPLATE_NEW,
          element: (
            <PrivateRoute
              element={<EmailTemplateFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_EMAIL_TEMPLATE_EDIT,
          element: (
            <PrivateRoute
              element={<EmailTemplateFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_CONTRACT_TEMPLATES,
          element: (
            <PrivateRoute
              element={<ContractTemplatesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_CONTRACT_TEMPLATE_NEW,
          element: (
            <PrivateRoute
              element={<ContractTemplateFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_CONTRACT_TEMPLATE_EDIT,
          element: (
            <PrivateRoute
              element={<ContractTemplateFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_APPROVAL_CHAINS,
          element: (
            <PrivateRoute
              element={<ApprovalChainsListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // 'new' must come before ':uuid' so router matches literal first
          path: HR_APPROVAL_CHAIN_NEW,
          element: (
            <PrivateRoute
              element={<ApprovalChainFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_APPROVAL_CHAIN_EDIT,
          element: (
            <PrivateRoute
              element={<ApprovalChainFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_APPROVAL_INBOX,
          element: (
            <PrivateRoute
              element={<ApprovalInboxPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 1.95 — HR > Employee Dashboard
        {
          path: HR_EMPLOYEE_DASHBOARD,
          element: (
            <PrivateRoute
              element={<HrEmployeeDashboard />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR > Dashboard (renamed from "Organization Summary" 2026-05-25)
        {
          path: HR_DASHBOARD,
          element: (
            <PrivateRoute
              element={<OrganizationSummaryPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 2 — HR > Schedules + Seasonal Overrides
        {
          path: HR_SCHEDULES,
          element: (
            <PrivateRoute
              element={<SchedulesPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 2 — HR > Attendance
        {
          path: HR_ATTENDANCE,
          element: (
            <PrivateRoute
              element={<AttendancePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR > Mark Attendance (fast daily roster)
        {
          path: HR_MARK_ATTENDANCE,
          element: (
            <PrivateRoute
              element={<MarkAttendancePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 3 — HR > Payroll Cycles list
        {
          path: HR_PAYROLL_CYCLES,
          element: (
            <PrivateRoute
              element={<PayrollCyclesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 3 — HR > Payroll Cycle detail (one cycle)
        {
          path: HR_PAYROLL_CYCLE_DETAIL,
          element: (
            <PrivateRoute
              element={<PayrollCycleDetailPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 4 — HR > Leave Requests inbox
        {
          path: HR_LEAVE_REQUESTS,
          element: (
            <PrivateRoute
              element={<LeaveRequestsInboxPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 4 — HR > Leave Types CRUD
        {
          path: HR_LEAVE_TYPES,
          element: (
            <PrivateRoute
              element={<LeaveTypesPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 6 — HR > Loans list
        {
          path: HR_LOANS,
          element: (
            <PrivateRoute
              element={<LoansListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 6 — HR > Loan detail (schedule + installment actions)
        {
          path: HR_LOAN_DETAIL,
          element: (
            <PrivateRoute
              element={<LoanDetailPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 6 — HR > Security Retention (per-employee config + holds)
        {
          path: HR_SECURITY_RETENTION,
          element: (
            <PrivateRoute
              element={<SecurityRetentionPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 4 — Me > My Leave (employee-facing)
        {
          path: ME_MY_LEAVE,
          element: (
            <PrivateRoute
              element={<MyLeavePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 2 — Me > Self-mark STP attendance (employee-facing)
        {
          path: ME_SELF_MARK_ATTENDANCE,
          element: (
            <PrivateRoute
              element={<SelfMarkAttendancePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // Phase 1.9 — HR > Employees
        {
          path: HR_EMPLOYEES,
          element: (
            <PrivateRoute
              element={<EmployeesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_EMPLOYEE_NEW,
          element: (
            <PrivateRoute
              element={<EmployeeFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // Edit must be registered BEFORE the catch-all :uuid detail
          // route, otherwise React Router matches /:uuid first and the
          // /edit suffix is interpreted as part of the uuid.
          path: HR_EMPLOYEE_EDIT,
          element: (
            <PrivateRoute
              element={<EmployeeFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_EMPLOYEE_DETAIL,
          element: (
            <PrivateRoute
              element={<EmployeeDetailPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR — org structure (Phase 1): departments / services / offices
        {
          // HR > Organisation structure — tabbed wrapper around
          // Departments and Services (Services is now an inner tab).
          path: HR_DEPARTMENTS,
          element: (
            <PrivateRoute
              element={<OrgStructurePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // HR > Teams — squads of employees (IT Solutions)
          path: HR_TEAMS,
          element: (
            <PrivateRoute
              element={<TeamsManagement />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Clients
          path: IT_CLIENTS,
          element: (
            <PrivateRoute
              element={<ClientsManagement />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Invoices
          path: IT_INVOICES,
          element: (
            <PrivateRoute
              element={<ClientInvoices />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Clients & Payments roll-up
          path: IT_CLIENT_PAYMENTS,
          element: (
            <PrivateRoute
              element={<ClientsAndPayments />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Projects list (opens a board per project)
          path: IT_PROJECTS,
          element: (
            <PrivateRoute
              element={<ProjectsList />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Project workspace (sprints + kanban tasks)
          path: IT_PROJECT_BOARD,
          element: (
            <PrivateRoute
              element={<ProjectWorkspace />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // IT Solutions > Team performance
          path: IT_TEAM_PERFORMANCE,
          element: (
            <PrivateRoute
              element={<TeamPerformance />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // 'new' must come before ':uuid' so router matches literal first
          path: HR_DEPARTMENT_NEW,
          element: (
            <PrivateRoute
              element={<DepartmentFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_DEPARTMENT_EDIT,
          element: (
            <PrivateRoute
              element={<DepartmentFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // HR_SERVICES now points at the same Org Structure wrapper —
          // the wrapper reads ?tab= and opens the Services pane.
          path: HR_SERVICES,
          element: (
            <PrivateRoute
              element={<OrgStructurePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_SERVICE_NEW,
          element: (
            <PrivateRoute
              element={<ServiceFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_SERVICE_EDIT,
          element: (
            <PrivateRoute
              element={<ServiceFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_OFFICES,
          element: (
            <PrivateRoute
              element={<OfficesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_OFFICE_NEW,
          element: (
            <PrivateRoute
              element={<OfficeFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_OFFICE_EDIT,
          element: (
            <PrivateRoute
              element={<OfficeFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR > Roles & Permissions (Phase 1)
        {
          path: HR_ROLES,
          element: (
            <PrivateRoute
              element={<RolesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          // literal /new must come BEFORE /:uuid so router matches it first
          path: HR_ROLE_NEW,
          element: (
            <PrivateRoute
              element={<RoleFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_ROLE_EDIT,
          element: (
            <PrivateRoute
              element={<RoleFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_PERMISSIONS,
          element: (
            <PrivateRoute
              element={<PermissionsListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR > Designations (Phase 1) — list page IS the Org Structure tabbed
        // wrapper at HR_DEPARTMENTS?tab=designations. The HR_DESIGNATIONS
        // route exists for deep linking + form navigation back-target only.
        {
          path: HR_DESIGNATIONS,
          element: (
            <PrivateRoute
              element={<DesignationsListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_DESIGNATION_NEW,
          element: (
            <PrivateRoute
              element={<DesignationFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_DESIGNATION_EDIT,
          element: (
            <PrivateRoute
              element={<DesignationFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // HR > Institutes — universities / colleges / schools catalog
        {
          path: HR_INSTITUTES,
          element: (
            <PrivateRoute
              element={<InstitutesListPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_INSTITUTE_NEW,
          element: (
            <PrivateRoute
              element={<InstituteFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: HR_INSTITUTE_EDIT,
          element: (
            <PrivateRoute
              element={<InstituteFormPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_SUMMARY,
          element: <StudentSummary />,
        },
        {
          path: COURSE_SUMMARY,
          element: <CourseSummary />,
        },
        {
          path: STARTUP_SUMMARY,
          element: <StartupSummary />,
        },
        {
          path: EMPLOYEE_SUMMARY,
          element: <EmployeeSummary />,
        },
        {
          path: USER_MANAGEMENT,
          element: <UserManagement />,
        },
        {
          path: STUDENT_MANAGEMENT,
          element: <StudentManagement />,
        },
        {
          path: REPORTS,
          element: <Reports />,
        },
        {
          path: WORKINGSPACE,
          element: (
            <PrivateRoute
              element={<WorkingSpace />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: COURSE,
          element: (
            <PrivateRoute
              element={<Course />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: EXPENSES,
          element: (
            <PrivateRoute
              element={<WsExpenses />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INCOME,
          element: (
            <PrivateRoute
              element={<CoursesExpenses />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: REFUND,
          element: (
            <PrivateRoute
              element={<Refund />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: WS_EXPENSE_DETAILS,
          element: (
            <PrivateRoute
              element={<ExpenseDetails type="workspace" />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: Course_EXPENSE_DETAILS,
          element: (
            <PrivateRoute
              element={<ExpenseDetails type="course" />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: INVENTORY,
          element: (
            <PrivateRoute
              element={<AssetsManager />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INVENTORYASSIGN,
          element: (
            <PrivateRoute
              element={<AssetsManager />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: TRAINING_INQUIRY,
          element: (
            <PrivateRoute
              element={<InquiriesComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // IMPORTANT: register /create BEFORE /:id/edit so static path wins.
        // React Router v6 matches by specificity automatically, but
        // keeping create above edit makes the intent obvious.
        {
          path: TRAINING_INQUIRY_CREATE,
          element: (
            <PrivateRoute
              element={<InquiryFormPage mode="add" />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TRAINING_INQUIRY_EDIT,
          element: (
            <PrivateRoute
              element={<InquiryFormPage mode="edit" />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TRAINING_INQUIRY_ENROLL,
          element: (
            <PrivateRoute
              element={<InquiryForm />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TRAINING_INQUIRY_COURSE,
          element: (
            <PrivateRoute
              element={<InquiryDetailPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TRAINING_INQUIRY_DETAILS,
          element: (
            <PrivateRoute
              element={<InquiryDetailView />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STARTUP_INQUIRY,
          element: (
            <PrivateRoute
              element={<StartupInquiry />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        // {
        //   path: STUDENTS,
        //   element: <StudentsComponent />,
        // },
        // {
        //   path: FEES,
        //   element: (
        //     <PrivateRoute
        //       element={<FeesComponent />}
        //       isAuthenticated={useCheckAuthToken}
        //     />
        //   ),
        // },
        {
          path: FEES,
          element: <FeesComponent />,
        },

        {
          path: ANNOUNCEMENTS,
          element: (
            <PrivateRoute
              element={<Announcements />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: APPLICANTS,
          element: (
            <PrivateRoute
              element={<ApplicantsComponent />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: RECEPTION_DASHBOARD,
          element: (
            <PrivateRoute
              element={<ReceptionDashboard />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_JOURNEY,
          element: (
            <PrivateRoute
              element={<StudentJourney />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: CERTIFICATE_APPLICATIONS,
          element: (
            <PrivateRoute
              element={<CertificateApplications />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: NEWSLETTER_SUBSCRIBERS,
          element: (
            <PrivateRoute
              element={<NewsletterSubscribers />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: REFERRAL_LEADERBOARD,
          element: (
            <PrivateRoute
              element={<ReferralLeaderboard />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: FINANCE_STATS,
          element: (
            <PrivateRoute
              element={<FinanceStats />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: EMPLOYEE_PAYOUTS,
          element: (
            <PrivateRoute
              element={<EmployeePayouts />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: PAYMENT_ACCOUNTS,
          element: (
            <PrivateRoute
              element={<PaymentAccounts />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: SCHOLARSHIP_PROGRAMS,
          element: (
            <PrivateRoute
              element={<ScholarshipPrograms />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: FEE_STATUS,
          element: (
            <PrivateRoute
              element={<FeeStatusList />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENTS_ON_BREAK,
          element: (
            <PrivateRoute
              element={<StudentsOnBreak />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_LOANS,
          element: (
            <PrivateRoute
              element={<StudentLoans />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: LEDGER_ACCOUNTS,
          element: (
            <PrivateRoute
              element={<LedgerAccounts />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: COMMISSIONS,
          element: (
            <PrivateRoute
              element={<Commissions />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: ALL_EXPENSES,
          element: (
            <PrivateRoute
              element={<AllExpenses />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: ALL_INCOME,
          element: (
            <PrivateRoute
              element={<AllIncome />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: DELETED_EXPENSES,
          element: (
            <PrivateRoute
              element={<DeletedExpenses />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: WHATSAPP_INBOX,
          element: (
            <PrivateRoute
              element={<WhatsAppInbox />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: BRAND_AMBASSADORS,
          element: (
            <PrivateRoute
              element={<BrandAmbassadors />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: FEE_COLLECTION,
          element: (
            <PrivateRoute
              element={<FeeCollection />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_ENROLL,
          element: (
            <PrivateRoute
              element={<EnrollStudentWizard />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_ADD,
          element: (
            <PrivateRoute
              element={<EnrollStudentWizard />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TECHSCHOOL_EMAIL_TEMPLATES,
          element: (
            <PrivateRoute
              element={
                <EmailTemplatesListPage
                  group="techschool"
                  title="TechSchool Email Templates"
                  subtitle="Emails sent to students, alumni and brand ambassadors. Edit subjects, bodies, and variables — preview against the Tech School brand."
                  editRoute={TECHSCHOOL_EMAIL_TEMPLATE_EDIT}
                  newRoute={TECHSCHOOL_EMAIL_TEMPLATE_NEW}
                />
              }
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TECHSCHOOL_EMAIL_TEMPLATE_NEW,
          element: (
            <PrivateRoute
              element={<EmailTemplateFormPage group="techschool" listRoute={TECHSCHOOL_EMAIL_TEMPLATES} />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: TECHSCHOOL_EMAIL_TEMPLATE_EDIT,
          element: (
            <PrivateRoute
              element={<EmailTemplateFormPage group="techschool" listRoute={TECHSCHOOL_EMAIL_TEMPLATES} />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: NOTIFICATIONS,
          element: (
            <PrivateRoute
              element={<NotificationPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: NOTIFICATIONS_LOG,
          element: (
            <PrivateRoute
              element={<NotificationsLogPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: NOTIFICATION_SETTINGS,
          element: (
            <PrivateRoute
              element={<NotificationSettingsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // {
        //   path: ANNOUNCEMENTS,
        //   element: <Announcements />,
        // },
        {
          path: PROFILE,
          element: (
            <PrivateRoute
              element={<AdminProfile />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        // {
        //   path: PROFILE,
        //   element: <AdminProfile />,
        // },
        {
          path: STUDENT_LEAVES,
          element: (
            <PrivateRoute
              element={<StudentLeavesPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_COMPLAINTS,
          element: (
            <PrivateRoute
              element={<StudentComplaintsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: EMPLOYEE_COMPLAINTS,
          element: (
            <PrivateRoute
              element={<StudentComplaintsPage channel="employee" title="Employee Complaints" />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT_LAPTOPS,
          element: (
            <PrivateRoute
              element={<StudentLaptops />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: BATCH_ATTENDANCE,
          element: (
            <PrivateRoute
              element={<BatchAttendancePage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: ADMIN_MAKEUPS,
          element: (
            <PrivateRoute
              element={<MakeupsPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENT + "/:id",
          element: (
            <PrivateRoute
              element={<StudentDetailPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: ENROLL_STUDENT,
          element: (
            <PrivateRoute
              element={<StudentForm />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: STUDENTS_EDIT,
          element: (
            <PrivateRoute
              element={<EditStudentPage />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: EMPLOYEES_ADD,
          element: (
            <PrivateRoute
              element={<AddEmployee />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: EMPLOYEES_EDIT,
          element: (
            <PrivateRoute
              element={<AddEmployee />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: INSTRUCTORS_ADD,
          element: (
            <PrivateRoute
              element={<AddEmployee />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: INSTRUCTORS_EDIT,
          element: (
            <PrivateRoute
              element={<AddEmployee />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: ATTENDANCE,
          element: (
            <PrivateRoute
              element={<AttendanceMarkSection />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INVENTORY_SUMMARY,
          element: (
            <PrivateRoute
              element={<AssetsManager />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: MEMBERS,
          element: <CompanyIndividual />,
        },
      ],
    },
    {
      path: SIGNIN,
      // element: (
      // <PublicRoutes
      element: <SignInHero />,
      //   isAuthenticated={useCheckAuthToken}
      // />
      // ),
    },
    // {
    //   path: SIGNIN,
    //   element: <SignInHero />,
    // },
    {
      path: SIGNUP,
      // element: (
      //   <PublicRoutes
      element: <SignUpHero />,
      //     isAuthenticated={useCheckAuthToken}
      //   />
      // ),
    },
    // {
    //   path: SIGNUP,
    //   element: <SignUpHero />,
    // },

    {
      path: FORGET,
      element: (
        <PublicRoutes
          element={<ForgetComponent />}
          isAuthenticated={useCheckAuthToken}
        />
      ),
    },
    // {
    //   path: FORGET,
    //   element: <ForgetComponent />,
    // },
    {
      path: RESET,
      element: <ResetComponent />,
    },

    {
      path: OTP,
      element: (
        <PublicRoutes
          element={<OtpComponent />}
          isAuthenticated={useCheckAuthToken}
        />
      ),
    },
    // {
    //   path: OTP,
    //   element: <OtpComponent />,
    // },
    {
      path: NEWPASSWORD,
      element: (
        <PublicRoutes
          element={<NewPasswordComponent />}
          isAuthenticated={useCheckAuthToken}
        />
      ),
    },
    // {
    //   path: NEWPASSWORD,
    //   element: <NewPasswordComponent />,
    // },

    /* -------- Student portal (separate student-facing surface) -------- */
    { path: PORTAL_LOGIN, element: <PortalLogin /> },
    {
      path: PORTAL,
      element: <PortalLayout />,
      children: [
        { index: true, element: <PortalDashboard /> },
        { path: PORTAL_ATTENDANCE, element: <PortalAttendance /> },
        { path: PORTAL_ASSIGNMENTS, element: <PortalAssignments /> },
        { path: PORTAL_CONTENT, element: <PortalContent /> },
        { path: PORTAL_FEES, element: <PortalFees /> },
        { path: PORTAL_ASSETS, element: <PortalAssets /> },
        { path: PORTAL_LEAVES, element: <PortalLeaves /> },
        { path: PORTAL_COMPLAINTS, element: <PortalComplaints /> },
        { path: PORTAL_MAKEUPS, element: <PortalMakeups /> },
        { path: PORTAL_ANNOUNCEMENTS, element: <PortalAnnouncements /> },
        { path: PORTAL_REWARDS, element: <PortalRewards /> },
        { path: PORTAL_PROFILE, element: <PortalProfile /> },
        { path: PORTAL_RULES, element: <RulesView endpoint="/core/policies/for-students" /> },
        { path: PORTAL_CAREER, element: <PortalCareerPath /> },
        { path: PORTAL_QUIZ, element: <PortalQuiz /> },
      ],
    },

    /* -------- Teacher portal (separate teacher-facing surface) -------- */
    { path: TEACHER_LOGIN, element: <TeacherLogin /> },
    {
      path: TEACHER,
      element: <TeacherLayout />,
      children: [
        { index: true, element: <TeacherDashboard /> },
        { path: TEACHER_ATTENDANCE, element: <TeacherAttendance /> },
        { path: TEACHER_ASSIGNMENTS, element: <TeacherAssignments /> },
        { path: TEACHER_CONTENT, element: <TeacherContent /> },
        { path: TEACHER_PERFORMANCE, element: <TeacherPerformance /> },
        { path: TEACHER_STUDENTS, element: <TeacherStudents /> },
        { path: TEACHER_MAKEUPS, element: <TeacherMakeups /> },
        { path: TEACHER_ANNOUNCEMENTS, element: <TeacherAnnouncements /> },
        { path: TEACHER_REWARDS, element: <TeacherRewards /> },
        { path: TEACHER_EMPLOYMENT, element: <TeacherEmployment /> },
        { path: TEACHER_EMPLOYMENT + "/:section", element: <TeacherEmployment /> },
        { path: TEACHER_COMPLAINTS, element: <TeacherComplaints /> },
        { path: TEACHER_RULES, element: <RulesView endpoint="/core/policies/for-employees" /> },
        { path: TEACHER_ASSESSMENT, element: <TeacherAssessment /> },
      ],
    },

    /* Back-compat: old /teacher-portal URLs redirect to /staff-portal. */
    { path: "/teacher-portal", element: <Navigate to="/staff-portal" replace /> },
    { path: "/teacher-portal/*", element: <LegacyTeacherPortalRedirect /> },

    /* Catch-all: unknown URLs land the user on their own dashboard. */
    { path: "*", element: <RoleHomeRedirect /> },
  ]);
  return (
    <Suspense
      fallback={
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
      }
    >
      {routes}
    </Suspense>
  );
}
