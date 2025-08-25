import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Key,
  Building,
  CheckCircle,
} from "lucide-react";
import AidHandoverForm from "./AidHandoverForm";
import AidRequestForm from "./AidRequestForm";

const ClassroomBookingForm = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const [showPopup, setShowPopup] = useState(false);
  const [selectedForm, setSelectedForm] = useState("request");

  const hasRole = (role) => {
    if (!user?.role) return false;
    let roles = user.role;
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = [roles];
      }
    }
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(role);
  };



  const canAccessCB_ADMIN = hasRole("SuperAdmin") || hasRole("cb_Admin_access");
  const canAccessCB_COMMON =
    hasRole("SuperAdmin") ||
    hasRole("cb_SU_access") ||
    hasRole("cb_Admin_access");

  const handleFormSelection = (formType) => {
    setSelectedForm(formType);
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

  // Success popup component
  const SuccessPopup = ({ message }) => {
    return (
      <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-lg">{message}</p>
            <p className="text-emerald-100 text-sm">Your action has been completed successfully</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Simple Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-slate-50"></div>
      </div>

      {showPopup && (
        <SuccessPopup
          message="Booking added successfully!"
          onClose={() => setShowPopup(false)}
        />
      )}

      <div className="relative z-10 p-4 xl:p-6">
        {/* Header Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
                  <Building className="w-8 h-8 text-blue-600" />
                  Classroom Booking System
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Manage classroom bookings and requests efficiently
                </p>
              </div>
              
              {/* Form Selection Buttons in Header */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={selectedForm === "request" ? "default" : "outline"}
                  onClick={() => handleFormSelection("request")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                    selectedForm === "request"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Request Form
                </Button>
                <Button
                  variant={selectedForm === "handover" ? "default" : "outline"}
                  onClick={() => handleFormSelection("handover")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                    selectedForm === "handover"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  Handover Form
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Form Content */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              {selectedForm === "request" ? (
                <AidRequestForm />
              ) : (
                <AidHandoverForm />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassroomBookingForm;
