import React, { useEffect, useState } from "react";
import Table from "../../ui/Table";
import { useParams } from "react-router-dom";
import { useGetQuery } from "../../../api/apiSlice";
import { formatDate } from "../../ui/common/FormatDate";
import { convertTo12HourFormat } from "../../ui/common/ConvertTo12HourFormat";
const columns = [
  "Class",
  "Course",
  "Batch",
  "Hall",
  "Time Slot",
  "Timing",
  "Status",
];

const InstructorBatchesTab = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const { id } = useParams();

  // get instructor data single
  const {
    data: SingleInstructorData,
    error: emplpoyeeError,
    isLoading: employeeIsLoading,
    refetch: refetchInstructor,
  } = useGetQuery({
    path: `/admin/teacher/${id}`,
  });

  useEffect(() => {
    refetchInstructor();
  }, []);

  const mappedData = SingleInstructorData?.data?.classes?.map((cls) => ({
    id: cls.class_id,
    class: cls.name,
    course: cls?.course?.name,
    batch: cls?.batch?.name,
    hall: cls?.hall?.name,
    "time slot": cls?.time_slot,
    timing: cls?.timing,
    status: cls.is_active == true ? "Active" : "Inactive",
  }));

  return (
    <div className="pt-6">
      {mappedData?.length === 0 ? (
        <div className="text-4xl text-center tracking-tight font-bold font-Montserrat flex items-center justify-center h-96 w-full bg-white  border-2 border-grayBordered  ">
          Batch is not assign yet .
        </div>
      ) : (
        <Table
          data={mappedData}
          columns={columns}
          setIsEditModalOpen={setIsEditModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setIsMultipleSelected={setIsMultipleSelected}
          setSelectedID={setSelectedID}
          TableHeadingAction={false}
          BatchActiveColor={true}
        />
      )}
    </div>
  );
};

export default InstructorBatchesTab;
