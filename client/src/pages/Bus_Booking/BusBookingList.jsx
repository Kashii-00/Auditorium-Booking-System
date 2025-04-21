import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../../pages/Bus_Booking/BusBookingList.css';
import { authRequest } from '../../services/authService';

const BusBookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [error, setError] = useState(null);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    location.state?.sidebarState ?? false
  );

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null;

  // Add a ref to the filter button for positioning the popup
  const filterBtnRef = useRef(null);

  // Sidebar event listeners
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

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Passenger', 'Contact', 'From', 'To', 'Travel Date', 'Return Date', 'Booked By', 'Status'];
    let filename = 'bus_bookings';
    if (filterStatus !== 'ALL') filename += `_${filterStatus.toLowerCase()}`;
    if (filterMonth !== 'ALL') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      filename += `_${monthNames[parseInt(filterMonth)]}`;
    }
    filename += '.csv';

    const data = filteredBookings.map(booking => [
      booking.forWho,
      booking.ContactNo,
      booking.fromPlace,
      booking.toPlace,
      booking.travelDate,
      booking.ReturnDate,
      booking.name,
      booking.status
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell}"`
          : cell
      ).join(','))
      .join('\n');

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

  // Fetch bookings
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
      const bookingsData = await authRequest('get', 'http://10.70.4.34:5007/api/busBookings');
      setBookings(bookingsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Update status
  const updateStatus = async (id, status) => {
    try {
      await authRequest('put', `http://10.70.4.34:5007/api/busBookings/${id}`, { status });
      fetchBookings();
    } catch (err) {
      setError('Failed to update booking status');
    }
  };

  // Delete booking
  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await authRequest('delete', `http://10.70.4.34:5007/api/busBookings/${id}`);
        setPopupMessage('Booking successfully deleted!');
        setShowPopup(true);
        fetchBookings();
        setTimeout(() => setShowPopup(false), 3000);
      } catch (err) {
        setError('Failed to delete booking');
      }
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Handle filter button click to toggle popup
  const handleFilterButtonClick = (e) => {
    e.stopPropagation();
    setShowFilterPopup((prev) => !prev);
  };

  // Close filter popup on outside click (fix: check for filter-popup-bus as well)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.filter-group') &&
        !event.target.closest('.filter-popup-bus')
      ) {
        setShowFilterPopup(false);
      }
    };
    if (showFilterPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPopup]);

  // Filtering
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.forWho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.ContactNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;
    const matchesMonth = filterMonth === 'ALL' ||
      (booking.travelDate && new Date(booking.travelDate).getMonth() === parseInt(filterMonth));
    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Success popup
  const SuccessPopup = ({ message }) => (
    <div className="success-popup">
      <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
      </svg>
      <p className="font-bold">{message}</p>
    </div>
  );

  // Export button text
  const getExportButtonText = () => {
    const parts = ['Export'];
    if (filterStatus !== 'ALL') parts.push(filterStatus.toLowerCase());
    if (filterMonth !== 'ALL') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      parts.push(monthNames[parseInt(filterMonth)]);
    }
    parts.push('CSV');
    return parts.join(' ');
  };

  return (
    <div className={`content-wrapper-bus ${sidebarCollapsed ? 'expanded' : ''}`}>
      <div className="booking-content-bus">
        {showPopup && (
          <SuccessPopup
            message={popupMessage}
          />
        )}
        <div className="page-header-bus">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v-3a4 4 0 014-4h8a4 4 0 014 4v3M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 17h16M8 21h8" />
          </svg>
          <h1>Bus Booking Details</h1>
        </div>

        <div className="search-filter-container-bus">
          <div className="search-box-bus">
            <input
              type="text"
              placeholder="Search by passenger or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="search-icon-bus" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="filter-actions-bus filter-group" style={{ position: 'relative' }}>
            <button
              className="filter-button-bus"
              ref={filterBtnRef}
              onClick={handleFilterButtonClick}
              type="button"
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button
              className="export-button-bus"
              onClick={exportToCSV}
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {getExportButtonText()}
            </button>
            {showFilterPopup && (
              <div className="filter-popup-bus">
                <div className="filter-section-bus">
                  <label>Status:</label>
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
                <div className="filter-section-bus">
                  <label>Month:</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="ALL">All Months</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message-bus">{error}</div>}

        <div className="table-container-bus" style={{ minHeight: '500px', maxHeight: '600px' }}>
          <table>
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Contact Information</th>
                <th>Origin Location</th>
                <th>Destination Location</th>
                <th>Date of Travel</th>
                <th>Date of Return</th>
                <th>Booked By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className={highlightId === booking.id ? 'highlight-bus' : ''}>
                  <td>{booking.forWho}</td>
                  <td>{booking.ContactNo}</td>
                  <td>{booking.fromPlace}</td>
                  <td>{booking.toPlace}</td>
                  <td>{formatDate(booking.travelDate)}</td>
                  <td>{formatDate(booking.ReturnDate)}</td>
                  <td>{booking.name}</td>
                  <td>
                    <span className={`status-badge-bus status-${booking.status.toLowerCase()}-bus`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="action-buttons-bus">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          className="approveBtn-bus"
                          onClick={() => updateStatus(booking.id, 'APPROVED')}
                        >
                          Approve
                        </button>
                        <button
                          className="denyBtn-bus"
                          onClick={() => updateStatus(booking.id, 'DENIED')}
                        >
                          Deny
                        </button>
                      </>
                    )}
                    <button
                      className="deleteBtn-bus"
                      onClick={() => deleteBooking(booking.id)}
                    >
                      Delete
                    </button>
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

export default BusBookingList;
