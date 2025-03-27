import React, { useState,useEffect,useCallback } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';
import screenshot from "../styles/MPMA.png";

const Sidebar = ({ user, onLogout }) => {
  const [selectedSection, setSelectedSection] = useState('audi');
  const navigate = useNavigate();
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds


  const handleInactivityLogout = useCallback(() => {
    onLogout();
    navigate('/login');
    alert('You have been logged out due to inactivity');
  }, [onLogout, navigate]);

  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, TIMEOUT_DURATION);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      resetTimeout();
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [handleInactivityLogout, TIMEOUT_DURATION]); 

  

  const hasRole = (roleToCheck) => {
    if (!user?.role) return false;
    const roles = Array.isArray(user.role) ? user.role : 
      typeof user.role === 'string' ? JSON.parse(user.role) : [];
    return roles.includes(roleToCheck);
  };


  const renderDropdownNavigation = () => {
    const showDropdown = hasRole('SuperAdmin') || hasRole('ADMIN');
  
    if (!showDropdown) {
      return renderRegularNavLinks();
    }

    return (
      <>
        <select 
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="sidebar-dropdown"
        >
          <option value="audi">Auditorium Booking</option>
          <option value="bus">Bus Booking</option>
          {hasRole('SuperAdmin') && <option value="users">Users</option>}
        </select>
  
        <div className="sidebar-links">
          {selectedSection === 'audi' && (
            <>
              {(hasRole('SuperAdmin') || hasRole('calendar_access')) && (
                <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
              )}
              {(hasRole('SuperAdmin') || hasRole('bookings_access')) && (
                <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</Link>
              )}
            </>
          )}
          {selectedSection === 'bus' && (
            <>
              {(hasRole('SuperAdmin') || hasRole('bus_access')) && (
                <Link to="/bus" style={{paddingLeft:'23px',paddingRight:'10px'}}  className="sidebar-link">🅱🆄🆂 ᴄᴀʟᴇɴᴅᴀʀ</Link>
              )}
              {(hasRole('SuperAdmin') || hasRole('busbookings_access')) && (
                <Link to="/busbookings" style={{paddingLeft:'23px',paddingRight:'10px'}} className="sidebar-link">🅱🆄🆂 ʙᴏᴏᴋɪɴɢꜱ</Link>
              )}
            </>
          )}
          {selectedSection === 'users' && hasRole('SuperAdmin') && (
            <Link to="/users" style={{paddingLeft:'35px',paddingRight:'10px'}}  className="sidebar-link">ᴜꜱᴇʀ ᴅᴇᴛᴀɪʟꜱ</Link>
          )}
        </div>
      </>
    );
  };

  const renderRegularNavLinks = () => {
    return (
      <>
        {hasRole('calendar_access') && (
          <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
        )}
        {hasRole('bookings_access') && (
          <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</Link>
        )}
        {hasRole('bus_access') && (
          <Link style={{paddingLeft:'25px'}} to="/bus" className="sidebar-link">🅱🆄🆂 ᴄᴀʟᴇɴᴅᴀʀ</Link>
        )}
        {hasRole('busbookings_access') && (
          <Link style={{paddingLeft:'25px'}} to="/busbookings" className="sidebar-link">🅱🆄🆂 ʙᴏᴏᴋɪɴɢꜱ</Link>
        )}
      </>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{paddingLeft:'25px'}} className="navbar-logo">
          <Link to="/">
            <img src={screenshot} alt="BookingNet Logo" style={{ maxWidth: '400px', maxHeight: '140px'}} />
          </Link>
        </div>
        <label>-------------------------</label>
      </div>

      <nav style={{paddingLeft:'10px'}}>
        {renderDropdownNavigation()}
      </nav>

      <button onClick={onLogout} className="logoutBtn">Logout</button>
    </div>
  );
};

export default Sidebar;