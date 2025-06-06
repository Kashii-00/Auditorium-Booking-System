import { useState, useEffect, useRef } from "react"
import {
  User,
  Mail,
  CreditCard,
  Globe,
  Calendar,
  MapPin,
  Building,
  Ship,
  Phone,
  Waves,
  UserCheck,
  Upload,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
  ChevronDown,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Plus,
  Users,
  GraduationCap,
  BarChart3,
  FileText,
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

export default function StudentManagementSystem() {
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
  const [studentsPerPage] = useState(10)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  // Refs
  const courseOptionsRef = useRef(null)
  const courseInputRef = useRef(null)
  const tableRef = useRef(null)

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
    selected_courses: [], // Changed to array for multiple selection
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

  // Fetch students
  const fetchStudents = async () => {
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
  }

  // Fetch courses function with retry capability
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true)
      setErrorMessage("")

      // Use authRequest instead of direct axios call
      const coursesData = await authRequest("get", "http://localhost:5003/api/students/courses")

      if (coursesData && Array.isArray(coursesData)) {
        setCourses(coursesData)
      } else {
        throw new Error("Invalid course data format")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setErrorMessage("Failed to load courses. Please try again.")
    } finally {
      setCoursesLoading(false)
    }
  }

  // Initial data fetching
  useEffect(() => {
    fetchCourses()
    fetchStudents()
  }, [])

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
  const formSections = [
    {
      title: "Basic Info",
      icon: User,
      fields: [
        "full_name",
        "email",
        "identification_type",
        "id_number",
        "nationality",
        "date_of_birth",
        "country",
        "address",
      ],
    },
    {
      title: "Contact",
      icon: Phone,
      fields: ["emergency_contact_name", "emergency_contact_number"],
    },
    {
      title: "Courses",
      icon: GraduationCap,
      fields: ["selected_courses"],
    },
    {
      title: "Additional",
      icon: FileText,
      fields: ["department", "is_swimmer", "is_slpa_employee", "company", "sea_service", "cdc_number"],
    },
    {
      title: "Documents",
      icon: Upload,
      fields: ["nic_document", "passport_document", "photo"],
    },
  ]

  // Conditional fields when SLPA employee is selected
  const slpaFields = ["designation", "division", "service_no", "section_unit"]

  // Reset form to default values
  const resetForm = () => {
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
  }

  // Edit student handler
  const handleEditStudent = async (studentId) => {
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
          // Don't set file fields as they need to be re-uploaded
          nic_document: null,
          passport_document: null,
          photo: null,
          driving_details: student.driving_details || {
            driving_license_no: "",
            driving_class: "",
            issue_date: "",
          },
        })

        setEditingStudent(studentId)
        setCurrentStep(0) // Reset to first step
        setCurrentView("registration")

        // Scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
      setErrorMessage("Failed to load student details for editing.")
    } finally {
      setLoading(false)
    }
  }

  // Delete student handler
  const handleDeleteStudent = async (studentId) => {
    try {
      setLoading(true)

      await authRequest("delete", `http://localhost:5003/api/students/${studentId}`)

      // Show success notification
      setNotificationMessage("Student deleted successfully!")
      setShowSuccessNotification(true)

      // Refresh student list
      fetchStudents()

      // Clear confirmation
      setConfirmDeleteId(null)

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 3000)
    } catch (error) {
      console.error("Error deleting student:", error)
      setErrorMessage("Failed to delete student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Form validation function
  const validateForm = (step) => {
    const newErrors = {}

    const fieldsToValidate = formSections[step].fields

    // Add conditional fields if applicable
    if (step === 3 && formData.is_slpa_employee) {
      fieldsToValidate.push(...slpaFields)
    }

    // Validate required fields
    fieldsToValidate.forEach((field) => {
      if (field === "selected_courses") {
        if (formData.selected_courses.length === 0) {
          newErrors.selected_courses = "Please select at least one course"
        }
        return
      }

      // Skip validation for files on initial render, only when user tries to progress
      const isFileField = ["nic_document", "passport_document", "photo"].includes(field)

      if (isFileField) {
        if (!formData[field] && step === 4) {
          newErrors[field] = "Please upload the required document"
        }
      } else if (!formData[field] && fieldsToValidate.includes(field)) {
        newErrors[field] = `${field.replace("_", " ")} is required`
      }
    })

    // Special validation for email format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (type === "file" && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0],
      })
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else if (name.startsWith("driving_details.")) {
      const field = name.split(".")[1]
      setFormData({
        ...formData,
        driving_details: {
          ...formData.driving_details,
          [field]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    // Check if the course is already selected
    if (formData.selected_courses.includes(courseId)) {
      // Remove the course if it's already selected
      setFormData({
        ...formData,
        selected_courses: formData.selected_courses.filter((id) => id !== courseId),
      })
    } else {
      // Add the course if it's not already selected
      setFormData({
        ...formData,
        selected_courses: [...formData.selected_courses, courseId],
      })
    }
  }

  // Remove a selected course
  const removeCourse = (courseId) => {
    setFormData({
      ...formData,
      selected_courses: formData.selected_courses.filter((id) => id !== courseId),
    })
  }

  // Filter courses based on search input
  const filteredCourses = courses.filter((course) =>
    course.courseName.toLowerCase().includes(courseFilter.toLowerCase()),
  )

  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Final validation before submission
    if (!validateForm(currentStep)) {
      return
    }

    setLoading(true)
    setErrorMessage("")

    try {
      const formDataObj = new FormData()

      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "driving_details") {
          formDataObj.append(key, JSON.stringify(value))
        } else if (key === "selected_courses") {
          // Append as JSON string for proper array handling
          formDataObj.append("course_ids", JSON.stringify(value))
        } else if (key === "is_swimmer" || key === "is_slpa_employee") {
          // Convert boolean to string for proper backend processing
          formDataObj.append(key, value ? "true" : "false")
        } else if (value instanceof File) {
          // Rename files to match backend expectations
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

      // Add primary_course_id field for clarity
      if (formData.selected_courses.length > 0) {
        formDataObj.append("primary_course_id", formData.selected_courses[0])
      }

      let response

      if (editingStudent) {
        // Update existing student
        response = await authRequest("put", `http://localhost:5003/api/students/${editingStudent}`, formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        if (response.success) {
          setNotificationMessage("Student updated successfully!")
          setShowSuccessNotification(true)
        }
      } else {
        // Create new student
        response = await authRequest("post", "http://localhost:5003/api/students", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        if (response.success) {
          setNotificationMessage("Student registered successfully!")
          setShowSuccessNotification(true)
        }
      }

      // Reset form after successful submission
      resetForm()

      // Refresh student list
      fetchStudents()

      // Switch to dashboard view
      setCurrentView("dashboard")

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 3000)
    } catch (error) {
      console.error("Error processing student:", error)
      setErrorMessage(error.response?.data?.error || "Failed to process student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    resetForm()
  }

  // Navigate to previous form step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Navigate to next form step
  const nextStep = () => {
    if (validateForm(currentStep)) {
      if (currentStep < formSections.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  // Sort students
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sort icon for table headers
  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    )
  }

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    // First filter by search term
    let filtered = students

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = students.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.id_number?.toLowerCase().includes(term) ||
          student.enrolled_courses?.toLowerCase().includes(term),
      )
    }

    // Then sort
    return filtered.sort((a, b) => {
      // Handle null values
      if (!a[sortField]) return sortDirection === "asc" ? 1 : -1
      if (!b[sortField]) return sortDirection === "asc" ? -1 : 1

      // Compare based on field type
      if (typeof a[sortField] === "string") {
        return sortDirection === "asc"
          ? a[sortField].localeCompare(b[sortField])
          : b[sortField].localeCompare(a[sortField])
      }

      // Default numeric comparison
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    })
  }

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const filteredAndSortedStudents = getFilteredAndSortedStudents()
  const currentStudents = filteredAndSortedStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  const totalPages = Math.ceil(filteredAndSortedStudents.length / studentsPerPage)

  // Export student data as CSV
  const exportStudentsAsCSV = () => {
    // Headers for CSV
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

    // Convert each student to CSV row
    const rows = filteredAndSortedStudents.map((student) => [
      student.id,
      student.full_name,
      student.email,
      `${student.identification_type}: ${student.id_number}`,
      student.nationality,
      student.enrolled_courses || "",
      student.status || "Active",
      student.registration_date ? new Date(student.registration_date).toLocaleDateString() : "",
    ])

    // Combine headers and rows
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `students_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate stats
  const stats = [
    {
      title: "Total Students",
      value: students.length.toString(),
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Courses",
      value: courses.length.toString(),
      change: "+3",
      icon: GraduationCap,
      color: "bg-green-500",
    },
    {
      title: "Active Students",
      value: students.filter((s) => s.status === "Active" || !s.status).length.toString(),
      change: "+5%",
      icon: BarChart3,
      color: "bg-purple-500",
    },
    {
      title: "SLPA Employees",
      value: students.filter((s) => s.is_slpa_employee === 1 || s.is_slpa_employee === true).length.toString(),
      change: "+23%",
      icon: Building,
      color: "bg-orange-500",
    },
  ]

  // Render the appropriate form fields based on the current step
  const renderFormFields = () => {
    const currentFields = formSections[currentStep].fields
    const SectionIcon = formSections[currentStep].icon

    return (
      <div className="space-y-6">
        {currentFields.map((field) => {
          if (field === "full_name") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={errors.full_name ? "border-red-500" : ""}
                />
                {errors.full_name && <div className="text-sm text-red-500">{errors.full_name}</div>}
              </div>
            )
          }

          if (field === "email") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <div className="text-sm text-red-500">{errors.email}</div>}
              </div>
            )
          }

          if (field === "identification_type") {
            return (
              <div key={field} className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" />
                  Identification Document *
                </Label>
                <RadioGroup
                  value={formData.identification_type}
                  onValueChange={(value) => setFormData({ ...formData, identification_type: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NIC" id="nic" />
                    <Label htmlFor="nic" className="text-sm">
                      NIC
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Passport" id="passport" />
                    <Label htmlFor="passport" className="text-sm">
                      Passport
                    </Label>
                  </div>
                </RadioGroup>
                {errors.identification_type && <div className="text-sm text-red-500">{errors.identification_type}</div>}
              </div>
            )
          }

          if (field === "id_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="id_number" className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" />
                  {formData.identification_type} Number *
                </Label>
                <Input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder={`Enter ${formData.identification_type} number`}
                  className={errors.id_number ? "border-red-500" : ""}
                />
                {errors.id_number && <div className="text-sm text-red-500">{errors.id_number}</div>}
              </div>
            )
          }

          if (field === "nationality") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="nationality" className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  Nationality *
                </Label>
                <Input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Enter nationality"
                  className={errors.nationality ? "border-red-500" : ""}
                />
                {errors.nationality && <div className="text-sm text-red-500">{errors.nationality}</div>}
              </div>
            )
          }

          if (field === "date_of_birth") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  Date of Birth *
                </Label>
                <Input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={errors.date_of_birth ? "border-red-500" : ""}
                />
                {errors.date_of_birth && <div className="text-sm text-red-500">{errors.date_of_birth}</div>}
              </div>
            )
          }

          if (field === "country") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  Country
                </Label>
                <Input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  className={errors.country ? "border-red-500" : ""}
                />
                {errors.country && <div className="text-sm text-red-500">{errors.country}</div>}
              </div>
            )
          }

          if (field === "cdc_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="cdc_number" className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" />
                  CDC Number
                </Label>
                <Input
                  type="text"
                  id="cdc_number"
                  name="cdc_number"
                  value={formData.cdc_number}
                  onChange={handleChange}
                  placeholder="Enter CDC number (if applicable)"
                  className={errors.cdc_number ? "border-red-500" : ""}
                />
                {errors.cdc_number && <div className="text-sm text-red-500">{errors.cdc_number}</div>}
              </div>
            )
          }

          if (field === "address") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  Address *
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  rows={3}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <div className="text-sm text-red-500">{errors.address}</div>}
              </div>
            )
          }

          if (field === "department") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="w-4 h-4" />
                  Department/Rank
                </Label>
                <Input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department or rank"
                  className={errors.department ? "border-red-500" : ""}
                />
                {errors.department && <div className="text-sm text-red-500">{errors.department}</div>}
              </div>
            )
          }

          if (field === "company") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="w-4 h-4" />
                  Company (if employed)
                </Label>
                <Input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && <div className="text-sm text-red-500">{errors.company}</div>}
              </div>
            )
          }

          if (field === "sea_service") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="sea_service" className="flex items-center gap-2 text-sm font-medium">
                  <Ship className="w-4 h-4" />
                  Sea Services (Year/Month if applicable)
                </Label>
                <Input
                  type="text"
                  id="sea_service"
                  name="sea_service"
                  value={formData.sea_service}
                  onChange={handleChange}
                  placeholder="Example: 2Y/6M"
                  className={errors.sea_service ? "border-red-500" : ""}
                />
                {errors.sea_service && <div className="text-sm text-red-500">{errors.sea_service}</div>}
              </div>
            )
          }

          if (field === "emergency_contact_name") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="emergency_contact_name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Emergency Contact Name *
                </Label>
                <Input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Enter emergency contact name"
                  className={errors.emergency_contact_name ? "border-red-500" : ""}
                />
                {errors.emergency_contact_name && (
                  <div className="text-sm text-red-500">{errors.emergency_contact_name}</div>
                )}
              </div>
            )
          }

          if (field === "emergency_contact_number") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="emergency_contact_number" className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4" />
                  Emergency Contact Number *
                </Label>
                <Input
                  type="text"
                  id="emergency_contact_number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleChange}
                  placeholder="Enter emergency contact number"
                  className={errors.emergency_contact_number ? "border-red-500" : ""}
                />
                {errors.emergency_contact_number && (
                  <div className="text-sm text-red-500">{errors.emergency_contact_number}</div>
                )}
              </div>
            )
          }

          if (field === "is_swimmer") {
            return (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id="is_swimmer"
                  checked={formData.is_swimmer}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_swimmer: checked })}
                />
                <Label htmlFor="is_swimmer" className="flex items-center gap-2 text-sm">
                  <Waves className="w-4 h-4" />
                  Student can swim
                </Label>
              </div>
            )
          }

          if (field === "is_slpa_employee") {
            return (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id="is_slpa_employee"
                  checked={formData.is_slpa_employee}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_slpa_employee: checked })}
                />
                <Label htmlFor="is_slpa_employee" className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4" />
                  Student is an SLPA employee
                </Label>
              </div>
            )
          }

          if (field === "selected_courses") {
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Building className="w-4 h-4" />
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
                      >
                        <RotateCcw className="w-4 h-4" /> Retry
                      </Button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={`min-h-[40px] border rounded-md p-2 cursor-pointer flex flex-wrap gap-2 items-center ${errors.selected_courses ? "border-red-500" : "border-gray-300"} ${coursesLoading ? "opacity-50" : ""}`}
                    onClick={() => !coursesLoading && setShowCourseOptions(true)}
                    ref={courseInputRef}
                  >
                    {formData.selected_courses.length > 0 ? (
                      formData.selected_courses.map((courseId) => {
                        const course = courses.find((c) => c.id === courseId)
                        return course ? (
                          <Badge key={courseId} variant="secondary" className="flex items-center gap-1">
                            {course.courseName}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCourse(courseId)
                              }}
                            />
                          </Badge>
                        ) : null
                      })
                    ) : coursesLoading ? (
                      <span className="text-gray-500">Loading courses...</span>
                    ) : (
                      <span className="text-gray-500">Click to select courses</span>
                    )}
                    <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                  </div>
                  {errors.selected_courses && <div className="text-sm text-red-500">{errors.selected_courses}</div>}

                  {showCourseOptions && !coursesLoading && (
                    <div
                      className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
                      ref={courseOptionsRef}
                    >
                      <div className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search courses..."
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border-0 p-0 focus:ring-0 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <div
                            key={course.id}
                            className={`p-2 cursor-pointer hover:bg-gray-100 text-sm ${formData.selected_courses.includes(course.id) ? "bg-blue-50 text-blue-700" : ""}`}
                            onClick={() => handleCourseSelect(course.id)}
                          >
                            {course.courseName}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">No courses found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (field === "nic_document") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="nic_document" className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  NIC Document *
                </Label>
                <Input
                  type="file"
                  id="nic_document"
                  name="nic_document"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className={errors.nic_document ? "border-red-500" : ""}
                />
                {formData.nic_document && (
                  <div className="text-sm text-gray-600">Selected: {formData.nic_document.name}</div>
                )}
                {errors.nic_document && <div className="text-sm text-red-500">{errors.nic_document}</div>}
              </div>
            )
          }

          if (field === "passport_document") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="passport_document" className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  Passport Document *
                </Label>
                <Input
                  type="file"
                  id="passport_document"
                  name="passport_document"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className={errors.passport_document ? "border-red-500" : ""}
                />
                {formData.passport_document && (
                  <div className="text-sm text-gray-600">Selected: {formData.passport_document.name}</div>
                )}
                {errors.passport_document && <div className="text-sm text-red-500">{errors.passport_document}</div>}
              </div>
            )
          }

          if (field === "photo") {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor="photo" className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  Photo (Passport Size) *
                </Label>
                <Input
                  type="file"
                  id="photo"
                  name="photo"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png"
                  className={errors.photo ? "border-red-500" : ""}
                />
                {formData.photo && <div className="text-sm text-gray-600">Selected: {formData.photo.name}</div>}
                {errors.photo && <div className="text-sm text-red-500">{errors.photo}</div>}
              </div>
            )
          }

          return null
        })}

        {/* Display SLPA employee details when checkbox is checked */}
        {currentStep === 3 && formData.is_slpa_employee && (
          <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">SLPA Employee Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation" className="flex items-center gap-2 text-sm font-medium">
                  <UserCheck className="w-4 h-4" />
                  Designation *
                </Label>
                <Input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className={errors.designation ? "border-red-500" : ""}
                />
                {errors.designation && <div className="text-sm text-red-500">{errors.designation}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="division" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="w-4 h-4" />
                  Division *
                </Label>
                <Input
                  type="text"
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  placeholder="Enter division"
                  className={errors.division ? "border-red-500" : ""}
                />
                {errors.division && <div className="text-sm text-red-500">{errors.division}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_no" className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4" />
                  Service No *
                </Label>
                <Input
                  type="text"
                  id="service_no"
                  name="service_no"
                  value={formData.service_no}
                  onChange={handleChange}
                  placeholder="Enter service number"
                  className={errors.service_no ? "border-red-500" : ""}
                />
                {errors.service_no && <div className="text-sm text-red-500">{errors.service_no}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="section_unit" className="flex items-center gap-2 text-sm font-medium">
                  <Building className="w-4 h-4" />
                  Section/Unit *
                </Label>
                <Input
                  type="text"
                  id="section_unit"
                  name="section_unit"
                  value={formData.section_unit}
                  onChange={handleChange}
                  placeholder="Enter section or unit"
                  className={errors.section_unit ? "border-red-500" : ""}
                />
                {errors.section_unit && <div className="text-sm text-red-500">{errors.section_unit}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive maritime training student management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportStudentsAsCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              console.log("Setting view to registration") // Debug log
              setCurrentView("registration")
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Active Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.status === "Active" || !s.status).length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">SLPA Employees</p>
                <p className="text-2xl font-bold text-purple-600">
                  {students.filter((s) => s.is_slpa_employee === 1 || s.is_slpa_employee === true).length}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Available Courses</p>
                <p className="text-2xl font-bold text-orange-600">{courses.length}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-xl">Registered Students</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students by name, email, ID, or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchStudents} size="sm" disabled={studentsLoading}>
                <RefreshCw className={`w-4 h-4 ${studentsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading students...</p>
            </div>
          ) : studentsError ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{studentsError}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="overflow-x-auto" ref={tableRef}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th
                        className="text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("full_name")}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          Name
                          {getSortIcon("full_name")}
                        </div>
                      </th>
                      <th
                        className="text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          Email
                          {getSortIcon("email")}
                        </div>
                      </th>
                      <th className="text-left p-4 font-medium">Identification</th>
                      <th className="text-left p-4 font-medium">Nationality</th>
                      <th className="text-left p-4 font-medium">Courses</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.length > 0 ? (
                      currentStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={`/placeholder.svg?height=40&width=40&query=student`} />
                                <AvatarFallback>
                                  {student.full_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{student.full_name}</div>
                                <div className="text-sm text-gray-500">ID: {student.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="font-medium">{student.identification_type}</div>
                              <div className="text-gray-500">{student.id_number}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900">{student.nationality}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={student.enrolled_courses}>
                              {student.enrolled_courses || "Not enrolled"}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={student.status === "Active" || !student.status ? "default" : "secondary"}>
                              {student.status || "Active"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStudent(student.id)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {confirmDeleteId === student.id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteStudent(student.id)}
                                    disabled={loading}
                                  >
                                    Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmDeleteId(student.id)}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          {searchTerm
                            ? "No students found matching your search."
                            : studentsLoading
                              ? "Loading student data..."
                              : "No students registered yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstStudent + 1} to{" "}
                    {Math.min(indexOfLastStudent, filteredAndSortedStudents.length)} of{" "}
                    {filteredAndSortedStudents.length} students
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
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
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Render Registration Form View
  const renderRegistrationForm = () => {
    console.log("Rendering registration form") // Debug log
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingStudent ? "Edit Student" : "Student Registration"}
            </h1>
            <p className="text-gray-600 mt-1">
              {editingStudent ? "Update student information" : "Add a new student to the system"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              console.log("Back to dashboard") // Debug log
              setCurrentView("dashboard")
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">Registration Form</span>
              {editingStudent && <Badge variant="secondary">Editing Student ID: {editingStudent}</Badge>}
            </CardTitle>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6 overflow-x-auto">
              {formSections.map((section, index) => {
                const SectionIcon = section.icon
                return (
                  <div key={index} className="flex items-center min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      <SectionIcon className="w-5 h-5" />
                    </div>
                    <span
                      className={`ml-3 text-sm whitespace-nowrap ${
                        index <= currentStep ? "text-blue-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      {section.title}
                    </span>
                    {index < formSections.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                  {/* Properly render the icon as a component using JSX */}
                  {(() => {
                    const Icon = formSections[currentStep].icon
                    return <Icon className="h-5 w-5" />
                  })()}
                  <span>{formSections[currentStep].title}</span>
                </h2>
                {renderFormFields()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentStep < formSections.length - 1 ? (
                    <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingStudent ? "Update Student" : "Register Student"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
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
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">There was an error displaying the content</p>
          <Button
            onClick={() => {
              setCurrentView("dashboard")
              setErrors({})
              setErrorMessage("")
            }}
          >
            Return to Dashboard
          </Button>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{notificationMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">{renderContent()}</div>
    </div>
  )
}