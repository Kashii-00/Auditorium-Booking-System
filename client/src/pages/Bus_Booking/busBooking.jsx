"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bus,
  User,
  Phone,
  Send,
  Check,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authRequest } from "../../services/authService"
import defaultUserImage from "../assets/profile-user.png"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const BusCalendarFull = ({ user = { id: 1, name: "Demo User" } }) => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false)
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  )

  // Get days in month - memoized to prevent recalculation
  const { daysInMonth, firstDayOfMonth } = useMemo(() => {
    return {
      daysInMonth: new Date(currentYear, currentMonth + 1, 0).getDate(),
      firstDayOfMonth: new Date(currentYear, currentMonth, 1).getDay(),
    }
  }, [currentMonth, currentYear])

  // Helper function to format date without timezone issues
  const formatDateForInput = useCallback((date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authRequest("get", "http://localhost:5003/api/busBookings")
      setBookings(response || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Navigate months - optimized with useCallback
  const navigateMonth = useCallback((direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(prevDate.getMonth() + direction)
      return newDate
    })
  }, [])

  // Go to today - optimized with useCallback
  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }, [])

  // Get bookings for a specific date - memoized for performance
  const getBookingsForDate = useCallback(
    (date) => {
      if (!bookings.length) return []
      const dateStr = formatDateForInput(date)
      return bookings.filter((booking) => {
        const bookingDate = formatDateForInput(new Date(booking.travelDate || booking.date))
        return bookingDate === dateStr
      })
    },
    [bookings, formatDateForInput],
  )

  // Get upcoming bookings - memoized
  const upcomingBookings = useMemo(() => {
    if (!bookings.length) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.travelDate || booking.date)
        return bookingDate >= today
      })
      .sort((a, b) => new Date(a.travelDate || a.date) - new Date(b.travelDate || b.date))
      .slice(0, 20) // Limit to 20 for performance
  }, [bookings])

  // Get past bookings - memoized
  const pastBookings = useMemo(() => {
    if (!bookings.length) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.travelDate || booking.date)
        return bookingDate < today
      })
      .sort((a, b) => new Date(b.travelDate || b.date) - new Date(a.travelDate || a.date))
      .slice(0, 20) // Limit to 20 for performance
  }, [bookings])

  // Selected date bookings - memoized
  const selectedDateBookings = useMemo(() => {
    return getBookingsForDate(selectedDate)
  }, [selectedDate, getBookingsForDate])

  // Handle date click - optimized with useCallback
  const handleDateClick = useCallback(
    (day) => {
      const clickedDate = new Date(currentYear, currentMonth, day)
      setSelectedDate(clickedDate)

      // Pre-fill booking form with selected date using proper date formatting
      const travelDateFormatted = formatDateForInput(clickedDate)

      // Create return date (next day)
      const returnDate = new Date(currentYear, currentMonth, day + 1)
      const returnDateFormatted = formatDateForInput(returnDate)

      setFormState((prev) => ({
        ...prev,
        travelDate: travelDateFormatted,
        returnDate: returnDateFormatted,
        errors: {},
      }))
    },
    [currentYear, currentMonth, formatDateForInput],
  )

  // Handle booking click - redirect to bookings page - optimized with useCallback
  const handleBookingClick = useCallback(
    (booking, e) => {
      if (e) {
        e.stopPropagation()
      }

      localStorage.setItem("highlightBookingId", booking.id)

      window.dispatchEvent(
        new CustomEvent("navigate-to-bookings", {
          detail: {
            bookingId: Number(booking.id),
            highlight: true,
          },
        }),
      )

      navigate("/busbookings", {
        state: {
          highlightId: Number(booking.id),
          fromCalendar: true,
        },
      })
    },
    [navigate],
  )

  // Get status color for dots - memoized
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-500"
      case "pending":
        return "bg-amber-500"
      case "denied":
        return "bg-rose-500"
      default:
        return "bg-slate-400"
    }
  }, [])

  // Get status badge variant - memoized
  const getStatusBadgeVariant = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-200/50"
      case "pending":
        return "bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border-amber-300 shadow-amber-200/50"
      case "denied":
        return "bg-gradient-to-r from-rose-100 via-red-100 to-pink-100 text-rose-800 border-rose-300 shadow-rose-200/50"
      default:
        return "bg-gradient-to-r from-slate-100 via-gray-100 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-200/50"
    }
  }, [])

  // Check if a date is a weekend - memoized
  const isWeekend = useCallback((date) => {
    if (!date) return false
    const d = new Date(date)
    return d.getDay() === 0 || d.getDay() === 6
  }, [])

  // Form handling - optimized with useCallback
  const updateFormField = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  // Validate form - optimized with useCallback
  const validateForm = useCallback(() => {
    const { fromPlace, toPlace, travelDate, returnDate, forWho, ContactNo } = formState
    const newErrors = {}

    if (!fromPlace?.trim()) newErrors.fromPlace = "Starting location is required"
    if (!toPlace?.trim()) newErrors.toPlace = "Destination is required"
    if (!travelDate) newErrors.travelDate = "Travel date is required"
    if (!returnDate) newErrors.returnDate = "Return date is required"
    if (!forWho?.trim()) newErrors.forWho = "Passenger name is required"
    if (!ContactNo?.trim()) newErrors.contactNo = "Contact information is required"

    if (travelDate && returnDate && new Date(returnDate) < new Date(travelDate)) {
      newErrors.returnDate = "Return date must be after travel date"
    }

    if (fromPlace && toPlace && fromPlace.trim() === toPlace.trim()) {
      newErrors.toPlace = "Destination cannot be same as starting location"
    }

    setFormState((prev) => ({ ...prev, errors: newErrors }))
    return Object.keys(newErrors).length === 0
  }, [formState])

  // Handle booking submission - optimized with useCallback
  const handleBooking = useCallback(async () => {
    if (!validateForm()) return

    try {
      const { travelDate, returnDate, fromPlace, toPlace, forWho, ContactNo } = formState

      const response = await authRequest("post", "http://localhost:5003/api/busBookings", {
        user_id: user.id,
        fromPlace: fromPlace.trim(),
        toPlace: toPlace.trim(),
        travelDate: travelDate,
        returnDate: returnDate,
        forWho: forWho.trim(),
        ContactNo: ContactNo.trim(),
      })

      if (response.success) {
        updateFormField("message", "Booking request sent!")
        fetchBookings()
        setShowSuccessPopup(true)

        setTimeout(() => setShowSuccessPopup(false), 3000)

        // Reset form
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

        setIsBookingFormOpen(false)
      } else {
        updateFormField("message", response.error || "Failed to send booking request.")
      }
    } catch (error) {
      console.error("Error creating bus booking:", error)
      updateFormField("message", error.response?.data?.error || "Failed to send booking request.")
    }
  }, [formState, user.id, validateForm, updateFormField, fetchBookings])

  // Format date for display - memoized
  const formatDate = useCallback((date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })
  }, [])

  // Format time - memoized
  const formatTime = useCallback((dateStr) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      return "Time not set"
    }
  }, [])

  // Render calendar days - memoized for performance
  const calendarDays = useMemo(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayBookings = getBookingsForDate(date)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = date.toDateString() === selectedDate.toDateString()
      const isPast = date < today

      days.push(
        <div
          key={day}
          className={cn(
            "p-2 sm:p-3 h-20 sm:h-24 border-2 rounded-xl cursor-pointer relative group will-change-transform",
            isSelected
              ? "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-blue-400 shadow-lg ring-2 ring-blue-300/50"
              : "border-slate-200/60 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:shadow-md bg-white/80",
            isPast && !isToday ? "opacity-60" : "",
          )}
          onClick={() => handleDateClick(day)}
        >
          <div className={cn("text-sm font-bold", isToday ? "text-blue-700" : "text-slate-700")}>{day}</div>

          {isToday && <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>}

          {dayBookings.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-0 flex gap-1">
              {dayBookings.slice(0, 3).map((booking, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full cursor-pointer hover:scale-125 shadow-sm",
                    getStatusColor(booking.status),
                  )}
                  onClick={(e) => handleBookingClick(booking, e)}
                  title={`${booking.forWho || "Booking"} - ${booking.status || "Pending"}`}
                />
              ))}
              {dayBookings.length > 3 && (
                <div className="w-2 h-2 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">+</span>
                </div>
              )}
            </div>
          )}

          {!isPast && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Plus className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </div>,
      )
    }

    return days
  }, [
    currentYear,
    currentMonth,
    daysInMonth,
    firstDayOfMonth,
    selectedDate,
    getBookingsForDate,
    handleDateClick,
    getStatusColor,
    handleBookingClick,
  ])

  // Memoize the weekday headers
  const weekdayHeaders = useMemo(() => {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
      <div
        key={day}
        className="p-3 text-center text-sm font-bold text-slate-700 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl border border-slate-200/50 shadow-sm"
      >
        {day}
      </div>
    ))
  }, [])

  if (loading) {
    return <LoadingScreen message="Loading bus calendar..." type="calendar" />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Background Pattern - using CSS variables for better performance */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0e7ff' fillOpacity='0.4'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        ></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 p-4 xl:p-6 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl will-change-transform">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <Bus className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Bus Calendar
              </h1>
              <p className="text-slate-600 font-semibold text-lg mt-2">Schedule and manage bus reservations</p>
            </div>
          </div>

          {/* Status Legend */}
          <div className="hidden lg:flex items-center gap-6 bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-bold text-slate-700">Status Legend:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Approved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Denied</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Today</span>
            </div>
          </div>
        </div>

        {/* Mobile Status Legend */}
        <div className="lg:hidden mt-4 flex flex-wrap items-center gap-4 bg-white/90 backdrop-blur-xl rounded-2xl p-3 border border-slate-200/50 shadow-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-700">Legend:</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Denied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-600">Today</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 xl:px-6 pb-4 xl:pb-6 pt-6 flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="flex-1">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)} className="rounded-xl">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)} className="rounded-xl">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={goToToday}
                  className="rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 font-bold"
                >
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">{weekdayHeaders}</div>
              <div className="grid grid-cols-7 gap-2 sm:gap-3">{calendarDays}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* New Reservation Button */}
          <Button
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white h-14 px-8 rounded-2xl shadow-xl font-black text-lg transform hover:scale-105 transition-transform duration-200"
            onClick={() => setIsBookingFormOpen(true)}
          >
            <Plus className="w-5 h-5 mr-3" />
            <Sparkles className="w-4 w-4 mr-2" />
            New Reservation
          </Button>

          {/* Selected Date Reservations */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-100 rounded-t-2xl">
              <CardTitle className="text-xl font-black text-slate-900">
                Reservations for {formatDate(selectedDate)}
              </CardTitle>
              <p className="text-sm text-slate-600">{selectedDateBookings.length} booking(s) for this day.</p>
            </CardHeader>
            <CardContent className="p-4">
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{booking.forWho || "Service Trip"}</p>
                          <p className="text-sm text-slate-600">{formatTime(booking.travelDate || booking.date)}</p>
                        </div>
                        <Badge className={getStatusBadgeVariant(booking.status)}>{booking.status || "Pending"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <CalendarIcon className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-center">No bookings for this date.</p>
                  <Button
                    variant="ghost"
                    className="mt-4 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={() => setIsBookingFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming and Past Bookings Tabs */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardContent className="p-0">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-t-2xl p-1">
                  <TabsTrigger
                    value="upcoming"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:font-bold"
                  >
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:font-bold"
                  >
                    Past
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="upcoming" className="mt-0">
                    <div>
                      <h3 className="text-lg font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent mb-2">
                        Upcoming Bookings
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">{upcomingBookings.length} upcoming booking(s).</p>

                      {upcomingBookings.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {upcomingBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-slate-900">{booking.forWho || "Unknown"}</p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(booking.travelDate || booking.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    - {formatTime(booking.travelDate || booking.date)}
                                  </p>
                                </div>
                                <Badge className={getStatusBadgeVariant(booking.status)}>
                                  {booking.status || "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                          <CalendarIcon className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-center">No upcoming bookings.</p>
                          <Button
                            variant="ghost"
                            className="mt-4 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => setIsBookingFormOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Booking
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="past" className="mt-0">
                    <div>
                      <h3 className="text-lg font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent mb-2">
                        Past Bookings
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">{pastBookings.length} past booking(s).</p>

                      {pastBookings.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {pastBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md opacity-75"
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-slate-900">{booking.forWho || "Unknown"}</p>
                                  <p className="text-sm text-slate-600">
                                    {new Date(booking.travelDate || booking.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    - {formatTime(booking.travelDate || booking.date)}
                                  </p>
                                </div>
                                <Badge className={getStatusBadgeVariant(booking.status)}>
                                  {booking.status || "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                          <CalendarIcon className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-center">No past bookings.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Modal */}
      <Dialog open={isBookingFormOpen} onOpenChange={setIsBookingFormOpen}>
        <DialogContent className="max-w-md mt-8 rounded-t-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <DialogHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl -m-6 mb-4 p-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="p-2 bg-white/20 rounded-xl">
                <Bus className="w-6 h-6" />
              </div>
              Reserve Bus Service
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-2">
    

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
              className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-2xl shadow-xl font-black text-lg transform hover:scale-105 transition-transform duration-200"
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right border border-white/20 backdrop-blur-xl">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-lg">Booking Created!</p>
            <p className="text-emerald-100 text-sm">Your bus reservation has been submitted</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusCalendarFull
