import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import SuccessPopup from '../Course&Batch/styles/SuccessPopup'; 
import timeGridPlugin from '@fullcalendar/timegrid';
import { FaExclamationTriangle,FaUser, FaPhone, FaPaperPlane, FaCheck } from 'react-icons/fa';
import '../../styles/bus.css';
import { authRequest } from '../../services/authService';
import defaultUserImage from '../assets/profile-user.png';

const BusBooking = ({ user }) => {
  const [fromPlace, setFromPlace] = useState('Colombo');
  const [toPlace, setToPlace] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [forWho, setForWho] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [ContactNo, setContactNo] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem('sidebarState');
      if (stored !== null) {
        const isCollapsed = stored === 'true';
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
          detail: { isCollapsed }
        }));
      }
    };

    syncSidebarState();

    window.addEventListener('popstate', syncSidebarState);

    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed);
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered);

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);

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

  const handleEventMouseLeave = () => setTooltip(prev => ({ ...prev, visible: false }));

  const isWeekend = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!fromPlace) newErrors.fromPlace = 'Starting location is required';
    if (!toPlace) newErrors.toPlace = 'Destination is required';
    if (!travelDate) newErrors.travelDate = 'Travel date is required';
    if (!returnDate) newErrors.returnDate = 'Return date is required';
    if (!forWho) newErrors.forWho = 'Passenger name is required';
    if (!ContactNo) newErrors.contactNo = 'Contact information is required';
    if (isWeekend(travelDate)) newErrors.travelDate = 'Travel date cannot be on weekends';
    if (isWeekend(returnDate)) newErrors.returnDate = 'Return date cannot be on weekends';
    if (new Date(returnDate) < new Date(travelDate)) newErrors.returnDate = 'Return date must be after travel date';
    if (fromPlace === toPlace) newErrors.toPlace = 'Destination cannot be same as starting location';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const MIN_FETCH_INTERVAL = 2000;
  const fetchBookings = useCallback(async () => {
    if (fetchInProgress.current) return;
    const now = Date.now();
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return;
    try {
      fetchInProgress.current = true;
      lastFetchTime.current = now;
      const bookingsData = await authRequest('get', 'http://localhost:5003/api/busBookings');
      const mappedEvents = (bookingsData || []).map((b) => {
        let backgroundColor = b.status === 'APPROVED'
          ? 'green'
          : b.status === 'PENDING'
          ? 'orange'
          : 'red';
        return {
          id: b.id,
          title: `${b.status} - ${b.forWho}`,
          start: b.travelDate || b.date,
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
    } finally {
      fetchInProgress.current = false;
    }
  }, []);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => {
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleBooking = async () => {
    if (!validateForm()) return;
    try {
      const formattedTravelDate = new Date(travelDate).toISOString().split('T')[0];
      const formattedReturnDate = new Date(returnDate).toISOString().split('T')[0];
      const response = await authRequest('post', 'http://localhost:5003/api/busBookings', {
        user_id: user.id,
        fromPlace,
        toPlace,
        travelDate: formattedTravelDate,
        returnDate: formattedReturnDate,
        forWho,
        ContactNo,
      });
      if (response.success) {
        setMessage('Booking request sent!');
        fetchBookings();
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        setFromPlace('Colombo');
        setToPlace('');
        setTravelDate('');
        setReturnDate('');
        setForWho('');
        setContactNo('');
      } else {
        setMessage(response.error || 'Failed to send booking request.');
      }
    } catch (error) {
      console.error('Error creating bus booking:', error);
      setMessage(error.response?.data?.error || 'Failed to send booking request.');
    }
  };

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? 'expanded' : ''}`}>
      {showPopup && (
        <SuccessPopup 
          message="Booking successfully created!"
          onClose={() => setShowPopup(false)}
        />
      )}
      <h1>Bus Reservation System</h1>
      <div className="calendar-container">
        <div className="calendar-main">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="100%"
            dayMaxEventRows={2}
            dayMaxEvents={1}
            contentHeight="auto"
            eventDisplay="block"
            eventClick={(info) => navigate('/busbookings', { 
              state: { 
                highlightId: Number(info.event.id),
                sidebarState: sidebarCollapsed
              },
              replace: true 
            })}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            eventInteractive={true}
            eventClassNames="calendar-event"
          />
        </div>
        <div className="booking-form">
          <h2 className="form-title">Reserve Bus Service</h2>
          <div className="user-info-container">
            <div className="user-photo">
              <img src={user?.photo || defaultUserImage} alt="User" />
            </div>
            <div className="user-details">
              <div className="user-detail">
                <FaUser className="detail-icon" />
                <span>{user?.name || 'User'}</span>
              </div>
              <div className="user-detail">
                <FaPhone className="detail-icon" />
                <span>{user?.phone || 'No phone provided'}</span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>
              <span>Passenger Name</span>
            </label>
            <input
              type="text"
              value={forWho}
              onChange={(e) => setForWho(e.target.value)}
              placeholder="Enter passenger name"
              className={errors.forWho ? 'error' : ''}
            />
          </div>
          <div className="form-group">
            <label>
              <span>Contact Information</span>
            </label>
            <input
              type="text"
              value={ContactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="Enter phone number or email"
              className={errors.contactNo ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label>
              <span>Travel Period</span>
            </label>
            <div className="time-inputs">
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={errors.travelDate ? 'error' : ''}
                placeholder="Travel Date"
              />
              <span className="time-separator">to</span>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={travelDate || new Date().toISOString().split('T')[0]}
                className={errors.returnDate ? 'error' : ''}
                placeholder="Return Date"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <span>Travel Route</span>
            </label>
            <div className="time-inputs">
              <select
                value={fromPlace}
                onChange={(e) => setFromPlace(e.target.value)}
                className="location-select"
              >
                <option value="Colombo">Colombo</option>
              </select>
              <span className="time-separator">to</span>
              <select
                value={toPlace}
                onChange={(e) => setToPlace(e.target.value)}
                className={`location-select ${errors.toPlace ? 'error' : ''}`}
              >
                <option value="">Destination</option>
                {[
                  'Moratuwa', 'Dehiwala-Mount Lavinia', 'Sri Jayawardenepura Kotte', 'Negombo',
                  'Kandy', 'Kalmunai', 'Vavuniya', 'Galle', 'Trincomalee', 'Batticaloa',
                  'Jaffna', 'Matale', 'Katunayake', 'Dambulla', 'Kolonnawa', 'Anuradhapura',
                  'Ratnapura', 'Badulla', 'Matara', 'Puttalam', 'Chavakachcheri', 'Kattankudy'
                ].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(isWeekend(travelDate) || isWeekend(returnDate)) && (
            <div className="weekend-warning">
              <FaExclamationTriangle />
              Bookings are not available on weekends
            </div>
          )}
          <button 
            className="submit-button" 
            onClick={handleBooking}
            disabled={isWeekend(travelDate) || isWeekend(returnDate)}
          >
            <FaPaperPlane />
            <span>Submit Booking</span>
          </button>
          {message && (
            <div className="success-message">
              <FaCheck style={{ marginRight: '8px' }} />
              {message}
            </div>
          )}
        </div>
      </div>
      {tooltip.visible && (
        <div className="event-tooltip" style={{
          top: tooltip.y + 15,
          left: tooltip.x + 15,
        }}>
          <div className="tooltip-header">
            Bus Booking Details
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Route:</span>
            <span>{tooltip.fromPlace} → {tooltip.toPlace}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Travel:</span>
            <span>{tooltip.travelDate} to {tooltip.returnDate}</span>
          </div>
          <div className={`tooltip-status ${tooltip.status.toLowerCase()}`}>
            {tooltip.status}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusBooking;
