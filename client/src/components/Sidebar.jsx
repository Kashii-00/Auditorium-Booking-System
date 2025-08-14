"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "./styles/CSS/Sidebar.css"

import screenshot from "./styles/MPMA_MAIN.png"
import miniLogo from "./styles/MPMA_MINI.png"

import { FaChevronLeft, FaSignOutAlt} from "react-icons/fa"
import { CircleDollarSign, Bus, CalendarDays,SquareChartGantt,ShieldUser,Album,School } from "lucide-react"


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
      pathname.startsWith("/lecturer-registration") ||
      pathname.startsWith("/LMmain") ||
      pathname.startsWith("/LRegistration")
    )
      return "Course"
    if (pathname.startsWith("/annual-plan")) return "planning"
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
    if (pathname.startsWith("/create-user")) return "users"
    return "audi" // default
  }

  const location = useLocation()
  const [selectedSection, setSelectedSection] = useState(getSectionFromPath(location.pathname))
  const [openSection, setOpenSection] = useState(getSectionFromPath(location.pathname))

  // Always initialize sidebar state from localStorage (default: expanded/open)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false // default to expanded/open
  })
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [showSubLinks, setShowSubLinks] = useState(false)
  // Remove hoverTimeout as it's no longer needed

  const navigate = useNavigate()
  const sidebarNavRef = useRef(null)

  const TIMEOUT_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds



  // Set the default section and navigate to the first accessible page
  useEffect(() => {
    // Sync section based on location path on initial load or route change
    const section = getSectionFromPath(location.pathname)
    setSelectedSection(section)
    setOpenSection(section)
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

  // Scroll overflow detection for sidebar navigation
  useEffect(() => {
    const checkScrollOverflow = () => {
      if (sidebarNavRef.current) {
        const element = sidebarNavRef.current
        const hasOverflow = element.scrollHeight > element.clientHeight
        const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1
        
        // Add/remove overflow class
        if (hasOverflow) {
          element.classList.add('has-overflow')
        } else {
          element.classList.remove('has-overflow')
        }
        
        // Add/remove scrolled-to-bottom class
        if (isScrolledToBottom) {
          element.classList.add('scrolled-to-bottom')
        } else {
          element.classList.remove('scrolled-to-bottom')
        }
      }
    }

    const handleScroll = () => {
      checkScrollOverflow()
    }

    // Check initially
    checkScrollOverflow()

    // Add scroll listener
    if (sidebarNavRef.current) {
      sidebarNavRef.current.addEventListener('scroll', handleScroll)
    }

    // Check on window resize
    window.addEventListener('resize', checkScrollOverflow)

    // Check when content changes (sections open/close)
    const timer = setInterval(checkScrollOverflow, 1000)

    return () => {
      if (sidebarNavRef.current) {
        sidebarNavRef.current.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('resize', checkScrollOverflow)
      clearInterval(timer)
    }
  }, [openSection, isCollapsed, isHovered])

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

    // Show sublinks only when fully opening sidebar (not collapsing)
    if (!newCollapsedState) {
      setShowSubLinks(true)
    } else {
      setShowSubLinks(false)
    }

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

      // Don't show sublinks on hover - only when fully opened/pinned
      setShowSubLinks(false)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      // Immediately hide sub-links
      setShowSubLinks(false)
      
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

      // Show sublinks when pinning the sidebar
      if (!isPinned) {
        setShowSubLinks(true)
      }

      // Update collapse state when clicking sidebar
      if (isCollapsed) {
        setIsCollapsed(false)
        setShowSubLinks(true)
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

  // No longer need cleanup timeout since we removed hoverTimeout

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
      if (hasRole("SuperAdmin") || hasRole("course_allocation_manager")) return "/course-registration"
      return null
    },
    planning: () => (hasRole("SuperAdmin") ? "/annual-plan" : null),
    ClassRoom: () => (hasRole("SuperAdmin") || hasRole("class_request_access") ? "/ClassBooking" : null),

    finance: () => {
      if (hasRole("SuperAdmin") || hasRole("finance_manager") || hasRole("SU_finance_access"))
        return "/coursecost"
      if (hasRole("finance_manager")) return "/editpanel"
      return null
    },
    
  }

  // Handle dropdown change: navigate to first link if exists
  const handleSectionChange = (sectionValue) => {
    // Toggle the section: if it's already open, close it; otherwise, open it
    if (openSection === sectionValue) {
      setOpenSection(null)
    } else {
      setOpenSection(sectionValue)
      setSelectedSection(sectionValue)
      
      // Navigate to first available link in that section
      const getFirstLink = sectionFirstLinks[sectionValue]
      if (getFirstLink) {
        const firstLink = getFirstLink()
        if (firstLink) {
          navigate(firstLink)
        }
      }
    }
  }

  // Render navigation links with expandable sections
  const renderExpandableNavigation = () => {
    const sectionConfig = [
      {
        key: "audi",
        title: "AUDITORIUM",
        icon: CalendarDays,
        iconType: "lucide",
        roles: ["calendar_access", "bookings_access"],
        subLinks: [
          {
            path: "/calendar",
            title: "ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ᴄᴀʟᴇɴᴅᴀʀ",
            roles: ["calendar_access"]
          },
          {
            path: "/bookings",
            title: "ᴀᴜᴅɪᴛᴏʀɪᴜᴍ ʙᴏᴏᴋɪɴɢꜱ",
            roles: ["bookings_access"]
          }
        ]
      },
      {
        key: "bus",
        title: "TRANSPORT",
        icon: Bus,
        iconType: "lucide",
        roles: ["bus_access", "busbookings_access"],
        subLinks: [
          {
            path: "/bus",
            title: "ʙᴜꜱ ʀᴇꜱᴇʀᴠᴀᴛɪᴏɴ",
            roles: ["bus_access"]
          },
          {
            path: "/busbookings",
            title: "ʙᴜꜱ ʙᴏᴏᴋɪɴɢꜱ",
            roles: ["busbookings_access"]
          }
        ]
      },
      {
        key: "crbooking",
        title: "CLASSROOM",
        icon: School,
        iconType: "lucide",
        roles: ["cb_Admin_access", "cb_SU_access"],
        subLinks: [
          {
            path: "/classroombookingform",
            title: "ᴇᴅᴜʀᴇꜱᴏᴜʀᴄᴇ ᴅᴀꜱʜʙᴏᴀʀᴅ",
            roles: ["cb_SU_access", "cb_Admin_access"]
          },
          {
            path: "/classroomcalendar",
            title: "ᴄʟᴀꜱꜱʀᴏᴏᴍ ꜱᴄʜᴇᴅᴜʟᴇʀ",
            roles: ["cb_Admin_access"]
          },
          {
            path: "/calendarbookingtable",
            title: "ᴄʟᴀꜱꜱʀᴏᴏᴍ ʙᴏᴏᴋɪɴɢꜱ",
            roles: ["cb_Admin_access"]
          },
          {
            path: "/classroombooking",
            title: "ᴄʙ ᴅᴇᴛᴀɪʟꜱ ᴛᴀʙʟᴇ",
            roles: ["cb_Admin_access"]
          },
          {
            path: "/classroombookingschedule",
            title: "ᴄʟᴀꜱꜱʀᴏᴏᴍ ꜱᴄʜᴇᴅᴜʟᴇ",
            roles: ["cb_Admin_access", "cb_SU_access"]
          }
        ]
      },
      {
        key: "Course",
        title: "COURSES",
        icon: Album,
        iconType: "lucide",
        roles: ["course_allocation_manager"],
        subLinks: [
          {
            path: "/course-registration",
            title: "Course Registration",
            roles: ["course_allocation_manager"]
          },
          {
            path: "/student-registration",
            title: "Student Registration",
            roles: ["course_allocation_manager"]
          },
          {
            path: "/BatchRegistration",
            title: "Batch Registration",
            roles: ["course_allocation_manager"]
          },
          {
            path: "/lecturer-registration",
            title: "Lecturer Registration",
            roles: ["course_allocation_manager"]
          }
        ]
      },
      {
        key: "planning",
        title: "ACADEMIC PLAN",
        icon: SquareChartGantt,
        iconType: "lucide",
        roles: ["SuperAdmin"],
        subLinks: [
          {
            path: "/annual-plan",
            title: "Annual Academic Plan",
            roles: ["SuperAdmin"]
          }
        ]
      },
      {
        key: "finance",
        title: "FINANCE",
        icon: CircleDollarSign,
        iconType: "lucide",
        roles: ["finance_manager", "SU_finance_access"],
        subLinks: [
          {
            path: "/coursecost",
            title: "Finances Form",
            roles: ["finance_manager", "SU_finance_access"]
          },
          {
            path: "/PaymentTable",
            title: "Finances Records Table",
            roles: ["finance_manager", "SU_finance_access"]
          },
          {
            path: "/editpanel",
            title: "Finances Rates Table",
            roles: ["finance_manager"]
          }
        ]
      }
    ]

    // Add users section for SuperAdmin as the 6th main section
    if (hasRole("SuperAdmin")) {
      sectionConfig.push({
        key: "users",
        title: "ADMIN",
        icon: ShieldUser,
        iconType: "lucide",
        roles: ["SuperAdmin"],
        subLinks: [
          {
            path: "/users",
            title: "ᴀᴄᴄᴇꜱꜱ ᴄᴏɴᴛʀᴏʟ",
            roles: ["SuperAdmin"]
          },
          {
            path: "/create-user",
            title: "ᴄʀᴇᴀᴛᴇ ɴᴇᴡ ᴜꜱᴇʀ",
            roles: ["SuperAdmin"]
          }
        ]
      })
    }

    return (
      <div className="sidebar-sections">
        {sectionConfig.map((section) => {
          // Check if user has access to this section
          const hasAccess = hasRole("SuperAdmin") || section.roles.some(role => hasRole(role))
          if (!hasAccess) return null

          const isOpen = openSection === section.key
          const hasActiveLink = section.subLinks.some(link => 
            location.pathname === link.path || 
            (link.path === "/course-registration" && (location.pathname === "/courseregistration" || location.pathname.startsWith("/course-registration"))) ||
            (link.path === "/lecturer-registration" && location.pathname.includes("/LRegistration/edit/")) ||
            (link.path === "/users" && location.pathname.startsWith("/users")) ||
            (link.path === "/create-user" && location.pathname.startsWith("/create-user"))
          )

          return (
            <div key={section.key} className="sidebar-section">
              <button
                className={`section-header ${isOpen ? 'open' : ''} ${hasActiveLink ? 'active' : ''}`}
                onClick={() => handleSectionChange(section.key)}
              >
                <div className="section-header-content">
                  {section.iconType === "lucide" ? (
                    <section.icon className="section-icon lucide-icon" size={24} />
                  ) : (
                    <img src={section.icon} alt={section.title} className="section-icon" />
                  )}
                  <span className="section-title">{section.title}</span>
                </div>
                <span className={`expand-arrow ${isOpen ? 'rotated' : ''}`}>▼</span>
              </button>
              
              {isOpen && showSubLinks && !isHovered && (
                <div className="section-links">
                  {section.subLinks.map((link) => {
                    // Check if user has access to this specific link
                    const hasLinkAccess = hasRole("SuperAdmin") || link.roles.some(role => hasRole(role))
                    if (!hasLinkAccess) return null

                    const isActive = location.pathname === link.path || 
                      (link.path === "/course-registration" && (location.pathname === "/courseregistration" || location.pathname.startsWith("/course-registration"))) ||
                      (link.path === "/lecturer-registration" && location.pathname.includes("/LRegistration/edit/")) ||
                      (link.path === "/users" && location.pathname.startsWith("/users")) ||
                      (link.path === "/create-user" && location.pathname.startsWith("/create-user"))

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`section-link ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(link.path)
                        }}
                      >
                        {link.title}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Update body class whenever sidebar state changes
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed")
      setShowSubLinks(false) // Hide sub-links when collapsed
    } else {
      document.body.classList.remove("sidebar-collapsed")
      // Only show sub-links when sidebar is fully opened (not during hover)
      if (isPinned || (!isHovered && !isCollapsed)) {
        setShowSubLinks(true)
      } else {
        setShowSubLinks(false)
      }
    }
  }, [isCollapsed, isPinned, isHovered])

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

            <nav className="sidebar-nav" ref={sidebarNavRef}>{renderExpandableNavigation()}</nav>

      <button onClick={onLogout} className="logoutBtn">
        <FaSignOutAlt className="logout-icon" />
        <span className="logout-text">Logout</span>
      </button>
    </div>
  )
}

export default Sidebar
