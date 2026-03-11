import { useEffect, useState } from "react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import Header from "../ui/Header";
import Table from "../ui/Table";
const AttendanceMarkSection = () => {
  const [options, setOptions] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState("");
  const [batchStudents, setBatchStudents] = useState([]);
  const [markedAttendanceArray, setMarkedAttendanceArray] = useState([]); // State for marked attendance
  const [postAttendance] = usePostMutation();
  const {
    data: classesData,
    error: BatchesError,
    isLoading: BatchesLoading,
    refetch: refetchBatches,
  } = useGetQuery({
    path: "/admin/classes",
    params: {
      per_page: 1000,
    },
  });
  const {
    data: classData,
    error: batchError,
    isLoading: batchLoading,
  } = useGetQuery(
    selectedBatch
      ? {
          path: `/admin/class/${selectedBatch.value}`,
        }
      : null,
    {
      skip: !selectedBatch,
    }
  );

  const {
    data: attendance,
    error,
    isLoading,
  } = useGetQuery({
    path: "/admin/attendences",
  });

  const formattedAttendance = attendance?.data?.map((atten) => ({
    id: atten.id,
    name: atten.student_name,
    date: atten.date,
    attendance: atten.present_status,
  }));

  useEffect(() => {
    if (classData?.data?.students) {
      const transformedStudents = classData.data.students.map((user) => ({
        id: user.id,
        name: user.name,
        date: selectedAttendanceDate,
      }));
      setBatchStudents(transformedStudents);
    }
  }, [classData, selectedAttendanceDate]);

  useEffect(() => {
    if (classesData) {
      const transformedOptions = classesData.data.map((item) => ({
        id: item.class_id,
        value: item.batch_uuid,
        label: item.name,
      }));
      setOptions(transformedOptions);
    }
  }, [classesData]);
  const handleBatchChange = (selectedOption) => {
    setSelectedBatch(selectedOption);
  };
  const handleDateChange = (e) => {
    setSelectedAttendanceDate(e.target.value);
  };

  // Function to update the markedAttendanceArray from AttendanceStatus component
  const updateMarkedAttendance = (newAttendanceRecord) => {
    setMarkedAttendanceArray((prevArray) => [
      ...prevArray,
      newAttendanceRecord,
    ]);
  };
  const handleSubmitAttendance = async () => {
    if (!selectedBatch || !selectedAttendanceDate) {
      showToast("Batch and date are required", "error");
      return;
    }

    const attendancePayload = {
      students: markedAttendanceArray,
      date: selectedAttendanceDate,
      class_id: selectedBatch.id,
    };

    try {
      const response = await postAttendance({
        path: "/admin/attendence/create",
        body: attendancePayload, // Submit the accumulated attendance array
      }).unwrap();
      if (response.message === "Success." && response.status === 1) {
        showToast("Attendance marked successfully", "success");
      }
    } catch (err) {
      console.error("Failed to mark attendance", err);
      showToast("Failed to mark attendance", "error");
    }
  };

  return (
    <div className="w-11/12 mx-auto">
      <Header
        title="Attendance"
        showActionButton={true}
        buttontitle="Submit"
        batchesOptions={options}
        handleBatchChange={handleBatchChange}
        markAttendanceDate={selectedAttendanceDate}
        handleMarkAttendanceDateChange={handleDateChange}
        handleSubmitAttendance={handleSubmitAttendance} // Pass the submission handler
      />
      {batchLoading && <div>Loading Batch Data...</div>}
      {batchError && <div>Error loading Batch Data</div>}
      {!batchLoading && !batchError && (
        <Table
          columns={["Name", "Date", "Attendance"]}
          // data={batchStudents}
          data={formattedAttendance}
          TableHeadingAction={false}
          sourceComponent="AttendanceMarkSection"
          markAttendanceDate={selectedAttendanceDate}
          updateMarkedAttendance={updateMarkedAttendance} // Pass the state update function
        />
      )}
    </div>
  );
};
export default AttendanceMarkSection;
