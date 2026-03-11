export const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Return an empty string or a default value if the input is not a valid date
    return "";
  }
  return date?.toISOString().split("T")[0];
  // Extracting "yyyy-MM-dd" from the ISO string
};
