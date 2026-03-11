import React, { useEffect, useState } from "react";
import CloseIcon from "../../assets/icons/Close";
const AttendanceStatus = ({
  studentId,
  markAttendanceDate,
  updateMarkedAttendance, // Receive the function to update markedAttendanceArray in parent
}) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (selectedStatus === "present" || selectedStatus === "absent") {
      const attendanceRecord = {
        id: studentId,
        present_status: selectedStatus,
        date: markAttendanceDate,
        note: "",
      };
      updateMarkedAttendance(attendanceRecord); // Update the parent state with the new record
    }
  }, [markAttendanceDate, selectedStatus, studentId]);

  const handleStatusChange = (event) => {
    const status = event.target.value;

    if (status === "leave") {
      setSelectedStatus("leave");
      setIsNoteModalOpen(true);
    } else {
      setSelectedStatus(status);
    }
  };

  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
  };

  const handleConfirm = () => {
    const attendanceRecord = {
      id: studentId,
      present_status: selectedStatus,
      date: markAttendanceDate,
      note: note,
    };
    updateMarkedAttendance(attendanceRecord); // Update the parent state with the new record
    setIsNoteModalOpen(false);
  };
  return (
    <>
      {isNoteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[33rem] ">
            <div className="flex justify-end">
              <button onClick={closeNoteModal}>
                <CloseIcon />
              </button>
            </div>
            <p className="text-3xl py-5 font-medium font-poppins text-center">
              Add Note
            </p>
            <div className="flex justify-center mb-8 mt-5">
              <textarea
                className="w-full h-64 p-4 border border-grayBorder rounded-xl"
                placeholder="Reason"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex justify-center gap-3 mb-2">
              <button
                onClick={handleConfirm}
                className="custom-AddButton text-white py-2 px-6 rounded-lg font-semibold font-poppins text-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        {/* Present */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="attendance"
            value="present"
            checked={selectedStatus === "present"}
            onChange={handleStatusChange}
            className="hidden"
          />
          <div
            className={`w-3 h-3 rounded-full ${
              selectedStatus === "present" ? "bg-green-500" : "bg-dropDownGray"
            }`}
          ></div>
          <span className="text-gray-700 font-medium">Present</span>
        </label>
        {/* Absent */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="attendance"
            value="absent"
            checked={selectedStatus === "absent"}
            onChange={handleStatusChange}
            className="hidden"
          />
          <div
            className={`w-3 h-3 rounded-full ${
              selectedStatus === "absent" ? "bg-green-500" : "bg-dropDownGray"
            }`}
          ></div>
          <span className="text-gray-700 font-medium">Absent</span>
        </label>
        {/* Leave */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="attendance"
            value="leave"
            checked={selectedStatus === "leave"}
            onChange={handleStatusChange}
            className="hidden"
          />
          <div
            className={`w-3 h-3 rounded-full ${
              selectedStatus === "leave" ? "bg-green-500" : "bg-dropDownGray"
            }`}
          ></div>
          <span className="text-gray-700 font-medium">Leave</span>
        </label>
      </div>
    </>
  );
};
export default AttendanceStatus;

// import React, { useEffect, useState } from "react";
// import CloseIcon from "../../assets/icons/Close";
// import { toast } from "react-toastify";
// import { showToast } from "../ui/common/ShowToast";

// const AttendanceStatus = ({
//   studentId,
//   markAttendanceDate,
//   handleSubmitAttendance,
// }) => {
//   const [selectedStatus, setSelectedStatus] = useState("");
//   const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
//   const [note, setNote] = useState("");
//   const [markedAttendanceArray, setMarkedAttendanceArray] = useState([]);

//   const addAttendanceRecord = (record) => {
//     setMarkedAttendanceArray((prevArray) => [...prevArray, record]);
//   };

//   useEffect(() => {
//     if (selectedStatus === "present" || selectedStatus === "absent") {
//       const attendanceRecord = {
//         id: studentId,
//         present_status: selectedStatus,
//         date: markAttendanceDate,
//         note: "",
//       };

//       addAttendanceRecord(attendanceRecord); // Add the record to the array
//     }
//   }, [markAttendanceDate, selectedStatus, studentId]);

//   const handleStatusChange = (event) => {
//     const status = event.target.value;
//     if (status === "leave") {
//       setIsNoteModalOpen(true);
//     } else {
//       setSelectedStatus(status);
//     }
//   };

//   const closeNoteModal = () => {
//     setIsNoteModalOpen(false);
//   };

//   const handleConfirm = () => {
//     const attendanceRecord = {
//       id: studentId,
//       present_status: selectedStatus,
//       date: markAttendanceDate,
//       note: note,
//     };
//     addAttendanceRecord(attendanceRecord); // Add the record to the array
//     setIsNoteModalOpen(false);
//     setSelectedStatus("leave");
//   };

//   () => handleSubmitAttendance(markedAttendanceArray); // Submit the entire array to the API

//   return (
//     <>
//       {isNoteModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
//           <div className="bg-white p-6 rounded-xl shadow-lg w-[33rem] ">
//             <div className="flex justify-end">
//               <button onClick={closeNoteModal}>
//                 <CloseIcon />
//               </button>
//             </div>
//             <p className="text-3xl py-5 font-medium font-poppins text-center">
//               Add Note
//             </p>
//             <div className="flex justify-center mb-8 mt-5">
//               <textarea
//                 className="w-full h-64 p-4 border border-grayBorder rounded-xl"
//                 placeholder="Reason"
//                 onChange={(e) => setNote(e.target.value)}
//               />
//             </div>
//             <div className="flex justify-center gap-3 mb-2">
//               <button
//                 onClick={handleConfirm}
//                 className="custom-AddButton text-white py-2 px-6 rounded-lg font-semibold font-poppins text-lg"
//               >
//                 Submit
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="flex items-center space-x-4">
//         {/* Present */}
//         <label className="flex items-center space-x-2 cursor-pointer">
//           <input
//             type="radio"
//             name="attendance"
//             value="present"
//             checked={selectedStatus === "present"}
//             onChange={handleStatusChange}
//             className="hidden"
//           />
//           <div
//             className={`w-3 h-3 rounded-full ${
//               selectedStatus === "present" ? "bg-green-500" : "bg-dropDownGray"
//             }`}
//           ></div>
//           <span className="text-gray-700 font-medium">Present</span>
//         </label>

//         {/* Absent */}
//         <label className="flex items-center space-x-2 cursor-pointer">
//           <input
//             type="radio"
//             name="attendance"
//             value="absent"
//             checked={selectedStatus === "absent"}
//             onChange={handleStatusChange}
//             className="hidden"
//           />
//           <div
//             className={`w-3 h-3 rounded-full ${
//               selectedStatus === "absent" ? "bg-green-500" : "bg-dropDownGray"
//             }`}
//           ></div>
//           <span className="text-gray-700 font-medium">Absent</span>
//         </label>

//         {/* Leave */}
//         <label className="flex items-center space-x-2 cursor-pointer">
//           <input
//             type="radio"
//             name="attendance"
//             value="leave"
//             checked={selectedStatus === "leave"}
//             onChange={handleStatusChange}
//             className="hidden"
//           />
//           <div
//             className={`w-3 h-3 rounded-full ${
//               selectedStatus === "leave" ? "bg-green-500" : "bg-dropDownGray"
//             }`}
//           ></div>
//           <span className="text-gray-700 font-medium">Leave</span>
//         </label>
//       </div>
//     </>
//   );
// };

// export default AttendanceStatus;
