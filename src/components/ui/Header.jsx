// Header.jsx - Fixed
import React, { useState } from "react";
import PlusIcon from "../../assets/icons/Plus";
import DeleteAllBin from "../../assets/icons/DeleteAllBin";
import EditProfile from "../../assets/images/profile/editProfile.png";
import FeeShare from "../../assets/images/fee/FeeShare.png";
import Select from "react-select";
import { FaPlus } from "react-icons/fa";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuery } from "../../api/apiSlice";
import InventoryActions from "./InventoryActions";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import WorkspaceActions from "../spaces/manageSpaces/components/WorkspaceActions";

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
  const handleEditClick = () => {
    if (buttontitle === "Edit") {
      setIsEditMode(true);
    }
  };
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const role = user?.role;



  return (
    <div className="flex justify-between custom-Background mt-5 mb-2 px-4 h-[4.37rem] rounded-[20px] items-center">
      <div className="flex items-center justify-center gap-x-2">
        <div className="relative">
          <div className="text-white ">{icon}</div>
          {(batchButton === "category" ||
            batchButton === "course" ||
            batchButton === "batch" ||
            batchButton === "employee" ||
            batchButton === "instructor" ||
            batchButton === "student") && (
            <div
              className={`absolute  ${
                batchButton === "category" && " bottom-5 left-4"
              } ${batchButton === "course" && " bottom-6 left-5"}  ${
                batchButton === "batch" && " bottom-5 left-4 "
              } ${batchButton === "employee" && " bottom-5 left-4"}  ${
                batchButton === "instructor" && " bottom-5 left-4"
              }${
                batchButton === "student" && " bottom-6 left-4"
              }tracking-wide rounded-full flex items-center justify-center w-4 h-4  bg-white font-poppins text-[10px] font-bold  `}
            >
              <span>{TotalCategories ? TotalCategories : 0}</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-semibold text-white font-poppins">
          {title}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isMultipleSelected && (
          <div
            onClick={() => {
              setIsBulkDeleteModalOpen(true);
            }}
          >
            {/* <DeleteAllBin /> */}
          </div>
        )}
        
        {sourceComponent === "Inventory" && (
          <div className="flex items-center gap-3">
            <InventoryActions title="Categories" />
            <InventoryActions title="Types" />
          </div>
        )}
         {sourceComponent === "Workspace" && (
          <div className="flex items-center gap-3">
            <WorkspaceActions title="Categories" />
            <WorkspaceActions title="Types" />
          </div>
        )}
          {title === "Company Working Space" && (
          <div className="flex items-center gap-3">
            <button 
             onClick={() => navigate("/dashboard/working-spaces/company/members/add")}
            className="bg-white text-brown p-2 rounded-lg">
               Members
            </button>
          </div>
        )}
             {title === "Attendance" && (
          <div className="flex items-center gap-3">
         
            <Select
              className="w-48"
              onChange={handleBatchChange}
              options={batchesOptions}
              styles={customStyles}
              placeholder="Batch Name"
            />
          </div>
        )}
        {title === "Attendance" && (
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={markAttendanceDate}
              onChange={handleMarkAttendanceDateChange}
              className="focus:outline-none border-none border-2 rounded-[10px] w-48 px-2 py-2"
            />
          </div>
        )}
        {isAttendanceDetailsTab && (
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="focus:outline-none border-none border-2 rounded-[10px] w-48 px-2 py-2"
          />
        )}
        {sourceComponent === "BatchesComponent" && setIsCreateBatchConfirmModalOpen &&(
          <button
            className="text-brown bg-white text-sm font-poppins font-semibold py-3 px-5 flex items-center gap-2 rounded-[10px] transform transition-transform duration-300 ease-in-out hover:scale-105 hover:text-base"
            onClick={() => setIsCreateBatchConfirmModalOpen(true)}
          >
            Add new batch
          </button>
        )}
        {showActionButton && role !== "receptionist" && (
          <button
            className="text-brown bg-white text-sm font-poppins font-semibold py-3 px-5 flex items-center gap-2 rounded-[10px] transform transition-transform duration-300 ease-in-out hover:scale-105 hover:text-base"
            onClick={() => {
              if (buttontitle === "Edit") {
                handleEditClick();
              } else if (buttontitle === true) {
                setFeeTab(true);
              } else if (buttontitle === "Submit") {
                handleSubmitAttendance();
              } else if (setIsCreateModalOpen) {
                setIsCreateModalOpen(true);
              } else {
                if (sourceComponent === "StudentsComponent") {
                  navigate("/dashboard/students/enroll");
                } else if (sourceComponent === "Courses") {
                  navigate("/courses/add");
                } else if (sourceComponent === "Categories") {
                  navigate("/categories/add");
                } else if (sourceComponent === "BatchesComponent") {
                  navigate("/dashboard/batches/create");
                } else if (
                  sourceComponent === "InstructorsComponent"
                ) {
                  navigate("/dashboard/smes/add");
                } else if (sourceComponent === "EmployeesComponent") {
                  navigate("/dashboard/employees/add");
                }
                else if (sourceComponent === "ClassStudents") {a
                  navigate("/dashboard/students/enroll");
                }
                   else if (sourceComponent === "company") {
                  navigate("/dashboard/working-spaces/company/register");
                }
                 else if (sourceComponent === "individual") {
                  navigate("/dashboard/working-spaces/individual/register");
                }
                 else if (sourceComponent === "CompanyIndividual") {
                  navigate("/dashboard/working-spaces/company-individual/register");
                }
              }
            }}
          >
            {buttontitle}
            {buttontitle === "Edit" && <Pencil size={16} />}
            {buttontitle === true && (
              <img src={FeeShare} alt="feeshare" className="w-6 " />
            )}
            {buttontitle === "Add New" && <FaPlus className="text-brown" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;