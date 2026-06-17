import React from "react";
import { Hash, Zap } from "lucide-react";

const TableHeader = ({
  selectAll,
  handleSelectAll,
  columns,
  TableHeadingAction,
  hasActiveStatus,
  borderNone,
  sourceComponent,
}) => {
  return (
    <thead>
      <tr className="bg-[#aa0e0e]">
        {/* SR # */}
        <th className="py-3 pl-5 pr-3 text-left rounded-tl-xl w-14">
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-white/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80 whitespace-nowrap">
              Sr
            </span>
          </div>
        </th>

        {/* Data columns */}
        {columns.map((column, i) => (
          <th
            key={column}
            className="py-3 px-4 text-left"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80 whitespace-nowrap">
              {column}
            </span>
          </th>
        ))}

        {hasActiveStatus && (
          <th className="py-3 px-4 text-left w-28">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
              Status
            </span>
          </th>
        )}

        {TableHeadingAction && (
          <th className="py-3 px-4 text-left w-36 rounded-tr-xl">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-white/60" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
                Action
              </span>
            </div>
          </th>
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;