import React from "react";
import { BadgeCheck } from "lucide-react";

const HeroBanner = ({ totalPaidCount, totalPaidAmount, formatNumber, formatCurrency }) => (
  <div className="relative overflow-hidden rounded-2xl bg-[#aa0e0e] p-6 sm:p-8 text-white transition-transform duration-300 hover:-translate-y-1">
    {/* decorative circles */}
    <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
    <div className="pointer-events-none absolute -bottom-6 right-4 h-24 w-24 rounded-full bg-white/5" />

    {/* label row */}
    <div className="relative z-10 flex items-center gap-3 mb-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
        <BadgeCheck size={18} className="text-white" />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
        Total Paid Overview
      </span>
    </div>

    {/* figures */}
    <div className="relative z-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Students</p>
        <p className="font-mono text-5xl sm:text-6xl font-medium leading-none">
          {formatNumber(totalPaidCount)}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Amount Collected</p>
        <p className="font-mono text-2xl sm:text-3xl font-medium">{formatCurrency(totalPaidAmount)}</p>
      </div>
    </div>

    <div className="relative z-10 h-px w-full bg-white/10" />
  </div>
);

export default HeroBanner;