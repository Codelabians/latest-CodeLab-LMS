import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CompletionStats = ({ data }) => {
  // Default data - replace with your backend data
  const defaultData = {
    completed: 0,    // percentage
    notCompleted: 0  // percentage
  };

  const completionData = data || defaultData;
  
  // Prepare data for donut chart
  const chartData = [
    { 
      name: 'Completed', 
      value: completionData.completed, 
      color: '#10B981'
    },
    { 
      name: 'Not Completed', 
      value: completionData.notCompleted, 
      color: '#F59E0B'
    }
  ];

  return (
    <div className="p-16 bg-white rounded-lg shadow-md">
     

      <div className="flex items-center justify-center">
        <div className="relative">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {completionData.completed}%
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Legend */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Not Completed</span>
        </div>
      </div>
    </div>
  );
};

export default CompletionStats;