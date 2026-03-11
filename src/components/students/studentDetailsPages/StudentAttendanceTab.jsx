import React, { useEffect, useState } from "react";
import Table from "../../ui/Table";
import { useGetQuery } from "../../../api/apiSlice";
import { useParams } from "react-router-dom";

const columns = ["batch", "Date", "Note", "Status"];
// is provided beautiful environement and provided needed requirnments
const data2 = [
  {
    date: "2024-06-07",
    note: "codelab",
    status: "present",
    batch: "2024",
  },
];

const StudentAttendanceTab = ({ dateFilter }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [formattedData, setFormattedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const { id } = useParams();

  const {
    data: AttendanceData,
    error: AttendanceError,
    isLoading: AttendanceIsLoading,
    refetch: refetchAttendance,
  } = useGetQuery(
    id
      ? {
          path: `/admin/attendences`,
        }
      : null,
    {
      skip: !id,
    }
  );
  useEffect(() => {
    refetchAttendance();
  }, []);

  const studentsAttendanceData = AttendanceData?.data;

  useEffect(() => {
    if (studentsAttendanceData) {
      const formatData = studentsAttendanceData.map((dataItem) => ({
        date: dataItem.date,
        note: dataItem.note,
        status: dataItem.present_status,
        batch: dataItem.batch,
      }));
      setFormattedData(formatData);
    }
  }, [studentsAttendanceData]);

  // Second useEffect: Filter data based on dateFilter
  useEffect(() => {
    if (dateFilter) {
      const filtered = formattedData.filter((item) => item.date === dateFilter);
      setFilteredData(filtered);
    } else {
      setFilteredData(formattedData);
    }
  }, [formattedData, dateFilter]);

  return (
    <div className="">
      <Table
        data={filteredData}
        columns={columns}
        setIsEditModalOpen={setIsEditModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        setIsMultipleSelected={setIsMultipleSelected}
        setSelectedID={setSelectedID}
        TableHeadingAction={false}
        sourceComponent={"StudentAttendanceTab"}
      />
    </div>
  );
};

export default StudentAttendanceTab;
