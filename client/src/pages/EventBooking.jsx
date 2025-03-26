// client/src/pages/EventBooking.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../styles/EventBooking.css';

const EventBooking = () => {
  const [bookings, setBookings] = useState([]);
  const location = useLocation();

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;

  const token = localStorage.getItem('token'); // Adjust this based on your auth storage method

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`, // Include the token in all requests
    },
  };


  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://10.70.4.34:5007/api/bookings',axiosConfig);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://10.70.4.34:5007/api/bookings/${id}`, { status },axiosConfig);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await axios.delete(`http://10.70.4.34:5007/api/bookings/${id}`,axiosConfig);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className='container'>
      <h1>Event Booking Details</h1>
      <div className="table-container">
        <table border="1" cellPadding="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Booking Date</th>
              <th>Booking Start</th>
              <th>Booking End</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr 
                key={b.id}
                className={highlightId === Number(b.id) ? 'highlight' : ''}
              >
                <td>{b.name}</td>
                <td>{b.email}</td>
                <td>{b.phone}</td>
                <td>{b.booking_date}</td>
                <td>{b.booking_time}</td>
                <td>{b.bookingendtime}</td>
                <td>{b.description}</td>
                <td>{b.status}</td>
                <td>
                  {b.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(b.id, 'APPROVED')} className="approveBtn">Approve</button>
                      <button onClick={() => updateStatus(b.id, 'DENIED')} className="denyBtn">Deny</button>
                    </>
                  )}
                  <button onClick={() => deleteBooking(b.id)} className="deleteBtn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventBooking;
