import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Key, Building, CheckCircle } from "lucide-react";
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
            <p className="text-emerald-100 text-sm">
              Your action has been completed successfully
            </p>
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

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./styles/form.css";
// import MPMA from "../Classroom_Booking/styles/MPMA.png";
// import contract from "../Classroom_Booking/styles/contract.png";
// import key from "../Classroom_Booking/styles/key.png";
// import calendar from "../Classroom_Booking/styles/calendar.png";
// import checklist from "../Classroom_Booking/styles/checklist.png";
// import presentation from "../Classroom_Booking/styles/presentation.png";
// import analytics from "../Classroom_Booking/styles/analytics.png";
// import AidHandoverForm from "./AidHandoverForm";
// import AidRequestForm from "./AidRequestForm";

// const ClassroomBookingForm = ({ user }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(
//     () => location.state?.sidebarState ?? false
//   );
//   const [showPopup, setShowPopup] = useState(false);

//   const [menuOpen, setMenuOpen] = useState(false);
//   const [selectedForm, setSelectedForm] = useState("request");

//   const hasRole = (role) => {
//     if (!user?.role) return false;
//     let roles = user.role;
//     if (typeof roles === "string") {
//       try {
//         roles = JSON.parse(roles);
//       } catch {
//         roles = [roles];
//       }
//     }
//     if (!Array.isArray(roles)) roles = [roles];
//     return roles.includes(role);
//   };

//   // const goToCalendar = () => {
//   //   if (canAccessCalendar) navigate("/classroomcalendar");
//   //   else navigate("/access-denied");
//   // };

//   // const goToBookedClassrooms = () => {
//   //   if (canAccessCalendar) navigate("/calendarbookingtable");
//   //   else navigate("/access-denied");
//   // };

//   // const goToRequestDetails = () => {
//   //   if (canAccessBookings) navigate("/classroombooking");
//   //   else navigate("/access-denied");
//   // };

//   // const goToBookingScheduledForToday = () => {
//   //   if (canAccessSchedule) navigate("/classroombookingschedule");
//   //   else navigate("/access-denied");
//   // };

//   const goToCalendar = () => {
//     if (canAccessCB_ADMIN) navigate("/classroomcalendar");
//     else navigate("/access-denied");
//   };

//   const goToBookedClassrooms = () => {
//     if (canAccessCB_ADMIN) navigate("/calendarbookingtable");
//     else navigate("/access-denied");
//   };

//   const goToRequestDetails = () => {
//     if (canAccessCB_ADMIN) navigate("/classroombooking");
//     else navigate("/access-denied");
//   };

//   const goToBookingScheduledForToday = () => {
//     if (canAccessCB_COMMON) navigate("/classroombookingschedule");
//     else navigate("/access-denied");
//   };

//   const toggleMenu = () => {
//     setMenuOpen((prev) => !prev);
//   };

//   const canAccessCB_ADMIN = hasRole("SuperAdmin") || hasRole("cb_Admin_access");
//   const canAccessCB_COMMON =
//     hasRole("SuperAdmin") ||
//     hasRole("cb_SU_access") ||
//     hasRole("cb_Admin_access");

//   const handleFormSelection = (formType) => {
//     setSelectedForm(formType);
//     setMenuOpen(false);
//   };

//   const dropdownRef = useRef(null);
//   const buttonRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(event.target)
//       ) {
//         setMenuOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     // Always sync sidebar state from localStorage on mount and on popstate
//     const syncSidebarState = () => {
//       const stored = localStorage.getItem("sidebarState");
//       if (stored !== null) {
//         const isCollapsed = stored === "true";
//         setSidebarCollapsed(isCollapsed);
//         window.dispatchEvent(
//           new CustomEvent("sidebarToggle", {
//             detail: { isCollapsed },
//           })
//         );
//       }
//     };

//     // On mount, sync sidebar state
//     syncSidebarState();

//     // Listen for browser back/forward navigation and sync sidebar state
//     window.addEventListener("popstate", syncSidebarState);

//     const handleSidebarToggle = (e) => {
//       setSidebarCollapsed(e.detail.isCollapsed);
//       localStorage.setItem("sidebarState", e.detail.isCollapsed);
//     };

//     const handleSidebarHover = (e) => {
//       setSidebarCollapsed(!e.detail.isHovered);
//     };

//     window.addEventListener("sidebarToggle", handleSidebarToggle);
//     window.addEventListener("sidebarHover", handleSidebarHover);

//     return () => {
//       window.removeEventListener("sidebarToggle", handleSidebarToggle);
//       window.removeEventListener("sidebarHover", handleSidebarHover);
//       window.removeEventListener("popstate", syncSidebarState);
//     };
//   }, []);

//   // Success popup component
//   const SuccessPopup = ({ message }) => {
//     return (
//       <div className="success-popup">
//         <svg
//           className="icon"
//           xmlns="https://www.w3.org/2000/svg"
//           viewBox="0 0 20 20"
//         >
//           <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
//         </svg>
//         <p className="font-bold">{message}</p>
//       </div>
//     );
//   };

//   return (
//     <div
//       className={`content-wrapper ${
//         sidebarCollapsed ? "expanded" : ""
//       } form-wp`}
//       id="clsBooking"
//     >
//       {showPopup && (
//         <SuccessPopup
//           message="Booking added successfully!"
//           onClose={() => setShowPopup(false)}
//         />
//       )}

//       <div className="navRow">
//         <div className="hamburgerMenu">
//           <button className="hamburgerBtn" onClick={toggleMenu} ref={buttonRef}>
//             ☰
//           </button>
//           {menuOpen && (
//             <div className="hamburgerDropdown" ref={dropdownRef}>
//               <div
//                 className="menuItem"
//                 onClick={() => handleFormSelection("request")}
//               >
//                 <img
//                   src={contract}
//                   alt="Classroom Request Form"
//                   className="dashIcon"
//                 />
//                 <span>Classroom Request Form</span>
//               </div>
//               <div
//                 className="menuItem"
//                 onClick={() => handleFormSelection("handover")}
//               >
//                 <img src={key} alt="Handover Form" className="dashIcon" />
//                 <span>Handover Form</span>
//               </div>
//               <div className="menuItem">
//                 <img
//                   src={calendar}
//                   alt="Calendar Bookings Details"
//                   className="dashIcon"
//                 />
//                 <span>Calendar Bookings Details</span>
//               </div>
//             </div>
//           )}
//         </div>
//         <div className="multiNav">
//           <div
//             className="formBtn"
//             onClick={() => handleFormSelection("request")}
//           >
//             <img
//               src={contract}
//               alt="Classroom Request Form"
//               className="dashIcon iconNav"
//             />
//             <span>Classroom Request Form</span>
//           </div>
//           <div
//             className="formBtn"
//             onClick={() => handleFormSelection("handover")}
//           >
//             <img src={key} alt="Handover Form" className="dashIcon iconNav" />
//             <span>Handover Form</span>
//           </div>
//           <div className="formBtn" onClick={goToBookedClassrooms}>
//             <img
//               src={calendar}
//               alt="Calendar Bookings Details"
//               className="dashIcon iconNav"
//             />
//             <span>Calendar Bookings Details</span>
//           </div>
//         </div>
//         <div className="logoNav">
//           <img src={MPMA} alt="logo" />
//         </div>
//       </div>

//       <div className="contentRow">
//         <div className="formContent">
//           {selectedForm === "request" ? (
//             <AidRequestForm />
//           ) : (
//             <AidHandoverForm />
//           )}
//         </div>
//         <div className="otherContent">
//           <div className="minContent" onClick={goToCalendar}>
//             <img src={checklist} alt="Calendar" className="dashIcon" id="dI1" />
//             <span>Calendar</span>
//           </div>
//           <div className="minContent" onClick={goToBookingScheduledForToday}>
//             <img
//               src={presentation}
//               alt="Booked Classrooms For Today"
//               className="dashIcon"
//               id="dI2"
//             />
//             <span>Booked Classrooms For Today</span>
//           </div>
//           <div className="minContent" onClick={goToRequestDetails}>
//             <img
//               src={analytics}
//               alt="Classroom Request Details"
//               className="dashIcon"
//               id="dI3"
//             />
//             <span>Classroom Request Details</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClassroomBookingForm;
