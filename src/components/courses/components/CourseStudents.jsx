// CourseStudentsPage.jsx - Students enrolled in a specific course
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Users,
  Filter,
  XCircle,
  Clock,
  MapPin,
  Search,
  X,
  Users2
} from "lucide-react";
import { useGetQuery } from "../../../api/apiSlice";
import Table from "../../ui/Table";
import Header from "../../ui/Header";
import StudentsIcon from "../../../assets/icons/navbar/students";

export default function CourseStudentsPage() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {};

  const [selectedTimeSlot, setSelectedTimeSlot] = useState("all");
  const [selectedHall, setSelectedHall] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  const {
    data: studentsData,
    error: studentsError,
    isLoading: studentsIsLoading,
  } = useGetQuery({
    path: "/admin/students",
    params: { per_page: 100 },
  });

  useEffect(() => {
    if (studentsData?.data && course) {
      // Filter students by course name
      const courseStudents = studentsData.data.filter(
        (student) => student.course_name === course.name
      );

      // Apply filters
      let filtered = courseStudents;

      // Time slot filter (you can customize this based on your data structure)
      if (selectedTimeSlot !== "all") {
        // Implement time slot filtering logic here
        filtered = filtered.filter((student) => {
          // Example: filter by batch name or add time slot field
          return true; // Placeholder
        });
      }

      // Hall filter (you can customize this based on your data structure)
      if (selectedHall !== "all") {
        // Implement hall filtering logic here
        filtered = filtered.filter((student) => {
          // Example: filter by hall/location
          return true; // Placeholder
        });
      }

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter((student) =>
          [
            student.first_name,
            student.last_name,
            student.email,
            student.contact,
          ].some((field) =>
            field?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      setFilteredStudents(filtered);
    }
  }, [studentsData, course, selectedTimeSlot, selectedHall, searchTerm]);

  const handleClearFilters = () => {
    setSelectedTimeSlot("all");
    setSelectedHall("all");
    setSearchTerm("");
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-4">Course not found</p>
          <button
            onClick={() => navigate("/dashboard/courses")}
            className="px-6 py-3 bg-gradient-to-r from-[#014376] to-[#31918D] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Go Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (studentsIsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#014376] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading students...</p>
        </div>
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading students</p>
        </div>
      </div>
    );
  }

  // Format students for table
  const formattedStudents = filteredStudents.map((student) => ({
    id: student.id,
    uuid: student.uuid,
    name: `${student.first_name} ${student.last_name}`,
    email: student.email,
    contact: student.contact,
    batch: student.batch_name,
    teacher: student.teacher_name,
    city: student.city,
    role: "student",
  }));

  const columns = ["Name", "Email", "Contact", "Batch", "Teacher", "City"];

  // Get unique time slots and halls (customize based on your data)
  const timeSlots = ["all", "morning", "afternoon", ];
  const halls = ["all", "hall-1", "hall-2", "hall-3"];

  const hasActiveFilters = selectedTimeSlot !== "all" || selectedHall !== "all" || searchTerm !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 p-6">
      <div className="w-11/12 mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[#014376] hover:text-[#31918D] mb-6 font-medium transition-colors"
        >
          <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span>Back to Courses</span>
        </button>

  <Header
   title={`${course.name}  Students`}
   icon={<Users2/>}
   showActionButton={false}
  />

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-[#014376]" />
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376] transition-all"
              />
            </div>

            {/* Time Slot Filter */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376] appearance-none bg-white transition-all cursor-pointer"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot === "all" ? "All Time Slots" : slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Hall Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014376] appearance-none bg-white transition-all cursor-pointer"
              >
                {halls.map((hall) => (
                  <option key={hall} value={hall}>
                    {hall === "all" ? "All Halls" : hall.toUpperCase().replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {formattedStudents.length > 0 ? (
            <Table
              data={formattedStudents}
              columns={columns}
              setIsEditModalOpen={() => {}}
              setIsDeleteModalOpen={() => {}}
              setSelectedID={() => {}}
              handleEditClick={() => {}}
              TableHeadingAction={true}
              sourceComponent="StudentsComponent"
            />
          ) : (
            <div className="p-16 text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-[#014376]/10 to-[#31918D]/10 rounded-full mb-6">
                <Users className="w-16 h-16 text-[#014376]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "There are no students enrolled in this course yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}