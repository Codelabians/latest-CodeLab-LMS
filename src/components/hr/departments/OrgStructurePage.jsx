import { useEffect, useState } from "react";
import { Layers, Briefcase, BadgeCheck } from "lucide-react";

import DepartmentsListPage from "./DepartmentsListPage";
import ServicesListPage from "../services/ServicesListPage";
import DesignationsListPage from "../designations/DesignationsListPage";

/* ─────────────── brand tokens (mirror Brands page style) ─────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

/**
 * HR > Organisation structure — tabbed wrapper around Departments and
 * Services. They share the same conceptual surface (departments contain
 * services), so showing them under one sidebar entry with tab switching
 * is cleaner than having two separate entries.
 *
 * Each tab renders the existing list page unchanged — they each have
 * their own filters/search/pagination/CRUD already. The wrapper just
 * provides the tab bar + persists the active tab in localStorage so
 * a refresh keeps you on the tab you were on.
 */
const TABS = [
  { id: "departments",  label: "Departments",  icon: Layers,     hint: "Org units (HR, Finance, IT Solutions, Tech School…)" },
  { id: "services",     label: "Services",     icon: Briefcase,  hint: "What each department offers (Web Dev, Teaching, Payroll…)" },
  { id: "designations", label: "Designations", icon: BadgeCheck, hint: "Job-title catalog HR picks from when hiring" },
];

const STORAGE_KEY = "hrOrgStructureTab";

const OrgStructurePage = () => {
  const [activeTab, setActiveTab] = useState("departments");

  useEffect(() => {
    // Restore last-active tab from localStorage + ?tab= query.
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    const valid = TABS.find((t) => t.id === urlTab)?.id
      || localStorage.getItem(STORAGE_KEY)
      || "departments";
    setActiveTab(valid);
  }, []);

  const handleTabChange = (id) => {
    setActiveTab(id);
    localStorage.setItem(STORAGE_KEY, id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  };

  return (
    <div
      style={{
        padding: "28px 28px 0",
        fontFamily: "'Montserrat', sans-serif",
        background: SURFACE_ALT,
        minHeight: "100vh",
      }}
    >
      {/* Tab bar — sits ABOVE the wrapped list page's own chrome */}
      <div className="flex gap-1 p-1 mb-4 bg-white border rounded-lg" style={{ borderColor: BORDER }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className="flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-md transition"
              style={{
                background: active ? BRAND_RED_TINT : "transparent",
                color: active ? BRAND_RED : TEXT_SECONDARY,
              }}
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Icon size={14} />
                {t.label}
              </span>
              <span className="text-[10px]" style={{ color: active ? BRAND_RED : TEXT_MUTED }}>
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      {/* The wrapped pages each have their own outer chrome (padding,
          minHeight, background). We negate the parent's bottom padding
          so the layout doesn't compound. */}
      <div style={{ margin: "0 -28px -28px" }}>
        {activeTab === "departments"  && <DepartmentsListPage />}
        {activeTab === "services"     && <ServicesListPage />}
        {activeTab === "designations" && <DesignationsListPage />}
      </div>
    </div>
  );
};

export default OrgStructurePage;
