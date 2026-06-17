import { useState, useEffect, useMemo } from "react";
import Table from "../ui/Table";
import DeleteModal from "../ui/DeleteModal";
import BulkDeleteModal from "../ui/BulkDeleteModal";
import {
  useGetQuery,
  useDeleteMutation,
  usePatchMutation,
} from "../../api/apiSlice";
import { useDispatch, useSelector } from "react-redux";
import Header from "../ui/Header";
import { getInstructors } from "../../features/instructors/instructorsSlice";
import InstructorModal from "../ui/instructorModal/InstructorModal";
import EditInstructorModal from "../ui/instructorModal/EditInstructorModal"; // ✅ New import
import InstructorsIcon from "../../assets/icons/navbar/Instructors";
import { useLocation, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import Loader from "../ui/common/LoaderComponent";

const columns = ["Name", "Classes", "Course", "Total Students"];
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
    key: "batch",
    placeholder: "Search Batch",
    isDisabled: false,
  },
  {
    field: "text",
    key: "course",
    placeholder: "Search Course",
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

const InstructorsComponent = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMultipleSelected, setIsMultipleSelected] = useState(false);
  const [currentItem, setCurrentItem] = useState([]);
  const [selectedID, setSelectedID] = useState(null);
  const [initialValues, setInitialValues] = useState({});
  const [patch] = usePatchMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    name: "",
    batch: "",
    totalStudent: "",
    status: "",
  });

  const [deleteInstructor] = useDeleteMutation();
  const instructors = useSelector((state) => state.instructors.instructors);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeStatus = queryParams.get("active_status");

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const mappedInstructorData = useMemo(() => {
    return instructors?.map((instructor) => ({
      id: instructor.id,
      uuid: instructor.uuid,
      classes: instructor.batch_count,
      course: instructor?.classes?.[0]?.course?.name,
      "total students": instructor.students_count || 0,
      is_active: instructor.active_status,
      role: instructor.role,
      fatherName: instructor.father_name,
      phoneNo: instructor.contact,
      experience: instructor.experience,
      basic_salary: instructor.basic_salary,
      cnic: instructor.cnic || " ",
      facilities: instructor.facilities.map(
        (facility) => facility.facility_name
      ),
      facility_ids: instructor.facilities.map((facility) => facility.id),
      first_name: instructor.first_name || "",
      last_name: instructor.last_name || "",
      name: instructor.first_name + " " + instructor.last_name,
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
  }, [instructors]);

  const filteredStudentsData = useMemo(() => {
    return mappedInstructorData?.filter((student) => {
      return (
        (filters?.name === "" ||
          student?.name
            ?.toLowerCase()
            ?.includes(filters?.name?.toLowerCase())) &&
        (filters?.batch === "" ||
          student?.batches?.toString()?.includes(filters?.batch?.toString())) &&
        (filters?.totalStudent === "" ||
          student["total students"]
            .toString()
            ?.includes(filters?.totalStudent)) &&
        (filters?.status === "" ||
          student?.is_active?.toString() === filters?.status?.toString())
      );
    });
  }, [mappedInstructorData, filters]);

  const {
    data: instructorData,
    error: instructorError,
    isLoading: instructorIsLoading,
    refetch: refetchInstructor,
  } = useGetQuery({
    path: "/admin/users/teacher",
    params: {
      ...(activeStatus && { active_status: activeStatus }),
    },
  });

  useEffect(() => {
    if (currentItem) {
      const {
        first_name = "",
        last_name = "",
        phoneNo = "",
        experience = "",
        cnic = "",
        dateOfBirth = "",
        qualification = "",
        email = "",
        fatherName = "",
        gender = "",
        city = "",
        address = "",
        marital_status = "",
        designation = "",
        basic_salary = "",
        bio = "",
        facilities = "",
        facility_ids = [],
        contract = "",
        resume = "",
        education = "",
        experience_letter = "",
        additional_certificate = "",
      } = currentItem;

      setInitialValues({
        firstName: first_name,
        lastName: last_name,
        phoneNo,
        experience,
        cnic,
        dateOfBirth,
        email,
        qualification,
        guardianName: fatherName,
        guardianPhoneNo: phoneNo,
        gender,
        city,
        address,
        marital_status,
        designation,
        basic_salary,
        bio,
        // facilities: currentItem.facility_ids || [],
        facilities: Array.isArray(facility_ids) ? facility_ids.join(",") : "",
        contract,
        resume,
        education,
        experience_letter,
        additional_certificate,
      });
    }
  }, [currentItem]);

  useEffect(() => {
    refetchInstructor();
  }, []);

  useEffect(() => {
    dispatch(
      getInstructors({
        instructors: instructorData?.data,
      })
    );
  }, [instructorData, dispatch]);

  const handleBulkDeleteConfirm = () => {};

  const handleDeleteConfirm = async () => {
    try {
      await deleteInstructor({ path: `/admin/teacher/${selectedID}` }).unwrap();
      setIsDeleteModalOpen(false);
      refetchInstructor();
    } catch (err) {}
  };

  const handleSwitchToggle = async (modifiedItemId, newActiveStatus) => {
    const instructor = instructors.find(
      (instructors) => instructors.id === modifiedItemId
    );
    const values = {
      firstName: instructor.first_name,
      active_status: newActiveStatus === true ? "1" : "0",
    };
    const modifiedItemUuid = instructor.uuid;
    try {
      await patch({
        path: `/admin/teacher/${modifiedItemUuid}`,
        body: values,
      }).unwrap();
      refetchInstructor();
    } catch (err) {
      console.error("Failed to update student", err);
    }
  };

  const handleEditClick = (item) => {
    // Navigate to the AddEmployee form with the instructor UUID
    navigate(`/dashboard/smes/edit/${item.uuid}`, {
      state: { instructorData: item },
    });
  };

  const fields = [
    {
      name: "instructor",
      label: "Instructor",
      placeholder: "Add new Instructor",
    },
  ];

  const handleResetChange = () => {
    setFilters({ name: "", batch: "", totalStudent: "", status: "" });
  };

  const isFilterApplied = Object.values(filters).some((value) => value !== "");

  return (
    <div className="w-11/12 mx-auto">
      <Header
        icon={<Brain />}
        title="SMEs"
        isMultipleSelected={isMultipleSelected}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        // icon={<InstructorsIcon />}
        TotalCategories={mappedInstructorData?.length}
        batchButton={
          instructorError || instructorIsLoading ? null : "instructor"
        }
        sourceComponent="InstructorsComponent"
      />
      {instructorIsLoading && <Loader />}
      {instructorError && <div>Error loading Instructors</div>}
      {!instructorIsLoading && !instructorError && (
        <Table
          data={isFilterApplied ? filteredStudentsData : mappedInstructorData}
          columns={columns}
          columnsFilters={columnsFilters}
          handleFilterChange={handleFilterChange}
          setCurrentItem={setCurrentItem}
          setIsEditModalOpen={setIsEditModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setIsMultipleSelected={setIsMultipleSelected}
          tableTitle="instructors"
          setSelectedID={setSelectedID}
          handleEditClick={handleEditClick}
          handleSwitchToggle={handleSwitchToggle}
          sourceComponent={"InstructorsComponent"}
          handleResetChange={handleResetChange}
        />
      )}

      <InstructorModal
        isOpen={isCreateModalOpen}
        setIsOpen={setIsCreateModalOpen}
        submitButtonText="Add"
        fields={fields}
        refetchInstructor={refetchInstructor}
        instructorApi={true}
        ModalTitle="Tech Trainers"
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete Instructor"
        message="Are you sure you want to delete this instructor?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleDeleteConfirm}
        onClose={() => console.log("Delete modal closed")}
        successMessage="Deleted Successfully!"
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        setIsOpen={setIsBulkDeleteModalOpen}
        message="Are you sure you want to delete all the selected instructors?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => console.log("Bulk delete modal closed")}
        successMessage="Deleted Successfully!"
      />
    </div>
  );
};

export default InstructorsComponent;
