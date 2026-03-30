import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const RentStats = ({ data }) => {
  // Default data structure - replace with your backend data
  const defaultRentTypeData = [
    { name: 'Individual', value: 0, color: '#d61111', count: 0 },
    { name: 'Company', value: 0, color: '#aa0e0e', count: 0 }
  ];

  const defaultPaymentData = [
    { name: 'Individual', paid: 0, unpaid:0, total: 0 },
    { name: 'Company', paid: 0, unpaid: 0, total: 0 }
  ];

  // Use provided data or fallback to default
  const rentTypeData = data?.rentTypes || defaultRentTypeData;
  const paymentData = data?.payments || defaultPaymentData;

  // Custom legend for pie chart
  const CustomLegend = ({ payload }) => (
    <div className="flex items-center justify-center mt-3 space-x-6">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm font-medium text-gray-600">
            {entry.value} ({entry.payload.value}%)
          </span>
        </div>
      ))}
    </div>
  );

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'paid' ? 'Paid' : 'Unpaid'}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
    
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Left Side - Rent Type Distribution (Donut Chart) */}
        <div className="flex flex-col">
          <h4 className="mb-4 text-lg font-medium text-center text-gray-700">
            Workspace Type Distribution
          </h4>
          
          <div className="relative flex-1">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {rentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
                    
          </div>
          
          <CustomLegend payload={rentTypeData.map(item => ({ 
            value: item.name, 
            color: item.color,
            payload: item
          }))} />
     
        </div>

        {/* Right Side - Payment Status (Stacked Bar Chart) */}
        <div className="flex flex-col">
          <h4 className="mb-4 text-lg font-medium text-center text-gray-700">
            Payment Status Breakdown
          </h4>
          
          <div className="flex-1">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="paid" 
                    stackId="payment"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                    name="Paid"
                  />
                  <Bar 
                    dataKey="unpaid" 
                    stackId="payment"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    name="Unpaid"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Legend */}
          <div className="flex items-center justify-center mt-3 space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Paid</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Unpaid</span>
            </div>
          </div>

     
        </div>
      </div>
      
 
    </div>
  );
};

export default RentStats;