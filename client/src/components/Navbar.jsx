import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-logo">

      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-greeting">ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ, {user.name}</span>
            
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
