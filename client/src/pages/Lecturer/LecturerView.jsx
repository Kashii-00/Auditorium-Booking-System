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
  GraduationCap,
  CreditCard,
  Building,
  Award,
  Printer,
  Share,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react"
import { authRequest } from "../../services/authService"
import LoadingScreen from "../LoadingScreen/LoadingScreen"

export default function LecturerView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lecturer, setLecturer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchLecturer = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await authRequest("get", `http://localhost:5003/api/lecturer-registration/${id}`)
        setLecturer(data)
      } catch (err) {
        setError("Failed to load lecturer details")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchLecturer()
  }, [id])

  const handleDeleteLecturer = async () => {
    setDeleteLoading(true)
    try {
      await authRequest("delete", `http://localhost:5003/api/lecturer-registration/${id}`)
      setSuccessMessage("Lecturer deleted successfully")
      setTimeout(() => navigate("/lecturer-registration"), 1500)
    } catch (err) {
      setError("Failed to delete lecturer")
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading lecturer details..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-red-600 font-medium">{error}</div>
          </div>
          <Button onClick={() => navigate("/lecturer-registration")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  if (!lecturer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-500">Lecturer not found</div>
          </div>
          <Button onClick={() => navigate("/lecturer-registration")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  // Parse data safely
  const academic = lecturer.academicDetails || {}
  const bank = lecturer.bankDetails || {}
  
  // For Course Information card - show courseIds
  const courseIds = Array.isArray(lecturer.courses)
    ? lecturer.courses.map((c) => c.courseId).join(", ")
    : ""
  // For display purposes - course names
  const courses = Array.isArray(lecturer.courses)
    ? lecturer.courses.map((c) => c.courseName).join(", ")
    : lecturer.courses || ""

  // Parse experience as array
  let experience = []
  if (academic.experience) {
    if (typeof academic.experience === "string") {
      try {
        experience = JSON.parse(academic.experience)
      } catch {
        experience = []
      }
    } else if (Array.isArray(academic.experience)) {
      experience = academic.experience
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Header Bar */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/lecturer-registration")}
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lecturer Details</h1>
              <p className="text-gray-600">View and manage lecturer information</p>
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
              onClick={() => navigate(`/lecturer-registration?id=${lecturer.id}`)}
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
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                  {lecturer.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Basic Info */}
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{lecturer.full_name}</h2>
              <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
                <Badge
                  variant={lecturer.status === "Active" ? "default" : "secondary"}
                  className={`${lecturer.status === "Active" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800"}`}
                >
                  {lecturer.status}
                </Badge>
                <p className="text-gray-600">ID: #{lecturer.id}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Joined: {lecturer.created_at ? new Date(lecturer.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="flex flex-col md:flex-row gap-4 md:ml-auto">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">{lecturer.email}</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <span className="text-green-800">{lecturer.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contact & Personal Info - 3 columns */}
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
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Address</Label>
                    <p className="text-gray-900 font-medium">{lecturer.address || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</Label>
                    <p className="text-gray-900 font-medium">
                      {lecturer.date_of_birth ? new Date(lecturer.date_of_birth).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">ID Number</Label>
                    <p className="text-gray-900 font-medium">{lecturer.id_number || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">CDC Number</Label>
                    <p className="text-gray-900 font-medium">{lecturer.cdc_number || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Vehicle Number</Label>
                    <p className="text-gray-900 font-medium">{lecturer.vehicle_number || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Information - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Courses</Label>
                  <div className="mt-2">
                    {courseIds ? (
                       <p className="text-gray-900 font-medium">{courseIds}</p>
                    ) : (
                      <p className="text-gray-500 italic">No courses assigned</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Stream</Label>
                  <p className="text-gray-900 font-medium mt-1">{lecturer.stream || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Module</Label>
                  <p className="text-gray-900 font-medium mt-1">{lecturer.module || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Category</Label>
                  <p className="text-gray-900 font-medium mt-1">Category {lecturer.category || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Details - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-yellow-600" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Bank Name</Label>
                  <p className="text-gray-900 font-medium mt-1">{bank.bank_name || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Branch</Label>
                  <p className="text-gray-900 font-medium mt-1">{bank.branch_name || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Account Number</Label>
                  <p className="text-gray-900 font-medium mt-1">{bank.account_number || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Details - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 h-full">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Academic Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Highest Qualification</Label>
                  <p className="text-gray-900 font-medium mt-1">{academic.highest_qualification || "N/A"}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Other Qualifications</Label>
                  <p className="text-gray-900 font-medium mt-1">{academic.other_qualifications || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Experience Section - Full Width */}
        {experience && experience.length > 0 && (
          <Card className="shadow-sm border-0 mt-6">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {experience.map((exp, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{exp.institution}</p>
                        <p className="text-sm text-blue-600 font-medium">{exp.designation}</p>
                      </div>
                    </div>
                    <div className="ml-11">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">
                          {exp.start} - {exp.end}
                        </span>
                        {exp.years && (
                          <span className="text-gray-500">
                            ({exp.years} {Number(exp.years) === 1 ? "year" : "years"})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{exp.nature}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              Assigned Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lecturer.courses && lecturer.courses.length > 0 ? (
              <div className="space-y-4">
                {lecturer.courses.map((course, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{course.courseName}</h4>
                            <p className="text-sm text-gray-600">Course ID: {course.courseId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Stream</Label>
                            <p className="text-gray-900 font-medium">{course.stream || lecturer.stream || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Module</Label>
                            <p className="text-gray-900 font-medium">{course.module || lecturer.module || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Status</Label>
                            <p className="text-gray-900 font-medium">{course.status || "Active"}</p>
                          </div>
                        </div>
                      </div>
                      {course.primary_course && (
                        <Badge className="bg-green-100 text-green-800 border-green-300 ml-4">
                          Primary Course
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No courses assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
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
                Are you sure you want to delete <strong className="text-red-600">{lecturer.full_name}</strong>? This
                action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleDeleteLecturer}
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
