import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/EventBooking.css';
import { authRequest } from '../services/authService';

const EventBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const [showDeleteForId, setShowDeleteForId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => 
    location.state?.sidebarState ?? false
  );

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;


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
      localStorage.setItem('sidebarState', e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('sidebarHover', handleSidebarHover);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('sidebarHover', handleSidebarHover);
      window.removeEventListener('popstate', syncSidebarState);
    };
  }, []);


  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;
    
    const matchesMonth = filterMonth === 'ALL' || 
      new Date(booking.booking_date).getMonth() === parseInt(filterMonth);
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getExportButtonText = () => {
    const parts = ['Export'];
    if (filterStatus !== 'ALL') parts.push(filterStatus.toLowerCase());
    if (filterMonth !== 'ALL') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      parts.push(monthNames[parseInt(filterMonth)]);
    }
    return parts.join(' ');
  };

  const exportToCSV = () => {
    // Use filteredBookings instead of bookings to respect current filters
    const headers = ['Name', 'Email', 'Phone', 'Booking Date', 'Time Slot', 'Description', 'Status'];
    
    // Create filename based on current filters
    let filename = 'bookings';
    if (filterStatus !== 'ALL') {
      filename += `_${filterStatus.toLowerCase()}`;
    }
    if (filterMonth !== 'ALL') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      filename += `_${monthNames[parseInt(filterMonth)]}`;
    }
    filename += '.csv';
  
    // Map filtered data
    const data = filteredBookings.map(booking => [
      booking.name,
      booking.email,
      booking.phone,
      formatDate(booking.booking_date),
      `${formatTime(booking.booking_time)} - ${formatTime(booking.bookingendtime)}`,
      booking.description,
      booking.status
    ]);
  
    // Generate CSV content
    const csvContent = [headers, ...data]
      .map(row => 
        row.map(cell => 
          // Handle cells that might contain commas by wrapping in quotes
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
      .join('\n');
      
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  

  // Create memoized fetchBookings function
  const fetchBookings = useCallback(async () => {
    try {
      const bookingsData = await authRequest('get', 'http://10.70.4.34:5007/api/bookings');
      setBookings(bookingsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    }
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Update status function
  const updateStatus = async (id, status) => {
    try {
      await authRequest('put', `http://10.70.4.34:5007/api/bookings/${id}`, { status });
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
        await authRequest('delete', `http://10.70.4.34:5007/api/bookings/${id}`);
        await fetchBookings();
        setError(null);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-buttons')) {
        setShowDeleteForId(null);
      }
    };
  
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-group')) {
        setShowFilterPopup(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  

  // Success popup component
  const SuccessPopup = ({ message }) => {
    return (
      <div className="success-popup">
        <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
        </svg>
        <p className="font-bold">{message}</p>
      </div>
    );
  };

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="booking-content">
        {showPopup && (
          <SuccessPopup 
            message="Booking successfully deleted!"
          />
        )}
        
        <div className="page-header">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h1>Auditorium Booking Details</h1>
        </div>
        
        <p className="page-description" style={{fontWeight:'bold'}}>Manage and review all auditorium booking requests in one place.</p>
        
        {error && <div className="error-message">{error}</div>}

        <div className="search-filter-container" >
          <div className="search-box">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          <div className="filter-group">
            <button 
              className="filter-button"
              onClick={() => setShowFilterPopup(!showFilterPopup)}
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            
            {showFilterPopup && (
              <div className="filter-popup">
                <div className="filter-section">
                  <h3>Status</h3>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DENIED">Denied</option>
                  </select>
                </div>
                
                <div className="filter-section">
                  <h3>Month</h3>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="ALL">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
              </div>
            )}

          <button className="export-button" onClick={exportToCSV}>
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {getExportButtonText()}
          </button>
          </div>
      </div>
        
        <div className="table-container">
          <table border="1" cellPadding="1">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Booking Date</th>
                <th>Time Slot</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {filteredBookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className={highlightId === Number(booking.id) ? 'highlight' : ''}
                >
                  <td>{booking.name}</td>
                  <td>{booking.email}</td>
                  <td>{booking.phone}</td>
                  <td>{formatDate(booking.booking_date)}</td>
                  <td>{`${formatTime(booking.booking_time)} - ${formatTime(booking.bookingendtime)}`}</td>
                  <td>{booking.description}</td>
                  <td>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status === 'PENDING' && (
                        <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {booking.status === 'APPROVED' && (
                        <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {booking.status === 'DENIED' && (
                        <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(booking.id, 'APPROVED')} className="approveBtn">
                          <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button onClick={() => updateStatus(booking.id, 'DENIED')} className="denyBtn">
                          <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Deny
                        </button>
                        <button onClick={() => deleteBooking(booking.id)} className="deleteBtn">
                          <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                    {booking.status === 'APPROVED' && (
                      <div className="action-buttons">
                        {showDeleteForId === booking.id ? (
                          <button onClick={() => deleteBooking(booking.id)} className="deleteBtn" >
                            <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        ) : (
                          <button 
                            className="more-btn" 
                            onClick={() => setShowDeleteForId(booking.id)}
                          >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    {booking.status !== 'PENDING' && booking.status !== 'APPROVED' && (
                      <button onClick={() => deleteBooking(booking.id)} className="deleteBtn">
                        <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventBooking;