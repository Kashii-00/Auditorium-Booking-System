import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/details.css";

import { requestFields, handoverFields } from "./aidUtils";

const SingleBookingFullDetails = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

  const request = location.state?.request;
  const handover = location.state?.handover;
  const items = request?.aid_items || [];

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

  if (!request) {
    return <p className="text-center mt-10">No data available.</p>;
  }

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp`}
      id="clsBooking"
    >
      <div className="details-container">
        <h2 className="text-xl font-bold mb-2">
          Request Details (ID: {request.id})
        </h2>
        <div className="review-grid">
          {requestFields.map(({ label, key, getValue, highlight }) => {
            let value = getValue ? getValue(request) : request[key] || "-";

            // Apply time formatting during rendering
            if ((key === "time_from" || key === "time_to") && value !== "-") {
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
          {items.length > 0 ? (
            <table className="bookingk">
              <thead className="bg-gray-100">
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
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{item.item_no}</td>
                    <td className="border px-2 py-1">{item.description}</td>
                    <td className="border px-2 py-1">{item.quantity}</td>
                    <td className="border px-2 py-1">{item.remark}</td>
                    <td className="border px-2 py-1">
                      {item.md_approval_required_or_not}
                    </td>
                    <td className="border px-2 py-1">
                      {item.md_approval_obtained}
                    </td>
                    <td className="border px-2 py-1">
                      {item.md_approval_details || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {item.CTM_approval_obtained}
                    </td>
                    <td className="border px-2 py-1">
                      {item.CTM_Details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No items found.</p>
          )}
        </div>

        <h3 className="mt-4 font-semibold">Handover Details</h3>
        {handover ? (
          <div className="review-grid">
            {handoverFields.map(({ label, key }) => (
              <React.Fragment key={key}>
                <div className="label">{label}:</div>
                <div className="value">{handover[key] || "-"}</div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="msg-Con">
            <p className="msgCancelReq">
              {"\u26A0"} No handover data found for this request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleBookingFullDetails;
