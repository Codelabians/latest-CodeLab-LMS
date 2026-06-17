import React from "react";

const TimelineCard = ({ title, icon: Icon, count, amount, badge, formatNumber, formatCurrency }) => (
  <div className="relative overflow-hidden rounded-2xl border border-red-900/10 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/8">
    {/* corner badge */}
    <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-[#aa0e0e] px-3 py-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white">{badge}</span>
    </div>

    <div className="p-5 sm:p-6 pt-10 sm:pt-11">
      {/* icon + title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#aa0e0e] shadow-md shadow-red-900/20">
          <Icon size={18} className="text-white" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>

      {/* big number */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">
          Paid Students
        </p>
        <p className="font-mono text-4xl font-medium text-slate-900 leading-none">
          {formatNumber(count)}
        </p>
      </div>

      <div className="h-px w-full bg-red-900/8 mb-4" />

      {/* amount row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Amount Collected
        </span>
        <span className="font-mono rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-[#aa0e0e] ring-1 ring-red-900/10">
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  </div>
);

export default TimelineCard;