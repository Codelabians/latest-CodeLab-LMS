/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import ArrowImage from "../../../assets/images/forget/arrow.png";
import { STUDENTS } from "../../routes/RouteConstants";
import BulkDeleteModal from "../../ui/BulkDeleteModal";
import Header from "../../ui/Header";
import StudentAttendanceTab from "./StudentAttendanceTab";
import StudentBatchTab from "./StudentBatchTab";
import StudentDetailsTab from "./StudentDetailsTab";
import StudentFeeTab from "./StudentFeeTab";

const StudentDetails = () => {
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Student Details");
  const [options, setOptions] = useState({});
  const [dateFilter, setDateFilter] = useState("");
  const [post, { isLoading }] = usePostMutation();

  const { id } = useParams();

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const {
    data: studentData,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudent,
  } = useGetQuery(
    id
      ? {
          path: `/admin/student/${id}`,
        }
      : null,
    {
      skip: !id,
    },
  );

  useEffect(() => {
    refetchStudent();
  }, []);

  const navigate = useNavigate();
  // get batch data all
  // const {
  //   data: studentBatchData,
  //   error: studentBatchError,
  //   isLoading: studentBatchIsLoading,
  //   refetch: refetchStudentsBatch,
  // } = useGetQuery({
  //   path: `/admin/student-batches/${id}`,
  // });

  const {
    data: batchData,
    error: batchError,
    isLoading: batchIsLoading,
    refetch: refetchBatches,
  } = useGetQuery({
    path: "/admin/batches",
  });

  useEffect(() => {
    if (batchData) {
      const transformedOptions = batchData.data.map((item) => ({
        value: item.class_id,
        label: item.name,
      }));
      setOptions(transformedOptions);
    }
  }, [batchData]);

  const handleTabClick = (buttonType) => {
    setActiveTab(buttonType);
  };

  const handleBulkDeleteConfirm = () => {
    console.log("All selected items deleted successfully");
  };

  return (
    <div className="w-11/12 mx-auto">
      <Header
        title="Students"
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        showActionButton={activeTab === "Batch Details" ? true : false}
        setIsCreateModalOpen={setIsCreateModalOpen}
        isAttendanceDetailsTab={
          activeTab === "Attendance Details" ? true : false
        }
        dateFilter={dateFilter}
        handleDateFilterChange={handleDateFilterChange}
      />
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between mb-6 ">
          <div>
            <button
              className={`bg-slate-100 w-36 py-2  font-semibold rounded-l-lg ${
                activeTab === "Student Details" ? "custom-color text-white" : ""
              }`}
              onClick={() => handleTabClick("Student Details")}
            >
              Student Details
            </button>
            <button
              className={`bg-slate-100 w-36 py-2 font-semibold border-x border-x-slate-300 ${
                activeTab === "Fee Details" ? "custom-color text-white" : ""
              }`}
              onClick={() => handleTabClick("Fee Details")}
            >
              Fee Details
            </button>
            <button
              className={`bg-slate-100 w-36 py-2 font-semibold border-r border-slate-300 ${
                activeTab === "Class Details" ? "custom-color text-white" : ""
              }`}
              onClick={() => handleTabClick("Class Details")}
            >
              Class Details
            </button>
            {/* <button
              className={`bg-slate-100 w-44 py-2  font-semibold rounded-r-lg ${
                activeTab === "Attendance Details"
                  ? "custom-color text-white"
                  : ""
              }`}
              onClick={() => handleTabClick("Attendance Details")}
            >
              Attendance Details
            </button> */}
          </div>

          <button onClick={() => navigate(-1)} className="cursor-pointer">
            <img src={ArrowImage} alt="back button" />
          </button>
        </div>
        {activeTab === "Student Details" && <StudentDetailsTab />}
        {activeTab === "Fee Details" && <StudentFeeTab />}
        {activeTab === "Class Details" && (
          <StudentBatchTab
            setIsCreateModalOpen={setIsCreateModalOpen}
            isCreateModalOpen={isCreateModalOpen}
          />
        )}
        {activeTab === "Attendance Details" && (
          <StudentAttendanceTab dateFilter={dateFilter} />
        )}
      </div>
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        setIsOpen={setIsBulkDeleteModalOpen}
        message="Are you sure you want to delete all the selected batches?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => console.log("Bulk delete modal closed")}
        successMessage="Deleted Successfully!"
      />
    </div>
  );
};

export default StudentDetails;
