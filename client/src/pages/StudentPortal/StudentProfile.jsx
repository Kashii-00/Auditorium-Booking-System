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

const StudentProfile = () => {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("studentToken")
      if (!token) {
        navigate("/student-login")
        return
      }

      const response = await axios.get(`${API_URL}/student-auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setStudent(response.data)
      setEditedData(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching student data:", error)
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
    setEditedData(student)
    setEditing(false)
  }

  const handleSave = async () => {
    try {
      // API call to save profile changes would go here
      setStudent(editedData)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/student-dashboard")}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
            </div>
            {!editing ? (
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                      <AvatarImage src={student?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                        {getInitials(student?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{student?.full_name}</h2>
                  <p className="text-slate-600 mb-4">{student?.email}</p>
                  <Badge variant="secondary" className="mb-4">
                    Active Student
                  </Badge>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      <CreditCard className="w-4 h-4 mr-2 text-slate-600" />
                      <span className="font-semibold text-slate-700">Student ID: {student?.id}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      NIC/Passport: {student?.id_number}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Shield className="w-4 h-4 mr-2" />
                      Status: Active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Details */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-slate-600">
                        Full Name
                      </Label>
                      {editing ? (
                        <Input
                          id="fullName"
                          value={editedData.full_name || ""}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {student?.full_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="text-sm font-medium text-slate-600">
                        ID Number
                      </Label>
                      <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                        {student?.id_number}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date of Birth
                      </Label>
                      {editing ? (
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={editedData.date_of_birth || ""}
                          onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {new Date(student?.date_of_birth).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality" className="text-sm font-medium text-slate-600">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Nationality
                      </Label>
                      {editing ? (
                        <Input
                          id="nationality"
                          value={editedData.nationality || ""}
                          onChange={(e) => handleInputChange("nationality", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {student?.nationality}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-600">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </Label>
                      {editing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedData.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {student?.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-600">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number
                      </Label>
                      {editing ? (
                        <Input
                          id="phone"
                          value={editedData.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {student?.phone || "Not provided"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-600">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </Label>
                      {editing ? (
                        <Input
                          id="address"
                          value={editedData.address || ""}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className="bg-white/50"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                          {student?.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Academic Information */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600">
                        Enrollment Date
                      </Label>
                      <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                        {student?.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600">
                        Active Courses
                      </Label>
                      <p className="text-slate-800 font-medium p-2 bg-slate-50 rounded-md">
                        {student?.courses?.filter(c => c.status === "Active").length || 0} courses
                      </p>
                    </div>
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

export default StudentProfile 