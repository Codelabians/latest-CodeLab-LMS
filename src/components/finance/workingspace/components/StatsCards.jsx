/* eslint-disable react/prop-types */

const StatsCards = ({ icon: Icon, label, value, color = "gray" }) => {
  // Color mapping for different variants
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    cyan: "bg-cyan-100 text-cyan-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-600",
  };

  const iconColorClass = colorClasses[color] || colorClasses.gray;

  return (
    <div className="h-full">
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow h-full">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-3 rounded-lg ${iconColorClass} flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;