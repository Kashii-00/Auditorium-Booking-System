"use client"

import { useState, useEffect, useMemo, memo, useLayoutEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Check,
  X,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Star,
  Sparkles,
  Activity,
  BookOpen,
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
  Globe,
  Hash,
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  Download,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Save,
  Upload,
  Mail,
  Loader2,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Enhanced Success Popup Component
const SuccessPopup = memo(({ isOpen, onClose, title, description, courseName }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-scale-in">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-200">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 mb-2">{description}</p>
          {courseName && (
            <p className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-4">
              {courseName}
            </p>
          )}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-300"
          >
            Continue
          </Button>
          </div>
        </div>
        </div>
  )
})

SuccessPopup.displayName = "SuccessPopup"

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

// Course Registration Form Component
function CourseRegistrationForm({ onBack, onSuccess, editingCourse, isEditMode = false }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    courseId: editingCourse?.courseId || "",
    stream: editingCourse?.stream || "",
    courseName: editingCourse?.courseName || "",
    description: editingCourse?.description || "",
    medium: editingCourse ? safeParseToArray(editingCourse.medium) : [],
    location: editingCourse ? safeParseToArray(editingCourse.location) : [],
    assessmentCriteria: editingCourse ? safeParseToArray(editingCourse.assessmentCriteria) : [],
    resources: editingCourse ? safeParseToArray(editingCourse.resources) : [],
    fees: editingCourse?.fees || "",
    registrationFee: editingCourse?.registrationFee || "",
    installment1: editingCourse?.installment1 || "",
    installment2: editingCourse?.installment2 || "",
    additionalInstallments: editingCourse ? safeParseToArray(editingCourse.additionalInstallments) : [],
    status: editingCourse?.status || "Active",
    start_date: editingCourse?.start_date?.split("T")[0] || "",
    end_date: editingCourse?.end_date?.split("T")[0] || "",
    duration: editingCourse?.duration || "",
  })

  const [errors, setErrors] = useState({})
  const [courseIdError, setCourseIdError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const { toast } = useToast()

  const formSections = useMemo(() => [
    {
      title: "Basic Information",
      icon: BookOpen,
      fields: ["courseId", "stream", "courseName", "description", "start_date", "end_date", "status"]
    },
    {
      title: "Course Details", 
      icon: Star,
      fields: ["medium", "location"]
    },
    {
      title: "Assessment & Resources",
      icon: Target,
      fields: ["assessmentCriteria", "resources"]
    },
    {
      title: "Financial Information",
      icon: DollarSign,
      fields: ["fees", "installment1", "installment2"]
    }
  ], [])

  // Calculate duration automatically
  useEffect(() => {
    const { start_date, end_date } = formData
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setFormData((prev) => ({ ...prev, duration: `${diff} days` }))
      } else {
        setFormData((prev) => ({ ...prev, duration: "" }))
      }
    }
  }, [formData.start_date, formData.end_date])

  const validateForm = useCallback((step = currentStep) => {
    const newErrors = {}
    const fieldsToValidate = [...formSections[step].fields]
    
    fieldsToValidate.forEach((field) => {
      switch (field) {
        case "courseId":
          if (!formData.courseId.trim()) {
            newErrors.courseId = "Course ID is required"
          } else if (courseIdError) {
            newErrors.courseId = courseIdError
          }
          break
        case "stream":
          if (!formData.stream.trim()) {
            newErrors.stream = "Stream is required"
          }
          break
        case "courseName":
          if (!formData.courseName.trim()) {
            newErrors.courseName = "Course Name is required"
          }
          break
        case "medium":
          if (!formData.medium.length) {
            newErrors.medium = "Select at least one medium"
          }
          break
        case "location":
          if (!formData.location.length) {
            newErrors.location = "Select at least one location"
          }
          break
        case "assessmentCriteria":
          if (!formData.assessmentCriteria.length) {
            newErrors.assessmentCriteria = "Select at least one assessment criteria"
          }
          break
        case "resources":
          if (!formData.resources.length) {
            newErrors.resources = "Select at least one resource"
          }
          break
        case "fees":
          if (!formData.fees || isNaN(Number(formData.fees)) || Number(formData.fees) <= 0) {
            newErrors.fees = "Enter a valid fee amount"
          }
          break
        case "registrationFee":
          if (!formData.registrationFee || isNaN(Number(formData.registrationFee)) || Number(formData.registrationFee) <= 0) {
            newErrors.registrationFee = "Enter a valid registration fee"
          }
          break
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, formData, formSections, courseIdError])

  const handleNext = useCallback(() => {
    if (validateForm()) {
      if (currentStep < formSections.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }, [currentStep, validateForm, formSections.length])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }, [errors])

  const handleCheckboxChange = useCallback((field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value] 
        : prev[field].filter(item => item !== value)
    }))
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }, [errors])

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }, [errors])

  const checkCourseIdAvailability = async (id) => {
    if (!id.trim() || isEditMode) {
      setCourseIdError("")
      return
    }
    try {
      const response = await authRequest("get", `http://localhost:5003/api/CourseRegistrationRoute/check/${id}`)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all steps
    let allValid = true
    for (let i = 0; i < formSections.length; i++) {
      if (!validateForm(i)) {
        allValid = false
        setCurrentStep(i)
        break
      }
    }
    
    if (!allValid) return

    const submissionData = {
      ...formData,
      medium: JSON.stringify(formData.medium),
      location: JSON.stringify(formData.location),
      assessmentCriteria: JSON.stringify(formData.assessmentCriteria),
      resources: JSON.stringify(formData.resources),
      additionalInstallments: JSON.stringify(formData.additionalInstallments),
    }

    setIsLoading(true)
    try {
      const url = isEditMode 
        ? `http://localhost:5003/api/CourseRegistrationRoute/${editingCourse.id}`
        : "http://localhost:5003/api/CourseRegistrationRoute"
      
      const method = isEditMode ? "put" : "post"
      
      const response = await authRequest(method, url, submissionData)
      
      if (response.success) {
        setNotificationMessage(
          isEditMode 
            ? `${submissionData.courseName} has been successfully updated!`
            : `${submissionData.courseName} has been successfully registered!`
        )
        setShowSuccessNotification(true)
        
        setTimeout(() => {
          setShowSuccessNotification(false)
          onSuccess(submissionData)
        }, 2000)
      } else {
        throw new Error(response.error || `Failed to ${isEditMode ? 'update' : 'register'} course`)
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'registering'} course:`, err)
      toast({
        variant: "destructive",
        title: `${isEditMode ? 'Update' : 'Registration'} Failed`,
        description: err.message || `Failed to ${isEditMode ? 'update' : 'register'} course.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const streamOptions = ["Maritime", "Electrical", "Management & IS", "Equipment"]
  const mediumOptions = ["English", "Sinhala", "Tamil"]
  const locationOptions = ["Class Room", "Computer Lab"]
  const assessmentOptions = ["Theory", "Assignment", "Practical", "Exam", "Lab", "Viva"]
  const resourceOptions = ["Vehicle", "Onboard", "Gantry", "Sea Training", "Yard", "Ship Simulator"]

  const renderFormFields = () => {
    const currentFields = formSections[currentStep].fields

    return (
      <div className="space-y-8">
        {currentFields.map((field) => {
          switch (field) {
            case "courseId":
              return (
                <div key={field} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                      <Label htmlFor="courseId" className="text-sm font-bold text-slate-700">
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
                required
                disabled={isEditMode}
                        className={`mt-2 h-12 border-2 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg ${
                          errors.courseId || courseIdError ? "border-red-500" : "border-slate-200"
                        }`}
                        placeholder="e.g., COURSE-001"
              />
                      {(errors.courseId || courseIdError) && (
                        <p className="text-red-500 text-sm mt-1">{errors.courseId || courseIdError}</p>
                      )}
            </div>
            <div>
                      <Label htmlFor="courseName" className="text-sm font-bold text-slate-700">
                Course Name *
              </Label>
              <Input
                id="courseName"
                name="courseName"
                value={formData.courseName}
                        onChange={handleInputChange}
                required
                        className={`mt-2 h-12 border-2 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg ${
                          errors.courseName ? "border-red-500" : "border-slate-200"
                        }`}
                        placeholder="e.g., Advanced Web Development"
              />
                      {errors.courseName && <p className="text-red-500 text-sm mt-1">{errors.courseName}</p>}
            </div>
          </div>
                </div>
              )

            case "stream":
              return (
                <div key={field}>
                  <Label htmlFor="stream" className="text-sm font-bold text-slate-700">
              Stream *
            </Label>
                  <Select
              name="stream"
              value={formData.stream}
                    onValueChange={(value) => handleSelectChange("stream", value)}
                  >
                    <SelectTrigger className="mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {streamOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stream && <p className="text-red-500 text-sm mt-1">{errors.stream}</p>}
                </div>
              )

            case "courseName":
              return null // Already handled in courseId case

            case "description":
              return (
                <div key={field}>
                  <Label htmlFor="description" className="text-sm font-bold text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-2 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg resize-none"
                    placeholder="Provide a detailed description of the course including objectives, content overview, and expected outcomes..."
            />
          </div>
              )

            case "start_date":
              return (
                <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                    <Label htmlFor="start_date" className="text-sm font-bold text-slate-700">
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
                    <Label htmlFor="end_date" className="text-sm font-bold text-slate-700">
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
              )

            case "status":
              return (
                <div key={field}>
                  <Label htmlFor="status" className="text-sm font-bold text-slate-700">
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
              )

            case "medium":
              return (
                <div key={field}>
                  <Label className="text-lg font-bold text-slate-800 mb-4 block">Medium *</Label>
                  {errors.medium && <p className="text-red-500 text-sm mb-2">{errors.medium}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediumOptions.map((opt) => (
                <div
                  key={`medium-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-5 transition-all duration-300 shadow-lg hover:shadow-xl ${
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
                        <Label htmlFor={`medium-${opt}`} className="flex-1 cursor-pointer font-semibold text-sm">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>
              )

            case "location":
              return (
                <div key={field}>
                  <Label className="text-lg font-bold text-slate-800 mb-4 block">Location *</Label>
                  {errors.location && <p className="text-red-500 text-sm mb-2">{errors.location}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {locationOptions.map((opt) => (
                <div
                  key={`location-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-5 transition-all duration-300 shadow-lg hover:shadow-xl ${
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
                        <Label htmlFor={`location-${opt}`} className="flex-1 cursor-pointer font-semibold text-sm">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
              )

            case "assessmentCriteria":
              return (
                <div key={field}>
                  <Label className="text-lg font-bold text-slate-800 mb-4 block">Assessment Criteria *</Label>
                  {errors.assessmentCriteria && <p className="text-red-500 text-sm mb-2">{errors.assessmentCriteria}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessmentOptions.map((opt) => (
                <div
                  key={`assessment-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-5 transition-all duration-300 shadow-lg hover:shadow-xl ${
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
                        <Label htmlFor={`assessment-${opt}`} className="flex-1 cursor-pointer font-semibold text-sm">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>
              )

            case "resources":
              return (
                <div key={field}>
                  <Label className="text-lg font-bold text-slate-800 mb-4 block">Resources *</Label>
                  {errors.resources && <p className="text-red-500 text-sm mb-2">{errors.resources}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resourceOptions.map((opt) => (
                <div
                  key={`resource-${opt}`}
                        className={`flex items-center space-x-3 rounded-2xl border-2 p-5 transition-all duration-300 shadow-lg hover:shadow-xl ${
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
                        <Label htmlFor={`resource-${opt}`} className="flex-1 cursor-pointer font-semibold text-sm">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
              )

            case "fees":
              return (
                <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                    <Label htmlFor="fees" className="text-sm font-bold text-slate-700">
                      Course Fee *
            </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-slate-500 font-bold">Rs.</span>
                      </div>
            <Input
              id="fees"
              name="fees"
              type="number"
              value={formData.fees}
                        onChange={handleInputChange}
                        className={`pl-10 mt-2 h-12 border-2 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg ${
                          errors.fees ? "border-red-500" : "border-slate-200"
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.fees && <p className="text-red-500 text-sm mt-1">{errors.fees}</p>}
          </div>
          <div>
                    <Label htmlFor="registrationFee" className="text-sm font-bold text-slate-700">
                      Registration Fee *
            </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-slate-500 font-bold">Rs.</span>
                      </div>
            <Input
              id="registrationFee"
              name="registrationFee"
              type="number"
              value={formData.registrationFee}
                        onChange={handleInputChange}
                        className={`pl-10 mt-2 h-12 border-2 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg ${
                          errors.registrationFee ? "border-red-500" : "border-slate-200"
                        }`}
                        placeholder="0.00"
            />
          </div>
                    {errors.registrationFee && <p className="text-red-500 text-sm mt-1">{errors.registrationFee}</p>}
                  </div>
                </div>
              )

            case "installment1":
              return (
                <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                    <Label htmlFor="installment1" className="text-sm font-bold text-slate-700">
                Installment 1
              </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-slate-500 font-bold">Rs.</span>
                      </div>
              <Input
                id="installment1"
                name="installment1"
                type="number"
                value={formData.installment1}
                        onChange={handleInputChange}
                        className="pl-10 mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                        placeholder="0.00"
                      />
                    </div>
            </div>
            <div>
                    <Label htmlFor="installment2" className="text-sm font-bold text-slate-700">
                Installment 2
              </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-slate-500 font-bold">Rs.</span>
                      </div>
              <Input
                id="installment2"
                name="installment2"
                type="number"
                value={formData.installment2}
                        onChange={handleInputChange}
                        className="pl-10 mt-2 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg"
                        placeholder="0.00"
              />
            </div>
          </div>
                </div>
              )

            default:
              return null
          }
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
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
              <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                  {isEditMode ? "Edit Course" : "Register New Course"}
                </h1>
                <p className="text-slate-600 text-lg font-semibold mt-1">
                  {isEditMode ? `Update ${editingCourse?.courseName}` : "Create a new course in the system"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2 border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Enhanced Registration Form */}
        <Card className="animate-fade-in border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = formSections[currentStep].icon
                  return <Icon className="h-6 w-6 text-blue-600" />
                })()}
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                  {formSections[currentStep].title}
                </CardTitle>
              </div>
              {isEditMode && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 font-bold px-4 py-2 text-sm"
                >
                  Editing: {editingCourse?.courseName}
                </Badge>
              )}
            </div>
            
            {/* Progress Stepper */}
            <div className="mt-8">
              <div className="flex justify-between items-center">
                {formSections.map((section, index) => {
                  const Icon = section.icon
                  const isActive = index === currentStep
                  const isCompleted = index < currentStep
                  const canNavigate = index <= currentStep

                  return (
                    <div key={index} className="flex flex-col items-center relative flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl z-10 transition-all duration-300 ${
                          isCompleted
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white cursor-pointer hover:shadow-2xl"
                            : isActive
                              ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white ring-4 ring-blue-200"
                              : canNavigate
                                ? "bg-white text-slate-400 border-2 border-slate-200 cursor-pointer hover:border-blue-400 hover:text-blue-600"
                                : "bg-white text-slate-300 border-2 border-slate-200 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (canNavigate) {
                            setCurrentStep(index)
                          }
                        }}
                        title={canNavigate ? `Go to ${section.title}` : `Complete current step to access ${section.title}`}
                      >
                        {isCompleted ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Icon className={`h-6 w-6 ${isActive ? "animate-pulse" : ""}`} />
                        )}
                      </div>
                      <p
                        className={`mt-2 font-bold text-sm transition-colors duration-300 text-center ${
                          isActive ? "text-blue-700" : isCompleted ? "text-emerald-600" : "text-slate-400"
                        } ${canNavigate ? "cursor-pointer hover:text-blue-600" : "cursor-not-allowed"}`}
                        onClick={() => {
                          if (canNavigate) {
                            setCurrentStep(index)
                          }
                        }}
                        title={canNavigate ? `Go to ${section.title}` : `Complete current step to access ${section.title}`}
                      >
                        {section.title}
                      </p>
                      {index < formSections.length - 1 && (
                        <div
                          className={`absolute top-6 left-[calc(50%+24px)] right-[calc(50%-24px)] h-1 transition-all duration-500 ${
                            isCompleted ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-slate-200"
                          }`}
                        ></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="max-h-[65vh] overflow-y-auto pr-2">
                {renderFormFields()}
              </div>

              {/* Form Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
                  onClick={currentStep === 0 ? onBack : handleBack}
          className="px-6 py-3 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
        >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {currentStep === 0 ? "Cancel" : "Previous"}
        </Button>

                {currentStep < formSections.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-xl shadow-xl font-bold"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
        <Button
          type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl shadow-xl font-bold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditMode ? "Updating..." : "Registering..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditMode ? "Update Course" : "Register Course"}
                      </>
                    )}
        </Button>
                )}
              </div>
    </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-200">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
              <p className="text-slate-600 mb-4">{notificationMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Course Dashboard Component
function CourseDashboard({ courses: initialCourses, setCourses, onRegisterClick, onEditCourse, isLoading, error, refreshCourses }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [coursesPerPage, setCoursesPerPage] = useState(5)
  const [sortField, setSortField] = useState("courseName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [viewingCourse, setViewingCourse] = useState(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const { toast } = useToast()

  const recordsPerPageOptions = [5, 10, 25, 50]

  // Filter and sort courses
  const getFilteredAndSortedCourses = useMemo(() => {
    let filtered = initialCourses

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course => {
        const nameMatch = course.courseName?.toLowerCase().includes(query)
        const streamMatch = course.stream?.toLowerCase().includes(query)
        const idMatch = course.courseId?.toLowerCase().includes(query)
        const descMatch = course.description?.toLowerCase().includes(query)
        
        return nameMatch || streamMatch || idMatch || descMatch
      })
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA = a[sortField]
      let valueB = b[sortField]

      if (sortField === "fees" || sortField === "registrationFee") {
        valueA = Number.parseFloat(valueA) || 0
        valueB = Number.parseFloat(valueB) || 0
      } else if (typeof valueA === "string") {
        valueA = valueA.toLowerCase()
        valueB = valueB?.toLowerCase() || ""
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    return filtered
  }, [initialCourses, searchQuery, statusFilter, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(getFilteredAndSortedCourses.length / coursesPerPage)
  const indexOfLastCourse = currentPage * coursesPerPage
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage
  const currentCourses = getFilteredAndSortedCourses.slice(indexOfFirstCourse, indexOfLastCourse)

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
      } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField])

  const handleViewCourse = useCallback((course) => {
    setViewingCourse(course)
    setShowViewDialog(true)
  }, [])

  const handleDeleteCourse = useCallback(async (courseId) => {
    if (courseId === null) {
      setConfirmDeleteId(null)
      return
    }
    
    if (confirmDeleteId === courseId) {
      try {
        await authRequest("delete", `http://localhost:5003/api/CourseRegistrationRoute/${courseId}`)
        setCourses(prev => prev.filter(course => course.id !== courseId))
        toast({
          title: "Course Deleted",
          description: "Course has been successfully deleted.",
        })
        setConfirmDeleteId(null)
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Failed to delete course.",
        })
      }
    } else {
      setConfirmDeleteId(courseId)
    }
  }, [confirmDeleteId, toast, setCourses])

  return (
    <>
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent whitespace-nowrap">
              Course Management
            </h1>
            <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1">
              <Target className="h-3 w-3 flex-shrink-0" />
              Comprehensive maritime training course management system
            </p>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
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

      {/* Course Overview Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
                Course Overview
              </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
              <Input
                  placeholder="Search courses by name, ID, or stream..."
                value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl font-semibold"
                />
                {searchQuery && (
                        <Button
                    type="button"
                    variant="ghost"
                          size="sm"
                    onClick={() => {
                      setSearchQuery("")
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
                onClick={refreshCourses}
                disabled={isLoading}
                className="border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-colors"
                                >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                                  </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Records per page selector */}
          <div className="flex justify-between items-center p-6 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-semibold">Show</span>
              <select
                value={coursesPerPage}
                onChange={(e) => {
                  setCoursesPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border-2 border-slate-200 rounded-lg p-1 text-sm font-semibold bg-white"
              >
                {recordsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-600 font-semibold">records per page</span>
                                    </div>

            {initialCourses.length > 0 && (
                                            <Badge
                variant="outline"
                className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-3 py-1 font-semibold"
                                            >
                <BookOpen className="w-3 h-3 mr-1" />
                {getFilteredAndSortedCourses.length} courses found
                                            </Badge>
            )}
                                    </div>

          {/* Course Table */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-3xl inline-block mb-6">
                <BookOpen className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
                                  </div>
              <h3 className="text-2xl font-black text-blue-700 mb-3">Loading Courses</h3>
              <p className="text-slate-600 font-semibold text-lg">Please wait while we fetch the course data</p>
                                  </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 rounded-3xl inline-block mb-6">
                <AlertTriangle className="mx-auto h-16 w-16 text-red-600" />
                                    </div>
              <h3 className="text-2xl font-black text-red-700 mb-3">Error Loading Courses</h3>
              <p className="text-slate-600 font-semibold text-lg mb-4">{error}</p>
              <Button
                onClick={refreshCourses}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
                                  </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <CourseTableHeader onSort={handleSort} sortField={sortField} sortDirection={sortDirection} />
                  <tbody>
                    {currentCourses.length > 0 ? (
                      currentCourses.map((course) => (
                        <CourseRow
                          key={course.id}
                          course={course}
                          onView={handleViewCourse}
                          onEdit={onEditCourse}
                          onDelete={handleDeleteCourse}
                          confirmDeleteId={confirmDeleteId}
                          loading={isLoading}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-16 text-center">
                          <div className="p-6 bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 rounded-3xl inline-block mb-6">
                            <BookOpen className="mx-auto h-16 w-16 text-slate-400" />
                                    </div>
                          <h3 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent mb-3">
                            {searchQuery ? "No courses found" : "No courses available"}
                          </h3>
                          <p className="text-slate-600 font-semibold text-lg mb-6">
                            {searchQuery
                              ? "Try adjusting your search terms or filters"
                              : "Start by registering your first course to get started"}
                          </p>
                          {!searchQuery && (
                            <Button
                              onClick={onRegisterClick}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Register New Course
                            </Button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                                  </div>

              {/* Pagination Controls */}
              {!isLoading && getFilteredAndSortedCourses.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
                  <div className="text-sm text-slate-600 font-semibold">
                    Showing {indexOfFirstCourse + 1} to {Math.min(indexOfLastCourse, getFilteredAndSortedCourses.length)} of {getFilteredAndSortedCourses.length} courses
                                </div>
                  <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-slate-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
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
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-slate-200"
                            >
                      <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
          </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Course Details Dialog */}
      <CourseDetailsDialog
        course={viewingCourse}
        isOpen={showViewDialog}
        onClose={() => {
          setShowViewDialog(false)
          setViewingCourse(null)
        }}
      />
    </>
  )
}

// Course Table Header Component
const CourseTableHeader = memo(({ onSort, sortField, sortDirection }) => {
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
          onClick={() => onSort("courseName")}
        >
          <div className="flex items-center gap-2 font-black text-slate-700">
            Course
            {getSortIcon("courseName")}
          </div>
        </th>
        <th className="text-left p-4 font-black text-slate-700">Stream & Medium</th>
        <th className="text-left p-4 font-black text-slate-700">Fee Structure</th>
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

CourseTableHeader.displayName = "CourseTableHeader"

// Course Row Component
const CourseRow = memo(({ course, onView, onEdit, onDelete, confirmDeleteId, loading }) => {
  const handleView = useCallback(() => onView(course), [onView, course])
  const handleEdit = useCallback(() => onEdit(course), [onEdit, course])
  const handleDelete = useCallback(() => onDelete(course.id), [onDelete, course.id])
  const handleCancelDelete = useCallback(() => onDelete(null), [onDelete])

  return (
    <tr className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-blue-200">
            <AvatarImage src={`/placeholder.svg?height=48&width=48&query=course`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-sm">
              {course.courseName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "CO"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-slate-900">{course.courseName}</div>
            <div className="text-sm text-slate-500 font-semibold">
              <span className="text-slate-400">ID: {course.courseId}</span>
          </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="space-y-2">
          <div className="font-bold text-slate-900">{course.stream}</div>
          <div>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-semibold"
            >
              {Array.isArray(course.medium) ? course.medium[0] : course.medium}
            </Badge>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          <div className="font-bold text-slate-900">
            Rs.{Number.parseFloat(course.fees || 0).toLocaleString()}
          </div>
          <div className="text-slate-600 font-medium">
            Reg: Rs.{Number.parseFloat(course.registrationFee || 0).toLocaleString()}
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge
          variant="outline"
          className={cn(
            "font-bold px-3 py-1",
            course.status === "Active" || !course.status
              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300"
              : "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-300",
          )}
        >
          <Activity className="h-3 w-3 mr-1" />
          {course.status || "Active"}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
        <Button
            size="sm"
          variant="outline"
            onClick={handleView}
            className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 border transition-colors"
            title="View Course"
        >
            <Eye className="w-4 h-4" />
        </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-1 hover:bg-emerald-50 hover:border-emerald-300 border transition-colors"
            title="Edit Course"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {confirmDeleteId === course.id ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="hover:bg-red-700"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : "Confirm"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelDelete} 
                className="hover:bg-gray-50 border"
              >
                Cancel
              </Button>
                </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 border transition-colors"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
                )}
              </div>
      </td>
    </tr>
  )
})

CourseRow.displayName = "CourseRow"

// Course Details Dialog Component
const CourseDetailsDialog = memo(({ course, isOpen, onClose }) => {
  if (!course) return null

  const mediumArray = Array.isArray(course.medium) ? course.medium : [course.medium]
  const locationArray = Array.isArray(course.location) ? course.location : [course.location]
  
  const totalAmount = (Number.parseFloat(course.fees || 0) + Number.parseFloat(course.registrationFee || 0))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
              <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
              <DialogTitle className="text-3xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                {course.courseName}
              </DialogTitle>
              <DialogDescription className="text-slate-600 font-semibold text-lg mt-1">
                Detailed information for {course.courseId}
              </DialogDescription>
              </div>
            </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Stream and Duration Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-6 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-r-xl">
              <div className="flex items-center gap-3 mb-3">
                <Layers className="h-5 w-5 text-blue-600" />
                <h3 className="font-black text-slate-700 text-lg">Stream</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">{course.stream}</p>
              </div>

            <div className="border-l-4 border-green-500 pl-6 bg-gradient-to-r from-green-50 to-transparent p-4 rounded-r-xl">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-green-600" />
                <h3 className="font-black text-slate-700 text-lg">Duration</h3>
            </div>
              <p className="text-2xl font-bold text-slate-900">{course.duration || "Not specified"}</p>
            </div>
            </div>

          {/* Medium and Location */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-600" />
                <span className="font-bold text-slate-700">Medium:</span>
                  </div>
              <div className="flex flex-wrap gap-2">
                {mediumArray.map((medium, index) => (
                  <Badge
                    key={index}
                    className="bg-blue-100 text-blue-800 border-blue-300 font-semibold px-3 py-1"
                  >
                    {medium}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-600" />
                <span className="font-bold text-slate-700">Location:</span>
                  </div>
              <div className="flex flex-wrap gap-2">
                {locationArray.map((location, index) => (
                  <Badge
                    key={index}
                    className="bg-green-100 text-green-800 border-green-300 font-semibold px-3 py-1"
                  >
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Details Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-6 w-6 text-slate-600" />
              <h3 className="text-xl font-black text-slate-800">Pricing Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Course Fee:</span>
                <span className="text-2xl font-bold text-slate-900">
                  Rs. {Number.parseFloat(course.fees || 0).toLocaleString()}
                </span>
                      </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Registration Fee:</span>
                <span className="text-xl font-bold text-slate-900">
                  Rs. {Number.parseFloat(course.registrationFee || 0).toLocaleString()}
                </span>
                  </div>
              
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-slate-50 to-blue-50 px-4 rounded-xl border-2 border-slate-200">
                <span className="text-lg font-black text-slate-800">Total Amount:</span>
                <span className="text-3xl font-black text-slate-900">
                  Rs. {totalAmount.toLocaleString()}
                </span>
                      </div>
                  </div>
                </div>

          {/* Description Section */}
          {course.description && (
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-black text-slate-800">Description:</h3>
                </div>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                {course.description}
              </p>
          </div>
        )}
            </div>

        <DialogFooter className="border-t border-slate-200 pt-6 gap-3">
                <Button
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white font-bold px-8 py-3 rounded-xl shadow-xl"
          >
            Enroll Now
                </Button>
                        <Button
            variant="outline"
            className="border-2 border-slate-300 hover:border-slate-400 font-bold px-8 py-3 rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Brochure
                        </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

CourseDetailsDialog.displayName = "CourseDetailsDialog"

// Main Course Management Component
function CourseManagementSystem() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [editingCourse, setEditingCourse] = useState(null)
  const { toast } = useToast()
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check for edit mode on mount
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && courses.length > 0) {
      const courseToEdit = courses.find(course => course.id.toString() === editId)
      if (courseToEdit) {
        setEditingCourse(courseToEdit)
        setCurrentView("registration")
      }
    }
  }, [searchParams, courses])

  const fetchCourses = async (showToast = false) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await authRequest("get", "http://localhost:5003/api/CourseRegistrationRoute")
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
    setCurrentView("dashboard")
    setEditingCourse(null)
    setSuccessMessage(`${newCourse.courseName} has been successfully registered!`)
    setShowSuccessPopup(true)
    setTimeout(() => setShowSuccessPopup(false), 4000)
    navigate("/course-registration", { replace: true })
  }

  const handleStartNewRegistration = useCallback(() => {
    setEditingCourse(null)
    setCurrentView("registration")
    navigate("/course-registration", { replace: true })
  }, [navigate])

  const handleEditCourse = useCallback((course) => {
    setEditingCourse(course)
    setCurrentView("registration")
    navigate(`/course-registration?edit=${course.id}`, { replace: true })
  }, [navigate])

  const renderDashboard = () => (
    <CourseDashboard
      courses={courses}
      setCourses={setCourses}
      onRegisterClick={handleStartNewRegistration}
      onEditCourse={handleEditCourse}
      isLoading={isLoading}
      error={error}
      refreshCourses={() => fetchCourses(true)}
    />
  )

  const renderRegistrationForm = () => (
    <CourseRegistrationForm
      onBack={() => {
        setCurrentView("dashboard")
        setEditingCourse(null)
        navigate("/course-registration", { replace: true })
      }}
      onSuccess={handleCourseRegistered}
      editingCourse={editingCourse}
      isEditMode={!!editingCourse}
    />
  )

  const renderContent = () => {
    return currentView === "dashboard" ? renderDashboard() : renderRegistrationForm()
  }

  // Add CSS for fade-in animations
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .gradient-text {
        background: linear-gradient(135deg, #1e293b, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    `
    style.id = "course-registration-animations"

    // Remove existing style if present
    const existingStyle = document.getElementById("course-registration-animations")
    if (existingStyle) {
      document.head.removeChild(existingStyle)
    }

    document.head.appendChild(style)
    return () => {
      const styleToRemove = document.getElementById("course-registration-animations")
      if (styleToRemove) {
        document.head.removeChild(styleToRemove)
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <SuccessPopup
          isOpen={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          title="Success!"
          description={successMessage}
          courseName={successMessage}
        />
      )}

      <div className="relative z-10 p-4 sm:p-6">
        {renderContent()}
        </div>
    </div>
  )
}

export default CourseManagementSystem 