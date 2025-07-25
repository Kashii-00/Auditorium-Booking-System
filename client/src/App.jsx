"use client"

import { useState, useEffect, useRef } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login/Login"
import EventCalendar from "./pages/Auditorium_Reservation/EventCalendar"
import EventBooking from "./pages/Auditorium_Reservation/EventBooking"
import UserDetails from "./pages/Login/UserDetails"
import CreateUser from "./pages/Login/CreateUser"
import Sidebar from "./components/Sidebar"
import AccessDenied from "./pages/AccessDenied"
import Navbar from "./components/Navbar"
import BusBooking from "./pages/Bus_Booking/busBooking"
import BusBookingList from "./pages/Bus_Booking/BusBookingList"
import BatchRegistration from "./pages/Course&Batch/BatchRegistration"
import C_Registration from "./pages/Course&Batch/C_Registration"
import Student_Registration from "./pages/Student/Student_Registration"
import lecturerRegistration from "./pages/Lecturer/lecturerRegistration"
import BatchStudents from "./pages/Course&Batch/BatchStudents"
import BatchAddStudents from "./pages/Course&Batch/BatchAddStudents"
import StudentEdit from "./pages/Student/StudentEdit"
import StudentView from "./pages/Student/StudentView"
import BatchLecturers from "./pages/Course&Batch/BatchLecturers"
import BatchAddLecturers from "./pages/Course&Batch/BatchAddLecturers"
import AnnualPlan from "./pages/Course&Batch/AnnualPlan"
import LecturerView from "./pages/Lecturer/LecturerView"
import AnnualPlanPrintReport from "./pages/Course&Batch/annual-plan-print-report"
import ErrorBoundary from "./ErrorBoundary" // Add this import
import ClassroomCalendar from "./pages/Classroom_Booking/ClassroomReservationCalendar"
import ClassroomBooking from "./pages/Classroom_Booking/ClassroomBooking"
import ClassroomBookingForm from "./pages/Classroom_Booking/ClassroomBookingForm"
import CalendarBookingTable from "./pages/Classroom_Booking/CalendarBookingTable"
import ScheduleChecker from "./pages/Classroom_Booking/ScheduleChecker"
import SingleBookingFullDetails from "./pages/Classroom_Booking/SingleBookingFullDetails"
import CancelRequestForm from "./pages/Classroom_Booking/CancelRequestForm"

// Import the new student portal components
import StudentChangePassword from "./pages/StudentPortal/StudentChangePassword"
import StudentForgotPassword from "./pages/StudentPortal/StudentForgotPassword"
import StudentResetPassword from "./pages/StudentPortal/StudentResetPassword"
import StudentDashboard from "./pages/StudentPortal/StudentDashboard"
import StudentProfile from "./pages/StudentPortal/StudentProfile"
import StudentPreferences from "./pages/StudentPortal/StudentPreferences"
import StudentBatchDetail from "./pages/StudentPortal/StudentBatchDetail"

// Import the new lecturer portal components
import LecturerChangePassword from "./pages/LecturerPortal/LecturerChangePassword"
import LecturerDashboard from "./pages/LecturerPortal/LecturerDashboard"
import BatchDetail from "./pages/LecturerPortal/BatchDetail"
import LecturerForgotPassword from "./pages/LecturerPortal/LecturerForgotPassword"
import LecturerResetPassword from "./pages/LecturerPortal/LecturerResetPassword"
import LecturerProfile from "./pages/LecturerPortal/LecturerProfile"

//Import the new Finance Function components 
import EditRatesPanel from "./pages/Accounts_section/EditRatesPanel";
import CourseCostForm from "./pages/Accounts_section/CourseCostForm";
import PaymentsDetailsTable from "./pages/Accounts_section/PaymentsDetailsTable";
import PaymentSingleDetails from "./pages/Accounts_section/PaymentsSingleDetails";

import "./styles/App.css"
import "./styles/global.css"

import { refreshToken, logout, initializeAuth, getCurrentUser, checkServerStatus } from "./services/authService"

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState(null)
  const refreshTimerRef = useRef(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...")
        const isServerRunning = await checkServerStatus()
        if (!isServerRunning) {
          setServerError("Server connection failed. Please make sure the server is running.")
          setIsLoading(false)
          return
        }

        const initialized = await initializeAuth()

        if (initialized) {
          const userData = getCurrentUser()
          if (userData) {
            handleLogin(userData)

            if (refreshTimerRef.current) {
              clearInterval(refreshTimerRef.current)
            }

            refreshTimerRef.current = setInterval(
              () => {
                console.log("Running scheduled token refresh")
                refreshToken().catch((error) => {
                  console.error("Scheduled token refresh failed:", error)
                })
              },
              10 * 60 * 1000,
            )
          }
        } else {
          console.log("Auth initialization failed, user not authenticated")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setServerError("Authentication error. Please refresh the page or try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const handleLogin = (userData) => {
    if (typeof userData.role === "string") {
      try {
        const parsedRoles = JSON.parse(userData.role)
        userData.role = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles]
      } catch (error) {
        console.error("Error parsing roles:", error)
        userData.role = []
      }
    }
    setLoggedInUser(userData)
  }

  const handleLogout = async () => {
    try {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }

      await logout()
      setLoggedInUser(null)
    } catch (error) {
      console.error("Logout error in App:", error)
      setLoggedInUser(null)
    }
  }

  const hasRole = (roleToCheck) => {
    if (!loggedInUser?.role) return false
    let userRoles = loggedInUser.role

    // Parse roles if stored as a JSON string
    if (typeof userRoles === "string") {
      try {
        userRoles = JSON.parse(userRoles)
      } catch {
        userRoles = [userRoles]
      }
    }

    // Ensure roles are in an array format
    if (!Array.isArray(userRoles)) userRoles = [userRoles]

    // SuperAdmin has access to everything
    if (userRoles.includes("SuperAdmin")) return true

    return userRoles.includes(roleToCheck)
  }

  // Define access based on roles
  const canAccessCalendar = hasRole("SuperAdmin") || hasRole("calendar_access")
  const canAccessBookings = hasRole("SuperAdmin") || hasRole("bookings_access")
  const canAccessBus = hasRole("SuperAdmin") || hasRole("bus_access")
  const canAccessBusBookings = hasRole("SuperAdmin") || hasRole("busbookings_access")
  const canAccessUserManagement = hasRole("SuperAdmin")
  const canAccessCRegistration = hasRole("SuperAdmin") || hasRole("course_registration_access")
  const canAccessStudentRegistration = hasRole("SuperAdmin") || hasRole("student_registration_access")
  const canAccessBatchRegistration = hasRole("SuperAdmin") || hasRole("batch_registration_access")
  const canAccessLecturerManagement = hasRole("SuperAdmin") || hasRole("lecturer_management_access")
  const canAccessBatchStudents = hasRole("SuperAdmin") || hasRole("batch_students_access")
  const canAccessBatchAddStudents = hasRole("SuperAdmin") || hasRole("batch_students_access")
  const canAccessStudentEdit = hasRole("SuperAdmin") || hasRole("student_registration_access")
  const canAccessStudentView = hasRole("SuperAdmin") || hasRole("student_registration_access")
  const canAccessBatchLecturers = hasRole("SuperAdmin") || hasRole("batch_lecturers_access")
  const canAccessBatchAddLecturers = hasRole("SuperAdmin") || hasRole("batch_lecturers_access")
  const canAccessAnnualPlan = hasRole("SuperAdmin") || hasRole("annual_plan_access")
  const canAccessLecturerView = hasRole("SuperAdmin")
  const canAccess_CB_ADMIN = hasRole("SuperAdmin") || hasRole("cb_Admin_access")
  const canAccess_CB_COMMON = hasRole("SuperAdmin") || hasRole("cb_Admin_access") || hasRole("cb_SU_access")

  //Finance
  const canAccessFinanceCommon =hasRole("SuperAdmin") ||hasRole("finance_manager") ||hasRole("SU_finance_access");
  const canAccessFinanceManager =hasRole("SuperAdmin") || hasRole("finance_manager");

  // Add a permission for the print report page (reuse annual plan permission)
  const canAccessAnnualPlanPrint = canAccessAnnualPlan;

  // Determine default route based on role hierarchy and access levels
  const getDefaultRoute = () => {
    if (!loggedInUser || !loggedInUser.role) return "/access-denied"

    const userRoles = Array.isArray(loggedInUser.role) ? loggedInUser.role : [loggedInUser.role]

    if (userRoles.includes("bus_access")) return "/bus"
    if (userRoles.includes("busbookings_access")) return "/busbookings"
    if (userRoles.includes("calendar_access")) return "/calendar"
    if (userRoles.includes("bookings_access")) return "/bookings"
    if (userRoles.includes("course_registration_access")) return "/course-registration"
    if (userRoles.includes("student_registration_access")) return "/student-registration"
    if (userRoles.includes("lecturer_management_access")) return "/lecturer-registration"
    if (userRoles.includes("finance_manager")) return "/coursecost"
    if (userRoles.includes("SU_finance_access")) return "/coursecost"


    if (userRoles.includes("SuperAdmin")) {
      return "/calendar"
    }

    return "/access-denied"
  }

  const ProtectedRoute = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />
    if (!canAccess) return <Navigate to="/access-denied" replace />
    return <Element {...props} />
  }

  // Enhanced ProtectedRoute with Error Boundary for data-heavy components
  const ProtectedRouteWithErrorBoundary = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />
    if (!canAccess) return <Navigate to="/access-denied" replace />
    return (
      <ErrorBoundary>
        <Element {...props} />
      </ErrorBoundary>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    )
  }

  if (serverError) {
    return (
      <div className="error-screen">
        <h2>Connection Error</h2>
        <p>{serverError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <Router>
      {loggedInUser && (
        <>
          <Navbar user={loggedInUser} onLogout={handleLogout} />
          <Sidebar user={loggedInUser} onLogout={handleLogout} />
        </>
      )}
      <div className={loggedInUser ? "main-content" : ""}>
        <Routes>
          <Route
            path="/login"
            element={
              loggedInUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            }
          />

          <Route
            path="/"
            element={
              !loggedInUser ? <Login onLogin={handleLogin} /> : <Navigate to={getDefaultRoute()} />
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRouteWithErrorBoundary
                element={EventCalendar}
                canAccess={canAccessCalendar}
                user={loggedInUser}
              />
            }
          />

          <Route
            path="/bookings"
            element={<ProtectedRouteWithErrorBoundary element={EventBooking} canAccess={canAccessBookings} />}
          />

          <Route
            path="/courseregistration"
            element={<ProtectedRouteWithErrorBoundary element={C_Registration} canAccess={canAccessCRegistration} />}
          />

          <Route
            path="/course-registration"
            element={<ProtectedRouteWithErrorBoundary element={C_Registration} canAccess={canAccessCRegistration} />}
          />

          <Route
            path="/student-registration"
            element={
              <ProtectedRouteWithErrorBoundary
                element={Student_Registration}
                canAccess={canAccessStudentRegistration}
              />
            }
          />

          <Route
            path="/BatchRegistration"
            element={
              <ProtectedRouteWithErrorBoundary element={BatchRegistration} canAccess={canAccessBatchRegistration} />
            }
          />

          <Route
            path="/bus"
            element={
              <ProtectedRouteWithErrorBoundary element={BusBooking} canAccess={canAccessBus} user={loggedInUser} />
            }
          />

          <Route
            path="/busbookings"
            element={<ProtectedRouteWithErrorBoundary element={BusBookingList} canAccess={canAccessBusBookings} />}
          />

          <Route path="/users" element={<ProtectedRoute element={UserDetails} canAccess={canAccessUserManagement} />} />

          <Route
            path="/create-user"
            element={<ProtectedRoute element={CreateUser} canAccess={canAccessUserManagement} />}
          />

          <Route
            path="/create-user/:id"
            element={<ProtectedRoute element={CreateUser} canAccess={canAccessUserManagement} />}
          />

          <Route
            path="/lecturer-registration"
            element={
              <ProtectedRouteWithErrorBoundary element={lecturerRegistration} canAccess={canAccessLecturerManagement} />
            }
          />

          < Route
            path="/coursecost"
            element={
              <ProtectedRoute
                element={CourseCostForm}
                canAccess={canAccessFinanceCommon}
                user={loggedInUser}
              />
            }
          />

          < Route
            path="/editpanel"
            element={
              <ProtectedRoute
                element={EditRatesPanel}
                canAccess={canAccessFinanceManager}
                user={loggedInUser}
              />
            }
          />

          <Route
            path="/PaymentTable"
            element={
              <ProtectedRoute
                element={PaymentsDetailsTable}
                canAccess={canAccessFinanceCommon}
                user={loggedInUser}
              />
            }
          />

          <Route
            path="/PaymentSingleDetails"
            element={
              <ProtectedRoute
                element={PaymentSingleDetails}
                canAccess={canAccessFinanceCommon}
                user={loggedInUser}
              />
            }
          />

          <Route
            path="/LRegistration/edit/:id"
            element={
              <ProtectedRouteWithErrorBoundary element={lecturerRegistration} canAccess={canAccessLecturerManagement} />
            }
          />

          {/* Batch Students Routes - These are the main ones that were causing errors */}
          <Route
            path="/batch/:id/students"
            element={<ProtectedRouteWithErrorBoundary element={BatchStudents} canAccess={canAccessBatchStudents} />}
          />

          <Route
            path="/batch/:id/add-students"
            element={
              <ProtectedRouteWithErrorBoundary element={BatchAddStudents} canAccess={canAccessBatchAddStudents} />
            }
          />

          <Route
            path="/students/:id"
            element={<ProtectedRouteWithErrorBoundary element={StudentView} canAccess={canAccessStudentView} />}
          />

          <Route
            path="/students/:id/edit"
            element={<ProtectedRouteWithErrorBoundary element={StudentEdit} canAccess={canAccessStudentEdit} />}
          />

          <Route
            path="/batch/:id/lecturers"
            element={<ProtectedRouteWithErrorBoundary element={BatchLecturers} canAccess={canAccessBatchLecturers} />}
          />

          <Route
            path="/classroombookingform"
            element={
              <ProtectedRouteWithErrorBoundary
                element={ClassroomBookingForm}
                canAccess={canAccess_CB_COMMON}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/classroomcalendar"
            element={
              <ProtectedRouteWithErrorBoundary
                element={ClassroomCalendar}
                canAccess={canAccess_CB_ADMIN}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/calendarbookingtable"
            element={
              <ProtectedRouteWithErrorBoundary
                element={CalendarBookingTable}
                canAccess={canAccess_CB_ADMIN}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/classroombooking"
            element={
              <ProtectedRouteWithErrorBoundary
                element={ClassroomBooking}
                canAccess={canAccess_CB_ADMIN}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/singlebookingdetails"
            element={
              <ProtectedRouteWithErrorBoundary
                element={SingleBookingFullDetails}
                canAccess={canAccess_CB_COMMON}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/cancelRequestByUser"
            element={
              <ProtectedRouteWithErrorBoundary
                element={CancelRequestForm}
                canAccess={canAccess_CB_COMMON}
                user={loggedInUser}
              />
            }
          />
          <Route
            path="/classroombookingschedule"
            element={
              <ProtectedRouteWithErrorBoundary
                element={ScheduleChecker}
                canAccess={canAccess_CB_COMMON}
              />
            }
          />

          <Route
            path="/batch/:id/add-lecturers"
            element={
              <ProtectedRouteWithErrorBoundary element={BatchAddLecturers} canAccess={canAccessBatchAddLecturers} />
            }
          />

          <Route
            path="/annual-plan"
            element={<ProtectedRouteWithErrorBoundary element={AnnualPlan} canAccess={canAccessAnnualPlan} />}
          />

          <Route
            path="/annual-plan-print-report"
            element={
              <ProtectedRouteWithErrorBoundary
                element={AnnualPlanPrintReport}
                canAccess={canAccessAnnualPlanPrint}
              />
            }
          />

          <Route
            path="/lecturer/:id"
            element={<ProtectedRouteWithErrorBoundary element={LecturerView} canAccess={canAccessLecturerView} />}
          />

          {/* Student Portal Routes */}
          <Route path="/student-login" element={<Navigate to="/?type=student" replace />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-change-password" element={<StudentChangePassword />} />
          <Route path="/student-forgot-password" element={<StudentForgotPassword />} />
          <Route path="/student-reset-password" element={<StudentResetPassword />} />
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/student-preferences" element={<StudentPreferences />} />
          <Route path="/student-batch-detail/:batchId" element={<StudentBatchDetail />} />

          {/* Lecturer Portal Routes */}
                  <Route path="/lecturer-login" element={<Navigate to="/?type=lecturer" replace />} />
        <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/batch/:batchId" element={<BatchDetail />} />
        <Route path="/lecturer-change-password" element={<LecturerChangePassword />} />
        <Route path="/lecturer-forgot-password" element={<LecturerForgotPassword />} />
        <Route path="/lecturer-reset-password" element={<LecturerResetPassword />} />
        <Route path="/lecturer-profile" element={<LecturerProfile />} />

          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
