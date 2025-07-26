"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Edit,
  Trash2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  Building,
  Ship,
  Printer,
  Share,
  AlertCircle,
  CheckCircle,
  FileText,
  Globe,
  Cake,
  UserCheck,
  FishIcon as Swimming,
  FileUp,
  Briefcase,
  Users,
} from "lucide-react"
import { authRequest } from "../../services/authService"

export default function StudentView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarState")
    return stored !== null ? stored === "true" : false
  })

  // Sync sidebar state
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        const isCollapsed = stored === "true"
        setSidebarCollapsed(isCollapsed)
      }
    }

    syncSidebarState()

    const handleSidebarToggle = (e) => setSidebarCollapsed(e.detail.isCollapsed)
    const handleSidebarHover = (e) => setSidebarCollapsed(!e.detail.isHovered)

    window.addEventListener("sidebarToggle", handleSidebarToggle)
    window.addEventListener("sidebarHover", handleSidebarHover)
    window.addEventListener("popstate", syncSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("sidebarHover", handleSidebarHover)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        setError(null)

        const studentData = await authRequest("get", `http://localhost:5003/api/students/${id}`)

        if (!studentData || !studentData.id) {
          throw new Error("Student not found")
        }

        // Parse driving_details if it's malformed
        if (studentData.driving_details) {
          try {
            if (typeof studentData.driving_details === 'string') {
              studentData.driving_details = JSON.parse(studentData.driving_details);
            }
          } catch (error) {
            console.warn('Error parsing driving_details in StudentView:', error);
            studentData.driving_details = null;
          }
        }

        setStudent(studentData)
      } catch (error) {
        console.error("Error fetching student data:", error)
        setError(`Failed to load student data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [id])

  // Handle student deletion
  const handleDeleteStudent = async () => {
    try {
      setDeleteLoading(true)

      await authRequest("delete", `http://localhost:5003/api/students/${id}`)

      setSuccessMessage("Student deleted successfully!")

      // Navigate back to student list after a short delay
      setTimeout(() => {
        navigate("/student-registration")
      }, 2000)
    } catch (error) {
      console.error("Error deleting student:", error)
      setError(`Failed to delete student: ${error.message}`)
      setShowDeleteConfirm(false)
      setDeleteLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${sidebarCollapsed ? "ml-[80px]" : "ml-[280px]"} transition-all duration-300`}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <span className="text-lg text-gray-600">Loading student details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${sidebarCollapsed ? "ml-[80px]" : "ml-[280px]"} transition-all duration-300`}
      >
        <div className="text-center p-8">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-red-600 font-medium">{error}</div>
          </div>
          <Button onClick={() => navigate("/student-registration")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${sidebarCollapsed ? "ml-[80px]" : "ml-[280px]"} transition-all duration-300`}
      >
        <div className="text-center p-8">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-500">Student not found</div>
          </div>
          <Button onClick={() => navigate("/student-registration")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 ${sidebarCollapsed ? "ml-[0px]" : "ml-[0px]"} transition-all duration-300`}
    >
      {/* Header Bar */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/student-registration")}
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
              <p className="text-gray-600">View and manage student information</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="hover:bg-blue-50">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-blue-50">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={() => navigate(`/student-registration?edit=${student.id}`)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              size="sm"
              className="hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - True Landscape Layout */}
      <div className="max-w-[1800px] mx-auto">
        {/* Profile Header - Horizontal Layout */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start p-6 gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                {student.photo_path ? (
                  <AvatarImage src={`http://localhost:5003/${student.photo_path}`} />
                ) : (
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                  {student.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Basic Info */}
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
              <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
                <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                <p className="text-gray-600">ID: #{student.id}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">DOB: {formatDate(student.date_of_birth)}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="flex flex-col md:flex-row gap-4 md:ml-auto">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">{student.email}</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <span className="text-green-800">{student.emergency_contact_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Personal Information - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">
                      {student.identification_type || "ID"}
                    </Label>
                    <p className="text-gray-900 font-medium">{student.id_number || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Nationality</Label>
                    <p className="text-gray-900 font-medium">{student.nationality || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Cake className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</Label>
                    <p className="text-gray-900 font-medium">{formatDate(student.date_of_birth)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Globe className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Country</Label>
                    <p className="text-gray-900 font-medium">{student.country || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Address</Label>
                    <p className="text-gray-900 font-medium">{student.address || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Emergency Contact</Label>
                    <p className="text-gray-900 font-medium">{student.emergency_contact_name || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Emergency Phone</Label>
                    <p className="text-gray-900 font-medium">{student.emergency_contact_number || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Information - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {student.courses && student.courses.length > 0 ? (
                  <div className="space-y-3">
                    {student.courses.map((course, index) => (
                      <div
                        key={course.id || index}
                        className={`p-3 rounded-lg ${
                          course.course_type === "primary"
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{course.courseName}</div>
                          {course.course_type === "primary" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">Primary</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">ID: {course.courseId}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <BookOpen className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500">No courses assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Company</Label>
                    <p className="text-gray-900 font-medium">{student.company || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second Row - Special Attributes and Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Special Attributes */}
          <Card className="shadow-sm border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Special Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    student.is_swimmer ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className={`p-2 rounded-full ${student.is_swimmer ? "bg-green-100" : "bg-gray-100"}`}>
                    <Swimming className={`h-5 w-5 ${student.is_swimmer ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Swimming Ability</p>
                    <p className={`text-sm ${student.is_swimmer ? "text-green-600" : "text-gray-500"}`}>
                      {student.is_swimmer ? "Can swim" : "Cannot swim"}
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    student.is_slpa_employee ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className={`p-2 rounded-full ${student.is_slpa_employee ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Briefcase className={`h-5 w-5 ${student.is_slpa_employee ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">SLPA Employee</p>
                    <p className={`text-sm ${student.is_slpa_employee ? "text-blue-600" : "text-gray-500"}`}>
                      {student.is_slpa_employee ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SLPA Employee Information */}
              {student.is_slpa_employee && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    SLPA Employee Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Designation</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.designation || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Division</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.division || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Service No</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.service_no || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Section/Unit</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.section_unit || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Department/Rank</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.department || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">Sea Services</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.sea_service || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-blue-700 uppercase tracking-wide">CDC Number</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.cdc_number || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment Course Driving Details */}
              {student.driving_details && (student.driving_details.driving_license_no || student.driving_details.driving_class || student.driving_details.issue_date) && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                    <Ship className="h-4 w-4" />
                    Equipment Course Requirements - Driving Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-orange-700 uppercase tracking-wide">Driving License Number</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.driving_details.driving_license_no || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-orange-700 uppercase tracking-wide">Driving License Class</Label>
                      <p className="text-gray-900 font-medium mt-1">{student.driving_details.driving_class || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-orange-700 uppercase tracking-wide">License Issue Date</Label>
                      <p className="text-gray-900 font-medium mt-1">
                        {student.driving_details.issue_date 
                          ? new Date(student.driving_details.issue_date).toLocaleDateString() 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-sm border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-gray-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileUp className="h-5 w-5 text-purple-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {student.nic_document_path || student.passport_document_path || student.photo_path ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.nic_document_path && (
                    <a
                      href={`http://localhost:5003/${student.nic_document_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">NIC Document</p>
                        <p className="text-sm text-blue-600">View document</p>
                      </div>
                    </a>
                  )}

                  {student.passport_document_path && (
                    <a
                      href={`http://localhost:5003/${student.passport_document_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-purple-100 rounded-full">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Passport Document</p>
                        <p className="text-sm text-purple-600">View document</p>
                      </div>
                    </a>
                  )}

                  {student.photo_path && (
                    <a
                      href={`http://localhost:5003/${student.photo_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-green-100 rounded-full">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Photo</p>
                        <p className="text-sm text-green-600">View photo</p>
                      </div>
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="w-full max-w-md mx-4 shadow-2xl">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong className="text-red-600">{student.full_name}</strong>? This
                action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleDeleteStudent}
                  disabled={deleteLoading}
                  variant="destructive"
                  className="flex-1 hover:bg-red-700"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg border border-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        </div>
      )}
    </div>
  )
}
