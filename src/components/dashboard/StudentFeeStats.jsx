import React from "react";
import { Users, ShieldCheck, CalendarDays, Clock3 } from "lucide-react";
import HeroBanner from "./HeroBanner";
import SplitCard from "./SplitCard";
import TimelineCard from "./TimelineCard";

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatNumber = (n) => new Intl.NumberFormat("en-PK").format(n || 0);

const StudentFeeStats = ({ dashboardData }) => {
  const feeData      = dashboardData?.fee || {};
  const paidStudents = feeData.paid_students || {};

  const civilianCount       = paidStudents.civilian          ?? 0;
  const civilianAmount      = paidStudents.civilian_amount   ?? 0;
  const militaryCount       = paidStudents.military          ?? 0;
  const militaryAmount      = paidStudents.military_amount   ?? 0;
  const totalPaidCount      = paidStudents.total_count       ?? feeData.total_paid_count    ?? 0;
  const totalPaidAmount     = paidStudents.total_amount      ?? feeData.total_paid_amount   ?? 0;
  const thisWeekPaidCount   = feeData.this_week_paid_count   ?? 0;
  const thisWeekPaidAmount  = feeData.this_week_paid_amount  ?? 0;
  const thisMonthPaidCount  = feeData.this_month_paid_count  ?? 0;
  const thisMonthPaidAmount = feeData.this_month_paid_amount ?? 0;

  return (
    <div className="w-full flex flex-col gap-5">

      {/* section heading */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-[#aa0e0e]" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-800">
          Student Fee Statistics
        </h2>
      </div>

      {/* Row 1 — Hero */}
      <HeroBanner
        totalPaidCount={totalPaidCount}
        totalPaidAmount={totalPaidAmount}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />

      {/* Row 2 — Civilian + Military */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SplitCard
          title="Civilian Students"
          icon={Users}
          count={civilianCount}
          amount={civilianAmount}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
        <SplitCard
          title="Military Students"
          icon={ShieldCheck}
          count={militaryCount}
          amount={militaryAmount}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Row 3 — Month + Week */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TimelineCard
          title="This Month Paid"
          icon={CalendarDays}
          count={thisMonthPaidCount}
          amount={thisMonthPaidAmount}
          badge="Monthly"
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
        <TimelineCard
          title="This Week Paid"
          icon={Clock3}
          count={thisWeekPaidCount}
          amount={thisWeekPaidAmount}
          badge="Weekly"
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
      </div>

    </div>
  );
};

export default StudentFeeStats;