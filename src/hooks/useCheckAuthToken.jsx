import { useSelector } from "react-redux";

export const useCheckAuthToken = () => {
  const token = useSelector((state) => state.auth.token);

  return !!token; // Returns true if token exists, otherwise false
};
