import React from "react";

const AttendanceLabel = ({ value, fontSize, fontWeight, background }) => {
  const labelStyle = {
    fontSize: `${fontSize}px`,
    fontWeight: `${fontWeight}`,
    backgroundColor: background,
    padding: "4px 14px",
    borderRadius: "100px",
    display: "inline-block",
  };

  return <div style={labelStyle}>{value}</div>;
};

export default AttendanceLabel;
