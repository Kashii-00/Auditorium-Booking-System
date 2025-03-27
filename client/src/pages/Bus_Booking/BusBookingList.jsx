// client/src/pages/BusBookingDetails.jsx
import React, {useState,useEffect,useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './BusBookingList.css';


const BusBookingDetails = () => {
  const [bookings, setBookings] = useState([]);
  const location = useLocation();
  const [error, setError] = useState(null);  // Added error state

  // Get highlighted booking id if passed via location state
  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;

   // Move token and config inside each function to ensure fresh token
   const getConfig = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }), []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await axios.get('http://10.70.4.34:5007/api/busBookings', getConfig());
      setBookings(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bus bookings:', err);
      setError('Failed to fetch bookings');
    }
  }, [getConfig]);

  // Update the status (e.g., Approve or Deny) of a booking
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://10.70.4.34:5007/api/busBookings/${id}`, 
        { status }, 
        getConfig()
      );
      await fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update booking status');
    }
  };

  // Delete a booking
  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await axios.delete(`http://10.70.4.34:5007/api/busBookings/${id}`, getConfig());
        await fetchBookings();
      } catch (err) {
        console.error('Error deleting booking:', err);
        setError('Failed to delete booking');
      }
    }
  };

  // Add useEffect to fetch bookings on mount
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);



  return (
    <div className='container'>
      <h1>Bus Booking Details</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="table-container">
        <table> 
          <thead>
            <tr >
              <th>Passenger</th>
              <th>Contact Information</th>
              <th>From</th>
              <th>To</th>
              <th>Date of Travel</th>
              <th>Date of Return</th>
              <th>Booked By</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className={highlightId === Number(b.id) ? 'highlight' : ''}>
                <td >{b.forWho}</td>
                <td>{b.ContactNo}</td>
                <td>{b.fromPlace}</td>
                <td>{b.toPlace}</td>
                <td>{b.travelDate || b.date}</td>
                <td>{b.ReturnDate || b.ReturnDate}</td>
                <td>{b.name}</td>
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

export default BusBookingDetails;
