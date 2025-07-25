"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo, useLayoutEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authRequest } from "../../services/authService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Printer,
  Users,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  BarChart3,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import BatchDetailsPopup from "./BatchDetailsPopup"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

// Performance CSS for hardware acceleration
const PERFORMANCE_CSS = `
  .hardware-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
    will-change: transform, opacity;
  }

  .card-transition {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
                opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, opacity, box-shadow;
  }

  .timeline-batch {
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, box-shadow;
  }

  .timeline-batch:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .stats-card {
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, box-shadow;
  }

  .stats-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .batch-card {
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, box-shadow, border-color;
  }

  .batch-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
  }

  .gradient-text {
    background: linear-gradient(135deg, #1e293b, #3b82f6, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
`

// Memoized Statistics Card Component
const StatCard = memo(({ title, value, icon: Icon, color = "blue", trend, className = "" }) => {
  const colorClasses = useMemo(
    () => ({
      blue: "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-700 border-blue-300 shadow-blue-200/50",
      green:
        "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-200/50",
      purple:
        "bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 text-purple-700 border-purple-300 shadow-purple-200/50",
      orange:
        "bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 text-orange-700 border-orange-300 shadow-orange-200/50",
      rose: "bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 text-rose-700 border-rose-300 shadow-rose-200/50",
    }),
    [],
  )

  return (
    <Card
      className={`hardware-accelerated stats-card border-0 shadow-2xl bg-white/95 backdrop-blur-xl min-h-[140px] ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-black text-slate-600 mb-2 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-black gradient-text mb-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">{trend}</span>
              </div>
            )}
          </div>
          <div
            className={`hardware-accelerated p-4 rounded-2xl shadow-xl border-2 ${colorClasses[color]} flex-shrink-0`}
          >
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

StatCard.displayName = "StatCard"

// Memoized Timeline Batch Component
const TimelineBatch = memo(({ batch, style, onClick, index }) => {
  const getBatchStatusColor = useCallback((batch) => {
    const now = new Date()
    const startDate = new Date(batch.start_date)
    const endDate = new Date(batch.end_date)

    if (now < startDate)
      return "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600"
    if (now > endDate)
      return "bg-gradient-to-r from-slate-400 via-gray-400 to-zinc-400 hover:from-slate-500 hover:via-gray-500 hover:to-zinc-500"
    return "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
  }, [])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }, [])

  if (style.display === "none") return null

  return (
    <div
      className={cn(
        "timeline-batch absolute h-20 rounded-xl shadow-lg cursor-pointer border border-white/20 backdrop-blur-sm",
        getBatchStatusColor(batch),
      )}
      style={{
        ...style,
        top: `${index * 88}px`,
        minWidth: "140px",
        zIndex: 10 + index,
      }}
      onClick={() => onClick(batch)}
    >
      <div className="p-4 h-full flex flex-col justify-between text-white">
        <div>
          <h4 className="font-bold text-sm truncate mb-1">{batch.batch_code}</h4>
          <p className="text-xs opacity-90 font-medium">
            {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
            <Users className="h-3 w-3" />
            <span className="font-semibold">{batch.student_count || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
            <UserCheck className="h-3 w-3" />
            <span className="font-semibold">{batch.lecturer_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

TimelineBatch.displayName = "TimelineBatch"

// Memoized Batch Card Component
const BatchCard = memo(({ batch, onClick, formatDate, getDurationInWeeks }) => {
  const getStatusInfo = useCallback((batch) => {
    const now = new Date()
    const startDate = new Date(batch.start_date)
    const endDate = new Date(batch.end_date)

    if (now < startDate) return { status: "Upcoming", variant: "default", color: "blue" }
    if (now > endDate) return { status: "Completed", variant: "secondary", color: "gray" }
    return { status: "Active", variant: "default", color: "green" }
  }, [])

  const statusInfo = getStatusInfo(batch)

  return (
    <Card
      className="batch-card hardware-accelerated cursor-pointer border-2 border-slate-200/60 hover:border-blue-400/60 bg-white/95 backdrop-blur-xl shadow-lg"
      onClick={() => onClick(batch)}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <h3 className="font-black text-xl gradient-text">{batch.batch_code}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">
                  {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 rounded-full px-3 py-1">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold">{batch.student_count || 0} students</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1">
                <UserCheck className="h-4 w-4 text-purple-600" />
                <span className="font-semibold">{batch.lecturer_count || 0} lecturers</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 font-bold px-3 py-1"
            >
              <Clock className="h-3 w-3 mr-1" />
              {getDurationInWeeks(batch.start_date, batch.end_date)} weeks
            </Badge>
            <Badge
              variant={statusInfo.variant}
              className={cn(
                "font-bold px-3 py-1",
                statusInfo.color === "blue" &&
                  "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
                statusInfo.color === "green" &&
                  "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300",
                statusInfo.color === "gray" &&
                  "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300",
              )}
            >
              <Activity className="h-3 w-3 mr-1" />
              {statusInfo.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

BatchCard.displayName = "BatchCard"

const AnnualPlan = () => {
  const navigate = useNavigate()

  // Add performance CSS to document head
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = PERFORMANCE_CSS
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [showDetailsPopup, setShowDetailsPopup] = useState(false)
  const printRef = useRef(null)

  // Use CSS variables for sidebar state instead of React state
  const sidebarStateRef = useRef(localStorage.getItem("sidebarState") === "true")
  const sidebarListenerActive = useRef(false)

  // Month names for display
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Direct DOM manipulation for sidebar state - much faster than React state
  const updateSidebarState = useCallback((isCollapsed) => {
    sidebarStateRef.current = isCollapsed

    // Update CSS variables directly
    document.documentElement.style.setProperty("--sidebar-collapsed", isCollapsed ? "1" : "0")

    // Update main container padding
    const mainContainer = document.querySelector('[data-page="annual-plan"]')
    if (mainContainer) {
      mainContainer.style.paddingLeft = isCollapsed ? "0px" : "50px"
      mainContainer.style.transition = "padding-left 250ms cubic-bezier(0.4, 0, 0.2, 1)"
    }
  }, [])

  // Optimized sidebar event handling
  useEffect(() => {
    if (sidebarListenerActive.current) return
    sidebarListenerActive.current = true

    // Initial setup
    const isCollapsed = localStorage.getItem("sidebarState") === "true"
    updateSidebarState(isCollapsed)

    // Event handlers with direct DOM manipulation
    const handleSidebarToggle = (e) => {
      const isCollapsed = e.detail.isCollapsed
      updateSidebarState(isCollapsed)
    }

    // Use passive event listeners for better performance
    window.addEventListener("sidebarToggle", handleSidebarToggle, { passive: true })

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      sidebarListenerActive.current = false
    }
  }, [updateSidebarState])

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await authRequest("get", "http://localhost:5003/api/CourseRegistrationRoute")
        setCourses(coursesData)
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
        setError("Failed to load courses. Please try again later.")
      }
    }

    fetchCourses()
  }, [])

  // Fetch batches when course or year changes
  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await authRequest(
          "get",
          `http://localhost:5003/api/batches?course_id=${selectedCourse}&year=${selectedYear}`,
        )

        if (Array.isArray(response)) {
          if (
            response.length > 0 &&
            typeof response[0].student_count !== "undefined" &&
            typeof response[0].lecturer_count !== "undefined"
          ) {
            setBatches(response)
          } else {
            const batchesWithCounts = await Promise.all(
              response.map(async (batch) => {
                try {
                  const batchDetails = await authRequest("get", `http://localhost:5003/api/batches/${batch.id}`)
                  return {
                    ...batch,
                    student_count: batchDetails.student_count || 0,
                    lecturer_count: batchDetails.lecturer_count || 0,
                  }
                } catch {
                  return { ...batch, student_count: 0, lecturer_count: 0 }
                }
              }),
            )
            setBatches(batchesWithCounts)
          }
        } else {
          setBatches([])
        }
      } catch (err) {
        setError("Failed to load batches. Please try again.")
        setBatches([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedCourse && selectedYear) {
      fetchBatches()
    }
  }, [selectedCourse, selectedYear])

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

  const getDurationInWeeks = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return "N/A"

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.ceil(diffDays / 7)
  }, [])

  // Calculate batch position and width on the timeline
  const getBatchTimelineStyle = useCallback(
    (batch) => {
      if (!batch.start_date || !batch.end_date) return { display: "none" }

      const startDate = new Date(batch.start_date)
      const endDate = new Date(batch.end_date)

      if (
        startDate.getFullYear() !== Number.parseInt(selectedYear) &&
        endDate.getFullYear() !== Number.parseInt(selectedYear)
      ) {
        return { display: "none" }
      }

      const startMonth = startDate.getMonth()
      const endMonth = endDate.getMonth()

      const startDayPercent =
        startDate.getDate() / new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
      const endDayPercent = endDate.getDate() / new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()

      const startPercent = ((startMonth + startDayPercent) / 12) * 100
      const endPercent = ((endMonth + endDayPercent) / 12) * 100

      const adjustedStartPercent = Math.max(0, startPercent)
      const adjustedEndPercent = Math.min(100, endPercent)
      const width = adjustedEndPercent - adjustedStartPercent

      return {
        left: `${adjustedStartPercent}%`,
        width: `${width}%`,
      }
    },
    [selectedYear],
  )

  // Handle batch click to show details
  const handleBatchClick = useCallback((batch) => {
    setSelectedBatch(batch)
    setShowDetailsPopup(true)
  }, [])

  // Close batch details popup
  const closeDetailsPopup = useCallback(() => {
    setShowDetailsPopup(false)
    setTimeout(() => setSelectedBatch(null), 300)
  }, [])

  // Change year handlers
  const incrementYear = useCallback(() => setSelectedYear((year) => year + 1), [])
  const decrementYear = useCallback(() => setSelectedYear((year) => year - 1), [])

  // Print functionality - Navigate to print report page
  const handlePrint = useCallback(() => {
    const url = `/annual-plan-print-report?courseId=${selectedCourse}&year=${selectedYear}`
    window.open(url, "_blank")
  }, [selectedCourse, selectedYear])

  // Export data as CSV
  const handleExport = useCallback(() => {
    const headers = ["Batch", "Start Date", "End Date", "Duration", "Status", "Students", "Lecturers"]

    const data = batches.map((batch) => [
      batch.batch_code,
      formatDate(batch.start_date),
      formatDate(batch.end_date),
      `${getDurationInWeeks(batch.start_date, batch.end_date)} weeks`,
      batch.status || "Active",
      batch.student_count || 0,
      batch.lecturer_count || 0,
    ])

    const csvContent = [headers, ...data].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    const courseName = courses.find((c) => c.id.toString() === selectedCourse)?.courseName || "Course"
    link.href = url
    link.setAttribute("download", `${courseName}_AnnualPlan_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [batches, courses, selectedCourse, selectedYear, formatDate, getDurationInWeeks])

  // Memoized calculations
  const selectedCourseData = useMemo(
    () => courses.find((c) => c.id.toString() === selectedCourse),
    [courses, selectedCourse],
  )
  const totalStudents = useMemo(() => batches.reduce((sum, batch) => sum + (batch.student_count || 0), 0), [batches])
  const totalLecturers = useMemo(() => batches.reduce((sum, batch) => sum + (batch.lecturer_count || 0), 0), [batches])
  const activeBatches = useMemo(() => {
    const now = new Date()
    return batches.filter((batch) => {
      const startDate = new Date(batch.start_date)
      const endDate = new Date(batch.end_date)
      return now >= startDate && now <= endDate
    }).length
  }, [batches])

  const avgDuration = useMemo(() => {
    if (batches.length === 0) return 0
    const totalWeeks = batches.reduce((sum, batch) => sum + getDurationInWeeks(batch.start_date, batch.end_date), 0)
    return Math.round(totalWeeks / batches.length)
  }, [batches, getDurationInWeeks])

  if (loading && !batches.length && !selectedBatch) {
    return <LoadingScreen message="Loading annual plan data..." />
  }

  return (
    <div
      className="hardware-accelerated min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative"
      data-page="annual-plan"
    >
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

      <div className="relative z-10 p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text">Annual Training Plan</h1>
              <p className="text-slate-600 text-lg font-semibold mt-1">
                Comprehensive overview of training batches and schedules for the academic year
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Controls Card */}
        <Card className="animate-fade-in stagger-1 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black gradient-text flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Plan Configuration
                </CardTitle>
                <CardDescription className="text-base font-semibold text-slate-600">
                  Select course and year to view the training schedule
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-2 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2 border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Course Selection */}
              <div className="flex-1 space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wide">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-14 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg text-base font-semibold pt-7 pb-7">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {course.courseId} - {course.courseName}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">({course.stream})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selection */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase tracking-wide">Year</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrementYear}
                    className="h-14 w-14 p-0 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl min-w-[140px] justify-center shadow-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-black text-lg text-blue-700">{selectedYear}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementYear}
                    className="h-14 w-14 p-0 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl shadow-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="animate-fade-in border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 shadow-xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-6 w-6" />
                <p className="font-semibold text-lg">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && <LoadingScreen message="Loading annual plan..." />}

        {/* Main Content */}
        {!loading && (
          <div ref={printRef} className="space-y-8">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in stagger-2">
              <StatCard
                title="Total Batches"
                value={batches.length}
                icon={Calendar}
                color="blue"
                trend="+12% from last year"
                className="stagger-1"
              />
              <StatCard
                title="Total Students"
                value={totalStudents}
                icon={Users}
                color="green"
                trend="+8% enrollment"
                className="stagger-2"
              />
              <StatCard
                title="Active Batches"
                value={activeBatches}
                icon={Activity}
                color="purple"
                trend="Currently running"
                className="stagger-3"
              />
              <StatCard
                title="Avg Duration"
                value={`${avgDuration}w`}
                icon={Clock}
                color="orange"
                trend="Per batch"
                className="stagger-4"
              />
            </div>

            {/* Enhanced Course Info Card */}
            <Card className="animate-fade-in stagger-3 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                <CardTitle className="text-2xl font-black gradient-text flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  {selectedCourseData?.courseName || "Course"} - Annual Plan {selectedYear}
                </CardTitle>
                <CardDescription className="text-base font-semibold text-slate-600">
                  Overview of all training batches scheduled for the selected course and year
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                    <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-black uppercase tracking-wide">Total Lecturers</p>
                      <p className="text-3xl font-black gradient-text">{totalLecturers}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl shadow-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-black uppercase tracking-wide">Completion Rate</p>
                      <p className="text-3xl font-black gradient-text">94%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-2xl border-2 border-purple-200 shadow-lg">
                    <div className="p-3 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 rounded-xl shadow-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-black uppercase tracking-wide">Success Rate</p>
                      <p className="text-3xl font-black gradient-text">87%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Timeline Card */}
            <Card className="animate-fade-in stagger-4 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                <CardTitle className="text-2xl font-black gradient-text flex items-center gap-3">
                  <Calendar className="h-6 w-6" />
                  Training Timeline
                </CardTitle>
                <CardDescription className="text-base font-semibold text-slate-600">
                  Visual representation of batch schedules throughout the year
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {batches.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-6 bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 rounded-3xl inline-block mb-6 shadow-xl">
                      <Calendar className="mx-auto h-16 w-16 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-black gradient-text mb-3">No batches found</h3>
                    <p className="text-slate-600 font-semibold text-lg">
                      No training batches are scheduled for the selected course and year.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Month Headers */}
                    <div className="grid grid-cols-12 gap-2 mb-6">
                      {months.map((month) => (
                        <div
                          key={month}
                          className="text-center text-sm font-black text-slate-600 py-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200"
                        >
                          {month}
                        </div>
                      ))}
                    </div>

                    {/* Timeline Container */}
                    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-slate-200 shadow-inner">
                      {/* Grid Lines */}
                      <div className="absolute inset-6 grid grid-cols-12 gap-2">
                        {months.map((month, index) => (
                          <div key={month} className="border-r-2 border-slate-200/60 last:border-r-0" />
                        ))}
                      </div>

                      {/* Batch Items */}
                      <div className="relative space-y-4">
                        {batches.map((batch, index) => (
                          <TimelineBatch
                            key={batch.id}
                            batch={batch}
                            style={getBatchTimelineStyle(batch)}
                            onClick={handleBatchClick}
                            index={index}
                          />
                        ))}
                      </div>

                      {/* Adjust container height based on number of batches */}
                      <div style={{ height: `${Math.max(240, batches.length * 88)}px` }} />
                    </div>

                    {/* Enhanced Legend */}
                    <div className="flex flex-wrap items-center gap-6 pt-6 border-t-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-lg" />
                        <span className="text-sm text-slate-600 font-bold">Upcoming</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-lg shadow-lg" />
                        <span className="text-sm text-slate-600 font-bold">Active</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-slate-400 via-gray-400 to-zinc-400 rounded-lg shadow-lg" />
                        <span className="text-sm text-slate-600 font-bold">Completed</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Batch List Card */}
            {batches.length > 0 && (
              <Card className="animate-fade-in stagger-5 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                  <CardTitle className="text-2xl font-black gradient-text flex items-center gap-3">
                    <BookOpen className="h-6 w-6" />
                    Batch Details
                  </CardTitle>
                  <CardDescription className="text-base font-semibold text-slate-600">
                    Detailed information about each training batch
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    {batches.map((batch, index) => (
                      <div key={batch.id} className={`animate-fade-in stagger-${(index % 4) + 1}`}>
                        <BatchCard
                          batch={batch}
                          onClick={handleBatchClick}
                          formatDate={formatDate}
                          getDurationInWeeks={getDurationInWeeks}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Batch Details Popup */}
        {showDetailsPopup && selectedBatch && (
          <BatchDetailsPopup batchId={selectedBatch.id} onClose={closeDetailsPopup} />
        )}
      </div>
    </div>
  )
}

export default AnnualPlan
