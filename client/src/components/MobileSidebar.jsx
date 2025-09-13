import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaCalendarAlt, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import './styles/CSS/MobileSidebar.css';

const MobileSidebar = ({ isOpen, onClose, user, onLogout }) => {
  if (!isOpen) return null;

  // Helper function to check user roles
  const hasRole = (roleToCheck) => {
    if (!user?.role) return false;
    let roles = user.role;
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [roles];
      }
    }
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(roleToCheck) || roles.includes("SuperAdmin");
  };

  const menuItems = [
    {
      title: "Calendar",
      icon: FaCalendarAlt,
      path: "/calendar",
      description: "Auditorium Calendar",
      color: "bg-blue-600",
      show: hasRole("calendar_access") || hasRole("SuperAdmin")
    },
    {
      title: "Admin",
      icon: FaUsers,
      path: "/users",
      description: "User Management",
      color: "bg-red-600",
      show: hasRole("SuperAdmin")
    }
  ];

  const visibleItems = menuItems.filter(item => item.show);

  const handleLogout = () => {
    onClose(); // Close the mobile menu first
    onLogout(); // Then logout
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 2147483646,
      pointerEvents: 'auto',
      margin: 0,
      padding: 0,
      border: 'none',
      boxSizing: 'border-box',
      display: 'block',
      visibility: 'visible',
      opacity: 1
    }}>
      {/* Backdrop */}
      <div 
        className="mobile-sidebar-backdrop"
        onClick={onClose}
      />
      
      {/* Mobile Sidebar Popup */}
      <div className="mobile-sidebar-popup">
        <div className="mobile-sidebar-header">
          <h3 className="mobile-sidebar-title">Quick Access</h3>
          <button 
            className="mobile-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mobile-sidebar-content">
          {visibleItems.length === 0 ? (
            <div className="mobile-sidebar-no-access">
              <p>No accessible features</p>
            </div>
          ) : (
            <>
              <div className="mobile-sidebar-grid">
                {visibleItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="mobile-sidebar-item"
                    onClick={onClose}
                  >
                    <div className={`mobile-sidebar-icon ${item.color}`}>
                      <item.icon />
                    </div>
                    <div className="mobile-sidebar-text">
                      <span className="mobile-sidebar-item-title">{item.title}</span>
                      <span className="mobile-sidebar-item-desc">{item.description}</span>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Logout Button with spacing */}
              <div className="mobile-sidebar-logout-section">
                <button
                  className="mobile-sidebar-logout-button"
                  onClick={handleLogout}
                >
                  <div className="mobile-sidebar-icon">
                    <FaSignOutAlt />
                  </div>
                  <div className="mobile-sidebar-text">
                    <span className="mobile-sidebar-item-title">Logout</span>
                    <span className="mobile-sidebar-item-desc">Sign out of your account</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;