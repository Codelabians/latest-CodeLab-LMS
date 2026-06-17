import {
  User, CalendarClock, CalendarCheck, Wallet, ShieldCheck, CalendarDays,
  Coins, Landmark, FileText, FileSignature, MapPin, Boxes,
} from "lucide-react";

/**
 * Single source of truth for the teacher/employee "My Employment" sections.
 * Used by the sidebar (collapsible group) and the employment page (route-driven).
 */
export const EMPLOYMENT_SECTIONS = [
  { key: "profile", label: "Profile", icon: User, hint: "Your employment details" },
  { key: "schedule", label: "Schedule", icon: CalendarClock, hint: "Working days & hours" },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, hint: "Your attendance record" },
  { key: "payslips", label: "Payslips", icon: Wallet, hint: "Monthly salary & payslips" },
  { key: "payroll", label: "Payroll status", icon: ShieldCheck, hint: "What's blocking salary" },
  { key: "leave", label: "Leaves", icon: CalendarDays, hint: "Balances & requests" },
  { key: "loans", label: "Loans", icon: Coins, hint: "Salary advances" },
  { key: "bank", label: "Bank", icon: Landmark, hint: "Payroll account" },
  { key: "documents", label: "Documents", icon: FileText, hint: "Your HR documents" },
  { key: "assets", label: "Assets", icon: Boxes, hint: "Items issued to you" },
  { key: "contracts", label: "Contracts", icon: FileSignature, hint: "Review & sign" },
  { key: "stp", label: "STP", icon: MapPin, hint: "Partner-site attendance", stpOnly: true },
];
