import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';
import screenshot from "../styles/MPMA.png"


const Sidebar = ({ user, onLogout }) => {

  const hasRole = (roleToCheck) => {
    if (!user.role) return false;
    // Parse the role if it's a string (JSON format)
    const roles = typeof user.role === 'string' ? JSON.parse(user.role) : user.role;
    return roles.includes(roleToCheck);
  };

  const renderNavLinks = () => {
    if (hasRole('SuperAdmin')) {
      return (
        <>
          <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
          <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</Link> <br/>
          <Link style={{paddingLeft:'25px'}} to="/bus" className="sidebar-link">🅱🆄🆂 ᴄᴀʟᴇɴᴅᴀʀ</Link>
          <Link style={{paddingLeft:'25px'}} to="/busbookings" className="sidebar-link">🅱🆄🆂 ʙᴏᴏᴋɪɴɢꜱ</Link> <br/>
          <Link style={{paddingLeft:'32px'}} to="/users" className="sidebar-link">ᴜꜱᴇʀ ᴅᴇᴛᴀɪʟꜱ</Link>
        </>
      );
    } else if (hasRole('ADMIN')) {
      return (
        <>
          <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
          <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</Link> <br/>
          <Link style={{paddingLeft:'25px'}} to="/bus" className="sidebar-link">🅱🆄🆂 ᴄᴀʟᴇɴᴅᴀʀ</Link>
          <Link style={{paddingLeft:'25px'}} to="/busbookings" className="sidebar-link">🅱🆄🆂 ʙᴏᴏᴋɪɴɢꜱ</Link>
        </>
      );
    } else {
      return (
        <>
          {/* Show calendar for USER and AUDITORIUM_BOOKING */}
          {hasRole('USER') || hasRole('AUDITORIUM_BOOKING') ? (
            <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
          ) : null}
          
          {/* Show bookings only for AUDITORIUM_BOOKING */}
          {hasRole('AUDITORIUM_BOOKING') ? (
            <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</Link>
          ) : null}
          
          {/* Show bus for USER and BUS_BOOKING */}
          {hasRole('USER') || hasRole('BUS_BOOKING') ? (
            <Link style={{paddingLeft:'25px'}} to="/bus" className="sidebar-link">🅱🆄🆂 ᴄᴀʟᴇɴᴅᴀʀ</Link>
          ) : null}
          
          {/* Show bus bookings only for BUS_BOOKING */}
          {hasRole('BUS_BOOKING') ? (
            <Link style={{paddingLeft:'25px'}} to="/busbookings" className="sidebar-link">🅱🆄🆂 ʙᴏᴏᴋɪɴɢꜱ</Link>
          ) : null}
        </>
      );
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{paddingLeft:'25px'}} className="navbar-logo">
        <Link to="/">
    <img 
      src={screenshot}
      alt="BookingNet Logo" 
      style={{ maxWidth: '400px', maxHeight: '140px'}} 
    />
  </Link> 
                
              </div>
              <label>-------------------------</label>
      </div>

      <nav style={{paddingLeft:'10px'}}>
        {renderNavLinks()}
      </nav>

      <button onClick={onLogout} className="logoutBtn">Logout</button>
    </div>
  );
};

export default Sidebar;
