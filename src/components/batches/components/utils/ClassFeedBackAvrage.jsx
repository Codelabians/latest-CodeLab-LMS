import { ChevronLeft, BarChart3, TrendingUp, Calendar } from "lucide-react";

const ClassFeedBackAverage = ({ feedbackData, classData, onBack }) => {
  if (!feedbackData || !feedbackData.questions) {
    return (
      <div className="w-11/12 mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brown hover:text-beige transition-colors font-medium mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Students</span>
        </button>
        <div className="text-center py-12 text-gray-500">
          No feedback data available
        </div>
      </div>
    );
  }

  const {
    overall_average,
    overall_total_responses,
    total_enrolled,
    questions,
    class_name,
    monthly_averages,
    current_month,
  } = feedbackData;

  // Function to get color based on rating
  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating >= 7) return "text-green-600";
    if (numRating >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBgColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating >= 7) return "bg-green-100 border-green-300";
    if (numRating >= 5) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const getProgressBarColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating >= 7) return "bg-green-500";
    if (numRating >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate trend if there are multiple months
  const getTrend = () => {
    if (!monthly_averages || monthly_averages.length < 2) return null;

    const sorted = [...monthly_averages].sort((a, b) =>
      a.month_key.localeCompare(b.month_key),
    );
    const current = parseFloat(sorted[sorted.length - 1].average_rating);
    const previous = parseFloat(sorted[sorted.length - 2].average_rating);
    const diff = current - previous;

    return {
      value: diff,
      isPositive: diff >= 0,
      percentage: ((diff / previous) * 100).toFixed(1),
    };
  };

  const trend = getTrend();

  return (
    <div className="w-11/12 mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-brown hover:text-beige transition-colors font-medium mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back to Students</span>
      </button>

      {/* Class Info Header */}
      {classData && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {classData.course?.name} - {classData.name}
          </h2>
          <div className="flex gap-6 mt-3 text-sm text-gray-600">
            <span>
              <span className="font-semibold text-gray-800">Instructor:</span>{" "}
              {classData.teacher?.name || "Not assigned"}
            </span>
            <span>
              <span className="font-semibold text-gray-800">Hall:</span>{" "}
              {classData.hall?.name || "Not assigned"}
            </span>
            <span>
              <span className="font-semibold text-gray-800">Time:</span>{" "}
              {classData.timing || "Not scheduled"}
            </span>
          </div>
        </div>
      )}
      {/* Monthly Comparison Section */}
      {monthly_averages && monthly_averages.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Teacher Average Comparison
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthly_averages.map((monthData, index) => {
                const rating = parseFloat(monthData.average_rating);
                const isCurrent = monthData.month === current_month;

                return (
                  <div
                    key={monthData.month_key}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrent
                        ? "bg-blue-50 border-blue-400 shadow-md"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {monthData.month}
                        </h4>
                        {isCurrent && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg border ${getRatingBgColor(
                          rating,
                        )}`}
                      >
                        <div
                          className={`text-xl font-bold ${getRatingColor(
                            rating,
                          )}`}
                        >
                          {rating}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      {monthData.total_responses}/{monthData.total_enrolled}{" "}
                      response
                      {monthData.total_responses !== 1 ? "s" : ""}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarColor(
                          rating,
                        )} transition-all duration-500`}
                        style={{ width: `${(rating / 10) * 100}%` }}
                      ></div>
                    </div>

                    {/* Show trend compared to previous month */}
                    {index > 0 && monthly_averages[index - 1] && (
                      <div className="mt-2 text-xs">
                        {(() => {
                          const prevRating = parseFloat(
                            monthly_averages[index - 1].average_rating,
                          );
                          const diff = rating - prevRating;
                          const isPositive = diff >= 0;

                          return (
                            <span
                              className={`font-medium ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "▲" : "▼"}{" "}
                              {Math.abs(diff).toFixed(2)} vs previous month
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overall Average Card */}
      <div className="mb-8 bg-gradient-to-br from-[#d61111]/10 to-[#d61111]/20 p-6 rounded-xl border-2 border-[#d61111] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#aa0e0e] p-4 rounded-full">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Overall Class Average
              </h3>
              {/* <p className="text-sm text-gray-600">
                Based on {overall_total_responses}/{total_enrolled} total
                responses
              </p> */}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-[#aa0e0e]">
              {parseFloat(overall_average).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">out of 10</div>
            {trend && (
              <div
                className={`text-sm font-semibold mt-2 flex items-center justify-end gap-1 ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${!trend.isPositive && "rotate-180"}`}
                />
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value.toFixed(2)}({trend.isPositive ? "+" : ""}
                  {trend.percentage}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions Breakdown */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#aa0e0e] to-[#aa0e0e] px-6 py-4">
          <h3 className="text-xl font-bold text-white">
            Detailed Feedback Breakdown
          </h3>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {questions.map((q, index) => {
              const rating = parseFloat(q.average_rating);
              const percentage = (rating / 10) * 100;

              return (
                <div
                  key={q.question_id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-500">
                          Q{index + 1}
                        </span>
                        <h4 className="text-base font-semibold text-gray-800">
                          {q.question}
                        </h4>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg border-2 ${getRatingBgColor(
                        rating,
                      )}`}
                    >
                      <div
                        className={`text-2xl font-bold ${getRatingColor(
                          rating,
                        )}`}
                      >
                        {rating}
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        / 10
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${getProgressBarColor(
                        rating,
                      )} transition-all duration-500 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Rating Scale:
        </h4>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Excellent (7-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Good (5-6.9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Needs Improvement (&lt;5)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassFeedBackAverage;
