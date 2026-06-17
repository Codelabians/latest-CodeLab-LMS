import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

const BatchStats = ({ batches }) => {
  // Transform backend data into chart format
  const batchData = [
    { name: 'All', students: batches?.total_batches || 0, fill: '#623CB7' },
    { name: 'Active', students: batches?.total_active_batches || 0, fill: '#107941' },
    { name: 'Inactive', students: batches?.total_inactive_batches || 0, fill: '#AF1F1F' },
  ];

  return (
    <div className="p-8 bg-white shadow-xl rounded-2xl">
      <ResponsiveContainer width="100%" height={310}>
        <BarChart
          data={batchData}
          margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
          barSize={60}
        >
          <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-sm font-semibold" />
          <YAxis
            label={{ value: '(Students)', angle: -90, position: 'insideLeft', offset: -10, className: "text-sm text-gray-500" }}
            axisLine={false}
            tickLine={false}
            className="text-xs"
          />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
          <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />

          <Bar dataKey="students" radius={[10, 10, 0, 0]}>
            {batchData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BatchStats;
