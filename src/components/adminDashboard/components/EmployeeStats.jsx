import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Award, Shield, Briefcase, UserCog } from 'lucide-react';

const EmployeeStats = ({ data }) => {
  const defaultData = {
    roles: [
      { name: 'SMEs', count: 12, active: 11, icon: Award, color: '#8B5CF6' },
      { name: 'STP', count: 8, active: 8, icon: UserCog, color: '#3B82F6' },
      { name: 'Admin', count: 9, active: 8, icon: Shield, color: '#10B981' },
      { name: 'Management', count: 5, active: 5, icon: Briefcase, color: '#F59E0B' }
    ],
    totalEmployees: 34,
    activeEmployees: 32
  };

  const employeeData = data || defaultData;
  const activeRate = Math.round((employeeData.activeEmployees / employeeData.totalEmployees) * 100);

  const chartData = employeeData.roles.map(role => ({
    name: role.name,
    active: role.active,
    inactive: role.count - role.active,
    color: role.color
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.active + payload[0].payload.inactive;
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-green-600">Active: {payload[0].value}</p>
          <p className="text-sm text-gray-500">Total: {total}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border-2 border-gray-100 shadow-sm bg-gradient-to-br from-gray-50 to-white rounded-xl">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Team Overview</h3>
              <p className="text-sm text-gray-500">{employeeData.totalEmployees} total members</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{activeRate}%</div>
            <div className="text-xs text-gray-500">Active Rate</div>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="p-5">
      

        {/* Bar Chart */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Active Staff Distribution</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                tick={{ fill: '#120001' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="active" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStats;