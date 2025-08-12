"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo, memo, lazy, Suspense } from "react"
import {
  Calendar,
  Plus,
  Search,
  X,
  Check,
  Sparkles,
  Star,
  TrendingUp,
  Activity,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

// Custom hooks and utilities
import { useEventCalendar } from '../../hooks/useEventCalendar'
import { 
  formatDate, 
  formatTime, 
  getWeekday, 
  getEventDuration,
  getStatusColor,
  getStatusLabel,
  generateTimeSlots
} from '../../utils/calendarHelpers'

// Lazy load heavy components
const EventCard = lazy(() => import('../../components/Calendar/EventCard'))
const BookingFormModal = lazy(() => import('../../components/Calendar/BookingFormModal'))
const CalendarModal = lazy(() => import('../../components/Calendar/CalendarModal'))

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



// Main Component wrapped in Error Boundary
function EventCalendarFullInner({
  user = { id: 1, name: "Demo User" },
  onLogout = () => {},
  onNavigateToBookingDetails = (bookingId: number) => {
    console.log("Navigate to booking details:", bookingId)
  },
}: Partial<EventCalendarProps>) {
  // Use custom hook for event management
  const {
    events,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    setError,
    filteredUpcomingEvents,
    filteredPastEvents,
    createBooking,
  } = useEventCalendar(user)

  // UI state
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClosingCalendar, setIsClosingCalendar] = useState(false)
  const [isClosingBookingForm, setIsClosingBookingForm] = useState(false)

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("month")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [hoveredCalendarEvent, setHoveredCalendarEvent] = useState<Event | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Form state
  const [formData, setFormData] = useState({
    bookingDate: "",
    startTime: "",
    endTime: "",
    attendees: 1,
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarState")
      return stored !== null ? stored === "true" : false
    }
    return false
  })

  const tooltipRef = useRef<HTMLDivElement | null>(null)

  // Add resize listener to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Memoized time slots generation
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  const filteredEndTimeSlots = useMemo(() => {
    return timeSlots.filter((slot) => !formData.startTime || slot.value > formData.startTime)
  }, [timeSlots, formData.startTime])







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

  // Form data handler
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

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



  // Simple booking handlers
  const handleOpenBookingForm = useCallback(() => {
    setIsBookingFormOpen(true)
  }, [])

  const handleCloseBookingForm = useCallback(() => {
    setIsClosingBookingForm(true)
      setTimeout(() => {
      setIsBookingFormOpen(false)
      setIsClosingBookingForm(false)
    }, 250)
  }, [])

  const handleOpenCalendar = useCallback(() => {
    setIsCalendarOpen(true)
  }, [])

  const handleCloseCalendar = useCallback(() => {
      setIsClosingCalendar(true)
      setTimeout(() => {
        setIsCalendarOpen(false)
        setIsClosingCalendar(false)
      }, 250)
  }, [])

  const handleQuickBookClick = useCallback((date: Date, timeSlot?: string) => {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`

    setFormData(prev => ({
      ...prev,
      bookingDate: formattedDate,
      startTime: timeSlot || "09:00",
      endTime: timeSlot ? `${parseInt(timeSlot.split(':')[0]) + 1}:00` : "10:00"
    }))

      setIsCalendarOpen(false)
      setTimeout(() => {
        setIsBookingFormOpen(true)
      }, 100)
  }, [])

  // Handle booking submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()
      setError("")

      try {
        if (formData.startTime === formData.endTime) {
          setError("End time cannot be the same as start time.")
          return
        }

        setIsSubmitting(true)
        await createBooking(formData)

        // Reset form
        setFormData({
          bookingDate: "",
          startTime: "",
          endTime: "",
          attendees: 1,
          description: "",
        })

        // Close form and show success
        setIsBookingFormOpen(false)
        setShowConfirmation(true)
        setTimeout(() => setShowConfirmation(false), 4000)
      } catch (error: any) {
        setError(error.message || "Failed to create booking")
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, createBooking, setError],
  )

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
              onClick={() => setError("")}
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
      className="min-h-screen w-full bg-slate-50 relative sidebar-transition calendar-container"
      data-page="calendar"
    >

      <div className="relative z-10 h-screen flex flex-col">
        {/* Optimized Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
          <div className="max-w-full mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              {/* Simplified Title Section */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 bg-blue-600 rounded-xl shadow-lg">
                  <Calendar className="h-7 w-7 sm:h-9 sm:w-9 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl xl:text-3xl font-black text-slate-800">
                    Event Calendar
                  </h1>
                  <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
                    <Target className="h-3 w-3 flex-shrink-0" />
                    MPMA Auditorium management system
                  </p>
                </div>
              </div>

              {/* Simplified Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-72">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 sm:h-14 text-base border border-slate-300 focus:border-blue-500 rounded-lg bg-white shadow-sm focus:shadow-md transition-shadow duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleOpenCalendar}
                    className="flex items-center gap-2 h-12 sm:h-14 px-4 sm:px-6 border border-blue-300 hover:bg-blue-50 rounded-lg font-semibold transition-colors duration-200 text-base"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="hidden sm:inline">Calendar</span>
                  </Button>
                  <Button
                    onClick={handleOpenBookingForm}
                    className="flex items-center gap-2 h-12 sm:h-14 px-4 sm:px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors duration-200 text-base"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">New Event</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimized Events List */}
        <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4 sm:py-6">
          <div className="h-full">
            <Card className="h-full shadow-lg border bg-white">
              <CardHeader className="pb-4 sm:pb-6 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${activeTab === "upcoming" ? "bg-green-500" : "bg-slate-400"}`}
                      ></div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                        {activeTab === "upcoming" ? "Upcoming Events" : "Past Events"}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-2 shadow-md border">
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base font-semibold transition-colors duration-200 ${
                        activeTab === "upcoming"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 inline mr-2" />
                      Upcoming
                      <span className="ml-3 px-2 py-1 text-sm rounded-full bg-white/30 font-bold">
                        {filteredUpcomingEvents.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("past")}
                      className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base font-semibold transition-colors duration-200 ${
                        activeTab === "past"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Activity className="h-4 w-4 inline mr-2" />
                      Past
                      <span className="ml-3 px-2 py-1 text-sm rounded-full bg-white/30 font-bold">
                        {filteredPastEvents.length}
                      </span>
                    </button>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-base px-4 py-2 bg-white border border-blue-200 font-semibold shadow-sm"
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
                      <Suspense fallback={<div className="animate-pulse h-32 bg-slate-200 rounded-xl"></div>}>
                      {(activeTab === "upcoming" ? filteredUpcomingEvents : filteredPastEvents).map((event, index) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={index}
                            onEventClick={navigateToBookings}
                          navigateToBookings={navigateToBookings}
                          getStatusColor={getStatusColor}
                          getStatusLabel={getStatusLabel}
                          formatTime={formatTime}
                          getEventDuration={getEventDuration}
                          getWeekday={getWeekday}
                        />
                      ))}
                      </Suspense>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      <Suspense fallback={null}>
        <BookingFormModal
          isOpen={isBookingFormOpen}
          isClosing={isClosingBookingForm}
          onClose={handleCloseBookingForm}
          onSubmit={handleSubmit}
          formData={formData}
          onFormDataChange={handleFormDataChange}
          timeSlots={timeSlots}
          filteredEndTimeSlots={filteredEndTimeSlots}
          isSubmitting={isSubmitting}
          error={error}
        />
      </Suspense>

      {/* Calendar Modal */}
      <Suspense fallback={null}>
        <CalendarModal
          isOpen={isCalendarOpen}
          isClosing={isClosingCalendar}
          onClose={handleCloseCalendar}
          events={events}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          calendarViewMode={calendarViewMode}
          onViewModeChange={setCalendarViewMode}
          onQuickBookClick={handleQuickBookClick}
          isMobile={isMobile}
        />
      </Suspense>

      {/* Success confirmation */}
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
