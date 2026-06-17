import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">{`Fee: Rs ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const FeeChart = ({ fee }) => {
  // Prepare chart data from backend props
  const chartData = [
    { name: 'Today', fee: fee?.daily_fee_collection || 0 },
    { name: 'This Week', fee: fee?.weekly_fee_collection || 0 },
    { name: 'This Month', fee: fee?.monthly_fee_collection || 0 },
  ];

  return (
    <div className="p-10 bg-white shadow-xl rounded-2xl">
      <div className="flex items-center justify-end mb-6">
        <span className="float-right px-3 py-1 font-medium text-blue-800 bg-blue-100 rounded-full">
          Overview
        </span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="fee"
            stroke="#f97316"
            fill="url(#colorFee)"
            strokeWidth={3}
            dot={{ stroke: '#f97316', fill: '#FFFFFF', strokeWidth: 3, r: 6 }}
            activeDot={{ stroke: 'black', strokeWidth: 3, r: 7, fill: 'white' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeeChart;
