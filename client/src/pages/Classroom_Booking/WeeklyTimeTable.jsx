"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import axios from "axios"
import "./styles/timetable.css"
import { groupedCourseOptions } from "./aidUtils"
import html2pdf from "html2pdf.js"
import PptxGenJS from "pptxgenjs"
import SLPA from "../Classroom_Booking/styles/SLPA.png"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const getNextWeekInfo = () => {
  const today = new Date()
  const firstDayOfWeek = new Date(today)
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  firstDayOfWeek.setDate(today.getDate() + diffToMonday)
  const weekStart = new Date(firstDayOfWeek)
  weekStart.setDate(weekStart.getDate() + 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) //Sunday
  const oneJan = new Date(today.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((weekStart - oneJan) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)
  return {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    weekNumber,
  }
}

const getNextWeekDates = () => {
  const today = new Date()
  const nextWeekStart = new Date(today)
  const day = today.getDay()
  const diff = day === 0 ? 1 : 8 - day
  nextWeekStart.setDate(today.getDate() + diff)
  const nextWeekDates = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(nextWeekStart)
    d.setDate(nextWeekStart.getDate() + i)
    nextWeekDates[daysOfWeek[i]] = d.toISOString().split("T")[0]
  }
  return nextWeekDates
}

const normalizeRoom = (roomName) => roomName.replace(/\s?$$.*?$$/g, "").trim()

const generateTimeSlots = (start = "09:00", end = "16:00", interval = 30) => {
  const slots = []
  let [h, m] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  while (h < endH || (h === endH && m < endM)) {
    const from = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    m += interval
    if (m >= 60) {
      h += 1
      m -= 60
    }
    const to = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    slots.push({ from, to })
  }
  return slots
}

const getAcronym = (courseName) => {
  if (!courseName) return ""
  const words = courseName
    .replace(/[$$$$[\]]/g, "")
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
}

const WeeklyTimetable = ({ onClose }) => {
  const [bookings, setBookings] = useState([])
  const timetableRef = useRef(null)
  const legendRef = useRef(null)
  const { weekNumber, weekStart, weekEnd } = useMemo(getNextWeekInfo, [])
  const nextWeekDates = getNextWeekDates()
  const timeSlots = generateTimeSlots()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDownloadPPT = () => {
    const pptx = new PptxGenJS()
    const logoImagePath = SLPA

    const MAX_Y_POS = 6.5
    const LINE_HEIGHT = 0.5

    const parseTime = (slot) => {
      const [hour, minute] = slot.split(":").map(Number)
      return hour * 60 + minute
    }

    const formatRange = (start, end) => {
      const to12Hour = (min) => {
        const hours = Math.floor(min / 60)
        const minutes = min % 60
        const ampm = hours >= 12 ? "PM" : "AM"
        const hr12 = hours % 12 === 0 ? 12 : hours % 12
        const minStr = minutes.toString().padStart(2, "0")
        return `${hr12}:${minStr} ${ampm}`
      }
      return `${to12Hour(start)} - ${to12Hour(end)}`
    }

    daysOfWeek.forEach((day) => {
      const date = nextWeekDates[day]
      let slide = pptx.addSlide()
      slide.background = { fill: "003366" }

      const addSlideHeader = (slide) => {
        slide.addImage({ path: logoImagePath, x: 0.2, y: 0.2, w: 1, h: 1 })

        slide.addText("Sri Lanka Ports Authority", {
          x: 1.2,
          y: 0.2,
          fontSize: 20,
          bold: true,
          color: "FFFF00",
        })

        slide.addText("Mahapola Ports & Maritime Academy", {
          x: 1.2,
          y: 0.6,
          fontSize: 18,
          color: "FFFF00",
        })

        slide.addText(`Classroom Allocation    ${date}`, {
          x: 1.2,
          y: 1.0,
          fontSize: 18,
          color: "CCFF00",
          underline: true,
        })

        slide.addText("Room No", {
          x: 8.0,
          y: 1.0,
          fontSize: 16,
          bold: true,
          color: "FFFF00",
        })
      }

      addSlideHeader(slide)

      let yPos = 1.6

      // 1. Group entries
      const grouped = {}

      Object.entries(timetableData[day] || {}).forEach(([slot, courses]) => {
        const [from, to] = slot.split("-")
        const slotStart = parseTime(from)
        const slotEnd = parseTime(to)

        courses.forEach((entry) => {
          const key = `${entry.course_name}__${entry.classroom}`
          if (!grouped[key]) {
            grouped[key] = {
              course: entry.course_name,
              room: entry.classroom,
              start: slotStart,
              end: slotEnd,
            }
          } else {
            grouped[key].start = Math.min(grouped[key].start, slotStart)
            grouped[key].end = Math.max(grouped[key].end, slotEnd)
          }
        })
      })

      const groupedEntries = Object.values(grouped)

      groupedEntries.forEach((entry) => {
        if (yPos >= MAX_Y_POS) {
          slide = pptx.addSlide()
          slide.background = { fill: "003366" }
          addSlideHeader(slide)
          yPos = 1.6
        }

        const timeRange = formatRange(entry.start, entry.end)

        let color = "FFFFFF"
        const fontSize = 16
        let bold = false

        if (entry.course.includes("Disciplinary")) {
          color = "FFFF00"
          bold = true
        } else if (entry.course.includes("Typing")) {
          color = "99FF33"
          bold = true
        }

        slide.addText(`➤ ${entry.course} (${timeRange})`, {
          x: 0.5,
          y: yPos,
          fontSize,
          bold,
          color,
        })

        slide.addText(entry.room.toString(), {
          x: 8.0,
          y: yPos,
          fontSize: 16,
          bold: true,
          color: "FFFFFF",
        })

        yPos += LINE_HEIGHT
      })
    })

    pptx.writeFile("ClassroomAllocation.pptx")
  }

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number)
    return h * 60 + m
  }

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5003/api/classroom-calendar/details", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const bookingsData = response.data?.data || []

      const mappedBookings = bookingsData.map((b) => ({
        id: b.id,
        course_name: b.course_name || b.calendar_course,
        classes_allocated: b.classes_allocated,
        time_from: b.time_from,
        time_to: b.time_to,
        effective_dates: b.effective_dates || [],
      }))

      setBookings(mappedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    }
  }, [])

  useEffect(() => {
    // Call it immediately
    fetchBookings()

    // Set up interval
    const interval = setInterval(() => {
      fetchBookings()
    }, 30000) // 30,000 ms = 30 seconds

    // Clean up on unmount
    return () => clearInterval(interval)
  }, [fetchBookings])

  const timetableData = {}
  bookings.forEach((booking) => {
    const { course_name, classes_allocated, time_from, time_to, effective_dates } = booking

    const rooms = classes_allocated?.split(",").map((r) => normalizeRoom(r.trim())) || []

    effective_dates.forEach((dateStr) => {
      const dayKey = daysOfWeek.find((day) => nextWeekDates[day] === dateStr)
      if (!dayKey) return

      timeSlots.forEach(({ from, to }) => {
        const slotStart = toMinutes(from)
        const slotEnd = toMinutes(to)
        const bookingStart = toMinutes(time_from)
        const bookingEnd = toMinutes(time_to)

        if (slotStart < bookingEnd && slotEnd > bookingStart) {
          if (!timetableData[dayKey]) timetableData[dayKey] = {}
          const slot = `${from}-${to}`
          if (!timetableData[dayKey][slot]) {
            timetableData[dayKey][slot] = []
          }

          rooms.forEach((room) => {
            timetableData[dayKey][slot].push({
              course_name,
              classroom: room,
            })
          })
        }
      })
    })
  })

  // Build and sort acronym legend
  const allCourses = groupedCourseOptions.flatMap((group) => group.options)
  const acronymLegend = allCourses
    .map(({ value }) => ({
      name: value,
      acronym: getAcronym(value),
    }))
    .sort((a, b) => a.acronym.localeCompare(b.acronym))

  const handleDownloadPDF = () => {
    const element = timetableRef.current
    if (!element) return
    const opt = {
      margin: 0.2,
      filename: "WeeklyTimetable.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0, useCORS: true },
      jsPDF: { unit: "in", format: [12, 15], orientation: "landscape" },
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleDownloadAcronymPDF = () => {
    const element = legendRef.current
    if (!element) return
    const opt = {
      margin: 0.5,
      filename: "CourseAcronyms.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }
    html2pdf().set(opt).from(element).save()
  }

  const handleDownloadBothPDFsAndPPTX = () => {
    handleDownloadPDF()
    handleDownloadAcronymPDF()
    handleDownloadPPT()
  }

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number)
    const date = new Date()
    date.setHours(h, m)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
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
          <div className="flex gap-2">
            <button
              onClick={handleDownloadBothPDFsAndPPTX}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              Download
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold">Sri Lanka Ports Authority - Mahapola Ports & Maritime Academy</h3>
            <p className="text-sm">
              <b>Time Duration</b> = <b>Morning</b> - 09.00am–12.00pm | <b>Afternoon</b>- 01.00pm–04.00pm
            </p>
            <p className="mt-1 text-sm">
              Weekly Classroom Allocation - <strong>Week {weekNumber}</strong>
            </p>
            <p className="text-sm">
              <b>{formatDate(weekStart)}</b> to <b>{formatDate(weekEnd)}</b>
            </p>
          </div>

          <div ref={timetableRef} className="border rounded shadow overflow-x-auto">
            <table className="min-w-full table-auto text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100 sticky left-0 z-10">Time</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="border p-2 bg-gray-100 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(({ from, to }) => {
                  const slotKey = `${from}-${to}` // used for data lookup
                  const slotLabel = `${formatTime(from)} – ${formatTime(to)}` // shown in UI
                  return (
                    <tr key={slotKey}>
                      <td className="border p-2 font-medium bg-gray-50 sticky left-0 z-10 whitespace-nowrap">
                        {slotLabel}
                      </td>
                      {daysOfWeek.map((day) => {
                        const entries = timetableData[day]?.[slotKey] || []
                        return (
                          <td key={day} className="border p-1">
                            <div className="flex flex-col gap-1">
                              {entries.map((entry, i) => (
                                <div
                                  key={i}
                                  className="bg-blue-50 border border-blue-200 p-1 rounded text-xs"
                                  title={entry.course_name}
                                >
                                  <div className="font-bold">{getAcronym(entry.course_name)}</div>
                                  <div className="text-gray-600 text-[10px]">{entry.classroom}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6" ref={legendRef}>
            <h4 className="font-bold mb-2">Acronym LookUp</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {acronymLegend.map(({ acronym, name }) => (
                <div key={acronym} className="text-xs">
                  <strong>{acronym}</strong> – {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyTimetable
