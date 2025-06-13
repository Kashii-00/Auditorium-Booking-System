"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo, startTransition } from "react"
import { useLocation } from "react-router-dom"
import { authRequest } from "../../services/authService"
import WeeklyTimetable from "./WeeklyTimeTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Trash2,
  Info,
  RotateCcw,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  XCircle,
  User,
} from "lucide-react"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

// Optimized debounce utility
const debounce = (func, wait) => {
  let timeout
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
  debounced.cancel = () => clearTimeout(timeout)
  return debounced
}

// Memoized Success popup component
const SuccessPopup = memo(({ message }) => {
  return (
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300 border border-white/20">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <p className="font-bold text-sm">{message}</p>
      </div>
    </div>
  )
})

SuccessPopup.displayName = "SuccessPopup"

// Skeleton loader for better perceived performance
const TableSkeleton = memo(() => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border-b border-slate-100 p-4">
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
      className={`text-left py-2 px-3 font-bold text-slate-700 text-sm ${
        sortable ? "cursor-pointer hover:bg-slate-50" : ""
      }`}
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
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
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

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

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

const CalendarBookingTable = () => {
  const [bookings, setBookings] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [error, setError] = useState(null)
  const location = useLocation()
  const [showInfo, setShowInfo] = useState(false)
  const [showWeeklyTimetable, setShowWeeklyTimetable] = useState(false)
  const [showPendingPopup, setShowPendingPopup] = useState(false)
  const [unassignedIds, setUnassignedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [popupMessage, setPopupMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState("ALL")
  const [selectedBookings, setSelectedBookings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({ key: "course_name", direction: "asc" })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Refs for performance optimization
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)
  const abortControllerRef = useRef(null)
  const infoRef = useRef(null)
  const pendingRef = useRef(null)
  const MIN_FETCH_INTERVAL = 2000

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null
  const ITEMS_PER_PAGE = 10

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Load saved filters
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  useEffect(() => {
    const savedFilters = localStorage.getItem("calendarBookingFilters")
    if (savedFilters) {
      try {
        const { searchTerm, filterMonth } = JSON.parse(savedFilters)
        if (searchTerm !== undefined) setSearchTerm(searchTerm)
        if (filterMonth !== undefined) setFilterMonth(filterMonth)
      } catch (e) {
        console.warn("Failed to parse saved filters:", e)
      }
    }
    setFiltersLoaded(true)
  }, [])

  useEffect(() => {
    if (!filtersLoaded) return

    const filtersToStore = {
      searchTerm,
      filterMonth,
    }
    localStorage.setItem("calendarBookingFilters", JSON.stringify(filtersToStore))
  }, [searchTerm, filterMonth, filtersLoaded])

  // Memoized helper functions
  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  const formatTime = useCallback((timeString) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const period = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${period}`
  }, [])

  const getAcronym = useCallback((courseName) => {
    if (!courseName) return ""

    const words = courseName
      .replace(/[()[\]]/g, "")
      .replace(/[-–—]/g, " _HYPHEN_ ")
      .replace(/&/g, " _AMP_ ")
      .split(/\s+/)
      .filter((word) => word.length > 0)

    const hasExam = words.some((word) => word.toLowerCase() === "exam")

    const acronym = words
      .filter((word) => word.toLowerCase() !== "exam")
      .map((word) => {
        if (word === "_HYPHEN_") return "-"
        if (word === "_AMP_") return "&"
        const letter = word[0].toUpperCase()
        return /[A-Z]/.test(letter) ? letter : ""
      })
      .join("")

    return hasExam ? `${acronym} (EXAM)` : acronym
  }, [])

  // Optimized sidebar state sync
  const debouncedSyncSidebarState = useMemo(
    () =>
      debounce(() => {
        const stored = localStorage.getItem("sidebarState")
        if (stored !== null) {
          const isCollapsed = stored === "true"
          setSidebarCollapsed(isCollapsed)
        }
      }, 50),
    [],
  )

  useEffect(() => {
    debouncedSyncSidebarState()

    const handleSidebarToggle = (e) => {
      const isCollapsed = e.detail.isCollapsed
      setSidebarCollapsed(isCollapsed)
      localStorage.setItem("sidebarState", isCollapsed.toString())
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("popstate", debouncedSyncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", debouncedSyncSidebarState)
      debouncedSyncSidebarState.cancel()
    }
  }, [sidebarCollapsed, debouncedSyncSidebarState])

  // Optimized fetch function
  const fetchBookings = useCallback(async () => {
    if (fetchInProgress.current) return
    const now = Date.now()
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return

    try {
      fetchInProgress.current = true
      lastFetchTime.current = now

      // Only show loading state for initial load or if data is stale
      if (bookings.length === 0 || now - lastFetchTime.current > 10000) {
        setLoading(true)
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const response = await authRequest("get", "http://localhost:5003/api/classroom-calendar", null, {
        signal: abortControllerRef.current.signal,
        cache: "no-store",
      })

      if (response.success) {
        // Use startTransition for non-urgent updates to prevent UI blocking
        startTransition(() => {
          setBookings(response.data || [])
          setError(null)
        })
      } else {
        throw new Error("Unexpected response structure")
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching calendar entries:", err)
        setError("Failed to fetch calendar entries. Please try again later.")
      }
    } finally {
      fetchInProgress.current = false
      setLoading(false)
      setInitialLoad(false)
    }
  }, [bookings.length])

  const fetchUnassignedRequestIds = useCallback(async () => {
    try {
      const response = await authRequest("get", "http://localhost:5003/api/classroom-calendar/unassigned-request-ids")
      if (response.success) {
        setUnassignedIds(response.unassignedRequestIds || [])
        setShowPendingPopup(true)
      } else {
        setUnassignedIds([])
        setShowPendingPopup(true)
      }
    } catch (error) {
      console.error("Failed to fetch unassigned request IDs:", error)
      setUnassignedIds([])
      setShowPendingPopup(true)
    }
  }, [])

  // Optimize the filteredBookings memoization with a more efficient algorithm
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return []

    // Fast path: if no filters are applied, return all bookings
    if (!debouncedSearchTerm && filterMonth === "ALL") {
      return bookings
    }

    // Pre-calculate month filter for better performance
    const monthFilter = filterMonth !== "ALL" ? Number.parseInt(filterMonth) : null

    // Pre-process search term for better performance
    let searchConfig = null
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.trim().toLowerCase()

      if (term.startsWith("id:")) {
        searchConfig = {
          type: "id",
          value: term.replace("id:", ""),
        }
      } else if (term.startsWith("request:")) {
        searchConfig = {
          type: "request_id",
          value: term.replace("request:", ""),
        }
      } else if (term.startsWith("user:")) {
        searchConfig = {
          type: "user_id",
          value: term.replace("user:", ""),
        }
      } else {
        searchConfig = {
          type: "course_name",
          value: term,
        }
      }
    }

    // Use Array.filter with optimized conditions
    return bookings.filter((booking) => {
      // Apply month filter first (faster check)
      if (monthFilter !== null) {
        const bookingMonth = booking.date_from ? new Date(booking.date_from).getMonth() : -1
        if (bookingMonth !== monthFilter) return false
      }

      // Then apply search filter if needed
      if (searchConfig) {
        switch (searchConfig.type) {
          case "id":
            return booking.id?.toString() === searchConfig.value
          case "request_id":
            return booking.request_id?.toString() === searchConfig.value
          case "user_id":
            return booking.user_id?.toString() === searchConfig.value
          case "course_name":
            return booking.course_name?.toLowerCase().includes(searchConfig.value)
          default:
            return true
        }
      }

      return true
    })
  }, [bookings, debouncedSearchTerm, filterMonth])

  // Sort the filtered bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valueA, valueB

      switch (sort.key) {
        case "course_name":
          valueA = a.course_name || ""
          valueB = b.course_name || ""
          break
        case "date_from":
          valueA = new Date(a.date_from).getTime()
          valueB = new Date(b.date_from).getTime()
          break
        case "user_id":
          valueA = a.user_id || 0
          valueB = b.user_id || 0
          break
        case "request_id":
          valueA = a.request_id || 0
          valueB = b.request_id || 0
          break
        default:
          valueA = a.course_name || ""
          valueB = b.course_name || ""
      }

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

  // Delete booking function
  const deleteBooking = useCallback(
    async (id) => {
      try {
        await authRequest("delete", `http://localhost:5003/api/classroom-calendar/${id}`)

        // Optimistic update
        setBookings((prev) => prev.filter((booking) => booking.id !== id))
        setSelectedBookings((prev) => prev.filter((bookingId) => bookingId !== id))

        setPopupMessage("Calendar entry deleted successfully")
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error deleting entry:", err)
        setError("Failed to delete entry. Please try again.")
        await fetchBookings()
      }
    },
    [fetchBookings],
  )

  // Bulk delete function
  const handleBulkDelete = useCallback(async () => {
    if (selectedBookings.length === 0) return

    if (!window.confirm(`Are you sure you want to delete ${selectedBookings.length} selected booking(s)?`)) return

    try {
      const promises = selectedBookings.map((id) =>
        authRequest("delete", `http://localhost:5003/api/classroom-calendar/${id}`),
      )

      await Promise.all(promises)

      // Optimistic update
      setBookings((prev) => prev.filter((booking) => !selectedBookings.includes(booking.id)))
      setSelectedBookings([])

      setPopupMessage("Bulk delete completed successfully")
      setShowPopup(true)
      setTimeout(() => setShowPopup(false), 3000)
    } catch (err) {
      console.error("Error performing bulk delete:", err)
      setError("Failed to delete selected bookings")
      await fetchBookings()
    }
  }, [selectedBookings, fetchBookings])

  // Selection handlers
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
    setSelectedBookings((prev) => {
      if (checked) {
        return [...prev, bookingId]
      } else {
        return prev.filter((id) => id !== bookingId)
      }
    })
  }, [])

  // Export function
  const exportToCSV = useCallback(() => {
    if (!window.confirm("Are you sure you want to export the current calendar data to CSV?")) return

    const headers = [
      "ID",
      "User ID",
      "Request ID",
      "Course Name",
      "Date From",
      "Date To",
      "Time From",
      "Time To",
      "Preferred Days",
      "Classes Allocated",
    ]

    let filename = "calendar_entries"
    if (filterMonth !== "ALL") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`
    }
    filename += ".csv"

    const data = filteredBookings.map((booking) => [
      booking.id,
      booking.user_id,
      booking.request_id ?? "",
      booking.course_name,
      booking.date_from,
      booking.date_to,
      booking.time_from,
      booking.time_to,
      booking.preferred_days_of_week,
      booking.classes_allocated,
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
  }, [filteredBookings, filterMonth])

  const handleResetFilters = useCallback(() => {
    setSearchTerm("")
    setFilterMonth("ALL")
    setCurrentPage(1)
    localStorage.removeItem("calendarBookingFilters")
  }, [])

  // Handle opening the weekly timetable
  const handleOpenWeeklyTimetable = useCallback(() => {
    console.log("Opening weekly timetable")
    setShowWeeklyTimetable(true)
  }, [])

  // Handle highlighted booking
  useEffect(() => {
    if (highlightId !== null) {
      setTimeout(() => {
        const row = document.querySelector(`tr[data-booking-id="${highlightId}"]`)
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" })
          row.classList.add("highlight-pulse")
          setTimeout(() => {
            row.classList.remove("highlight-pulse")
          }, 2000)
        }
      }, 300)
    }
  }, [highlightId])

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false)
      }
      if (pendingRef.current && !pendingRef.current.contains(event.target)) {
        setShowPendingPopup(false)
      }
    }

    if (showInfo || showPendingPopup) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showInfo, showPendingPopup])

  // Add these optimizations to the useEffect for initial fetch
  useEffect(() => {
    // Initial fetch with delay to allow UI to render first
    const initialFetchTimer = setTimeout(() => {
      fetchBookings()
    }, 100)

    // Set up polling with increasing intervals based on user activity
    let pollInterval = 30000 // Start with 30s
    let lastActivityTime = Date.now()

    const activityHandler = () => {
      lastActivityTime = Date.now()
    }

    // Track user activity
    window.addEventListener("mousemove", activityHandler)
    window.addEventListener("keydown", activityHandler)
    window.addEventListener("click", activityHandler)

    // Polling with adaptive interval
    const pollTimer = setInterval(() => {
      const now = Date.now()
      const inactiveTime = now - lastActivityTime

      // Increase poll interval if user is inactive
      if (inactiveTime > 120000) {
        // 2 minutes
        pollInterval = 60000 // 1 minute
      }
      if (inactiveTime > 300000) {
        // 5 minutes
        pollInterval = 120000 // 2 minutes
      }

      fetchBookings()
    }, pollInterval)

    // Cleanup
    return () => {
      clearTimeout(initialFetchTimer)
      clearInterval(pollTimer)
      window.removeEventListener("mousemove", activityHandler)
      window.removeEventListener("keydown", activityHandler)
      window.removeEventListener("click", activityHandler)

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchBookings])

  return (
    <div className="min-h-screen w-full bg-gray-50 relative">
      {initialLoad && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen message="Loading calendar booking system..." type="calendar" />
        </div>
      )}

      {showPopup && <SuccessPopup message={popupMessage} />}

      <div className="relative z-10 p-4 xl:p-6 space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="border shadow-md">
          <CardHeader className="border-b bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Calendar Booking Details
                </CardTitle>
                <p className="text-slate-600 mt-1 text-sm">Manage and review all calendar bookings in one place</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between mb-4">
              <div className="flex gap-3 flex-1 max-w-xl w-full lg:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                  <Input
                    placeholder="Search by course, id:ID, request:ID, user:ID"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-9 h-10 text-sm border rounded-lg"
                  />
                </div>

                <div className="relative" ref={infoRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowInfo(!showInfo)}
                    className="h-10 w-10 border rounded-lg"
                  >
                    <Info className="w-4 h-4" />
                  </Button>

                  {showInfo && (
                    <div className="absolute top-12 right-0 z-50 w-72 p-3 bg-white rounded-lg shadow-lg border border-slate-200">
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-800">🌟 Search Tips:</h4>
                        <p className="text-xs text-slate-600">
                          Use the search bar to quickly find calendar bookings by:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>
                            • <strong>Course Name</strong> (e.g., "Mathematics")
                          </li>
                          <li>
                            • <strong>Calendar Booking ID</strong> (e.g., "id:1")
                          </li>
                          <li>
                            • <strong>Request ID</strong> (e.g., "request:123")
                          </li>
                          <li>
                            • <strong>User ID</strong> (e.g., "user:456")
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-center lg:justify-end">
                <Select
                  value={filterMonth}
                  onValueChange={(value) => {
                    setFilterMonth(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-32 h-10 border rounded-lg text-sm">
                    <Filter className="h-4 w-4 mr-2" />
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

                <Button variant="outline" onClick={handleResetFilters} className="h-10 px-4 border rounded-lg text-sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                <Button variant="outline" onClick={exportToCSV} className="h-10 px-4 border rounded-lg text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  onClick={handleOpenWeeklyTimetable}
                  className="h-10 px-4 border rounded-lg text-sm flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <FileText className="h-4 w-4" />
                  <span>Weekly Timetable</span>
                </Button>

                <div className="relative" ref={pendingRef}>
                  <Button
                    variant="outline"
                    onClick={fetchUnassignedRequestIds}
                    className="h-10 px-4 border rounded-lg text-sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Pending
                  </Button>

                  {showPendingPopup && (
                    <div className="absolute top-12 right-0 z-50 w-64 p-3 bg-white rounded-lg shadow-lg border border-slate-200">
                      <h5 className="font-bold text-slate-800 mb-2">Unassigned Request IDs:</h5>
                      <div className="max-h-40 overflow-y-auto">
                        {unassignedIds.length > 0 ? (
                          <ul className="space-y-1">
                            {unassignedIds.map((id) => (
                              <li key={id} className="text-xs text-slate-600">
                                • {id}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-600">All requests of classroom bookings added.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedBookings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-blue-700">
                    {selectedBookings.length} booking(s) selected
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkDelete}
                      variant="destructive"
                      className="h-8 text-sm bg-red-600 hover:bg-red-700"
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm">
                        <Checkbox
                          checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <ColumnHeader title="ID" sortable={true} sortKey="id" currentSort={sort} onSort={setSort} />
                      <ColumnHeader
                        title="User ID"
                        sortable={true}
                        sortKey="user_id"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Request ID"
                        sortable={true}
                        sortKey="request_id"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Course Name"
                        sortable={true}
                        sortKey="course_name"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Date Period"
                        sortable={true}
                        sortKey="date_from"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader title="Time Period" sortable={false} />
                      <ColumnHeader title="Preferred Days" sortable={false} />
                      <ColumnHeader title="Classes" sortable={false} />
                      <ColumnHeader title="Actions" sortable={false} />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          No calendar bookings found
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.map((booking, index) => (
                        <tr
                          key={booking.id}
                          data-booking-id={booking.id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 border-b border-gray-100 ${
                            highlightId === booking.id ? "bg-blue-100 border-blue-300" : ""
                          }`}
                        >
                          <td className="py-2 px-3">
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={(checked) => handleSelectBooking(booking.id, checked)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className="font-medium text-xs bg-blue-50 text-blue-800 border-blue-200"
                            >
                              {booking.id}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-medium text-gray-900 text-sm flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-600" />
                              {booking.user_id}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-sm text-gray-900">
                              {booking.request_id ? (
                                <Badge
                                  variant="outline"
                                  className="font-medium text-xs bg-green-50 text-green-800 border-green-200"
                                >
                                  {booking.request_id}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-blue-600" />
                              <span
                                className="text-sm font-medium text-gray-900 truncate max-w-[150px]"
                                title={booking.course_name}
                              >
                                {getAcronym(booking.course_name)}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-gray-900">{formatDate(booking.date_from)}</span>
                              </div>
                              <div className="text-gray-500">to {formatDate(booking.date_to)}</div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-gray-900">{formatTime(booking.time_from)}</span>
                              </div>
                              <div className="text-gray-500">to {formatTime(booking.time_to)}</div>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-xs text-gray-600">
                              {booking.preferred_days_of_week || <span className="text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div
                              className="text-xs text-gray-600 max-w-[100px] truncate"
                              title={booking.classes_allocated}
                            >
                              {booking.classes_allocated || <span className="text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBooking(booking.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Weekly Timetable Modal */}
      {showWeeklyTimetable && <WeeklyTimetable onClose={() => setShowWeeklyTimetable(false)} />}
    </div>
  )
}

export default CalendarBookingTable
