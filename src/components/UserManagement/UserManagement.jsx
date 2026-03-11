// src/pages/UserManagement.jsx
import { useState, useEffect } from "react";
import { Users2, Shield } from "lucide-react";
import Tabs from "../ui/Tabs";
import Users from "./users/Users";
import Roles from "./roles/Roles";

const tabs = [
  { id: "users", name: "Users", icon: Users2 },
  { id: "roles", name: "Roles", icon: Shield },
  // { id: 'permissions', name: 'Permissions', icon: Key },
];

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    const validTab = tabs.find((t) => t.id === urlTab)?.id || "users";
    setActiveTab(validTab);
    localStorage.setItem("userManagementTab", validTab);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("userManagementTab", tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-teal-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs
          items={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          getId={(item) => item.id}
          getLabel={(item) => item.name}
          getIcon={(item) => item.icon}
          storageKey="userManagementTab"
          urlParam="tab"
        />

        <div className="mt-8">
          {activeTab === "users" && <Users />}
          {activeTab === "roles" && <Roles />}
          {/* {activeTab === 'permissions' && <Permissions />} */}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
