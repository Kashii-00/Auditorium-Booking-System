import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/studentAuthService";

const StudentProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/?type=student" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
