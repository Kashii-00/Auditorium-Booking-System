import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const CreateUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [message, setMessage] = useState('');

  const { id } = useParams();


  useEffect(() => {
    if (id) {
      (async () => {
        try {
          
          const res = await axios.get(`http://localhost:5007/api/users/${id}`);
          if (res.data) {
            setName(res.data.name || '');
            setEmail(res.data.email || '');
            setPhone(res.data.phone || '');
            setRole(res.data.role || 'USER');
            setStatus(res.data.status || 'ACTIVE');
          }
        } catch (err) {
          console.error('Error fetching user to edit:', err);
        }
      })();
    }
  }, [id]);

  const handleSubmit = async () => {
    setMessage('');

    try {
      if (!id) {
       
        const res = await axios.post('http://localhost:5007/api/users', {
          name,
          email,
          phone,
          password,
          role,
          status,
        });
        if (res.data.success) {
          setMessage('User created successfully!');
          setName(''); setEmail(''); setPhone('');
          setPassword(''); setRole('USER'); setStatus('ACTIVE');
        }
      } else {
        
        const res = await axios.put(`http://localhost:5007/api/users/${id}`, {
          name,
          email,
          phone,
          role,
          status,
          password, 
        });
        if (res.data.success) {
          setMessage('User updated successfully!');
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

        <label>Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="USER">USER</option>
          <option value="SuperAdmin">SuperAdmin</option>
          <option value="ADMIN">ADMIN</option>
        </select>

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
