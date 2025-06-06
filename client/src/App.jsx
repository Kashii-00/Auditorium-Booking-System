import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import EventCalendar from './pages/Auditorium_Reservation/EventCalendar';
import EventBooking from './pages/Auditorium_Reservation/EventBooking';
import UserDetails from './pages/Login/UserDetails';
import CreateUser from './pages/Login/CreateUser';
import Sidebar from './components/Sidebar';
import AccessDenied from './pages/AccessDenied';
import Navbar from './components/Navbar';
import BusBooking from './pages/Bus_Booking/busBooking';
import BusBookingList from './pages/Bus_Booking/BusBookingList';
import BatchRegistration from './pages/Course&Batch/BatchRegistration';
import C_Registration from './pages/Course&Batch/C_Registration';
import Student_Registration from './pages/Student/Student_Registration';
import lecturerRegistration from './pages/Lecturer/lecturerRegistration'; // <-- Change import to the registration form
import BatchStudents from './pages/Course&Batch/BatchStudents';
import BatchAddStudents from './pages/Course&Batch/BatchAddStudents';
import StudentEdit from './pages/Student/StudentEdit';
import StudentView from './pages/Student/StudentView';
import BatchLecturers from './pages/Course&Batch/BatchLecturers';
import BatchAddLecturers from './pages/Course&Batch/BatchAddLecturers';
import AnnualPlan from './pages/Course&Batch/AnnualPlan';
import LecturerView from './pages/Lecturer/LecturerView';

import './styles/App.css';
import './styles/global.css'; // Import the global CSS

import { refreshToken, logout, initializeAuth, getCurrentUser, checkServerStatus } from './services/authService';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState(null);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const isServerRunning = await checkServerStatus();
        if (!isServerRunning) {
          setServerError("Server connection failed. Please make sure the server is running.");
          setIsLoading(false);
          return;
        }
        
        const initialized = await initializeAuth();
        
        if (initialized) {
          const userData = getCurrentUser();
          if (userData) {
            handleLogin(userData);
            
            if (refreshTimerRef.current) {
              clearInterval(refreshTimerRef.current);
            }
            
            refreshTimerRef.current = setInterval(() => {
              console.log('Running scheduled token refresh');
              refreshToken().catch(error => {
                console.error('Scheduled token refresh failed:', error);
              });
            }, 10 * 60 * 1000);
          }
        } else {
          console.log('Auth initialization failed, user not authenticated');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setServerError("Authentication error. Please refresh the page or try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const handleLogin = (userData) => {
    if (typeof userData.role === 'string') {
      try {
        const parsedRoles = JSON.parse(userData.role);
        userData.role = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles];
      } catch (error) {
        console.error('Error parsing roles:', error);
        userData.role = [];
      }
    }
    setLoggedInUser(userData);
  };

  const handleLogout = async () => {
    try {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      await logout();
      setLoggedInUser(null);
    } catch (error) {
      console.error('Logout error in App:', error);
      setLoggedInUser(null);
    }
  };

  const hasRole = (roleToCheck) => {
    if (!loggedInUser?.role) return false;
    let userRoles = loggedInUser.role;

    // Parse roles if stored as a JSON string
    if (typeof userRoles === 'string') {
      try {
        userRoles = JSON.parse(userRoles);
      } catch {
        userRoles = [userRoles];
      }
    }

    // Ensure roles are in an array format
    if (!Array.isArray(userRoles)) userRoles = [userRoles];

    // SuperAdmin has access to everything
    if (userRoles.includes('SuperAdmin')) return true;
    
    return userRoles.includes(roleToCheck);
  };

  // Define access based on roles
  const canAccessCalendar = hasRole('SuperAdmin') || hasRole('calendar_access');
  const canAccessBookings = hasRole('SuperAdmin') || hasRole('bookings_access');
  const canAccessBus = hasRole('SuperAdmin') || hasRole('bus_access');
  const canAccessBusBookings = hasRole('SuperAdmin') || hasRole('busbookings_access');
  const canAccessUserManagement = hasRole('SuperAdmin'); // Only SuperAdmin can manage users
  const canAccessCRegistration = hasRole('SuperAdmin') || hasRole('course_registration_access');
  const canAccessStudentRegistration = hasRole('SuperAdmin') || hasRole('student_registration_access');
  const canAccessBatchRegistration = hasRole('SuperAdmin') || hasRole('batch_registration_access');
  const canAccessLecturerManagement = hasRole('SuperAdmin') || hasRole('lecturer_management_access');
  const canAccessBatchStudents = hasRole('SuperAdmin') || hasRole('batch_students_access');
  const canAccessBatchAddStudents = hasRole('SuperAdmin') || hasRole('batch_students_access');
  const canAccessStudentEdit = hasRole('SuperAdmin') || hasRole('student_registration_access');
  const canAccessStudentView = hasRole('SuperAdmin') || hasRole('student_registration_access');
  const canAccessBatchLecturers = hasRole('SuperAdmin') || hasRole('batch_lecturers_access');
  const canAccessBatchAddLecturers = hasRole('SuperAdmin') || hasRole('batch_lecturers_access');
  const canAccessAnnualPlan = hasRole('SuperAdmin');
  const canAccessLecturerView = hasRole('SuperAdmin');

  // Determine default route based on role hierarchy and access levels
  const getDefaultRoute = () => {
    if (!loggedInUser || !loggedInUser.role) return '/access-denied';
    
    // Make sure we're working with an array
    const userRoles = Array.isArray(loggedInUser.role) ? loggedInUser.role : [loggedInUser.role];
    
    // Check for specific access rights in order of priority, regardless of role level
    // First check bus access
    if (userRoles.includes('bus_access')) return '/bus';
    if (userRoles.includes('busbookings_access')) return '/busbookings';
    
    // Then check calendar access
    if (userRoles.includes('calendar_access')) return '/calendar';
    if (userRoles.includes('bookings_access')) return '/bookings';
    
    // Then check other access types
    if (userRoles.includes('course_registration_access')) return '/courseregistration';
    if (userRoles.includes('student_registration_access')) return '/student-registration';
    if (userRoles.includes('lecturer_management_access')) return '/lecturer-registration'; 
    
    // SuperAdmin fallback - if they somehow don't have specific access rights
    if (userRoles.includes('SuperAdmin')) {
      return '/calendar';
    }
    
    // No valid access rights
    return '/access-denied';
  };

  const ProtectedRoute = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />;
    if (!canAccess) return <Navigate to="/access-denied" replace />;
    return <Element {...props} />;
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="error-screen">
        <h2>Connection Error</h2>
        <p>{serverError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
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
          <Route path="/login" element={
            loggedInUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />

          <Route path="/" element={
            !loggedInUser ? <Login onLogin={handleLogin} /> :
            <Navigate to={getDefaultRoute()} />
          } />

          <Route path="/calendar" element={
            <ProtectedRoute 
              element={EventCalendar} 
              canAccess={canAccessCalendar} 
              user={loggedInUser} 
            />
          } />

          <Route path="/bookings" element={
            <ProtectedRoute 
              element={EventBooking} 
              canAccess={canAccessBookings} 
            />
          } />

          <Route path="/courseregistration" element={
            <ProtectedRoute 
              element={C_Registration} 
              canAccess={canAccessCRegistration} 
            />
          } />

          <Route path="/student-registration" element={
            <ProtectedRoute 
              element={Student_Registration} 
              canAccess={canAccessStudentRegistration} 
            />
          } />

          <Route path="/BatchRegistration" element={
            <ProtectedRoute 
              element={BatchRegistration}
              canAccess={canAccessBatchRegistration}
            />
          } />

          <Route path="/bus" element={
            <ProtectedRoute 
              element={BusBooking} 
              canAccess={canAccessBus} 
              user={loggedInUser} 
            />
          } />

          <Route path="/busbookings" element={
            <ProtectedRoute 
              element={BusBookingList} 
              canAccess={canAccessBusBookings} 
            />
          } />

          <Route path="/users" element={
            <ProtectedRoute 
              element={UserDetails} 
              canAccess={canAccessUserManagement} 
            />
          } />

          <Route path="/create-user" element={
            <ProtectedRoute 
              element={CreateUser} 
              canAccess={canAccessUserManagement} 
            />
          } />

          <Route path="/create-user/:id" element={
            <ProtectedRoute 
              element={CreateUser} 
              canAccess={canAccessUserManagement} 
            />
          } />

          <Route path="/lecturer-registration" element={
            <ProtectedRoute 
              element={lecturerRegistration} 
              canAccess={canAccessLecturerManagement}
            />
          } />

          <Route path="/LRegistration/edit/:id" element={
            <ProtectedRoute 
              element={lecturerRegistration} 
              canAccess={canAccessLecturerManagement}
            />
          } />

          <Route path="/batch/:id/students" element={
            <ProtectedRoute 
              element={BatchStudents}
              canAccess={canAccessBatchStudents}
            />
          } />

          <Route path="/batch/:id/add-students" element={
            <ProtectedRoute 
              element={BatchAddStudents}
              canAccess={canAccessBatchAddStudents}
            />
          } />

          <Route path="/students/:id" element={
            <ProtectedRoute 
              element={StudentView}
              canAccess={canAccessStudentView}
            />
          } />

          <Route path="/students/:id/edit" element={
            <ProtectedRoute 
              element={StudentEdit}
              canAccess={canAccessStudentEdit}
            />
          } />

          <Route path="/batch/:id/lecturers" element={
            <ProtectedRoute 
              element={BatchLecturers}
              canAccess={canAccessBatchLecturers}
            />
          } />

          <Route path="/batch/:id/add-lecturers" element={
            <ProtectedRoute 
              element={BatchAddLecturers}
              canAccess={canAccessBatchAddLecturers}
            />
          } />

          <Route path="/LRegistration/edit/:id" element={
            <ProtectedRoute 
              element={lecturerRegistration} 
              canAccess={canAccessLecturerManagement}
            />
          } />


          <Route path="/annual-plan" element={
            <ProtectedRoute 
              element={AnnualPlan}
              canAccess={canAccessAnnualPlan}
            />
          } />

          <Route path="/lecturer/:id" element={
            <ProtectedRoute 
              element={LecturerView}
              canAccess={canAccessLecturerView}
            />
          } />

          <Route path="*" element={<AccessDenied />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;