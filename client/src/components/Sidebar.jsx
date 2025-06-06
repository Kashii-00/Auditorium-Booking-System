import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';
import screenshot from "../styles/MPMANew.svg";
import calender from "../styles/calendar1.png";
import List from "../styles/Order.png";
import Bus from "../styles/bus.png";
import admin2 from "../styles/Admin1.png";
import miniLogo from "../styles/MPMA.svg";
import courseIcon from "../styles/kanban.png";
import batchIcon from "../styles/List.png";
import { FaChevronLeft, FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';

const Sidebar = ({ user, onLogout }) => {
  // State variables
  const [selectedSection, setSelectedSection] = useState('audi');
  // Always initialize sidebar state from localStorage (default: expanded/open)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    return stored !== null ? stored === 'true' : false; // default to expanded/open
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Function to determine the default section and navigate to the first accessible page
  const getDefaultSectionAndNavigate = () => {
    if (!user?.role || user.role.length === 0) return; // Wait until roles are loaded
    if (hasRole('SuperAdmin') || hasRole('calendar_access')) {
      if (hasRole('calendar_access')) navigate('/calendar'); // Navigate only if the user has access
      return 'audi';
    }
    if (hasRole('bus_access') || hasRole('busbookings_access')) {
      navigate(hasRole('bus_access') ? '/bus' : '/busbookings');
      return 'bus';
    }
    if (hasRole('course_registration_access')) {
      navigate('/courseregistration');
      return 'Course';
    }
    if (hasRole('lecturer_management_access')) {
      navigate('/lecturer-registration');
      return 'Lecturers';
    }
    if (hasRole('class_request_access')) {
      navigate('/ClassBooking');
      return 'ClassRoom';
    }
    navigate('/access-denied'); // If no access, navigate to Access Denied
    return 'audi'; // Default to 'audi'
  };

  // Set the default section and navigate to the first accessible page
  useEffect(() => {
    if (user?.role && user.role.length > 0) {
      const defaultSection = getDefaultSectionAndNavigate();
      setSelectedSection(defaultSection);
    }
  }, [user]);

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
  
  // Listen for sidebar state changes from other components/pages
  useEffect(() => {
    // On mount, set sidebar state from localStorage (default: collapsed)
    const stored = localStorage.getItem('sidebarState');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    } else {
      setIsCollapsed(true); // default to collapsed/closed
      localStorage.setItem('sidebarState', 'true');
    }

    // Listen for sidebarToggle events and update state
    const handleSidebarToggle = (e) => {
      setIsCollapsed(e.detail.isCollapsed);
      setIsHovered(false); // Reset hover state when toggled from navbar
      setIsPinned(false); // Unpin when toggled from navbar
      
      // Update body class for proper CSS application
      document.body.classList.toggle('sidebar-collapsed', e.detail.isCollapsed);
      
      localStorage.setItem('sidebarState', e.detail.isCollapsed);
    };

    // Listen for browser navigation (back/forward) and sync sidebar state
    const handlePopState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { isCollapsed: stored === 'true' }
        }));
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // --- FORCE sidebar state sync on every route change ---
  useEffect(() => {
    // Always force sidebar state from localStorage on every route change
    const stored = localStorage.getItem('sidebarState');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
      document.body.classList.toggle('sidebar-collapsed', stored === 'true');
      window.dispatchEvent(new CustomEvent('sidebarToggle', {
        detail: { isCollapsed: stored === 'true' }
      }));
    } else {
      setIsCollapsed(true);
      document.body.classList.add('sidebar-collapsed');
      localStorage.setItem('sidebarState', 'true');
      window.dispatchEvent(new CustomEvent('sidebarToggle', {
        detail: { isCollapsed: true }
      }));
    }
  }, [location.pathname]);

  // Toggle sidebar collapse state
  const toggleSidebar = (e) => {
    e.stopPropagation();
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Always update body class for global CSS state
    document.body.classList.toggle('sidebar-collapsed', newCollapsedState);
    
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

  const handleMouseEnter = () => {
    if (isCollapsed && !isPinned) {
      setIsHovered(true);
      setIsCollapsed(false);
      
      // Update body class for CSS when expanded by hover
      document.body.classList.remove('sidebar-collapsed');
      
      localStorage.setItem('sidebarState', 'false');
      window.dispatchEvent(new CustomEvent('sidebarToggle', {
        detail: { isCollapsed: false }
      }));
      window.dispatchEvent(new CustomEvent('sidebarHover', {
        detail: { isHovered: true }
      }));
    }
  };
  
  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
      setIsCollapsed(true);
      
      // Update body class for CSS when collapsed after hover
      document.body.classList.add('sidebar-collapsed');
      
      localStorage.setItem('sidebarState', 'true');
      window.dispatchEvent(new CustomEvent('sidebarToggle', {
        detail: { isCollapsed: true }
      }));
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
    window.location.href = '/login'; // Redirect to login page
    alert('You have been logged out due to inactivity');
  }, [onLogout]);

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

  // Map for first link per section
  const sectionFirstLinks = {
    audi: () => {
      if (hasRole('SuperAdmin') || hasRole('calendar_access')) return '/calendar';
      if (hasRole('bookings_access')) return '/bookings';
      return null;
    },
    bus: () => {
      if (hasRole('SuperAdmin') || hasRole('bus_access')) return '/bus';
      if (hasRole('busbookings_access')) return '/busbookings';
      return null;
    },
    users: () => (hasRole('SuperAdmin') ? '/users' : null),
    Course: () => {
      if (hasRole('SuperAdmin') || hasRole('course_registration_access')) return '/courseregistration';
      if (hasRole('SuperAdmin') || hasRole('student_registration_access')) return '/student-registration';
      if (hasRole('SuperAdmin') || hasRole('batch_registration_access')) return '/BatchRegistration';
      return null;
    },
    Lecturers: () => {
      if (hasRole('SuperAdmin') || hasRole('lecturer_management_access')) return '/lecturer-registration';
      return null;
    },
    ClassRoom: () => (hasRole('SuperAdmin') || hasRole('class_request_access') ? '/ClassBooking' : null),

  };

  // Handle dropdown change: navigate to first link if exists
  const handleSectionChange = (e) => {
    const value = e.target.value;
    setSelectedSection(value);
    const getFirstLink = sectionFirstLinks[value];
    if (getFirstLink) {
      const firstLink = getFirstLink();
      if (firstLink) {
        navigate(firstLink);
      }
    }
  };

  // Render navigation links with dropdown
  const renderDropdownNavigation = () => {
    const dropdownOptions = [
      { value: 'audi', label: 'ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ', roles: ['calendar_access', 'bookings_access'] },
      { value: 'bus', label: 'ᴛʀᴀɴꜱᴘᴏʀᴛ ᴍᴀɴᴀɡᴇᴍᴇɴᴛ', roles: ['bus_access', 'busbookings_access'] },
      { value: 'Course', label: 'ᴄᴏᴜʀꜱᴇ & ʙᴀᴛᴄʜ ᴍᴀɴᴀɡᴇᴍᴇɴᴛ', roles: ['course_registration_access', 'student_registration_access'] },
      { value: 'Lecturers', label: 'ʟᴇᴄᴛᴜʀᴇʀꜱ ᴍᴀɴᴀɡᴇᴍᴇɴᴛ', roles: ['lecturer_management_access'] },
      { value: 'ClassRoom', label: 'ᴄʟᴀꜱꜱ ᴍᴀɴᴀɡᴇᴍᴇɴᴛ', roles: ['class_request_access'] },
      { value: 'users', label: 'ᴀᴅᴍɪɴɪꜱᴛʀᴀᴛɪᴏɴ', roles: ['SuperAdmin'] },
    ];

    // Ensure SuperAdmin has access to all options
    const filteredOptions = dropdownOptions.filter(option =>
      hasRole('SuperAdmin') || option.roles.some(role => hasRole(role))
    );

    return (
      <>
        <select
          value={selectedSection}
          onChange={handleSectionChange}
          onClick={handleSidebarClick}
          className="sidebar-dropdown"
        >
          {filteredOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="sidebar-links">
          {selectedSection === 'audi' && (
            <>
              {(hasRole('calendar_access') || hasRole('SuperAdmin')) && (
                <Link
                  to="/calendar"
                  className={`sidebar-link ${location.pathname === '/calendar' ? 'active' : ''}`}
                >
                  <img src={calender} alt="CalanderLogo" className="sidebar-icon" />
                  <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</span>
                </Link>
              )}
              {(hasRole('bookings_access') || hasRole('SuperAdmin')) && (
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
              {(hasRole('bus_access') || hasRole('SuperAdmin')) && (
                <Link
                  to="/bus"
                  className={`sidebar-link ${location.pathname === '/bus' ? 'active' : ''}`}
                >
                  <img src={Bus} alt="Busbooking" className="sidebar-icon" />
                  <span className="sidebar-text">ʙᴜꜱ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ</span>
                </Link>
              )}
              {(hasRole('busbookings_access') || hasRole('SuperAdmin')) && (
                <Link
                  to="/busbookings"
                  className={`sidebar-link ${location.pathname === '/busbookings' ? 'active' : ''}`}
                >
                  <img src={List} alt="BusbookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ʙᴜꜱ ʙᴏᴏᴋɪɴɢꜱ</span>
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
              <span className="sidebar-text">ᴀᴄᴄᴇꜱꜱ ᴄᴏɴᴛʂᴏʀʟ</span>
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
              
              {/* Add Student Registration Link */}
              {(hasRole('SuperAdmin') || hasRole('student_registration_access')) && (
                <Link
                  to="/student-registration"
                  className={`sidebar-link ${location.pathname === '/student-registration' ? 'active' : ''}`}
                >
                  <img src={batchIcon} alt="Student Registration" className="sidebar-icon" />
                  <span className="sidebar-text">Student Registration</span>
                </Link>
              )}
              
              {(hasRole('SuperAdmin') || hasRole('batch_registration_access')) && (
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
                  to="/annual-plan"
                  className={`sidebar-link ${location.pathname === '/annual-plan' ? 'active' : ''}`}
                >
                  <FaCalendarAlt className="sidebar-icon" />
                  <span className="sidebar-text">Annual Plan</span>
                </Link>
              )}
            </>
          )}
          {selectedSection === 'Lecturers' && (hasRole('SuperAdmin') || hasRole('lecturer_management_access')) && (
            <>
              <Link
                to="/lecturer-registration"
                className={`sidebar-link ${location.pathname === '/lecturer-registration' || location.pathname.includes('/LRegistration/edit/') ? 'active' : ''}`}
              >
                <span className="sidebar-text">ʟᴇᴄᴛᴜʀᴇʀ ʀᴇɡɪꜱᴛʀᴀᴛɪᴏɴ</span>
              </Link>
            </>
          )}
        </div>
      </>
    );
  };


  // Update body class whenever sidebar state changes
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  return (
    <div
      className={`sidebar ${isCollapsed && !isHovered ? 'collapsed' : ''} ${isPinned ? 'pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSidebarClick}
    >
      {/* Always show the collapse toggle button */}
      <button 
        className="collapse-toggle" 
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar(e);
        }} 
        aria-label="Toggle sidebar"
      >
        <FaChevronLeft className={`collapse-icon ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className="sidebar-header">
        <div
          className="navbar-logo"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click events
            navigate('/'); // Navigate to the home page
          }}
          role="button"
          tabIndex="0"
        >
          {isCollapsed && !isHovered ? (
            <img 
              src={miniLogo} 
              alt="MPMA" 
              className="mini-logo" 
              loading="eager" 
            />
          ) : (
            <img 
              src={screenshot} 
              alt="MPMA Full Logo" 
              className="logo-image" 
              loading="eager" 
            />
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
