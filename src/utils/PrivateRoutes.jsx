// import { Navigate } from "react-router-dom";
// import { SIGNIN } from "../components/routes/RouteConstants";

// function PrivateRoute({ element, isAuthenticated }) {
//   return isAuthenticated() ? <>{element}</> : <Navigate to={SIGNIN} replace />;
// }

// export default PrivateRoute;
import { Navigate } from "react-router-dom";
import { SIGNIN } from "../components/routes/RouteConstants";
import { useSelector } from "react-redux";

function PrivateRoute({ element, allowedRoles }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to={SIGNIN} replace />;
  }

  // If roles are specified, check if the user has permission
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect unauthorized users to a different page or show an error
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{element}</>;
}

export default PrivateRoute;
