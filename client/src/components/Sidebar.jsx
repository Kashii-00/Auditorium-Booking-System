"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "../styles/Sidebar.css"
import screenshot from "../styles/MPMANew.svg"
import calender from "../styles/calendar1.png"
import List1 from "../pages/Classroom_Booking/styles/dashboard.png"
import List from "../styles/order.png"
import details from "../pages/Classroom_Booking/styles/details.png"
import Schedule from "../pages/Classroom_Booking/styles/Schedule.png"
import addbooking from "../pages/Classroom_Booking/styles/addbooking.png"
import Bus from "../styles/bus.png"
import admin2 from "../styles/Admin1.png"
import miniLogo from "../styles/MPMA.svg"
import courseIcon from "../styles/Course.png"
import batchIcon from "../styles/Batch.png"
import Student from "../styles/Srudent.png"
import Lecturers from "../styles/Lecturer.png"
import { FaChevronLeft, FaSignOutAlt, FaCalendarAlt } from "react-icons/fa"

const Sidebar = ({ user, onLogout }) => {
  // State variables
  const getSectionFromPath = (pathname) => {
    if (pathname.startsWith("/calendar") || pathname.startsWith("/bookings")) return "audi"
    if (pathname.startsWith("/bus") || pathname.startsWith("/busbookings")) return "bus"
    if (
      pathname.startsWith("/courseregistration") ||
      pathname.startsWith("/course-registration") ||
      pathname.startsWith("/student-registration") ||
      pathname.startsWith("/BatchRegistration") ||
      pathname.startsWith("/annual-plan")
    )
      return "Course"
    if (
      pathname.startsWith("/lecturer-registration") ||
      pathname.startsWith("/LMmain") ||
      pathname.startsWith("/LRegistration")
    )
      return "Lecturers"
      if (
      pathname.startsWith("/classroombookingform") ||
      pathname.startsWith("/classroombooking") ||
      pathname.startsWith("/classroombookingschedule") ||
      pathname.startsWith("/classroomcalendar") ||
      pathname.startsWith("/calendarbookingtable") ||
      pathname.startsWith("/cancelRequestByUser") 

    )
      return "crbooking"

      if (
        pathname.startsWith("/coursecost") ||
        pathname.startsWith("/PaymentTable") ||
        pathname.startsWith("/editpanel")
      )
        return "finance"

    if (pathname.startsWith("/users")) return "users"
    return "audi" // default
  }

  const location = useLocation()
  const [selectedSection, setSelectedSection] = useState(getSectionFromPath(location.pathname))

  // Always initialize sidebar state from localStorage (default: expanded/open)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false // default to expanded/open
  })
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  const navigate = useNavigate()

  const TIMEOUT_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds



  // Set the default section and navigate to the first accessible page
  useEffect(() => {
    // Sync section based on location path on initial load or route change
    const section = getSectionFromPath(location.pathname)
    setSelectedSection(section)
  }, [location.pathname])

  // Click outside to collapse the sidebar when not pinned
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Ignore clicks on sidebar elements
      if (
        e.target.closest(".collapse-toggle") ||
        e.target.closest(".sidebar-dropdown") ||
        e.target.closest(".logoutBtn") ||
        e.target.closest(".sidebar-link")
      ) {
        return
      }

      // Check if click is outside sidebar and sidebar is not collapsed or pinned
      if (!e.target.closest(".sidebar") && !isCollapsed && !isPinned) {
        setIsCollapsed(true)
        setIsHovered(false)

        // Dispatch event to inform other components
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: {
              isCollapsed: true,
              isHovered: false,
              isPinned: false,
            },
          }),
        )
      }
    }

    document.addEventListener("click", handleClickOutside, true)
    return () => document.removeEventListener("click", handleClickOutside, true)
  }, [isCollapsed, isPinned])

  // Listen for sidebar state changes from other components/pages
  useEffect(() => {
    // On mount, set sidebar state from localStorage (default: collapsed)
    const stored = localStorage.getItem("sidebarState")
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    } else {
      setIsCollapsed(true) // default to collapsed/closed
      localStorage.setItem("sidebarState", "true")
    }

    // Listen for sidebarToggle events and update state
    const handleSidebarToggle = (e) => {
      setIsCollapsed(e.detail.isCollapsed)
      setIsHovered(false) // Reset hover state when toggled from navbar
      setIsPinned(false) // Unpin when toggled from navbar

      // Update body class for proper CSS application
      document.body.classList.toggle("sidebar-collapsed", e.detail.isCollapsed)

      localStorage.setItem("sidebarState", e.detail.isCollapsed)
    }

    // Listen for browser navigation (back/forward) and sync sidebar state
    const handlePopState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        setIsCollapsed(stored === "true")
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed: stored === "true" },
          }),
        )
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // --- FORCE sidebar state sync on every route change ---
  useEffect(() => {
    // Always force sidebar state from localStorage on every route change
    const stored = localStorage.getItem("sidebarState")
    if (stored !== null) {
      setIsCollapsed(stored === "true")
      document.body.classList.toggle("sidebar-collapsed", stored === "true")
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", {
          detail: { isCollapsed: stored === "true" },
        }),
      )
    } else {
      setIsCollapsed(true)
      document.body.classList.add("sidebar-collapsed")
      localStorage.setItem("sidebarState", "true")
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", {
          detail: { isCollapsed: true },
        }),
      )
    }
  }, [location.pathname])

  // Toggle sidebar collapse state
  const toggleSidebar = (e) => {
    e.stopPropagation()
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)

    // Always update body class for global CSS state
    document.body.classList.toggle("sidebar-collapsed", newCollapsedState)

    setIsPinned(false)
    setIsHovered(false)
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: {
          isCollapsed: newCollapsedState,
          isHovered: false,
          isPinned: false,
        },
      }),
    )
  }

  const handleMouseEnter = () => {
    if (isCollapsed && !isPinned) {
      setIsHovered(true)
      setIsCollapsed(false)

      // Update body class for CSS when expanded by hover
      document.body.classList.remove("sidebar-collapsed")

      localStorage.setItem("sidebarState", "false")
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", {
          detail: { isCollapsed: false },
        }),
      )
      window.dispatchEvent(
        new CustomEvent("sidebarHover", {
          detail: { isHovered: true },
        }),
      )
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false)
      setIsCollapsed(true)

      // Update body class for CSS when collapsed after hover
      document.body.classList.add("sidebar-collapsed")

      localStorage.setItem("sidebarState", "true")
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", {
          detail: { isCollapsed: true },
        }),
      )
      window.dispatchEvent(
        new CustomEvent("sidebarHover", {
          detail: { isHovered: false },
        }),
      )
    }
  }

  // Handle click to pin/unpin the sidebar
  const handleSidebarClick = (e) => {
    // Ignore clicks on interactive elements
    if (
      e.target.classList.contains("sidebar-dropdown") ||
      e.target.closest(".sidebar-dropdown") ||
      e.target.tagName.toLowerCase() === "a" ||
      e.target.tagName.toLowerCase() === "button" ||
      e.target.closest("a") ||
      e.target.closest("button")
    ) {
      return
    }

    // Toggle pin if sidebar is expanded or being expanded by hover
    if (!isCollapsed || isHovered) {
      setIsPinned(!isPinned)

      // Update collapse state when clicking sidebar
      if (isCollapsed) {
        setIsCollapsed(false)
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: {
              isCollapsed: false,
              isHovered: false,
              isPinned: true,
            },
          }),
        )
      }
    }
  }

  // Inactivity logout callback
  const handleInactivityLogout = useCallback(() => {
    onLogout()
    window.location.href = "/login" // Redirect to login page
    alert("You have been logged out due to inactivity")
  }, [onLogout])

  // Set up inactivity timeout
  useEffect(() => {
    let timeoutId

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleInactivityLogout, TIMEOUT_DURATION)
    }

    document.addEventListener("mousemove", resetTimeout)
    document.addEventListener("keypress", resetTimeout)

    // Initial timeout
    resetTimeout()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener("mousemove", resetTimeout)
      document.removeEventListener("keypress", resetTimeout)
    }
  }, [handleInactivityLogout, TIMEOUT_DURATION])

  // Function to check user roles
  const hasRole = (roleToCheck) => {
    if (!user?.role) return false
    let roles = user.role
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles)
      } catch {
        roles = [roles]
      }
    }
    if (!Array.isArray(roles)) roles = [roles]
    return roles.includes(roleToCheck)
  }

  // Map for first link per section
  const sectionFirstLinks = {
    audi: () => {
      if (hasRole("SuperAdmin") || hasRole("calendar_access")) return "/calendar"
      if (hasRole("bookings_access")) return "/bookings"
      return null
    },
    crbooking: () => {
    if (hasRole("SuperAdmin") || hasRole("cb_SU_access") || hasRole("cb_Admin_access")) return "/classroombookingform"
    if (hasRole("cb_Admin_access")) return "/classroombooking"
    if (hasRole("cb_Admin_access")) return "/classroomcalendar"
    if (hasRole("cb_Admin_access")) return "/calendarbookingtable"
    if (hasRole("cb_Admin_access") || hasRole("cb_SU_access")) return "/classroombookingschedule"
    return null
  },
    bus: () => {
      if (hasRole("SuperAdmin") || hasRole("bus_access")) return "/bus"
      if (hasRole("busbookings_access")) return "/busbookings"
      return null
    },
    users: () => (hasRole("SuperAdmin") ? "/users" : null),
    Course: () => {
      if (hasRole("SuperAdmin") || hasRole("course_registration_access")) return "/course-registration"
      if (hasRole("SuperAdmin") || hasRole("student_registration_access")) return "/student-registration"
      if (hasRole("SuperAdmin") || hasRole("batch_registration_access")) return "/BatchRegistration"
      return null
    },
    Lecturers: () => {
      if (hasRole("SuperAdmin") || hasRole("lecturer_management_access")) return "/lecturer-registration"
      return null
    },
    ClassRoom: () => (hasRole("SuperAdmin") || hasRole("class_request_access") ? "/ClassBooking" : null),

    finance: () => {
      if (hasRole("SuperAdmin") || hasRole("finance_manager") || hasRole("SU_finance_access"))
        return "/coursecost"
      if (hasRole("finance_manager")) return "/editpanel"
      return null
    },
    
  }

  // Handle dropdown change: navigate to first link if exists
  const handleSectionChange = (e) => {
    const value = e.target.value
    setSelectedSection(value)
    const getFirstLink = sectionFirstLinks[value]
    if (getFirstLink) {
      const firstLink = getFirstLink()
      if (firstLink) {
        navigate(firstLink)
      }
    }
  }

  // Render navigation links with dropdown
  const renderDropdownNavigation = () => {
    const dropdownOptions = [
      { value: "audi", label: "ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ", roles: ["calendar_access", "bookings_access"] },
      { value: "bus", label: "ᴛʀᴀɴꜱᴘᴏʀᴛ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ", roles: ["bus_access", "busbookings_access"] },
      {
        value: "Course",
        label: "ᴄᴏᴜʀꜱᴇ ᴀʟʟᴏᴄᴀᴛɪᴏɴ ᴘᴀɴᴇʟ",
        roles: ["course_registration_access", "student_registration_access"],
      },
      { value: "Lecturers", label: "ʟᴇᴄᴛᴜʀᴇʀꜱ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ", roles: ["lecturer_management_access"] },
      { value: "crbooking", label: "ᴄʟᴀꜱꜱʀᴏᴏᴍ ʀᴇꜱᴏᴜʀᴄᴇ ʜᴜʙ", roles: ["cb_Admin_access", "cb_SU_access"] },
      { value: "users", label: "ᴀᴅᴍɪɴɪꜱᴛʀᴀᴛɪᴏɴ", roles: ["SuperAdmin"] },

      { value: "finance", label: "ꜰɪɴᴀɴᴄᴇ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ", roles: ["finance_manager", "SU_finance_access"] },
    ]

    // Ensure SuperAdmin has access to all options
    const filteredOptions = dropdownOptions.filter(
      (option) => hasRole("SuperAdmin") || option.roles.some((role) => hasRole(role)),
    )

    return (
      <>
        <select
          value={selectedSection}
          onChange={handleSectionChange}
          onClick={handleSidebarClick}
          className="sidebar-dropdown enhanced-hover"
        >
          {filteredOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="sidebar-links">
          {selectedSection === "audi" && (
            <>
              {(hasRole("calendar_access") || hasRole("SuperAdmin")) && (
                <Link to="/calendar" className={`sidebar-link ${location.pathname === "/calendar" ? "active" : ""}`}>
                  <img src={calender || "/placeholder.svg"} alt="CalanderLogo" className="sidebar-icon" />
                  <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ</span>
                </Link>
              )}
              {(hasRole("bookings_access") || hasRole("SuperAdmin")) && (
                <Link to="/bookings" className={`sidebar-link ${location.pathname === "/bookings" ? "active" : ""}`}>
                  <img src={List || "/placeholder.svg"} alt="BookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ</span>
                </Link>
              )}
            </>
          )}

          {selectedSection === "bus" && (
            <>
              {(hasRole("bus_access") || hasRole("SuperAdmin")) && (
                <Link to="/bus" className={`sidebar-link ${location.pathname === "/bus" ? "active" : ""}`}>
                  <img src={Bus || "/placeholder.svg"} alt="Busbooking" className="sidebar-icon" />
                  <span className="sidebar-text">ʙᴜꜱ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ</span>
                </Link>
              )}
              {(hasRole("busbookings_access") || hasRole("SuperAdmin")) && (
                <Link
                  to="/busbookings"
                  className={`sidebar-link ${location.pathname === "/busbookings" ? "active" : ""}`}
                >
                  <img src={List || "/placeholder.svg"} alt="BusbookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ʙᴜꜱ ʙᴏᴏᴋɪɴɢꜱ</span>
                </Link>
              )}
            </>
          )}
          {selectedSection === "crbooking" && (
            <>
              {(hasRole("SuperAdmin") || hasRole("cb_SU_access") || hasRole("cb_Admin_access")) && (
                <Link to="/classroombookingform" className={`sidebar-link ${location.pathname === "/classroombookingform" ? "active" : ""}`}>
                  <img src={List1 || "/placeholder.svg"} alt="BookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ᴇᴅᴜʀᴇꜱᴏᴜʀᴄᴇ ᴅᴀꜱʜʙᴏᴀʀᴅ</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("cb_Admin_access")) && (
                <Link to="/classroomcalendar" className={`sidebar-link ${location.pathname === "/classroomcalendar" ? "active" : ""}`}>
                  <img src={addbooking || "/placeholder.svg"} alt="CalanderLogo" className="sidebar-icon" />
                  <span className="sidebar-text">ᴄʟᴀꜱꜱʀᴏᴏᴍ ꜱᴄʜᴇᴅᴜʟᴇʀ</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("cb_Admin_access")) && (
                <Link to="/calendarbookingtable" className={`sidebar-link ${location.pathname === "/calendarbookingtable" ? "active" : ""}`}>
                  <img src={details || "/placeholder.svg"} alt="CalanderLogo" className="sidebar-icon" />
                  <span className="sidebar-text">ᴄʟᴀꜱꜱʀᴏᴏᴍ ʙᴏᴏᴋɪɴɢꜱ</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("cb_Admin_access")) && (
                <Link to="/classroombooking" className={`sidebar-link ${location.pathname === "/classroombooking" ? "active" : ""}`}>
                  <img src={details || "/placeholder.svg"} alt="BookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ᴄʙ ᴅᴇᴛᴀɪʟꜱ ᴛᴀʙʟᴇ</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("cb_Admin_access") || hasRole("cb_SU_access")) && (
                <Link to="/classroombookingschedule" className={`sidebar-link ${location.pathname === "/classroombookingschedule" ? "active" : ""}`}>
                  <img src={Schedule || "/placeholder.svg"} alt="BookingList" className="sidebar-icon" />
                  <span className="sidebar-text">ᴄʟᴀꜱꜱʀᴏᴏᴍ ꜱᴄʜᴇᴅᴜʟᴇ</span>
                </Link>
              )}
            </>
          )}

          {selectedSection === "users" && hasRole("SuperAdmin") && (
            <Link to="/users" className={`sidebar-link ${location.pathname === "/users" ? "active" : ""}`}>
              <img src={admin2 || "/placeholder.svg"} alt="UserList" className="sidebar-icon" />
              <span className="sidebar-text">ᴀᴄᴄᴇꜱꜱ ᴄᴏɴᴛʂᴏʀʟ</span>
            </Link>
          )}

          {selectedSection === "finance" && (
            <>
              {(hasRole("SuperAdmin") || hasRole("finance_manager") || hasRole("SU_finance_access")) && (
                <Link
                  to="/coursecost"
                  className={`sidebar-link ${location.pathname === "/coursecost" ? "active" : ""}`}
                >
                  <img src={List || "/placeholder.svg"} alt="Finances Form" className="sidebar-icon" />
                  <span className="sidebar-text">Finances Form</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("finance_manager") || hasRole("SU_finance_access")) && (
                <Link
                  to="/PaymentTable"
                  className={`sidebar-link ${location.pathname === "/PaymentTable" ? "active" : ""}`}
                >
                  <img src={List || "/placeholder.svg"} alt="Finance Records Table" className="sidebar-icon" />
                  <span className="sidebar-text">Finances Records Table</span>
                </Link>
              )}
              {(hasRole("SuperAdmin") || hasRole("finance_manager")) && (
                <Link
                  to="/editpanel"
                  className={`sidebar-link ${location.pathname === "/editpanel" ? "active" : ""}`}
                >
                  <img src={List || "/placeholder.svg"} alt="Finance Rates Table" className="sidebar-icon" />
                  <span className="sidebar-text">Finances Rates Table</span>
                </Link>
              )}
            </>
          )}


          {selectedSection === "Course" && (
            <>
              {(hasRole("SuperAdmin") || hasRole("course_registration_access")) && (
                <Link
                  to="/course-registration"
                  className={`sidebar-link ${(location.pathname === "/courseregistration" || location.pathname === "/course-registration" || location.pathname.startsWith("/course-registration")) ? "active" : ""}`}
                >
                  <img src={courseIcon || "/placeholder.svg"} alt="Course Registration" className="sidebar-icon" />
                  <span className="sidebar-text">Course Registration</span>
                </Link>
              )}

              {/* Add Student Registration Link */}
              {(hasRole("SuperAdmin") || hasRole("student_registration_access")) && (
                <Link
                  to="/student-registration"
                  className={`sidebar-link ${location.pathname === "/student-registration" ? "active" : ""}`}
                >
                  <img src={Student || "/placeholder.svg"} alt="Student Registration" className="sidebar-icon" />
                  <span className="sidebar-text">Student Registration</span>
                </Link>
              )}

              {(hasRole("SuperAdmin") || hasRole("batch_registration_access")) && (
                <Link
                  to="/BatchRegistration"
                  className={`sidebar-link ${location.pathname === "/BatchRegistration" ? "active" : ""}`}
                >
                  <img src={batchIcon || "/placeholder.svg"} alt="Batch Registration" className="sidebar-icon" />
                  <span className="sidebar-text">Batch Registration</span>
                </Link>
              )}

              {hasRole("SuperAdmin") && (
                <Link
                  to="/annual-plan"
                  className={`sidebar-link ${location.pathname === "/annual-plan" ? "active" : ""}`}
                >
                  <FaCalendarAlt className="sidebar-icon" />
                  <span className="sidebar-text">Annual Plan</span>
                </Link>
              )}
            </>
          )}
          {selectedSection === "Lecturers" && (hasRole("SuperAdmin") || hasRole("lecturer_management_access")) && (
            <>
              <Link
                to="/lecturer-registration"
                className={`sidebar-link ${location.pathname === "/lecturer-registration" || location.pathname.includes("/LRegistration/edit/") ? "active" : ""}`}
              >
                <img src={Lecturers || "/placeholder.svg"} alt="Student Registration" className="sidebar-icon" />
                <span className="sidebar-text">ʟᴇᴄᴛᴜʀᴇʀ ʀᴇɢɪꜱᴛʀᴀᴛɪᴏɴ</span>
              </Link>
            </>
          )}
        </div>
      </>
    )
  }

  // Update body class whenever sidebar state changes
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed")
    } else {
      document.body.classList.remove("sidebar-collapsed")
    }
  }, [isCollapsed])

  return (
    <div
      className={`sidebar ${isCollapsed && !isHovered ? "collapsed" : ""} ${isPinned ? "pinned" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSidebarClick}
    >
      {/* Always show the collapse toggle button */}
      <button
        className="collapse-toggle"
        onClick={(e) => {
          e.stopPropagation()
          toggleSidebar(e)
        }}
        aria-label="Toggle sidebar"
      >
        <FaChevronLeft className={`collapse-icon ${isCollapsed ? "rotate-180" : ""}`} />
      </button>

      <div className="sidebar-header">
        <div
          className="navbar-logo"
          onClick={(e) => {
            e.stopPropagation() // Prevent triggering parent click events
            navigate("/") // Navigate to the home page
          }}
          role="button"
          tabIndex="0"
        >
          {isCollapsed && !isHovered ? (
            <img src={miniLogo || "/placeholder.svg"} alt="MPMA" className="mini-logo" loading="eager" />
          ) : (
            <img src={screenshot || "/placeholder.svg"} alt="MPMA Full Logo" className="logo-image" loading="eager" />
          )}
        </div>
      </div>

      <nav className="sidebar-nav">{renderDropdownNavigation()}</nav>

      <button onClick={onLogout} className="logoutBtn">
        <FaSignOutAlt className="logout-icon" />
        <span className="logout-text">Logout</span>
      </button>
    </div>
  )
}

export default Sidebar
