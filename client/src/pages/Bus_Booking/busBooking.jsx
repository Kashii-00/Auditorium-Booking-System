import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

const BusBooking = ({ user }) => {
  // Form state
  const [fromPlace, setFromPlace] = useState('Colombo');
  const [toPlace, setToPlace] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [forWho, setForWho] = useState('');
  const [ContactNo, setContactNo] = useState('');
  const [message, setMessage] = useState('');


  
  // Calendar events state
  const [events, setEvents] = useState([]);
  
  // Tooltip state: position, visibility and booking info
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    fromPlace: '',
    toPlace: '',
    travelDate: '',
    returnDate: '',
    status: '',
  });

  const navigate = useNavigate();

  // When mouse enters an event, show the tooltip
  const handleEventMouseEnter = (info) => {
    const { pageX, pageY } = info.jsEvent;
    const { fromPlace, toPlace, travelDate, returnDate, status } = info.event.extendedProps;
    setTooltip({
      visible: true,
      x: pageX,
      y: pageY,
      fromPlace: fromPlace || 'N/A',
      toPlace: toPlace || 'N/A',
      travelDate: travelDate || '',
      returnDate: returnDate || '',
      status: status || 'N/A',
    });
  };

  const isWeekend = (date) => {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6; // 0 is Sunday, 6 is Saturday
  };

  // When mouse leaves an event, hide the tooltip
  const handleEventMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Fetch bus bookings from the API and map them to calendar events
  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5007/api/busBookings');
      const bookingsData = response.data || [];
      const mappedEvents = bookingsData.map((b) => {
        let backgroundColor = b.status === 'APPROVED'
          ? 'green'
          : b.status === 'PENDING'
          ? 'orange'
          : 'red';
      
        // Option 1: Use only the travelDate if you want a single-day event
        return {
          id: b.id,
          title: `${b.status} - ${b.forWho}`,
          start: b.travelDate || b.date,
          // Remove the end property to avoid rendering a range
          backgroundColor,
          textColor: '#fff',
          extendedProps: {
            fromPlace: b.fromPlace,
            toPlace: b.toPlace,
            travelDate: b.travelDate || b.date,
            returnDate: b.ReturnDate || b.enddate,
            status: b.status,
          },
        };
      });
          
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching bus bookings:', error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle booking submission
  const handleBooking = async () => {
    setMessage('');

    if (isWeekend(travelDate) || isWeekend(returnDate)) {
      setMessage('Bookings are not allowed on weekends');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5007/api/busBookings',
        {
          user_id: user.id,
          fromPlace,
          toPlace,
          travelDate,
          returnDate,
          forWho,
          ContactNo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage('Booking request sent!');
        fetchBookings();
      } else {
        setMessage('Failed to send booking request.');
      }
    } catch (error) {
      console.error('Error creating bus booking:', error);
      setMessage('Failed to send booking request.');
    }
  };

  return (
    <div className='container'>
      <h1>Bus Booking Calendar</h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingLeft: '100px' }}>
        {/* Calendar Section */}
        <div
          style={{
            width: '1200px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '38px 20px',
          }}
        >
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
            eventClick={(info) => navigate('/busbookings', { state: { highlightId: Number(info.event.id) } })}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
          />
        </div>

        {/* Booking Form */}
        <div
          style={{
            width: '300px',
            background: '#f9f9f9',
            padding: '0px 40px',
            paddingBottom:'10px',
            borderRadius: '7px',
            border: '1px solid #ddd',
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Book Your Bus</h2>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input
            type="text"
            value={forWho}
            onChange={(e) => setForWho(e.target.value)}
            placeholder="Enter passenger name"
            style={{ width: '100%', marginBottom: '10px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px' }}>Contact Information :</label>
          <input
            type="tel"
            value={ContactNo}
            onChange={(e) => setContactNo(e.target.value)}
            placeholder="Enter Contact No or Email"
            style={{ width: '100%', marginBottom: '10px' }}
          />
          
          <label style={{ display: 'block', marginBottom: '5px' }}>From:</label>
          <select
            value={fromPlace}
            onChange={(e) => setFromPlace(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '7px',
              paddingTop: '17px',
              paddingBottom: '17px',
              borderRadius: '5px',
              borderColor: '#A7B0C8',
            }}
          >
            <option value="Colombo">Colombo</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px' }}>To:</label>
          <select
            value={toPlace}
            onChange={(e) => setToPlace(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '7px',
              paddingTop: '17px',
              paddingBottom: '17px',
              borderRadius: '5px',
              borderColor: '#A7B0C8',
            }}
          >
            <option value="">Select Destination</option>
            {[
              'Moratuwa', 'Dehiwala-Mount Lavinia', 'Sri Jayawardenepura Kotte', 'Negombo',
              'Kandy', 'Kalmunai', 'Vavuniya', 'Galle', 'Trincomalee', 'Batticaloa',
              'Jaffna', 'Matale', 'Katunayake', 'Dambulla', 'Kolonnawa', 'Anuradhapura',
              'Ratnapura', 'Badulla', 'Matara', 'Puttalam', 'Chavakachcheri', 'Kattankudy'
            ].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px' }}>Date of Travel:</label>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => {
              if (!isWeekend(e.target.value)) {
                setTravelDate(e.target.value);
                setMessage('');
              } else {
                setMessage('Weekends are not available for booking');
              }
            }}
            min={new Date().toISOString().split('T')[0]}
            required
            style={{ 
              width: '100%', 
              marginBottom: '7px',
              backgroundColor: isWeekend(travelDate) ? '#f0f0f0' : 'white' 
            }}
          />

          <label style={{ display: 'block', marginBottom: '5px' }}>Date of Return:</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => {
              if (!isWeekend(e.target.value)) {
                setReturnDate(e.target.value);
                setMessage('');
              } else {
                setMessage('Weekends are not available for booking');
              }
            }}
            min={travelDate || new Date().toISOString().split('T')[0]}
            required
            style={{ 
              width: '100%', 
              marginBottom: '7px',
              backgroundColor: isWeekend(returnDate) ? '#f0f0f0' : 'white' 
            }}
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
            Confirm Booking
          </button>
          {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
        </div>
      </div>

      {/* Tooltip Popup */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '8px 10px',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {`From: ${tooltip.fromPlace} - To: ${tooltip.toPlace}`}
          </div>
          <div>{`Travel Date: ${tooltip.travelDate}`}</div>
          <div>{`Return Date: ${tooltip.returnDate}`}</div>
          <div>{`Status: ${tooltip.status}`}</div>
        </div>
      )}
    </div>
  );
};

export default BusBooking;
