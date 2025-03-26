import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const CreateUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(['USER']);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [message, setMessage] = useState('');

  const { id } = useParams();

  const token = localStorage.getItem('token'); // Adjust this based on your auth storage method

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`, // Include the token in all requests
    },
  };


  // Update the useEffect that fetches user data
useEffect(() => {
  if (id) {
    (async () => {
      try {
        const res = await axios.get(`http://10.70.4.34:5007/api/users/${id}`, axiosConfig);
        if (res.data) {
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setPhone(res.data.phone || '');
          // Parse roles if they come as string
          const roles = typeof res.data.role === 'string' 
            ? JSON.parse(res.data.role)
            : res.data.role || ['USER'];
          setRole(Array.isArray(roles) ? roles : [roles]);
          setStatus(res.data.status || 'ACTIVE');
        }
      } catch (err) {
        console.error('Error fetching user to edit:', err);
      }
    })();
  }
}, [id]);

// Update the handleSubmit function
const handleSubmit = async () => {
  setMessage('');

  if (!name.trim()) return setMessage('Name is required');
  if (!email.trim()) return setMessage('Email is required');
  if (!role.length) return setMessage('At least one role is required');
  if (!status.trim()) return setMessage('Status is required');
  if (!id && !password.trim()) return setMessage('Password is required');

  try {
    const userData = {
      name,
      email,
      phone,
      password,
      role: Array.from(new Set(role)), // Ensure unique roles
      status,
    };

    const endpoint = id 
      ? `http://10.70.4.34:5007/api/users/${id}`
      : 'http://10.70.4.34:5007/api/users';
    
    const method = id ? 'put' : 'post';

    const res = await axios[method](endpoint, userData, axiosConfig);

    if (res.data.success) {
      setMessage(res.data.message);
      if (!id) {
        // Clear form after creating new user
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setRole(['USER']);
        setStatus('ACTIVE');
      }
    }
  } catch (err) {
    console.error(err);
    setMessage('Failed to save user');
  }
};
  
  

  return (
    <div style={{ padding: '20px', paddingLeft: '150px' }}>
      {!id ? (
        <h1>Create New User</h1>
      ) : (
        <h1>Edit User: {name}</h1>
      )}
      {message && <p>{message}</p>}

      <div style={{ maxWidth: '300px' }}>
        <label>Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e)=>setName(e.target.value)} 
          required 
        />

        <label>Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e)=>setEmail(e.target.value)} 
          required
        />

        <label>Phone</label>
        <input 
          type="text" 
          value={phone} 
          onChange={(e)=>setPhone(e.target.value)}
        />

        <label>Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e)=>setPassword(e.target.value)} 
          // required if creating new user
          required={!id}
        />

        <label>Role,</label>
        <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1px',
        marginBottom: '15px',
        marginTop: '5px',
        backgroundColor: '#f5f5f5',
        padding: '10px 15px',
        borderRadius: '5px'
        }}>
          {['USER', 'ADMIN','SuperAdmin','BUS_BOOKING','AUDITORIUM_BOOKING'].map((roleOption) => (
            <label key={roleOption} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
                checked={role.includes(roleOption)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setRole([...role, roleOption]);
                  } else {
                    setRole(role.filter(r => r !== roleOption));
                  }
                }}
              />
              {roleOption}
            </label>
          ))}
        </div>

        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        <button onClick={handleSubmit} style={{ marginTop: '10px' }}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default CreateUser;
