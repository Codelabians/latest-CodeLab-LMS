import React, { useState } from "react";
import Select from "react-select";

const statusOptions = [
  {
    value: 1,
    label: "Active",
  },
  { 
    value: 0,
    label: "InActive",
  },
];

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#FF0000" : provided.backgroundColor,
    color: state.isSelected ? "white" : provided.color,
    "&:hover": {
      backgroundColor: state.isSelected ? "" : "#DB0000",
      color: "white",
    },
  }),
  control: (provided) => ({
    ...provided,
    borderRadius: "10px",
    borderColor: "#ccc",
    boxShadow: "none",
    paddingTop: "2px",
    paddingBottom: "2px",
    "&:hover": {
      borderColor: "#888",
    },
  }),
};

const TableFilters = ({ columnsFilters, handleFilterChange }) => {
  const [filters, setFilters] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFilters({ ...filters, [name]: value });
    handleFilterChange(name, value);
  };

  return (
    <tr className="bg-backgroundGray ">
      {columnsFilters.map((columnFilter) => (
        <td
          key={columnFilter.placeholder}
          className={`py-4 px-4  text-left text-tableHeading font-poppins`}
        >
          {columnFilter.field !== "Dropdown" &&
            columnFilter.field !== "button" &&
            columnFilter.field !== "date" &&
            columnFilter.key !== "fee" && ( // Added fee filter exclusion
              <input
                value={filters[columnFilter.key] || ""}
                name={columnFilter.key}
                type={columnFilter.field}
                placeholder={columnFilter.placeholder}
                disabled={columnFilter.isDisabled}
                className={`p-2 rounded-lg w-40 bg-white ${
                  columnFilter.isDisabled
                    ? "cursor-not-allowed bg-white w-40"
                    : ""
                }`}
                onChange={handleInputChange}
              />
            )}
        </td>
      ))}
    </tr>
  );
};

export default TableFilters;
