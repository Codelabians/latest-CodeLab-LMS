import { Navigate, useRoutes } from "react-router-dom";
import { useCheckAuthToken } from "../../hooks/useCheckAuthToken";
import Inventory from "../../inventory/Inventory";
import InventorySummary from "../../inventory/InventorySumary";
import PrivateRoute from "../../utils/PrivateRoutes";
import PublicRoutes from "../../utils/PublicRoutes";
import AttendanceMarkSection from "../AttendanceSection/AttendanceMarkSection";
import Reports from "../Reports/Reports";
import UserManagement from "../UserManagement/UserManagement";
import DashboardComponent from "../adminDashboard/DashboardComponent";
import Announcements from "../announcements/Announcements";
import SignInHero from "../auth/SignIn/SignInHero";
import SignUpHero from "../auth/SignUp/SignUpHero";
import ForgetComponent from "../auth/forget/ForgetComponent";
import NewPasswordComponent from "../auth/newpassword/NewPasswordComponent";
import OtpComponent from "../auth/otpcode/OtpComponent";
import ResetComponent from "../auth/reset/ResetComponent";
import AddBatch from "../batches/components/AddClass";
import CategoriesComponent from "../categories/CategoriesComponent";
import CourseSummary from "../courses/CourseSummary";
import CoursesComponent from "../courses/CoursesComponent";
import DashboardLayout from "../dashboard/DashboardLayout";
import EmployeeSummary from "../employees/EmployeeSummary";
import AddEmployee from "../employees/components/AddEmployee";
import EmployeeDetails from "../employees/employeeDetailsPages/EmployeeDetails";
import CoursesExpenses from "../expenses/CoursesExpenses";
import WsExpenses from "../expenses/WsExpenses";
import ExpenseDetails from "../expenses/components/ExpenseModal";
import FeesComponent from "../fees/FeesComponent";
import FinanceSummary from "../finance/FinanceSummary";
import Course from "../finance/courses/Course";
import WorkingSpace from "../finance/workingspace/WorkingSpace";
import StartupInquiry from "../inquiry/StartupInquiry";
import TrainingInquiry from "../inquiry/trainingInquiry/TrainingInquiry";
import InstructorsComponent from "../instructors/InstructorsComponent";
import InstructorDetailsTab from "../instructors/instructorDetailsPages/InstructorDetailsTab";
import AdminProfile from "../profile/AdminProfile";
import StartupSummary from "../spaces/StartupSummary";
import Company from "../spaces/company/Company";
import CompanyDetails from "../spaces/company/CompanyDetails";
import Individual from "../spaces/individual/Individual";
import IndividualDetails from "../spaces/individual/components/IndividualDetails";
import Managespaces from "../spaces/manageSpaces/Managespaces";
import StudentSummaryPage from "../students/StudentSummaryPage";
import StudentsComponent from "../students/StudentsComponent";
import StudentForm from "../students/addStudentModal/StudentForm.";
import StudentDetails from "../students/studentDetailsPages/StudentDetails";
import {
  ADMINDASHBOARD,
  ANNOUNCEMENTS,
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
  Course_EXPENSE_DETAILS,
  COURSE_STUDENTS,
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
  FINANCE_SUMMARY,
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
  INVENTORY_ITEMS,
  INVENTORY_SUMMARY,
  MANAGE_WORKINGSPACE,
  MEMBERS,
  NEWPASSWORD,
  NOTIFICATIONS,
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
  STUDENTS,
  STUDENTS_EDIT,
  TRAINING_INQUIRY,
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
} from "./RouteConstants";
import InquiryDetailPage from "../inquiry/trainingInquiry/InquiryDetailPage";
import InquiryDetailView from "../inquiry/trainingInquiry/InquiryDetailView";
import CourseStudentsPage from "../courses/components/CourseStudents";
import EmployeesComponent from "../employees/EmployeesComponent";
import ClassesComponent from "../batches/ClassesComponent";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import InventoryItems from "../../inventory/components/InventoryItems";
import ClassStudents from "../batches/components/utils/ClassStudents";
import ClassStudentEdit from "../batches/components/ClassStudentEdit";
import InquiryForm from "../inquiry/trainingInquiry/InquiryForm";
import NotificationPage from "../dashboard/Notification";
import IndividualWorkSpaceForm from "../spaces/individual/components/IndividualWorkSpaceForm";
import CompanyWorkspaceForm from "../spaces/component/CompanyWorkspaceForm";
import CompanyIndividual from "../spaces/company-individual/CompanyIndividual";
import IndividualCompanyForm from "../spaces/company-individual/components/IndividualCompanyForm";
import IndividualCompanyDetails from "../spaces/company-individual/components/IndividualCompanyDetails";
import WorkspaceDetail from "../spaces/Workspace";
import AssignInventory from "../../inventory/AssignInventory";
import Refund from "../finance/refund/Refund";
import StudentManagement from "../StudentManagement/StudentManagement";
import Settings from "../settings/Settings";
import BatchesComponent from "../batches/BatchesComonent";

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
          path: COURSES + "/:id",
          element: (
            <PrivateRoute
              element={<CoursesComponent />}
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
          path: COURSE_CLASS,
          element: <ClassesComponent />,
        },

        {
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
              element={<ClassesComponent />}
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
          element: <ClassesComponent />,
        },
        {
          path: BATCH_CREATE,
          element: <AddBatch />,
        },
        {
          path: BATCH_EDIT,
          element: <AddBatch />,
        },
        {
          path: STUDENTS,
          element: (
            <PrivateRoute
              element={<StudentsComponent />}
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
          path: STUDENT_SUMMARY,
          element: <StudentSummaryPage />,
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
          path: FINANCE_SUMMARY,
          element: <FinanceSummary />,
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
              element={<Inventory />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INVENTORYASSIGN,
          element: (
            <PrivateRoute
              element={<AssignInventory />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },
        {
          path: INVENTORY_ITEMS,
          element: (
            <PrivateRoute
              element={<InventoryItems />}
              isAuthenticated={useCheckAuthToken}
            />
          ),
        },

        {
          path: TRAINING_INQUIRY,
          element: (
            <PrivateRoute
              element={<TrainingInquiry />}
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
          path: NOTIFICATIONS,
          element: (
            <PrivateRoute
              element={<NotificationPage />}
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
          path: STUDENT + "/:id",
          element: (
            <PrivateRoute
              element={<StudentDetails />}
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
              element={<StudentForm />}
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
              element={<InventorySummary />}
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
  ]);
  return routes;
}
