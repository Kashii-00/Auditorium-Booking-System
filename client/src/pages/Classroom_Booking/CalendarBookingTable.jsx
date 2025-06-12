import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ClassroomBooking.css";
import { authRequest } from "../../services/authService";
import WeeklyTimetable from "./WeeklyTimeTable";

const CalendarBookingTable = () => {
  const [bookings, setBookings] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  // const [showDeleteForId, setShowDeleteForId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  // const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showWeeklyTimetable, setShowWeeklyTimetable] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [unassignedIds, setUnassignedIds] = useState([]);
  const pendingRef = useRef(null);

  const highlightId = location.state?.highlightId
    ? Number(location.state.highlightId)
    : null;

  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("calendarBookingFilters");
    if (savedFilters) {
      try {
        const { searchTerm, filterMonth } = JSON.parse(savedFilters);
        if (searchTerm !== undefined) setSearchTerm(searchTerm);
        if (filterMonth !== undefined) setFilterMonth(filterMonth);
      } catch (e) {
        console.warn("Failed to parse saved filters:", e);
      }
    }
    setFiltersLoaded(true); // ✅ only after filters are restored
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return; // ⛔ don’t save until restoration is done

    const filtersToStore = {
      searchTerm,
      filterMonth,
    };
    console.log("✅ Saving to localStorage:", filtersToStore);
    localStorage.setItem(
      "calendarBookingFilters",
      JSON.stringify(filtersToStore)
    );
  }, [searchTerm, filterMonth, filtersLoaded]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterMonth("ALL");
    localStorage.removeItem("calendarBookingFilters");
  };

  const fetchUnassignedRequestIds = async () => {
    try {
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/classroom-calendar/unassigned-request-ids"
      );
      if (response.success) {
        setUnassignedIds(response.unassignedRequestIds || []);
        setShowPendingPopup(true);
      } else {
        setUnassignedIds([]);
        setShowPendingPopup(true);
      }
    } catch (error) {
      console.error("Failed to fetch unassigned request IDs:", error);
      setUnassignedIds([]);
      setShowPendingPopup(true);
    }
  };

  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState");
      if (stored !== null) {
        const isCollapsed = stored === "true";
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          })
        );
      }
    };

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
    window.addEventListener("popstate", syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      localStorage.setItem("sidebarState", e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", syncSidebarState);
    };
  }, []);

  useEffect(() => {
    if (highlightId !== null) {
      setTimeout(() => {
        const row = document.querySelector(`tr.highlight`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300); // Small delay ensures DOM is rendered
    }
  }, [highlightId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
      if (pendingRef.current && !pendingRef.current.contains(event.target)) {
        setShowPendingPopup(false);
      }
    }

    if (showInfo || showPendingPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfo, showPendingPopup]);

  const filteredBookings = bookings.filter((booking) => {
    const term = searchTerm.trim().toLowerCase();

    const matchesCourse = booking.course_name?.toLowerCase().includes(term);

    const matchesByPrefix = () => {
      if (term.startsWith("id:")) {
        const value = term.replace("id:", "");
        return booking.id?.toString() === value;
      }
      if (term.startsWith("request:")) {
        const value = term.replace("request:", "");
        return booking.request_id?.toString() === value;
      }
      if (term.startsWith("user:")) {
        const value = term.replace("user:", "");
        return booking.user_id?.toString() === value;
      }
      return false;
    };

    const matchesMonth =
      filterMonth === "ALL" ||
      new Date(booking.date_from).getMonth() === parseInt(filterMonth);

    return (matchesCourse || matchesByPrefix()) && matchesMonth;
  });

  const getExportButtonText = () => {
    const parts = ["Export"];
    // if (filterStatus !== "ALL") parts.push(filterStatus.toLowerCase());
    if (filterMonth !== "ALL") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      parts.push(monthNames[parseInt(filterMonth)]);
    }
    return parts.join(" ");
  };

  const getAcronym = (courseName) => {
    if (!courseName) return "";

    const words = courseName
      .replace(/[\(\)\[\]]/g, "") // Remove brackets
      .replace(/[-–—]/g, " _HYPHEN_ ") // Temporarily mark hyphens
      .replace(/&/g, " _AMP_ ") // Temporarily mark ampersands
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 0);

    const hasExam = words.some((word) => word.toLowerCase() === "exam");

    const acronym = words
      .filter((word) => word.toLowerCase() !== "exam") // Exclude 'exam' from acronym
      .map((word) => {
        if (word === "_HYPHEN_") return "-";
        if (word === "_AMP_") return "&";
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");

    return hasExam ? `${acronym} (EXAM)` : acronym;
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "User ID",
      "Request ID",
      "Course Name",
      "Date From",
      "Date To",
      "Time From",
      "Time To",
      "Preferred Days",
      "Classes Allocated",
    ];

    let filename = "calendar_entries";
    if (filterMonth !== "ALL") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      filename += `_${monthNames[parseInt(filterMonth)]}`;
    }
    filename += ".csv";

    const data = filteredBookings.map((booking) => [
      booking.id,
      booking.user_id,
      booking.request_id ?? "",
      booking.course_name,
      booking.date_from,
      booking.date_to,
      booking.time_from,
      booking.time_to,
      booking.preferred_days_of_week,
      booking.classes_allocated,
    ]);

    const csvContent = [headers, ...data]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
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
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/classroom-calendar"
      );
      if (response.success) {
        setBookings(response.data);
        setError(null);
      } else {
        throw new Error("Unexpected response structure");
      }
    } catch (err) {
      console.error("Error fetching calendar entries:", err);
      setError("Failed to fetch calendar entries");
    }
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Delete booking function
  const deleteBooking = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await authRequest(
          "delete",
          `http://localhost:5003/api/classroom-calendar/${id}`
        );
        await fetchBookings();
        setError(null);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      } catch (err) {
        console.error("Error deleting entry:", err);
        setError("Failed to delete entry");
      }
    }
  };

  // Effect for initial fetch and polling
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // useEffect(() => {
  //   const handleClickOutside = (e) => {
  //     if (!e.target.closest(".action-buttons")) {
  //       setShowDeleteForId(null);
  //     }
  //   };

  //   document.addEventListener("click", handleClickOutside);
  //   return () => document.removeEventListener("click", handleClickOutside);
  // }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".filter-group")) {
        setShowFilterPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Success popup component
  const SuccessPopup = ({ message }) => {
    return (
      <div className="success-popup">
        <svg
          className="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
        </svg>
        <p className="font-bold">{message}</p>
      </div>
    );
  };

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? "expanded" : ""}`}>
      <div className="booking-content">
        {showPopup && <SuccessPopup message="Booking successfully deleted!" />}

        <div className="page-header">
          <svg
            className="icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h1>Calendar Booking Details</h1>
        </div>

        <p className="page-description" style={{ fontWeight: "bold" }}>
          Manage and review all calendar bookings in one place.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="search-filter-container">
          <div className="searchbar">
            <div className="search-box">
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by course, id:ID, request:ID, user:ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="info-container" ref={infoRef}>
              <button
                className="info-icon-button"
                onClick={() => setShowInfo(!showInfo)}
                title="Show instructions"
              >
                <svg
                  className="info-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                  />
                </svg>
              </button>

              {showInfo && (
                <div className="info-popup">
                  <strong>&#127775;Search Tips:</strong>
                  <p>
                    Use the search bar to quickly find calendar bookings by:
                  </p>
                  <ul>
                    <li>
                      <strong>&#10022;Course Name</strong> (e.g., "Mathematics")
                    </li>
                    <li>
                      <strong>&#10022;CalendarBooking ID</strong> (e.g., "id:1")
                    </li>
                    <li>
                      <strong>&#10022;Request ID</strong> (e.g., "request:123")
                    </li>
                    <li>
                      <strong>&#10022;User ID</strong> (e.g., "user:456")
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <button
              className="filter-button"
              onClick={() => setShowFilterPopup(!showFilterPopup)}
            >
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </button>

            {showFilterPopup && (
              <div className="filter-popup-2">
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

            <button className="reset-button" onClick={handleResetFilters}>
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Reset Filters
            </button>

            <button className="export-button" onClick={exportToCSV}>
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {getExportButtonText()}
            </button>
            <button
              className="export-button"
              onClick={() => setShowWeeklyTimetable(true)}
            >
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                />
              </svg>
              Weekly Timetable
            </button>
            <button
              className="export-button"
              onClick={fetchUnassignedRequestIds}
            >
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 6h18M3 14h18M3 18h18"
                />
              </svg>
              Pending
            </button>
            {showPendingPopup && (
              <div className="pending-popup" ref={pendingRef}>
                <h5 style={{ marginBottom: "0.5rem" }}>
                  Unassigned Request Ids:
                </h5>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {unassignedIds.length > 0 ? (
                    <ul>
                      {unassignedIds.map((id) => (
                        <li key={id}>&#10022;{id}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>All Requests of classroom bookings added.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="table-container">
          <table border="1" cellPadding="1" className="booking-T">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Request ID</th>
                <th>Course Name</th>
                <th>Date From</th>
                <th>Date To</th>
                <th>Time From</th>
                <th>Time To</th>
                <th>Preferred Days</th>
                <th>Classes Allocated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={
                      highlightId === Number(booking.id) ? "highlight" : ""
                    }
                  >
                    <td>{booking.id}</td>
                    <td>{booking.user_id}</td>
                    <td>{booking.request_id ?? "—"}</td>
                    <td title={booking.course_name}>
                      {getAcronym(booking.course_name)}
                    </td>
                    <td>{formatDate(booking.date_from)}</td>
                    <td>{formatDate(booking.date_to)}</td>
                    <td>{formatTime(booking.time_from)}</td>
                    <td>{formatTime(booking.time_to)}</td>
                    <td>{booking.preferred_days_of_week}</td>
                    <td>{booking.classes_allocated}</td>
                    <td>
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="deleteBtn-2"
                      >
                        <svg
                          className="icon-small"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-4">
                    No matching bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showWeeklyTimetable && (
          <WeeklyTimetable onClose={() => setShowWeeklyTimetable(false)} />
        )}
      </div>
    </div>
  );
};

export default CalendarBookingTable;
