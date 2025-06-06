import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  Upload,
  Loader2,
  Save,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  ArrowLeft,
  Settings,
} from "lucide-react"
import { authRequest } from "../../services/authService"
import { useNavigate } from "react-router-dom"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const steps = [
  { id: 0, title: "Personal Details", icon: User, description: "Basic information" },
  { id: 1, title: "Bank Details", icon: CreditCard, description: "Payment information" },
  { id: 2, title: "Academic Details", icon: Award, description: "Education & experience" },
  { id: 3, title: "Course & Documents", icon: FileText, description: "Course assignment & files" },
]

// Enhanced File Upload Component
const FileUpload = memo(({ name, label, required = false, form, errors, handleChange }) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
      <div className="flex flex-col items-center space-y-2">
        <Upload className="h-8 w-8 text-gray-400" />
        <div>
          <Label htmlFor={name} className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Click to upload or drag and drop
          </Label>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
          <Input id={name} name={name} type="file" className="hidden" onChange={handleChange} />
        </div>
      </div>
      {form[name] && (
        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-700">File selected: {form[name]?.name}</p>
          </div>
        </div>
      )}
    </div>
    {errors[name] && (
      <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-600">{errors[name]}</p>
      </div>
    )}
  </div>
))

FileUpload.displayName = "FileUpload"

// Focus-preserving input component
const FocusInput = ({ name, value, onChange, error, icon: Icon, ...props }) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (document.activeElement === inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.selectionStart) {
        const cursorPosition = inputRef.current.selectionStart
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
      }
    }
  }, [value])

  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />}
      <Input
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        className={`${Icon ? "pl-10" : ""} ${error ? "border-red-500 focus:border-red-500" : "focus:border-blue-500"} transition-colors`}
        {...props}
      />
    </div>
  )
}

// Lecturer Detail View Component
const LecturerDetailView = ({ lecturer, onBack, onEdit, onDelete, authRequest }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleDeleteLecturer = async () => {
    setDeleteLoading(true)
    try {
      if (authRequest) {
        await authRequest("delete", `http://localhost:5003/api/lecturer-registration/${lecturer.id}`)
      }
      setSuccessMessage("Lecturer deleted successfully")
      setTimeout(() => {
        onDelete(lecturer.id)
        setDeleteLoading(false)
        setShowDeleteConfirm(false)
      }, 1500)
    } catch (err) {
      console.error("Failed to delete lecturer:", err)
      alert("Failed to delete lecturer")
      setDeleteLoading(false)
    }
  }

  const academic = lecturer.academic_details || {}
  const bank = lecturer.bank_details || {}
  const courses = lecturer.courses || []

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lecturer Details</h1>
            <p className="text-gray-600">View and manage lecturer information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(lecturer.id)} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Lecturer Info Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder.svg?height=64&width=64" />
              <AvatarFallback className="bg-blue-500 text-white text-xl font-bold">
                {lecturer.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{lecturer.full_name}</h2>
              <p className="text-gray-600">ID: #{lecturer.id}</p>
              <Badge variant={lecturer.status === "Active" ? "default" : "secondary"} className="mt-1">
                {lecturer.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="text-gray-900">{lecturer.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone</Label>
                  <p className="text-gray-900">{lecturer.phone}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Address</Label>
                  <p className="text-gray-900">{lecturer.address}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Join Date</Label>
                  <p className="text-gray-900">
                    {lecturer.created_at ? new Date(lecturer.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Course Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Course Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Courses</Label>
                <p className="text-gray-900">
                  {courses.length > 0 ? courses.map((c) => c.courseName).join(", ") : "No courses assigned"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Stream</Label>
                <p className="text-gray-900">{lecturer.stream || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Module</Label>
                <p className="text-gray-900">{lecturer.module || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Academic Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Academic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Highest Qualification</Label>
                <p className="text-gray-900">{academic.highest_qualification || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Other Qualifications</Label>
                <p className="text-gray-900">{academic.other_qualifications || "N/A"}</p>
              </div>
            </div>

            {lecturer.experience && lecturer.experience.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm text-gray-600">Experience</Label>
                <div className="mt-2 space-y-2">
                  {lecturer.experience.map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{exp.institution}</p>
                          <p className="text-sm text-gray-600">{exp.designation}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {exp.start} - {exp.end} ({exp.years} years)
                          </p>
                          <p className="text-sm text-gray-600">{exp.nature}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Bank Name</Label>
                <p className="text-gray-900">{bank.bank_name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Branch</Label>
                <p className="text-gray-900">{bank.branch_name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Account Number</Label>
                <p className="text-gray-900">{bank.account_number || "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{lecturer.full_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleDeleteLecturer}
                  disabled={deleteLoading}
                  variant="destructive"
                  className="flex-1"
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
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow-lg">
          {successMessage}
        </div>
      )}
    </div>
  )
}

// Registration Form Component with all logic
const RegistrationForm = memo(
  ({
    step,
    setStep,
    form,
    errors,
    isEditMode,
    isLoading,
    isSubmitting,
    id,
    handleChange,
    handleSelectChange,
    handleExperienceChange,
    addExperienceRow,
    removeExperienceRow,
    courses,
    back,
    next,
    handleSubmit,
  }) => {
    const progressPercentage = ((step + 1) / steps.length) * 100

    const renderStep = () => {
      switch (step) {
        case 0:
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <FocusInput
                    id="fullName"
                    name="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <FocusInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="nicNumber">NIC Number *</Label>
                  <FocusInput
                    id="nicNumber"
                    name="nicNumber"
                    placeholder="Enter NIC number"
                    value={form.nicNumber}
                    onChange={handleChange}
                    error={errors.nicNumber}
                  />
                  {errors.nicNumber && <p className="text-red-500 text-sm mt-1">{errors.nicNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <FocusInput
                    id="dob"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    error={errors.dob}
                  />
                  {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter complete address"
                    value={form.address}
                    onChange={handleChange}
                    className={`${errors.address ? "border-red-500" : "focus:border-blue-500"} transition-colors`}
                    rows={3}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <FocusInput
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="cdcNumber">CDC Number</Label>
                  <FocusInput
                    id="cdcNumber"
                    name="cdcNumber"
                    placeholder="Enter CDC number"
                    value={form.cdcNumber}
                    onChange={handleChange}
                    error={errors.cdcNumber}
                  />
                  {errors.cdcNumber && <p className="text-red-500 text-sm mt-1">{errors.cdcNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Lecturer Category *</Label>
                  <Select
                    value={form.category || undefined}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger
                      className={`${errors.category ? "border-red-500" : "focus:border-blue-500"} transition-colors`}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Category A</SelectItem>
                      <SelectItem value="B">Category B</SelectItem>
                      <SelectItem value="C">Category C</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="status">Lecturer Status *</Label>
                  <Select
                    value={form.status || "Active"}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger
                      className={`${errors.status ? "border-red-500" : "focus:border-blue-500"} transition-colors`}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                </div>

                <div>
                  <Label htmlFor="vehicleNumber">Vehicle License Number</Label>
                  <FocusInput
                    id="vehicleNumber"
                    name="vehicleNumber"
                    placeholder="Enter vehicle number"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    error={errors.vehicleNumber}
                  />
                  {errors.vehicleNumber && <p className="text-red-500 text-sm mt-1">{errors.vehicleNumber}</p>}
                </div>
              </div>
            </div>
          )

        case 1:
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Select
                    value={form.bankName || undefined}
                    onValueChange={(value) => handleSelectChange("bankName", value)}
                  >
                    <SelectTrigger
                      className={`${errors.bankName ? "border-red-500" : "focus:border-blue-500"} transition-colors`}
                    >
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commercial Bank">Commercial Bank</SelectItem>
                      <SelectItem value="People's Bank">People's Bank</SelectItem>
                      <SelectItem value="Bank of Ceylon">Bank of Ceylon</SelectItem>
                      <SelectItem value="Sampath Bank">Sampath Bank</SelectItem>
                      <SelectItem value="Hatton National Bank">Hatton National Bank</SelectItem>
                      <SelectItem value="Nations Trust Bank">Nations Trust Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                </div>

                <div>
                  <Label htmlFor="branchName">Branch Name *</Label>
                  <FocusInput
                    id="branchName"
                    name="branchName"
                    placeholder="Enter branch name"
                    value={form.branchName}
                    onChange={handleChange}
                    error={errors.branchName}
                  />
                  {errors.branchName && <p className="text-red-500 text-sm mt-1">{errors.branchName}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <FocusInput
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={form.accountNumber}
                    onChange={handleChange}
                    error={errors.accountNumber}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                </div>
              </div>
            </div>
          )

        case 2:
          return (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Working Experience</Label>
                  <Button type="button" onClick={addExperienceRow} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>

                {form.experience.map((exp, idx) => (
                  <Card key={idx} className="p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Experience {idx + 1}</h4>
                      {form.experience.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeExperienceRow(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Institution *</Label>
                        <FocusInput
                          placeholder="Institution name"
                          value={exp.institution}
                          onChange={(e) => handleExperienceChange(idx, "institution", e.target.value)}
                          error={errors[`exp_institution_${idx}`]}
                        />
                        {errors[`exp_institution_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_institution_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Years of Experience *</Label>
                        <FocusInput
                          placeholder="Years"
                          value={exp.years}
                          onChange={(e) => handleExperienceChange(idx, "years", e.target.value)}
                          error={errors[`exp_years_${idx}`]}
                        />
                        {errors[`exp_years_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_years_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Start Date *</Label>
                        <FocusInput
                          placeholder="Start date"
                          value={exp.start}
                          onChange={(e) => handleExperienceChange(idx, "start", e.target.value)}
                          error={errors[`exp_start_${idx}`]}
                        />
                        {errors[`exp_start_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_start_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>End Date *</Label>
                        <FocusInput
                          placeholder="End date"
                          value={exp.end}
                          onChange={(e) => handleExperienceChange(idx, "end", e.target.value)}
                          error={errors[`exp_end_${idx}`]}
                        />
                        {errors[`exp_end_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_end_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Designation *</Label>
                        <FocusInput
                          placeholder="Job title"
                          value={exp.designation}
                          onChange={(e) => handleExperienceChange(idx, "designation", e.target.value)}
                          error={errors[`exp_designation_${idx}`]}
                        />
                        {errors[`exp_designation_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_designation_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Nature of Work *</Label>
                        <FocusInput
                          placeholder="Work description"
                          value={exp.nature}
                          onChange={(e) => handleExperienceChange(idx, "nature", e.target.value)}
                          error={errors[`exp_nature_${idx}`]}
                        />
                        {errors[`exp_nature_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`exp_nature_${idx}`]}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="text-lg font-medium mb-4">Educational Qualifications</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highestQualification">Highest Qualification *</Label>
                    <FocusInput
                      id="highestQualification"
                      name="highestQualification"
                      placeholder="Enter your highest qualification"
                      value={form.highestQualification}
                      onChange={handleChange}
                      error={errors.highestQualification}
                    />
                    {errors.highestQualification && (
                      <p className="text-red-500 text-sm mt-1">{errors.highestQualification}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="otherQualifications">Other Qualifications *</Label>
                    <Textarea
                      id="otherQualifications"
                      name="otherQualifications"
                      placeholder="Enter other qualifications"
                      value={form.otherQualifications}
                      onChange={handleChange}
                      className={`${errors.otherQualifications ? "border-red-500" : "focus:border-blue-500"} transition-colors`}
                      rows={3}
                    />
                    {errors.otherQualifications && (
                      <p className="text-red-500 text-sm mt-1">{errors.otherQualifications}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )

        case 3:
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course_ids">Courses *</Label>
                  <select
                    id="course_ids"
                    name="course_ids"
                    multiple
                    value={form.course_ids}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
                        Number.parseInt(option.value),
                      )
                      handleSelectChange("course_ids", selectedOptions)
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[120px]"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="p-2">
                        {course.courseName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple courses</p>
                  {errors.course_ids && <p className="text-red-500 text-sm mt-1">{errors.course_ids}</p>}
                </div>

                <div>
                  <Label htmlFor="stream">Stream *</Label>
                  <FocusInput
                    id="stream"
                    name="stream"
                    placeholder="Enter stream"
                    value={form.stream}
                    onChange={handleChange}
                    error={errors.stream}
                  />
                  {errors.stream && <p className="text-red-500 text-sm mt-1">{errors.stream}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="module">Module *</Label>
                  <FocusInput
                    id="module"
                    name="module"
                    placeholder="Enter module"
                    value={form.module}
                    onChange={handleChange}
                    error={errors.module}
                  />
                  {errors.module && <p className="text-red-500 text-sm mt-1">{errors.module}</p>}
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="text-lg font-medium mb-4">Document Upload (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload
                    name="nic_file"
                    label="NIC Copy"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                  <FileUpload
                    name="photo_file"
                    label="Passport Photo"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                  <FileUpload
                    name="passbook_file"
                    label="Bank Passbook"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                  <FileUpload
                    name="education_certificate_file"
                    label="Education Certificate"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                  <FileUpload
                    name="cdc_book_file"
                    label="CDC Book"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                  <FileUpload
                    name="driving_trainer_license_file"
                    label="Driving Trainer License"
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div className="space-y-6">
        {/* Simple Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {step + 1} of {steps.length}: {steps[step].title}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <form onSubmit={handleSubmit}>
          {isLoading && step === 0 && id && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <span className="text-gray-600">Loading lecturer data...</span>
              </div>
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0 || isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button type="button" onClick={next} disabled={isSubmitting}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "Update Registration" : "Submit Registration"}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    )
  },
)

RegistrationForm.displayName = "RegistrationForm"

// Main component with all API logic and functionality
export default function LecturerManagementFull() {
  const [lecturers, setLecturers] = useState([])
  const [courses, setCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingLecturers, setLoadingLecturers] = useState(true)
  const [editingLecturer, setEditingLecturer] = useState(null)
  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [viewMode, setViewMode] = useState("list")

  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    nicNumber: "",
    dob: "",
    address: "",
    phone: "",
    cdcNumber: "",
    category: "",
    vehicleNumber: "",
    status: "Active",
    bankName: "",
    branchName: "",
    accountNumber: "",
    experience: [{ institution: "", years: "", start: "", end: "", designation: "", nature: "" }],
    highestQualification: "",
    otherQualifications: "",
    course_ids: [],
    stream: "",
    module: "",
    nic_file: null,
    photo_file: null,
    passbook_file: null,
    education_certificate_file: null,
    cdc_book_file: null,
    driving_trainer_license_file: null,
    other_documents_file: null,
  })

  const [errors, setErrors] = useState({})

  // Extract lecturer ID from URL or query params
  const getIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("id")
    }
    return null
  }
  const id = getIdFromUrl()

  // Fetch lecturers data
  const fetchLecturers = async () => {
    try {
      setLoadingLecturers(true)
      const response = await authRequest("get", "http://localhost:5003/api/lecturer-registration")
      if (Array.isArray(response)) {
        setLecturers(response)
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error)
    } finally {
      setLoadingLecturers(false)
    }
  }

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await authRequest("get", "http://localhost:5003/api/lecturer-registration/courses")
      if (Array.isArray(response)) {
        setCourses(response)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  // Initial data fetching
  useEffect(() => {
    fetchLecturers()
    fetchCourses()
  }, [])

  // Fetch lecturer data if in edit mode
  useEffect(() => {
    if (id) {
      const fetchLecturerData = async () => {
        try {
          setIsLoading(true)
          const lecturerData = await authRequest("get", `http://localhost:5003/api/lecturer-registration/${id}`)

          if (lecturerData) {
            // --- FIX: Parse experience from academic_details if present ---
            let experience = []
            let academicDetails = {}
            if (lecturerData.academic_details) {
              if (typeof lecturerData.academic_details === "object" && lecturerData.academic_details !== null) {
                academicDetails = lecturerData.academic_details
              } else if (typeof lecturerData.academic_details === "string") {
                try {
                  academicDetails = JSON.parse(lecturerData.academic_details)
                } catch (e) {
                  academicDetails = {}
                }
              }
              // Parse experience from academic_details
              if (academicDetails.experience) {
                if (typeof academicDetails.experience === "string") {
                  try {
                    experience = JSON.parse(academicDetails.experience)
                  } catch {
                    experience = []
                  }
                } else if (Array.isArray(academicDetails.experience)) {
                  experience = academicDetails.experience
                }
              }
            }
            // Fallback: try lecturerData.experience
            if ((!experience || experience.length === 0) && lecturerData.experience) {
              if (typeof lecturerData.experience === "string") {
                try {
                  experience = JSON.parse(lecturerData.experience)
                } catch {
                  experience = []
                }
              } else if (Array.isArray(lecturerData.experience)) {
                experience = lecturerData.experience
              }
            }
            if (!Array.isArray(experience) || experience.length === 0) {
              experience = [{ institution: "", years: "", start: "", end: "", designation: "", nature: "" }]
            }
            let bankDetails = {}
            if (lecturerData.bank_details) {
              if (typeof lecturerData.bank_details === "object" && lecturerData.bank_details !== null) {
                bankDetails = lecturerData.bank_details
              } else if (typeof lecturerData.bank_details === "string") {
                try {
                  bankDetails = JSON.parse(lecturerData.bank_details)
                } catch (e) {
                  bankDetails = {}
                }
              }
            }
            setForm({
              fullName: lecturerData.full_name || "",
              email: lecturerData.email || "",
              nicNumber: lecturerData.id_number || "",
              dob: lecturerData.date_of_birth ? lecturerData.date_of_birth.split("T")[0] : "",
              address: lecturerData.address || "",
              phone: lecturerData.phone || "",
              cdcNumber: lecturerData.cdc_number || "",
              category: lecturerData.category || "",
              vehicleNumber: lecturerData.vehicle_number || "",
              status: lecturerData.status || "Active",
              bankName: bankDetails.bank_name || lecturerData.bank_name || "",
              branchName: bankDetails.branch_name || lecturerData.branch_name || "",
              accountNumber: bankDetails.account_number || lecturerData.account_number || "",
              experience: experience,
              highestQualification: academicDetails.highest_qualification || lecturerData.highest_qualification || "",
              otherQualifications: academicDetails.other_qualifications || lecturerData.other_qualifications || "",
              course_ids: lecturerData.course_ids || [],
              stream: lecturerData.stream || "",
              module: lecturerData.module || "",
              nic_file: null,
              photo_file: null,
              passbook_file: null,
              education_certificate_file: null,
              cdc_book_file: null,
              driving_trainer_license_file: null,
              other_documents_file: null,
            })
            if (courses.length === 0) {
              fetchCourses()
            }
            setIsEditMode(true)
            setEditingLecturer(id)
            setIsAddDialogOpen(true)
          }
        } catch (error) {
          console.error("Error fetching lecturer data:", error)
          alert("Failed to load lecturer data for editing")
        } finally {
          setIsLoading(false)
        }
      }
      fetchLecturerData()
    }
  }, [id, courses.length])

  // Automatically open dialog when in edit mode
  useEffect(() => {
    if (id) {
      setIsAddDialogOpen(true)
      setIsEditMode(true)
      setEditingLecturer(id)
    }
  }, [id])

  // Filter lecturers based on search and status
  const filteredLecturers = lecturers.filter((lecturer) => {
    const matchesSearch =
      lecturer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturer.email?.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "All") return matchesSearch

    const hasStatusMatch = lecturer.status === statusFilter
    return matchesSearch && hasStatusMatch
  })

  // Optimize handleChange to reduce re-renders
  const handleChange = useCallback(
    (e) => {
      const { name, value, files } = e.target

      if (files && files.length > 0) {
        const file = files[0]
        if (file.size > MAX_FILE_SIZE) {
          setErrors((prev) => ({ ...prev, [name]: "File is too large. Max allowed is 10MB." }))
          return
        }
        setForm((prev) => ({ ...prev, [name]: file }))
      } else {
        setForm((prev) => ({ ...prev, [name]: value }))
      }
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [errors],
  )

  const handleSelectChange = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      }
      return prev
    })
  }, [])

  const handleExperienceChange = useCallback((idx, field, value) => {
    setForm((prev) => {
      const exp = [...prev.experience]
      exp[idx][field] = value
      return { ...prev, experience: exp }
    })
    const errorKey = `exp_${field}_${idx}`
    setErrors((prev) => {
      if (prev[errorKey]) {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      }
      return prev
    })
  }, [])

  const addExperienceRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { institution: "", years: "", start: "", end: "", designation: "", nature: "" }],
    }))
  }, [])

  const removeExperienceRow = useCallback((idx) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }))
  }, [])

  // Validation logic
  const validateStep = () => {
    const newErrors = {}

    if (step === 0) {
      if (!form.fullName.trim()) newErrors.fullName = "Full name is required"
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Valid email is required"
      if (!form.nicNumber.trim()) newErrors.nicNumber = "NIC number is required"
      if (!form.dob) newErrors.dob = "Date of birth is required"
      if (!form.address.trim()) newErrors.address = "Address is required"
      if (!form.phone.trim() || !/^\d{10,}$/.test(form.phone)) newErrors.phone = "Valid phone number is required"
      if (!form.cdcNumber.trim()) newErrors.cdcNumber = "CDC number is required"
      if (!form.category.trim()) newErrors.category = "Category is required"
      if (!form.status) newErrors.status = "Status is required"
      if (!form.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle license number is required"
    }

    if (step === 1) {
      if (!form.bankName.trim()) newErrors.bankName = "Bank name is required"
      if (!form.branchName.trim()) newErrors.branchName = "Branch name is required"
      if (!form.accountNumber.trim()) newErrors.accountNumber = "Account number is required"
    }

    if (step === 2) {
      form.experience.forEach((exp, idx) => {
        if (!exp.institution.trim()) newErrors[`exp_institution_${idx}`] = "Institution is required"
        if (!exp.years.trim()) newErrors[`exp_years_${idx}`] = "Years is required"
        if (!exp.start.trim()) newErrors[`exp_start_${idx}`] = "Start date is required"
        if (!exp.end.trim()) newErrors[`exp_end_${idx}`] = "End date is required"
        if (!exp.designation.trim()) newErrors[`exp_designation_${idx}`] = "Designation is required"
        if (!exp.nature.trim()) newErrors[`exp_nature_${idx}`] = "Nature of work is required"
      })
      if (!form.highestQualification.trim()) newErrors.highestQualification = "Highest qualification is required"
      if (!form.otherQualifications.trim()) newErrors.otherQualifications = "Other qualifications are required"
    }

    if (step === 3) {
      if (!form.course_ids || form.course_ids.length === 0) newErrors.course_ids = "At least one course is required"
      if (!form.stream.trim()) newErrors.stream = "Stream is required"
      if (!form.module.trim()) newErrors.module = "Module is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const next = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const back = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  // Handle view lecturer details
  const handleViewLecturer = (lecturerId) => {
    navigate(`/lecturer/${lecturerId}`)
  }

  // Handle edit lecturer
  const handleEditLecturer = (lecturerId) => {
    // Update URL to include the ID
    if (typeof window !== "undefined") {
      const url = new URL(window.location)
      url.searchParams.set("id", lecturerId)
      window.history.pushState({}, "", url)
    }

    const lecturer = lecturers.find((l) => l.id === lecturerId)
    if (lecturer) {
      // Populate form with lecturer data
      setForm({
        fullName: lecturer.full_name || "",
        email: lecturer.email || "",
        nicNumber: lecturer.id_number || "",
        dob: lecturer.date_of_birth ? lecturer.date_of_birth.split("T")[0] : "",
        address: lecturer.address || "",
        phone: lecturer.phone || "",
        cdcNumber: lecturer.cdc_number || "",
        category: lecturer.category || "",
        vehicleNumber: lecturer.vehicle_number || "",
        status: lecturer.status || "Active",
        bankName: lecturer.bank_details?.bank_name || "",
        branchName: lecturer.bank_details?.branch_name || "",
        accountNumber: lecturer.bank_details?.account_number || "",
        experience: lecturer.experience || [
          { institution: "", years: "", start: "", end: "", designation: "", nature: "" },
        ],
        highestQualification: lecturer.academic_details?.highest_qualification || "",
        otherQualifications: lecturer.academic_details?.other_qualifications || "",
        course_ids: lecturer.course_ids || [],
        stream: lecturer.stream || "",
        module: lecturer.module || "",
        nic_file: null,
        photo_file: null,
        passbook_file: null,
        education_certificate_file: null,
        cdc_book_file: null,
        driving_trainer_license_file: null,
        other_documents_file: null,
      })
      setIsEditMode(true)
      setEditingLecturer(lecturerId)
      setIsAddDialogOpen(true)
      setViewMode("list")
      setSelectedLecturer(null)
    }
  }

  // Handle delete lecturer
  const handleDeleteLecturer = async (lecturerId) => {
    if (window.confirm("Are you sure you want to delete this lecturer?")) {
      try {
        await authRequest("delete", `http://localhost:5003/api/lecturer-registration/${lecturerId}`)
        setLecturers((prev) => prev.filter((l) => l.id !== lecturerId))
        setViewMode("list")
        setSelectedLecturer(null)
        alert("Lecturer deleted successfully!")
      } catch (error) {
        console.error("Error deleting lecturer:", error)
        alert("Failed to delete lecturer")
      }
    }
  }

  // Submit logic with FormData
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return

    setIsSubmitting(true)
    const data = new FormData()

    // Prepare academic details as a structured object
    const academicDetails = {
      highest_qualification: form.highestQualification,
      other_qualifications: form.otherQualifications,
    }

    // Append form fields to FormData
    Object.entries(form).forEach(([k, v]) => {
      if (k === "experience") {
        data.append(k, JSON.stringify(v))
      } else if (k === "dob") {
        data.append("date_of_birth", v)
      } else if (k === "course_ids" && v && v.length > 0) {
        data.append("course_ids", JSON.stringify(v))
      } else if (k === "highestQualification") {
        data.append("highestQualification", v)
      } else if (k === "otherQualifications") {
        data.append("otherQualifications", v)
      } else if (v instanceof File) {
        data.append(k, v)
      } else if (v !== null && v !== undefined) {
        data.append(k, v)
      }
    })

    // Append academic details as a JSON string
    data.append("academic_details", JSON.stringify(academicDetails))

    // Map form field names to API field names
    data.append("full_name", form.fullName)
    data.append("id_number", form.nicNumber)

    if (!data.has("date_of_birth") && form.dob) {
      data.append("date_of_birth", form.dob)
    }

    // Prepare bank details as a structured object
    const bankDetails = {
      bank_name: form.bankName,
      branch_name: form.branchName,
      account_number: form.accountNumber,
    }

    data.append("bank_details", JSON.stringify(bankDetails))

    if (!data.has("address")) {
      data.append("address", form.address || "")
    }

    // Get user_id from localStorage
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
    let user_id = null
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr)
        user_id = userObj.id
      } catch {}
    }
    if (user_id) {
      data.append("user_id", user_id)
    }

    // Course validation
    if (!form.course_ids || form.course_ids.length === 0) {
      alert("Please select at least one course.")
      setIsSubmitting(false)
      return
    }

    try {
      const url = isEditMode
        ? `http://localhost:5003/api/lecturer-registration/${editingLecturer}`
        : "http://localhost:5003/api/lecturer-registration/"

      const method = isEditMode ? "put" : "post"

      const response = await authRequest(method, url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      alert(isEditMode ? "Lecturer updated successfully!" : "Lecturer registered successfully!")

      if (isEditMode) {
        // Clear URL params
        if (typeof window !== "undefined") {
          const url = new URL(window.location)
          url.searchParams.delete("id")
          window.history.pushState({}, "", url)
        }
      }

      resetForm()
      setIsAddDialogOpen(false)
      fetchLecturers()
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Unknown error"
      setErrors((prev) => ({ ...prev, global: msg }))
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case true:
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Completed":
        return "bg-blue-100 text-blue-800"
      case "Inactive":
      case false:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle dialog close to reset form and redirect if needed
  const handleDialogOpenChange = (open) => {
    setIsAddDialogOpen(open)

    if (!open && isEditMode) {
      // Clear URL params
      if (typeof window !== "undefined") {
        const url = new URL(window.location)
        url.searchParams.delete("id")
        window.history.pushState({}, "", url)
      }
      setIsEditMode(false)
      setEditingLecturer(null)
      resetForm()
    }
  }

  const resetForm = () => {
    setForm({
      fullName: "",
      email: "",
      nicNumber: "",
      dob: "",
      address: "",
      phone: "",
      cdcNumber: "",
      category: "",
      vehicleNumber: "",
      status: "Active",
      bankName: "",
      branchName: "",
      accountNumber: "",
      experience: [{ institution: "", years: "", start: "", end: "", designation: "", nature: "" }],
      highestQualification: "",
      otherQualifications: "",
      course_ids: [],
      stream: "",
      module: "",
      nic_file: null,
      photo_file: null,
      passbook_file: null,
      education_certificate_file: null,
      cdc_book_file: null,
      driving_trainer_license_file: null,
      other_documents_file: null,
    })
    setStep(0)
    setErrors({})
  }

  // Show detail view if a lecturer is selected
  if (viewMode === "detail" && selectedLecturer) {
    return (
      <LecturerDetailView
        lecturer={selectedLecturer}
        onBack={() => {
          setViewMode("list")
          setSelectedLecturer(null)
        }}
        onEdit={handleEditLecturer}
        onDelete={handleDeleteLecturer}
        authRequest={authRequest}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #2D3C5E, #1e3a8a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Lecturer Management
            </h1>
            <p className="text-gray-600">Manage lecturer registrations and information</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lecturer
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto mt-7">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Lecturer Registration" : "Add New Lecturer"}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the lecturer details below."
                    : "Fill in the lecturer details to add them to the system."}
                </DialogDescription>
              </DialogHeader>
              <RegistrationForm
                step={step}
                setStep={setStep}
                form={form}
                errors={errors}
                isEditMode={isEditMode}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                id={editingLecturer}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                handleExperienceChange={handleExperienceChange}
                addExperienceRow={addExperienceRow}
                removeExperienceRow={removeExperienceRow}
                courses={courses}
                back={back}
                next={next}
                handleSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lecturers</p>
                  <p className="text-2xl font-bold">{lecturers.length}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{lecturers.filter((l) => l.status === "Active").length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{lecturers.filter((l) => l.status === "Pending").length}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold">{lecturers.filter((l) => l.status === "Inactive").length}</p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lecturers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Lecturers</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search lecturers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loadingLecturers ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-500">Loading lecturers...</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[700px] md:min-w-[900px] lg:min-w-[1100px] xl:min-w-[1200px] table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center py-3 px-4 font-medium">Lecturer</th>
                      <th className="text-left py-3 px-4 font-medium">Contact</th>
                      <th className="text-left py-3 px-4 font-medium">Course</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-center py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLecturers.length > 0 ? (
                      filteredLecturers.map((lecturer) => (
                        <tr key={lecturer.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-center align-middle">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                                <AvatarFallback>
                                  {lecturer.full_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{lecturer.full_name}</p>
                                <p className="text-sm text-gray-500">ID: #{lecturer.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <p>{lecturer.email}</p>
                              <p className="text-gray-500">{lecturer.phone || "N/A"}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <p>{lecturer.courses}</p>
                              <p className="text-gray-500">{lecturer.module}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(lecturer.status)}>{lecturer.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-center align-middle">
                            <div className="flex gap-6 justify-center items-center">
                              <Button variant="ghost" size="icon" onClick={() => handleViewLecturer(lecturer.id)}>
                                <Eye className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditLecturer(lecturer.id)}>
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteLecturer(lecturer.id)}>
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <Users className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No lecturers found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
