"use client"

import React from "react"
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarDays,
  MoreHorizontal,
  MapPin,
  ExternalLink,
  Sparkles,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import axios from "axios"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

// Types
interface Event {
  id: number
  user_id: number
  description: string
  booking_date: string
  booking_time: string
  bookingendtime?: string
  no_of_people: number
  status?: string
}

interface User {
  id: number
  name?: string
  photo?: string
  phone?: string
}

interface EventCalendarProps {
  user: User
  onLogout: () => void
  onNavigateToBookingDetails?: (bookingId: number) => void
}

type CalendarViewMode = "month" | "week" | "day"

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("EventCalendar Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-full mb-6 shadow-xl mx-auto w-fit">
                  <X className="h-16 w-16 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">Something went wrong</h2>
                <p className="text-slate-600 mb-6">The calendar encountered an unexpected error.</p>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined })
                    window.location.reload()
                  }}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 px-6 py-3 rounded-xl shadow-xl font-bold"
                >
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Memoized Success Popup Component
const SuccessPopup = memo(({ message }: { message: string }) => {
  return (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Check your bookings for updates</p>
        </div>
      </div>
    </div>
  )
})

SuccessPopup.displayName = "SuccessPopup"

// Memoized Event Card Component
const EventCard = memo(
  ({
    event,
    index,
    onEventClick,
    navigateToBookings,
    getStatusColor,
    getStatusLabel,
    formatTime,
    getEventDuration,
    getWeekday,
  }: {
    event: Event
    index: number
    onEventClick: (eventId: number) => void
    navigateToBookings: (bookingId: number) => void
    getStatusColor: (status?: string) => string
    getStatusLabel: (status?: string) => string
    formatTime: (timeString: string) => string
    getEventDuration: (start: string, end?: string) => string
    getWeekday: (dateString: string) => string
  }) => {
    const handleClick = useCallback(() => {
      onEventClick(event.id)
    }, [onEventClick, event.id])

    const handleViewDetails = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        navigateToBookings(event.id)
      },
      [navigateToBookings, event.id],
    )

    return (
      <div
        className="group bg-white/95 backdrop-blur-sm border-2 border-slate-100 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:border-blue-300 hover:bg-gradient-to-br hover:from-white hover:to-blue-50 overflow-hidden relative mb-6"
        onClick={handleClick}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8">
          <Calendar className="w-full h-full text-blue-600" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0 relative z-10">
          {/* Date Section */}
          <div
            className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 text-white rounded-2xl shadow-xl transform group-hover:scale-110 transition-all duration-300 ${
              event.status === "APPROVED"
                ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
                : event.status === "DENIED"
                  ? "bg-gradient-to-br from-rose-500 via-red-500 to-pink-600"
                  : "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600"
            }`}
          >
            <span className="text-lg sm:text-2xl font-black">{event.booking_date.split("-")[2]}</span>
            <span className="text-xs uppercase tracking-wider font-bold opacity-90">
              {getWeekday(event.booking_date).slice(0, 3)}
            </span>
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors duration-300 truncate">
                  {event.description}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-bold whitespace-nowrap">
                      {formatTime(event.booking_time)} • {getEventDuration(event.booking_time, event.bookingendtime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-sm">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-bold whitespace-nowrap">{event.no_of_people} attendees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-sm">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-bold whitespace-nowrap">Main Auditorium</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <Badge
                  className={`${getStatusColor(event.status)} px-4 py-2 text-sm font-black shadow-lg border-2 whitespace-nowrap`}
                >
                  {getStatusLabel(event.status)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105 text-sm whitespace-nowrap font-bold"
                  onClick={handleViewDetails}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

EventCard.displayName = "EventCard"

// Memoized Calendar Day Component
const CalendarDay = memo(
  ({
    date,
    dayEvents,
    isCurrentDay,
    isPast,
    isMobile,
    onQuickBook,
    onCalendarEventHover,
    onCalendarEventMouseMove,
    onCalendarEventMouseLeave,
    onCalendarEventClick,
  }: {
    date: number
    dayEvents: Event[]
    isCurrentDay: boolean
    isPast: boolean
    isMobile: boolean
    onQuickBook: (date: number) => void
    onCalendarEventHover: (event: Event, mouseEvent: React.MouseEvent) => void
    onCalendarEventMouseMove: (event: Event, mouseEvent: React.MouseEvent) => void
    onCalendarEventMouseLeave: () => void
    onCalendarEventClick: (event: Event, mouseEvent: React.MouseEvent) => void
  }) => {
    const handleDayClick = useCallback(() => {
      if (!isPast) {
        onQuickBook(date)
      }
    }, [isPast, onQuickBook, date])

    return (
      <div
        className={`p-2 sm:p-3 h-20 sm:h-24 border-2 rounded-xl cursor-pointer transition-all duration-300 relative group backdrop-blur-sm ${
          isCurrentDay
            ? "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-blue-400 shadow-lg ring-2 ring-blue-300/50"
            : "border-slate-200/60 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:shadow-md bg-white/80"
        } ${isPast && !isCurrentDay ? "opacity-60" : ""}`}
        onClick={handleDayClick}
      >
        <div className={`text-sm font-bold ${isCurrentDay ? "text-blue-700" : "text-slate-700"}`}>{date}</div>
        {dayEvents.length > 0 && (
          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs px-2 py-1 rounded-lg truncate cursor-pointer transition-all duration-200 transform hover:scale-105 backdrop-blur-sm ${
                  event.status === "APPROVED"
                    ? "bg-gradient-to-r from-emerald-200/80 to-green-200/80 text-emerald-800 hover:from-emerald-300/90 hover:to-green-300/90 border border-emerald-300/50 shadow-sm"
                    : event.status === "DENIED"
                      ? "bg-gradient-to-r from-rose-200/80 to-red-200/80 text-rose-800 hover:from-rose-300/90 hover:to-red-300/90 border border-rose-300/50 shadow-sm"
                      : "bg-gradient-to-r from-amber-200/80 to-yellow-200/80 text-amber-800 hover:from-amber-300/90 hover:to-yellow-300/90 border border-amber-300/50 shadow-sm"
                }`}
                onMouseEnter={(e) => onCalendarEventHover(event, e)}
                onMouseMove={(e) => onCalendarEventMouseMove(event, e)}
                onMouseLeave={onCalendarEventMouseLeave}
                onClick={(e) => onCalendarEventClick(event, e)}
              >
                {event.description}
              </div>
            ))}
            {dayEvents.length > (isMobile ? 1 : 2) && (
              <div className="text-xs text-slate-600 font-semibold bg-gradient-to-r from-slate-100 to-blue-100 rounded-lg px-2 py-1 border border-slate-200/50">
                +{dayEvents.length - (isMobile ? 1 : 2)} more
              </div>
            )}
          </div>
        )}
        {!isPast && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </div>
    )
  },
)

CalendarDay.displayName = "CalendarDay"

// Add debounce utility at the top of the file
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Main Component wrapped in Error Boundary
function EventCalendarFullInner({
  user = { id: 1, name: "Demo User" },
  onLogout = () => {},
  onNavigateToBookingDetails = (bookingId: number) => {
    console.log("Navigate to booking details:", bookingId)
  },
}: Partial<EventCalendarProps>) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [events, setEvents] = useState<Event[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingDate, setBookingDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [attendees, setAttendees] = useState(1)
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [error, setError] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [hoveredCalendarEvent, setHoveredCalendarEvent] = useState<Event | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarState")
      return stored !== null ? stored === "true" : false
    }
    return false
  })
  const [isClosingCalendar, setIsClosingCalendar] = useState(false)
  const [isClosingBookingForm, setIsClosingBookingForm] = useState(false)
  const [isBackgroundBlurred, setIsBackgroundBlurred] = useState(false)
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("month")
  const [selectedWeek, setSelectedWeek] = useState<number>(0)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())
  const [isLoading, setIsLoading] = useState(true)

  const calendarRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  // Memoized helper functions
  const getStatusColor = useCallback((status?: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-200/50"
      case "PENDING":
        return "bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border-amber-300 shadow-amber-200/50"
      case "DENIED":
        return "bg-gradient-to-r from-rose-100 via-red-100 to-pink-100 text-rose-800 border-rose-300 shadow-rose-200/50"
      default:
        return "bg-gradient-to-r from-slate-100 via-gray-100 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-200/50"
    }
  }, [])

  const getStatusLabel = useCallback((status?: string): string => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "Approved"
      case "PENDING":
        return "Pending"
      case "DENIED":
        return "Denied"
      default:
        return "Unknown"
    }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }, [])

  const formatTime = useCallback((timeString: string) => {
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

  const getWeekday = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { weekday: "long" })
    } catch (error) {
      console.error("Error getting weekday:", error)
      return "Unknown"
    }
  }, [])

  const getEventDuration = useCallback((start: string, end?: string) => {
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

  // Memoized time slots generation
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      // 8am to 8pm
      slots.push({
        value: `${hour.toString().padStart(2, "0")}:00`,
        display: `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`,
      })
    }
    return slots
  }, [])

  const filteredEndTimeSlots = useMemo(() => {
    return timeSlots.filter((slot) => !startTime || slot.value > startTime)
  }, [timeSlots, startTime])

  // Navigation function to switch to booking page
  const navigateToBookings = useCallback(
    (bookingId?: number) => {
      try {
        if (bookingId) {
          localStorage.setItem("highlightBookingId", bookingId.toString())
        }
        localStorage.setItem("sidebarState", sidebarCollapsed.toString())

        window.dispatchEvent(
          new CustomEvent("navigate-to-bookings", {
            detail: {
              bookingId,
              highlight: !!bookingId,
              sidebarState: sidebarCollapsed,
            },
          }),
        )

        if (typeof window !== "undefined") {
          const bookingPageElement = document.querySelector('[data-page="bookings"]')
          if (bookingPageElement) {
            const calendarPageElement = document.querySelector('[data-page="calendar"]')
            if (calendarPageElement) {
              calendarPageElement.classList.add("hidden")
            }
            bookingPageElement.classList.remove("hidden")

            window.dispatchEvent(
              new CustomEvent("page-switched-to-bookings", {
                detail: { bookingId, highlight: !!bookingId },
              }),
            )
          } else {
            const currentPath = window.location.pathname
            if (!currentPath.includes("/bookings")) {
              window.location.href = "/bookings"
            }
          }
        }

        console.log("Navigating to bookings page with ID:", bookingId)
      } catch (error) {
        console.error("Error navigating to bookings:", error)
      }
    },
    [sidebarCollapsed],
  )

  // Calendar event click handler - redirect to booking details
  const handleCalendarEventClick = useCallback(
    (event: Event, mouseEvent: React.MouseEvent) => {
      try {
        mouseEvent.stopPropagation()
        navigateToBookings(event.id)
      } catch (error) {
        console.error("Error handling calendar event click:", error)
      }
    },
    [navigateToBookings],
  )

  // Add resize listener to detect mobile view
  useEffect(() => {
    const handleResize = (): void => {
      try {
        setIsMobile(window.innerWidth <= 768)
      } catch (error) {
        console.error("Error handling resize:", error)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Sync sidebar state on mount and listen for sidebarToggle events
  useEffect(() => {
    const debouncedSyncSidebarState = debounce((): void => {
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("sidebarState")
          if (stored !== null) {
            setSidebarCollapsed(stored === "true")

            if (stored === "true") {
              document.body.classList.add("sidebar-collapsed")
            } else {
              document.body.classList.remove("sidebar-collapsed")
            }
          }
        }
      } catch (error) {
        console.error("Error syncing sidebar state:", error)
      }
    }, 50)

    debouncedSyncSidebarState()

    const handleSidebarToggle = (e: CustomEvent<{ isCollapsed: boolean }>): void => {
      try {
        setSidebarCollapsed(e.detail.isCollapsed)
        localStorage.setItem("sidebarState", e.detail.isCollapsed.toString())

        if (e.detail.isCollapsed) {
          document.body.classList.add("sidebar-collapsed")
        } else {
          document.body.classList.remove("sidebar-collapsed")
        }
      } catch (error) {
        console.error("Error handling sidebar toggle:", error)
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener)
    window.addEventListener("popstate", debouncedSyncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener)
      window.removeEventListener("popstate", debouncedSyncSidebarState)
    }
  }, [])

  // Fetch events from API
  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")

      const [response] = await Promise.all([
        axios.get<Event[]>("http://localhost:5003/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ])

      const eventsData = Array.isArray(response.data) ? response.data : []
      setEvents(eventsData)
      console.log("Events loaded successfully:", eventsData.length, "events")
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
      setError("Failed to load events. Please try again.")
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 100)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Hide tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      try {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
          setHoveredCalendarEvent(null)
        }
      } catch (error) {
        console.error("Error handling click outside:", error)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Memoized filtered events to prevent unnecessary recalculations
  const { upcomingEvents, pastEvents, filteredUpcomingEvents, filteredPastEvents } = useMemo(() => {
    try {
      const now = new Date()

      const upcoming = events
        .filter((event) => {
          try {
            return new Date(event.booking_date + "T" + event.booking_time) >= now
          } catch {
            return false
          }
        })
        .sort((a, b) => {
          try {
            return (
              new Date(a.booking_date + "T" + a.booking_time).getTime() -
              new Date(b.booking_date + "T" + b.booking_time).getTime()
            )
          } catch {
            return 0
          }
        })

      const past = events.filter((event) => {
        try {
          return new Date(event.booking_date + "T" + event.booking_time) < now
        } catch {
          return false
        }
      })

      const filteredUpcoming = upcoming.filter((event) =>
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      const filteredPast = past.filter((event) => event.description?.toLowerCase().includes(searchQuery.toLowerCase()))

      return {
        upcomingEvents: upcoming,
        pastEvents: past,
        filteredUpcomingEvents: filteredUpcoming,
        filteredPastEvents: filteredPast,
      }
    } catch (error) {
      console.error("Error filtering events:", error)
      return {
        upcomingEvents: [],
        pastEvents: [],
        filteredUpcomingEvents: [],
        filteredPastEvents: [],
      }
    }
  }, [events, searchQuery])

  // Calendar functions
  const getDaysInMonth = useCallback((date: Date) => {
    try {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    } catch (error) {
      console.error("Error getting days in month:", error)
      return 30
    }
  }, [])

  const getFirstDayOfMonth = useCallback((date: Date) => {
    try {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    } catch (error) {
      console.error("Error getting first day of month:", error)
      return 0
    }
  }, [])

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    try {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (direction === "prev") {
          newDate.setMonth(prev.getMonth() - 1)
        } else {
          newDate.setMonth(prev.getMonth() + 1)
        }
        return newDate
      })
    } catch (error) {
      console.error("Error navigating month:", error)
    }
  }, [])

  const navigateWeek = useCallback((direction: "prev" | "next") => {
    try {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (direction === "prev") {
          newDate.setDate(prev.getDate() - 7)
        } else {
          newDate.setDate(prev.getDate() + 7)
        }
        return newDate
      })
    } catch (error) {
      console.error("Error navigating week:", error)
    }
  }, [])

  const navigateDay = useCallback((direction: "prev" | "next") => {
    try {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (direction === "prev") {
          newDate.setDate(prev.getDate() - 1)
        } else {
          newDate.setDate(prev.getDate() + 1)
        }
        return newDate
      })
    } catch (error) {
      console.error("Error navigating day:", error)
    }
  }, [])

  const goToToday = useCallback(() => {
    try {
      setCurrentDate(new Date())
    } catch (error) {
      console.error("Error going to today:", error)
    }
  }, [])

  const getEventsForDate = useCallback(
    (date: number) => {
      try {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`
        return events.filter((event) => event.booking_date === dateStr)
      } catch (error) {
        console.error("Error getting events for date:", error)
        return []
      }
    },
    [events, currentDate],
  )

  // Handle calendar close with animation
  const handleCloseCalendar = useCallback((): void => {
    try {
      setIsClosingCalendar(true)
      setHoveredCalendarEvent(null)
      setTimeout(() => {
        setIsCalendarOpen(false)
        setIsClosingCalendar(false)
      }, 250)
    } catch (error) {
      console.error("Error closing calendar:", error)
    }
  }, [])

  // Updated function to open booking form
  const handleOpenBookingForm = useCallback((): void => {
    try {
      setIsBookingFormOpen(true)
    } catch (error) {
      console.error("Error opening booking form:", error)
    }
  }, [])

  // Updated function to close booking form with animation
  const handleCloseBookingForm = useCallback((): void => {
    try {
      setIsClosingBookingForm(true)
      setTimeout(() => {
        setIsBookingFormOpen(false)
        setIsClosingBookingForm(false)
      }, 250)
    } catch (error) {
      console.error("Error closing booking form:", error)
    }
  }, [])

  // Handle calendar open
  const handleOpenCalendar = useCallback((): void => {
    try {
      setIsCalendarOpen(true)
    } catch (error) {
      console.error("Error opening calendar:", error)
    }
  }, [])

  // Updated function to handle quick booking
  const handleQuickBookClick = useCallback((date: Date, timeSlot?: string) => {
    try {
      // Format date properly without timezone issues
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`

      setBookingDate(formattedDate)

      if (timeSlot) {
        // If a specific time slot is provided, use it
        setStartTime(timeSlot)
        // Set end time to one hour later
        const [hours, minutes] = timeSlot.split(":")
        const startHour = Number.parseInt(hours, 10)
        const endHour = startHour + 1
        const endTimeValue = `${endHour.toString().padStart(2, "0")}:${minutes}`
        setEndTime(endTimeValue)
      } else {
        // Default behavior for month view clicks
        const now = new Date()
        const startHour = Math.max(8, now.getHours()) // Ensure it's at least 8am
        const startTimeValue = `${startHour.toString().padStart(2, "0")}:00`
        const endHour = Math.min(20, startHour + 1) // Ensure it doesn't go past 8pm
        const endTimeValue = `${endHour.toString().padStart(2, "0")}:00`

        setStartTime(startTimeValue)
        setEndTime(endTimeValue)
      }

      setIsCalendarOpen(false)

      setTimeout(() => {
        setIsBookingFormOpen(true)
      }, 100)
    } catch (error) {
      console.error("Error handling quick book click:", error)
    }
  }, [])

  const handleQuickBook = useCallback(
    (date: number) => {
      try {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
        handleQuickBookClick(dateObj)
      } catch (error) {
        console.error("Error handling quick book:", error)
      }
    },
    [currentDate, handleQuickBookClick],
  )

  const updatePopupPosition = useCallback((x: number, y: number) => {
    try {
      requestAnimationFrame(() => {
        setPopupPosition({ x: x + 20, y: y - 10 })
      })
    } catch (error) {
      console.error("Error updating popup position:", error)
    }
  }, [])

  // Handle calendar event hover - only for calendar view
  const handleCalendarEventHover = useCallback(
    (event: Event, mouseEvent: React.MouseEvent) => {
      try {
        setHoveredCalendarEvent(event)
        updatePopupPosition(mouseEvent.clientX, mouseEvent.clientY)
      } catch (error) {
        console.error("Error handling calendar event hover:", error)
      }
    },
    [updatePopupPosition],
  )

  const handleCalendarEventMouseMove = useCallback(
    (event: Event, mouseEvent: React.MouseEvent) => {
      try {
        if (hoveredCalendarEvent?.id === event.id) {
          updatePopupPosition(mouseEvent.clientX, mouseEvent.clientY)
        }
      } catch (error) {
        console.error("Error handling calendar event mouse move:", error)
      }
    },
    [hoveredCalendarEvent?.id, updatePopupPosition],
  )

  const handleCalendarEventMouseLeave = useCallback(() => {
    try {
      setHoveredCalendarEvent(null)
    } catch (error) {
      console.error("Error handling calendar event mouse leave:", error)
    }
  }, [])

  // Memoized calendar rendering functions
  const renderMonthView = useCallback(() => {
    try {
      const today = new Date()

      return (
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-bold text-slate-700 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl border border-slate-200/50 shadow-sm"
            >
              {isMobile ? day.slice(0, 1) : day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
            <div key={`empty-${i}`} className="p-1 h-20 sm:h-24"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
            const date = i + 1
            const dayEvents = getEventsForDate(date)
            const isCurrentDay =
              today.getDate() === date &&
              today.getMonth() === currentDate.getMonth() &&
              today.getFullYear() === currentDate.getFullYear()
            const isPast =
              new Date(currentDate.getFullYear(), currentDate.getMonth(), date) <
              new Date(today.getFullYear(), today.getMonth(), today.getDate())

            return (
              <CalendarDay
                key={date}
                date={date}
                dayEvents={dayEvents}
                isCurrentDay={isCurrentDay}
                isPast={isPast}
                isMobile={isMobile}
                onQuickBook={handleQuickBook}
                onCalendarEventHover={handleCalendarEventHover}
                onCalendarEventMouseMove={handleCalendarEventMouseMove}
                onCalendarEventMouseLeave={handleCalendarEventMouseLeave}
                onCalendarEventClick={handleCalendarEventClick}
              />
            )
          })}
        </div>
      )
    } catch (error) {
      console.error("Error rendering month view:", error)
      return (
        <div className="text-center py-8 text-slate-500">
          <p>Error loading calendar view</p>
        </div>
      )
    }
  }, [
    currentDate,
    isMobile,
    getFirstDayOfMonth,
    getDaysInMonth,
    getEventsForDate,
    handleQuickBook,
    handleCalendarEventHover,
    handleCalendarEventMouseMove,
    handleCalendarEventMouseLeave,
    handleCalendarEventClick,
  ])

  const renderDayView = useCallback(() => {
    try {
      const dayEvents = getEventsForDate(currentDate.getDate())
      const today = new Date()
      const isToday =
        today.getDate() === currentDate.getDate() &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear()

      return (
        <div className="space-y-4">
          {/* Day Header */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-xl border border-blue-200 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            {isToday && <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white">Today</Badge>}
          </div>

          {/* Time Slots */}
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {timeSlots.map((slot) => {
              const slotEvents = dayEvents.filter((event) => {
                const eventTime = event.booking_time.substring(0, 5)
                return eventTime === slot.value
              })

              return (
                <div
                  key={slot.value}
                  className="flex items-center gap-4 p-3 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    // Pass the current date and the specific time slot
                    handleQuickBookClick(new Date(currentDate), slot.value)
                  }}
                >
                  <div className="w-24 text-center">
                    <span className="text-sm font-bold text-slate-700">{slot.display}</span>
                  </div>

                  <div className="flex-1">
                    {slotEvents.length > 0 ? (
                      <div className="space-y-2">
                        {slotEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                              event.status === "APPROVED"
                                ? "bg-gradient-to-r from-emerald-200 to-green-200 text-emerald-800 border border-emerald-300"
                                : event.status === "DENIED"
                                  ? "bg-gradient-to-r from-rose-200 to-red-200 text-rose-800 border border-rose-300"
                                  : "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 border border-amber-300"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCalendarEventClick(event, e)
                            }}
                            onMouseEnter={(e) => handleCalendarEventHover(event, e)}
                            onMouseMove={(e) => handleCalendarEventMouseMove(event, e)}
                            onMouseLeave={handleCalendarEventMouseLeave}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm">{event.description}</h4>
                                <p className="text-xs opacity-75">
                                  {formatTime(event.booking_time)} -{" "}
                                  {event.bookingendtime ? formatTime(event.bookingendtime) : "End time not set"}
                                </p>
                                <p className="text-xs opacity-75">{event.no_of_people} attendees</p>
                              </div>
                              <Badge className={`${getStatusColor(event.status)} text-xs`}>
                                {getStatusLabel(event.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm italic">Available - Click to book</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    } catch (error) {
      console.error("Error rendering day view:", error)
      return (
        <div className="text-center py-8 text-slate-500">
          <p>Error loading day view</p>
        </div>
      )
    }
  }, [
    currentDate,
    getEventsForDate,
    timeSlots,
    handleQuickBookClick,
    handleCalendarEventClick,
    handleCalendarEventHover,
    handleCalendarEventMouseMove,
    handleCalendarEventMouseLeave,
    formatTime,
    getStatusColor,
    getStatusLabel,
  ])

  // Handle event click to navigate to details
  const handleEventClick = useCallback(
    (eventId: number): void => {
      try {
        navigateToBookings(eventId)
      } catch (error) {
        console.error("Error handling event click:", error)
      }
    },
    [navigateToBookings],
  )

  // Handle booking submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()
      setError("")

      try {
        if (startTime === endTime) {
          setError("End time cannot be the same as start time.")
          return
        }

        setIsSubmitting(true)

        const token = localStorage.getItem("token")
        await axios.post(
          "http://localhost:5003/api/bookings",
          {
            user_id: user.id,
            description,
            booking_date: bookingDate,
            booking_time: startTime,
            bookingendtime: endTime,
            no_of_people: attendees,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        // Reset form fields
        setBookingDate("")
        setStartTime("")
        setEndTime("")
        setAttendees(1)
        setDescription("")

        // Refresh events
        fetchEvents()

        // Close booking form
        setIsBookingFormOpen(false)

        // Show animated confirmation
        setShowConfirmation(true)
        setTimeout(() => setShowConfirmation(false), 4000)

        // Open the calendar view
        setIsCalendarOpen(true)
      } catch (error) {
        console.error("Booking error:", error)
        setError("Failed to create booking")
      } finally {
        setIsSubmitting(false)
      }
    },
    [startTime, endTime, user.id, description, bookingDate, attendees, fetchEvents],
  )

  // Get the header string based on current view mode
  const getHeaderString = useCallback(() => {
    try {
      switch (calendarViewMode) {
        case "month":
          return currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        case "day":
          return currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        default:
          return currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
      }
    } catch (error) {
      console.error("Error getting header string:", error)
      return "Calendar"
    }
  }, [currentDate, calendarViewMode])

  // Get navigation function based on current view mode
  const getNavigationFunction = useCallback(
    (direction: "prev" | "next") => {
      switch (calendarViewMode) {
        case "month":
          return () => navigateMonth(direction)
        case "week":
          return () => navigateWeek(direction)
        case "day":
          return () => navigateDay(direction)
        default:
          return () => navigateMonth(direction)
      }
    },
    [calendarViewMode, navigateMonth, navigateWeek, navigateDay],
  )

  // Render the calendar content based on view mode
  const renderCalendarContent = useCallback(() => {
    switch (calendarViewMode) {
      case "month":
        return renderMonthView()
      case "day":
        return renderDayView()
      default:
        return renderMonthView()
    }
  }, [calendarViewMode, renderMonthView, renderDayView])

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message="Loading Event Calendar" type="calendar" />
  }

  // Show error state if there's an error
  if (error && !isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-full mb-6 shadow-xl mx-auto w-fit">
              <X className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button
              onClick={() => {
                setError("")
                fetchEvents()
              }}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 px-6 py-3 rounded-xl shadow-xl font-bold"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Return the main calendar UI
  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition calendar-container"
      data-page="calendar"
    >
      {/* Simplified Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-white/40 px-4 sm:px-6 py-4 sm:py-6 shadow-xl">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              {/* Enhanced Title Section */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                    <Calendar className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                    Event Calendar
                  </h1>
                  <p className="text-slate-600 font-semibold text-sm sm:text-base hidden sm:block">
                    Manage your auditorium bookings
                  </p>
                </div>
              </div>

              {/* Enhanced Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-72">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 sm:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleOpenCalendar}
                    className="flex items-center gap-3 h-12 sm:h-14 px-4 sm:px-6 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl text-base bg-white/90 backdrop-blur-sm"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="hidden sm:inline">Calendar</span>
                  </Button>
                  <Button
                    onClick={handleOpenBookingForm}
                    className="flex items-center gap-3 h-12 sm:h-14 px-4 sm:px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-2xl shadow-xl font-bold transition-all duration-300 transform hover:scale-105 text-base"
                  >
                    <Plus className="h-5 w-5" />
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">New Event</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Events List */}
        <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4 sm:py-6">
          <div className="h-full">
            <Card className="h-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <CardHeader className="pb-4 sm:pb-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Enhanced Left side - Event count and tab name */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full shadow-lg ${activeTab === "upcoming" ? "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" : "bg-gradient-to-r from-slate-400 to-gray-500"}`}
                      ></div>
                      <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                        {activeTab === "upcoming" ? "Upcoming Events" : "Past Events"}
                      </h2>
                    </div>
                  </div>

                  {/* Enhanced Right side - Tab buttons */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/50">
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base font-bold transition-all duration-300 ${
                        activeTab === "upcoming"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg transform scale-105"
                          : "text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 inline mr-2" />
                      Upcoming
                      <span className="ml-3 px-3 py-1 text-sm rounded-full bg-white/30 font-black">
                        {filteredUpcomingEvents.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("past")}
                      className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base font-bold transition-all duration-300 ${
                        activeTab === "past"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg transform scale-105"
                          : "text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50"
                      }`}
                    >
                      <Activity className="h-4 w-4 inline mr-2" />
                      Past
                      <span className="ml-3 px-3 py-1 text-sm rounded-full bg-white/30 font-black">
                        {filteredPastEvents.length}
                      </span>
                    </button>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-base px-4 py-2 bg-white/90 border-2 border-blue-200 font-bold shadow-lg"
                  >
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    {(activeTab === "upcoming" ? filteredUpcomingEvents : filteredPastEvents).length} events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full overflow-hidden">
                <div className="h-full overflow-y-auto p-4 sm:p-6">
                  {(activeTab === "upcoming" ? filteredUpcomingEvents : filteredPastEvents).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 rounded-full mb-6 shadow-xl">
                        <Calendar className="h-16 w-16 sm:h-24 sm:w-24 text-slate-400" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-black mb-3">No events found</p>
                      <p className="text-base text-slate-400 mb-6 text-center max-w-md">
                        {activeTab === "upcoming"
                          ? "Ready to create your first booking? Click the 'New Event' button to get started!"
                          : "No past events to display. Your completed bookings will appear here."}
                      </p>
                      {activeTab === "upcoming" && (
                        <Button
                          onClick={handleOpenBookingForm}
                          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 px-8 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 text-lg font-bold"
                        >
                          <Plus className="h-5 w-5 mr-3" />
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Your First Booking
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-full">
                      {(activeTab === "upcoming" ? filteredUpcomingEvents : filteredPastEvents).map((event, index) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={index}
                          onEventClick={handleEventClick}
                          navigateToBookings={navigateToBookings}
                          getStatusColor={getStatusColor}
                          getStatusLabel={getStatusLabel}
                          formatTime={formatTime}
                          getEventDuration={getEventDuration}
                          getWeekday={getWeekday}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Booking Form Modal */}
      {isBookingFormOpen && (
        <div
          className={`fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 ${isClosingBookingForm ? "closing" : ""}`}
        >
          <Card
            className={`w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border-0 ${isClosingBookingForm ? "closing" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl py-2 mt-[-26px]">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Reserve Auditorium
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseBookingForm}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="h-2 w-2 text-white" />
                      </div>
                      <span className="font-bold text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="booking-date" className="text-sm font-black text-slate-700">
                    Date
                  </Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-black text-slate-700">Time</Label>
                  <div className="flex items-center gap-2">
                    <Select value={startTime} onValueChange={setStartTime} required>
                      <SelectTrigger className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-slate-500 font-black text-sm">to</span>
                    <Select value={endTime} onValueChange={setEndTime} required>
                      <SelectTrigger className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEndTimeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees" className="text-sm font-black text-slate-700">
                    Attendees
                  </Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={attendees}
                    onChange={(e) => setAttendees(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    min="1"
                    className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-black text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter event description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-2 border-slate-200 focus:border-blue-500 rounded-xl min-h-[80px] text-sm bg-gradient-to-r from-white to-blue-50 shadow-lg"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseBookingForm}
                    className="px-4 py-2 text-sm font-bold rounded-xl border-2 hover:bg-slate-50 shadow-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Calendar Modal */}
      {isCalendarOpen && (
        <div
          className={`fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-3 ${isClosingCalendar ? "closing" : ""}`}
        >
          <Card
            className={`w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border-0 ${isClosingCalendar ? "closing" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-4 mt-[-26px]">
              <CardTitle className="text-lg font-black flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                Calendar View
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseCalendar}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {/* Enhanced Calendar Header with View Options */}
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getNavigationFunction("prev")}
                    className="rounded-xl shadow-lg h-8"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <h3 className="text-lg font-black px-4 min-w-[200px] text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {getHeaderString()}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getNavigationFunction("next")}
                    className="rounded-xl shadow-lg h-8"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="ml-2 rounded-xl font-bold shadow-lg h-8 text-xs"
                  >
                    Today
                  </Button>
                </div>

                <div className="flex bg-gradient-to-r from-slate-100 via-blue-100 to-indigo-100 p-1 rounded-xl shadow-xl">
                  <Button
                    variant={calendarViewMode === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCalendarViewMode("month")}
                    className={`rounded-lg font-bold text-xs h-8 transition-colors ${
                      calendarViewMode === "month" ? "bg-white shadow-lg" : "text-slate-600"
                    }`}
                  >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Month
                  </Button>
                  <Button
                    variant={calendarViewMode === "day" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCalendarViewMode("day")}
                    className={`rounded-lg font-bold text-xs h-8 transition-colors ${
                      calendarViewMode === "day" ? "bg-white shadow-lg" : "text-slate-600"
                    }`}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Day
                  </Button>
                </div>
              </div>

              {/* Calendar Content based on view mode */}
              <div className="overflow-auto max-h-[55vh] bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl p-3 shadow-inner border border-slate-200/50">
                {renderCalendarContent()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl shadow-2xl border-0">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl">
              <CardTitle className="text-xl font-black">Event Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Event</Label>
                  <p className="text-slate-900 text-lg font-semibold mt-2">{selectedEvent.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Status</Label>
                  <div className="mt-2">
                    <Badge className={`${getStatusColor(selectedEvent.status)} text-sm font-black px-3 py-2`}>
                      {getStatusLabel(selectedEvent.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Date</Label>
                  <p className="text-slate-900 text-lg font-semibold mt-2">{formatDate(selectedEvent.booking_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Time</Label>
                  <p className="text-slate-900 text-lg font-semibold mt-2">
                    {formatTime(selectedEvent.booking_time)} -{" "}
                    {selectedEvent.bookingendtime ? formatTime(selectedEvent.bookingendtime) : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Attendees</Label>
                  <p className="text-slate-900 text-lg font-semibold mt-2">{selectedEvent.no_of_people}</p>
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Duration</Label>
                  <p className="text-slate-900 text-lg font-semibold mt-2">
                    {getEventDuration(selectedEvent.booking_time, selectedEvent.bookingendtime)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-xl font-bold shadow-lg"
                  onClick={() => navigateToBookings(selectedEvent.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Bookings
                </Button>
                <Button variant="outline" className="flex items-center gap-2 rounded-xl font-bold shadow-lg">
                  <MoreHorizontal className="h-4 w-4" />
                  More Options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Cursor-following Popup - ONLY FOR CALENDAR EVENTS */}
      {hoveredCalendarEvent && isCalendarOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none animate-in fade-in-0 duration-200"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-white/98 backdrop-blur-xl shadow-2xl rounded-2xl p-5 border border-white/40 max-w-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base">{hoveredCalendarEvent.description}</h3>
                <Badge className={`${getStatusColor(hoveredCalendarEvent.status)} text-xs font-black`}>
                  {getStatusLabel(hoveredCalendarEvent.status)}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700 font-semibold">{formatDate(hoveredCalendarEvent.booking_date)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700 font-semibold">
                    {formatTime(hoveredCalendarEvent.booking_time)} -{" "}
                    {hoveredCalendarEvent.bookingendtime
                      ? formatTime(hoveredCalendarEvent.bookingendtime)
                      : "Not specified"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700 font-semibold">{hoveredCalendarEvent.no_of_people} attendees</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center font-semibold">Click to view in bookings table</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Animated Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-in zoom-in-50 duration-700">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-10 py-8 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-black text-2xl">Booking Confirmed!</h3>
                <p className="text-green-100 text-lg mt-1">Your reservation has been submitted successfully</p>
                <p className="text-green-200 text-sm mt-2">Check the calendar view to see your booking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && <SuccessPopup message="Action completed successfully!" />}
    </div>
  )
}

export default function EventCalendarFull(props: Partial<EventCalendarProps>) {
  return (
    <ErrorBoundary>
      <EventCalendarFullInner {...props} />
    </ErrorBoundary>
  )
}
