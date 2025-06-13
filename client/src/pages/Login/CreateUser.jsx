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
} from "react-icons/fa"
import { authRequest } from "../../services/authService"
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

  // Available access levels
  const accessLevelOptions = [
    { id: "calendar_access", label: "Auditorium Calendar Access", description: "View and manage auditorium calendar" },
    { id: "bookings_access", label: "Auditorium Bookings Access", description: "Manage auditorium bookings" },
    { id: "bus_access", label: "Bus Calendar Access", description: "View and manage bus calendar" },
    { id: "busbookings_access", label: "Bus Bookings Access", description: "Manage bus bookings" },


    { id: "cb_Admin_access", label: "Classroom Admin Access", description: "Full access to manage classroom bookings and schedules" },
    { id: "cb_SU_access", label: "Classroom User Access", description: "View-only access to classroom bookings and schedules" },


    
    {
      id: "course_registration_access",
      label: "Course Registration Access",
      description: "Manage course registrations",
    },
    {
      id: "student_registration_access",
      label: "Student Registration Access",
      description: "Manage student registrations",
    },
    {
      id: "lecturer_management_access",
      label: "Lecturer Management Access",
      description: "Manage lecturer information",
    },
    { id: "batch_registration_access", label: "Batch Registration", description: "Manage batch registrations" },
    { id: "batch_students_access", label: "Batch Students Management", description: "Manage students in batches" },
    { id: "batch_lecturers_access", label: "Batch Lecturers Management", description: "Manage lecturers in batches" },
  ]

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
          authRequest("get", `http://localhost:5003/api/users/${id}`),
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

      const endpoint = id ? `http://localhost:5003/api/users/${id}` : "http://localhost:5003/api/users"

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
      style={{
        paddingLeft: sidebarCollapsed ? "100px" : "300px",
      }}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/users"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 mb-4"
          >
            <FaArrowLeft />
            Back to Users
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                {isEditMode ? "Edit User" : "Create New User"}
              </h1>
              <p className="text-slate-600 mt-2">
                {isEditMode ? "Update user information and access levels" : "Add a new user to the system"}
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
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
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                      validationErrors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                    } focus:ring-2`}
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
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Account Status
                </label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
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
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200 ${
                      validationErrors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                    } focus:ring-2`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPasswordChange}
                    onChange={(e) => setShowPasswordChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Change Password</span>
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
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200 ${
                          validationErrors.newPassword
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        } focus:ring-2`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {validationErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role & Permissions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <FaUserShield className="text-blue-600" />
              Role & Permissions
            </h2>

            {/* Base Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-4">Base Role</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label
                  className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    baseRole === "USER"
                      ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
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
                  <div className="flex items-center gap-3">
                    <FaUser className={`text-lg ${baseRole === "USER" ? "text-blue-600" : "text-slate-400"}`} />
                    <div>
                      <div className="font-semibold text-slate-800">User</div>
                      <div className="text-xs text-slate-600">Basic user access</div>
                    </div>
                  </div>
                  {baseRole === "USER" && <FaCheck className="absolute top-2 right-2 text-blue-600" />}
                </label>

                <label
                  className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    baseRole === "ADMIN"
                      ? "border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
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
                  <div className="flex items-center gap-3">
                    <FaUserShield
                      className={`text-lg ${baseRole === "ADMIN" ? "text-purple-600" : "text-slate-400"}`}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Admin</div>
                      <div className="text-xs text-slate-600">Administrative access</div>
                    </div>
                  </div>
                  {baseRole === "ADMIN" && <FaCheck className="absolute top-2 right-2 text-purple-600" />}
                </label>

                <label
                  className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    baseRole === "SuperAdmin"
                      ? "border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
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
                  <div className="flex items-center gap-3">
                    <FaCrown
                      className={`text-lg ${baseRole === "SuperAdmin" ? "text-yellow-600" : "text-slate-400"}`}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Super Admin</div>
                      <div className="text-xs text-slate-600">Full system access</div>
                    </div>
                  </div>
                  {baseRole === "SuperAdmin" && <FaCheck className="absolute top-2 right-2 text-yellow-600" />}
                </label>
              </div>
            </div>

            {/* Access Levels */}
            {baseRole !== "SuperAdmin" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Access Levels {baseRole !== "SuperAdmin" && "*"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accessLevelOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        accessLevels.includes(option.id)
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={accessLevels.includes(option.id)}
                        onChange={() => handleAccessLevelChange(option.id)}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{option.label}</div>
                        <div className="text-xs text-slate-600 mt-1">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {validationErrors.accessLevels && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.accessLevels}</p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/users")}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FaTimes />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
        </form>
      </div>
    </div>
  )
}

export default CreateUser
