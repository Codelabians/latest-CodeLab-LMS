import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from "lucide-react";
import Select from "react-select";
import ArrowDown from "../../assets/icons/ArrowDown";

const selectStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#fef2f2" : "white",
    color: "#1a0505",
    fontSize: "13px",
  }),
  control: (provided) => ({
    ...provided,
    minHeight: "34px",
    height: "34px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    fontSize: "13px",
    boxShadow: "none",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "34px",
    padding: "0 8px",
  }),
  input: (provided) => ({ ...provided, margin: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (provided) => ({ ...provided, height: "34px" }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
};

const NavBtn = ({ onClick, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500
               hover:border-[#aa0e0e] hover:text-[#aa0e0e] hover:bg-red-50
               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400 disabled:hover:bg-white
               transition-all duration-150"
  >
    {children}
  </button>
);

const TablePagination = ({
  currentPage,
  pageNumbers,
  handleClick,
  itemsPerPage,
  paginationMeta,
  isBackendPagination,
  formattedItemsPerPageOptions,
  handleChange,
  number,
  handlePageNumber,
  handlePage,
  showingText,
}) => {
  const totalPages = pageNumbers.length;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between px-5 py-3 mt-3 bg-white border border-gray-100 rounded-xl gap-4 shadow-sm">

      {/* Left: Page navigation */}
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => handleClick(1)} disabled={currentPage === 1} title="First page">
          <ChevronsLeft size={14} />
        </NavBtn>
        <NavBtn onClick={() => handleClick(currentPage - 1)} disabled={currentPage === 1} title="Previous">
          <ChevronLeft size={14} />
        </NavBtn>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => handleClick(num)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-medium transition-all duration-150
                ${currentPage === num
                  ? "bg-[#aa0e0e] text-white shadow-sm shadow-red-900/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#aa0e0e] hover:text-[#aa0e0e] hover:bg-red-50"
                }`}
            >
              {num}
            </button>
          ))}
        </div>

        <NavBtn onClick={() => handleClick(currentPage + 1)} disabled={currentPage === totalPages} title="Next">
          <ChevronRight size={14} />
        </NavBtn>
        <NavBtn onClick={() => handleClick(totalPages)} disabled={currentPage === totalPages} title="Last page">
          <ChevronsRight size={14} />
        </NavBtn>
      </div>

      {/* Right: Per page + Showing + Go to */}
      <div className="flex flex-wrap items-center gap-3 text-sm">

        {/* Per page */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
            Per page
          </span>
          <div className="relative w-[68px]">
            <Select
              value={formattedItemsPerPageOptions.find(
                (o) => o.value === (isBackendPagination ? paginationMeta?.per_page : itemsPerPage)
              )}
              onChange={handleChange}
              options={formattedItemsPerPageOptions}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isSearchable={false}
              components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
            />
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <ArrowDown width="10" height="8" />
            </div>
          </div>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        {/* Showing info */}
        <span className="text-[12px] text-gray-400 whitespace-nowrap">
          {showingText}
        </span>

        <div className="w-px h-4 bg-gray-200" />

        {/* Go to page */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
            Go to
          </span>
          <input
            type="number"
            value={number}
            onChange={handlePageNumber}
            onKeyDown={(e) => e.key === "Enter" && handlePage()}
            min={1}
            max={totalPages}
            placeholder="—"
            className="w-12 h-[34px] px-2 text-[13px] text-center bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-[#aa0e0e]/20 focus:border-[#aa0e0e]
                       transition-all duration-150"
          />
          <button
            onClick={handlePage}
            className="inline-flex items-center gap-1.5 px-3 h-[34px] text-[12px] font-semibold text-white bg-[#aa0e0e] rounded-lg
                       hover:bg-[#8a0b0b] active:scale-95 transition-all duration-150"
          >
            Go <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;