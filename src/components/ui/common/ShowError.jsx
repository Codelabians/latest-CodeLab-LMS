import { toast } from "react-toastify";
import { showToast } from "./ShowToast";

const showError = (err) => {
  if (err.status === 422 && err.data?.errors) {
    const errors = err.data.errors;
    Object.keys(errors).forEach((field) => {
      errors[field].forEach((message) => {
        showToast(message, "error"); // Using showToast with "error" status
      });
    });
  } else {
    showToast("An unexpected error occurred", "error");
  }
};

export default showError;
