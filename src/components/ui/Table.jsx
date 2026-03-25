import { Eye, FileText, Key, Lock, Shield, Trash, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import ArrowDown from "../../assets/icons/ArrowDown";
import BinIcon from "../../assets/icons/Bin";
import PencilIcon from "../../assets/icons/Pencil";
import { selectCurrentUser } from "../../features/auth/authSlice";
import AttendanceLabel from "../AttendanceSection/AttendanceLabel";
import AttendanceStatus from "../AttendanceSection/AttendanceStatus";
import {
  BATCHES,
  COURSES,
  EMPLOYEE,
  INSTRUCTORS,
  STUDENTS,
} from "../routes/RouteConstants";
import { Switch } from "./Switch";
import TableFilters from "./TableFilters";
import TableHeader from "./TableHeader";
import Loader from "./common/LoaderComponent";

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#ffcccc" : "white",
    color: state.isFocused ? "black" : "black",
  }),
  control: (provided) => ({
    ...provided,
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: "0.375rem",
    fontSize: "1rem",
    boxShadow: "none",
    border: "1px solid #ccc",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "1rem",
    color: "inherit",
  }),
  dropdownIndicator: () => null,
  indicatorSeparator: () => null,
  menu: (provided) => ({
    ...provided,
    marginTop: "0.25rem",
    borderRadius: "0.375rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

const Table = ({
  data = [],
  columns = [],
  columnsFilters = [],
  handleFilterChange = () => {},
  itemsPerPageOptions = [5, 10, 15, 20, 25, 30, 35, 40],
  setIsEditModalOpen,
  setIsDeleteModalOpen,
  setIsMultipleSelected,
  setIsStudentDetailsModalOpen,
  setSelectedID,
  handleEditClick,
  handleAssignClick,
  handleSwitchToggle,
  ColumnUnderline = false,
  borderNone = true,
  sourceComponent = "",
  TableHeadingAction = true,
  batchEditButton = true,
  markAttendanceDate = "",
  BatchActiveColor = false,
  updateMarkedAttendance = () => {},
  handleResetChange,
  onViewDetails,
  onViewChallan,
  onGenerateChallan,
  inquiryStatus,
  setPage,
  setPer_page,
  paginationMeta,
  link = "",
  handleStatusToggle,
  handleResetPasswordClick,
  handleChangePasswordClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [number, setNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const role = user?.role;
  const email = user?.email;

  // Check if backend pagination is being used
  const isBackendPagination = !!paginationMeta;

  const formattedItemsPerPageOptions = itemsPerPageOptions.map((num) => ({
    value: num,
    label: String(num),
  }));

  const handleCheckboxChange = (identifier) => {
    const isSelected = selectedRows.includes(identifier);
    if (isSelected) {
      setSelectedRows((prevSelected) =>
        prevSelected.filter((selectedId) => selectedId !== identifier),
      );
    } else {
      setSelectedRows((prevSelected) => [...prevSelected, identifier]);
    }
  };

  useEffect(() => {
    setIsMultipleSelected && setIsMultipleSelected(selectedRows.length > 0);
  }, [selectedRows]);

  const handlePage = () => {
    if (isBackendPagination) {
      setPage && setPage(parseInt(number));
    } else {
      setCurrentPage(parseInt(number));
    }
  };

  const handlePageNumber = (e) => {
    setNumber(parseInt(e.target.value));
  };

  const handleChange = (e) => {
    const newItemsPerPage = parseInt(e.value);
    setItemsPerPage(newItemsPerPage);

    if (isBackendPagination) {
      setPer_page && setPer_page(newItemsPerPage);
      setPage && setPage(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleClick = (number) => {
    if (isBackendPagination) {
      setPage && setPage(number);
    } else {
      setCurrentPage(number);
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      const allIdentifiers = data?.map((row) => row.name);
      setSelectedRows(allIdentifiers);
    } else {
      setSelectedRows([]);
    }
  };

  // Frontend pagination calculations (when not using backend pagination)
  let indexOfLastItem, indexOfFirstItem, currentItems, pageNumbers, totalItems;

  if (isBackendPagination) {
    // Use backend pagination data
    currentItems = data;
    indexOfFirstItem = paginationMeta.from - 1 || 0;
    indexOfLastItem = paginationMeta.to || data?.length;
    totalItems = paginationMeta.total;
    pageNumbers = Array.from(
      { length: paginationMeta.last_page },
      (_, i) => i + 1,
    );

    // Sync current page with backend
    if (paginationMeta.current_page !== currentPage) {
      setCurrentPage(paginationMeta.current_page);
    }
  } else {
    // Use frontend pagination
    indexOfLastItem = currentPage * itemsPerPage;
    indexOfFirstItem = indexOfLastItem - itemsPerPage;
    currentItems = data?.slice(indexOfFirstItem, indexOfLastItem);
    totalItems = data?.length;

    pageNumbers = [];
    for (let i = 1; i <= Math.ceil(data?.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }
  }

  const showingText = `Showing ${indexOfFirstItem + 1} to ${
    indexOfLastItem > totalItems ? totalItems : indexOfLastItem
  } of ${totalItems}`;

  const hasActiveStatus = data.some((item) => item.is_active !== undefined);

  const handleRowClick = (item) => {
    if (sourceComponent === "CategoriesComponent") {
      navigate(`${COURSES}/${item?.id}`);
    } else if (sourceComponent === "CoursesComponent") {
      navigate(`${BATCHES}/${item?.id}`);
    }
  };

  const renderStatusBadge = (item, column) => {
    if (column === "Status" && item.statusConfig) {
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${item.statusConfig.bg} ${item.statusConfig.text}`}
        >
          {item.statusConfig.label}
        </span>
      );
    }
    return item[column?.toLowerCase()];
  };

  return (
    <>
      <div className="relative max-w-full overflow-x-auto custom-horizontal-scrollbar">
        <table className="w-full min-w-full bg-white border border-grayBorder">
          <TableHeader
            selectAll={selectAll}
            handleSelectAll={handleSelectAll}
            columns={columns}
            TableHeadingAction={TableHeadingAction}
            hasActiveStatus={false}
            borderNone={borderNone}
            sourceComponent={sourceComponent}
          />
          {(sourceComponent === "StudentsComponent" ||
            sourceComponent === "InstructorsComponent" ||
            sourceComponent === "EmployeesComponent" ||
            sourceComponent === "BatchesComponent") && (
            <thead>
              <TableFilters
                columnsFilters={columnsFilters}
                handleFilterChange={handleFilterChange}
                handleResetChange={handleResetChange}
              />
            </thead>
          )}
          <tbody>
            {currentItems?.length > 0 ? (
              currentItems.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 pl-6 pr-4 border-b border-grayBorder">
                    <div className="flex items-center gap-5 ">
                      <div className="pl-4 text-base font-nunito">
                        {indexOfFirstItem + index + 1}
                      </div>
                    </div>
                  </td>
                  {columns?.map((column, index) => (
                    <td
                      key={column}
                      className={`py-2 px-4 border-b border-grayBorder text-left font-nunito text-base capitalize`}
                      onClick={() => {
                        if (item?.s === "student" && column === "Name") {
                          setSelectedID(item.uuid);
                          setIsStudentDetailsModalOpen(true);
                        }
                      }}
                      onMouseOut={() => {
                        if (item?.role === "student" && column === "Name") {
                          setIsStudentDetailsModalOpen(false);
                        }
                      }}
                    >
                      <span
                        className={`w-max inline-block ${
                          !BatchActiveColor
                            ? ColumnUnderline && index === 0
                              ? "border-b border-dashed px-1 cursor-pointer"
                              : ""
                            : BatchActiveColor && index === 3
                              ? `py-1 px-3 rounded-lg ${
                                  item.status === "In-Active"
                                    ? "bg-bloodred "
                                    : "bg-activeColor"
                                } text-white`
                              : ""
                        }`}
                        onClick={() => {
                          if (index === 0) {
                            handleRowClick(item);
                          }
                        }}
                      >
                        {sourceComponent === "AttendanceMarkSection" &&
                        column === "Attendance" ? (
                          <AttendanceStatus
                            studentId={item.id}
                            markAttendanceDate={markAttendanceDate}
                            updateMarkedAttendance={updateMarkedAttendance}
                          />
                        ) : sourceComponent === "StudentAttendanceTab" &&
                          column === "Status" ? (
                          <AttendanceLabel
                            value={item[column.toLowerCase()]}
                            background={
                              item[column.toLowerCase()] === "Present"
                                ? "#00A30040"
                                : item[column.toLowerCase()] === "Absent"
                                  ? "#FF000040"
                                  : item[column.toLowerCase()] === "Leave"
                                    ? "#F8F9F9"
                                    : ""
                            }
                          />
                        ) : column === "Status" ? (
                          renderStatusBadge(item, column)
                        ) : column === "Class" ? (
                          <div className="flex flex-col gap-1">
                            {item.all_classes && item.all_classes.length > 0 ? (
                              item.all_classes.map((cls, clsIndex) => (
                                <div
                                  key={clsIndex}
                                  className="flex items-center gap-2"
                                >
                                  <span className="whitespace-nowrap">
                                    {cls.name}
                                  </span>
                                  {cls.fee_status && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                        cls.fee_status === "enrolled"
                                          ? "bg-green-100 text-green-700"
                                          : cls.fee_status === "process"
                                            ? "bg-blue-100 text-blue-700"
                                            : cls.fee_status === "pending"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : cls.fee_status === "dropout"
                                                ? "bg-red-100 text-red-600"
                                                : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {cls.fee_status}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{item["class"]}</span>
                                {/* {item.class_fee_status && ( */}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                    item.class_fee_status === "enrolled"
                                      ? "bg-green-100 text-green-700"
                                      : item.class_fee_status === "process"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : item.class_fee_status === "pending"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {item.class_fee_status || "Dropout"}
                                </span>
                                {/* )} */}
                              </div>
                            )}
                          </div>
                        ) : (
                          item[column?.toLowerCase()]
                        )}
                      </span>
                    </td>
                  ))}

                  {TableHeadingAction && (
                    <td className="px-4 py-2 text-base  text-left border-b border-grayBorder w-36 font-nunito">
                      <div className="flex">
                        {sourceComponent === "TrainingInquiries" &&
                          item.status?.toLowerCase() !== "enrolled" &&
                          item.status?.toLowerCase() !== "process" && (
                            <button
                              className="w-[45px] h-[35px] rounded mx-1 flex items-center justify-center bg-editButtonGray text-white"
                              onClick={() =>
                                navigate(
                                  "/dashboard/training-inquiries/enroll",
                                  {
                                    state: {
                                      inquiryData: item,
                                      enrollmentId: item.id,
                                    },
                                  },
                                )
                              }
                            >
                              <User />
                            </button>
                          )}

                        {/* View Details Button */}
                        {(item?.role === "employee" ||
                          item?.role === "teacher" ||
                          sourceComponent === "IndividualWorkingSpace" ||
                          sourceComponent === "CompanyIndividual" ||
                          sourceComponent === "StudentsComponent" ||
                          sourceComponent === "ClassStudents" ||
                          sourceComponent === "InstructorsComponent" ||
                          sourceComponent === "CompanyWorkingSpace" ||
                          sourceComponent === "Inventory" ||
                          sourceComponent === "CoursesExpenses" ||
                          sourceComponent === "WsExpenses" ||
                          sourceComponent === "TrainingInquiries") && (
                          <button
                            className=" w-[45px] h-[35px] rounded mx-1 flex items-center justify-center bg-brown text-white"
                            onClick={() => {
                              if (sourceComponent === "StudentsComponent") {
                                navigate(`${STUDENTS}/${item.uuid}`);
                              } else if (sourceComponent === "ClassStudents") {
                                navigate(`${STUDENTS}/${item.uuid}`);
                              } else if (item.role === "employee") {
                                navigate(`${EMPLOYEE}/${item.uuid}`);
                              } else if (item.role === "teacher") {
                                navigate(`${INSTRUCTORS}/${item.uuid}`);
                              } else if (
                                sourceComponent === "IndividualWorkingSpace"
                              ) {
                                navigate(
                                  `/dashboard/working-spaces/individual/${item.uuid}`,
                                );
                              } else if (
                                sourceComponent === "CompanyIndividual"
                              ) {
                                navigate(
                                  `/dashboard/working-spaces/company-individual/details/${item.uuid}`,
                                );
                              } else if (
                                sourceComponent === "CompanyWorkingSpace"
                              ) {
                                navigate(
                                  `/dashboard/working-spaces/company/${item.uuid}`,
                                );
                              } else if (
                                sourceComponent === "WsExpenses" ||
                                sourceComponent === "CoursesExpenses"
                              ) {
                                if (typeof onViewDetails === "function") {
                                  onViewDetails(item);
                                }
                              } else if (
                                sourceComponent === "TrainingInquiries"
                              ) {
                                if (typeof onViewDetails === "function") {
                                  onViewDetails(item);
                                }
                              }
                            }}
                          >
                            <Eye />
                          </button>
                        )}

                        {sourceComponent === "RolesComponent" && (
                          <button
                            className="bg-[#31918D] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#2a7d7a] transition-colors"
                            onClick={() => {
                              handleAssignClick?.(item);
                            }}
                            title="Assign Permissions"
                          >
                            <Shield size={18} />
                          </button>
                        )}

                        {sourceComponent === "UsersComponents" && (
                          <button
                            className="bg-[#A9A9A9] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#2a7d7a] transition-colors"
                            onClick={() => {
                              setSelectedID(item.raw || item); // Set the selected user
                              setIsEditModalOpen(false); // Make sure edit modal is closed
                              // You need to pass a function to open reset password modal
                              handleResetPasswordClick?.(item);
                            }}
                            title="Reset Password"
                          >
                            <Key size={18} />
                          </button>
                        )}
                        {sourceComponent === "UsersComponents" && (
                          <button
                            className="bg-[#333333] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#013261] transition-colors"
                            onClick={() => {
                              setSelectedID(item.raw || item);
                              setIsEditModalOpen(false);
                              handleChangePasswordClick?.(item);
                            }}
                            title="Change Password"
                          >
                            <Lock size={18} />
                          </button>
                        )}

                        {batchEditButton &&
                          (role === "admin" ||
                            role === "oic" ||
                            role === "manager" ||
                            role === "asst manager") &&
                          // email === "admin@gmail.com" ||
                          sourceComponent !== "IndividualWorkingSpace" &&
                          sourceComponent !== "CompanyWorkingSpace" &&
                          sourceComponent !== "CompanyIndividual" && (
                            <button
                              className="bg-beige text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center"
                              onClick={() => {
                                if (
                                  sourceComponent === "StudentsComponent" ||
                                  sourceComponent === "ClassStudents" ||
                                  sourceComponent === "ClassStudentEdit"
                                ) {
                                  navigate(
                                    `/dashboard/students/edit/${item.uuid}`,
                                  );
                                } else {
                                  setIsEditModalOpen(true);
                                  setSelectedID(item.id);
                                  handleEditClick(item);
                                }
                              }}
                            >
                              <PencilIcon />
                            </button>
                          )}

                        {/* Delete Button */}
                        {(role === "admin" ||
                          role === "oic" ||
                          role === "manager" ||
                          role === "asstmanager") &&
                          setIsDeleteModalOpen && (
                            <>
                              {item.courses > 0 ||
                              item.batches > 0 ||
                              item["total students"] > 0 ? (
                                <button
                                  disabled
                                  className="custom-ActionBtn text-black bg-editButtonGray w-[45px] h-[35px] rounded mx-1 flex items-center justify-center opacity-50"
                                  onClick={() => {
                                    setSelectedID(item.id);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <BinIcon />
                                </button>
                              ) : (
                                <button
                                  className="custom-ActionBtn bg-editButtonGray text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center"
                                  onClick={() => {
                                    setSelectedID(item.uuid);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash />
                                </button>
                              )}
                            </>
                          )}
                        {/* {sourceComponent === "StudentsComponent" &&
                          email === "admin@gmail.com" && (
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={
                                  item.status?.toLowerCase() !== "dropout"
                                }
                                onChange={() => handleStatusToggle?.(item)}
                                // disabled={isToggling}
                              />
                            </div>
                          )} */}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="py-10 text-center text-gray-500 font-semibold text-lg"
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      <div className="relative flex flex-col lg:flex-row items-center justify-between px-6 py-4 mt-4 bg-white border border-gray-200 rounded-md gap-4">
        {/* Left Side - Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-all duration-200"
          >
            Previous
          </button>

          <div className="">
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handleClick(number)}
                className={`min-w-[36px] px-3 py-2 text-sm font-medium rounded transition-all ms-1 mb-1 duration-200 ${
                  currentPage === number
                    ? "bg-[#d61111] text-white hover:bg-[#aa0e0e]"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleClick(currentPage + 1)}
            disabled={currentPage === pageNumbers.length}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
          >
            Next
          </button>
        </div>

        {/* Right Side - Per Page & Showing Info */}
        <div className="relative flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-gray-700">Per Page</span>

          <div className="relative z-10 inline-block w-20">
            <Select
              id="quantity"
              name="quantity"
              value={formattedItemsPerPageOptions.find(
                (option) =>
                  option.value ===
                  (isBackendPagination
                    ? paginationMeta?.per_page
                    : itemsPerPage),
              )}
              onChange={handleChange}
              options={formattedItemsPerPageOptions}
              styles={{
                ...customStyles,
                control: (provided) => ({
                  ...provided,
                  minHeight: "38px",
                  height: "38px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  border: "1px solid #d1d5db",
                }),
                valueContainer: (provided) => ({
                  ...provided,
                  height: "38px",
                  padding: "0 8px",
                }),
                input: (provided) => ({
                  ...provided,
                  margin: "0px",
                }),
                indicatorSeparator: () => ({
                  display: "none",
                }),
                indicatorsContainer: (provided) => ({
                  ...provided,
                  height: "38px",
                }),
              }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isSearchable={false}
              components={{
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
              }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ArrowDown width={"10"} height={"8"} />
            </div>
          </div>

          <span className="text-gray-600 font-normal whitespace-nowrap">
            {showingText}
          </span>

          <input
            type="number"
            id="quantity"
            name="quantity"
            value={number}
            onChange={handlePageNumber}
            className="w-16 h-[38px] px-3 py-2 text-sm text-center bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1E5A7D] focus:border-transparent transition-all duration-200"
            min={1}
            max={pageNumbers.length}
          />

          <button
            className="px-4 py-2 h-[38px] text-sm font-medium text-white bg-[#d61111] rounded hover:bg-[#aa0e0e] active:bg-[#aa0e0e] transition-all duration-200"
            onClick={handlePage}
          >
            Go
          </button>
        </div>
      </div>
    </>
  );
};

export default Table;
// import { Eye, FileText, Key, Lock, Shield, Trash, User } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import Select from "react-select";
// import ArrowDown from "../../assets/icons/ArrowDown";
// import BinIcon from "../../assets/icons/Bin";
// import PencilIcon from "../../assets/icons/Pencil";
// import { selectCurrentUser } from "../../features/auth/authSlice";
// import AttendanceLabel from "../AttendanceSection/AttendanceLabel";
// import AttendanceStatus from "../AttendanceSection/AttendanceStatus";
// import {
//   BATCHES,
//   COURSES,
//   EMPLOYEE,
//   INSTRUCTORS,
//   STUDENTS,
// } from "../routes/RouteConstants";
// import { Switch } from "./Switch";
// import TableFilters from "./TableFilters";
// import TableHeader from "./TableHeader";
// import Loader from "./common/LoaderComponent";

// // ─── Chevron Icons ───────────────────────────────────────────────────────────
// const ChevronLeft = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2.5"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <polyline points="15 18 9 12 15 6" />
//   </svg>
// );
// const ChevronRight = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2.5"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <polyline points="9 18 15 12 9 6" />
//   </svg>
// );
// const ChevronDoubleLeft = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2.5"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <polyline points="11 17 6 12 11 7" />
//     <polyline points="18 17 13 12 18 7" />
//   </svg>
// );
// const ChevronDoubleRight = () => (
//   <svg
//     width="14"
//     height="14"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2.5"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <polyline points="13 17 18 12 13 7" />
//     <polyline points="6 17 11 12 6 7" />
//   </svg>
// );

// // ─── Smart Page Number Generator ─────────────────────────────────────────────
// // Shows: 1 · 2 · 3 · ··· · lastPage  (or with current page neighbours in middle)
// function getSmartPageNumbers(currentPage, totalPages) {
//   if (totalPages <= 7) {
//     return Array.from({ length: totalPages }, (_, i) => i + 1);
//   }

//   const delta = 1;
//   const left = Math.max(2, currentPage - delta);
//   const right = Math.min(totalPages - 1, currentPage + delta);

//   const range = [1];
//   for (let i = left; i <= right; i++) range.push(i);
//   range.push(totalPages);

//   const unique = [...new Set(range)].sort((a, b) => a - b);
//   const result = [];
//   let prev = null;

//   for (const page of unique) {
//     if (prev !== null) {
//       if (page - prev === 2) result.push(prev + 1);
//       else if (page - prev > 2) result.push("...");
//     }
//     result.push(page);
//     prev = page;
//   }

//   return result;
// }

// // ─── Custom Styles for react-select ──────────────────────────────────────────
// const customStyles = {
//   option: (provided, state) => ({
//     ...provided,
//     backgroundColor: state.isFocused ? "#ffcccc" : "white",
//     color: "black",
//   }),
//   control: (provided) => ({
//     ...provided,
//     width: "100%",
//     backgroundColor: "#f0f0f0",
//     borderRadius: "0.375rem",
//     fontSize: "1rem",
//     boxShadow: "none",
//     border: "1px solid #ccc",
//   }),
//   singleValue: (provided) => ({
//     ...provided,
//     fontSize: "1rem",
//     color: "inherit",
//   }),
//   dropdownIndicator: () => null,
//   indicatorSeparator: () => null,
//   menu: (provided) => ({
//     ...provided,
//     marginTop: "0.25rem",
//     borderRadius: "0.375rem",
//     boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//     zIndex: 9999,
//   }),
//   menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
// };

// const Table = ({
//   data = [],
//   columns = [],
//   columnsFilters = [],
//   handleFilterChange = () => {},
//   itemsPerPageOptions = [5, 10, 15, 20, 25, 30, 35, 40],
//   setIsEditModalOpen,
//   setIsDeleteModalOpen,
//   setIsMultipleSelected,
//   setIsStudentDetailsModalOpen,
//   setSelectedID,
//   handleEditClick,
//   handleAssignClick,
//   handleSwitchToggle,
//   ColumnUnderline = false,
//   borderNone = true,
//   sourceComponent = "",
//   TableHeadingAction = true,
//   batchEditButton = true,
//   markAttendanceDate = "",
//   BatchActiveColor = false,
//   updateMarkedAttendance = () => {},
//   handleResetChange,
//   onViewDetails,
//   onViewChallan,
//   onGenerateChallan,
//   inquiryStatus,
//   setPage,
//   setPer_page,
//   paginationMeta,
//   link = "",
//   handleStatusToggle,
//   handleResetPasswordClick,
//   handleChangePasswordClick,
// }) => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [number, setNumber] = useState("");
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const navigate = useNavigate();

//   const user = useSelector(selectCurrentUser);
//   const role = user?.role;
//   const email = user?.email;

//   const isBackendPagination = !!paginationMeta;

//   const formattedItemsPerPageOptions = itemsPerPageOptions.map((num) => ({
//     value: num,
//     label: String(num),
//   }));

//   const handleCheckboxChange = (identifier) => {
//     const isSelected = selectedRows.includes(identifier);
//     setSelectedRows((prev) =>
//       isSelected
//         ? prev.filter((id) => id !== identifier)
//         : [...prev, identifier],
//     );
//   };

//   useEffect(() => {
//     setIsMultipleSelected && setIsMultipleSelected(selectedRows.length > 0);
//   }, [selectedRows]);

//   const handlePage = () => {
//     const parsed = parseInt(number);
//     if (!isNaN(parsed)) {
//       if (isBackendPagination) setPage?.(parsed);
//       else setCurrentPage(parsed);
//       setNumber("");
//     }
//   };

//   const handlePageNumber = (e) => setNumber(e.target.value);

//   const handleChange = (e) => {
//     const newItemsPerPage = parseInt(e.value);
//     setItemsPerPage(newItemsPerPage);
//     if (isBackendPagination) {
//       setPer_page?.(newItemsPerPage);
//       setPage?.(1);
//     } else {
//       setCurrentPage(1);
//     }
//   };

//   const handleClick = (page) => {
//     if (isBackendPagination) setPage?.(page);
//     else setCurrentPage(page);
//   };

//   const handleSelectAll = () => {
//     setSelectAll(!selectAll);
//     if (!selectAll) setSelectedRows(data?.map((row) => row.name));
//     else setSelectedRows([]);
//   };

//   // ─── Pagination Calculations ────────────────────────────────────────────────
//   let indexOfLastItem, indexOfFirstItem, currentItems, pageNumbers, totalItems;

//   if (isBackendPagination) {
//     currentItems = data;
//     indexOfFirstItem = paginationMeta.from - 1 || 0;
//     indexOfLastItem = paginationMeta.to || data?.length;
//     totalItems = paginationMeta.total;
//     pageNumbers = Array.from(
//       { length: paginationMeta.last_page },
//       (_, i) => i + 1,
//     );
//     if (paginationMeta.current_page !== currentPage)
//       setCurrentPage(paginationMeta.current_page);
//   } else {
//     indexOfLastItem = currentPage * itemsPerPage;
//     indexOfFirstItem = indexOfLastItem - itemsPerPage;
//     currentItems = data?.slice(indexOfFirstItem, indexOfLastItem);
//     totalItems = data?.length;
//     pageNumbers = Array.from(
//       { length: Math.ceil(data?.length / itemsPerPage) },
//       (_, i) => i + 1,
//     );
//   }

//   const totalPages = pageNumbers.length;
//   const smartPages = getSmartPageNumbers(currentPage, totalPages);
//   const showingText = `Showing ${indexOfFirstItem + 1}–${Math.min(indexOfLastItem, totalItems)} of ${totalItems}`;

//   const hasActiveStatus = data.some((item) => item.is_active !== undefined);

//   const handleRowClick = (item) => {
//     if (sourceComponent === "CategoriesComponent")
//       navigate(`${COURSES}/${item?.id}`);
//     else if (sourceComponent === "CoursesComponent")
//       navigate(`${BATCHES}/${item?.id}`);
//   };

//   const renderStatusBadge = (item, column) => {
//     if (column === "Status" && item.statusConfig) {
//       return (
//         <span
//           className={`px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${item.statusConfig.bg} ${item.statusConfig.text}`}
//         >
//           {item.statusConfig.label}
//         </span>
//       );
//     }
//     return item[column?.toLowerCase()];
//   };

//   // ─── Pagination Button Styles ───────────────────────────────────────────────
//   const pgBase = `
//     inline-flex items-center justify-center h-[34px] min-w-[34px] px-2
//     rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150
//     border border-transparent select-none
//   `;
//   const pgDefault = `${pgBase} bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300`;
//   const pgActive = `${pgBase} bg-[#1E5A7D] text-white border-[#1E5A7D] shadow-sm`;
//   const pgNav = `${pgBase} bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed`;

//   return (
//     <>
//       {/* ─── Table ──────────────────────────────────────────────────────────── */}
//       <div className="relative max-w-full overflow-x-auto custom-horizontal-scrollbar">
//         <table className="w-full min-w-full bg-white border border-grayBorder">
//           <TableHeader
//             selectAll={selectAll}
//             handleSelectAll={handleSelectAll}
//             columns={columns}
//             TableHeadingAction={TableHeadingAction}
//             hasActiveStatus={false}
//             borderNone={borderNone}
//             sourceComponent={sourceComponent}
//           />
//           {(sourceComponent === "StudentsComponent" ||
//             sourceComponent === "InstructorsComponent" ||
//             sourceComponent === "EmployeesComponent" ||
//             sourceComponent === "BatchesComponent") && (
//             <thead>
//               <TableFilters
//                 columnsFilters={columnsFilters}
//                 handleFilterChange={handleFilterChange}
//                 handleResetChange={handleResetChange}
//               />
//             </thead>
//           )}
//           <tbody>
//             {currentItems?.length > 0 ? (
//               currentItems.map((item, index) => (
//                 <tr key={index}>
//                   <td className="py-2 pl-6 pr-4 border-b border-grayBorder">
//                     <div className="flex items-center gap-5">
//                       <div className="pl-4 text-base font-nunito">
//                         {indexOfFirstItem + index + 1}
//                       </div>
//                     </div>
//                   </td>
//                   {columns?.map((column, index) => (
//                     <td
//                       key={column}
//                       className="py-2 px-4 border-b border-grayBorder text-left font-nunito text-base capitalize"
//                       onClick={() => {
//                         if (item?.s === "student" && column === "Name") {
//                           setSelectedID(item.uuid);
//                           setIsStudentDetailsModalOpen(true);
//                         }
//                       }}
//                       onMouseOut={() => {
//                         if (item?.role === "student" && column === "Name") {
//                           setIsStudentDetailsModalOpen(false);
//                         }
//                       }}
//                     >
//                       <span
//                         className={`w-max inline-block ${
//                           !BatchActiveColor
//                             ? ColumnUnderline && index === 0
//                               ? "border-b border-dashed px-1 cursor-pointer"
//                               : ""
//                             : BatchActiveColor && index === 3
//                               ? `py-1 px-3 rounded-lg ${item.status === "In-Active" ? "bg-bloodred" : "bg-activeColor"} text-white`
//                               : ""
//                         }`}
//                         onClick={() => {
//                           if (index === 0) handleRowClick(item);
//                         }}
//                       >
//                         {sourceComponent === "AttendanceMarkSection" &&
//                         column === "Attendance" ? (
//                           <AttendanceStatus
//                             studentId={item.id}
//                             markAttendanceDate={markAttendanceDate}
//                             updateMarkedAttendance={updateMarkedAttendance}
//                           />
//                         ) : sourceComponent === "StudentAttendanceTab" &&
//                           column === "Status" ? (
//                           <AttendanceLabel
//                             value={item[column.toLowerCase()]}
//                             background={
//                               item[column.toLowerCase()] === "Present"
//                                 ? "#00A30040"
//                                 : item[column.toLowerCase()] === "Absent"
//                                   ? "#FF000040"
//                                   : item[column.toLowerCase()] === "Leave"
//                                     ? "#F8F9F9"
//                                     : ""
//                             }
//                           />
//                         ) : column === "Status" ? (
//                           renderStatusBadge(item, column)
//                         ) : column === "Class" ? (
//                           <div className="flex flex-col gap-1">
//                             {item.all_classes && item.all_classes.length > 0 ? (
//                               item.all_classes.map((cls, clsIndex) => (
//                                 <div
//                                   key={clsIndex}
//                                   className="flex items-center gap-2"
//                                 >
//                                   <span className="whitespace-nowrap">
//                                     {cls.name}
//                                   </span>
//                                   {cls.fee_status && (
//                                     <span
//                                       className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
//                                         cls.fee_status === "enrolled"
//                                           ? "bg-green-100 text-green-700"
//                                           : cls.fee_status === "process"
//                                             ? "bg-blue-100 text-blue-700"
//                                             : cls.fee_status === "pending"
//                                               ? "bg-yellow-100 text-yellow-700"
//                                               : cls.fee_status === "dropout"
//                                                 ? "bg-red-100 text-red-600"
//                                                 : "bg-gray-100 text-gray-600"
//                                       }`}
//                                     >
//                                       {cls.fee_status}
//                                     </span>
//                                   )}
//                                 </div>
//                               ))
//                             ) : (
//                               <div className="flex items-center gap-2">
//                                 <span>{item["class"]}</span>
//                                 <span
//                                   className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
//                                     item.class_fee_status === "enrolled"
//                                       ? "bg-green-100 text-green-700"
//                                       : item.class_fee_status === "process"
//                                         ? "bg-yellow-100 text-yellow-700"
//                                         : item.class_fee_status === "pending"
//                                           ? "bg-red-100 text-red-700"
//                                           : "bg-gray-100 text-gray-600"
//                                   }`}
//                                 >
//                                   {item.class_fee_status || "Dropout"}
//                                 </span>
//                               </div>
//                             )}
//                           </div>
//                         ) : (
//                           item[column?.toLowerCase()]
//                         )}
//                       </span>
//                     </td>
//                   ))}

//                   {TableHeadingAction && (
//                     <td className="px-4 py-2 text-base text-left border-b border-grayBorder w-36 font-nunito">
//                       <div className="flex">
//                         {sourceComponent === "TrainingInquiries" &&
//                           item.status?.toLowerCase() !== "enrolled" &&
//                           item.status?.toLowerCase() !== "process" && (
//                             <button
//                               className="w-[45px] h-[35px] rounded mx-1 flex items-center justify-center bg-editButtonGray text-white"
//                               onClick={() =>
//                                 navigate(
//                                   "/dashboard/training-inquiries/enroll",
//                                   {
//                                     state: {
//                                       inquiryData: item,
//                                       enrollmentId: item.id,
//                                     },
//                                   },
//                                 )
//                               }
//                             >
//                               <User />
//                             </button>
//                           )}

//                         {(item?.role === "employee" ||
//                           item?.role === "teacher" ||
//                           sourceComponent === "IndividualWorkingSpace" ||
//                           sourceComponent === "CompanyIndividual" ||
//                           sourceComponent === "StudentsComponent" ||
//                           sourceComponent === "ClassStudents" ||
//                           sourceComponent === "InstructorsComponent" ||
//                           sourceComponent === "CompanyWorkingSpace" ||
//                           sourceComponent === "Inventory" ||
//                           sourceComponent === "CoursesExpenses" ||
//                           sourceComponent === "WsExpenses" ||
//                           sourceComponent === "TrainingInquiries") && (
//                           <button
//                             className="w-[45px] h-[35px] rounded mx-1 flex items-center justify-center bg-brown text-white"
//                             onClick={() => {
//                               if (
//                                 sourceComponent === "StudentsComponent" ||
//                                 sourceComponent === "ClassStudents"
//                               )
//                                 navigate(`${STUDENTS}/${item.uuid}`);
//                               else if (item.role === "employee")
//                                 navigate(`${EMPLOYEE}/${item.uuid}`);
//                               else if (item.role === "teacher")
//                                 navigate(`${INSTRUCTORS}/${item.uuid}`);
//                               else if (
//                                 sourceComponent === "IndividualWorkingSpace"
//                               )
//                                 navigate(
//                                   `/dashboard/working-spaces/individual/${item.uuid}`,
//                                 );
//                               else if (sourceComponent === "CompanyIndividual")
//                                 navigate(
//                                   `/dashboard/working-spaces/company-individual/details/${item.uuid}`,
//                                 );
//                               else if (
//                                 sourceComponent === "CompanyWorkingSpace"
//                               )
//                                 navigate(
//                                   `/dashboard/working-spaces/company/${item.uuid}`,
//                                 );
//                               else if (
//                                 sourceComponent === "WsExpenses" ||
//                                 sourceComponent === "CoursesExpenses" ||
//                                 sourceComponent === "TrainingInquiries"
//                               ) {
//                                 if (typeof onViewDetails === "function")
//                                   onViewDetails(item);
//                               }
//                             }}
//                           >
//                             <Eye />
//                           </button>
//                         )}

//                         {sourceComponent === "RolesComponent" && (
//                           <button
//                             className="bg-[#31918D] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#2a7d7a] transition-colors"
//                             onClick={() => handleAssignClick?.(item)}
//                             title="Assign Permissions"
//                           >
//                             <Shield size={18} />
//                           </button>
//                         )}

//                         {sourceComponent === "UsersComponents" && (
//                           <button
//                             className="bg-[#31918D] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#2a7d7a] transition-colors"
//                             onClick={() => {
//                               setSelectedID(item.raw || item);
//                               setIsEditModalOpen(false);
//                               handleResetPasswordClick?.(item);
//                             }}
//                             title="Reset Password"
//                           >
//                             <Key size={18} />
//                           </button>
//                         )}
//                         {sourceComponent === "UsersComponents" && (
//                           <button
//                             className="bg-[#014376] text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center hover:bg-[#013261] transition-colors"
//                             onClick={() => {
//                               setSelectedID(item.raw || item);
//                               setIsEditModalOpen(false);
//                               handleChangePasswordClick?.(item);
//                             }}
//                             title="Change Password"
//                           >
//                             <Lock size={18} />
//                           </button>
//                         )}

//                         {batchEditButton &&
//                           (role === "admin" ||
//                             role === "oic" ||
//                             role === "manager" ||
//                             role === "asst manager") &&
//                           sourceComponent !== "IndividualWorkingSpace" &&
//                           sourceComponent !== "CompanyWorkingSpace" &&
//                           sourceComponent !== "CompanyIndividual" && (
//                             <button
//                               className="bg-beige text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center"
//                               onClick={() => {
//                                 if (
//                                   sourceComponent === "StudentsComponent" ||
//                                   sourceComponent === "ClassStudents" ||
//                                   sourceComponent === "ClassStudentEdit"
//                                 )
//                                   navigate(
//                                     `/dashboard/students/edit/${item.uuid}`,
//                                   );
//                                 else {
//                                   setIsEditModalOpen(true);
//                                   setSelectedID(item.id);
//                                   handleEditClick(item);
//                                 }
//                               }}
//                             >
//                               <PencilIcon />
//                             </button>
//                           )}

//                         {(role === "admin" ||
//                           role === "oic" ||
//                           role === "manager" ||
//                           role === "asstmanager") &&
//                           setIsDeleteModalOpen && (
//                             <>
//                               {item.courses > 0 ||
//                               item.batches > 0 ||
//                               item["total students"] > 0 ? (
//                                 <button
//                                   disabled
//                                   className="custom-ActionBtn text-black bg-editButtonGray w-[45px] h-[35px] rounded mx-1 flex items-center justify-center opacity-50"
//                                   onClick={() => {
//                                     setSelectedID(item.id);
//                                     setIsDeleteModalOpen(true);
//                                   }}
//                                 >
//                                   <BinIcon />
//                                 </button>
//                               ) : (
//                                 <button
//                                   className="custom-ActionBtn bg-editButtonGray text-white w-[45px] h-[35px] rounded mx-1 flex items-center justify-center"
//                                   onClick={() => {
//                                     setSelectedID(item.uuid);
//                                     setIsDeleteModalOpen(true);
//                                   }}
//                                 >
//                                   <Trash />
//                                 </button>
//                               )}
//                             </>
//                           )}
//                       </div>
//                     </td>
//                   )}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={columns.length + 3}
//                   className="py-10 text-center text-gray-500 font-semibold text-lg"
//                 >
//                   <div className="flex items-center justify-center gap-2">
//                     <FileText className="w-8 h-8 text-gray-400" />
//                     <span>No data found</span>
//                   </div>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ─── Pagination ─────────────────────────────────────────────────────── */}
//       <div className="flex flex-col lg:flex-row items-center justify-between px-5 py-3 mt-4 bg-white border border-gray-200 rounded-lg gap-4 shadow-sm">
//         {/* LEFT: Page Navigation */}
//         <div className="flex items-center gap-1">
//           {/* First Page */}
//           <button
//             className={pgNav}
//             onClick={() => handleClick(1)}
//             disabled={currentPage === 1}
//             title="First page"
//           >
//             <ChevronDoubleLeft />
//           </button>

//           {/* Previous */}
//           <button
//             className={pgNav}
//             onClick={() => handleClick(currentPage - 1)}
//             disabled={currentPage === 1}
//             title="Previous page"
//           >
//             <ChevronLeft />
//           </button>

//           {/* Smart Page Numbers */}
//           <div className="flex items-center gap-1 mx-1">
//             {smartPages.map((page, idx) =>
//               page === "..." ? (
//                 <span
//                   key={`dots-${idx}`}
//                   className="inline-flex items-center justify-center h-[34px] min-w-[28px] text-gray-400 text-sm tracking-widest select-none"
//                 >
//                   ···
//                 </span>
//               ) : (
//                 <button
//                   key={page}
//                   className={currentPage === page ? pgActive : pgDefault}
//                   onClick={() => handleClick(page)}
//                 >
//                   {page}
//                 </button>
//               ),
//             )}
//           </div>

//           {/* Next */}
//           <button
//             className={pgNav}
//             onClick={() => handleClick(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             title="Next page"
//           >
//             <ChevronRight />
//           </button>

//           {/* Last Page */}
//           <button
//             className={pgNav}
//             onClick={() => handleClick(totalPages)}
//             disabled={currentPage === totalPages}
//             title="Last page"
//           >
//             <ChevronDoubleRight />
//           </button>
//         </div>

//         {/* RIGHT: Per Page + Showing Info + Go To */}
//         <div className="flex flex-wrap items-center gap-4 text-sm">
//           {/* Per Page */}
//           <div className="flex items-center gap-2">
//             <span className="text-gray-500 font-medium whitespace-nowrap">
//               Per page
//             </span>
//             <div className="relative z-10 inline-block w-20">
//               <Select
//                 id="quantity"
//                 name="quantity"
//                 value={formattedItemsPerPageOptions.find(
//                   (option) =>
//                     option.value ===
//                     (isBackendPagination
//                       ? paginationMeta?.per_page
//                       : itemsPerPage),
//                 )}
//                 onChange={handleChange}
//                 options={formattedItemsPerPageOptions}
//                 styles={{
//                   ...customStyles,
//                   control: (provided) => ({
//                     ...provided,
//                     minHeight: "34px",
//                     height: "34px",
//                     backgroundColor: "#f9fafb",
//                     borderRadius: "0.375rem",
//                     fontSize: "0.8125rem",
//                     border: "1px solid #e5e7eb",
//                     boxShadow: "none",
//                   }),
//                   valueContainer: (provided) => ({
//                     ...provided,
//                     height: "34px",
//                     padding: "0 8px",
//                   }),
//                   input: (provided) => ({ ...provided, margin: "0px" }),
//                   indicatorSeparator: () => ({ display: "none" }),
//                   indicatorsContainer: (provided) => ({
//                     ...provided,
//                     height: "34px",
//                   }),
//                 }}
//                 menuPortalTarget={document.body}
//                 menuPosition="fixed"
//                 isSearchable={false}
//                 components={{
//                   DropdownIndicator: () => null,
//                   IndicatorSeparator: () => null,
//                 }}
//               />
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                 <ArrowDown width={"10"} height={"8"} />
//               </div>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="w-px h-5 bg-gray-200" />

//           {/* Showing Info */}
//           <span className="text-gray-500 whitespace-nowrap">
//             Showing{" "}
//             <span className="font-semibold text-gray-800">
//               {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalItems)}
//             </span>{" "}
//             of <span className="font-semibold text-gray-800">{totalItems}</span>
//           </span>

//           {/* Divider */}
//           <div className="w-px h-5 bg-gray-200" />

//           {/* Go To Page */}
//           <div className="flex items-center gap-2">
//             <span className="text-gray-500 font-medium whitespace-nowrap">
//               Go to
//             </span>
//             <input
//               type="number"
//               value={number}
//               onChange={handlePageNumber}
//               onKeyDown={(e) => e.key === "Enter" && handlePage()}
//               placeholder="—"
//               className="w-14 h-[34px] px-2 text-sm text-center bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E5A7D] focus:border-transparent transition-all duration-150"
//               min={1}
//               max={totalPages}
//             />
//             <button
//               className="px-3 h-[34px] text-sm font-medium text-white bg-[#1E5A7D] rounded-md hover:bg-[#16455E] active:bg-[#0F3546] transition-all duration-150"
//               onClick={handlePage}
//             >
//               Go
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Table;
