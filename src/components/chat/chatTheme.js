// Shared tokens + tiny date helpers for the group-chat feature.
// Matches the visual language of WhatsAppInbox / the rest of the admin.
export const BRAND = "#C90606";
export const BRAND_TINT = "#FEF2F2";
export const BRAND_DARK = "#A00505";
export const BORDER = "#EEF2F6";
export const TEXT_PRIMARY = "#0F172A";
export const TEXT_SECONDARY = "#475569";
export const TEXT_MUTED = "#94A3B8";
export const SURFACE = "#F8FAFC";
export const THREAD_BG = "#EFEAE2";
export const MINE_BG = "#FDE7E7"; // brand-tinted "my message" bubble

export const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const fmtListTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export const fmtDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDuration = (secs) => {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Same admin-bypass permission check used by SidebarComponent.
export const userIsChatStaff = (user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes("manage group-chats");
};
