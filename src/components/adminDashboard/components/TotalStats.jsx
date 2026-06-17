import React, { useMemo } from "react";
import { Users, BookOpen, Building, Users2, Package, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmt = (n) =>
  n == null ? "—" : Number(n).toLocaleString();

const StatCard = ({ title, heroValue, heroLabel, icon: Icon, color, onClick, children, footerLabel, footerValue }) => (
  <div
    onClick={onClick}
    className="group relative bg-white rounded-[22px] overflow-hidden cursor-pointer border border-red-900/5 shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(214,17,17,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(214,17,17,0.13),0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.995]"
  >
    <div
      className="absolute -top-7 -right-7 w-[110px] h-[110px] rounded-full opacity-[0.07] group-hover:opacity-[0.13] group-hover:scale-110 transition-all duration-500"
      style={{ backgroundColor: color }}
    />

    <div className="flex items-center gap-3 px-5 pt-5 pb-3.5">
      <div
        className="relative w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 animate-in fade-in zoom-in duration-500"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 rounded-[14px] border border-white/20" />
        <Icon size={20} className="text-white relative z-10" />
      </div>
      <span className="text-[13px] font-bold text-slate-900 tracking-[0.03em] uppercase font-poppins">
        {title}
      </span>
    </div>

    <div className="px-5 pb-2 flex items-baseline gap-1.5">
      <span className="font-mono text-4xl font-semibold tracking-tight text-beige">
        {fmt(heroValue)}
      </span>
      <span className="text-[12px] text-slate-400 font-medium font-poppins pb-0.5">
        {heroLabel}
      </span>
    </div>

    <div className="h-[2px] mx-5 mb-4 bg-red-600/10" />

    <div className="grid grid-cols-2 gap-2 px-5 pb-5">
      {children}
    </div>

    {footerLabel && (
      <div className="flex justify-between items-center px-5 py-4 border-t border-red-600/5 bg-red-50/20">
        <span className="text-[12px] text-slate-400 font-medium font-poppins">{footerLabel}</span>
        <span className="font-mono text-[14px] font-bold text-beige bg-red-100/50 px-2.5 py-0.5 rounded-full">
          {footerValue}
        </span>
      </div>
    )}
  </div>
);

const StatChip = ({ label, value, color = "text-slate-900" }) => (
  <div className="bg-red-50/40 border border-red-900/5 rounded-xl p-2.5 flex flex-col gap-0.5 transition-colors group-hover:bg-red-50/60 font-poppins">
    <span className="text-[10px] font-bold text-red-900/40 uppercase tracking-widest leading-none">
      {label}
    </span>
    <span className={`font-mono text-xl font-medium tracking-tight ${color}`}>
      {typeof value === "string" ? value : fmt(value)}
    </span>
  </div>
);


const TotalStats = ({ dashboardData, financeData }) => {
  const navigate = useNavigate();

  const defaultData = {
    students: { total_students: 0, current_enrolled_students: 0, inactive_students: 0, total_dropout_students: 0, total_civilian_students: 0, total_military_students: 0 },
    employees: { total_employees: 0, active_employees: 0, inactive_employees: 0 },
    classes: { total_classes: 0, active_classes: 0, inactive_classes: 0, full_classes: 0, available_classes: 0 },
    workspace: { workspaces: [] },
    inventory: {},
  };

  const data = dashboardData || defaultData;
  const students = data.students || defaultData.students;
  const employees = data.employees || defaultData.employees;
  const classes = data.classes || defaultData.classes;
  const workspace = data.workspace || defaultData.workspace;

  const workspaceStats = useMemo(() => {
    const ws = workspace.workspaces || [];
    let totalSpaces = 0, totalOccupied = 0, totalAvailable = 0, occupiedByCompany = 0, occupiedByIndividual = 0;
    ws.forEach((cat) => {
      cat.types?.forEach((t) => {
        totalSpaces += t.total || 0;
        totalOccupied += t.occupied || 0;
        totalAvailable += t.available || 0;
        occupiedByCompany += t.occupied_by_company || 0;
        occupiedByIndividual += t.occupied_by_individual || 0;
      });
    });
    return { totalSpaces, totalOccupied, totalAvailable, occupiedByCompany, occupiedByIndividual };
  }, [workspace]);

  const inventoryStats = useMemo(() => {
    const inv = data.inventory || {};
    let totalAssets = 0, totalAvailable = 0, totalInUse = 0;
    Object.values(inv).forEach((loc) => {
      totalAssets += loc.total || 0;
      totalAvailable += loc.available || 0;
      totalInUse += loc.in_use || 0;
    });
    return { totalAssets, totalAvailable, totalInUse };
  }, [data.inventory]);

  const go = (path) => navigate(path);

  const RED = "#d61111";
  const DARK = "#aa0e0e";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Students */}
      <StatCard
        title="Students"
        heroValue={students.total_students}
        heroLabel="total inquiries"
        icon={Users}
        color={RED}
        onClick={() => go("/dashboard/student-summary")}
        footerLabel={students.total_dropout_students > 0 ? "Dropout" : null}
        footerValue={students.total_dropout_students}
      >
        <StatChip label="Enrolled" value={students.current_enrolled_students} color="text-slate-800" />
        <StatChip label="Inactive" value={students.inactive_students} color="text-beige" />
      </StatCard>

      {/* Classes */}
      <StatCard
        title="Classes"
        heroValue={classes.total_classes}
        heroLabel="total classes"
        icon={BookOpen}
        color={DARK}
        onClick={() => go("/dashboard/course-summary")}
      >
        <StatChip label="Active" value={classes.active_classes} color="text-emerald-600" />
        <StatChip label="Inactive" value={classes.inactive_classes} color="text-beige" />
        <StatChip label="Full" value={classes.full_classes} color="text-amber-600" />
        <StatChip label="Available" value={classes.available_classes} color="text-slate-800" />
      </StatCard>

      {/* Workspace */}
      <StatCard
        title="Freelance / Workspace"
        heroValue={workspaceStats.totalSpaces}
        heroLabel="total spaces"
        icon={Building}
        color={RED}
        onClick={() => go("/dashboard/startup-summary")}
      >
        <StatChip label="Occupied" value={workspaceStats.totalOccupied} color="text-beige" />
        <StatChip label="Available" value={workspaceStats.totalAvailable} color="text-emerald-600" />
        <StatChip label="Companies" value={workspaceStats.occupiedByCompany} color="text-slate-800" />
        <StatChip label="Individuals" value={workspaceStats.occupiedByIndividual} color="text-amber-600" />
      </StatCard>

      {/* Employees */}
      <StatCard
        title="Employees"
        heroValue={employees.total_employees}
        heroLabel="total employees"
        icon={Users2}
        color={DARK}
        onClick={() => go("/dashboard/employee-summary")}
      >
        <StatChip label="STP" value={employees.stp_employees} color="text-slate-800" />
        <StatChip label="SME" value={employees.sme_employees} color="text-amber-600" />
        <StatChip label="Active" value={employees.active_employees} color="text-emerald-600" />
        <StatChip label="Inactive" value={employees.inactive_employees} color="text-beige" />
      </StatCard>

      {/* Inventory */}
      <StatCard
        title="Inventory"
        heroValue={inventoryStats.totalAssets}
        heroLabel="total assets"
        icon={Package}
        color={RED}
        onClick={() => go("/dashboard/inventory-summary")}
        footerLabel={inventoryStats.totalAssets > 0 ? "Utilization" : null}
        footerValue={`${Math.round((inventoryStats.totalInUse / inventoryStats.totalAssets) * 100)}%`}
      >
        <StatChip label="Available" value={inventoryStats.totalAvailable} color="text-emerald-600" />
        <StatChip label="In Use" value={inventoryStats.totalInUse} color="text-amber-600" />
      </StatCard>

      {/* Finance */}
      <StatCard
        title="Finance"
        heroValue={`Rs ${fmt(financeData?.total_income)}`}
        heroLabel="income"
        icon={TrendingUp}
        color={DARK}
        onClick={() => go("/dashboard/finance/stats")}
      >
        <StatChip label="Expense" value={`Rs ${fmt(financeData?.total_expense)}`} color="text-beige" />
        <StatChip label="Net Profit" value={`Rs ${fmt(financeData?.net_profit)}`} color="text-emerald-600" />
      </StatCard>
    </div>
  );
};

export default TotalStats;
