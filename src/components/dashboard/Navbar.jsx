// Navbar.js
import React, { useState } from "react";
import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileDetailsDropdown from "./ProfileDetailsDropdown";
import { useGetQuery } from "../../api/apiSlice"; // Import your RTK Query hook

const Navbar = () => {
  const navigate = useNavigate();

  // Poll the lightweight unread-count endpoint for the bell badge.
  const { data: unreadResponse, isLoading } = useGetQuery(
    { path: "communication/notifications/unread-count" },
    { pollingInterval: 30000, refetchOnMountOrArgChange: true },
  );

  const unreadCount = unreadResponse?.data?.unread || 0;

  const toggleNotification = () => {
    navigate("/dashboard/notifications");
  };
  const toggleSettings = () => {
    navigate("/dashboard/settings");
  };
  return (
    <div className="h-16 flex ml-10 my-5 justify-end items-center border-b border-divider pb-4 px-5 overflow-hidden">
      <div className="flex gap-4 items-center">
        <div onClick={toggleSettings} className="cursor-pointer relative">
          <Settings className="text-brown w-6 h-6" />
        </div>
        <div onClick={toggleNotification} className="cursor-pointer relative">
          <Bell fill="#aa0e0e" className="text-brown w-6 h-6" />

          {/* Unread Badge */}
          {!isLoading && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>

        <div className="bg-gray-300 h-9 w-px"></div>
        <ProfileDetailsDropdown />
      </div>
    </div>
  );
};

export default Navbar;
