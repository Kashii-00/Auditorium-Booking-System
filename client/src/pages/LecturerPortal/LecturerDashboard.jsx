"use client"

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  User,
  BookOpen,
  Calendar,
  Users,
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
  FileText,
  BarChart3,
  Menu,
  X,
  Home,
  Settings,
  HelpCircle,
  MessageSquare,
  Download,
  ChevronDown,
  Plus,
  Edit,
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
import LecturerSidebar from "@/components/LecturerSidebar"
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

// Responsive CourseCard component for lecturers
const CourseCard = memo(({ course, index, shouldAnimate }) => {
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
      className="p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-colors duration-150 cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-emerald-700 transition-colors duration-150 truncate">
            {course.courseName}
          </p>
          <p className="text-xs sm:text-sm text-slate-500">Students: {course.enrolledStudents || 0}</p>
        </div>
        <Badge variant={course.status === "Active" ? "default" : "secondary"} className="shrink-0 text-xs bg-emerald-100 text-emerald-700">
          {course.status || "Active"}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium">{course.progress || 0}%</span>
        </div>
        <Progress value={course.progress || 0} className="h-1.5 sm:h-2" />
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

// Responsive BatchCard component for lecturers
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
      className="p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-colors duration-150 cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-green-700 transition-colors duration-150 truncate">
            {batch.batchName}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 truncate">{batch.courseName}</p>
        </div>
        <Badge
          variant={
            batch.status === "Active"
              ? "default"
              : batch.status === "upcoming"
                ? "secondary"
                : "outline"
          }
          className="shrink-0 text-xs"
        >
          {batch.status}
        </Badge>
      </div>
      {batch.completionPercentage && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-600">Completion</span>
            <span className="font-medium">{batch.completionPercentage}%</span>
          </div>
          <Progress value={batch.completionPercentage} className="h-1.5 sm:h-2" />
        </div>
      )}
    </CardComponent>
  )
})

const LecturerDashboard = () => {
  const [lecturer, setLecturer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(2)
  const navigate = useNavigate()
  const location = useLocation()
  const fetchTimeoutRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // Handle navigation state for tab switching
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location.state])

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
    localStorage.removeItem("lecturerToken")
    localStorage.removeItem("lecturerRefreshToken")
    localStorage.removeItem("lecturerUser")
    navigate("/lecturer-login")
  }, [navigate])

  const handleChangePassword = useCallback(() => {
    navigate("/lecturer-change-password")
  }, [navigate])

  const getInitials = useCallback((name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [])

  // Memoized course and batch data for performance
  const courseData = useMemo(() => {
    if (!lecturer?.courses) return { activeCourses: 0, totalStudents: 0, recentCourses: [] }
    
    const activeCourses = lecturer.courses.filter((c) => c.status === "Active").length
    const totalStudents = lecturer.courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)
    const recentCourses = lecturer.courses.slice(0, 3)
    
    return { activeCourses, totalStudents, recentCourses }
  }, [lecturer?.courses])

  const batchData = useMemo(() => {
    if (!lecturer?.batches) return { activeBatches: 0, completedBatches: 0, recentBatches: [] }
    
    const activeBatches = lecturer.batches.filter((b) => b.status === "Active" || b.status === "current").length
    const completedBatches = lecturer.batches.filter((b) => b.status === "Completed").length
    const recentBatches = lecturer.batches.slice(0, 3)
    
    return { activeBatches, completedBatches, recentBatches }
  }, [lecturer?.batches])

  // Calculate total materials across all batches
  const materialData = useMemo(() => {
    if (!lecturer?.batches) return { totalMaterials: 0 }
    
    const totalMaterials = lecturer.batches.reduce((sum, batch) => {
      return sum + (batch.materials_count || 0)
    }, 0)
    
    return { totalMaterials }
  }, [lecturer?.batches])

  // Calculate total students across all batches
  const studentData = useMemo(() => {
    if (!lecturer?.batches) return { totalStudents: 0 }
    
    const totalStudents = lecturer.batches.reduce((sum, batch) => {
      return sum + (batch.current_students || batch.stats?.students_count || 0)
    }, 0)
    
    return { totalStudents }
  }, [lecturer?.batches])

  // Memoized quick actions data
  const quickActions = useMemo(() => [
    {
      title: "Manage Students",
      subtitle: "View & manage",
      bgColor: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-800",
      hoverColor: "text-emerald-900",
      subTextColor: "text-emerald-600",
      iconColor: "text-emerald-600",
      icon: Users,
      action: () => setActiveTab("students")
    },
    {
      title: "Upload Materials",
      subtitle: "Course resources",
      bgColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      hoverColor: "text-blue-900",
      subTextColor: "text-blue-600",
      iconColor: "text-blue-600",
      icon: FileText,
      action: () => setActiveTab("materials")
    },
    {
      title: "Change Password",
      subtitle: "Update security",
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      hoverColor: "text-purple-900",
      subTextColor: "text-purple-600",
      iconColor: "text-purple-600",
      icon: Key,
      action: handleChangePassword
    }
  ], [handleChangePassword, setActiveTab])

  // Optimized fetch with debouncing and cleanup
  const fetchLecturerData = useCallback(async () => {
    try {
      const token = localStorage.getItem("lecturerToken")
      if (!token) {
        navigate("/lecturer-login")
        return
      }

      // Get lecturer ID from token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const lecturerId = tokenPayload.lecturerId

      // Fetch profile data
      const response = await axios.get(`${API_URL}/lecturer-auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Fetch batch data for statistics
      let batchesData = []
      try {
        const { batchService } = await import('../../services/lecturerBatchService')
        const batchResponse = await batchService.getLecturerBatches(lecturerId)
        batchesData = batchResponse.batches || []
      } catch (batchError) {
        console.error("Error fetching batch data:", batchError)
        batchesData = []
      }

      const lecturerData = {
        ...response.data,
        courses: response.data.courses || [],
        batches: batchesData,
        materials: response.data.materials || [],
      }
      
      setLecturer(lecturerData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching lecturer data:", error)
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
      fetchLecturerData()
    }, 100)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [fetchLecturerData])

  // Loading state
  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." type="users" />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
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
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!lecturer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-slate-700 mb-4">No lecturer data found. Please log in again.</p>
            <Button
              onClick={() => navigate("/lecturer-login")}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const MainComponent = shouldAnimate ? motion.div : 'div'
  const headerMotionProps = shouldAnimate ? { variants: itemVariants } : {}
  const mainContentProps = shouldAnimate ? {
    initial: "hidden",
    animate: "visible",
    variants: containerVariants
  } : {}

  return (
    <MainComponent
      className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50 relative overflow-hidden"
      {...mainContentProps}
    >
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(5,150,105,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(34,197,94,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Enhanced Responsive Header */}
      <motion.header className="fixed top-0 left-0 right-0 z-50" {...headerMotionProps}>
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-green-500/5"></div>
          {/* Noise texture overlay for premium feel */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Content Layer */}
        <div className="relative">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
              
              {/* Left Section - Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                {/* Mobile Menu Toggle */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-white/20 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-6 border-b">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>
                        Access your lecturer portal features
                      </SheetDescription>
                    </SheetHeader>
                    <nav className="p-4 space-y-2">
                      {[
                        { id: "overview", label: "Overview", icon: Home },
                        { id: "courses", label: "My Courses", icon: BookOpen },
                        { id: "batches", label: "My Batches", icon: Calendar },
                        { id: "students", label: "Students", icon: Users },
                        { id: "materials", label: "Materials", icon: FileText },
                      ].map((item) => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={`w-full justify-start ${
                            activeTab === item.id
                              ? "bg-emerald-50 text-emerald-700"
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
                          navigate("/lecturer-profile")
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
                          navigate("/lecturer-preferences")
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
                  className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500/80 to-green-600/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-white drop-shadow-sm" />
                    </div>
                    <div className="absolute inset-0 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-400/40 to-green-500/40 rounded-xl blur-md -z-10"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-slate-800 via-emerald-700 to-green-700 bg-clip-text text-transparent drop-shadow-sm truncate">
                      <span className="hidden sm:inline">Lecturer Portal</span>
                      <span className="sm:hidden">MPMA</span>
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-600/80 font-medium truncate">
                      Welcome back, {lecturer?.full_name?.split(" ")[0] || 'Lecturer'}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right Section - User Menu and Actions */}
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
                
                {/* Notification Button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative bg-white/30 backdrop-blur-xl hover:bg-white/40 rounded-lg sm:rounded-2xl border border-white/30 shadow-lg transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                    {notificationCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      />
                    )}
                    {/* Button glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-lg sm:rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </motion.div>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 bg-white/40 backdrop-blur-xl rounded-lg sm:rounded-xl lg:rounded-2xl px-1 sm:px-2 lg:px-4 py-1 sm:py-1.5 lg:py-2 shadow-lg border border-white/30 cursor-pointer hover:bg-white/50 transition-all duration-200 min-w-0"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ring-1 sm:ring-2 ring-white/50 shadow-md flex-shrink-0">
                        <AvatarImage src={lecturer?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500/90 to-green-600/90 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm">
                          {getInitials(lecturer?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left min-w-0 flex-1">
                        <p className="font-semibold text-slate-800/90 text-xs sm:text-sm lg:text-base drop-shadow-sm truncate max-w-[80px] lg:max-w-[120px] xl:max-w-[200px]">
                          {lecturer?.full_name}
                        </p>
                        <p className="text-xs lg:text-sm text-slate-600/80 truncate max-w-[80px] lg:max-w-[120px] xl:max-w-[200px]">
                          {lecturer?.email}
                        </p>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 hidden sm:block flex-shrink-0" />
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate("/lecturer-profile")}
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
        className="fixed top-14 sm:top-16 lg:top-20 left-0 right-0 h-0.5 z-40 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent backdrop-blur-sm"></div>
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 origin-left shadow-lg"
          style={{
            scaleX: 0,
          }}
          initial={{ scaleX: 0 }}
        />
      </motion.div>

      {/* Lecturer Sidebar - Hidden on Mobile */}
      <div className="hidden lg:block">
        <LecturerSidebar
          lecturer={lecturer}
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
        <div className="min-h-screen pt-16 sm:pt-18 lg:pt-24 pb-6 sm:pb-8">
          <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-12">
            <motion.div variants={itemVariants}>
              {/* Welcome Section */}
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-800 mb-2">
                    Welcome back, {lecturer?.full_name?.split(' ')[0] || 'Lecturer'}! 👋
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                    Ready to inspire and educate? Here's your teaching overview for today.
                  </p>
                </motion.div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Mobile Tab Navigation */}
                <div className="lg:hidden mb-4 sm:mb-6 -mx-3 sm:-mx-4 px-3 sm:px-4 overflow-x-auto">
                  <TabsList className="inline-flex w-auto min-w-full bg-white/80 backdrop-blur-sm">
                    <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="courses" className="flex-1 text-xs sm:text-sm">Courses</TabsTrigger>
                    <TabsTrigger value="batches" className="flex-1 text-xs sm:text-sm">Batches</TabsTrigger>
                    <TabsTrigger value="students" className="flex-1 text-xs sm:text-sm">Students</TabsTrigger>
                    <TabsTrigger value="materials" className="flex-1 text-xs sm:text-sm">Materials</TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Quick Stats - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                                          {[
                        {
                          title: "Active Courses",
                          value: courseData.activeCourses,
                          icon: BookOpen,
                          color: "from-emerald-500 to-emerald-600",
                          bgColor: "bg-emerald-50",
                          change: "Teaching now"
                        },
                        {
                          title: "Total Students",
                          value: studentData.totalStudents,
                          icon: Users,
                          color: "from-blue-500 to-blue-600",
                          bgColor: "bg-blue-50",
                          change: "Enrolled students"
                        },
                        {
                          title: "Active Batches",
                          value: batchData.activeBatches,
                          icon: Calendar,
                          color: "from-purple-500 to-purple-600",
                          bgColor: "bg-purple-50",
                          change: "In progress"
                        },
                        {
                          title: "Materials Uploaded",
                          value: materialData.totalMaterials,
                          icon: FileText,
                          color: "from-amber-500 to-amber-600",
                          bgColor: "bg-amber-50",
                          change: "Resources"
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
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Recent Courses */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 p-4 sm:p-6">
                          <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-emerald-600" />
                            My Courses
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("courses")}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <div className="space-y-3 sm:space-y-4">
                            {/* Dynamic Course Cards */}
                            {lecturer?.courses && lecturer.courses.length > 0 ? (
                              lecturer.courses.slice(0, 2).map((course, index) => (
                                <div
                                  key={course.id || index}
                                  className={`p-3 sm:p-4 rounded-lg bg-gradient-to-r border ${
                                    index === 0
                                      ? 'from-emerald-50 to-green-50 border-emerald-100'
                                      : 'from-blue-50 to-indigo-50 border-blue-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h3 className={`text-sm sm:text-base lg:text-lg font-semibold truncate ${
                                      index === 0 ? 'text-emerald-800' : 'text-blue-800'
                                    }`}>
                                      {course.courseName || course.course_name || 'Course Name'}
                                    </h3>
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                                      index === 0
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {course.status || 'Active'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs sm:text-sm">
                                    <span className={`font-medium ${
                                      index === 0 ? 'text-emerald-700' : 'text-blue-700'
                                    }`}>
                                      Students: {course.enrolledStudents || course.student_count || 0}
                                    </span>
                                    <span className={`font-medium ${
                                      index === 0 ? 'text-emerald-700' : 'text-blue-700'
                                    }`}>
                                      Progress: {course.progress || course.completion_percentage || 0}%
                                    </span>
                                  </div>
                                  <div className={`w-full rounded-full h-1.5 sm:h-2 ${
                                    index === 0 ? 'bg-emerald-200' : 'bg-blue-200'
                                  }`}>
                                    <div
                                      className={`h-1.5 sm:h-2 rounded-full ${
                                        index === 0 ? 'bg-emerald-600' : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${course.progress || course.completion_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <>
                                {/* Fallback Information Technology Course */}
                                <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-emerald-800 truncate">Information Technology</h3>
                                    <span className="px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">Active</span>
                                  </div>
                                  <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs sm:text-sm">
                                    <span className="text-emerald-700 font-medium">Students: {studentData.totalStudents || 0}</span>
                                    <span className="text-emerald-700 font-medium">Progress: 5%</span>
                                  </div>
                                  <div className="w-full bg-emerald-200 rounded-full h-1.5 sm:h-2">
                                    <div className="bg-emerald-600 h-1.5 sm:h-2 rounded-full" style={{ width: '5%' }}></div>
                                  </div>
                                </div>

                                {/* Fallback Computer Science Course */}
                                <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-800 truncate">Computer Science</h3>
                                    <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">Active</span>
                                  </div>
                                  <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs sm:text-sm">
                                    <span className="text-blue-700 font-medium">Students: {Math.floor(studentData.totalStudents / 2) || 0}</span>
                                    <span className="text-blue-700 font-medium">Progress: 8%</span>
                                  </div>
                                  <div className="w-full bg-blue-200 rounded-full h-1.5 sm:h-2">
                                    <div className="bg-blue-600 h-1.5 sm:h-2 rounded-full" style={{ width: '8%' }}></div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Recent Batches */}
                    <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 p-4 sm:p-6">
                          <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-purple-600" />
                            My Batches
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("batches")}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <div className="space-y-3 sm:space-y-4">
                            {/* Current Computer Science Batch */}
                            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-800 truncate">Computer Science</h3>
                                <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">Current</span>
                              </div>
                              <p className="text-purple-700 text-xs sm:text-sm">Current batch</p>
                            </div>

                            {/* Previous Computer Science Batch */}
                            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate">Computer Science</h3>
                                <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">Completed</span>
                              </div>
                              <p className="text-gray-700 text-xs sm:text-sm">Previous batch</p>
                            </div>
                          </div>
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
                        <CardContent>
                          <div className="space-y-3 sm:space-y-4">
                            {quickActions.map((action, index) => (
                              <QuickAction
                                key={action.title}
                                action={action}
                                onClick={action.action}
                                shouldAnimate={shouldAnimate}
                              />
                            ))}
                            
                            {/* Today's Schedule */}
                            <div className="mt-6 pt-4 border-t border-slate-200">
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                                Today's Schedule
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                                  <span className="text-xs text-slate-600">9:00 AM</span>
                                  <span className="text-xs font-medium text-emerald-700">JavaScript - JS-2024-A</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                                  <span className="text-xs text-slate-600">2:00 PM</span>
                                  <span className="text-xs font-medium text-blue-700">Database - DB-2024-B</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Weekly Summary Section */}
                  <motion.div {...(shouldAnimate ? { variants: itemVariants } : {})}>
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center text-base sm:text-lg">
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-indigo-600" />
                          This Week's Summary
                        </CardTitle>
                        <CardDescription>
                          Your teaching performance and activities this week
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">15</div>
                            <div className="text-xs text-slate-500">Classes Taught</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">98%</div>
                            <div className="text-xs text-slate-500">Attendance Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">8</div>
                            <div className="text-xs text-slate-500">Materials Uploaded</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600 mb-1">4.8</div>
                            <div className="text-xs text-slate-500">Avg. Rating</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses" className="space-y-6">
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-3 text-emerald-600" />
                        My Courses
                      </CardTitle>
                      <CardDescription>
                        Manage and view all your assigned courses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">Courses management coming soon</p>
                        <p className="text-slate-400 mt-1">This feature will be available in the next update</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Batches Tab */}
                <TabsContent value="batches" className="space-y-6">
                  <BatchManagementTab />
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-6">
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-3 text-blue-600" />
                        Students
                      </CardTitle>
                      <CardDescription>
                        Manage and view all your students
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">Student management coming soon</p>
                        <p className="text-slate-400 mt-1">This feature will be available in the next update</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials" className="space-y-6">
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-purple-600" />
                        Course Materials
                      </CardTitle>
                      <CardDescription>
                        Upload and manage course materials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">Materials management coming soon</p>
                        <p className="text-slate-400 mt-1">This feature will be available in the next update</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </MainComponent>
  )
}

// Batch Management Tab Component
const BatchManagementTab = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLecturerBatches()
  }, [])

  const fetchLecturerBatches = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get lecturer ID from token
      const lecturerToken = localStorage.getItem('lecturerToken')
      
      if (!lecturerToken) {
        throw new Error('Lecturer authentication not found')
      }

      // Decode token to get lecturer ID
      const tokenPayload = JSON.parse(atob(lecturerToken.split('.')[1]))
      const lecturerId = tokenPayload.lecturerId
      
      if (!lecturerId) {
        throw new Error('Lecturer ID not found in token')
      }

      // Import the service and fetch real data
      const { batchService } = await import('../../services/lecturerBatchService')
      const response = await batchService.getLecturerBatches(lecturerId)
      
      setBatches(response.batches || [])
    } catch (error) {
      console.error('Error fetching lecturer batches:', error)
      setError('Failed to load batches')
      setBatches([]) // Don't show sample data, show empty state instead
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': 
      case 'current': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed':
      case 'past': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBatches = batches.filter(batch => {
    if (filter === 'all') return true
    if (filter === 'current') return batch.status?.toLowerCase() === 'active'
    if (filter === 'past') return batch.status?.toLowerCase() === 'completed'
    return batch.status?.toLowerCase() === filter.toLowerCase()
  })

  const handleBatchClick = (batchId) => {
    navigate(`/lecturer/batch/${batchId}`)
  }

  if (loading) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600">Loading batches...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-3 text-green-600" />
            My Batches ({filteredBatches.length})
          </CardTitle>
          <CardDescription>
            Manage materials, assignments, grades, and announcements for your batches
          </CardDescription>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { id: 'all', label: 'All Batches' },
            { id: 'current', label: 'Current' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === tab.id
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No batches found</p>
            <p className="text-slate-400 mt-1">
              {filter === 'all' 
                ? 'You haven\'t been assigned to any batches yet'
                : `No ${filter} batches available`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg"
                onClick={() => handleBatchClick(batch.id)}
              >
                {/* Batch Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">
                      {batch.batch_code}
                    </h3>
                    <p className="text-slate-600 text-sm mb-2">{batch.courseName}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {batch.courseId || 'N/A'}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status ? batch.status.charAt(0).toUpperCase() + batch.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Batch Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Students</p>
                    <p className="font-semibold text-slate-900">
                      {batch.current_students || 0}/{batch.max_students || batch.capacity || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="font-semibold text-slate-900 text-xs">
                      {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'} - {batch.end_date ? new Date(batch.end_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {batch.status === 'current' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-600">Progress</span>
                      <span className="text-xs font-medium text-slate-900">{batch.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batch.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Activity Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center space-x-1">
                    <span>📚</span>
                    <span>{batch.materials_count} Materials</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📝</span>
                    <span>{batch.assignments_count} Assignments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📢</span>
                    <span>{batch.announcements_count} Announcements</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Click to manage batch</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Add quick material upload
                      }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Upload Material"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Add quick assignment creation
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Create Assignment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Add quick announcement
                      }}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Post Announcement"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LecturerDashboard 