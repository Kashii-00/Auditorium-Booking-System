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
  AlertCircle,
  XCircle,
  Bus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MapPin,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Navigation,
  Route,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl'

// Lazy load heavy components
const LoadingScreen = lazy(() => import("../LoadingScreen/LoadingScreen"))

// Performance optimized CSS
const PERFORMANCE_CSS = `
  .hardware-accelerated {
    transform: translate3d(0, 0, 0);
    will-change: auto;
  }

  .card-transition {
    transition: transform 120ms ease-out;
  }

  .booking-card {
    transition: transform 120ms ease-out;
  }

  .booking-card:hover {
    transform: translateY(-1px);
  }

  .table-row {
    transition: background-color 120ms ease-out;
  }

  .table-row:hover {
    background: rgba(59, 130, 246, 0.03);
  }

  .highlight-pulse {
    animation: highlightPulse 1.5s ease-in-out;
  }

  @keyframes highlightPulse {
    0% { background-color: rgba(59, 130, 246, 0.15); }
    50% { background-color: rgba(59, 130, 246, 0.3); }
    100% { background-color: rgba(59, 130, 246, 0.1); }
  }

  /* Optimize scrolling */
  * {
    scroll-behavior: smooth;
  }

  /* Reduce paint complexity */
  .backdrop-blur-xl {
    backdrop-filter: blur(4px);
  }

  .shadow-2xl {
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
  }
`

// Memoized components for better performance
const SuccessPopup = memo(({ message }) => (
  <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 border border-white/20">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div>
        <p className="font-bold text-base">{message}</p>
        <p className="text-emerald-100 text-sm">Action completed successfully</p>
      </div>
    </div>
  </div>
))

SuccessPopup.displayName = "SuccessPopup"

// Circular progress ring StatCard with our color palette for bus bookings
const StatCard = memo(({ title, value, icon: Icon, color = "blue", progress = 75 }) => {
  const colorConfig = useMemo(
    () => ({
      blue: {
        ring: "stroke-blue-500",
        bg: "bg-blue-50",
        iconBg: "bg-blue-500",
      },
      green: {
        ring: "stroke-emerald-500",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-500",
      },
      purple: {
        ring: "stroke-purple-500",
        bg: "bg-purple-50",
        iconBg: "bg-purple-500",
      },
      orange: {
        ring: "stroke-orange-500",
        bg: "bg-orange-50",
        iconBg: "bg-orange-500",
      },
      yellow: {
        ring: "stroke-yellow-500",
        bg: "bg-yellow-50",
        iconBg: "bg-yellow-500",
      },
      red: {
        ring: "stroke-red-500",
        bg: "bg-red-50",
        iconBg: "bg-red-500",
      },
      gray: {
        ring: "stroke-slate-300",
        bg: "bg-slate-50",
        iconBg: "bg-slate-400",
      },
    }),
    [],
  )

  const config = colorConfig[color] || colorConfig.blue
  const circumference = 2 * Math.PI * 42
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center group">
      <div className="relative pt-2">
        <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 2xl:w-20 2xl:h-20 rounded-full ${config.bg} shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center relative overflow-hidden`}>
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-200"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="4"
              className={config.ring}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>
          
          <div className="relative z-10">
            <Icon className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6 text-slate-700 group-hover:scale-105 transition-transform duration-200" />
          </div>
        </div>

        <div className="absolute -bottom-1 md:-bottom-1.5 lg:-bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full shadow-md px-1.5 py-0.5 md:px-2 md:py-0.5 lg:px-2.5 lg:py-1 border border-slate-200">
            <span className="text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl font-black text-slate-800">{value}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2 md:mt-3 lg:mt-4 text-center">
        <h3 className="text-xs md:text-xs lg:text-sm font-bold text-slate-700 leading-tight">{title}</h3>
      </div>
    </div>
  )
})

StatCard.displayName = "StatCard"

// Optimized Booking Row Component - Styled like EventBooking
const BookingRow = memo(({ booking, onApprove, onDeny, onDelete, selectedBookings, onSelectBooking, confirmDeleteId, loading, highlightedBookingId, sidebarCollapsed }) => {
  const handleSelect = useCallback((checked) => onSelectBooking(booking.id, checked), [onSelectBooking, booking.id])
  const handleApprove = useCallback(() => onApprove(booking.id, "APPROVED"), [onApprove, booking.id])
  const handleDeny = useCallback(() => onDeny(booking.id, "DENIED"), [onDeny, booking.id])
  const handleDelete = useCallback(() => onDelete(booking.id), [onDelete, booking.id])
  const handleCancelDelete = useCallback(() => onDelete(null), [onDelete])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [])

  return (
    <tr 
      key={booking.id}
      data-booking-id={booking.id}
      className={`table-row border-b border-slate-200 hover:bg-blue-50 transition-colors duration-150 ${
        highlightedBookingId === booking.id ? "bg-blue-100 border border-blue-300" : ""
      }`}
    >
      <td className="p-4">
        <Checkbox
          checked={selectedBookings.includes(booking.id)}
          onCheckedChange={handleSelect}
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-blue-200">
            <AvatarImage src={`/placeholder.svg?height=48&width=48&query=passenger`} />
            <AvatarFallback className="bg-blue-500 text-white font-bold">
              {booking.forWho
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "P"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900">{booking.forWho || "N/A"}</div>
            <div className="text-sm text-slate-500 font-semibold">
              <Bus className="w-3 h-3 inline mr-1" />
              Bus Reservation
            </div>
          </div>
        </div>
      </td>
      <td className={`p-4 transition-all duration-300 ${
        !sidebarCollapsed ? 'hidden opacity-0 w-0' : 'table-cell opacity-100'
      }`}>
        <div className="text-sm font-semibold text-slate-700">{booking.ContactNo || "N/A"}</div>
      </td>
      <td className={`p-4 transition-all duration-300 ${
        !sidebarCollapsed ? 'hidden opacity-0 w-0' : 'table-cell opacity-100'
      }`}>
        <div className="text-sm">
          <div className="font-bold text-slate-900">Booked By</div>
          <div className="text-slate-600 font-medium">{booking.name || "-"}</div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div className="font-bold text-slate-900 flex items-center gap-1">
            <Route className="w-3 h-3 text-slate-500" />
            {booking.fromPlace} → {booking.toPlace}
          </div>
          <div className="text-slate-600 font-medium mt-1">
            <Navigation className="w-3 h-3 inline mr-1" />
            Bus Route
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div className="font-bold text-slate-900">
            <CalendarDays className="w-3 h-3 inline mr-1 text-slate-500" />
            {formatDate(booking.travelDate)}
          </div>
          <div className="text-slate-600 font-medium mt-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            to {formatDate(booking.ReturnDate)}
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge
          variant="outline"
          className={`font-bold px-3 py-1 ${
            booking.status === "APPROVED"
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : booking.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
              : booking.status === "DENIED"
              ? "bg-red-100 text-red-800 border-red-300"
              : "bg-slate-100 text-slate-800 border-slate-300"
          }`}
        >
          <Activity className="h-3 w-3 mr-1" />
          {booking.status || "Unknown"}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          {booking.status === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleApprove}
                className="flex items-center gap-1 hover:bg-emerald-50 hover:border-emerald-300 border transition-colors"
                title="Approve Booking"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeny}
                className="flex items-center gap-1 hover:bg-yellow-50 hover:border-yellow-300 border transition-colors duration-150"
                title="Deny Booking"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {confirmDeleteId === booking.id ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="hover:bg-red-700"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Confirm"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelDelete} className="hover:bg-gray-50 border">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border transition-colors"
              title="Delete Booking"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
})

BookingRow.displayName = "BookingRow"

// Table Header Component - Styled like EventBooking
const BookingTableHeader = memo(({ onSort, sortField, sortDirection, onSelectAll, selectedBookings, totalBookings, sidebarCollapsed }) => {
  const getSortIcon = useCallback(
    (field) => {
      if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
      return sortDirection === "asc" ? <ArrowUpDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4 rotate-180" />
    },
    [sortField, sortDirection],
  )

  return (
    <thead>
      <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
        <th className="text-left p-4 font-black text-slate-700 rounded-tl-xl">
          <Checkbox
            checked={selectedBookings.length === totalBookings && totalBookings > 0}
            onCheckedChange={onSelectAll}
          />
        </th>
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onSort("forWho")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Passenger
            {getSortIcon("forWho")}
          </div>
        </th>
        <th
          className={`text-left p-4 cursor-pointer hover:bg-blue-100 transition-all duration-300 ${
            !sidebarCollapsed ? 'hidden opacity-0 w-0' : 'table-cell opacity-100'
          }`}
          onClick={() => onSort("ContactNo")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Contact
            {getSortIcon("ContactNo")}
          </div>
        </th>
        <th className={`text-left p-4 font-black text-slate-700 transition-all duration-300 ${
          !sidebarCollapsed ? 'hidden opacity-0 w-0' : 'table-cell opacity-100'
        }`}>Booked By</th>
        <th className="text-left p-4 font-black text-slate-700">Route Details</th>
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onSort("travelDate")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Travel Period
            {getSortIcon("travelDate")}
          </div>
        </th>
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onSort("status")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Status
            {getSortIcon("status")}
          </div>
        </th>
        <th className="text-left p-4 font-black text-slate-700 rounded-tr-xl">Actions</th>
      </tr>
    </thead>
  )
})

BookingTableHeader.displayName = "BookingTableHeader"

// Pagination Controls Component - Styled like EventBooking
const BookingPaginationControls = memo(
  ({ currentPage, totalPages, indexOfFirstBooking, indexOfLastBooking, totalItems, onPageChange, itemsPerPage }) => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mt-6 pt-1 border-t-2 border-slate-200 px-6">
          <div className="text-sm text-slate-600 font-semibold pb-10">
            Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, totalItems)} of {totalItems} bookings
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 7) {
                pageNumber = i + 1;
              } else {
                const start = Math.max(1, currentPage - 3);
                const end = Math.min(totalPages, start + 6);
                const adjustedStart = Math.max(1, end - 6);
                pageNumber = adjustedStart + i;
              }
              
              if (pageNumber > totalPages) return null;
              
              return (
                <Button
                  key={`page-${pageNumber}`}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className={`border-2 rounded-xl font-bold ${
                    currentPage === pageNumber
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {pageNumber}
                </Button>
              )
            }).filter(Boolean)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              Last
            </Button>
          </div>
        </div>

        {totalPages > 5 && (
          <div className="flex justify-center pb-4 items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Jump to page:</span>
            <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden w-24">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page)
                  }
                }}
                className="border-0 h-8 text-center p-0"
              />
            </div>
            <span className="text-sm text-slate-500">of {totalPages}</span>
          </div>
        )}
      </div>
    )
  },
)

BookingPaginationControls.displayName = "BookingPaginationControls"

// Records Per Page Selector Component - Styled like EventBooking
const BookingRecordsPerPageSelector = memo(({ value, onChange, options }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 font-semibold">Show</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-2 border-slate-200 rounded-lg p-1 text-sm font-semibold bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-slate-600 font-semibold">records per page</span>
    </div>
  )
})

BookingRecordsPerPageSelector.displayName = "BookingRecordsPerPageSelector"

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

export default function BusBookingFull() {
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
  const [sort, setSort] = useState({ key: "forWho", direction: "asc" })
  const [popupMessage, setPopupMessage] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Items per page options
  const recordsPerPageOptions = [5, 10, 25, 50]

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Memoized API call
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
              const bookingsData = await authRequest("get", getApiUrl("/busBookings"))
      setBookings(bookingsData)
      setError(null)
    } catch (err) {
      console.error("Error fetching bus bookings:", err)
      setError("Failed to fetch bus bookings")
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

  // Optimized status update with batching
  const updateStatus = useCallback(
    async (id, status) => {
      try {
        await authRequest("put", getApiUrl(`/busBookings/${id}`), { status })

        // Optimistic update for better UX
        setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)))

        setError(null)
        setPopupMessage(`Bus booking status updated to ${status}`)
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
      } catch (err) {
        console.error("Error updating status:", err)
        setError("Failed to update bus booking status")
        // Revert optimistic update on error
        await fetchBookings()
      }
    },
    [fetchBookings],
  )

  // Optimized delete with batching
  const deleteBooking = useCallback(
    async (id) => {
      if (id === null) {
        setConfirmDeleteId(null)
        return
      }

      if (confirmDeleteId !== id) {
        setConfirmDeleteId(id)
        return
      }

      try {
        setLoading(true)
        await authRequest("delete", getApiUrl(`/busBookings/${id}`))

        // Optimistic update
        setBookings((prev) => prev.filter((booking) => booking.id !== id))
        setSelectedBookings((prev) => prev.filter((bookingId) => bookingId !== id))

        setError(null)
        setPopupMessage("Bus booking deleted successfully")
        setShowPopup(true)
        setTimeout(() => setShowPopup(false), 3000)
        setConfirmDeleteId(null)
      } catch (err) {
        console.error("Error deleting booking:", err)
        setError("Failed to delete bus booking")
        // Revert optimistic update on error
        await fetchBookings()
      } finally {
        setLoading(false)
      }
    },
    [fetchBookings, confirmDeleteId],
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
              return authRequest("put", getApiUrl(`/busBookings/${id}`), { status: "APPROVED" })
            case "reject":
                              return authRequest("put", getApiUrl(`/busBookings/${id}`), { status: "DENIED" })
            case "delete":
                              return authRequest("delete", getApiUrl(`/busBookings/${id}`))
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
        (booking.forWho?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.ContactNo?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.fromPlace?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.toPlace?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
        (booking.name?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase())

      const matchesStatus = filterStatus === "ALL" || booking.status === filterStatus
      const matchesMonth =
        filterMonth === "ALL" || new Date(booking.travelDate).getMonth() === Number.parseInt(filterMonth)

      return matchesSearch && matchesStatus && matchesMonth
    })
  }, [bookings, debouncedSearchTerm, filterStatus, filterMonth])

  // Sort the filtered bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valueA, valueB

      // Extract the values to compare based on sort key
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
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedBookings.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedBookings, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage)), [filteredBookings, itemsPerPage])

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

  // Handle sorting
  const handleSort = useCallback((field) => {
    setSort(prev => ({
      key: field,
      direction: prev.key === field && prev.direction === "asc" ? "desc" : "asc"
    }))
  }, [])

  // Optimized CSV export
  const exportToCSV = useCallback(() => {
    if (!window.confirm("Are you sure you want to export the current bus booking data to CSV?")) return

    const headers = ["Passenger", "Contact", "From", "To", "Travel Date", "Return Date", "Booked By", "Status"]

    let filename = "bus_bookings"
    if (filterStatus !== "ALL") {
      filename += `_${filterStatus.toLowerCase()}`
    }
    if (filterMonth !== "ALL") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`
    }
    filename += ".csv"

    const data = filteredBookings.map((booking) => [
      booking.forWho || "N/A",
      booking.ContactNo || "N/A",
      booking.fromPlace || "N/A",
      booking.toPlace || "N/A",
      formatDate(booking.travelDate),
      formatDate(booking.ReturnDate),
      booking.name || "N/A",
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
  }, [filteredBookings, filterStatus, filterMonth, formatDate])

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
          const pageNumber = Math.floor(bookingIndex / itemsPerPage) + 1
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
  }, [highlightedBookingId, bookings, sortedBookings, itemsPerPage])

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
    const styleSheet = document.createElement("style")
    styleSheet.textContent = PERFORMANCE_CSS
    document.head.appendChild(styleSheet)
    return () => document.head.removeChild(styleSheet)
  }, [])

  return (
    <div
      className="min-h-screen w-full bg-slate-50 relative"
      data-page="bus-bookings"
    >
      {/* Initial loading screen */}
      {initialLoad && (
        <Suspense fallback={<div>Loading...</div>}>
          <div className="fixed inset-0 z-50">
            <LoadingScreen message="Loading bus booking system..." type="bus-bookings" />
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

        {/* Main Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Bus Booking Requests
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  View and manage all bus reservation requests
                </p>
              </div>
              
              {/* Stats Cards */}
              <div className="flex flex-wrap lg:flex-nowrap gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 justify-center lg:justify-end">
                <StatCard
                  title="Total Bookings"
                  value={stats.total}
                  icon={Bus}
                  color="blue"
                  progress={100}
                />
                <StatCard
                  title="Approved"
                  value={stats.approved}
                  icon={CheckCircle2}
                  color="green"
                  progress={stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={AlertTriangle}
                  color="yellow"
                  progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
                />
                <StatCard
                  title="Denied"
                  value={stats.rejected}
                  icon={XCircle}
                  color="red"
                  progress={stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 xl:gap-4 items-center justify-between mb-4 xl:mb-6">
              {/* Records per page selector - moved from bottom */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-semibold">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when changing items per page
                  }}
                  className="border-2 border-slate-200 rounded-lg p-1 text-sm font-semibold bg-white"
                >
                  {recordsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-600 font-semibold">records per page</span>
              </div>

              {/* Search bar - centered */}
              <div className="relative flex-1 max-w-md w-full lg:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                <Input
                  placeholder="Search by passenger, contact, or location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  className="pl-12 h-12 xl:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                />
              </div>

              {/* Filters and Export */}
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
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <BookingTableHeader
                    onSort={handleSort}
                    sortField={sort.key}
                    sortDirection={sort.direction}
                    onSelectAll={handleSelectAll}
                    selectedBookings={selectedBookings}
                    totalBookings={paginatedBookings.length}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={sidebarCollapsed ? 8 : 6} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan={sidebarCollapsed ? 8 : 6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <Bus className="h-16 w-16 text-slate-300 mb-4" />
                            <p className="text-lg font-semibold">No bus bookings found</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.map((booking) => (
                        <BookingRow
                          key={booking.id}
                          booking={booking}
                          onApprove={updateStatus}
                          onDeny={updateStatus}
                          onDelete={deleteBooking}
                          selectedBookings={selectedBookings}
                          onSelectBooking={handleSelectBooking}
                          confirmDeleteId={confirmDeleteId}
                          loading={loading}
                          highlightedBookingId={highlightedBookingId}
                          sidebarCollapsed={sidebarCollapsed}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && filteredBookings.length > 0 && (
                <BookingPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  indexOfFirstBooking={(currentPage - 1) * itemsPerPage}
                  indexOfLastBooking={currentPage * itemsPerPage}
                  totalItems={filteredBookings.length}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        `,
        }}
      />
    </div>
  )
}
