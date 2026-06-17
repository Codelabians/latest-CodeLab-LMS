// User Management — modern shell matching the Banks / Payment Accounts pages:
// clean header + a segmented tab strip. The Users / Admins & Access / Roles
// panels render below.
import { useEffect, useState } from "react";
import { Shield, ShieldCheck, Crown } from "lucide-react";
import Roles from "./roles/Roles";
import AdminsAccess from "./AdminsAccess";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BRAND_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";

const TABS = [
  { id: "admins", label: "Admins & Access", icon: Crown },
  { id: "roles", label: "Roles", icon: Shield },
];

const STORAGE_KEY = "userManagementTab";

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("admins");

  useEffect(() => {
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    setActiveTab(TABS.find((t) => t.id === urlTab)?.id || localStorage.getItem(STORAGE_KEY) || "admins");
  }, []);

  const handleTabChange = (id) => {
    setActiveTab(id);
    localStorage.setItem(STORAGE_KEY, id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="px-6 pt-6 pb-0">
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>User Management</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Manage accounts, the roles they hold, and role permission sets.</p>
          </div>
        </div>

        {/* segmented tab strip */}
        <div className="inline-flex p-1 rounded-xl" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition"
                style={active
                  ? { background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, color: "#fff", boxShadow: "0 6px 16px -8px rgba(201,6,6,0.5)" }
                  : { background: "transparent", color: TEXT_MUTED }}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* panel */}
      <div>
        {activeTab === "admins" && <AdminsAccess />}
        {activeTab === "roles" && <Roles />}
      </div>
    </div>
  );
};

export default UserManagement;
