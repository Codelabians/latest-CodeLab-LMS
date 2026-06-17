import React from "react";
import { Navigate, useRoutes, useLocation } from "react-router-dom";

function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="breadcrumb flex">
      <ul>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const isActive = isLast && index !== 0; // Add condition for last item but not the first (to avoid highlighting home)
          return (
            <li key={index}>
              <a href={routeTo} className={isActive ? "text-red-500" : ""}>
                {name}
              </a>
              {!isLast && <span>h</span>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Breadcrumb;
