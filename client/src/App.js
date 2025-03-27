import React, { useState,useEffect } from 'react';
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

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Load user from localStorage on startup
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        handleLogin(userData);
      } catch (error) {
        console.error('Error loading saved user:', error);
      }
    }
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
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const hasRole = (roleToCheck) => {
    if (!loggedInUser?.role) return false;
    const userRoles = Array.isArray(loggedInUser.role) ? loggedInUser.role : [loggedInUser.role];
    return userRoles.includes(roleToCheck);
  };

  // Access control checks
  const canAccessCalendar = hasRole('SuperAdmin') || hasRole('calendar_access');
  const canAccessBookings = hasRole('SuperAdmin') || hasRole('bookings_access');
  const canAccessBus = hasRole('SuperAdmin') || hasRole('bus_access');
  const canAccessBusBookings = hasRole('SuperAdmin') || hasRole('busbookings_access');
  const canAccessUserManagement = hasRole('SuperAdmin');

  // Protected Route Component
  const ProtectedRoute = ({ element: Element, canAccess, ...props }) => {
    if (!loggedInUser) return <Navigate to="/" />;
    return canAccess ? <Element {...props} /> : <AccessDenied />;
  };

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
          {/* Public Routes */}
          <Route path="/login" element={
            loggedInUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />

          {/* Default Route */}
          <Route path="/" element={
            !loggedInUser ? <Login onLogin={handleLogin} /> :
            hasRole('SuperAdmin') ? <Navigate to="/calendar" /> :
            hasRole('bus_access') ? <Navigate to="/bus" /> :
            hasRole('calendar_access') ? <Navigate to="/calendar" /> :
            <AccessDenied />
          } />

          {/* Protected Routes */}
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

          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;