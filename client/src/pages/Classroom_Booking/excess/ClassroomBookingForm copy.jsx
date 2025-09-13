import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ClassroomBookingForm.css";
import AidRequestForm from "./AidRequestForm";
import AidHandoverForm from "./AidHandoverForm";

const ClassroomBookingForm = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );

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

  return (
    <div className={`content-wrapper ${sidebarCollapsed ? "expanded" : ""}`}>
      {/* Form 1: Aid Request */}
      <AidRequestForm />

      <hr style={{ margin: "3rem 0", borderTop: "2px solid #ccc" }} />

      {/* Form 2: Handover */}
      <AidHandoverForm />
    </div>
  );
};

export default ClassroomBookingForm;
