"use client"

import React, { useState, useEffect, useCallback, useMemo, memo, Suspense } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { getApiUrl } from "../../utils/apiUrl"
import {
  CalendarIcon,
  Clock,
  Plus,
  Search,
  X,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Star,
  Sparkles,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import LoadingScreen from "../LoadingScreen/LoadingScreen"
import defaultUserImage from "./styles/profile-user.png"
import ReactSelect from "react-select"
import CreatableSelect from "react-select/creatable"
import {
  groupedCourseOptions,
  dayOptions,
  generateTimeOptions,
  classroomOptions,
  classroomsAllowingMultipleBookings,
} from "./aidUtils"
import { FaUser, FaPhone, FaPaperPlane } from "react-icons/fa"

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ClassroomCalendar Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-full mb-6 shadow-xl mx-auto w-fit">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">Something went wrong</h2>
              <p className="text-slate-600 mb-6">The classroom calendar encountered an unexpected error.</p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                  window.location.reload()
                }}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 px-6 py-3 rounded-xl shadow-xl font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Memoized Success Popup Component
const EnhancedSuccessPopup = memo(({ message, onClose }) => {
  return (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">{message}</p>
          <p className="text-emerald-100 text-xs">Check your calendar for updates</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-xl ml-2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})

EnhancedSuccessPopup.displayName = "EnhancedSuccessPopup"

// Enhanced Event Card Component
const EnhancedEventCard = memo(({ event, onEventClick, formatTime, getEventDuration, getWeekday }) => {
  const handleClick = useCallback(() => {
    onEventClick(event.calendar_id)
  }, [onEventClick, event.calendar_id])

  return (
    <div
      className="group bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-blue-300 overflow-hidden relative"
      onClick={handleClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Enhanced Date Badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-18 h-18 text-white rounded-2xl shadow-xl transform group-hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
            <span className="text-2xl font-black">{event.date_from?.split("-")[2] || "00"}</span>
            <span className="text-xs uppercase tracking-wider font-bold opacity-90">
              {getWeekday(event.date_from || new Date().toISOString().split("T")[0]).slice(0, 3)}
            </span>
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors duration-300 leading-tight">
                {event.course_name || event.calendar_course || "Classroom Booking"}
              </h3>
              <Badge className="bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-300 px-3 py-1 text-xs font-bold shadow-sm border whitespace-nowrap">
                Scheduled
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-semibold">
                  {formatTime(event.time_from)} • {getEventDuration(event.time_from, event.time_to)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-semibold">{event.classes_allocated || "TBD"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

EnhancedEventCard.displayName = "EnhancedEventCard"

// Add debounce utility
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Main Component wrapped in Error Boundary
function ClassroomCalendarInner({ user = { id: 1, name: "Demo User" } }) {
  // ✅ Form state
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [timeFrom, setTimeFrom] = useState("")
  const [timeTo, setTimeTo] = useState("")
  const [courseName, setCourseName] = useState(null)
  const [requestId, setRequestId] = useState("")
  const [preferredDays, setPreferredDays] = useState([])
  const [classesAllocated, setClassesAllocated] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [message, setMessage] = useState("")
  const [noOfParticipants, setNoOfParticipants] = useState(null)
  const [examOrNot, setExamOrNot] = useState("")
  const [classroomsRequested, setClassroomsRequested] = useState([])
  const [events, setEvents] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableClassroomOptions, setAvailableClassroomOptions] = useState(classroomOptions)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])

  // ✅ Error tracking
  const [errors, setErrors] = useState({})

  // ✅ Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarState")
      return stored !== null ? stored === "true" : false
    }
    return false
  })

  const [hasLoadedDraft, setHasLoadedDraft] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const navigate = useNavigate()

  // Memoized helper functions
  const formatTime = useCallback((timeString) => {
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString
    }
  }, [])

  const getWeekday = useCallback((dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { weekday: "long" })
    } catch (error) {
      console.error("Error getting weekday:", error)
      return "Unknown"
    }
  }, [])

  const getEventDuration = useCallback((start, end) => {
    try {
      if (!end) return "1 hour"
      const [sh, sm] = start.split(":").map(Number)
      const [eh, em] = end.split(":").map(Number)
      let minutes = eh * 60 + em - (sh * 60 + sm)
      if (minutes <= 0) minutes += 24 * 60
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m === 0 ? `${h} hour${h > 1 ? "s" : ""}` : `${h}h ${m}m`
    } catch (error) {
      console.error("Error calculating duration:", error)
      return "1 hour"
    }
  }, [])

  // Generate calendar days for the current month
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (42 = 6 rows of 7 days)
    const totalDays = 42

    const days = []

    // Add days from previous month
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()

    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      days.push({
        date: new Date(year, month - 1, i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    // Add days from current month
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      })
    }

    // Add days from next month
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    setCalendarDays(days)
  }, [currentMonth])

  // Update calendar when month changes
  useEffect(() => {
    generateCalendarDays()
  }, [currentMonth, generateCalendarDays])

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("classroomBookingDraft")
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        setCourseName(draft.courseName || null)
        setRequestId(draft.requestId || "")
        setDateFrom(draft.dateFrom || "")
        setDateTo(draft.dateTo || "")
        setTimeFrom(draft.timeFrom || "")
        setTimeTo(draft.timeTo || "")
        setPreferredDays(draft.preferredDays || [])
        setClassesAllocated(draft.classesAllocated || [])
        setNoOfParticipants(draft.noOfParticipants || null)
        setExamOrNot(draft.examOrNot || "")
        setClassroomsRequested(draft.classroomsRequested || [])
        setDraftRestored(true)
        console.log("✅ Restored classroom booking draft:", draft)
      } catch (err) {
        console.error("❌ Failed to parse saved draft:", err)
      }
    }
    setHasLoadedDraft(true)
  }, [])

  // Save draft to localStorage
  useEffect(() => {
    if (hasLoadedDraft) {
      const draft = {
        courseName,
        requestId,
        dateFrom,
        dateTo,
        timeFrom,
        timeTo,
        preferredDays,
        classesAllocated,
        noOfParticipants,
        examOrNot,
        classroomsRequested,
      }
      localStorage.setItem("classroomBookingDraft", JSON.stringify(draft))
    }
  }, [
    courseName,
    requestId,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    preferredDays,
    classesAllocated,
    noOfParticipants,
    examOrNot,
    classroomsRequested,
    hasLoadedDraft,
  ])

  // Fetch aid request by ID
  useEffect(() => {
    const fetchAidRequestById = async (id) => {
      if (draftRestored) {
        console.log("⏸️ Skipping fetch — form restored from draft")
        return
      }

      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(getApiUrl(`/aidrequests/approved/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success) {
          const data = response.data.data
          setCourseName({ label: data.course_name, value: data.course_name })
          setDateFrom(data.date_from || "")
          setDateTo(data.date_to || "")
          setTimeFrom(data.time_from || "")
          setTimeTo(data.time_to || "")
          setPreferredDays(data.preferred_days_of_week?.split(",").map((d) => d.trim()) || [])
          setClassesAllocated(data.classes_allocated?.split(",").map((c) => c.trim()) || [])
          setNoOfParticipants(data.no_of_participants || null)
          setExamOrNot(data.exam_or_not || "")
          setClassroomsRequested(data.classrooms_allocated?.split(",").map((c) => c.trim()) || [])
          console.log("✅ Fetched data for request ID", id, data)
        }
      } catch (err) {
        console.error("❌ Failed to fetch aid request:", err)
      }
    }

    if (requestId && !draftRestored) {
      fetchAidRequestById(requestId)
    }
  }, [requestId, draftRestored])

  // Filter available classrooms based on booking conflicts
  useEffect(() => {
    const fetchAndFilterAvailableClassrooms = async () => {
      if (!dateFrom || !dateTo || !timeFrom || !timeTo || preferredDays.length === 0) return

      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(getApiUrl("/classroom-calendar/details"), {
          headers: { Authorization: `Bearer ${token}` },
        })

        const bookings = response.data?.data || []
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

        const selectedDates = []
        for (let d = new Date(dateFrom); d <= new Date(dateTo); d.setDate(d.getDate() + 1)) {
          const current = new Date(d)
          const dow = dayMap[current.getDay()]
          if (preferredDays.includes(dow)) {
            selectedDates.push(current.toISOString().split("T")[0])
          }
        }

        const unavailableClassrooms = new Set()

        bookings.forEach((b) => {
          const effectiveDates = b.effective_dates || []

          effectiveDates.forEach((date) => {
            if (selectedDates.includes(date)) {
              if (isTimeOverlap(timeFrom, timeTo, b.time_from, b.time_to)) {
                const booked = extractClassroomIds(b.classes_allocated || "")
                booked.forEach((c) => {
                  if (!classroomsAllowingMultipleBookings.includes(c)) {
                    unavailableClassrooms.add(c)
                  }
                })
              }
            }
          })
        })

        const availableOptions = classroomOptions.filter((opt) => !unavailableClassrooms.has(opt.value))
        setAvailableClassroomOptions(availableOptions)
      } catch (err) {
        console.error("❌ Error checking available classrooms:", err)
      }
    }

    fetchAndFilterAvailableClassrooms()
  }, [dateFrom, dateTo, timeFrom, timeTo, preferredDays])

  const isTimeOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB
  }

  const extractClassroomIds = (str) => {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Sync sidebar state
  useEffect(() => {
    const debouncedSyncSidebarState = debounce(() => {
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("sidebarState")
          if (stored !== null) {
            setSidebarCollapsed(stored === "true")
          }
        }
      } catch (error) {
        console.error("Error syncing sidebar state:", error)
      }
    }, 50)

    debouncedSyncSidebarState()

    const handleSidebarToggle = (e) => {
      try {
        setSidebarCollapsed(e.detail.isCollapsed)
        localStorage.setItem("sidebarState", e.detail.isCollapsed.toString())
      } catch (error) {
        console.error("Error handling sidebar toggle:", error)
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("popstate", debouncedSyncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", debouncedSyncSidebarState)
    }
  }, [])

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {}
    const today = new Date().setHours(0, 0, 0, 0)
    const start = new Date(dateFrom).setHours(0, 0, 0, 0)
    const end = new Date(dateTo).setHours(0, 0, 0, 0)

    if (!dateFrom) newErrors.dateFrom = "Start date is required"
    if (!dateTo) newErrors.dateTo = "End date is required"
    else if (end < today) newErrors.dateTo = "End date cannot be in the past"
    else if (end < start) newErrors.dateTo = "End date must be after start date"

    if (!timeFrom) newErrors.timeFrom = "Start time is required"
    if (!timeTo) newErrors.timeTo = "End time is required"
    else if (timeFrom && timeTo && timeTo <= timeFrom) newErrors.timeTo = "End time must be after start time"

    if (!courseName || !courseName.value) {
      newErrors.courseName = "Course name is required"
    }
    if (classesAllocated.length === 0) {
      newErrors.classroomsAllocated = "Please select at least one classroom."
    }
    if (preferredDays.length === 0) newErrors.preferredDays = "At least one day must be selected"

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        setErrors({})
      }, 5000)
    }
    return Object.keys(newErrors).length === 0
  }

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(getApiUrl("/classroom-calendar/details"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      const bookings = response.data?.data || []
      const mappedEvents = []

      bookings.forEach((b) => {
        const dates = b.effective_dates || []
        dates.forEach((dateStr) => {
          mappedEvents.push({
            id: `${b.calendar_id}-${dateStr}`,
            title: b.course_name || b.calendar_course,
            start: `${dateStr}T${b.time_from}`,
            end: `${dateStr}T${b.time_to}`,
            date: dateStr,
            extendedProps: {
              courseName: b.course_name || b.calendar_course,
              classesAllocated: b.classes_allocated,
              status: "Scheduled",
            },
          })
        })
      })

      setEvents(mappedEvents)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError("Failed to load calendar events. Please try again.")
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }
  }, [])

  // Initial fetch and polling setup
  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 30000)
    return () => clearInterval(interval)
  }, [fetchBookings])

  // ✅ Submit form
  const handleBooking = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setMessage("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        getApiUrl("/classroom-calendar"),
        {
          user_id: user.id,
          request_id: requestId || null,
          date_from: dateFrom,
          date_to: dateTo,
          time_from: timeFrom,
          time_to: timeTo,
          course_name: (courseName?.value || courseName) + (examOrNot?.toLowerCase() === "yes" ? " Exam" : ""),
          preferred_days_of_week: preferredDays.join(", "),
          classes_allocated: classesAllocated.join(", "),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.data.success) {
        setMessage("Booking created successfully!")
        setShowSuccessPopup(true)
        fetchBookings()
        // Reset form
        setDateFrom("")
        setDateTo("")
        setTimeFrom("")
        setTimeTo("")
        setCourseName(null)
        setPreferredDays([])
        setClassesAllocated([])
        setNoOfParticipants(null)
        setExamOrNot("")
        setClassroomsRequested([])
        setRequestId("")
        localStorage.removeItem("classroomBookingDraft")
        setHasLoadedDraft(false)
        setDraftRestored(false)
        setTimeout(() => setShowSuccessPopup(false), 3000)
        setTimeout(() => setMessage(""), 5000)
        setIsBookingFormOpen(false)
      } else {
        setMessage("Failed to create booking.")
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (err) {
      console.error("Error creating booking:", err)
      setMessage("Server error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseChange = (selectedOption) => {
    setCourseName(selectedOption)
  }

  const handlePreferredDaysChange = (selectedOptions) => {
    setPreferredDays(selectedOptions.map((option) => option.value))
  }

  const handleClassroomsChange = (selectedOptions) => {
    setClassesAllocated(selectedOptions.map((option) => option.value))
  }

  const handleOpenBookingForm = useCallback(() => {
    setIsBookingFormOpen(true)
  }, [])

  const handleCloseBookingForm = useCallback(() => {
    setIsBookingFormOpen(false)
  }, [])

  // Calendar navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Check if a date has events
  const hasEvents = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.some((event) => event.date === dateStr)
  }

  // Get events for selected date
  const eventsForSelectedDate = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split("T")[0]
    return events.filter((event) => event.date === selectedDateStr)
  }, [events, selectedDate])

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LoadingScreen message="Loading classroom calendar..." type="calendar" />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition classroom-calendar-container">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30"></div>
      </div>

      <div className="relative z-10 p-4 lg:p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative">
              <div className="p-3 lg:p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <CalendarIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Classroom Reservation
              </h1>
              <p className="text-slate-600 font-semibold text-sm lg:text-base hidden sm:block">
                Manage your classroom bookings and schedule
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 lg:h-12 text-sm lg:text-base border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
              />
            </div>
            <Button
              onClick={handleOpenBookingForm}
              className="flex items-center gap-2 h-10 lg:h-12 px-4 lg:px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold transition-all duration-300 transform hover:scale-105 text-sm lg:text-base"
            >
              <Plus className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">New Booking</span>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Enhanced Calendar Section */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <CardHeader className="pb-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-black text-slate-900">Calendar</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                  >
                    {events.length} total
                  </Badge>
                </div>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-300"
                  >
                    <ChevronLeft className="h-4 w-4 text-blue-600" />
                  </Button>
                  <span className="text-sm font-bold text-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-300"
                  >
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Custom Calendar */}
                <div className="w-full">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, index) => (
                      <div
                        key={day}
                        className="h-10 flex items-center justify-center text-xs font-bold text-slate-600 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-slate-100 first:rounded-l-xl last:rounded-r-xl"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isSelected =
                        selectedDate.getDate() === day.date.getDate() &&
                        selectedDate.getMonth() === day.date.getMonth() &&
                        selectedDate.getFullYear() === day.date.getFullYear()

                      const hasEventsForDay = hasEvents(day.date)

                      return (
                        <button
                          key={index}
                          className={`h-10 flex flex-col items-center justify-center rounded-xl relative transition-all duration-300 transform hover:scale-105 ${
                            !day.isCurrentMonth
                              ? "text-slate-400 hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100"
                              : day.isToday
                                ? "bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 font-bold shadow-md border border-amber-200"
                                : isSelected
                                  ? "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 text-white font-bold shadow-xl"
                                  : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:shadow-md"
                          }`}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <span className="text-sm">{day.date.getDate()}</span>
                          {hasEventsForDay && day.isCurrentMonth && (
                            <div className="absolute bottom-1 w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm animate-pulse"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Enhanced Event Types Legend */}
                <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-600" />
                    Event Types
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm"></div>
                      <span className="text-slate-600 font-medium">Classroom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm"></div>
                      <span className="text-slate-600 font-medium">Available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Events List Section */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <CardHeader className="pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg font-black text-slate-900">
                      Events for {selectedDate.toLocaleDateString()}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 font-bold shadow-sm"
                  >
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {eventsForSelectedDate.length} events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {eventsForSelectedDate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 relative">
                    {/* Enhanced background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="p-8 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 rounded-full mb-6 shadow-2xl animate-pulse">
                        <CalendarIcon className="h-16 w-16 text-slate-400" />
                      </div>
                      <p className="text-xl font-black mb-2 text-slate-700 bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                        No events for this date
                      </p>
                      <p className="text-sm text-slate-400 text-center mb-6 max-w-xs">
                        Select a different date or create a new booking to get started
                      </p>
                      <Button
                        onClick={handleOpenBookingForm}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <Sparkles className="h-3 w-3 mr-1" />
                        Create Booking
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {eventsForSelectedDate.map((event) => {
                      const bookingData = {
                        calendar_id: event.id.split("-")[0],
                        course_name: event.title,
                        date_from: event.date,
                        time_from: event.start?.split("T")[1]?.substring(0, 5),
                        time_to: event.end?.split("T")[1]?.substring(0, 5),
                        classes_allocated: event.extendedProps.classesAllocated,
                        preferred_days_of_week: "Multiple days",
                      }

                      return (
                        <EnhancedEventCard
                          key={event.id}
                          event={bookingData}
                          onEventClick={(id) => {
                            navigate("/calendarbookingtable", {
                              state: {
                                highlightId: Number(id),
                                sidebarState: sidebarCollapsed,
                              },
                            })
                          }}
                          formatTime={formatTime}
                          getEventDuration={getEventDuration}
                          getWeekday={getWeekday}
                        />
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Booking Form Modal */}
      <Dialog open={isBookingFormOpen} onOpenChange={setIsBookingFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <DialogHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl -m-6 mb-4 p-4">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Reserve Classroom
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-2">
            {error && (
              <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 font-semibold text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced User info */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-3 border border-slate-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg border-2 border-white">
                  <img src={user?.photo || defaultUserImage} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <FaUser className="h-3 w-3 text-blue-600" />
                    <span className="text-slate-900 truncate">{user?.name || "User"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <FaPhone className="h-3 w-3 text-blue-600" />
                    <span className="truncate">{user?.phone || "No phone"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Form Fields */}
            <div className="space-y-3">
              {/* Course Name */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Course Name *</Label>
                <CreatableSelect
                  isClearable
                  value={courseName}
                  onChange={handleCourseChange}
                  options={groupedCourseOptions}
                  placeholder="Select or create course"
                  isSearchable
                  className={errors.courseName ? "error" : ""}
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      fontSize: "14px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }),
                  }}
                />
                {errors.courseName && <div className="text-red-600 text-xs font-semibold">{errors.courseName}</div>}
              </div>

              {/* Request ID */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Request ID (Optional)</Label>
                <Input
                  type="text"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="h-9 text-sm border border-slate-200 focus:border-blue-500 rounded-xl shadow-sm"
                  placeholder="Enter request ID"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Dates *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`h-9 text-sm border focus:border-blue-500 rounded-xl shadow-sm ${errors.dateFrom ? "border-red-300" : "border-slate-200"}`}
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || new Date().toISOString().split("T")[0]}
                    className={`h-9 text-sm border focus:border-blue-500 rounded-xl shadow-sm ${errors.dateTo ? "border-red-300" : "border-slate-200"}`}
                    disabled={!dateFrom}
                  />
                </div>
                {(errors.dateFrom || errors.dateTo) && (
                  <div className="text-red-600 text-xs font-semibold">{errors.dateFrom || errors.dateTo}</div>
                )}
              </div>

              {/* Time Range */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Time *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={timeFrom} onValueChange={setTimeFrom}>
                    <SelectTrigger
                      className={`h-9 text-sm border focus:border-blue-500 rounded-xl shadow-sm ${errors.timeFrom ? "border-red-300" : "border-slate-200"}`}
                    >
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions().map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timeTo} onValueChange={setTimeTo} disabled={!timeFrom}>
                    <SelectTrigger
                      className={`h-9 text-sm border focus:border-blue-500 rounded-xl shadow-sm ${errors.timeTo ? "border-red-300" : "border-slate-200"}`}
                    >
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions()
                        .filter((time) => !timeFrom || time.value > timeFrom)
                        .map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {(errors.timeFrom || errors.timeTo) && (
                  <div className="text-red-600 text-xs font-semibold">{errors.timeFrom || errors.timeTo}</div>
                )}
              </div>

              {/* Preferred Days */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Preferred Days *</Label>
                <ReactSelect
                  isMulti
                  options={dayOptions}
                  value={dayOptions.filter((option) => preferredDays.includes(option.value))}
                  onChange={handlePreferredDaysChange}
                  placeholder="Select days"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      fontSize: "14px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }),
                  }}
                />
                {errors.preferredDays && (
                  <div className="text-red-600 text-xs font-semibold">{errors.preferredDays}</div>
                )}
              </div>

              {/* Classrooms */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Classrooms *</Label>
                <ReactSelect
                  isMulti
                  options={availableClassroomOptions}
                  value={availableClassroomOptions.filter((option) => classesAllocated.includes(option.value))}
                  onChange={handleClassroomsChange}
                  placeholder="Select classrooms"
                  isDisabled={availableClassroomOptions.length === 0}
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "36px",
                      fontSize: "14px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }),
                  }}
                />
                {availableClassroomOptions.length === 0 && (
                  <p className="text-amber-600 text-xs font-semibold">No classrooms available for selected slot.</p>
                )}
                {errors.classroomsAllocated && (
                  <div className="text-red-600 text-xs font-semibold">{errors.classroomsAllocated}</div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleBooking}
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold transition-all duration-300 text-sm transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <FaPaperPlane className="h-3 w-3 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Clear form?")) {
                      localStorage.removeItem("classroomBookingDraft")
                      setCourseName(null)
                      setRequestId("")
                      setDateFrom("")
                      setDateTo("")
                      setTimeFrom("")
                      setTimeTo("")
                      setPreferredDays([])
                      setClassesAllocated([])
                      setHasLoadedDraft(false)
                      setDraftRestored(false)
                    }
                  }}
                  className="h-10 px-3 border-2 border-slate-200 hover:border-blue-400 rounded-xl font-bold text-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Popup */}
      {showSuccessPopup && <EnhancedSuccessPopup message={message} onClose={() => setShowSuccessPopup(false)} />}
    </div>
  )
}

function ClassroomCalendar(props) {
  return (
    <ErrorBoundary>
      <ClassroomCalendarInner {...props} />
    </ErrorBoundary>
  )
}

export default ClassroomCalendar
