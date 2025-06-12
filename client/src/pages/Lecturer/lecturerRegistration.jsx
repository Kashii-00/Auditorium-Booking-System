"use client"

import { useState, useEffect, useRef, useCallback, memo, useLayoutEffect } from "react"
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
  Settings,
  Sparkles,
  Star,
  UserCheck,
  GraduationCap,
} from "lucide-react"
import { authRequest } from "../../services/authService"
import { useNavigate } from "react-router-dom"
import LoadingScreen from "../LoadingScreen/LoadingScreen"
import LecturerView from "./LecturerView"

// Performance CSS with hardware acceleration
const PERFORMANCE_CSS = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  
  .lecturer-card {
    will-change: transform, opacity;
    transform: translateZ(0);
  }
  
  .lecturer-card:hover {
    transform: translateY(-4px) translateZ(0);
  }
  
  .fade-in-stagger > * {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
  }
  
  .fade-in-stagger > *:nth-child(1) { animation-delay: 0.1s; }
  .fade-in-stagger > *:nth-child(2) { animation-delay: 0.2s; }
  .fade-in-stagger > *:nth-child(3) { animation-delay: 0.3s; }
  .fade-in-stagger > *:nth-child(4) { animation-delay: 0.4s; }
  
  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #1e40af, #3b82f6, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`

const MAX_FILE_SIZE = 10 * 1024 * 1024

const steps = [
  { id: 0, title: "Personal Details", icon: User, description: "Basic information" },
  { id: 1, title: "Bank Details", icon: CreditCard, description: "Payment information" },
  { id: 2, title: "Academic Details", icon: Award, description: "Education & experience" },
  { id: 3, title: "Course & Documents", icon: FileText, description: "Course assignment & files" },
]

// Enhanced Stat Card Component
const StatCard = memo(({ title, value, subtext, icon: Icon, color = "blue", progress = 0 }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-700 border-blue-300 shadow-blue-200/50",
    green:
      "bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-200/50",
    yellow:
      "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 text-amber-700 border-amber-300 shadow-amber-200/50",
    purple:
      "bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100 text-purple-700 border-purple-300 shadow-purple-200/50",
  }

  return (
    <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/95 backdrop-blur-xl transform hover:-translate-y-1 lecturer-card">
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
            className={`p-4 rounded-2xl shadow-xl border-2 ${colorClasses[color]} flex-shrink-0 transition-all duration-300 hover:scale-110`}
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

// Enhanced File Upload Component
const FileUpload = memo(({ name, label, required = false, form, errors, handleChange }) => (
  <div className="space-y-3">
    <Label htmlFor={name} className="text-sm font-black text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-3">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <div>
          <Label
            htmlFor={name}
            className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
          >
            Click to upload or drag and drop
          </Label>
          <p className="text-xs text-slate-500 mt-1 font-medium">PDF, JPG, PNG up to 10MB</p>
          <Input id={name} name={name} type="file" className="hidden" onChange={handleChange} />
        </div>
      </div>
      {form[name] && (
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">File selected: {form[name]?.name}</p>
          </div>
        </div>
      )}
    </div>
    {errors[name] && (
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200 shadow-lg">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm font-semibold text-red-700">{errors[name]}</p>
      </div>
    )}
  </div>
))

FileUpload.displayName = "FileUpload"

// Enhanced Focus-preserving input component
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
      {Icon && <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />}
      <Input
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        className={`${Icon ? "pl-12" : ""} h-12 border-2 ${
          error
            ? "border-red-300 focus:border-red-500 bg-red-50/50"
            : "border-slate-200 focus:border-blue-500 bg-white/90"
        } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
        {...props}
      />
    </div>
  )
}

// Enhanced Registration Form Component
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
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-black text-slate-700 mb-2 block">
                    Full Name *
                  </Label>
                  <FocusInput
                    id="fullName"
                    name="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    icon={User}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-black text-slate-700 mb-2 block">
                    Email *
                  </Label>
                  <FocusInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="nicNumber" className="text-sm font-black text-slate-700 mb-2 block">
                    NIC Number *
                  </Label>
                  <FocusInput
                    id="nicNumber"
                    name="nicNumber"
                    placeholder="Enter NIC number"
                    value={form.nicNumber}
                    onChange={handleChange}
                    error={errors.nicNumber}
                  />
                  {errors.nicNumber && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.nicNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="dob" className="text-sm font-black text-slate-700 mb-2 block">
                    Date of Birth *
                  </Label>
                  <FocusInput
                    id="dob"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    error={errors.dob}
                  />
                  {errors.dob && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.dob}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-sm font-black text-slate-700 mb-2 block">
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter complete address"
                    value={form.address}
                    onChange={handleChange}
                    className={`h-24 border-2 ${
                      errors.address
                        ? "border-red-300 focus:border-red-500 bg-red-50/50"
                        : "border-slate-200 focus:border-blue-500 bg-white/90"
                    } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
                    rows={3}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-black text-slate-700 mb-2 block">
                    Phone Number *
                  </Label>
                  <FocusInput
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="cdcNumber" className="text-sm font-black text-slate-700 mb-2 block">
                    CDC Number
                  </Label>
                  <FocusInput
                    id="cdcNumber"
                    name="cdcNumber"
                    placeholder="Enter CDC number"
                    value={form.cdcNumber}
                    onChange={handleChange}
                    error={errors.cdcNumber}
                  />
                  {errors.cdcNumber && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.cdcNumber}</p>}
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-black text-slate-700 mb-2 block">
                    Lecturer Category *
                  </Label>
                  <Select
                    value={form.category || undefined}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger
                      className={`h-12 border-2 ${
                        errors.category
                          ? "border-red-300 focus:border-red-500 bg-red-50/50"
                          : "border-slate-200 focus:border-blue-500 bg-white/90"
                      } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Category A</SelectItem>
                      <SelectItem value="B">Category B</SelectItem>
                      <SelectItem value="C">Category C</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-black text-slate-700 mb-2 block">
                    Lecturer Status *
                  </Label>
                  <Select
                    value={form.status || "Active"}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger
                      className={`h-12 border-2 ${
                        errors.status
                          ? "border-red-300 focus:border-red-500 bg-red-50/50"
                          : "border-slate-200 focus:border-blue-500 bg-white/90"
                      } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.status}</p>}
                </div>

                <div>
                  <Label htmlFor="vehicleNumber" className="text-sm font-black text-slate-700 mb-2 block">
                    Vehicle License Number
                  </Label>
                  <FocusInput
                    id="vehicleNumber"
                    name="vehicleNumber"
                    placeholder="Enter vehicle number"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    error={errors.vehicleNumber}
                  />
                  {errors.vehicleNumber && (
                    <p className="text-red-500 text-sm mt-2 font-semibold">{errors.vehicleNumber}</p>
                  )}
                </div>
              </div>
            </div>
          )

        case 1:
          return (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="bankName" className="text-sm font-black text-slate-700 mb-2 block">
                    Bank Name *
                  </Label>
                  <Select
                    value={form.bankName || undefined}
                    onValueChange={(value) => handleSelectChange("bankName", value)}
                  >
                    <SelectTrigger
                      className={`h-12 border-2 ${
                        errors.bankName
                          ? "border-red-300 focus:border-red-500 bg-red-50/50"
                          : "border-slate-200 focus:border-blue-500 bg-white/90"
                      } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
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
                  {errors.bankName && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.bankName}</p>}
                </div>

                <div>
                  <Label htmlFor="branchName" className="text-sm font-black text-slate-700 mb-2 block">
                    Branch Name *
                  </Label>
                  <FocusInput
                    id="branchName"
                    name="branchName"
                    placeholder="Enter branch name"
                    value={form.branchName}
                    onChange={handleChange}
                    error={errors.branchName}
                    icon={CreditCard}
                  />
                  {errors.branchName && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.branchName}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="accountNumber" className="text-sm font-black text-slate-700 mb-2 block">
                    Account Number *
                  </Label>
                  <FocusInput
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={form.accountNumber}
                    onChange={handleChange}
                    error={errors.accountNumber}
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-sm mt-2 font-semibold">{errors.accountNumber}</p>
                  )}
                </div>
              </div>
            </div>
          )

        case 2:
          return (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-lg">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <Label className="text-xl font-black text-slate-800">Working Experience</Label>
                  </div>
                  <Button
                    type="button"
                    onClick={addExperienceRow}
                    variant="outline"
                    className="h-10 px-4 rounded-xl font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>

                {form.experience.map((exp, idx) => (
                  <Card key={idx} className="p-6 mb-6 border-0 shadow-xl bg-white/95 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-slate-800">Experience {idx + 1}</h4>
                      {form.experience.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeExperienceRow(idx)}
                          className="h-8 px-3 rounded-xl font-bold border-2 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">Institution *</Label>
                        <FocusInput
                          placeholder="Institution name"
                          value={exp.institution}
                          onChange={(e) => handleExperienceChange(idx, "institution", e.target.value)}
                          error={errors[`exp_institution_${idx}`]}
                        />
                        {errors[`exp_institution_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_institution_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">Years of Experience *</Label>
                        <FocusInput
                          placeholder="Years"
                          value={exp.years}
                          onChange={(e) => handleExperienceChange(idx, "years", e.target.value)}
                          error={errors[`exp_years_${idx}`]}
                        />
                        {errors[`exp_years_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_years_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">Start Date *</Label>
                        <FocusInput
                          placeholder="Start date"
                          value={exp.start}
                          onChange={(e) => handleExperienceChange(idx, "start", e.target.value)}
                          error={errors[`exp_start_${idx}`]}
                        />
                        {errors[`exp_start_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_start_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">End Date *</Label>
                        <FocusInput
                          placeholder="End date"
                          value={exp.end}
                          onChange={(e) => handleExperienceChange(idx, "end", e.target.value)}
                          error={errors[`exp_end_${idx}`]}
                        />
                        {errors[`exp_end_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_end_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">Designation *</Label>
                        <FocusInput
                          placeholder="Job title"
                          value={exp.designation}
                          onChange={(e) => handleExperienceChange(idx, "designation", e.target.value)}
                          error={errors[`exp_designation_${idx}`]}
                        />
                        {errors[`exp_designation_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_designation_${idx}`]}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-black text-slate-700 mb-2 block">Nature of Work *</Label>
                        <FocusInput
                          placeholder="Work description"
                          value={exp.nature}
                          onChange={(e) => handleExperienceChange(idx, "nature", e.target.value)}
                          error={errors[`exp_nature_${idx}`]}
                        />
                        {errors[`exp_nature_${idx}`] && (
                          <p className="text-red-500 text-sm mt-2 font-semibold">{errors[`exp_nature_${idx}`]}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="border-slate-200" />

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-lg">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">Educational Qualifications</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="highestQualification" className="text-sm font-black text-slate-700 mb-2 block">
                      Highest Qualification *
                    </Label>
                    <FocusInput
                      id="highestQualification"
                      name="highestQualification"
                      placeholder="Enter your highest qualification"
                      value={form.highestQualification}
                      onChange={handleChange}
                      error={errors.highestQualification}
                    />
                    {errors.highestQualification && (
                      <p className="text-red-500 text-sm mt-2 font-semibold">{errors.highestQualification}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="otherQualifications" className="text-sm font-black text-slate-700 mb-2 block">
                      Other Qualifications *
                    </Label>
                    <Textarea
                      id="otherQualifications"
                      name="otherQualifications"
                      placeholder="Enter other qualifications"
                      value={form.otherQualifications}
                      onChange={handleChange}
                      className={`h-24 border-2 ${
                        errors.otherQualifications
                          ? "border-red-300 focus:border-red-500 bg-red-50/50"
                          : "border-slate-200 focus:border-blue-500 bg-white/90"
                      } rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 font-medium`}
                      rows={3}
                    />
                    {errors.otherQualifications && (
                      <p className="text-red-500 text-sm mt-2 font-semibold">{errors.otherQualifications}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )

        case 3:
          return (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="course_ids" className="text-sm font-black text-slate-700 mb-2 block">
                    Courses *
                  </Label>
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
                    className="w-full p-4 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 min-h-[120px] bg-white/90 backdrop-blur-sm shadow-lg font-medium"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="p-2">
                        {course.courseName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Hold Ctrl/Cmd to select multiple courses</p>
                  {errors.course_ids && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.course_ids}</p>}
                </div>

                <div>
                  <Label htmlFor="stream" className="text-sm font-black text-slate-700 mb-2 block">
                    Stream *
                  </Label>
                  <FocusInput
                    id="stream"
                    name="stream"
                    placeholder="Enter stream"
                    value={form.stream}
                    onChange={handleChange}
                    error={errors.stream}
                  />
                  {errors.stream && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.stream}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="module" className="text-sm font-black text-slate-700 mb-2 block">
                    Module *
                  </Label>
                  <FocusInput
                    id="module"
                    name="module"
                    placeholder="Enter module"
                    value={form.module}
                    onChange={handleChange}
                    error={errors.module}
                  />
                  {errors.module && <p className="text-red-500 text-sm mt-2 font-semibold">{errors.module}</p>}
                </div>
              </div>

              <Separator className="border-slate-200" />

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">Document Upload (Optional)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <div className="space-y-8">
        {/* Enhanced Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black text-slate-700">
              Step {step + 1} of {steps.length}: {steps[step].title}
            </span>
            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-slate-200 rounded-full" />
          <p className="text-sm text-slate-600 mt-2 font-medium">{steps[step].description}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isLoading && step === 0 && id && <LoadingScreen message="Loading lecturer data..." />}

          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t-2 border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || isSubmitting}
              className="h-12 px-6 rounded-xl font-bold border-2 hover:bg-slate-50 shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                disabled={isSubmitting}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xl font-bold transform hover:scale-105 transition-all duration-300"
              >
                Next Step
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl shadow-xl font-bold transform hover:scale-105 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    <Sparkles className="h-4 w-4 mr-2" />
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

// Main component with enhanced design
export default function LecturerManagementFull() {
  const [lecturers, setLecturers] = useState([])
  const [courses, setCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(isAddDialogOpen)
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

  // Add performance CSS to document head
  useLayoutEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = PERFORMANCE_CSS
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

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
      const response = await authRequest("get", "http://10.70.4.34:5003/api/lecturer-registration")
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
      const response = await authRequest("get", "http://10.70.4.34:5003/api/lecturer-registration/courses")
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
          const lecturerData = await authRequest("get", `http://10.70.4.34:5003/api/lecturer-registration/${id}`)

          if (lecturerData) {
            // Parse experience from academic_details if present
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
  const handleEditLecturer = useCallback(
    (lecturerId) => {
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
    },
    [lecturers],
  )

  // Handle delete lecturer
  const handleDeleteLecturer = useCallback(
    async (lecturerId) => {
      if (window.confirm("Are you sure you want to delete this lecturer?")) {
        try {
          await authRequest("delete", `http://10.70.4.34:5003/api/lecturer-registration/${lecturerId}`)
          setLecturers((prev) => prev.filter((l) => l.id !== lecturerId))
          setViewMode("list")
          setSelectedLecturer(null)
          alert("Lecturer deleted successfully!")
        } catch (error) {
          console.error("Error deleting lecturer:", error)
          alert("Failed to delete lecturer")
        }
      }
    },
    [authRequest],
  )

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
        ? `http://10.70.4.34:5003/api/lecturer-registration/${editingLecturer}`
        : "http://10.70.4.34:5003/api/lecturer-registration/"

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
        return "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-300"
      case "Pending":
        return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-2 border-amber-300"
      case "Completed":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-2 border-blue-300"
      case "Inactive":
      case false:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-2 border-slate-300"
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-2 border-slate-300"
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
    return <LecturerView />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
      </div>

      <div className="relative z-10 w-full h-full p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 w-full">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                <Users className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Lecturer Management
              </h1>
              <p className="text-slate-600 font-semibold text-lg mt-2">Manage lecturer registrations and information</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <button className="h-14 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 rounded-2xl shadow-xl font-bold transition-all duration-300 transform hover:scale-105 text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <Sparkles className="h-4 w-4" />
                Add Lecturer
              </button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-5xl max-h-[70vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-xl mt-10">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                  {isEditMode ? "Edit Lecturer Registration" : "Add New Lecturer"}
                </DialogTitle>
                <DialogDescription className="text-slate-600 font-semibold">
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

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 fade-in-stagger w-full">
          <StatCard
            title="Total Lecturers"
            value={lecturers.length}
            subtext="All registered lecturers"
            icon={Users}
            color="blue"
            progress={lecturers.length > 0 ? 85 : 0}
          />
          <StatCard
            title="Active Lecturers"
            value={lecturers.filter((l) => l.status === "Active").length}
            subtext="Currently teaching"
            icon={UserCheck}
            color="green"
            progress={
              lecturers.length > 0
                ? (lecturers.filter((l) => l.status === "Active").length / lecturers.length) * 100
                : 0
            }
          />
          <StatCard
            title="Pending Approval"
            value={lecturers.filter((l) => l.status === "Pending").length}
            subtext="Awaiting verification"
            icon={Star}
            color="yellow"
            progress={
              lecturers.length > 0
                ? (lecturers.filter((l) => l.status === "Pending").length / lecturers.length) * 100
                : 0
            }
          />
          <StatCard
            title="Total Courses"
            value={courses.length}
            subtext="Available courses"
            icon={GraduationCap}
            color="purple"
            progress={courses.length > 0 ? 70 : 0}
          />
        </div>

        {/* Enhanced Lecturers Table */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl w-full">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                    All Lecturers
                  </CardTitle>
                  <p className="text-slate-600 font-semibold">Manage and view all lecturer information</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-xl font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-lg"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search lecturers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg font-medium"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-12 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg font-medium">
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

            {/* Enhanced Table */}
            {loadingLecturers ? (
              <LoadingScreen message="Loading lecturers..." />
            ) : (
              <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl bg-white/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800">
                      <tr>
                        <th className="text-white font-bold py-4 px-6 text-left">Lecturer</th>
                        <th className="text-white font-bold py-4 px-6 text-left">Contact</th>
                        <th className="text-white font-bold py-4 px-6 text-left">Course</th>
                        <th className="text-white font-bold py-4 px-6 text-left">Status</th>
                        <th className="text-white font-bold py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLecturers.length > 0 ? (
                        filteredLecturers.map((lecturer, index) => (
                          <tr
                            key={lecturer.id}
                            className={`${
                              index % 2 === 0 ? "bg-white/80" : "bg-slate-50/80"
                            } hover:bg-blue-50/80 transition-all duration-200 backdrop-blur-sm lecturer-card`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <Avatar className="h-12 w-12 mr-4 shadow-lg border-2 border-white">
                                  <AvatarImage src="/placeholder.svg?height=48&width=48" />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                                    {lecturer.full_name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 text-lg">{lecturer.full_name}</p>
                                  <p className="text-sm text-slate-600 font-medium">ID: #{lecturer.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm">
                                <p className="font-semibold text-slate-900">{lecturer.email}</p>
                                <p className="text-slate-600 font-medium">{lecturer.phone || "N/A"}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm">
                                <p className="font-semibold text-slate-900">{lecturer.courses}</p>
                                <p className="text-slate-600 font-medium">{lecturer.module}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={`${getStatusColor(lecturer.status)} px-3 py-1 rounded-full font-bold`}>
                                {lecturer.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log("View button clicked for lecturer:", lecturer.id)
                                    navigate(`/lecturer/${lecturer.id}`)
                                  }}
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-blue-100 text-blue-600 transition-all duration-200"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLecturer(lecturer.id)}
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-emerald-100 text-emerald-600 transition-all duration-200"
                                  title="Edit Lecturer"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLecturer(lecturer.id)}
                                  className="h-8 w-8 p-0 rounded-xl hover:bg-red-100 text-red-600 transition-all duration-200"
                                  title="Delete Lecturer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-16">
                            <div className="flex flex-col items-center">
                              <div className="p-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl shadow-xl mb-6">
                                <Users className="h-16 w-16 text-slate-400" />
                              </div>
                              <p className="text-slate-500 text-xl font-bold mb-2">No lecturers found</p>
                              <p className="text-slate-400 font-medium">Try adjusting your search criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
