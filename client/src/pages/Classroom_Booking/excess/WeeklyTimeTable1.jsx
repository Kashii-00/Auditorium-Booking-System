import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
// import html2canvas from "html2canvas";
import axios from "axios";
import "./styles/timetable.css";
import { classroomOptions } from "./aidUtils";
import html2pdf from "html2pdf.js";

// const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const getNextWeekInfo = () => {
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  const day = today.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const diffToMonday = day === 0 ? -6 : 1 - day;
  firstDayOfWeek.setDate(today.getDate() + diffToMonday);

  // Get the start date of the next week by adding 7 days to the current week's start date
  const weekStart = new Date(firstDayOfWeek);
  weekStart.setDate(weekStart.getDate() + 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const oneJan = new Date(today.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((weekStart - oneJan) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);

  return {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    weekNumber,
  };
};

const getNextWeekDates = () => {
  const today = new Date();
  const nextWeekStart = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  nextWeekStart.setDate(today.getDate() + diff);

  const nextWeekDates = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(nextWeekStart);
    d.setDate(nextWeekStart.getDate() + i);
    nextWeekDates[daysOfWeek[i]] = d.toISOString().split("T")[0];
  }
  return nextWeekDates;
};

const normalizeRoom = (roomName) => roomName.replace(/\s?\(.*?\)/g, "").trim();

const getSession = (timeFrom) => {
  const hour = parseInt(timeFrom.split(":")[0], 10);
  return hour < 12 ? "Morning" : "Afternoon";
};

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

const WeeklyTimetable = ({ onClose }) => {
  const [bookings, setBookings] = useState([]);
  const timetableRef = useRef(null);
  const { weekNumber, weekStart, weekEnd } = useMemo(getNextWeekInfo, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5003/api/classroom-calendar",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Raw bookings response:", response.data);

      const bookingsData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const mappedBookings = bookingsData.map((b) => ({
        id: b.id,
        course_name: b.course_name,
        preferred_days_of_week: b.preferred_days_of_week,
        classes_allocated: b.classes_allocated,
        date_from: b.date_from,
        date_to: b.date_to,
        time_from: b.time_from,
        time_to: b.time_to,
      }));

      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const nextWeekDates = getNextWeekDates();
  const timetableData = {};

  bookings.forEach((booking) => {
    const {
      course_name,
      preferred_days_of_week,
      classes_allocated,
      time_from,
      date_from,
      date_to,
    } = booking;

    const session = getSession(time_from);
    const rooms =
      classes_allocated?.split(",").map((r) => normalizeRoom(r.trim())) || [];
    const preferredDays =
      preferred_days_of_week?.split(",").map((d) => d.trim()) || [];

    const start = new Date(date_from);
    const end = new Date(date_to);

    daysOfWeek.forEach((dayKey) => {
      const currentDateStr = nextWeekDates[dayKey];
      const currentDate = new Date(currentDateStr);

      if (
        preferredDays.includes(dayKey) &&
        currentDate >= start &&
        currentDate <= end
      ) {
        rooms.forEach((room) => {
          if (!timetableData[room]) timetableData[room] = {};
          if (!timetableData[room][dayKey])
            timetableData[room][dayKey] = { Morning: [], Afternoon: [] };
          // timetableData[room][dayKey][session].push(course_name);
          timetableData[room][dayKey][session].push({
            course_name,
            time_from: booking.time_from,
            time_to: booking.time_to,
          });
        });
      }
    });
  });

  const handleDownloadPDF = () => {
    const element = timetableRef.current;
    if (!element) return;

    const opt = {
      margin: 0.2,
      filename: "WeeklyTimetable.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        scrollY: 0,
        useCORS: true,
      },

      jsPDF: {
        unit: "in",
        format: [18, 9], // Custom large landscape format (wider than A4)
        orientation: "landscape",
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="table-overlay">
      <div className="timeTable-container">
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="ttbtns">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ttclose"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ttdownload"
              >
                Download as PDF
              </button>
            </div>

            <div className="page-header">
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h1>Next Week's Timetable</h1>
            </div>

            <div
              ref={timetableRef}
              className="overflow-auto border rounded shadow"
            >
              <div className="canvas-outer">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold">
                    Sri Lanka Ports Authority - Mahapola Ports & Maritime
                    Academy
                  </h3>
                  <p>
                    <b>Time Duration</b> = <b>Morning</b> - 09.00am–12.00pm |{" "}
                    <b>Afternoon</b>- 01.00pm–04.00pm
                  </p>
                  <p className="mt-1">
                    Weekly Classroom Allocation -{" "}
                    <strong>Week {weekNumber}</strong>
                  </p>
                  <p>
                    <b>{formatDate(weekStart)}</b> to{" "}
                    <b>{formatDate(weekEnd)}</b>
                  </p>
                </div>
                <table className="min-w-full table-auto text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-100 first-cell">
                        Room
                      </th>
                      {daysOfWeek.map((day) => (
                        <th
                          key={day}
                          className="border p-2 bg-gray-100 text-center first-column-first-th "
                          colSpan={2}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="border p-2 bg-gray-100 first-cell" />
                      {daysOfWeek.map((day) => (
                        <React.Fragment key={day}>
                          <th className="border p-1 bg-gray-200 text-center second-th">
                            Morning
                          </th>
                          <th className="border p-1 bg-gray-200 text-center second-th">
                            Afternoon
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classroomOptions.map(({ value }) => {
                      const room = normalizeRoom(value);
                      return (
                        <tr key={room}>
                          <td className="border p-2 font-medium bg-gray-50 first-column-first-th">
                            {room}
                          </td>
                          {daysOfWeek.map((day) => {
                            const data = timetableData[room]?.[day] || {
                              Morning: [],
                              Afternoon: [],
                            };
                            return (
                              <React.Fragment key={day}>
                                <td className="border p-1  wk-data">
                                  {data.Morning.map((entry, i) => (
                                    <div
                                      className="wkdata"
                                      key={i}
                                      title={entry.course_name}
                                    >
                                      {getAcronym(entry.course_name)} <br />
                                      <small>
                                        {entry.time_from} - {entry.time_to}
                                      </small>
                                    </div>
                                  ))}
                                </td>
                                <td className="border p-1 wk-data">
                                  {data.Afternoon.map((entry, i) => (
                                    <div
                                      className="wkdata"
                                      key={i}
                                      title={entry.course_name}
                                    >
                                      {getAcronym(entry.course_name)} <br />
                                      <small>
                                        {entry.time_from} - {entry.time_to}
                                      </small>
                                    </div>
                                  ))}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTimetable;
