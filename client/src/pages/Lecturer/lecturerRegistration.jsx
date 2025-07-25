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
  Award,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead,TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { authRequest } from "../../services/authService"

// Performance optimized CSS
const PERFORMANCE_CSS = `
  .hardware-accelerated {
    transform: translate3d(0, 0, 0);
    will-change: auto;
  }

  .card-transition {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }

  .lecturer-card {
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }

  .lecturer-card:hover {
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
  if (!enrolledCourses) return "Not assigned"
  
  // Since the server returns courseId directly, we just need to handle the string
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
    
    return courseIds || "Not assigned"
  }
  
  return "Not assigned"
}

// Enhanced Course Name Tooltip Component
const CourseTooltip = memo(({ courseIds, coursesMap }) => {
  const extractedCourseIds = extractCourseIds(courseIds)
  
  if (!extractedCourseIds || extractedCourseIds === "Not assigned") {
    return <span className="text-sm font-semibold text-slate-700">Not assigned</span>
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

// Optimized Lecturer Row Component
const LecturerRow = memo(({ lecturer, onView, onEdit, onDelete, onSendPasswordReset, confirmDeleteId, loading, coursesMap }) => {
  const handleView = useCallback(() => onView(lecturer.id), [onView, lecturer.id])
  const handleEdit = useCallback(() => onEdit(lecturer.id), [onEdit, lecturer.id])
  const handleDelete = useCallback(() => onDelete(lecturer.id), [onDelete, lecturer.id])
  const handleCancelDelete = useCallback(() => onDelete(null), [onDelete])
  const handleSendPasswordReset = useCallback(() => onSendPasswordReset(lecturer), [onSendPasswordReset, lecturer])

  return (
    <tr className="table-row border-b border-slate-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-blue-200">
            <AvatarImage src={`/placeholder.svg?height=48&width=48&query=lecturer`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold">
              {lecturer.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "L"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900">{lecturer.full_name}</div>
            <div className="text-sm text-slate-500 font-semibold">
              <span className="text-slate-400">
                ID: {lecturer.id}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm font-semibold text-slate-700">{lecturer.email}</div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div className="font-bold text-slate-900">NIC</div>
          <div className="text-slate-600 font-medium">{lecturer.id_number || "N/A"}</div>
        </div>
      </td>
      <td className="p-4">
        <CourseTooltip courseIds={lecturer.assigned_courses} coursesMap={coursesMap} />
      </td>
      <td className="p-4">
        <Badge
          variant="outline"
          className={cn(
            "font-bold px-3 py-1",
            lecturer.status === "Active" || !lecturer.status
              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300"
              : "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300",
          )}
        >
          <Activity className="h-3 w-3 mr-1" />
          {lecturer.status || "Active"}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleView}
            className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 border transition-colors"
            title="View Lecturer"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-1 hover:bg-emerald-50 hover:border-emerald-300 border transition-colors"
            title="Edit Lecturer"
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
          {confirmDeleteId === lecturer.id ? (
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
              title="Delete Lecturer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
})

LecturerRow.displayName = "LecturerRow"

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

// Enhanced Success Notification Component
const SuccessNotification = memo(({ isVisible, message, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Card className="border-0 shadow-2xl bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">{message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
})

SuccessNotification.displayName = "SuccessNotification"

// Records Per Page Selector Component
const RecordsPerPageSelector = memo(({ value, onChange, options }) => {
  return (
    <div className="flex items-center gap-2">
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

// Pagination Controls Component
const PaginationControls = memo(
  ({ currentPage, totalPages, indexOfFirstLecturer, indexOfLastLecturer, totalItems, onPageChange }) => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
        <div className="text-sm text-slate-600 font-semibold">
          Showing {indexOfFirstLecturer + 1} to {Math.min(indexOfLastLecturer, totalItems)} of {totalItems} lecturers
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={
                  currentPage === pageNum
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200"
                }
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
            className="border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }
)

PaginationControls.displayName = "PaginationControls"

export default function LecturerManagementSystem() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Add performance CSS to document head - Optimized
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = PERFORMANCE_CSS
    style.id = "lecturer-management-performance-css"

    // Remove existing style if present
    const existingStyle = document.getElementById("lecturer-management-performance-css")
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    document.head.appendChild(style)
    return () => {
      const styleToRemove = document.getElementById("lecturer-management-performance-css")
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

  // Lecturer list state
  const [lecturers, setLecturers] = useState([])
  const [lecturersLoading, setLecturersLoading] = useState(false)
  const [lecturersError, setLecturersError] = useState("")
  const [editingLecturer, setEditingLecturer] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("full_name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const recordsPerPageOptions = [5, 10, 25, 50]
  const [lecturersPerPage, setLecturersPerPage] = useState(5)
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

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    selected_courses: [],
    id_number: "",
    date_of_birth: "",
    address: "",
    phone: "",
    cdc_number: "",
    category: "",
    vehicle_number: "",
    status: "Active",
    bank_name: "",
    branch_name: "",
    account_number: "",
    highest_qualification: "",
    other_qualifications: "",

    work_experiences: [
      {
        institution: "",
        position: "",
        start_year: "",
        end_year: "",
        department: "",
        is_current: false
      }
    ],
    nic_file: null,
    photo_file: null,
    education_certificate_file: null,
    cdc_book_file: null,
    driving_trainer_license_file: null,
  })

  const [errors, setErrors] = useState({})

  // Form sections matching student structure but adapted for lecturers
  const formSections = useMemo(
    () => [
      {
        title: "Personal Information",
        icon: User,
        fields: ["full_name", "email", "id_number", "date_of_birth", "address", "phone", "cdc_number", "vehicle_number"],
      },
      {
        title: "Academic & Experience",
        icon: Award,
        fields: ["highest_qualification", "other_qualifications"],
      },
      {
        title: "Professional Experience",
        icon: Building,
        fields: ["work_experiences"],
      },
      {
        title: "Courses & Teaching",
        icon: GraduationCap,
        fields: ["selected_courses", "category", "status"],
      },
      {
        title: "Banking & Documents",
        icon: FileText,
        fields: ["bank_name", "branch_name", "account_number", "nic_file", "photo_file", "education_certificate_file"],
      },
    ],
    [],
  )

  // Reset form to default values
  const resetForm = useCallback(() => {
    setFormData({
      full_name: "",
      email: "",
      selected_courses: [],
      id_number: "",
      date_of_birth: "",
      address: "",
      phone: "",
      cdc_number: "",
      category: "",
      vehicle_number: "",
      status: "Active",
      bank_name: "",
      branch_name: "",
      account_number: "",
      highest_qualification: "",
      other_qualifications: "",
 
      work_experiences: [
        {
          institution: "",
          position: "",
          start_year: "",
          end_year: "",
          department: "",
          is_current: false
        }
      ],
      nic_file: null,
      photo_file: null,
      education_certificate_file: null,
      cdc_book_file: null,
      driving_trainer_license_file: null,
    })
    setCurrentStep(0)
    setEditingLecturer(null)
    setErrors({})
    setCurrentView("dashboard")
    // Clear URL parameters
    navigate("/lecturer-registration", { replace: true })
  }, [navigate])

  // Form validation matching student validation but adapted for lecturers
  const validateForm = useCallback(
    (step) => {
      const newErrors = {}
      const fieldsToValidate = formSections[step].fields

      fieldsToValidate.forEach((field) => {
        if (field === "selected_courses") {
          if (formData.selected_courses.length === 0) {
            newErrors.selected_courses = "Please select at least one course"
          }
          return
        }

        if (field === "work_experiences") {
          if (!formData.work_experiences || formData.work_experiences.length === 0) {
            newErrors.work_experiences = "Please add at least one work experience"
          } else {
            // Validate each work experience
            const hasInvalidExperience = formData.work_experiences.some((exp, index) => {
              if (!exp.institution || !exp.institution.trim()) {
                newErrors[`work_experience_${index}_institution`] = "Institution is required"
                return true
              }
              if (!exp.position || !exp.position.trim()) {
                newErrors[`work_experience_${index}_position`] = "Position is required"
                return true
              }
              if (!exp.start_year) {
                newErrors[`work_experience_${index}_start_year`] = "Start year is required"
                return true
              }
              if (!exp.is_current && (!exp.end_year || exp.end_year <= exp.start_year)) {
                newErrors[`work_experience_${index}_end_year`] = "End year must be after start year"
                return true
              }
              return false
            })
            
            if (hasInvalidExperience) {
              newErrors.work_experiences = "Please complete all work experience fields"
            }
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
            newErrors.id_number = "NIC number is required"
          } else {
            // NIC validation for Sri Lanka format
            const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/
            if (!nicPattern.test(formData.id_number.trim())) {
              newErrors.id_number = "Please enter a valid NIC number (9 digits + V/X or 12 digits)"
            }
          }
          return
        }

        if (field === "phone") {
          if (!formData.phone || formData.phone.trim() === "") {
            newErrors.phone = "Phone number is required"
          } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phone.trim())) {
            newErrors.phone = "Please enter a valid phone number (10-15 digits)"
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
            if (age < 21 || age > 70) {
              newErrors.date_of_birth = "Age must be between 21 and 70 years for lecturers"
            }
          }
          return
        }

        // File fields are optional
        const isFileField = ["nic_file", "photo_file", "education_certificate_file", "cdc_book_file", "driving_trainer_license_file"].includes(field)
        if (isFileField) {
          return
        }

        // General required field validation
        if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
          // Skip certain optional fields
          const optionalFields = ["cdc_number", "vehicle_number"]
          
          if (!optionalFields.includes(field)) {
            newErrors[field] = `${field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} is required`
          }
        }
      })

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [formData, formSections],
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

  // Fetch lecturers function - moved here to fix initialization order
  const fetchLecturers = useCallback(async () => {
    try {
      setLecturersLoading(true)
      setLecturersError("")

      const response = await authRequest("get", "http://localhost:5003/api/lecturer-registration")

      if (response && Array.isArray(response)) {
        setLecturers(response)
      } else {
        throw new Error("Invalid lecturers data format")
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error)
      setLecturersError("Failed to load lecturers. Please try again.")
    } finally {
      setLecturersLoading(false)
    }
  }, [])

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
          if (key === "selected_courses") {
            formDataObj.append("course_ids", JSON.stringify(value))
          } else if (key === "work_experiences") {
            formDataObj.append("work_experiences", JSON.stringify(value))
          } else if (value instanceof File) {
            formDataObj.append(key, value)
          } else if (typeof value !== "undefined" && value !== null) {
            formDataObj.append(key, value)
          }
        })

        let response

        if (editingLecturer) {
          response = await authRequest("put", `http://localhost:5003/api/lecturer-registration/${editingLecturer}`, formDataObj, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          if (response.success) {
            setNotificationMessage("Lecturer updated successfully!")
            setShowSuccessNotification(true)
          }
        } else {
          response = await authRequest("post", "http://localhost:5003/api/lecturer-registration", formDataObj, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          if (response.success) {
            setNotificationMessage("Lecturer registered successfully!")
            setShowSuccessNotification(true)
          }
        }

        resetForm()
        fetchLecturers()
        setCurrentView("dashboard")

        setTimeout(() => {
          setShowSuccessNotification(false)
        }, 3000)
      } catch (error) {
        console.error("Error processing lecturer:", error)
        setErrorMessage(error.response?.data?.error || "Failed to process lecturer data. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [currentStep, validateForm, formData, editingLecturer, resetForm, fetchLecturers],
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

  // Render form fields based on current step
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
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
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
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.email ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.email && <div className="text-sm text-red-500 font-semibold">{errors.email}</div>}
              </div>
            )
          }

          if (field === "id_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="id_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  NIC Number *
                </Label>
                <Input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder="Enter NIC number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.id_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.id_number && <div className="text-sm text-red-500 font-semibold">{errors.id_number}</div>}
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
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.date_of_birth ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.date_of_birth && <div className="text-sm text-red-500 font-semibold">{errors.date_of_birth}</div>}
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
                  placeholder="Enter complete address"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.address ? "border-red-500" : "border-slate-200",
                  )}
                  rows={3}
                />
                {errors.address && <div className="text-sm text-red-500 font-semibold">{errors.address}</div>}
              </div>
            )
          }

          if (field === "phone") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Phone Number *
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.phone ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.phone && <div className="text-sm text-red-500 font-semibold">{errors.phone}</div>}
              </div>
            )
          }

          if (field === "cdc_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="cdc_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Ship className="w-4 h-4 text-blue-600" />
                  CDC Number
                </Label>
                <Input
                  type="text"
                  id="cdc_number"
                  name="cdc_number"
                  value={formData.cdc_number}
                  onChange={handleChange}
                  placeholder="Enter CDC number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.cdc_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.cdc_number && <div className="text-sm text-red-500 font-semibold">{errors.cdc_number}</div>}
              </div>
            )
          }

          if (field === "vehicle_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="vehicle_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Waves className="w-4 h-4 text-blue-600" />
                  Vehicle Number
                </Label>
                <Input
                  type="text"
                  id="vehicle_number"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  placeholder="Enter vehicle number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.vehicle_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.vehicle_number && <div className="text-sm text-red-500 font-semibold">{errors.vehicle_number}</div>}
              </div>
            )
          }

          if (field === "highest_qualification") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="highest_qualification" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Award className="w-4 h-4 text-blue-600" />
                  Highest Qualification *
                </Label>
                <Input
                  type="text"
                  id="highest_qualification"
                  name="highest_qualification"
                  value={formData.highest_qualification}
                  onChange={handleChange}
                  placeholder="e.g., Masters in Maritime Engineering"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.highest_qualification ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.highest_qualification && <div className="text-sm text-red-500 font-semibold">{errors.highest_qualification}</div>}
              </div>
            )
          }

          if (field === "other_qualifications") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="other_qualifications" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Other Qualifications *
                </Label>
                <Textarea
                  id="other_qualifications"
                  name="other_qualifications"
                  value={formData.other_qualifications}
                  onChange={handleChange}
                  placeholder="List other relevant qualifications and certifications"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg",
                    errors.other_qualifications ? "border-red-500" : "border-slate-200",
                  )}
                  rows={3}
                />
                {errors.other_qualifications && <div className="text-sm text-red-500 font-semibold">{errors.other_qualifications}</div>}
              </div>
            )
          }



          if (field === "work_experiences") {
            return (
              <div key={field} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Building className="w-4 h-4 text-blue-600" />
                    Professional Experience *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        work_experiences: [
                          ...prev.work_experiences,
                          {
                            institution: "",
                            position: "",
                            start_year: "",
                            end_year: "",
                            department: "",
                            is_current: false
                          }
                        ]
                      }))
                    }}
                    className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Experience
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {formData.work_experiences.map((experience, index) => (
                    <div key={index} className="p-6 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-600" />
                          Work Experience {index + 1}
                        </h4>
                        {formData.work_experiences.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                work_experiences: prev.work_experiences.filter((_, i) => i !== index)
                              }))
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">
                            Institution/Company *
                          </Label>
                          <Input
                            type="text"
                            value={experience.institution}
                            onChange={(e) => {
                              const newExperiences = [...formData.work_experiences]
                              newExperiences[index].institution = e.target.value
                              setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                            }}
                            placeholder="e.g., NIBM, SLIIT"
                            className="border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">
                            Position/Title *
                          </Label>
                          <Input
                            type="text"
                            value={experience.position}
                            onChange={(e) => {
                              const newExperiences = [...formData.work_experiences]
                              newExperiences[index].position = e.target.value
                              setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                            }}
                            placeholder="e.g., Senior Lecturer, Junior Lecturer"
                            className="border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">
                            Start Year *
                          </Label>
                          <Input
                            type="number"
                            value={experience.start_year}
                            onChange={(e) => {
                              const newExperiences = [...formData.work_experiences]
                              newExperiences[index].start_year = e.target.value
                              setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                            }}
                            placeholder="e.g., 2015"
                            min="1980"
                            max={new Date().getFullYear()}
                            className="border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700">
                            End Year
                          </Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              value={experience.end_year}
                              onChange={(e) => {
                                const newExperiences = [...formData.work_experiences]
                                newExperiences[index].end_year = e.target.value
                                setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                              }}
                              placeholder="e.g., 2020"
                              min="1980"
                              max={new Date().getFullYear() + 10}
                              disabled={experience.is_current}
                              className="border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12 flex-1"
                            />
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`current_${index}`}
                                checked={experience.is_current}
                                onChange={(e) => {
                                  const newExperiences = [...formData.work_experiences]
                                  newExperiences[index].is_current = e.target.checked
                                  if (e.target.checked) {
                                    newExperiences[index].end_year = ""
                                  }
                                  setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <Label htmlFor={`current_${index}`} className="text-sm font-semibold text-slate-700">
                                Current
                              </Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-bold text-slate-700">
                            Department/Faculty
                          </Label>
                          <Input
                            type="text"
                            value={experience.department}
                            onChange={(e) => {
                              const newExperiences = [...formData.work_experiences]
                              newExperiences[index].department = e.target.value
                              setFormData(prev => ({ ...prev, work_experiences: newExperiences }))
                            }}
                            placeholder="e.g., Computer Science, Maritime Studies"
                            className="border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.work_experiences && <div className="text-sm text-red-500 font-semibold">{errors.work_experiences}</div>}
              </div>
            )
          }

          if (field === "selected_courses") {
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Assign Courses *
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
                      <span className="text-slate-500 font-semibold">Click to assign courses</span>
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
              </div>
            )
          }

          if (field === "category") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Award className="w-4 h-4 text-blue-600" />
                  Lecturer Category *
                </Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.category ? "border-red-500" : "border-slate-200",
                  )}>
                    <SelectValue placeholder="Select lecturer category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Senior">A</SelectItem>
                    <SelectItem value="Associate">B</SelectItem>
                    <SelectItem value="Assistant">C</SelectItem>

                  </SelectContent>
                </Select>
                {errors.category && <div className="text-sm text-red-500 font-semibold">{errors.category}</div>}
              </div>
            )
          }

          if (field === "status") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Status *
                </Label>
                <Select
                  value={formData.status || "Active"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.status ? "border-red-500" : "border-slate-200",
                  )}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <div className="text-sm text-red-500 font-semibold">{errors.status}</div>}
              </div>
            )
          }

          if (field === "bank_name") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="bank_name" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Building className="w-4 h-4 text-blue-600" />
                  Bank Name *
                </Label>
                <Select
                  value={formData.bank_name || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bank_name: value }))}
                >
                  <SelectTrigger className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.bank_name ? "border-red-500" : "border-slate-200",
                  )}>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commercial Bank">Commercial Bank</SelectItem>
                    <SelectItem value="People's Bank">People's Bank</SelectItem>
                    <SelectItem value="Bank of Ceylon">Bank of Ceylon</SelectItem>
                    <SelectItem value="Sampath Bank">Sampath Bank</SelectItem>
                    <SelectItem value="Hatton National Bank">Hatton National Bank</SelectItem>
                    <SelectItem value="Nations Trust Bank">Nations Trust Bank</SelectItem>
                    <SelectItem value="DFCC Bank">DFCC Bank</SelectItem>
                    <SelectItem value="National Development Bank">National Development Bank</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bank_name && <div className="text-sm text-red-500 font-semibold">{errors.bank_name}</div>}
              </div>
            )
          }

          if (field === "branch_name") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="branch_name" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Branch Name *
                </Label>
                <Input
                  type="text"
                  id="branch_name"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  placeholder="Enter branch name"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.branch_name ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.branch_name && <div className="text-sm text-red-500 font-semibold">{errors.branch_name}</div>}
              </div>
            )
          }

          if (field === "account_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="account_number" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Account Number *
                </Label>
                <Input
                  type="text"
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="Enter bank account number"
                  className={cn(
                    "border-2 focus:border-blue-500 focus:ring-blue-500 shadow-lg h-12",
                    errors.account_number ? "border-red-500" : "border-slate-200",
                  )}
                />
                {errors.account_number && <div className="text-sm text-red-500 font-semibold">{errors.account_number}</div>}
              </div>
            )
          }

          // File upload fields
          if (field === "nic_file") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="nic_file" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  NIC Copy
                </Label>
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="nic_file" className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-700">
                        Click to upload NIC copy
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      <Input
                        id="nic_file"
                        name="nic_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {formData.nic_file && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">File selected: {formData.nic_file.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (field === "photo_file") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="photo_file" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Passport Photo
                </Label>
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="photo_file" className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-700">
                        Click to upload passport photo
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 5MB</p>
                      <Input
                        id="photo_file"
                        name="photo_file"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {formData.photo_file && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">File selected: {formData.photo_file.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (field === "education_certificate_file") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="education_certificate_file" className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Education Certificates
                </Label>
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="education_certificate_file" className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-700">
                        Click to upload education certificates
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      <Input
                        id="education_certificate_file"
                        name="education_certificate_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {formData.education_certificate_file && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">File selected: {formData.education_certificate_file.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

  // Fetch lecturer data for editing - moved here to fix initialization order
  const fetchLecturerForEdit = useCallback(async (lecturerId) => {
    try {
      setLoading(true)
      setErrorMessage("")

      const lecturerData = await authRequest("get", `http://localhost:5003/api/lecturer-registration/${lecturerId}`)
      
      if (lecturerData) {
        // Format date for input field
        const formattedDateOfBirth = lecturerData.date_of_birth 
          ? new Date(lecturerData.date_of_birth).toISOString().split('T')[0]
          : ""

        // Parse courses from string to array
        const selectedCourses = lecturerData.courses && Array.isArray(lecturerData.courses)
          ? lecturerData.courses.map(course => course.id)
          : []

        // Parse work experiences from academic details experience JSON
        let workExperiences = [{
          institution: "",
          position: "",
          start_year: "",
          end_year: "",
          department: "",
          is_current: false
        }];
        
        if (lecturerData.academicDetails?.experience) {
          try {
            let experienceData = lecturerData.academicDetails.experience;
            // Handle double-encoded JSON
            if (typeof experienceData === 'string') {
              experienceData = JSON.parse(experienceData);
            }
            if (typeof experienceData === 'string') {
              experienceData = JSON.parse(experienceData);
            }
            
            if (Array.isArray(experienceData) && experienceData.length > 0) {
              workExperiences = experienceData.map(exp => ({
                institution: exp.institution || "",
                position: exp.designation || "",
                start_year: exp.start || "",
                end_year: exp.end === "Present" ? "" : (exp.end || ""),
                department: exp.nature || "",
                is_current: exp.end === "Present"
              }));
            }
          } catch (e) {
            console.error("Error parsing experience data:", e);
          }
        }

        setFormData({
          full_name: lecturerData.full_name || "",
          email: lecturerData.email || "",
          selected_courses: selectedCourses,
          id_number: lecturerData.id_number || "",
          date_of_birth: formattedDateOfBirth,
          address: lecturerData.address || "",
          phone: lecturerData.phone || "",
          cdc_number: lecturerData.cdc_number || "",
          category: lecturerData.category || "",
          vehicle_number: lecturerData.vehicle_number || "",
          status: lecturerData.status || "Active",
          bank_name: lecturerData.bankDetails?.bank_name || "",
          branch_name: lecturerData.bankDetails?.branch_name || "",
          account_number: lecturerData.bankDetails?.account_number || "",
          highest_qualification: lecturerData.academicDetails?.highest_qualification || "",
          other_qualifications: lecturerData.academicDetails?.other_qualifications || "",

          work_experiences: workExperiences,
          nic_file: null,
          education_certificate_file: null,
          cdc_book_file: null,
          driving_trainer_license_file: null,
          bank_document_file: null,
          photo: null,
          police_report_file: null,
        })
      }
    } catch (error) {
      console.error("Error fetching lecturer for edit:", error)
      setErrorMessage("Failed to load lecturer data for editing. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle URL parameters for editing
  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId && editId !== editingLecturer) {
      setEditingLecturer(editId)
      fetchLecturerForEdit(editId)
    }
  }, [searchParams, editingLecturer, fetchLecturerForEdit])

  // Load lecturer data when editing starts
  useEffect(() => {
    if (editingLecturer && currentView === "registration") {
      fetchLecturerForEdit(editingLecturer)
    }
  }, [editingLecturer, currentView, fetchLecturerForEdit])

  // Fetch courses function with retry capability
  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true)
      setErrorMessage("")

      const coursesData = await authRequest("get", "http://localhost:5003/api/lecturer-registration/courses")

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

  // Handle starting new registration - ensures clean state
  const handleStartNewRegistration = useCallback(() => {
    // Reset all form state
    setFormData({
      full_name: "",
      email: "",
      selected_courses: [],
      id_number: "",
      date_of_birth: "",
      address: "",
      phone: "",
      cdc_number: "",
      category: "",
      vehicle_number: "",
      status: "Active",
      bank_name: "",
      branch_name: "",
      account_number: "",
      highest_qualification: "",
      other_qualifications: "",

      work_experiences: [
        {
          institution: "",
          position: "",
          start_year: "",
          end_year: "",
          department: "",
          is_current: false
        }
      ],
      nic_file: null,
      photo_file: null,
      education_certificate_file: null,
      cdc_book_file: null,
      driving_trainer_license_file: null,
    })
    setCurrentStep(0)
    setEditingLecturer(null)
    setErrors({})
    setErrorMessage("")
    setCurrentView("registration")
    // Clear URL parameters
    navigate("/lecturer-registration", { replace: true })
  }, [navigate])

  // Initial data fetching
  useEffect(() => {
    fetchCourses()
    fetchLecturers()
  }, [fetchCourses, fetchLecturers])

  // Click outside to close course dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        courseOptionsRef.current &&
        !courseOptionsRef.current.contains(event.target) &&
        courseInputRef.current &&
        !courseInputRef.current.contains(event.target)
      ) {
        setShowCourseOptions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle password reset email
  const handleSendPasswordReset = useCallback(
    async (lecturer) => {
      try {
        setLoading(true)
        await authRequest("post", "http://localhost:5003/api/lecturer-auth/forgot-password", { email: lecturer.email })
        setNotificationMessage(`Password reset email sent successfully to ${lecturer.full_name} (${lecturer.email})!`)
        setShowSuccessNotification(true)
      } catch (error) {
        console.error("Error sending password reset email:", error)
        alert(`Failed to send password reset email: ${error.response?.data?.error || error.message}`)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Handle sorting
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField])

  // Filter and sort lecturers
  const getFilteredAndSortedLecturers = useMemo(() => {
    let filtered = lecturers

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = lecturers.filter(
        (lecturer) =>
          lecturer.full_name?.toLowerCase().includes(term) ||
          lecturer.email?.toLowerCase().includes(term) ||
          lecturer.id_number?.toLowerCase().includes(term) ||
          extractCourseIds(lecturer.assigned_courses)?.toLowerCase().includes(term),
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
  }, [lecturers, searchTerm, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(getFilteredAndSortedLecturers.length / lecturersPerPage)
  const indexOfLastLecturer = currentPage * lecturersPerPage
  const indexOfFirstLecturer = indexOfLastLecturer - lecturersPerPage
  const currentLecturers = getFilteredAndSortedLecturers.slice(indexOfFirstLecturer, indexOfLastLecturer)

  // Handle view lecturer
  const handleViewLecturer = useCallback((lecturerId) => {
    navigate(`/lecturer/${lecturerId}`)
  }, [navigate])

  // Handle edit lecturer
  const handleEditLecturer = useCallback((lecturerId) => {
    // Set URL parameter for editing
    navigate(`?edit=${lecturerId}`, { replace: true })
    setEditingLecturer(lecturerId)
    setCurrentView("registration")
  }, [navigate])

  // Handle delete lecturer
  const handleDeleteLecturer = useCallback(
    async (lecturerId) => {
      if (lecturerId === null) {
        setConfirmDeleteId(null)
        return
      }
      
      if (confirmDeleteId === lecturerId) {
        // Perform actual delete
        try {
          setLoading(true)
          await authRequest("delete", `http://localhost:5003/api/lecturer-registration/${lecturerId}`)
          setLecturers((prev) => prev.filter((l) => l.id !== lecturerId))
          setConfirmDeleteId(null)
          setNotificationMessage("Lecturer deleted successfully!")
          setShowSuccessNotification(true)
        } catch (error) {
          console.error("Error deleting lecturer:", error)
          alert("Failed to delete lecturer")
        } finally {
          setLoading(false)
        }
      } else {
        setConfirmDeleteId(lecturerId)
      }
    },
    [confirmDeleteId],
  )

  // Memoized calculations
  const totalLecturers = useMemo(() => lecturers.length, [lecturers])
  const activeLecturers = useMemo(() => lecturers.filter((l) => l.status === "Active" || !l.status).length, [lecturers])
  const totalCourses = useMemo(() => courses.length, [courses])

  if (currentView === "registration") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
        </div>

        <div className="relative z-10 w-full h-full p-4 lg:p-6">
          {/* Registration Form Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl shadow-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black gradient-text">
                  {editingLecturer ? "Edit Lecturer" : "Add New Lecturer"}
                </h1>
                <p className="text-slate-600 font-semibold">
                  {editingLecturer ? "Update lecturer information" : "Register a new lecturer in the system"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentView("dashboard")
                setEditingLecturer(null)
                navigate("/lecturer-registration", { replace: true })
              }}
              className="h-12 px-6 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Registration Form */}
          <Card className="animate-fade-in stagger-1 border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl font-black gradient-text">Lecturer Registration Form</span>
                {editingLecturer && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 font-bold px-4 py-2 text-sm"
                  >
                    Editing Lecturer ID: {editingLecturer}
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
                        {editingLecturer ? "Update Lecturer" : "Register Lecturer"}
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        isVisible={showSuccessNotification}
        message={notificationMessage}
        onClose={() => setShowSuccessNotification(false)}
      />

      <div className="relative z-10 w-full h-full p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <Users className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text whitespace-nowrap">
                Lecturer Management Dashboard
              </h1>
              <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
                <Target className="h-3 w-3 flex-shrink-0" />
                Comprehensive maritime training lecturer management system
              </p>
            </div>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <Button
              onClick={() => console.log("Export CSV")}
              variant="outline"
              className="gap-2 border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleStartNewRegistration}
              className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Lecturer
            </Button>
          </div>
        </div>

        {/* Lecturers Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-2xl font-black gradient-text flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                Registered Lecturers
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search by name, email, ID number, or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        setCurrentPage(1)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={fetchLecturers}
                  disabled={lecturersLoading}
                  className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${lecturersLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Records per page selector */}
            <div className="flex justify-between items-center p-6 pb-4">
              <RecordsPerPageSelector
                value={lecturersPerPage}
                onChange={(value) => {
                  setLecturersPerPage(value)
                  setCurrentPage(1)
                }}
                options={recordsPerPageOptions}
              />

              {lecturers.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-3 py-1 font-semibold"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  {getFilteredAndSortedLecturers.length} lecturers found
                </Badge>
              )}
            </div>

            {/* Lecturer Table */}
            {lecturersLoading ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl inline-block mb-6">
                  <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600" />
                </div>
                <h3 className="text-2xl font-black gradient-text mb-3">Loading lecturers...</h3>
                <p className="text-slate-600 font-semibold text-lg">Please wait while we fetch the lecturer data</p>
              </div>
            ) : lecturersError ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-3xl inline-block mb-6">
                  <AlertTriangle className="mx-auto h-16 w-16 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-red-700 mb-3">Error Loading Lecturers</h3>
                <p className="text-slate-600 font-semibold text-lg mb-4">{lecturersError}</p>
                <Button
                  onClick={fetchLecturers}
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
                      {currentLecturers.length > 0 ? (
                        currentLecturers.map((lecturer) => (
                          <LecturerRow
                            key={lecturer.id}
                            lecturer={lecturer}
                            onView={handleViewLecturer}
                            onEdit={handleEditLecturer}
                            onDelete={handleDeleteLecturer}
                            onSendPasswordReset={handleSendPasswordReset}
                            confirmDeleteId={confirmDeleteId}
                            loading={loading}
                            coursesMap={coursesMap}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-16 text-center">
                            <div className="p-6 bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 rounded-3xl inline-block mb-6">
                              <Users className="mx-auto h-16 w-16 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black gradient-text mb-3">
                              {searchTerm ? "No lecturers found" : "No lecturers registered"}
                            </h3>
                            <p className="text-slate-600 font-semibold text-lg mb-6">
                              {searchTerm
                                ? "No lecturers match your search criteria."
                                : "Start by adding your first lecturer to the system."}
                            </p>
                            {!searchTerm && (
                              <Button
                                onClick={handleStartNewRegistration}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Lecturer
                              </Button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!lecturersLoading && getFilteredAndSortedLecturers.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    indexOfFirstLecturer={indexOfFirstLecturer}
                    indexOfLastLecturer={indexOfLastLecturer}
                    totalItems={getFilteredAndSortedLecturers.length}
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
}
