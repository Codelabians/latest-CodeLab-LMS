import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle } from 'lucide-react';

const InventoryStats = ({ data }) => {
  // Minimal data for dashboard overview
  const defaultData = {
    categories: [
      { name: 'Computers', available: 0, total: 0, color: '#3B82F6' },
      { name: 'Furniture', available: 0, total: 0, color: '#10B981' },
      { name: 'Equipment', available: 0, total: 0, color: '#8B5CF6' },
      { name: 'Consumables', available: 0, total:0, color: '#F59E0B' }
    ],
    alerts: 8
  };

  const inventoryData = data || defaultData;
  
  // Calculate totals for overview
  const totalItems = inventoryData.categories.reduce((sum, item) => sum + item.total, 0);
  const availableItems = inventoryData.categories.reduce((sum, item) => sum + item.available, 0);
  const utilizationRate = Math.round(((totalItems - availableItems) / totalItems) * 100);

  // Prepare data for utilization pie chart
  const utilizationData = [
    { name: 'In Use', value: totalItems - availableItems, color: '#3B82F6' },
    { name: 'Available', value: availableItems, color: '#E5E7EB' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border border-gray-200 rounded shadow-lg">
          <p className="text-xs font-medium text-gray-700">{label}</p>
          <p className="text-xs text-blue-600">Available: {payload[0]?.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-12 bg-white rounded-lg shadow-md">
    

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="space-y-3">
          <div className="p-3 text-center rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="p-3 text-center rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-600">{availableItems}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="p-3 text-center rounded-lg bg-orange-50">
            <div className="text-2xl font-bold text-orange-600">{utilizationRate}%</div>
            <div className="text-sm text-gray-600">In Use</div>
          </div>
        </div>

   

        {/* Utilization Donut */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-center text-gray-700">Utilization Rate</h4>
          <div className="relative">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{utilizationRate}%</div>
                <div className="text-xs text-gray-500">In Use</div>
              </div>
            </div>
          </div>
          
          {/* Mini legend */}
          <div className="flex justify-center mt-2 space-x-3">
            <div className="flex items-center">
              <div className="w-2 h-2 mr-1 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">In Use</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 mr-1 bg-gray-300 rounded-full"></div>
              <span className="text-xs text-gray-600">Available</span>
            </div>
          </div>
        </div>
          <div className="space-y-6 border-gray-200 ">
        {inventoryData.categories.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-gray-500">{item.name}</div>
            <div className="text-sm font-bold" style={{ color: item.color }}>
              {item.available}/{item.total}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom summary */}
    
      </div>
    </div>
  );
};

export default InventoryStats;