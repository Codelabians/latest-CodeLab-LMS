import React from "react";

function SwitchButton({ id, switchStates, handleSwitchCheckboxChange }) {
  return (
    <td className="py-2 px-4 border-b border-grayBorder text-center w-56 font-nunito text-base">
      <label className="themeSwitcherTwo relative inline-flex cursor-pointer select-none items-center">
        <input
          type="checkbox"
          checked={switchStates[id] || false}
          onChange={() => handleSwitchCheckboxChange(id)}
          className="sr-only"
        />
        <span
          className={`slider mx-4 flex h-7 w-[95px] items-center rounded-full p-1 duration-200 ${
            switchStates[id] ? "bg-activeColor" : "custom-AddButton"
          }`}
        >
          {switchStates[id] ? (
            <span className=" absolute left-7 text-white tracking-wider text-sm font-bold  ">
              Active
            </span>
          ) : (
            <span className=" absolute right-6  text-white text-sm font-bold ">
              In-Active
            </span>
          )}
          <span
            className={`dot h-5 w-5 rounded-full bg-white duration-700 ${
              switchStates[id] ? "translate-x-[67px]" : ""
            }`}
          ></span>
        </span>
      </label>
    </td>
  );
}

export default SwitchButton;
