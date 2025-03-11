import React, { useState } from 'react';
import axios from 'axios';

const CreateUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setMessage('');
    try {
      const res = await axios.post('http://10.70.4.34:5007/api/users', {
        name,
        email,
        phone,
        password,
        role
      });
      if (res.data.success) {
        setMessage('User created successfully!');
        // Clear fields
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setRole('USER');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to create user');
    }
  };

  return (
    <div style={{ padding: '20px',paddingLeft:'150px' }}>
      <h1>Create New User</h1>
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
          required
        />
        <label>Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button onClick={handleCreate} style={{ marginTop: '10px' }}>Submit</button>
      </div>
    </div>
  );
};

export default CreateUser;
