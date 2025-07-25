"use client"
import { useEffect, useState, useCallback, useMemo, memo, lazy, Suspense, useLayoutEffect } from "react"
import {
  Search,
  Filter,
  Download,
  Check,
  X,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { authRequest } from "../../services/authService"

// Lazy load heavy components
const LoadingScreen = lazy(() => import("../LoadingScreen/LoadingScreen"))

// Memoized components for better performance
const SuccessPopup = memo(({ message }) => (
  <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
      <div>
        <p className="font-black text-lg">{message}</p>
        <p className="text-emerald-100 text-sm">Your action has been completed successfully</p>
      </div>
    </div>
  </div>
))

SuccessPopup.displayName = "SuccessPopup"

// Circular progress ring StatCard with our color palette
const StatCard = memo(({ title, value, icon: Icon, color = "blue", progress = 75 }) => {
  const colorConfig = useMemo(
    () => ({
      blue: {
        gradient: "from-blue-500 via-indigo-600 to-purple-700",
        ring: "stroke-blue-500",
        bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      },
      green: {
        gradient: "from-emerald-500 via-green-600 to-teal-700",
        ring: "stroke-emerald-500",
        bg: "bg-gradient-to-br from-emerald-50 to-green-50",
        iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      },
      purple: {
        gradient: "from-purple-500 via-violet-600 to-indigo-700",
        ring: "stroke-purple-500",
        bg: "bg-gradient-to-br from-purple-50 to-violet-50",
        iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
      },
      orange: {
        gradient: "from-orange-500 via-amber-600 to-yellow-700",
        ring: "stroke-orange-500",
        bg: "bg-gradient-to-br from-orange-50 to-amber-50",
        iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
      },
      yellow: {
        gradient: "from-yellow-400 via-amber-500 to-orange-600",
        ring: "stroke-yellow-500",
        bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
        iconBg: "bg-gradient-to-br from-yellow-500 to-amber-600",
      },
      red: {
        gradient: "from-red-500 via-rose-600 to-pink-700",
        ring: "stroke-red-500",
        bg: "bg-gradient-to-br from-red-50 to-rose-50",
        iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
      },
      gray: {
        gradient: "from-slate-300 to-gray-400",
        ring: "stroke-slate-300",
        bg: "bg-gradient-to-br from-slate-50 to-gray-50",
        iconBg: "bg-gradient-to-br from-slate-400 to-gray-500",
      },
    }),
    [],
  )

  const config = colorConfig[color] || colorConfig.blue
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center group">
      {/* Circular card with progress ring */}
      <div className="relative">
        {/* Background circle */}
        <div className={`w-28 h-28 rounded-full ${config.bg} shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden`}>
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-200"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="3"
              className={config.ring}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>
          
          {/* Icon */}
          <div className="relative z-10">
            <Icon className="h-8 w-8 text-slate-700 group-hover:scale-110 transition-transform duration-300" />
          </div>
          </div>

        {/* Value display */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full shadow-lg px-3 py-1 border border-slate-200">
            <span className="text-2xl font-black text-slate-800">{value}</span>
        </div>
        </div>
      </div>
      
      {/* Title */}
      <div className="mt-6 text-center">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
    </div>
  )
})

StatCard.displayName = "StatCard"

// Skeleton loader for better perceived performance
const TableSkeleton = memo(() => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border-b border-slate-100/60 p-4">
        <div className="flex items-center space-x-4">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-6 bg-slate-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
))

TableSkeleton.displayName = "TableSkeleton"

// Column header with sort functionality
const ColumnHeader = memo(({ title, sortable = false, sortKey, currentSort, onSort }) => {
  const handleSort = useCallback(() => {
    if (sortable && onSort) {
      if (currentSort.key === sortKey) {
        onSort({ key: sortKey, direction: currentSort.direction === "asc" ? "desc" : "asc" })
      } else {
        onSort({ key: sortKey, direction: "asc" })
      }
    }
  }, [sortable, sortKey, currentSort, onSort])

  return (
    <th
      className={`py-3 px-4 text-left font-bold text-white ${sortable ? "cursor-pointer hover:bg-blue-800" : ""}`}
      onClick={handleSort}
    >
      <div className="flex items-center space-x-1">
        <span>{title}</span>
        {sortable && <ArrowUpDown size={14} className={currentSort.key === sortKey ? "opacity-100" : "opacity-50"} />}
      </div>
    </th>
  )
})

ColumnHeader.displayName = "ColumnHeader"

// Status badge component
const StatusBadge = memo(({ status }) => {
  const getStatusColor = useCallback((status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "DENIED":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }, [])

  return <Badge className={`${getStatusColor(status)} px-3 py-1 rounded-full text-xs font-medium`}>{status}</Badge>
})

StatusBadge.displayName = "StatusBadge"

// Pagination component
const Pagination = memo(({ currentPage, totalPages, totalItems, onPageChange }) => {
  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisiblePages = 3

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
        // Near the start
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        // Near the end
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        for (
          let i = currentPage - Math.floor(maxVisiblePages / 2);
          i <= currentPage + Math.floor(maxVisiblePages / 2);
          i++
        ) {
          pages.push(i)
        }
      }
    }

    return pages
  }, [currentPage, totalPages])

  const startItem = (currentPage - 1) * 5 + 1
  const endItem = Math.min(currentPage * 5, totalItems)

  return (
    <div className="flex items-center justify-between mt-4 px-4">
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} bookings
      </div>
      <div className="flex space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 p-0 ${currentPage === page ? "bg-blue-600" : ""}`}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

Pagination.displayName = "Pagination"

// Debounced search hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EventBookingFull() {
  const [bookings, setBookings] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [highlightedBookingId, setHighlightedBookingId] = useState(null)
  const [selectedBookings, setSelectedBookings] = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({ key: "name", direction: "asc" })
  const [popupMessage, setPopupMessage] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Items per page
  const ITEMS_PER_PAGE = 5

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Memoized API call
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const bookingsData = await authRequest("get", "http://localhost:5003/api/bookings")
      setBookings(bookingsData)
      setError(null)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError("Failed to fetch bookings")
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  // Memoized helper functions
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  const formatTime = useCallback((timeString) => {
    if (!timeString) return "N/A"
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const period = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${period}`
  }, [])

  // Optimized status update with batching
  const updateStatus = useCallback(
    async (id, status) => {
      try {
        await authRequest("put", `http://localhost:5003/api/bookings/${id}`, { status })

        // Optimistic update for better UX
        setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)))

        setError(null)
        setPopupMessage(`Booking status updated to ${status}`)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error updating status:", err)
        setError("Failed to update booking status")
        // Revert optimistic update on error
        await fetchBookings()
      }
    },
    [fetchBookings],
  )

  // Optimized delete with batching
  const deleteBooking = useCallback(
    async (id) => {
      try {
        await authRequest("delete", `http://localhost:5003/api/bookings/${id}`)

        // Optimistic update
        setBookings((prev) => prev.filter((booking) => booking.id !== id))
        setSelectedBookings((prev) => prev.filter((bookingId) => bookingId !== id))

        setError(null)
        setPopupMessage("Booking deleted successfully")
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error deleting booking:", err)
        setError("Failed to delete booking")
        // Revert optimistic update on error
        await fetchBookings()
      }
    },
    [fetchBookings],
  )

  // Optimized bulk actions
  const handleBulkAction = useCallback(
    async (action) => {
      if (selectedBookings.length === 0) return

      const actionText = action === "approve" ? "approve" : action === "reject" ? "reject" : "delete"
      const confirmMessage = `Are you sure you want to ${actionText} ${selectedBookings.length} selected booking(s)?`

      if (!window.confirm(confirmMessage)) return

      try {
        // Batch API calls for better performance
        const promises = selectedBookings.map((id) => {
          switch (action) {
            case "approve":
              return authRequest("put", `http://localhost:5003/api/bookings/${id}`, { status: "APPROVED" })
            case "reject":
              return authRequest("put", `http://localhost:5003/api/bookings/${id}`, { status: "DENIED" })
            case "delete":
              return authRequest("delete", `http://localhost:5003/api/bookings/${id}`)
            default:
              return Promise.resolve()
          }
        })

        await Promise.all(promises)

        // Optimistic update
        if (action === "delete") {
          setBookings((prev) => prev.filter((booking) => !selectedBookings.includes(booking.id)))
        } else {
          const newStatus = action === "approve" ? "APPROVED" : "DENIED"
          setBookings((prev) =>
            prev.map((booking) =>
              selectedBookings.includes(booking.id) ? { ...booking, status: newStatus } : booking,
            ),
          )
        }

        setSelectedBookings([])
        setPopupMessage(`Bulk ${actionText} completed successfully`)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error(`Error performing bulk ${action}:`, err)
        setError(`Failed to ${action} selected bookings`)
        // Revert optimistic update on error
        await fetchBookings()
      }
    },
    [selectedBookings, fetchBookings],
  )

  // Memoized filtered bookings with optimized filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        !debouncedSearchTerm ||
        (booking.name?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.email?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.description?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase())

      const matchesStatus = filterStatus === "ALL" || booking.status === filterStatus
      const matchesMonth =
        filterMonth === "ALL" || new Date(booking.booking_date).getMonth() === Number.parseInt(filterMonth)

      return matchesSearch && matchesStatus && matchesMonth
    })
  }, [bookings, debouncedSearchTerm, filterStatus, filterMonth])

  // Sort the filtered bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valueA, valueB

      // Extract the values to compare based on sort key
      switch (sort.key) {
        case "name":
          valueA = a.name || ""
          valueB = b.name || ""
          break
        case "email":
          valueA = a.email || ""
          valueB = b.email || ""
          break
        case "date":
          valueA = new Date(a.booking_date).getTime()
          valueB = new Date(b.booking_date).getTime()
          break
        case "status":
          valueA = a.status || ""
          valueB = b.status || ""
          break
        default:
          valueA = a.name || ""
          valueB = b.name || ""
      }

      // Compare the values based on sort direction
      if (sort.direction === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })
  }, [filteredBookings, sort])

  // Paginate the sorted bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedBookings, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)), [filteredBookings])

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return
      setCurrentPage(page)
    },
    [totalPages],
  )

  // Memoized statistics
  const stats = useMemo(
    () => ({
      total: bookings.length,
      approved: bookings.filter((b) => b.status === "APPROVED").length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      rejected: bookings.filter((b) => b.status === "DENIED").length,
    }),
    [bookings],
  )

  // Optimized selection handlers
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedBookings(paginatedBookings.map((booking) => booking.id))
      } else {
        setSelectedBookings([])
      }
    },
    [paginatedBookings],
  )

  const handleSelectBooking = useCallback((bookingId, checked) => {
    setSelectedBookings((prev) => (checked ? [...prev, bookingId] : prev.filter((id) => id !== bookingId)))
  }, [])

  // Optimized CSV export
  const exportToCSV = useCallback(() => {
    if (!window.confirm("Are you sure you want to export the current booking data to CSV?")) return

    const headers = ["Name", "Email", "Phone", "Booking Date", "Time Slot", "Description", "Status", "Attendees"]

    let filename = "bookings"
    if (filterStatus !== "ALL") {
      filename += `_${filterStatus.toLowerCase()}`
    }
    if (filterMonth !== "ALL") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`
    }
    filename += ".csv"

    const data = filteredBookings.map((booking) => [
      booking.name || "N/A",
      booking.email || "N/A",
      booking.phone || "N/A",
      formatDate(booking.booking_date),
      `${formatTime(booking.booking_time)} - ${booking.bookingendtime ? formatTime(booking.bookingendtime) : "N/A"}`,
      booking.description,
      booking.status,
      booking.no_of_people,
    ])

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [filteredBookings, filterStatus, filterMonth, formatDate, formatTime])

  // Initial data fetch
  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 60000) // Reduced frequency for better performance
    return () => clearInterval(interval)
  }, [fetchBookings])

  // Handle highlighted booking from calendar
  useEffect(() => {
    if (highlightedBookingId && bookings.length > 0) {
      // Find the booking in the list
      const highlightedBooking = bookings.find((booking) => booking.id === highlightedBookingId)
      if (highlightedBooking) {
        // Calculate which page this booking should be on
        const bookingIndex = sortedBookings.findIndex((booking) => booking.id === highlightedBookingId)
        if (bookingIndex !== -1) {
          const pageNumber = Math.floor(bookingIndex / ITEMS_PER_PAGE) + 1
          setCurrentPage(pageNumber)

          // Small delay to ensure the page change has taken effect
          setTimeout(() => {
            const bookingElement = document.querySelector(`[data-booking-id="${highlightedBookingId}"]`)
            if (bookingElement) {
              bookingElement.scrollIntoView({ behavior: "smooth", block: "center" })
              bookingElement.classList.add("highlight-pulse")
              setTimeout(() => {
                bookingElement.classList.remove("highlight-pulse")
              }, 2000)
            }
          }, 100)
        }
      }

      // Clear the highlight after 5 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedBookingId(null)
      }, 5000)

      return () => clearTimeout(clearTimer)
    }
  }, [highlightedBookingId, bookings, sortedBookings])

  // Listen for navigation events from calendar
  useEffect(() => {
    const handleNavigateToBookings = (event) => {
      const { bookingId, highlight } = event.detail
      if (highlight && bookingId) {
        setHighlightedBookingId(Number(bookingId))
      }
    }

    // Check for stored highlight ID on mount
    const storedHighlightId = localStorage.getItem("highlightBookingId")
    if (storedHighlightId) {
      setHighlightedBookingId(Number(storedHighlightId))
      localStorage.removeItem("highlightBookingId")
    }

    window.addEventListener("navigate-to-bookings", handleNavigateToBookings)
    window.addEventListener("page-switched-to-bookings", handleNavigateToBookings)

    return () => {
      window.removeEventListener("navigate-to-bookings", handleNavigateToBookings)
      window.removeEventListener("page-switched-to-bookings", handleNavigateToBookings)
    }
  }, [])

  // Sync sidebar state
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed)
    }

    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        setSidebarCollapsed(stored === "true")
      }
    }

    syncSidebarState()
    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("popstate", syncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  // Add CSS for optimized smooth animations
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      /* Optimized animations for better performance */
      .will-change-transform {
        will-change: transform;
        backface-visibility: hidden;
        perspective: 1000px;
        -webkit-transform: translateZ(0);
      }
    `
    style.id = "event-booking-animations-css"

    // Remove existing style if present
    const existingStyle = document.getElementById("event-booking-animations-css")
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    document.head.appendChild(style)
    return () => {
      const styleToRemove = document.getElementById("event-booking-animations-css")
      if (styleToRemove) {
        document.head.removeChild(styleToRemove)
      }
    }
  }, [])

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative"
      data-page="bookings"
    >
      {/* Initial loading screen */}
      {initialLoad && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed inset-0 z-50">
            <LoadingScreen message="Loading event booking system..." type="bookings" />
          </div>
        </Suspense>
      )}

      {/* Background Pattern - Optimized */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
      </div>

      {/* Success Popup */}
      {showPopup && <SuccessPopup message={popupMessage} />}

      <div className="relative z-10 p-4 xl:p-6 space-y-6 xl:space-y-8">
        {/* Error Display */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Statistics Cards - Circular progress cards */}
        <div className="mb-12 flex justify-center">
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            <StatCard title="Total Bookings" value={stats.total} icon={Calendar} color="blue" progress={80} />
            <StatCard title="Approved" value={stats.approved} icon={Check} color="green" progress={90} />
            <StatCard title="Pending" value={stats.pending} icon={AlertCircle} color="yellow" progress={65} />
            <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" progress={30} />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Booking Requests
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  View and manage all auditorium booking requests
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 xl:gap-4 items-center justify-between mb-4 xl:mb-6">
              <div className="relative flex-1 max-w-md w-full lg:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                <Input
                  placeholder="Search by name, email, or event..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  className="pl-12 h-12 xl:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap gap-2 xl:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                <Select
                  value={filterStatus}
                  onValueChange={(value) => {
                    setFilterStatus(value)
                    setCurrentPage(1) // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger className="w-32 xl:w-40 h-12 xl:h-14 border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">
                    <Filter className="h-5 w-5 mr-2" />
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterMonth}
                  onValueChange={(value) => {
                    setFilterMonth(value)
                    setCurrentPage(1) // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger className="w-32 xl:w-40 h-12 xl:h-14 border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Months</SelectItem>
                    <SelectItem value="0">January</SelectItem>
                    <SelectItem value="1">February</SelectItem>
                    <SelectItem value="2">March</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">May</SelectItem>
                    <SelectItem value="5">June</SelectItem>
                    <SelectItem value="6">July</SelectItem>
                    <SelectItem value="7">August</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">October</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">December</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  className="h-12 xl:h-14 px-6 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm flex items-center justify-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedBookings.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-4 xl:p-6 mb-4 xl:mb-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    {selectedBookings.length} booking(s) selected
                  </span>
                  <div className="flex flex-wrap gap-2 xl:gap-3">
                    {selectedBookings.some((id) => {
                      const booking = paginatedBookings.find((b) => b.id === id)
                      return booking && booking.status === "PENDING"
                    }) && (
                      <>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-xl font-bold text-xs xl:text-sm rounded-xl transform hover:scale-105 transition-all duration-300"
                          onClick={() => handleBulkAction("approve")}
                        >
                          Approve Selected
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-xl font-bold text-xs xl:text-sm rounded-xl transform hover:scale-105 transition-all duration-300"
                          onClick={() => handleBulkAction("reject")}
                        >
                          Reject Selected
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 hover:from-rose-600 hover:via-red-600 hover:to-pink-600 text-white shadow-xl font-bold text-xs xl:text-sm rounded-xl transform hover:scale-105 transition-all duration-300"
                      onClick={() => handleBulkAction("delete")}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modern Table */}
            <div className="rounded-lg overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800">
                    <tr>
                      <th className="py-3 px-4 text-left text-white w-12">
                        <Checkbox
                          checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="border-white"
                        />
                      </th>
                      {sidebarCollapsed && (
                        <ColumnHeader
                          title="Organizer"
                          sortable={true}
                          sortKey="name"
                          currentSort={sort}
                          onSort={setSort}
                        />
                      )}
                      <ColumnHeader title="Email" sortable={true} sortKey="email" currentSort={sort} onSort={setSort} />
                      <ColumnHeader title="Phone" sortable={false} />
                      <ColumnHeader title="Event Details" sortable={false} />
                      <ColumnHeader
                        title="Schedule"
                        sortable={true}
                        sortKey="date"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Status"
                        sortable={true}
                        sortKey="status"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <th className="py-3 px-4 text-right text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={sidebarCollapsed ? 8 : 7} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan={sidebarCollapsed ? 8 : 7} className="text-center py-8 text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.map((booking, index) => (
                        <tr
                          key={booking.id}
                          data-booking-id={booking.id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors duration-150 ${
                            highlightedBookingId === booking.id ? "bg-blue-100 border border-blue-300" : ""
                          }`}
                        >
                          <td className="py-4 px-4">
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={(checked) => handleSelectBooking(booking.id, checked)}
                            />
                          </td>
                          {sidebarCollapsed && (
                            <td className="py-4 px-4">
                              <div className="font-medium">{booking.name || "N/A"}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <Users className="w-3 h-3 inline mr-1" />
                                {booking.no_of_people} attendees
                              </div>
                            </td>
                          )}
                          <td className="py-4 px-4">
                            <div className="text-sm">{booking.email || "N/A"}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">{booking.phone || "-"}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-sm truncate max-w-[200px]">{booking.description}</div>
                            <div className="text-xs text-gray-500 mt-1">Auditorium Booking</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <Calendar className="w-3 h-3 inline mr-1 text-gray-500" />
                              {formatDate(booking.booking_date)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(booking.booking_time)} -{" "}
                              {booking.bookingendtime ? formatTime(booking.bookingendtime) : "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              {booking.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to approve this booking?")) {
                                        updateStatus(booking.id, "APPROVED")
                                      }
                                    }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to reject this booking?")) {
                                        updateStatus(booking.id, "DENIED")
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this booking? This action cannot be undone.",
                                    )
                                  ) {
                                    deleteBooking(booking.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && filteredBookings.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredBookings.length}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .highlight-pulse {
          animation: highlightPulse 2s ease-in-out;
        }
        
        @keyframes highlightPulse {
          0%, 100% { 
            background-color: rgb(219 234 254); 
            border-color: rgb(147 197 253);
          }
          50% { 
            background-color: rgb(191 219 254); 
            border-color: rgb(59 130 246);
          }
        }
      `}</style>
    </div>
  )
}
