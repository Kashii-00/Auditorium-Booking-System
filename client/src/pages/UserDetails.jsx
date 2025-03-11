import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserDetails.css'; 

const UserDetails = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://10.70.4.34:5007/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://10.70.4.34:5007/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ paddingLeft: '100px', paddingRight: '100px' }}>
      <h1>User Details</h1>
      
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>User Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                {/* Example: toggling active/inactive if needed */}
                {/* Or direct delete */}
                <button onClick={() => deleteUser(u.id)} className="deleteBtn">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table> <br/>
      <Link className='buttonadduser' style={{paddingLeft:'30px'}} to="/create-user">
        <button style={{paddingTop:'10px',paddingBottom:'10px'}}>Add User</button>
      </Link>
    </div>
  );
};

export default UserDetails;
