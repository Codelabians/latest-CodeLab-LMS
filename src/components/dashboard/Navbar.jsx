// Navbar.js
import React, { useEffect, useRef, useState } from "react";
import { Bell, MessagesSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileDetailsDropdown from "./ProfileDetailsDropdown";
import { useGetQuery } from "../../api/apiSlice"; // Import your RTK Query hook
import RefreshButton from "../common/RefreshButton";
import { armNotifySounds, playNotificationSound, playWhatsAppSound, playChatSound, soundsEnabled, setSoundsEnabled, playTestSounds } from "../../utils/notifySounds";
import { Volume2, VolumeX } from "lucide-react";
import { showToast } from "../ui/common/ShowToast";

const Navbar = () => {
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useState(soundsEnabled());

  // Poll the lightweight unread-count endpoint for the bell badge.
  const { data: unreadResponse, isLoading } = useGetQuery(
    { path: "communication/notifications/unread-count" },
    { pollingInterval: 15000, refetchOnMountOrArgChange: true },
  );

  const unreadCount = unreadResponse?.data?.unread || 0;
  const waUnreadCount = unreadResponse?.data?.whatsapp_unread || 0;
  const chatUnreadCount = unreadResponse?.data?.chat_unread || 0;

  // Audible alerts while the portal is open: general notifications get one
  // chime, WhatsApp messages a distinct one. Sounds unlock on first click.
  useEffect(() => { armNotifySounds(); }, []);
  const prevCounts = useRef(null);
  useEffect(() => {
    if (!unreadResponse) return;
    const prev = prevCounts.current;
    if (prev) {
      if (waUnreadCount > prev.wa) {
        playWhatsAppSound();
        showToast("New WhatsApp message received.", "info");
      }
      if (unreadCount > prev.unread) {
        playNotificationSound();
        showToast("You have a new notification.", "info");
      }
      if (chatUnreadCount > (prev.chat || 0)) {
        playChatSound();
        showToast("New chat message received.", "info");
      }
    }
    prevCounts.current = { unread: unreadCount, wa: waUnreadCount, chat: chatUnreadCount };
  }, [unreadResponse, unreadCount, waUnreadCount, chatUnreadCount]);

  const toggleNotification = () => {
    navigate("/dashboard/notifications");
  };
  const toggleSettings = () => {
    navigate("/dashboard/settings");
  };
  return (
    <div className="h-16 flex ml-10 my-5 justify-end items-center border-b border-divider pb-4 px-5 overflow-hidden">
      <div className="flex gap-4 items-center">
        {/* Soft refresh — refetches the data on screen, no page reload */}
        <RefreshButton />
        {/* Notification sounds on/off — clicking plays the two test chimes
            (and doubles as the browser's audio-unlock gesture). */}
        <button
          type="button"
          title={soundOn ? "Notification sounds ON — click to test & toggle" : "Notification sounds OFF — click to enable"}
          onClick={() => {
            const next = !soundOn;
            setSoundsEnabled(next);
            setSoundOn(next);
            if (next) { playTestSounds(); showToast("Sounds ON — that's how notifications & WhatsApp will sound.", "success"); }
            else showToast("Notification sounds muted.", "info");
          }}
          className="cursor-pointer"
        >
          {soundOn ? <Volume2 className="text-brown w-5 h-5" /> : <VolumeX className="w-5 h-5" style={{ color: "#94A3B8" }} />}
        </button>
        <div onClick={toggleSettings} className="cursor-pointer relative">
          <Settings className="text-brown w-6 h-6" />
        </div>
        {/* Group chats — badge mirrors the bell's unread pattern */}
        <div onClick={() => navigate("/dashboard/group-chats")} className="cursor-pointer relative" title="Group chats">
          <MessagesSquare className="text-brown w-6 h-6" />
          {!isLoading && chatUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg text-[10px]">
              {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
            </div>
          )}
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
