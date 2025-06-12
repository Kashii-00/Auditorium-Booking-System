import React, { useRef, useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { authRequest } from "../../services/authService";
import "./styles/smallCalendar.css";

const CancelBookingDatesSection = ({ onSuccess, onError }) => {
  const [requestId, setRequestId] = useState("");
  const [allDates, setAllDates] = useState([]);
  const [existingCancelDates, setExistingCancelDates] = useState([]);
  const [cancelDates, setCancelDates] = useState([]);

  const pickerRef = useRef();

  const toDateObjects = (dates) => dates.map((d) => new Date(d));
  const allDateObjs = toDateObjects(allDates);
  const cancelledDateObjs = toDateObjects(existingCancelDates);

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
      const trimmed = requestId.trim();
      if (trimmed.length >= 1) {
        handleFetchBookingDetails();
      } else {
        setAllDates([]);
        setExistingCancelDates([]);
        setCancelDates([]);
      }
    },
    [requestId],
    500
  );

  const handleFetchBookingDetails = async () => {
    const trimmed = requestId.trim();

    if (!trimmed) {
      setAllDates([]);
      setExistingCancelDates([]);
      setCancelDates([]);
      onError("Please enter a Request ID.");
      return;
    }

    // Clear old data before starting a new fetch
    setAllDates([]);
    setExistingCancelDates([]);
    setCancelDates([]);
    try {
      const response = await authRequest(
        "get",
        "http://localhost:5003/api/classroom-calendar/details"
      );

      const data = response?.data;
      if (!Array.isArray(data)) throw new Error("Invalid response structure");

      const booking = data.find(
        (b) => String(b.request_id) === String(requestId)
      );

      if (!booking) {
        onError("Booking not found for the given Request ID.");
        return;
      }

      const parsedAll = JSON.parse(booking.all_dates || "[]");
      const parsedCancel = JSON.parse(booking.cancel_dates || "[]");

      setAllDates(parsedAll);
      setExistingCancelDates(parsedCancel);
      setCancelDates(parsedCancel);
    } catch (err) {
      // Clear old data again on error to be safe
      setAllDates([]);
      setExistingCancelDates([]);
      setCancelDates([]);
      console.error("Fetch error:", err);
      onError("Failed to fetch booking details.");
    }
  };

  const handleCancelDatesSubmit = async () => {
    if (!requestId) {
      onError("Request ID is required.");
      return;
    }

    try {
      const response = await authRequest(
        "put",
        `http://localhost:5003/api/classroom-calendar/details/by-request/${requestId}/cancel-dates`,
        { cancel_dates: cancelDates }
      );

      if (response?.success) {
        onSuccess("Dates cancelled successfully.");
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
    <div className="cancel-dates-form">
      <h3>Cancel Booking Dates</h3>

      <div className="searchRequest-Con-2">
        <div className="search-bar-wrapper-2">
          <input
            type="text"
            placeholder="Enter Request ID"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            className="input-field"
          />
          <button
            onClick={handleFetchBookingDetails}
            className="search-icon-btn"
            disabled={!requestId.trim()}
            aria-label="Fetch Booking"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {allDates.length > 0 && (
        <>
          <Calendar
            className="small-Calendar"
            tileClassName={({ date }) => {
              const isCancelled = cancelledDateObjs.some(
                (d) => d.toDateString() === date.toDateString()
              );
              const isAllDate =
                !isCancelled &&
                allDateObjs.some(
                  (d) => d.toDateString() === date.toDateString()
                );
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              let classes = [];
              if (isCancelled) classes.push("highlight-cancelled");
              else if (isAllDate) classes.push("highlight-all");
              if (isWeekend) classes.push("weekend-blue");

              return classes.join(" ");
            }}
            showNeighboringMonth={false}
          />
          <div className="multi-Date-picker">
            <DatePicker
              ref={pickerRef}
              multiple
              value={cancelDates}
              onChange={(dates) => {
                const formatted = dates
                  .map((d) => d?.format?.("YYYY-MM-DD"))
                  .filter((d) => allDates.includes(d));
                setCancelDates(formatted);
              }}
              mapDays={({ date }) => {
                const formatted = date.format("YYYY-MM-DD");
                if (!allDates.includes(formatted)) {
                  return { disabled: true, style: { color: "#ccc" } };
                }
                return {};
              }}
              format="YYYY-MM-DD"
              style={{
                pointerEvents: "none",
                width: 0,
                height: 0,
                opacity: 0,
              }}
              className="multi-Date-picker"
            />

            <div
              className="multi-Date"
              onClick={() => pickerRef.current?.openCalendar()}
            >
              Click To Pick Dates
            </div>
          </div>
          <div className="selected-dates-list">
            {cancelDates.length > 0 ? (
              cancelDates.map((date, index) => (
                <div key={index} className="selected-date-item">
                  {date}
                </div>
              ))
            ) : (
              <div className="no-dates">No dates selected.</div>
            )}
          </div>

          <div className="cancel-dates-submit-sec">
            <button
              className="Cancel-Dates-btn"
              onClick={handleCancelDatesSubmit}
            >
              Submit Cancellation
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CancelBookingDatesSection;
