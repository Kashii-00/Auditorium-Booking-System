import React, { useEffect, useState, useRef } from "react";
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl';
import "./styles/details.css";
import { requestFields } from "./aidUtils";
import CancelBookingDatesSection from "./CancelBookingDatesSection";

const CancelRequestForm = () => {
  const [requestIdInput, setRequestIdInput] = useState("");
  const [requestData, setRequestData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const successTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const [showCancelSection, setShowCancelSection] = useState(false);

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
      const trimmed = requestIdInput.trim();
      if (trimmed.length >= 1) {
        fetchRequestData();
      } else {
        setRequestData(null);
      }
    },
    [requestIdInput],
    500
  );

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchRequestData = async () => {
    if (!requestIdInput.trim()) {
      setError("Please enter a request ID.");
      return;
    }

    setError("");
    setSuccessMessage("");

    setRequestData(null);

    try {
      const response = await authRequest(
        "get",
        getApiUrl(`/aidrequests/${requestIdInput}`)
      );

      console.log("✅ Full response from backend:", response);

      if (!response?.success) {
        throw new Error("Server did not confirm success.");
      }

      const result = response.data;

      if (!result || typeof result !== "object") {
        throw new Error("Invalid aid request structure received.");
      }

      setRequestData(result);
    } catch (err) {
      console.error(" Error fetching aid request:", err);
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to fetch aid request."
      );
      setRequestData(null);
    }
  };

  const cancelRequest = async () => {
    if (!requestData?.id) return;

    try {
      const payload = {
        request_status: "Denied",
        cancelled_by_requester: "Yes",
      };

      await authRequest(
        "put",
        getApiUrl(`/aidrequests/cancel-or-update/${requestData.id}`),
        payload
      );

      await fetchRequestData();

      setSuccessMessage(" Request cancelled successfully.");
    } catch (err) {
      console.error(" Error cancelling aid request:", err);
      setError(err?.response?.data?.error || "Failed to cancel the request.");
    }
  };

  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError("");
      }, 5000);
    }
  }, [error]);

  useEffect(() => {
    const stored = localStorage.getItem("sidebarState");
    if (stored !== null) {
      const isCollapsed = stored === "true";
      setSidebarCollapsed(isCollapsed);
    }

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
    };
  }, []);

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp`}
      id="clsBooking"
    >
      <div className="details-container">
        <h2 className="text-xl font-bold mb-4">Search Aid Request</h2>

        <p className="search-TXT">
          Search for Booking request with request Id and Cancel the whole
          request.
        </p>
        <p className="search-TXT">
          <div class="triangle-down"></div>
        </p>

        <div className="searchRequest-Con">
          <div className="search-bar-wrapper">
            <input
              type="text"
              placeholder="Enter Request ID"
              value={requestIdInput}
              onChange={(e) => setRequestIdInput(e.target.value)}
              className="input-field"
            />
            <button
              onClick={fetchRequestData}
              className="search-icon-btn"
              disabled={!requestIdInput.trim()}
              aria-label="Search"
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

        {successMessage && (
          <div className="success-popup2" role="alert" aria-live="assertive">
            <svg
              xmlns="https://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-popup2" role="alert" aria-live="assertive">
            <svg
              xmlns="https://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}

        {requestData && (
          <>
            <h3 className="text-lg font-bold mb-2">
              Request Details (ID: {requestData.id})
            </h3>
            <div className="review-grid">
              {requestFields.map(({ label, key, getValue, highlight }) => {
                let value = getValue
                  ? getValue(requestData)
                  : requestData[key] || "-";

                // Apply time formatting during rendering
                if (
                  (key === "time_from" || key === "time_to") &&
                  value !== "-"
                ) {
                  value = formatTime(value);
                }

                if (
                  (key === "date_from" ||
                    key === "date_to" ||
                    key === "signed_date") &&
                  value !== "-"
                ) {
                  value = formatDate(value);
                }
                // Base class
                let valueClass = "value";
                // Add highlight class if needed
                if (highlight) {
                  valueClass += " highlight-status";
                }
                // Add status-specific class
                if (key === "request_status") {
                  if (value === "Approved") {
                    valueClass += " status-A";
                  } else if (value === "Denied" || value === "Rejected") {
                    valueClass += " status-D";
                  } else if (value === "pending") {
                    valueClass += " status-P";
                  }
                }
                return (
                  <React.Fragment key={key}>
                    <div className="label">{label}:</div>
                    <div className={valueClass}>{value}</div>
                  </React.Fragment>
                );
              })}
            </div>

            <h3 className="mt-4 font-semibold">Requested Items</h3>
            <div className="bkContainer">
              {requestData.aid_items?.length > 0 ? (
                <table className="bookingk">
                  <thead>
                    <tr>
                      <th>Item no.</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Remark</th>
                      <th>MD Approval required</th>
                      <th>MD Approval obtained</th>
                      <th>MD Approval Details</th>
                      <th>CTM Approval Obtained</th>
                      <th>CTM Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestData.aid_items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.item_no}</td>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{item.remark}</td>
                        <td>{item.md_approval_required_or_not}</td>
                        <td>{item.md_approval_obtained}</td>
                        <td>{item.md_approval_details || "—"}</td>
                        <td>{item.CTM_approval_obtained}</td>
                        <td>{item.CTM_Details || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No items found.</p>
              )}
            </div>

            <div className="btn-Con">
              <button
                onClick={cancelRequest}
                className="s_r_cancelBtn"
                disabled={
                  requestData.request_status === "Denied" ||
                  requestData.request_status === "Approved"
                }
              >
                Cancel Request
              </button>
            </div>
            <div className="msg-Con">
              {requestData.request_status === "Approved" && (
                <p className="msgCancelReq">
                  {"\u26A0"} This request has been approved and cannot be
                  cancelled.
                </p>
              )}
              {requestData.request_status === "Denied" && (
                <p className="msgCancelReq">
                  {"\u26A0"} This request has been cancelled before and cannot
                  be cancelled again.
                </p>
              )}
            </div>
          </>
        )}
        <hr></hr>
        {/* <p className="search-TXT">Or</p> */}
        <p className="search-TXT">
          Search for Booking request with request Id and cancel specific booking
          for a request.
        </p>
        <p className="search-TXT">
          <div class="triangle-down"></div>
        </p>
        {/* INSERT Cancel Booking Dates UI here */}
        <div className="cancel-dates-toggle">
          <button
            onClick={() => setShowCancelSection((prev) => !prev)}
            className="cancel-btn"
          >
            {showCancelSection
              ? "Hide Cancel Booked Dates"
              : "Open Cancel Booked Dates"}
          </button>
        </div>

        {showCancelSection && (
          <CancelBookingDatesSection
            onSuccess={setSuccessMessage}
            onError={setError}
          />
        )}
        {/* END Cancel Booking Dates Section */}
      </div>
    </div>
  );
};

export default CancelRequestForm;
