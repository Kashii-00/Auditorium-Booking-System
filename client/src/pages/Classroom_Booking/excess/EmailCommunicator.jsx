import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ClassroomBookingForm1.css";
import "./styles/form.css";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../../utils/apiUrl";

const EmailCommunicator = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await authRequest(
        "post",
        getApiUrl("/email/send"),
        {
          to,
          subject,
          message,
        }
      );

      console.log("Email API response:", response);

      if (response?.success) {
        setStatus("Email sent successfully.");
        setTo("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("Failed to send email.");
      }
    } catch (error) {
      console.error("Email sending error:", error);
      setStatus("An error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`content-wrapper ${
        sidebarCollapsed ? "expanded" : ""
      } form-wp`}
    >
      <div className="details-container">
        <h2 className="text-xl font-bold mb-4">Send Email</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
            ></textarea>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Email"}
          </button>
        </form>
        {status && <p className="mt-3 text-sm">{status}</p>}
      </div>
    </div>
  );
};

export default EmailCommunicator;
