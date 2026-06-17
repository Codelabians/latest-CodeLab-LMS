import React from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import WorkspaceActions from "../spaces/manageSpaces/components/WorkspaceActions";
import FeeShare from "../../assets/images/fee/FeeShare.png";

const batchSelectStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#fef2f2" : "white",
    color: "#1a0505",
    fontSize: "13px",
  }),
  control: (provided) => ({
    ...provided,
    minHeight: "36px",
    height: "36px",
    backgroundColor: "white",
    borderRadius: "10px",
    fontSize: "13px",
    boxShadow: "none",
    border: "1px solid rgba(255,255,255,0.3)",
    cursor: "pointer",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "36px",
    padding: "0 10px",
  }),
  input: (provided) => ({ ...provided, margin: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (provided) => ({ ...provided, height: "36px" }),
  placeholder: (provided) => ({ ...provided, fontSize: "13px", color: "#9ca3af" }),
  menu: (provided) => ({ ...provided, borderRadius: "10px", zIndex: 9999 }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
};

/* ── Shared action button style ── */
const ActionButton = ({ onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold
                transition-all duration-150 active:scale-95 ${className}`}
  >
    {children}
  </button>
);

const Header = ({
  icon,
  title,
  setIsCreateModalOpen,
  isMultipleSelected,
  setIsBulkDeleteModalOpen,
  showActionButton = true,
  buttontitle = "Add New",
  setIsEditMode,
  batchButton = null,
  TotalCategories,
  setFeeTab,
  batchesOptions = [],
  handleBatchChange = () => {},
  isAttendanceDetailsTab = false,
  markAttendanceDate = "",
  handleMarkAttendanceDateChange = () => {},
  dateFilter = "",
  handleDateFilterChange = () => {},
  handleSubmitAttendance = () => {},
  sourceComponent = "",
  handleCategoryChange = () => {},
  handleTypeChange = () => {},
  setIsCreateBatchConfirmModalOpen,
}) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const role = user?.role;

  const handleEditClick = () => {
    if (buttontitle === "Edit") setIsEditMode(true);
  };

  const handleMainButtonClick = () => {
    if (buttontitle === "Edit") {
      handleEditClick();
    } else if (buttontitle === true) {
      setFeeTab(true);
    } else if (buttontitle === "Submit") {
      handleSubmitAttendance();
    } else if (setIsCreateModalOpen) {
      setIsCreateModalOpen(true);
    } else {
      if (sourceComponent === "StudentsComponent") navigate("/dashboard/students/add");
      else if (sourceComponent === "Courses") navigate("/courses/add");
      else if (sourceComponent === "Categories") navigate("/categories/add");
      else if (sourceComponent === "BatchesComponent") navigate("/dashboard/batches/create");
      else if (sourceComponent === "InstructorsComponent") navigate("/dashboard/smes/add");
      else if (sourceComponent === "EmployeesComponent") navigate("/dashboard/employees/add");
      else if (sourceComponent === "ClassStudents") navigate("/dashboard/students/add");
      else if (sourceComponent === "company") navigate("/dashboard/working-spaces/company/register");
      else if (sourceComponent === "individual") navigate("/dashboard/working-spaces/individual/register");
      else if (sourceComponent === "CompanyIndividual") navigate("/dashboard/working-spaces/company-individual/register");
    }
  };

  return (
    <div className="flex justify-between items-center bg-[#aa0e0e] mt-5 mb-2 px-5 h-[4.25rem] rounded-2xl">

      {/* Left: icon + title + count badge */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/10">
          <span className="text-white [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
          {(batchButton === "category" ||
            batchButton === "course" ||
            batchButton === "batch" ||
            batchButton === "employee" ||
            batchButton === "instructor" ||
            batchButton === "student") && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#aa0e0e] text-[9px] font-bold flex items-center justify-center shadow-sm">
              {TotalCategories ?? 0}
            </span>
          )}
        </div>
        <h1 className="text-[15px] font-semibold text-white tracking-wide">
          {title}
        </h1>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">

        {isMultipleSelected && (
          <ActionButton
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Trash2 size={14} />
          </ActionButton>
        )}

        {sourceComponent === "Workspace" && (
          <>
            <WorkspaceActions title="Categories" />
            <WorkspaceActions title="Types" />
          </>
        )}

        {title === "Company Working Space" && (
          <ActionButton
            onClick={() => navigate("/dashboard/working-spaces/company/members/add")}
            className="bg-white text-[#aa0e0e] hover:bg-red-50"
          >
            <Users size={14} />
            Members
          </ActionButton>
        )}

        {title === "Attendance" && (
          <Select
            className="w-48"
            onChange={handleBatchChange}
            options={batchesOptions}
            styles={batchSelectStyles}
            placeholder="Batch Name"
            menuPortalTarget={document.body}
          />
        )}

        {title === "Attendance" && (
          <input
            type="date"
            value={markAttendanceDate}
            onChange={handleMarkAttendanceDateChange}
            className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/50 w-44"
          />
        )}

        {isAttendanceDetailsTab && (
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-white/30 w-44"
          />
        )}

        {sourceComponent === "BatchesComponent" && setIsCreateBatchConfirmModalOpen && (
          <ActionButton
            onClick={() => setIsCreateBatchConfirmModalOpen(true)}
            className="bg-white text-[#aa0e0e] hover:bg-red-50"
          >
            <Plus size={14} />
            Add new batch
          </ActionButton>
        )}

        {showActionButton && role !== "receptionist" && (
          <ActionButton
            onClick={handleMainButtonClick}
            className="bg-white text-[#aa0e0e] hover:bg-red-50"
          >
            {buttontitle === "Edit" && <Pencil size={13} />}
            {buttontitle === true && <img src={FeeShare} alt="fee" className="w-4" />}
            {buttontitle === "Add New" && <Plus size={14} />}
            <span>{buttontitle === true ? "Fee" : buttontitle}</span>
          </ActionButton>
        )}
      </div>
    </div>
  );
};

export default Header;