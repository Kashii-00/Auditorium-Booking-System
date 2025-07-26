import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import { FaBars, FaTimes, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import Sidebar from './Sidebar';
import userimage from './person.png'; // Default user image
import useMediaQuery from '@mui/material/useMediaQuery';

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [pageTitle, setPageTitle] = useState('');
  const isMobile = useMediaQuery('(max-width:900px)');
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to their display titles
  useEffect(() => {
    const pathToTitle = {
      '/calendar': 'Auditorium Reservation System',
      '/bookings': 'Auditorium Bookings',
      '/bus': 'Transport Management System',
      '/busbookings': 'Bus Bookings',
      '/users': 'User Management',
      '/create-user': 'Create User',
      '/courseregistration': 'Course Registration',
      '/course-registration': 'Course Registration',
      '/BatchRegistration': 'Batch Registration',
      '/lecturer-registration': 'Lecturer Management',
      '/ClassBooking': 'Class Management',
      '/student-registration': 'Student Management Dashboard',
      '/annual-plan': 'Annual Plan'
    };

    // Find exact path match or closest parent path
    const exactPath = pathToTitle[location.pathname];
    if (exactPath) {
      setPageTitle(exactPath);
    } else {
      // Check for parent paths (for routes with parameters)
      const parentPath = Object.keys(pathToTitle).find(path => 
        location.pathname.startsWith(path) && path !== '/'
      );
      setPageTitle(parentPath ? pathToTitle[parentPath] : 'Dashboard');
    }
  }, [location.pathname]);

  // Effect to sync with sidebar state from localStorage
  useEffect(() => {
    const storedState = localStorage.getItem('sidebarState');
    if (storedState !== null) {
      setIsSidebarCollapsed(storedState === 'true');
    }
    
    // Listen for sidebar state changes
    const handleSidebarToggle = (e) => {
      setIsSidebarCollapsed(e.detail.isCollapsed);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  const toggleSidebar = () => {
    setMenuOpen(!menuOpen);
    // Add/remove a class to the body to prevent scrolling when sidebar is open
    if (!menuOpen) {
      document.body.classList.add('sidebar-active');
      // Force body to stay in position
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      document.body.classList.remove('sidebar-active');
      // Restore body positioning
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    }
  };

  // Helper function to get primary role for display
  const getPrimaryRole = () => {
    if (!user || !user.role) return '';
    
    // Convert role to array if it's a string
    let roles = user.role;
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [roles];
      }
    }
    
    // Ensure roles is an array
    if (!Array.isArray(roles)) roles = [roles];
    
    // Priority order: SuperAdmin > Admin > User > other roles
    if (roles.includes('SuperAdmin')) return 'SuperAdmin';
    if (roles.includes('Admin')) return 'Admin';
    if (roles.includes('User')) return 'User';
    
    // Return first role if no priority role is found
    return roles.length > 0 ? roles[0] : '';
  };

  // Get the role color based on role type
  const getRoleColor = (role) => {
    switch(role) {
      case 'SuperAdmin':
        return 'bg-blue-800';
      case 'Admin':
        return 'bg-green-700';
      case 'User':
        return 'bg-purple-700';
      default:
        return 'bg-gray-700';
    }
  };

  const primaryRole = getPrimaryRole();
  const roleColor = getRoleColor(primaryRole);

  return (
    <>
      <header className="navbar">
        {!isMobile && (
          <span className="navbar-sidebar-indicator">
            {isSidebarCollapsed ? <FaChevronRight className="sidebar-chevron" /> : <FaChevronLeft className="sidebar-chevron" />}
          </span>
        )}
        
        <div className="navbar-title">
          <h1>{pageTitle}</h1>
        </div>
        
        <div className="navbar-links">
          {isMobile && (
            <button
              className="navbar-menu-btn"
              aria-label="Open menu"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
          )}
          {user ? (
            <>
              <div className="navbar-user-profile">
                <span className="navbar-user-name">{user.name}</span>
                {primaryRole && (
                  <div className={`navbar-user-role ${roleColor}`}>
                    {primaryRole}
                  </div>
                )}
                <img
                  alt={user.name}
                  src={userimage}
                  className="navbar-user-photo"
                />
              </div>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      
      {/* Mobile sidebar overlay - FIXED */}
      {isMobile && (
        <div 
          className={`mobile-sidebar-overlay ${menuOpen ? 'active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            toggleSidebar();
          }}
        >
          <div 
            className={`mobile-sidebar-wrapper ${menuOpen ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mobile-sidebar-close" onClick={toggleSidebar}>
              <FaTimes />
            </button>
            <div className="mobile-sidebar-content">
              <Sidebar 
                user={user} 
                onLogout={() => { 
                  setMenuOpen(false); 
                  document.body.classList.remove('sidebar-active');
                  onLogout(); 
                }} 
                isMobile={true} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
