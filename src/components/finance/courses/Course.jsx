import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import StatsCards from '../workingspace/components/StatsCards';
import financeIcon from '../../../assets/icons/Group.png';
import expensesIcon from '../../../assets/icons/Group (1).png';
import profitIcon from '../../../assets/icons/Vector.png';
import downloadIcon from '../../../assets/icons/Vector (3).png';

const Course = () => {
  const [selectedOverview, setSelectedOverview] = useState('Monthly');

  // Sample data for the chart
  const data = [
    { month: 'Jan', value: 200 },
    { month: 'Feb', value: 350 },
    { month: 'Mar', value: 567 },
    { month: 'Apr', value: 520 },
  ];

  const statsData = [
    { label: 'Income', value: 567, icon: financeIcon },
    { label: 'Expenses', value: 567, icon: expensesIcon },
    { label: 'Profit', value: 567, icon: profitIcon }
  ];

  const overviewOptions = ['Daily', 'Monthly', 'Yearly'];

  return (
    <div className="min-h-screen w-[90%] mx-auto p-6 bg-gray-50">
      {/* Header */}
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Courses</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        {statsData?.map((stat, index) => (
          <StatsCards
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      {/* Chart Container */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center justify-end mb-6">
          <div className="relative">
            <select
              value={selectedOverview}
              onChange={(e) => setSelectedOverview(e.target.value)}
              className="px-4 py-2 pr-8 text-sm text-white transition-colors outline-none appearance-none cursor-pointer bg-brown rounded-3xl"
            >
              {overviewOptions.map((option) => (
                <option key={option} value={option} className="text-black bg-white">
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#aa0e0e" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#d61111" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis hide />
              <Bar
                dataKey="value"
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors rounded-lg custom-ActionBtn">
          <img src={downloadIcon} alt="Download" />
          Report
        </button>
      </div>
    </div>
  );
};

export default Course;