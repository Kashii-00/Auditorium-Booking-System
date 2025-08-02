import React, { memo, useCallback } from "react"

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

interface EventCardProps {
  event: Event
  index: number
  onEventClick: (eventId: number) => void
  navigateToBookings: (bookingId: number) => void
  getStatusColor: (status?: string) => string
  getStatusLabel: (status?: string) => string
  formatTime: (timeString: string) => string
  getEventDuration: (start: string, end?: string) => string
  getWeekday: (dateString: string) => string
}
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, MapPin, ExternalLink } from "lucide-react"

// Memoized Event Card Component
const EventCard = memo<EventCardProps>(
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
  }) => {
    const handleClick = useCallback(() => {
      onEventClick(event.id)
    }, [onEventClick, event.id])

    const handleViewDetails = useCallback(
      (e) => {
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



export default EventCard