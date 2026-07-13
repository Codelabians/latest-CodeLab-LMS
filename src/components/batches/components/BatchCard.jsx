import { FiCheckCircle, FiXCircle, FiZap } from "react-icons/fi";
import ToggleSwitch from "./ToggleSwitch";

const BatchCard = ({ batch, index, active, loading, onToggle }) => (
  <div
    className={`
      group relative bg-white rounded-2xl border overflow-hidden
      transition-all duration-300 hover:-translate-y-0.5
      ${
        active
          ? "border-teal-100 shadow-md shadow-teal-50/80 hover:shadow-lg hover:shadow-teal-100/60"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
      }
    `}
  >
    {/* Left accent strip */}
    <div
      className={`
      absolute left-0 top-0 bottom-0 w-1 transition-all duration-300
      ${
        active
          ? "bg-gradient-to-b from-[#aa0e0e] to-[#aa0e0e]"
          : "bg-gray-100 group-hover:bg-gray-200"
      }
    `}
    />

    {/* Main row */}
    <div className="flex items-center gap-4 pl-6 pr-5 py-4">
      {/* Index badge */}
      <div
        className={`
        relative w-12 h-12 rounded-2xl flex items-center justify-center
        font-black text-sm flex-shrink-0 transition-all duration-300 select-none
        ${
          active
            ? "bg-gradient-to-br from-[#aa0e0e] to-[#aa0e0e] text-white shadow-lg shadow-teal-200/40"
            : "bg-gray-50 text-gray-300 border-2 border-dashed border-gray-150"
        }
      `}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p
          className={`
          text-sm font-bold truncate transition-colors duration-200
          ${active ? "text-gray-900 group-hover:text-[#aa0e0e]" : "text-gray-400"}
        `}
        >
          {batch.name}
          {(batch.teacher_name || batch.teacher?.name) && (
            <span className="font-medium text-gray-400"> · {batch.teacher_name || batch.teacher?.name}</span>
          )}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={`
            inline-flex items-center gap-1.5
            ${active ? "text-emerald-500" : "text-gray-300"}
          `}
          >
            <span
              className={`
              w-1.5 h-1.5 rounded-full flex-shrink-0
              ${active ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-200" : "bg-gray-200"}
            `}
            />
            <span className="text-xs font-semibold">
              {active ? "Live & Active" : "Inactive"}
            </span>
          </span>

          {active && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100">
              <FiZap className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                Running
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Status badge */}
        <span
          className={`
          hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5
          rounded-xl text-xs font-bold border transition-all duration-200
          ${
            active
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-gray-50 text-gray-300 border-gray-100"
          }
        `}
        >
          {active ? (
            <FiCheckCircle className="w-3 h-3" />
          ) : (
            <FiXCircle className="w-3 h-3" />
          )}
          {active ? "Enabled" : "Disabled"}
        </span>

        {/* Vertical divider */}
        <div className="w-px h-7 bg-gray-100 hidden sm:block" />

        {/* Toggle */}
        <ToggleSwitch
          isActive={active}
          isLoading={loading}
          onChange={() => onToggle(batch)}
        />
      </div>
    </div>

    {/* Footer bar */}
    <div
      className={`
      flex items-center justify-between px-6 py-2.5 border-t transition-all duration-200
      ${
        active
          ? "bg-gradient-to-r from-teal-50/40 to-blue-50/20 border-teal-50"
          : "bg-gray-50/40 border-gray-50"
      }
    `}
    >
      <span className="text-[11px] font-medium text-gray-400">
        ID: <span className="font-bold text-gray-500">#{batch.id}</span>
      </span>
      <span
        className={`text-[11px] font-semibold flex items-center gap-1
        ${active ? "text-teal-500" : "text-gray-300"}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${active ? "bg-teal-400" : "bg-gray-200"}`}
        />
        {active ? "Visible to students" : "Hidden from students"}
      </span>
    </div>
  </div>
);

export default BatchCard;
