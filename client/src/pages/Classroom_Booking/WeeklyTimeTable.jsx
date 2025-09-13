"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import axios from "axios";
import "./styles/timetable.css";
import PptxGenJS from "pptxgenjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SLPA from "../Classroom_Booking/styles/SLPA.png";
import { getApiUrl } from "../../utils/apiUrl";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getNextWeekInfo = () => {
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  firstDayOfWeek.setDate(today.getDate() + diffToMonday);
  const weekStart = new Date(firstDayOfWeek);
  weekStart.setDate(weekStart.getDate() + 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); //Sunday
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

// const normalizeRoom = (roomName) => roomName.replace(/\s?$$.*?$$/g, "").trim();

const normalizeRoom = (roomName) => roomName.replace(/\s*\(\d+\)$/, "").trim();

const generateTimeSlots = (start = "09:00", end = "16:00", interval = 30) => {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  while (h < endH || (h === endH && m < endM)) {
    const from = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    m += interval;
    if (m >= 60) {
      h += 1;
      m -= 60;
    }
    const to = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ from, to });
  }
  return slots;
};

const WeeklyTimetable = forwardRef(({ onClose }, ref) => {
  const [bookings, setBookings] = useState([]);
  const timetableRef = useRef(null);
  const { weekNumber, weekStart, weekEnd } = useMemo(getNextWeekInfo, []);
  const nextWeekDates = getNextWeekDates();
  const timeSlots = generateTimeSlots();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // // Utility to clean classroom names
  // const formatClassroom = (room) => {
  //   // Remove only "(digits)" at the end of the string
  //   return room.replace(/\s*\(\d+\)$/, "").trim();
  // };

  const handleDownloadPPT = () => {
    const pptx = new PptxGenJS();
    const logoImagePath = SLPA;

    const MAX_Y_POS = 6.5;
    const LINE_HEIGHT = 0.5;

    const parseTime = (slot) => {
      const [hour, minute] = slot.split(":").map(Number);
      return hour * 60 + minute;
    };

    const formatRange = (start, end) => {
      const to12Hour = (min) => {
        const hours = Math.floor(min / 60);
        const minutes = min % 60;
        const ampm = hours >= 12 ? "PM" : "AM";
        const hr12 = hours % 12 === 0 ? 12 : hours % 12;
        const minStr = minutes.toString().padStart(2, "0");
        return `${hr12}:${minStr} ${ampm}`;
      };
      return `${to12Hour(start)} - ${to12Hour(end)}`;
    };

    daysOfWeek.forEach((day) => {
      const date = nextWeekDates[day];
      let slide = pptx.addSlide();
      slide.background = { fill: "003366" };

      const addSlideHeader = (slide) => {
        slide.addImage({ path: logoImagePath, x: 0.2, y: 0.2, w: 1, h: 1 });

        slide.addText("Sri Lanka Ports Authority", {
          x: 1.2,
          y: 0.2,
          fontSize: 20,
          bold: true,
          color: "FFFF00",
        });

        slide.addText("Mahapola Ports & Maritime Academy", {
          x: 1.2,
          y: 0.6,
          fontSize: 18,
          color: "FFFF00",
        });

        slide.addText(`Classroom Allocation    ${date}`, {
          x: 1.2,
          y: 1.0,
          fontSize: 18,
          color: "CCFF00",
          underline: true,
        });

        slide.addText("Room No", {
          x: 8.0,
          y: 1.0,
          fontSize: 16,
          bold: true,
          color: "FFFF00",
        });
      };

      addSlideHeader(slide);

      let yPos = 1.6;

      // 1. Group entries
      const grouped = {};

      Object.entries(timetableData[day] || {}).forEach(([slot, courses]) => {
        const [from, to] = slot.split("-");
        const slotStart = parseTime(from);
        const slotEnd = parseTime(to);

        courses.forEach((entry) => {
          const key = `${entry.course_name}__${entry.classroom}`;
          if (!grouped[key]) {
            grouped[key] = {
              course: entry.course_name,
              room: entry.classroom,
              start: slotStart,
              end: slotEnd,
            };
          } else {
            grouped[key].start = Math.min(grouped[key].start, slotStart);
            grouped[key].end = Math.max(grouped[key].end, slotEnd);
          }
        });
      });

      const groupedEntries = Object.values(grouped);

      groupedEntries.forEach((entry) => {
        if (yPos >= MAX_Y_POS) {
          slide = pptx.addSlide();
          slide.background = { fill: "003366" };
          addSlideHeader(slide);
          yPos = 1.6;
        }

        const timeRange = formatRange(entry.start, entry.end);

        let color = "FFFFFF";
        const fontSize = 16;
        let bold = false;

        if (entry.course.includes("Disciplinary")) {
          color = "FFFF00";
          bold = true;
        } else if (entry.course.includes("Typing")) {
          color = "99FF33";
          bold = true;
        }

        slide.addText(`➤ ${entry.course} (${timeRange})`, {
          x: 0.5,
          y: yPos,
          fontSize,
          bold,
          color,
        });

        slide.addText(entry.room.toString(), {
          x: 8.0,
          y: yPos,
          fontSize: 16,
          bold: true,
          color: "FFFFFF",
        });

        yPos += LINE_HEIGHT;
      });
    });

    pptx.writeFile("ClassroomAllocation.pptx");
  };

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        getApiUrl("/classroom-calendar/details"),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookingsData = response.data?.data || [];

      const mappedBookings = bookingsData.map((b) => ({
        id: b.id,
        course_name: b.course_name || b.calendar_course,
        classes_allocated: b.classes_allocated,
        time_from: b.time_from,
        time_to: b.time_to,
        effective_dates: b.effective_dates || [],
      }));

      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, []);

  useEffect(() => {
    // Call it immediately
    fetchBookings();

    // Set up interval
    const interval = setInterval(() => {
      fetchBookings();
    }, 30000); // 30,000 ms = 30 seconds

    // Clean up on unmount
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const timetableData = {};
  bookings.forEach((booking) => {
    const {
      course_name,
      classes_allocated,
      time_from,
      time_to,
      effective_dates,
    } = booking;

    const rooms =
      classes_allocated?.split(",").map((r) => normalizeRoom(r.trim())) || [];

    effective_dates.forEach((dateStr) => {
      const dayKey = daysOfWeek.find((day) => nextWeekDates[day] === dateStr);
      if (!dayKey) return;

      timeSlots.forEach(({ from, to }) => {
        const slotStart = toMinutes(from);
        const slotEnd = toMinutes(to);
        const bookingStart = toMinutes(time_from);
        const bookingEnd = toMinutes(time_to);

        if (slotStart < bookingEnd && slotEnd > bookingStart) {
          if (!timetableData[dayKey]) timetableData[dayKey] = {};
          const slot = `${from}-${to}`;
          if (!timetableData[dayKey][slot]) {
            timetableData[dayKey][slot] = [];
          }

          rooms.forEach((room) => {
            timetableData[dayKey][slot].push({
              course_name,
              classroom: room,
            });
          });
        }
      });
    });
  });

  const handleDownloadPDF = () => {
    console.log("Starting comprehensive PDF download...");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // -------------------
    // Add SLPA Logo - Centered
    // -------------------
    const logoWidth = 30; // adjust width
    const logoHeight = 30; // adjust height
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 10; // distance from top
    doc.addImage(SLPA, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Vertical position for text (below logo)
    let textY = logoY + logoHeight + 5; // 5mm gap below logo

    // -------------------
    // Header Text
    // -------------------
    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const title =
      "Sri Lanka Ports Authority - Mahapola Ports & Maritime Academy";
    doc.text(title, pageWidth / 2, textY, { align: "center" });

    // Time Duration
    textY += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const timeDuration =
      "Time Duration = Morning - 09.00am–12.00pm | Afternoon - 01.00pm–04.00pm";
    doc.text(timeDuration, pageWidth / 2, textY, { align: "center" });

    // Week Title
    textY += 8;
    doc.setFont("helvetica", "bold");
    const weekTitle = `Weekly Classroom Allocation - Week ${weekNumber}`;
    doc.text(weekTitle, pageWidth / 2, textY, { align: "center" });

    // Date Range
    textY += 8;
    doc.setFont("helvetica", "normal");
    const dateRange = `${formatDate(weekStart)} to ${formatDate(weekEnd)}`;
    doc.text(dateRange, pageWidth / 2, textY, { align: "center" });

    // -------------------
    // Timetable
    // -------------------
    const currentY = textY + 10; // start below header
    const timetableHeaders = ["Time", ...daysOfWeek];
    const timetableRows = [];

    timeSlots.forEach(({ from, to }) => {
      const slotKey = `${from}-${to}`;
      const slotLabel = `${formatTime(from)} – ${formatTime(to)}`;
      const row = [slotLabel];

      daysOfWeek.forEach((day) => {
        const entries = timetableData[day]?.[slotKey] || [];
        const cellContent = entries
          .map((entry) => `${entry.course_name} (${entry.classroom})`)
          .join("\n\n");
        row.push(cellContent || "");
      });

      timetableRows.push(row);
    });

    autoTable(doc, {
      startY: currentY,
      head: [timetableHeaders],
      body: timetableRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" }, // Time column
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 50 },
        4: { cellWidth: 50 },
        5: { cellWidth: 50 },
        6: { cellWidth: 50 },
        7: { cellWidth: 50 },
      },
      margin: { left: 20, right: 20 },
    });

    doc.save(`Weekly_Timetable_Week_${weekNumber}.pdf`);
    console.log("PDF download completed");
  };

  const handleDownloadCSV = () => {
    const headers = ["Time", ...daysOfWeek];
    const rows = [];

    timeSlots.forEach(({ from, to }) => {
      const slotKey = `${from}-${to}`;
      const slotLabel = `${formatTime(from)} – ${formatTime(to)}`;
      const row = [slotLabel];

      daysOfWeek.forEach((day) => {
        const entries = timetableData[day]?.[slotKey] || [];
        const cellContent = entries
          .map((entry) => `${entry.course_name} (${entry.classroom})`)
          .join("; ");
        row.push(cellContent || "");
      });

      rows.push(row);
    });

    // Build CSV string
    const csvContent = [headers, ...rows]
      .map((e) => e.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Weekly_Timetable_Week_${weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBothPDFsAndPPTX = () => {
    try {
      console.log("Starting combined download process...");

      // CSV first (instant)
      handleDownloadCSV();

      // Download comprehensive PDF (includes both timetable and acronyms)
      handleDownloadPDF();

      // Wait 2 seconds before PPTX download
      setTimeout(() => {
        handleDownloadPPT();
        console.log("All downloads initiated successfully!");
      }, 2000);
    } catch (error) {
      console.error("Error during combined download:", error);
      alert(
        "There was an error downloading some files. Please check the console for details."
      );
    }
  };

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 focus:outline-none"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
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
              Next Week's Timetable
            </h2>
            <div className="flex gap-3">
              {/* Glass Download Button */}
              <button
                onClick={handleDownloadBothPDFsAndPPTX}
                className="group relative px-6 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-500/20 hover:border-blue-400/30 hover:scale-105"
              >
                <div className="flex items-center gap-2 text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 group-hover:animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="font-medium text-sm">Download</span>
                </div>
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Glass Close Button */}
              <button
                onClick={onClose}
                className="group relative px-6 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-red-500/20 hover:border-red-400/30 hover:scale-105"
              >
                <div className="flex items-center gap-2 text-gray-700 group-hover:text-red-600 transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="font-medium text-sm">Close</span>
                </div>
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          <div className="p-4" ref={timetableRef}>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold">
                Sri Lanka Ports Authority - Mahapola Ports & Maritime Academy
              </h3>
              <p className="text-sm">
                <b>Time Duration</b> = <b>Morning</b> - 09.00am–12.00pm |{" "}
                <b>Afternoon</b>- 01.00pm–04.00pm
              </p>
              <p className="mt-1 text-sm">
                Weekly Classroom Allocation - <strong>Week {weekNumber}</strong>
              </p>
              <p className="text-sm">
                <b>{formatDate(weekStart)}</b> to <b>{formatDate(weekEnd)}</b>
              </p>
            </div>

            <div className="border rounded shadow overflow-x-auto z-9">
              <table className="min-w-full table-fixed text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100 sticky left-0 ">
                      Time
                    </th>
                    {daysOfWeek.map((day) => (
                      <th
                        key={day}
                        className="border p-2 bg-gray-100 text-center"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(({ from, to }) => {
                    const slotKey = `${from}-${to}`; // used for data lookup
                    const slotLabel = `${formatTime(from)} – ${formatTime(to)}`; // shown in UI
                    return (
                      <tr key={slotKey}>
                        <td className="border p-2 font-medium bg-gray-50 sticky left-0 ">
                          {slotLabel}
                        </td>
                        {daysOfWeek.map((day) => {
                          const entries = timetableData[day]?.[slotKey] || [];
                          return (
                            <td key={day} className="border p-1">
                              <div className="flex flex-col gap-1">
                                {entries.map((entry, i) => (
                                  <div
                                    key={i}
                                    className="bg-blue-50 border border-blue-200 p-1 rounded text-xs"
                                    title={entry.course_name}
                                  >
                                    <div className="font-bold">
                                      {entry.course_name}
                                    </div>
                                    <div className="text-gray-600 text-[10px]">
                                      {entry.classroom}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
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
  );
});

WeeklyTimetable.displayName = "WeeklyTimetable";

export default WeeklyTimetable;
