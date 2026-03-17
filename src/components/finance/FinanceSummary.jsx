import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Line,
  Legend,
  LineChart,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowLeft,
  Coins,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetQuery } from "../../api/apiSlice";
import { indexes } from "d3";
import BatchTabs from "../ui/BatchTabs";

const FinanceSummary = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");
  const [activeBatchTab, setActiveBatchTab] = useState("all");

  const {
    data: financeStats,
    isLoading,
    isError,
  } = useGetQuery({
    path: "/admin/finance/get/summary",
    params: { ...(activeBatchTab !== "all" && { batch_id: activeBatchTab }) },
  });

  // Process finance data
  const financeData = useMemo(() => {
    const data = financeStats?.data || {};

    const totalIncome = parseFloat(data.total_income) || 0;
    const totalExpense = parseFloat(data.total_expense) || 0;
    const netProfit = parseFloat(data.net_profit) || 0;
    const profitMargin =
      totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
    const refund = parseFloat(data.total_refund) || 0;

    // Process income by category
    const incomeByCategory = (data.income_by_category || []).map(
      (item, index) => ({
        category: item.category_name,
        value: parseFloat(item.total),
        civilianTotal: parseFloat(item.civilian_total) || 0,
        militaryTotal: parseFloat(item.military_total) || 0,
        percentage:
          totalIncome > 0
            ? ((parseFloat(item.total) / totalIncome) * 100).toFixed(1)
            : 0,
        color: ["#aa0e0e", "#d61111", "#F59E0B", "#8B5CF6", "#EC4899"][
          index % 5
        ],
      }),
    );

    // Process expense by category
    const expenseByCategory = (data.expense_by_category || []).map(
      (item, index) => ({
        category: item.category_name,
        amount: parseFloat(item.total),
        percentage:
          totalExpense > 0
            ? ((parseFloat(item.total) / totalExpense) * 100).toFixed(1)
            : 0,
        color: ["#EF4444", "#F97316", "#EAB308", "#06B6D4", "#aa0e0e"][
          index % 5
        ],
      }),
    );
    const monthlyData = (data.monthly_chart?.table || []).map((item) => ({
      month: item.month,
      income: parseFloat(item.income) || 0,
      refund: parseFloat(item.refund) || 0,
      expense: parseFloat(item.expense) || 0,
      profit: parseFloat(item.profit) || 0,
    }));

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      incomeByCategory,
      expenseByCategory,
      refund,
      dateRange: {
        from: data.from,
        to: data.to,
      },
      monthlyData,
    };
  }, [financeStats]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYAxisTick = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label}) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          {label && <p className="font-semibold text-gray-800 mb-2">{label}</p>}
          {payload.map((entry, index) => {
            // Skip if value is 0
            if (entry.value === 0) return null;

            return (
              <p
                key={index}
                className="text-sm"
                style={{ color: entry.color || entry.fill }}
              >
                {entry.name}:{" "}
                {formatCurrency(entry.value || entry.payload.amount)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const StatsCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    isPositive = true,
  }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isPositive ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading finance data...</p>
        </div>
      </div>
    );
  }

  if (isError || !financeStats?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-600 text-xl mb-4">
            {isError ? "Failed to load finance data" : "No data available"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-[90%] mx-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <ArrowLeft
          onClick={() => navigate(-1)}
          className="w-8 h-8 mb-4 cursor-pointer text-brown hover:text-brown-600"
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Finance Summary
            </h1>
            {financeData.dateRange.from && financeData.dateRange.to ? (
              <p className="text-sm text-gray-500 mt-1">
                {financeData.dateRange.from} to {financeData.dateRange.to}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">All Time</p>
            )}
          </div>
        </div>
      </div>
      <BatchTabs
        activeBatchTab={activeBatchTab}
        setActiveBatchTab={setActiveBatchTab}
      />
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 gap-2 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          icon={Coins}
          label="Total Income"
          value={formatCurrency(financeData.totalIncome)}
          isPositive={true}finance
        />
        <StatsCard
          icon={TrendingDown}
          label="Total Expenses"
          value={formatCurrency(financeData.totalExpense)}
          subtitle={`${
            financeData.totalIncome > 0
              ? (
                  (financeData.totalExpense / financeData.totalIncome) *
                  100
                ).toFixed(1)
              : 0
          }% of income`}
          isPositive={false}
        />
        <StatsCard
          icon={Target}
          label="Net Profit"
          value={formatCurrency(financeData.netProfit)}
          subtitle={`${financeData.profitMargin}% margin`}
          isPositive={financeData.netProfit >= 0}
        />
        <StatsCard
          icon={TrendingUp}
          label="Profit Margin"
          value={`${financeData.profitMargin}%`}
          subtitle="Revenue efficiency"
          isPositive={parseFloat(financeData.profitMargin) > 0}
        />
        <StatsCard
          icon={RotateCcw}
          label="Refuned"
          value={`${financeData.refund}`}
          subtitle={`${
            financeData.totalIncome > 0
              ? ((financeData.refund / financeData.totalIncome) * 100).toFixed(
                  1,
                )
              : 0
          }% of revenue returned`}
          isPositive={false}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {["overview", "monthly overview", "income", "expenses"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveView(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeView === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </nav>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === "overview" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Income Breakdown (Pie Chart) */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Income Breakdown
            </h3>
            {financeData.incomeByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financeData.incomeByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ category, value }) =>
                      `${category}: ${formatCurrency(value)}`
                    }
                  >
                    {financeData.incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${indexes}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No income data available
              </div>
            )}
          </div>

          {/* Expense Breakdown (Summary List) */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Expense Categories
            </h3>
            {financeData.expenseByCategory.length > 0 ? (
              <div className="space-y-4">
                {financeData.expenseByCategory.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: expense.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {expense.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {expense.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No expense data available
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "monthly overview" && (
        // <div className="space-y-8">
        //   <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        //     <h3 className="mb-8 text-2xl font-bold text-gray-900 text-center">
        //       Monthly Financial Trends
        //     </h3>

        //     {financeData.monthlyData.length > 0 ? (
        //       <ResponsiveContainer width="100%" height={500}>
        //         <LineChart
        //           data={financeData.monthlyData}
        //           margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        //         >
        //           <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
        //           <XAxis
        //             dataKey="month"
        //             tick={{ fontSize: 14 }}
        //             padding={{ left: 20, right: 20 }}
        //           />
        //           <YAxis
        //             tickFormatter={formatYAxisTick}
        //             tick={{ fontSize: 14 }}
        //           />
        //           <Tooltip content={<CustomTooltip />} />
        //           <Legend
        //             wrapperStyle={{ paddingTop: "30px" }}
        //             iconType="line"
        //             iconSize={16}
        //           />

        //           <Line
        //             type="monotone"
        //             dataKey="income"
        //             stroke="#10B981"
        //             strokeWidth={4}
        //             dot={{ fill: "#10B981", r: 8 }}
        //             activeDot={{ r: 10 }}
        //             name="Income"
        //           />
        //           <Line
        //             type="monotone"
        //             dataKey="expense"
        //             stroke="#EF4444"
        //             strokeWidth={4}
        //             dot={{ fill: "#EF4444", r: 8 }}
        //             activeDot={{ r: 10 }}
        //             name="Expenses"
        //           />
        //           <Line
        //             type="monotone"
        //             dataKey="refund"
        //             stroke="#F59E0B"
        //             strokeWidth={4}
        //             dot={{ fill: "#F59E0B", r: 8 }}
        //             activeDot={{ r: 10 }}
        //             name="Refunds"
        //           />
        //           <Line
        //             type="monotone"
        //             dataKey="profit"
        //             stroke="#3B82F6"
        //             strokeWidth={4}
        //             dot={{ fill: "#3B82F6", r: 8 }}
        //             activeDot={{ r: 10 }}
        //             name="Net Profit"
        //           />
        //         </LineChart>
        //       </ResponsiveContainer>
        //     ) : (
        //       <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        //         <p className="text-lg">No monthly data available</p>
        //         <p className="text-sm mt-2">
        //           Data will appear as months are recorded
        //         </p>
        //       </div>
        //     )}

        //     {/* Optional: Show table below chart */}
        //     {financeData.monthlyData.length > 0 && (
        //       <div className="mt-12 overflow-x-auto">
        //         <h4 className="mb-4 text-lg font-semibold text-gray-800">
        //           Monthly Data Table
        //         </h4>
        //         <table className="min-w-full divide-y divide-gray-200">
        //           <thead className="bg-gray-50">
        //             <tr>
        //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        //                 Month
        //               </th>
        //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        //                 Income
        //               </th>
        //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        //                 Expenses
        //               </th>
        //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        //                 Refunds
        //               </th>
        //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        //                 Profit
        //               </th>
        //             </tr>
        //           </thead>
        //           <tbody className="bg-white divide-y divide-gray-200">
        //             {financeData.monthlyData.map((row, i) => (
        //               <tr key={i} className="hover:bg-gray-50">
        //                 <td className="px-6 py-4 text-sm font-medium text-gray-900">
        //                   {row.month}
        //                 </td>
        //                 <td className="px-6 py-4 text-sm text-green-600 font-semibold">
        //                   {formatCurrency(row.income)}
        //                 </td>
        //                 <td className="px-6 py-4 text-sm text-red-600 font-semibold">
        //                   {formatCurrency(row.expense)}
        //                 </td>
        //                 <td className="px-6 py-4 text-sm text-orange-600 font-semibold">
        //                   {formatCurrency(row.refund)}
        //                 </td>
        //                 <td
        //                   className="px-6 py-4 text-sm font-bold"
        //                   style={{
        //                     color: row.profit >= 0 ? "#3B82F6" : "#EF4444",
        //                   }}
        //                 >
        //                   {formatCurrency(row.profit)}
        //                 </td>
        //               </tr>
        //             ))}
        //           </tbody>
        //         </table>
        //       </div>
        //     )}
        //   </div>
        // </div>
        <div className="space-y-8">
          <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-8 text-2xl font-bold text-gray-900 text-center">
              Monthly Financial Trends
            </h3>

            {financeData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={financeData.monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barGap={8} // Space between bars in the same group
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e0e0e0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 14 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fontSize: 14 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f3f4f6" }} // Adds a light background hover effect
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "30px" }}
                    iconType="rect"
                    iconSize={16}
                  />

                  <Bar
                    dataKey="income"
                    fill="#10B981"
                    name="Income"
                    radius={[4, 4, 0, 0]} // Rounded top corners
                  />
                  <Bar
                    dataKey="expense"
                    fill="#EF4444"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="refund"
                    fill="#F59E0B"
                    name="Refunds"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="profit"
                    fill="#d61111"
                    name="Net Profit"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <p className="text-lg">No monthly data available</p>
                <p className="text-sm mt-2">
                  Data will appear as months are recorded
                </p>
              </div>
            )}

            {/* Table section remains the same */}
            {financeData.monthlyData.length > 0 && (
              <div className="mt-12 overflow-x-auto">
                <h4 className="mb-4 text-lg font-semibold text-gray-800">
                  Monthly Data Table
                </h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Refunds
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financeData.monthlyData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {row.month}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                          {formatCurrency(row.income)}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                          {formatCurrency(row.expense)}
                        </td>
                        <td className="px-6 py-4 text-sm text-orange-600 font-semibold">
                          {formatCurrency(row.refund)}
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-bold"
                          style={{
                            color: row.profit >= 0 ? "#d61111" : "#EF4444",
                          }}
                        >
                          {formatCurrency(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === "income" && (
        <div className="space-y-8">
          {/* Income by Category Chart (Bar Chart) */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Income Distribution by Category
            </h3>
            {financeData.incomeByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={financeData.incomeByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={formatYAxisTick} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="civilianTotal"
                    fill="#d61111"
                    name="Civilian"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="militaryTotal"
                    fill="#100F0F"
                    name="Military"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="value"
                    fill="#aa0e0e"
                    name="Other Income"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No income data available
              </div>
            )}
          </div>

          {/* Income Summary Table */}
          {financeData.incomeByCategory.length > 0 && (
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Income Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Civilian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Military
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financeData.incomeByCategory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            {item.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(item.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.category === "Courses" ? (
                            <span className="font-medium text-blue-600">
                              {formatCurrency(item.civilianTotal)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.category === "Courses" ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(item.militaryTotal)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.percentage}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Total Income
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(financeData.totalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(
                          financeData.incomeByCategory.reduce(
                            (sum, item) => sum + item.civilianTotal,
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(
                          financeData.incomeByCategory.reduce(
                            (sum, item) => sum + item.militaryTotal,
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "expenses" && (
        <div className="space-y-8">
          {/* Detailed Expense Breakdown (Horizontal Bar Chart) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Expense Distribution
              </h3>
              {financeData.expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={financeData.expenseByCategory}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatYAxisTick} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={150}
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="amount"
                      fill="#aa0e0e"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No expense data available
                </div>
              )}
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Financial Summary
              </h3>
              <div className="space-y-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(financeData.totalIncome)}
                  </div>
                  <div className="text-sm text-gray-600">Total Income</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(financeData.totalExpense)}
                  </div>
                  <div className="text-sm text-gray-600">Total Expenses</div>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    financeData.netProfit >= 0 ? "bg-black-50" : "bg-red-100"
                  }`}
                >
                  <div
                    className={`text-3xl font-bold ${
                      financeData.netProfit >= 0
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  >
                    {formatCurrency(financeData.netProfit)}
                  </div>
                  <div className="text-sm text-gray-600">Net Profit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Summary Table */}
          {financeData.expenseByCategory.length > 0 && (
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Expense Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financeData.expenseByCategory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            {item.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.percentage}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Total Expenses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(financeData.totalExpense)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceSummary;
