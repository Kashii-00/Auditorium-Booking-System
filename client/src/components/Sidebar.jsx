import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{paddingTop:'20px',paddingLeft:'30px'}} className="navbar-logo">
                <Link to="/">Auditorium </Link> <br/>
              </div>
      </div>

      <label style={{paddingTop:'10px'}} >-------------------------</label>
      <nav style={{paddingTop:'0px',paddingLeft:'10px'}} >
        <Link to="/calendar" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</Link>
        {user.role === 'ADMIN' && (
          <>
            <Link to="/bookings" className="sidebar-link">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢ</Link>
            <Link style={{paddingLeft:'35px'}} to="/users" className="sidebar-link">ᴜꜱᴇʀ ᴅᴇᴛᴀɪʟꜱ</Link>
          </>
        )}
      </nav>
      <button onClick={onLogout} className="logoutBtn">Logout</button>
    </div>
  );
};

export default Sidebar;
