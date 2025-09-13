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
  Hash,
  Mail,
} from "lucide-react";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import {
  parseClassroomCapacity,
  classroomOptions,
  classroomsAllowingMultipleBookings,
} from "./aidUtils";

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
            Your action has been completed successfully!
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

// Circular progress ring StatCard with our color palette for classroom bookings
const StatCard = memo(
  ({ title, value, icon: Icon, color = "blue", progress = 75 }) => {
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
      []
    );

    const config = colorConfig[color] || colorConfig.blue;
    const circumference = 2 * Math.PI * 42;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center group">
        <div className="relative pt-2">
          <div
            className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full ${config.bg} shadow-sm flex items-center justify-center relative`}
          >
            <svg
              className="absolute inset-0 w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
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
              />
            </svg>

            <div className="relative z-10">
              <Icon className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6 text-slate-700" />
            </div>
          </div>

          <div className="absolute -bottom-1 md:-bottom-1.5 lg:-bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-full shadow-md px-1.5 py-0.5 md:px-2 md:py-0.5 lg:px-2.5 lg:py-1 border border-slate-200">
              <span className="text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl font-black text-slate-800">
                {value}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 md:mt-3 lg:mt-4 text-center">
          <h3 className="text-xs md:text-xs lg:text-sm font-bold text-slate-700 leading-tight">
            {title}
          </h3>
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

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
));

TableSkeleton.displayName = "TableSkeleton";

// Column header with sort functionality
const ColumnHeader = memo(
  ({
    title,
    sortable = false,
    sortKey,
    currentSort,
    onSort,
    className = "",
  }) => {
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
        className={`text-left p-4 font-bold text-slate-700 ${
          sortable ? "cursor-pointer hover:bg-blue-100 transition-colors" : ""
        } ${className}`}
        onClick={handleSort}
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {sortable && (
            <ArrowUpDown
              className={`w-4 h-4 ${
                currentSort.key === sortKey ? "opacity-100" : "opacity-50"
              }`}
            />
          )}
        </div>
      </th>
    );
  }
);

ColumnHeader.displayName = "ColumnHeader";

// Pagination Controls Component - Styled like BusBookingList
const BookingPaginationControls = memo(
  ({
    currentPage,
    totalPages,
    indexOfFirstRequest,
    indexOfLastRequest,
    totalItems,
    onPageChange,
  }) => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mt-6 pt-1 border-t-2 border-slate-200 px-6">
          <div className="text-sm text-slate-600 font-semibold pb-10">
            Showing {indexOfFirstRequest + 1} to{" "}
            {Math.min(indexOfLastRequest, totalItems)} of {totalItems} requests
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

BookingPaginationControls.displayName = "BookingPaginationControls";

// Optimized Action Menu Component
const ActionMenu = memo(({ request, onStatusUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleAction = useCallback((action, ...args) => {
    setIsOpen(false);
    action(...args);
  }, []);

  const isPending = request.request_status?.toLowerCase() === "pending";

  return (
    <div className="relative" ref={menuRef}>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
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
                  e.stopPropagation();
                  handleAction(onStatusUpdate, request.id, "Approved");
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-700 font-medium transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onStatusUpdate, request.id, "Denied");
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
              e.stopPropagation();
              if (
                window.confirm(
                  "Are you sure you want to delete this request? This action cannot be undone."
                )
              ) {
                handleAction(onDelete, request.id);
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
  );
});

ActionMenu.displayName = "ActionMenu";

// Optimized Table Row Component - Styled like BusBookingList
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
    sidebarCollapsed,
  }) => {
    const handleRowClick = useCallback(() => {
      onDoubleClick(request);
    }, [request, onDoubleClick]);

    const handleSelectChange = useCallback(
      (checked) => {
        onSelect(request.id, checked);
      },
      [request.id, onSelect]
    );

    return (
      <tr
        data-request-id={request.id}
        onDoubleClick={handleRowClick}
        className={`table-row border-b border-slate-200 hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
          isHighlighted ? "bg-blue-100 border border-blue-300" : ""
        }`}
      >
        <td className="p-4">
          <Checkbox checked={isSelected} onCheckedChange={handleSelectChange} />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-bold px-2 py-1">
              {request.id}
            </Badge>
            <Copy
              size={16}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(request.id);
              }}
              className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
            />
          </div>
        </td>
        <td className="p-4">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            {request.requesting_officer_name}
          </div>
        </td>
        <td className={`p-4 ${sidebarCollapsed ? "" : "hidden"}`}>
          <div className="text-sm font-semibold text-slate-700">
            {request.designation}
          </div>
        </td>
        <td className={`p-4 ${sidebarCollapsed ? "" : "hidden"}`}>
          <div className="text-sm font-semibold text-slate-700">
            {request.requesting_officer_email}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span
              className="text-sm font-medium text-slate-900 truncate max-w-[200px]"
              title={request.course_name}
            >
              {request.course_name}
            </span>
          </div>
        </td>
        <td className="p-4">
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs font-bold px-2 py-1">
            {request.duration}
          </Badge>
        </td>
        <td className="p-4">
          <div className="text-sm">
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              {formatDate(request.signed_date)}
            </div>
          </div>
        </td>
        <td className="p-4">
          <Badge
            variant="outline"
            className={`font-bold px-3 py-1 ${
              request.request_status?.toLowerCase() === "pending"
                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                : request.request_status?.toLowerCase() === "approved"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            {request.request_status?.toLowerCase() === "pending" && (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {request.request_status?.toLowerCase() === "approved" && (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            {request.request_status?.toLowerCase() === "denied" && (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {request.request_status || "Pending"}
          </Badge>
        </td>
        <td className="p-4">
          <ActionMenu
            request={request}
            onStatusUpdate={onStatusUpdate}
            onDelete={onDelete}
          />
        </td>
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

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

const ClassroomBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aidRequests, setAidRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("general"); // 'general', 'request_id', 'email'
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({ key: "course_name", direction: "asc" });
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState");
    return stored !== null ? stored === "true" : false;
  });

  const [handoverDataList, setHandoverDataList] = useState([]);
  const [unassignedIds, setUnassignedIds] = useState([]);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const pendingRef = useRef(null);

  // Refs for performance optimization
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const abortControllerRef = useRef(null);
  const infoRef = useRef(null);
  const MIN_FETCH_INTERVAL = 2000;

  const highlightId = location.state?.highlightId
    ? Number(location.state.highlightId)
    : null;
  const ITEMS_PER_PAGE = 5;

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Handle success message timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  // Load saved filters
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("classroomBookingFilters");
    if (savedFilters) {
      try {
        const {
          searchTerm,
          searchType,
          filterStatus,
          startDate,
          endDate,
          filterMonth,
        } = JSON.parse(savedFilters);
        if (searchTerm !== undefined) setSearchTerm(searchTerm);
        if (searchType !== undefined) setSearchType(searchType);
        if (filterStatus !== undefined) setFilterStatus(filterStatus);
        if (startDate !== undefined) setStartDate(startDate);
        if (endDate !== undefined) setEndDate(endDate);
        if (filterMonth !== undefined) setFilterMonth(filterMonth);
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
      filterStatus,
      startDate,
      endDate,
      filterMonth,
    };
    localStorage.setItem(
      "classroomBookingFilters",
      JSON.stringify(filtersToStore)
    );
  }, [
    searchTerm,
    searchType,
    filterStatus,
    startDate,
    endDate,
    filterMonth,
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

  const getAcronym = useCallback((courseName) => {
    if (!courseName || typeof courseName !== "string") return "N/A";
    return courseName
      .replace(/[$$$$[\]]/g, "")
      .replace(/[-–—]/g, " _HYPHEN_ ")
      .replace(/&/g, " _AMP_ ")
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => {
        if (word === "_HYPHEN_") return "-";
        if (word === "_AMP_") return "&";
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setSuccessMessage(`Copied ID: ${text}`);
      })
      .catch(() => {
        setErrorMessage("Failed to copy ID to clipboard");
      });
  }, []);

  // Optimized sidebar state sync
  const debouncedSyncSidebarState = useMemo(
    () =>
      debounce(() => {
        const stored = localStorage.getItem("sidebarState");
        if (stored !== null) {
          const isCollapsed = stored === "true";
          setSidebarCollapsed(isCollapsed);

          document.documentElement.style.setProperty(
            "--sidebar-width",
            isCollapsed ? "90px" : "280px"
          );
          document.documentElement.style.setProperty(
            "--sidebar-transition",
            "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)"
          );

          if (isCollapsed) {
            document.body.classList.add("sidebar-collapsed");
          } else {
            document.body.classList.remove("sidebar-collapsed");
          }
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

      document.documentElement.style.setProperty(
        "--sidebar-width",
        isCollapsed ? "90px" : "280px"
      );

      if (isCollapsed) {
        document.body.classList.add("sidebar-collapsed");
      } else {
        document.body.classList.remove("sidebar-collapsed");
      }
    };

    const handleSidebarHover = (e) => {
      const isHovered = e.detail.isHovered;
      if (isHovered && sidebarCollapsed) {
        document.documentElement.style.setProperty("--sidebar-width", "280px");
      } else if (!isHovered && sidebarCollapsed) {
        document.documentElement.style.setProperty("--sidebar-width", "90px");
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);
    window.addEventListener("popstate", debouncedSyncSidebarState);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", debouncedSyncSidebarState);
      debouncedSyncSidebarState.cancel();
    };
  }, [sidebarCollapsed, debouncedSyncSidebarState]);

  // Optimized fetch function
  const fetchAidRequests = useCallback(async () => {
    if (fetchInProgress.current) return;
    const now = Date.now();
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return;

    try {
      fetchInProgress.current = true;
      lastFetchTime.current = now;

      if (aidRequests.length === 0 || now - lastFetchTime.current > 10000) {
        setLoading(true);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await authRequest(
        "get",
        getApiUrl("/aidrequests"),
        null,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      const data = response.data;
      const requests = data.success ? data.data : data;

      startTransition(() => {
        setAidRequests(requests || []);
        setError(null);
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching aid requests:", error);
        setErrorMessage(
          "Failed to fetch classroom booking requests. Please try again later."
        );
      }
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const fetchHandoverData = useCallback(async () => {
    try {
      const response = await authRequest("get", getApiUrl("/aidhandover"));
      setHandoverDataList(response || []);
    } catch (error) {
      console.error("Error fetching handover data:", error);
    }
  }, []);

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

  // Helper function to filter available classrooms
  const filterAvailableClassrooms = useCallback(async (requestData) => {
    try {
      const response = await authRequest(
        "get",
        getApiUrl("/classroom-calendar/details")
      );
      const bookings = response.data?.data || [];

      const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const selectedDates = [];
      const preferredDays =
        requestData.preferred_days_of_week?.split(",").map((d) => d.trim()) ||
        [];

      for (
        let d = new Date(requestData.date_from);
        d <= new Date(requestData.date_to);
        d.setDate(d.getDate() + 1)
      ) {
        const current = new Date(d);
        const dow = dayMap[current.getDay()];
        if (preferredDays.includes(dow)) {
          selectedDates.push(current.toISOString().split("T")[0]);
        }
      }

      const unavailableClassrooms = new Set();

      bookings.forEach((b) => {
        const effectiveDates = b.effective_dates || [];
        effectiveDates.forEach((date) => {
          if (selectedDates.includes(date)) {
            if (
              isTimeOverlap(
                requestData.time_from,
                requestData.time_to,
                b.time_from,
                b.time_to
              )
            ) {
              const booked =
                b.classes_allocated?.split(",").map((c) => c.trim()) || [];
              booked.forEach((c) => {
                if (!classroomsAllowingMultipleBookings.includes(c)) {
                  unavailableClassrooms.add(c);
                }
              });
            }
          }
        });
      });

      return classroomOptions.filter(
        (opt) => !unavailableClassrooms.has(opt.value)
      );
    } catch (error) {
      console.error("Error filtering available classrooms:", error);
      return [];
    }
  }, []);

  // Helper function to check time overlap
  const isTimeOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  // Helper function to select best classroom based on capacity
  const selectBestClassroom = useCallback(
    (availableClassrooms, participants) => {
      if (!participants) return availableClassrooms[0]; // If no participants specified, return first available

      const suitableClassrooms = availableClassrooms
        .map((classroom) => ({
          ...classroom,
          capacity: parseClassroomCapacity(classroom.label),
        }))
        .filter(
          (classroom) =>
            classroom.capacity !== null && classroom.capacity >= participants
        )
        .sort((a, b) => a.capacity - b.capacity); // Sort by capacity ascending (smallest first)

      return suitableClassrooms[0] || null; // Return the smallest suitable classroom
    },
    []
  );

  // Auto assign bookings function
  const handleAutoAssignBookings = useCallback(async () => {
    if (unassignedIds.length === 0) return;

    // Ask for user confirmation
    const confirm = window.confirm(
      `You are about to auto-assign ${unassignedIds.length} bookings. Do you want to proceed?`
    );
    if (!confirm) return;

    setIsAutoAssigning(true);
    let successCount = 0;
    let skipCount = 0;
    let skippedIds = [];

    try {
      for (const requestId of unassignedIds) {
        try {
          // Fetch request data
          const response = await authRequest(
            "get",
            getApiUrl(`/aidrequests/approved/${requestId}`)
          );

          if (!response.success) {
            console.warn(`Failed to fetch data for request ${requestId}`);
            skipCount++;
            skippedIds.push(requestId);
            continue;
          }

          const requestData = response.data;
          console.log("request Data:", requestData);

          // Filter available classrooms
          const availableClassrooms = await filterAvailableClassrooms(
            requestData
          );

          if (availableClassrooms.length === 0) {
            console.warn(`No available classrooms for request ${requestId}`);
            skipCount++;
            skippedIds.push(requestId);
            continue;
          }

          // Select best classroom based on capacity
          const selectedClassroom = selectBestClassroom(
            availableClassrooms,
            requestData.no_of_participants
          );

          if (!selectedClassroom) {
            console.warn(
              `No suitable classroom found for request ${requestId}`
            );
            skipCount++;
            skippedIds.push(requestId);
            continue;
          }

          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user"));

          // Submit booking
          const bookingResponse = await authRequest(
            "post",
            getApiUrl("/classroom-calendar"),
            {
              user_id: user.id,
              request_id: requestId,
              date_from: requestData.date_from,
              date_to: requestData.date_to,
              time_from: requestData.time_from,
              time_to: requestData.time_to,
              course_name:
                requestData.course_name +
                (requestData.exam_or_not?.toLowerCase() === "yes"
                  ? " Exam"
                  : ""),
              preferred_days_of_week:
                requestData.preferred_days_of_week || "Multiple days",
              classes_allocated: selectedClassroom.value,
              req_officer_name: requestData.requesting_officer_name,
              req_officer_email: requestData.requesting_officer_email,
            }
          );

          if (bookingResponse.success) {
            successCount++;
            console.log(
              `Successfully assigned classroom ${selectedClassroom.value} to request ${requestId}`
            );
          } else {
            console.warn(`Failed to create booking for request ${requestId}`);
            skipCount++;
            skippedIds.push(requestId);
          }
        } catch (error) {
          console.error(`Error processing request ${requestId}:`, error);
          skipCount++;
          skippedIds.push(requestId);
        }
      }

      // Refresh data
      await fetchAidRequests();
      await fetchUnassignedRequestIds();

      // Show results
      if (successCount > 0) {
        setSuccessMessage(
          `Auto-assignment completed! ${successCount} bookings created${
            skipCount > 0 ? `, ${skipCount} skipped` : ""
          }`
        );
      } else {
        setErrorMessage(
          `Auto-assignment completed but no bookings were created. ${skipCount} requests were skipped.`
        );
      }
      // 👇 Print the skipped IDs in console
      if (skippedIds.length > 0) {
        console.warn("Skipped requests:", skippedIds.join(", "));
      }
    } catch (error) {
      console.error("Error in auto-assignment:", error);
      setErrorMessage("Failed to complete auto-assignment. Please try again.");
    } finally {
      setIsAutoAssigning(false);
    }
  }, [unassignedIds, fetchAidRequests, fetchUnassignedRequestIds]);

  // Memoized filtered requests with optimized filtering
  const filteredRequests = useMemo(() => {
    if (!aidRequests.length) return [];

    return aidRequests.filter((req) => {
      // Status filter
      if (filterStatus !== "ALL") {
        const reqStatus = req.request_status?.toLowerCase() || "pending";
        if (reqStatus !== filterStatus.toLowerCase()) return false;
      }

      // Date range filter - check if any date falls within the range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check signed_date
        const signedDate = req.signed_date ? new Date(req.signed_date) : null;
        const dateFrom = req.date_from ? new Date(req.date_from) : null;
        const dateTo = req.date_to ? new Date(req.date_to) : null;

        // Include if any of the dates fall within the range
        const signedInRange =
          signedDate && signedDate >= start && signedDate <= end;
        const dateFromInRange =
          dateFrom && dateFrom >= start && dateFrom <= end;
        const dateToInRange = dateTo && dateTo >= start && dateTo <= end;

        if (!signedInRange && !dateFromInRange && !dateToInRange) return false;
      }

      // Month filter
      if (filterMonth !== "ALL") {
        const reqMonth = req.date_from
          ? new Date(req.date_from).getMonth()
          : -1;
        if (reqMonth !== Number.parseInt(filterMonth)) return false;
      }

      // Search filter with type-based searching
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.trim().toLowerCase();

        switch (searchType) {
          case "request_id":
            return req.id?.toString().includes(term);
          case "email":
            return req.requesting_officer_email?.toLowerCase().includes(term);
          case "general":
          default:
            // General search (name and course only)
            const matchesSearch =
              req.requesting_officer_name?.toLowerCase().includes(term) ||
              req.course_name?.toLowerCase().includes(term);
            return matchesSearch;
        }
      }

      return true;
    });
  }, [
    aidRequests,
    debouncedSearchTerm,
    searchType,
    filterStatus,
    startDate,
    endDate,
    filterMonth,
  ]);

  // Optimized sort with memoization
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let valueA, valueB;

      switch (sort.key) {
        case "id":
          valueA = Number(a.id) || 0;
          valueB = Number(b.id) || 0;
          break;
        case "course_name":
          valueA = a.course_name || "";
          valueB = b.course_name || "";
          break;
        case "signed_date":
          valueA = new Date(a.signed_date).getTime();
          valueB = new Date(b.signed_date).getTime();
          break;
        case "requesting_officer_name":
          valueA = a.requesting_officer_name || "";
          valueB = b.requesting_officer_name || "";
          break;
        case "request_status":
          valueA = a.request_status || "";
          valueB = b.request_status || "";
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
  }, [filteredRequests, sort]);

  // Paginate the sorted requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedRequests, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)),
    [filteredRequests]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  // Memoized statistics
  const stats = useMemo(() => {
    const total = aidRequests.length;
    const pending = aidRequests.filter(
      (req) => req.request_status?.toLowerCase() === "pending"
    ).length;
    const approved = aidRequests.filter(
      (req) => req.request_status?.toLowerCase() === "approved"
    ).length;
    const denied = aidRequests.filter(
      (req) => req.request_status?.toLowerCase() === "denied"
    ).length;
    const thisMonth = aidRequests.filter((req) => {
      const reqMonth = req.signed_date
        ? new Date(req.signed_date).getMonth()
        : -1;
      return reqMonth === new Date().getMonth();
    }).length;

    return { total, pending, approved, denied, thisMonth };
  }, [aidRequests]);

  // Memoized count of selected pending requests
  const pendingSelectedCount = useMemo(() => {
    return selectedRequests.filter((id) => {
      const req = aidRequests.find((r) => r.id === id);
      return req?.request_status?.toLowerCase() === "pending";
    }).length;
  }, [selectedRequests, aidRequests]);

  // Status update function
  const handleStatusUpdate = useCallback(
    async (id, status) => {
      try {
        const requestToUpdate = aidRequests.find((req) => req.id === id);
        if (!requestToUpdate) {
          console.error(`Request with ID ${id} not found.`);
          return;
        }

        let payment_status = requestToUpdate.payment_status;

        if (status === "Approved") {
          if (requestToUpdate.paid_course_or_not === "Yes") {
            payment_status = "Paid";
          }
        } else if (status === "Denied") {
          if (requestToUpdate.paid_course_or_not === "Yes") {
            payment_status = "Cancelled";
          }
        }

        await authRequest("put", getApiUrl(`/aidrequests/${id}`), {
          request_status: status,
          payment_status,
        });

        // Optimistic update
        setAidRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  request_status: status,
                  payment_status,
                }
              : req
          )
        );

        setSuccessMessage(`Request ${id} marked as ${status}`);
      } catch (error) {
        console.error(`Error updating request ${id} to ${status}:`, error);
        setErrorMessage(`Failed to update request ${id}. Please try again.`);
        await fetchAidRequests();
      }
    },
    [aidRequests, fetchAidRequests]
  );

  // Delete function
  const handleDelete = useCallback(
    async (id) => {
      try {
        await authRequest("delete", getApiUrl(`/aidrequests/${id}`));

        // Optimistic update
        setAidRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequests((prev) => prev.filter((reqId) => reqId !== id));

        setSuccessMessage(`Request ${id} deleted successfully`);
      } catch (error) {
        console.error(`Error deleting request ${id}:`, error);
        setErrorMessage(`Failed to delete request ${id}. Please try again.`);
        await fetchAidRequests();
      }
    },
    [fetchAidRequests]
  );

  // Bulk delete function
  const handleBulkDelete = useCallback(async () => {
    if (selectedRequests.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRequests.length} selected request(s)?`
      )
    )
      return;

    try {
      const promises = selectedRequests.map((id) =>
        authRequest("delete", getApiUrl(`/aidrequests/${id}`))
      );

      await Promise.all(promises);

      // Optimistic update
      setAidRequests((prev) =>
        prev.filter((req) => !selectedRequests.includes(req.id))
      );
      setSelectedRequests([]);

      setSuccessMessage("Bulk delete completed successfully");
    } catch (err) {
      console.error("Error performing bulk delete:", err);
      setErrorMessage("Failed to delete selected requests. Please try again.");
      await fetchAidRequests();
    }
  }, [selectedRequests, fetchAidRequests]);

  // Bulk approve function
  const handleBulkApprove = useCallback(async () => {
    const pendingSelected = selectedRequests.filter((id) => {
      const req = aidRequests.find((r) => r.id === id);
      return req?.request_status?.toLowerCase() === "pending";
    });

    if (pendingSelected.length === 0) {
      setErrorMessage("No pending requests selected for approval.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to approve ${pendingSelected.length} selected pending request(s)?`
      )
    )
      return;

    try {
      const promises = pendingSelected.map((id) => {
        const requestToUpdate = aidRequests.find((req) => req.id === id);
        if (!requestToUpdate) return Promise.resolve();

        let payment_status = requestToUpdate.payment_status;

        if (requestToUpdate.paid_course_or_not === "Yes") {
          payment_status = "Paid";
        }

        return authRequest("put", getApiUrl(`/aidrequests/${id}`), {
          request_status: "Approved",
          payment_status,
        });
      });

      await Promise.all(promises);

      // Optimistic update
      setAidRequests((prev) =>
        prev.map((req) =>
          pendingSelected.includes(req.id)
            ? {
                ...req,
                request_status: "Approved",
                payment_status:
                  req.paid_course_or_not === "Yes"
                    ? "Paid"
                    : req.payment_status,
              }
            : req
        )
      );
      setSelectedRequests([]);

      setSuccessMessage(
        `${pendingSelected.length} request(s) approved successfully`
      );
    } catch (err) {
      console.error("Error performing bulk approve:", err);
      setErrorMessage("Failed to approve selected requests. Please try again.");
      await fetchAidRequests();
    }
  }, [selectedRequests, aidRequests, fetchAidRequests]);

  // Bulk deny function
  const handleBulkDeny = useCallback(async () => {
    const pendingSelected = selectedRequests.filter((id) => {
      const req = aidRequests.find((r) => r.id === id);
      return req?.request_status?.toLowerCase() === "pending";
    });

    if (pendingSelected.length === 0) {
      setErrorMessage("No pending requests selected for denial.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to deny ${pendingSelected.length} selected pending request(s)?`
      )
    )
      return;

    try {
      const promises = pendingSelected.map((id) => {
        const requestToUpdate = aidRequests.find((req) => req.id === id);
        if (!requestToUpdate) return Promise.resolve();

        let payment_status = requestToUpdate.payment_status;

        if (requestToUpdate.paid_course_or_not === "Yes") {
          payment_status = "Cancelled";
        }

        return authRequest("put", getApiUrl(`/aidrequests/${id}`), {
          request_status: "Denied",
          payment_status,
        });
      });

      await Promise.all(promises);

      // Optimistic update
      setAidRequests((prev) =>
        prev.map((req) =>
          pendingSelected.includes(req.id)
            ? {
                ...req,
                request_status: "Denied",
                payment_status:
                  req.paid_course_or_not === "Yes"
                    ? "Cancelled"
                    : req.payment_status,
              }
            : req
        )
      );
      setSelectedRequests([]);

      setSuccessMessage(
        `${pendingSelected.length} request(s) denied successfully`
      );
    } catch (err) {
      console.error("Error performing bulk deny:", err);
      setErrorMessage("Failed to deny selected requests. Please try again.");
      await fetchAidRequests();
    }
  }, [selectedRequests, aidRequests, fetchAidRequests]);

  // Bulk send email function
  const handleBulkSendEmail = useCallback(async () => {
    if (selectedRequests.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to send emails to ${selectedRequests.length} selected request(s)?`
      )
    )
      return;

    setIsSendingEmails(true);
    let successCount = 0;
    let failedCount = 0;
    let failedIds = [];

    try {
      const promises = selectedRequests.map(async (id) => {
        try {
          const response = await authRequest(
            "post",
            getApiUrl("/classroom-booking-emails"),
            {
              aid_request_id: id,
            }
          );

          if (response.success && response.emailSent) {
            successCount++;
          } else {
            failedCount++;
            failedIds.push(id);
          }
        } catch (error) {
          console.error(`Error sending email for request ${id}:`, error);
          failedCount++;
          failedIds.push(id);
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        setSuccessMessage(
          `Emails sent successfully! ${successCount} email(s) sent${
            failedCount > 0 ? `, ${failedCount} failed` : ""
          }`
        );
      } else {
        setErrorMessage("Failed to send any emails. Please try again.");
      }

      if (failedIds.length > 0) {
        console.warn(
          "Failed to send emails for requests:",
          failedIds.join(", ")
        );
      }
    } catch (error) {
      console.error("Error in bulk email sending:", error);
      setErrorMessage("Failed to send emails. Please try again.");
    } finally {
      setIsSendingEmails(false);
    }
  }, [selectedRequests]);

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedRequests(paginatedRequests.map((req) => req.id));
      } else {
        setSelectedRequests([]);
      }
    },
    [paginatedRequests]
  );

  const handleSelectRequest = useCallback((requestId, checked) => {
    setSelectedRequests((prev) => {
      if (checked) {
        return [...prev, requestId];
      } else {
        return prev.filter((id) => id !== requestId);
      }
    });
  }, []);

  // Export function
  const handleExport = useCallback(() => {
    if (
      !window.confirm(
        "Are you sure you want to export the current classroom booking data to CSV?"
      )
    )
      return;

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
    ];

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
    ]);

    let filename = "classroom_booking_requests";
    if (filterStatus !== "ALL") {
      filename += `_${filterStatus.toLowerCase()}`;
    }
    if (startDate && endDate) {
      filename += `_${startDate}_to_${endDate}`;
    }
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
  }, [filteredRequests, filterStatus, filterMonth]);

  const handleRowDoubleClick = useCallback(
    (req) => {
      const matchingHandover = handoverDataList.find(
        (h) => Number(h.request_id) === Number(req.id)
      );

      navigate("/singlebookingdetails", {
        state: {
          request: req,
          handover: matchingHandover || null,
          sidebarState: sidebarCollapsed,
        },
      });
    },
    [handoverDataList, navigate, sidebarCollapsed]
  );

  // Handle sorting
  const handleSort = useCallback((sortConfig) => {
    setSort(sortConfig);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Clear filters function
  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSearchType("general");
    setFilterStatus("ALL");
    setStartDate("");
    setEndDate("");
    setFilterMonth("ALL");
    setCurrentPage(1);
    localStorage.removeItem("classroomBookingFilters");
  }, []);

  // Handle highlighted request
  useEffect(() => {
    if (highlightId !== null) {
      setTimeout(() => {
        const row = document.querySelector(
          `tr[data-request-id="${highlightId}"]`
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

  // Initial fetch and periodic updates
  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      fetchAidRequests();
      fetchHandoverData();
    }, 100);

    let pollInterval = 60000;
    let inactiveTime = 0;
    let lastActivityTime = Date.now();

    const activityHandler = () => {
      const now = Date.now();
      if (now - lastActivityTime > 60000) {
        fetchAidRequests();
      }
      lastActivityTime = now;
      inactiveTime = 0;
      pollInterval = 30000;
    };

    window.addEventListener("mousemove", activityHandler);
    window.addEventListener("keydown", activityHandler);
    window.addEventListener("click", activityHandler);

    const pollTimer = setInterval(() => {
      const now = Date.now();
      inactiveTime = now - lastActivityTime;

      if (inactiveTime > 120000) {
        pollInterval = 60000;
      }
      if (inactiveTime > 300000) {
        pollInterval = 120000;
      }

      fetchAidRequests();
    }, pollInterval);

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
  }, [fetchAidRequests, fetchHandoverData]);

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative sidebar-transition`}
      data-page="classroom-booking"
    >
      {initialLoad && (
        <div className="fixed inset-0 z-50">
          <LoadingScreen
            message="Loading classroom booking system..."
            type="bookings"
          />
        </div>
      )}

      {/* Simple Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-slate-50"></div>
      </div>

      <style>{`
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
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>

      {successMessage && <SuccessPopup message={successMessage} />}
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
                  <Building className="w-8 h-8 text-blue-600" />
                  Classroom Booking Details
                </CardTitle>
                <p className="text-slate-600 mt-2 text-base xl:text-lg font-semibold">
                  Manage and review all classroom booking requests in one place
                </p>
              </div>

              {/* Stats Cards */}
              <div className="flex flex-wrap lg:flex-nowrap gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 justify-center lg:justify-end">
                <StatCard
                  title="Total Requests"
                  value={stats.total}
                  icon={BookOpen}
                  color="blue"
                  progress={100}
                />
                <StatCard
                  title="Approved"
                  value={stats.approved}
                  icon={CheckCircle}
                  color="green"
                  progress={
                    stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
                  }
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={Clock}
                  color="yellow"
                  progress={
                    stats.total > 0 ? (stats.pending / stats.total) * 100 : 0
                  }
                />
                <StatCard
                  title="Denied"
                  value={stats.denied}
                  icon={XCircle}
                  color="red"
                  progress={
                    stats.total > 0 ? (stats.denied / stats.total) * 100 : 0
                  }
                />
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
                          General Search
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
                        <Hash className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Request ID
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 group">
                      <input
                        type="radio"
                        name="searchType"
                        value="email"
                        checked={searchType === "email"}
                        onChange={(e) => {
                          setSearchType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-700 group-hover:text-blue-700">
                          Email Address
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Search Input and Filters Row - All in One Line */}
              <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 items-stretch xl:items-center justify-between">
                {/* Search Section */}
                <div className="flex gap-3 flex-1 max-w-2xl w-full xl:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10 pointer-events-none" />
                    <Input
                      placeholder={
                        searchType === "general"
                          ? "Search by name or course..."
                          : searchType === "request_id"
                          ? "Enter request ID..."
                          : "Enter email address..."
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
                            • <strong>Double-Click</strong> records to view more
                            details
                          </p>
                          <p>
                            • <strong>Search Types:</strong> Select the type of
                            search above the search bar
                          </p>
                          <p>
                            • <strong>General Search:</strong> Searches in names
                            and course titles
                          </p>
                          <p>
                            • <strong>Request ID:</strong> Search by specific
                            request ID number
                          </p>
                          <p>
                            • <strong>Email Search:</strong> Search by email
                            address
                          </p>
                          <p>
                            • <strong>Filters:</strong> Use status, date range,
                            and month filters for more precise results
                          </p>
                          <p>
                            • <strong>Date Range:</strong> Filter by booking
                            dates (includes signed date, start date, and end
                            date)
                          </p>
                        </div>
                        {/* Arrow pointing up */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-slate-200 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters and Actions Section */}
                <div className="flex flex-wrap gap-2 xl:gap-3 w-full xl:w-auto justify-center xl:justify-end">
                  <Select
                    value={filterStatus}
                    onValueChange={(value) => {
                      setFilterStatus(value);
                      setCurrentPage(1);
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

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-2 border-slate-200 focus-within:border-blue-500 rounded-2xl shadow-lg px-3 py-2 h-9">
                    <CalendarDays className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-28 xl:w-32 h-8 border-0 p-0 text-sm bg-transparent focus:ring-0 focus:outline-none"
                        placeholder="Start"
                      />
                      <span className="text-slate-400 text-sm">-to-</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-28 xl:w-32 h-8 border-0 p-0 text-sm bg-transparent focus:ring-0 focus:outline-none"
                        placeholder="End"
                      />
                    </div>
                  </div>

                  <Select
                    value={filterMonth}
                    onValueChange={(value) => {
                      setFilterMonth(value);
                      setCurrentPage(1);
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
                    onClick={handleClearFilters}
                    className="h-12 xl:h-9 px-3 border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 rounded-2xl shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                    title="Clear all filters"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="xl:w-30 h-12 xl:h-9 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Export
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
                      className="h-12 xl:h-9 w-12 xl:w-9 p-0 border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
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
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-orange-700 text-xs">
                                  The following request IDs don't have calendar
                                  bookings yet (click to copy):
                                </p>
                                <Button
                                  size="sm"
                                  onClick={handleAutoAssignBookings}
                                  className={`
                                  bg-gradient-to-r from-emerald-500 to-green-600
                                  hover:from-emerald-600 hover:to-green-700
                                  active:from-emerald-700 active:to-green-800
                                  text-white
                                  text-xs
                                  px-3 py-1.5
                                  h-8
                                  rounded-xl
                                  shadow-lg
                                  hover:shadow-xl
                                  transition-all
                                  duration-300
                                  ease-in-out
                                  flex
                                  items-center
                                  justify-center
                                  border border-emerald-600/30
                                  disabled:bg-gray-300
                                  disabled:text-gray-500
                                  disabled:cursor-not-allowed
                                  font-semibold
                                `}
                                  disabled={isAutoAssigning}
                                >
                                  {isAutoAssigning ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                      Auto Assign
                                    </>
                                  )}
                                </Button>
                              </div>
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
            {selectedRequests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm font-bold text-blue-700">
                    {selectedRequests.length} request(s) selected (
                    {pendingSelectedCount} pending)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBulkApprove}
                      disabled={pendingSelectedCount === 0}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve Selected
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBulkDeny}
                      disabled={pendingSelectedCount === 0}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Deny Selected
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 font-bold text-slate-700">
                        <Checkbox
                          checked={
                            selectedRequests.length ===
                              paginatedRequests.length &&
                            paginatedRequests.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <ColumnHeader
                        title="Request ID"
                        sortable={true}
                        sortKey="id"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <ColumnHeader
                        title="Officer Name"
                        sortable={true}
                        sortKey="requesting_officer_name"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <th
                        className={`text-left p-4 font-bold text-slate-700 ${
                          sidebarCollapsed ? "" : "hidden"
                        }`}
                      >
                        Designation
                      </th>
                      <th
                        className={`text-left p-4 font-bold text-slate-700 ${
                          sidebarCollapsed ? "" : "hidden"
                        }`}
                      >
                        Email
                      </th>
                      <ColumnHeader
                        title="Course Name"
                        sortable={true}
                        sortKey="course_name"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <th className="text-left p-4 font-bold text-slate-700">
                        Duration
                      </th>
                      <ColumnHeader
                        title="Signed Date"
                        sortable={true}
                        sortKey="signed_date"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <ColumnHeader
                        title="Status"
                        sortable={true}
                        sortKey="request_status"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <th className="text-left p-4 font-bold text-slate-700 rounded-tr-xl">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={sidebarCollapsed ? 10 : 8} className="p-0">
                          <TableSkeleton />
                        </td>
                      </tr>
                    ) : paginatedRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={sidebarCollapsed ? 10 : 8}
                          className="text-center py-8 text-gray-500"
                        >
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
                          sidebarCollapsed={sidebarCollapsed}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && filteredRequests.length > 0 && (
                <BookingPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  indexOfFirstRequest={(currentPage - 1) * ITEMS_PER_PAGE}
                  indexOfLastRequest={currentPage * ITEMS_PER_PAGE}
                  totalItems={filteredRequests.length}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassroomBooking;
