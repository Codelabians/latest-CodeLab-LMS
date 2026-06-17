import { Navigate } from "react-router-dom";
// import { ADMINDASHBOARD } from "../components/routes/RouteConstants";
import { ADMINDASHBOARD } from "../components/routes/RouteConstants";

function PublicRoutes({ element, isAuthenticated }) {
  const authStatus = isAuthenticated();
  return authStatus ? <Navigate to={ADMINDASHBOARD} replace /> : <>{element}</>;
}

export default PublicRoutes;
