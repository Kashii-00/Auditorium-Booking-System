import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../styles/EventBooking.css';

const EventBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;

  // Memoize the config getter
  const getConfig = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }), []);

  // Create memoized fetchBookings function
  const fetchBookings = useCallback(async () => {
    try {
      const res = await axios.get('http://10.70.4.34:5007/api/bookings', getConfig());
      setBookings(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    }
  }, [getConfig]);

  // Update status function
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://10.70.4.34:5007/api/bookings/${id}`, 
        { status }, 
        getConfig()
      );
      await fetchBookings();
      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update booking status');
    }
  };

  // Delete booking function
  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await axios.delete(`http://10.70.4.34:5007/api/bookings/${id}`, getConfig());
        await fetchBookings();
        setError(null);
      } catch (err) {
        console.error('Error deleting booking:', err);
        setError('Failed to delete booking');
      }
    }
  };

  // Effect for initial fetch and polling
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBookings]);


  return (
    <div className='container'>
      <h1>Event Booking Details</h1>
      {error && <div className="error-message">{error}</div>}
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
