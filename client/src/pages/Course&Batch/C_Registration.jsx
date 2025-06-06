"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, Plus, Search, X, ChevronLeftIcon, Edit3, Eye, RefreshCw } from "lucide-react"
import { authRequest } from "../../services/authService" // Corrected mock API import

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

// Main Course Management Component
export default function CourseManagementImproved() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const fetchCourses = async (showToast = false) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await authRequest("get", "http://localhost:5003/api/CourseRegistrationRoute")
      if (Array.isArray(data)) {
        setCourses(data)
        if (showToast) {
          toast({ title: "Courses refreshed", description: "Latest course data loaded." })
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
    fetchCourses() // Refresh list
    setShowRegistrationForm(false)
    toast({ title: "Success!", description: `${newCourse.courseName} has been successfully registered.` })
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
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

// Reusable Course Form (for Edit) - Redesigned
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
    additionalInstallments: initialData ? safeParseToArray(initialData.additionalInstallments) : [], // Assuming this might be an array of objects or values
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
      setFormData((prev) => ({ ...prev, duration: initialData?.duration || "" })) // Reset to initial or empty if dates cleared
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
      additionalInstallments: JSON.stringify(formData.additionalInstallments), // Ensure this is stringified correctly based on expected backend format
    }
    onSubmit(submissionData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courseId">Course ID *</Label>
              <Input
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                disabled={isEditMode}
              />
            </div>
            <div>
              <Label htmlFor="courseName">Course Name *</Label>
              <Input id="courseName" name="courseName" value={formData.courseName} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <Label htmlFor="stream">Stream *</Label>
            <Input id="stream" name="stream" value={formData.stream} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              name="duration"
              value={formData.duration}
              readOnly
              className="bg-muted"
              placeholder="Auto-calculated"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              value={formData.status || "Active"}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div>
            <Label className="text-base font-medium">Medium</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {mediumOptions.map((opt) => (
                <div
                  key={`medium-${opt}`}
                  className={`flex items-center space-x-2 rounded-md border p-2.5 transition-all ${formData.medium.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                >
                  <Checkbox
                    id={`edit-medium-${opt}`}
                    checked={formData.medium.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("medium", opt, !!checked)}
                  />
                  <Label htmlFor={`edit-medium-${opt}`} className="flex-1 cursor-pointer text-sm font-normal">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base font-medium">Location</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {locationOptions.map((opt) => (
                <div
                  key={`location-${opt}`}
                  className={`flex items-center space-x-2 rounded-md border p-2.5 transition-all ${formData.location.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                >
                  <Checkbox
                    id={`edit-location-${opt}`}
                    checked={formData.location.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("location", opt, !!checked)}
                  />
                  <Label htmlFor={`edit-location-${opt}`} className="flex-1 cursor-pointer text-sm font-normal">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base font-medium">Assessment Criteria</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {assessmentOptions.map((opt) => (
                <div
                  key={`assessment-${opt}`}
                  className={`flex items-center space-x-2 rounded-md border p-2.5 transition-all ${formData.assessmentCriteria.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                >
                  <Checkbox
                    id={`edit-assessment-${opt}`}
                    checked={formData.assessmentCriteria.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("assessmentCriteria", opt, !!checked)}
                  />
                  <Label htmlFor={`edit-assessment-${opt}`} className="flex-1 cursor-pointer text-sm font-normal">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base font-medium">Resources</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {resourceOptions.map((opt) => (
                <div
                  key={`resource-${opt}`}
                  className={`flex items-center space-x-2 rounded-md border p-2.5 transition-all ${formData.resources.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                >
                  <Checkbox
                    id={`edit-resource-${opt}`}
                    checked={formData.resources.includes(opt)}
                    onCheckedChange={(checked) => handleCheckboxChange("resources", opt, !!checked)}
                  />
                  <Label htmlFor={`edit-resource-${opt}`} className="flex-1 cursor-pointer text-sm font-normal">
                    {opt.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4 max-h-[60vh] overflow-y-auto p-1 pr-3">
          <div>
            <Label htmlFor="fees">Total Fees</Label>
            <Input
              id="fees"
              name="fees"
              type="number"
              value={formData.fees}
              onChange={handleChange}
              placeholder="e.g., 1000"
            />
          </div>
          <div>
            <Label htmlFor="registrationFee">Registration Fee</Label>
            <Input
              id="registrationFee"
              name="registrationFee"
              type="number"
              value={formData.registrationFee}
              onChange={handleChange}
              placeholder="e.g., 100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="installment1">Installment 1</Label>
              <Input
                id="installment1"
                name="installment1"
                type="number"
                value={formData.installment1}
                onChange={handleChange}
                placeholder="e.g., 450"
              />
            </div>
            <div>
              <Label htmlFor="installment2">Installment 2</Label>
              <Input
                id="installment2"
                name="installment2"
                type="number"
                value={formData.installment2}
                onChange={handleChange}
                placeholder="e.g., 450"
              />
            </div>
          </div>
          {/* Placeholder for additional installments if needed in edit form */}
          {/* <Label>Additional Installments (JSON)</Label>
          <Textarea name="additionalInstallments" value={JSON.stringify(formData.additionalInstallments)} onChange={(e) => setFormData(prev => ({...prev, additionalInstallments: safeParseToArray(e.target.value)}))} rows={2} placeholder='e.g., [{"value": 100, "weeks": 8}]' /> */}
        </TabsContent>
      </Tabs>
      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
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
        >
          {isEditMode ? "Update Course" : "Create Course"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Course Dashboard Component
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
        `http://localhost:5003/api/CourseRegistrationRoute/${editingCourse.id}`,
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
        return "default"
      case "pending":
        return "secondary"
      case "completed":
        return "outline"
      case "inactive":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your courses and batches</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={refreshCourses} disabled={isLoading} className="flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={onRegisterClick} className="gap-1 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {[
          {
            title: "Total Courses",
            value: totalCourses,
            subtext: `${activeCourses} active`,
            progress: totalCourses ? (activeCourses / totalCourses) * 100 : 0,
          },
          {
            title: "Total Students",
            value: totalStudents,
            subtext: "Across all courses",
            progress: totalStudents > 0 ? 80 : 0,
          },
          {
            title: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            subtext: "From all courses",
            progress: totalRevenue > 0 ? 65 : 0,
          },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-9 w-16 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              {isLoading ? (
                <div className="h-1 w-full bg-muted animate-pulse rounded mt-3" />
              ) : (
                <Progress value={stat.progress} className="h-1 mt-3" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
          <CardDescription>View and manage all registered courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses (ID, Name, Stream)..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
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

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell colSpan={7}>
                          <div className="h-10 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <p className="text-red-500 mb-2">{error}</p>
                      <Button variant="outline" size="sm" onClick={refreshCourses}>
                        Try Again
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No courses found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => {
                    const medium = safeParseToArray(course.medium)
                    const location = safeParseToArray(course.location)
                    return (
                      <TableRow key={course.id || course.courseId}>
                        <TableCell className="font-medium">{course.courseId}</TableCell>
                        <TableCell className="max-w-xs truncate">{course.courseName}</TableCell>
                        <TableCell>{course.stream}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {medium.length > 0 ? (
                              medium.map((m, i) => (
                                <Badge key={`${m}-${i}`} variant="outline" className="text-xs">
                                  {m}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(course.status)}>{course.status || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>${Number.parseFloat(course.fees || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="mr-1">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>{course.courseName}</DialogTitle>
                                <DialogDescription>Detailed information for {course.courseId}</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-2 py-4 text-sm">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Stream:</Label>
                                  <div>{course.stream}</div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Medium:</Label>
                                  <div className="flex flex-wrap gap-1">
                                    {medium.length > 0
                                      ? medium.map((m, i) => (
                                          <Badge key={`${m}-${i}`} variant="secondary">
                                            {m}
                                          </Badge>
                                        ))
                                      : "N/A"}
                                  </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Location:</Label>
                                  <div className="flex flex-wrap gap-1">
                                    {location.length > 0
                                      ? location.map((l, i) => (
                                          <Badge key={`${l}-${i}`} variant="secondary">
                                            {l.replace(/([A-Z])/g, " $1").trim()}
                                          </Badge>
                                        ))
                                      : "N/A"}
                                  </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Duration:</Label>
                                  <div>{course.duration || "N/A"}</div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Fee:</Label>
                                  <div>${Number.parseFloat(course.fees || 0).toLocaleString()}</div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                  <Label className="text-right text-muted-foreground">Reg. Fee:</Label>
                                  <div>${Number.parseFloat(course.registrationFee || 0).toLocaleString()}</div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                                  <Label className="text-right text-muted-foreground pt-0.5">Description:</Label>
                                  <p className="text-muted-foreground col-span-1 text-xs leading-relaxed">
                                    {course.description || "No description provided."}
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={(e) =>
                                    e.currentTarget
                                      .closest('[role="dialog"]')
                                      ?.querySelector('[aria-label="Close"]')
                                      ?.click()
                                  }
                                >
                                  Close
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(course)}>
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
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
          <DialogContent className="sm:max-w-2xl">
            {" "}
            {/* Adjusted width for tabs */}
            <DialogHeader>
              <DialogTitle>Edit Course: {editingCourse.courseName}</DialogTitle>
              <DialogDescription>Update the details for this course. Make sure to save your changes.</DialogDescription>
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
              <p className="text-sm text-muted-foreground mt-2 text-center">Submitting changes...</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Course Registration Form Component (largely unchanged from previous, ensure it's complete)
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

  const steps = [{ label: "Basic Info" }, { label: "Details" }, { label: "Resources & Fee" }, { label: "Payment Plan" }]

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
  const getRemainingAmount = () => {
    const base = Number(formData.fees) || 0
    const regFee = Number(formData.registrationFee) || 0
    const sum = installments.reduce((acc, inst) => acc + (inst.enabled ? Number(inst.value) || 0 : 0), 0)
    return Math.max(0, base - (regFee + sum))
  }

  const checkCourseId = async () => {
    if (!formData.courseId) {
      setCourseIdError("Course ID is required.")
      return false
    }
    setIsLoading(true)
    try {
      const response = await authRequest(
        "get",
        `http://localhost:5003/api/CourseRegistrationRoute?courseId=${formData.courseId}`,
      )
      const exists = Array.isArray(response)
        ? response.some((c) => c.courseId === formData.courseId)
        : response && typeof response.exists !== "undefined"
          ? response.exists
          : false
      if (exists) {
        setCourseIdError("Course ID already exists.")
        return false
      } else {
        setCourseIdError("")
        return true
      }
    } catch (error) {
      console.error("Error validating Course ID:", error)
      setCourseIdError("Error validating Course ID.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async (e) => {
    e.preventDefault()
    let formIsValid = false
    if (activeStep === 0) {
      const isIdValid = await checkCourseId()
      // Re-validate form after async check, as courseIdError might have been set
      formIsValid = isIdValid && validateForm()
    } else {
      formIsValid = validateForm()
    }

    if (!formIsValid) {
      // If not valid (either due to checkCourseId or validateForm), update errors and return
      setErrors((prev) => ({ ...prev, ...validateForm() })) // Ensure errors are up-to-date
      return
    }

    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1)
    else await handleSubmitForm(e)
  }

  const handleBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1)
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please correct the errors in the form.",
      })
      return
    }
    setIsLoading(true)
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
      let user_id = null
      if (userStr) {
        try {
          user_id = JSON.parse(userStr).id
        } catch {}
      }
      const enabledInstallments = installments.filter((inst) => inst.enabled)
      const payload = {
        ...formData,
        user_id,
        fees: Number(formData.fees) || 0,
        registrationFee: Number(formData.registrationFee) || 0,
        installment1: enabledInstallments[0]?.value ? Number(enabledInstallments[0].value) : null,
        installment2: enabledInstallments[1]?.value ? Number(enabledInstallments[1].value) : null,
        additionalInstallments: JSON.stringify(
          enabledInstallments.slice(2).map((inst) => ({ value: inst.value, weeks: inst.weeks })),
        ),
        medium: JSON.stringify(formData.medium),
        location: JSON.stringify(formData.location),
        assessmentCriteria: JSON.stringify(formData.assessmentCriteria),
        resources: JSON.stringify(formData.resources),
      }
      const response = await authRequest("post", "http://localhost:5003/api/CourseRegistrationRoute", payload)
      if (response && response.success) onSuccess(response.course || payload)
      else throw new Error(response?.error || "Failed to register course")
    } catch (error) {
      console.error("Error registering course:", error)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2 sm:mr-4">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Course Registration</h1>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Register New Course</CardTitle>
          <CardDescription>
            Fill in the details to register a new course. Fields marked with <span className="text-destructive">*</span>{" "}
            are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-8">
            {" "}
            {/* Stepper */}
            <div className="flex justify-between items-start">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex-1 flex flex-col items-center ${idx > 0 ? "relative" : ""}`}>
                  {idx > 0 && (
                    <div
                      className={`absolute top-5 right-1/2 w-full h-0.5 ${idx <= activeStep ? "bg-primary" : "bg-muted"}`}
                    />
                  )}
                  <div
                    className={`z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${idx <= activeStep ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground"}`}
                  >
                    {idx < activeStep ? <Check className="h-5 w-5" /> : <span>{idx + 1}</span>}
                  </div>
                  <span
                    className={`mt-2 text-center text-xs sm:text-sm font-medium ${idx === activeStep ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleNext}>
            {activeStep === 0 /* Basic Info */ && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="courseId">
                    Course ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="courseId"
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    onBlur={checkCourseId}
                    placeholder="e.g., CS101"
                    className={errors.courseId || courseIdError ? "border-destructive" : ""}
                  />
                  {(errors.courseId || courseIdError) && (
                    <p className="text-sm text-destructive mt-1">{errors.courseId || courseIdError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stream">
                    Stream <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stream"
                    name="stream"
                    value={formData.stream}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology"
                    className={errors.stream ? "border-destructive" : ""}
                  />
                  {errors.stream && <p className="text-sm text-destructive mt-1">{errors.stream}</p>}
                </div>
                <div>
                  <Label htmlFor="courseName">
                    Course Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="courseName"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    placeholder="e.g., Introduction to Programming"
                    className={errors.courseName ? "border-destructive" : ""}
                  />
                  {errors.courseName && <p className="text-sm text-destructive mt-1">{errors.courseName}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Briefly describe the course..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="text"
                    value={formData.duration}
                    readOnly
                    placeholder="Auto-calculated"
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
            {activeStep === 1 /* Details */ && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">
                    Medium <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">Select language(s) for the course.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {mediumOptions.map((opt) => (
                      <div
                        key={opt}
                        className={`flex items-center space-x-2 rounded-md border p-3 transition-all ${formData.medium.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                      >
                        <Checkbox
                          id={`medium-${opt}`}
                          checked={formData.medium.includes(opt)}
                          onCheckedChange={(checked) => handleCheckboxChange("medium", opt, !!checked)}
                        />
                        <Label htmlFor={`medium-${opt}`} className="flex-1 cursor-pointer text-sm">
                          {opt}
                        </Label>
                      </div>
                    ))}
                    {errors.medium && <p className="text-sm text-destructive mt-1">{errors.medium}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-medium">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">Select course location(s).</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {locationOptions.map((opt) => (
                      <div
                        key={opt}
                        className={`flex items-center space-x-2 rounded-md border p-3 transition-all ${formData.location.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                      >
                        <Checkbox
                          id={`location-${opt}`}
                          checked={formData.location.includes(opt)}
                          onCheckedChange={(checked) => handleCheckboxChange("location", opt, !!checked)}
                        />
                        <Label htmlFor={`location-${opt}`} className="flex-1 cursor-pointer text-sm">
                          {opt.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                      </div>
                    ))}
                    {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
                  </div>
                </div>
              </div>
            )}
            {activeStep === 2 /* Resources & Fee */ && (
              <div className="space-y-6">
                <Tabs value={resourceTab} onValueChange={setResourceTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assessment">Assessment</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  <TabsContent value="assessment" className="pt-4 space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        Assessment Criteria <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">Select assessment methods.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        {assessmentOptions.map((opt) => (
                          <div
                            key={opt}
                            className={`flex items-center space-x-2 rounded-md border p-3 transition-all ${formData.assessmentCriteria.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                          >
                            <Checkbox
                              id={`assessment-${opt}`}
                              checked={formData.assessmentCriteria.includes(opt)}
                              onCheckedChange={(checked) => handleCheckboxChange("assessmentCriteria", opt, !!checked)}
                            />
                            <Label htmlFor={`assessment-${opt}`} className="flex-1 cursor-pointer text-sm">
                              {opt}
                            </Label>
                          </div>
                        ))}
                        {errors.assessmentCriteria && (
                          <p className="text-sm text-destructive mt-1">{errors.assessmentCriteria}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="resources" className="pt-4 space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        Course Resources <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">Select required resources.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        {resourceOptions.map((opt) => (
                          <div
                            key={opt}
                            className={`flex items-center space-x-2 rounded-md border p-3 transition-all ${formData.resources.includes(opt) ? "border-primary ring-1 ring-primary" : "hover:border-slate-400"}`}
                          >
                            <Checkbox
                              id={`resource-${opt}`}
                              checked={formData.resources.includes(opt)}
                              onCheckedChange={(checked) => handleCheckboxChange("resources", opt, !!checked)}
                            />
                            <Label htmlFor={`resource-${opt}`} className="flex-1 cursor-pointer text-sm">
                              {opt.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                          </div>
                        ))}
                        {errors.resources && <p className="text-sm text-destructive mt-1">{errors.resources}</p>}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div>
                  <Label htmlFor="fees" className="text-base font-medium">
                    Base Course Fee <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total fee for the course. Payment plan in next step.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">$</span>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      min="0"
                      value={formData.fees}
                      onChange={handleInputChange}
                      placeholder="e.g., 2500"
                      className={`pl-7 ${errors.fees ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.fees && <p className="text-sm text-destructive mt-1">{errors.fees}</p>}
                </div>
              </div>
            )}
            {activeStep === 3 /* Payment Plan */ && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <h3 className="text-lg font-medium">Payment Plan - Appendix A</h3>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Course Fee</div>
                    <div className="text-xl font-bold">${Number(formData.fees || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="registrationFee">
                    Registration Fee <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">$</span>
                    <Input
                      id="registrationFee"
                      type="number"
                      min="0"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData((prev) => ({ ...prev, registrationFee: e.target.value }))}
                      placeholder="Amount"
                      className={`pl-7 ${errors.registrationFee ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.registrationFee && <p className="text-sm text-destructive mt-1">{errors.registrationFee}</p>}
                </div>
                {installments.map((inst, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`installment-enabled-${idx}`}
                          checked={inst.enabled}
                          onCheckedChange={() => handleInstallmentToggle(idx)}
                        />
                        <Label htmlFor={`installment-enabled-${idx}`} className="cursor-pointer font-medium">
                          {inst.label}
                        </Label>
                      </div>
                      {idx > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInstallment(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {inst.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor={`installment-value-${idx}`}>Amount</Label>
                          <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                              $
                            </span>
                            <Input
                              id={`installment-value-${idx}`}
                              type="number"
                              min="0"
                              value={inst.value}
                              onChange={(e) => handleInstallmentChange(idx, "value", e.target.value)}
                              placeholder="Amount"
                              className={`pl-7 ${errors[`installment${idx + 1}`] ? "border-destructive" : ""}`}
                            />
                          </div>
                          {errors[`installment${idx + 1}`] && (
                            <p className="text-sm text-destructive mt-1">{errors[`installment${idx + 1}`]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`installment-weeks-${idx}`}>Due (weeks from start)</Label>
                          <Input
                            id={`installment-weeks-${idx}`}
                            type="number"
                            min="0"
                            value={inst.weeks}
                            onChange={(e) => handleInstallmentChange(idx, "weeks", e.target.value)}
                            placeholder="Weeks"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={addInstallment}>
                    <Plus className="h-4 w-4 mr-1" /> Add Installment
                  </Button>
                </div>
                <div
                  className={`flex justify-between items-center p-3 rounded-md ${getRemainingAmount() === 0 ? "bg-green-100 dark:bg-green-900" : "bg-amber-100 dark:bg-amber-900"}`}
                >
                  <span className="font-medium text-sm">Remaining to be allocated:</span>
                  <span
                    className={`font-bold text-lg ${getRemainingAmount() === 0 ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}
                  >
                    $
                    {getRemainingAmount().toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {errors.installmentsSummary && (
                  <p className="text-sm text-destructive mt-1">{errors.installmentsSummary}</p>
                )}
              </div>
            )}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={activeStep > 0 ? handleBack : onBack}
                disabled={isLoading}
              >
                {activeStep > 0 ? "Back" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (activeStep === 0 &&
                    (!!courseIdError || !formData.courseId || !formData.stream || !formData.courseName))
                }
              >
                {isLoading ? "Processing..." : activeStep === steps.length - 1 ? "Submit Registration" : "Next"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
