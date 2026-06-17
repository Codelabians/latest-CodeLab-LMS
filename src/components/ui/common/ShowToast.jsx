// src/utils/toastNotifications.js
import { toast } from "react-toastify";

// Canonical call order is showToast(message, status). Some call sites pass
// them reversed as showToast(status, message); since the status is always a
// known keyword we detect which argument it is and normalize, so both orders
// work and a successful action never renders as a red error toast.
const STATUS_WORDS = ["success", "error", "warning", "warn", "info"];

export const showToast = (a, b) => {
  let message = a;
  let status = b;

  // Reversed order: first arg is the status keyword, second is the message.
  if (STATUS_WORDS.includes(a) && !STATUS_WORDS.includes(b)) {
    status = a;
    message = b;
  }

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
