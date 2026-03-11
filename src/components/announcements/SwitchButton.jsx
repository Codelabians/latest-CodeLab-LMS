import React from "react";

function SwitchButton({ isActive, toggleSwitch }) {
  return (
    <td className="py-1  text-center w-20 font-nunito text-base">
      <label className="themeSwitcherTwo relative inline-flex cursor-pointer select-none items-center">
        <input
          type="checkbox"
          checked={isActive || false}
          onChange={toggleSwitch}
          className="sr-only"
        />
        <span
          className={`slider mx-4 flex h-7 w-[95px] items-center rounded-full p-1 duration-200 ${
            isActive ? "custom-SwitchButton" : "custom-AddButton"
          }`}
        >
          {isActive ? (
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
              isActive ? "translate-x-[67px]" : ""
            }`}
          ></span>
        </span>
      </label>
    </td>
  );
}

export default SwitchButton;

