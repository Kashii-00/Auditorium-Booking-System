"use client"

import { useState, useEffect, useMemo, memo } from "react"
import {
  Check,
  Plus,
  Search,
  X,
  ChevronLeftIcon,
  Edit3,
  Eye,
  RefreshCw,
  Calendar,
  Users,
  DollarSign,
  BookOpen,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"
import { authRequest } from "../../services/authService"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Enhanced Success Popup Component
const SuccessPopup = memo(({ message, description }) => (
  <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500 border border-white/20 backdrop-blur-xl">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
        <Check className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-lg">{message}</p>
        <p className="text-emerald-100 text-sm">{description}</p>
      </div>
    </div>
  </div>
))

SuccessPopup.displayName = "SuccessPopup"

// Optimized StatCard with no animations
const StatCard = memo(({ title, value, subtext, icon: Icon, color = "blue", progress = 0 }) => {
  const colorClasses = useMemo(
    () => ({
      blue: "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-700 border-blue-300 shadow-blue-200/50",
      green:
        "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-200/50",
      yellow:
        "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 text-amber-700 border-amber-300 shadow-amber-200/50",
      purple:
        "bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 text-purple-700 border-purple-300 shadow-purple-200/50",
    }),
    [],
  )

  return (
    <Card className="border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-300 bg-white/95 backdrop-blur-xl transform hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-black text-slate-600 mb-2 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
          </div>
          <div
            className={`p-4 rounded-2xl shadow-xl border-2 ${colorClasses[color]} flex-shrink-0 transition-transform duration-300 hover:scale-110`}
          >
            <Icon className="h-7 w-7 transition-transform duration-300" />
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progress} className="h-2 bg-slate-200 transition-all duration-500" />
        </div>
      </CardContent>
    </Card>
  )
})

StatCard.displayName = "StatCard"

// Main Course Management Component
export default function CourseManagementImproved() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  const fetchCourses = async (showToast = false) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await authRequest("get", "http://10.70.4.34:5003/api/CourseRegistrationRoute")
      if (Array.isArray(data)) {
        setCourses(data)
        if (showToast) {
          setSuccessMessage("Courses refreshed successfully")
          setShowSuccessPopup(true)
          setTimeout(() => setShowSuccessPopup(false), 3000)
        }
      } else {
        throw new Error("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError(err.message || "Failed to load courses")
      toast({ variant: "destructive", title: "Error", description: "Failed to load courses." })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleCourseRegistered = (newCourse) => {
    fetchCourses()
    setShowRegistrationForm(false)
    setSuccessMessage(`${newCourse.courseName} has been successfully registered!`)
    setShowSuccessPopup(true)
    setTimeout(() => setShowSuccessPopup(false), 4000)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && <SuccessPopup message="Success!" description={successMessage} />}

      <div className="relative z-10 p-4 sm:p-6">
        {!showRegistrationForm ? (
          <CourseDashboard
            courses={courses}
            setCourses={setCourses}
            onRegisterClick={() => setShowRegistrationForm(true)}
            isLoading={isLoading}
            error={error}
            refreshCourses={() => fetchCourses(true)}
          />
        ) : (
          <CourseRegistrationForm onBack={() => setShowRegistrationForm(false)} onSuccess={handleCourseRegistered} />
        )}
      </div>
    </div>
  )
}

// Utility to parse JSON or fallback to array
const safeParseToArray = (value) => {
  if (Array.isArray(value)) return value
  if (value === null || typeof value === "undefined" || value === "") return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : parsed ? [String(parsed)] : []
  } catch {
    if (typeof value === "string") {
      if (value.includes(",")) {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }
      return [value.trim()].filter(Boolean)
    }
    return []
  }
}

const mediumOptions = ["English", "Sinhala", "Tamil"]
const locationOptions = ["ClassRoom", "ComputerLab", "Online", "Other"]
const assessmentOptions = ["Theory", "Assignment", "Practical", "Exam", "Lab", "Viva"]
const resourceOptions = ["Vehicle", "Yard", "Gantry", "ShipSimulator", "Onboard", "SeaTraining", "OnlinePlatform"]

// Enhanced Course Form Component
const CourseForm = ({ initialData, onSubmit, onCancel, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || "",
    stream: initialData?.stream || "",
    courseName: initialData?.courseName || "",
    description: initialData?.description || "",
    medium: initialData ? safeParseToArray(initialData.medium) : [],
    location: initialData ? safeParseToArray(initialData.location) : [],
    assessmentCriteria: initialData ? safeParseToArray(initialData.assessmentCriteria) : [],
    resources: initialData ? safeParseToArray(initialData.resources) : [],
    fees: initialData?.fees || "",
    registrationFee: initialData?.registrationFee || "",
    installment1: initialData?.installment1 || "",
    installment2: initialData?.installment2 || "",
    additionalInstallments: initialData ? safeParseToArray(initialData.additionalInstallments) : [],
    status: initialData?.status || "Active",
    start_date: initialData?.start_date?.split("T")[0] || "",
    end_date: initialData?.end_date?.split("T")[0] || "",
    duration: initialData?.duration || "",
  })

  const { start_date, end_date } = formData

  useEffect(() => {
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setFormData((prev) => ({ ...prev, duration: `${diff} days` }))
      } else {
        setFormData((prev) => ({ ...prev, duration: "" }))
      }
    } else if (!start_date && !end_date) {
      setFormData((prev) => ({ ...prev, duration: initialData?.duration || "" }))
    }
  }, [start_date, end_date, initialData?.duration])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const submissionData = {
      ...formData,
      medium: JSON.stringify(formData.medium),
      location: JSON.stringify(formData.location),
      assessmentCriteria: JSON.stringify(formData.assessmentCriteria),
      resources: JSON.stringify(formData.resources),
      additionalInstallments: JSON.stringify(formData.additionalInstallments),
    }
    onSubmit(submissionData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gradient-to-r from-slate-100 via-blue-100 to-indigo-100 p-1 rounded-2xl shadow-xl">
          <TabsTrigger
            value="general"
            className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="financials"
            className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg"
          >
            Financials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="courseId" className="text-sm font-black text-slate-700">
                Course ID *
              </Label>
              <Input
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                disabled={isEditMode}
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
            <div>
              <Label htmlFor="courseName" className="text-sm font-black text-slate-700">
                Course Name *
              </Label>
              <Input
                id="courseName"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                required
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="stream" className="text-sm font-black text-slate-700">
              Stream *
            </Label>
            <Input
              id="stream"
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              required
              className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="start_date" className="text-sm font-black text-slate-700">
                Start Date
              </Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="text-sm font-black text-slate-700">
                End Date
              </Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="duration" className="text-sm font-black text-slate-700">
              Duration
            </Label>
            <Input
              id="duration"
              name="duration"
              value={formData.duration}
              readOnly
              className="mt-2 h-12 bg-gradient-to-r from-slate-100 to-blue-100 border-2 border-slate-200 rounded-xl shadow-lg"
              placeholder="Auto-calculated"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-sm font-black text-slate-700">
              Status
            </Label>
            <Select
              name="status"
              value={formData.status || "Active"}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-black text-slate-700">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-2 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-8 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div>
            <Label className="text-lg font-black text-slate-800 mb-4 block">Medium</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mediumOptions.map((opt) => (
                <div
                  key={`medium-${opt}`}
                  className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    formData.medium.includes(opt)
                      ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-300/50"
                      : "border-slate-200 bg-white/90 hover:border-blue-300"
                  }`}
                >
                  <Checkbox
                    id={`edit-medium-${opt}`}
                    checked={formData.medium.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("medium", opt, !!checked)}
                    className="border-2"
                  />
                  <Label htmlFor={`edit-medium-${opt}`} className="flex-1 cursor-pointer font-semibold">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-black text-slate-800 mb-4 block">Location</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {locationOptions.map((opt) => (
                <div
                  key={`location-${opt}`}
                  className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    formData.location.includes(opt)
                      ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 ring-2 ring-emerald-300/50"
                      : "border-slate-200 bg-white/90 hover:border-emerald-300"
                  }`}
                >
                  <Checkbox
                    id={`edit-location-${opt}`}
                    checked={formData.location.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("location", opt, !!checked)}
                    className="border-2"
                  />
                  <Label htmlFor={`edit-location-${opt}`} className="flex-1 cursor-pointer font-semibold">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-black text-slate-800 mb-4 block">Assessment Criteria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {assessmentOptions.map((opt) => (
                <div
                  key={`assessment-${opt}`}
                  className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    formData.assessmentCriteria.includes(opt)
                      ? "border-purple-400 bg-gradient-to-r from-purple-50 to-violet-50 ring-2 ring-purple-300/50"
                      : "border-slate-200 bg-white/90 hover:border-purple-300"
                  }`}
                >
                  <Checkbox
                    id={`edit-assessment-${opt}`}
                    checked={formData.assessmentCriteria.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("assessmentCriteria", opt, !!checked)}
                    className="border-2"
                  />
                  <Label htmlFor={`edit-assessment-${opt}`} className="flex-1 cursor-pointer font-semibold">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-black text-slate-800 mb-4 block">Resources</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {resourceOptions.map((opt) => (
                <div
                  key={`resource-${opt}`}
                  className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    formData.resources.includes(opt)
                      ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-300/50"
                      : "border-slate-200 bg-white/90 hover:border-amber-300"
                  }`}
                >
                  <Checkbox
                    id={`edit-resource-${opt}`}
                    checked={formData.resources.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("resources", opt, !!checked)}
                    className="border-2"
                  />
                  <Label htmlFor={`edit-resource-${opt}`} className="flex-1 cursor-pointer font-semibold">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div>
            <Label htmlFor="fees" className="text-sm font-black text-slate-700">
              Total Fees
            </Label>
            <Input
              id="fees"
              name="fees"
              type="number"
              value={formData.fees}
              onChange={handleChange}
              placeholder="e.g., 1000"
              className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
          <div>
            <Label htmlFor="registrationFee" className="text-sm font-black text-slate-700">
              Registration Fee
            </Label>
            <Input
              id="registrationFee"
              name="registrationFee"
              type="number"
              value={formData.registrationFee}
              onChange={handleChange}
              placeholder="e.g., 100"
              className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="installment1" className="text-sm font-black text-slate-700">
                Installment 1
              </Label>
              <Input
                id="installment1"
                name="installment1"
                type="number"
                value={formData.installment1}
                onChange={handleChange}
                placeholder="e.g., 450"
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
            <div>
              <Label htmlFor="installment2" className="text-sm font-black text-slate-700">
                Installment 2
              </Label>
              <Input
                id="installment2"
                name="installment2"
                type="number"
                value={formData.installment2}
                onChange={handleChange}
                placeholder="e.g., 450"
                className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <DialogFooter className="pt-8 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isEditMode &&
            Object.keys(formData).every(
              (key) => initialData && JSON.stringify(formData[key]) === JSON.stringify(initialData[key]),
            )
          }
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold transform hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isEditMode ? "Update Course" : "Create Course"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Enhanced Course Dashboard Component
function CourseDashboard({ courses: initialCourses, setCourses, onRegisterClick, isLoading, error, refreshCourses }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const { toast } = useToast()

  const filteredCourses = useMemo(() => {
    return initialCourses.filter((course) => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        course.courseId?.toLowerCase().includes(searchLower) ||
        course.courseName?.toLowerCase().includes(searchLower) ||
        course.stream?.toLowerCase().includes(searchLower)

      const matchesStatus = statusFilter === "all" || course.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [initialCourses, searchQuery, statusFilter])

  const totalCourses = initialCourses.length
  const activeCourses = initialCourses.filter((course) => course.status === "Active").length
  const totalStudents = initialCourses.reduce((sum, course) => sum + (Number(course.students) || 0), 0)
  const totalRevenue = initialCourses.reduce((sum, course) => sum + (Number.parseFloat(course.fees) || 0), 0)

  const handleEditClick = (course) => {
    setEditingCourse(course)
    setShowEditDialog(true)
  }

  const handleEditSubmit = async (formData) => {
    if (!editingCourse) return
    setIsSubmittingEdit(true)
    try {
      const response = await authRequest(
        "put",
        `http://10.70.4.34:5003/api/CourseRegistrationRoute/${editingCourse.id}`,
        formData,
      )
      if (response.success) {
        setShowEditDialog(false)
        setEditingCourse(null)
        refreshCourses()
        toast({
          title: "Success!",
          description: `${response.course.courseName || formData.courseName} updated successfully.`,
        })
      } else {
        throw new Error(response.error || "Failed to update course")
      }
    } catch (err) {
      console.error("Error updating course:", err)
      toast({ variant: "destructive", title: "Update Failed", description: err.message || "Failed to update course." })
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300"
      case "pending":
        return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300"
      case "completed":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300"
      case "inactive":
        return "bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 border-rose-300"
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300"
    }
  }

  return (
    <>
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
              <BookOpen className="h-9 w-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
              Course Management
            </h1>
            <p className="text-slate-600 font-semibold text-lg mt-2">Manage your courses and training programs</p>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={refreshCourses}
            disabled={isLoading}
            className="flex-1 lg:flex-none h-14 px-6 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={onRegisterClick}
            className="flex-1 lg:flex-none h-14 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-2xl shadow-xl font-bold transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            <Sparkles className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>

      {/* Simple Static Statistics Cards - No Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6 mb-8">
        <StatCard
          title="Total Courses"
          value={totalCourses}
          subtext={`${activeCourses} active courses`}
          icon={BookOpen}
          color="blue"
          progress={totalCourses ? (activeCourses / totalCourses) * 100 : 0}
        />
        <StatCard
          title="Active Courses"
          value={activeCourses}
          subtext="Currently running"
          icon={TrendingUp}
          color="green"
          progress={activeCourses > 0 ? 85 : 0}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtext="Across all courses"
          icon={Users}
          color="purple"
          progress={totalStudents > 0 ? 70 : 0}
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtext="From all courses"
          icon={DollarSign}
          color="yellow"
          progress={totalRevenue > 0 ? 65 : 0}
        />
      </div>

      {/* Enhanced Main Content Card */}
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl mt-10">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Course Overview
              </CardTitle>
              <CardDescription className="text-slate-600 font-semibold">
                View and manage all registered courses
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Enhanced Search and Filter Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
            <div className="relative flex-1 max-w-md w-full lg:w-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search courses (ID, Name, Stream)..."
                className="pl-12 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Table */}
          <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl bg-white/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800">
                <TableRow>
                  <TableHead className="text-white font-bold py-4">ID</TableHead>
                  <TableHead className="text-white font-bold py-4">Name</TableHead>
                  <TableHead className="text-white font-bold py-4">Stream</TableHead>
                  <TableHead className="text-white font-bold py-4">Medium</TableHead>
                  <TableHead className="text-white font-bold py-4">Status</TableHead>
                  <TableHead className="text-white font-bold py-4">Fee</TableHead>
                  <TableHead className="text-right text-white font-bold py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell colSpan={7} className="py-8">
                          <div className="h-12 bg-gradient-to-r from-slate-200 to-blue-200 animate-pulse rounded-xl" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-full">
                          <X className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-red-600 font-semibold">{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshCourses}
                          className="rounded-xl font-bold shadow-lg"
                        >
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full">
                          <BookOpen className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-semibold text-lg">No courses found matching your criteria</p>
                        <p className="text-slate-400">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course, index) => {
                    const medium = safeParseToArray(course.medium)
                    const location = safeParseToArray(course.location)
                    return (
                      <TableRow
                        key={course.id || course.courseId}
                        className={`${
                          index % 2 === 0 ? "bg-white/80" : "bg-slate-50/80"
                        } hover:bg-blue-50/80 transition-all duration-200 backdrop-blur-sm`}
                      >
                        <TableCell className="font-bold text-slate-900 py-4">{course.courseId}</TableCell>
                        <TableCell className="max-w-xs truncate font-semibold py-4">{course.courseName}</TableCell>
                        <TableCell className="font-medium py-4">{course.stream}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {medium.length > 0 ? (
                              medium.map((m, i) => (
                                <Badge
                                  key={`${m}-${i}`}
                                  className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 text-xs font-semibold"
                                >
                                  {m}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={`${getStatusVariant(course.status)} border-2 font-bold px-3 py-1 rounded-full`}
                          >
                            {course.status || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 py-4">
                          ${Number.parseFloat(course.fees || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 rounded-xl font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
                                <DialogHeader className="border-b border-slate-200 pb-4">
                                  <DialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                                    {course.courseName}
                                  </DialogTitle>
                                  <DialogDescription className="text-slate-600 font-semibold">
                                    Detailed information for {course.courseId}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-6 text-sm">
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Stream:</Label>
                                    <div className="font-semibold">{course.stream}</div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Medium:</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {medium.length > 0
                                        ? medium.map((m, i) => (
                                            <Badge
                                              key={`${m}-${i}`}
                                              className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 font-semibold"
                                            >
                                              {m}
                                            </Badge>
                                          ))
                                        : "N/A"}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Location:</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {location.length > 0
                                        ? location.map((l, i) => (
                                            <Badge
                                              key={`${l}-${i}`}
                                              className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-300 font-semibold"
                                            >
                                              {l.replace(/([A-Z])/g, " $1").trim()}
                                            </Badge>
                                          ))
                                        : "N/A"}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Duration:</Label>
                                    <div className="font-semibold">{course.duration || "N/A"}</div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Fee:</Label>
                                    <div className="font-bold text-lg">
                                      ${Number.parseFloat(course.fees || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                    <Label className="text-right text-slate-500 font-bold">Reg. Fee:</Label>
                                    <div className="font-semibold">
                                      ${Number.parseFloat(course.registrationFee || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                                    <Label className="text-right text-slate-500 font-bold pt-1">Description:</Label>
                                    <p className="text-slate-600 leading-relaxed">
                                      {course.description || "No description provided."}
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter className="border-t border-slate-200 pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={(e) =>
                                      e.currentTarget
                                        .closest('[role="dialog"]')
                                        ?.querySelector('[aria-label="Close"]')
                                        ?.click()
                                    }
                                    className="rounded-xl font-bold shadow-lg"
                                  >
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(course)}
                              className="h-8 px-3 rounded-xl font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-lg"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Edit Dialog */}
      {showEditDialog && editingCourse && (
        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowEditDialog(false)
              setEditingCourse(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader className="border-b border-slate-200 pb-4">
              <DialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Edit Course: {editingCourse.courseName}
              </DialogTitle>
              <DialogDescription className="text-slate-600 font-semibold">
                Update the details for this course. Make sure to save your changes.
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              initialData={editingCourse}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingCourse(null)
              }}
              isEditMode={true}
            />
            {isSubmittingEdit && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-slate-600 font-semibold">Submitting changes...</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Enhanced Course Registration Form Component
function CourseRegistrationForm({ onBack, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0)
  const [resourceTab, setResourceTab] = useState("assessment")
  const [formData, setFormData] = useState({
    courseId: "",
    stream: "",
    courseName: "",
    description: "",
    medium: [],
    location: [],
    assessmentCriteria: [],
    resources: [],
    fees: "",
    registrationFee: "",
    start_date: "",
    end_date: "",
    duration: "",
  })
  const [installments, setInstallments] = useState([
    { label: "Installment 1", value: "", weeks: "", enabled: false },
    { label: "Installment 2", value: "", weeks: "", enabled: false },
  ])
  const [errors, setErrors] = useState({})
  const [courseIdError, setCourseIdError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const steps = [
    { label: "Basic Info", icon: BookOpen },
    { label: "Details", icon: Star },
    { label: "Resources & Fee", icon: DollarSign },
    { label: "Payment Plan", icon: Calendar },
  ]

  const validateForm = () => {
    const newErrors = {}
    if (activeStep === 0) {
      if (!formData.courseId.trim()) newErrors.courseId = "Course ID is required"
      if (courseIdError) newErrors.courseId = courseIdError
      if (!formData.stream.trim()) newErrors.stream = "Stream is required"
      if (!formData.courseName.trim()) newErrors.courseName = "Course Name is required"
    }
    if (activeStep === 1) {
      if (!formData.medium.length) newErrors.medium = "Select at least one medium"
      if (!formData.location.length) newErrors.location = "Select at least one location"
    }
    if (activeStep === 2) {
      if (resourceTab === "assessment" && !formData.assessmentCriteria.length)
        newErrors.assessmentCriteria = "Select at least one assessment criteria"
      if (resourceTab === "resources" && !formData.resources.length)
        newErrors.resources = "Select at least one resource"
      if (!formData.fees || isNaN(Number(formData.fees)) || Number(formData.fees) <= 0)
        newErrors.fees = "Enter a valid base fee amount"
    }
    if (activeStep === 3) {
      const baseFee = Number(formData.fees) || 0
      const regFee = Number(formData.registrationFee)
      if (!formData.registrationFee || isNaN(regFee) || regFee <= 0)
        newErrors.registrationFee = "Registration fee is required and must be > 0"
      installments.forEach((inst, idx) => {
        if (inst.enabled && (!inst.value || isNaN(Number(inst.value)) || Number(inst.value) <= 0))
          newErrors[`installment${idx + 1}`] = `${inst.label} amount is required and must be > 0`
      })
      const totalInstallmentSum = installments.reduce(
        (acc, inst) => acc + (inst.enabled ? Number(inst.value) || 0 : 0),
        0,
      )
      if (baseFee <= 0) newErrors.fees = "Base fee must be set in the previous step."
      if (totalInstallmentSum + regFee > baseFee)
        newErrors.installmentsSummary = "Sum of registration fee and installments cannot exceed the total course fee."
      if (
        totalInstallmentSum + regFee < baseFee &&
        installments.some((i) => i.enabled) &&
        totalInstallmentSum + regFee !== 0
      )
        newErrors.installmentsSummary =
          "Sum of registration fee and installments is less than the total course fee. Ensure all amounts are covered or adjust installments."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === "start_date" || name === "end_date") {
        const start = new Date(name === "start_date" ? value : prev.start_date)
        const end = new Date(name === "end_date" ? value : prev.end_date)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          updated.duration = `${diff} days`
        } else {
          updated.duration = ""
        }
      }
      return updated
    })
  }

  const handleCheckboxChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }))
  }

  const handleInstallmentChange = (idx, field, val) =>
    setInstallments((prev) => prev.map((inst, i) => (i === idx ? { ...inst, [field]: val } : inst)))

  const handleInstallmentToggle = (idx) =>
    setInstallments((prev) =>
      prev.map((inst, i) =>
        i === idx
          ? {
              ...inst,
              enabled: !inst.enabled,
              value: !inst.enabled ? inst.value : "",
              weeks: !inst.enabled ? inst.weeks : "",
            }
          : inst,
      ),
    )

  const addInstallment = () =>
    setInstallments((prev) => [
      ...prev,
      { label: `Installment ${prev.length + 1}`, value: "", weeks: "", enabled: false },
    ])

  const removeInstallment = (idx) => setInstallments((prev) => prev.filter((_, i) => i !== idx))

  const getRemaining = () => {
    const baseFee = Number(formData.fees) || 0
    const regFee = Number(formData.registrationFee) || 0
    const installmentSum = installments.reduce((acc, inst) => acc + (inst.enabled ? Number(inst.value) || 0 : 0), 0)
    return baseFee - regFee - installmentSum
  }

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const additionalInstallments = installments
      .filter((inst) => inst.enabled)
      .map((inst) => ({
        amount: Number(inst.value),
        weeks: Number(inst.weeks) || 0,
        label: inst.label,
      }))

    const submissionData = {
      ...formData,
      medium: JSON.stringify(formData.medium),
      location: JSON.stringify(formData.location),
      assessmentCriteria: JSON.stringify(formData.assessmentCriteria),
      resources: JSON.stringify(formData.resources),
      additionalInstallments: JSON.stringify(additionalInstallments),
      installment1: installments[0]?.enabled ? installments[0].value : "",
      installment2: installments[1]?.enabled ? installments[1].value : "",
      status: "Active",
    }

    setIsLoading(true)
    try {
      const response = await authRequest("post", "http://10.70.4.34:5003/api/CourseRegistrationRoute", submissionData)
      if (response.success) {
        toast({
          title: "Success!",
          description: `${submissionData.courseName} has been successfully registered.`,
        })
        onSuccess(submissionData)
      } else {
        throw new Error(response.error || "Failed to register course")
      }
    } catch (err) {
      console.error("Error registering course:", err)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "Failed to register course.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkCourseIdAvailability = async (id) => {
    if (!id.trim()) {
      setCourseIdError("")
      return
    }
    try {
      const response = await authRequest("get", `http://10.70.4.34:5003/api/CourseRegistrationRoute/check/${id}`)
      if (response.exists) {
        setCourseIdError("This Course ID is already in use")
      } else {
        setCourseIdError("")
      }
    } catch (err) {
      console.error("Error checking course ID:", err)
      setCourseIdError("Unable to verify Course ID availability")
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-0 p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl shadow-xl">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
              Register New Course
            </h2>
            <p className="text-slate-600 font-semibold">Create a new course in the system</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 px-6 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Enhanced Stepper */}
      <div className="mb-10">
        <div className="flex justify-between items-center">
          {steps.map((step, idx) => {
            const StepIcon = step.icon
            return (
              <div key={idx} className="flex flex-col items-center relative flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl z-10 transition-all duration-300 ${
                    idx < activeStep
                      ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                      : idx === activeStep
                        ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white ring-4 ring-blue-200"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
                >
                  {idx < activeStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className={`h-6 w-6 ${idx === activeStep ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <p
                  className={`mt-2 font-bold text-sm ${
                    idx === activeStep ? "text-blue-700" : idx < activeStep ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-[calc(50%+24px)] right-[calc(50%-24px)] h-1 transition-all duration-500 ${
                      idx < activeStep ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-slate-200"
                    }`}
                  ></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Info */}
        {activeStep === 0 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="courseId" className="text-sm font-black text-slate-700">
                  Course ID *
                </Label>
                <Input
                  id="courseId"
                  name="courseId"
                  value={formData.courseId}
                  onChange={(e) => {
                    handleInputChange(e)
                    checkCourseIdAvailability(e.target.value)
                  }}
                  className={`mt-2 h-12 border-2 ${
                    errors.courseId || courseIdError
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-200 focus:border-blue-500"
                  } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                  placeholder="e.g., COURSE-001"
                />
                {(errors.courseId || courseIdError) && (
                  <p className="text-red-500 text-sm mt-1">{errors.courseId || courseIdError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="stream" className="text-sm font-black text-slate-700">
                  Stream *
                </Label>
                <Input
                  id="stream"
                  name="stream"
                  value={formData.stream}
                  onChange={handleInputChange}
                  className={`mt-2 h-12 border-2 ${
                    errors.stream ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                  } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                  placeholder="e.g., Engineering"
                />
                {errors.stream && <p className="text-red-500 text-sm mt-1">{errors.stream}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="courseName" className="text-sm font-black text-slate-700">
                Course Name *
              </Label>
              <Input
                id="courseName"
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                className={`mt-2 h-12 border-2 ${
                  errors.courseName ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                placeholder="e.g., Advanced Web Development"
              />
              {errors.courseName && <p className="text-red-500 text-sm mt-1">{errors.courseName}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="start_date" className="text-sm font-black text-slate-700">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-sm font-black text-slate-700">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration" className="text-sm font-black text-slate-700">
                Duration
              </Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                readOnly
                className="mt-2 h-12 bg-gradient-to-r from-slate-100 to-blue-100 border-2 border-slate-200 rounded-xl shadow-lg"
                placeholder="Auto-calculated from dates"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-black text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-2 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                placeholder="Provide a detailed description of the course..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {activeStep === 1 && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div>
              <Label className="text-lg font-black text-slate-800 mb-4 block">Medium *</Label>
              {errors.medium && <p className="text-red-500 text-sm mb-2">{errors.medium}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mediumOptions.map((opt) => (
                  <div
                    key={`medium-${opt}`}
                    className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                      formData.medium.includes(opt)
                        ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-300/50"
                        : "border-slate-200 bg-white/90 hover:border-blue-300"
                    }`}
                  >
                    <Checkbox
                      id={`medium-${opt}`}
                      checked={formData.medium.includes(opt)}
                      onCheckedChange={(checked) => handleCheckboxChange("medium", opt, !!checked)}
                      className="border-2"
                    />
                    <Label htmlFor={`medium-${opt}`} className="flex-1 cursor-pointer font-semibold">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lg font-black text-slate-800 mb-4 block">Location *</Label>
              {errors.location && <p className="text-red-500 text-sm mb-2">{errors.location}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {locationOptions.map((opt) => (
                  <div
                    key={`location-${opt}`}
                    className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                      formData.location.includes(opt)
                        ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 ring-2 ring-emerald-300/50"
                        : "border-slate-200 bg-white/90 hover:border-emerald-300"
                    }`}
                  >
                    <Checkbox
                      id={`location-${opt}`}
                      checked={formData.location.includes(opt)}
                      onCheckedChange={(checked) => handleCheckboxChange("location", opt, !!checked)}
                      className="border-2"
                    />
                    <Label htmlFor={`location-${opt}`} className="flex-1 cursor-pointer font-semibold">
                      {opt.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Resources & Fee */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <Tabs value={resourceTab} onValueChange={setResourceTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-slate-100 via-blue-100 to-indigo-100 p-1 rounded-2xl shadow-xl">
                <TabsTrigger
                  value="assessment"
                  className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg"
                >
                  Assessment Criteria
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg"
                >
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assessment" className="space-y-6">
                <div>
                  <Label className="text-lg font-black text-slate-800 mb-4 block">Assessment Criteria *</Label>
                  {errors.assessmentCriteria && (
                    <p className="text-red-500 text-sm mb-2">{errors.assessmentCriteria}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {assessmentOptions.map((opt) => (
                      <div
                        key={`assessment-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                          formData.assessmentCriteria.includes(opt)
                            ? "border-purple-400 bg-gradient-to-r from-purple-50 to-violet-50 ring-2 ring-purple-300/50"
                            : "border-slate-200 bg-white/90 hover:border-purple-300"
                        }`}
                      >
                        <Checkbox
                          id={`assessment-${opt}`}
                          checked={formData.assessmentCriteria.includes(opt)}
                          onCheckedChange={(checked) => handleCheckboxChange("assessmentCriteria", opt, !!checked)}
                          className="border-2"
                        />
                        <Label htmlFor={`assessment-${opt}`} className="flex-1 cursor-pointer font-semibold">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-6">
                <div>
                  <Label className="text-lg font-black text-slate-800 mb-4 block">Resources *</Label>
                  {errors.resources && <p className="text-red-500 text-sm mb-2">{errors.resources}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {resourceOptions.map((opt) => (
                      <div
                        key={`resource-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                          formData.resources.includes(opt)
                            ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-300/50"
                            : "border-slate-200 bg-white/90 hover:border-amber-300"
                        }`}
                      >
                        <Checkbox
                          id={`resource-${opt}`}
                          checked={formData.resources.includes(opt)}
                          onCheckedChange={(checked) => handleCheckboxChange("resources", opt, !!checked)}
                          className="border-2"
                        />
                        <Label htmlFor={`resource-${opt}`} className="flex-1 cursor-pointer font-semibold">
                          {opt.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-6 border-t border-slate-200">
              <Label htmlFor="fees" className="text-lg font-black text-slate-800 mb-4 block">
                Course Fee *
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  value={formData.fees}
                  onChange={handleInputChange}
                  className={`pl-10 h-14 text-xl font-bold border-2 ${
                    errors.fees ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                  } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                  placeholder="0.00"
                />
              </div>
              {errors.fees && <p className="text-red-500 text-sm mt-1">{errors.fees}</p>}
            </div>
          </div>
        )}

        {/* Step 4: Payment Plan */}
        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="registrationFee" className="text-lg font-black text-slate-800">
                  Registration Fee *
                </Label>
                <div className="text-sm font-semibold text-slate-500">
                  Total Course Fee:{" "}
                  <span className="text-blue-700">${Number(formData.fees || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <Input
                  id="registrationFee"
                  name="registrationFee"
                  type="number"
                  value={formData.registrationFee}
                  onChange={handleInputChange}
                  className={`pl-10 h-14 text-xl font-bold border-2 ${
                    errors.registrationFee
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-200 focus:border-blue-500"
                  } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                  placeholder="0.00"
                />
              </div>
              {errors.registrationFee && <p className="text-red-500 text-sm mt-1">{errors.registrationFee}</p>}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-black text-slate-800">Installment Plan</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstallment}
                  className="h-9 px-3 rounded-xl font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg"
                  disabled={installments.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Installment
                </Button>
              </div>

              <div className="space-y-4">
                {installments.map((inst, idx) => (
                  <div
                    key={`installment-${idx}`}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 shadow-lg ${
                      inst.enabled
                        ? "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50"
                        : "border-slate-200 bg-white/90"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`installment-toggle-${idx}`}
                          checked={inst.enabled}
                          onCheckedChange={() => handleInstallmentToggle(idx)}
                          className="border-2"
                        />
                        <Label
                          htmlFor={`installment-toggle-${idx}`}
                          className={`font-bold cursor-pointer ${inst.enabled ? "text-blue-700" : "text-slate-500"}`}
                        >
                          {inst.label}
                        </Label>
                      </div>
                      {idx > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstallment(idx)}
                          className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {inst.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`installment-amount-${idx}`}
                            className="text-sm font-bold text-slate-700 mb-1 block"
                          >
                            Amount
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-slate-500 font-bold">$</span>
                            </div>
                            <Input
                              id={`installment-amount-${idx}`}
                              type="number"
                              value={inst.value}
                              onChange={(e) => handleInstallmentChange(idx, "value", e.target.value)}
                              className={`pl-8 h-10 border-2 ${
                                errors[`installment${idx + 1}`]
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-slate-200 focus:border-blue-500"
                              } rounded-xl bg-white/90 backdrop-blur-sm shadow-lg`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors[`installment${idx + 1}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`installment${idx + 1}`]}</p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor={`installment-weeks-${idx}`}
                            className="text-sm font-bold text-slate-700 mb-1 block"
                          >
                            Due After (weeks)
                          </Label>
                          <Input
                            id={`installment-weeks-${idx}`}
                            type="number"
                            value={inst.weeks}
                            onChange={(e) => handleInstallmentChange(idx, "weeks", e.target.value)}
                            className="h-10 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                            placeholder="e.g., 4"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 shadow-xl">
              <h3 className="text-lg font-black text-slate-800 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Total Course Fee:</span>
                  <span className="font-bold text-lg">${Number(formData.fees || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Registration Fee:</span>
                  <span className="font-bold">${Number(formData.registrationFee || 0).toLocaleString()}</span>
                </div>
                {installments
                  .filter((inst) => inst.enabled)
                  .map((inst, idx) => (
                    <div key={`summary-${idx}`} className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold">{inst.label}:</span>
                      <span className="font-bold">${Number(inst.value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-bold">Remaining Balance:</span>
                  <span
                    className={`font-black text-lg ${
                      getRemaining() === 0 ? "text-emerald-600" : getRemaining() < 0 ? "text-red-600" : "text-blue-700"
                    }`}
                  >
                    ${getRemaining().toLocaleString()}
                  </span>
                </div>
              </div>
              {errors.installmentsSummary && (
                <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                  {errors.installmentsSummary}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={activeStep === 0 ? onBack : handleBack}
            className="px-6 py-3 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
          >
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold transform hover:scale-105 transition-all duration-300"
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold transform hover:scale-105 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Register Course
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
