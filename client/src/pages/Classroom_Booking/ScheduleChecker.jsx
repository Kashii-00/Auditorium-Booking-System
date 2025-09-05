import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import { classroomOptions } from "./aidUtils";
import {
  Calendar,
  Download,
  Clock,
  MapPin,
  User,
  Mail,
  Hash,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo, memo } from "react";

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
        className={`text-left p-4 font-semibold text-slate-700 bg-slate-50 ${
          sortable
            ? "cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-all duration-200"
            : ""
        } ${className}`}
        onClick={handleSort}
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {sortable && (
            <ArrowUpDown
              className={`w-4 h-4 text-slate-600 ${
                currentSort.key === sortKey
                  ? "opacity-100 text-slate-800"
                  : "opacity-60"
              }`}
            />
          )}
        </div>
      </th>
    );
  }
);

ColumnHeader.displayName = "ColumnHeader";

// Pagination component
const PaginationControls = ({
  currentPage,
  totalPages,
  indexOfFirst,
  indexOfLast,
  totalItems,
  onPageChange,
  itemType = "items",
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 px-6 pb-6">
        <div className="text-sm text-slate-600 font-medium">
          Showing {indexOfFirst + 1} to {Math.min(indexOfLast, totalItems)} of{" "}
          {totalItems} {itemType}
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="border border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else {
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, start + 4);
              const adjustedStart = Math.max(1, end - 4);
              pageNumber = adjustedStart + i;
            }

            if (pageNumber > totalPages) return null;

            return (
              <Button
                key={`page-${pageNumber}`}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={`rounded-lg font-medium ${
                  currentPage === pageNumber
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-300 hover:border-blue-400 hover:bg-blue-50"
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
            className="border border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="border border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium"
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};

const ScheduleChecker = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => location.state?.sidebarState ?? false
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [freeClassrooms, setFreeClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [bookingsCurrentPage, setBookingsCurrentPage] = useState(1);
  const [freeClassroomsCurrentPage, setFreeClassroomsCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Sorting states
  const [bookingsSort, setBookingsSort] = useState({
    key: "time_from",
    direction: "asc",
  });
  const [freeClassroomsSort, setFreeClassroomsSort] = useState({
    key: "room",
    direction: "asc",
  });

  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState");
      if (stored !== null) {
        const isCollapsed = stored === "true";
        setSidebarCollapsed(isCollapsed);
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          })
        );
      }
    };

    syncSidebarState();
    window.addEventListener("popstate", syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      localStorage.setItem("sidebarState", e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("popstate", syncSidebarState);
    };
  }, []);

  useEffect(() => {
    fetchBookings();
    // Reset pagination when date changes
    setBookingsCurrentPage(1);
    setFreeClassroomsCurrentPage(1);
  }, [selectedDate]);

  // Sorting logic for bookings
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let valueA, valueB;

      switch (bookingsSort.key) {
        case "request_id":
          valueA = a.request_id || "";
          valueB = b.request_id || "";
          break;
        case "requesting_officer_name":
          valueA =
            (a.requesting_officer_name && a.requesting_officer_name !== "N/A"
              ? a.requesting_officer_name
              : a.user_name) || "";
          valueB =
            (b.requesting_officer_name && b.requesting_officer_name !== "N/A"
              ? b.requesting_officer_name
              : b.user_name) || "";
          break;
        case "requesting_officer_email":
          valueA =
            (a.requesting_officer_email && a.requesting_officer_email !== "N/A"
              ? a.requesting_officer_email
              : a.user_email) || "";
          valueB =
            (b.requesting_officer_email && b.requesting_officer_email !== "N/A"
              ? b.requesting_officer_email
              : b.user_email) || "";
          break;
        case "calendar_course":
          valueA = a.calendar_course || "";
          valueB = b.calendar_course || "";
          break;
        case "time_from":
          valueA = new Date(`1970-01-01T${a.time_from}`).getTime();
          valueB = new Date(`1970-01-01T${b.time_from}`).getTime();
          break;
        case "classes_allocated":
          valueA = a.classes_allocated || "";
          valueB = b.classes_allocated || "";
          break;
        default:
          valueA = new Date(`1970-01-01T${a.time_from}`).getTime();
          valueB = new Date(`1970-01-01T${b.time_from}`).getTime();
      }

      if (bookingsSort.direction === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [bookings, bookingsSort]);

  // Sorting logic for free classrooms
  const sortedFreeClassrooms = useMemo(() => {
    return [...freeClassrooms].sort((a, b) => {
      let valueA, valueB;

      switch (freeClassroomsSort.key) {
        case "room":
          valueA = a.room || "";
          valueB = b.room || "";
          break;
        case "free":
          valueA = a.free === "All Day" ? "ZZZZZ" : a.free || ""; // Put "All Day" at the end
          valueB = b.free === "All Day" ? "ZZZZZ" : b.free || "";
          break;
        default:
          valueA = a.room || "";
          valueB = b.room || "";
      }

      if (freeClassroomsSort.direction === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [freeClassrooms, freeClassroomsSort]);

  // Pagination calculations for bookings
  const bookingsTotalPages = Math.max(
    1,
    Math.ceil(sortedBookings.length / ITEMS_PER_PAGE)
  );
  const bookingsStartIndex = (bookingsCurrentPage - 1) * ITEMS_PER_PAGE;
  const bookingsEndIndex = bookingsStartIndex + ITEMS_PER_PAGE;
  const paginatedBookings = sortedBookings.slice(
    bookingsStartIndex,
    bookingsEndIndex
  );

  // Pagination calculations for free classrooms
  const freeClassroomsTotalPages = Math.max(
    1,
    Math.ceil(sortedFreeClassrooms.length / ITEMS_PER_PAGE)
  );
  const freeClassroomsStartIndex =
    (freeClassroomsCurrentPage - 1) * ITEMS_PER_PAGE;
  const freeClassroomsEndIndex = freeClassroomsStartIndex + ITEMS_PER_PAGE;
  const paginatedFreeClassrooms = sortedFreeClassrooms.slice(
    freeClassroomsStartIndex,
    freeClassroomsEndIndex
  );

  // Pagination handlers
  const handleBookingsPageChange = useCallback(
    (page) => {
      if (page < 1 || page > bookingsTotalPages) return;
      setBookingsCurrentPage(page);
    },
    [bookingsTotalPages]
  );

  const handleFreeClassroomsPageChange = useCallback(
    (page) => {
      if (page < 1 || page > freeClassroomsTotalPages) return;
      setFreeClassroomsCurrentPage(page);
    },
    [freeClassroomsTotalPages]
  );

  // Sorting handlers
  const handleBookingsSort = useCallback((sortConfig) => {
    setBookingsSort(sortConfig);
    setBookingsCurrentPage(1); // Reset to first page when sorting
  }, []);

  const handleFreeClassroomsSort = useCallback((sortConfig) => {
    setFreeClassroomsSort(sortConfig);
    setFreeClassroomsCurrentPage(1); // Reset to first page when sorting
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authRequest(
        "get",
        getApiUrl("/classroom-calendar/details-v2")
      );

      console.log("✅ Full raw response:", response);

      // ✅ Access nested `data` from response
      const bookingsData = response?.data;

      if (!Array.isArray(bookingsData)) {
        console.error("❌ bookingsData is not an array", bookingsData);
        throw new Error("Invalid data format received from server.");
      }

      const dateString = selectedDate.toISOString().split("T")[0];

      const filtered = bookingsData.filter((booking) => {
        if (!Array.isArray(booking.effective_dates)) {
          console.warn(
            "⚠️ Missing or invalid effective_dates for booking ID:",
            booking?.id
          );
          return false;
        }
        return booking.effective_dates.includes(dateString);
      });

      const sorted = filtered.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.time_to}`);
        const timeB = new Date(`1970-01-01T${b.time_to}`);
        return timeA - timeB;
      });

      console.log("✅ Filtered and sorted bookings:", sorted);

      setBookings(sorted);
      calculateFreeClassrooms(sorted);
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const calculateFreeClassrooms = (bookingsForDay) => {
    const classrooms = {};

    bookingsForDay.forEach(({ classes_allocated, time_from, time_to }) => {
      if (!classes_allocated) return;

      const allocatedRooms = classes_allocated
        .split(",")
        .map((room) => room.trim());
      allocatedRooms.forEach((room) => {
        const times = classrooms[room] || [];
        times.push([
          new Date(`${selectedDate.toISOString().split("T")[0]}T${time_from}`),
          new Date(`${selectedDate.toISOString().split("T")[0]}T${time_to}`),
        ]);
        classrooms[room] = times;
      });
    });

    const allClassrooms = classroomOptions.map((opt) => opt.value);
    const freeData = [];

    allClassrooms.forEach((room) => {
      const slots = classrooms[room] || [];
      if (slots.length === 0) {
        freeData.push({ room, free: "All Day" });
      } else {
        slots.sort((a, b) => a[0] - b[0]);
        const freeSlots = [];
        let start = new Date(
          `${selectedDate.toISOString().split("T")[0]}T08:00:00`
        );

        for (let [from, to] of slots) {
          if (from > start) {
            freeSlots.push(
              `${start.toTimeString().slice(0, 5)} - ${from
                .toTimeString()
                .slice(0, 5)}`
            );
          }
          start = new Date(Math.max(start, to));
        }

        const end = new Date(
          `${selectedDate.toISOString().split("T")[0]}T18:00:00`
        );
        if (start < end) {
          freeSlots.push(
            `${start.toTimeString().slice(0, 5)} - ${end
              .toTimeString()
              .slice(0, 5)}`
          );
        }

        freeData.push({ room, free: freeSlots.join(", ") });
      }
    });

    setFreeClassrooms(freeData);
  };

  const exportCSV = () => {
    const dateStr = selectedDate.toISOString().split("T")[0];

    const bookingHeaders = [
      "Course Name",
      "Time From",
      "Time To",
      "Classroom(s) Allocated",
      "Requesting Officer",
      "Request ID",
      "Officer Email",
    ];
    const bookingRows = bookings.map((b) => [
      b.calendar_course,
      b.time_from,
      b.time_to,
      b.classes_allocated,
      b.requesting_officer_name && b.requesting_officer_name !== "N/A"
        ? b.requesting_officer_name
        : b.user_name || "N/A",
      b.request_id || "N/A",
      b.requesting_officer_email && b.requesting_officer_email !== "N/A"
        ? b.requesting_officer_email
        : b.user_email || "N/A",
    ]);

    const freeRoomHeaders = ["Classroom", "Free Time"];
    const freeRoomRows = freeClassrooms.map(({ room, free }) => [
      room,
      free === "All Day" ? free : formatTimeRange(free),
    ]);

    const csvLines = [];

    // Section 1: Booked Classrooms
    csvLines.push(`Booked Classrooms for ${dateStr}`);
    csvLines.push(bookingHeaders.join(","));
    if (bookingRows.length === 0) {
      csvLines.push("No bookings for this date.");
    } else {
      bookingRows.forEach((row) => {
        csvLines.push(row.join(","));
      });
    }

    csvLines.push(""); // Blank line

    // Section 2: Free Classrooms
    csvLines.push(`Free Classrooms for ${dateStr}`);
    csvLines.push(freeRoomHeaders.join(","));
    freeRoomRows.forEach((row) => {
      csvLines.push(row.join(","));
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `classroom_schedule_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAcronym = (courseName) => {
    if (!courseName || typeof courseName !== "string") return "N/A";
    return courseName
      .replace(/[\(\)\[\]]/g, "") // Remove brackets
      .replace(/[-–—]/g, " _HYPHEN_ ") // Temporarily mark hyphens
      .replace(/&/g, " _AMP_ ") // Temporarily mark ampersands
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 0) // Remove empty parts
      .map((word) => {
        if (word === "_HYPHEN_") return "-"; // Restore hyphen
        if (word === "_AMP_") return "&"; // Restore ampersand
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const formatTimeRange = (range) => {
    return range
      .split(", ")
      .map((slot) => {
        const [start, end] = slot.split(" - ");
        return `${formatTime(start)} - ${formatTime(end)}`;
      })
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Schedule Checker
              </h1>
              <p className="text-slate-600 text-sm">
                View classroom bookings and availability
              </p>
            </div>
          </div>

          {/* Date Filter and Export */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading schedule data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error loading schedule</p>
          </div>
          <p className="text-red-700 text-sm mt-2">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Scheduled Bookings Section */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-white" />
                <h2 className="text-xl font-semibold text-white">
                  Scheduled Classroom Bookings
                </h2>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    No Bookings Found
                  </h3>
                  <p className="text-slate-600">
                    There are no classroom bookings for this date.
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <ColumnHeader
                          title="Request ID"
                          sortable={true}
                          sortKey="request_id"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                        <ColumnHeader
                          title="Officer"
                          sortable={true}
                          sortKey="requesting_officer_name"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                        <ColumnHeader
                          title="Email"
                          sortable={true}
                          sortKey="requesting_officer_email"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                        <ColumnHeader
                          title="Course"
                          sortable={true}
                          sortKey="calendar_course"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                        <ColumnHeader
                          title="Time"
                          sortable={true}
                          sortKey="time_from"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                        <ColumnHeader
                          title="Classroom(s)"
                          sortable={true}
                          sortKey="classes_allocated"
                          currentSort={bookingsSort}
                          onSort={handleBookingsSort}
                        />
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginatedBookings.map((b, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {b.request_id || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {b.req_officer_name && b.req_officer_name !== "N/A"
                              ? b.req_officer_name
                              : b.user_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {b.req_officer_email &&
                            b.req_officer_email !== "N/A"
                              ? b.req_officer_email
                              : b.user_email || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="text-sm font-medium text-slate-900"
                              title={b.calendar_course}
                            >
                              {b.calendar_course}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium">
                                {formatTime(b.time_from)}
                              </span>
                              <span>-</span>
                              <span className="font-medium">
                                {formatTime(b.time_to)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {b.classes_allocated
                                ?.split(",")
                                .map((room, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {room.trim()}
                                  </span>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination for bookings */}
                  {sortedBookings.length > ITEMS_PER_PAGE && (
                    <PaginationControls
                      currentPage={bookingsCurrentPage}
                      totalPages={bookingsTotalPages}
                      indexOfFirst={bookingsStartIndex}
                      indexOfLast={bookingsEndIndex}
                      totalItems={sortedBookings.length}
                      onPageChange={handleBookingsPageChange}
                      itemType="bookings"
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Free Classrooms Section */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-white" />
                <h2 className="text-xl font-semibold text-white">
                  Available Classrooms
                </h2>
              </div>
              <p className="text-green-100 text-sm mt-1">
                Free time slots for each classroom
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <ColumnHeader
                      title="Classroom"
                      sortable={true}
                      sortKey="room"
                      currentSort={freeClassroomsSort}
                      onSort={handleFreeClassroomsSort}
                    />
                    <ColumnHeader
                      title="Available Time"
                      sortable={true}
                      sortKey="free"
                      currentSort={freeClassroomsSort}
                      onSort={handleFreeClassroomsSort}
                    />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedFreeClassrooms.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {item.room}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.free === "All Day" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            All Day Available
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {formatTimeRange(item.free)
                              .split(", ")
                              .map((timeSlot, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800"
                                >
                                  {timeSlot}
                                </span>
                              ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination for free classrooms */}
              {sortedFreeClassrooms.length > ITEMS_PER_PAGE && (
                <PaginationControls
                  currentPage={freeClassroomsCurrentPage}
                  totalPages={freeClassroomsTotalPages}
                  indexOfFirst={freeClassroomsStartIndex}
                  indexOfLast={freeClassroomsEndIndex}
                  totalItems={sortedFreeClassrooms.length}
                  onPageChange={handleFreeClassroomsPageChange}
                  itemType="classrooms"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleChecker;
