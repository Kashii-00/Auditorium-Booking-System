import { Navigate } from "react-router-dom"

const LecturerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("lecturerToken")
  
  if (!token) {
    return <Navigate to="/?type=lecturer" replace />
  }
  
  return children
}

export default LecturerProtectedRoute 