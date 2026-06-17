import React from "react";

const SplitCard = ({ title, icon: Icon, count, amount, formatNumber, formatCurrency }) => (
  <div className="relative overflow-hidden rounded-2xl border border-red-900/10 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/8">
    {/* left accent bar */}
    <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-[#aa0e0e]" />

    <div className="pl-5 pr-5 pt-5 pb-5 sm:pl-6 sm:pr-6">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 ring-1 ring-red-900/10">
          <Icon size={16} className="text-[#aa0e0e]" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      <div className="h-px w-full bg-red-900/8 mb-4" />

      {/* count */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Paid Students
        </span>
        <span className="font-mono text-3xl font-medium text-[#aa0e0e]">
          {formatNumber(count)}
        </span>
      </div>

      {/* amount pill */}
      <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 ring-1 ring-red-900/8">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Amount</span>
        <span className="font-mono text-sm font-medium text-[#d61111]">
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  </div>
);

export default SplitCard;