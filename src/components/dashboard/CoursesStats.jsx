import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const CoursesStats = () => {
  // Sample data matching the chart
  const data = [
    { name: 'Graphic Designing ', value: 6, color: '#623CB7' },
    { name: 'Digital Marketing', value: 8, color: '#0AA35D' },
    { name: 'Accounting Writing', value: 5, color: '#A5000A' },
    { name: 'Budgeting', value: 7, color: '#aa0e0e' },
    { name: 'eCommerce', value: 4, color: '#d61111' },
    { name: 'Software Development', value: 9, color: '#D68443' },
    { name: 'App Development', value: 5, color: '#009953' },
    { name: 'Cybersecurity', value: 8, color: '#aa0e0e' },
    { name: 'Game Development', value: 6, color: '#D74747' },
    { name: 'Blockchain', value: 3, color: '#d61111' },
  ];

  // Custom bar component to handle individual colors
  const CustomBar = (props) => {
    const { fill, ...rest } = props;
    const entry = data.find(item => item.value === props.payload.value);
    return <Bar {...rest} fill={entry?.color || fill} />;
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      {/* Header */}
      <h2 className="mb-6 text-xl font-semibold text-center text-gray-800">
        Courses Summary
      </h2>

      {/* Chart Container */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            barCategoryGap="20%"
          >
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              height={80}
              interval={0}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[0, 10]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Bar 
              dataKey="value" 
              shape={(props) => {
                const entry = data.find(item => item.value === props.payload.value);
                return (
                  <rect
                    {...props}
                    fill={entry?.color || '#8b5cf6'}
                    rx={4}
                    ry={4}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CoursesStats;