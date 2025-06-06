"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo } from "react"
import { useNavigate } from "react-router-dom"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { authRequest } from "../../services/authService"
import defaultUserImage from "../assets/profile-user.png"
import {
  User,
  Phone,
  Send,
  Check,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Bus,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Lazy load LoadingScreen component
const LoadingScreen = lazy(() => import("../LoadingScreen/LoadingScreen"))

// Error Boundary Component
class CalendarErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Calendar Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl border-2 border-red-200">
          <div className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700 mb-2">Calendar Error</h3>
            <p className="text-red-600 mb-4">Something went wrong loading the calendar.</p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Calendar
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Performance optimized debounce with immediate execution option
const debounce = (func, wait, immediate = false) => {
  let timeout
  const debounced = function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = null
  }
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      func()
    }
  }
  return debounced
}

// Optimized StatCard component with React.memo
const StatCard = memo(({ title, value, icon: Icon, color = "blue" }) => {
  const colorClasses = useMemo(
    () => ({
      blue: "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-700 border-blue-300 shadow-blue-200/50",
      green:
        "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-200/50",
      yellow:
        "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 text-amber-700 border-amber-300 shadow-amber-200/50",
      red: "bg-gradient-to-br from-rose-100 via-red-100 to-pink-100 text-rose-700 border-rose-300 shadow-rose-200/50",
    }),
    [],
  )

  return (
    <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-600 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
              {value}
            </p>
          </div>
          <div className={`p-4 rounded-2xl shadow-xl border-2 ${colorClasses[color]}`}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Loading fallback component
const CalendarLoadingFallback = memo(() => (
  <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-slate-600 font-semibold">Loading calendar...</p>
    </div>
  </div>
))

// Calendar wrapper component with error handling
const CalendarWrapper = memo(
  ({
    calendarRef,
    events,
    handleEventClick,
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleDateClick,
    debouncedAddBookingButtons,
  }) => {
    const [calendarError, setCalendarError] = useState(false)

    const handleCalendarError = useCallback((error) => {
      console.error("Calendar rendering error:", error)
      setCalendarError(true)
    }, [])

    const retryCalendar = useCallback(() => {
      setCalendarError(false)
    }, [])

    if (calendarError) {
      return (
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl border-2 border-yellow-200">
          <div className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-yellow-700 mb-2">Calendar Loading Issue</h3>
            <p className="text-yellow-600 mb-4">Unable to load the calendar view.</p>
            <Button onClick={retryCalendar} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )
    }

    try {
      return (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="auto"
          dayMaxEventRows={2}
          contentHeight="auto"
          eventDisplay="block"
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
          dateClick={handleDateClick}
          eventInteractive={true}
          eventClassNames="calendar-event"
          datesSet={debouncedAddBookingButtons}
          eventDidMount={(info) => {
            // Add any custom event mounting logic here
            try {
              // Ensure event element is properly rendered
              if (info.el) {
                info.el.setAttribute("data-event-id", info.event.id)
              }
            } catch (error) {
              console.warn("Event mount warning:", error)
            }
          }}
          eventWillUnmount={(info) => {
            // Clean up any event-specific resources
            try {
              if (info.el) {
                info.el.removeAttribute("data-event-id")
              }
            } catch (error) {
              console.warn("Event unmount warning:", error)
            }
          }}
          // Error handling for calendar operations
          eventSourceFailure={(error) => {
            console.error("Event source failure:", error)
            handleCalendarError(error)
          }}
        />
      )
    } catch (error) {
      handleCalendarError(error)
      return null
    }
  },
)

// Performance optimized main component
const BusCalendarFull = ({ user }) => {
  // Consolidated state for better performance
  const [formState, setFormState] = useState({
    fromPlace: "Colombo",
    toPlace: "",
    travelDate: "",
    returnDate: "",
    forWho: "",
    ContactNo: "",
    message: "",
    errors: {},
  })

  const [uiState, setUiState] = useState({
    showPopup: false,
    weekendPopup: false,
    isBookingFormOpen: false,
    isClosingForm: false,
    loading: true,
  })

  const [events, setEvents] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Optimized tooltip state with better structure
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    fromPlace: "",
    toPlace: "",
    travelDate: "",
    returnDate: "",
    status: "",
    positionClass: "",
  })

  // Performance refs
  const calendarRef = useRef(null)
  const navigate = useNavigate()
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)
  const abortControllerRef = useRef(null)
  const tooltipTimeoutRef = useRef(null)
  const formValidationTimeoutRef = useRef(null)
  const calendarButtonsTimeoutRef = useRef(null)
  const resizeObserverRef = useRef(null)

  // Performance constants
  const CONSTANTS = useMemo(
    () => ({
      MIN_FETCH_INTERVAL: 2000,
      TOOLTIP_DELAY: 100,
      VALIDATION_DELAY: 300,
      BUTTON_ADDITION_DELAY: 200,
      RESIZE_DEBOUNCE_DELAY: 150,
    }),
    [],
  )

  // Optimized helper functions with better memoization
  const isWeekend = useCallback((date) => {
    if (!date) return false
    const d = new Date(date)
    return d.getDay() === 0 || d.getDay() === 6
  }, [])

  // Optimized form validation with debouncing
  const validateForm = useCallback(() => {
    const { fromPlace, toPlace, travelDate, returnDate, forWho, ContactNo } = formState
    const newErrors = {}

    if (!fromPlace) newErrors.fromPlace = "Starting location is required"
    if (!toPlace) newErrors.toPlace = "Destination is required"
    if (!travelDate) newErrors.travelDate = "Travel date is required"
    if (!returnDate) newErrors.returnDate = "Return date is required"
    if (!forWho) newErrors.forWho = "Passenger name is required"
    if (!ContactNo) newErrors.contactNo = "Contact information is required"
    if (new Date(returnDate) < new Date(travelDate)) newErrors.returnDate = "Return date must be after travel date"
    if (fromPlace === toPlace) newErrors.toPlace = "Destination cannot be same as starting location"

    setFormState((prev) => ({ ...prev, errors: newErrors }))
    return Object.keys(newErrors).length === 0
  }, [formState])

  // Debounced validation
  const debouncedValidateForm = useMemo(
    () =>
      debounce(() => {
        if (formValidationTimeoutRef.current) {
          clearTimeout(formValidationTimeoutRef.current)
        }
        formValidationTimeoutRef.current = setTimeout(validateForm, CONSTANTS.VALIDATION_DELAY)
      }, CONSTANTS.VALIDATION_DELAY),
    [validateForm, CONSTANTS.VALIDATION_DELAY],
  )

  // Optimized sidebar state management with better performance
  const debouncedSyncSidebarState = useMemo(
    () =>
      debounce(() => {
        const stored = localStorage.getItem("sidebarState")
        if (stored !== null) {
          const isCollapsed = stored === "true"
          setSidebarCollapsed(isCollapsed)

          // Batch DOM updates for better performance
          requestAnimationFrame(() => {
            document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "90px" : "280px")
            document.documentElement.style.setProperty("--sidebar-transition", "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)")

            if (isCollapsed) {
              document.body.classList.add("sidebar-collapsed")
            } else {
              document.body.classList.remove("sidebar-collapsed")
            }
          })
        }
      }, 50),
    [],
  )

  // Optimized form field updaters with batched state updates
  const updateFormField = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined }, // Clear field error
    }))
  }, [])

  // Optimized UI state updaters
  const updateUIState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Optimized event handlers with better performance
  const handleOpenBookingForm = useCallback(() => {
    updateUIState({ isBookingFormOpen: true })
  }, [updateUIState])

  const handleCloseBookingForm = useCallback(() => {
    updateUIState({ isClosingForm: true, weekendPopup: false })
    setTimeout(() => {
      updateUIState({ isBookingFormOpen: false, isClosingForm: false })
    }, 300)
  }, [updateUIState])

  // Highly optimized tooltip handlers with better positioning
  const handleEventMouseEnter = useCallback(
    (info) => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }

      try {
        const { fromPlace, toPlace, travelDate, returnDate, status } = info.event.extendedProps
        const rect = info.el.getBoundingClientRect()

        // Use viewport-relative positioning for better performance
        const containerLeft = sidebarCollapsed ? 90 : 280
        const containerRight = window.innerWidth
        const containerBottom = window.innerHeight

        const tooltipData = {
          visible: true,
          fromPlace: fromPlace || "N/A",
          toPlace: toPlace || "N/A",
          travelDate: travelDate || "",
          returnDate: returnDate || "",
          status: status || "N/A",
        }

        const tooltipWidth = 260
        const tooltipHeight = 150

        // Optimized positioning logic
        let x = rect.left + rect.width / 2 - tooltipWidth / 2
        let y = rect.bottom + 10
        let positionClass = "tooltip-bottom"

        // Boundary checks with performance optimizations
        if (x < containerLeft + 10) x = containerLeft + 10
        if (x + tooltipWidth > containerRight - 10) x = containerRight - tooltipWidth - 10
        if (y + tooltipHeight > containerBottom - 10) {
          y = rect.top - tooltipHeight - 10
          positionClass = "tooltip-top"
        }

        setTooltip({
          ...tooltipData,
          x,
          y,
          positionClass,
        })
      } catch (error) {
        console.warn("Tooltip error:", error)
      }
    },
    [sidebarCollapsed],
  )

  const handleEventMouseLeave = useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }))
    }, CONSTANTS.TOOLTIP_DELAY)
  }, [CONSTANTS.TOOLTIP_DELAY])

  // Performance optimized fetch with better caching and error handling
  const fetchBookings = useCallback(async () => {
    if (fetchInProgress.current) return

    const now = Date.now()
    if (now - lastFetchTime.current < CONSTANTS.MIN_FETCH_INTERVAL) return

    try {
      fetchInProgress.current = true
      lastFetchTime.current = now

      // Only show loading for initial load
      if (events.length === 0) {
        updateUIState({ loading: true })
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const bookingsData = await authRequest("get", "http://10.70.4.34:5003/api/busBookings", null, {
        signal: abortControllerRef.current.signal,
      })

      // Optimized event mapping with better performance and error handling
      const mappedEvents = (bookingsData || [])
        .map((b) => {
          try {
            const backgroundColor = b.status === "APPROVED" ? "#10b981" : b.status === "PENDING" ? "#f59e0b" : "#ef4444"
            return {
              id: String(b.id), // Ensure ID is string for FullCalendar
              title: `${b.status} - ${b.forWho}`,
              start: b.travelDate || b.date,
              backgroundColor,
              textColor: "#fff",
              extendedProps: {
                fromPlace: b.fromPlace || "",
                toPlace: b.toPlace || "",
                travelDate: b.travelDate || b.date || "",
                returnDate: b.ReturnDate || b.enddate || "",
                status: b.status || "UNKNOWN",
              },
            }
          } catch (error) {
            console.warn("Error mapping event:", error, b)
            return null
          }
        })
        .filter(Boolean) // Remove null events

      setEvents(mappedEvents)
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching bus bookings:", error)
      }
    } finally {
      fetchInProgress.current = false
      updateUIState({ loading: false })
    }
  }, [events.length, CONSTANTS.MIN_FETCH_INTERVAL, updateUIState])

  // Optimized booking submission with better error handling
  const handleBooking = useCallback(async () => {
    if (!validateForm()) return

    try {
      const { travelDate, returnDate, fromPlace, toPlace, forWho, ContactNo } = formState
      const formattedTravelDate = new Date(travelDate).toISOString().split("T")[0]
      const formattedReturnDate = new Date(returnDate).toISOString().split("T")[0]

      const response = await authRequest("post", "http://10.70.4.34:5003/api/busBookings", {
        user_id: user.id,
        fromPlace,
        toPlace,
        travelDate: formattedTravelDate,
        returnDate: formattedReturnDate,
        forWho,
        ContactNo,
      })

      if (response.success) {
        updateFormField("message", "Booking request sent!")
        fetchBookings()
        updateUIState({ showPopup: true })

        setTimeout(() => updateUIState({ showPopup: false }), 3000)

        // Reset form with better performance
        setFormState({
          fromPlace: "Colombo",
          toPlace: "",
          travelDate: "",
          returnDate: "",
          forWho: "",
          ContactNo: "",
          message: "",
          errors: {},
        })

        handleCloseBookingForm()
      } else {
        updateFormField("message", response.error || "Failed to send booking request.")
      }
    } catch (error) {
      console.error("Error creating bus booking:", error)
      updateFormField("message", error.response?.data?.error || "Failed to send booking request.")
    }
  }, [validateForm, formState, user.id, fetchBookings, updateFormField, updateUIState, handleCloseBookingForm])

  // Highly optimized calendar resize with ResizeObserver
  const resizeCalendar = useCallback(() => {
    if (calendarRef.current) {
      try {
        const calendarApi = calendarRef.current.getApi()
        requestAnimationFrame(() => {
          calendarApi.updateSize()
        })
      } catch (error) {
        console.warn("Calendar resize error:", error)
      }
    }
  }, [])

  const debouncedResizeCalendar = useMemo(
    () => debounce(resizeCalendar, CONSTANTS.RESIZE_DEBOUNCE_DELAY),
    [resizeCalendar, CONSTANTS.RESIZE_DEBOUNCE_DELAY],
  )

  // Optimized date click handler
  const handleDateClick = useCallback(
    (info) => {
      try {
        const clickedDate = info.dateStr
        updateFormField("travelDate", clickedDate)

        const nextDay = new Date(clickedDate)
        nextDay.setDate(nextDay.getDate() + 1)
        updateFormField("returnDate", nextDay.toISOString().split("T")[0])

        updateUIState({ isBookingFormOpen: true })
      } catch (error) {
        console.warn("Date click error:", error)
      }
    },
    [updateFormField, updateUIState],
  )

  // Highly optimized booking button addition with virtual DOM approach
  const addBookingButtons = useCallback(() => {
    if (!calendarRef.current) return

    try {
      // Use requestIdleCallback for non-critical DOM updates
      const addButtonsTask = () => {
        try {
          // Remove existing buttons in batch
          const existingButtons = document.querySelectorAll(".calendar-day-book-button")
          existingButtons.forEach((el) => el.remove())

          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const cells = document.querySelectorAll(".fc-daygrid-day")

          cells.forEach((cell) => {
            const dateAttr = cell.getAttribute("data-date")
            if (!dateAttr) return

            const cellDate = new Date(dateAttr)
            if (cellDate < today) return

            const buttonContainer = document.createElement("div")
            buttonContainer.className =
              "calendar-day-book-button absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity"

            const button = document.createElement("button")
            button.innerHTML = "+"
            button.className =
              "w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xs hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
            button.title = "Book this day"
            button.onclick = (e) => {
              e.stopPropagation()
              updateFormField("travelDate", dateAttr)
              const nextDay = new Date(dateAttr)
              nextDay.setDate(nextDay.getDate() + 1)
              updateFormField("returnDate", nextDay.toISOString().split("T")[0])
              updateUIState({ isBookingFormOpen: true })
            }

            buttonContainer.appendChild(button)
            cell.appendChild(buttonContainer)
          })
        } catch (error) {
          console.warn("Button addition error:", error)
        }
      }

      if (window.requestIdleCallback) {
        window.requestIdleCallback(addButtonsTask)
      } else {
        setTimeout(addButtonsTask, 0)
      }
    } catch (error) {
      console.warn("Add booking buttons error:", error)
    }
  }, [updateFormField, updateUIState])

  // Debounced button addition
  const debouncedAddBookingButtons = useMemo(
    () => debounce(addBookingButtons, CONSTANTS.BUTTON_ADDITION_DELAY),
    [addBookingButtons, CONSTANTS.BUTTON_ADDITION_DELAY],
  )

  // Optimized statistics with better memoization
  const stats = useMemo(() => {
    const total = events.length
    const approved = events.filter((e) => e.extendedProps.status === "APPROVED").length
    const pending = events.filter((e) => e.extendedProps.status === "PENDING").length
    const denied = events.filter((e) => e.extendedProps.status === "DENIED").length
    return { total, approved, pending, denied }
  }, [events])

  // Optimized event click handler
  const handleEventClick = useCallback(
    (info) => {
      try {
        localStorage.setItem("highlightBookingId", info.event.id)

        window.dispatchEvent(
          new CustomEvent("navigate-to-bookings", {
            detail: {
              bookingId: Number(info.event.id),
              highlight: true,
            },
          }),
        )

        navigate("/busbookings", {
          state: {
            highlightId: Number(info.event.id),
            sidebarState: sidebarCollapsed,
          },
          replace: true,
        })
      } catch (error) {
        console.warn("Event click error:", error)
      }
    },
    [navigate, sidebarCollapsed],
  )

  // Performance optimized useEffect hooks
  useEffect(() => {
    debouncedSyncSidebarState()

    const handleSidebarToggle = (e) => {
      const isCollapsed = e.detail.isCollapsed
      setSidebarCollapsed(isCollapsed)
      localStorage.setItem("sidebarState", isCollapsed.toString())

      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "90px" : "280px")
        document.body.classList.toggle("sidebar-collapsed", isCollapsed)
      })
    }

    const handleSidebarHover = (e) => {
      const isHovered = e.detail.isHovered
      if (sidebarCollapsed) {
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--sidebar-width", isHovered ? "280px" : "90px")
        })
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("sidebarHover", handleSidebarHover)
    window.addEventListener("popstate", debouncedSyncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("sidebarHover", handleSidebarHover)
      window.removeEventListener("popstate", debouncedSyncSidebarState)
      debouncedSyncSidebarState.cancel()
    }
  }, [sidebarCollapsed, debouncedSyncSidebarState])

  // Weekend popup optimization
  useEffect(() => {
    const { travelDate, returnDate } = formState
    const shouldShowWeekendPopup = (travelDate && !isWeekend(travelDate)) || (returnDate && !isWeekend(returnDate))
    updateUIState({ weekendPopup: shouldShowWeekendPopup })
  }, [formState, isWeekend, updateUIState])

  // Optimized data fetching with better intervals
  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 30000)
    return () => {
      clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchBookings])

  // Optimized resize handling with ResizeObserver
  useEffect(() => {
    if (!resizeObserverRef.current && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(debouncedResizeCalendar)
    }

    const calendarElement = calendarRef.current?.getApi()?.el
    if (calendarElement && resizeObserverRef.current) {
      resizeObserverRef.current.observe(calendarElement)
    }

    // Fallback for older browsers
    window.addEventListener("resize", debouncedResizeCalendar)

    return () => {
      window.removeEventListener("resize", debouncedResizeCalendar)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      debouncedResizeCalendar.cancel()
    }
  }, [sidebarCollapsed, debouncedResizeCalendar])

  // Optimized calendar button management
  useEffect(() => {
    if (calendarButtonsTimeoutRef.current) {
      clearTimeout(calendarButtonsTimeoutRef.current)
    }
    calendarButtonsTimeoutRef.current = setTimeout(debouncedAddBookingButtons, CONSTANTS.BUTTON_ADDITION_DELAY)

    return () => {
      if (calendarButtonsTimeoutRef.current) {
        clearTimeout(calendarButtonsTimeoutRef.current)
      }
    }
  }, [debouncedAddBookingButtons, CONSTANTS.BUTTON_ADDITION_DELAY])

  useEffect(() => {
    if (events.length > 0) {
      debouncedAddBookingButtons()
    }
  }, [events, debouncedAddBookingButtons])

  useEffect(() => {
    if (!calendarRef.current) return

    try {
      const calendarApi = calendarRef.current.getApi()
      const handleViewDidMount = () => {
        setTimeout(debouncedAddBookingButtons, 100)
      }

      calendarApi.on("viewDidMount", handleViewDidMount)
      return () => {
        calendarApi.off("viewDidMount", handleViewDidMount)
      }
    } catch (error) {
      console.warn("Calendar API error:", error)
    }
  }, [debouncedAddBookingButtons])

  // Cleanup optimization
  useEffect(() => {
    return () => {
      // Clear all timeouts
      ;[tooltipTimeoutRef, formValidationTimeoutRef, calendarButtonsTimeoutRef].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current)
        }
      })

      // Cancel all debounced functions
      ;[debouncedSyncSidebarState, debouncedResizeCalendar, debouncedAddBookingButtons, debouncedValidateForm].forEach(
        (fn) => {
          if (fn && fn.cancel) {
            fn.cancel()
          }
        },
      )
    }
  }, [debouncedSyncSidebarState, debouncedResizeCalendar, debouncedAddBookingButtons, debouncedValidateForm])

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition calendar-container`}
      style={{
        paddingLeft: sidebarCollapsed ? "50px" : "50px",
      }}
    >
      {uiState.loading && events.length === 0 && (
        <div className="fixed inset-0 z-50">
          <Suspense fallback={<div>Loading...</div>}>
            <LoadingScreen message="Loading bus calendar..." />
          </Suspense>
        </div>
      )}

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0e7ff' fillOpacity='0.4'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        ></div>
      </div>

      <div className="relative z-10 p-4 xl:p-6 space-y-6 xl:space-y-8">
        {/* Weekend notification */}
        {uiState.weekendPopup && uiState.isBookingFormOpen && (
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-xl backdrop-blur-xl">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-semibold">
              Bus service is available only on weekends
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Booking Form Modal */}
        <Dialog
          open={uiState.isBookingFormOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseBookingForm()
          }}
        >
          <DialogContent className="max-w-md mt-8 rounded-t-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
            <DialogHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl -m-6 mb-4 p-6">
              <DialogTitle className="flex items-center gap-3 text-xl font-black">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bus className="w-6 h-6" />
                </div>
                Reserve Bus Service
              </DialogTitle>
              <button
                onClick={handleCloseBookingForm}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Close dialog"
              >

              </button>
            </DialogHeader>
            <div className="space-y-6 p-2">
              {/* Enhanced User info */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-slate-200/50 shadow-lg">
                <img
                  src={user?.photo || defaultUserImage}
                  alt="User"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-900">{user?.name || "User"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>{user?.phone || "No phone provided"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="passenger" className="text-sm font-black text-slate-700">
                  Passenger Name
                </Label>
                <Input
                  id="passenger"
                  value={formState.forWho}
                  onChange={(e) => updateFormField("forWho", e.target.value)}
                  placeholder="Enter passenger name"
                  className={`h-12 border-2 ${formState.errors.forWho ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                />
                {formState.errors.forWho && (
                  <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.forWho}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contact" className="text-sm font-black text-slate-700">
                  Contact Information
                </Label>
                <Input
                  id="contact"
                  value={formState.ContactNo}
                  onChange={(e) => updateFormField("ContactNo", e.target.value)}
                  placeholder="Enter phone number or email"
                  className={`h-12 border-2 ${formState.errors.contactNo ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                />
                {formState.errors.contactNo && (
                  <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.contactNo}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="travel-date" className="text-sm font-black text-slate-700">
                    Travel Date
                  </Label>
                  <Input
                    id="travel-date"
                    type="date"
                    value={formState.travelDate}
                    onChange={(e) => updateFormField("travelDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`h-12 border-2 ${formState.errors.travelDate ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                  />
                  {formState.errors.travelDate && (
                    <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.travelDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="return-date" className="text-sm font-black text-slate-700">
                    Return Date
                  </Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={formState.returnDate}
                    onChange={(e) => updateFormField("returnDate", e.target.value)}
                    min={formState.travelDate || new Date().toISOString().split("T")[0]}
                    className={`h-12 border-2 ${formState.errors.returnDate ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                  />
                  {formState.errors.returnDate && (
                    <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.returnDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from" className="text-sm font-black text-slate-700">
                    From
                  </Label>
                  <Select value={formState.fromPlace} onValueChange={(value) => updateFormField("fromPlace", value)}>
                    <SelectTrigger
                      className={`h-12 border-2 ${formState.errors.fromPlace ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Colombo">Colombo</SelectItem>
                    </SelectContent>
                  </Select>
                  {formState.errors.fromPlace && (
                    <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.fromPlace}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="to" className="text-sm font-black text-slate-700">
                    To
                  </Label>
                  <Input
                    id="to"
                    value={formState.toPlace}
                    onChange={(e) => updateFormField("toPlace", e.target.value)}
                    placeholder="Travel Destination"
                    className={`h-12 border-2 ${formState.errors.toPlace ? "border-red-300" : "border-slate-200"} focus:border-blue-500 rounded-xl bg-gradient-to-r from-white to-blue-50 shadow-lg font-semibold`}
                  />
                  {formState.errors.toPlace && (
                    <p className="text-sm text-red-600 mt-1 font-bold">{formState.errors.toPlace}</p>
                  )}
                </div>
              </div>

              <Button
                className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-2xl shadow-xl font-black text-lg transform hover:scale-105 transition-all duration-300"
                onClick={handleBooking}
              >
                <Send className="w-5 h-5 mr-3" />
                <Sparkles className="w-4 w-4 mr-2" />
                Submit Booking
              </Button>

              {formState.message && (
                <div className="flex items-center gap-3 text-sm text-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-lg">
                  <Check className="w-5 h-5" />
                  <span className="font-bold">{formState.message}</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Success popup */}
        {uiState.showPopup && (
          <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right border border-white/20 backdrop-blur-xl">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-lg">Booking Created!</p>
              <p className="text-emerald-100 text-sm">Your bus reservation has been submitted</p>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <Bus className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Bus Reservation
              </h1>
              <p className="text-slate-600 text-xl font-bold mt-2">Schedule and manage bus bookings</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white h-14 px-8 rounded-2xl shadow-xl font-black text-lg transform hover:scale-105 transition-all duration-300"
            onClick={handleOpenBookingForm}
          >
            <Plus className="w-5 h-5 mr-3" />
            <Sparkles className="w-4 w-4 mr-2" />
            New Reservation
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Bookings" value={stats.total} icon={Bus} color="blue" />
          <StatCard title="Approved" value={stats.approved} icon={Check} color="green" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
          <StatCard title="Available Days" value="Weekends" icon={Calendar} color="blue" />
        </div>

        {/* Enhanced Calendar with Error Boundary */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-100 rounded-t-2xl">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2>Booking Calendar</h2>
                <p className="text-base font-normal text-slate-600 mt-1">Click on any date to create a booking</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="calendar-container">
              <CalendarErrorBoundary>
                <Suspense fallback={<CalendarLoadingFallback />}>
                  <CalendarWrapper
                    calendarRef={calendarRef}
                    events={events}
                    handleEventClick={handleEventClick}
                    handleEventMouseEnter={handleEventMouseEnter}
                    handleEventMouseLeave={handleEventMouseLeave}
                    handleDateClick={handleDateClick}
                    debouncedAddBookingButtons={debouncedAddBookingButtons}
                  />
                </Suspense>
              </CalendarErrorBoundary>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Legend */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg"></div>
                <span className="text-sm text-slate-700 font-bold">Approved</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg"></div>
                <span className="text-sm text-slate-700 font-bold">Pending</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-500 to-red-500 shadow-lg"></div>
                <span className="text-sm text-slate-700 font-bold">Denied</span>
              </div>
              <div className="flex items-center gap-3">
                <Bus className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-slate-700 font-bold">Weekend (Available)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced tooltip */}
        {tooltip.visible && (
          <div
            className={`fixed z-50 bg-white/98 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-6 max-w-xs ${tooltip.positionClass}`}
            style={{
              top: tooltip.y,
              left: tooltip.x,
            }}
          >
            <div className="font-black text-slate-900 mb-4 flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Bus className="w-5 h-5 text-white" />
              </div>
              Bus Booking Details
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600 font-semibold">Route:</span>
                <span className="font-black text-slate-900">
                  {tooltip.fromPlace} <ArrowRight className="w-3 h-3 inline" /> {tooltip.toPlace}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600 font-semibold">Travel:</span>
                <span className="font-black text-slate-900">
                  {tooltip.travelDate} to {tooltip.returnDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    tooltip.status === "APPROVED"
                      ? "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-200/50"
                      : tooltip.status === "PENDING"
                        ? "bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border-amber-300 shadow-amber-200/50"
                        : "bg-gradient-to-r from-rose-100 via-red-100 to-pink-100 text-rose-800 border-rose-300 shadow-rose-200/50"
                  }
                >
                  {tooltip.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusCalendarFull
