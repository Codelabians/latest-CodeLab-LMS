// src/utils/toastNotifications.js
import { toast } from "react-toastify";

export const showToast = (message, status) => {
  const options = {
    position: "top-center",
    autoClose: 1500,
  };

  if (status === "success") {
    toast.success(message, options);
  } else {
    toast.error(message, options);
  }
};
