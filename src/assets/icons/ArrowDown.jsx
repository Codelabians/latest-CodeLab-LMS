// import React from "react";

// function ArrowDown() {
//   return (
//     <svg
//       width="6"
//       height="4"
//       viewBox="0 0 6 4"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <path d="M0 0L3 4L6 0H0Z" fill="black" fill-opacity="0.7" />
//     </svg>
//   );
// }

// export default ArrowDown;

import React from "react";
import PropTypes from "prop-types";

function ArrowDown({ width = "6", height = "4", color = "black" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 6 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0L3 4L6 0H0Z" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

ArrowDown.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  color: PropTypes.string,
};

export default ArrowDown;
