import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EventCalendar from './pages/EventCalendar';
import EventBooking from './pages/EventBooking';
import UserDetails from './pages/UserDetails';
import CreateUser from './pages/CreateUser';
import NotFound from './pages/NotFound';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AccessDenied from '../src/pages/AccessDenied';
import BusBooking from './pages/Bus_Booking/busBooking';
import BusBookingList from './pages/Bus_Booking/BusBookingList';
import C_Registration from './pages/Course&Batch/C_Registration';

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
    if (typeof userRoles === 'string') {
      try {
        userRoles = JSON.parse(userRoles);
      } catch {
        userRoles = [userRoles];
      }
    }
    if (!Array.isArray(userRoles)) userRoles = [userRoles];
    return userRoles.includes(roleToCheck);
  };

  const canAccessCalendar = hasRole('SuperAdmin') || hasRole('calendar_access');
  const canAccessBookings = hasRole('SuperAdmin') || hasRole('bookings_access');
  const canAccessBus = hasRole('SuperAdmin') || hasRole('bus_access');
  const canAccessBusBookings = hasRole('SuperAdmin') || hasRole('busbookings_access');
  const canAccessUserManagement = hasRole('SuperAdmin');
  const canAccessCRegistration = hasRole('SuperAdmin') || hasRole('course_registration_access');
  const canAccessBatchRegistration = hasRole('SuperAdmin');
  const canAccessCourseIN = hasRole('SuperAdmin');
  const canAccessAddMore = hasRole('SuperAdmin');


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
      <div style={{ 
        marginTop: loggedInUser ? '60px' : '0', 
        marginLeft: loggedInUser ? '200px' : '0',
        padding: '0px'
      }}>
        <Routes>
          <Route path="/login" element={
            loggedInUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />

          <Route path="/" element={
            !loggedInUser ? <Login onLogin={handleLogin} /> :
            hasRole('SuperAdmin') ? <Navigate to="/calendar" /> :
            hasRole('bus_access') ? <Navigate to="/bus" /> :
            hasRole('calendar_access') ? <Navigate to="/calendar" /> :
            hasRole('course_registration_access') ? <Navigate to="/courseregistration" /> :
            <AccessDenied />
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

          <Route path="/BatchRegistration" element={
            <ProtectedRoute 
              element={() => <div>Batch Registration Page</div>} 
              canAccess={canAccessBatchRegistration}
            />
          } />

          <Route path="/CourseIN" element={
            <ProtectedRoute 
              element={() => <div>Cost In Page</div>} 
              canAccess={canAccessCourseIN}
            />
          } />

          <Route path="/AddMore" element={
            <ProtectedRoute 
              element={() => <div>Add More Page</div>} 
              canAccess={canAccessAddMore}
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;