"use client"

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from "react"
import { useNavigate } from "react-router-dom"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import StudentSidebar from "@/components/StudentSidebar"
import LoadingScreen from "@/pages/LoadingScreen/LoadingScreen"

const API_URL = "http://localhost:5003/api"

// Lazy load heavy components
const LazyTabsContent = lazy(() => Promise.resolve({ default: TabsContent }))

// Optimized StatCard component with reduced animations
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
      <Card className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow duration-200`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{stat.title}</p>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
})

// Optimized CourseCard component
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
      className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors duration-150 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-150">
            {course.courseName}
          </p>
          <p className="text-sm text-slate-500">Payment: {course.paymentStatus}</p>
        </div>
        <Badge variant={course.primary ? "default" : "secondary"} className="shrink-0">
          {course.primary ? "Primary" : "Secondary"}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium">{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </CardComponent>
  )
})

// Optimized QuickAction component
const QuickAction = memo(({ action, onClick, shouldAnimate }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    whileHover: { scale: 1.02 },
    transition: { duration: 0.1 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  return (
    <CardComponent
      {...cardVariants}
      className={`p-4 bg-gradient-to-r ${action.bgColor} rounded-lg border ${action.borderColor} cursor-pointer group transition-transform duration-100`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${action.textColor} group-hover:${action.hoverColor} transition-colors duration-150`}>
            {action.title}
          </p>
          <p className={`text-sm ${action.subTextColor}`}>{action.subtitle}</p>
        </div>
        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
      </div>
    </CardComponent>
  )
})

// Optimized BatchCard component
const BatchCard = memo(({ batch, index, shouldAnimate }) => {
  const prefersReducedMotion = useReducedMotion()
  
  const cardVariants = shouldAnimate && !prefersReducedMotion ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.05 }
  } : {}

  const CardComponent = shouldAnimate && !prefersReducedMotion ? motion.div : 'div'

  return (
    <CardComponent
      {...cardVariants}
      className="p-4 border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-colors duration-150 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors duration-150">
            {batch.batchName}
          </p>
          <p className="text-sm text-slate-500">{batch.courseName}</p>
        </div>
        <Badge
          variant={
            batch.status === "Active"
              ? "default"
              : batch.category === "upcoming"
                ? "secondary"
                : "outline"
          }
          className="shrink-0"
        >
          {batch.status}
        </Badge>
      </div>
      {batch.attendancePercentage && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Attendance</span>
            <span className="font-medium">{batch.attendancePercentage}%</span>
          </div>
          <Progress value={batch.attendancePercentage} className="h-2" />
        </div>
      )}
    </CardComponent>
  )
})

const StudentDashboard = () => {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const fetchTimeoutRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

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
    if (!student?.batches) return { activeBatches: 0, completedBatches: 0, recentBatches: [] }
    
    const activeBatches = student.batches.filter((b) => b.category === "active").length
    const completedBatches = student.batches.filter((b) => b.category === "completed").length
    const recentBatches = student.batches.slice(0, 3)
    
    return { activeBatches, completedBatches, recentBatches }
  }, [student?.batches])

  // Memoized quick actions data
  const quickActions = useMemo(() => [
    {
      title: "View Payments",
      subtitle: "Check payment status",
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
      subtitle: "Update your password",
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
      subtitle: "Manage your courses",
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
      {/* Enhanced Glassy Header */}
      <motion.header className="fixed top-0 left-0 right-0 z-50" {...headerMotionProps}>
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5"></div>
          {/* Noise texture overlay for premium feel */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
            </div>

        {/* Content Layer */}
        <div className="relative container mx-auto px-6 py-4">
          <div className="flex justify-between items-center ml-[-75px]">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                  <GraduationCap className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
                {/* Glow effect */}
                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-400/40 to-indigo-500/40 rounded-xl blur-md -z-10"></div>
        </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm ">
                  Student Portal MPMA
                </h1>
                <p className="text-sm text-slate-600/80 font-medium">Welcome back, {student.full_name.split(" ")[0]}</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3 mr-[-80px]">
              <motion.div
                className="hidden md:flex items-center space-x-3 bg-white/40 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-lg border border-white/30"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative" >
                  <Avatar className="w-8 h-8 ring-2 ring-white/50 shadow-md">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white text-sm font-semibold backdrop-blur-sm">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Avatar glow */}
                  <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-sm -z-10"></div>
              </div>
                <div className="text">
                  <p className="font-semibold text-slate-800/90 text-sm drop-shadow-sm">{student.full_name}</p>
                  <p className="text-xs text-slate-600/80">{student.email}</p>
            </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative bg-white/30 backdrop-blur-xl hover:bg-white/40 rounded-2xl border border-white/30 shadow-lg transition-all duration-300"
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                  {/* Button glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="bg-white/30 backdrop-blur-xl hover:bg-red-500/20 hover:text-red-600 transition-all duration-300 rounded-2xl border border-white/30 shadow-lg group"
                >
                  <LogOut className="w-5 h-5 transition-colors duration-300" />
                  {/* Logout button glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>
          </div>
        </div>
        </div>
      </motion.header>

        {/* Enhanced Scroll Progress Indicator */}
        <motion.div
          className="fixed top-[73px] left-0 right-0 h-0.5 z-40 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent backdrop-blur-sm"></div>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 origin-left shadow-lg"
            style={{
              scaleX:
                typeof window !== "undefined"
                  ? window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)
                  : 0,
            }}
            initial={{ scaleX: 0 }}
          />
          {/* Progress glow */}
          <motion.div
            className="absolute top-0 h-full bg-gradient-to-r from-blue-400/50 via-indigo-500/50 to-purple-500/50 origin-left blur-sm"
            style={{
              scaleX:
                typeof window !== "undefined"
                  ? window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)
                  : 0,
            }}
          />
        </motion.div>

        {/* Student Sidebar */}
        <StudentSidebar
          student={student}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onChangePassword={handleChangePassword}
          onSidebarToggle={setSidebarOpen}
        />

        {/* Main Content */}
        <div className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'
        }`}>
          <div className="min-h-screen pt-24 pb-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        {
                          title: "Active Courses",
                          value: courseData.activeCourses,
                          icon: BookOpen,
                          color: "from-blue-500 to-blue-600",
                          bgColor: "bg-blue-50",
                        },
                        {
                          title: "Current Batches",
                          value: batchData.activeBatches,
                          icon: Users,
                          color: "from-green-500 to-green-600",
                          bgColor: "bg-green-50",
                        },
                        {
                          title: "Payment Progress",
                          value: `${Math.round(paymentProgress)}%`,
                          icon: TrendingUp,
                          color: "from-purple-500 to-purple-600",
                          bgColor: "bg-purple-50",
                        },
                        {
                          title: "Achievements",
                          value: batchData.completedBatches,
                          icon: Award,
                          color: "from-amber-500 to-amber-600",
                          bgColor: "bg-amber-50",
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

                    {/* Student Information */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center text-xl">
                            <User className="w-6 h-6 mr-3 text-blue-600" />
                            Student Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {[
                              { label: "Full Name", value: student.full_name },
                              { label: "Email", value: student.email },
                              { label: "ID Number", value: student.id_number },
                              { label: "Nationality", value: student.nationality },
                              { label: "Date of Birth", value: new Date(student.date_of_birth).toLocaleDateString() },
                              { label: "Address", value: student.address },
                            ].map((info, index) => (
                              <motion.div
                                key={info.label}
                                className="space-y-2 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{info.label}</p>
                                <p className="text-slate-800 font-semibold">{info.value}</p>
                              </motion.div>
                            ))}
                  </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Quick Overview Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Recent Courses */}
                      <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center text-lg">
                              <BookOpen className="w-5 h-5 mr-3 text-blue-600" />
                              My Courses
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("courses")}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                                              {courseData.recentCourses.length > 0 ? (
                              <div className="space-y-4">
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
                              <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 text-lg">No courses enrolled</p>
                                <p className="text-slate-400 text-sm mt-1">Contact administration to enroll in courses</p>
                </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Recent Batches */}
                      <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center text-lg">
                              <Calendar className="w-5 h-5 mr-3 text-green-600" />
                              My Batches
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("batches")}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                                              {batchData.recentBatches.length > 0 ? (
                              <div className="space-y-4">
                                {batchData.recentBatches.map((batch, index) => (
                                  <BatchCard 
                                    key={batch.id}
                                    batch={batch} 
                                    index={index}
                                    shouldAnimate={shouldAnimate}
                                  />
                                ))}
                  </div>
                            ) : (
                              <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 text-lg">No batches assigned</p>
                                <p className="text-slate-400 text-sm mt-1">You'll be assigned to batches when courses start</p>
                          </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Quick Actions & Notifications */}
                      <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                          <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                              <Bell className="w-5 h-5 mr-3 text-purple-600" />
                              Quick Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
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
                                    className="p-0 h-auto ml-2 text-amber-700 hover:text-amber-800 font-semibold"
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

                    {/* Payment Overview */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:shadow-2xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="flex items-center text-xl">
                            <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
                            Payment Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="text-center p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Total Paid</p>
                              <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                </div>
                            <div className="text-center p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Pending</p>
                              <p className="text-3xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
                  </div>
                            <div className="text-center p-6 bg-white/60 rounded-xl backdrop-blur-sm">
                              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wide font-medium">Total Fees</p>
                              <p className="text-3xl font-bold text-slate-800">${totalFees.toFixed(2)}</p>
              </div>
            </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 font-medium">Payment Progress</span>
                              <span className="font-bold text-lg">{Math.round(paymentProgress)}%</span>
                            </div>
                            <Progress value={paymentProgress} className="h-4" />
                          </div>
                          {totalPending > 0 && (
                            <Alert className="mt-6 border-amber-200 bg-amber-50">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <AlertDescription className="text-amber-800">
                                You have ${totalPending.toFixed(2)} in pending payments.
                                <Button
                                  variant="link"
                                  className="p-0 h-auto ml-2 text-amber-700 hover:text-amber-800 font-semibold"
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
                          <CardTitle className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                            My Courses
                          </CardTitle>
                          <CardDescription>Manage your enrolled courses and track your progress</CardDescription>
                        </CardHeader>
                        <CardContent>
              {student.courses && student.courses.length > 0 ? (
                <div className="space-y-6">
                              {student.courses.map((course, index) => (
                                <motion.div
                                  key={course.id || `course-${index}`}
                                  className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                        <div>
                                      <h3 className="font-bold text-xl text-slate-800 mb-2">
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
                          <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-green-600" />
                            My Batches
                          </CardTitle>
                          <CardDescription>View your batch assignments and attendance records</CardDescription>
                        </CardHeader>
                        <CardContent>
              {student.batches && student.batches.length > 0 ? (
                <div className="space-y-8">
                              <AnimatePresence>
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
                      <div className="space-y-4">
                        {student.batches
                                        .filter((batch) => batch.category === "upcoming")
                                        .map((batch, index) => (
                                          <motion.div
                                            key={batch.id}
                                            className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.01 }}
                                          >
                                            <div className="flex flex-col lg:flex-row justify-between lg:items-center">
                                <div>
                                                <h3 className="font-bold text-xl text-slate-800 mb-2">{batch.batchName}</h3>
                                                <p className="text-slate-600 mb-3">Course: {batch.courseName}</p>
                                                <div className="flex items-center text-sm text-slate-600">
                                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                  Starts: {new Date(batch.startDate).toLocaleDateString()}
                                    <span className="mx-2">•</span>
                                    Ends: {new Date(batch.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                                              <div className="mt-4 lg:mt-0 flex flex-col items-start lg:items-end space-y-2">
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    Upcoming
                                                </Badge>
                                                <Badge variant="outline">
                                    Enrolled: {new Date(batch.enrollmentDate).toLocaleDateString()}
                                                </Badge>
                                </div>
                              </div>
                                          </motion.div>
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
                      <div className="space-y-4">
                        {student.batches
                                        .filter((batch) => batch.category === "active")
                                        .map((batch, index) => (
                                          <motion.div
                                            key={batch.id}
                                            className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.01 }}
                                          >
                                            <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-4">
                                <div>
                                                <h3 className="font-bold text-xl text-slate-800 mb-2">{batch.batchName}</h3>
                                                <p className="text-slate-600 mb-3">Course: {batch.courseName}</p>
                                                <div className="flex items-center text-sm text-slate-600">
                                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                  {new Date(batch.startDate).toLocaleDateString()} -{" "}
                                                  {new Date(batch.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 mt-4 lg:mt-0">
                                    Active Now
                                              </Badge>
                              </div>
                              
                                            {batch.attendancePercentage && (
                                              <div className="bg-white/60 p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-sm font-medium text-slate-700">
                                                    Attendance Progress
                                                  </span>
                                                  <span className="text-sm font-bold text-slate-800">
                                                    {batch.attendancePercentage}%
                                                  </span>
                                </div>
                                                <Progress value={batch.attendancePercentage} className="h-3" />
                                                <p className="text-xs text-slate-500 mt-1">
                                                  {batch.attendancePercentage >= 75
                                                    ? "Excellent attendance!"
                                      : batch.attendancePercentage >= 50
                                                      ? "Good attendance"
                                                      : "Attendance needs improvement"}
                                                </p>
                                  </div>
                                            )}
                                          </motion.div>
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
                      <div className="space-y-4">
                        {student.batches
                                        .filter((batch) => batch.category === "completed")
                                        .map((batch, index) => (
                                          <motion.div
                                            key={batch.id}
                                            className="border-l-4 border-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.01 }}
                                          >
                                            <div className="flex flex-col lg:flex-row justify-between lg:items-center">
                                <div>
                                                <h3 className="font-bold text-xl text-slate-800 mb-2">{batch.batchName}</h3>
                                                <p className="text-slate-600 mb-3">Course: {batch.courseName}</p>
                                                <div className="flex items-center text-sm text-slate-600">
                                                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                                  {new Date(batch.startDate).toLocaleDateString()} -{" "}
                                                  {new Date(batch.endDate).toLocaleDateString()}
                                  </div>
                                </div>
                                              <div className="mt-4 lg:mt-0 flex flex-col items-start lg:items-end space-y-2">
                                                <Badge variant="secondary">Completed</Badge>
                                                <Badge variant="outline">
                                    Final Attendance: {batch.attendancePercentage}%
                                                </Badge>
                                </div>
                              </div>
                                          </motion.div>
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
                              <p className="text-slate-500 text-lg">You are not assigned to any batches yet.</p>
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
                                      <div className="text-right">
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
