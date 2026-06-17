import { useMemo } from "react";
import { Building2, LayoutGrid, Sparkles } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { useDashboardContext } from "../../dashboard/useDashboardContext";
import { widgetsForRole } from "../../dashboard/widgetRegistry";
import TodayAttendanceWidget from "../attendance/TodayAttendanceWidget";
import {
  BORDER,
  BRAND_RED,
  BRAND_RED_TINT,
  SURFACE_ALT,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  hasPermission,
  labelForRole,
} from "../../dashboard/dashboardConstants";

/**
 * Phase 1.95 — HR Employee Dashboard.
 *
 * Lives under HR (route HR_EMPLOYEE_DASHBOARD = /dashboard/hr/employee-dashboard).
 * The legacy /dashboard view is the LMS admin dashboard and stays untouched.
 *
 * Picks widgets based on the logged-in user's active role + active brand.
 * Multi-role users see a role-pill switcher; the brand chip selector is
 * always visible (with an "All brands" option). Both selections persist in
 * localStorage via useDashboardContext().
 *
 * Widgets are silently hidden when the user lacks the declared permission.
 */
export default function HrEmployeeDashboard() {
  const {
    user,
    userRoles,
    primaryRole,
    activeRole,
    setActiveRole,
    brandId,
    setBrandId,
  } = useDashboardContext();

  // Brand list for the chip selector.
  const { data: brandsResp } = useGetQuery({ path: "employee/company-brands" });
  const brands = brandsResp?.data || [];

  // Map roles → widget descriptors, filter by permission.
  const widgets = useMemo(() => {
    const descriptors = widgetsForRole(activeRole);
    return descriptors.filter((d) => {
      if (!d.permission) return true;
      return hasPermission(user, d.permission);
    });
  }, [activeRole, user]);

  const showRoleSwitcher = userRoles.length > 1;

  return (
    <div
      style={{
        padding: "28px 28px 60px",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
        color: TEXT_PRIMARY,
      }}
    >
      {/* ─────────── Header strip ─────────────────────────────────── */}
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <LayoutGrid size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
              Employee Dashboard
            </h1>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
              {user?.first_name ? `Welcome back, ${user.first_name}.` : "Welcome back."}
              <span style={{ color: TEXT_MUTED }}>
                {" "}Viewing as {labelForRole(activeRole)}
                {activeRole !== primaryRole ? " (switched)" : ""}.
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BrandSelector brands={brands} value={brandId} onChange={setBrandId} />
          {showRoleSwitcher && (
            <RoleSwitcher
              roles={userRoles}
              active={activeRole}
              onChange={setActiveRole}
            />
          )}
        </div>
      </header>

      {/* Today's attendance — counts + late list (hidden without permission) */}
      <div className="mb-4">
        <TodayAttendanceWidget />
      </div>

      {/* ─────────── Widget grid ──────────────────────────────────── */}
      {widgets.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-12 bg-white border rounded-2xl"
          style={{ borderColor: BORDER }}
        >
          <Sparkles size={28} style={{ color: BRAND_RED }} />
          <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            Your dashboard is still being assembled.
          </h2>
          <p className="max-w-md text-xs text-center" style={{ color: TEXT_MUTED }}>
            Widgets for this role haven&apos;t been configured yet, or you don&apos;t hold
            the permissions to see them. Speak to your admin if this looks wrong.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {widgets.map(({ Component, span }, idx) => (
            <div
              key={`${Component.displayName || Component.name || "w"}-${idx}`}
              className={span || "col-span-1"}
            >
              <Component />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Brand chip selector                                                    */
/* ────────────────────────────────────────────────────────────────────── */
function BrandSelector({ brands, value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      <Pill
        active={value === "all"}
        onClick={() => onChange("all")}
        icon={Building2}
        label="All brands"
      />
      {brands.map((b) => (
        <Pill
          key={b.uuid || b.id}
          active={String(value) === String(b.id)}
          onClick={() => onChange(b.id)}
          label={b.short_name || b.name}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Role switcher                                                          */
/* ────────────────────────────────────────────────────────────────────── */
function RoleSwitcher({ roles, active, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white border rounded-full" style={{ borderColor: BORDER }}>
      {roles.map((r) => (
        <Pill
          key={r}
          active={active === r}
          onClick={() => onChange(r)}
          label={labelForRole(r)}
        />
      ))}
    </div>
  );
}

function Pill({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors"
      style={{
        color: active ? "#FFFFFF" : TEXT_SECONDARY,
        background: active ? BRAND_RED : "transparent",
      }}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}
