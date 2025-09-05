import { useRef, useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import {
  Search,
  Calendar as CalendarIcon,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

// Custom calendar styles
const calendarStyles = `
  .custom-calendar {
    width: 100% !important;
    border: none !important;
    font-family: inherit !important;
    background: transparent !important;
  }

  .custom-calendar .react-calendar__navigation {
    display: flex !important;
    height: 44px !important;
    margin-bottom: 1rem !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border-radius: 8px !important;
  }

  .custom-calendar .react-calendar__navigation button {
    min-width: 44px !important;
    background: none !important;
    border: none !important;
    color: white !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
  }

  .custom-calendar .react-calendar__navigation button:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 6px !important;
  }

  .custom-calendar .react-calendar__navigation button:disabled {
    background: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .custom-calendar .react-calendar__navigation__label {
    flex-grow: 1 !important;
    text-align: center !important;
    font-weight: 700 !important;
    font-size: 18px !important;
  }

  .custom-calendar .react-calendar__month-view__weekdays {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr) !important;
    gap: 4px !important;
    text-align: center !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    color: white !important;
    margin-bottom: 0.75rem !important;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    border-radius: 10px !important;
    padding: 8px !important;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2) !important;
  }

  .custom-calendar .react-calendar__month-view__weekdays__weekday {
    padding: 10px 4px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 6px !important;
    margin: 0 !important;
    transition: all 0.2s ease !important;
    font-weight: 700 !important;
    letter-spacing: 0.3px !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    text-decoration: none !important;
    border-bottom: none !important;
    outline: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 36px !important;
    box-sizing: border-box !important;
  }

  .custom-calendar .react-calendar__month-view__weekdays__weekday:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    text-decoration: none !important;
  }

  /* Remove any default abbr styling */
  .custom-calendar .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none !important;
    border-bottom: none !important;
    cursor: inherit !important;
  }

  /* Special styling for weekend headers */
  .custom-calendar .react-calendar__month-view__weekdays__weekday:first-child,
  .custom-calendar .react-calendar__month-view__weekdays__weekday:last-child {
    background: rgba(239, 68, 68, 0.15) !important;
    color: #fef2f2 !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
  }

  .custom-calendar .react-calendar__month-view__weekdays__weekday:first-child:hover,
  .custom-calendar .react-calendar__month-view__weekdays__weekday:last-child:hover {
    background: rgba(239, 68, 68, 0.25) !important;
    text-decoration: none !important;
  }

  .custom-calendar .react-calendar__month-view__days {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr) !important;
    gap: 4px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .custom-calendar .react-calendar__tile {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    padding: 12px 4px !important;
    background: white !important;
    border: 2px solid #e2e8f0 !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #334155 !important;
    transition: all 0.2s ease !important;
    position: static !important;
    min-height: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    aspect-ratio: 1 !important;
    margin: 0 !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
    z-index: auto !important;
  }

  /* Override any default React Calendar positioning */
  .custom-calendar .react-calendar__month-view__days__day {
    position: static !important;
    margin: 0 !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
  }

  .custom-calendar .react-calendar__tile:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }

  .custom-calendar .react-calendar__tile--now {
    background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
    color: white !important;
    border-color: #d97706 !important;
    font-weight: 700 !important;
  }

  .custom-calendar .react-calendar__tile--now:hover {
    background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  }

  .custom-calendar .react-calendar__tile--neighboringMonth {
    color: #cbd5e1 !important;
    background: #f8fafc !important;
  }

  .custom-calendar .react-calendar__tile--active {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
    color: white !important;
    border-color: #1e40af !important;
  }

  /* Weekend styling */
  .custom-calendar .react-calendar__month-view__days__day--weekend {
    color: #dc2626 !important;
  }

  /* Custom date state classes */
  .custom-calendar .date-available {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
    color: #166534 !important;
    border-color: #22c55e !important;
    font-weight: 600 !important;
  }

  .custom-calendar .date-available:hover {
    background: linear-gradient(135deg, #bbf7d0, #86efac) !important;
    border-color: #16a34a !important;
  }

  .custom-calendar .date-cancelled {
    background: linear-gradient(135deg, #fecaca, #fca5a5) !important;
    color: #991b1b !important;
    border-color: #dc2626 !important;
    font-weight: 600 !important;
  }

  .custom-calendar .date-cancelled:hover {
    background: linear-gradient(135deg, #fca5a5, #f87171) !important;
    border-color: #b91c1c !important;
  }

  .custom-calendar .date-will-cancel {
    background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
    color: white !important;
    border-color: #7f1d1d !important;
    font-weight: 700 !important;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3) !important;
  }

  .custom-calendar .date-will-cancel:hover {
    background: linear-gradient(135deg, #b91c1c, #991b1b) !important;
    transform: translateY(-2px) !important;
  }

  .custom-calendar .date-will-restore {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
    color: white !important;
    border-color: #1e40af !important;
    font-weight: 700 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
  }

  .custom-calendar .date-will-restore:hover {
    background: linear-gradient(135deg, #1d4ed8, #1e3a8a) !important;
    transform: translateY(-2px) !important;
  }

  .custom-calendar .date-unavailable {
    background: #f1f5f9 !important;
    color: #cbd5e1 !important;
    border-color: #e2e8f0 !important;
    cursor: not-allowed !important;
  }

  .custom-calendar .date-unavailable:hover {
    transform: none !important;
    box-shadow: none !important;
  }

  /* Additional fixes for grid layout */
  .custom-calendar .react-calendar__month-view__days > * {
    position: static !important;
    margin: 0 !important;
    flex: none !important;
  }

  /* Ensure proper grid behavior */
  .custom-calendar .react-calendar__month-view__days button {
    position: static !important;
    margin: 0 !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    transform: none !important;
  }

  /* Override hover transforms for grid items */
  .custom-calendar .react-calendar__tile:hover {
    position: static !important;
    z-index: 1 !important;
  }
`;

const CancelBookingDatesSection = ({ onSuccess, onError }) => {
  const [searchId, setSearchId] = useState("");
  const [searchType, setSearchType] = useState("request_id"); // 'request_id' or 'calendar_id'
  const [allDates, setAllDates] = useState([]);
  const [existingCancelDates, setExistingCancelDates] = useState([]);
  const [cancelDates, setCancelDates] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);

  const useDebouncedEffect = (effect, deps, delay) => {
    const timeoutRef = useRef();

    useEffect(() => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(effect, delay);

      return () => clearTimeout(timeoutRef.current);
    }, deps);
  };

  useDebouncedEffect(
    () => {
      const trimmed = searchId.trim();
      if (trimmed.length >= 1) {
        handleFetchBookingDetails();
      } else {
        setAllDates([]);
        setExistingCancelDates([]);
        setCancelDates([]);
        setCurrentBooking(null);
      }
    },
    [searchId, searchType],
    500
  );

  const handleFetchBookingDetails = async () => {
    const trimmed = searchId.trim();

    if (!trimmed) {
      setAllDates([]);
      setExistingCancelDates([]);
      setCancelDates([]);
      setCurrentBooking(null);
      onError(
        `Please enter a ${
          searchType === "request_id" ? "Request ID" : "Calendar ID"
        }.`
      );
      return;
    }

    // Clear old data before starting a new fetch
    setAllDates([]);
    setExistingCancelDates([]);
    setCancelDates([]);
    setCurrentBooking(null);

    try {
      const response = await authRequest(
        "get",
        getApiUrl("/classroom-calendar/details")
      );

      const data = response?.data;
      if (!Array.isArray(data)) throw new Error("Invalid response structure");

      let booking;
      if (searchType === "request_id") {
        booking = data.find((b) => String(b.request_id) === String(searchId));
      } else {
        booking = data.find((b) => String(b.calendar_id) === String(searchId));
      }

      if (!booking) {
        onError(
          `Booking not found for the given ${
            searchType === "request_id" ? "Request ID" : "Calendar ID"
          }.`
        );
        return;
      }

      const parsedAll = JSON.parse(booking.all_dates || "[]");
      const parsedCancel = JSON.parse(booking.cancel_dates || "[]");

      setAllDates(parsedAll);
      setExistingCancelDates(parsedCancel);
      setCancelDates(parsedCancel);
      setCurrentBooking(booking);
    } catch (err) {
      // Clear old data again on error to be safe
      setAllDates([]);
      setExistingCancelDates([]);
      setCancelDates([]);
      setCurrentBooking(null);
      console.error("Fetch error:", err);
      onError("Failed to fetch booking details.");
    }
  };

  const handleCancelDatesSubmit = async () => {
    if (!searchId.trim()) {
      onError(
        `${
          searchType === "request_id" ? "Request ID" : "Calendar ID"
        } is required.`
      );
      return;
    }

    if (!currentBooking) {
      onError("No booking data found. Please search for a booking first.");
      return;
    }

    try {
      const payload = {
        id: searchId,
        cancel_dates: cancelDates,
        id_type: searchType,
      };

      const response = await authRequest(
        "put",
        getApiUrl("/classroom-calendar/details/cancel-dates"),
        payload
      );

      if (response?.success) {
        // Determine what changes were made to provide accurate success message
        const datesToCancel = cancelDates.filter(
          (date) => !existingCancelDates.includes(date)
        );
        const datesToRestore = existingCancelDates.filter(
          (date) => !cancelDates.includes(date)
        );

        let successMessage = "";
        if (datesToCancel.length > 0 && datesToRestore.length > 0) {
          // Both cancelling and restoring dates
          successMessage = `${datesToCancel.length} date${
            datesToCancel.length !== 1 ? "s" : ""
          } cancelled and ${datesToRestore.length} date${
            datesToRestore.length !== 1 ? "s" : ""
          } restored successfully.`;
        } else if (datesToCancel.length > 0) {
          // Only cancelling dates
          successMessage = `${datesToCancel.length} date${
            datesToCancel.length !== 1 ? "s" : ""
          } cancelled successfully.`;
        } else if (datesToRestore.length > 0) {
          // Only restoring dates
          successMessage = `${datesToRestore.length} date${
            datesToRestore.length !== 1 ? "s" : ""
          } restored successfully.`;
        } else {
          // Fallback (shouldn't happen due to button disable logic)
          successMessage = "Changes applied successfully.";
        }

        onSuccess(successMessage);
        handleFetchBookingDetails(); // Refresh view
      } else {
        throw new Error(response?.message || "Unknown server error");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      onError("Failed to update cancel dates.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Inject custom calendar styles */}
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <X className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
            Cancel Booking Dates
          </h3>
        </div>
        <p className="text-slate-600 text-sm">
          Search for bookings and manage cancelled dates efficiently
        </p>
      </div>

      {/* Search Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Search Configuration
          </h4>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Search Method
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <input
                  type="radio"
                  name="searchType"
                  value="request_id"
                  checked={searchType === "request_id"}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setSearchId("");
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700 group-hover:text-blue-700">
                    Search by Request ID
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                <input
                  type="radio"
                  name="searchType"
                  value="calendar_id"
                  checked={searchType === "calendar_id"}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setSearchId("");
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700 group-hover:text-blue-700">
                    Search by Calendar ID
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {searchType === "request_id" ? "Request ID" : "Calendar ID"}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`Enter ${
                  searchType === "request_id" ? "Request ID" : "Calendar ID"
                }`}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <button
                onClick={handleFetchBookingDetails}
                disabled={!searchId.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {allDates.length > 0 && currentBooking && (
        <>
          {/* Booking Information Display */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Booking Found
              </h4>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      Calendar ID:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 bg-blue-50 px-2 py-1 rounded">
                      {currentBooking.calendar_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      Request ID:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 bg-blue-50 px-2 py-1 rounded">
                      {currentBooking.request_id || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      Course:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 bg-green-50 px-2 py-1 rounded">
                      {currentBooking.course_name ||
                        currentBooking.calendar_course ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                      User:
                    </span>
                    <span className="text-sm font-semibold text-slate-900 bg-purple-50 px-2 py-1 rounded">
                      {currentBooking.user_name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar and Date Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar View */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  Calendar Overview
                </h4>
              </div>

              <div className="p-6">
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full"></div>
                    <span className="text-slate-600">Available Dates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-200 border border-red-300 rounded-full"></div>
                    <span className="text-slate-600">Currently Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 border-2 border-red-700 rounded-full"></div>
                    <span className="text-slate-600">Will be Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 border-2 border-blue-700 rounded-full"></div>
                    <span className="text-slate-600">Will be Restored</span>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Bidirectional Control:</strong> Click any booked
                    date to toggle its status. Available dates can be cancelled,
                    cancelled dates can be restored. Changes are applied when
                    you submit.
                  </p>
                </div>

                <div className="calendar-wrapper">
                  <Calendar
                    className="custom-calendar"
                    onClickDay={(date) => {
                      // Format date properly without timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;

                      // Only allow selection of dates that are in allDates (booked dates)
                      if (!allDates.includes(dateStr)) {
                        return;
                      }

                      // Check if this date is currently in the cancel dates list
                      if (cancelDates.includes(dateStr)) {
                        // Remove from cancel dates (uncancel)
                        setCancelDates(
                          cancelDates.filter((d) => d !== dateStr)
                        );
                      } else {
                        // Add to cancel dates (cancel)
                        setCancelDates([...cancelDates, dateStr]);
                      }
                    }}
                    tileClassName={({ date }) => {
                      // Format date properly without timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;

                      const isCurrentlyCancelled =
                        existingCancelDates.includes(dateStr);
                      const isInNewCancelList = cancelDates.includes(dateStr);
                      const isAvailable = allDates.includes(dateStr);

                      let classes = [];

                      // Add weekend class for styling
                      const dayOfWeek = date.getDay();
                      if (dayOfWeek === 0 || dayOfWeek === 6) {
                        classes.push(
                          "react-calendar__month-view__days__day--weekend"
                        );
                      }

                      if (!isAvailable) {
                        classes.push("date-unavailable");
                      } else {
                        // Determine the final state after applying changes
                        const willBeCancelled = isInNewCancelList;
                        const wasOriginallyCancelled = isCurrentlyCancelled;

                        if (wasOriginallyCancelled && !willBeCancelled) {
                          // Originally cancelled, now being uncancelled (restored)
                          classes.push("date-will-restore");
                        } else if (!wasOriginallyCancelled && willBeCancelled) {
                          // Originally available, now being cancelled
                          classes.push("date-will-cancel");
                        } else if (wasOriginallyCancelled && willBeCancelled) {
                          // Was cancelled and staying cancelled
                          classes.push("date-cancelled");
                        } else {
                          // Available date (not cancelled, not selected)
                          classes.push("date-available");
                        }
                      }

                      return classes.join(" ");
                    }}
                    showNeighboringMonth={false}
                  />
                </div>
              </div>
            </div>

            {/* Date Selection Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Select Dates to Cancel
                </h4>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-blue-800">
                      Quick Actions
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCancelDates([...existingCancelDates])}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      Reset to Original
                    </button>
                    <button
                      onClick={() => setCancelDates([...allDates])}
                      className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      Cancel All Dates
                    </button>
                    <button
                      onClick={() => setCancelDates([])}
                      className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                      Restore All Dates
                    </button>
                  </div>
                </div>

                {/* Changes Summary */}
                <div className="space-y-3">
                  <h5 className="font-medium text-slate-700">
                    Pending Changes:
                  </h5>

                  {(() => {
                    const datesToCancel = cancelDates.filter(
                      (date) => !existingCancelDates.includes(date)
                    );
                    const datesToRestore = existingCancelDates.filter(
                      (date) => !cancelDates.includes(date)
                    );
                    const hasChanges =
                      datesToCancel.length > 0 || datesToRestore.length > 0;

                    if (!hasChanges) {
                      return (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                          <p className="text-sm text-slate-500">
                            No changes made. Click on calendar dates to modify
                            cancellation status.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {datesToCancel.length > 0 && (
                          <div>
                            <h6 className="text-sm font-medium text-red-700 mb-2">
                              Dates to Cancel:
                            </h6>
                            <div className="grid grid-cols-1 gap-1">
                              {datesToCancel.map((date, index) => (
                                <div
                                  key={`cancel-${index}`}
                                  className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-md"
                                >
                                  <span className="text-sm font-medium text-red-800">
                                    {date}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setCancelDates(
                                        cancelDates.filter((d) => d !== date)
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {datesToRestore.length > 0 && (
                          <div>
                            <h6 className="text-sm font-medium text-blue-700 mb-2">
                              Dates to Restore:
                            </h6>
                            <div className="grid grid-cols-1 gap-1">
                              {datesToRestore.map((date, index) => (
                                <div
                                  key={`restore-${index}`}
                                  className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md"
                                >
                                  <span className="text-sm font-medium text-blue-800">
                                    {date}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setCancelDates([...cancelDates, date]);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-slate-600">
                  {(() => {
                    const datesToCancel = cancelDates.filter(
                      (date) => !existingCancelDates.includes(date)
                    );
                    const datesToRestore = existingCancelDates.filter(
                      (date) => !cancelDates.includes(date)
                    );
                    const hasChanges =
                      datesToCancel.length > 0 || datesToRestore.length > 0;

                    if (!hasChanges) {
                      return (
                        <span className="text-slate-400">
                          No changes to apply
                        </span>
                      );
                    }

                    const parts = [];
                    if (datesToCancel.length > 0) {
                      parts.push(
                        `${datesToCancel.length} date${
                          datesToCancel.length !== 1 ? "s" : ""
                        } to cancel`
                      );
                    }
                    if (datesToRestore.length > 0) {
                      parts.push(
                        `${datesToRestore.length} date${
                          datesToRestore.length !== 1 ? "s" : ""
                        } to restore`
                      );
                    }

                    return (
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        {parts.join(" and ")}
                      </span>
                    );
                  })()}
                </div>

                <button
                  onClick={handleCancelDatesSubmit}
                  disabled={(() => {
                    const datesToCancel = cancelDates.filter(
                      (date) => !existingCancelDates.includes(date)
                    );
                    const datesToRestore = existingCancelDates.filter(
                      (date) => !cancelDates.includes(date)
                    );
                    return (
                      datesToCancel.length === 0 && datesToRestore.length === 0
                    );
                  })()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Apply Changes
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CancelBookingDatesSection;
