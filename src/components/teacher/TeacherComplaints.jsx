import PortalComplaints from "../portal/PortalComplaints";

/**
 * Staff-portal complaints — the same thread UI as the student portal,
 * pointed at the employee channel with workplace grievance categories.
 */
const EMPLOYEE_CATEGORIES = [
  { value: "payroll", label: "Salary / payroll" },
  { value: "workload", label: "Workload / hours" },
  { value: "harassment", label: "Harassment / misconduct" },
  { value: "management", label: "Management" },
  { value: "colleague", label: "Colleague issue" },
  { value: "facilities", label: "Facilities / equipment" },
  { value: "hr", label: "HR / policies" },
  { value: "other", label: "Other" },
];

export default function TeacherComplaints() {
  return (
    <PortalComplaints
      basePath="/teacher/me/complaints"
      categories={EMPLOYEE_CATEGORIES}
      intro="Raise a workplace issue — salary, workload, harassment, management and more. You can attach files and submit anonymously."
    />
  );
}
