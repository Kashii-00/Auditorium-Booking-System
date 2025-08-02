"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaIdCard,
  FaArrowLeft,
  FaUserShield,
  FaCrown,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaChevronDown,
  FaInfoCircle,
} from "react-icons/fa"
import { authRequest } from "../../services/authService"
import { getApiUrl } from '../../utils/apiUrl'
import LoadingScreen from "../LoadingScreen/LoadingScreen"

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "ACTIVE",
  })
  const [baseRole, setBaseRole] = useState("USER")
  const [accessLevels, setAccessLevels] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarState") === "true")

  // Available access levels - grouped by category
  const accessLevelOptions = [
    // Auditorium Management
    { id: "calendar_access", label: "Auditorium Calendar Access", description: "View and manage auditorium calendar", category: "Auditorium" },
    { id: "bookings_access", label: "Auditorium Bookings Access", description: "Manage auditorium bookings", category: "Auditorium" },
    
    // Transportation Management
    { id: "bus_access", label: "Bus Calendar Access", description: "View and manage bus calendar", category: "Transportation" },
    { id: "busbookings_access", label: "Bus Bookings Access", description: "Manage bus bookings", category: "Transportation" },

    // Classroom Management
    { id: "cb_Admin_access", label: "Classroom Admin Access", description: "Full access to manage classroom bookings and schedules", category: "Classroom" },
    { id: "cb_SU_access", label: "Classroom User Access", description: "View-only access to classroom bookings and schedules", category: "Classroom" },

    // Course Management - Unified Role
    {
      id: "course_allocation_manager",
      label: "Course Allocation Manager",
      description: "Complete access to all course allocation functions - courses, students, lecturers, and batches",
      category: "Course Management",
      highlight: true
    },
    

    // Finance Management
    {
      id: "finance_manager",
      label: "Finance Manager",
      description: "Full financial management access",
      category: "Finance"
    },
    {
      id: "SU_finance_access",
      label: "Finance User Access",
      description: "View-only financial access",
      category: "Finance"
    },

    // System Administration
    {
      id: "class_request_access",
      label: "Class Request Access",
      description: "Manage classroom booking requests",
      category: "Administration"
    },
    {
      id: "annual_plan_access",
      label: "Annual Plan Access",
      description: "Manage annual planning",
      category: "Administration"
    }
  ]

  // Group access levels by category
  const groupedAccessLevels = accessLevelOptions.reduce((groups, option) => {
    const category = option.category || "Other"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(option)
    return groups
  }, {})

  // Validation rules
  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!isEditMode && !formData.password.trim()) {
      errors.password = "Password is required"
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long"
    }

    if (showPasswordChange && !newPassword.trim()) {
      errors.newPassword = "New password is required"
    } else if (newPassword && newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters long"
    }

    if (baseRole !== "SuperAdmin" && accessLevels.length === 0) {
      errors.accessLevels = "Please select at least one access level"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, baseRole, accessLevels, isEditMode, showPasswordChange, newPassword])

  // Sidebar state management
  useEffect(() => {
    const syncSidebarState = () => {
      const stored = localStorage.getItem("sidebarState")
      if (stored !== null) {
        const isCollapsed = stored === "true"
        setSidebarCollapsed(isCollapsed)
        window.dispatchEvent(
          new CustomEvent("sidebarToggle", {
            detail: { isCollapsed },
          }),
        )
      }
    }

    syncSidebarState()
    window.addEventListener("popstate", syncSidebarState)

    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed)
      localStorage.setItem("sidebarState", e.detail.isCollapsed)
    }

    window.addEventListener("sidebarToggle", handleSidebarToggle)

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
      window.removeEventListener("popstate", syncSidebarState)
    }
  }, [])

  // Handle role change
  const handleBaseRoleChange = useCallback((newRole) => {
    setBaseRole(newRole)
    if (newRole === "SuperAdmin") {
      setAccessLevels([])
    }
    setValidationErrors((prev) => ({ ...prev, accessLevels: undefined }))
  }, [])

  // Handle access level change
  const handleAccessLevelChange = useCallback(
    (access) => {
      if (baseRole !== "SuperAdmin") {
        setAccessLevels((prev) => (prev.includes(access) ? prev.filter((a) => a !== access) : [...prev, access]))
        setValidationErrors((prev) => ({ ...prev, accessLevels: undefined }))
      }
    },
    [baseRole],
  )

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  // Fetch user data for edit mode
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return

      try {
        setIsLoading(true)
        // Add minimum loading time to show the loading screen
        const [userData] = await Promise.all([
          authRequest("get", getApiUrl(`/users/${id}`)),
          new Promise((resolve) => setTimeout(resolve, 1000)), // Minimum 1 second loading
        ])

        if (userData) {
          const { name, email, phone, role, status } = userData
          setFormData({
            name: name || "",
            email: email || "",
            phone: phone || "",
            password: "",
            status: status || "ACTIVE",
          })

          const parsedRoles = typeof role === "string" ? JSON.parse(role) : role
          const roles = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles]

          if (roles.includes("SuperAdmin")) {
            setBaseRole("SuperAdmin")
          } else if (roles.includes("ADMIN")) {
            setBaseRole("ADMIN")
          } else {
            setBaseRole("USER")
          }

          const accessPerms = roles.filter(
            (r) =>
              r.includes("_access") ||
              r === "course_allocation_manager" ||
              ["calendar_access", "bookings_access", "bus_access", "busbookings_access"].includes(r),
          )
          setAccessLevels(accessPerms)
        }
      } catch (err) {
        console.error("Error fetching user:", err)
        setMessage(`Error fetching user data: ${err.message}`)
        setMessageType("error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [id])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMessage("Please fix the errors below")
      setMessageType("error")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const roles = baseRole === "SuperAdmin" ? ["SuperAdmin"] : [baseRole, ...accessLevels]
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: roles,
        status: formData.status,
        ...((!id || showPasswordChange) && {
          password: id ? newPassword : formData.password,
        }),
      }

      const endpoint = id ? getApiUrl(`/users/${id}`) : getApiUrl("/users")

      const method = id ? "put" : "post"
      const response = await authRequest(method, endpoint, userData)

      if (response) {
        setMessage(id ? "User updated successfully!" : "User created successfully!")
        setMessageType("success")

        // Navigate after a brief delay
        setTimeout(() => {
          navigate("/users", {
            state: {
              sidebarState: sidebarCollapsed,
              highlightedUserId: response.id || id,
            },
            replace: true,
          })
        }, 1500)
      }
    } catch (err) {
      console.error("Error saving user:", err)
      setMessage(`Failed to save user: ${err.message}`)
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen message={isEditMode ? "Loading User Data" : "Preparing Form"} type="users" />
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-300"
      
    >
      <div className="p-4 lg:p-6 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link
            to="/users"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 mb-4 text-sm lg:text-base"
          >
            <FaArrowLeft />
            Back to Users
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                {isEditMode ? "Edit User" : "Create New User"}
              </h1>
              <p className="text-slate-600 mt-2 text-sm lg:text-base">
                {isEditMode ? "Update user information and access levels" : "Add a new user to the system"}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center gap-2 text-sm text-slate-500">
              <FaUser className="text-blue-500" />
              User Management
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              messageType === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {messageType === "success" ? <FaCheck /> : <FaExclamationTriangle />}
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
          {/* Two Column Layout for larger screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6 lg:space-y-8">
              {/* Basic Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/20 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="lg:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 lg:py-4 rounded-xl border transition-all duration-200 ${
                          validationErrors.name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        } focus:ring-2 text-lg`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 lg:py-4 rounded-xl border transition-all duration-200 ${
                          validationErrors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        } focus:ring-2`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="phone"
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 lg:py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                      Account Status
                    </label>
                    <div className="relative">
                      <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange("status", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 lg:py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none bg-white"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/20 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <FaLock className="text-blue-600" />
                  Password Settings
                </h2>

                {!isEditMode ? (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 lg:py-4 rounded-xl border transition-all duration-200 ${
                          validationErrors.password
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        } focus:ring-2`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
                    <div className="mt-3 text-xs text-slate-500">
                      Password must be at least 6 characters long
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={showPasswordChange}
                        onChange={(e) => setShowPasswordChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Change Password</span>
                    </label>

                    {showPasswordChange && (
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                          New Password *
                        </label>
                        <div className="relative">
                          <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                          <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`w-full pl-10 pr-12 py-3 lg:py-4 rounded-xl border transition-all duration-200 ${
                              validationErrors.newPassword
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                            } focus:ring-2`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        {validationErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                        )}
                        <div className="mt-3 text-xs text-slate-500">
                          Password must be at least 6 characters long
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:space-y-8">
              {/* Role & Permissions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/20 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <FaUserShield className="text-blue-600" />
                  Role & Permissions
                </h2>

                {/* Base Role Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-4">Base Role</label>
                  <div className="grid grid-cols-1 gap-4">
                    <label
                      className={`relative flex items-center p-4 lg:p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        baseRole === "USER"
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="radio"
                        name="baseRole"
                        value="USER"
                        checked={baseRole === "USER"}
                        onChange={() => handleBaseRoleChange("USER")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4 flex-1">
                        <FaUser className={`text-xl ${baseRole === "USER" ? "text-blue-600" : "text-slate-400"}`} />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-lg">User</div>
                          <div className="text-sm text-slate-600">Basic user access with limited permissions</div>
                        </div>
                      </div>
                      {baseRole === "USER" && <FaCheck className="absolute top-4 right-4 text-blue-600 text-lg" />}
                    </label>

                    <label
                      className={`relative flex items-center p-4 lg:p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        baseRole === "ADMIN"
                          ? "border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="radio"
                        name="baseRole"
                        value="ADMIN"
                        checked={baseRole === "ADMIN"}
                        onChange={() => handleBaseRoleChange("ADMIN")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4 flex-1">
                        <FaUserShield
                          className={`text-xl ${baseRole === "ADMIN" ? "text-purple-600" : "text-slate-400"}`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-lg">Admin</div>
                          <div className="text-sm text-slate-600">Administrative access with extended permissions</div>
                        </div>
                      </div>
                      {baseRole === "ADMIN" && <FaCheck className="absolute top-4 right-4 text-purple-600 text-lg" />}
                    </label>

                    <label
                      className={`relative flex items-center p-4 lg:p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        baseRole === "SuperAdmin"
                          ? "border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="radio"
                        name="baseRole"
                        value="SuperAdmin"
                        checked={baseRole === "SuperAdmin"}
                        onChange={() => handleBaseRoleChange("SuperAdmin")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4 flex-1">
                        <FaCrown
                          className={`text-xl ${baseRole === "SuperAdmin" ? "text-yellow-600" : "text-slate-400"}`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-lg">Super Admin</div>
                          <div className="text-sm text-slate-600">Full system access with all permissions</div>
                        </div>
                      </div>
                      {baseRole === "SuperAdmin" && <FaCheck className="absolute top-4 right-4 text-yellow-600 text-lg" />}
                    </label>
                  </div>
                </div>

                {/* Access Levels */}
                {baseRole !== "SuperAdmin" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Access Levels {baseRole !== "SuperAdmin" && "*"}
                      </label>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {accessLevels.length} selected
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                      {Object.entries(groupedAccessLevels).map(([category, options]) => (
                        <div key={category} className="space-y-2">
                          <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg flex items-center justify-between">
                            {category}
                            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
                              {options.filter(opt => accessLevels.includes(opt.id)).length}/{options.length}
                            </span>
                          </div>
                          <div className="space-y-2 ml-2">
                            {options.map((option) => (
                              <label
                                key={option.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                  option.highlight
                                    ? accessLevels.includes(option.id)
                                      ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm ring-1 ring-emerald-200"
                                      : "border-emerald-300 bg-gradient-to-r from-emerald-25 to-green-25 hover:border-emerald-400"
                                    : accessLevels.includes(option.id)
                                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={accessLevels.includes(option.id)}
                                  onChange={() => handleAccessLevelChange(option.id)}
                                  className={`mt-1 w-4 h-4 border-slate-300 rounded focus:ring-2 ${
                                    option.highlight 
                                      ? "text-emerald-600 focus:ring-emerald-500" 
                                      : "text-blue-600 focus:ring-blue-500"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className={`font-medium ${option.highlight ? "text-emerald-800" : "text-slate-800"}`}>
                                    {option.label}
                                    {option.highlight && (
                                      <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                                        RECOMMENDED
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{option.description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {validationErrors.accessLevels && (
                      <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        {validationErrors.accessLevels}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions - Full Width */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-lg border border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <FaInfoCircle className="text-blue-500" />
                All fields marked with * are required
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/users")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px]"
                >
                  <FaTimes />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {isEditMode ? "Update User" : "Create User"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUser
