"use client"

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
import { useLocation } from "react-router-dom"
import { authRequest } from "../../services/authService"
import {
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  User,
  Phone,
  Check,
  X,
  Trash2,
  Bus,
  ArrowRight,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
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
    <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-lg">{message}</p>
          <p className="text-emerald-100 text-sm">Your action has been completed successfully</p>
        </div>
      </div>
    </div>
  )
})

SuccessPopup.displayName = "SuccessPopup"

// Memoized Statistics Card Component
const StatCard = memo(({ title, value, icon: Icon, color = "blue" }) => {
  const colorClasses = useMemo(
    () => ({
      blue: "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-700 border-blue-300 shadow-blue-200/50",
      green:
        "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-200/50",
      yellow:
        "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 text-amber-700 border-amber-300 shadow-amber-200/50",
      red: "bg-gradient-to-br from-rose-100 via-red-100 to-pink-100 text-rose-700 border-rose-300 shadow-rose-200/50",
    }),
    [],
  )

  return (
    <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/95 backdrop-blur-xl min-h-[120px] transform hover:-translate-y-1">
      <CardContent className="p-4 xl:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs xl:text-sm font-black text-slate-600 mb-1 xl:mb-2 uppercase tracking-wide transition-colors duration-300">
              {title}
            </p>
            <p className="text-2xl xl:text-4xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent transition-all duration-300">
              {value}
            </p>
          </div>
          <div
            className={`p-3 xl:p-4 rounded-2xl shadow-xl border-2 ${colorClasses[color]} flex-shrink-0 transition-all duration-300 hover:scale-110`}
          >
            <Icon className="h-5 w-5 xl:h-7 xl:w-7 transition-transform duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
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
      className={`text-left py-3 xl:py-4 px-3 xl:px-4 font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent text-sm xl:text-base ${
        sortable ? "cursor-pointer hover:from-blue-800 hover:to-indigo-800" : ""
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

// Status badge component
const StatusBadge = memo(({ status }) => {
  const getStatusColor = useCallback((status) => {
    switch (status) {
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

  return (
    <Badge className={`${getStatusColor(status)} text-xs xl:text-sm font-black px-3 py-1 shadow-lg`}>{status}</Badge>
  )
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

const BusBookingFull = () => {
  const [bookings, setBookings] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [error, setError] = useState(null)
  const location = useLocation()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState("ALL")

  const [selectedBookings, setSelectedBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [highlightedBookingId, setHighlightedBookingId] = useState(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({ key: "forWho", direction: "asc" })
  const [popupMessage, setPopupMessage] = useState("")

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Items per page
  const ITEMS_PER_PAGE = 5

  // Refs for performance optimization
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)
  const abortControllerRef = useRef(null)
  const MIN_FETCH_INTERVAL = 2000

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

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

  const getStatusColor = useCallback((status) => {
    switch (status) {
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

  // Optimized sidebar state sync with debouncing
  const debouncedSyncSidebarState = useMemo(
    () =>
      debounce(() => {
        const stored = localStorage.getItem("sidebarState")
        if (stored !== null) {
          const isCollapsed = stored === "true"
          setSidebarCollapsed(isCollapsed)

          document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "90px" : "280px")
          document.documentElement.style.setProperty("--sidebar-transition", "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)")

          if (isCollapsed) {
            document.body.classList.add("sidebar-collapsed")
          } else {
            document.body.classList.remove("sidebar-collapsed")
          }
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

      document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "90px" : "280px")

      if (isCollapsed) {
        document.body.classList.add("sidebar-collapsed")
      } else {
        document.body.classList.remove("sidebar-collapsed")
      }
    }

    const handleSidebarHover = (e) => {
      const isHovered = e.detail.isHovered
      if (isHovered && sidebarCollapsed) {
        document.documentElement.style.setProperty("--sidebar-width", "280px")
      } else if (!isHovered && sidebarCollapsed) {
        document.documentElement.style.setProperty("--sidebar-width", "90px")
      }
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("sidebarHover", handleSidebarHover)
    window.addEventListener("popstate", debouncedSyncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("sidebarHover", handleSidebarHover)
      window.removeEventListener("popstate", debouncedSyncSidebarState)
      debouncedSyncSidebarState.cancel()
    }
  }, [sidebarCollapsed, debouncedSyncSidebarState])

  // Optimized fetch function with abort controller
  const fetchBookings = useCallback(async () => {
    if (fetchInProgress.current) return
    const now = Date.now()
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return

    try {
      fetchInProgress.current = true
      lastFetchTime.current = now
      setLoading(true)

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const bookingsData = await authRequest("get", "http://10.70.4.34:5003/api/busBookings", null, {
        signal: abortControllerRef.current.signal,
      })

      setBookings(bookingsData || [])
      setError(null)
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching bus bookings:", err)
        setError("Failed to fetch bookings. Please try again later.")
      }
    } finally {
      fetchInProgress.current = false
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  // Memoized filtered bookings with optimized filtering
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return []

    return bookings.filter((booking) => {
      if (filterStatus !== "ALL" && booking.status !== filterStatus) return false

      if (filterMonth !== "ALL") {
        const bookingMonth = booking.travelDate ? new Date(booking.travelDate).getMonth() : -1
        if (bookingMonth !== Number.parseInt(filterMonth)) return false
      }

      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        return (
          booking.forWho?.toLowerCase().includes(searchLower) ||
          booking.ContactNo?.toLowerCase().includes(searchLower) ||
          booking.fromPlace?.toLowerCase().includes(searchLower) ||
          booking.toPlace?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [bookings, debouncedSearchTerm, filterStatus, filterMonth])

  // Sort the filtered bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valueA, valueB

      switch (sort.key) {
        case "forWho":
          valueA = a.forWho || ""
          valueB = b.forWho || ""
          break
        case "ContactNo":
          valueA = a.ContactNo || ""
          valueB = b.ContactNo || ""
          break
        case "travelDate":
          valueA = new Date(a.travelDate).getTime()
          valueB = new Date(b.travelDate).getTime()
          break
        case "status":
          valueA = a.status || ""
          valueB = b.status || ""
          break
        default:
          valueA = a.forWho || ""
          valueB = b.forWho || ""
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

  // Memoized statistics
  const stats = useMemo(() => {
    const total = bookings.length
    const approved = bookings.filter((b) => b.status === "APPROVED").length
    const pending = bookings.filter((b) => b.status === "PENDING").length
    const denied = bookings.filter((b) => b.status === "DENIED").length
    return { total, approved, pending, denied }
  }, [bookings])

  // Optimized API functions with error handling
  const updateStatus = useCallback(
    async (id, status) => {
      try {
        await authRequest("put", `http://10.70.4.34:5003/api/busBookings/${id}`, { status })

        // Optimistic update
        setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)))

        setPopupMessage(`Booking status updated to ${status}`)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error updating booking status:", err)
        setError("Failed to update booking status. Please try again.")
        await fetchBookings()
      }
    },
    [fetchBookings],
  )

  const deleteBooking = useCallback(
    async (id) => {
      try {
        await authRequest("delete", `http://10.70.4.34:5003/api/busBookings/${id}`)

        // Optimistic update
        setBookings((prev) => prev.filter((booking) => booking.id !== id))
        setSelectedBookings((prev) => prev.filter((bookingId) => bookingId !== id))

        setPopupMessage("Booking deleted successfully")
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error deleting booking:", err)
        setError("Failed to delete booking. Please try again.")
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
        const promises = selectedBookings.map((id) => {
          switch (action) {
            case "approve":
              return authRequest("put", `http://10.70.4.34:5003/api/busBookings/${id}`, { status: "APPROVED" })
            case "reject":
              return authRequest("put", `http://10.70.4.34:5003/api/busBookings/${id}`, { status: "DENIED" })
            case "delete":
              return authRequest("delete", `http://10.70.4.34:5003/api/busBookings/${id}`)
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
        await fetchBookings()
      }
    },
    [selectedBookings, fetchBookings],
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
    setSelectedBookings((prev) => {
      if (checked) {
        return [...prev, bookingId]
      } else {
        return prev.filter((id) => id !== bookingId)
      }
    })
  }, [])

  // Optimized export function
  const exportToCSV = useCallback(() => {
    if (!window.confirm("Are you sure you want to export the current booking data to CSV?")) return

    const headers = ["Passenger", "Contact", "From", "To", "Travel Date", "Return Date", "Booked By", "Status"]
    let filename = "bus_bookings"
    if (filterStatus !== "ALL") filename += `_${filterStatus.toLowerCase()}`
    if (filterMonth !== "ALL") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`
    }
    filename += ".csv"

    const data = filteredBookings.map((booking) => [
      booking.forWho,
      booking.ContactNo,
      booking.fromPlace,
      booking.toPlace,
      booking.travelDate,
      booking.ReturnDate,
      booking.name,
      booking.status,
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
  }, [filteredBookings, filterStatus, filterMonth])

  // Handle highlighted booking from calendar
  useEffect(() => {
    if (highlightedBookingId && bookings.length > 0) {
      const bookingIndex = sortedBookings.findIndex((booking) => booking.id === highlightedBookingId)
      if (bookingIndex !== -1) {
        const pageNumber = Math.floor(bookingIndex / ITEMS_PER_PAGE) + 1
        setCurrentPage(pageNumber)

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

      const clearTimer = setTimeout(() => {
        setHighlightedBookingId(null)
      }, 5000)

      return () => clearTimeout(clearTimer)
    }
  }, [highlightedBookingId, bookings, sortedBookings])

  // Navigation and highlight effects
  useEffect(() => {
    const handleNavigateToBookings = (event) => {
      const { bookingId, highlight } = event.detail
      if (highlight && bookingId) {
        setHighlightedBookingId(bookingId)
      }
    }

    const storedHighlightId = localStorage.getItem("highlightBookingId")
    if (storedHighlightId) {
      setHighlightedBookingId(Number(storedHighlightId))
      localStorage.removeItem("highlightBookingId")
    }

    window.addEventListener("navigate-to-bookings", handleNavigateToBookings)

    return () => {
      window.removeEventListener("navigate-to-bookings", handleNavigateToBookings)
    }
  }, [])

  // Also handle the original highlightId from location state for backward compatibility
  useEffect(() => {
    if (highlightId) {
      setHighlightedBookingId(highlightId)
      setTimeout(() => {
        const highlightedElement = document.getElementById(`booking-${highlightId}`)
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: "smooth", block: "center" })
          highlightedElement.classList.add("highlight-pulse")
          setTimeout(() => {
            highlightedElement.classList.remove("highlight-pulse")
          }, 2000)
        }
      }, 500)

      setTimeout(() => {
        setHighlightedBookingId(null)
      }, 5000)
    }
  }, [highlightId, bookings])

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 30000)
    return () => {
      clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchBookings])

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition`}
      data-page="bus-bookings"
      style={{
        paddingLeft: sidebarCollapsed ? "50px" : "50px",
      }}
    >
      {initialLoad && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen message="Loading bus booking system..." />
        </div>
      )}

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0e7ff' fillOpacity='0.4'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        ></div>
      </div>

      <style jsx>{`
        .highlight-pulse {
          animation: highlightPulse 2s ease-in-out;
        }
        
        @keyframes highlightPulse {
          0%, 100% { 
            background-color: rgb(219 234 254); 
            border-color: rgb(147 197 253);
            box-shadow: 0 0 0 2px rgb(59 130 246 / 0.3);
          }
          50% { 
            background-color: rgb(191 219 254); 
            border-color: rgb(59 130 246);
            box-shadow: 0 0 0 4px rgb(59 130 246 / 0.5);
          }
        }
      `}</style>

      {showPopup && <SuccessPopup message={popupMessage} />}

      <div className="relative z-10 p-4 xl:p-6 space-y-6 xl:space-y-8">
        {error && (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 shadow-xl backdrop-blur-xl">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Stats Cards with Responsive Layout */}
        <div className="relative">
          <div className="grid grid-cols-4 gap-4 xl:gap-6">
            {/* Total Bookings Card - slides out when sidebar opens */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                sidebarCollapsed
                  ? "opacity-100 scale-100 translate-x-0"
                  : "opacity-0 scale-95 -translate-x-full pointer-events-none"
              }`}
            >
              <StatCard title="Total Bookings" value={stats.total} icon={Bus} color="blue" />
            </div>

            {/* Other 3 cards - slide and center when sidebar opens */}
            <div
              className={`col-span-3 grid grid-cols-3 gap-4 xl:gap-6 transition-all duration-500 ease-in-out ${
                sidebarCollapsed ? "translate-x-0" : "translate-x-[-25%] scale-105"
              }`}
            >
              <div className="transition-all duration-300 ease-in-out hover:scale-105">
                <StatCard title="Approved" value={stats.approved} icon={Check} color="green" />
              </div>
              <div className="transition-all duration-300 ease-in-out hover:scale-105 delay-75">
                <StatCard title="Pending" value={stats.pending} icon={AlertCircle} color="yellow" />
              </div>
              <div className="transition-all duration-300 ease-in-out hover:scale-105 delay-150">
                <StatCard title="Denied" value={stats.denied} icon={XCircle} color="red" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Bus Booking Requests
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Manage and review all bus reservation requests
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 xl:gap-4 items-center justify-between mb-4 xl:mb-6">
              <div className="relative flex-1 max-w-md w-full lg:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                <Input
                  placeholder="Search by passenger, contact, or location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-12 h-12 xl:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                />
              </div>

              <div className="flex flex-wrap gap-2 xl:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                <Select
                  value={filterStatus}
                  onValueChange={(value) => {
                    setFilterStatus(value)
                    setCurrentPage(1)
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
                    setCurrentPage(1)
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

            {/* Enhanced Table */}
            <div className="border-2 border-slate-200/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/95">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b-2 border-slate-200/60 pointer-events-none">
                    <tr>
                      <th className="text-left py-3 xl:py-4 px-3 xl:px-4 font-black text-slate-700 w-12 text-sm xl:text-base pointer-events-auto">
                        <Checkbox
                          checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <ColumnHeader
                        title="Passenger"
                        sortable={true}
                        sortKey="forWho"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Contact"
                        sortable={true}
                        sortKey="ContactNo"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader title="Route" sortable={false} />
                      <ColumnHeader
                        title="Travel Period"
                        sortable={true}
                        sortKey="travelDate"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      {sidebarCollapsed && <ColumnHeader title="Booked By" sortable={false} />}
                      <ColumnHeader
                        title="Status"
                        sortable={true}
                        sortKey="status"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <th className="text-left py-3 xl:py-4 px-3 xl:px-4 font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent text-sm xl:text-base">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/95 backdrop-blur-sm">
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
                          id={`booking-${booking.id}`}
                          data-booking-id={booking.id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors duration-150 ${
                            highlightedBookingId === booking.id || highlightId === booking.id
                              ? "bg-blue-100 border border-blue-300 shadow-lg"
                              : ""
                          }`}
                        >
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={(checked) => handleSelectBooking(booking.id, checked)}
                            />
                          </td>
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <div className="font-semibold text-gray-900 text-sm xl:text-base flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              {booking.forWho}
                            </div>
                          </td>
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <div className="text-sm xl:text-base text-gray-900 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-blue-600" />
                              <span className="truncate max-w-[150px]">{booking.ContactNo}</span>
                            </div>
                          </td>
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span className="text-sm xl:text-base font-medium text-gray-900">
                                {booking.fromPlace} <ArrowRight className="w-3 h-3 inline" /> {booking.toPlace}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span className="font-medium text-gray-900">{formatDate(booking.travelDate)}</span>
                              </div>
                              <div className="text-gray-500 text-xs">to {formatDate(booking.ReturnDate)}</div>
                            </div>
                          </td>
                          {sidebarCollapsed && (
                            <td className="py-3 xl:py-4 px-3 xl:px-4">
                              <span className="text-sm xl:text-base font-medium text-gray-900">{booking.name}</span>
                            </td>
                          )}
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="py-3 xl:py-4 px-3 xl:px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {booking.status === "PENDING" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to approve this booking?")) {
                                          updateStatus(booking.id, "APPROVED")
                                        }
                                      }}
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to reject this booking?")) {
                                          updateStatus(booking.id, "DENIED")
                                        }
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to delete this booking? This action cannot be undone.",
                                      )
                                    ) {
                                      deleteBooking(booking.id)
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </div>
  )
}

export default BusBookingFull
