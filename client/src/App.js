import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EventCalendar from './pages/EventCalendar';
import EventBooking from './pages/EventBooking';
import UserDetails from './pages/UserDetails';
import CreateUser from './pages/CreateUser';
import NotFound from './pages/NotFound';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (userData) => {
    setLoggedInUser(userData);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  const isAdmin = loggedInUser?.role === 'ADMIN';

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
          <Route path="/" element={loggedInUser ? <Navigate to="/calendar" /> : <Login onLogin={handleLogin} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/calendar" element={loggedInUser ? <EventCalendar user={loggedInUser} /> : <Navigate to="/login" />} />
          <Route path="/bookings" element={isAdmin ? <EventBooking /> : <Navigate to="/calendar" />} />
          <Route path="/users" element={isAdmin ? <UserDetails /> : <Navigate to="/calendar" />} />
          <Route path="/create-user" element={isAdmin ? <CreateUser /> : <Navigate to="/calendar" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
