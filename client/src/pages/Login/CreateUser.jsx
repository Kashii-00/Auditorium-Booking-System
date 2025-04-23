import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './styles/createuser.css';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaIdCard, FaArrowLeft } from 'react-icons/fa';
import { authRequest } from '../../services/authService';

const CreateUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [message, setMessage] = useState('');
  const [baseRole, setBaseRole] = useState('USER');
  const [accessLevels, setAccessLevels] = useState([]);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSidebarState = localStorage.getItem('sidebarState') === 'true';

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
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
      // No setSidebarCollapsed here, but keep localStorage in sync
      localStorage.setItem('sidebarState', e.detail.isCollapsed);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);

  const handleBaseRoleChange = (newRole) => {
    setBaseRole(newRole);
    if (newRole === 'SuperAdmin') {
      setAccessLevels([]);
    }
  };

  const handleAccessLevelChange = (access) => {
    if (baseRole !== 'SuperAdmin') {
      setAccessLevels(prev => 
        prev.includes(access) 
          ? prev.filter(a => a !== access)
          : [...prev, access]
      );
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      try {
        const userData = await authRequest('get', `http://localhost:5003/api/users/${id}`);

        if (userData) {
          const { name, email, phone, role, status } = userData;
          setName(name || '');
          setEmail(email || '');
          setPhone(phone || '');
          setStatus(status || 'ACTIVE');

          const parsedRoles = typeof role === 'string' ? JSON.parse(role) : role;
          const roles = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles];

          if (roles.includes('SuperAdmin')) {
            setBaseRole('SuperAdmin');
          } else if (roles.includes('ADMIN')) {
            setBaseRole('ADMIN');
          } else {
            setBaseRole('USER');
          }

          const accessPerms = roles.filter(r => 
            r.includes('_access') || 
            ['calendar_access', 'bookings_access', 'bus_access', 'busbookings_access'].includes(r)
          );
          setAccessLevels(accessPerms);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setMessage(`Error fetching user data: ${err.message}`);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) return setMessage('Name is required');
    if (!email.trim()) return setMessage('Email is required');
    if (!id && !password.trim()) return setMessage('Password is required');
    if (baseRole !== 'SuperAdmin' && accessLevels.length === 0) {
      return setMessage('Please select at least one access level');
    }

    setIsSubmitting(true);

    try {
      const roles = baseRole === 'SuperAdmin' ? ['SuperAdmin'] : [baseRole, ...accessLevels];
      const userData = {
        name,
        email,
        phone,
        role: roles,
        status,
        ...((!id || showPasswordChange) && { 
          password: id ? newPassword : password 
        })
      };

      const endpoint = id 
        ? `http://localhost:5003/api/users/${id}`
        : 'http://localhost:5003/api/users';
      
      const method = id ? 'put' : 'post';
      const response = await authRequest(method, endpoint, userData);

      if (response) {
        setMessage(id ? 'User updated successfully!' : 'User created successfully!');
        
        // Navigate after a brief delay to show the success message
        setTimeout(() => {
          navigate('/users', { 
            state: { sidebarState: currentSidebarState },
            replace: true
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setMessage(`Failed to save user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-user-container">
      <div className="create-user-card">
        <div className="card-header">
          <Link to="/users" className="back-link">
            <FaArrowLeft /> Back to Users
          </Link>
          <h1>{id ? 'Edit User' : 'Create New User'}</h1>
          <p className="form-subtitle">
            {id ? 'Update user information and access levels' : 'Add a new user to the system'}
          </p>
        </div>

        {message && (
          <div className={message.includes('successfully') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              <FaUser className="field-icon" />
              Full Name
            </label>
            <input 
              id="name"
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope className="field-icon" />
              Email Address
            </label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              <FaPhone className="field-icon" />
              Phone Number
            </label>
            <input 
              id="phone"
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">
              <FaIdCard className="field-icon" />
              Account Status
            </label>
            <select 
              id="status"
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="status-select"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {!id ? (
            <div className="form-group password-field">
              <label htmlFor="password">
                <FaLock className="field-icon" />
                Password
              </label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                placeholder="Enter password"
              />
            </div>
          ) : (
            <div className="form-group password-change-section">
              <label className="checkbox-label" htmlFor="change-password">
                <input
                  id="change-password"
                  type="checkbox"
                  checked={showPasswordChange}
                  onChange={(e) => setShowPasswordChange(e.target.checked)}
                />
                <span>Change Password</span>
              </label>
              
              {showPasswordChange && (
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="new-password-input"
                />
              )}
            </div>
          )}
        </div>

        <div className="roles-section">
          <h2>Role & Permissions</h2>
          
          <div className="base-role-section">
            <label>Base Role:</label>
            <div className="role-options">
              <label className={`role-option ${baseRole === 'USER' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="baseRole" 
                  value="USER"
                  checked={baseRole === 'USER'} 
                  onChange={() => handleBaseRoleChange('USER')}
                />
                User
              </label>
              
              <label className={`role-option ${baseRole === 'ADMIN' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="baseRole" 
                  value="ADMIN"
                  checked={baseRole === 'ADMIN'} 
                  onChange={() => handleBaseRoleChange('ADMIN')}
                />
                Admin
              </label>
              
              <label className={`role-option ${baseRole === 'SuperAdmin' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="baseRole" 
                  value="SuperAdmin"
                  checked={baseRole === 'SuperAdmin'} 
                  onChange={() => handleBaseRoleChange('SuperAdmin')}
                />
                Super Admin
              </label>
            </div>
          </div>

          {baseRole !== 'SuperAdmin' && (
            <>
              <h3>Access Levels</h3>
              <div className="access-levels-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('calendar_access')}
                    onChange={() => handleAccessLevelChange('calendar_access')}
                  />
                  <span>Auditorium Calendar Access</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('bookings_access')}
                    onChange={() => handleAccessLevelChange('bookings_access')}
                  />
                  <span>Auditorium Bookings Access</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('bus_access')}
                    onChange={() => handleAccessLevelChange('bus_access')}
                  />
                  <span>Bus Calendar Access</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('busbookings_access')}
                    onChange={() => handleAccessLevelChange('busbookings_access')}
                  />
                  <span>Bus Bookings Access</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('course_registration_access')}
                    onChange={() => handleAccessLevelChange('course_registration_access')}
                  />
                  <span>Course Registration Access</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accessLevels.includes('lecturer_management_access')}
                    onChange={() => handleAccessLevelChange('lecturer_management_access')}
                  />
                  <span>Lecturer Management Access</span>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button 
            className="cancel-button"
            onClick={() => navigate('/users')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (id ? 'Updating...' : 'Creating...') 
              : (id ? 'Update User' : 'Create User')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;