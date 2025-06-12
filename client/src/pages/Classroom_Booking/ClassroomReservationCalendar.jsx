import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./styles/ClassroomReservationCalendar.css";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import SuccessPopup from "../Course&Batch/styles/SuccessPopup";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FaUser, FaPhone, FaPaperPlane, FaCheck } from "react-icons/fa";
import defaultUserImage from "../assets/profile-user.png";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  groupedCourseOptions,
  dayOptions,
  generateTimeOptions,
  classroomOptions,
  classroomsAllowingMultipleBookings,
} from "./aidUtils";

const ClassroomCalendar = ({ user }) => {
  // ✅ Form state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [courseName, setCourseName] = useState(null);
  const [requestId, setRequestId] = useState("");
  const [preferredDays, setPreferredDays] = useState([]); // array of ['Mon', 'Wed', ...]
  const [classesAllocated, setClassesAllocated] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [noOfParticipants, setNoOfParticipants] = useState(null);
  const [examOrNot, setExamOrNot] = useState(""); // Add this
  const [classroomsRequested, setClassroomsRequested] = useState([]); // Add this
  const [events, setEvents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableClassroomOptions, setAvailableClassroomOptions] =
    useState(classroomOptions);

  // ✅ Error tracking
  const [errors, setErrors] = useState({});

  // ✅ Calendar refs and sidebar
  const calendarRef = useRef(null);
  const [isCalendarMounted, setIsCalendarMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDateTime, setShowDateTime] = useState(false);

  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("classroomBookingDraft");
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setCourseName(draft.courseName || null);
        setRequestId(draft.requestId || "");
        setDateFrom(draft.dateFrom || "");
        setDateTo(draft.dateTo || "");
        setTimeFrom(draft.timeFrom || "");
        setTimeTo(draft.timeTo || "");
        setPreferredDays(draft.preferredDays || []);
        setClassesAllocated(draft.classesAllocated || []);
        setNoOfParticipants(draft.noOfParticipants || null);
        setExamOrNot(draft.examOrNot || "");
        setClassroomsRequested(draft.classroomsRequested || []);
        setDraftRestored(true);
        console.log("✅ Restored classroom booking draft:", draft);
      } catch (err) {
        console.error("❌ Failed to parse saved draft:", err);
      }
    }
    setHasLoadedDraft(true);
  }, []);

  useEffect(() => {
    if (hasLoadedDraft) {
      const draft = {
        courseName,
        requestId,
        dateFrom,
        dateTo,
        timeFrom,
        timeTo,
        preferredDays,
        classesAllocated,
        noOfParticipants,
        examOrNot,
        classroomsRequested,
      };
      localStorage.setItem("classroomBookingDraft", JSON.stringify(draft));
      console.log("💾 Saved classroom booking draft:", draft);
    }
  }, [
    courseName,
    requestId,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    preferredDays,
    classesAllocated,
    noOfParticipants,
    examOrNot,
    classroomsRequested,
    hasLoadedDraft,
  ]);

  useEffect(() => {
    const fetchAidRequestById = async (id) => {
      if (draftRestored) {
        console.log("⏸️ Skipping fetch — form restored from draft");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5003/api/aidrequests/approved/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const data = response.data.data;
          setCourseName({ label: data.course_name, value: data.course_name });
          setDateFrom(data.date_from || "");
          setDateTo(data.date_to || "");
          setTimeFrom(data.time_from || "");
          setTimeTo(data.time_to || "");
          setPreferredDays(
            data.preferred_days_of_week?.split(",").map((d) => d.trim()) || []
          );
          setClassesAllocated(
            data.classes_allocated?.split(",").map((c) => c.trim()) || []
          );
          setNoOfParticipants(data.no_of_participants || null);
          setExamOrNot(data.exam_or_not || "");
          setClassroomsRequested(
            data.classrooms_allocated?.split(",").map((c) => c.trim()) || []
          );
          console.log("✅ Fetched data for request ID", id, data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch aid request:", err);
      }
    };

    if (requestId && !draftRestored) {
      fetchAidRequestById(requestId);
    }
  }, [requestId, draftRestored]);

  useEffect(() => {
    const fetchAndFilterAvailableClassrooms = async () => {
      if (
        !dateFrom ||
        !dateTo ||
        !timeFrom ||
        !timeTo ||
        preferredDays.length === 0
      )
        return;

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5003/api/classroom-calendar/details",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const bookings = response.data?.data || [];
        const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const selectedDates = [];
        for (
          let d = new Date(dateFrom);
          d <= new Date(dateTo);
          d.setDate(d.getDate() + 1)
        ) {
          const current = new Date(d); // Copy of the current date (avoid mutation issues)
          const dow = dayMap[current.getDay()];
          if (preferredDays.includes(dow)) {
            selectedDates.push(current.toISOString().split("T")[0]);
          }
        }

        console.log("✅ Selected Dates to Check:", selectedDates);

        const unavailableClassrooms = new Set();

        // bookings.forEach((b) => {
        //   const effectiveDates = b.effective_dates || [];

        //   effectiveDates.forEach((date) => {
        //     if (selectedDates.includes(date)) {
        //       if (isTimeOverlap(timeFrom, timeTo, b.time_from, b.time_to)) {
        //         const booked = extractClassroomIds(b.classes_allocated || "");
        //         booked.forEach((c) => unavailableClassrooms.add(c));
        //       }
        //     }
        //   });
        // });

        bookings.forEach((b) => {
          const effectiveDates = b.effective_dates || [];

          effectiveDates.forEach((date) => {
            if (selectedDates.includes(date)) {
              if (isTimeOverlap(timeFrom, timeTo, b.time_from, b.time_to)) {
                const booked = extractClassroomIds(b.classes_allocated || "");
                booked.forEach((c) => {
                  // Skip adding classrooms that allow multiple bookings
                  if (!classroomsAllowingMultipleBookings.includes(c)) {
                    unavailableClassrooms.add(c);
                  }
                });
              }
            }
          });
        });

        const availableOptions = classroomOptions.filter(
          (opt) => !unavailableClassrooms.has(opt.value)
        );

        console.log("🚫 Unavailable classrooms:", [...unavailableClassrooms]);
        console.log(
          "✅ Filtered options:",
          availableOptions.map((opt) => opt.value)
        );

        setAvailableClassroomOptions(availableOptions);
      } catch (err) {
        console.error("❌ Error checking available classrooms:", err);
      }
    };

    fetchAndFilterAvailableClassrooms();
  }, [dateFrom, dateTo, timeFrom, timeTo, preferredDays]);

  const isTimeOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  const extractClassroomIds = (str) => {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleCourseChange = (selectedOption) => {
    setCourseName(selectedOption);
  };

  const handlePreferredDaysChange = (selectedOptions) => {
    setPreferredDays(selectedOptions.map((option) => option.value));
  };

  const handleClassroomsChange = (selectedOptions) => {
    setClassesAllocated(selectedOptions.map((option) => option.value));
  };

  // Handle calendar resize when sidebar changes or window resizes
  const handleResize = useCallback(() => {
    if (isCalendarMounted && calendarRef.current?.getApi) {
      setTimeout(() => {
        try {
          const api = calendarRef.current.getApi();
          if (api) {
            api.updateSize();
          }
        } catch (error) {
          console.log("Calendar API not ready yet");
        }
      }, 300);
    }
  }, [isCalendarMounted]);

  // Initialize when calendar is mounted
  useEffect(() => {
    if (calendarRef.current) {
      setIsCalendarMounted(true);
    }
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    // Always sync sidebar state from localStorage on mount and on popstate
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

    // On mount, sync sidebar state
    syncSidebarState();

    // Listen for browser back/forward navigation and sync sidebar state
    window.addEventListener("popstate", syncSidebarState);

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
      localStorage.setItem("sidebarState", e.detail.isCollapsed);
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("popstate", syncSidebarState);
    };
  }, [handleResize, isCalendarMounted]);

  // ✅ Tooltip for event preview
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    courseName: "",
    classesAllocated: "",
    start: "",
    end: "",
    status: "",
  });

  const handleEventMouseEnter = (info) => {
    const { pageX, pageY } = info.jsEvent;

    const startTime = info.event.start
      ? info.event.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const endTime = info.event.end
      ? info.event.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const { courseName, classesAllocated, status } = info.event.extendedProps;

    setTooltip({
      visible: true,
      x: pageX,
      y: pageY,
      courseName: courseName || "No course name",
      classesAllocated: classesAllocated || "No details",
      start: startTime,
      end: endTime,
      status: status || "N/A",
    });
  };

  // When mouse leaves the event, hide the tooltip
  const handleEventMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};
    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date(dateFrom).setHours(0, 0, 0, 0);
    const end = new Date(dateTo).setHours(0, 0, 0, 0);

    if (!dateFrom) newErrors.dateFrom = "Start date is required";

    if (!dateTo) newErrors.dateTo = "End date is required";
    else if (end < today) newErrors.dateTo = "End date cannot be in the past";
    else if (end < start)
      newErrors.dateTo = "End date must be after start date";

    if (!timeFrom) newErrors.timeFrom = "Start time is required";
    if (!timeTo) newErrors.timeTo = "End time is required";
    else if (timeFrom && timeTo && timeTo <= timeFrom)
      newErrors.timeTo = "End time must be after start time";

    if (!courseName || !courseName.value) {
      newErrors.courseName = "Course name is required";
    }
    if (classesAllocated.length === 0) {
      newErrors.classroomsAllocated = "Please select at least one classroom.";
    }
    if (preferredDays.length === 0)
      newErrors.preferredDays = "At least one day must be selected";

    setErrors(newErrors);

    // ⏲️ Auto-clear validation errors
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        setErrors({});
      }, 5000);
    }
    return Object.keys(newErrors).length === 0;
  };

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5003/api/classroom-calendar/details",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookings = response.data?.data || [];
      const mappedEvents = [];

      bookings.forEach((b) => {
        const dates = b.effective_dates || [];

        dates.forEach((dateStr) => {
          mappedEvents.push({
            id: `${b.calendar_id}-${dateStr}`,
            title: b.course_name || b.calendar_course,
            start: `${dateStr}T${b.time_from}`,
            end: `${dateStr}T${b.time_to}`,
            extendedProps: {
              courseName: b.course_name || b.calendar_course,
              classesAllocated: b.classes_allocated,
              status: "Scheduled",
            },
          });
        });
      });

      setEvents(mappedEvents);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // ✅ Submit form
  const handleBooking = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5003/api/classroom-calendar",
        {
          user_id: user.id,
          request_id: requestId || null,
          date_from: dateFrom,
          date_to: dateTo,
          time_from: timeFrom,
          time_to: timeTo,
          course_name:
            (courseName?.value || courseName) +
            (examOrNot?.toLowerCase() === "yes" ? " Exam" : ""),
          preferred_days_of_week: preferredDays.join(", "), // convert array to string
          classes_allocated: classesAllocated.join(", "),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMessage("Booking created successfully!");
        setShowPopup(true);
        fetchBookings();
        // Reset form
        setDateFrom("");
        setDateTo("");
        setTimeFrom("");
        setTimeTo("");
        setCourseName(null);
        setPreferredDays([]);
        setClassesAllocated([]);
        setNoOfParticipants(null);
        setExamOrNot("");
        setClassroomsRequested([]);
        setRequestId("");
        localStorage.removeItem("classroomBookingDraft");
        setHasLoadedDraft(false);
        setDraftRestored(false);
        setTimeout(() => setShowPopup(false), 3000);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage("Failed to create booking.");
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setMessage("Server error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update calendar when sidebar changes or window resizes
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      if (isCalendarMounted) {
        // Use a longer delay for sidebar toggle since it's a bigger layout change
        setTimeout(handleResize, 500);
      }
    };

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered);
      if (isCalendarMounted) {
        setTimeout(handleResize, 500);
      }
    };

    const handleWindowResize = () => {
      if (isCalendarMounted) {
        handleResize();
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    window.addEventListener("sidebarHover", handleSidebarHover);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
      window.removeEventListener("sidebarHover", handleSidebarHover);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleResize, isCalendarMounted]);

  const getAcronym = (courseName) => {
    if (!courseName) return "";
    const words = courseName
      .replace(/[\(\)\[\]]/g, "") // Remove brackets
      .replace(/[-–—]/g, " _HYPHEN_ ") // Temporarily mark hyphens
      .replace(/&/g, " _AMP_ ") // Temporarily mark ampersands
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 0);

    const hasExam = words.some((word) => word.toLowerCase() === "exam");

    const acronym = words
      .filter((word) => word.toLowerCase() !== "exam") // Exclude 'exam' from acronym
      .map((word) => {
        if (word === "_HYPHEN_") return "-";
        if (word === "_AMP_") return "&";
        const letter = word[0].toUpperCase();
        return /[A-Z]/.test(letter) ? letter : "";
      })
      .join("");

    return hasExam ? `${acronym} (EXAM)` : acronym;
  };

  return (
    <div className={`content-wrapper-cb ${sidebarCollapsed ? "expanded" : ""}`}>
      {showPopup && (
        <SuccessPopup
          message="Booking added successfully!"
          onClose={() => setShowPopup(false)}
        />
      )}

      <h1>Classroom Reservation System</h1>

      <div className="calendar-container-cb">
        {/* Calendar Section */}
        <div className="calendar-main-cb">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            handleWindowResize={true}
            viewDidMount={() => {
              setIsCalendarMounted(true);
              setTimeout(handleResize, 300);
            }}
            dayMaxEventRows={2}
            fixedWeekCount={false}
            stickyHeaderDates={true}
            stickyFooterScrollbar={true}
            contentHeight="auto"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: true,
            }}
            nowIndicator={true}
            eventClick={(info) => {
              const [calendarId] = info.event.id.split("-");
              navigate("/calendarbookingtable", {
                state: {
                  highlightId: Number(calendarId),
                  sidebarState: sidebarCollapsed,
                },
              });
            }}
            eventDidMount={(info) => {
              let status = info.event.extendedProps.status.toLowerCase();
              // If status is "Scheduled", override it to "approved"
              if (status === "scheduled") {
                status = "approved";
              }
              info.el.classList.add(`status-${status}`);
            }}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventContent={(eventInfo) => {
              return (
                <div className="fc-event-main-frame">
                  <div className="fc-event-title-container">
                    <div className="fc-event-title">
                      {eventInfo.timeText && (
                        <span className="fc-event-time">
                          {eventInfo.timeText} •{" "}
                        </span>
                      )}
                      {getAcronym(eventInfo.event.title)}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Booking Form */}
        <div className="booking-form-cb">
          <h2 className="form-title-cb">Classroom booking</h2>

          {/* User info */}
          <div className="user-info-container-cb">
            <div className="user-photo-cb">
              <img src={user?.photo || defaultUserImage} alt="User" />
            </div>
            <div className="user-details-cb">
              <div className="user-detail-cb">
                <FaUser className="detail-icon-cb" />
                <span>{user?.name || "User"}</span>
              </div>
              <div className="user-detail-cb">
                <FaPhone className="detail-icon-cb" />
                <span>{user?.phone || "No phone provided"}</span>
              </div>
            </div>
          </div>

          {/* Course Name */}
          <div className="form-group-cb">
            <label htmlFor="course-name">
              <span>Course Name</span>
            </label>
            <CreatableSelect
              isClearable
              id="course-name"
              value={courseName}
              onChange={handleCourseChange}
              options={groupedCourseOptions}
              placeholder="Type to search or create a new course"
              isSearchable
              className={errors.courseName ? "error" : ""}
              classNamePrefix="react-select"
            />
            {errors.courseName && (
              <div className="error-message">{errors.courseName}</div>
            )}
          </div>

          {/* Request ID (Optional) */}
          <div className="form-group-cb">
            <label>
              <span>Request ID</span>
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className={errors.requestId ? "error" : ""}
            />
          </div>
          <div
            onClick={() => setShowDateTime(!showDateTime)}
            className="setDateTime-Dropdown"
          >
            <span>
              {showDateTime ? "Hide Date and Time ▲" : "Set Date and Time ▼"}
            </span>
          </div>

          {showDateTime && (
            <>
              {/* Date Range */}
              <div className="form-group-cb">
                <label>
                  <span>Reservation Dates</span>
                </label>
                <div className="date-range-inputs">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    required
                    className={errors.dateFrom ? "error" : ""}
                  />
                  <span className="time-separator">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || new Date().toISOString().split("T")[0]}
                    required
                    className={errors.dateTo ? "error" : ""}
                    disabled={!dateFrom}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className="form-group-cb">
                <label>
                  <span>Time Slot</span>
                </label>
                <div className="time-inputs">
                  <select
                    value={timeFrom}
                    onChange={(e) => {
                      setTimeFrom(e.target.value);
                      if (timeTo && timeTo <= e.target.value) {
                        setTimeTo("");
                      }
                    }}
                    required
                    className={errors.timeFrom ? "error" : ""}
                  >
                    <option value="" disabled>
                      Start Time
                    </option>
                    {generateTimeOptions().map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>

                  <span className="time-separator">to</span>

                  <select
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    required
                    className={errors.timeTo ? "error" : ""}
                    disabled={!timeFrom}
                  >
                    <option value="" disabled>
                      End Time
                    </option>
                    {generateTimeOptions()
                      .filter((time) => !timeFrom || time.value > timeFrom)
                      .map((time) => (
                        <option key={time.value} value={time.value}>
                          {time.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {noOfParticipants !== null && (
            <div className="form-group-cb">
              <label>
                <span>Number of Participants</span>
              </label>
              <input
                type="number"
                value={noOfParticipants}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>
          )}

          {/* Classroom(s) Requested - only if data exists */}
          {classroomsRequested.length > 0 && (
            <div className="form-group-cb">
              <label>
                <span>Classroom(s) Requested</span>
              </label>
              <input
                type="text"
                value={classroomsRequested.join(", ")}
                readOnly
                disabled
                className="readonly-field"
              />
            </div>
          )}

          {/* Exam or Not */}
          <div className="form-group-cb">
            <label>
              <span>Exam or Not</span>
            </label>
            <input
              type="text"
              value={examOrNot}
              readOnly
              disabled
              className="readonly-field"
            />
          </div>

          {/* Preferred Days Multi-select */}
          <div className="form-group-cb">
            <label htmlFor="preferred-days">
              <span>Preferred Days of the Week</span>
            </label>
            <Select
              id="preferred-days"
              isMulti
              name="preferred_days_of_week"
              options={dayOptions}
              value={dayOptions.filter((option) =>
                preferredDays.includes(option.value)
              )}
              onChange={handlePreferredDaysChange}
              className={errors.preferredDays ? "error" : ""}
              placeholder="Select preferred days"
              classNamePrefix="react-select"
            />
            {errors.preferredDays && (
              <div className="error-message">{errors.preferredDays}</div>
            )}
          </div>

          {/* Classes Allocated */}
          <div className="form-group-cb">
            <label htmlFor="classrooms-allocated">
              <span>Classrooms Allocated</span>
            </label>
            <Select
              id="classrooms-allocated"
              isMulti
              name="classrooms_allocated"
              options={availableClassroomOptions}
              value={availableClassroomOptions.filter((option) =>
                classesAllocated.includes(option.value)
              )}
              onChange={handleClassroomsChange}
              className={errors.classroomsAllocated ? "error" : ""}
              placeholder="Select classrooms"
              isDisabled={availableClassroomOptions.length === 0}
              classNamePrefix="react-select"
            />
            {availableClassroomOptions.length === 0 && (
              <p className="warning-text">
                No classrooms available for selected slot.
              </p>
            )}
            {errors.classroomsAllocated && (
              <div className="error-message">{errors.classroomsAllocated}</div>
            )}
          </div>

          <button
            className="submit-button-2"
            onClick={handleBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <FaPaperPlane />
                <span>Submit Booking</span>
              </>
            )}
          </button>

          <button
            className="clearButton-2"
            onClick={() => {
              if (window.confirm("Clear saved draft and refresh form?")) {
                localStorage.removeItem("classroomBookingDraft");
                setCourseName(null);
                setRequestId("");
                setDateFrom("");
                setDateTo("");
                setTimeFrom("");
                setTimeTo("");
                setPreferredDays([]);
                setClassesAllocated([]);
                setNoOfParticipants(null);
                setExamOrNot("");
                setClassroomsRequested([]);
                setHasLoadedDraft(false);
                setDraftRestored(false);
                console.log("🧹 Cleared classroom booking draft.");
              }
            }}
          >
            Clear Draft
          </button>

          {message && (
            <div className="success-message">
              <FaCheck style={{ marginRight: "8px" }} />
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip Popup */}
      {tooltip.visible && (
        <div
          className="event-tooltip"
          style={{
            top: tooltip.y + 15,
            left: tooltip.x + 15,
          }}
        >
          <div className="tooltip-header">Event Details</div>

          <div className="tooltip-row">
            <span className="tooltip-label">Course:</span>
            <span>{tooltip.courseName}</span>
          </div>

          <div className="tooltip-row">
            <span className="tooltip-label">Time:</span>
            <span>
              {tooltip.start && tooltip.end
                ? `${tooltip.start} - ${tooltip.end}`
                : "Not specified"}
            </span>
          </div>

          <div className="tooltip-row">
            <span className="tooltip-label">Classes:</span>
            <span>{tooltip.classesAllocated}</span>
          </div>

          <div className={`tooltip-status approved`}>{tooltip.status}</div>
        </div>
      )}
    </div>
  );
};

export default ClassroomCalendar;
