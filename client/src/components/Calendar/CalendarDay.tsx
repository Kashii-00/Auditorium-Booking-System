import React, { memo, useCallback } from "react"
import { Plus } from "lucide-react"

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

export default CalendarDay