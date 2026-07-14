import HrPendingOnboardingsWidget from "./widgets/HrPendingOnboardingsWidget";
import HrProbationEndingWidget from "./widgets/HrProbationEndingWidget";
import HrDocumentExpiriesWidget from "./widgets/HrDocumentExpiriesWidget";
import HrRecentHiresWidget from "./widgets/HrRecentHiresWidget";
import HrHeadcountByDepartmentWidget from "./widgets/HrHeadcountByDepartmentWidget";
import HrHeadcountByOfficeWidget from "./widgets/HrHeadcountByOfficeWidget";
import HrPayrollReadinessWidget from "./widgets/HrPayrollReadinessWidget";
import HrRecentAuditWidget from "./widgets/HrRecentAuditWidget";
import HrSummaryWidget from "./widgets/HrSummaryWidget";

import OrgKpiWidget from "./widgets/OrgKpiWidget";
import OrgBrandSplitWidget from "./widgets/OrgBrandSplitWidget";
import OrgStatusBreakdownWidget from "./widgets/OrgStatusBreakdownWidget";

import FinancePayrollReadyWidget from "./widgets/FinancePayrollReadyWidget";
import ScholarshipSubsidyWidget from "./widgets/ScholarshipSubsidyWidget";

import TeacherTodaysClassesWidget from "./widgets/TeacherTodaysClassesWidget";
import TeacherMyStudentsWidget from "./widgets/TeacherMyStudentsWidget";

import ReceptionVisitorsWidget from "./widgets/ReceptionVisitorsWidget";
import ReceptionInquiriesWidget from "./widgets/ReceptionInquiriesWidget";

import SalesPipelineWidget from "./widgets/SalesPipelineWidget";
import SalesConversionWidget from "./widgets/SalesConversionWidget";

import MyProfileCompletenessWidget from "./widgets/MyProfileCompletenessWidget";
import MyDocumentsWidget from "./widgets/MyDocumentsWidget";
import MyRecentAuditWidget from "./widgets/MyRecentAuditWidget";
import MyReferralWidget from "./widgets/MyReferralWidget";

/** Personal referral widget — appended to every staff role so each user sees
 *  their own shareable code + earnings regardless of role. */
const MY_REFERRAL = { Component: MyReferralWidget, span: "col-span-1 lg:col-span-2" };

/**
 * Phase 1.95 — Role → widget list registry.
 *
 * Each entry is a small descriptor:
 *   { Component, permission?, span? }
 *
 *   - `Component` is the widget React component (default export from
 *     ./widgets/...).
 *   - `permission` (optional) — if set, the orchestrator hides the widget
 *     for users who don't hold it. Use space-separated permission strings
 *     from SystemPermission enum (e.g. "get employee", "view hr-dashboard-payroll").
 *   - `span` (optional) — Tailwind grid-column class. Defaults to "col-span-1".
 *     Use "col-span-2" for wide widgets (charts, tables) on lg+ screens.
 *
 * `default` is what we render when the user's active role isn't recognized —
 * a friendly "your dashboard is still being assembled" set.
 */
export const WIDGET_REGISTRY = {
  // ─────────── Senior leadership ────────────────────────────────────────
  admin: [
    { Component: ScholarshipSubsidyWidget,     permission: "get scholarship-programs",        span: "col-span-1 lg:col-span-2" },
    { Component: OrgKpiWidget,                 permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrSummaryWidget,              permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: OrgBrandSplitWidget,          permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: OrgStatusBreakdownWidget,     permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByDepartmentWidget, permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByOfficeWidget,    permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrRecentAuditWidget,          permission: "get employee",                    span: "col-span-1 lg:col-span-4" },
  ],
  ceo: [
    { Component: OrgKpiWidget,                 permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: OrgBrandSplitWidget,          permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: OrgStatusBreakdownWidget,     permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByDepartmentWidget, permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
  ],
  coo: [
    { Component: OrgKpiWidget,                 permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrSummaryWidget,              permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByDepartmentWidget, permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByOfficeWidget,    permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── HR ───────────────────────────────────────────────────────
  hr_manager: [
    { Component: HrSummaryWidget,              permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrPendingOnboardingsWidget,   permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrProbationEndingWidget,      permission: "view hr-dashboard-probation",     span: "col-span-1 lg:col-span-2" },
    { Component: HrDocumentExpiriesWidget,     permission: "view hr-dashboard-doc-compliance", span: "col-span-1 lg:col-span-2" },
    { Component: HrRecentHiresWidget,          permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrPayrollReadinessWidget,     permission: "view hr-dashboard-payroll",       span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByDepartmentWidget, permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrHeadcountByOfficeWidget,    permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrRecentAuditWidget,          permission: "get employee",                    span: "col-span-1 lg:col-span-4" },
  ],
  hr: [
    { Component: HrSummaryWidget,              permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrPendingOnboardingsWidget,   permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
    { Component: HrProbationEndingWidget,      permission: "view hr-dashboard-probation",     span: "col-span-1 lg:col-span-2" },
    { Component: HrDocumentExpiriesWidget,     permission: "view hr-dashboard-doc-compliance", span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── Finance ──────────────────────────────────────────────────
  finance_manager: [
    { Component: ScholarshipSubsidyWidget,     permission: "get scholarship-programs",        span: "col-span-1 lg:col-span-2" },
    { Component: FinancePayrollReadyWidget,    permission: "view hr-dashboard-payroll",       span: "col-span-1 lg:col-span-2" },
    { Component: OrgKpiWidget,                 permission: "view hr-dashboard-all-employees", span: "col-span-1 lg:col-span-2" },
  ],
  finance: [
    { Component: ScholarshipSubsidyWidget,     permission: "get scholarship-programs",        span: "col-span-1 lg:col-span-2" },
    { Component: FinancePayrollReadyWidget,    permission: "view hr-dashboard-payroll",       span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── Teaching ─────────────────────────────────────────────────
  teacher: [
    { Component: TeacherTodaysClassesWidget,   span: "col-span-1 lg:col-span-2" },
    { Component: TeacherMyStudentsWidget,      span: "col-span-1 lg:col-span-2" },
    { Component: MyProfileCompletenessWidget,  span: "col-span-1 lg:col-span-2" },
    { Component: MyRecentAuditWidget,          span: "col-span-1 lg:col-span-2" },
  ],
  sme: [
    { Component: TeacherTodaysClassesWidget,   span: "col-span-1 lg:col-span-2" },
    { Component: TeacherMyStudentsWidget,      span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── Reception / admin queue ──────────────────────────────────
  receptionist: [
    { Component: ReceptionVisitorsWidget,      span: "col-span-1 lg:col-span-2" },
    { Component: ReceptionInquiriesWidget,     span: "col-span-1 lg:col-span-2" },
  ],
  clerk: [
    { Component: ReceptionVisitorsWidget,      span: "col-span-1 lg:col-span-2" },
    { Component: ReceptionInquiriesWidget,     span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── Sales / growth ───────────────────────────────────────────
  sales_manager: [
    { Component: SalesPipelineWidget,          span: "col-span-1 lg:col-span-2" },
    { Component: SalesConversionWidget,        span: "col-span-1 lg:col-span-2" },
  ],
  cso: [
    { Component: SalesPipelineWidget,          span: "col-span-1 lg:col-span-2" },
    { Component: SalesConversionWidget,        span: "col-span-1 lg:col-span-2" },
  ],

  // ─────────── Generic employee — personal-only ────────────────────────
  employee: [
    { Component: MyProfileCompletenessWidget,  span: "col-span-1 lg:col-span-2" },
    { Component: MyDocumentsWidget,            span: "col-span-1 lg:col-span-2" },
    { Component: MyRecentAuditWidget,          span: "col-span-1 lg:col-span-4" },
  ],
  developer: [
    { Component: MyProfileCompletenessWidget,  span: "col-span-1 lg:col-span-2" },
    { Component: MyDocumentsWidget,            span: "col-span-1 lg:col-span-2" },
    { Component: MyRecentAuditWidget,          span: "col-span-1 lg:col-span-4" },
  ],
};

// Every staff role gets their personal referral card. Appended here so we
// don't have to repeat the descriptor in each role's list above.
Object.keys(WIDGET_REGISTRY).forEach((slug) => {
  WIDGET_REGISTRY[slug].push(MY_REFERRAL);
});

/** Default fallback when the active role isn't in the registry. */
export const DEFAULT_WIDGETS = [
  { Component: ScholarshipSubsidyWidget, permission: "get scholarship-programs", span: "col-span-1 lg:col-span-2" },
  { Component: MyProfileCompletenessWidget, span: "col-span-1 lg:col-span-2" },
  { Component: MyDocumentsWidget,           span: "col-span-1 lg:col-span-2" },
  { Component: MyRecentAuditWidget,         span: "col-span-1 lg:col-span-4" },
  MY_REFERRAL,
];

/** Look up the widget set for a role slug, falling back to DEFAULT_WIDGETS. */
export const widgetsForRole = (slug) => {
  if (!slug) return DEFAULT_WIDGETS;
  return WIDGET_REGISTRY[slug] || DEFAULT_WIDGETS;
};
