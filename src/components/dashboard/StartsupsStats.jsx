import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, Users } from 'lucide-react';

const StartupStats = () => {
  // Overall occupancy data for pie chart
  const occupancyData = [
    { name: 'Occupied', value: 0, color: '#aa0e0e' },
    { name: 'Available', value: 0, color: '#E5E7EB' },
  ];

  // Workspace types for bar chart
  const workspaceTypes = [
    { name: 'Individual', occupied:0, total: 0},
    { name: 'Company', occupied: 0, total: 0 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-sm bg-white border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalOccupied = occupancyData[0].value;
  const totalSeats = occupancyData.reduce((sum, item) => sum + item.value, 0);
  const occupancyRate = Math.round((totalOccupied / totalSeats) * 100);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Workspace Overview</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-1" />
            <span>{totalSeats} Total Seats</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{occupancyRate}% Occupied</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overall Occupancy Pie Chart */}
        <div className="flex flex-col items-center">
          <h4 className="mb-3 font-medium text-gray-700 text-md">Seat Occupancy</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} seats`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center mt-2 space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 bg-green-500 rounded-full"></div>
              <span>Occupied ({totalOccupied})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 bg-gray-300 rounded-full"></div>
              <span>Available ({occupancyData[1].value})</span>
            </div>
          </div>
        </div>

        {/* Workspace Types Bar Chart */}
        <div className="flex flex-col">
          <h4 className="mb-3 font-medium text-gray-700 text-md">Workspace Types</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workspaceTypes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="occupied" fill="#d61111" name="Occupied" radius={[2, 2, 0, 0]} />
              <Bar dataKey="total" fill="#E5E7EB" name="Total Capacity" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StartupStats;