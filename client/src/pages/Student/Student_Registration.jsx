"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo, useLayoutEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  User,
  Mail,
  CreditCard,
  Globe,
  Calendar,
  MapPin,
  Ship,
  Phone,
  Waves,
  Upload,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
  ChevronDown,
  Search,
  RefreshCw,
  Download,
  Plus,
  Users,
  FileText,
  Loader2,
  TrendingUp,
  BookOpen,
  Activity,
  Check,
  Eye,
  Edit,
  Star,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  Target,
  GraduationCap,
  Trash2,
  Layers,
  Hash,

} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authRequest } from "../../services/authService"
import { cn } from "@/lib/utils"

// Optimized Performance CSS with reduced complexity
const PERFORMANCE_CSS = `
  .hardware-accelerated {
    transform: translate3d(0, 0, 0);
    will-change: auto;
  }

  .card-transition {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }

  .stats-card {
    transition: transform 200ms ease-out;
  }

  .stats-card:hover {
    transform: translateY(-2px);
  }

  .student-card {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }

  .student-card:hover {
    transform: translateY(-1px);
  }

  .gradient-text {
    background: linear-gradient(135deg, #1e293b, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .form-step {
    transition: all 200ms ease-out;
  }

  .table-row {
    transition: background-color 150ms ease-out;
  }

  .table-row:hover {
    background: rgba(59, 130, 246, 0.03);
  }

  /* Optimize scrolling */
  * {
    scroll-behavior: smooth;
  }

  /* Reduce paint complexity */
  .backdrop-blur-xl {
    backdrop-filter: blur(8px);
  }

  .shadow-2xl {
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -6px rgba(0, 0, 0, 0.1);
  }
`

// Utility function to extract course IDs from enrolled courses
const extractCourseIds = (enrolledCourses) => {
  if (!enrolledCourses) return "Not enrolled"
  
  // Since the server now returns courseId directly, we just need to handle the string
  if (typeof enrolledCourses === 'string' && enrolledCourses.trim()) {
    // Clean up the string and return it
    return enrolledCourses.trim()
  }
  
  // Handle array case (if needed)
  if (Array.isArray(enrolledCourses)) {
    const courseIds = enrolledCourses
      .map(course => course.courseId || course.course_id || course.id || course)
      .filter(Boolean)
      .join(", ")
    
    return courseIds || "Not enrolled"
  }
  
  return "Not enrolled"
}

// Enhanced Course Name Tooltip Component
const CourseTooltip = memo(({ courseIds, coursesMap }) => {
  const extractedCourseIds = extractCourseIds(courseIds)
  
  if (!extractedCourseIds || extractedCourseIds === "Not enrolled") {
    return <span className="text-sm font-semibold text-slate-700">Not enrolled</span>
  }

  const courseIdArray = extractedCourseIds.split(", ").filter(Boolean)
  
  // Calculate dynamic width based on longest course name
  const maxLength = Math.max(
    ...courseIdArray.map(courseId => {
      const courseName = coursesMap[courseId] || "Course name not found"
      return (courseId + ": " + courseName).length
    })
  )
  
  // Determine tooltip width class based on content length
  const getTooltipWidthClass = (length) => {
    if (length <= 30) return "min-w-48 max-w-sm"      // Short names
    if (length <= 50) return "min-w-64 max-w-md"      // Medium names  
    if (length <= 80) return "min-w-80 max-w-lg"      // Long names
    return "min-w-96 max-w-xl"                        // Very long names
  }
  
  const tooltipWidthClass = getTooltipWidthClass(maxLength)
  
  return (
    <div className="group relative">
      <span className="text-sm font-semibold text-slate-700 max-w-xs truncate cursor-help">
        {extractedCourseIds}
      </span>
      {courseIdArray.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
          <div className={`bg-slate-800 text-white text-xs rounded-lg py-3 px-4 shadow-xl ${tooltipWidthClass}`}>
            <div className="space-y-2">
              {courseIdArray.map((courseId, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="font-bold text-blue-300 flex-shrink-0">{courseId}:</span>
                  <span className="break-words leading-relaxed">{coursesMap[courseId] || "Course name not found"}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  )
})

CourseTooltip.displayName = "CourseTooltip"

// Optimized Student Row Component
const StudentRow = memo(({ student, onView, onEdit, onDelete, onSendPasswordReset, confirmDeleteId, loading, coursesMap }) => {
  const handleView = useCallback(() => onView(student.id), [onView, student.id])
  const handleEdit = useCallback(() => onEdit(student.id), [onEdit, student.id])
  const handleDelete = useCallback(() => onDelete(student.id), [onDelete, student.id])
  const handleCancelDelete = useCallback(() => onDelete(null), [onDelete])
  const handleSendPasswordReset = useCallback(() => onSendPasswordReset(student), [onSendPasswordReset, student])

  return (
    <tr className="table-row border-b border-slate-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-blue-200">
            <AvatarImage src={`/placeholder.svg?height=48&width=48&query=student`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold">
              {student.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900">{student.full_name}</div>
            <div className="text-sm text-slate-500 font-semibold">
              <span className="text-slate-400">
                ID: {student.id}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-semibold text-slate-700">{student.email}</div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div className="font-bold text-slate-900">{student.identification_type}</div>
          <div className="text-slate-600 font-medium">{student.id_number}</div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-semibold text-slate-700">{student.nationality}</div>
      </td>
      <td className="p-4">
        <CourseTooltip courseIds={student.enrolled_courses} coursesMap={coursesMap} />
      </td>
      <td className="p-4">
        <Badge
          variant="outline"
          className={cn(
            "font-bold px-3 py-1",
            student.status === "Active" || !student.status
              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300"
              : "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300",
          )}
        >
          <Activity className="h-3 w-3 mr-1" />
          {student.status || "Active"}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleView}
            className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 border transition-colors"
            title="View Student"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-1 hover:bg-emerald-50 hover:border-emerald-300 border transition-colors"
            title="Edit Student"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendPasswordReset}
            className="flex items-center gap-1 hover:bg-purple-50 hover:border-purple-300 border transition-colors"
            title="Send Password Reset Email"
          >
            <Mail className="w-4 h-4" />
          </Button>
          {confirmDeleteId === student.id ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="hover:bg-red-700"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Confirm"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelDelete} className="hover:bg-gray-50 border">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border transition-colors"
              title="Delete Student"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
})

StudentRow.displayName = "StudentRow"

// Add table header component to improve code organization
const TableHeader = memo(({ onSort, sortField, sortDirection }) => {
  const getSortIcon = useCallback(
    (field) => {
      if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
      return sortDirection === "asc" ? (
        <ArrowUp className="w-4 h-4 text-blue-600" />
      ) : (
        <ArrowDown className="w-4 h-4 text-blue-600" />
      )
    },
    [sortField, sortDirection],
  )

  return (
    <thead>
      <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors rounded-tl-xl"
          onClick={() => onSort("full_name")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Name
            {getSortIcon("full_name")}
          </div>
        </th>
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onSort("email")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Email
            {getSortIcon("email")}
          </div>
        </th>
        <th className="text-left p-4 font-black text-slate-700">Identification</th>
        <th className="text-left p-4 font-black text-slate-700">Nationality</th>
        <th className="text-left p-4 font-black text-slate-700">Courses</th>
        <th
          className="text-left p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => onSort("status")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Status
            {getSortIcon("status")}
          </div>
        </th>
        <th className="text-left p-4 font-black text-slate-700 rounded-tr-xl">Actions</th>
      </tr>
    </thead>
  )
})

TableHeader.displayName = "TableHeader"

// Add pagination info and controls component
const PaginationControls = memo(
  ({ currentPage, totalPages, indexOfFirstStudent, indexOfLastStudent, totalItems, onPageChange }) => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-slate-200 px-6">
          <div className="text-sm text-slate-600 font-semibold">
            Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, totalItems)} of {totalItems} students
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
              <ArrowLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (currentPage <= 4) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = currentPage - 3 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "border-2 rounded-xl font-bold",
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-600"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50",
                  )}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
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

        {totalPages > 5 && (
          <div className="flex justify-center pb-4 items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Jump to page:</span>
            <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden w-24">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Number.parseInt(e.target.value)
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page)
                  }
                }}
                className="border-0 h-8 text-center p-0"
              />
            </div>
            <span className="text-sm text-slate-500">of {totalPages}</span>
          </div>
        )}
      </div>
    )
  },
)

PaginationControls.displayName = "PaginationControls"

// Add a record selector component below the table header
const RecordsPerPageSelector = memo(({ value, onChange, options }) => {
  return (
    <div className="flex items-center gap-2 mb-2 pl-4">
      <span className="text-sm text-slate-600 font-semibold">Show</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-2 border-slate-200 rounded-lg p-1 text-sm font-semibold bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-slate-600 font-semibold">records per page</span>
    </div>
  )
})

RecordsPerPageSelector.displayName = "RecordsPerPageSelector"

export default function StudentManagementSystem() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Add performance CSS to document head - Optimized
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = PERFORMANCE_CSS
    style.id = "student-management-performance-css"

    // Remove existing style if present
    const existingStyle = document.getElementById("student-management-performance-css")
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    document.head.appendChild(style)
    return () => {
      const styleToRemove = document.getElementById("student-management-performance-css")
      if (styleToRemove) {
        document.head.removeChild(styleToRemove)
      }
    }
  }, [])



  // View state - 'dashboard' or 'registration'
  const [currentView, setCurrentView] = useState("dashboard")

  // Form state
  const [currentStep, setCurrentStep] = useState(0)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [showCourseOptions, setShowCourseOptions] = useState(false)
  const [courseFilter, setCourseFilter] = useState("")

  // Student list state
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState("")
  const [editingStudent, setEditingStudent] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("full_name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  // Change studentsPerPage from 10 to 2
  const recordsPerPageOptions = [2, 5, 10, 25, 50]
  const [studentsPerPage, setStudentsPerPage] = useState(5)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  // Courses mapping for tooltips
  const [coursesMap, setCoursesMap] = useState({})

  // Refs
  const courseOptionsRef = useRef(null)
  const courseInputRef = useRef(null)
  const tableRef = useRef(null)
  const searchInputRef = useRef(null)
  const searchSuggestionsRef = useRef(null)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarState")
      return stored !== null ? stored === "true" : false
    }
    return false
  })

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    selected_courses: [],
    identification_type: "NIC",
    id_number: "",
    nationality: "",
    date_of_birth: "",
    country: "",
    cdc_number: "",
    address: "",
    department: "",
    company: "",
    sea_service: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    is_swimmer: false,
    is_slpa_employee: false,
    designation: "",
    division: "",
    service_no: "",
    section_unit: "",
    nic_document: null,
    passport_document: null,
    photo: null,
    driving_details: {
      driving_license_no: "",
      driving_class: "",
      issue_date: "",
    },
  })

  const [errors, setErrors] = useState({})

  // Handle URL parameters for editing
  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId && editId !== editingStudent) {
      handleEditStudent(editId)
    }
  }, [searchParams])

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true)
      setStudentsError("")

      const response = await authRequest("get", "http://localhost:5003/api/students")

      if (response && Array.isArray(response)) {
        setStudents(response)
      } else {
        throw new Error("Invalid students data format")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      setStudentsError("Failed to load students. Please try again.")
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  // Fetch courses function with retry capability
  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true)
      setErrorMessage("")

      const coursesData = await authRequest("get", "http://localhost:5003/api/students/courses")

      if (coursesData && Array.isArray(coursesData)) {
        setCourses(coursesData)
        
        // Build courses mapping for tooltips
        const mapping = {}
        coursesData.forEach(course => {
          if (course.courseId && course.courseName) {
            mapping[course.courseId] = course.courseName
          }
        })
        setCoursesMap(mapping)
      } else {
        throw new Error("Invalid course data format")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setErrorMessage("Failed to load courses. Please try again.")
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  // Initial data fetching
  useEffect(() => {
    fetchCourses()
    fetchStudents()
  }, [fetchCourses, fetchStudents])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close course dropdown
      if (
        courseOptionsRef.current &&
        !courseOptionsRef.current.contains(event.target) &&
        courseInputRef.current &&
        !courseInputRef.current.contains(event.target)
      ) {
        setShowCourseOptions(false)
      }
      
      // Close search suggestions
      if (
        searchSuggestionsRef.current &&
        !searchSuggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Sync sidebar state for layout
  useEffect(() => {
    const syncSidebarState = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sidebarState")
        if (stored !== null) {
          const isCollapsed = stored === "true"
          setSidebarCollapsed(isCollapsed)

          if (isCollapsed) {
            document.body.classList.add("sidebar-collapsed")
          } else {
            document.body.classList.remove("sidebar-collapsed")
          }
        }
      }
    }

    syncSidebarState()

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed)
    }

    const handleSidebarHover = (e) => {
      setSidebarCollapsed(!e.detail.isHovered)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("sidebarToggle", handleSidebarToggle)
      window.addEventListener("sidebarHover", handleSidebarHover)
      window.addEventListener("popstate", syncSidebarState)

      return () => {
        window.removeEventListener("sidebarToggle", handleSidebarToggle)
        window.removeEventListener("sidebarHover", handleSidebarHover)
        window.removeEventListener("popstate", syncSidebarState)
      }
    }
  }, [])

  // Form section definitions for multi-step form
  const formSections = useMemo(
    () => [
      {
        title: "Personal Information",
        icon: User,
        fields: ["full_name", "identification_type", "id_number", "nationality", "date_of_birth", "country"],
      },
      {
        title: "Contact Information",
        icon: Phone,
        fields: ["email", "address", "emergency_contact_name", "emergency_contact_number"],
      },
      {
        title: "Courses",
        icon: GraduationCap,
        fields: ["selected_courses"],
      },
      {
        title: "Additional",
        icon: FileText,
        fields: ["is_swimmer", "is_slpa_employee", "company"],
      },
      {
        title: "Documents",
        icon: Upload,
        fields: ["nic_document", "passport_document", "photo"],
      },
    ],
    [],
  )

  // Conditional fields when SLPA employee is selected - now includes department, sea_service, cdc_number
  const slpaFields = ["designation", "division", "service_no", "section_unit", "department", "sea_service", "cdc_number"]

  // Reset form to default values
  const resetForm = useCallback(() => {
    setFormData({
      full_name: "",
      email: "",
      selected_courses: [],
      identification_type: "NIC",
      id_number: "",
      nationality: "",
      date_of_birth: "",
      country: "",
      cdc_number: "",
      address: "",
      department: "",
      company: "",
      sea_service: "",
      emergency_contact_name: "",
      emergency_contact_number: "",
      is_swimmer: false,
      is_slpa_employee: false,
      designation: "",
      division: "",
      service_no: "",
      section_unit: "",
      nic_document: null,
      passport_document: null,
      photo: null,
      driving_details: {
        driving_license_no: "",
        driving_class: "",
        issue_date: "",
      },
    })
    setCurrentStep(0)
    setEditingStudent(null)
    setErrors({})
    setCurrentView("dashboard")
    // Clear URL parameters
    navigate("/student-registration", { replace: true })
  }, [navigate])

  // Edit student handler
  const handleEditStudent = useCallback(async (studentId) => {
    try {
      setLoading(true)
      const student = await authRequest("get", `http://localhost:5003/api/students/${studentId}`)

      if (student) {
        // Prepare selected courses
        const selectedCourses = student.courses?.map((course) => course.id) || []

        // Populate form data
        setFormData({
          full_name: student.full_name || "",
          email: student.email || "",
          selected_courses: selectedCourses,
          identification_type: student.identification_type || "NIC",
          id_number: student.id_number || "",
          nationality: student.nationality || "",
          date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
          country: student.country || "",
          cdc_number: student.cdc_number || "",
          address: student.address || "",
          department: student.department || "",
          company: student.company || "",
          sea_service: student.sea_service || "",
          emergency_contact_name: student.emergency_contact_name || "",
          emergency_contact_number: student.emergency_contact_number || "",
          is_swimmer: Boolean(student.is_swimmer),
          is_slpa_employee: Boolean(student.is_slpa_employee),
          designation: student.designation || "",
          division: student.division || "",
          service_no: student.service_no || "",
          section_unit: student.section_unit || "",
          nic_document: null,
          passport_document: null,
          photo: null,
          driving_details: (() => {
            // Handle malformed driving_details from database
            if (student.driving_details) {
              try {
                // If it's already an object, use it
                if (typeof student.driving_details === 'object' && !Array.isArray(student.driving_details)) {
                  return {
                    driving_license_no: student.driving_details.driving_license_no || "",
                    driving_class: student.driving_details.driving_class || "",
                    issue_date: student.driving_details.issue_date || "",
                  };
                }
                // If it's a string, try to parse it
                if (typeof student.driving_details === 'string') {
                  const parsed = JSON.parse(student.driving_details);
                  return {
                    driving_license_no: parsed.driving_license_no || "",
                    driving_class: parsed.driving_class || "",
                    issue_date: parsed.issue_date || "",
                  };
                }
              } catch (error) {
                console.warn('Error parsing driving_details:', error);
              }
            }
            // Return default structure
            return {
            driving_license_no: "",
            driving_class: "",
            issue_date: "",
            };
          })(),
        })

        setEditingStudent(studentId)
        setCurrentStep(0)
        setCurrentView("registration")

        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
      setErrorMessage("Failed to load student details for editing.")
    } finally {
      setLoading(false)
    }
  }, [])

  // View student handler
  const handleViewStudent = useCallback(
    (studentId) => {
      navigate(`/students/${studentId}`)
    },
    [navigate],
  )

  // Delete student handler
  const handleDeleteStudent = useCallback(
    async (studentId) => {
      if (studentId === null) {
        setConfirmDeleteId(null)
        return
      }

      if (confirmDeleteId !== studentId) {
        setConfirmDeleteId(studentId)
        return
      }

      try {
        setLoading(true)

        await authRequest("delete", `http://localhost:5003/api/students/${studentId}`)

        setNotificationMessage("Student deleted successfully!")
        setShowSuccessNotification(true)

        fetchStudents()
        setConfirmDeleteId(null)

        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 3000)
      } catch (error) {
        console.error("Error deleting student:", error)
        setErrorMessage("Failed to delete student. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [confirmDeleteId, fetchStudents],
  )

  // Send password reset email handler
  const handleSendPasswordReset = useCallback(async (student) => {
    try {
      setLoading(true)
      
      const response = await authRequest("post", "http://localhost:5003/api/student-auth/forgot-password", {
        email: student.email
      })

      if (response.success) {
        setNotificationMessage(`Password reset email sent to ${student.email}`)
        setShowSuccessNotification(true)
        
        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 4000)
      } else {
        throw new Error(response.message || "Failed to send password reset email")
      }
    } catch (error) {
      console.error("Error sending password reset email:", error)
      setErrorMessage(`Failed to send password reset email to ${student.email}. Please try again.`)
      
      setTimeout(() => {
        setErrorMessage("")
      }, 5000)
    } finally {
      setLoading(false)
    }
  }, [])

  // Form validation function
  // Check if selected courses include Equipment stream courses
  const hasEquipmentCourses = useMemo(() => {
    return formData.selected_courses.some(courseId => {
      const course = courses.find(c => c.id === courseId);
      return course && course.stream && course.stream.toLowerCase().includes('equipment');
    });
  }, [formData.selected_courses, courses]);

  const validateForm = useCallback(
    (step) => {
      const newErrors = {}

      const fieldsToValidate = [...formSections[step].fields]

      // Add SLPA fields if employee checkbox is checked
      if (step === 3 && formData.is_slpa_employee) {
        fieldsToValidate.push(...slpaFields)
      }

      // Add driving details fields if Equipment courses are selected
      if (step === 3 && hasEquipmentCourses) {
        fieldsToValidate.push("driving_license_no", "driving_class", "driving_issue_date")
      }

      fieldsToValidate.forEach((field) => {
        if (field === "selected_courses") {
          if (formData.selected_courses.length === 0) {
            newErrors.selected_courses = "Please select at least one course"
          }
          return
        }

        // Enhanced validation for specific fields
        if (field === "email") {
          if (!formData.email || formData.email.trim() === "") {
            newErrors.email = "Email is required"
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
          }
          return
        }

        if (field === "id_number") {
          if (!formData.id_number || formData.id_number.trim() === "") {
            newErrors.id_number = `${formData.identification_type} number is required`
          } else if (formData.identification_type === "NIC") {
            // NIC validation for Sri Lanka format
            const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/
            if (!nicPattern.test(formData.id_number.trim())) {
              newErrors.id_number = "Please enter a valid NIC number (9 digits + V/X or 12 digits)"
            }
          } else if (formData.identification_type === "Passport") {
            // Basic passport validation
            if (formData.id_number.trim().length < 6) {
              newErrors.id_number = "Passport number must be at least 6 characters"
            }
          }
          return
        }

        if (field === "date_of_birth") {
          if (!formData.date_of_birth) {
            newErrors.date_of_birth = "Date of birth is required"
          } else {
            const birthDate = new Date(formData.date_of_birth)
            const today = new Date()
            const age = today.getFullYear() - birthDate.getFullYear()
            if (age < 16 || age > 80) {
              newErrors.date_of_birth = "Age must be between 16 and 80 years"
            }
          }
          return
        }

        if (field === "emergency_contact_number") {
          if (!formData.emergency_contact_number || formData.emergency_contact_number.trim() === "") {
            newErrors.emergency_contact_number = "Emergency contact number is required"
          } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.emergency_contact_number.trim())) {
            newErrors.emergency_contact_number = "Please enter a valid phone number (10-15 digits)"
          }
          return
        }

        // Driving details validation for Equipment courses
        if (field === "driving_license_no") {
          if (!formData.driving_details.driving_license_no || formData.driving_details.driving_license_no.trim() === "") {
            newErrors.driving_license_no = "Driving license number is required for Equipment courses"
          }
          return
        }

        if (field === "driving_class") {
          if (!formData.driving_details.driving_class || formData.driving_details.driving_class.trim() === "") {
            newErrors.driving_class = "Driving license class is required for Equipment courses"
          }
          return
        }

        if (field === "driving_issue_date") {
          if (!formData.driving_details.issue_date) {
            newErrors.driving_issue_date = "Driving license issue date is required for Equipment courses"
          } else {
            const issueDate = new Date(formData.driving_details.issue_date)
            const today = new Date()
            if (issueDate > today) {
              newErrors.driving_issue_date = "Issue date cannot be in the future"
            }
          }
          return
        }

        // File fields are now optional - students can upload later
        const isFileField = ["nic_document", "passport_document", "photo"].includes(field)
        if (isFileField) {
          // Skip file validation - make images optional
          return
        }

        // General required field validation
        if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
          // Skip certain optional fields
          const optionalFields = ["company"]
          
          // Skip checkbox fields since false is a valid value
          const checkboxFields = ["is_swimmer", "is_slpa_employee"]
          
          // Skip SLPA-specific fields when SLPA employee is not checked
          const slpaSpecificFields = ["department", "sea_service", "cdc_number"]
          const shouldSkipSlpaField = slpaSpecificFields.includes(field) && !formData.is_slpa_employee
          
          if (!optionalFields.includes(field) && !checkboxFields.includes(field) && !shouldSkipSlpaField) {
            newErrors[field] = `${field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} is required`
          }
        }
      })

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [formData, formSections, slpaFields, hasEquipmentCourses],
  )

  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target

    if (type === "file" && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }))
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }))
    } else if (name.startsWith("driving_details.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        driving_details: {
          ...prev.driving_details,
          [field]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }, [])

  // Handle course selection
  const handleCourseSelect = useCallback((courseId) => {
    setFormData((prev) => ({
      ...prev,
      selected_courses: prev.selected_courses.includes(courseId)
        ? prev.selected_courses.filter((id) => id !== courseId)
        : [...prev.selected_courses, courseId],
    }))
  }, [])

  // Remove a selected course
  const removeCourse = useCallback((courseId) => {
    setFormData((prev) => ({
      ...prev,
      selected_courses: prev.selected_courses.filter((id) => id !== courseId),
    }))
  }, [])

  // Filter courses based on search input
  const filteredCourses = useMemo(
    () => courses.filter((course) => course.courseName.toLowerCase().includes(courseFilter.toLowerCase())),
    [courses, courseFilter],
  )

  // Handle form submission for create/update
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      if (!validateForm(currentStep)) {
        return
      }

      setLoading(true)
      setErrorMessage("")

      try {
        const formDataObj = new FormData()

        Object.entries(formData).forEach(([key, value]) => {
          if (key === "driving_details") {
            formDataObj.append(key, JSON.stringify(value))
          } else if (key === "selected_courses") {
            formDataObj.append("course_ids", JSON.stringify(value))
          } else if (key === "is_swimmer" || key === "is_slpa_employee") {
            formDataObj.append(key, value ? "true" : "false")
          } else if (value instanceof File) {
            if (key === "nic_document") {
              formDataObj.append("nic_document", value)
            } else if (key === "passport_document") {
              formDataObj.append("passport_document", value)
            } else if (key === "photo") {
              formDataObj.append("photo", value)
            } else {
              formDataObj.append(key, value)
            }
          } else if (typeof value !== "undefined" && value !== null) {
            formDataObj.append(key, value)
          }
        })

        if (formData.selected_courses.length > 0) {
          formDataObj.append("primary_course_id", formData.selected_courses[0])
        }

        let response

        if (editingStudent) {
          response = await authRequest("put", `http://localhost:5003/api/students/${editingStudent}`, formDataObj, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          if (response.success) {
            setNotificationMessage("Student updated successfully!")
            setShowSuccessNotification(true)
          }
        } else {
          response = await authRequest("post", "http://localhost:5003/api/students", formDataObj, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          if (response.success) {
            const studentMessage = response.studentId 
              ? `Student registered successfully!\nStudent ID: ${response.studentId}\n\nStudent will receive a formatted code when assigned to a batch.`
              : "Student registered successfully!";
            
            setNotificationMessage(studentMessage)
            setShowSuccessNotification(true)
            
            // Also log the student ID for easy copying
            if (response.studentId) {
              console.log(`🎓 New Student ID: ${response.studentId}`);
            }
          }
        }

        resetForm()
        fetchStudents()
        setCurrentView("dashboard")

        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 3000)
      } catch (error) {
        console.error("Error processing student:", error)
        setErrorMessage(error.response?.data?.error || "Failed to process student data. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [currentStep, validateForm, formData, editingStudent, resetForm, fetchStudents],
  )

  // Navigate to previous form step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Navigate to next form step
  const nextStep = useCallback(() => {
    if (validateForm(currentStep)) {
      if (currentStep < formSections.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }, [currentStep, validateForm, formSections.length])

  // Sort students
  const handleSort = useCallback(
    (field) => {
      setSortDirection((prev) => (sortField === field && prev === "asc" ? "desc" : "asc"))
      setSortField(field)
    },
    [sortField],
  )

  // Get sort icon for table headers
  const getSortIcon = useCallback(
    (field) => {
      if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
      return sortDirection === "asc" ? (
        <ArrowUp className="w-4 h-4 text-blue-600" />
      ) : (
        <ArrowDown className="w-4 h-4 text-blue-600" />
      )
    },
    [sortField, sortDirection],
  )

  // Filter and sort students
  const getFilteredAndSortedStudents = useMemo(() => {
    let filtered = students

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = students.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.id_number?.toLowerCase().includes(term) ||
          extractCourseIds(student.enrolled_courses)?.toLowerCase().includes(term),
      )
    }

    return filtered.sort((a, b) => {
      if (!a[sortField]) return sortDirection === "asc" ? 1 : -1
      if (!b[sortField]) return sortDirection === "asc" ? -1 : 1

      if (typeof a[sortField] === "string") {
        return sortDirection === "asc"
          ? a[sortField].localeCompare(b[sortField])
          : b[sortField].localeCompare(a[sortField])
      }

      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    })
  }, [students, searchTerm, sortField, sortDirection])

  // Generate search suggestions
  const generateSearchSuggestions = useCallback((term) => {
    if (!term || term.length < 2) return []
    
    const suggestions = []
    const lowerTerm = term.toLowerCase()
    
    students.forEach(student => {

      
      // Add name suggestions
      if (student.full_name && student.full_name.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'name',
          value: student.full_name,
          label: `Name: ${student.full_name}`,
          student: student,
          icon: 'user'
        })
      }
      
      // Add email suggestions
      if (student.email && student.email.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'email',
          value: student.email,
          label: `Email: ${student.email}`,
          student: student,
          icon: 'mail'
        })
      }
      
      // Add ID number suggestions
      if (student.id_number && student.id_number.toLowerCase().includes(lowerTerm)) {
        suggestions.push({
          type: 'id_number',
          value: student.id_number,
          label: `${student.identification_type}: ${student.id_number}`,
          student: student,
          icon: 'card'
        })
      }
    })
    
    // Remove duplicates and limit to 8 suggestions
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
    )
    
    return uniqueSuggestions.slice(0, 8)
  }, [students])

  // Handle search input change with suggestions
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedSuggestionIndex(-1) // Reset selection when typing
    
    if (value.length >= 2) {
      const suggestions = generateSearchSuggestions(value)
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
    } else {
      setShowSearchSuggestions(false)
      setSearchSuggestions([])
    }
  }, [generateSearchSuggestions])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchTerm(suggestion.value)
    setShowSearchSuggestions(false)
    setSearchSuggestions([])
    setSelectedSuggestionIndex(-1)
    setCurrentPage(1)
  }, [])

  // Handle search input focus
  const handleSearchFocus = useCallback(() => {
    if (searchTerm.length >= 2) {
      const suggestions = generateSearchSuggestions(searchTerm)
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(suggestions.length > 0)
      setSelectedSuggestionIndex(-1)
    }
  }, [searchTerm, generateSearchSuggestions])

  // Handle keyboard navigation for search suggestions
  const handleSearchKeyDown = useCallback((e) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSearchSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showSearchSuggestions, searchSuggestions, selectedSuggestionIndex, handleSuggestionSelect])

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const currentStudents = getFilteredAndSortedStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  const totalPages = Math.ceil(getFilteredAndSortedStudents.length / studentsPerPage)

  // Export student data as CSV
  const exportStudentsAsCSV = useCallback(() => {
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Identification",
      "Nationality",
      "Courses",
      "Status",
      "Registration Date",
    ]

    const rows = getFilteredAndSortedStudents.map((student) => [
      student.id,
      student.full_name,
      student.email,
      `${student.identification_type}: ${student.id_number}`,
      student.nationality,
      extractCourseIds(student.enrolled_courses) || "",
      student.status || "Active",
      student.registration_date ? new Date(student.registration_date).toLocaleDateString() : "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `students_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [getFilteredAndSortedStudents])

  // Memoized calculations
  const totalStudents = useMemo(() => students.length, [students])
  const activeStudents = useMemo(() => students.filter((s) => s.status === "Active" || !s.status).length, [students])
  const slpaEmployees = useMemo(
    () => students.filter((s) => s.is_slpa_employee === 1 || s.is_slpa_employee === true).length,
    [students],
  )
  const totalCourses = useMemo(() => courses.length, [courses])

  // Render the appropriate form fields based on the current step
  const renderFormFields = () => {
    const currentFields = formSections[currentStep].fields

    return (
      <div className="space-y-6">
        {currentFields.map((field) => {
          if (field === "full_name") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name *
                </Label>
                <Input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.full_name ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.full_name && <div className="text-sm text-red-500 font-semibold">{errors.full_name}</div>}
              </div>
            )
          }

          if (field === "email") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.email ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.email && <div className="text-sm text-red-500 font-semibold">{errors.email}</div>}
              </div>
            )
          }

          if (field === "identification_type") {
            return (
              <div key={field} className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Identification Document *
                </Label>
                <RadioGroup
                  value={formData.identification_type}
                  onValueChange={(value) => setFormData({ ...formData, identification_type: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NIC" id="nic" />
                    <Label htmlFor="nic" className="text-sm font-semibold">
                      NIC
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Passport" id="passport" />
                    <Label htmlFor="passport" className="text-sm font-semibold">
                      Passport
                    </Label>
                  </div>
                </RadioGroup>
                {errors.identification_type && (
                  <div className="text-sm text-red-500 font-semibold">{errors.identification_type}</div>
                )}
              </div>
            )
          }

          if (field === "id_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="id_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  {formData.identification_type} Number *
                </Label>
                <Input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder={`Enter ${formData.identification_type} number`}
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.id_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.id_number && <div className="text-sm text-red-500 font-semibold">{errors.id_number}</div>}
              </div>
            )
          }

          if (field === "nationality") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="nationality" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Nationality *
                </Label>
                <Input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Enter nationality"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.nationality ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.nationality && <div className="text-sm text-red-500 font-semibold">{errors.nationality}</div>}
              </div>
            )
          }

          if (field === "date_of_birth") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Date of Birth *
                </Label>
                <Input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.date_of_birth ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.date_of_birth && (
                  <div className="text-sm text-red-500 font-semibold">{errors.date_of_birth}</div>
                )}
              </div>
            )
          }

          if (field === "country") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Country
                </Label>
                <Input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.country ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.country && <div className="text-sm text-red-500 font-semibold">{errors.country}</div>}
              </div>
            )
          }

          if (field === "cdc_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="cdc_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  CDC Number
                </Label>
                <Input
                  type="text"
                  id="cdc_number"
                  name="cdc_number"
                  value={formData.cdc_number}
                  onChange={handleChange}
                  placeholder="Enter CDC number (if applicable)"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.cdc_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.cdc_number && <div className="text-sm text-red-500 font-semibold">{errors.cdc_number}</div>}
              </div>
            )
          }

          if (field === "address") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Address *
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  rows={3}
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.address ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.address && <div className="text-sm text-red-500 font-semibold">{errors.address}</div>}
              </div>
            )
          }

          if (field === "department") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Department/Rank
                </Label>
                <Input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department or rank"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.department ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.department && <div className="text-sm text-red-500 font-semibold">{errors.department}</div>}
              </div>
            )
          }

          if (field === "company") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Company (if employed)
                </Label>
                <Input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.company ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.company && <div className="text-sm text-red-500 font-semibold">{errors.company}</div>}
              </div>
            )
          }

          if (field === "sea_service") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="sea_service" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Ship className="w-4 h-4 text-blue-600" />
                  Sea Services (Year/Month if applicable)
                </Label>
                <Input
                  type="text"
                  id="sea_service"
                  name="sea_service"
                  value={formData.sea_service}
                  onChange={handleChange}
                  placeholder="Example: 2Y/6M"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.sea_service ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.sea_service && <div className="text-sm text-red-500 font-semibold">{errors.sea_service}</div>}
              </div>
            )
          }

          if (field === "emergency_contact_name") {
            return (
              <div key={field} className="space-y-2">
                <Label
                  htmlFor="emergency_contact_name"
                  className="flex items-center gap-2 text-sm font-bold text-slate-700"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  Emergency Contact Name *
                </Label>
                <Input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Enter emergency contact name"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.emergency_contact_name ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.emergency_contact_name && (
                  <div className="text-sm text-red-500 font-semibold">{errors.emergency_contact_name}</div>
                )}
              </div>
            )
          }

          if (field === "emergency_contact_number") {
            return (
              <div key={field} className="space-y-2">
                <Label
                  htmlFor="emergency_contact_number"
                  className="flex items-center gap-2 text-sm font-bold text-slate-700"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  Emergency Contact Number *
                </Label>
                <Input
                  type="text"
                  id="emergency_contact_number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleChange}
                  placeholder="Enter emergency contact number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.emergency_contact_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.emergency_contact_number && (
                  <div className="text-sm text-red-500 font-semibold">{errors.emergency_contact_number}</div>
                )}
              </div>
            )
          }

          if (field === "is_swimmer") {
            return (
              <div
                key={field}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg"
              >
                <Checkbox
                  id="is_swimmer"
                  checked={formData.is_swimmer}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_swimmer: checked })}
                  className="border-2 border-blue-400"
                />
                <Label htmlFor="is_swimmer" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Waves className="w-4 h-4 text-blue-600" />
                  Student can swim
                </Label>
              </div>
            )
          }

          if (field === "is_slpa_employee") {
            return (
              <div
                key={field}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 shadow-lg"
              >
                <Checkbox
                  id="is_slpa_employee"
                  checked={formData.is_slpa_employee}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_slpa_employee: checked })}
                  className="border-2 border-purple-400"
                />
                <Label htmlFor="is_slpa_employee" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Student is an SLPA employee
                </Label>
              </div>
            )
          }

          if (field === "selected_courses") {
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Select Courses *
                  </Label>
                  {errorMessage && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      {errorMessage}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchCourses}
                        disabled={coursesLoading}
                        className="border-2 shadow-lg"
                      >
                        <RotateCcw className="w-4 h-4" /> Retry
                      </Button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={cn(
                      "min-h-[50px] border-2 rounded-xl p-3 cursor-pointer flex flex-wrap gap-2 items-center shadow-lg backdrop-blur-sm",
                      errors.selected_courses ? "border-red-500" : "border-slate-200",
                      coursesLoading ? "opacity-50" : "hover:border-blue-400",
                    )}
                    onClick={() => !coursesLoading && setShowCourseOptions(true)}
                    ref={courseInputRef}
                  >
                    {formData.selected_courses.length > 0 ? (
                      formData.selected_courses.map((courseId) => {
                        const course = courses.find((c) => c.id === courseId)
                        return course ? (
                          <Badge
                            key={courseId}
                            variant="secondary"
                            className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 font-semibold px-3 py-1 shadow-lg"
                          >
                            {course.courseName}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCourse(courseId)
                              }}
                            />
                          </Badge>
                        ) : null
                      })
                    ) : coursesLoading ? (
                      <span className="text-slate-500 font-semibold">Loading courses...</span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Click to select courses</span>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                  </div>
                  {errors.selected_courses && (
                    <div className="text-sm text-red-500 font-semibold">{errors.selected_courses}</div>
                  )}

                  {showCourseOptions && !coursesLoading && (
                    <div
                      className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-auto"
                      ref={courseOptionsRef}
                    >
                      <div className="p-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search courses..."
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border-0 p-0 focus:ring-0 text-sm font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <div
                            key={course.id}
                            className={cn(
                              "p-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-sm font-semibold transition-all duration-200",
                              formData.selected_courses.includes(course.id)
                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700"
                                : "text-slate-700",
                            )}
                            onClick={() => handleCourseSelect(course.id)}
                          >
                            {course.courseName}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-slate-500 text-sm font-semibold">No courses found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Equipment Course Indicator */}
                {hasEquipmentCourses && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                      <Ship className="w-4 h-4" />
                      Equipment courses selected - Additional driving details will be required in the next step
                    </div>
                  </div>
                )}
              </div>
            )
          }

          if (field === "nic_document") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="nic_document" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  NIC Document - Optional
                </Label>
                <div className="text-xs text-slate-500 mb-2">
                  You can upload this later if needed
                </div>
                <Input
                  type="file"
                  id="nic_document"
                  name="nic_document"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.nic_document ? "border-red-500" : "border-slate-200",
                  )}
                />
                {formData.nic_document && (
                  <div className="text-sm text-slate-600 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200">
                    Selected: {formData.nic_document.name}
                  </div>
                )}
                {errors.nic_document && <div className="text-sm text-red-500 font-semibold">{errors.nic_document}</div>}
              </div>
            )
          }

          if (field === "passport_document") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="passport_document" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Passport Document - Optional
                </Label>
                <div className="text-xs text-slate-500 mb-2">
                  You can upload this later if needed
                </div>
                <Input
                  type="file"
                  id="passport_document"
                  name="passport_document"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.passport_document ? "border-red-500" : "border-slate-200",
                  )}
                />
                {formData.passport_document && (
                  <div className="text-sm text-slate-600 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200">
                    Selected: {formData.passport_document.name}
                  </div>
                )}
                {errors.passport_document && (
                  <div className="text-sm text-red-500 font-semibold">{errors.passport_document}</div>
                )}
              </div>
            )
          }

          if (field === "photo") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="photo" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Photo (Passport Size) - Optional
                </Label>
                <div className="text-xs text-slate-500 mb-2">
                  You can upload this later if needed
                </div>
                <Input
                  type="file"
                  id="photo"
                  name="photo"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.photo ? "border-red-500" : "border-slate-200",
                  )}
                />
                {formData.photo && (
                  <div className="text-sm text-slate-600 font-semibold bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200">
                    Selected: {formData.photo.name}
                  </div>
                )}
                {errors.photo && <div className="text-sm text-red-500 font-semibold">{errors.photo}</div>}
              </div>
            )
          }

          return null
        })}

        {/* Display SLPA employee details when checkbox is checked */}
        {currentStep === 3 && formData.is_slpa_employee && (
          <div className="p-6 border-2 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
              <Building className="w-5 h-5" />
              SLPA Employee Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Designation *
                </Label>
                <Input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.designation ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.designation && <div className="text-sm text-red-500 font-semibold">{errors.designation}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="division" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Division *
                </Label>
                <Input
                  type="text"
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  placeholder="Enter division"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.division ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.division && <div className="text-sm text-red-500 font-semibold">{errors.division}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_no" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Service No *
                </Label>
                <Input
                  type="text"
                  id="service_no"
                  name="service_no"
                  value={formData.service_no}
                  onChange={handleChange}
                  placeholder="Enter service number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.service_no ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.service_no && <div className="text-sm text-red-500 font-semibold">{errors.service_no}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="section_unit" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Section/Unit *
                </Label>
                <Input
                  type="text"
                  id="section_unit"
                  name="section_unit"
                  value={formData.section_unit}
                  onChange={handleChange}
                  placeholder="Enter section or unit"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.section_unit ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.section_unit && <div className="text-sm text-red-500 font-semibold">{errors.section_unit}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Department/Rank *
                </Label>
                <Input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department or rank"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.department ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.department && <div className="text-sm text-red-500 font-semibold">{errors.department}</div>}
            </div>

              <div className="space-y-2">
                <Label htmlFor="sea_service" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Ship className="w-4 h-4 text-blue-600" />
                  Sea Services (Year/Month) *
                </Label>
                <Input
                  type="text"
                  id="sea_service"
                  name="sea_service"
                  value={formData.sea_service}
                  onChange={handleChange}
                  placeholder="Example: 2Y/6M"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.sea_service ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.sea_service && <div className="text-sm text-red-500 font-semibold">{errors.sea_service}</div>}
          </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cdc_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  CDC Number *
                </Label>
                <Input
                  type="text"
                  id="cdc_number"
                  name="cdc_number"
                  value={formData.cdc_number}
                  onChange={handleChange}
                  placeholder="Enter CDC number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.cdc_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.cdc_number && <div className="text-sm text-red-500 font-semibold">{errors.cdc_number}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Display Equipment Course Driving Details when Equipment courses are selected */}
        {currentStep === 3 && hasEquipmentCourses && (
          <div className="p-6 border-2 rounded-2xl bg-gradient-to-r from-orange-50 via-yellow-50 to-amber-50 border-orange-300 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-orange-900 flex items-center gap-2">
              <Ship className="w-5 h-5" />
              Equipment Course Requirements - Driving Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driving_license_no" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  Driving License Number *
                </Label>
                <Input
                  type="text"
                  id="driving_license_no"
                  name="driving_details.driving_license_no"
                  value={formData.driving_details.driving_license_no}
                  onChange={handleChange}
                  placeholder="Enter driving license number"
                  className={cn(
                    "border-2 focus:border-orange-500 focus:ring-orange-500 shadow-lg",
                    errors.driving_license_no ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.driving_license_no && <div className="text-sm text-red-500 font-semibold">{errors.driving_license_no}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driving_class" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-orange-600" />
                  Driving License Class *
                </Label>
                <Input
                  type="text"
                  id="driving_class"
                  name="driving_details.driving_class"
                  value={formData.driving_details.driving_class}
                  onChange={handleChange}
                  placeholder="Enter driving license class (e.g., B, C, D)"
                  className={cn(
                    "border-2 focus:border-orange-500 focus:ring-orange-500 shadow-lg",
                    errors.driving_class ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.driving_class && <div className="text-sm text-red-500 font-semibold">{errors.driving_class}</div>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="driving_issue_date" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  License Issue Date *
                </Label>
                <Input
                  type="date"
                  id="driving_issue_date"
                  name="driving_details.issue_date"
                  value={formData.driving_details.issue_date}
                  onChange={handleChange}
                  className={cn(
                    "border-2 focus:border-orange-500 focus:ring-orange-500 shadow-lg",
                    errors.driving_issue_date ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.driving_issue_date && <div className="text-sm text-red-500 font-semibold">{errors.driving_issue_date}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Dashboard View - Optimized
  const renderDashboard = () => (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex-shrink-0">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-black gradient-text whitespace-nowrap">Student Management Dashboard</h1>
                <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
                  <Target className="h-3 w-3 flex-shrink-0" />
                  Comprehensive maritime training student management system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={exportStudentsAsCSV}
                className="gap-2 border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl font-bold transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  // Reset form state before switching to registration
                  setFormData({
                    full_name: "",
                    email: "",
                    identification_type: "NIC",
                    id_number: "",
                    nationality: "",
                    date_of_birth: "",
                    country: "",
                    cdc_number: "",
                    address: "",
                    department: "",
                    company: "",
                    sea_service: "",
                    emergency_contact_name: "",
                    emergency_contact_number: "",
                    is_swimmer: false,
                    is_slpa_employee: false,
                    designation: "",
                    division: "",
                    service_no: "",
                    section_unit: "",
                    selected_courses: [],
                    nic_document: null,
                    passport_document: null,
                    photo: null,
                    driving_details: {
                      driving_license_no: "",
                      driving_class: "",
                      issue_date: "",
                    },
                  })
                  setCurrentStep(0)
                  setEditingStudent(null)
                  setErrors({})
                  setErrorMessage("")
                  setCurrentView("registration")
                  navigate("/student-registration", { replace: true })
                }}
                className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </div>



        {/* Students Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-2xl font-black gradient-text flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                Registered Students
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search by name, email, ID number, or courses..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 pr-10 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl font-semibold"
                    autoComplete="off"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setShowSearchSuggestions(false)
                        setSearchSuggestions([])
                        setSelectedSuggestionIndex(-1)
                        setCurrentPage(1)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                  
                  {/* Search Suggestions Dropdown */}
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <div
                      ref={searchSuggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-auto"
                    >
                      <div className="p-2">
                        <div className="text-xs text-slate-500 font-semibold mb-2 px-2">Search Suggestions</div>
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.type}-${suggestion.value}-${index}`}
                            className={cn(
                              "flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all duration-200",
                              index === selectedSuggestionIndex
                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300"
                                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                            )}
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            <div className="flex-shrink-0">
                              {suggestion.icon === 'id' && <CreditCard className="w-4 h-4 text-blue-600" />}
                              {suggestion.icon === 'user' && <User className="w-4 h-4 text-green-600" />}
                              {suggestion.icon === 'mail' && <Mail className="w-4 h-4 text-purple-600" />}
                              {suggestion.icon === 'card' && <CreditCard className="w-4 h-4 text-orange-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">
                                {suggestion.label}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {suggestion.student.full_name}
                                {suggestion.student.primary_student_code && ` • ${suggestion.student.primary_student_code}`}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                suggestion.type === 'student_code' ? "bg-blue-500" :
                                suggestion.type === 'name' ? "bg-green-500" :
                                suggestion.type === 'email' ? "bg-purple-500" : "bg-orange-500"
                              )} />
                                                         </div>
                           </div>
                         ))}
                         
                         {/* Keyboard Navigation Hint */}
                         <div className="border-t border-slate-100 px-3 py-2 mt-1">
                           <div className="text-xs text-slate-400 font-medium">
                             Use ↑↓ to navigate, Enter to select, Esc to close
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                </div>
                <Button
                  variant="outline"
                  onClick={fetchStudents}
                  disabled={studentsLoading}
                  className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${studentsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Add record selector before the table */}
            <div className="flex justify-between items-center mb-4">
              <RecordsPerPageSelector
                value={studentsPerPage}
                onChange={(value) => {
                  setStudentsPerPage(value)
                  setCurrentPage(1)
                }}
                options={recordsPerPageOptions}
              />

              {students.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-3 py-1 font-semibold"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  {getFilteredAndSortedStudents.length} students found
                </Badge>
              )}
            </div>
            {studentsLoading ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl inline-block mb-6">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600" />
                </div>
                <h3 className="text-2xl font-black gradient-text mb-3">Loading students...</h3>
                <p className="text-slate-600 font-semibold text-lg">Please wait while we fetch the student data</p>
              </div>
            ) : studentsError ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-3xl inline-block mb-6">
                  <AlertTriangle className="mx-auto h-16 w-16 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-red-700 mb-3">Error Loading Students</h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">{studentsError}</p>
                <Button
                  onClick={fetchStudents}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto" ref={tableRef}>
                  <table className="w-full border-collapse">
                    <TableHeader onSort={handleSort} sortField={sortField} sortDirection={sortDirection} />
                    <tbody>
                      {currentStudents.length > 0 ? (
                        currentStudents.map((student) => (
                          <StudentRow
                            key={student.id}
                            student={student}
                            onView={handleViewStudent}
                            onEdit={handleEditStudent}
                            onDelete={handleDeleteStudent}
                            onSendPasswordReset={handleSendPasswordReset}
                            confirmDeleteId={confirmDeleteId}
                            loading={loading}
                            coursesMap={coursesMap}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-16 text-center">
                            <div className="p-6 bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 rounded-3xl inline-block mb-6">
                              <Users className="mx-auto h-16 w-16 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black gradient-text mb-3">
                              {searchTerm ? "No students found" : "No students registered"}
                            </h3>
                            <p className="text-slate-600 font-semibold text-lg">
                              {searchTerm
                                ? "No students match your search criteria."
                                : "Start by adding your first student to the system."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {currentStudents.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    indexOfFirstStudent={indexOfFirstStudent}
                    indexOfLastStudent={indexOfLastStudent}
                    totalItems={getFilteredAndSortedStudents.length}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Registration Form View
  const renderRegistrationForm = () => {
    return (
      <div className="hardware-accelerated min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-xl">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black gradient-text">
                    {editingStudent ? "Edit Student" : "Student Registration"}
                  </h1>
                  <p className="text-slate-600 text-lg font-semibold mt-1">
                    {editingStudent ? "Update student information" : "Add a new student to the system"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView("dashboard")}
                className="gap-2 border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Enhanced Registration Form */}
          <Card className="animate-fade-in stagger-1 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-black gradient-text">Registration Form</span>
                {editingStudent && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 font-bold px-4 py-2 text-sm"
                  >
                    Editing Student ID: {editingStudent}
                  </Badge>
                )}
              </CardTitle>

              {/* Enhanced Progress Steps */}
              <div className="flex items-center justify-between mt-6 overflow-x-auto">
                {formSections.map((section, index) => {
                  const SectionIcon = section.icon
                  return (
                    <div key={index} className="flex items-center min-w-0">
                      <div
                        className={cn(
                          "form-step w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl border-2",
                          index <= currentStep
                            ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
                        )}
                        onClick={() => {
                          // Allow jumping to any step if current step is valid or if going to a previous step
                          if (index <= currentStep || validateForm(currentStep)) {
                            setCurrentStep(index)
                          }
                        }}
                        title={`Go to ${section.title}`}
                      >
                        <SectionIcon className="w-6 h-6" />
                      </div>
                      <span
                        className={cn(
                          "ml-3 text-sm whitespace-nowrap transition-all duration-300 cursor-pointer font-bold",
                          index <= currentStep ? "text-blue-600" : "text-slate-500 hover:text-slate-700",
                        )}
                        onClick={() => {
                          // Allow jumping to any step if current step is valid or if going to a previous step
                          if (index <= currentStep || validateForm(currentStep)) {
                            setCurrentStep(index)
                          }
                        }}
                        title={`Go to ${section.title}`}
                      >
                        {section.title}
                      </span>
                      {index < formSections.length - 1 && (
                        <div
                          className={cn(
                            "w-12 h-1 mx-4 transition-all duration-300 rounded-full",
                            index < currentStep
                              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                              : "bg-slate-200",
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {errorMessage && (
                <Alert className="mb-6 border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-semibold text-base">{errorMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-6 gradient-text flex items-center gap-3">
                    {(() => {
                      const Icon = formSections[currentStep].icon
                      return <Icon className="h-6 w-6 text-blue-600" />
                    })()}
                    <span>{formSections[currentStep].title}</span>
                    {/* Conditional section indicators */}
                    {currentStep === 3 && (
                      <div className="flex items-center gap-2 text-sm">
                        {formData.is_slpa_employee && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                            <Building className="w-3 h-3 mr-1" />
                            SLPA Employee
                          </Badge>
                        )}
                        {hasEquipmentCourses && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            <Ship className="w-3 h-3 mr-1" />
                            Equipment Course
                          </Badge>
                        )}
                      </div>
                    )}
                  </h2>
                  {renderFormFields()}
                </div>

                {/* Enhanced Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t-2 border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl font-bold shadow-lg transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {currentStep < formSections.length - 1 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl rounded-xl font-bold transition-all duration-300"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl rounded-xl font-bold transition-all duration-300"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {editingStudent ? "Update Student" : "Register Student"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Add error handling for view rendering
  const renderContent = () => {
    try {
      return currentView === "dashboard" ? renderDashboard() : renderRegistrationForm()
    } catch (error) {
      console.error("Error rendering content:", error)
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <Card className="p-8 text-center shadow-lg">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">There was an error displaying the content</p>
            <Button
              onClick={() => {
                setCurrentView("dashboard")
                setErrors({})
                setErrorMessage("")
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Return to Dashboard
            </Button>
          </Card>
        </div>
      )
    }
  }

  // Add additional table functionality for improved user experience

  // Add a useEffect hook to reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortField])

  // Add a useEffect to smooth scroll to top of table when page changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentPage])

  // Handle starting new registration - ensures clean state
  const handleStartNewRegistration = useCallback(() => {
    // Reset all form state
    setFormData({
      full_name: "",
      email: "",
      identification_type: "NIC",
      id_number: "",
      nationality: "",
      date_of_birth: "",
      country: "",
      cdc_number: "",
      address: "",
      department: "",
      company: "",
      sea_service: "",
      emergency_contact_name: "",
      emergency_contact_number: "",
      is_swimmer: false,
      is_slpa_employee: false,
      designation: "",
      division: "",
      service_no: "",
      section_unit: "",
      selected_courses: [],
      nic_document: null,
      passport_document: null,
      photo: null,
      driving_details: {
        driving_license_no: "",
        driving_class: "",
        issue_date: "",
      },
    })
    setCurrentStep(0)
    setEditingStudent(null)
    setErrors({})
    setErrorMessage("")
    setCurrentView("registration")
    // Clear URL parameters
    navigate("/student-registration", { replace: true })
  }, [navigate])

  // Load student data for editing
  const loadStudentForEdit = useCallback(async (studentId) => {
    try {
      setLoading(true)
      const student = await authRequest("get", `http://localhost:5003/api/students/${studentId}`)

      if (student) {
        // Prepare selected courses
        const selectedCourses = student.courses?.map((course) => course.id) || []

        // Populate form data
        setFormData({
          full_name: student.full_name || "",
          email: student.email || "",
          selected_courses: selectedCourses,
          identification_type: student.identification_type || "NIC",
          id_number: student.id_number || "",
          nationality: student.nationality || "",
          date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
          country: student.country || "",
          cdc_number: student.cdc_number || "",
          address: student.address || "",
          department: student.department || "",
          company: student.company || "",
          sea_service: student.sea_service || "",
          emergency_contact_name: student.emergency_contact_name || "",
          emergency_contact_number: student.emergency_contact_number || "",
          is_swimmer: Boolean(student.is_swimmer),
          is_slpa_employee: Boolean(student.is_slpa_employee),
          designation: student.designation || "",
          division: student.division || "",
          service_no: student.service_no || "",
          section_unit: student.section_unit || "",
          nic_document: null,
          passport_document: null,
          photo: null,
          driving_details: (() => {
            // Handle malformed driving_details from database
            if (student.driving_details) {
              try {
                // If it's already an object, use it
                if (typeof student.driving_details === 'object' && !Array.isArray(student.driving_details)) {
                  return {
                    driving_license_no: student.driving_details.driving_license_no || "",
                    driving_class: student.driving_details.driving_class || "",
                    issue_date: student.driving_details.issue_date || "",
                  };
                }
                // If it's a string, try to parse it
                if (typeof student.driving_details === 'string') {
                  const parsed = JSON.parse(student.driving_details);
                  return {
                    driving_license_no: parsed.driving_license_no || "",
                    driving_class: parsed.driving_class || "",
                    issue_date: parsed.issue_date || "",
                  };
                }
              } catch (error) {
                console.warn('Error parsing driving_details:', error);
              }
            }
            // Return default structure
            return {
            driving_license_no: "",
            driving_class: "",
            issue_date: "",
            };
          })(),
        })

        setEditingStudent(studentId)
        setCurrentStep(0)
        setCurrentView("registration")

        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
      setErrorMessage("Failed to load student details for editing.")
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Enhanced Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <Alert className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-2xl backdrop-blur-xl">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="text-emerald-800 font-bold text-base">{notificationMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {renderContent()}
    </div>
  )
}

