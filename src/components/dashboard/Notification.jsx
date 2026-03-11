import React, { useState } from "react";
import { Bell, CheckCheck, Circle, CheckCircle2 } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { toast } from "react-toastify";

const NotificationPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    data: notificationsResponse,
    isLoading,
    refetch,
  } = useGetQuery({
    path: "/admin/notifications",
  });

  const [markAsReadMutation, { isLoading: isMarkingAsRead }] =
    usePostMutation();
  const [markAllAsReadMutation, { isLoading: isMarkingAllAsRead }] =
    usePostMutation();

  const notifications = notificationsResponse?.data || [];
  const meta = notificationsResponse?.meta?.pagination;

  const markAsRead = async (id) => {
    try {
      const response = await markAsReadMutation({
        path: `/admin/notifications/${id}/read?_method=patch`,
        values: {},
      });

      if (response?.data?.status === 1) {
        toast.success(response?.data?.message || "Notification marked as read");
        refetch();
      } else {
        toast.error(
          response?.data?.message || "Failed to mark notification as read"
        );
      }
    } catch (error) {
      toast.error("An error occurred while marking notification as read");
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await markAllAsReadMutation({
        path: "/admin/notifications/mark-all-read?_method=PATCH",
        values: {},
      });

      if (response?.data?.status === 1) {
        toast.success(
          response?.data?.message || "All notifications marked as read"
        );
        refetch();
      } else {
        toast.error(
          response?.data?.message || "Failed to mark all notifications as read"
        );
      }
    } catch (error) {
      toast.error("An error occurred while marking all notifications as read");
      console.error("Error marking all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="custom-AddButton p-4 rounded-2xl shadow-lg">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Notifications
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  {unreadCount > 0 ? (
                    <>
                      <span className="text-orange-600 font-semibold">
                        {unreadCount}
                      </span>{" "}
                      unread notification{unreadCount !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "All caught up!"
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 custom-AddButton text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:transform-none"
            >
              <CheckCheck className="w-5 h-5" />
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
                  <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brown" />
                      Message
                    </div>
                  </th>
                  <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider w-48">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const isRead = notification.read_at !== null;
                  const message = notification.data?.message || "No message";

                  return (
                    <tr
                      key={notification.id}
                      className={`group transition-all duration-200 ${
                        !isRead
                          ? "bg-orange-50 hover:bg-orange-100"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {!isRead ? (
                              <Circle className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-base leading-relaxed ${
                                !isRead
                                  ? "text-gray-900 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {message}
                            </p>
                            {notification.data?.data?.inventory && (
                              <div className="mt-2 text-sm text-gray-500">
                                <span className="font-semibold">Tag:</span>{" "}
                                {
                                  notification.data.data.inventory.inventory
                                    ?.tag
                                }
                                {notification.data.data.inventory.inventory
                                  ?.serial_numbers && (
                                  <>
                                    {" | "}
                                    <span className="font-semibold">
                                      Serial:
                                    </span>{" "}
                                    {
                                      notification.data.data.inventory.inventory
                                        .serial_numbers
                                    }
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            disabled={isRead}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                              isRead
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200 hover:text-orange-800 shadow-sm hover:shadow-md transform hover:scale-105"
                            }`}
                          >
                            {isRead ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Read
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4" />
                                Mark as Read
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-16 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-12 h-12 text-brown" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No notifications yet
            </h3>
            <p className="text-gray-600 text-lg">
              When you get notifications, they'll show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
