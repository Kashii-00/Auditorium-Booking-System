// client/src/pages/BusBookingDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './BusBookingList.css';


const BusBookingDetails = () => {
  const [bookings, setBookings] = useState([]);
  const location = useLocation();

  // Get highlighted booking id if passed via location state
  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;

  const token = localStorage.getItem('token'); // Adjust based on your auth storage

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch bus booking data from your API
  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://10.70.4.34:5007/api/busBookings', axiosConfig);
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bus bookings:', err);
    }
  };

  // Update the status (e.g., Approve or Deny) of a booking
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://10.70.4.34:5007/api/busBookings/${id}`, { status }, axiosConfig);
      fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Delete a booking
  const deleteBooking = async (id) => {
    try {
      await axios.delete(`http://10.70.4.34:5007/api/busBookings/${id}`, axiosConfig);
      fetchBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className='container'>
      <h1>Bus Booking Details</h1>
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
