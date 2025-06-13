"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo, startTransition } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { authRequest } from "../../services/authService"
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
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  XCircle,
  User,
  CheckCircle,
  Copy,
  Building,
  CalendarDays,
  MoreVertical,
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
      purple:
        "bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 text-purple-700 border-purple-300 shadow-purple-200/50",
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
        Showing {startItem}-{endItem} of {totalItems} requests
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

// Optimized Action Menu Component
const ActionMenu = memo(({ request, onStatusUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  const handleAction = useCallback((action, ...args) => {
    setIsOpen(false)
    action(...args)
  }, [])

  const isPending = request.request_status?.toLowerCase() === "pending"

  return (
    <div className="relative" ref={menuRef}>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 backdrop-blur-xl">
          {isPending && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onStatusUpdate, request.id, "Approved")
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-700 font-medium transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction(onStatusUpdate, request.id, "Denied")
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700 font-medium transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Deny Request
              </button>
              <div className="border-t border-gray-100 my-1"></div>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
                handleAction(onDelete, request.id)
              }
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700 font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Request
          </button>
        </div>
      )}
    </div>
  )
})

ActionMenu.displayName = "ActionMenu"

// Optimized Table Row Component
const TableRow = memo(
  ({
    request,
    index,
    isSelected,
    isHighlighted,
    onSelect,
    onDoubleClick,
    onStatusUpdate,
    onDelete,
    formatDate,
    getAcronym,
    copyToClipboard,
  }) => {
    const handleRowClick = useCallback(() => {
      onDoubleClick(request)
    }, [request, onDoubleClick])

    const handleSelectChange = useCallback(
      (checked) => {
        onSelect(request.id, checked)
      },
      [request.id, onSelect],
    )

    return (
      <tr
        data-request-id={request.id}
        onDoubleClick={handleRowClick}
        className={`${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        } hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
          isHighlighted ? "bg-blue-100 border border-blue-300 shadow-lg" : ""
        }`}
      >
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <Checkbox checked={isSelected} onCheckedChange={handleSelectChange} />
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-blue-800 border-blue-300 shadow-blue-200/50 text-xs xl:text-sm font-black px-3 py-1">
              {request.id}
            </Badge>
            <Copy
              size={16}
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(request.id)
              }}
              className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
            />
          </div>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <div className="font-semibold text-gray-900 text-sm xl:text-base flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            {request.requesting_officer_name}
          </div>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <span className="text-sm xl:text-base text-gray-900">{request.designation}</span>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <span className="text-sm xl:text-base text-gray-900">{request.requesting_officer_email}</span>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span
              className="text-sm xl:text-base font-medium text-gray-900 truncate max-w-[200px]"
              title={request.course_name}
            >
              {getAcronym(request.course_name)}
            </span>
          </div>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <Badge className="bg-gradient-to-r from-purple-100 via-violet-100 to-indigo-100 text-purple-800 border-purple-300 shadow-purple-200/50 text-xs xl:text-sm font-black px-3 py-1">
            {request.duration}
          </Badge>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">{formatDate(request.signed_date)}</span>
          </div>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <Badge
            className={`text-xs xl:text-sm font-black px-3 py-1 ${
              request.request_status?.toLowerCase() === "pending"
                ? "bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border-amber-300 shadow-amber-200/50"
                : request.request_status?.toLowerCase() === "approved"
                  ? "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-200/50"
                  : "bg-gradient-to-r from-rose-100 via-red-100 to-pink-100 text-rose-800 border-rose-300 shadow-rose-200/50"
            }`}
          >
            {request.request_status?.toLowerCase() === "pending" && <Clock className="w-3 h-3 mr-1 inline" />}
            {request.request_status?.toLowerCase() === "approved" && <CheckCircle className="w-3 h-3 mr-1 inline" />}
            {request.request_status?.toLowerCase() === "denied" && <XCircle className="w-3 h-3 mr-1 inline" />}
            {request.request_status || "Pending"}
          </Badge>
        </td>
        <td className="py-3 xl:py-4 px-3 xl:px-4">
          <ActionMenu request={request} onStatusUpdate={onStatusUpdate} onDelete={onDelete} />
        </td>
      </tr>
    )
  },
)

TableRow.displayName = "TableRow"

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

const ClassroomBooking = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [aidRequests, setAidRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState("ALL")
  const [selectedRequests, setSelectedRequests] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState({ key: "course_name", direction: "asc" })
  const [showInfo, setShowInfo] = useState(false)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  const [handoverDataList, setHandoverDataList] = useState([])

  // Refs for performance optimization
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef(0)
  const abortControllerRef = useRef(null)
  const infoRef = useRef(null)
  const MIN_FETCH_INTERVAL = 2000

  const highlightId = location.state?.highlightId ? Number(location.state.highlightId) : null
  const ITEMS_PER_PAGE = 10

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Load saved filters
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  useEffect(() => {
    const savedFilters = localStorage.getItem("classroomBookingFilters")
    if (savedFilters) {
      try {
        const { searchTerm, filterStatus, filterMonth } = JSON.parse(savedFilters)
        if (searchTerm !== undefined) setSearchTerm(searchTerm)
        if (filterStatus !== undefined) setFilterStatus(filterStatus)
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
      filterStatus,
      filterMonth,
    }
    localStorage.setItem("classroomBookingFilters", JSON.stringify(filtersToStore))
  }, [searchTerm, filterStatus, filterMonth, filtersLoaded])

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

  const getAcronym = useCallback((courseName) => {
    if (!courseName) return ""
    return courseName
      .replace(/[$$$$[\]]/g, "")
      .replace(/[-–—]/g, " _HYPHEN_ ")
      .replace(/&/g, " _AMP_ ")
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => {
        if (word === "_HYPHEN_") return "-"
        if (word === "_AMP_") return "&"
        const letter = word[0].toUpperCase()
        return /[A-Z]/.test(letter) ? letter : ""
      })
      .join("")
  }, [])

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setSuccessMessage(`Copied ID: ${text}`)
        setTimeout(() => setSuccessMessage(""), 3000)
      })
      .catch(() => {
        setSuccessMessage("Failed to copy ID")
        setTimeout(() => setSuccessMessage(""), 3000)
      })
  }, [])

  // Optimized sidebar state sync
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

  // Optimized fetch function
  const fetchAidRequests = useCallback(async () => {
    if (fetchInProgress.current) return
    const now = Date.now()
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return

    try {
      fetchInProgress.current = true
      lastFetchTime.current = now

      if (aidRequests.length === 0 || now - lastFetchTime.current > 10000) {
        setLoading(true)
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const response = await authRequest("get", "http://localhost:5003/api/aidrequests", null, {
        signal: abortControllerRef.current.signal,
      })

      const data = response.data
      const requests = data.success ? data.data : data

      startTransition(() => {
        setAidRequests(requests || [])
        setError(null)
      })
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching aid requests:", error)
        setError("Failed to fetch classroom booking requests. Please try again later.")
      }
    } finally {
      fetchInProgress.current = false
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  const fetchHandoverData = useCallback(async () => {
    try {
      const response = await authRequest("get", "http://localhost:5003/api/aidhandover")
      setHandoverDataList(response || [])
    } catch (error) {
      console.error("Error fetching handover data:", error)
    }
  }, [])

  // Memoized filtered requests with optimized filtering
  const filteredRequests = useMemo(() => {
    if (!aidRequests.length) return []

    return aidRequests.filter((req) => {
      // Status filter
      if (filterStatus !== "ALL") {
        const reqStatus = req.request_status?.toLowerCase() || "pending"
        if (reqStatus !== filterStatus.toLowerCase()) return false
      }

      // Month filter
      if (filterMonth !== "ALL") {
        const reqMonth = req.date_from ? new Date(req.date_from).getMonth() : -1
        if (reqMonth !== Number.parseInt(filterMonth)) return false
      }

      // Search filter
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase()
        const matchesSearch =
          req.requesting_officer_name?.toLowerCase().includes(term) ||
          req.requesting_officer_email?.toLowerCase().includes(term) ||
          req.course_name?.toLowerCase().includes(term) ||
          req.id?.toString().includes(term)

        return matchesSearch
      }

      return true
    })
  }, [aidRequests, debouncedSearchTerm, filterStatus, filterMonth])

  // Optimized sort with memoization
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let valueA, valueB

      switch (sort.key) {
        case "course_name":
          valueA = a.course_name || ""
          valueB = b.course_name || ""
          break
        case "signed_date":
          valueA = new Date(a.signed_date).getTime()
          valueB = new Date(b.signed_date).getTime()
          break
        case "requesting_officer_name":
          valueA = a.requesting_officer_name || ""
          valueB = b.requesting_officer_name || ""
          break
        case "request_status":
          valueA = a.request_status || ""
          valueB = b.request_status || ""
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
  }, [filteredRequests, sort])

  // Paginate the sorted requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedRequests, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)), [filteredRequests])

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
    const total = aidRequests.length
    const pending = aidRequests.filter((req) => req.request_status?.toLowerCase() === "pending").length
    const approved = aidRequests.filter((req) => req.request_status?.toLowerCase() === "approved").length
    const denied = aidRequests.filter((req) => req.request_status?.toLowerCase() === "denied").length
    const thisMonth = aidRequests.filter((req) => {
      const reqMonth = req.signed_date ? new Date(req.signed_date).getMonth() : -1
      return reqMonth === new Date().getMonth()
    }).length

    return { total, pending, approved, denied, thisMonth }
  }, [aidRequests])

  // Status update function
  const handleStatusUpdate = useCallback(
    async (id, status) => {
      try {
        const requestToUpdate = aidRequests.find((req) => req.id === id)
        if (!requestToUpdate) {
          console.error(`Request with ID ${id} not found.`)
          return
        }

        let payment_status = requestToUpdate.payment_status

        if (status === "Approved") {
          if (requestToUpdate.paid_course_or_not === "Yes") {
            payment_status = "Paid"
          }
        } else if (status === "Denied") {
          if (requestToUpdate.paid_course_or_not === "Yes") {
            payment_status = "Cancelled"
          }
        }

        await authRequest("put", `http://localhost:5003/api/aidrequests/${id}`, {
          request_status: status,
          payment_status,
        })

        // Optimistic update
        setAidRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  request_status: status,
                  payment_status,
                }
              : req,
          ),
        )

        setSuccessMessage(`Request ${id} marked as ${status}`)
        setTimeout(() => setSuccessMessage(""), 3000)
      } catch (error) {
        console.error(`Error updating request ${id} to ${status}:`, error)
        setError(`Failed to update request ${id}. Please try again.`)
        await fetchAidRequests()
      }
    },
    [aidRequests, fetchAidRequests],
  )

  // Delete function
  const handleDelete = useCallback(
    async (id) => {
      try {
        await authRequest("delete", `http://localhost:5003/api/aidrequests/${id}`)

        // Optimistic update
        setAidRequests((prev) => prev.filter((req) => req.id !== id))
        setSelectedRequests((prev) => prev.filter((reqId) => reqId !== id))

        setSuccessMessage(`Request ${id} deleted successfully`)
        setTimeout(() => setSuccessMessage(""), 3000)
      } catch (error) {
        console.error(`Error deleting request ${id}:`, error)
        setError(`Failed to delete request ${id}. Please try again.`)
        await fetchAidRequests()
      }
    },
    [fetchAidRequests],
  )

  // Bulk delete function
  const handleBulkDelete = useCallback(async () => {
    if (selectedRequests.length === 0) return

    if (!window.confirm(`Are you sure you want to delete ${selectedRequests.length} selected request(s)?`)) return

    try {
      const promises = selectedRequests.map((id) =>
        authRequest("delete", `http://localhost:5003/api/aidrequests/${id}`),
      )

      await Promise.all(promises)

      // Optimistic update
      setAidRequests((prev) => prev.filter((req) => !selectedRequests.includes(req.id)))
      setSelectedRequests([])

      setSuccessMessage("Bulk delete completed successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Error performing bulk delete:", err)
      setError("Failed to delete selected requests")
      await fetchAidRequests()
    }
  }, [selectedRequests, fetchAidRequests])

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedRequests(paginatedRequests.map((req) => req.id))
      } else {
        setSelectedRequests([])
      }
    },
    [paginatedRequests],
  )

  const handleSelectRequest = useCallback((requestId, checked) => {
    setSelectedRequests((prev) => {
      if (checked) {
        return [...prev, requestId]
      } else {
        return prev.filter((id) => id !== requestId)
      }
    })
  }, [])

  // Export function
  const handleExport = useCallback(() => {
    if (!window.confirm("Are you sure you want to export the current classroom booking data to CSV?")) return

    const headers = [
      "Request ID",
      "Officer Name",
      "Designation",
      "Email",
      "Course",
      "Duration",
      "Audience",
      "Participants",
      "Coordinator",
      "Signed Date",
      "Status",
    ]

    const data = filteredRequests.map((req) => [
      req.id,
      req.requesting_officer_name,
      req.designation,
      req.requesting_officer_email,
      req.course_name,
      req.duration,
      req.audience_type,
      req.no_of_participants,
      req.course_coordinator,
      req.signed_date,
      req.request_status,
    ])

    let filename = "classroom_booking_requests"
    if (filterStatus !== "ALL") {
      filename += `_${filterStatus.toLowerCase()}`
    }
    if (filterMonth !== "ALL") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`
    }
    filename += ".csv"

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
  }, [filteredRequests, filterStatus, filterMonth])

  const handleResetFilters = useCallback(() => {
    setSearchTerm("")
    setFilterStatus("ALL")
    setFilterMonth("ALL")
    setCurrentPage(1)
    localStorage.removeItem("classroomBookingFilters")
  }, [])

  const handleRowDoubleClick = useCallback(
    (req) => {
      const matchingHandover = handoverDataList.find((h) => Number(h.request_id) === Number(req.id))

      navigate("/singlebookingdetails", {
        state: {
          request: req,
          handover: matchingHandover || null,
          sidebarState: sidebarCollapsed,
        },
      })
    },
    [handoverDataList, navigate, sidebarCollapsed],
  )

  // Handle highlighted request
  useEffect(() => {
    if (highlightId !== null) {
      setTimeout(() => {
        const row = document.querySelector(`tr[data-request-id="${highlightId}"]`)
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
    }

    if (showInfo) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showInfo])

  // Initial fetch and periodic updates
  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      fetchAidRequests()
      fetchHandoverData()
    }, 100)

    let pollInterval = 30000
    let inactiveTime = 0
    let lastActivityTime = Date.now()

    const activityHandler = () => {
      const now = Date.now()
      if (now - lastActivityTime > 60000) {
        fetchAidRequests()
      }
      lastActivityTime = now
      inactiveTime = 0
      pollInterval = 30000
    }

    window.addEventListener("mousemove", activityHandler)
    window.addEventListener("keydown", activityHandler)
    window.addEventListener("click", activityHandler)

    const pollTimer = setInterval(() => {
      const now = Date.now()
      inactiveTime = now - lastActivityTime

      if (inactiveTime > 120000) {
        pollInterval = 60000
      }
      if (inactiveTime > 300000) {
        pollInterval = 120000
      }

      fetchAidRequests()
    }, pollInterval)

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
  }, [fetchAidRequests, fetchHandoverData])

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition`}
      data-page="classroom-booking"
      style={{
        paddingLeft: sidebarCollapsed ? "50px" : "50px",
      }}
    >
      {initialLoad && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen message="Loading classroom booking system..." type="bookings" />
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

      {successMessage && <SuccessPopup message={successMessage} />}

      <div className="relative z-10 p-4 xl:p-6 space-y-6 xl:space-y-8">
        {error && (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 shadow-xl backdrop-blur-xl">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 xl:gap-6">
          <StatCard title="Total Requests" value={stats.total} icon={Building} color="blue" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
          <StatCard title="Denied" value={stats.denied} icon={XCircle} color="red" />
          <StatCard title="This Month" value={stats.thisMonth} icon={CalendarDays} color="purple" />
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
                  <Building className="w-8 h-8 text-blue-600" />
                  Classroom Booking Details
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Manage and review all classroom booking requests in one place
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 xl:gap-4 items-center justify-between mb-4 xl:mb-6">
              <div className="flex gap-3 flex-1 max-w-2xl w-full lg:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                  <Input
                    placeholder="Search by name, email, request ID or course..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-12 h-12 xl:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                  />
                </div>

                <div className="relative" ref={infoRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowInfo(!showInfo)}
                    className="h-12 xl:h-14 w-12 xl:w-14 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                  >
                    <Info className="w-5 h-5" />
                  </Button>

                  {showInfo && (
                    <div className="absolute top-16 right-0 z-50 w-80 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200">
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          🌟 Tips:
                        </h4>
                        <p className="text-sm text-slate-600 font-medium">
                          Double-click records to view more details in the table below.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
                  onClick={handleResetFilters}
                  className="h-12 xl:h-14 px-6 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="h-12 xl:h-14 px-6 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedRequests.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-4 xl:p-6 mb-4 xl:mb-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    {selectedRequests.length} request(s) selected
                  </span>
                  <div className="flex flex-wrap gap-2 xl:gap-3">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 hover:from-rose-600 hover:via-red-600 hover:to-pink-600 text-white shadow-xl font-bold text-xs xl:text-sm rounded-xl transform hover:scale-105 transition-all duration-300"
                      onClick={handleBulkDelete}
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
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b-2 border-slate-200/60">
                    <tr>
                      <th className="text-left py-3 xl:py-4 px-3 xl:px-4 font-black text-slate-700 w-12 text-sm xl:text-base">
                        <Checkbox
                          checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <ColumnHeader
                        title="Request ID"
                        sortable={true}
                        sortKey="id"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Officer Name"
                        sortable={true}
                        sortKey="requesting_officer_name"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader title="Designation" sortable={false} />
                      <ColumnHeader title="Email" sortable={false} />
                      <ColumnHeader
                        title="Course Name"
                        sortable={true}
                        sortKey="course_name"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader title="Duration" sortable={false} />
                      <ColumnHeader
                        title="Signed Date"
                        sortable={true}
                        sortKey="signed_date"
                        currentSort={sort}
                        onSort={setSort}
                      />
                      <ColumnHeader
                        title="Status"
                        sortable={true}
                        sortKey="request_status"
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
                        <td colSpan={10} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          No classroom booking requests found
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((req, index) => (
                        <TableRow
                          key={req.id}
                          request={req}
                          index={index}
                          isSelected={selectedRequests.includes(req.id)}
                          isHighlighted={highlightId === req.id}
                          onSelect={handleSelectRequest}
                          onDoubleClick={handleRowDoubleClick}
                          onStatusUpdate={handleStatusUpdate}
                          onDelete={handleDelete}
                          formatDate={formatDate}
                          getAcronym={getAcronym}
                          copyToClipboard={copyToClipboard}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && filteredRequests.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredRequests.length}
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

export default ClassroomBooking
