import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

const StudentPercentageStats = ({ data }) => {
  // Default data matching your image
  const defaultData = [
    {
      name: 'Non-Hostelites Students',
      percentage: 60,
      color: '#DC4444'
    },
    {
      name: 'Hostelites Students', 
      percentage: 50,
      color: '#1E40AF'
    },
    {
      name: 'Free Students',
      percentage: 48,
      color: '#059669'
    },
    {
      name: 'Tech Trainers',
      percentage: 50,
      color: '#B91C1C'
    }
  ];

  const chartData = data || defaultData;

  // Custom label formatter to show percentage on bars
  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-sm font-medium"
      >
        {`${value}%`}
      </text>
    );
  };

  // Custom tick formatter for Y-axis
  const formatYAxisTick = (value) => `${value}%`;

  // Custom tick formatter for X-axis to handle long names
  const formatXAxisTick = (value) => {
    if (value.length > 12) {
      return value.split(' ').map((word, index) => (
        <tspan key={index} x={0} dy={index === 0 ? 0 : '1.2em'}>
          {word}
        </tspan>
      ));
    }
    return value;
  };

  return (
    <div className="flex flex-col w-full p-2 bg-white rounded-lg shadow-md">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40
            }}
            barCategoryGap="20%"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB"
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#374151', 
                fontSize: 12,
                textAnchor: 'middle'
              }}
              interval={0}
              angle={0}
              textAnchor="middle"
              height={40}
            />
            <YAxis
              domain={[0, 70]}
              ticks={[0, 10, 20, 30, 40, 50, 60]}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#6B7280', 
                fontSize: 12 
              }}
              tickFormatter={formatYAxisTick}
            />
            <Bar 
              dataKey="percentage" 
              radius={[0, 0, 0, 0]}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentPercentageStats