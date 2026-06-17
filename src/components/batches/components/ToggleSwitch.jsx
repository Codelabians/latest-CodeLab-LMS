import { FiCheckCircle, FiRefreshCw, FiXCircle } from "react-icons/fi";

const ToggleSwitch = ({ isActive, isLoading, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={isLoading}
    title={isActive ? "Click to deactivate" : "Click to activate"}
    className={`
      relative inline-flex items-center w-14 h-7 rounded-full
      transition-all duration-300 flex-shrink-0
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d61111]
      ${
        isLoading
          ? "cursor-not-allowed opacity-50 bg-gray-200"
          : isActive
            ? "bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] shadow-lg shadow-teal-200/60 cursor-pointer"
            : "bg-gray-200 hover:bg-gray-300 cursor-pointer"
      }
    `}
  >
    {/* Knob */}
    <span
      className={`
        absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
        flex items-center justify-center transition-all duration-300
        ${isActive ? "left-8" : "left-1"}
      `}
    >
      {isLoading ? (
        <FiRefreshCw className="w-2.5 h-2.5 text-gray-400 animate-spin" />
      ) : isActive ? (
        <FiCheckCircle className="w-2.5 h-2.5 text-[#d61111]" />
      ) : (
        <FiXCircle className="w-2.5 h-2.5 text-gray-300" />
      )}
    </span>
  </button>
);

export default ToggleSwitch;
