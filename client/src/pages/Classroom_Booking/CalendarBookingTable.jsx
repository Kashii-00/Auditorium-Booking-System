"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  startTransition,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import WeeklyTimetable from "./WeeklyTimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Hash,
  Mail,
} from "lucide-react";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

// Optimized debounce utility
const debounce = (func, wait) => {
  let timeout;
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
};

// Memoized Success popup component with focus management
const SuccessPopup = memo(({ message }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (popupRef.current) {
      // Focus the popup to draw user attention
      popupRef.current.focus();
      // Scroll to ensure it's visible
      popupRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-emerald-300"
      style={{
        animation:
          "slideInFromRight 0.5s ease-out, pulse 0.8s ease-in-out 0.3s",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
          <Check className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black text-lg leading-tight">{message}</p>
          <p className="text-emerald-100 text-sm mt-1">
            Action completed successfully!
          </p>
        </div>
      </div>
    </div>
  );
});

SuccessPopup.displayName = "SuccessPopup";

// Memoized Error popup component with focus management
const ErrorPopup = memo(({ message }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (popupRef.current) {
      // Focus the popup to draw user attention
      popupRef.current.focus();
      // Scroll to ensure it's visible
      popupRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed top-6 right-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-6 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right-4 duration-500 border border-white/20 backdrop-blur-xl max-w-md focus:outline-none focus:ring-4 focus:ring-red-300"
      style={{
        animation:
          "slideInFromRight 0.5s ease-out, shake 0.6s ease-in-out 0.3s",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <XCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black text-lg leading-tight">Error</p>
          <p className="text-red-100 text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
});

ErrorPopup.displayName = "ErrorPopup";

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
));

TableSkeleton.displayName = "TableSkeleton";

// Column header with sort functionality - styled like BusBookingList
const ColumnHeader = memo(
  ({ title, sortable = false, sortKey, currentSort, onSort, width = "" }) => {
    const handleSort = useCallback(() => {
      if (sortable && onSort) {
        if (currentSort.key === sortKey) {
          onSort({
            key: sortKey,
            direction: currentSort.direction === "asc" ? "desc" : "asc",
          });
        } else {
          onSort({ key: sortKey, direction: "asc" });
        }
      }
    }, [sortable, sortKey, currentSort, onSort]);

    return (
      <th
        className={`text-left p-4 font-black text-slate-700 ${width} ${
          sortable ? "cursor-pointer hover:bg-blue-100 transition-colors" : ""
        }`}
        onClick={handleSort}
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {sortable && <ArrowUpDown className="w-4 h-4" />}
        </div>
      </th>
    );
  }
);

ColumnHeader.displayName = "ColumnHeader";

// Pagination Controls Component - Styled like BusBookingList
const CalendarPaginationControls = memo(
  ({
    currentPage,
    totalPages,
    indexOfFirstBooking,
    indexOfLastBooking,
    totalItems,
    onPageChange,
  }) => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mt-6 pt-1 border-t-2 border-slate-200 px-6">
          <div className="text-sm text-slate-600 font-semibold pb-10">
            Showing {indexOfFirstBooking + 1} to{" "}
            {Math.min(indexOfLastBooking, totalItems)} of {totalItems} bookings
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
              <ChevronLeft className="w-4 h-4 mr-1" />
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
              );
            }).filter(Boolean)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
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
      </div>
    );
  }
);

CalendarPaginationControls.displayName = "CalendarPaginationControls";

// Booking Details Component
const BookingDetails = memo(
  ({ booking, onClose, formatDate, formatTime, navigate }) => {
    const detailsRef = useRef(null);

    useEffect(() => {
      if (detailsRef.current) {
        detailsRef.current.focus();
        detailsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, []);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (detailsRef.current && !detailsRef.current.contains(event.target)) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [onClose]);

    if (!booking) return null;

    return (
      <div
        ref={detailsRef}
        tabIndex={-1}
        className="w-4/5 mx-auto mt-6 mb-10 bg-white border-2 border-blue-200 rounded-xl shadow-lg p-6 animate-in fade-in-0 slide-in-from-top-2 duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Booking Details
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">
                Booking ID
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="w-4 h-4 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  {booking.id}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                User ID
              </label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.user_id}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Request ID
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-blue-600" />
                {booking.request_id ? (
                  <Badge
                    className="bg-green-100 text-green-800 border-green-300 cursor-pointer"
                    onClick={() => {
                      localStorage.setItem(
                        "classroomBookingFilters",
                        JSON.stringify({
                          searchTerm: booking.request_id.toString(),
                          searchType: "request_id",
                          filterStatus: "ALL",
                          startDate: "",
                          endDate: "",
                          filterMonth: "ALL",
                        })
                      );
                      navigate("/classroombooking", {
                        state: {
                          highlightId: Number(booking.request_id),
                        },
                      });
                    }}
                  >
                    {booking.request_id}
                  </Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">
                Course Name
              </label>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.course_name}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Requesting Officer Name
              </label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.req_officer_name || "—"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Requesting Officer Email
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.req_officer_email || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">
                Date Period
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-900">
                    {formatDate(booking.date_from)}
                  </div>
                  <div className="text-slate-600">
                    to {formatDate(booking.date_to)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Time Period
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-900">
                    {formatTime(booking.time_from)}
                  </div>
                  <div className="text-slate-600">
                    to {formatTime(booking.time_to)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Preferred Days
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.preferred_days_of_week || "—"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                Classes Allocated
              </label>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">
                  {booking.classes_allocated || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BookingDetails.displayName = "BookingDetails";

// Debounced search hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CalendarBookingTable = () => {
  const [bookings, setBookings] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [showWeeklyTimetable, setShowWeeklyTimetable] = useState(false);

  const [unassignedIds, setUnassignedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("general"); // 'general', 'booking_id', 'request_id', 'user_id', 'officer_name', 'officer_email'
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({ key: "course_name", direction: "asc" });
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState");
    return stored !== null ? stored === "true" : false;
  });

  // Refs for performance optimization
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const abortControllerRef = useRef(null);
  const infoRef = useRef(null);
  const pendingRef = useRef(null);
  const weeklyTimetableRef = useRef(null);
  const MIN_FETCH_INTERVAL = 2000;

  const highlightId = location.state?.highlightId;

  // Handle error message timeout
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Handle click outside for popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfoTooltip(false);
      }
      if (pendingRef.current && !pendingRef.current.contains(event.target)) {
        setShowPendingPopup(false);
      }
    };

    if (showInfoTooltip || showPendingPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showInfoTooltip, showPendingPopup]);

  const highlightIdValue = highlightId ? Number(highlightId) : null;
  const ITEMS_PER_PAGE = 5;

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load saved filters
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("calendarBookingFilters");
    if (savedFilters) {
      try {
        const {
          searchTerm,
          searchType,
          filterMonth,
          dateRangeFrom,
          dateRangeTo,
        } = JSON.parse(savedFilters);
        if (searchTerm !== undefined) setSearchTerm(searchTerm);
        if (searchType !== undefined) setSearchType(searchType);
        if (filterMonth !== undefined) setFilterMonth(filterMonth);
        if (dateRangeFrom !== undefined) setDateRangeFrom(dateRangeFrom);
        if (dateRangeTo !== undefined) setDateRangeTo(dateRangeTo);
      } catch (e) {
        console.warn("Failed to parse saved filters:", e);
      }
    }
    setFiltersLoaded(true);
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;

    const filtersToStore = {
      searchTerm,
      searchType,
      filterMonth,
      dateRangeFrom,
      dateRangeTo,
    };
    localStorage.setItem(
      "calendarBookingFilters",
      JSON.stringify(filtersToStore)
    );
  }, [
    searchTerm,
    searchType,
    filterMonth,
    dateRangeFrom,
    dateRangeTo,
    filtersLoaded,
  ]);

  // Memoized helper functions
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = Number.parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  }, []);

  const getAcronym = useCallback((courseName) => {
    if (!courseName || typeof courseName !== "string") return "N/A";

    const words = courseName
      .replace(/[()[\]]/g, "")
      .replace(/[-–—]/g, " _HYPHEN_ ")
      .replace(/&/g, " _AMP_ ")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const hasExam = words.some((word) => word.toLowerCase() === "exam");

    const acronym = words
      .filter((word) => word.toLowerCase() !== "exam")
      .map((word) => {
        if (word === "_HYPHEN_") return "-";
        if (word === "_AMP_") return "&";
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");

    return hasExam ? `${acronym} (EXAM)` : acronym;
  }, []);

  // Optimized sidebar state sync
  const debouncedSyncSidebarState = useMemo(
    () =>
      debounce(() => {
        const stored = localStorage.getItem("sidebarState");
        if (stored !== null) {
          const isCollapsed = stored === "true";
          setSidebarCollapsed(isCollapsed);
        }
      }, 50),
    []
  );

  useEffect(() => {
    debouncedSyncSidebarState();

    const handleSidebarToggle = (e) => {
      const isCollapsed = e.detail.isCollapsed;
      setSidebarCollapsed(isCollapsed);
      localStorage.setItem("sidebarState", isCollapsed.toString());
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("popstate", debouncedSyncSidebarState);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("popstate", debouncedSyncSidebarState);
      debouncedSyncSidebarState.cancel();
    };
  }, [sidebarCollapsed, debouncedSyncSidebarState]);

  // Optimized fetch function
  const fetchBookings = useCallback(async () => {
    if (fetchInProgress.current) return;
    const now = Date.now();
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return;

    try {
      fetchInProgress.current = true;
      lastFetchTime.current = now;

      // Only show loading state for initial load or if data is stale
      if (bookings.length === 0 || now - lastFetchTime.current > 10000) {
        setLoading(true);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await authRequest(
        "get",
        getApiUrl("/classroom-calendar"),
        null,
        {
          signal: abortControllerRef.current.signal,
          cache: "no-store",
        }
      );

      if (response.success) {
        // Use startTransition for non-urgent updates to prevent UI blocking
        startTransition(() => {
          setBookings(response.data || []);
          setError(null);
        });
      } else {
        throw new Error("Unexpected response structure");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching calendar entries:", err);
        setErrorMessage(
          "Failed to fetch calendar entries. Please try again later."
        );
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setInitialLoad(false);
    }
  }, [bookings.length]);

  const fetchUnassignedRequestIds = useCallback(async () => {
    try {
      const response = await authRequest(
        "get",
        getApiUrl("/classroom-calendar/unassigned-request-ids")
      );
      if (response.success) {
        setUnassignedIds(response.unassignedRequestIds || []);
        setShowPendingPopup(true);
      } else {
        setUnassignedIds([]);
        setShowPendingPopup(true);
      }
    } catch (error) {
      console.error("Failed to fetch unassigned request IDs:", error);
      setUnassignedIds([]);
      setShowPendingPopup(true);
    }
  }, []);

  // Clear filters function
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSearchType("general");
    setFilterMonth("ALL");
    setDateRangeFrom("");
    setDateRangeTo("");
    setCurrentPage(1);
    localStorage.removeItem("calendarBookingFilters");
  }, []);

  // Optimize the filteredBookings memoization with a more efficient algorithm
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];

    // Fast path: if no filters are applied, return all bookings
    if (
      !debouncedSearchTerm &&
      filterMonth === "ALL" &&
      !dateRangeFrom &&
      !dateRangeTo
    ) {
      return bookings;
    }

    // Pre-calculate month filter for better performance
    const monthFilter =
      filterMonth !== "ALL" ? Number.parseInt(filterMonth) : null;

    // Pre-calculate date range filters
    const dateFromFilter = dateRangeFrom ? new Date(dateRangeFrom) : null;
    const dateToFilter = dateRangeTo ? new Date(dateRangeTo) : null;

    // Pre-process search term for better performance
    let searchConfig = null;
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.trim().toLowerCase();

      searchConfig = {
        type: searchType,
        value: term,
      };
    }

    // Use Array.filter with optimized conditions
    return bookings.filter((booking) => {
      // Apply month filter first (faster check)
      if (monthFilter !== null) {
        const bookingMonth = booking.date_from
          ? new Date(booking.date_from).getMonth()
          : -1;
        if (bookingMonth !== monthFilter) return false;
      }

      // Apply date range filter
      if (dateFromFilter || dateToFilter) {
        const bookingFrom = booking.date_from
          ? new Date(booking.date_from)
          : null;
        const bookingTo = booking.date_to ? new Date(booking.date_to) : null;
        if (bookingFrom && bookingTo) {
          // Check for overlap between booking period and filter range
          const filterFrom = dateFromFilter || new Date("1900-01-01");
          const filterTo = dateToFilter || new Date("2100-01-01");
          if (bookingFrom > filterTo || bookingTo < filterFrom) return false;
        }
      }

      // Then apply search filter if needed
      if (searchConfig) {
        switch (searchConfig.type) {
          case "booking_id":
            return booking.id?.toString().includes(searchConfig.value);
          case "request_id":
            return booking.request_id?.toString().includes(searchConfig.value);
          case "user_id":
            return booking.user_id?.toString().includes(searchConfig.value);
          case "officer_name":
            return booking.req_officer_name
              ?.toLowerCase()
              .includes(searchConfig.value);
          case "officer_email":
            return booking.req_officer_email
              ?.toLowerCase()
              .includes(searchConfig.value);
          case "general":
          default:
            return booking.course_name
              ?.toLowerCase()
              .includes(searchConfig.value);
        }
      }

      return true;
    });
  }, [
    bookings,
    debouncedSearchTerm,
    searchType,
    filterMonth,
    dateRangeFrom,
    dateRangeTo,
  ]);

  // Sort the filtered bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      let valueA, valueB;

      switch (sort.key) {
        case "id":
          valueA = a.id || 0;
          valueB = b.id || 0;
          break;
        case "course_name":
          valueA = a.course_name || "";
          valueB = b.course_name || "";
          break;
        case "date_from":
          valueA = new Date(a.date_from).getTime();
          valueB = new Date(b.date_from).getTime();
          break;
        case "user_id":
          valueA = a.user_id || 0;
          valueB = b.user_id || 0;
          break;
        case "request_id":
          valueA = a.request_id || 0;
          valueB = b.request_id || 0;
          break;
        case "req_officer_name":
          valueA = a.req_officer_name || "";
          valueB = b.req_officer_name || "";
          break;
        case "req_officer_email":
          valueA = a.req_officer_email || "";
          valueB = b.req_officer_email || "";
          break;
        default:
          valueA = a.course_name || "";
          valueB = b.course_name || "";
      }

      if (sort.direction === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [filteredBookings, sort]);

  // Paginate the sorted bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedBookings, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE)),
    [filteredBookings]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  // Delete booking function
  const deleteBooking = useCallback(
    async (id) => {
      try {
        await authRequest("delete", getApiUrl(`/classroom-calendar/${id}`));

        // Optimistic update
        setBookings((prev) => prev.filter((booking) => booking.id !== id));
        setSelectedBookings((prev) =>
          prev.filter((bookingId) => bookingId !== id)
        );

        setPopupMessage("Calendar entry deleted successfully");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } catch (err) {
        console.error("Error deleting entry:", err);
        setErrorMessage("Failed to delete entry. Please try again.");
        await fetchBookings();
      }
    },
    [fetchBookings]
  );

  // Bulk delete function
  const handleBulkDelete = useCallback(async () => {
    if (selectedBookings.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedBookings.length} selected booking(s)?`
      )
    )
      return;

    try {
      const promises = selectedBookings.map((id) =>
        authRequest("delete", getApiUrl(`/classroom-calendar/${id}`))
      );

      await Promise.all(promises);

      // Optimistic update
      setBookings((prev) =>
        prev.filter((booking) => !selectedBookings.includes(booking.id))
      );
      setSelectedBookings([]);

      setPopupMessage("Bulk delete completed successfully");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (err) {
      console.error("Error performing bulk delete:", err);
      setErrorMessage("Failed to delete selected bookings. Please try again.");
      await fetchBookings();
    }
  }, [selectedBookings, fetchBookings]);

  // Bulk send email function
  const handleBulkSendEmail = useCallback(async () => {
    if (selectedBookings.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to send emails to ${selectedBookings.length} selected booking(s)?`
      )
    )
      return;

    setIsSendingEmails(true);
    let successCount = 0;
    let failedCount = 0;
    let failedIds = [];

    try {
      const promises = selectedBookings.map(async (id) => {
        try {
          const response = await authRequest(
            "post",
            getApiUrl("/classroom-booking-emails"),
            {
              classroom_booking_calendar_id: id,
            }
          );

          if (response.success && response.emailSent) {
            successCount++;
          } else {
            failedCount++;
            failedIds.push(id);
          }
        } catch (error) {
          console.error(`Error sending email for booking ${id}:`, error);
          failedCount++;
          failedIds.push(id);
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        setPopupMessage(
          `Emails sent successfully! ${successCount} email(s) sent${
            failedCount > 0 ? `, ${failedCount} failed` : ""
          }`
        );
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        setErrorMessage("Failed to send any emails. Please try again.");
      }

      if (failedIds.length > 0) {
        console.warn(
          "Failed to send emails for bookings:",
          failedIds.join(", ")
        );
      }
    } catch (error) {
      console.error("Error in bulk email sending:", error);
      setErrorMessage("Failed to send emails. Please try again.");
    } finally {
      setIsSendingEmails(false);
    }
  }, [selectedBookings]);

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedBookings(paginatedBookings.map((booking) => booking.id));
      } else {
        setSelectedBookings([]);
      }
    },
    [paginatedBookings]
  );

  const handleSelectBooking = useCallback((bookingId, checked) => {
    setSelectedBookings((prev) => {
      if (checked) {
        return [...prev, bookingId];
      } else {
        return prev.filter((id) => id !== bookingId);
      }
    });
  }, []);

  // Export function
  const exportToCSV = useCallback(() => {
    if (
      !window.confirm(
        "Are you sure you want to export the current calendar data to CSV?"
      )
    )
      return;

    const headers = [
      "ID",
      "User ID",
      "Request ID",
      "Course Name",
      "Officer Name",
      "Officer Email",
      "Date From",
      "Date To",
      "Time From",
      "Time To",
      "Preferred Days",
      "Classes Allocated",
    ];

    let filename = "calendar_entries";
    if (filterMonth !== "ALL") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      filename += `_${monthNames[Number.parseInt(filterMonth)]}`;
    }
    filename += ".csv";

    const data = filteredBookings.map((booking) => [
      booking.id,
      booking.user_id,
      booking.request_id ?? "",
      booking.course_name,
      booking.req_officer_name ?? "",
      booking.req_officer_email ?? "",
      booking.date_from,
      booking.date_to,
      booking.time_from,
      booking.time_to,
      booking.preferred_days_of_week,
      booking.classes_allocated,
    ]);

    const csvContent = [headers, ...data]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [filteredBookings, filterMonth]);

  // Handle opening the weekly timetable
  const handleOpenWeeklyTimetable = useCallback(() => {
    console.log("Opening weekly timetable");
    setShowWeeklyTimetable(true);
    // Focus on the weekly timetable after a short delay to ensure it's rendered
    setTimeout(() => {
      if (weeklyTimetableRef.current) {
        weeklyTimetableRef.current.focus();
        weeklyTimetableRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  }, []);

  // Handle highlighted booking
  useEffect(() => {
    if (highlightId !== null) {
      setTimeout(() => {
        const row = document.querySelector(
          `tr[data-booking-id="${highlightId}"]`
        );
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("highlight-pulse");
          setTimeout(() => {
            row.classList.remove("highlight-pulse");
          }, 2000);
        }
      }, 300);
    }
  }, [highlightId]);

  // Add these optimizations to the useEffect for initial fetch
  useEffect(() => {
    // Initial fetch with delay to allow UI to render first
    const initialFetchTimer = setTimeout(() => {
      fetchBookings();
    }, 100);

    // Set up polling with increasing intervals based on user activity
    let pollInterval = 60000; // Start with 60s
    let lastActivityTime = Date.now();

    const activityHandler = () => {
      lastActivityTime = Date.now();
    };

    // Track user activity
    window.addEventListener("mousemove", activityHandler);
    window.addEventListener("keydown", activityHandler);
    window.addEventListener("click", activityHandler);

    // Polling with adaptive interval
    const pollTimer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;

      // Increase poll interval if user is inactive
      if (inactiveTime > 120000) {
        // 2 minutes
        pollInterval = 60000; // 1 minute
      }
      if (inactiveTime > 300000) {
        // 5 minutes
        pollInterval = 120000; // 2 minutes
      }

      fetchBookings();
    }, pollInterval);

    // Cleanup
    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(pollTimer);
      window.removeEventListener("mousemove", activityHandler);
      window.removeEventListener("keydown", activityHandler);
      window.removeEventListener("click", activityHandler);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBookings]);

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative"
      data-page="calendar-booking-table"
    >
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>

      {initialLoad && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen
            message="Loading calendar booking system..."
            type="calendar"
          />
        </div>
      )}

      {/* Simple Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-slate-50"></div>
      </div>

      {showPopup && <SuccessPopup message={popupMessage} />}
      {errorMessage && <ErrorPopup message={errorMessage} />}

      <div className="relative z-10 p-4 xl:p-6 space-y-6 xl:space-y-8">
        {error && (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 shadow-xl backdrop-blur-xl">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl relative z-10">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <CardTitle className="text-2xl xl:text-3xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  Calendar Booking Details
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Manage and review all calendar bookings in one place
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 xl:p-6">
            {/* Enhanced Search and Filters */}
            <div className="flex flex-col gap-4 mb-4 xl:mb-6">
              {/* Search Type Selection */}
              <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800">
                    Search Configuration
                  </h4>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="general"
                        checked={searchType === "general"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Course Search
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="booking_id"
                        checked={searchType === "booking_id"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Booking ID
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="request_id"
                        checked={searchType === "request_id"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Request ID
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="user_id"
                        checked={searchType === "user_id"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          User ID
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="officer_name"
                        checked={searchType === "officer_name"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Officer Name
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="officer_email"
                        checked={searchType === "officer_email"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Officer Email
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Search Input and Filters Row - All in One Line */}
              <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 items-stretch xl:items-center justify-between">
                {/* Search Section */}
                <div className="flex gap-3 flex-1 max-w-xl w-full xl:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                    <Input
                      placeholder={
                        searchType === "general"
                          ? "Search by course name..."
                          : searchType === "booking_id"
                          ? "Enter booking ID..."
                          : searchType === "request_id"
                          ? "Enter request ID..."
                          : searchType === "user_id"
                          ? "Enter user ID..."
                          : searchType === "officer_name"
                          ? "Search by officer name..."
                          : "Search by officer email..."
                      }
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-12 h-12 xl:h-14 text-base border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl"
                    />
                  </div>

                  {/* Info Button with Tooltip */}
                  <div className="relative" ref={infoRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 xl:h-14 w-12 xl:w-14 p-0 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                      onBlur={() =>
                        setTimeout(() => setShowInfoTooltip(false), 150)
                      }
                    >
                      <Info className="h-5 w-5 text-slate-600 hover:text-blue-600" />
                    </Button>

                    {/* Floating Tooltip */}
                    {showInfoTooltip && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-80 bg-white border-2 border-slate-200 rounded-xl shadow-2xl p-4 text-sm animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          Search Tips:
                        </div>
                        <div className="space-y-2 text-slate-600 leading-relaxed">
                          <p>
                            • <strong>Double-Click</strong> any record to view
                            full booking details below the table
                          </p>
                          <p>
                            • <strong>Search Types:</strong> Select the type of
                            search above the search bar
                          </p>
                          <p>
                            • <strong>Course Search:</strong> Searches in course
                            names and titles
                          </p>
                          <p>
                            • <strong>Booking ID:</strong> Search by specific
                            booking ID number
                          </p>
                          <p>
                            • <strong>Request ID:</strong> Search by request ID
                            number
                          </p>
                          <p>
                            • <strong>User ID:</strong> Search by user ID number
                          </p>
                          <p>
                            • <strong>Officer Name:</strong> Search by
                            requesting officer name
                          </p>
                          <p>
                            • <strong>Officer Email:</strong> Search by
                            requesting officer email
                          </p>
                          <p>
                            • <strong>Filters:</strong> Use month and date range
                            filters for more precise results
                          </p>
                        </div>
                        {/* Arrow pointing up */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-slate-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters and Actions Section - Compact Layout */}
                <div className="flex flex-wrap gap-1 xl:gap-2 w-full xl:w-auto justify-center xl:justify-end items-center">
                  <Select
                    value={filterMonth}
                    onValueChange={(value) => {
                      setFilterMonth(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-32 xl:w-40 h-12 xl:h-14 border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">
                      <Filter className="h-5 w-5 mr-2" />
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

                  {/* Date Range Filters */}
                  <div className="flex gap-1 items-center">
                    <Input
                      type="date"
                      value={dateRangeFrom}
                      onChange={(e) => {
                        setDateRangeFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-36 h-10 xl:h-9 text-xs border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm"
                      placeholder="From date"
                      title="Filter from date"
                    />
                    <span className="text-slate-500 text-sm">to</span>
                    <Input
                      type="date"
                      value={dateRangeTo}
                      onChange={(e) => {
                        setDateRangeTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-36 h-10 xl:h-9 text-xs border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm"
                      placeholder="To date"
                      title="Filter to date"
                    />
                  </div>

                  {/* Reset Filters Button */}
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="h-10 xl:h-9 px-2 xl:px-3 border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 rounded-xl shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm"
                    title="Clear all filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    className="h-10 xl:h-9 px-3 xl:px-4 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-medium shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-1 xl:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleOpenWeeklyTimetable}
                    className="h-10 xl:h-9 px-3 xl:px-4 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-medium shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm flex items-center gap-1 xl:gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">Weekly</span>
                    <span className="hidden lg:inline">Timetable</span>
                  </Button>

                  {/* Unassigned Request IDs Info Button */}
                  <div className="relative" ref={pendingRef}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPendingPopup(!showPendingPopup);
                        if (!showPendingPopup) {
                          fetchUnassignedRequestIds();
                        }
                      }}
                      className="h-10 xl:h-9 w-10 xl:w-9 p-0 border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                      title="View unassigned request IDs"
                    >
                      <Info className="h-4 w-4 text-orange-600 hover:text-orange-700" />
                    </Button>

                    {/* Unassigned IDs Popup */}
                    {showPendingPopup && (
                      <div className="absolute top-full right-0 mt-2 z-50 w-80 bg-white border-2 border-orange-200 rounded-xl shadow-2xl p-4 text-sm animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          Unassigned Request IDs
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {unassignedIds.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-orange-700 text-xs mb-2">
                                The following request IDs don't have calendar
                                bookings yet (click to copy):
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {unassignedIds.map((id) => (
                                  <button
                                    key={id}
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(
                                          id.toString()
                                        );
                                        // Show brief feedback
                                        const button = document.activeElement;
                                        const originalText = button.textContent;
                                        button.textContent = "Copied!";
                                        button.classList.add(
                                          "bg-green-100",
                                          "text-green-800"
                                        );
                                        button.classList.remove(
                                          "bg-orange-100",
                                          "text-orange-800"
                                        );
                                        setTimeout(() => {
                                          button.textContent = originalText;
                                          button.classList.remove(
                                            "bg-green-100",
                                            "text-green-800"
                                          );
                                          button.classList.add(
                                            "bg-orange-100",
                                            "text-orange-800"
                                          );
                                        }, 1000);
                                      } catch (err) {
                                        console.error(
                                          "Failed to copy ID:",
                                          err
                                        );
                                      }
                                    }}
                                    className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-semibold text-center hover:bg-orange-200 transition-colors cursor-pointer"
                                    title={`Click to copy ID: ${id}`}
                                  >
                                    {id}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-green-600 text-sm">
                              ✅ All requests have been assigned to calendar
                              bookings!
                            </p>
                          )}
                        </div>
                        {/* Arrow pointing up */}
                        <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l-2 border-t-2 border-orange-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedBookings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm font-bold text-blue-700">
                    {selectedBookings.length} booking(s) selected
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg"
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBulkSendEmail}
                      disabled={isSendingEmails}
                    >
                      {isSendingEmails ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-1" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modern Table */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 font-bold text-slate-700 w-16">
                        <Checkbox
                          checked={
                            selectedBookings.length ===
                              paginatedBookings.length &&
                            paginatedBookings.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <ColumnHeader
                        title="ID"
                        sortable={true}
                        sortKey="id"
                        currentSort={sort}
                        onSort={setSort}
                        width="w-20"
                      />
                      <ColumnHeader
                        title="Course Name"
                        sortable={true}
                        sortKey="course_name"
                        currentSort={sort}
                        onSort={setSort}
                        width="w-64"
                      />
                      <ColumnHeader
                        title="Date Period"
                        sortable={true}
                        sortKey="date_from"
                        currentSort={sort}
                        onSort={setSort}
                        width="w-36"
                      />
                      <ColumnHeader
                        title="Requesting Officer Name"
                        sortable={true}
                        sortKey="req_officer_name"
                        currentSort={sort}
                        onSort={setSort}
                        width="w-48"
                      />
                      <ColumnHeader
                        title="Requesting Officer Email"
                        sortable={true}
                        sortKey="req_officer_email"
                        currentSort={sort}
                        onSort={setSort}
                        width="w-48"
                      />
                      <ColumnHeader
                        title="Actions"
                        sortable={false}
                        width="w-32"
                      />
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <Calendar className="h-16 w-16 text-slate-300 mb-4" />
                            <p className="text-lg font-semibold">
                              No calendar bookings found
                            </p>
                            <p className="text-sm">
                              Try adjusting your search or filter criteria
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedBookings.map((booking, index) => (
                        <tr
                          key={booking.id}
                          data-booking-id={booking.id}
                          className={`table-row border-b border-slate-200 hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
                            highlightId === booking.id
                              ? "bg-blue-100 border border-blue-300"
                              : ""
                          }`}
                          onDoubleClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                        >
                          <td className="p-4">
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={(checked) =>
                                handleSelectBooking(booking.id, checked)
                              }
                            />
                          </td>
                          <td className="p-4">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-bold px-2 py-1">
                              {booking.id}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span
                                className="text-sm font-medium text-slate-900"
                                title={booking.course_name}
                              >
                                {booking.course_name}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {formatDate(booking.date_from)}
                              </div>
                              <div className="text-slate-600 font-medium mt-1">
                                to {formatDate(booking.date_to)}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-slate-900">
                                {booking.req_officer_name || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-slate-900">
                                {booking.req_officer_email || "—"}
                              </span>
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
                <CalendarPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  indexOfFirstBooking={(currentPage - 1) * ITEMS_PER_PAGE}
                  indexOfLastBooking={currentPage * ITEMS_PER_PAGE}
                  totalItems={filteredBookings.length}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
        {/* Booking Details */}
        {showDetails && selectedBooking && (
          <BookingDetails
            booking={selectedBooking}
            onClose={() => setShowDetails(false)}
            formatDate={formatDate}
            formatTime={formatTime}
            navigate={navigate}
          />
        )}

        {/* Weekly Timetable Modal */}
        {showWeeklyTimetable && (
          <WeeklyTimetable
            ref={weeklyTimetableRef}
            onClose={() => setShowWeeklyTimetable(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarBookingTable;
