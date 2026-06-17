export const convertTo12HourFormat = (time24) => {
  const [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12; // Convert 24-hour to 12-hour, handle "0" case
  return `${hour12}:${minute < 10 ? `0${minute}` : minute} ${period}`;
};
