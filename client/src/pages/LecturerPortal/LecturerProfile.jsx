import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Calendar,
  Globe,
  MapPin,
  Phone,
  CreditCard,
  Shield,
  ArrowLeft,
  Edit,
  Save,
  X,
  Camera,
  GraduationCap,
  Award,
  Building,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import LoadingScreen from "@/pages/LoadingScreen/LoadingScreen"

const API_URL = "http://localhost:5003/api"

const LecturerProfile = () => {
  const [lecturer, setLecturer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchLecturerData()
  }, [])

  const fetchLecturerData = async () => {
    try {
      const token = localStorage.getItem("lecturerToken")
      if (!token) {
        navigate("/lecturer-login")
        return
      }

      const response = await axios.get(`${API_URL}/lecturer-auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setLecturer(response.data)
      setEditedData(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching lecturer data:", error)
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditedData(lecturer)
    setEditing(false)
  }

  const handleSave = async () => {
    try {
      // API call to save profile changes would go here
      setLecturer(editedData)
      setEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return <LoadingScreen message="Loading profile..." type="users" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-100/50 relative overflow-hidden">
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(5,150,105,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(34,197,94,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/lecturer-dashboard")}
                className="hover:bg-emerald-50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
            </div>
            {!editing ? (
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture and Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                      <AvatarImage src={lecturer?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-3xl font-bold">
                        {getInitials(lecturer?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{lecturer?.full_name}</h2>
                  <p className="text-slate-600 mb-4">{lecturer?.email}</p>
                  <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-800">
                    Active Lecturer
                  </Badge>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-slate-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      ID: {lecturer?.id_number}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Shield className="w-4 h-4 mr-2" />
                      Status: Active
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Designation: {lecturer?.designation || "Lecturer"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    {editing ? (
                      <Input
                        id="full_name"
                        value={editedData.full_name || ""}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.full_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={editedData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    {editing ? (
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={editedData.date_of_birth?.split('T')[0] || ""}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">
                        {lecturer?.date_of_birth ? new Date(lecturer.date_of_birth).toLocaleDateString() : "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  {editing ? (
                    <Input
                      id="address"
                      value={editedData.address || ""}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900">{lecturer?.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
                  Academic Information
                </CardTitle>
                <CardDescription>
                  Your qualifications and teaching details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highest_qualification">Highest Qualification</Label>
                    {editing ? (
                      <Input
                        id="highest_qualification"
                        value={editedData.academic_details?.highest_qualification || ""}
                        onChange={(e) => handleInputChange("academic_details", {
                          ...editedData.academic_details,
                          highest_qualification: e.target.value
                        })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">
                        {lecturer?.academic_details?.highest_qualification || "Not provided"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="stream">Stream</Label>
                    {editing ? (
                      <Input
                        id="stream"
                        value={editedData.stream || ""}
                        onChange={(e) => handleInputChange("stream", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.stream || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="module">Module</Label>
                    {editing ? (
                      <Input
                        id="module"
                        value={editedData.module || ""}
                        onChange={(e) => handleInputChange("module", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.module || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    {editing ? (
                      <Input
                        id="category"
                        value={editedData.category || ""}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">{lecturer?.category || "Not provided"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="other_qualifications">Other Qualifications</Label>
                  {editing ? (
                    <Input
                      id="other_qualifications"
                      value={editedData.academic_details?.other_qualifications || ""}
                      onChange={(e) => handleInputChange("academic_details", {
                        ...editedData.academic_details,
                        other_qualifications: e.target.value
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900">
                      {lecturer?.academic_details?.other_qualifications || "Not provided"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Course Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-emerald-600" />
                  Courses & Teaching
                </CardTitle>
                <CardDescription>
                  Courses you are currently teaching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lecturer?.courses && lecturer.courses.length > 0 ? (
                    lecturer.courses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{course.courseName || course.course_name}</h3>
                            <p className="text-sm text-slate-600">
                              {course.students || 0} students enrolled
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {course.status || "Active"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-center py-8">No courses assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bank Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-emerald-600" />
                  Bank Information
                </CardTitle>
                <CardDescription>
                  Your banking details for payroll
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    {editing ? (
                      <Input
                        id="bank_name"
                        value={editedData.bank_details?.bank_name || ""}
                        onChange={(e) => handleInputChange("bank_details", {
                          ...editedData.bank_details,
                          bank_name: e.target.value
                        })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">
                        {lecturer?.bank_details?.bank_name || "Not provided"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="branch_name">Branch Name</Label>
                    {editing ? (
                      <Input
                        id="branch_name"
                        value={editedData.bank_details?.branch_name || ""}
                        onChange={(e) => handleInputChange("bank_details", {
                          ...editedData.bank_details,
                          branch_name: e.target.value
                        })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">
                        {lecturer?.bank_details?.branch_name || "Not provided"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    {editing ? (
                      <Input
                        id="account_number"
                        value={editedData.bank_details?.account_number || ""}
                        onChange={(e) => handleInputChange("bank_details", {
                          ...editedData.bank_details,
                          account_number: e.target.value
                        })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-slate-900">
                        {lecturer?.bank_details?.account_number ? 
                          "****" + lecturer.bank_details.account_number.slice(-4) : 
                          "Not provided"
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LecturerProfile 