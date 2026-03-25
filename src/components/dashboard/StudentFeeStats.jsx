import React from "react";

// Modern Color Scheme
const COLORS = {
  primary: "#aa0e0e",
  secondary: "#d61111",
  accent: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  light: "#f8fafc",
  dark: "#0f172a",
  border: "#e2e8f0",
  cardBg: "#ffffff",
};

const StudentFeeStats = ({ dashboardData }) => {
  const feeData = dashboardData?.fee || {};

  // Safely extract paid_students data (fallback to null/0)
  const paidStudents = feeData.paid_students || {};
  const civilianCount = paidStudents.civilian ?? 0;
  const civilianAmount = paidStudents.civilian_amount ?? 0;
  const militaryCount = paidStudents.military ?? 0;
  const militaryAmount = paidStudents.military_amount ?? 0;

  // Total paid (from paid_students or top-level fields)
  const totalPaidCount =
    paidStudents.total_count ?? feeData.total_paid_count ?? 0;
  const totalPaidAmount =
    paidStudents.total_amount ?? feeData.total_paid_amount ?? 0;

  // This week & month
  const thisWeekPaidCount = feeData.this_week_paid_count ?? 0;
  const thisWeekPaidAmount = feeData.this_week_paid_amount ?? 0;
  const thisMonthPaidCount = feeData.this_month_paid_count ?? 0;
  const thisMonthPaidAmount = feeData.this_month_paid_amount ?? 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-PK").format(num || 0);
  };

  const StatCard = ({ title, count, amount, gradient, icon }) => (
    <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 custom-Background">
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <div className="absolute inset-0 transform rotate-12 translate-x-10 -translate-y-10">
          {icon}
        </div>
      </div>
      <div className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider mb-3 text-white opacity-90">
              {title}
            </p>
            <p className="text-5xl font-black mb-4 text-white">
              {formatNumber(count)}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-white opacity-80" />
              <p className="text-xl font-bold text-white">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm shadow-xl">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  const BreakdownCard = ({ title, color, icon, count, amount }) => (
    <div
      className="rounded-3xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all duration-300"
      style={{ borderColor: COLORS.border, backgroundColor: COLORS.cardBg }}
    >
      <div className="p-6 border-b-4 border-brown">
        <h3
          className="text-xl font-bold flex items-center gap-3"
          style={{ color }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
          <span>{title}</span>
        </h3>
      </div>
      <div className="p-6 space-y-5">
        <div
          className="flex justify-between items-center p-4 rounded-xl"
          style={{ backgroundColor: `${color}08` }}
        >
          <span
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: COLORS.dark }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            Paid Students
          </span>
          <span className="text-2xl font-black" style={{ color }}>
            {formatNumber(count)}
          </span>
        </div>
        <div className="flex justify-between items-center pl-6 pr-4">
          <span
            className="text-sm font-medium"
            style={{ color: COLORS.dark, opacity: 0.7 }}
          >
            Amount Collected
          </span>
          <span className="font-bold text-lg" style={{ color: COLORS.success }}>
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
    </div>
  );

  const DetailSection = ({ title, color, icon, count, amount }) => (
    <div
      className="rounded-3xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all duration-300"
      style={{ borderColor: COLORS.border, backgroundColor: COLORS.cardBg }}
    >
      <div
        className="p-6 border-b-4"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          borderBottomColor: color,
        }}
      >
        <h3
          className="text-xl font-bold flex items-center gap-3"
          style={{ color }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>
          <span>{title}</span>
        </h3>
      </div>
      <div className="p-6 space-y-5">
        <div
          className="flex justify-between items-center p-4 rounded-xl"
          style={{ backgroundColor: `${COLORS.primary}08` }}
        >
          <span
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: COLORS.dark }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS.primary }}
            />
            Paid Students
          </span>
          <span
            className="text-2xl font-black"
            style={{ color: COLORS.primary }}
          >
            {formatNumber(count)}
          </span>
        </div>
        <div className="flex justify-between items-center pl-6 pr-4">
          <span
            className="text-sm font-medium"
            style={{ color: COLORS.dark, opacity: 0.7 }}
          >
            Amount
          </span>
          <span className="font-bold text-lg" style={{ color: COLORS.success }}>
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full p-8 rounded-3xl shadow-xl"
      style={{
        backgroundColor: COLORS.light,
        border: `2px solid ${COLORS.border}`,
      }}
    >
      {/* Header */}
      <div
        className="mb-10 pb-6 border-b-2"
        style={{ borderColor: COLORS.border }}
      >
        <h2
          className="text-4xl font-black flex items-center gap-4"
          style={{ color: COLORS.dark }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          Student Fee Statistics
        </h2>
      </div>

      {/* Total Paid Summary */}
      <div className="mb-10">
        <StatCard
          title="Total Paid"
          count={totalPaidCount}
          amount={totalPaidAmount}
          gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`}
          icon={
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Civilian vs Military Breakdown */}
      <div className="mb-10">
        {/* <h3 className="text-2xl font-bold mb-6 text-gray-800">Paid by Category</h3> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BreakdownCard
            title="Civilian Students"
            color={COLORS.primary}
            count={civilianCount}
            amount={civilianAmount}
            icon={
              <svg
                className="w-6 h-6"
                style={{ color: COLORS.secondary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
          <BreakdownCard
            title="Military Students"
            color={COLORS.primary}
            count={militaryCount}
            amount={militaryAmount}
            icon={
              <svg
                className="w-6 h-6"
                style={{ color: COLORS.secondary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3.5 3.5 3.5 3.5H9v6m-6 0h6"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* This Week & This Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DetailSection
          title="This Month Paid"
          color={COLORS.primary}
          count={thisMonthPaidCount}
          amount={thisMonthPaidAmount}
          icon={
            <svg
              className="w-6 h-6"
              style={{ color: COLORS.secondary}}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <DetailSection
          title="This Week Paid"
          color={COLORS.primary}
          count={thisWeekPaidCount}
          amount={thisWeekPaidAmount}
          icon={
            <svg
              className="w-6 h-6"
              style={{ color: COLORS.secondary }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
};

export default StudentFeeStats
