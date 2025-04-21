import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/UserDetails.css'; 
import { FaSearch, FaUserPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import { authRequest } from '../services/authService';

const UserDetails = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUserId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => 
    location.state?.sidebarState ?? false
  );

  const fetchUsers = useCallback(async () => {
    try {
      const userData = await authRequest('get', 'http://10.70.4.34:5003/api/users');
      setUsers(userData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { isCollapsed }
        }));
      }
    };

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
    window.addEventListener('popstate', syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      localStorage.setItem('sidebarState', e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);
  
  const deleteUser = useCallback(async (id) => {
    try {
      await authRequest('delete', `http://10.70.4.34:5003/api/users/${id}`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  const renderActionButtons = useCallback((user) => {
    if (user.role.includes('SuperAdmin')) {
      return (
        <span className="current-user-badge">
          {String(user.id) === String(currentUserId) ? 'Current User' : 'SuperAdmin'}
        </span>
      );
    }

    return (
      <>
        <button
          onClick={() => navigate(`/create-user/${user.id}`)}
          className="editBtn-user"
          title="Edit user"
        >
          <FaEdit className="btn-icon" /> Edit
        </button>
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this user?')) {
              deleteUser(user.id);
            }
          }}
          className="deleteBtn-user"
          title="Delete user"
        >
          <FaTrash className="btn-icon" /> Delete
        </button>
      </>
    );
  }, [currentUserId, navigate, deleteUser]);

  return (
    <div className={`content-wrapper-user ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="user-content">
        <div className="page-header-user">
          <FaUsers className="header-icon" />
          <div className="header-text">
            <h1>User Management</h1>
            <p className="header-description">View, edit and manage system users</p>
          </div>
        </div>

        <div className="search-add-container">
          <div className="search-box-user">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="search-icon-user" />
          </div>
          
          <Link to="/create-user" className="add-user-btn">
            <FaUserPlus className="btn-icon" />
            Add User
          </Link>
        </div>

        <div className="table-container-user">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>User Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="user-row">
                    <td className="user-name">{user.name}</td>
                    <td className="user-email">{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      {JSON.parse(user.role).map(role => (
                        <span key={role} className={`role-badge ${role.toLowerCase()}`}>
                          {role}
                        </span>
                      ))}
                    </td>
                    <td className="action-buttons-user">
                      {renderActionButtons(user)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
