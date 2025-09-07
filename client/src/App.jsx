import { useState, useEffect, useRef, Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ErrorBoundary from "./ErrorBoundary"
import ServerConnectionError from "./components/ServerConnectionError"

// Critical components loaded immediately
import Login from "./pages/Login/Login"
import Sidebar from "./components/Sidebar"
import AccessDenied from "./pages/AccessDenied"
import Navbar from "./components/Navbar"

// Lazy load non-critical components with error boundaries
const EventCalendar = lazy(() => import("./pages/Auditorium_Reservation/EventCalendar"))
const EventBooking = lazy(() => import("./pages/Auditorium_Reservation/EventBooking"))
const UserDetails = lazy(() => import("./pages/Login/UserDetails"))
const CreateUser = lazy(() => import("./pages/Login/CreateUser"))

// Bus booking components
const BusBooking = lazy(() => import("./pages/Bus_Booking/busBooking"))
const BusBookingList = lazy(() => import("./pages/Bus_Booking/BusBookingList"))

// Course and batch components
const BatchRegistration = lazy(() => import("./pages/Course&Batch/BatchRegistration"))
const C_Registration = lazy(() => import("./pages/Course&Batch/C_Registration"))
const BatchStudents = lazy(() => import("./pages/Course&Batch/BatchStudents"))
const BatchAddStudents = lazy(() => import("./pages/Course&Batch/BatchAddStudents"))
const BatchLecturers = lazy(() => import("./pages/Course&Batch/BatchLecturers"))
const BatchAddLecturers = lazy(() => import("./pages/Course&Batch/BatchAddLecturers"))
const AnnualPlan = lazy(() => import("./pages/Course&Batch/AnnualPlan"))
const AnnualPlanPrintReport = lazy(() => import("./pages/Course&Batch/annual-plan-print-report"))

// Student components
const Student_Registration = lazy(() => import("./pages/Student/Student_Registration"))
const StudentEdit = lazy(() => import("./pages/Student/StudentEdit"))
const StudentView = lazy(() => import("./pages/Student/StudentView"))

// Lecturer components
const lecturerRegistration = lazy(() => import("./pages/Lecturer/lecturerRegistration"))
const LecturerView = lazy(() => import("./pages/Lecturer/LecturerView"))

// Classroom booking components
const ClassroomCalendar = lazy(() => import("./pages/Classroom_Booking/ClassroomReservationCalendar"))
const ClassroomBooking = lazy(() => import("./pages/Classroom_Booking/ClassroomBooking"))
const ClassroomBookingForm = lazy(() => import("./pages/Classroom_Booking/ClassroomBookingForm"))
const CalendarBookingTable = lazy(() => import("./pages/Classroom_Booking/CalendarBookingTable"))
const ScheduleChecker = lazy(() => import("./pages/Classroom_Booking/ScheduleChecker"))
const SingleBookingFullDetails = lazy(() => import("./pages/Classroom_Booking/SingleBookingFullDetails"))
const CancelRequestForm = lazy(() => import("./pages/Classroom_Booking/CancelRequestForm"))

// Student portal components
const StudentChangePassword = lazy(() => import("./pages/StudentPortal/StudentChangePassword"))
const StudentForgotPassword = lazy(() => import("./pages/StudentPortal/StudentForgotPassword"))
const StudentResetPassword = lazy(() => import("./pages/StudentPortal/StudentResetPassword"))
const StudentDashboard = lazy(() => import("./pages/StudentPortal/StudentDashboard"))
const StudentProfile = lazy(() => import("./pages/StudentPortal/StudentProfile"))
const StudentPreferences = lazy(() => import("./pages/StudentPortal/StudentPreferences"))
const StudentBatchDetail = lazy(() => import("./pages/StudentPortal/StudentBatchDetail"))

// Lecturer portal components
const LecturerChangePassword = lazy(() => import("./pages/LecturerPortal/LecturerChangePassword"))
const LecturerDashboard = lazy(() => import("./pages/LecturerPortal/LecturerDashboard"))
const BatchDetail = lazy(() => import("./pages/LecturerPortal/BatchDetail"))
const LecturerForgotPassword = lazy(() => import("./pages/LecturerPortal/LecturerForgotPassword"))
const LecturerResetPassword = lazy(() => import("./pages/LecturerPortal/LecturerResetPassword"))
const LecturerProfile = lazy(() => import("./pages/LecturerPortal/LecturerProfile"))

// Finance Function components (lazy loaded)
const EditRatesPanel = lazy(() => import("./pages/Accounts_section/EditRatesPanel"))
const CourseCostForm = lazy(() => import("./pages/Accounts_section/CourseCostForm"))
const PaymentsDetailsTable = lazy(() => import("./pages/Accounts_section/PaymentsDetailsTable"))
const PaymentSingleDetails = lazy(() => import("./pages/Accounts_section/PaymentsSingleDetails"))

import "./styles/CSS/App.css"
import "./styles/CSS/global.css"

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

  // Handle direct access to /erp (without trailing slash)
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    // If someone accesses exactly /erp (without trailing slash), redirect to /erp/
    if (currentPath === '/erp') {
      window.location.replace('/erp/' + currentSearch);
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
      // Force redirect to login page after logout
      window.location.href = '/erp/login'
    } catch (error) {
      console.error("Logout error in App:", error)
      setLoggedInUser(null)
      // Force redirect to login page even on error
      window.location.href = '/erp/login'
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
  const canAccessCRegistration = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
  const canAccessStudentRegistration = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
  const canAccessBatchRegistration = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
  const canAccessLecturerManagement = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
  const canAccessBatchStudents = hasRole("SuperAdmin") || hasRole("batch_students_access")
  const canAccessBatchAddStudents = hasRole("SuperAdmin") || hasRole("batch_students_access")
  const canAccessStudentEdit = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
  const canAccessStudentView = hasRole("SuperAdmin") || hasRole("course_allocation_manager")
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
    if (userRoles.includes("course_allocation_manager")) return "/course-registration"
    if (userRoles.includes("finance_manager")) return "/coursecost"
    if (userRoles.includes("SU_finance_access")) return "/coursecost"


    if (userRoles.includes("SuperAdmin")) {
      return "/calendar"
    }

    return "/access-denied"
  }

  // Enhanced ProtectedRoute with Error Boundary and Suspense for lazy-loaded components
  const ProtectedRouteWithErrorBoundary = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />
    if (!canAccess) return <Navigate to="/access-denied" replace />
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg font-medium text-gray-700">Loading...</span>
          </div>
        }>
          <Element {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Standard ProtectedRoute with Suspense for lazy-loaded components
  const ProtectedRoute = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />
    if (!canAccess) return <Navigate to="/access-denied" replace />
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg font-medium text-gray-700">Loading...</span>
        </div>
      }>
        <Element {...props} />
      </Suspense>
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
    return <ServerConnectionError onRetry={() => window.location.reload()} />
  }

  return (
    <Router 
      basename="/erp"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
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
