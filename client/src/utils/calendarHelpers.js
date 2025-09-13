// Calendar utility functions
export const formatDate = (dateString) => {
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
}

export const formatTime = (timeString) => {
  try {
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch (error) {
    console.error("Error formatting time:", error)
    return timeString
  }
}

export const getWeekday = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long" })
  } catch (error) {
    console.error("Error getting weekday:", error)
    return "Unknown"
  }
}

export const getEventDuration = (start, end) => {
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
}

export const getStatusColor = (status) => {
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
}

export const getStatusLabel = (status) => {
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
}

// Calendar navigation helpers
export const getDaysInMonth = (date) => {
  try {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  } catch (error) {
    console.error("Error getting days in month:", error)
    return 30
  }
}

export const getFirstDayOfMonth = (date) => {
  try {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  } catch (error) {
    console.error("Error getting first day of month:", error)
    return 0
  }
}

// Time slots generation
export const generateTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 20; hour++) {
    // 8am to 8pm
    slots.push({
      value: `${hour.toString().padStart(2, "0")}:00`,
      display: `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`,
    })
  }
  return slots
}

// Debounce utility
export const debounce = (func, wait) => {
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