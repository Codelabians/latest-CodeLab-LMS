import React, { useMemo } from "react";
import { Users, BookOpen, Building, Users2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TotalStats = ({ dashboardData, financeData }) => {
  const navigate = useNavigate();

  // Default data structure
  const defaultData = {
    students: {
      total_students: 0,
      current_enrolled_students: 0,
      inactive_students: 0,
      total_dropout_students: 0,
      total_civilian_students: 0,
      total_military_students: 0,
    },
    employees: {
      total_employees: 0,
      active_employees: 0,
      inactive_employees: 0,
    },
    classes: {
      total_classes: 0,
      active_classes: 0,
      inactive_classes: 0,
      full_classes: 0,
      available_classes: 0,
    },
    workspace: {
      // revenue: 0,
      workspaces: [],
    },
    inventory: {},
  };

  // Use provided data or fall back to defaults
  const data = dashboardData || defaultData;
  const students = data.students || defaultData.students;
  const employees = data.employees || defaultData.employees;
  const classes = data.classes || defaultData.classes;
  const workspace = data.workspace || defaultData.workspace;

  // Process workspace data
  const workspaceStats = useMemo(() => {
    const workspaces = workspace.workspaces || [];
    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalAvailable = 0;
    let occupiedByCompany = 0;
    let occupiedByIndividual = 0;

    workspaces.forEach((category) => {
      category.types?.forEach((type) => {
        totalSpaces += type.total || 0;
        totalOccupied += type.occupied || 0;
        totalAvailable += type.available || 0;
        occupiedByCompany += type.occupied_by_company || 0;
        occupiedByIndividual += type.occupied_by_individual || 0;
      });
    });

    return {
      totalSpaces,
      totalOccupied,
      totalAvailable,
      occupiedByCompany,
      occupiedByIndividual,
      // revenue: workspace.revenue || 0,
    };
  }, [workspace]);

  // Process inventory data
  const inventoryStats = useMemo(() => {
    const inventory = data.inventory || {};
    let totalAssets = 0;
    let totalAvailable = 0;
    let totalInUse = 0;

    Object.keys(inventory).forEach((locationName) => {
      const location = inventory[locationName];
      totalAssets += location.total || 0;
      totalAvailable += location.available || 0;
      totalInUse += location.in_use || 0;
    });

    return {
      totalAssets,
      totalAvailable,
      totalInUse,
    };
  }, [data.inventory]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bg-gray-50">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Students Card */}
        <div
          onClick={() => handleNavigation("/dashboard/student-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#31918D" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#31918D" }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Students
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Student Inquiries</span>
              <span className="text-2xl font-bold" style={{ color: "#31918D" }}>
                {students.total_students.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Currently Enrolled</span>
              <span className="text-2xl font-bold" style={{ color: "#31918D" }}>
                {students.current_enrolled_students.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">
                  Military Inquiries
                </div>
                <div className="text-xl font-bold text-green-600">
                  {students.total_military_students}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">
                  Civilian Inquiries
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {students.total_civilian_students}
                </div>
              </div>
            </div>
            {students.total_dropout_students > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Dropout</span>
                <span className="font-semibold text-red-600">
                  {students.total_dropout_students}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* classes Card */}
        <div
          onClick={() => handleNavigation("/dashboard/course-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#014376" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#014376" }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Classes
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Classes</span>
              <span className="text-2xl font-bold" style={{ color: "#014376" }}>
                {classes?.total_classes}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Active</div>
                <div className="text-xl font-bold text-green-600">
                  {classes.active_classes}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Inactive</div>
                <div className="text-xl font-bold" style={{ color: "#31918D" }}>
                  {classes.inactive_classes}
                </div>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Full Classes</span>
                <span className="font-semibold" style={{ color: "#31918D" }}>
                  {classes.full_classes}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Available Classes</span>
                <span className="font-semibold" style={{ color: "#31918D" }}>
                  {classes.available_classes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Card */}
        <div
          onClick={() => handleNavigation("/dashboard/startup-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#31918D" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#31918D" }}
              >
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Freelance/ Workspace
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Spaces</span>
              <span className="text-2xl font-bold" style={{ color: "#31918D" }}>
                {workspaceStats.totalSpaces}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Occupied</div>
                <div className="text-xl font-bold text-red-600">
                  {workspaceStats.totalOccupied}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Available</div>
                <div className="text-xl font-bold text-green-600">
                  {workspaceStats.totalAvailable}
                </div>
              </div>
            </div>
            {/* <div className="flex justify-between text-sm pt-1">
              <span className="text-gray-500">Revenue</span>
              <span className="font-semibold" style={{ color: "#31918D" }}>
                PKR {workspaceStats.revenue.toLocaleString()}
              </span>
            </div> */}
          </div>
        </div>

        {/* Employees Card */}
        <div
          onClick={() => handleNavigation("/dashboard/employee-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#014376" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#014376" }}
              >
                <Users2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Employees
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Employees</span>
              <span className="text-2xl font-bold" style={{ color: "#014376" }}>
                {employees.total_employees}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Total STP</div>
                <div className="text-xl font-bold text-green-600">
                  {employees.stp_employees}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Total SME</div>
                <div className="text-xl font-bold text-orange-600">
                  {employees.sme_employees}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div
          onClick={() => handleNavigation("/dashboard/inventory-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#31918D" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#31918D" }}
              >
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Inventory
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Assets</span>
              <span className="text-2xl font-bold" style={{ color: "#31918D" }}>
                {inventoryStats.totalAssets}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Available</div>
                <div className="text-xl font-bold text-green-600">
                  {inventoryStats.totalAvailable}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">In Use</div>
                <div className="text-xl font-bold text-blue-600">
                  {inventoryStats.totalInUse}
                </div>
              </div>
            </div>
            {inventoryStats.totalAssets > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Utilization</span>
                <span className="font-semibold" style={{ color: "#31918D" }}>
                  {Math.round(
                    (inventoryStats.totalInUse / inventoryStats.totalAssets) *
                      100
                  )}
                  %
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Finance card */}
        <div
          onClick={() => handleNavigation("/dashboard/finance-summary")}
          className="p-6 bg-white border-t-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          style={{ borderTopColor: "#014376" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "#014376" }}
              >
                <Users2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Finance
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Income</span>
              <span className="text-2xl font-bold text-green-600">
                Rs {financeData?.total_income}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">Total Expense</div>
                <div className="text-xl font-bold text-red-600">
                  Rs {financeData?.total_expense}
                </div>
              </div>
              <div className="p-3 text-center rounded-lg bg-gray-50">
                <div className="mb-1 text-sm text-gray-500">
                  Total Net Profit
                </div>
                <div className="text-xl font-bold text-orange-600">
                  Rs {financeData?.net_profit}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalStats;
