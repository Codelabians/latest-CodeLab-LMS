import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, Circle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuery, usePatchMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";

// Brand chip labels.
const CATEGORY_LABELS = {
  tech_school: "Tech School",
  school_website: "School Website",
  it_solutions: "IT Solutions",
  stp: "STP",
};

// Functional category labels — must mirror the backend
// NotificationFunctionalCategory enum (same grouping as the Settings page).
const FUNCTIONAL_LABELS = {
  finance: "Finance",
  academic: "Student & Academic",
  attendance: "Attendance",
  crm: "CRM — Visitors & Inquiries",
  certificate: "Certificate",
  hr: "HR & Employee",
  payroll: "Payroll",
  inventory: "Inventory & Assets",
  clients: "Clients, Teams & Tasks",
  communication: "Communications",
  partnerships: "Referrals, Ambassadors & Alumni",
  celebrations: "Celebrations",
};

const fcLabel = (v) => FUNCTIONAL_LABELS[v] || "Other";

const NotificationPage = () => {
  const navigate = useNavigate();
  // Filter by functional category (same dimension as Notification Settings).
  const [categoryFilter, setCategoryFilter] = useState("all");

  const {
    data: notificationsResponse,
    isLoading,
    refetch,
  } = useGetQuery(
    { path: "communication/notifications/" },
    { refetchOnMountOrArgChange: true },
  );

  const [markPatch] = usePatchMutation();

  const notifications = notificationsResponse?.data || [];

  // Functional categories present in the current notifications, each with
  // its unread tally (shown on the filter pill).
  const categories = useMemo(() => {
    const counts = {};
    notifications.forEach((n) => {
      const fc = n?.data?.functional_category || "other";
      if (!counts[fc]) counts[fc] = { total: 0, unread: 0 };
      counts[fc].total += 1;
      if (!n.read_at) counts[fc].unread += 1;
    });
    return Object.entries(counts)
      .map(([value, c]) => ({ value, ...c }))
      .sort((a, b) => fcLabel(a.value).localeCompare(fcLabel(b.value)));
  }, [notifications]);

  const filtered = useMemo(() => {
    if (categoryFilter === "all") return notifications;
    return notifications.filter(
      (n) => (n?.data?.functional_category || "other") === categoryFilter,
    );
  }, [notifications, categoryFilter]);

  // Group the filtered list by functional category for a sectioned view.
  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((n) => {
      const fc = n?.data?.functional_category || "other";
      (map[fc] = map[fc] || []).push(n);
    });
    return Object.entries(map).sort((a, b) =>
      fcLabel(a[0]).localeCompare(fcLabel(b[0])),
    );
  }, [filtered]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAsRead = async (n) => {
    try {
      const res = await markPatch({
        path: `communication/notifications/${n.id}/read`,
        body: {},
      });
      if (res?.data?.status === 1 || res?.data?.success) {
        refetch();
      } else {
        toast.error(res?.data?.message || "Failed to mark as read");
      }
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await markPatch({
        path: "communication/notifications/mark-all-read",
        body: {},
      });
      if (res?.data?.status === 1 || res?.data?.success) {
        toast.success("All notifications marked as read");
        refetch();
      } else {
        toast.error(res?.data?.message || "Failed");
      }
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C90606] mx-auto mb-4"></div>
          <p className="text-lg text-[#475569] font-medium">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEF2F6] p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-[#C90606] p-3 rounded-2xl shadow">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-[#A00505] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                    {unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">
                  Notifications
                </h1>
                <p className="text-sm text-[#475569]">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "All caught up!"}
                </p>
              </div>
            </div>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C90606] text-white font-semibold rounded-xl hover:bg-[#A00505] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-5 h-5" />
              Mark All as Read
            </button>
          </div>

          {/* Category filter pills (by functional category, same as Settings) */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                categoryFilter === "all"
                  ? "bg-[#FEF2F2] border-[#C90606] text-[#C90606]"
                  : "bg-white border-[#EEF2F6] text-[#475569]"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1.5 ${
                  categoryFilter === c.value
                    ? "bg-[#FEF2F2] border-[#C90606] text-[#C90606]"
                    : "bg-white border-[#EEF2F6] text-[#475569]"
                }`}
              >
                {fcLabel(c.value)}
                {c.unread > 0 && (
                  <span className="bg-[#C90606] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Categorized list — one section per functional category */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#EEF2F6] p-16 text-center">
            <div className="bg-[#FEF2F2] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Bell className="w-10 h-10 text-[#C90606]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">
              No notifications
            </h3>
            <p className="text-[#475569]">
              When you get notifications, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(([fc, items]) => {
              const unreadInGroup = items.filter((n) => !n.read_at).length;
              return (
                <div key={fc}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                      {fcLabel(fc)}
                    </h2>
                    <span className="text-xs text-[#94A3B8]">
                      {items.length}
                    </span>
                    {unreadInGroup > 0 && (
                      <span className="bg-[#C90606] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                        {unreadInGroup}
                      </span>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#EEF2F6] overflow-hidden divide-y divide-[#EEF2F6]">
                    {items.map((n) => {
                      const isRead = n.read_at !== null;
                      const d = n.data || {};
                      const title = d.title || d.message || "Notification";
                      const body = d.body || d.message || "";
                      const category = d.category;
                      const actionUrl = d.action_url;
                      return (
                        <div
                          key={n.id}
                          className={`flex items-start gap-4 p-5 transition ${
                            !isRead ? "bg-[#FEF2F2]" : "bg-white hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {!isRead ? (
                              <Circle className="w-3 h-3 text-[#C90606] fill-[#C90606]" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-[#94A3B8]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-sm ${
                                  !isRead
                                    ? "text-[#0F172A] font-semibold"
                                    : "text-[#475569]"
                                }`}
                              >
                                {title}
                              </p>
                              {category && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                                  {CATEGORY_LABELS[category] || category}
                                </span>
                              )}
                            </div>
                            {body && body !== title && (
                              <p className="text-sm text-[#64748B] mt-0.5">{body}</p>
                            )}
                            {actionUrl && (
                              <button
                                onClick={() => navigate(actionUrl)}
                                className="text-xs text-[#C90606] font-medium mt-1 hover:underline"
                              >
                                Open →
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => markAsRead(n)}
                            disabled={isRead}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                              isRead
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#FEF2F2] text-[#C90606] hover:bg-[#fbe0e0]"
                            }`}
                          >
                            {isRead ? "Read" : "Mark read"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
