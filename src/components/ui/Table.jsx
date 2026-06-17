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
  ALLBATCHES,
  COURSES,
  EMPLOYEE,
  INSTRUCTORS,
  STUDENTS,
} from "../routes/RouteConstants";
import { Switch } from "./Switch";
import TableFilters from "./TableFilters";
import TableHeader from "./TableHeader";
import TablePagination from "./TablePagination";
import Loader from "./common/LoaderComponent";

const formattedOptions = (options) =>
  options.map((num) => ({ value: num, label: String(num) }));

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

  const isBackendPagination = !!paginationMeta;
  const formattedItemsPerPageOptions = formattedOptions(itemsPerPageOptions);

  const handleCheckboxChange = (identifier) => {
    const isSelected = selectedRows.includes(identifier);
    setSelectedRows((prev) =>
      isSelected ? prev.filter((id) => id !== identifier) : [...prev, identifier]
    );
  };

  useEffect(() => {
    setIsMultipleSelected && setIsMultipleSelected(selectedRows.length > 0);
  }, [selectedRows]);

  const handlePage = () => {
    if (isBackendPagination) setPage?.(parseInt(number));
    else setCurrentPage(parseInt(number));
  };

  const handlePageNumber = (e) => setNumber(parseInt(e.target.value));

  const handleChange = (e) => {
    const newItemsPerPage = parseInt(e.value);
    setItemsPerPage(newItemsPerPage);
    if (isBackendPagination) {
      setPer_page?.(newItemsPerPage);
      setPage?.(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleClick = (num) => {
    if (isBackendPagination) setPage?.(num);
    else setCurrentPage(num);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) setSelectedRows(data?.map((row) => row.name));
    else setSelectedRows([]);
  };

  let indexOfLastItem, indexOfFirstItem, currentItems, pageNumbers, totalItems;

  if (isBackendPagination) {
    currentItems = data;
    indexOfFirstItem = paginationMeta.from - 1 || 0;
    indexOfLastItem = paginationMeta.to || data?.length;
    totalItems = paginationMeta.total;
    pageNumbers = Array.from({ length: paginationMeta.last_page }, (_, i) => i + 1);
    if (paginationMeta.current_page !== currentPage) setCurrentPage(paginationMeta.current_page);
  } else {
    indexOfLastItem = currentPage * itemsPerPage;
    indexOfFirstItem = indexOfLastItem - itemsPerPage;
    currentItems = data?.slice(indexOfFirstItem, indexOfLastItem);
    totalItems = data?.length;
    pageNumbers = [];
    for (let i = 1; i <= Math.ceil(data?.length / itemsPerPage); i++) pageNumbers.push(i);
  }

  const showingText = `Showing ${indexOfFirstItem + 1} to ${
    indexOfLastItem > totalItems ? totalItems : indexOfLastItem
  } of ${totalItems}`;

  const hasActiveStatus = data.some((item) => item.is_active !== undefined);

  const handleRowClick = (item) => {
    if (sourceComponent === "CategoriesComponent") navigate(`${COURSES}/${item?.id}`);
    else if (sourceComponent === "CoursesComponent") navigate(ALLBATCHES);
  };

  const renderStatusBadge = (item, column) => {
    if (column === "Status" && item.statusConfig) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${item.statusConfig.bg} ${item.statusConfig.text}`}>
          {item.statusConfig.label}
        </span>
      );
    }
    return item[column?.toLowerCase()];
  };

  /* ── Action button base style ── */
  const actionBtn = "w-[38px] h-[34px] rounded-lg mx-0.5 flex items-center justify-center transition-all duration-150 active:scale-95";

  return (
    <>
      <div className="relative max-w-full overflow-x-auto rounded-xl border border-gray-100 shadow-sm custom-horizontal-scrollbar">
        <table className="w-full min-w-full bg-white">

          {/* Column headers */}
          <TableHeader
            selectAll={selectAll}
            handleSelectAll={handleSelectAll}
            columns={columns}
            TableHeadingAction={TableHeadingAction}
            hasActiveStatus={false}
            borderNone={borderNone}
            sourceComponent={sourceComponent}
          />

          {/* Filter row */}
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

          {/* Body */}
          <tbody>
            {currentItems?.length > 0 ? (
              currentItems.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-300 hover:bg-red-50/30 transition-colors duration-100 group"
                >
                  {/* SR # */}
                  <td className="py-2.5 pl-5 pr-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 border border-gray-100 text-[11px] font-semibold text-gray-400 font-mono">
                      {indexOfFirstItem + index + 1}
                    </span>
                  </td>

                  {/* Data cells */}
                  {columns?.map((column, colIndex) => (
                    <td
                      key={column}
                      className="py-2.5 px-4 text-left text-[13px] text-slate-700 font-medium capitalize"
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
                            ? ColumnUnderline && colIndex === 0
                              ? "border-b border-dashed border-[#aa0e0e]/40 px-1 cursor-pointer text-[#aa0e0e]"
                              : ""
                            : BatchActiveColor && colIndex === 3
                              ? `py-1 px-3 rounded-lg text-xs font-semibold ${
                                  item.status === "In-Active"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`
                              : ""
                        }`}
                        onClick={() => { if (colIndex === 0) handleRowClick(item); }}
                      >
                        {sourceComponent === "AttendanceMarkSection" && column === "Attendance" ? (
                          <AttendanceStatus
                            studentId={item.id}
                            markAttendanceDate={markAttendanceDate}
                            updateMarkedAttendance={updateMarkedAttendance}
                          />
                        ) : sourceComponent === "StudentAttendanceTab" && column === "Status" ? (
                          <AttendanceLabel
                            value={item[column.toLowerCase()]}
                            background={
                              item[column.toLowerCase()] === "Present" ? "#00A30040"
                              : item[column.toLowerCase()] === "Absent" ? "#FF000040"
                              : item[column.toLowerCase()] === "Leave" ? "#F8F9F9"
                              : ""
                            }
                          />
                        ) : column === "Status" ? (
                          renderStatusBadge(item, column)
                        ) : column === "Class" ? (
                          <div className="flex flex-col gap-1">
                            {item.all_classes && item.all_classes.length > 0 ? (
                              item.all_classes.map((cls, clsIndex) => (
                                <div key={clsIndex} className="flex items-center gap-2">
                                  <span className="whitespace-nowrap">{cls.name}</span>
                                  {cls.fee_status && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                      cls.fee_status === "enrolled" ? "bg-green-100 text-green-700"
                                      : cls.fee_status === "process" ? "bg-blue-100 text-blue-700"
                                      : cls.fee_status === "pending" ? "bg-yellow-100 text-yellow-700"
                                      : cls.fee_status === "dropout" ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-600"
                                    }`}>
                                      {cls.fee_status}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{item["class"]}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                  item.class_fee_status === "enrolled" ? "bg-green-100 text-green-700"
                                  : item.class_fee_status === "process" ? "bg-yellow-100 text-yellow-700"
                                  : item.class_fee_status === "pending" ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                                }`}>
                                  {item.class_fee_status || "Dropout"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          item[column?.toLowerCase()]
                        )}
                      </span>
                    </td>
                  ))}

                  {/* Actions */}
                  {TableHeadingAction && (
                    <td className="px-4 py-2.5 text-left w-36">
                      <div className="flex items-center">

                        {sourceComponent === "TrainingInquiries" &&
                          item.status?.toLowerCase() !== "enrolled" &&
                          item.status?.toLowerCase() !== "process" && (
                            <button
                              className={`${actionBtn} bg-slate-500 hover:bg-slate-600 text-white`}
                              onClick={() => navigate("/dashboard/training-inquiries/enroll", { state: { inquiryData: item, enrollmentId: item.id } })}
                            >
                              <User size={15} />
                            </button>
                          )}

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
                            className={`${actionBtn} bg-[#aa0e0e] hover:bg-[#8a0b0b] text-white`}
                            onClick={() => {
                              if (sourceComponent === "StudentsComponent" || sourceComponent === "ClassStudents") navigate(`${STUDENTS}/${item.uuid}`);
                              else if (item.role === "employee") navigate(`${EMPLOYEE}/${item.uuid}`);
                              else if (item.role === "teacher") navigate(`${INSTRUCTORS}/${item.uuid}`);
                              else if (sourceComponent === "IndividualWorkingSpace") navigate(`/dashboard/working-spaces/individual/${item.uuid}`);
                              else if (sourceComponent === "CompanyIndividual") navigate(`/dashboard/working-spaces/company-individual/details/${item.uuid}`);
                              else if (sourceComponent === "CompanyWorkingSpace") navigate(`/dashboard/working-spaces/company/${item.uuid}`);
                              else if (sourceComponent === "WsExpenses" || sourceComponent === "CoursesExpenses" || sourceComponent === "TrainingInquiries") {
                                if (typeof onViewDetails === "function") onViewDetails(item);
                              }
                            }}
                          >
                            <Eye size={15} />
                          </button>
                        )}

                        {sourceComponent === "RolesComponent" && (
                          <button
                            className={`${actionBtn} bg-slate-600 hover:bg-slate-700 text-white`}
                            onClick={() => handleAssignClick?.(item)}
                            title="Assign Permissions"
                          >
                            <Shield size={15} />
                          </button>
                        )}

                        {sourceComponent === "UsersComponents" && (
                          <button
                            className={`${actionBtn} bg-slate-400 hover:bg-slate-500 text-white`}
                            onClick={() => { setSelectedID(item.raw || item); setIsEditModalOpen(false); handleResetPasswordClick?.(item); }}
                            title="Reset Password"
                          >
                            <Key size={15} />
                          </button>
                        )}

                        {sourceComponent === "UsersComponents" && (
                          <button
                            className={`${actionBtn} bg-slate-800 hover:bg-slate-900 text-white`}
                            onClick={() => { setSelectedID(item.raw || item); setIsEditModalOpen(false); handleChangePasswordClick?.(item); }}
                            title="Change Password"
                          >
                            <Lock size={15} />
                          </button>
                        )}

                        {batchEditButton &&
                          (role === "admin" || role === "oic" || role === "manager" || role === "asst manager") &&
                          sourceComponent !== "IndividualWorkingSpace" &&
                          sourceComponent !== "CompanyWorkingSpace" &&
                          sourceComponent !== "CompanyIndividual" && (
                            <button
                              className={`${actionBtn} bg-amber-500 hover:bg-amber-600 text-white`}
                              onClick={() => {
                                if (sourceComponent === "StudentsComponent" || sourceComponent === "ClassStudents" || sourceComponent === "ClassStudentEdit") {
                                  navigate(`/dashboard/students/edit/${item.uuid}`);
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

                        {(role === "admin" || role === "oic" || role === "manager" || role === "asstmanager") && setIsDeleteModalOpen && (
                          <>
                            {item.courses > 0 || item.batches > 0 || item["total students"] > 0 ? (
                              <button
                                disabled
                                className={`${actionBtn} bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed`}
                                onClick={() => { setSelectedID(item.id); setIsDeleteModalOpen(true); }}
                              >
                                <BinIcon />
                              </button>
                            ) : (
                              <button
                                className={`${actionBtn} bg-red-100 hover:bg-red-200 text-red-600`}
                                onClick={() => { setSelectedID(item.uuid); setIsDeleteModalOpen(true); }}
                              >
                                <Trash size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                      <FileText size={24} className="text-[#aa0e0e]/40" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                      No data found
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        pageNumbers={pageNumbers}
        handleClick={handleClick}
        itemsPerPage={itemsPerPage}
        paginationMeta={paginationMeta}
        isBackendPagination={isBackendPagination}
        formattedItemsPerPageOptions={formattedOptions(itemsPerPageOptions)}
        handleChange={handleChange}
        number={number}
        handlePageNumber={handlePageNumber}
        handlePage={handlePage}
        showingText={showingText}
      />
    </>
  );
};

export default Table;