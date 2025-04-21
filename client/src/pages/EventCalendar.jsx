import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import "../styles/Calendar.css";
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import SuccessPopup from './Course&Batch/styles/SuccessPopup';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  FaUser, 
  FaPhone, 
  FaPaperPlane,
  FaCheck,
} from 'react-icons/fa';
import defaultUserImage from '../styles/profile-user.png';

const EventCalendar = ({ user }) => {
  // Form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingendtime, setEndTime] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [noOfPeople, setNoOfPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error tracking
  const [errors, setErrors] = useState({});
  
  // Calendar refs and state
  const calendarRef = useRef(null);
  const [isCalendarMounted, setIsCalendarMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useNavigate();

  // Handle calendar resize when sidebar changes or window resizes
  const handleResize = useCallback(() => {
    if (isCalendarMounted && calendarRef.current?.getApi) {
      setTimeout(() => {
        try {
          const api = calendarRef.current.getApi();
          if (api) {
            api.updateSize();
          }
        } catch (error) {
          console.log('Calendar API not ready yet');
        }
      }, 300);
    }
  }, [isCalendarMounted]);

  // Initialize when calendar is mounted
  useEffect(() => {
    if (calendarRef.current) {
      setIsCalendarMounted(true);
    }
  }, []);  
  
  // Listen for sidebar toggle events
  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
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

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
    window.addEventListener('popstate', syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
      localStorage.setItem('sidebarState', e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, [handleResize, isCalendarMounted]);

  // Tooltip state: stores position, visibility, and booking info
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    description: '',
    start: '',
    end: '',
    status: '',
  });

  // When mouse enters an event, show the tooltip
  const handleEventMouseEnter = (info) => {
    // Mouse position
    const { pageX, pageY } = info.jsEvent;

    // Convert times to HH:mm format
    const startTime = info.event.start
      ? info.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const endTime = info.event.end
      ? info.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    // The 'description' is stored in extendedProps
    const { description } = info.event.extendedProps;
    const { status } = info.event.extendedProps;

    setTooltip({
      visible: true,
      x: pageX,
      y: pageY,
      description: description || 'No description',
      start: startTime,
      end: endTime,
      status: status || 'N/A',
    });
  };

  // When mouse leaves the event, hide the tooltip
  const handleEventMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // Function to generate 30-minute interval time options
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minutes of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinutes}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayTime = `${displayHour}:${formattedMinutes} ${period}`;
        times.push({ value: time, label: displayTime });
      }
    }
    return times;
  };

  // Add validation function
  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(bookingDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (!bookingDate) {
      newErrors.date = 'Date is required';
    } else if (selectedDate < today) {
      newErrors.date = 'Cannot book dates in the past';
    }

    if (!bookingTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!bookingendtime) {
      newErrors.endTime = 'End time is required';
    } else if (bookingTime && bookingendtime <= bookingTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!noOfPeople || noOfPeople < 1) {
      newErrors.people = 'Number of people must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://10.70.4.34:5007/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const bookingsData = response.data || [];
      const mappedEvents = bookingsData.map((b) => {
        const datePart = b.booking_date.includes("T") 
          ? b.booking_date.split("T")[0] 
          : b.booking_date;
        const startStr = `${datePart}T${b.booking_time}`;
        const endStr = `${datePart}T${b.bookingendtime}`;

        const status = b.status.toLowerCase();

        return {
          id: b.id,
          title: b.description,
          status: b.status,
          start: startStr,
          end: endStr,
          className: `status-${status}`,
          extendedProps: {
            description: b.description,
            status: b.status,
            people: b.no_of_people
          }
        };
      });
      
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Handle booking form submission
  const handleBooking = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://10.70.4.34:5007/api/bookings',
        {
          user_id: user.id,
          description,
          booking_date: bookingDate,
          booking_time: bookingTime,
          bookingendtime: bookingendtime,
          no_of_people: noOfPeople,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data.success) {
        setMessage('Booking request sent successfully!');
        fetchBookings();
        setShowPopup(true);
        
        // Reset form fields
        setBookingDate('');
        setBookingTime('');
        setEndTime('');
        setNoOfPeople(1);
        setDescription('');
        
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      } else {
        setMessage('Failed to send booking request.');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setMessage('Failed to send booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update calendar when sidebar changes or window resizes
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      if (isCalendarMounted) {
        // Use a longer delay for sidebar toggle since it's a bigger layout change
        setTimeout(handleResize, 500);
      }
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
    };

    const handleWindowResize = () => {
      if (isCalendarMounted) {
        handleResize();
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [handleResize, isCalendarMounted]);

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? 'expanded' : ''}`}>
      
      {showPopup && (
        <SuccessPopup 
          message="Booking added successfully!"
          onClose={() => setShowPopup(false)}
        />
      )}

      <h1>Auditorium Reservation System</h1>
      
      <div className="calendar-container">
        {/* Calendar Section */}
        <div className="calendar-main">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="100%"
            handleWindowResize={true}
            viewDidMount={() => {
              setIsCalendarMounted(true);
              setTimeout(handleResize, 300);
            }}
            dayMaxEventRows={3}
            fixedWeekCount={false}
            stickyHeaderDates={true}
            stickyFooterScrollbar={true}
            contentHeight="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: true
            }}
            nowIndicator={true}
            eventClick={(info) => {
              navigate('/bookings', { 
                state: { 
                  highlightId: Number(info.event.id),
                  sidebarState: sidebarCollapsed
                }
              });
            }}
            eventDidMount={(info) => {
              const status = info.event.extendedProps.status.toLowerCase();
              info.el.classList.add(`status-${status}`);
            }}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventContent={(eventInfo) => {
              return (
                <div className="fc-event-main-frame">
                  <div className="fc-event-title-container">
                    <div className="fc-event-title">
                      {eventInfo.timeText && (
                        <span className="fc-event-time">{eventInfo.timeText} • </span>
                      )}
                      {eventInfo.event.title}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Booking Form */}
        <div className="booking-form">
          <h2 className="form-title">Reserve the Auditorium</h2>
          
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
            <label htmlFor="booking-date">
             
              <span>Reservation Date</span>
            </label>
            <input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className={errors.date ? 'error' : ''}
            />
           
          </div>

          <div className="form-group">
            <label htmlFor="booking-time">
              
              <span>Time Slot</span>
            </label>
            <div className="time-inputs">
              <select
                id="booking-time"
                value={bookingTime}
                onChange={(e) => {
                  setBookingTime(e.target.value);
                  if (bookingendtime && bookingendtime <= e.target.value) {
                    setEndTime('');
                  }
                }}
                required
                className={errors.startTime ? 'error' : ''}
              >
                <option value="" disabled>Start Time</option>
                {generateTimeOptions().map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>

              <span className="time-separator">to</span>

              <select
                value={bookingendtime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={errors.endTime ? 'error' : ''}
                disabled={!bookingTime}
              >
                <option value="" disabled>End Time</option>
                {generateTimeOptions()
                  .filter(time => !bookingTime || time.value > bookingTime)
                  .map((time) => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
              </select>
            </div>
            
          </div>

          <div className="form-group">
            <label htmlFor="no-of-people">
              
              <span>Number of Attendees</span>
            </label>
            <input
              id="no-of-people"
              type="number"
              value={noOfPeople}
              onChange={(e) => setNoOfPeople(Math.max(1, parseInt(e.target.value) || 0))}
              min="1"
              required
              className={errors.people ? 'error' : ''}
            />
            
          </div>

          <div className="form-group">
            <label htmlFor="description">
              
              <span>Event Description</span>
            </label>
            <textarea
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description of your event"
              required
              className={errors.description ? 'error' : ''}
            />
            
          </div>

          <button 
            className="submit-button" 
            onClick={handleBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <FaPaperPlane />
                <span>Submit Booking</span>
              </>
            )}
          </button>
          
          {message && (
            <div className="success-message">
              <FaCheck style={{ marginRight: '8px' }} />
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip Popup */}
      {tooltip.visible && (
        <div className="event-tooltip" style={{
          top: tooltip.y + 15,
          left: tooltip.x + 15,
        }}>
          <div className="tooltip-header">
            Event Details
          </div>
          
          <div className="tooltip-row">
            <span className="tooltip-label">Time:</span>
            <span>{tooltip.start && tooltip.end ? `${tooltip.start} - ${tooltip.end}` : 'Not specified'}</span>
          </div>
          
          <div className="tooltip-row">
            <span className="tooltip-label">Description:</span>
            <span>{tooltip.description}</span>
          </div>
          
          <div className={`tooltip-status ${tooltip.status.toLowerCase()}`}>
            {tooltip.status}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
