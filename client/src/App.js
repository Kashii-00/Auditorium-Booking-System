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
import BusBooking from './pages/Bus_Booking/busBooking';
import BusBookingList from './pages/Bus_Booking/BusBookingList';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    if (loggedInUser) {
      console.log('Current user roles:', loggedInUser.role);
    }
  }, [loggedInUser]);

  const handleLogin = (userData) => {
    if (typeof userData.role === 'string') {
      try {
        // Parse the role string and ensure it's an array
        const parsedRoles = JSON.parse(userData.role);
        userData.role = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles];
      } catch (error) {
        console.error('Error parsing roles:', error);
        userData.role = [];
      }
    }
    setLoggedInUser(userData);
  };



  const handleLogout = () => {
    setLoggedInUser(null);
  };

  const hasRole = (roleToCheck) => {
    if (!loggedInUser?.role) return false;
    const userRoles = Array.isArray(loggedInUser.role) ? loggedInUser.role : [loggedInUser.role];
    return userRoles.includes(roleToCheck);
  };

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = (...roles) => {
    return roles.some(role => hasRole(role));
  };

  const hasUserAccess = () => {
    return hasAnyRole('SuperAdmin', 'ADMIN', 'USER', 'AUDITORIUM_BOOKING', 'BUS_BOOKING');
  };

  
// Remove the broad hasUserAccess function and replace with specific access checks
const canAccessCalendar = hasAnyRole('SuperAdmin', 'ADMIN', 'USER', 'AUDITORIUM_BOOKING');
const canAccessBookings = hasAnyRole('SuperAdmin', 'ADMIN', 'AUDITORIUM_BOOKING');
const canAccessBus = hasAnyRole('SuperAdmin', 'ADMIN', 'USER', 'BUS_BOOKING');
const canAccessBusBookings = hasAnyRole('SuperAdmin', 'ADMIN', 'BUS_BOOKING');
const canAccessUserManagement = hasRole('SuperAdmin');

  // Update the Routes section
return (
  <Router>
    {loggedInUser && (
      <>
        <Navbar user={loggedInUser} onLogout={handleLogout} />
        <Sidebar user={loggedInUser} onLogout={handleLogout} />
      </>
    )}
    <div style={{ marginTop: loggedInUser ? '60px' : '0', marginLeft: loggedInUser ? '200px' : '0' }}>
      <Routes>
        {/* Default route with role-based redirect */}
        <Route path="/" element={
        !loggedInUser ? (
          <Login onLogin={handleLogin} />
        ) : hasRole('BUS_BOOKING') && !hasRole('AUDITORIUM_BOOKING') ? (
          <Navigate to="/bus" />
        ) : (
          <Navigate to="/calendar" />
        )
      } />

        <Route path="/login" element={
          loggedInUser ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />

        {/* Protected routes */}
        <Route path="/calendar" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessCalendar ? <EventCalendar user={loggedInUser} /> :
          <Navigate to="/" />
        } />

        <Route path="/bookings" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessBookings ? <EventBooking /> :
          <Navigate to="/" />
        } />

        <Route path="/bus" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessBus ? <BusBooking user={loggedInUser} /> :
          <Navigate to="/" />
        } />

        <Route path="/busbookings" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessBusBookings ? <BusBookingList /> :
          <Navigate to="/" />
        } />

        <Route path="/users" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessUserManagement ? <UserDetails /> :
          <Navigate to="/" />
        } />

        <Route path="/create-user" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessUserManagement ? <CreateUser /> :
          <Navigate to="/" />
        } />

        <Route path="/create-user/:id" element={
          !loggedInUser ? <Navigate to="/login" /> :
          canAccessUserManagement ? <CreateUser /> :
          <Navigate to="/" />
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </Router>
);
}

export default App;
