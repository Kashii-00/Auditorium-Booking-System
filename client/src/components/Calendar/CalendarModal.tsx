import React, { memo, useCallback, useState, useMemo } from "react"

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

interface CalendarModalProps {
  isOpen: boolean
  isClosing: boolean
  onClose: () => void
  events: Event[]
  currentDate: Date
  onDateChange: (date: Date) => void
  calendarViewMode: "month" | "week" | "day"
  onViewModeChange: (mode: "month" | "week" | "day") => void
  onQuickBookClick: (date: Date, timeSlot?: string) => void
  isMobile: boolean
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Clock,
  Users
} from "lucide-react"
import CalendarDay from "./CalendarDay"
import { 
  getDaysInMonth, 
  getFirstDayOfMonth,
  formatTime,
  getStatusColor,
  getStatusLabel,
  generateTimeSlots
} from "../../utils/calendarHelpers"

const CalendarModal = memo<CalendarModalProps>(({
  isOpen,
  isClosing,
  onClose,
  events,
  currentDate,
  onDateChange,
  calendarViewMode,
  onViewModeChange,
  onQuickBookClick,
  isMobile
}) => {
  const [hoveredCalendarEvent, setHoveredCalendarEvent] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Generate time slots for day view
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  const getEventsForDate = useCallback(
    (date) => {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${date.toString().padStart(2, "0")}`
      return events.filter((event) => event.booking_date === dateStr)
    },
    [events, currentDate],
  )

  const navigateMonth = useCallback((direction) => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    onDateChange(newDate)
  }, [currentDate, onDateChange])

  const navigateDay = useCallback((direction) => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 1)
    } else {
      newDate.setDate(currentDate.getDate() + 1)
    }
    onDateChange(newDate)
  }, [currentDate, onDateChange])

  const goToToday = useCallback(() => {
    onDateChange(new Date())
  }, [onDateChange])

  const getHeaderString = useCallback(() => {
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
  }, [currentDate, calendarViewMode])

  const getNavigationFunction = useCallback(
    (direction) => {
      switch (calendarViewMode) {
        case "month":
          return () => navigateMonth(direction)
        case "day":
          return () => navigateDay(direction)
        default:
          return () => navigateMonth(direction)
      }
    },
    [calendarViewMode, navigateMonth, navigateDay],
  )

  const handleCalendarEventHover = useCallback((event, mouseEvent) => {
    setHoveredCalendarEvent(event)
    setPopupPosition({ x: mouseEvent.clientX + 20, y: mouseEvent.clientY - 10 })
  }, [])

  const handleCalendarEventMouseMove = useCallback((event, mouseEvent) => {
    if (hoveredCalendarEvent?.id === event.id) {
      setPopupPosition({ x: mouseEvent.clientX + 20, y: mouseEvent.clientY - 10 })
    }
  }, [hoveredCalendarEvent?.id])

  const handleCalendarEventMouseLeave = useCallback(() => {
    setHoveredCalendarEvent(null)
  }, [])

  const handleCalendarEventClick = useCallback((event, mouseEvent) => {
    mouseEvent.stopPropagation()
    console.log("Calendar event clicked:", event.id)
  }, [])

  const handleQuickBook = useCallback((date) => {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
    onQuickBookClick(dateObj)
  }, [currentDate, onQuickBookClick])

  const renderMonthView = useCallback(() => {
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
  }, [
    currentDate,
    isMobile,
    getEventsForDate,
    handleQuickBook,
    handleCalendarEventHover,
    handleCalendarEventMouseMove,
    handleCalendarEventMouseLeave,
    handleCalendarEventClick,
  ])

  const renderDayView = useCallback(() => {
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
                onClick={() => onQuickBookClick(new Date(currentDate), slot.value)}
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
  }, [currentDate, getEventsForDate, timeSlots, onQuickBookClick, handleCalendarEventClick])

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

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-3 ${isClosing ? "closing" : ""}`}
    >
      <Card
        className={`w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border-0 ${isClosing ? "closing" : ""}`}
      >
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-4 mt-[-26px]">
          <CardTitle className="text-lg font-black flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            Calendar View
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {/* Calendar Header with View Options */}
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
                onClick={() => onViewModeChange("month")}
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
                onClick={() => onViewModeChange("day")}
                className={`rounded-lg font-bold text-xs h-8 transition-colors ${
                  calendarViewMode === "day" ? "bg-white shadow-lg" : "text-slate-600"
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Day
              </Button>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="overflow-auto max-h-[55vh] bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl p-3 shadow-inner border border-slate-200/50">
            {renderCalendarContent()}
          </div>
        </CardContent>
      </Card>

      {/* Event Tooltip */}
      {hoveredCalendarEvent && (
        <div
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
                  <span className="text-slate-700 font-semibold">{hoveredCalendarEvent.booking_date}</span>
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
                <p className="text-xs text-slate-500 text-center font-semibold">Click to view details</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

CalendarModal.displayName = "CalendarModal"



export default CalendarModal