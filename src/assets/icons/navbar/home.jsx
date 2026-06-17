import React from "react";

function IconHome(props) {
  return (
    <svg
      width="1.45em"
      height="1.45em"
      viewBox="0 0 85 84"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#aa0e0e" />
          <stop offset="100%" stopColor="#d61111" />
        </linearGradient>
      </defs>
      <path
        d="M47.2222 28V0H85V28H47.2222ZM0 46.6667V0H37.7778V46.6667H0ZM47.2222 84V37.3333H85V84H47.2222ZM0 84V56H37.7778V84H0Z"
        fill="url(#homeGradient)"
      />
    </svg>
  );
}

export default IconHome;
