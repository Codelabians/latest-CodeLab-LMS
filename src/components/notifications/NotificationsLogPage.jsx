import React, { useMemo, useState } from "react";
import { Activity, Search, Send, Bell } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import SimplePagination from "../ui/SimplePagination";

/**
 * Global, system-wide notification log — "admin can see all of them".
 * One row per operational event, filterable by category (brand), event
 * type, date range and free text.
 */
export default function NotificationsLogPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [category, setCategory] = useState("");
  const [eventType, setEventType] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      category: category || undefined,
      event_type: eventType || undefined,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [page, perPage, category, eventType, search, dateFrom, dateTo],
  );

  const { data, isLoading } = useGetQuery(
    { path: "communication/notifications/log", params },
    { refetchOnMountOrArgChange: true },
  );

  const items = data?.data?.items || [];
  const categories = data?.data?.categories || [];
  const events = data?.data?.events || [];
  const pg = data?.meta?.pagination || {
    total: 0,
    current_page: 1,
    per_page: perPage,
  };

  const resetTo1 = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      <div className="w-11/12 mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#C90606] p-3 rounded-2xl shadow">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Notifications Log
            </h1>
            <p className="text-sm text-[#475569]">
              Every operational notification across all brands and users.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEF2F6] p-4 mb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => resetTo1(setSearch)(e.target.value)}
              placeholder="Search title or message..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#EEF2F6] text-sm focus:border-[#C90606] outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => resetTo1(setCategory)(e.target.value)}
            className="py-2 px-3 rounded-lg border border-[#EEF2F6] text-sm"
          >
            <option value="">All brands</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={eventType}
            onChange={(e) => resetTo1(setEventType)(e.target.value)}
            className="py-2 px-3 rounded-lg border border-[#EEF2F6] text-sm"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => resetTo1(setDateFrom)(e.target.value)}
            className="py-2 px-3 rounded-lg border border-[#EEF2F6] text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => resetTo1(setDateTo)(e.target.value)}
            className="py-2 px-3 rounded-lg border border-[#EEF2F6] text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEF2F6] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F6] text-left text-[#475569]">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Brand</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Message</th>
                  <th className="px-5 py-3 font-semibold text-center">Sent to</th>
                  <th className="px-5 py-3 font-semibold text-center">Push</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#94A3B8]">
                      Loading…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#94A3B8]">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                      No notifications match these filters.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3 text-[#475569] whitespace-nowrap">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#C90606] border border-[#F3D0D0]">
                          {row.category_label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#0F172A] whitespace-nowrap">
                        {row.event_label}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#0F172A]">
                          {row.title}
                        </div>
                        {row.body && row.body !== row.title && (
                          <div className="text-[#64748B]">{row.body}</div>
                        )}
                        {row.triggered_by && (
                          <div className="text-[11px] text-[#94A3B8] mt-0.5">
                            by {row.triggered_by}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center text-[#475569]">
                        {row.recipients_count}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.pushed ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] text-xs font-semibold">
                            <Send className="w-3.5 h-3.5" /> Sent
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1] text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#EEF2F6]">
            <SimplePagination
              page={pg.current_page || page}
              total={pg.total || 0}
              perPage={pg.per_page || perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              alwaysShow
            />
          </div>
        </div>
      </div>
    </div>
  );
}
