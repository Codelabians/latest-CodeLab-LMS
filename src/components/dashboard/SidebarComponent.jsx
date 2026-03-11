import {
  BanknoteArrowDown,
  BookOpen,
  Box,
  Building,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowDown from "../../assets/icons/navbar/ArrowDown";
import ArrowUp from "../../assets/icons/navbar/ArrowUp";
import MenuIcon from "../../assets/icons/navbar/Menu";
import {
  ATTENDANCE,
  BATCHES,
  ALLBATCHES,
  CATEGORIES,
  COMPANY,
  COMPANY_INDIVIDUAL,
  COURSE,
  COURSE_SUMMARY,
  COURSES,
  INCOME,
  DASHBOARD,
  EMPLOYEE,
  EMPLOYEE_SUMMARY,
  EXPENSES,
  FEES,
  FINANCE_SUMMARY,
  INDIVIDUAL,
  INSTRUCTORS,
  INVENTORY,
  INVENTORY_SUMMARY,
  MANAGE_WORKINGSPACE,
  REPORTS,
  STARTUP_INQUIRY,
  STARTUP_SUMMARY,
  STUDENT_SUMMARY,
  STUDENTS,
  TRAINING_INQUIRY,
  USER_MANAGEMENT,
  WORKINGSPACE,
  INVENTORYASSIGN,
  REFUND,
  STUDENT_MANAGEMENT,
} from "../routes/RouteConstants";
import SidebarLogo from "./SidebarLogo";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const SidebarComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //   const user = useSelector(selectCurrentUser);
  // const role = useSelector(selectUserRole);

  const user = useSelector(selectCurrentUser);

  const role = user?.role;

  const [hovered, setHovered] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [expandedSubMenu, setExpandedSubMenu] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedSubMenu, setSelectedSubMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const hasAdminAccess = ["oic", "manager", "asstmanager", "admin"].includes(
    role,
  );

  const menuItems = [
    hasAdminAccess && {
      label: "Admin Panel",
      icon: <LayoutDashboard className="mr-3" size={20} />,
      expandable: true,
    },

    {
      route: STUDENTS,
      label: "Students",
      icon: <GraduationCap />,
      expandable: true,
    },
    {
      label: "Inquiry",
      icon: <HelpCircle />,
      expandable: true,
    },
    hasAdminAccess && {
      label: "Startups/Working Spaces",
      icon: <Building className="mr-3" size={20} />,
      expandable: true,
    },
    {
      label: "Courses/Training",
      icon: <BookOpen />,
      expandable: true,
    },
    {
      label: "Employees",
      icon: <BanknoteArrowDown />,
      expandable: true,
    },

    {
      label: "Inventory",
      icon: <Box />,
      route: INVENTORY,
      expandable: true,
    },
  ].filter(Boolean);

  const submenuItems = {
    "Admin Panel": [
      { route: DASHBOARD, label: "Dashboard" },
      {
        label: "Finances",
        expandable: true,
        subItems: [
          { route: FINANCE_SUMMARY, label: "Finance summary" },
          { route: EXPENSES, label: "Expenses" },
          { route: INCOME, label: "Income" },
          { route: REFUND, label: "Refund" },
        ],
      },

      { route: USER_MANAGEMENT, label: "User Management" },
      { route: STUDENT_MANAGEMENT, label: "Student Management" },
      // { route: REPORTS, label: " Reports" },
    ],
    Students: [
      { route: STUDENT_SUMMARY, label: "Students Summary" },
      { route: STUDENTS, label: "Students" },
      // { route: FEES, label: "Fees" },
      // { route: ATTENDANCE, label: "Attendance" },
    ],
    "Courses/Training": [
      { route: COURSE_SUMMARY, label: "Course Summary" },
      { route: CATEGORIES, label: "Categories" },
      { route: COURSES, label: "Courses" },
      { route: ALLBATCHES, label: "Batches" },
      { route: BATCHES, label: "Classes" },
    ],
    Employees: [
      { route: EMPLOYEE_SUMMARY, label: "Employee Summary" },
      { route: INSTRUCTORS, label: "SMEs" },
      { route: EMPLOYEE, label: "Employee" },
    ],
    "Startups/Working Spaces": [
      { route: STARTUP_SUMMARY, label: "Startup Summary" },
      { route: MANAGE_WORKINGSPACE, label: "Manage Workspace" },
      { route: INDIVIDUAL, label: "Individual" },
      { route: COMPANY, label: "Company" },
      // { route: COMPANY_INDIVIDUAL, label: "Company Individual" },
    ],
    Inventory: [
      { route: INVENTORY_SUMMARY, label: "Inventory Summary" },
      { route: INVENTORY, label: "Inventory" },
      { route: INVENTORYASSIGN, label: "Inventory Assign" },
    ],
    Inquiry: [
      { route: "/dashboard/training-inquiries", label: "Training" },
      // { route: STARTUP_INQUIRY, label: "Startup" },
    ],
  };

  const handleMenuItemClick = (route, isSubMenu = false) => {
    if (!isSubMenu) {
      localStorage.setItem("selectedMenu", route);
      setSelectedSubMenu(null);
    }
    navigate(route);
  };

  useEffect(() => {
    const storedMenu = localStorage.getItem("selectedMenu");
    if (storedMenu) setSelectedMenu(storedMenu);

    setSelectedSubMenu(null);
    setExpandedMenu(null);
    setExpandedSubMenu(null);

    let matchedMenu = null;
    let matchedSubMenu = null;
    let matchedExpandedMenu = null;

    // Flatten all menu + submenus with priority
    const allRoutes = [];

    menuItems.forEach((item) => {
      if (item.route) {
        allRoutes.push({
          menu: item.label,
          route: item.route,
          priority: 1, // Main menu items have lowest priority
          depth: item.route.split("/").filter(Boolean).length,
        });
      }

      if (submenuItems[item.label]) {
        submenuItems[item.label].forEach((subItem) => {
          if (subItem.route) {
            allRoutes.push({
              menu: item.label,
              sub: subItem.route,
              route: subItem.route,
              priority: 2, // Submenu items have higher priority
              depth: subItem.route.split("/").filter(Boolean).length,
            });
          }
          if (subItem.subItems) {
            subItem.subItems.forEach((nested) => {
              allRoutes.push({
                menu: item.label,
                sub: nested.route,
                route: nested.route,
                expanded: subItem.label,
                priority: 3, // Nested items have highest priority
                depth: nested.route.split("/").filter(Boolean).length,
              });
            });
          }
        });
      }
    });

    const current = location.pathname;

    // ✅ IMPROVED: Find the BEST matching route
    const match = allRoutes
      .filter((r) => {
        // Exact match - highest confidence
        if (current === r.route) return true;

        // Check if current path starts with route followed by '/'
        if (current.startsWith(r.route + "/")) return true;

        // ✅ NEW: Check if route segments are contained in current path
        // This handles cases like /dashboard/employee/123 matching /employee
        const currentSegments = current.split("/").filter(Boolean);
        const routeSegments = r.route.split("/").filter(Boolean);

        // Skip /dashboard prefix for better matching
        const currentWithoutDashboard =
          currentSegments[0] === "dashboard"
            ? currentSegments.slice(1)
            : currentSegments;
        const routeWithoutDashboard =
          routeSegments[0] === "dashboard"
            ? routeSegments.slice(1)
            : routeSegments;

        // Check if all route segments exist in current path (in order)
        let routeIndex = 0;
        for (
          let i = 0;
          i < currentWithoutDashboard.length &&
          routeIndex < routeWithoutDashboard.length;
          i++
        ) {
          if (
            currentWithoutDashboard[i] === routeWithoutDashboard[routeIndex]
          ) {
            routeIndex++;
          }
        }

        // All route segments found in order
        if (routeIndex === routeWithoutDashboard.length) return true;

        return false;
      })
      .sort((a, b) => {
        // First: Sort by exact match
        const aExact = current === a.route ? 1 : 0;
        const bExact = current === b.route ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Second: Sort by depth (more segments = more specific)
        if (b.depth !== a.depth) return b.depth - a.depth;

        // Third: Sort by route length (longer = more specific)
        if (b.route.length !== a.route.length) {
          return b.route.length - a.route.length;
        }

        // Fourth: Sort by priority (higher priority wins)
        return b.priority - a.priority;
      })[0];

    if (match) {
      matchedMenu = match.menu;
      matchedSubMenu = match.sub || null;
      matchedExpandedMenu = match.expanded || null;

      setSelectedMenu(matchedMenu);
      setSelectedSubMenu(matchedSubMenu);
      setExpandedMenu(matchedMenu);
      setExpandedSubMenu(matchedExpandedMenu);
      localStorage.setItem("selectedMenu", matchedMenu);
    }
  }, [location]);

  const getMenuItemClasses = (item) => {
    const baseClasses =
      "flex group items-center h-12 hover:rounded-xl pl-4 py-2 m-4 cursor-pointer";
    const activeClasses =
      hovered === item.label || selectedMenu === item.label
        ? "custom-Navbar rounded-xl"
        : "";
    return `${baseClasses} ${activeClasses}`;
  };

  const getTextClasses = (label) => {
    const baseClasses =
      "text-heading group-hover:text-white leading-6 font-poppins";
    const activeClasses =
      hovered === label || selectedMenu === label ? "text-white" : "";
    return `${baseClasses} ${activeClasses}`;
  };

  const getSubmenuTextClasses = (route) => {
    const baseClasses = "text-heading leading-6 font-poppins";
    const activeClasses =
      hovered === route || selectedSubMenu === route
        ? "text-white custom-Navbar w-full py-2 pl-2 mr-3 rounded-lg"
        : "";
    return `${baseClasses} ${activeClasses}`;
  };

  const getIconClasses = (label) => {
    const baseClasses = "text-brown group-hover:text-white";
    const activeClasses =
      hovered === label || selectedMenu === label ? "text-white" : "";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <div className="sticky top-0 flex flex-shrink-0 h-screen overflow-y-auto text-white transition-all duration-300 bg-white">
      <div
        className={`flex flex-col h-max-content ${
          collapsed ? "w-16 custom-Sidebar" : "w-96"
        } transition-all duration-300`}
      >
        <div className="flex items-center justify-end pt-2 pr-2">
          <div
            className="cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <MenuIcon className="w-5 h-5 text-heading" />
            ) : (
              <X color="black" />
            )}
          </div>
        </div>
        {!collapsed && <SidebarLogo />}

        <div
          className={`flex-grow text-white transition-all duration-300 mt-8 ${
            collapsed ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          <nav className="flex flex-col h-full bg-white">
            <div className="flex-grow overflow-y-auto">
              <ul>
                {menuItems.map((item) => (
                  <React.Fragment key={item.route || item.label}>
                    <li
                      className={getMenuItemClasses(item)}
                      onClick={() => {
                        if (item.expandable) {
                          setExpandedMenu(
                            expandedMenu === item.label ? null : item.label,
                          );
                          setExpandedSubMenu(null);
                        } else {
                          handleMenuItemClick(item.route);
                          setSelectedMenu(item.label);
                          localStorage.setItem("selectedMenu", item.label);
                        }
                      }}
                      onMouseEnter={() => setHovered(item.label)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`flex items-center gap-3 ${getTextClasses(
                            item.label,
                          )}`}
                        >
                          <span className={getIconClasses(item.label)}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.expandable && (
                          <div className="mr-3">
                            {expandedMenu === item.label ? (
                              <ArrowDown className="text-brown group-hover:text-white" />
                            ) : (
                              <ArrowUp className="text-brown group-hover:text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                    <div className="w-64 mx-auto border-b border-divider"></div>
                    {item.expandable && expandedMenu === item.label && (
                      <ul className="ml-10">
                        {submenuItems[item.label]?.map((subItem) => (
                          <React.Fragment key={subItem.route || subItem.label}>
                            <li
                              className="flex group items-center h-[40px] pl-2 py-2 m-2 text-sm cursor-pointer"
                              onClick={() => {
                                if (subItem.expandable) {
                                  setExpandedSubMenu(
                                    expandedSubMenu === subItem.label
                                      ? null
                                      : subItem.label,
                                  );
                                } else {
                                  handleMenuItemClick(subItem.route, true);
                                  setSelectedSubMenu(subItem.route);
                                }
                              }}
                              onMouseEnter={() =>
                                setHovered(subItem.route || subItem.label)
                              }
                              onMouseLeave={() => setHovered(null)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div
                                  className={getSubmenuTextClasses(
                                    subItem.route || subItem.label,
                                  )}
                                >
                                  {subItem.label}
                                </div>
                                {subItem.expandable && (
                                  <div className="mr-3">
                                    {expandedSubMenu === subItem.label ? (
                                      <ArrowDown className="text-brown group-hover:text-white" />
                                    ) : (
                                      <ArrowUp className="text-brown group-hover:text-white" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </li>
                            {subItem.expandable &&
                              expandedSubMenu === subItem.label && (
                                <ul className="ml-6">
                                  {subItem.subItems?.map((nestedItem) => (
                                    <li
                                      key={nestedItem.route}
                                      className="flex group items-center h-[40px] pl-2 py-2 m-2 text-sm cursor-pointer"
                                      onClick={() => {
                                        handleMenuItemClick(
                                          nestedItem.route,
                                          true,
                                        );
                                        setSelectedSubMenu(nestedItem.route);
                                      }}
                                      onMouseEnter={() =>
                                        setHovered(nestedItem.route)
                                      }
                                      onMouseLeave={() => setHovered(null)}
                                    >
                                      <div
                                        className={getSubmenuTextClasses(
                                          nestedItem.route,
                                        )}
                                      >
                                        {nestedItem.label}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </React.Fragment>
                        ))}
                      </ul>
                    )}
                  </React.Fragment>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default SidebarComponent;
