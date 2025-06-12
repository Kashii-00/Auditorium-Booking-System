import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ScheduleChecker.css";
import { authRequest } from "../../services/authService";
import { classroomOptions } from "./aidUtils";

const ScheduleChecker = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [freeClassrooms, setFreeClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    syncSidebarState();
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
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/classroom-calendar/details-v2"
      );

      console.log("✅ Full raw response:", response);

      // ✅ Access nested `data` from response
      const bookingsData = response?.data;

      if (!Array.isArray(bookingsData)) {
        console.error("❌ bookingsData is not an array", bookingsData);
        throw new Error("Invalid data format received from server.");
      }

      const dateString = selectedDate.toISOString().split("T")[0];

      const filtered = bookingsData.filter((booking) => {
        if (!Array.isArray(booking.effective_dates)) {
          console.warn(
            "⚠️ Missing or invalid effective_dates for booking ID:",
            booking?.id
          );
          return false;
        }
        return booking.effective_dates.includes(dateString);
      });

      const sorted = filtered.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.time_to}`);
        const timeB = new Date(`1970-01-01T${b.time_to}`);
        return timeA - timeB;
      });

      console.log("✅ Filtered and sorted bookings:", sorted);

      setBookings(sorted);
      calculateFreeClassrooms(sorted);
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const calculateFreeClassrooms = (bookingsForDay) => {
    const classrooms = {};

    bookingsForDay.forEach(({ classes_allocated, time_from, time_to }) => {
      if (!classes_allocated) return;

      const allocatedRooms = classes_allocated
        .split(",")
        .map((room) => room.trim());
      allocatedRooms.forEach((room) => {
        const times = classrooms[room] || [];
        times.push([
          new Date(`${selectedDate.toISOString().split("T")[0]}T${time_from}`),
          new Date(`${selectedDate.toISOString().split("T")[0]}T${time_to}`),
        ]);
        classrooms[room] = times;
      });
    });

    const allClassrooms = classroomOptions.map((opt) => opt.value);
    const freeData = [];

    allClassrooms.forEach((room) => {
      const slots = classrooms[room] || [];
      if (slots.length === 0) {
        freeData.push({ room, free: "All Day" });
      } else {
        slots.sort((a, b) => a[0] - b[0]);
        const freeSlots = [];
        let start = new Date(
          `${selectedDate.toISOString().split("T")[0]}T08:00:00`
        );

        for (let [from, to] of slots) {
          if (from > start) {
            freeSlots.push(
              `${start.toTimeString().slice(0, 5)} - ${from
                .toTimeString()
                .slice(0, 5)}`
            );
          }
          start = new Date(Math.max(start, to));
        }

        const end = new Date(
          `${selectedDate.toISOString().split("T")[0]}T18:00:00`
        );
        if (start < end) {
          freeSlots.push(
            `${start.toTimeString().slice(0, 5)} - ${end
              .toTimeString()
              .slice(0, 5)}`
          );
        }

        freeData.push({ room, free: freeSlots.join(", ") });
      }
    });

    setFreeClassrooms(freeData);
  };

  const exportCSV = () => {
    const dateStr = selectedDate.toISOString().split("T")[0];

    const bookingHeaders = [
      "Course Name",
      "Time From",
      "Time To",
      "Classroom(s) Allocated",
      "Requesting Officer",
      "Request ID",
      "Officer Email",
    ];
    const bookingRows = bookings.map((b) => [
      b.calendar_course,
      b.time_from,
      b.time_to,
      b.classes_allocated,
      b.requesting_officer_name || "N/A",
      b.request_id || "N/A",
      b.requesting_officer_email || "N/A",
    ]);

    const freeRoomHeaders = ["Classroom", "Free Time"];
    const freeRoomRows = freeClassrooms.map(({ room, free }) => [
      room,
      free === "All Day" ? free : formatTimeRange(free),
    ]);

    const csvLines = [];

    // Section 1: Booked Classrooms
    csvLines.push(`Booked Classrooms for ${dateStr}`);
    csvLines.push(bookingHeaders.join(","));
    if (bookingRows.length === 0) {
      csvLines.push("No bookings for this date.");
    } else {
      bookingRows.forEach((row) => {
        csvLines.push(row.join(","));
      });
    }

    csvLines.push(""); // Blank line

    // Section 2: Free Classrooms
    csvLines.push(`Free Classrooms for ${dateStr}`);
    csvLines.push(freeRoomHeaders.join(","));
    freeRoomRows.forEach((row) => {
      csvLines.push(row.join(","));
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `classroom_schedule_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAcronym = (courseName) => {
    return courseName
      .replace(/[\(\)\[\]]/g, "") // Remove brackets
      .replace(/[-–—]/g, " _HYPHEN_ ") // Temporarily mark hyphens
      .replace(/&/g, " _AMP_ ") // Temporarily mark ampersands
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 0) // Remove empty parts
      .map((word) => {
        if (word === "_HYPHEN_") return "-"; // Restore hyphen
        if (word === "_AMP_") return "&"; // Restore ampersand
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const formatTimeRange = (range) => {
    return range
      .split(", ")
      .map((slot) => {
        const [start, end] = slot.split(" - ");
        return `${formatTime(start)} - ${formatTime(end)}`;
      })
      .join(", ");
  };

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp`}
      id="clsBooking"
    >
      <div className="details-container-s">
        <div className="schedule-filter">
          <div className="selectDate">
            <label>Select Date: </label>
            <input
              type="date"
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>
          <button onClick={exportCSV}>Download Schedule</button>
        </div>

        <div className="schedule-container">
          <h2 className="schedule-headings">Scheduled Classroom Bookings</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Requesting Officer</th>
                  <th>Officer Email</th>
                  <th>Course Name</th>
                  <th>Time From</th>
                  <th>Time To</th>
                  <th>Classroom(s) Allocated</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7">No bookings for this date.</td>
                  </tr>
                ) : (
                  bookings.map((b, index) => (
                    <tr key={index}>
                      <td>{b.request_id || "N/A"}</td>
                      <td>{b.requesting_officer_name || "N/A"}</td>
                      <td>{b.requesting_officer_email || "N/A"}</td>
                      <td title={b.calendar_course}>
                        {getAcronym(b.calendar_course)}
                      </td>
                      <td>{formatTime(b.time_from)}</td>
                      <td>{formatTime(b.time_to)}</td>
                      <td>{b.classes_allocated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          <h3 className="schedule-headings">Free Classrooms</h3>
          <table className="free-rooms-table">
            <thead>
              <tr>
                <th>Classroom</th>
                <th>Free Time</th>
              </tr>
            </thead>
            <tbody>
              {freeClassrooms.map((item, index) => (
                <tr key={index}>
                  <td>{item.room}</td>
                  <td>
                    {item.free === "All Day"
                      ? item.free
                      : formatTimeRange(item.free)}
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

export default ScheduleChecker;
