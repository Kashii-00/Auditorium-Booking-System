"use client"

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  User,
  BookOpen,
  Calendar,
  CreditCard,
  Key,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Check,
  Clock,
  GraduationCap,
  TrendingUp,
  Award,
  Bell,
  DollarSign,
  Users,
  BarChart3,
  Menu,
  X,
  Home,
  Settings,
  HelpCircle,
  MessageSquare,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import StudentSidebar from "@/components/StudentSidebar"
import StudentNotifications from "@/components/StudentNotifications"
import LoadingScreen from "@/pages/LoadingScreen/LoadingScreen"

const API_URL = "http://localhost:5003/api"

// Lazy load heavy components
const LazyTabsContent = lazy(() => Promise.resolve({ default: TabsContent }))

// Responsive StatCard component
const StatCard = memo(({ stat, index, shouldAnimate }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: index * 0.05 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  return (
    <CardComponent {...cardVariants}>
      <Card className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-full`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">{stat.title}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
              {stat.change && (
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </p>
              )}
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
})

// Responsive CourseCard component
const CourseCard = memo(({ course, index, handleMakePayment, shouldAnimate }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const progressValue = useMemo(() => 
    course.fee > 0 ? Math.round((course.amountPaid / course.fee) * 100) : 0, 
    [course.fee, course.amountPaid]
  )

  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.05 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  return (
    <CardComponent
      {...cardVariants}
      className="p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors duration-150 cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-700 transition-colors duration-150 truncate">
            {course.courseName}
          </p>
          <p className="text-xs sm:text-sm text-slate-500">Payment: {course.paymentStatus}</p>
        </div>
        <Badge variant={course.primary ? "default" : "secondary"} className="shrink-0 text-xs">
          {course.primary ? "Primary" : "Secondary"}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium">{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="h-1.5 sm:h-2" />
      </div>
    </CardComponent>
  )
})

// Responsive QuickAction component
const QuickAction = memo(({ action, onClick, shouldAnimate }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  return (
    <CardComponent
      {...cardVariants}
      className={`p-3 sm:p-4 bg-gradient-to-r ${action.bgColor} rounded-lg border ${action.borderColor} cursor-pointer group transition-all duration-100`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm sm:text-base ${action.textColor} group-hover:${action.hoverColor} transition-colors duration-150 truncate`}>
            {action.title}
          </p>
          <p className={`text-xs sm:text-sm ${action.subTextColor} truncate`}>{action.subtitle}</p>
        </div>
        <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.iconColor} flex-shrink-0`} />
      </div>
    </CardComponent>
  )
})

// Enhanced BatchCard component matching the new design
const BatchCard = memo(({ batch, index, shouldAnimate, onClick, variant = "full" }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.05 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  // Calculate or set default values for the new design
  const enrolledStudents = batch.enrolledStudents || 0
  const maxStudents = batch.maxStudents || 30
  const courseProgress = batch.courseProgress || 5
  const completedModules = batch.completedModules || 1
  const totalModules = batch.totalModules || 20
  const remainingModules = totalModules - completedModules

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Get progress status text
  const getProgressStatus = (progress) => {
    if (progress <= 10) return 'Just Started'
    if (progress <= 25) return 'Getting Started'
    if (progress <= 50) return 'In Progress'
    if (progress <= 75) return 'Well Underway'
    if (progress < 100) return 'Almost Complete'
    return 'Completed'
  }

  // Get status badge styling
  const getStatusBadge = () => {
    if (batch.status === "Active" || batch.category === "active") {
      return {
        text: "Active Now",
        className: "bg-green-100 text-green-800 border-green-200"
      }
    }
    if (batch.category === "upcoming") {
      return {
        text: "Starting Soon", 
        className: "bg-blue-100 text-blue-800 border-blue-200"
      }
    }
    if (batch.category === "completed") {
      return {
        text: "Completed",
        className: "bg-slate-100 text-slate-700 border-slate-200"
      }
    }
    return {
      text: batch.status || "Inactive",
      className: "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  // Check if batch is completed
  const isCompleted = batch.category === "completed"

  // Get card colors based on status
  const getCardColors = () => {
    if (isCompleted) {
      return {
        duration: "bg-slate-50 border-slate-100",
        durationIcon: "bg-slate-400",
        students: "bg-slate-50 border-slate-100", 
        studentsIcon: "bg-slate-400",
        progress: "bg-slate-50 border-slate-100",
        progressIcon: "bg-slate-400"
      }
    }
    return {
      duration: "bg-blue-50 border-blue-100",
      durationIcon: "bg-blue-500",
      students: "bg-purple-50 border-purple-100",
      studentsIcon: "bg-purple-500", 
      progress: "bg-green-50 border-green-100",
      progressIcon: "bg-green-500"
    }
  }

  const cardColors = getCardColors()

  const statusBadge = getStatusBadge()

  return (
    <CardComponent
      {...cardVariants}
        className="w-full max-w-none bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
        onClick={() => onClick && onClick(batch)}
      >
      {/* Header with batch name and status */}
      <div className={`${variant === "simple" ? "p-3 sm:p-4" : "p-4 sm:p-5"} pb-3`}>
        <div className={`flex items-start justify-between ${variant === "simple" ? "mb-2" : "mb-3"}`}>
          <h3 className={`${variant === "simple" ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-bold text-gray-900 group-hover:text-blue-600 transition-colors`}>
            {batch.batchName}
          </h3>
        <Badge
            variant="outline" 
            className={`px-2 py-0.5 text-xs font-medium ${statusBadge.className} flex-shrink-0`}
        >
            {statusBadge.text}
        </Badge>
      </div>
        <p className={`text-gray-600 ${variant === "simple" ? "text-xs sm:text-sm mb-3" : "text-sm sm:text-base mb-4 sm:mb-5"}`}>{batch.courseName}</p>

        {/* Show simplified version for dashboard, full version for batch page */}
        {variant === "simple" ? (
          /* Simple version - only progress bar and duration */
          <div>
            {/* Duration as text */}
            <div className="mb-2">
              <p className="text-xs text-gray-600">
                {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
              </p>
          </div>

            {/* Course Progress Section - only show for non-completed batches */}
            {!isCompleted && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Course Progress</h4>
                  <span className="text-xl font-bold text-blue-600">{courseProgress}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${courseProgress}%` }}
                    ></div>
                  </div>
                </div>
        </div>
      )}
          </div>
        ) : (
          /* Full version with all cards */
          <>
            {/* Three info cards */}
            <div className={`grid gap-3 sm:gap-4 ${isCompleted ? 'grid-cols-1 sm:grid-cols-2 mb-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-5'}`}>
              {/* Duration Card */}
              <div className={`${cardColors.duration} rounded-lg p-3 sm:p-4 border`}>
                <div className="flex items-center mb-2">
                  <div className={`w-6 sm:w-8 h-6 sm:h-8 ${cardColors.durationIcon} rounded-lg flex items-center justify-center`}>
                    <Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Duration</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                  {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                </p>
              </div>

              {/* Enrolled Students Card */}
              <div className={`${cardColors.students} rounded-lg p-3 sm:p-4 border`}>
                <div className="flex items-center mb-2">
                  <div className={`w-6 sm:w-8 h-6 sm:h-8 ${cardColors.studentsIcon} rounded-lg flex items-center justify-center`}>
                    <Users className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Enrolled Students</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  {enrolledStudents} / {maxStudents}
                </p>
              </div>

              {/* Progress Card - only show for non-completed batches */}
              {!isCompleted && (
                <div className={`${cardColors.progress} rounded-lg p-3 sm:p-4 border sm:col-span-2 lg:col-span-1`}>
                  <div className="flex items-center mb-2">
                    <div className={`w-6 sm:w-8 h-6 sm:h-8 ${cardColors.progressIcon} rounded-lg flex items-center justify-center`}>
                      <BarChart3 className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Progress</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {getProgressStatus(courseProgress)}
                  </p>
                </div>
              )}
            </div>

            {/* Course Progress Section - only show for non-completed batches */}
            {!isCompleted && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Course Progress</h4>
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">{courseProgress}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="mb-3 sm:mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${courseProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Module completion info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-600">
                  <span>{completedModules} of {totalModules} modules completed</span>
                  <span>{remainingModules} modules remaining</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CardComponent>
  )
})

const StudentDashboard = () => {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const [batchFilter, setBatchFilter] = useState("all")
  const navigate = useNavigate()
  const location = useLocation()
  const fetchTimeoutRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // Responsive breakpoint detection
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false
  })

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setScreenSize({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024 && width < 1536,
        isLargeDesktop: width >= 1536
      })
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Optimized animation variants - reduced motion support
  const containerVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    }
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.4,
          staggerChildren: 0.05,
        },
      },
    }
  }, [prefersReducedMotion])

  const itemVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    }
    return {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      },
    }
  }, [prefersReducedMotion])

  const shouldAnimate = !prefersReducedMotion

  const handleLogout = useCallback(() => {
    localStorage.removeItem("studentToken")
    localStorage.removeItem("studentRefreshToken")
    localStorage.removeItem("studentUser")
    navigate("/student-login")
  }, [navigate])

  const handleChangePassword = useCallback(() => {
    navigate("/student-change-password")
  }, [navigate])

  const handleMakePayment = useCallback((courseId, batchId) => {
    navigate("/student-payment", {
      state: { courseId, batchId },
    })
  }, [navigate])

  const handleBatchClick = useCallback((batch) => {
    navigate(`/student-batch-detail/${batch.id}`)
  }, [navigate])

  const getInitials = useCallback((name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [])

  // Memoized payment calculations for performance
  const paymentMetrics = useMemo(() => {
    if (!student?.courses) {
      return { totalPaid: 0, totalPending: 0, totalFees: 0, paymentProgress: 0 }
    }

    const totalPaid = student.courses.reduce((sum, course) => sum + (course.amountPaid || 0), 0)
    const totalPending = student.courses.reduce((sum, course) => sum + (course.remainingFee || 0), 0)
    const totalFees = student.courses.reduce((sum, course) => sum + (course.fee || 0), 0)
    const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0

    return { totalPaid, totalPending, totalFees, paymentProgress }
  }, [student?.courses])

  // Memoized filtered data for performance
  const courseData = useMemo(() => {
    if (!student?.courses) return { activeCourses: 0, recentCourses: [] }
    
    const activeCourses = student.courses.filter((c) => c.status === "Active").length
    const recentCourses = student.courses.slice(0, 3)
    
    return { activeCourses, recentCourses }
  }, [student?.courses])

  const batchData = useMemo(() => {
    if (!student?.batches) return { activeBatches: 0, completedBatches: 0, recentBatches: [], filteredBatches: [] }
    
    const activeBatches = student.batches.filter((b) => b.category === "active").length
    const completedBatches = student.batches.filter((b) => b.category === "completed").length
    const recentBatches = student.batches.slice(0, 3)
    
    // Apply filter for dashboard
    let filteredBatches = student.batches
    if (batchFilter === "active") {
      filteredBatches = student.batches.filter((b) => b.category === "active")
    } else if (batchFilter === "completed") {
      filteredBatches = student.batches.filter((b) => b.category === "completed")
    } else if (batchFilter === "upcoming") {
      filteredBatches = student.batches.filter((b) => b.category === "upcoming")
    }
    
    return { activeBatches, completedBatches, recentBatches, filteredBatches }
  }, [student?.batches, batchFilter])

  // Memoized quick actions data
  const quickActions = useMemo(() => [
    {
      title: "View Payments",
      subtitle: "Check status",
      bgColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      hoverColor: "text-blue-900",
      subTextColor: "text-blue-600",
      iconColor: "text-blue-600",
      icon: CreditCard,
      action: () => setActiveTab("payments")
    },
    {
      title: "Change Password",
      subtitle: "Update security",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      hoverColor: "text-green-900",
      subTextColor: "text-green-600",
      iconColor: "text-green-600",
      icon: Key,
      action: handleChangePassword
    },
    {
      title: "View Courses",
      subtitle: "Manage courses",
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      hoverColor: "text-purple-900",
      subTextColor: "text-purple-600",
      iconColor: "text-purple-600",
      icon: BookOpen,
      action: () => setActiveTab("courses")
    }
  ], [handleChangePassword, setActiveTab])

  // Optimized fetch with debouncing and cleanup
  const fetchStudentData = useCallback(async () => {
    try {
      const token = localStorage.getItem("studentToken")
      if (!token) {
        navigate("/student-login")
        return
      }

      const response = await axios.get(`${API_URL}/student-auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const studentData = {
        ...response.data,
        courses: response.data.courses || [],
        batches: response.data.batches || [],
        recentPayments: response.data.recentPayments || [],
      }
      
      setStudent(studentData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("Failed to load your profile. Please try again later.")
      setLoading(false)
    }
  }, [navigate])

  // Handle navigation state for tab switching
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
      // Clear the state to prevent unwanted tab switches on future navigations
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    
    // Debounce the fetch to prevent rapid calls
    fetchTimeoutRef.current = setTimeout(() => {
      fetchStudentData()
    }, 100)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [fetchStudentData])

  // Loading state
  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." type="users" />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <AlertTriangle className="text-red-500 w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button
              onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
          </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-slate-700 mb-4">No student data found. Please log in again.</p>
            <Button
              onClick={() => navigate("/student-login")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Go to Login
            </Button>
          </CardContent>
        </Card>
        </div>
    )
  }

  // Destructure payment metrics after all conditional returns
  const { totalPaid, totalPending, totalFees, paymentProgress } = paymentMetrics

  const MainComponent = shouldAnimate ? motion.div : 'div'
  const headerMotionProps = shouldAnimate ? { variants: itemVariants } : {}
  const mainContentProps = shouldAnimate ? {
    initial: "hidden",
    animate: "visible",
    variants: containerVariants
  } : {}

  return (
    <MainComponent
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden"
      {...mainContentProps}
    >
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      {/* Enhanced Responsive Header */}
      <motion.header className="fixed top-0 left-0 right-0 z-50" {...headerMotionProps}>
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5"></div>
          {/* Noise texture overlay for premium feel */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          </div>

        {/* Content Layer */}
        <div className="relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Left Section - Logo and Title */}
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Toggle */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-white/20"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-6 border-b">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>
                        Access your student portal features
                      </SheetDescription>
                    </SheetHeader>
                    <nav className="p-4 space-y-2">
                      {[
                        { id: "overview", label: "Overview", icon: Home },
                        { id: "courses", label: "My Courses", icon: BookOpen },
                        { id: "batches", label: "My Batches", icon: Calendar },
                        { id: "payments", label: "Payments", icon: CreditCard },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={`w-full justify-start ${
                            activeTab === item.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700"
                          }`}
                          onClick={() => {
                            setActiveTab(item.id)
                            setMobileMenuOpen(false)
                          }}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      ))}
                      <Separator className="my-4" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-700"
                        onClick={() => {
                          navigate("/student-profile")
                          setMobileMenuOpen(false)
                        }}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-700"
                        onClick={() => {
                          navigate("/student-preferences")
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Preferences
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-700"
                        onClick={() => {
                          handleChangePassword()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <Key className="w-4 h-4 mr-3" />
                    Change Password
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
            </nav>
                  </SheetContent>
                </Sheet>

                {/* Logo and Title */}
                <motion.div
                  className="flex items-center space-x-2 sm:space-x-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="relative ml-[-78px]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                      <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                  </div>
                    <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400/40 to-indigo-500/40 rounded-xl blur-md -z-10"></div>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm">
                      <span className="hidden sm:inline">Student Portal</span>
                      <span className="sm:hidden">MPMA</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600/80 font-medium ">
                      Welcome back, {student.full_name.split(" ")[0]}
                    </p>
                  </div>
                </motion.div>
                  </div>

              {/* Right Section - User Menu and Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 mr-[-80px]">
                {/* Notifications */}
                <StudentNotifications />

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      className="flex items-center space-x-2 sm:space-x-3 bg-white/40 backdrop-blur-xl rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg border border-white/30 cursor-pointer hover:bg-white/50 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-white/50 shadow-md ">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left ">
                        <p className="font-semibold text-slate-800/90 text-sm sm:text-base drop-shadow-sm truncate max-w-[120px] lg:max-w-[200px]">
                          {student.full_name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600/80 truncate max-w-[120px] lg:max-w-[200px]">
                          {student.email}
                    </p>
                  </div>
                      <ChevronDown className="w-4 h-4 text-slate-600 hidden sm:block" />
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate("/student-profile")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                  </div>
                </div>
              </div>
        </div>
      </motion.header>

      {/* Enhanced Scroll Progress Indicator */}
      <motion.div
        className="fixed top-16 sm:top-20 left-0 right-0 h-0.5 z-40 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent backdrop-blur-sm"></div>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 origin-left shadow-lg"
          style={{
            scaleX: 0,
          }}
          initial={{ scaleX: 0 }}
        />
      </motion.div>

      {/* Student Sidebar - Hidden on Mobile */}
      <div className="hidden lg:block">
        <StudentSidebar
          student={student}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />
                  </div>

      {/* Main Content with Responsive Layout */}
      <div className={`transition-all duration-300 ${
        sidebarOpen && !screenSize.isMobile && !screenSize.isTablet ? 'lg:pl-80' : 'lg:pl-20'
      }`}>
        <div className="min-h-screen pt-20 sm:pt-24 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-none">
            <motion.div variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Mobile Tab Navigation */}
                <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto">
                  <TabsList className="inline-flex w-auto min-w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="courses" className="flex-1">Courses</TabsTrigger>
                    <TabsTrigger value="batches" className="flex-1">Batches</TabsTrigger>
                    <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
                  </TabsList>
                          </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 sm:space-y-8">
                  {/* Quick Stats - Responsive Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {[
                      {
                        title: "Active Courses",
                        value: courseData.activeCourses,
                        icon: BookOpen,
                        color: "from-blue-500 to-blue-600",
                        bgColor: "bg-blue-50",
                        change: "+2 this month"
                      },
                      {
                        title: "Current Batches",
                        value: batchData.activeBatches,
                        icon: Users,
                        color: "from-green-500 to-green-600",
                        bgColor: "bg-green-50",
                        change: "1 upcoming"
                      },
                      {
                        title: "Payment Progress",
                        value: `${Math.round(paymentProgress)}%`,
                        icon: TrendingUp,
                        color: "from-purple-500 to-purple-600",
                        bgColor: "bg-purple-50",
                        change: "On track"
                      },
                      {
                        title: "Achievements",
                        value: batchData.completedBatches,
                        icon: Award,
                        color: "from-amber-500 to-amber-600",
                        bgColor: "bg-amber-50",
                        change: "Well done!"
                      },
                    ].map((stat, index) => (
                      <StatCard 
                        key={stat.title}
                        stat={stat} 
                        index={index} 
                        shouldAnimate={shouldAnimate}
                      />
                    ))}
                          </div>

                  {/* Quick Overview Cards - Responsive Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Recent Courses */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-600" />
                            My Courses
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("courses")}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          >
                            View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {courseData.recentCourses.length > 0 ? (
                            <div className="space-y-4 sm:space-y-6">
                              {courseData.recentCourses.map((course, index) => (
                                <CourseCard 
                                  key={course.id}
                                  course={course} 
                                  index={index} 
                                  handleMakePayment={handleMakePayment}
                                  shouldAnimate={shouldAnimate}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 sm:py-12">
                              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-500 text-base sm:text-lg">No courses enrolled</p>
                              <p className="text-slate-400 text-sm sm:text-base mt-1">Contact administration to enroll</p>
                </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Recent Batches */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-green-600" />
                            My Batches
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("batches")}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs sm:text-sm"
                          >
                            View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {/* Filter navbar */}
                          <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                            {[
                              { id: "all", label: "All" },
                              { id: "active", label: "Current" },
                              { id: "completed", label: "Completed" },
                              { id: "upcoming", label: "Upcoming" }
                            ].map((filter) => (
                              <button
                                key={filter.id}
                                onClick={() => setBatchFilter(filter.id)}
                                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors duration-200 ${
                                  batchFilter === filter.id
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                        </CardContent>
                        <CardContent className="pt-0">
                          {batchData.filteredBatches.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                              {batchData.filteredBatches.map((batch, index) => (
                                <BatchCard 
                                  key={batch.id}
                                  batch={batch} 
                                  index={index}
                                  shouldAnimate={shouldAnimate}
                                  onClick={() => handleBatchClick(batch)}
                                  variant="simple"
                                />
                              ))}
                  </div>
                          ) : (
                            <div className="text-center py-8 sm:py-12">
                              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-base sm:text-lg">
                              {batchFilter === "all" 
                                ? "No batches assigned" 
                                : `No ${batchFilter} batches found`}
                            </p>
                            <p className="text-slate-400 text-sm sm:text-base mt-1">
                              {batchFilter === "all" 
                                ? "You'll be assigned when courses start" 
                                : "Try selecting a different filter"}
                            </p>
                          </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Quick Actions & Notifications */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-purple-600" />
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                          {quickActions.map((action, index) => (
                            <QuickAction
                              key={action.title}
                              action={action}
                              onClick={action.action}
                              shouldAnimate={shouldAnimate}
                            />
                          ))}

                          {/* Notification Alert */}
                          {totalPending > 0 && (
                            <Alert className="border-amber-200 bg-amber-50">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <AlertDescription className="text-amber-800">
                                You have ${totalPending.toFixed(2)} in pending payments.
                                <Button
                                  variant="link"
                                  className="p-0 h-auto ml-2 text-amber-700 hover:text-amber-800 font-semibold text-xs sm:text-sm"
                                  onClick={() => setActiveTab("payments")}
                                >
                                  Pay Now →
                                </Button>
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
              </div>

                  {/* Payment Overview - Responsive */}
                  <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                    <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-600" />
                          Payment Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                          <div className="text-center p-4 sm:p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                            <p className="text-xs sm:text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Total Paid</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                </div>
                          <div className="text-center p-4 sm:p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                            <p className="text-xs sm:text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Pending</p>
                            <p className="text-2xl sm:text-3xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
                  </div>
                          <div className="text-center p-4 sm:p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                            <p className="text-xs sm:text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Total Fees</p>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800">${totalFees.toFixed(2)}</p>
              </div>
            </div>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-600 font-medium">Payment Progress</span>
                            <span className="font-bold text-base sm:text-lg">{Math.round(paymentProgress)}%</span>
                          </div>
                          <Progress value={paymentProgress} className="h-2 sm:h-3" />
                        </div>
                        {totalPending > 0 && (
                          <Alert className="mt-4 sm:mt-6 border-amber-200 bg-amber-50">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              You have ${totalPending.toFixed(2)} in pending payments.
                              <Button
                                variant="link"
                                className="p-0 h-auto ml-2 text-amber-700 hover:text-amber-800 font-semibold text-xs sm:text-sm"
                                onClick={() => setActiveTab("payments")}
                              >
                                Make Payment →
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

          {/* Courses Tab */}
                <TabsContent value="courses">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                          My Courses
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Manage your enrolled courses and track your progress</CardDescription>
                      </CardHeader>
                      <CardContent>
              {student.courses && student.courses.length > 0 ? (
                          <div className="space-y-6 sm:space-y-8">
                            {student.courses.map((course, index) => (
                              <motion.div
                                key={course.id || `course-${index}`}
                                className="border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 bg-white"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                              >
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                        <div>
                                    <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">
                                      {course.courseName || course.course_name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                      <span>Course ID: {course.courseId || course.id || "N/A"}</span>
                                      {course.stream && <span>• Stream: {course.stream}</span>}
                                      <span>
                                        • Enrolled:{" "}
                                        {course.enrollmentDate
                                          ? new Date(course.enrollmentDate).toLocaleDateString()
                                          : "N/A"}
                        </span>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={course.primary_course || course.primary ? "default" : "secondary"}
                                    className="mt-2 lg:mt-0"
                                  >
                                    {course.primary_course || course.primary ? "Primary Course" : "Secondary Course"}
                                  </Badge>
                      </div>
                      
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Course Fee</p>
                                    <p className="text-2xl font-bold text-blue-800">${course.fee.toFixed(2)}</p>
                        </div>
                                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                                    <p className="text-2xl font-bold text-green-800">${course.amountPaid.toFixed(2)}</p>
                        </div>
                                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg">
                                    <p className="text-sm text-amber-600 font-medium">Remaining</p>
                                    <p className="text-2xl font-bold text-amber-800">${course.remainingFee.toFixed(2)}</p>
                        </div>
                      </div>
                      
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant={course.status === "Active" ? "default" : "secondary"}>
                            {course.status}
                                    </Badge>
                                    <Badge
                                      variant={
                                        course.paymentStatus === "PAID"
                                          ? "default"
                                          : course.paymentStatus === "PARTIAL"
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {course.paymentStatus === "PAID"
                                        ? "Paid"
                                        : course.paymentStatus === "PARTIAL"
                                          ? "Partially Paid"
                                          : "Unpaid"}
                                    </Badge>
                        </div>
                        
                        {course.remainingFee > 0 && (
                                    <Button
                            onClick={() => handleMakePayment(course.id)}
                                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                                      <CreditCard className="w-4 h-4 mr-2" />
                            Make Payment
                                    </Button>
                        )}
                      </div>

                                <div className="mt-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600">Payment Progress</span>
                                    <span className="font-medium">
                                      {course.fee > 0 ? Math.round((course.amountPaid / course.fee) * 100) : 0}%
                                    </span>
                    </div>
                                  <Progress
                                    value={course.fee > 0 ? (course.amountPaid / course.fee) * 100 : 0}
                                    className="h-2"
                                  />
                                </div>
                              </motion.div>
                  ))}
                </div>
              ) : (
                          <div className="text-center py-16">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-slate-500 text-lg">You are not enrolled in any courses yet.</p>
                </div>
              )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

          {/* Batches Tab */}
                <TabsContent value="batches">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                          My Batches
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">View your batch assignments and attendance records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Filter navbar */}
                        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                          {[
                            { id: "all", label: "All" },
                            { id: "active", label: "Current" },
                            { id: "completed", label: "Completed" },
                            { id: "upcoming", label: "Upcoming" }
                          ].map((filter) => (
                            <button
                              key={filter.id}
                              onClick={() => setBatchFilter(filter.id)}
                              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                                batchFilter === filter.id
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                                            <CardContent className="pt-0">
              {(batchFilter === "all" && student.batches && student.batches.length > 0) || 
               (batchFilter !== "all" && batchData.filteredBatches.length > 0) ? (
                <div className="space-y-6 sm:space-y-8">
                            <AnimatePresence>
                              {batchFilter === "all" && (
                                <>
                              {/* Upcoming Batches */}
                              {student.batches.filter((batch) => batch.category === "upcoming").length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                >
                      <h3 className="font-bold text-lg text-blue-700 mb-4 flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                        Upcoming Batches
                      </h3>
                                            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                        {student.batches
                                      .filter((batch) => batch.category === "upcoming")
                                      .map((batch, index) => (
                                            <BatchCard 
                                          key={batch.id}
                                              batch={batch} 
                                              index={index}
                                              shouldAnimate={shouldAnimate}
                                              onClick={() => handleBatchClick(batch)}
                                            />
                          ))}
                      </div>
                                </motion.div>
                              )}

                              {/* Active Batches */}
                              {student.batches.filter((batch) => batch.category === "active").length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                >
                      <h3 className="font-bold text-lg text-green-700 mb-4 flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                        Current Active Batches
                      </h3>
                                            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                        {student.batches
                                      .filter((batch) => batch.category === "active")
                                      .map((batch, index) => (
                                            <BatchCard 
                                          key={batch.id}
                                              batch={batch} 
                                              index={index}
                                              shouldAnimate={shouldAnimate}
                                              onClick={() => handleBatchClick(batch)}
                                            />
                          ))}
                      </div>
                                </motion.div>
                              )}

                              {/* Completed Batches */}
                              {student.batches.filter((batch) => batch.category === "completed").length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                >
                                  <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center">
                                    <Award className="w-5 h-5 mr-2" />
                                    Completed Batches
                      </h3>
                                            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                        {student.batches
                                      .filter((batch) => batch.category === "completed")
                                      .map((batch, index) => (
                                            <BatchCard 
                                          key={batch.id}
                                              batch={batch} 
                                              index={index}
                                              shouldAnimate={shouldAnimate}
                                              onClick={() => handleBatchClick(batch)}
                                            />
                              ))}
                              </div>
                                        </motion.div>
                      )}
                                </>
                              )}

                              {/* Filtered Batches */}
                              {batchFilter !== "all" && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                >
                                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                                    {batchData.filteredBatches.map((batch, index) => (
                                      <BatchCard 
                                        key={batch.id}
                                        batch={batch} 
                                        index={index}
                                        shouldAnimate={shouldAnimate}
                                        onClick={() => handleBatchClick(batch)}
                                      />
                          ))}
                      </div>
                                </motion.div>
                  )}
                            </AnimatePresence>
                </div>
              ) : (
                          <div className="text-center py-16">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-slate-500 text-lg">
                              {batchFilter === "all" 
                                ? "You are not assigned to any batches yet." 
                                : `No ${batchFilter} batches found.`}
                            </p>
                </div>
              )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

          {/* Payments Tab */}
                <TabsContent value="payments">
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Payment Summary */}
                    <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                          Payment Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {[
                            {
                              title: "Total Paid",
                              amount: totalPaid,
                              color: "from-green-500 to-emerald-600",
                              bgColor: "bg-green-50",
                              icon: Check,
                            },
                            {
                              title: "Pending Payments",
                              amount: totalPending,
                              color: "from-amber-500 to-orange-600",
                              bgColor: "bg-amber-50",
                              icon: Clock,
                            },
                            {
                              title: "Total Course Fees",
                              amount: totalFees,
                              color: "from-blue-500 to-indigo-600",
                              bgColor: "bg-blue-50",
                              icon: DollarSign,
                            },
                          ].map((item, index) => (
                            <motion.div
                              key={item.title}
                              className={`${item.bgColor} rounded-xl p-6 shadow-lg`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-slate-600 mb-1">{item.title}</p>
                                  <p className="text-3xl font-bold text-slate-800">${item.amount.toFixed(2)}</p>
                  </div>
                                <div
                                  className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center`}
                                >
                                  <item.icon className="w-6 h-6 text-white" />
                  </div>
                  </div>
                            </motion.div>
                          ))}
                </div>
                
                        <div className="bg-white/60 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">Overall Payment Progress</span>
                            <span className="text-sm font-bold text-slate-800">{Math.round(paymentProgress)}%</span>
                          </div>
                          <Progress value={paymentProgress} className="h-3" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pending Payments */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                          Pending Payments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {student.courses.filter((c) => c.remainingFee > 0).length > 0 ? (
                  <div className="space-y-4">
                            {student.courses
                              .filter((c) => c.remainingFee > 0)
                              .map((course, index) => (
                                <motion.div
                                  key={course.id}
                                  className="border border-amber-200 bg-amber-50 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="mb-4 sm:mb-0">
                                      <p className="font-bold text-lg text-slate-800 mb-1">{course.courseName}</p>
                                      <p className="text-sm text-slate-600">
                              Paid: ${course.amountPaid.toFixed(2)} of ${course.fee.toFixed(2)}
                            </p>
                                      <div className="mt-2">
                                        <Progress
                                          value={course.fee > 0 ? (course.amountPaid / course.fee) * 100 : 0}
                                          className="h-2 w-48"
                                        />
                          </div>
                          </div>
                                    <div className="text-right sm:text-left w-full sm:w-auto">
                                      <p className="text-sm text-slate-500 mb-1">Amount Due</p>
                                      <p className="font-bold text-2xl text-red-600 mb-3">
                                        ${course.remainingFee.toFixed(2)}
                                      </p>
                                      <Button
                            onClick={() => handleMakePayment(course.id)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                                        <CreditCard className="w-4 h-4 mr-2" />
                            Pay Now
                                      </Button>
                        </div>
                      </div>
                                </motion.div>
                    ))}
                  </div>
                ) : (
                          <motion.div
                            className="text-center py-12 bg-green-50 rounded-lg"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-medium text-green-800">All payments completed!</p>
                            <p className="text-green-600">No pending payments. All course fees are paid.</p>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                          Payment History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                {student.recentPayments && student.recentPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Date</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Amount</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Method</th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                        </tr>
                      </thead>
                              <tbody className="divide-y divide-slate-200">
                                {student.recentPayments.map((payment, index) => (
                                  <motion.tr
                                    key={payment.id}
                                    className="hover:bg-slate-50 transition-colors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <td className="px-4 py-4 text-sm text-slate-900">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                              ${payment.amount.toFixed(2)}
                            </td>
                                    <td className="px-4 py-4 text-sm text-slate-500">{payment.method}</td>
                                    <td className="px-4 py-4">
                                      <Badge
                                        variant={
                                          payment.status === "COMPLETED"
                                            ? "default"
                                            : payment.status === "PENDING"
                                              ? "secondary"
                                              : "destructive"
                                        }
                                        className="flex items-center w-fit"
                                      >
                                        {payment.status === "COMPLETED" && <Check className="w-3 h-3 mr-1" />}
                                        {payment.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                                        {payment.status === "FAILED" && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {payment.status}
                                      </Badge>
                            </td>
                                  </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                          <div className="text-center py-16">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                            >
                              <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-slate-500 text-lg">No payment history available.</p>
                  </div>
                )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
              </div>
            </div>
        </div>
    </MainComponent>
  )
}

export default StudentDashboard
