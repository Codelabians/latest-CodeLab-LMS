import React from "react";

const TableHeader = ({
  selectAll,
  handleSelectAll,
  columns,
  TableHeadingAction,
  hasActiveStatus,
  borderNone,
}) => {
  return (
    <thead
      className={`font-medium text-xl  ${
        borderNone && "border-b border-grayBorder "
      }`}
    >
      <tr>
        <td className="py-2 pr-4 pl-6 text-left">
          <div className="flex gap-5 items-center">
            {/* <div className="self-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              ></input>
            </div> */}
            <div className="text-nowrap text-tableHeading font-poppins text-xl">
              SR #
            </div>
          </div>
        </td>
        {columns.map((column) => (
          <td
            key={column}
            className={`text-nowrap py-2 px-4 text-left text-tableHeading font-poppins text-xl`}
          >
            {column}
          </td>
        ))}

        {hasActiveStatus && (
          <td className="py-2 px-4 text-center w-36 text-tableHeading font-poppins text-xl">
            Status
          </td>
        )}
        {TableHeadingAction && (
          <td
            className={`py-2 px-4 text-left w-36 text-tableHeading font-poppins text-xl`}
          >
            Action
          </td>
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;
