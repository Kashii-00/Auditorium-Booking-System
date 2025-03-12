import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import "../styles/Calendar.css";
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

const EventCalendar = ({ user }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingendtime, setEndTime] = useState('');
  const [noOfPeople, setNoOfPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  // Function to generate 30-minute interval time options
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minutes of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        times.push(`${formattedHour}:${formattedMinutes}`);
      }
    }
    return times;
  };

  // Fetch existing bookings
  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get('http://10.70.4.34:5007/api/bookings');
      const bookingsData = response.data || [];
      const mappedEvents = bookingsData.map((b) => {
        const datePart = b.booking_date.includes("T") ? b.booking_date.split("T")[0] : b.booking_date;
        const startStr = `${datePart}T${b.booking_time}`;
        const endStr = `${datePart}T${b.bookingendtime}`;

        let backgroundColor = b.status === 'APPROVED' ? 'green' : b.status === 'PENDING' ? 'orange' : 'red';
        return {
          id: b.id,
          description: b.description,
          title: `${b.status} - ${b.name}`,
          start: startStr,
          end: endStr,
          backgroundColor,
          textColor: '#fff',
        };
      });
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBooking = async () => {
    setMessage('');
    try {
      const response = await axios.post('http://10.70.4.34:5007/api/bookings', {
        user_id: user.id,
        description,
        booking_date: bookingDate,
        booking_time: bookingTime,
        bookingendtime: bookingendtime,
        no_of_people: noOfPeople,
      });

      if (response.data.success) {
        setMessage('Booking request sent!');
        fetchBookings();
      } else {
        setMessage('Failed to send booking request.');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setMessage('Failed to send booking request.');
    }
  };

  return (
    <div className='container'>
      <h1>Auditorium Calendar</h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingLeft: '100px' }}>
        <div style={{ width: '1200px', border: '1px solid #ccc', borderRadius: '10px', padding: '20px 30px' }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="auto"
            dayMaxEventRows={2}
            contentHeight={700}
            eventClick={(info) => {
              navigate('/bookings', { state: { highlightId: Number(info.event.id) } });
            }}
          />
        </div>
        <div style={{
          width: '250px',
          background: '#f9f9f9',
          padding: '5px 40px',
          borderRadius: '7px',
          border: '1px solid #ddd',
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Book Auditorium</h2>
          <p style={{ margin: '0 0 9px' }}><strong>Name:</strong> {user?.name}</p>
          <p style={{ margin: '0 0 30px' }}><strong>Phone:</strong> {user?.phone}</p>
          
          <label style={{ display: 'block', marginBottom: '5px' }}>Reservation Date:</label>
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '7px' }}
          />
          
          <label style={{ display: 'block', marginBottom: '5px' }}>Reservation Time:</label>

          <select 
            value={bookingTime}
            onChange={(e) => setBookingTime(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "7px", paddingTop: "17px", paddingBottom: "17px", borderRadius: "5px", borderColor: "#A7B0C8" }}
          >
            <option value="" disabled>Start Time</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>


          <select 
            value={bookingendtime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "7px", paddingTop: "17px", paddingBottom: "17px", borderRadius: "5px", borderColor: "#A7B0C8" }}
          >
            <option value="" disabled>End Time</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px' }}>No. of People:</label>
          <input
            type="number"
            value={noOfPeople}
            onChange={(e) => setNoOfPeople(e.target.value)}
            min="1"
            style={{ width: '100%', marginBottom: '10px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            style={{ width: '100%', marginBottom: '10px' }}
          />

          <button
            onClick={handleBooking}
            style={{
              marginTop: '10px',
              padding: '12px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#12492f')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#4CAF50')}
          >
            Submit
          </button>
          {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;