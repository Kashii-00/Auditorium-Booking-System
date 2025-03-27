import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams,useNavigate } from 'react-router-dom';
import '../styles/createuser.css';

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

  const navigate = useNavigate();

  const { id } = useParams();

  const handleBaseRoleChange = (newRole) => {
    setBaseRole(newRole);
    // Clear access levels if SuperAdmin is selected
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

      const token = localStorage.getItem('token');
      const axiosConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const res = await axios.get(`http://10.70.4.34:5007/api/users/${id}`, axiosConfig);
        if (res.data) {
          const { name, email, phone, role, status } = res.data;
          setName(name || '');
          setEmail(email || '');
          setPhone(phone || '');
          setStatus(status || 'ACTIVE');

          // Handle role parsing
          const parsedRoles = typeof role === 'string' ? JSON.parse(role) : role;
          const roles = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles];

          // Set base role
          if (roles.includes('SuperAdmin')) {
            setBaseRole('SuperAdmin');
          } else if (roles.includes('ADMIN')) {
            setBaseRole('ADMIN');
          } else {
            setBaseRole('USER');
          }

          // Set access levels
          const accessPerms = roles.filter(r => 
            r.includes('_access') || 
            r === 'calendar_access' || 
            r === 'bookings_access' || 
            r === 'bus_access' || 
            r === 'busbookings_access'
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
    if (!name.trim()) return setMessage('Name is required');
    if (!email.trim()) return setMessage('Email is required');
    if (!id && !password.trim()) return setMessage('Password is required');
    if (baseRole !== 'SuperAdmin' && accessLevels.length === 0) {
      return setMessage('Please select at least one access level');
    }

    const token = localStorage.getItem('token');
    const axiosConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const roles = baseRole === 'SuperAdmin' 
        ? ['SuperAdmin']
        : [baseRole, ...accessLevels];

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
        ? `http://10.70.4.34:5007/api/users/${id}`
        : 'http://10.70.4.34:5007/api/users';
      
      const method = id ? 'put' : 'post';
      const res = await axios[method](endpoint, userData, axiosConfig);

      if (res.data) {
        alert(id ? 'User updated successfully!' : 'User created successfully!');
        navigate('/users'); // Add navigation after successful submission
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setMessage(`Failed to save user: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', paddingLeft: '150px' }}>
      <h1>{id ? 'Edit User' : 'Create New User'}</h1>
      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div style={{ maxWidth: '300px' }}>
        <label>Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />

        <label>Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
        />

        <label>Phone</label>
        <input 
          type="text" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
        />

        {!id ? (
          <>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </>
        ) : (
          <div className="password-change-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPasswordChange}
                onChange={(e) => setShowPasswordChange(e.target.checked)}
              />
              <span>Change Password</span>
            </label>
            
            {showPasswordChange && (
              <>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </>
            )}
          </div>
        )}

        <label>Base Role :</label>
        <select  
          value={baseRole}
          onChange={(e) => handleBaseRoleChange(e.target.value)}
          style={{ marginBottom: '25px',marginTop:'20px',marginLeft:'15px',borderRadius:'5px',padding:'5px'}}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="SuperAdmin">Super Admin</option>
        </select> <br/>

        {baseRole !== 'SuperAdmin' && (
          <>
            <label style={{ marginBottom: '10px' }}>Access Levels</label>
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
            </div>
          </>
        )}

        <label>Status</label>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <button 
          onClick={handleSubmit} 
          className="submit-button"
        >
          {id ? 'Update User' : 'Create User'}
        </button>
      </div>
    </div>
  );
};

export default CreateUser;