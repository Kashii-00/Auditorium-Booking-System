import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';
import screenshot from "../styles/MPMANew.svg";
import calender from "../styles/calendar.png";
import List from "../styles/List.png";
import Bus from "../styles/bus.png";
import admin2 from "../styles/Admin1.png";
import miniLogo from "../styles/MPMA.svg";
import CourseandBatch from "../styles/online-learning.png";
import courseIcon from "../pages/Course&Batch/styles/kanban.png";
import batchIcon from "../pages/Course&Batch/styles/list.png";
import costIcon from "../pages/Course&Batch/styles/plus.png"
import addIcon from "../pages/Course&Batch/styles/form.png";
import { FaChevronLeft, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ user, onLogout }) => {
  // State variables
  const [selectedSection, setSelectedSection] = useState('audi');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Click outside to collapse the sidebar when not pinned
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Ignore clicks on sidebar elements
      if (e.target.closest('.collapse-toggle') || 
          e.target.closest('.sidebar-dropdown') ||
          e.target.closest('.logoutBtn') ||
          e.target.closest('.sidebar-link')) {
        return;
      }

      // Check if click is outside sidebar and sidebar is not collapsed or pinned
      if (!e.target.closest('.sidebar') && !isCollapsed && !isPinned) {
        setIsCollapsed(true);
        setIsHovered(false);
        
        // Dispatch event to inform other components
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { 
            isCollapsed: true,
            isHovered: false,
            isPinned: false 
          }
        }));
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isCollapsed, isPinned]);
  
  // Toggle sidebar collapse state
  const toggleSidebar = (e) => {
    e.stopPropagation();
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setIsPinned(false);
    setIsHovered(false);
    
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { 
        isCollapsed: newCollapsedState,
        isHovered: false,
        isPinned: false 
      }
    }));
  };

  // Mouse enter and leave handlers for hover effect
  const handleMouseEnter = () => {
    if (isCollapsed && !isPinned) {
      setIsHovered(true);
      window.dispatchEvent(new CustomEvent('sidebarHover', {
        detail: { isHovered: true }
      }));
    }
  };
  
  const handleMouseLeave = () => {
    if (isCollapsed && !isPinned) {
      setIsHovered(false);
      window.dispatchEvent(new CustomEvent('sidebarHover', {
        detail: { isHovered: false }
      }));
    }
  };

  // Handle click to pin/unpin the sidebar
  const handleSidebarClick = (e) => {
    // Ignore clicks on interactive elements
    if (e.target.classList.contains('sidebar-dropdown') ||
        e.target.closest('.sidebar-dropdown') ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.closest('a') ||
        e.target.closest('button')) {
      return;
    }
    
    // Toggle pin if sidebar is expanded or being expanded by hover
    if (!isCollapsed || isHovered) {
      setIsPinned(!isPinned);
      
      // Update collapse state when clicking sidebar
      if (isCollapsed) {
        setIsCollapsed(false);
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { 
            isCollapsed: false,
            isHovered: false,
            isPinned: true 
          }
        }));
      }
    }
  };

  // Inactivity logout callback
  const handleInactivityLogout = useCallback(() => {
    onLogout();
    navigate('/login');
    alert('You have been logged out due to inactivity');
  }, [onLogout, navigate]);

  // Set up inactivity timeout
  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, TIMEOUT_DURATION);
    };

    document.addEventListener('mousemove', resetTimeout);
    document.addEventListener('keypress', resetTimeout);

    // Initial timeout
    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('mousemove', resetTimeout);
      document.removeEventListener('keypress', resetTimeout);
    };
  }, [handleInactivityLogout, TIMEOUT_DURATION]);

  // Function to check user roles
  const hasRole = (roleToCheck) => {
    if (!user?.role) return false;
    let roles = user.role;
    if (typeof roles === 'string') {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [roles];
      }
    }
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(roleToCheck);
  };

  // Render navigation links with dropdown
  const renderDropdownNavigation = () => {
    // Determine if dropdown is needed based on roles
    const showDropdown = hasRole('SuperAdmin') || hasRole('ADMIN') || hasRole('USER');
    if (!showDropdown) {
      return renderRegularNavLinks();
    }

    return (
      <>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          onClick={handleSidebarClick}
          className="sidebar-dropdown"
        >
          <option value="audi">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ</option>
          <option value="bus">ᴛʀᴀɴꜱᴘᴏʀᴛ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</option>
          <option value="Course">ᴄᴏᴜʀꜱᴇ & ʙᴀᴛᴄʜ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</option>
          <option value="Lecturers">ʟᴇᴄᴛᴜʀᴇʀꜱ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</option>
          {hasRole('SuperAdmin') && <option value="users">ᴀᴅᴍɪɴɪꜱᴛʀᴀᴛɪᴏɴ</option>}
        </select>

        <div className="sidebar-links">
          {selectedSection === 'audi' && (
              <>
                {(hasRole('SuperAdmin') || hasRole('calendar_access')) && (
                  <Link
                    to="/calendar"
                    className={`sidebar-link ${location.pathname === '/calendar' ? 'active' : ''}`}
                  >
                    <img src={calender} alt="CalanderLogo" className="sidebar-icon" />
                    <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</span>
                  </Link>
                )}
                {(hasRole('SuperAdmin') || hasRole('bookings_access')) && (
                  <Link
                    to="/bookings"
                    className={`sidebar-link ${location.pathname === '/bookings' ? 'active' : ''}`}
                  >
                    <img src={List} alt="BookingList" className="sidebar-icon" />
                    <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</span>
                  </Link>
                )}
              </>
            )}
            {selectedSection === 'bus' && (
              <>
                {(hasRole('SuperAdmin') || hasRole('bus_access')) && (
                  <Link
                    to="/bus"
                    className={`sidebar-link ${location.pathname === '/bus' ? 'active' : ''}`}
                  >
                    <img src={Bus} alt="Busbooking" className="sidebar-icon" />
                    <span className="sidebar-text">ʙᴜꜱ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ</span>
                  </Link>
                )}
                {(hasRole('SuperAdmin') || hasRole('busbookings_access')) && (
                  <Link
                    to="/busbookings"
                    className={`sidebar-link ${location.pathname === '/busbookings' ? 'active' : ''}`}
                  >
                    <img src={List} alt="BusbookingList" className="sidebar-icon" />
                    <span className="sidebar-text">ʙᴜꜱ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ</span>
                  </Link>
                )}
              </>
            )}
            {selectedSection === 'users' && hasRole('SuperAdmin') && (
              <Link
                to="/users"
                className={`sidebar-link ${location.pathname === '/users' ? 'active' : ''}`}
              >
                <img src={admin2} alt="UserList" className="sidebar-icon" />
                <span className="sidebar-text">ᴀᴄᴄᴇꜱꜱ ᴄᴏɴᴛʀᴏʟ</span>
              </Link>
            )}
            {selectedSection === 'Course' && (
              <>
                {(hasRole('SuperAdmin') || hasRole('course_registration_access')) && (
                  <Link
                    to="/courseregistration"
                    className={`sidebar-link ${location.pathname === '/courseregistration' ? 'active' : ''}`}
                  >
                    <img src={courseIcon} alt="Course Registration" className="sidebar-icon" />
                    <span className="sidebar-text">Course Registration</span>
                  </Link>
                )}
                {(hasRole('SuperAdmin')) && (
                  <Link
                    to="/BatchRegistration"
                    className={`sidebar-link ${location.pathname === '/BatchRegistration' ? 'active' : ''}`}
                  >
                    <img src={batchIcon} alt="Batch Registration" className="sidebar-icon" />
                    <span className="sidebar-text">Batch Registration</span>
                  </Link>
                )}
                {(hasRole('SuperAdmin')) && (
                  <Link
                    to="/CourseIN"
                    className={`sidebar-link ${location.pathname === '/CourseIN' ? 'active' : ''}`}
                  >
                    <img src={costIcon} alt="Cost In" className="sidebar-icon" />
                    <span className="sidebar-text">Cost - In</span>
                  </Link>
                )}
                {(hasRole('SuperAdmin')) && (
                  <Link
                    to="/AddMore"
                    className={`sidebar-link ${location.pathname === '/AddMore' ? 'active' : ''}`}
                  >
                    <img src={addIcon} alt="Add More" className="sidebar-icon" />
                    <span className="sidebar-text">Add More</span>
                  </Link>
                )}
              </>
            )}
            {selectedSection === 'Lecturers' && hasRole('SuperAdmin') && (
              <Link
                to="/LMmain"
                className={`sidebar-link ${location.pathname === '/LMmain' ? 'active' : ''}`}
              >
                <span className="sidebar-text">ʟᴇᴄᴛᴜʀᴇʀꜱ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</span>
              </Link>
            )}
        </div>
      </>
    );
  };

  // Fallback navigation 
  const renderRegularNavLinks = () => {
    return (
      <>
        {hasRole('calendar_access') && (
          <Link to="/calendar" className="sidebar-link">
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</span>
          </Link>
        )}
        {hasRole('bookings_access') && (
          <Link to="/bookings" className="sidebar-link">
            <span className="sidebar-icon">📚</span>
            <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</span>
          </Link>
        )}
        {hasRole('bus_access') && (
          <Link to="/bus" className="sidebar-link">
            <span className="sidebar-icon">🚌</span>
            <span className="sidebar-text">ʙᴜꜱ ᴄᴀʟᴇɴᴅᴀʀ</span>
          </Link>
        )}
        {hasRole('busbookings_access') && (
          <Link to="/busbookings" className="sidebar-link">
            <span className="sidebar-icon">🎫</span>
            <span className="sidebar-text">ʙᴜꜱ ʙᴏᴏᴋɪɴɢꜱ</span>
          </Link>
        )}
      </>
    );
  };

  return (
    <div
      className={`sidebar ${isCollapsed && !isHovered ? 'collapsed' : ''} ${isPinned ? 'pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSidebarClick}
    >
      <button className="collapse-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <FaChevronLeft className="collapse-icon" />
      </button>

      <div className="sidebar-header">
      <div className="navbar-logo" onClick={() => navigate('/')} role="button" tabIndex="0">
        {isCollapsed && !isHovered ? (
          <img src={miniLogo} alt="Mini Logo" className="mini-logo" />
        ) : (
          <img src={screenshot} alt="Logo" className="logo-image" />
        )}
      </div>
      </div>

      <nav className="sidebar-nav">
        {renderDropdownNavigation()}
      </nav>

      <button onClick={onLogout} className="logoutBtn">
        <FaSignOutAlt className="logout-icon" />
        <span className="logout-text">Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
