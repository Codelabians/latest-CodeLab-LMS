import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useDeleteMutation,
  useGetQuery,
  usePatchMutation,
  usePostMutation,
} from "../../../api/apiSlice";
import {
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Delete,
  Laptop2Icon,
  LaptopMinimalCheck,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../../ui/common/LoaderComponent";
import EnrollClassModal from "./EnrollClassModal";
import EditClassModal from "../../batches/components/EditClass";
import RemoveLaptopModal from "./RemoveLaptopModal";

const StudentBatchTab = ({ setIsCreateModalOpen, isCreateModalOpen }) => {
  const { id } = useParams();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isRemoveLaptopModalOpen, setIsRemoveLaptopModalOpen] = useState(false);
  const [selectedClassForRemoval, setSelectedClassForRemoval] = useState(null); // NEW

  const [triggerRemoveLaptop, { isLoading: isRemovingLaptop }] =
    usePostMutation();

  const {
    data: studentData,
    error: studentError,
    isLoading: studentIsLoading,
    refetch: refetchStudents,
  } = useGetQuery({
    path: `/admin/user/${id}`,
  });

  useEffect(() => {
    refetchStudents();
  }, []);

  if (studentIsLoading) return <Loader />;

  // Get all class details from the array
  const classDetailsArray = studentData?.data?.class_details;

  // Add the remove handler
  const handleRemoveLaptop = async () => {
    if (!selectedClassForRemoval) return;

    try {
      await triggerRemoveLaptop({
        path: `/admin/inventory/inventories/set-available-for-student/${selectedClassForRemoval?.inventory?.[0]?.pivot?.student_class_id}`,
        body: {}, // Add empty body if POST requires it
      }).unwrap();

      toast.success("Laptop removed successfully");
      setIsRemoveLaptopModalOpen(false);
      setSelectedClassForRemoval(null);
      refetchStudents(); // Refetch student data
    } catch (error) {
      console.error("Error removing laptop:", error);
      toast.error("Failed to remove laptop");
    }
  };

  // if (!classDetailsArray || classDetailsArray.length === 0) {
  //   return (
  //     <div className="p-6">
  //       <div
  //         className="flex flex-col items-end my-4"
  //         onClick={() => setIsEnrollModalOpen(true)}
  //       >
  //         <button className="custom-Background text-white px-6 py-2 rounded-md">
  //           Enroll in a class
  //         </button>
  //       </div>
  //       <div className="text-center bg-gray-50 rounded-lg p-8">
  //         <p className="text-gray-500 text-lg">
  //           No class information available
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="p-6">
      <div
        className="flex flex-col items-end my-4"
        onClick={() => setIsEnrollModalOpen(true)}
      >
        <button className="custom-Background text-white px-6 py-2 rounded-md">
          Enroll in another class
        </button>
      </div>

      {/* Display all enrolled classes */}
      <div className="space-y-6">
        {classDetailsArray.map((classDetails, index) => (
          <div
            key={classDetails.class_id || index}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#aa0e0e] mb-2">
                  {classDetails.name}
                </h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen size={18} />
                  <span className="font-semibold">
                    {classDetails.course?.name}
                  </span>
                </div>
              </div>
              <div
                className="text-brown cursor-pointer hover:text-[#aa0e0e] transition-colors"
                onClick={() => {
                  setSelectedClass(classDetails);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit2 />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Instructor */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg custom-Background">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-semibold text-gray-800">
                    {classDetails.teacher?.name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Hall */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg custom-Background">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hall</p>
                  <p className="font-semibold text-gray-800">
                    {classDetails.hall?.name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Batch */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg custom-Background">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="font-semibold text-gray-800">
                    {classDetails.batch?.name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg custom-Background">
                  <Calendar size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Starting Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(classDetails.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Time Slot */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg custom-Background">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Slot</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {classDetails.time_slot}
                  </p>
                  <p className="text-sm text-gray-500">{classDetails.timing}</p>
                </div>
              </div>

              {/* Laptop Tag - Professional Design */}
              {classDetails.inventory?.[0]?.tag ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Icon and Details */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Icon with gradient background */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-600 rounded-xl blur-sm opacity-30"></div>
                          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                            <LaptopMinimalCheck
                              size={24}
                              className="text-white"
                            />
                          </div>
                        </div>

                        {/* Laptop Information */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-600">
                              Assigned Laptop
                            </p>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Active
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900 tracking-wide">
                            {classDetails.inventory[0].tag}
                          </p>
                          {classDetails.inventory[0]?.serial_number && (
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                              SN: {classDetails.inventory[0].serial_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Remove Button */}
                      <button
                        onClick={() => {
                          setSelectedClassForRemoval(classDetails);
                          setIsRemoveLaptopModalOpen(true);
                        }}
                        className="group flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 hover:border-red-300 hover:shadow-md transition-all duration-200 active:scale-95"
                      >
                        <X
                          size={18}
                          className="group-hover:rotate-90 transition-transform duration-200"
                        />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>

                    {/* Additional Info Bar */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Device Active
                        </span>
                        <span>Tap remove to unassign laptop</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Seats Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-[#aa0e0e] mb-4">
                Class Capacity & Fee Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-sm text-gray-600">Total Seats</p>
                  <p className="text-2xl font-bold text-[#aa0e0e]">
                    {classDetails.seats}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-sm text-gray-600">Enrolled</p>
                  <p className="text-2xl font-bold text-green-700">
                    {classDetails.total_students}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {classDetails.available_seats}
                  </p>
                </div>

                <div className="custom-Background rounded-lg p-4 text-center">
                  <p className="text-sm text-white">Course Fee</p>
                  <p className="text-2xl font-bold text-white">
                    Rs.{" "}
                    {parseFloat(
                      classDetails.fees?.total_fee || 0,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EnrollClassModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        studentId={id}
        refetch={refetchStudents}
        studentData={studentData}
      />
      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentId={studentData?.data?.id}
        currentClass={selectedClass}
        refetch={refetchStudents}
      />
      {/* UPDATED MODAL */}
      <RemoveLaptopModal
        isOpen={isRemoveLaptopModalOpen}
        onClose={() => {
          setIsRemoveLaptopModalOpen(false);
          setSelectedClassForRemoval(null);
        }}
        onConfirm={handleRemoveLaptop}
        laptopTag={selectedClassForRemoval?.inventory?.[0]?.tag}
        isLoading={isRemovingLaptop}
      />
    </div>
  );
};

export default StudentBatchTab;
