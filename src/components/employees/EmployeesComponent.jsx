import { useEffect, useMemo, useState } from "react";
import Header from "../ui/Header";
import Table from "../ui/Table";
import DeleteModal from "../ui/DeleteModal";
import BulkDeleteModal from "../ui/BulkDeleteModal";
import {
  useGetQuery,
  useDeleteMutation,
  usePatchMutation,
} from "../../api/apiSlice";
import { useDispatch, useSelector } from "react-redux";
import { getInstructors } from "../../features/instructors/instructorsSlice";
import { showToast } from "../ui/common/ShowToast";
import { useLocation, useNavigate } from "react-router-dom";
import { IdCard } from "lucide-react";
import Loader from "../ui/common/LoaderComponent";

const columns = ["Designation", "Name", "Phone No", "Email", "CNIC"];
const columnsFilters = [
  {
    field: "number",
    key: "serialNumber",
    placeholder: "Search SR #",
    isDisabled: true,
  },
  {
    field: "text",
    key: "name",
    placeholder: "Search Name",
    isDisabled: false,
  },
  {
    field: "number",
    key: "phoneNO",
    placeholder: "Search Phone No",
    isDisabled: false,
  },
  {
    field: "number",
    key: "project",
    placeholder: "Search Project",
    isDisabled: false,
  },
  {
    field: "number",
    key: "salary",
    placeholder: "Search Salary",
    isDisabled: false,
  },
  {
    field: "Dropdown",
    key: "status",
    placeholder: "Search Status",
    isDisabled: false,
  },
  {
    field: "button",
    key: "action",
    placeholder: "Reset",
    isDisabled: false,
  },
];

// Comprehensive designation hierarchy mapping
const designationHierarchy = {
  manager: 1,
  "assistant manager": 2,
  receptionist: 3,
  "account clerk": 4,
  clerk: 4,
  technician: 5,
  technicians: 5,
  technition: 5,
  technician35: 5,
  "office boy": 6,
  "office boys": 6,
  sweeper: 7,
  sweepers: 7,
  "sanitary worker": 7,
  "security guard": 8,
  "security guards": 8,
};

/**
 * Get designation priority based on hierarchy
 * Handles various spellings and partial matches
 */
const getDesignationPriority = (designation) => {
  if (!designation) return 999; // Items without designation go last

  const normalizedDesignation = designation.toLowerCase().trim();

  // Direct match
  if (designationHierarchy[normalizedDesignation]) {
    return designationHierarchy[normalizedDesignation];
  }

  // Partial match - check if designation contains any keyword
  for (const [key, value] of Object.entries(designationHierarchy)) {
    if (normalizedDesignation.includes(key)) {
      return value;
    }
  }

  return 999; // Unknown designations go last
};

const EmployeesComponent = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState([]);
  const [selectedID, setSelectedID] = useState(null);
  const [patch] = usePatchMutation();
  const [filters, setFilters] = useState({
    name: "",
    phoneNO: "",
    project: "",
    salary: "",
    status: "",
  });
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const activeStatus = queryParams.get("active_status");

  const [deleteInstructor] = useDeleteMutation();

  const instructors = useSelector((state) => state.instructors.instructors);

  // Callback to update filters from TableFilters component
  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const mappedInstructorData = useMemo(() => {
    const formattedData = instructors?.map((instructor) => ({
      id: instructor.id,
      uuid: instructor.uuid,
      name: instructor.first_name + " " + (instructor.last_name || ""),
      "father name": instructor.father_name,
      "phone no": instructor.contact,
      project: "0",
      salary: instructor.basic_salary,
      "total instructors": 0,
      is_active: instructor.active_status,
      role: instructor.role,
      fatherName: instructor.father_name,
      phoneNo: instructor.contact,
      experience: instructor.experience,
      basic_salary: instructor.basic_salary,
      cnic: instructor.cnic || " ",
      facilities:
        instructor.facilities?.map((facility) => facility.facility_name) || [],
      facility_ids: instructor.facilities?.map((facility) => facility.id) || [],
      first_name: instructor.first_name || "",
      last_name: instructor.last_name || "",
      email: instructor.email || "",
      qualification: instructor.qualification || "",
      gender: instructor.gender || "",
      city: instructor.city || "",
      address: instructor.address || "",
      marital_status: instructor.marital_status || "",
      designation: instructor.designation || "",
      dateOfBirth: instructor.dob || "",
      bio: instructor.bio || "",
      cnic_doc: instructor?.cnic_doc?.file_url,
      contract: instructor.contract || "",
      resume: instructor.resume || "",
      education: instructor.education || "",
      experience_letter: instructor.experience_letter || "",
      additional_certificate: instructor.additional_certificate || "",
    }));

    // Sort by designation priority, then by name
    return formattedData?.sort((a, b) => {
      const priorityA = getDesignationPriority(a.designation);
      const priorityB = getDesignationPriority(b.designation);

      // First sort by designation priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same designation, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [instructors]);

  const filteredStudentsData = useMemo(() => {
    const filtered = mappedInstructorData?.filter((student) => {
      return (
        (filters?.name === "" ||
          student?.name
            ?.toLowerCase()
            ?.includes(filters?.name?.toLowerCase())) &&
        (filters?.phoneNO === "" ||
          student["phone no"]
            ?.toString()
            ?.includes(filters?.phoneNO?.toString())) &&
        (filters?.project === "" ||
          student?.project?.toString()?.includes(filters?.project)) &&
        (filters?.salary === "" ||
          student?.salary?.toString()?.includes(filters?.salary)) &&
        (filters?.status === "" ||
          student?.is_active?.toString() === filters?.status?.toString())
      );
    });

    // Sort filtered data by designation as well
    return filtered?.sort((a, b) => {
      const priorityA = getDesignationPriority(a.designation);
      const priorityB = getDesignationPriority(b.designation);

      // First sort by designation priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same designation, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [mappedInstructorData, filters]);

  // Get all instructors api
  const {
    data: instructorData,
    error: instructorError,
    isLoading: instructorIsLoading,
    refetch: refetchInstructor,
  } = useGetQuery({
    path: "/admin/users/employee",
    params: {
      ...(activeStatus && { active_status: activeStatus }),
    },
  });

  useEffect(() => {
    refetchInstructor();
  }, []);

  useEffect(() => {
    dispatch(
      getInstructors({
        instructors: instructorData?.data,
      }),
    );
  }, [instructorData, dispatch]);

  const handleBulkDeleteConfirm = () => {
    console.log("All selected items deleted successfully");
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteInstructor({
        path: `/admin/employee/${selectedID}`,
      }).unwrap();
      setIsDeleteModalOpen(false);
      refetchInstructor();
    } catch (err) {
      console.error("Failed to delete Instructor", err);
    }
  };

  // Update Switch Api Call:
  const handleSwitchToggle = async (modifiedItemId, newActiveStatus) => {
    const instructor = instructors.find(
      (instructors) => instructors.id === modifiedItemId,
    );
    const values = {
      firstName: instructor.first_name,
      active_status: newActiveStatus === true ? "1" : "0",
    };
    const modifiedItemUuid = instructor.uuid;
    try {
      const response = await patch({
        path: `/admin/employee/${modifiedItemUuid}`,
        body: values,
      }).unwrap();
      refetchInstructor();
    } catch (err) {
      console.error("Failed to update employee", err);
    }
  };

  const handleEditClick = (item) => {
    // Navigate to the AddEmployee form with the employee UUID
    navigate(`/dashboard/employees/edit/${item.uuid}`, {
      state: { instructorData: item },
    });
  };

  const isFilterApplied = Object.values(filters).some((value) => value !== "");

  const handleResetChange = () => {
    setFilters({ name: "", phoneNO: "", project: "", salary: "", status: "" });
  };

  return (
    <div className="w-11/12 mx-auto">
      <Header
        title="Employees"
        icon={<IdCard />}
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        TotalCategories={mappedInstructorData?.length}
        batchButton={instructorError || instructorIsLoading ? null : "employee"}
        sourceComponent="EmployeesComponent"
      />
      {instructorIsLoading && <Loader />}
      {instructorError && <div>Error loading Employees</div>}
      {!instructorIsLoading && !instructorError && (
        <Table
          data={isFilterApplied ? filteredStudentsData : mappedInstructorData}
          columns={columns}
          columnsFilters={columnsFilters}
          handleFilterChange={handleFilterChange}
          setCurrentItem={setCurrentItem}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setIsEditModalOpen={setIsEditModalOpen}
          setIsMultipleSelected={setIsMultipleSelected}
          tableTitle="instructors"
          setSelectedID={setSelectedID}
          handleEditClick={handleEditClick}
          handleSwitchToggle={handleSwitchToggle}
          sourceComponent={"EmployeesComponent"}
          handleResetChange={handleResetChange}
        />
      )}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDeleteConfirm}
        onClose={() => console.log("Delete modal closed")}
        successMessage="Deleted Successfully!"
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        setIsOpen={setIsBulkDeleteModalOpen}
        message="Are you sure you want to delete all the selected employees?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => console.log("Bulk delete modal closed")}
        successMessage="Deleted Successfully!"
      />
    </div>
  );
};

export default EmployeesComponent;
